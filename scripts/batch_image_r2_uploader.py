"""
HiVocab Batch Image Pipeline: Contextual Image Search, WebP Conversion, Cloudflare R2 Upload & Supabase RPC Sync
Categories: Oxford 3000 (1,761 words) & Destination C1-C2 (3,509 words)
"""

import argparse
import io
import json
import os
import re
import sys
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
import boto3
from botocore.config import Config
from PIL import Image
import requests

sys.stdout.reconfigure(encoding="utf-8")

# ── R2 CONFIG ──────────────────────────────────────────────────
R2_ENDPOINT = "https://01033fe0886de81827c8bfdb291025d8.r2.cloudflarestorage.com"
R2_ACCESS_KEY = "046821c928596cf198381f732d40583a"
R2_SECRET_KEY = "425f6b891095a821179e3a8cedb53633bc6e4e7bc945e68e23e57cc2fd8dd4f6"
BUCKET_NAME = "hivocab-images"
PUBLIC_BASE_URL = "https://pub-d574cb0773d248b29827bfc428bb1f81.r2.dev"

# ── SUPABASE CONFIG ────────────────────────────────────────────
SUPABASE_URL = "https://swehdtrqjyklmsefkjdf.supabase.co"
ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWhkdHJxanlrbG1zZWZramRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc4MDcsImV4cCI6MjA5Mzk3MzgwN30."
    "dXRhEmvS8J21aJ3dwZ4jHaWuKbhNw2yys90YTIop2EU"
)
SB_HEADERS = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
}

# ── NETWORK HEADERS (WIKIMEDIA & OPENVERSE COMPLIANT) ──────────
HEADERS = {
    "User-Agent": "HiVocabEducationalApp/1.0 (admin@hivocab.com; https://hivocab.site)"
}

# ── R2 S3 CLIENT ───────────────────────────────────────────────
s3 = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto",
)

# ── QUALITY FILTER PATTERNS ────────────────────────────────────
BAD_PATTERNS = [
    "flag", "map", "chart", "diagram", "graph", "logo", "icon", "svg",
    "coat_of_arms", "heraldic", "emblem", "symbol", "seal_of", "arms_of",
    "location", "locator", "globe", "earth", "world", "continent",
    "satellite", "iss-", "iss_", "from_space", "from_sky",
    "sketch", "drawing", "illustration", "painting", "artwork", "art_",
    "montage", "collage", "composite", "collection", "haeckel",
    ".svg", ".pdf", ".gif", "relief_", "topographic", "bathymetric",
    "distribution", "range_map", "taxobox", "cladogram", "phylo",
    "commons-logo", "question_book", "wikimedia", "wiktionary",
    "specimen", "museum", "preserved", "taxidermy", "dissect",
    "anatomy", "cross_section", "cross-section", "cutaway",
    "solarpunk", "ai_generated", "concept_art", "render",
]

CACHE_FILE_OXFORD = "data/image_cache_oxford3000.json"
CACHE_FILE_DESTINATION = "data/image_cache_destination.json"


def get_cache_file(category):
    return CACHE_FILE_OXFORD if category == "oxford3000" else CACHE_FILE_DESTINATION


def load_cache(cache_file):
    if os.path.exists(cache_file):
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_cache(cache, cache_file):
    os.makedirs(os.path.dirname(cache_file), exist_ok=True)
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def remove_accents(input_str):
    nfkd = unicodedata.normalize("NFKD", input_str)
    return "".join([c for c in nfkd if not unicodedata.combining(c)]).replace("đ", "d").replace("Đ", "D")


def clean_word(word):
    w = word.replace("ffsh", "fish").replace("ff", "f").replace("ﬂ", "fl").replace("ﬁ", "fi")
    w = re.sub(r"\(.*?\)", "", w)  # remove (sb/sth)
    w = w.split("/")[0]
    w = re.sub(r"\s+", " ", w).strip()
    return w


def slugify(text):
    clean = remove_accents(clean_word(text)).lower()
    slug = re.sub(r"[^a-z0-9]+", "_", clean).strip("_")
    return slug or "word"


