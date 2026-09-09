import sys
import json
import requests
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://swehdtrqjyklmsefkjdf.supabase.co"
ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWhkdHJxanlrbG1zZWZramRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTc4MDcsImV4cCI6MjA5Mzk3MzgwN30."
    "dXRhEmvS8J21aJ3dwZ4jHaWuKbhNw2yys90YTIop2EU"
)
headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Range": "0-9"
}

# 1. Check topics
r = requests.get(f"{SUPABASE_URL}/rest/v1/topics?category=eq.IELTS%20Actual%20Tests&select=id,name&order=name", headers=headers)
topics = r.json()
print(f"Found {len(topics)} IELTS Actual Tests topics in Supabase:")
topic_ids = [t["id"] for t in topics]

# 2. Check words per topic
total_words = 0
total_with_ex = 0
total_with_pos = 0
total_with_phonetic = 0

for t in topics:
    # Get count
    c_headers = {**headers, "Range": "0-0", "Prefer": "count=exact"}
    r = requests.get(f"{SUPABASE_URL}/rest/v1/words?topic_id=eq.{t['id']}&select=id", headers=c_headers)
    crange = r.headers.get("Content-Range", "")
    t_count = int(crange.split("/")[-1]) if "/" in crange else len(r.json())
    
    # Check nulls
    r_null_ex = requests.get(f"{SUPABASE_URL}/rest/v1/words?topic_id=eq.{t['id']}&example_sentence=is.null&select=id", headers=c_headers)
    null_ex_range = r_null_ex.headers.get("Content-Range", "")
    null_ex = int(null_ex_range.split("/")[-1]) if "/" in null_ex_range else len(r_null_ex.json())

    r_null_pos = requests.get(f"{SUPABASE_URL}/rest/v1/words?topic_id=eq.{t['id']}&pos=is.null&select=id", headers=c_headers)
    null_pos_range = r_null_pos.headers.get("Content-Range", "")
    null_pos = int(null_pos_range.split("/")[-1]) if "/" in null_pos_range else len(r_null_pos.json())

    r_null_ph = requests.get(f"{SUPABASE_URL}/rest/v1/words?topic_id=eq.{t['id']}&phonetic=is.null&select=id", headers=c_headers)
    null_ph_range = r_null_ph.headers.get("Content-Range", "")
    null_ph = int(null_ph_range.split("/")[-1]) if "/" in null_ph_range else len(r_null_ph.json())

    print(f"  {t['name']:15s}: {t_count:5d} words | null ex: {null_ex} | null pos: {null_pos} | null phonetic: {null_ph}")
    total_words += t_count
    total_with_ex += (t_count - null_ex)
    total_with_pos += (t_count - null_pos)
    total_with_phonetic += (t_count - null_ph)

print(f"\n--- Overall Database Verification ---")
print(f"Total words:            {total_words:5d}")
print(f"With example_sentence:  {total_with_ex:5d} ({total_with_ex/total_words*100:.2f}%)")
print(f"With pos:               {total_with_pos:5d} ({total_with_pos/total_words*100:.2f}%)")
print(f"With phonetic:          {total_with_phonetic:5d} ({total_with_phonetic/total_words*100:.2f}%)")

# 3. Check sample words from Supabase (including fixed words like kindness, invention, friendly, sediment)
print("\n--- Verifying Fixed Words in Supabase ---")
fixed_check_words = ["kindness", "invention", "friendly", "greenhouse-friendly", "sediment", "self-awareness", "commercialisation", "specialise in", "colourful", "artefact", "pre-exist", "slip-up"]
for fw in fixed_check_words:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/words?word=eq.{requests.utils.quote(fw)}&select=id,word,pos,phonetic,example_sentence&limit=1", headers=headers)
    rows = r.json()
    if rows:
        row = rows[0]
        print(f"  Word: '{row['word']}'")
        print(f"    POS:      {row['pos']}")
        print(f"    Phonetic: {row['phonetic']}")
        print(f"    Example:  \"{row['example_sentence'][:85]}...\"")
    else:
        print(f"  Word: '{fw}' NOT found in DB")

# 4. Check Vol 9 Test 1
print("\n--- Verifying IELTS Vol 9 Test 1 ---")
vol9 = next(t for t in topics if t["name"] == "IELTS Vol 9")
r_t1 = requests.get(f"{SUPABASE_URL}/rest/v1/tests?topic_id=eq.{vol9['id']}&test_order=eq.1&select=*", headers=headers)
test1 = r_t1.json()[0]
r_p = requests.get(f"{SUPABASE_URL}/rest/v1/passages?test_id=eq.{test1['id']}&order=passage_number&select=*", headers=headers)
p_rows = r_p.json()
print(f"Test 1 ({test1['name']}) passages:")
for p in p_rows:
    # Word count in passage
    r_w = requests.get(f"{SUPABASE_URL}/rest/v1/words?passage_id=eq.{p['id']}&select=id", headers={**headers, "Prefer": "count=exact"})
    crange = r_w.headers.get("Content-Range", "")
    p_wc = int(crange.split("/")[-1]) if "/" in crange else len(r_w.json())
    print(f"  Passage {p['passage_number']}: '{p['title']}' | EN chars: {len(p['content_en'] or '')} | VI chars: {len(p['content_vi'] or '')} | Words: {p_wc}")
