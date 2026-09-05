import sys, io, openpyxl, uuid as uuidlib

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

EXCEL_PATH = r'C:\Users\MY PC\Documents\GitHub\hivocab\data\cam_10_21_vocabulary.xlsx'

# Actual test IDs from Supabase DB
ACTUAL_TEST_IDS = {
    ('CAM 10','Test 1'): '4dc6acca-51e7-4f1f-8b82-27991c619bfe',
    ('CAM 10','Test 2'): 'de371599-ce17-4d79-bd84-b0447d361866',
    ('CAM 10','Test 3'): 'b2a1a65d-71cb-4bb8-80fe-28d5153fbae3',
    ('CAM 10','Test 4'): '0df014a6-38ac-4e22-8b52-eb3f6bfa6f3e',
    ('CAM 11','Test 1'): '126eddfd-e4a0-43d0-a2d1-df6822845d9f',
    ('CAM 11','Test 2'): 'f6a628b5-d777-4644-b7a6-db313b665a4f',
    ('CAM 11','Test 3'): 'dd1538e2-6e8a-4477-b2a3-3a97916aba06',
    ('CAM 11','Test 4'): 'f7a9ade4-181c-43e5-b9bf-503770890fa3',
    ('CAM 12','Test 1'): '0c63a14d-acaf-499b-999e-80bec645d2f3',
    ('CAM 12','Test 2'): '81089b1b-e919-46a5-8e8c-18efc050941b',
    ('CAM 12','Test 3'): '30b8e7af-729d-4680-8ec3-8ccfd42b6ece',
    ('CAM 12','Test 4'): '27fb2380-c257-457e-900e-7c8a002e10ae',
    ('CAM 13','Test 1'): 'bc52b5a4-bca0-4a31-96c2-7e690e7e858d',
    ('CAM 13','Test 2'): '0dd693a7-4b3e-4caf-a812-1c24422066f1',
    ('CAM 13','Test 3'): '6345c1b2-2799-4c7f-b54b-20a8396c2dd1',
    ('CAM 13','Test 4'): '774d2532-a744-4c74-9b29-a967a8b23b83',
    ('CAM 14','Test 1'): 'bae4f566-4cf7-48d4-b282-a25a2185549e',
    ('CAM 14','Test 2'): 'b36a06e7-a63f-4810-9cb2-6b12308225e7',
    ('CAM 14','Test 3'): '2ec2228b-081a-422d-9e09-fc668ed17495',
    ('CAM 14','Test 4'): '698c4853-01a8-40b2-ab96-77f7c8caf802',
    ('CAM 15','Test 1'): 'bb1ffd61-f60c-43c3-977c-7431d252c00f',
    ('CAM 15','Test 2'): '3f670884-4ea4-4e7a-8d36-62196c2fdbe2',
    ('CAM 15','Test 3'): 'd7ebd831-83da-4bff-ba41-13f7d4497716',
    ('CAM 15','Test 4'): '51f2ae04-cd50-42f4-a076-377e3eb7095c',
    ('CAM 16','Test 1'): '0300aa39-b7bc-46b1-8540-0fe6dd167e40',
    ('CAM 16','Test 2'): '97af34e2-9307-44ae-9478-de78a528d45f',
    ('CAM 16','Test 3'): 'f25ac5f4-fdcf-4b8a-9d57-ade09c7d1237',
    ('CAM 16','Test 4'): 'dd3d4e64-4e34-4f95-9245-729aad9a989d',
    ('CAM 17','Test 1'): 'c5ca7d38-fdc0-4855-a32a-d05cd45ac499',
    ('CAM 17','Test 2'): 'b72d4671-e95b-4e82-a9c9-d25f67e3f1f5',
    ('CAM 17','Test 3'): '41e6b2c5-bd05-4f61-8671-18f62e8e50b5',
    ('CAM 17','Test 4'): '2cd0553a-1e56-4c04-9a0e-66d76a00e72b',
    ('CAM 18','Test 1'): 'fac0f07c-4b7d-413c-a4e3-2117b18bb2e4',
    ('CAM 18','Test 2'): 'fa41a8b9-b0d4-4735-8e4d-0c2f3e1c98c9',
    ('CAM 18','Test 3'): 'bc06a1a9-fc31-4b1b-83ef-e6fccbbda20a',
    ('CAM 18','Test 4'): '58e28ec6-2ed9-4cfe-8085-d1266a7ff7d3',
    ('CAM 19','Test 1'): 'a03af96d-11b0-4505-9da7-5b80c27b42bd',
    ('CAM 19','Test 2'): '3e0de543-c617-4093-9d38-71e0c8cdbbfc',
    ('CAM 19','Test 3'): 'e9c11eb7-a3be-4a0d-a877-f50f25f6bc46',
    ('CAM 19','Test 4'): '83a72a4a-c1f7-4ee3-9e11-a4ab0f9cac83',
    ('CAM 20','Test 1'): '6e2c23b9-b2e8-4fef-99af-a35f4cff65d0',
    ('CAM 20','Test 2'): '7de40e0c-1040-4a07-adef-8b3f3e2fb2aa',
    ('CAM 20','Test 3'): 'f8697b54-22c1-4fbc-aeec-89c9d79f45d8',
    ('CAM 20','Test 4'): '7f4e4c94-1219-45e9-a8b5-a84f2a0bd7a5',
    ('CAM 21','Test 1'): 'e7ccd26a-e432-4df4-a7bc-5abae2e6ba1c',
    ('CAM 21','Test 2'): '00e43538-0628-4b5d-bd25-fd210fa682af',
    ('CAM 21','Test 3'): 'e2ed5269-6f5a-4f05-86a1-afcebff5886d',
    ('CAM 21','Test 4'): 'f9c4971b-2d3b-4d99-8be3-6140e044c8ad',
}