def is_valid_photo(url_or_name):
    if not url_or_name:
        return False
    lower = url_or_name.lower()
    for bad in BAD_PATTERNS:
        if bad in lower:
            return False
    if lower.endswith((".svg", ".pdf", ".gif")):
        return False
    return True


# ══════════════════════════════════════════════════════════════
# MULTI-LAYER SEARCH ALGORITHM
# ══════════════════════════════════════════════════════════════

def search_wikipedia_pageimage(query):
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "prop": "pageimages",
        "format": "json",
        "piprop": "thumbnail",
        "pithumbsize": 960,
        "titles": query,
        "redirects": 1,
    }
    try:
        r = requests.get(url, params=params, headers=HEADERS, timeout=7)
        if r.status_code == 200:
            pages = r.json().get("query", {}).get("pages", {})
            for pid, p in pages.items():
                if pid != "-1":
                    thumb = p.get("thumbnail", {}).get("source")
                    if thumb and is_valid_photo(thumb):
                        return thumb
    except Exception:
        pass
    return None


def search_wikimedia_commons(query):
    url = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": f"{query} filetype:bitmap",
        "gsrnamespace": 6,
        "gsrlimit": 5,
        "prop": "imageinfo",
        "iiprop": "url|mime",
        "iiurlwidth": 960,
        "format": "json",
    }
    try:
        r = requests.get(url, params=params, headers=HEADERS, timeout=7)
        if r.status_code == 200:
            pages = r.json().get("query", {}).get("pages", {})
            for pid, p in pages.items():
                title = p.get("title", "")
                if not is_valid_photo(title):
                    continue
                infos = p.get("imageinfo", [])
                if infos:
                    mime = infos[0].get("mime", "")
                    if "jpeg" in mime or "png" in mime:
                        img_url = infos[0].get("thumburl") or infos[0].get("url")
                        if img_url and is_valid_photo(img_url):
                            return img_url
    except Exception:
        pass
    return None


def search_openverse_photo(query):
    url = "https://api.openverse.org/v1/images/"
    params = {
        "q": query,
        "category": "photograph",
        "page_size": 3,
    }
    try:
        r = requests.get(url, params=params, headers=HEADERS, timeout=7)
        if r.status_code == 200:
            for item in r.json().get("results", []):
                u = item.get("url")
                t = item.get("title", "")
                if u and is_valid_photo(u) and is_valid_photo(t):
                    return u
    except Exception:
        pass
    return None


TOPIC_CONTEXT_MAP = {
    "Âm nhạc": "music instrument",
    "Bệnh viện": "hospital medical healthcare",
    "Giao thông": "transport vehicle",
    "Bưu điện": "post office mail",
    "Các loài hoa": "flower botanical",
    "Cảm xúc, cảm giác": "emotion human face",
    "Chế độ ăn uống": "food dish meal",
    "Thời gian": "clock time calendar",
    "Sức khỏe": "health medicine body",
    "Đồ dùng gia đình": "furniture household",
    "Động vật": "animal wildlife mammal",
    "Thể thao": "sport activity athlete",
    "Nghề nghiệp": "occupation profession work",
    "Trường học": "school classroom education",
    "Thời tiết": "weather climate nature",
    "Màu sắc": "color colourful",
    "Quần áo": "clothing clothes wear",
    "Du lịch": "travel destination tourism",
    "Biển": "ocean sea marine",
    "Thinking & Learning": "thinking learning education study",
    "Change & Technology": "technology innovation digital",
    "Time & Work": "business office workplace worker",
    "Movement & Transport": "travel transport vehicle",
    "Communication & Media": "communication press news television",
    "Chance & Nature": "nature environment ecology wildlife",
    "Quantity & Money": "money finance currency finance",
    "Reactions & Health": "health medicine psychology emotion",
    "Power & Social Issues": "government society community justice",
    "Quality & Arts": "art culture design architecture",
    "Relationships & People": "family relationship people friendship",
    "Preference & Leisure": "hobby leisure sport activity",
}


