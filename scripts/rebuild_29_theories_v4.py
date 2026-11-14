import json
import os
import re
import xml.etree.ElementTree as ET
import zipfile

from collections import Counter

DOCX_PATH = 'data/seed_data_tn_thpt/Cac-dang-bai-tap-Tieng-Anh-on-thi-TN-THPT.docx'
EXERCISES_PATH = 'public/data/hivocab_29_chuyen_de_exercises.json'
QUESTIONS_PATH = 'public/data/hivocab_29_chuyen_de_questions.json'
OUT_PATH = 'public/data/hivocab_29_chuyen_de_ly_thuyet.json'

W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
NS = {'w': W_NS}

# Verified exact boundaries for all 29 chapters in Cac-dang-bai-tap-Tieng-Anh-on-thi-TN-THPT.docx
# Each tuple: (list of (start_idx, end_idx) body slices, exercise_id, title)
CHAPTER_RANGES = [
    ([(4586, 4641)], 'c0000000-0000-0000-0000-000000000001', '1.1. Dạng câu hỏi về Từ loại (Word Formation)'),
    ([(4730, 4762)], 'c0000000-0000-0000-0000-000000000002', '1.2. Dạng câu hỏi về Trật tự từ (Word Order - OSASCOMP)'),
    ([(4805, 4809)], 'c0000000-0000-0000-0000-000000000003', '1.3. Dạng câu hỏi về Lượng từ (Quantifiers)'),
    ([(4890, 4911)], 'c0000000-0000-0000-0000-000000000004', '1.4. Dạng câu hỏi về Liên từ / Từ nối (Conjunctions)'),
    ([(4953, 4964)], 'c0000000-0000-0000-0000-000000000005', '1.5. Dạng câu hỏi về Từ vựng (Vocabulary in Context)'),
    ([(5133, 5164)], 'c0000000-0000-0000-0000-000000000006', '1.6.1. Dạng câu hỏi về Giới từ (Prepositions)'),
    ([(5355, 5384)], 'c0000000-0000-0000-0000-000000000007', '1.6.2. Dạng câu hỏi về Cụm động từ (Phrasal Verbs)'),
    ([(5607, 5621)], 'c0000000-0000-0000-0000-000000000008', '1.6.3. Dạng câu hỏi về Cụm từ cố định (Collocations)'),
    ([(5775, 5783)], 'c0000000-0000-0000-0000-000000000009', '1.6.4. Dạng câu hỏi về Danh động từ & Động từ nguyên mẫu (Gerunds & Infinitives)'),
    ([(5903, 5917)], 'c0000000-0000-0000-0000-000000000010', '1.7. Dạng câu hỏi về Mệnh đề quan hệ & Rút gọn mệnh đề quan hệ'),
    ([(4580, 4586)], 'c0000000-0000-0000-0000-000000000011', 'Ôn tập 1: Tổng hợp Dạng bài Đục lỗ 6 câu'),
    ([(6079, 6120)], 'c0000000-0000-0000-0000-000000000012', '2.1. Dạng câu hỏi về Mệnh đề quan hệ'),
    ([(6144, 6164)], 'c0000000-0000-0000-0000-000000000013', '2.2. Dạng câu hỏi về Cấu trúc câu'),
    ([(6187, 6217)], 'c0000000-0000-0000-0000-000000000014', '2.3. Hiện tại phân từ / Quá khứ phân từ / Phân từ hoàn thành'),
    ([(6242, 6299)], 'c0000000-0000-0000-0000-000000000015', '2.4. Dạng câu hỏi về Nghĩa của câu (Câu đơn, Câu ghép, Câu phức)'),
    ([(6062, 6079)], 'c0000000-0000-0000-0000-000000000016', 'Ôn tập 2: Tổng hợp Dạng bài Đục lỗ 5 câu'),
    ([(6378, 6422)], 'c0000000-0000-0000-0000-000000000017', '3.1. Sắp xếp câu tạo thành Đoạn hội thoại'),
    ([(6485, 6528)], 'c0000000-0000-0000-0000-000000000018', '3.2. Sắp xếp câu tạo thành Lá thư'),
    ([(6676, 6792)], 'c0000000-0000-0000-0000-000000000019', '3.3. Sắp xếp câu tạo thành Đoạn văn'),
    ([(6377, 6381), (6490, 6496), (6677, 6692)], 'c0000000-0000-0000-0000-000000000020', 'Ôn tập 3: Tổng hợp Dạng bài Sắp xếp'),
    ([(7003, 7043)], 'c0000000-0000-0000-0000-000000000021', '4.1. Dạng câu hỏi Tìm mối liên hệ / Quy chiếu (Reference Questions)'),
    ([(7085, 7110), (7152, 7205)], 'c0000000-0000-0000-0000-000000000022', '4.2. Dạng câu hỏi Thông tin chi tiết (Stated Details - TRUE/NOT TRUE)'),
    ([(7259, 7319)], 'c0000000-0000-0000-0000-000000000023', '4.3. Dạng câu hỏi Tìm từ/cụm từ Đồng nghĩa hoặc Trái nghĩa (Closest / Opposite)'),
    ([(7371, 7402)], 'c0000000-0000-0000-0000-000000000024', '4.4. Dạng câu hỏi Diễn giải câu gạch chân (Paraphrase)'),
    ([(7474, 7499)], 'c0000000-0000-0000-0000-000000000025', '4.5. Dạng câu hỏi Tìm vị trí chèn câu vào đoạn văn ([I], [II], [III], [IV])'),
    ([(7562, 7605)], 'c0000000-0000-0000-0000-000000000026', '4.6. Dạng câu hỏi Thông tin nằm ở đoạn văn nào (Paragraph Matching)'),
    ([(7663, 7720)], 'c0000000-0000-0000-0000-000000000027', '4.7. Dạng câu hỏi Tóm tắt ý chính (Summarizing)'),
    ([(7754, 7802)], 'c0000000-0000-0000-0000-000000000028', '4.8. Dạng câu hỏi Suy luận (Inference Questions)'),
    ([(6994, 7003)], 'c0000000-0000-0000-0000-000000000029', 'Ôn tập 4: Tổng hợp Dạng bài Đọc hiểu'),
]

