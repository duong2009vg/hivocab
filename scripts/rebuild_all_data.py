# scripts/rebuild_all_data.py
# Rebuilds and synchronizes all data for:
# 1. 10 Predicted Exams (thpt-exam-dev-01 to dev-10) with 100% accurate passage sections, paragraphs, and question stems.
# 2. 29 Chuyên đề with separated passages and clean question stems.

import json
import re
import os
import copy

def rebuild_10_exams():
    print("=== Processing 10 Predicted Exams ===")
    json_path = 'data/seed_data_tn_thpt/Phan_3_Bo_10_De_Thi_THPT_HiVocab/Phan_3_Bo_10_De_Thi_THPT/hivocab_tn_thpt_10_de_thi.json'
    with open(json_path, 'r', encoding='utf-8') as f:
        seed_data = json.load(f)

    cbt_tests = seed_data['cbt_mock_tests']

    section_configs = [
        {
            "part": 1,
            "index": 1,
            "start_q": 1,
            "end_q": 6,
            "type": "reading",
            "name": "Phần 1: Đục lỗ Quảng cáo / Thông báo (Câu 1 - 6)",
            "instruction": "Read the following advertisement and mark the letter A, B, C or D on your answer sheet to indicate the option that best fits each of the numbered blanks from 1 to 6."
        },
        {
            "part": 2,
            "index": 2,
            "start_q": 7,
            "end_q": 12,
            "type": "reading",
            "name": "Phần 2: Đục lỗ Tờ rơi / Leaflet (Câu 7 - 12)",
            "instruction": "Read the following leaflet and mark the letter A, B, C or D on your answer sheet to indicate the option that best fits each of the numbered blanks from 7 to 12."
        },
        {
            "part": 3,
            "index": 3,
            "start_q": 13,
            "end_q": 17,
            "type": "arrangement",
            "name": "Phần 3: Sắp xếp Hội thoại / Lá thư / Đoạn văn (Câu 13 - 17)",
            "instruction": "Mark the letter A, B, C or D on your answer sheet to indicate the best arrangement of utterances or sentences to make a meaningful exchange or text."
        },
        {
            "part": 4,
            "index": 4,
            "start_q": 18,
            "end_q": 22,
            "type": "reading",
            "name": "Phần 4: Đục lỗ Mệnh đề / Hoàn thành câu (Câu 18 - 22)",
            "instruction": "Read the following passage and mark the letter A, B, C or D on your answer sheet to indicate the option that best fits each of the numbered blanks from 18 to 22."
        },
        {
            "part": 5,
            "index": 5,
            "start_q": 23,
            "end_q": 30,
            "type": "reading",
            "name": "Phần 5: Đọc hiểu 8 câu (Câu 23 - 30)",
            "instruction": "Read the following passage and mark the letter A, B, C or D on your answer sheet to indicate the correct answer to each of the questions from 23 to 30."
        },
        {
            "part": 6,
            "index": 6,
            "start_q": 31,
            "end_q": 40,
            "type": "reading",
            "name": "Phần 6: Đọc hiểu 10 câu (Câu 31 - 40)",
            "instruction": "Read the following passage and mark the letter A, B, C or D on your answer sheet to indicate the correct answer to each of the questions from 31 to 40."
        }
    ]

    for t in cbt_tests:
        exam_id = t['id']
        questions = t['questions']

        # Map questions by number
        q_map = {q['number']: q for q in questions}

        # Build clean sections with exact paragraphs
        sections = []
        for cfg in section_configs:
            sec = copy.deepcopy(cfg)
            sec['from_question'] = sec['start_q']
            sec['to_question'] = sec['end_q']

            # Find questions in this section
            sec_qs = [q_map[n] for n in range(sec['start_q'], sec['end_q'] + 1) if n in q_map]
            first_q = sec_qs[0] if sec_qs else {}

            if sec['type'] == 'arrangement':
                sec['paragraphs'] = []
                sec['passage'] = ''
                sec['raw_text'] = ''
                sec['title'] = 'Sắp xếp Hội thoại / Lá thư / Đoạn văn'
            else:
                raw_passage = first_q.get('passage') or first_q.get('context_passage') or ''
                # Split raw passage into clean paragraphs
                lines = [line.strip() for line in raw_passage.split('\n') if line.strip()]
                sec['paragraphs'] = lines
                sec['passage'] = '\n\n'.join(lines)
                sec['raw_text'] = '\n\n'.join(lines)
                sec['title'] = (first_q.get('passage_title') or '').strip()

            sections.append(sec)

        t['sections'] = sections

        # Update each question with passage info
        for q in questions:
            num = q['number']
            q['question_number'] = num
            # Find matching section
            for s in sections:
                if s['start_q'] <= num <= s['end_q']:
                    q['part'] = s['part']
                    q['section_index'] = s['index']
                    q['group'] = s['name']
                    if s['type'] != 'arrangement':
                        q['passage'] = s['passage']
                        q['context_passage'] = s['passage']
                        q['passage_title'] = s.get('title', '')
                        q['passage_instruction'] = s.get('instruction', '')
                    else:
                        q['is_arrangement'] = True
                        q['passage_instruction'] = s.get('instruction', '')
                    break

    # Save updated seed json
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(seed_data, f, ensure_ascii=False, indent=2)
    print("Updated seed 10 de thi json.")

    # Update public/data/thpt_exams.json
    pub_exams_path = 'public/data/thpt_exams.json'
    with open(pub_exams_path, 'r', encoding='utf-8') as f:
        all_exams = json.load(f)

    # Replace or append the 10 predicted exams in all_exams
    cbt_dict = {t['id']: t for t in cbt_tests}
    updated_all_exams = []
    dev_ids_seen = set()

    for ex in all_exams:
        if ex['id'] in cbt_dict:
            updated_all_exams.append(cbt_dict[ex['id']])
            dev_ids_seen.add(ex['id'])
        else:
            updated_all_exams.append(ex)

    for ex_id, t in cbt_dict.items():
        if ex_id not in dev_ids_seen:
            updated_all_exams.append(t)

    with open(pub_exams_path, 'w', encoding='utf-8') as f:
        json.dump(updated_all_exams, f, ensure_ascii=False, indent=2)
    print(f"Updated {pub_exams_path} with {len(updated_all_exams)} total exams.")

