# scripts/rebuild_all_10_exams_flawless.py
import docx
import re
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

DOCX_PATH = r'data\seed_data_tn_thpt\Cac-dang-bai-tap-Tieng-Anh-on-thi-TN-THPT.docx'
EXAMS_JSON_PATH = r'public\data\thpt_exams.json'

doc = docx.Document(DOCX_PATH)

def format_run(r):
    t = r.text
    if not t:
        return ""
    lm = re.match(r'^(\s*)', t)
    rm = re.search(r'(\s*)$', t)
    l_ws = lm.group(1) if lm else ""
    r_ws = rm.group(1) if rm else ""
    core = t[len(l_ws):len(t)-len(r_ws)] if len(t) >= len(l_ws) + len(r_ws) else ""
    if not core:
        return t
    if re.match(r'^\(\s*\d+\s*\)$', core) or re.match(r'^\[\s*(?:I{1,3}|IV|V)\s*\]$', core):
        return t
    is_b = bool(r.bold)
    is_u = bool(r.underline)
    if is_b and is_u:
        return f"{l_ws}**{{{{U}}}}{core}{{{{/U}}}}**{r_ws}"
    elif is_b:
        return f"{l_ws}**{core}**{r_ws}"
    elif is_u:
        return f"{l_ws}{{{{U}}}}{core}{{{{/U}}}}{r_ws}"
    return t

def get_p_fmt(p):
    return "".join(format_run(r) for r in p.runs).strip()

def parse_options_and_answer(p_list, fallback_ans=None):
    full_text = '\n'.join(p.text for p in p_list)
    hi_letter = None
    for p in p_list:
        for r in p.runs:
            if r.font.highlight_color:
                t = p.text
                pos = t.find(r.text)
                sub = t[:pos + len(r.text)] if pos >= 0 else t
                m = re.findall(r'([A-D])\.', sub)
                if m:
                    hi_letter = m[-1]
                    break
        if hi_letter:
            break
            
    options = {}
    opt_matches = list(re.finditer(r'([A-D])\.\s*([\s\S]*?)(?=(?:[A-D]\.|\Z))', full_text))
    for m in opt_matches:
        let = m.group(1)
        val = m.group(2).strip()
        val = re.sub(r'[\t\n\r]+', ' ', val)
        val = re.sub(r'\s+', ' ', val).strip()
        if let not in options and val:
            options[let] = val
    return options, (hi_letter or fallback_ans)

def extract_arrangement(p_list):
    sentences = []
    context_lines = []
    for p in p_list:
        lines = p.text.split('\n')
        for line in lines:
            line_str = line.strip()
            if not line_str: continue
            if re.match(r'^Question\s+\d+\b', line_str, re.I):
                continue
            if re.search(r'^[A-D]\.\s+', line_str):
                continue
            if re.search(r'\(Adapted\s+from', line_str, re.I):
                continue
            m = re.match(r'^([a-f])[\.\)]\s*(.*)$', line_str, re.I)
            if m:
                sentences.append({'letter': m.group(1).lower(), 'text': m.group(2).strip()})
            elif not sentences:
                context_lines.append(line_str)
    return sentences, '\n'.join(context_lines).strip()

exam_ranges = [
    (1, 7911, 8022),
    (2, 8022, 8127),
    (3, 8127, 8235),
    (4, 8235, 8337),
    (5, 8337, 8476),
    (6, 8476, 8598),
    (7, 8598, 8720),
    (8, 8720, 8840),
    (9, 8840, 8978),
    (10, 8978, 9108)
]

with open(EXAMS_JSON_PATH, 'r', encoding='utf-8') as f:
    all_exams = json.load(f)

