"""
scripts/enrich_english_meanings.py
Official Dictionary English Meaning Enrichment Pipeline for HiVocab.

Sources (strictly authentic official dictionaries, zero LLM-invented definitions):
  1. English Wiktionary (via Kaikki.org Wiktextract structured JSONL dump)
  2. Princeton WordNet 3.0 (via NLTK offline corpus)

Disambiguation Strategy:
  - Normalizes target headwords, phrasal verbs, and inflections to match dictionary entries.
  - Filters & scores candidate official definitions using:
      (a) Part-of-Speech (POS) alignment from `words.pos` and `words.meaning` tag `(n)`, `(v)`, `(adj)`, ...
      (b) Vietnamese-to-English lexical overlap clues built from local `data/dictionary.db`
      (c) Standard-register heuristics (demoting archaic/obsolete/slang/surname/form-of-only glosses)
  - Saves matched entries to `data/english_meanings_cache.jsonl` and pushes batch updates
    idempotently to Supabase via `public.bulk_update_english_meanings`.

Usage:
  py scripts/enrich_english_meanings.py --dry-run --category IELTS --limit 50
  py scripts/enrich_english_meanings.py --category IELTS
  py scripts/enrich_english_meanings.py
"""

import argparse
import gzip
import json
import math
import os
import re
import sqlite3
import sys
import time
from collections import defaultdict

import requests
from nltk.corpus import wordnet as wn
from nltk.stem import WordNetLemmatizer

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT_DIR, 'data')
ENV_LOCAL_PATH = os.path.join(ROOT_DIR, '.env.local')
KAIKKI_GZ_PATH = os.path.join(DATA_DIR, 'kaikki.org-dictionary-English.jsonl.gz')
KAIKKI_INDEX_PATH = os.path.join(DATA_DIR, 'kaikki_matched_index.json')
DICT_DB_PATH = os.path.join(DATA_DIR, 'dictionary.db')
CACHE_JSONL_PATH = os.path.join(DATA_DIR, 'english_meanings_cache.jsonl')

PRIORITY_CATEGORIES = [
    'IELTS',
    'CAM',
    'Destination C1-C2',
    'SAT',
    'TOEIC',
    '9+ THPT Quốc Gia 2027',
    'THPT/ĐGNL',
    'Common Words',
    'CEFR',
    'Từ vựng của tôi',
    'IELTS Actual Tests',
]

