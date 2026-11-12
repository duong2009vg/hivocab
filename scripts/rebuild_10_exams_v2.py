# scripts/rebuild_10_exams_v2.py
# Trích xuất 10 đề minh họa (docx paragraphs 7911-9108) ở mức KÝ TỰ:
#   - bold+underline  -> **{{U}}text{{/U}}**   (từ/cụm/câu mục tiêu: amber + gạch chân xanh)
#   - underline       -> {{U}}text{{/U}}
#   - bold (đơn)      -> {{B}}text{{/B}}      (tiêu đề / lead-in, KHÔNG phải mục tiêu)
#   - số ô đục lỗ (n), dấu ____, [I]..[IV] luôn để plain để click-nhảy-câu hoạt động
#   - đáp án đúng lấy từ highlight vàng trong Word
import docx, re, sys, json, unicodedata

sys.stdout.reconfigure(encoding='utf-8')

DOCX_PATH = r'data\seed_data_tn_thpt\Cac-dang-bai-tap-Tieng-Anh-on-thi-TN-THPT.docx'
EXAMS_JSON_PATH = r'public\data\thpt_exams.json'

doc = docx.Document(DOCX_PATH)

EXAM_RANGES = [
    (1, 7911, 8022), (2, 8022, 8127), (3, 8127, 8235), (4, 8235, 8337), (5, 8337, 8476),
    (6, 8476, 8598), (7, 8598, 8720), (8, 8720, 8840), (9, 8840, 8978), (10, 8978, 9108),
]

CLEAR_RE = re.compile(r'\(\s*\d{1,2}\s*\)|_{2,}|\[\s*(?:I{1,3}|IV|V)\s*\]')


# ---------------------------------------------------------------- char model
def para_lines(p):
    """Return list of lines; each line = list of (ch, bold, underline, highlight)."""
    lines = [[]]
    for r in p.runs:
        b = bool(r.bold)
        u = bool(r.underline)
        h = r.font.highlight_color is not None
        for ch in r.text:
            if ch == '\n':
                lines.append([])
            elif ch == '\r':
                continue
            else:
                lines[-1].append((ch, b, u, h))
    return lines


def clear_markers(chars):
    """Blank numbers / underscores / [I] markers never carry bold/underline."""
    text = ''.join(c[0] for c in chars)
    out = list(chars)
    for m in CLEAR_RE.finditer(text):
        for i in range(m.start(), m.end()):
            ch, b, u, h = out[i]
            out[i] = (ch, False, False, h)
    return out


def ltext(chars):
    return ''.join(c[0] for c in chars)


def render(chars):
    """chars -> markup string."""
    n = len(chars)
    styles = [(c[1], c[2]) for c in chars]
    # whitespace inherits style only when both neighbours share it
    for i, c in enumerate(chars):
        if c[0].isspace():
            j = i - 1
            while j >= 0 and chars[j][0].isspace():
                j -= 1
            k = i + 1
            while k < n and chars[k][0].isspace():
                k += 1
            if j >= 0 and k < n and styles[j] == styles[k]:
                styles[i] = styles[j]
            else:
                styles[i] = (False, False)
    out = []
    i = 0
    while i < n:
        j = i
        while j < n and styles[j] == styles[i]:
            j += 1
        seg = ''.join(chars[x][0] for x in range(i, j))
        b, u = styles[i]
        lead = len(seg) - len(seg.lstrip())
        trail = len(seg) - len(seg.rstrip())
        core = seg.strip()
        if core and (b or u) and re.search(r'\w', core):
            if b and u:
                core = '**{{U}}' + core + '{{/U}}**'
            elif u:
                core = '{{U}}' + core + '{{/U}}'
            else:
                core = '{{B}}' + core + '{{/B}}'
            out.append(seg[:lead] + core + (seg[len(seg) - trail:] if trail else ''))
        else:
            out.append(seg)
        i = j
    return ''.join(out)


def plain(s):
    return re.sub(r'\s+', ' ', s or '').strip()


def para_markup(p):
    """Paragraph -> markup string (lines joined by \\n, blank lines dropped)."""
    res = []
    for ln in para_lines(p):
        ln = clear_markers(ln)
        s = render(ln).strip()
        if s:
            res.append(s)
    return res  # list of lines


def is_bold_header_line(s):
    return s.startswith('{{B}}') and s.endswith('{{/B}}') and s.count('{{B}}') == 1


def strip_emoji(t):
    t = t.replace('\u200d', '').replace('\ufe0f', '')
    t = ''.join(c for c in t if unicodedata.category(c) not in ('So', 'Sk', 'Cs', 'Co', 'Cf'))
    t = re.sub(r'\{\{/?[BU]\}\}|\*\*', '', t)
    return re.sub(r'\s+', ' ', t).strip()


