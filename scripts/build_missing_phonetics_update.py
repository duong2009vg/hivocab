#!/usr/bin/env python3
"""Build a safe SQL update for words with missing phonetics.

Single words are looked up with Free Dictionary API. Idioms, collocations,
phrasal verbs, and other phrases are split into tokens and their IPA values
are joined. The optional eng_to_ipa package is used as an offline fallback.

The script never writes to Supabase. It generates:
  data/missing_phonetics_update.sql
  data/missing_phonetics_preview.csv
  data/missing_phonetics_suspect.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SQL = ROOT / "data" / "missing_phonetics_update.sql"
DEFAULT_PREVIEW = ROOT / "data" / "missing_phonetics_preview.csv"
DEFAULT_SUSPECT = ROOT / "data" / "missing_phonetics_suspect.csv"
DEFAULT_CACHE = ROOT / "data" / "phonetic_lookup_cache.json"
DICTIONARY_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/"

TOKEN_RE = re.compile(r"[A-Za-z]+(?:['’-][A-Za-z]+)*")
PLACEHOLDERS = {
    "sb": "somebody",
    "sb's": "somebody's",
    "sth": "something",
    "sth's": "something's",
    "sby": "somebody",
    "one's": "one's",
}
FIXED_FUNCTION_IPA = {
    "a": "ə",
    "an": "ən",
    "and": "ən",
    "as": "əz",
    "at": "ət",
    "for": "fə",
    "from": "frəm",
    "of": "əv",
    "or": "ɔː",
    "than": "ðən",
    "that": "ðət",
    "the": "ðə",
    "to": "tə",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch missing phonetics and generate a Supabase SQL update."
    )
    parser.add_argument("--limit", type=int, default=0, help="Maximum rows to process; 0 means all.")
    parser.add_argument("--topic", default="", help="Only process topics whose name contains this text.")
    parser.add_argument("--delay", type=float, default=0.08, help="Delay between Dictionary API calls.")
    parser.add_argument("--supabase-url", default="", help="Supabase project URL; defaults to index.html.")
    parser.add_argument("--anon-key", default="", help="Supabase anon key; defaults to index.html.")
    parser.add_argument(
        "--access-token",
        default="",
        help="Optional logged-in user access token for private topics.",
    )
    parser.add_argument("--sql", type=Path, default=DEFAULT_SQL)
    parser.add_argument("--preview", type=Path, default=DEFAULT_PREVIEW)
    parser.add_argument("--suspect", type=Path, default=DEFAULT_SUSPECT)
    parser.add_argument("--cache", type=Path, default=DEFAULT_CACHE)
    return parser.parse_args()


def extract_supabase_config() -> tuple[str, str]:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    match = re.search(r"HiDB\.init\(\s*'([^']+)'\s*,\s*'([^']+)'", html)
    if not match:
        raise RuntimeError("Could not find HiDB.init(...) credentials in index.html.")
    return match.group(1), match.group(2)


def request_json(url: str, headers: dict[str, str] | None = None) -> object:
    request_headers = {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 HiVocabPhoneticTool/1.0",
        **(headers or {}),
    }
    request = urllib.request.Request(url, headers=request_headers)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return None
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code} for {url}: {detail[:300]}") from exc


def fetch_missing_words(
    supabase_url: str,
    anon_key: str,
    access_token: str,
    topic_filter: str,
    limit: int,
) -> list[dict]:
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {access_token or anon_key}",
    }
    rows: list[dict] = []
    offset = 0
    page_size = 500

    while True:
        query = urllib.parse.urlencode(
            {
                "select": "id,word,phonetic,topics!inner(name)",
                "or": "(phonetic.is.null,phonetic.eq.)",
                "order": "created_at.asc",
                "offset": str(offset),
                "limit": str(
                    page_size
                    if topic_filter
                    else (min(page_size, limit - len(rows)) if limit else page_size)
                ),
            }
        )
        page = request_json(f"{supabase_url}/rest/v1/words?{query}", headers)
        if not isinstance(page, list):
            raise RuntimeError("Supabase returned an unexpected response.")

        for row in page:
            topic_name = (row.get("topics") or {}).get("name", "")
            if not topic_filter or topic_filter.casefold() in topic_name.casefold():
                rows.append(
                    {
                        "id": row.get("id", ""),
                        "word": row.get("word", ""),
                        "topic_name": topic_name,
                    }
                )
                if limit and len(rows) >= limit:
                    return rows

        if len(page) < page_size:
            return rows
        offset += page_size


def load_cache(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def save_cache(path: Path, cache: dict[str, dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(cache, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")


def strip_ipa(value: str) -> str:
    value = re.sub(r"\s+", " ", str(value or "")).strip()
    return value.strip("/[] ").strip()


def dictionary_ipa(token: str, cache: dict[str, dict], delay: float) -> str:
    key = token.casefold()
    cached = cache.get(key)
    if cached is not None:
        return cached.get("ipa", "")

    url = DICTIONARY_URL + urllib.parse.quote(token.casefold())
    try:
        data = request_json(url)
    except RuntimeError:
        data = None
    ipa = ""
    if isinstance(data, list) and data:
        entry = data[0] or {}
        candidates = [entry.get("phonetic", "")]
        candidates.extend(p.get("text", "") for p in entry.get("phonetics", []) if isinstance(p, dict))
        ipa = next((strip_ipa(item) for item in candidates if strip_ipa(item)), "")

    cache[key] = {"ipa": ipa, "source": "dictionary" if ipa else "not_found"}
    if delay > 0:
        time.sleep(delay)
    return ipa


def offline_ipa(token: str) -> str:
    try:
        import eng_to_ipa as ipa  # type: ignore
    except ImportError:
        return ""
    value = strip_ipa(ipa.convert(token))
    if not value or "*" in value or value.casefold() == token.casefold():
        return ""
    return value


def tokenize_phrase(phrase: str) -> list[str]:
    normalized = phrase.replace("’", "'")
    return TOKEN_RE.findall(normalized)


def build_phonetic(phrase: str, cache: dict[str, dict], delay: float) -> tuple[str, str, list[str]]:
    tokens = tokenize_phrase(phrase)
    if not tokens:
        return "", "no_tokens", []

    ipa_parts: list[str] = []
    unresolved: list[str] = []
    sources: set[str] = set()

    for original in tokens:
        lookup = PLACEHOLDERS.get(original.casefold(), original)
        value = FIXED_FUNCTION_IPA.get(lookup.casefold(), "")
        source = "fixed_function"
        if not value:
            value = dictionary_ipa(lookup, cache, delay)
            source = "dictionary"
        if not value:
            value = offline_ipa(lookup)
            source = "eng_to_ipa"
        if not value:
            unresolved.append(original)
            continue
        ipa_parts.append(value)
        sources.add(source)

    if unresolved:
        return "", "unresolved_tokens", unresolved

    source_label = "+".join(sorted(sources))
    return f"/{' '.join(ipa_parts)}/", source_label, []


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def write_outputs(
    updates: list[dict],
    suspects: list[dict],
    sql_path: Path,
    preview_path: Path,
    suspect_path: Path,
) -> None:
    for path in (sql_path, preview_path, suspect_path):
        path.parent.mkdir(parents=True, exist_ok=True)

    sql_lines = [
        "-- Generated by scripts/build_missing_phonetics_update.py",
        "-- Only updates rows whose phonetic is still NULL or blank.",
        "BEGIN;",
        "",
    ]
    for row in updates:
        sql_lines.extend(
            [
                "UPDATE public.words",
                f"SET phonetic = {sql_literal(row['phonetic'])}",
                f"WHERE id = {sql_literal(row['id'])}::uuid",
                "  AND (phonetic IS NULL OR BTRIM(phonetic) = '');",
                "",
            ]
        )
    sql_lines.extend(["COMMIT;", ""])
    sql_path.write_text("\n".join(sql_lines), encoding="utf-8")

    fields = ["id", "topic_name", "word", "phonetic", "source"]
    with preview_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(updates)

    suspect_fields = ["id", "topic_name", "word", "reason", "unresolved_tokens"]
    with suspect_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=suspect_fields)
        writer.writeheader()
        writer.writerows(suspects)


def main() -> int:
    args = parse_args()
    default_url, default_key = extract_supabase_config()
    supabase_url = (args.supabase_url or default_url).rstrip("/")
    anon_key = args.anon_key or default_key

    rows = fetch_missing_words(
        supabase_url,
        anon_key,
        args.access_token,
        args.topic,
        args.limit,
    )
    cache = load_cache(args.cache)
    updates: list[dict] = []
    suspects: list[dict] = []

    print(f"Found {len(rows)} rows with missing phonetic.")
    for index, row in enumerate(rows, start=1):
        phonetic, source, unresolved = build_phonetic(row["word"], cache, args.delay)
        if phonetic:
            updates.append({**row, "phonetic": phonetic, "source": source})
        else:
            suspects.append(
                {
                    **row,
                    "reason": source,
                    "unresolved_tokens": ", ".join(unresolved),
                }
            )
        if index % 25 == 0 or index == len(rows):
            print(f"Processed {index}/{len(rows)}: {len(updates)} ready, {len(suspects)} suspect.")
            save_cache(args.cache, cache)

    save_cache(args.cache, cache)
    write_outputs(updates, suspects, args.sql, args.preview, args.suspect)
    print(f"SQL: {args.sql}")
    print(f"Preview: {args.preview}")
    print(f"Suspect: {args.suspect}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