IRREGULAR_BASE = {
    'arisen': 'arise', 'arose': 'arise', 'awoke': 'awake', 'awoken': 'awake',
    'became': 'become', 'began': 'begin', 'begun': 'begin', 'bent': 'bend',
    'bit': 'bite', 'bitten': 'bite', 'bled': 'bleed', 'blew': 'blow', 'blown': 'blow',
    'broke': 'break', 'broken': 'break', 'brought': 'bring', 'built': 'build',
    'burnt': 'burn', 'bought': 'buy', 'caught': 'catch', 'chose': 'choose',
    'chosen': 'choose', 'came': 'come', 'crept': 'creep', 'dealt': 'deal',
    'dug': 'dig', 'did': 'do', 'done': 'do', 'drew': 'draw', 'drawn': 'draw',
    'drank': 'drink', 'drunk': 'drink', 'drove': 'drive', 'driven': 'drive',
    'ate': 'eat', 'eaten': 'eat', 'fell': 'fall', 'fallen': 'fall', 'fed': 'feed',
    'felt': 'feel', 'fought': 'fight', 'found': 'find', 'fled': 'flee',
    'flew': 'fly', 'flown': 'fly', 'forgot': 'forget', 'forgotten': 'forget',
    'forgave': 'forgive', 'forgiven': 'forgive', 'froze': 'freeze', 'frozen': 'freeze',
    'got': 'get', 'gotten': 'get', 'gave': 'give', 'given': 'give', 'went': 'go',
    'gone': 'go', 'grew': 'grow', 'grown': 'grow', 'hung': 'hang', 'had': 'have',
    'heard': 'hear', 'hid': 'hide', 'hidden': 'hide', 'held': 'hold', 'kept': 'keep',
    'knew': 'know', 'known': 'know', 'laid': 'lay', 'led': 'lead', 'left': 'leave',
    'lent': 'lend', 'lay': 'lie', 'lain': 'lie', 'lost': 'lose', 'made': 'make',
    'meant': 'mean', 'met': 'meet', 'paid': 'pay', 'rode': 'ride', 'ridden': 'ride',
    'rang': 'ring', 'rung': 'ring', 'rose': 'rise', 'risen': 'rise', 'ran': 'run',
    'said': 'say', 'saw': 'see', 'seen': 'see', 'sought': 'seek', 'sold': 'sell',
    'sent': 'send', 'shook': 'shake', 'shaken': 'shake', 'shot': 'shoot',
    'showed': 'show', 'shown': 'show', 'shrank': 'shrink', 'shrunk': 'shrink',
    'sang': 'sing', 'sung': 'sing', 'sank': 'sink', 'sunk': 'sink', 'sat': 'sit',
    'slept': 'sleep', 'slid': 'slide', 'spoke': 'speak', 'spoken': 'speak',
    'spent': 'spend', 'stood': 'stand', 'stole': 'steal', 'stolen': 'steal',
    'struck': 'strike', 'swore': 'swear', 'sworn': 'swear', 'swam': 'swim',
    'swum': 'swim', 'took': 'take', 'taken': 'take', 'taught': 'teach',
    'tore': 'tear', 'torn': 'tear', 'told': 'tell', 'thought': 'think',
    'threw': 'throw', 'thrown': 'throw', 'understood': 'understand',
    'woke': 'wake', 'woken': 'wake', 'wore': 'wear', 'worn': 'wear',
    'won': 'win', 'wrote': 'write', 'written': 'write',
    'children': 'child', 'men': 'man', 'women': 'woman', 'people': 'person',
    'feet': 'foot', 'teeth': 'tooth', 'mice': 'mouse', 'geese': 'goose',
    'phenomena': 'phenomenon', 'criteria': 'criterion', 'data': 'datum',
    'analyses': 'analysis', 'crises': 'crisis', 'theses': 'thesis',
    'hypotheses': 'hypothesis', 'indices': 'index', 'appendices': 'appendix',
}

BAD_TAGS = {
    'archaic', 'obsolete', 'dated', 'historical', 'rare', 'slang', 'vulgar',
    'offensive', 'derogatory', 'dialectal', 'nonstandard', 'eye-dialect',
    'misspelling', 'humorous', 'jocular', 'poetic', 'literary', 'heraldry',
    'taxonomy', 'chemistry', 'biochemistry', 'organic-chemistry', 'inorganic-chemistry',
    'pharmacology', 'botany', 'zoology', 'anatomy', 'pathology', 'entomology',
    'mycology', 'mineralogy', 'astronomy', 'nautical', 'cricket', 'baseball',
    'knitting', 'crochet', 'sewing', 'quilting', 'weaving', 'fencing', 'chess',
    'card-games', 'poker', 'golf', 'tennis', 'bridge', 'music', 'musical',
    'mathematics', 'geometry', 'algebra', 'calculus', 'topology', 'computing',
    'programming', 'printing', 'typography', 'religion', 'theology', 'christianity',
    'catholicism', 'judaism', 'islam', 'hinduism', 'buddhism', 'law', 'legal',
    'politics', 'parliamentary', 'military', 'weapons', 'aviation', 'sports',
}

NICHE_GLOSS_RE = re.compile(
    r'(\bsee\s+[A-Z]?[a-z]+\s*\(|\bknitting\b|\bcrochet\b|\bstitches\b|\bin a parliament\b|\bfigured bass\b|\bheraldry\b|\bchess\b|\bbaseball\b|\bcricket\b|\bin geometry\b)',
    re.IGNORECASE,
)

FORM_OF_PREFIXES = (
    'plural of ',
    'simple past of ',
    'past participle of ',
    'present participle of ',
    'third-person singular simple present indicative of ',
    'comparative form of ',
    'superlative form of ',
    'alternative spelling of ',
    'alternative form of ',
    'misspelling of ',
    'obsolete form of ',
    'archaic form of ',
    'dated form of ',
    'inflection of ',
    'clipping of ',
    'abbreviation of ',
    'initialism of ',
    'acronym of ',
    'eye dialect spelling of ',
)

