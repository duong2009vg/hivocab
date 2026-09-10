import json
import os

filepath = 'data/thpt_exams.json'
with open(filepath, 'r', encoding='utf-8') as f:
    exams = json.load(f)

print(f"Total exams: {len(exams)}")

# Check raw_text vs paragraphs
for e_idx, exam in enumerate(exams):
    for s_idx, sec in enumerate(exam.get('sections', [])):
        raw = sec.get('raw_text', '').strip()
        paras = sec.get('paragraphs', [])
        paras_text = "\n".join(paras).strip()
        
        # If raw has more text than paras (like missing leading paragraphs before bullet points)
        if raw and len(raw) > len(paras_text) + 50:
            # Let's split raw by lines/paragraphs
            lines = [l.strip() for l in raw.split('\n') if l.strip()]
            # Filter out instruction if already present in sec['instruction']
            instr = sec.get('instruction', '').strip()
            title = sec.get('title', '').strip()
            
            clean_paras = []
            for l in lines:
                if instr and (l == instr or instr.startswith(l[:40])):
                    continue
                if title and l.lower() == title.lower():
                    continue
                clean_paras.append(l)
            
            if clean_paras:
                print(f"Exam {e_idx+1} Part {sec.get('part')}: updated paragraphs from raw_text ({len(paras)} -> {len(clean_paras)} lines)")
                sec['paragraphs'] = clean_paras

total_questions_updated = 0
for exam in exams:
    sections = exam.get('sections', [])
    questions = exam.get('questions', [])
    
    # Map section to questions
    for sec in sections:
        start_q = sec.get('start_q', 1)
        end_q = sec.get('end_q', 40)
        
        # Build full passage text for this section
        paragraphs = sec.get('paragraphs', [])
        raw_text = sec.get('raw_text', '')
        
        if paragraphs:
            passage_text = "\n\n".join(paragraphs)
        elif raw_text:
            passage_text = raw_text
        else:
            passage_text = ""
            
        for q in questions:
            q_num = q.get('number', 0)
            if start_q <= q_num <= end_q:
                q['passage'] = passage_text
                q['passage_title'] = sec.get('title', '')
                q['passage_instruction'] = sec.get('instruction', '')
                q['section_index'] = sec.get('part', 1)
                total_questions_updated += 1

print(f"Updated {total_questions_updated} questions across {len(exams)} exams with full passage text.")

# Save enriched json
with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(exams, f, ensure_ascii=False, indent=2)

print("Saved enriched data/thpt_exams.json successfully!")