DECORATIVE_CHARS = (
    '📘📌💡🔶🔵🔍📍❌📝❖➤★☞✎✦✅✪➩➡✈✏️🔎📚➽👉🔹🌟🎯🎉✿❀❁❂❃❇❈❉❊❋✔➕✖➖📖🌈⚡🔥🏆🎓🚀🚴📢🥗»'
)
KEYCAP_RE = re.compile(r'[0-9]\ufe0f?\u20e3')
DECORATIVE_RE = re.compile('[' + re.escape(DECORATIVE_CHARS) + ']+')
ARROW_TO_ASCII_RE = re.compile(r'(?:➡️|⟹|⇒|➔|➜|⮕|➩|➡|🡪|➫|➪)')
CIRCLED_NUMS = {'➊': '1.', '➋': '2.', '➌': '3.', '➍': '4.', '➎': '5.'}


def clean_decorative_text(text):
    if not text:
        return ''
    for k, v in CIRCLED_NUMS.items():
        text = text.replace(k, v)
    text = KEYCAP_RE.sub('', text)
    text = DECORATIVE_RE.sub('', text)
    text = ARROW_TO_ASCII_RE.sub('→', text)
    # Remove variation selectors and zero-width space noise (keep \u2003/tabs until line normalization)
    text = text.replace('\ufe0f', '').replace('\u200b', '')
    return text


def get_run_format(r_el):
    rpr = r_el.find(f'{{{W_NS}}}rPr')
    is_bold = False
    is_under = False
    if rpr is not None:
        b_el = rpr.find(f'{{{W_NS}}}b')
        if b_el is not None:
            val = b_el.get(f'{{{W_NS}}}val')
            if val not in ('0', 'false', 'off'):
                is_bold = True
        u_el = rpr.find(f'{{{W_NS}}}u')
        if u_el is not None:
            val = u_el.get(f'{{{W_NS}}}val')
            if val != 'none':
                is_under = True
    return is_bold, is_under