VI_STOPWORDS = {
    'là', 'của', 'và', 'có', 'một', 'những', 'các', 'được', 'bị', 'cho', 'với',
    'trong', 'trên', 'dưới', 'về', 'từ', 'đến', 'tới', 'ra', 'vào', 'lên', 'xuống',
    'làm', 'sự', 'cái', 'việc', 'người', 'vật', 'nơi', 'khi', 'nếu', 'như', 'hay',
    'hoặc', 'mà', 'thì', 'để', 'rất', 'hơi', 'quá', 'không', 'chưa', 'đã', 'đang',
    'sẽ', 'tính', 'chất', 'cách', 'theo', 'mang', 'thuộc', 'gây', 'nên',
}

EN_STOPWORDS = {
    'a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'by', 'for', 'from', 'with',
    'as', 'into', 'onto', 'or', 'and', 'but', 'is', 'are', 'be', 'being', 'been',
    'that', 'which', 'who', 'whom', 'one', 'someone', 'something', 'person', 'thing',
    'act', 'state', 'quality', 'condition', 'having', 'making', 'relating', 'used',
    'usually', 'especially', 'often', 'very', 'more', 'most', 'not', 'no', 'etc',
}


def load_env_local():
    env = {}
    if not os.path.exists(ENV_LOCAL_PATH):
        return env
    with open(ENV_LOCAL_PATH, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def normalize_pos(raw_pos, raw_meaning=''):
    p = str(raw_pos or '').strip().lower()
    if not p and raw_meaning:
        m = re.match(r'^\(([a-zA-Z\s,/.-]+)\)', str(raw_meaning).strip())
        if m:
            p = m.group(1).strip().lower()
    if p in ('n', 'noun', 'nouns', 'danh từ'):
        return 'noun'
    if p in ('v', 'verb', 'verbs', 'vt', 'vi', 'động từ', 'phrasal verb'):
        return 'verb'
    if p in ('adj', 'a', 'adjective', 'tính từ', 's'):
        return 'adj'
    if p in ('adv', 'r', 'adverb', 'trạng từ'):
        return 'adv'
    if p in ('prep', 'preposition', 'giới từ'):
        return 'prep'
    if p in ('conj', 'conjunction', 'liên từ'):
        return 'conj'
    if p in ('pron', 'pronoun', 'đại từ'):
        return 'pron'
    if p in ('phrase', 'idiom', 'cụm từ', 'thành ngữ', 'proverb'):
        return 'phrase'
    if p in ('intj', 'interjection', 'thán từ'):
        return 'intj'
    if p in ('det', 'determiner', 'article'):
        return 'det'
    return ''


def map_kaikki_pos(k_pos):
    p = str(k_pos or '').strip().lower()
    if p in ('noun', 'name', 'propn'):
        return 'noun'
    if p in ('verb',):
        return 'verb'
    if p in ('adj',):
        return 'adj'
    if p in ('adv',):
        return 'adv'
    if p in ('prep', 'postp', 'prep_phrase'):
        return 'prep'
    if p in ('conj',):
        return 'conj'
    if p in ('pron',):
        return 'pron'
    if p in ('phrase', 'idiom', 'proverb'):
        return 'phrase'
    if p in ('intj',):
        return 'intj'
    if p in ('det', 'article'):
        return 'det'
    return p


def clean_vi_meaning(meaning):
    s = str(meaning or '').strip()
    s = re.sub(r'^(\([^)]{1,20}\)|\[[^\]]{1,20}\])\s*', '', s)
    return s.strip()


def generate_candidate_headwords(word, lemmatizer):
    raw = re.sub(r'\s+', ' ', str(word or '').strip())
    if not raw:
        return []
    low = raw.lower()
    # Strip trailing parenthetical hints like "mean (a.)"
    low_clean = re.sub(r'\s*\([^)]*\)\s*$', '', low).strip()
    candidates = []
    seen = set()

    def add(c):
        c = c.strip()
        if c and c not in seen:
            seen.add(c)
            candidates.append(c)

    add(raw)
    add(low)
    if low_clean != low:
        add(low_clean)

    # Single word forms
    if ' ' not in low_clean:
        if low_clean in IRREGULAR_BASE:
            add(IRREGULAR_BASE[low_clean])
        for wn_pos in ('v', 'n', 'a', 'r'):
            lem = lemmatizer.lemmatize(low_clean, wn_pos)
            add(lem)
        # British -> American spelling variants or vice versa for doubled consonants
        if low_clean.endswith('lling'):
            add(low_clean[:-4] + 'ling')
        if low_clean.endswith('lled'):
            add(low_clean[:-3] + 'led')
    else:
        # Phrasal verb / phrase: lemmatize the first verb word ("accounted for" -> "account for")
        parts = low_clean.split(' ')
        first = parts[0]
        rest = ' '.join(parts[1:])
        if first in IRREGULAR_BASE:
            add(IRREGULAR_BASE[first] + ' ' + rest)
        v_lem = lemmatizer.lemmatize(first, 'v')
        add(v_lem + ' ' + rest)
        if first.endswith('lled'):
            add(first[:-3] + 'led ' + rest)
        # Try hyphenated or unhyphenated variant
        if '-' in low_clean:
            add(low_clean.replace('-', ' '))
        # Strip leading "to " on infinitive phrases
        if low_clean.startswith('to '):
            add(low_clean[3:].strip())
        # Strip leading articles for collocations like "a sharp drop" -> "sharp drop" (optional)
        # Note: Keep exact articles first; only strip trailing punctuation
        add(re.sub(r'[.,;!?]+$', '', low_clean))

    return candidates


def fetch_supabase_words(supabase_url, service_key, category_filter=None, include_existing=False):
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
    }

    # 1. Fetch all topics
    topics = []
    offset = 0
    while True:
        r = requests.get(
            f'{supabase_url}/rest/v1/topics?select=id,name,category&order=id&limit=1000&offset={offset}',
            headers=headers,
            timeout=30,
        )
        r.raise_for_status()
        batch = r.json()
        if not batch:
            break
        topics.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000

    topic_map = {t['id']: t for t in topics}
    allowed_topic_ids = None
    if category_filter:
        allowed_topic_ids = {
            tid for tid, t in topic_map.items()
            if (t.get('category') or '').lower() == category_filter.lower()
        }

    # 2. Fetch target words
    words = []
    offset = 0
    filter_clause = '' if include_existing else '&english_meaning=is.null'
    while True:
        url = (
            f'{supabase_url}/rest/v1/words'
            f'?select=id,topic_id,word,pos,meaning,english_meaning,example_sentence'
            f'{filter_clause}&order=id&limit=1000&offset={offset}'
        )
        r = requests.get(url, headers=headers, timeout=30)
        r.raise_for_status()
        batch = r.json()
        if not batch:
            break
        for row in batch:
            tid = row.get('topic_id')
            if allowed_topic_ids is not None and tid not in allowed_topic_ids:
                continue
            tinfo = topic_map.get(tid, {})
            row['_category'] = tinfo.get('category', '')
            row['_topic_name'] = tinfo.get('name', '')
            words.append(row)
        if len(batch) < 1000:
            break
        offset += 1000

    cat_rank = {c: i for i, c in enumerate(PRIORITY_CATEGORIES)}
    words.sort(key=lambda r: (cat_rank.get(r.get('_category', ''), 99), r.get('_topic_name', ''), r.get('word', '')))
    return words