# ---------------------------------------------------------------- questions
OPT_LINE_RE = re.compile(r'^\s*A\s*\.\s')


def find_options(chars):
    """Return (stem_chars, {letter: (start,end)}) or (chars, None)."""
    text = ltext(chars)
    # prefer a line that starts with "A."
    a_pos = None
    for m in re.finditer(r'(?m)^[ \t\u2003\u00a0]*A\s*\.(?=\s|$)', text):
        a_pos = m.start()
        break
    if a_pos is None:
        m = re.search(r'(?:^|[\s\u2003\u00a0])A\s*\.(?=\s|$)', text)
        if not m:
            return chars, None
        a_pos = m.start()
    marks = {}
    pos = a_pos
    for L in 'ABCD':
        m = re.compile(r'(?<![^\s\u2003\u00a0])' + L + r'\s*\.(?=\s|$)').search(text, pos)
        if not m:
            return chars[:a_pos], None
        marks[L] = m.start()
        pos = m.end()
    spans = {}
    order = ['A', 'B', 'C', 'D']
    for idx, L in enumerate(order):
        s = marks[L]
        e = marks[order[idx + 1]] if idx + 1 < 4 else len(chars)
        spans[L] = (s, e)
    return chars[:a_pos], spans


def parse_question_block(block_lines, qnum):
    """block_lines: list of char-lines (first has 'Question N:' prefix)."""
    first = block_lines[0]
    t0 = ltext(first)
    m = re.match(r'^\s*Question\s+\d+\s*:\s*', t0, re.I)
    block_lines = [first[m.end():] if m else first] + block_lines[1:]
    block_lines = [clear_markers(l) for l in block_lines]
    chars = []
    for i, l in enumerate(block_lines):
        if i:
            chars.append(('\n', False, False, False))
        chars.extend(l)
    return chars


def options_from(chars, spans):
    opts, hi = {}, []
    for L, (s, e) in spans.items():
        seg = chars[s:e]
        text = ltext(seg)
        m = re.match(r'^[\s\u2003\u00a0]*' + L + r'\s*\.\s*', text)
        body = seg[m.end():] if m else seg
        opts[L] = plain(re.sub(r'-{2,}\s*HẾT\s*-{2,}', '', ltext(body), flags=re.I))
        if any(c[3] and re.search(r'\w', c[0]) for c in body):
            hi.append(L)
    return opts, hi


def parse_arrangement(block_lines):
    """block_lines (cleaned char lines, after 'Question N:' removed)."""
    pre, sents, closing, source = [], [], [], []
    opt_line = None
    for i, l in enumerate(block_lines):
        if OPT_LINE_RE.match(ltext(l)):
            opt_line = i
            break
    body = block_lines[:opt_line] if opt_line is not None else block_lines
    for l in body:
        t = plain(ltext(l))
        if not t:
            continue
        if re.match(r'^\(\s*Adapted', t, re.I):
            source.append(t)
            continue
        m = re.match(r'^([a-f])\s*[\.\)]\s*(.*)$', t)
        if m and (not sents or ord(m.group(1)) == ord(sents[-1]['letter']) + 1):
            sents.append({'letter': m.group(1), 'text': m.group(2).strip()})
        elif not sents:
            pre.append(t)
        else:
            closing.append(t)
    # lines between sentences that were glued to the last sentence are 'closing'; keep simple
    return sents, '\n'.join(pre), '\n'.join(closing), ' '.join(source)


# ---------------------------------------------------------------- main
with open(EXAMS_JSON_PATH, 'r', encoding='utf-8') as f:
    all_exams = json.load(f)

GENERIC_BLANK = 'Mark the letter A, B, C, or D on your answer sheet to indicate the option that best fits blank ({n}).'
GENERIC_ARR = 'Mark the letter A, B, C, or D on your answer sheet to indicate the correct arrangement of the sentences to make a meaningful text.'

report = []

