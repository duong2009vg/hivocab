import os
import sys
import json
import time

sys.stdout.reconfigure(encoding='utf-8')
sys.path.append('scripts')
from upload_ielts_vol import parse_all_data

print("Starting parse_all_data()...")
t0 = time.time()
topics, tests, passages, words = parse_all_data()
elapsed = time.time() - t0
print(f"Parsed {len(topics)} topics, {len(tests)} tests, {len(passages)} passages, {len(words)} words in {elapsed:.1f}s")

output_path = os.path.join("data", "ielts_vol_parsed_raw.json")
data = {
    "topics": topics,
    "tests": tests,
    "passages": passages,
    "words": words
}

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False)

print(f"Saved to {output_path} ({os.path.getsize(output_path) / (1024*1024):.2f} MB)")