def build_vi_en_clue_map():
    clue_map = defaultdict(set)
    if not os.path.exists(DICT_DB_PATH):
        return clue_map

    conn = sqlite3.connect(DICT_DB_PATH)
    cur = conn.cursor()
    # Direct English translations of Vietnamese words
    for vi_word, en_trans in cur.execute("""
        SELECT lower(trim(w.word)), lower(trim(t.translation))
        FROM words w
        JOIN translations t ON t.word_id = w.id
        WHERE w.lang_code = 'vi' AND t.lang_code = 'en'
    """):
        if not vi_word or not en_trans or vi_word in VI_STOPWORDS:
            continue
        for tok in re.findall(r'[a-z]{3,}', en_trans):
            if tok not in EN_STOPWORDS:
                clue_map[vi_word].add(tok)

    # English definitions of Vietnamese words in dictionary.db
    for vi_word, en_def in cur.execute("""
        SELECT lower(trim(w.word)), lower(trim(d.definition))
        FROM words w
        JOIN word_definitions wd ON wd.word_id = w.id
        JOIN definitions d ON wd.definition_id = d.id
        WHERE w.lang_code = 'vi' AND d.definition_lang = 'en'
    """):
        if not vi_word or not en_def or vi_word in VI_STOPWORDS:
            continue
        # Only use concise definitions (< 80 chars) so clues stay sharp
        if len(en_def) <= 80:
            for tok in re.findall(r'[a-z]{3,}', en_def):
                if tok not in EN_STOPWORDS:
                    clue_map[vi_word].add(tok)

    conn.close()
    return clue_map


