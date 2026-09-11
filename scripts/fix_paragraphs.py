# -*- coding: utf-8 -*-
import json, re, sys, os
sys.stdout.reconfigure(encoding='utf-8')

DATA_FILE = 'data/thpt_exams.json'


def split_on_roman_markers(text):
    parts = re.split(r'(?=\[\s*(?:I{1,3}|IV|V|VI|VII|VIII)\s*\]\.?\s)', text)
    paras = []
    for part in parts:
        p = part.strip()
        if p and len(p) > 20:
            paras.append(p)
    return paras


def split_on_double_newline(text):
    raw_blocks = re.split(r'\n\s*\n', text)
    paras = []
    for rb in raw_blocks:
        lines = [l.strip() for l in rb.split('\n') if l.strip()]
        if not lines:
            continue
        p = ' '.join(lines)
        p = re.sub(r'\s+', ' ', p).strip()
        if p and len(p) > 20:
            paras.append(p)
    return paras


def smart_split_by_lines(text):
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    if len(lines) <= 2:
        return None
    joined_paras = []
    current = []
    for i, line in enumerate(lines):
        current.append(line)
        next_line = lines[i + 1] if i + 1 < len(lines) else None
        if next_line:
            current_text = ' '.join(current)
            ends_sentence = bool(re.search(r'[.!?]\s*$', current_text))
            next_starts_capital = bool(re.match(r'[A-Z\[\u00c0-\u017f]', next_line))
            if ends_sentence and next_starts_capital and len(current_text) > 100:
                joined_paras.append(current_text)
                current = []
    if current:
        joined_paras.append(' '.join(current))
    result = [p for p in joined_paras if len(p) > 20]
    return result if len(result) >= 2 else None


def smart_split_sentences(text, min_para_len=180, max_para_len=600, target_count=5):
    sentence_pattern = r'(?<=[.!?])\s+(?=[A-Z\[a-zA-Z\u00c0-\u017f])'
    sentences = re.split(sentence_pattern, text)
    if len(sentences) <= 2:
        return [text.strip()] if text.strip() else []
    paras = []
    current_para = []
    current_len = 0
    for i, sent in enumerate(sentences):
        sent = sent.strip()
        if not sent:
            continue
        current_para.append(sent)
        current_len += len(sent)
        is_last = (i == len(sentences) - 1)
        if is_last:
            if current_para:
                paras.append(' '.join(current_para))
            break
        next_sent = sentences[i + 1].strip() if i + 1 < len(sentences) else ''
        next_is_marker = bool(re.match(r'\[\s*(?:I{1,3}|IV|V)\s*\]', next_sent))
        remaining_chars = sum(len(s) for s in sentences[i + 1:])
        should_break = False
        if current_len >= max_para_len:
            should_break = True
        elif next_is_marker:
            should_break = True
        elif (current_len >= min_para_len and len(paras) + 1 < target_count
              and remaining_chars > min_para_len and len(current_para) >= 2):
            should_break = True
        if should_break:
            paras.append(' '.join(current_para))
            current_para = []
            current_len = 0
    return [p for p in paras if len(p) > 20]


def reflow_paragraphs_smart(raw_text, section_type='reading', num_questions=8):
    if not raw_text:
        return []
    text = raw_text.strip()
    text = re.sub(
        r'^(?:Read the (?:following|passage).*?\n|.*?answer sheet.*?\n){1,3}',
        '', text, flags=re.IGNORECASE
    ).strip()
    text = re.sub(
        r'^(?:from|from\s+from)\s+\d+\s+to\s+\d+[\.\s]*',
        '', text, flags=re.IGNORECASE
    ).strip()

    has_roman = bool(re.search(r'\[\s*(?:II|III|IV|V)\s*\]', text))
    if has_roman:
        parts = split_on_roman_markers(text)
        if len(parts) >= 2:
            return parts

    has_double_nl = bool(re.search(r'\n\s*\n', text))
    if has_double_nl:
        parts = split_on_double_newline(text)
        if len(parts) >= 2:
            return parts

    by_lines = smart_split_by_lines(text)
    if by_lines and len(by_lines) >= 2:
        return by_lines

    if section_type == 'reading':
        target = max(3, min(6, num_questions // 2))
        min_len, max_len = 150, 550
    elif section_type == 'cloze':
        target, min_len, max_len = 3, 200, 700
    else:
        target, min_len, max_len = 3, 100, 500

    parts = smart_split_sentences(text, min_len, max_len, target)
    if len(parts) >= 2:
        return parts

    return [text] if text else []


def fix_json_paragraphs():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        exams = json.load(f)
    total_fixed = 0
    total_sections = 0
    for ex in exams:
        eid = ex['id']
        for s in ex.get('sections', []):
            stype = s.get('type', 'reading')
            if stype == 'arrangement':
                continue
            total_sections += 1
            raw = s.get('raw_text', '')
            old_paras = s.get('paragraphs', [])
            num_q = (s.get('end_q') or 0) - (s.get('start_q') or 0) + 1
            new_paras = reflow_paragraphs_smart(raw, stype, num_q)
            if len(new_paras) > len(old_paras) or len(old_paras) <= 1:
                s['paragraphs'] = new_paras
                total_fixed += 1
                print(f"  {eid} {stype} Q{s.get('start_q')}-{s.get('end_q')}: "
                      f"{len(old_paras)} -> {len(new_paras)} paras")
    tmp = DATA_FILE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(exams, f, ensure_ascii=False, indent=2)
    os.replace(tmp, DATA_FILE)
    print(f"\n[DONE] Fixed {total_fixed}/{total_sections} sections")
    return total_fixed


if __name__ == '__main__':
    print("=== Fixing paragraph splitting ===")
    fix_json_paragraphs()