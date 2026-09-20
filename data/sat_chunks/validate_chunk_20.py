import json

with open('data/sat_chunks/chunk_20.json', 'r', encoding='utf-8') as f:
    orig = json.load(f)

with open('data/sat_chunks/chunk_20_enriched.json', 'r', encoding='utf-8') as f:
    enr = json.load(f)

assert len(orig) == len(enr), f'Length mismatch: {len(orig)} vs {len(enr)}'
print(f'Total items: {len(enr)}')

valid_pos = {'v.', 'n.', 'adj.', 'adv.'}

for i, (o, e) in enumerate(zip(orig, enr)):
    assert o['global_order'] == e['global_order'], f"Order mismatch at {i}: {o['global_order']} vs {e['global_order']}"
    assert o['word'] == e['word'], f"Word mismatch at {i}: {o['word']} vs {e['word']}"
    assert o['en_meaning'] == e['en_meaning'], f"EN meaning mismatch at {i}"
    assert o['lesson_name'] == e['lesson_name']
    assert o['lesson_order'] == e['lesson_order']
    assert o['word_order'] == e['word_order']
    
    assert e['phonetic'].startswith('/') and e['phonetic'].endswith('/'), f"Invalid phonetic format: {e['phonetic']}"
    assert e['pos'] in valid_pos, f"Invalid pos: {e['pos']} in {e['word']}"
    assert not e['vi_meaning'].endswith('.'), f"vi_meaning ends with period: {e['vi_meaning']}"
    assert len(e['example_sentence'].strip()) > 30, f"Sentence too short: {e['example_sentence']}"
    
    # Check word presence in sentence
    w = e['word'].lower()
    sent = e['example_sentence'].lower()
    base_stem = w[:4] if len(w) >= 4 else w
    if base_stem not in sent:
        print(f"Warning: word stem {base_stem} ({w}) not found in: {e['example_sentence']}")
    else:
        # Avoid charmap encoding errors on Windows console
        print(f"OK [{e['global_order']}] {e['word']} ({e['pos']})")

print('All validation checks passed successfully!')