def extract_vi_clues(meaning_vi, clue_map):
    cleaned = clean_vi_meaning(meaning_vi).lower()
    # Split clauses by common punctuation
    segments = [s.strip() for s in re.split(r'[,;/()]+', cleaned) if s.strip()]
    clues = set()
    for seg in segments:
        tokens = [t for t in seg.split() if t]
        # 3-gram, 2-gram, 1-gram matches in clue_map
        for n in (3, 2, 1):
            for i in range(len(tokens) - n + 1):
                phrase = ' '.join(tokens[i:i + n])
                if phrase in clue_map:
                    clues.update(clue_map[phrase])
    return clues


def build_kaikki_index(target_headwords):
    """
    Streams kaikki.org-dictionary-English.jsonl.gz once and extracts ONLY English entries
    matching `target_headwords` (plus any `form_of` base lemmas), caching to `data/kaikki_matched_index.json`.
    """
    if not os.path.exists(KAIKKI_GZ_PATH):
        raise FileNotFoundError(
            f'Kaikki dump not found at {KAIKKI_GZ_PATH}. '
            'Please download https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz'
        )

    existing_index = {}
    if os.path.exists(KAIKKI_INDEX_PATH):
        print(f'Loading existing Kaikki index from {KAIKKI_INDEX_PATH}...')
        with open(KAIKKI_INDEX_PATH, 'r', encoding='utf-8') as f:
            existing_index = json.load(f)

    missing_targets = {w for w in target_headwords if w not in existing_index}
    if not missing_targets:
        print(f'Kaikki index already covers all {len(target_headwords)} candidate headwords.')
        return existing_index

    print(f'Streaming {KAIKKI_GZ_PATH} for {len(missing_targets)} missing candidate headwords...')
    t0 = time.time()
    form_of_bases = set()
    matched_count = 0

    def extract_senses(obj):
        pos = map_kaikki_pos(obj.get('pos', ''))
        out = []
        for s in obj.get('senses', []) or []:
            glosses = s.get('glosses') or s.get('raw_glosses') or []
            if not glosses:
                continue
            gloss = str(glosses[-1]).strip()
            if not gloss:
                continue
            tags = [str(t).lower() for t in (s.get('tags') or [])]
            form_of = []
            for fo in (s.get('form_of') or []):
                if isinstance(fo, dict) and fo.get('word'):
                    form_of.append(str(fo['word']).strip().lower())
            out.append({
                'pos': pos,
                'gloss': gloss,
                'tags': tags,
                'form_of': form_of,
            })
        return out

    word_pre_re = re.compile(r'"word"\s*:\s*"([^"\\]*)"')
    with gzip.open(KAIKKI_GZ_PATH, 'rt', encoding='utf-8', errors='replace') as gz:
        for i, line in enumerate(gz, 1):
            if i % 250000 == 0:
                print(f'  scanned {i:,} lines in {time.time() - t0:.1f}s (matched {matched_count:,})...')
            m = word_pre_re.search(line)
            if m:
                cand_hw = m.group(1).strip().lower()
                if cand_hw not in missing_targets:
                    continue
            try:
                obj = json.loads(line)
            except Exception:
                continue
            if obj.get('lang_code') != 'en':
                continue
            hw = str(obj.get('word') or '').strip().lower()
            if hw in missing_targets:
                senses = extract_senses(obj)
                if senses:
                    existing_index.setdefault(hw, []).extend(senses)
                    matched_count += 1
                    for s in senses:
                        for base_w in s.get('form_of', []):
                            if base_w not in existing_index and base_w not in missing_targets:
                                form_of_bases.add(base_w)

    # Second pass for base lemmas referenced by form_of if needed
    if form_of_bases:
        print(f'Resolving {len(form_of_bases)} form_of base lemmas in pass 2...')
        with gzip.open(KAIKKI_GZ_PATH, 'rt', encoding='utf-8', errors='replace') as gz:
            for line in gz:
                m = word_pre_re.search(line)
                if m and m.group(1).strip().lower() not in form_of_bases:
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                if obj.get('lang_code') != 'en':
                    continue
                hw = str(obj.get('word') or '').strip().lower()
                if hw in form_of_bases:
                    senses = extract_senses(obj)
                    if senses:
                        existing_index.setdefault(hw, []).extend(senses)

    with open(KAIKKI_INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump(existing_index, f, ensure_ascii=False)
    print(f'Saved Kaikki matched index ({len(existing_index):,} headwords) in {time.time() - t0:.1f}s.')
    return existing_index


def is_form_of_only(gloss, tags):
    low = gloss.lower().strip()
    if 'form-of' in tags:
        return True
    return any(low.startswith(pref) for pref in FORM_OF_PREFIXES)


def is_clean_definition(gloss):
    if not gloss or len(gloss) < 6:
        return False
    low = gloss.lower().strip()
    if low.startswith(('see ', 'compare ', 'synonym of ', 'antonym of ')):
        return False
    if 'given name' in low or 'surname' in low or 'initials of' in low:
        return False
    return True


def gather_official_candidates(word, raw_pos, raw_meaning, lemmatizer, kaikki_index):
    candidates = []
    seen_glosses = set()
    headwords = generate_candidate_headwords(word, lemmatizer)

    # 1. Kaikki English Wiktionary
    for hw_idx, hw in enumerate(headwords):
        entries = kaikki_index.get(hw.lower(), [])
        for s_idx, s in enumerate(entries):
            gloss = s['gloss']
            tags = s.get('tags', [])
            # If this sense is pure form_of ("plural of X"), look up base word X
            if is_form_of_only(gloss, tags) and s.get('form_of'):
                for base_w in s['form_of']:
                    for b_idx, bs in enumerate(kaikki_index.get(base_w, [])):
                        bg = bs['gloss']
                        btags = bs.get('tags', [])
                        if not is_form_of_only(bg, btags) and is_clean_definition(bg):
                            key = (bs['pos'], bg.lower())
                            if key not in seen_glosses:
                                seen_glosses.add(key)
                                candidates.append({
                                    'source': 'wiktionary',
                                    'pos': bs['pos'],
                                    'gloss': bg,
                                    'tags': btags,
                                    'hw_rank': hw_idx + 0.5,
                                    'sense_rank': b_idx,
                                })
                continue

            if not is_form_of_only(gloss, tags) and is_clean_definition(gloss):
                key = (s['pos'], gloss.lower())
                if key not in seen_glosses:
                    seen_glosses.add(key)
                    candidates.append({
                        'source': 'wiktionary',
                        'pos': s['pos'],
                        'gloss': gloss,
                        'tags': tags,
                        'hw_rank': hw_idx,
                        'sense_rank': s_idx,
                    })

    # 2. Princeton WordNet 3.0 fallback / supplement
    wn_pos_map = {'n': 'noun', 'v': 'verb', 'a': 'adj', 's': 'adj', 'r': 'adv'}
    for hw_idx, hw in enumerate(headwords):
        wn_query = hw.lower().replace(' ', '_')
        syns = wn.synsets(wn_query)
        for s_idx, syn in enumerate(syns):
            gloss = syn.definition().strip()
            pos = wn_pos_map.get(syn.pos(), '')
            if is_clean_definition(gloss):
                key = (pos, gloss.lower())
                if key not in seen_glosses:
                    seen_glosses.add(key)
                    candidates.append({
                        'source': 'wordnet',
                        'pos': pos,
                        'gloss': gloss,
                        'tags': [],
                        'hw_rank': hw_idx,
                        'sense_rank': s_idx,
                    })

    return candidates


def pick_best_official_definition(word, raw_pos, raw_meaning, example_sentence, lemmatizer, kaikki_index, clue_map):
    target_pos = normalize_pos(raw_pos, raw_meaning)
    candidates = gather_official_candidates(word, raw_pos, raw_meaning, lemmatizer, kaikki_index)
    if not candidates:
        return None, None

    target_word_tokens = set(re.findall(r'[a-z]{3,}', str(word or '').lower()))
    target_word_stems = {t.rstrip('s') for t in target_word_tokens}
    vi_clues = extract_vi_clues(raw_meaning, clue_map) - target_word_tokens - target_word_stems
    ex_tokens = (set(re.findall(r'[a-z]{3,}', str(example_sentence or '').lower())) - EN_STOPWORDS) - target_word_tokens

    best = None
    best_score = -1e9

    for cand in candidates:
        score = 0.0
        # Source base score (Wiktionary glosses are slightly richer/clearer than terse WordNet glosses)
        score += 2.5 if cand['source'] == 'wiktionary' else 1.5

        # Headword exactness penalty for lemmatized / form_of steps
        score -= cand['hw_rank'] * 1.4

        # POS alignment (critical for polysemous words like plummet/figure)
        cpos = cand['pos']
        if target_pos:
            if cpos == target_pos:
                score += 10.0
            elif target_pos == 'phrase' and cpos in ('prep', 'adv', 'conj', 'verb', 'phrase'):
                score += 4.0
            elif cpos and cpos != target_pos:
                score -= 7.0

        # Register & domain tag filtering
        tags_set = set(cand.get('tags', []))
        bad_hits = len(tags_set & BAD_TAGS)
        score -= bad_hits * 8.0
        if NICHE_GLOSS_RE.search(cand['gloss']):
            score -= 14.0
        if 'colloquial' in tags_set or 'informal' in tags_set:
            score -= 1.5

        # Semantic overlap with Vietnamese meaning via dictionary.db clues
        gloss_low = cand['gloss'].lower()
        gloss_tokens = set(re.findall(r'[a-z]{3,}', gloss_low)) - EN_STOPWORDS
        if vi_clues:
            overlap = len(gloss_tokens & vi_clues)
            score += min(overlap, 3) * 3.2

        # Mild context overlap with example sentence
        if ex_tokens:
            ex_overlap = len(gloss_tokens & ex_tokens)
            score += min(ex_overlap, 3) * 0.9

        # Quality / conciseness preference
        glen = len(cand['gloss'])
        if 14 <= glen <= 165:
            score += 1.2
        elif glen > 240:
            score -= 1.8

        # Strong primary-sense prior: Sense #0/#1 should beat obscure Sense #8+ unless clues strongly override
        score -= math.log1p(max(0, cand['sense_rank'])) * 2.4

        if score > best_score:
            best_score = score
            best = cand

    if best is None or best_score < -5.0:
        return None, None

    # Format cleanly without modifying wording (normalize whitespace + strip trailing redundant spaces)
    final_gloss = re.sub(r'\s+', ' ', best['gloss']).strip()
    if len(final_gloss) > 280:
        # Keep whole clauses if longer than 280 chars
        cut = final_gloss[:277]
        if ';' in cut:
            final_gloss = cut.rsplit(';', 1)[0].strip()
        else:
            final_gloss = cut.rsplit(' ', 1)[0].strip() + '...'
    return final_gloss, best['source']


def push_updates_to_supabase(supabase_url, service_key, updates, batch_size=500):
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json',
    }
    total_updated = 0
    for i in range(0, len(updates), batch_size):
        chunk = updates[i:i + batch_size]
        r = requests.post(
            f'{supabase_url}/rest/v1/rpc/bulk_update_english_meanings',
            headers=headers,
            json={'p_updates': chunk},
            timeout=60,
        )
        r.raise_for_status()
        cnt = r.json()
        total_updated += int(cnt or 0)
        print(f'  Uploaded chunk {i // batch_size + 1}: {cnt} rows updated (total {total_updated}/{len(updates)})')
    return total_updated