def find_best_image_for_word(word, meaning, topic_name):
    cw = clean_word(word)

    # 1. Direct Wikipedia pageimage (Capitalized)
    img = search_wikipedia_pageimage(cw.title())
    if img:
        return img, "wikipedia_direct"

    # 2. Wikipedia lower variant
    img = search_wikipedia_pageimage(cw)
    if img:
        return img, "wikipedia_title"

    # 3. Topic context assisted search
    topic_clean = re.sub(r"^(Oxford 3000\s*-\s*|Unit\s*\d+:\s*)", "", topic_name).strip()
    topic_hint = ""
    for k, v in TOPIC_CONTEXT_MAP.items():
        if k.lower() in topic_clean.lower():
            topic_hint = v
            break

    if topic_hint:
        combo_query = f"{cw} {topic_hint}"
        img = search_wikimedia_commons(combo_query)
        if img:
            return img, "commons_context"
        img = search_openverse_photo(combo_query)
        if img:
            return img, "openverse_context"

    # 4. Wikimedia Commons direct search
    img = search_wikimedia_commons(cw)
    if img:
        return img, "commons_word"

    # 5. Openverse photography
    img = search_openverse_photo(cw)
    if img:
        return img, "openverse_word"

    # 6. Simplify long phrase (take first 2 words)
    parts = cw.split()
    if len(parts) > 2:
        short_q = " ".join(parts[:2])
        img = search_wikipedia_pageimage(short_q.title())
        if img:
            return img, "wiki_short"
        img = search_wikimedia_commons(short_q)
        if img:
            return img, "commons_short"

    return None, "not_found"


# ══════════════════════════════════════════════════════════════
# PROCESS & UPLOAD TO CLOUDFLARE R2
# ══════════════════════════════════════════════════════════════

def process_and_upload_to_r2(img_url, category_folder, topic_slug, word_slug):
    res = requests.get(img_url, headers=HEADERS, timeout=12)
    if res.status_code != 200:
        raise Exception(f"HTTP {res.status_code}")

    img = Image.open(io.BytesIO(res.content))
    img = img.convert("RGB")
    img.thumbnail((720, 540), Image.Resampling.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=84, method=6)
    webp_bytes = buf.getvalue()

    r2_key = f"{category_folder}/{topic_slug}/{word_slug}.webp"

    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=r2_key,
        Body=webp_bytes,
        ContentType="image/webp",
        CacheControl="public, max-age=31536000",
    )

    public_url = f"{PUBLIC_BASE_URL}/{r2_key}"
    size_kb = round(len(webp_bytes) / 1024, 1)
    return public_url, size_kb


# ══════════════════════════════════════════════════════════════
# WORKER & SYNC
# ══════════════════════════════════════════════════════════════

def sync_to_supabase(updates):
    """Sync updates to Supabase via bulk_update_word_images RPC."""
    if not updates:
        return 0
    try:
        payload = {"updates": updates}
        r = requests.post(f"{SUPABASE_URL}/rest/v1/rpc/bulk_update_word_images", headers=SB_HEADERS, json=payload, timeout=15)
        if r.status_code == 200:
            return len(updates)
        else:
            print(f"    [Supabase Sync Warning] HTTP {r.status_code}: {r.text}")
    except Exception as e:
        print(f"    [Supabase Sync Error]: {e}")
    return 0


def process_single_word(item, category_folder, cache):
    w_id = item["id"]
    word = item["word"].strip()
    meaning = item.get("meaning", "")
    topic_name = item.get("topic_name", "")

    topic_slug = slugify(topic_name)
    word_slug = slugify(word)
    cache_key = f"{category_folder}:{topic_slug}:{word_slug}"

    # Check cache first
    if cache_key in cache and cache[cache_key].get("status") == "success":
        cached_url = cache[cache_key].get("r2_url")
        return {
            "id": w_id,
            "word": word,
            "image_url": cached_url,
            "status": "cached",
            "source": "cache",
            "size_kb": cache[cache_key].get("size_kb", 0),
        }

    # Search for image
    img_url, search_layer = find_best_image_for_word(word, meaning, topic_name)
    if not img_url:
        return {
            "id": w_id,
            "word": word,
            "image_url": None,
            "status": "not_found",
            "source": search_layer,
        }

    # Upload to R2
    try:
        pub_url, size_kb = process_and_upload_to_r2(img_url, category_folder, topic_slug, word_slug)
        result = {
            "id": w_id,
            "word": word,
            "image_url": pub_url,
            "r2_url": pub_url,
            "status": "success",
            "source": search_layer,
            "size_kb": size_kb,
        }
        cache[cache_key] = result
        return result
    except Exception as e:
        return {
            "id": w_id,
            "word": word,
            "image_url": None,
            "status": "error",
            "error": str(e),
            "source": search_layer,
        }