TOPIC_MAP = {
    'CAM 10': '6d8e97c7-1741-42c2-ae72-cd25c7898142',
    'CAM 11': 'd6d317ba-34ee-4b17-ae11-6f75aa57b553',
    'CAM 12': 'e4f8df7e-1674-4a6e-a0fa-f9671dcaf8e4',
    'CAM 13': '7e8e5dd7-7fe4-4dba-bd7e-695020087fe5',
    'CAM 14': '3b7aaac1-0da3-4b9e-a957-2e33f5400856',
    'CAM 15': 'e733a06b-5538-4503-ae67-930d35b7fba8',
    'CAM 16': 'd6713493-ea51-4598-94f3-8eab8a0cb411',
    'CAM 17': '2dae84d8-4133-4190-b857-064bb5d9f425',
    'CAM 18': 'f46a6ece-8000-4788-9fd7-53775ba787c3',
    'CAM 19': '23d43260-9e90-4402-8588-0dc5cedf6293',
    'CAM 20': '1c21d55d-8208-4d16-96fc-eef362ddec90',
    'CAM 21': '4ded7083-5c88-4c1f-968c-b78d02f81b02',
}

wb = openpyxl.load_workbook(EXCEL_PATH, read_only=True, data_only=True)
ws = wb['All Vocabulary']
hdrs = [str(h) if h else '' for h in next(ws.iter_rows(min_row=1, max_row=1, values_only=True))]

# Read passages from Excel, collect unique passages with title/topic
from collections import OrderedDict
passages_seen = OrderedDict()
word_rows = []
for row in ws.iter_rows(min_row=2, values_only=True):
    d = dict(zip(hdrs, row))
    book, test, passage, word = d.get('Book',''), d.get('Test',''), d.get('Passage',''), d.get('Word','')
    if not all([book, test, passage, word]) or book not in TOPIC_MAP: continue
    key = (book, test, passage)
    if key not in passages_seen:
        passages_seen[key] = {'title':d.get('Passage Title',''),'topic_label':d.get('Passage Topic','')}
    word_rows.append((book, test, passage, str(word).strip().lower()))
wb.close()

print(f'Unique passages: {len(passages_seen)}')
print(f'Word rows: {len(word_rows)}')

lines = ['-- Passages INSERT (with correct test_ids from DB)']
passage_id_map = {}

for (book, test, passage), pdata in passages_seen.items():
    test_id = ACTUAL_TEST_IDS.get((book, test))
    tid = TOPIC_MAP.get(book)
    if not test_id or not tid:
        print(f'WARNING: no test_id for {book} {test}')
        continue
    pnum = int(passage.split()[-1]) if passage.split()[-1].isdigit() else 0
    new_id = str(uuidlib.uuid4())
    passage_id_map[(book, test, passage)] = new_id
    title_esc = str(pdata['title']).replace(chr(39),'') if pdata['title'] else ''
    topic_esc = str(pdata['topic_label']).replace(chr(39),'') if pdata['topic_label'] else ''
    lines.append(f\"INSERT INTO public.passages (id, test_id, topic_id, passage_number, title, topic_label) VALUES ('{new_id}', '{test_id}', '{tid}', {pnum}, '{title_esc}', '{topic_esc}') ON CONFLICT DO NOTHING;\")

lines.append('')
lines.append('-- Update words.passage_id')

# Build word -> passage map
from collections import defaultdict
pw = defaultdict(lambda: {'pid':None,'tid':None,'tname':None,'words':set()})
for (book, test, passage, word) in word_rows:
    pid = passage_id_map.get((book, test, passage))
    tid = TOPIC_MAP.get(book)
    if pid and tid:
        k = (pid, tid, test)
        pw[k]['pid'] = pid
        pw[k]['tid'] = tid
        pw[k]['tname'] = test
        pw[k]['words'].add(word.replace(chr(39),''))

for (pid, tid, tname), info in pw.items():
    wlist = list(info['words'])
    wl = ', '.join(f\"'{w}'\" for w in wlist)
    lines.append(f\"UPDATE public.words SET passage_id = '{pid}' WHERE topic_id = '{tid}' AND lesson_name = '{tname}' AND LOWER(TRIM(word)) IN ({wl});\")

out_path = r'C:\Users\MY PC\Documents\GitHub\hivocab\data\cam_passages_correct.sql'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f'Passages: {len(passage_id_map)}')
print(f'Word update groups: {len(pw)}')
print(f'Output saved: {out_path}')