for ex_num, p_start, p_end in EXAM_RANGES:
    exam_id = f'thpt-exam-dev-{ex_num:02d}'
    exam = next(e for e in all_exams if e['id'] == exam_id)
    old_q = {q['number']: q for q in exam.get('questions', [])}

    # flat line list
    flat = []  # (para_idx, chars)
    for pi in range(p_start, p_end):
        for ln in para_lines(doc.paragraphs[pi]):
            flat.append((pi, ln))

    q_line = {}
    stop_idx = []
    for li, (pi, ln) in enumerate(flat):
        t = ltext(ln)
        m = re.match(r'^\s*Question\s+(\d+)\s*:', t, re.I)
        if m and int(m.group(1)) not in q_line:
            q_line[int(m.group(1))] = li
        if re.match(r'^\s*(Read the following|Mark the letter A, B, C)', t, re.I):
            stop_idx.append(li)

    # anchors by paragraph
    q_para = {n: flat[li][0] for n, li in q_line.items()}
    inst = {}
    for pi in range(p_start, p_end):
        raw = doc.paragraphs[pi].text.strip()
        if re.search(r'Read the following advertisement', raw, re.I) and 1 not in inst:
            inst[1] = pi
        elif re.search(r'Read the following (?:leaflet|article)', raw, re.I) and 2 not in inst:
            inst[2] = pi
        elif re.search(r'Read the following passage', raw, re.I):
            if pi > q_para[13] and pi < q_para[18] and 4 not in inst:
                inst[4] = pi
            elif pi > q_para[18] and pi < q_para[23] and 5 not in inst:
                inst[5] = pi
            elif pi > q_para[23] and pi < q_para[31] and 6 not in inst:
                inst[6] = pi

    def passage(part, first_q):
        ip = inst.get(part)
        fq = q_para[first_q]
        instruction = plain(doc.paragraphs[ip].text) if ip else ''
        paras, title = [], ''
        for pi in range(ip + 1, fq):
            lines = para_markup(doc.paragraphs[pi])
            if not lines:
                continue
            # split out whole-bold header lines into their own paragraph
            buf = []
            chunks = []
            for ln in lines:
                if is_bold_header_line(ln):
                    if buf:
                        chunks.append('\n'.join(buf))
                        buf = []
                    chunks.append(ln)
                else:
                    buf.append(ln)
            if buf:
                chunks.append('\n'.join(buf))
            for ch in chunks:
                rawp = strip_emoji(ch)
                if (not title and not paras and len(rawp) <= 95 and '\n' not in ch
                        and not re.search(r'_{2,}|\(\s*\d+\s*\)', ch)
                        and not rawp.endswith(('.', ')', ',', ';')) and not rawp.startswith('[')):
                    title = rawp
                    continue
                paras.append(ch)
        return instruction, title, paras

    secs = []
    spec = [
        (1, 1, 6, 'leaflet', 'Phần 1: Đục lỗ Quảng cáo / Thông báo (Câu 1 - 6)'),
        (2, 7, 12, 'leaflet', 'Phần 2: Đục lỗ Tờ rơi / Leaflet (Câu 7 - 12)'),
        (3, 13, 17, 'arrangement', 'Phần 3: Sắp xếp Hội thoại / Lá thư / Đoạn văn (Câu 13 - 17)'),
        (4, 18, 22, 'cloze', 'Phần 4: Đục lỗ Mệnh đề / Hoàn thành câu (Câu 18 - 22)'),
        (5, 23, 30, 'reading', 'Phần 5: Đọc hiểu 8 câu (Câu 23 - 30)'),
        (6, 31, 40, 'reading', 'Phần 6: Đọc hiểu 10 câu (Câu 31 - 40)'),
    ]
    default_inst = {
        1: 'Read the following advertisement and mark the letter A, B, C or D on your answer sheet to indicate the option that best fits each of the numbered blanks from 1 to 6.',
        2: 'Read the following leaflet and mark the letter A, B, C or D on your answer sheet to indicate the option that best fits each of the numbered blanks from 7 to 12.',
        3: GENERIC_ARR,
        4: 'Read the following passage and mark the letter A, B, C or D on your answer sheet to indicate the option that best fits each of the numbered blanks from 18 to 22.',
        5: 'Read the following passage and mark the letter A, B, C or D on your answer sheet to indicate the correct answer to each of the questions from 23 to 30.',
        6: 'Read the following passage and mark the letter A, B, C or D on your answer sheet to indicate the correct answer to each of the questions from 31 to 40.',
    }
    sec_objs = {}
    for part, a, b, typ, name in spec:
        if part == 3:
            instr, title, paras = default_inst[3], '', []
        else:
            instr, title, paras = passage(part, a)
        full = '\n\n'.join(paras)
        s = {
            'index': part, 'part': part, 'startQ': a, 'endQ': b, 'start_q': a, 'end_q': b,
            'from_question': a, 'to_question': b, 'type': typ, 'name': name, 'title': title,
            'instruction': instr or default_inst[part], 'paragraphs': paras,
            'passage': full, 'raw_text': full,
        }
        sec_objs[part] = s
        secs.append(s)
    exam['sections'] = secs

    # blank coverage check
    for part in (1, 2, 4):
        s = sec_objs[part]
        txt = s['passage']
        for n in range(s['startQ'], s['endQ'] + 1):
            if not re.search(r'\(\s*' + str(n) + r'\s*\)', txt):
                report.append(f'{exam_id}: blank ({n}) NOT found in part {part}')

    # questions
    new_q = []
    sorted_starts = sorted(q_line.items(), key=lambda x: x[1])
    for qn in range(1, 41):
        li = q_line.get(qn)
        old = old_q.get(qn, {})
        part = next(p for p, a, b, *_ in spec if a <= qn <= b)
        sec = sec_objs[part]
        opts, ans, stem, arr = {}, None, '', ([], '', '', '')
        if li is not None:
            nxt = [x for x in q_line.values() if x > li]
            end = min(nxt) if nxt else len(flat)
            stops = [x for x in stop_idx if x > li]
            if stops:
                end = min(end, min(stops))
            blk = [flat[x][1] for x in range(li, end)]
            chars = parse_question_block(blk, qn)
            stem_chars, spans = find_options(chars)
            if spans:
                opts, hi = options_from(chars, spans)
                if len(hi) == 1:
                    ans = hi[0]
                elif len(hi) > 1:
                    report.append(f'{exam_id} Q{qn}: multiple highlighted options {hi}')
                    ans = hi[0]
                else:
                    report.append(f'{exam_id} Q{qn}: no highlighted answer (fallback old {old.get("correct_answer")})')
            else:
                report.append(f'{exam_id} Q{qn}: options not parsed')
            if 13 <= qn <= 17:
                m0 = re.match(r'^\s*Question\s+\d+\s*:\s*', ltext(blk[0]), re.I)
                cl = [blk[0][m0.end():] if m0 else blk[0]] + list(blk[1:])
                arr = parse_arrangement([clear_markers(l) for l in cl])
            if qn >= 23:
                stem = render(stem_chars).strip()
                stem = re.sub(r'[ \t\u2003]+\n', '\n', stem)
        if len(opts) < 4:
            for L in 'ABCD':
                if not opts.get(L) and old.get('options', {}).get(L):
                    opts[L] = old['options'][L]
        ans = ans or old.get('correct_answer') or 'A'

        if qn < 13 or 18 <= qn <= 22:
            prompt = GENERIC_BLANK.format(n=qn)
        elif 13 <= qn <= 17:
            prompt = GENERIC_ARR
        else:
            prompt = stem or old.get('prompt') or f'Question {qn}'

        expl = old.get('explanation') or ''
        m = re.match(r'^Đáp án đúng là ([A-D])', expl)
        if not expl or (m and m.group(1) != ans):
            expl = f'Đáp án đúng là {ans} ({opts.get(ans, "")}). Dựa vào nội dung bài đọc và cấu trúc ngữ pháp tương ứng.'

        is_arr = 13 <= qn <= 17
        q = {
            'id': f'{exam_id}-q{qn:02d}', 'number': qn, 'question_number': qn,
            'part': part, 'section_index': part, 'group': sec['name'],
            'prompt': prompt, 'question_stem': prompt,
            'options': {L: opts.get(L, '') for L in 'ABCD'},
            'correct_answer': ans, 'explanation': expl,
            'passage': '', 'context_passage': '',
            'passage_title': sec['title'], 'passage_instruction': sec['instruction'],
            'is_arrangement': is_arr,
            'arrangement_sentences': arr[0] if is_arr else [],
            'arrangement_context': arr[1] if is_arr else '',
            'arrangement_closing': arr[2] if is_arr else '',
            'arrangement_source': arr[3] if is_arr else '',
            'question_type': 'sentence_arrangement' if is_arr else 'reading_comprehension',
        }
        if old.get('correct_answer') and old['correct_answer'] != ans:
            report.append(f'{exam_id} Q{qn}: answer changed {old["correct_answer"]} -> {ans}')
        new_q.append(q)
    exam['questions'] = new_q

    for L in range(1, 41):
        q = new_q[L - 1]
        if any(not q['options'][k] for k in 'ABCD'):
            report.append(f'{exam_id} Q{L}: EMPTY option')
        if q['is_arrangement'] and not q['arrangement_sentences']:
            report.append(f'{exam_id} Q{L}: arrangement sentences missing')

with open(EXAMS_JSON_PATH, 'w', encoding='utf-8') as f:
    json.dump(all_exams, f, ensure_ascii=False, indent=2)

print('REPORT (%d items)' % len(report))
for r in report:
    print(' -', r)
print('DONE')