def iter_runs_in_paragraph(node):
    """Yield <w:r> elements recursively inside a paragraph, skipping <w:drawing>, <w:txbxContent>, <w:sdtPr>, <w:del>."""
    for child in node:
        tag = child.tag.split('}')[-1]
        if tag in ('pPr', 'rPr', 'sdtPr', 'txbxContent', 'drawing', 'pict', 'del'):
            continue
        if tag == 'r':
            # Still descend if run itself only wraps non-drawing elements; skip inner drawing inside run via extract
            yield child
        else:
            yield from iter_runs_in_paragraph(child)


def format_run_segment(text, bold, under):
    if not text:
        return ''
    if not (bold or under):
        return text
    # Split leading/trailing whitespace outside markup so ** text ** does not break markdown
    m = re.match(r'^(\s*)(.*?)(\s*)$', text, re.DOTALL)
    if not m or not m.group(2):
        return text
    lead, core, trail = m.group(1), m.group(2), m.group(3)
    # Don't wrap isolated punctuation/symbols unless inside a word/phrase
    if core.strip() in ('', ':', '-', '.', ','):
        return text
    out = core
    if under:
        out = f'{{{{U}}}}{out}{{{{/U}}}}'
    if bold:
        out = f'**{out}**'
    return f'{lead}{out}{trail}'


def extract_single_p_lines(p_el):
    """Extract logical lines from one <w:p> element, preserving bold/underline and line breaks (<w:br/>)."""
    tokens = []  # list of (text_chunk, bold, under)
    for r in iter_runs_in_paragraph(p_el):
        b, u = get_run_format(r)
        for ch in r:
            ctag = ch.tag.split('}')[-1]
            if ctag == 't' and ch.text:
                cleaned_chunk = clean_decorative_text(ch.text)
                if cleaned_chunk:
                    tokens.append((cleaned_chunk, b, u))
            elif ctag in ('br', 'cr'):
                tokens.append(('\n', False, False))
            elif ctag == 'tab':
                tokens.append(('\t', False, False))
            elif ctag == 'noBreakHyphen':
                tokens.append(('-', b, u))

    # Build per-line merged segments so formatting never crosses '\n'
    lines = []
    cur_line_segs = []  # list of [text, b, u]

    def flush_line():
        if not cur_line_segs:
            lines.append('')
            return
        # Merge adjacent segments with identical formatting
        merged = []
        for txt, b, u in cur_line_segs:
            if not txt:
                continue
            if merged and merged[-1][1] == b and merged[-1][2] == u:
                merged[-1][0] += txt
            else:
                merged.append([txt, b, u])
        raw_line = ''.join(format_run_segment(t, b, u) for t, b, u in merged)
        # Clean multiple tabs/em-spaces into delimiter '\t' for option splitting or clean spaces
        raw_line = re.sub(r'[\u2003\t]+', '\t', raw_line)
        raw_line = re.sub(r' {2,}\t', '\t', raw_line)
        raw_line = re.sub(r'\t {2,}', '\t', raw_line)
        raw_line = re.sub(r'\s+$', '', raw_line)
        raw_line = raw_line.strip('\u00a0 ')
        # Collapse excessive inline runs of spaces > 3 into '\t' (used to align options A B C D)
        raw_line = re.sub(r' {4,}', '\t', raw_line)
        raw_line = raw_line.replace('****', '')
        lines.append(raw_line)
        cur_line_segs.clear()

    for txt, b, u in tokens:
        if '\n' in txt:
            parts = txt.split('\n')
            for idx, part in enumerate(parts):
                if part:
                    cur_line_segs.append([part, b, u])
                if idx < len(parts) - 1:
                    flush_line()
        else:
            cur_line_segs.append([txt, b, u])
    flush_line()

    # Expand inline horizontal MCQ options (A. ... B. ... C. ... D. ...) onto separate lines
    expanded = []
    for line in lines:
        s = line.strip()
        if not s:
            continue
        clean_no_md = re.sub(r'\*\*|\{\{/?U\}\}', '', s)
        if re.match(r'^(?:A|C)[\.\):]\s+', clean_no_md) and re.search(r'(?:\t| {2,})(?:\*\*)?[B-D][\.\):]', s):
            opts = re.split(r'(?:\t+| {2,})(?=(?:\*\*)?[B-D][\.\):])', s)
            if len(opts) >= 2:
                for opt in opts:
                    o_clean = opt.replace('\t', ' ').strip()
                    if o_clean:
                        expanded.append(o_clean)
                continue
        expanded.append(re.sub(r'  +', ' ', s.replace('\t', ' ')).strip())
    return expanded