def main():
    parser = argparse.ArgumentParser(description='Enrich HiVocab words with official dictionary English meanings.')
    parser.add_argument('--category', type=str, default=None, help='Only enrich a specific topic category (e.g. IELTS)')
    parser.add_argument('--limit', type=int, default=0, help='Limit number of rows to process (0 = all)')
    parser.add_argument('--refresh', action='store_true', help='Re-score all rows and update changed definitions')
    parser.add_argument('--dry-run', action='store_true', help='Preview matches without updating Supabase')
    args = parser.parse_args()

    env = load_env_local()
    supabase_url = (env.get('VITE_SUPABASE_URL') or os.environ.get('VITE_SUPABASE_URL', '')).rstrip('/')
    service_key = env.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    if not supabase_url or not service_key:
        raise RuntimeError('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')

    print('1. Fetching target rows from Supabase...')
    rows = fetch_supabase_words(supabase_url, service_key, args.category, include_existing=args.refresh)
    if args.limit and args.limit > 0:
        rows = rows[:args.limit]
    print(f'   Fetched {len(rows):,} target rows.')
    if not rows:
        return

    lemmatizer = WordNetLemmatizer()
    print('2. Generating normalized candidate headwords & loading Kaikki Wiktionary index...')
    target_headwords = set()
    for r in rows:
        for hw in generate_candidate_headwords(r['word'], lemmatizer):
            target_headwords.add(hw.lower())

    kaikki_index = build_kaikki_index(target_headwords)
    print('3. Building Vietnamese-to-English lexical clues from data/dictionary.db...')
    clue_map = build_vi_en_clue_map()
    print(f'   Loaded {len(clue_map):,} Vietnamese clue keys.')

    print('4. Matching official dictionary definitions (POS + Vietnamese sense alignment)...')
    sense_cache = {}
    updates = []
    source_counts = defaultdict(int)
    unmatched = []

    for r in rows:
        w = r['word']
        pos = r.get('pos') or ''
        meaning = r.get('meaning') or ''
        ex = r.get('example_sentence') or ''
        cache_key = (w.strip().lower(), normalize_pos(pos, meaning), clean_vi_meaning(meaning).lower())

        if cache_key in sense_cache:
            en_def, src = sense_cache[cache_key]
        else:
            en_def, src = pick_best_official_definition(
                w, pos, meaning, ex, lemmatizer, kaikki_index, clue_map
            )
            sense_cache[cache_key] = (en_def, src)

        if en_def:
            source_counts[src] += 1
            if not args.refresh or en_def != (r.get('english_meaning') or '').strip():
                updates.append({'id': r['id'], 'english_meaning': en_def})
        else:
            unmatched.append((r.get('_category', ''), w, meaning))

    print(f'\nTotal matched: {sum(source_counts.values()):,} / {len(rows):,} rows | Rows to update: {len(updates):,}')
    print(f'Sources: {dict(source_counts)}')
    print(f'Unmatched (kept NULL): {len(unmatched):,}')

    # Write local checkpoint log
    with open(CACHE_JSONL_PATH, 'w', encoding='utf-8') as f:
        for (w_k, p_k, m_k), (en_def, src) in sense_cache.items():
            if en_def:
                f.write(json.dumps({
                    'word': w_k,
                    'pos': p_k,
                    'meaning_vi': m_k,
                    'english_meaning': en_def,
                    'source': src,
                }, ensure_ascii=False) + '\n')

    if args.dry_run:
        print('\n--- SAMPLE MATCHES (first 25) ---')
        for item in updates[:25]:
            orig = next(r for r in rows if r['id'] == item['id'])
            print(f"  [{orig.get('_category')}] {orig['word']} ({orig.get('pos') or '-'}) | VI: {orig['meaning']} | EN: {item['english_meaning']}")
        if unmatched:
            print('\n--- SAMPLE UNMATCHED (first 15) ---')
            for cat, w, m in unmatched[:15]:
                print(f'  [{cat}] {w} | VI: {m}')
        return

    if updates:
        print('\n5. Updating Supabase public.words via bulk_update_english_meanings...')
        push_updates_to_supabase(supabase_url, service_key, updates)
        print('Done!')


if __name__ == '__main__':
    main()
