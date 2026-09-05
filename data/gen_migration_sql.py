import sys, io, openpyxl, uuid as uuidlib
from collections import defaultdict

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

EXCEL_PATH = r'C:\Users\MY PC\Documents\GitHub\hivocab\data\cam_10_21_vocabulary.xlsx'
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
excel_data = {}
for row in ws.iter_rows(min_row=2, values_only=True):
    d = dict(zip(hdrs, row))
    book, test, passage, word = d.get('Book',''), d.get('Test',''), d.get('Passage',''), d.get('Word','')
    if not all([book, test, passage, word]) or book not in TOPIC_MAP: continue
    excel_data.setdefault(book,{}).setdefault(test,{}).setdefault(passage, {'title':d.get('Passage Title',''),'topic_label':d.get('Passage Topic',''),'words':[]})
    excel_data[book][test][passage]['words'].append(str(word).strip().lower())
wb.close()
print(f'Read: {len(excel_data)} books, {sum(len(t) for t in excel_data.values())} tests, {sum(len(p) for t in excel_data.values() for p in t.values())} passages')

lines = ['-- AUTO-GENERATED: CAM passage migration', '-- Tests']
test_id_map = {}
for book in sorted(excel_data):
    tid = TOPIC_MAP[book]
    for tname in sorted(excel_data[book]):
        tord = int(tname.split()[-1]) if tname.split()[-1].isdigit() else 0
        new_id = str(uuidlib.uuid4())
        test_id_map[(book, tname)] = new_id
        lines.append(f"INSERT INTO public.tests (id, topic_id, name, test_order) VALUES ('{new_id}', '{tid}', '{tname}', {tord}) ON CONFLICT DO NOTHING;")

lines.append('-- Passages')
passage_id_map = {}
for book in sorted(excel_data):
    tid = TOPIC_MAP[book]
    for tname in sorted(excel_data[book]):
        test_id = test_id_map.get((book, tname))
        if not test_id: continue
        for pname in sorted(excel_data[book][tname]):
            pdata = excel_data[book][tname][pname]
            pnum = int(pname.split()[-1]) if pname.split()[-1].isdigit() else 0
            new_id = str(uuidlib.uuid4())
            passage_id_map[(book, tname, pname)] = (new_id, tid, test_id)
            title_esc = str(pdata['title']).replace("'","''") if pdata['title'] else ''
            topic_esc = str(pdata['topic_label']).replace("'","''") if pdata['topic_label'] else ''
            lines.append(f"INSERT INTO public.passages (id, test_id, topic_id, passage_number, title, topic_label) VALUES ('{new_id}', '{test_id}', '{tid}', {pnum}, '{title_esc}', '{topic_esc}') ON CONFLICT DO NOTHING;")

lines.append('-- Update words.passage_id')
w2p = {}
for book, tests in excel_data.items():
    tid = TOPIC_MAP.get(book)
    if not tid: continue
    for tname, passages in tests.items():
        for pname, pdata in passages.items():
            pid_info = passage_id_map.get((book, tname, pname))
            if not pid_info: continue
            pid = pid_info[0]
            for word in pdata['words']:
                if (tid, tname, word) not in w2p:
                    w2p[(tid, tname, word)] = pid

pw = defaultdict(lambda: {'pid':None,'tid':None,'tname':None,'words':[]})
for (tid, tname, word), pid in w2p.items():
    k = (pid, tid, tname)
    pw[k]['pid'] = pid
    pw[k]['tid'] = tid
    pw[k]['tname'] = tname
    pw[k]['words'].append(word.replace("'","''"))

for (pid, tid, tname), info in pw.items():
    wl = ', '.join(f"'{w}'" for w in info['words'])
    lines.append(f"UPDATE public.words SET passage_id = '{pid}' WHERE topic_id = '{tid}' AND lesson_name = '{tname}' AND LOWER(TRIM(word)) IN ({wl});")
    fw_set = list(set(w.split()[0] for w in info['words'] if w.split()))
    if fw_set:
        fwl = ', '.join(f"'{fw}'" for fw in fw_set)
        lines.append(f"UPDATE public.words SET passage_id = '{pid}' WHERE passage_id IS NULL AND topic_id = '{tid}' AND lesson_name = '{tname}' AND LOWER(TRIM(word)) IN ({fwl});")

out_path = r'C:\Users\MY PC\Documents\GitHub\hivocab\data\cam_passages_migration.sql'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f'Tests SQL: {len(test_id_map)}')
print(f'Passages SQL: {len(passage_id_map)}')
print(f'Word update groups: {len(pw)}')
print(f'Output: {out_path}')