def extract_p_element_lines(p_el):
    """Extract all lines from a top-level <w:p>, including inner paragraphs inside <w:txbxContent>."""
    out = []
    direct = extract_single_p_lines(p_el)
    out.extend(direct)
    for txbx in p_el.findall(f'.//{{{W_NS}}}txbxContent'):
        for inner_p in txbx.findall(f'./{{{W_NS}}}p'):
            out.extend(extract_single_p_lines(inner_p))
    return out


def extract_table_element(tbl_el):
    """Extract table rows from XML <w:tbl>. Returns ('box', lines) for 1x1 box or ('table', rows) for grid tables."""
    rows = []
    for tr in tbl_el.findall(f'./{{{W_NS}}}tr'):
        row_cells = []
        for tc in tr.findall(f'./{{{W_NS}}}tc'):
            cell_lines = []
            for p in tc.findall(f'./{{{W_NS}}}p'):
                cell_lines.extend(extract_p_element_lines(p))
            cell_text = '<br/>'.join(line for line in cell_lines if line)
            row_cells.append(cell_text)
        if any(row_cells):
            rows.append(row_cells)

    if not rows:
        return None

    # 1x1 boxed content -> treat inner paragraphs directly as flow lines!
    if len(rows) == 1 and len(rows[0]) == 1:
        box_lines = [l.strip() for l in rows[0][0].split('<br/>') if l.strip()]
        return ('lines', box_lines)

    # Check if 2+ rows, single column box -> also treat as flow lines
    max_cols = max(len(r) for r in rows)
    if max_cols == 1:
        box_lines = []
        for r in rows:
            box_lines.extend(l.strip() for l in r[0].split('<br/>') if l.strip())
        return ('lines', box_lines)

    padded_rows = [r + [''] * (max_cols - len(r)) for r in rows]
    return ('table', padded_rows)


def strip_all_markup(s):
    s = re.sub(r'\*\*|\{\{/?U\}\}', '', s or '')
    return s.strip()


def format_heading_or_line(line):
    plain = strip_all_markup(line)
    # Strip trailing standalone formatting from structural headers
    if re.match(r'^(\d+\.\d+(?:\.\d+)?\.?|I{1,3}V?\.\s+DẠNG|CHUYÊN ĐỀ|Dạng câu hỏi về|Phần\s+\d+\.\d+)\b', plain):
        return f'### {plain}'
    return line


def is_section_header(plain):
    if len(plain) > 150:
        return False
    if re.match(r'^(\d+\.\d+(?:\.\d+)?\.?|I{1,3}V?\.\s+DẠNG|Phần\s+\d+\.\d+|Dạng câu hỏi về)\b', plain):
        return True
    if re.match(r'^[a-d]\)\s+', plain) and not re.match(r'^[a-d]\.\s+[A-Z]', plain):
        return True
    if re.match(r'^Lưu ý\s*\d*\s*:', plain, re.I):
        return True
    return False


def parse_options_from_lines(lines):
    """Given a list of lines, extract MCQ options A, B, C, D and stem lines before/after."""
    opts = {}
    pre_lines = []
    post_lines = []
    cur_opt = None
    in_opts = False

    for line in lines:
        plain = strip_all_markup(line)
        m = re.match(r'^([A-D])[\.\):]\s*(.+)$', plain)
        if m:
            in_opts = True
            cur_opt = m.group(1).upper()
            # Recover inline markup from original line without the "A. " prefix
            cleaned_val = re.sub(r'^(?:\*\*)?[A-D][\.\):](?:\*\*)?\s*', '', line).strip()
            opts[cur_opt] = cleaned_val
            continue

        if in_opts and cur_opt:
            # Check if this line ends options block (e.g. source note or Lời giải or Tips or Câu X or Ví dụ)
            if (
                plain.startswith('(')
                or re.match(r'^(Lời giải|Hướng dẫn|TIPS|Câu\s+\d+|Question\s+\d+|Ví dụ|->|→)', plain, re.I)
            ):
                in_opts = False
                cur_opt = None
                post_lines.append(line)
            else:
                # Continuation of option (e.g., Vietnamese translation or second line of an option)
                # Keep Vietnamese gloss or continuation separated nicely
                opts[cur_opt] = f"{opts[cur_opt]}\n{line}".strip()
            continue

        if not opts:
            pre_lines.append(line)
        else:
            post_lines.append(line)

    return pre_lines, opts, post_lines