def run_pipeline(category, limit=None, workers=4):
    category_files = {
        "oxford3000": ("data/oxford3000_words.json", "oxford3000"),
        "destination": ("data/destination_words.json", "destination-c1-c2"),
    }

    if category not in category_files:
        print(f"Unknown category: {category}. Choose 'oxford3000' or 'destination'")
        return

    data_file, folder_name = category_files[category]
    cache_file = get_cache_file(category)
    cache = load_cache(cache_file)

    with open(data_file, "r", encoding="utf-8") as f:
        all_words = json.load(f)

    # Filter out words that already have image_url
    pending_words = []
    for w in all_words:
        w_clean = slugify(w["word"])
        t_clean = slugify(w["topic_name"])
        cache_key = f"{folder_name}:{t_clean}:{w_clean}"
        if w.get("image_url"):
            continue
        if cache_key in cache and cache[cache_key].get("status") == "success":
            continue
        pending_words.append(w)

    print(f"\n{'='*70}")
    print(f"🚀 HIVOCAB IMAGE PIPELINE: {category} ({len(all_words)} total, {len(pending_words)} pending)")
    print(f"{'='*70}")

    if limit:
        pending_words = pending_words[:limit]
        print(f"Limiting execution to {limit} words")

    if not pending_words:
        print("All words already processed and cached!")
        return

    success_count = 0
    not_found_count = 0
    error_count = 0

    pending_db_updates = []
    start_time = time.time()

    print(f"Processing with {workers} worker threads...\n")

    with ThreadPoolExecutor(max_workers=workers) as executor:
        future_to_word = {
            executor.submit(process_single_word, w, folder_name, cache): w for w in pending_words
        }

        for idx, future in enumerate(as_completed(future_to_word), 1):
            res = future.result()
            w_text = res["word"]
            status = res["status"]

            if status in ("success", "cached"):
                success_count += 1
                pending_db_updates.append({"id": res["id"], "image_url": res["image_url"]})
                size_str = f"({res.get('size_kb', 0)} KB)" if res.get("size_kb") else ""
                print(f"[{idx}/{len(pending_words)}] ✅ {w_text} -> {res['source']} {size_str}")
            elif status == "not_found":
                not_found_count += 1
                print(f"[{idx}/{len(pending_words)}] ⚠️ {w_text} -> Not found")
            else:
                error_count += 1
                print(f"[{idx}/{len(pending_words)}] ❌ {w_text} -> Error: {res.get('error')}")

            # Checkpoint every 20 words or at end: sync to Supabase and save cache
            if idx % 20 == 0 or idx == len(pending_words):
                save_cache(cache, cache_file)
                if pending_db_updates:
                    synced = sync_to_supabase(pending_db_updates)
                    print(f"    [Checkpoint] Synced {synced} words to Supabase & saved cache.")
                    pending_db_updates = []

            time.sleep(0.08)

    save_cache(cache, cache_file)
    elapsed = round(time.time() - start_time, 1)

    print(f"\n{'='*70}")
    print(f"✨ COMPLETED IN {elapsed}s:")
    print(f"   - Successfully Uploaded & Synced : {success_count}")
    print(f"   - Not Found                      : {not_found_count}")
    print(f"   - Errors                         : {error_count}")
    print(f"   - Total Batch                    : {len(pending_words)}")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HiVocab Image Pipeline")
    parser.add_argument("--category", choices=["oxford3000", "destination"], default="oxford3000")
    parser.add_argument("--limit", type=int, default=None, help="Max words to process")
    parser.add_argument("--workers", type=int, default=4, help="Concurrent worker threads")
    args = parser.parse_args()

    run_pipeline(category=args.category, limit=args.limit, workers=args.workers)
