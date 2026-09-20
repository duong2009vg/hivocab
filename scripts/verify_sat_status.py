import json
import os

with open('data/sat_barron_full_enriched.json', 'r', encoding='utf-8') as f:
    words = json.load(f)

print(f"Total enriched words: {len(words)}")
print(f"First word: {words[0]['word']}")
print(f"Last word: {words[-1]['word']}")

lessons = {}
for w in words:
    l = w.get('lesson_name', 'Unknown')
    lessons[l] = lessons.get(l, 0) + 1

for l, count in sorted(lessons.items()):
    print(f"  {l}: {count} words")