def find_correct_answer(expl_lines):
    full = '\n'.join(strip_all_markup(l) for l in expl_lines)
    patterns = [
        r'Đáp án(?:\s+đúng)?\s*[:\s]\s*(?:là\s*)?([A-D])\b',
        r'Do đó\s*,?\s*(?:ta\s+(?:dễ dàng\s+)?(?:chọn|suy ra)(?:\s+được)?(?:\s+đáp án(?:\s+đúng)?(?:\s+là)?)?)?\s*([A-D])\s+(?:là đáp án|là câu trả lời)',
        r'Do đó\s*,?\s*dễ dàng chọn\s+([A-D])\s+là đáp án',
        r'chọn(?:\s+được)?(?:\s+đáp án(?:\s+đúng)?(?:\s+là)?)?\s*([A-D])\b',
        r'([A-D])\s*\([^)]+\)\s+là đáp án\s+(?:đúng|phù hợp)',
        r'([A-D])\s+là đáp án\s+(?:đúng|phù hợp)',
        r'suy ra đáp án câu này là\s*([A-D])\b',
    ]
    matches = []
    for pat in patterns:
        for m in re.finditer(pat, full, re.I):
            matches.append((m.start(), m.group(1).upper()))
    if matches:
        # Prefer the LAST conclusive answer statement in the explanation
        matches.sort(key=lambda x: x[0])
        return matches[-1][1]
    return ''


def build_single_mcq(label, stem_lines, expl_lines):
    """Build one sub-question object { label, passage, stem, source, options, correctAnswer, explanation }."""
    pre, opts, post = parse_options_from_lines(stem_lines)
    # Extract source note if present in pre or post lines
    sources = []
    clean_lines = []
    for l in pre + post:
        p = strip_all_markup(l)
        if re.match(r'^\((?:Trích|Adapted|Source)', p, re.I):
            s_fixed = l.strip()
            if s_fixed.startswith('(') and not s_fixed.endswith(')'):
                s_fixed += ')'
            sources.append(s_fixed)
        else:
            clean_lines.append(l)

    correct = find_correct_answer(expl_lines)

    # Fallback: if options were inside Lời giải chi tiết (e.g., 4.2 Ví dụ 1), extract them
    if len(opts) < 4 and expl_lines:
        ex_pre, ex_opts, ex_post = parse_options_from_lines(expl_lines)
        if len(ex_opts) == 4:
            opts = ex_opts
            if ex_pre:
                clean_lines.append(ex_pre[-1])
            if not correct:
                correct = find_correct_answer(expl_lines)

    # Separate passage paragraphs from final question stem when multiple paragraphs exist
    q_passage = ''
    q_stem_lines = clean_lines
    if len(clean_lines) >= 2:
        # Find where the question prompt begins near the end
        split_at = None
        for idx in range(len(clean_lines) - 1, 0, -1):
            p = strip_all_markup(clean_lines[idx])
            if re.match(r'^(?:Which of|According to|The (?:word|phrase)|Where in|What |Why |How |Câu hỏi:|Question \d+)', p, re.I):
                split_at = idx
                break
        if split_at is not None and sum(len(strip_all_markup(x)) for x in clean_lines[:split_at]) > 100:
            q_passage = '\n'.join(clean_lines[:split_at]).strip()
            q_stem_lines = clean_lines[split_at:]

    return {
        'label': label,
        'passage': q_passage,
        'stem': '\n'.join(q_stem_lines).strip(),
        'source': ' '.join(sources).strip(),
        'options': opts,
        'correctAnswer': correct,
        'explanation': expl_lines,
    }