def rebuild_29_chuyen_de():
    print("=== Processing 29 Chuyên đề Questions ===")
    pub_qs_path = 'public/data/hivocab_29_chuyen_de_questions.json'
    with open(pub_qs_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    separated_count = 0
    arrangement_count = 0

    for q in questions:
        raw_prompt = q.get('prompt', '').strip()
        
        # Check if prompt contains arrangement sentences
        if re.search(r'\n[a-e]\.\s+', raw_prompt) or (raw_prompt.startswith('Question') and '\na. ' in raw_prompt):
            lines = [l.strip() for l in raw_prompt.split('\n') if l.strip()]
            stem = lines[0]
            arr_sentences = [l for l in lines[1:] if re.match(r'^[a-e]\.\s+', l)]
            
            # Clean stem
            clean_stem = re.sub(r'^Question\s+\d+:\s*', '', stem).strip()
            if not clean_stem or len(clean_stem) < 15:
                clean_stem = "Mark the letter A, B, C or D to indicate the best arrangement of utterances or sentences to make a meaningful exchange or text."
            
            q['prompt'] = clean_stem
            q['is_arrangement'] = True
            q['arrangement_sentences'] = arr_sentences
            q['passage'] = None
            arrangement_count += 1
            separated_count += 1
            continue

        # Check if prompt contains passage + Question X: ...
        # Look for the last line starting with Question X: or Mark the letter...
        lines = [l.strip() for l in raw_prompt.split('\n') if l.strip()]
        if len(lines) > 1:
            last_line = lines[-1]
            # Match question stem at the end
            m = re.match(r'^(?:Question\s+\d+[:\.]\s*)?(Mark the letter.*|Which of the following.*|In which paragraph.*|Where in paragraph.*|The word.*|The phrase.*|According to.*|It can be inferred.*|Why.*|What.*|How.*|Phát biểu nào.*|Từ.*)', last_line, re.I)
            if m:
                clean_prompt = last_line
                passage_lines = lines[:-1]
                q['passage'] = '\n\n'.join(passage_lines)
                q['prompt'] = clean_prompt
                separated_count += 1
            elif len(lines) >= 3 and ('【' in lines[0] or 'ANNOUNCEMENT' in lines[0] or 'ADVERTISEMENT' in lines[0] or 'Adapted from' in raw_prompt or '(1) _______' in raw_prompt):
                clean_prompt = last_line
                passage_lines = lines[:-1]
                q['passage'] = '\n\n'.join(passage_lines)
                q['prompt'] = clean_prompt
                separated_count += 1
            else:
                # Standalone multi-line sentence
                q['passage'] = None
        else:
            q['passage'] = None

    print(f"Separated passage for {separated_count} questions ({arrangement_count} arrangement questions).")

    # Save to public/data/hivocab_29_chuyen_de_questions.json
    with open(pub_qs_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    print("Saved updated public/data/hivocab_29_chuyen_de_questions.json.")

    # Also update data/seed_data_tn_thpt/Phan_2_29_Chuyen_De_Hoc_Tap_THPT_HiVocab/Phan_2_29_Chuyen_De_Hoc_Tap/hivocab_tn_thpt_29_chuyen_de.json
    seed_29_path = 'data/seed_data_tn_thpt/Phan_2_29_Chuyen_De_Hoc_Tap_THPT_HiVocab/Phan_2_29_Chuyen_De_Hoc_Tap/hivocab_tn_thpt_29_chuyen_de.json'
    if os.path.exists(seed_29_path):
        with open(seed_29_path, 'r', encoding='utf-8') as f:
            seed_29 = json.load(f)
        seed_29['exercise_questions_table_rows'] = questions
        with open(seed_29_path, 'w', encoding='utf-8') as f:
            json.dump(seed_29, f, ensure_ascii=False, indent=2)
        print("Synchronized seed 29 chuyen de json.")

if __name__ == '__main__':
    rebuild_10_exams()
    rebuild_29_chuyen_de()
    print("All datasets rebuilt successfully!")
