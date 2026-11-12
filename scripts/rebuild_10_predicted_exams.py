# scripts/rebuild_10_predicted_exams.py
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

def get_paragraph_formatted(p):
    return "".join(format_run(r) for r in p.runs).strip()

# Exam boundary detection
exam_starts = []
for i in range(3340, 4540):
    t = doc.paragraphs[i].text.strip()
    m = re.search(r'ĐỀ\s+PHÁT\s+TRIỂN\s+MINH\s+HOẠ\s+SỐ\s+(\d+)', t, re.I)
    if m:
        exam_starts.append((int(m.group(1)), i))

exam_starts.sort()

# Load existing thpt_exams.json
with open(EXAMS_JSON_PATH, 'r', encoding='utf-8') as f:
    all_exams = json.load(f)

for idx, (ex_num, p_start) in enumerate(exam_starts):
    p_end = exam_starts[idx + 1][1] if idx + 1 < len(exam_starts) else 4538
    exam_id = f"thpt-exam-dev-{ex_num:02d}"
    print(f"\nProcessing {exam_id} (paras {p_start}-{p_end})...")
    
    existing_exam = next((e for e in all_exams if e['id'] == exam_id), None)
    if not existing_exam:
        print(f"Warning: {exam_id} not found in json!")
        continue
    
    # Identify anchor paragraph indexes for 6 parts
    # Part 1: start at p_start, ends before Part 2
    # Find markers:
    # Part 1 instruction: 'Read the following advertisement'
    # Q1: 'Question 1:'
    # Part 2 instruction: 'Read the following leaflet' / 'article'
    # Q7: 'Question 7:'
    # Part 3: 'Question 13:'
    # Part 4 instruction: 'Read the following passage' (before Q18)
    # Q18: 'Question 18:'
    # Part 5 instruction: 'Read the following passage' (before Q23)
    # Q23: 'Question 23:'
    # Part 6 instruction: 'Read the following passage' (before Q31)
    # Q31: 'Question 31:'
    
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
    
    for pi in range(p_start, p_end):
        raw = doc.paragraphs[pi].text.strip()
        if not raw:
            continue
        if re.search(r'Read the following advertisement', raw, re.I) and not p1_inst:
            p1_inst = pi
        elif re.search(r'Question\s+1\b', raw, re.I) and not q1_idx:
            q1_idx = pi
        elif re.search(r'Read the following (?:leaflet|article)', raw, re.I) and not p2_inst:
            p2_inst = pi
        elif re.search(r'Question\s+7\b', raw, re.I) and not q7_idx:
            q7_idx = pi
        elif re.search(r'Question\s+13\b', raw, re.I) and not q13_idx:
            q13_idx = pi
        elif re.search(r'Read the following passage', raw, re.I):
            if q13_idx and not q18_idx:
                p4_inst = pi
            elif q18_idx and not q23_idx:
                p5_inst = pi
            elif q23_idx and not q31_idx:
                p6_inst = pi
        elif re.search(r'Question\s+18\b', raw, re.I) and not q18_idx:
            q18_idx = pi
        elif re.search(r'Question\s+23\b', raw, re.I) and not q23_idx:
            q23_idx = pi
        elif re.search(r'Question\s+31\b', raw, re.I) and not q31_idx:
            q31_idx = pi

    print(f"  Anchors: p1_inst={p1_inst}, q1={q1_idx}, p2_inst={p2_inst}, q7={q7_idx}, q13={q13_idx}, p4_inst={p4_inst}, q18={q18_idx}, p5_inst={p5_inst}, q23={q23_idx}, p6_inst={p6_inst}, q31={q31_idx}")

    def extract_passage_data(inst_idx, first_q_idx):
        if not inst_idx or not first_q_idx or first_q_idx <= inst_idx:
            return "", "", []
        instruction = doc.paragraphs[inst_idx].text.strip()
        paras = []
        title = ""
        for p_i in range(inst_idx + 1, first_q_idx):
            fmt_p = get_paragraph_formatted(doc.paragraphs[p_i])
            raw_p = doc.paragraphs[p_i].text.strip()
            if not raw_p:
                continue
            # Check if this paragraph is a title (short, uppercase or wrapped in emojis)
            if not title and len(paras) == 0 and (len(raw_p) < 80 and (raw_p.isupper() or '🚴' in raw_p or '🚀' in raw_p or '📢' in raw_p or raw_p.startswith('CAREER') or raw_p.startswith('CYCLING'))):
                clean_t = re.sub(r'[\*\#\_]|🚴|🚀|📢', '', raw_p).strip()
                title = clean_t
                continue
            paras.append(fmt_p)
        full_text = "\n\n".join(paras)
        return instruction, title, paras, full_text

    # Extract 5 passages (Part 1, 2, 4, 5, 6)
    inst_1, title_1, paras_1, passage_1 = extract_passage_data(p1_inst, q1_idx)
    inst_2, title_2, paras_2, passage_2 = extract_passage_data(p2_inst, q7_idx)
    inst_4, title_4, paras_4, passage_4 = extract_passage_data(p4_inst, q18_idx)
    inst_5, title_5, paras_5, passage_5 = extract_passage_data(p5_inst, q23_idx)
    inst_6, title_6, paras_6, passage_6 = extract_passage_data(p6_inst, q31_idx)

    # Format question prompts where target words are bold/underlined
    # Extract docx prompts for Q23-Q40 (and others)
    q_prompts_map = {}
    cur_q_num = None
    cur_prompt_parts = []
    
    for pi in range(p_start, p_end):
        raw = doc.paragraphs[pi].text.strip()
        qm = re.match(r'^Question\s+(\d+)\s*:\s*(.*)$', raw, re.I)
        if qm:
            if cur_q_num is not None:
                q_prompts_map[cur_q_num] = " ".join(cur_prompt_parts).strip()
            cur_q_num = int(qm.group(1))
            # Format this line
            fmt = get_paragraph_formatted(doc.paragraphs[pi])
            # Remove 'Question X:' prefix
            fmt_no_prefix = re.sub(r'^\*?\*?Question\s+\d+\*?\*?\s*:\s*', '', fmt, flags=re.I).strip()
            # If options A/B/C/D are on the same line, cut before option A
            opt_m = re.search(r'\s+\*?\*?[A-D]\.\*?\*?\s+', fmt_no_prefix)
            if opt_m:
                fmt_no_prefix = fmt_no_prefix[:opt_m.start()].strip()
            cur_prompt_parts = [fmt_no_prefix] if fmt_no_prefix else []
        elif cur_q_num is not None and not re.match(r'^[A-D]\.\s+', raw) and not raw.startswith('Question') and not raw.startswith('Read the following'):
            # Continuation line of prompt (if before options)
            if not any(re.search(r'^[A-D]\.\s+', doc.paragraphs[x].text.strip()) for x in range(pi, min(pi+2, p_end))):
                pass
    if cur_q_num is not None:
        q_prompts_map[cur_q_num] = " ".join(cur_prompt_parts).strip()

    # Rebuild sections
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
        "title": title_1 or "CYCLING TOUR IN CAMBODIA",
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
        "title": title_2 or "CAREER PROSPECTS AND TRENDS IN VIỆT NAM",
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
        "title": title_4,
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
        "title": title_5,
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
        "title": title_6,
        "instruction": inst_6 or "Read the following passage and mark the letter A, B, C or D on your answer sheet to indicate the correct answer to each of the questions from 31 to 40.",
        "paragraphs": paras_6,
        "passage": passage_6,
        "raw_text": passage_6
    }

    new_sections = [sec_1, sec_2, sec_3, sec_4, sec_5, sec_6]
    existing_exam['sections'] = new_sections

    # Now update questions in this exam
    for q in existing_exam.get('questions', []):
        q_num = q.get('number') or q.get('question_number')
        if not q_num:
            continue
        
        # If we have a formatted prompt from docx, apply it
        if q_num in q_prompts_map and q_prompts_map[q_num]:
            fmt_p = q_prompts_map[q_num]
            # If docx prompt has bold/underlines, adopt it
            if '**' in fmt_p or '{{U}}' in fmt_p:
                q['prompt'] = fmt_p
                q['question_stem'] = fmt_p

        # Assign passage and metadata based on section
        if 1 <= q_num <= 6:
            q['passage'] = passage_1
            q['context_passage'] = passage_1
            q['passage_title'] = sec_1['title']
            q['passage_instruction'] = sec_1['instruction']
            q['group'] = sec_1['name']
            q['part'] = 1
        elif 7 <= q_num <= 12:
            q['passage'] = passage_2
            q['context_passage'] = passage_2
            q['passage_title'] = sec_2['title']
            q['passage_instruction'] = sec_2['instruction']
            q['group'] = sec_2['name']
            q['part'] = 2
        elif 13 <= q_num <= 17:
            q['passage'] = ""
            q['context_passage'] = ""
            q['passage_title'] = sec_3['title']
            q['passage_instruction'] = sec_3['instruction']
            q['group'] = sec_3['name']
            q['part'] = 3
        elif 18 <= q_num <= 22:
            q['passage'] = passage_4
            q['context_passage'] = passage_4
            q['passage_title'] = sec_4['title']
            q['passage_instruction'] = sec_4['instruction']
            q['group'] = sec_4['name']
            q['part'] = 4
        elif 23 <= q_num <= 30:
            q['passage'] = passage_5
            q['context_passage'] = passage_5
            q['passage_title'] = sec_5['title']
            q['passage_instruction'] = sec_5['instruction']
            q['group'] = sec_5['name']
            q['part'] = 5
        elif 31 <= q_num <= 40:
            q['passage'] = passage_6
            q['context_passage'] = passage_6
            q['passage_title'] = sec_6['title']
            q['passage_instruction'] = sec_6['instruction']
            q['group'] = sec_6['name']
            q['part'] = 6

    # Verify counts
    bold_tokens = sum(s['passage'].count('**') for s in new_sections)
    u_tokens = sum(s['passage'].count('{{U}}') for s in new_sections)
    print(f"  Result {exam_id}: 6 sections rebuilt. Passages contain {bold_tokens} bold markers, {u_tokens} underline markers.")

# Save updated thpt_exams.json
with open(EXAMS_JSON_PATH, 'w', encoding='utf-8') as f:
    json.dump(all_exams, f, ensure_ascii=False, indent=2)

print(f"\nSuccessfully wrote formatted exams to {EXAMS_JSON_PATH}")