def parse_worked_examples(tokens):
    """
    Walk tokens = [('line', str) | ('table', rows), ...]
    Identify interactive MCQ worked examples (triggered by 'Ví dụ...' and containing A/B/C/D options + Lời giải chi tiết).
    Replace those regions with ('example', ex_idx) and return (new_tokens, examples_list).
    Handles cases in 3.1/3.2/3.3 where TIPS sits between Question+Options and Lời giải chi tiết,
    and 4.6/4.7 where one Ví dụ passage has Question 1 and Question 2.
    """
    examples = []
    out_tokens = []
    n = len(tokens)
    i = 0

    def tok_plain(idx):
        if idx >= n or tokens[idx][0] != 'line':
            return ''
        return strip_all_markup(tokens[idx][1])

    def is_example_header(idx):
        p = tok_plain(idx)
        return bool(
            re.match(r'^(?:\+\)\s*)?Ví dụ(?:\s+(?:minh họa|\d+))?\s*[:.]?$', p, re.I)
            or re.match(r'^Ví dụ\s+\d+\s*:', p, re.I)
            or re.match(r'^Ví dụ\s*\n', p, re.I)
        )

    def has_mcq_soon(start_idx, require_ab=False):
        """Look ahead from start_idx to see if an MCQ example (with A. and B./Lời giải) exists before next major section."""
        found_a = False
        found_b = False
        found_sol = False
        j = start_idx + 1
        steps = 0
        while j < n and steps < 60:
            steps += 1
            t_kind, t_val = tokens[j]
            if t_kind == 'table':
                break
            p = tok_plain(j)
            if j > start_idx + 1 and is_example_header(j):
                break
            if is_section_header(p):
                break
            if re.match(r'^A[\.\):]\s+', p):
                found_a = True
            if re.match(r'^B[\.\):]\s+', p):
                found_b = True
            if re.match(r'^(?:Lời giải chi tiết|Hướng dẫn giải)', p, re.I):
                found_sol = True
                break
            j += 1
        if require_ab:
            return found_a and found_b
        return found_sol or (found_a and found_b)

    while i < n:
        kind, val = tokens[i]
        if kind != 'line':
            out_tokens.append((kind, val))
            i += 1
            continue

        plain = tok_plain(i)
        if re.match(r'^\+\)\s*Ví dụ minh họa', plain, re.I) and i + 1 < n and is_example_header(i + 1):
            out_tokens.append((kind, val))
            i += 1
            continue

        if is_example_header(i) and has_mcq_soon(i):
            ex_title = re.sub(r'[:.]+$', '', plain).strip() or 'Ví dụ minh họa'
            i += 1
            question_part = []
            tips_part = []
            solution_part = []
            mode = 'question'  # 'question' -> optional 'tips' -> 'solution'

            while i < n:
                tk, tv = tokens[i]
                if tk == 'table':
                    break
                p = tok_plain(i)

                # Break only on genuine new MCQ example (or in question/solution mode on another Ví dụ header)
                if is_example_header(i) and (mode != 'tips' or has_mcq_soon(i, require_ab=True)):
                    break
                if mode in ('question', 'tips') and is_section_header(p):
                    break
                if mode == 'solution' and re.match(r'^(\d+\.\d+|I{1,3}V?\.|Phần\s+\d+|CHUYÊN ĐỀ)', p):
                    break
                if mode == 'solution' and re.match(r'^[b-d]\)\s+[A-ZĐ]', p) and not re.match(r'^[a-e]\.\s', p):
                    break
                if mode == 'solution' and re.match(r'^[A-ZĐ][^:]{0,60}:\s*$', p) is False and is_section_header(p) and not re.match(r'^Lưu ý\s*:', p, re.I):
                    if not re.match(r'^[a-d]\)\s+Ta ', p):
                        break

                # In 3.2/3.3, explanatory theory prose ("Đây là dạng bài...", "→ Đối với dạng câu sắp xếp...") between Options and Giải chi tiết stays visible outside the question box
                if mode == 'question' and re.match(r'^(?:TIPS LÀM BÀI|Đây là dạng bài|- Phần đã cho sẵn:|→ Đối với dạng câu sắp xếp)', p, re.I):
                    mode = 'tips'
                    tips_part.append(tv)
                    i += 1
                    continue

                if re.match(r'^(?:Lời giải chi tiết|Hướng dẫn giải)', p, re.I):
                    mode = 'solution'
                    rest = re.sub(r'^(?:Lời giải chi tiết(?:\s+cho[^:]+|\s+ví dụ\s*\d*)?|Hướng dẫn giải)\s*[:.]?\s*', '', p, flags=re.I).strip()
                    if rest:
                        solution_part.append(re.sub(r'^(?:\*\*)?(?:Lời giải chi tiết(?:\s+cho[^:]+|\s+ví dụ\s*\d*)?|Hướng dẫn giải)(?:\*\*)?\s*[:.]?\s*', '', tv, flags=re.I).strip())
                    i += 1
                    continue

                if mode == 'question':
                    question_part.append(tv)
                elif mode == 'tips':
                    tips_part.append(tv)
                else:
                    solution_part.append(tv)
                i += 1

            q_markers = [
                idx for idx, l in enumerate(question_part)
                if re.match(r'^Question\s+\d+\s*:', strip_all_markup(l), re.I)
            ]

            sub_questions = []
            shared_passage_lines = []

            if len(q_markers) >= 2:
                shared_passage_lines = question_part[:q_markers[0]]
                sol_markers = [
                    idx for idx, l in enumerate(solution_part)
                    if re.match(r'^Câu\s+\d+\s*:', strip_all_markup(l), re.I)
                ]
                for qi, qm_idx in enumerate(q_markers):
                    qm_end = q_markers[qi + 1] if qi + 1 < len(q_markers) else len(question_part)
                    q_slice = question_part[qm_idx:qm_end]
                    if qi < len(sol_markers):
                        sm_start = sol_markers[qi]
                        sm_end = sol_markers[qi + 1] if qi + 1 < len(sol_markers) else len(solution_part)
                        s_slice = solution_part[sm_start:sm_end]
                    else:
                        s_slice = solution_part
                    sub_questions.append(build_single_mcq(f'Câu {qi + 1}', q_slice, s_slice))
            else:
                sub = build_single_mcq(ex_title, question_part, solution_part)
                if sub['passage']:
                    shared_passage_lines = [sub['passage']]
                    sub['passage'] = ''
                sub_questions.append(sub)

            ex_idx = len(examples)
            examples.append({
                'id': f'ex_{ex_idx + 1}',
                'title': ex_title,
                'passage': '\n'.join(shared_passage_lines).strip(),
                'questions': sub_questions,
            })
            out_tokens.append(('example', ex_idx))
            for tl in tips_part:
                out_tokens.append(('line', tl))
            continue

        out_tokens.append((kind, val))
        i += 1

    return out_tokens, examples