for ex_num, p_start, p_end in exam_ranges:
    exam_id = f"thpt-exam-dev-{ex_num:02d}"
    print(f"\n=======================================================")
    print(f"Processing {exam_id} (paras {p_start}-{p_end})...")
    
    existing_exam = next((e for e in all_exams if e['id'] == exam_id), None)
    if not existing_exam:
        print(f"Error: {exam_id} not found in json!")
        continue

    # 1. Identify Anchor paragraphs
    p1_inst = None
    q1_idx = None
    p2_inst = None
    q7_idx = None
    q13_idx = None
    p4_inst = None
    q18_idx = None
    p5_inst = None
    q23_idx = None
    p6_inst = None
    q31_idx = None
    
    # Also record all question starting paragraph indices
    q_start_indices = {}
    
    for pi in range(p_start, p_end):
        raw = doc.paragraphs[pi].text.strip()
        if not raw:
            continue
        
        # Check question numbers
        q_matches = re.finditer(r'Question\s+(\d+)\b', raw, re.I)
        for qm in q_matches:
            qn = int(qm.group(1))
            if qn not in q_start_indices:
                q_start_indices[qn] = pi
        
        # Anchor checks
        if re.search(r'Read the following advertisement', raw, re.I) and not p1_inst:
            p1_inst = pi
        elif re.search(r'Read the following (?:leaflet|article)', raw, re.I) and not p2_inst:
            p2_inst = pi
        elif re.search(r'Read the following passage', raw, re.I):
            if 13 in q_start_indices and 18 not in q_start_indices and not p4_inst:
                p4_inst = pi
            elif 18 in q_start_indices and 23 not in q_start_indices and not p5_inst:
                p5_inst = pi
            elif 23 in q_start_indices and 31 not in q_start_indices and not p6_inst:
                p6_inst = pi

    q1_idx = q_start_indices.get(1)
    q7_idx = q_start_indices.get(7)
    q13_idx = q_start_indices.get(13)
    q18_idx = q_start_indices.get(18)
    q23_idx = q_start_indices.get(23)
    q31_idx = q_start_indices.get(31)

    print(f"  Anchors: p1={p1_inst}, q1={q1_idx}, p2={p2_inst}, q7={q7_idx}, q13={q13_idx}, p4={p4_inst}, q18={q18_idx}, p5={p5_inst}, q23={q23_idx}, p6={p6_inst}, q31={q31_idx}")

    def extract_passage_data(inst_idx, first_q_idx):
        if not inst_idx or not first_q_idx or first_q_idx <= inst_idx:
            return "", "", []
        instruction = doc.paragraphs[inst_idx].text.strip()
        paras = []
        title = ""
        for p_i in range(inst_idx + 1, first_q_idx):
            fmt_p = get_p_fmt(doc.paragraphs[p_i])
            raw_p = doc.paragraphs[p_i].text.strip()
            if not raw_p:
                continue
            # Detect title if short, uppercase or has emojis or starts with known header
            if not title and len(paras) == 0 and (len(raw_p) < 80 and (raw_p.isupper() or any(emoji in raw_p for emoji in ['🚴', '🚀', '📢', '🏡', '🖼', '🏝', '🔘', '🚌', '✈', '🏵', '🌟', '💥', '💡']) or raw_p.startswith('CAREER') or raw_p.startswith('CYCLING') or raw_p.startswith('NO MORE') or raw_p.startswith('THE FUTURE'))):
                clean_t = re.sub(r'[\*\#\_]|🚴|🚀|📢|🏡|🖼|🏝|🔘|🚌|✈|🏵|🌟|💥|💡', '', raw_p).strip()
                title = clean_t
                continue
            paras.append(fmt_p)
        full_text = "\n\n".join(paras)
        return instruction, title, paras, full_text

    inst_1, title_1, paras_1, passage_1 = extract_passage_data(p1_inst, q1_idx)
    inst_2, title_2, paras_2, passage_2 = extract_passage_data(p2_inst, q7_idx)
    inst_4, title_4, paras_4, passage_4 = extract_passage_data(p4_inst, q18_idx)
    inst_5, title_5, paras_5, passage_5 = extract_passage_data(p5_inst, q23_idx)
    inst_6, title_6, paras_6, passage_6 = extract_passage_data(p6_inst, q31_idx)

    # 2. Build 6 Sections
    sec_1 = {
        "index": 1,
        "part": 1,
        "startQ": 1,
        "endQ": 6,
        "start_q": 1,
        "end_q": 6,
        "from_question": 1,
        "to_question": 6,
        "type": "reading",
        "name": "Phần 1: Đục lỗ Quảng cáo / Thông báo (Câu 1 - 6)",
        "title": title_1 or "Đục lỗ Quảng cáo / Thông báo",
        "instruction": inst_1 or "Read the following advertisement and mark the letter A, B, C or D on your answer sheet to indicate the option that best fits each of the numbered blanks from 1 to 6.",
        "paragraphs": paras_1,
        "passage": passage_1,
        "raw_text": passage_1
    }

    sec_2 = {
        "index": 2,
        "part": 2,
        "startQ": 7,
        "endQ": 12,
        "start_q": 7,
        "end_q": 12,
        "from_question": 7,
        "to_question": 12,
        "type": "reading",
        "name": "Phần 2: Đục lỗ Tờ rơi / Leaflet (Câu 7 - 12)",
        "title": title_2 or "Đục lỗ Tờ rơi / Leaflet",
        "instruction": inst_2 or "Read the following leaflet and mark the letter A, B, C or D on your answer sheet to indicate the option that best fits each of the numbered blanks from 7 to 12.",
        "paragraphs": paras_2,
        "passage": passage_2,
        "raw_text": passage_2
    }

    sec_3 = {
        "index": 3,
        "part": 3,
        "startQ": 13,
        "endQ": 17,
        "start_q": 13,
        "end_q": 17,
        "from_question": 13,
        "to_question": 17,
        "type": "arrangement",
        "name": "Phần 3: Sắp xếp Hội thoại / Lá thư / Đoạn văn (Câu 13 - 17)",
        "title": "Sắp xếp đoạn văn / lá thư",
        "instruction": "Mark the letter A, B, C, or D on your answer sheet to indicate the correct arrangement of the sentences to make a meaningful text.",
        "paragraphs": [],
        "passage": "",
        "raw_text": ""
    }

    sec_4 = {
        "index": 4,
        "part": 4,
        "startQ": 18,
        "endQ": 22,
        "start_q": 18,
        "end_q": 22,
        "from_question": 18,
        "to_question": 22,
        "type": "reading",
        "name": "Phần 4: Đục lỗ Mệnh đề / Hoàn thành câu (Câu 18 - 22)",
        "title": title_4 or "Đục lỗ Mệnh đề / Hoàn thành câu",
        "instruction": inst_4 or "Read the following passage and mark the letter A, B, C or D on your answer sheet to indicate the option that best fits each of the numbered blanks from 18 to 22.",
        "paragraphs": paras_4,
        "passage": passage_4,
        "raw_text": passage_4
    }

    sec_5 = {
        "index": 5,
        "part": 5,
        "startQ": 23,
        "endQ": 30,
        "start_q": 23,
        "end_q": 30,
        "from_question": 23,
        "to_question": 30,
        "type": "reading",
        "name": "Phần 5: Đọc hiểu 8 câu (Câu 23 - 30)",
        "title": title_5 or "Đọc hiểu 8 câu",
        "instruction": inst_5 or "Read the following passage and mark the letter A, B, C or D on your answer sheet to indicate the correct answer to each of the questions from 23 to 30.",
        "paragraphs": paras_5,
        "passage": passage_5,
        "raw_text": passage_5
    }

    sec_6 = {
        "index": 6,
        "part": 6,
        "startQ": 31,
        "endQ": 40,
        "start_q": 31,
        "end_q": 40,
        "from_question": 31,
        "to_question": 40,
        "type": "reading",
        "name": "Phần 6: Đọc hiểu 10 câu (Câu 31 - 40)",
        "title": title_6 or "Đọc hiểu 10 câu",
        "instruction": inst_6 or "Read the following passage and mark the letter A, B, C or D on your answer sheet to indicate the correct answer to each of the questions from 31 to 40.",
        "paragraphs": paras_6,
        "passage": passage_6,
        "raw_text": passage_6
    }

    new_sections = [sec_1, sec_2, sec_3, sec_4, sec_5, sec_6]
    existing_exam['sections'] = new_sections

    # 3. Parse all 40 questions
    existing_q_map = {q.get('number') or q.get('question_number'): q for q in existing_exam.get('questions', [])}
    sorted_q_nums = sorted(list(q_start_indices.keys()))

    new_questions = []
    for q_idx, q_num in enumerate(range(1, 41)):
        exist_q = existing_q_map.get(q_num, {})
        pi = q_start_indices.get(q_num)
        
        # Determine paragraph slice for this question
        if pi:
            next_q_starts = [idx for k, idx in q_start_indices.items() if idx > pi]
            next_pi = min(next_q_starts) if next_q_starts else p_end
            p_group = [doc.paragraphs[x] for x in range(pi, next_pi)]
        else:
            p_group = []

        # Parse options & answer
        opts, ans = parse_options_and_answer(p_group, fallback_ans=exist_q.get('correct_answer'))
        # Merge options with existing if missing
        if len(opts) < 4 and exist_q.get('options'):
            for let in ['A', 'B', 'C', 'D']:
                if let not in opts and let in exist_q['options']:
                    opts[let] = exist_q['options'][let]
        ans = ans or exist_q.get('correct_answer') or 'A'

        # Determine prompt
        if q_num in range(1, 7):
            prompt = f"Mark the letter A, B, C, or D on your answer sheet to indicate the option that best fits blank ({q_num})."
            sec_idx = 1
            sec_obj = sec_1
        elif q_num in range(7, 13):
            prompt = f"Mark the letter A, B, C, or D on your answer sheet to indicate the option that best fits blank ({q_num})."
            sec_idx = 2
            sec_obj = sec_2
        elif q_num in range(13, 18):
            prompt = "Mark the letter A, B, C, or D on your answer sheet to indicate the correct arrangement of the sentences to make a meaningful text."
            sec_idx = 3
            sec_obj = sec_3
        elif q_num in range(18, 23):
            prompt = f"Mark the letter A, B, C, or D on your answer sheet to indicate the option that best fits blank ({q_num})."
            sec_idx = 4
            sec_obj = sec_4
        elif q_num in range(23, 31):
            sec_idx = 5
            sec_obj = sec_5
            # Extract formatted stem from DOCX
            if pi:
                fmt_first = get_p_fmt(doc.paragraphs[pi])
                first_line = fmt_first.split('\n')[0].strip()
                stem = re.sub(r'^\*{0,2}\s*Question\s+\d+\s*:\s*\*{0,2}\s*', '', first_line, flags=re.I).strip()
                # If stem contains option labels, cut before option A
                opt_m = re.search(r'\s+\*?\*?[A-D]\.\*?\*?\s+', stem)
                if opt_m:
                    stem = stem[:opt_m.start()].strip()
                prompt = stem or exist_q.get('prompt') or f"Question {q_num}"
            else:
                prompt = exist_q.get('prompt') or f"Question {q_num}"
        else: # 31 to 40
            sec_idx = 6
            sec_obj = sec_6
            if pi:
                fmt_first = get_p_fmt(doc.paragraphs[pi])
                first_line = fmt_first.split('\n')[0].strip()
                stem = re.sub(r'^\*{0,2}\s*Question\s+\d+\s*:\s*\*{0,2}\s*', '', first_line, flags=re.I).strip()
                opt_m = re.search(r'\s+\*?\*?[A-D]\.\*?\*?\s+', stem)
                if opt_m:
                    stem = stem[:opt_m.start()].strip()
                prompt = stem or exist_q.get('prompt') or f"Question {q_num}"
            else:
                prompt = exist_q.get('prompt') or f"Question {q_num}"

        # Arrangement handling
        is_arr = (q_num in range(13, 18))
        arr_sentences, arr_context = ([], "")
        if is_arr:
            arr_sentences, arr_context = extract_arrangement(p_group)
            if not arr_sentences and exist_q.get('arrangement_sentences'):
                arr_sentences = exist_q['arrangement_sentences']
            if not arr_context and exist_q.get('arrangement_context'):
                arr_context = exist_q['arrangement_context']

        # Explanation
        opt_val = opts.get(ans, '')
        explanation = exist_q.get('explanation') or f"Đáp án đúng là {ans} ({opt_val}). Dựa vào nội dung bài đọc và cấu trúc ngữ pháp tương ứng."

        q_item = {
            "id": f"{exam_id}-q{q_num:02d}",
            "number": q_num,
            "question_number": q_num,
            "part": sec_obj["part"],
            "section_index": sec_idx,
            "group": sec_obj["name"],
            "prompt": prompt,
            "question_stem": prompt,
            "options": opts,
            "correct_answer": ans,
            "explanation": explanation,
            "passage": sec_obj["passage"],
            "context_passage": sec_obj["passage"],
            "passage_title": sec_obj["title"],
            "passage_instruction": sec_obj["instruction"],
            "is_arrangement": is_arr,
            "arrangement_sentences": arr_sentences,
            "arrangement_context": arr_context,
            "question_type": "sentence_arrangement" if is_arr else "reading_comprehension"
        }
        new_questions.append(q_item)

    existing_exam['questions'] = new_questions
    print(f"  Processed {len(new_sections)} sections, {len(new_questions)} questions. Q31 ans={new_questions[30]['correct_answer']}, Q32 ans={new_questions[31]['correct_answer']}, Q34 ans={new_questions[33]['correct_answer']}")
    if ex_num == 5:
        print(f"  Sample De 05 Q31 prompt: {new_questions[30]['prompt']}")
        print(f"  Sample De 05 Q32 prompt: {new_questions[31]['prompt']}")
        print(f"  Sample De 05 Q34 prompt: {new_questions[33]['prompt']}")

# Write to file
with open(EXAMS_JSON_PATH, 'w', encoding='utf-8') as f:
    json.dump(all_exams, f, ensure_ascii=False, indent=2)

print("\nSUCCESS! Successfully rebuilt all 10 predicted exams in public/data/thpt_exams.json!")
