import json
import os

TOPIC_ID = 'e8f7c92b-8a1e-4c3d-b5e2-0a1b2c3d4e5f'

with open('data/sat_barron_full_enriched.json', 'r', encoding='utf-8') as f:
    words = json.load(f)

def escape_sql(text):
    if text is None:
        return 'NULL'
    return "'" + str(text).replace("'", "''") + "'"

os.makedirs('data/sat_sql', exist_ok=True)

# Group by lesson_order (1 to 10)
lesson_groups = {}
for w in words:
    l_order = w['lesson_order']
    if l_order not in lesson_groups:
        lesson_groups[l_order] = []
    lesson_groups[l_order].append(w)

for l_order in sorted(lesson_groups.keys()):
    lesson_words = lesson_groups[l_order]
    sql_lines = [
        "INSERT INTO public.words (topic_id, word, phonetic, pos, meaning, example_sentence, lesson_name, lesson_order, word_order)",
        "VALUES"
    ]
    val_rows = []
    for w in lesson_words:
        row = f"  ('{TOPIC_ID}', {escape_sql(w['word'])}, {escape_sql(w['phonetic'])}, {escape_sql(w['pos'])}, {escape_sql(w['meaning'])}, {escape_sql(w['example_sentence'])}, {escape_sql(w['lesson_name'])}, {w['lesson_order']}, {w['word_order']})"
        val_rows.append(row)
    sql_lines.append(",\n".join(val_rows) + ";")
    
    out_path = f'data/sat_sql/lesson_{l_order}.sql'
    with open(out_path, 'w', encoding='utf-8') as out_f:
        out_f.write("\n".join(sql_lines))
    print(f"Lesson {l_order}: wrote {out_path} ({len(lesson_words)} words, {os.path.getsize(out_path)} bytes)")

print("All 10 lesson SQL files created successfully!")