def render_table_md(rows):
    if not rows:
        return ''
    max_cols = max(len(r) for r in rows)
    header = rows[0] + [''] * (max_cols - len(rows[0]))
    md = '\n| ' + ' | '.join(header) + ' |\n'
    md += '| ' + ' | '.join(['---'] * max_cols) + ' |\n'
    for r in rows[1:]:
        padded = r + [''] * (max_cols - len(r))
        md += '| ' + ' | '.join(padded) + ' |\n'
    return md + '\n'


def process_chapter(body, slice_list, ex_id, title, ex_meta, order_idx):
    raw_tokens = []  # ('line', str) or ('table', rows)
    seen_long_lines = set()

    for s_idx, e_idx in slice_list:
        for i in range(s_idx, e_idx):
            el = body[i]
            tag = el.tag.split('}')[-1]
            if tag == 'p':
                lines = extract_p_element_lines(el)
                for l in lines:
                    if not l:
                        continue
                    plain = strip_all_markup(l)
                    if not plain:
                        continue
                    # Only deduplicate strictly consecutive identical lines
                    if raw_tokens and raw_tokens[-1] == ('line', l):
                        continue
                    raw_tokens.append(('line', l))
            elif tag == 'tbl':
                res = extract_table_element(el)
                if not res:
                    continue
                if res[0] == 'lines':
                    for l in res[1]:
                        if l and strip_all_markup(l):
                            raw_tokens.append(('line', l))
                else:
                    rows = res[1]
                    # Merge consecutive grid tables if column counts match (like Word page breaks in 1.6.1..1.6.4)
                    if raw_tokens and raw_tokens[-1][0] == 'table':
                        prev_rows = raw_tokens[-1][1]
                        if prev_rows and len(prev_rows[0]) == len(rows[0]):
                            first_cell_plain = strip_all_markup(rows[0][0]).lower()
                            # If continuation repeats header ("stt") or starts directly with a number row ("97")
                            if first_cell_plain == 'stt' or first_cell_plain == strip_all_markup(prev_rows[0][0]).lower():
                                prev_rows.extend(rows[1:])
                                continue
                            elif first_cell_plain.isdigit():
                                prev_rows.extend(rows)
                                continue
                    raw_tokens.append(('table', rows))

    # Extract interactive worked examples
    flow_tokens, examples = parse_worked_examples(raw_tokens)

    # Render markdown lines faithfully
    parts = []
    for kind, val in flow_tokens:
        if kind == 'table':
            parts.append(render_table_md(val))
        elif kind == 'example':
            parts.append(f'\n{{{{EXAMPLE_CARD:{val}}}}}\n')
        else:
            line = val
            plain = strip_all_markup(line)
            if re.match(r'^(\d+\.\d+(?:\.\d+)?\.?\s+|I{1,3}V?\.\s+DẠNG|Phần\s+\d+\.\d+\s*-|Dạng câu hỏi về)', plain) and len(plain) < 150:
                parts.append(f'\n### {plain}\n')
            elif re.match(r'^TIPS LÀM BÀI', plain, re.I):
                parts.append(f'\n### {plain}\n')
            else:
                parts.append(line)

    content = '\n'.join(parts)
    content = re.sub(r'\n{3,}', '\n\n', content).strip()

    return {
        'order_index': order_idx,
        'exercise_id': ex_id,
        'section_code': ex_meta.get('category', f'CHUYEN_DE_{order_idx}'),
        'module_group': ex_meta.get('topic_group', 'Chuyên đề 9+ THPT'),
        'title': title,
        'questions_count': ex_meta.get('total_questions', 0),
        'theory_and_strategy': content,
        'examples': examples,
    }


