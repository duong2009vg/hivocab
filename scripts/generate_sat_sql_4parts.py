import json
import os

TOPIC_ID = 'e8f7c92b-8a1e-4c3d-b5e2-0a1b2c3d4e5f'
TOPIC_NAME = 'Barron 3500 SAT Words'
CATEGORY = 'SAT'
ICON = 'school'
DESCRIPTION = 'Trọn bộ từ vựng luyện thi SAT học thuật trích từ giáo trình Barron 3500 SAT Words, kèm phiên âm IPA, nghĩa Anh - Việt và ví dụ ngữ cảnh SAT chuyên sâu.'

with open('data/sat_barron_full_enriched.json', 'r', encoding='utf-8') as f:
    words = json.load(f)

print(f"Loaded {len(words)} words.")

def escape_sql(text):
    if text is None:
        return 'NULL'
    return "'" + str(text).replace("'", "''") + "'"

os.makedirs('data/sat_sql', exist_ok=True)

# Split into 4 chunks: 250, 250, 250, 243
chunks = [
    words[0:250],
    words[250:500],
    words[500:750],
    words[750:993]
]

for idx, chunk in enumerate(chunks, 1):
    sql_lines = []
    if idx == 1:
        sql_lines.append(f"""-- 1. Create or update SAT Topic
INSERT INTO public.topics (id, name, category, icon, is_public, description)
VALUES (
  '{TOPIC_ID}',
  {escape_sql(TOPIC_NAME)},
  {escape_sql(CATEGORY)},
  {escape_sql(ICON)},
  true,
  {escape_sql(DESCRIPTION)}
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  is_public = EXCLUDED.is_public,
  description = EXCLUDED.description;

-- Clean existing words for this topic to ensure idempotent seed
DELETE FROM public.words WHERE topic_id = '{TOPIC_ID}';
""")

    sql_lines.append("INSERT INTO public.words (topic_id, word, phonetic, pos, meaning, example_sentence, lesson_name, lesson_order, word_order)\nVALUES")
    
    val_rows = []
    for w in chunk:
        row = f"  ('{TOPIC_ID}', {escape_sql(w['word'])}, {escape_sql(w['phonetic'])}, {escape_sql(w['pos'])}, {escape_sql(w['meaning'])}, {escape_sql(w['example_sentence'])}, {escape_sql(w['lesson_name'])}, {w['lesson_order']}, {w['word_order']})"
        val_rows.append(row)
    
    sql_lines.append(",\n".join(val_rows) + ";\n")
    
    out_path = f'data/sat_sql/part_{idx}.sql'
    with open(out_path, 'w', encoding='utf-8') as out_f:
        out_f.write("\n".join(sql_lines))
    print(f"Wrote {out_path} ({len(chunk)} words, {os.path.getsize(out_path)} bytes)")

print("All 4 parts successfully generated!")