def main():
    print('Loading DOCX XML...')
    with zipfile.ZipFile(DOCX_PATH, 'r') as z:
        root = ET.fromstring(z.read('word/document.xml'))

    # Remove <mc:Fallback> elements completely before extraction to prevent any duplicate textbox text
    fallback_count = 0
    for parent in root.iter():
        for child in list(parent):
            if child.tag.endswith('Fallback'):
                parent.remove(child)
                fallback_count += 1
    print(f'Removed {fallback_count} <mc:Fallback> elements.')

    body = list(root.find(f'{{{W_NS}}}body'))
    print(f'Total body elements: {len(body)}')

    with open(EXERCISES_PATH, 'r', encoding='utf-8') as f:
        exercises = json.load(f)
    meta_by_id = {e['id']: dict(e) for e in exercises}

    if os.path.exists(QUESTIONS_PATH):
        with open(QUESTIONS_PATH, 'r', encoding='utf-8') as f:
            q_counts = Counter(q['exercise_id'] for q in json.load(f))
        for eid, cnt in q_counts.items():
            if eid in meta_by_id:
                meta_by_id[eid]['total_questions'] = cnt

    theories_out = []
    for order_idx, (slices, ex_id, title) in enumerate(CHAPTER_RANGES, start=1):
        meta = meta_by_id.get(ex_id, {})
        item = process_chapter(body, slices, ex_id, title, meta, order_idx)
        theories_out.append(item)
        ex_count = len(item['examples'])
        q_count = sum(len(ex['questions']) for ex in item['examples'])
        missing_ans = sum(
            1 for ex in item['examples'] for q in ex['questions']
            if len(q['options']) >= 4 and not q['correctAnswer']
        )
        print(
            f"[{order_idx:02d}] {title[:42]:<42} | chars={len(item['theory_and_strategy']):5d} "
            f"| examples={ex_count} (mcqs={q_count}, no_ans={missing_ans})"
        )

    payload = {'theories': theories_out}
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f'\nGenerated {len(theories_out)} chapters -> {OUT_PATH}')


if __name__ == '__main__':
    main()
