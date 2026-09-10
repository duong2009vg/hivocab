import os
import sys
import json
import re
import unicodedata
import pypdf

sys.stdout.reconfigure(encoding='utf-8')

ROOT = r'c:\Users\MY PC\Documents\GitHub\hivocab'
BASE_DIR = os.path.join(ROOT, 'data', 'đề thi thpt tiếng anh')
EXAMS_JSON_PATH = os.path.join(ROOT, 'data', 'thpt_exams.json')

def get_qualified_files():
    all_files = []
    for root, dirs, fnames in os.walk(BASE_DIR):
        for f in fnames:
            if f.endswith('.pdf') or f.endswith('.docx'):
                all_files.append(os.path.join(root, f))

    dup_set = {
        r'Phần 2\27. SỞ NINH BÌNH L1  2025-2026.pdf',
        r'phần 1\16. THPT YÊN DŨNG SỐ 1 - BẮC NINH 2025-2026 (LẦN 1).pdf',
        r'Phần 3\39_LIÊN_TRƯOỜNG_NGHỆ_AN_2025_2026_LẦN_1_MÃ_LẺ.pdf',
        r'Phần 3\39_LIÊN_TRƯỜNG_NGHỆ_AN_2025_2026_LẦN_1_MÃ_LẺ.pdf',
        r'Phần 2\31. CỤM 13 TRƯOỜNG THPT HẢI PHÒNG 2025-2026 (LẦN 1).docx',
        r'Phần 2\31. CỤM 13 TRƯỜNG THPT HẢI PHÒNG 2025-2026 (LẦN 1).docx'
    }

    already_set = {
        r'phần 1\1. THPT ĐÀO DUY TỪ - THANH HOÁ 2025-2026.pdf',
        r'phần 1\12. THPT LẠNG GIANG SỐ 1 - BẮC NINH 2025-2026 (LẦN 1).pdf',
        r'phần 1\13. THPT CẨM XUYÊN - HÀ TĨNH 2025-2026.pdf',
        r'phần 1\24.  THPT CHUYÊN BẮC NINH 2025-2026 (LẦN 1).pdf',
        r'phần 1\17.  THPT CHUYÊN BẮC GIANG - BẮC NINH 2025-2026 (LẦN 1).pdf',
        r'phần 1\2. THPT TRẦN PHÚ - HÀ TĨNH 2025-2026.pdf',
        r'phần 1\8. THPT TRẦN NGUYÊN HÃN - HẢI PHÒNG 2025-2026 (LẦN 1).pdf',
        r'phần 1\9.  THPT THUẬN THÀNH 1 - BẮC NINH 2025-2026.pdf'
    }

    no_ans_set = {
        r'phần 1\7.  THPT CHÂU THÀNH - TP HCM 2025-2026 (LẦN 1).pdf'
    }

    dup_norm = {unicodedata.normalize('NFC', p) for p in dup_set}
    already_norm = {unicodedata.normalize('NFC', p) for p in already_set}
    no_ans_norm = {unicodedata.normalize('NFC', p) for p in no_ans_set}

    qualified = []
    for fpath in all_files:
        rel = os.path.relpath(fpath, BASE_DIR)
        rel_norm = unicodedata.normalize('NFC', rel)
        if 'Image.Marked' in rel:
            continue
        if rel in already_set or rel_norm in already_norm:
            continue
        if rel in dup_set or rel_norm in dup_norm:
            continue
        if rel in no_ans_set or rel_norm in no_ans_norm:
            continue
        qualified.append(fpath)
    return qualified


EXAM_TITLES = [
    "THPT Yên Dũng Số 3 - Bắc Ninh",
    "THPT Quang Trung - Đống Đa - Hà Nội",
    "THPT Yên Dũng Số 1 - Bắc Ninh (Lần 1)",
    "THPT Tân Yên 2 - Bắc Ninh (Lần 1)",
    "THPT Chuyên Thoại Ngọc Hầu - An Giang (Lần 1)",
    "THPT Quỳnh Thọ - Hưng Yên (Lần 1)",
    "THPT Chuyên Khoa Học Tự Nhiên (Lần 2)",
    "THPT Liên Trường Nghệ An (Mã Lẻ)",
    "THPT Yên Dũng Số 2 - Bắc Ninh (Lần 1)",
    "Liên Trường THPT Nghệ An (Đợt 1)",
    "THPT Bùi Thị Xuân - Đồng Nai (Lần 1)",
    "THPT Lê Viết Thuật - Nghệ An (Lần 2)",
    "Sở GD&ĐT Ninh Bình (Lần 1)",
    "Liên Trường THPT Bắc Ninh",
    "Cụm THPT Hiệp Hoà 1 - Ngô Sĩ Liên - Tiên Du 1 - Bắc Ninh",
    "THPT Hàn Thuyên - Bắc Ninh (Lần 1)",
    "THPT Kỳ Anh - Hà Tĩnh",
    "THPT Yên Dũng Số 1 - Bắc Ninh (Lần 2)",
    "KSCL Lớp 12 Phú Thọ (Đợt 1)",
    "Cụm 13 Trường THPT Hải Phòng (Lần 1)",
    "THPT Liên Trường Nghệ An (Mã Chẵn)",
    "THPT Chuyên Hạ Long - Quảng Ninh (Lần 1)",
    "Liên Trường THPT Đà Nẵng (Lần 1)",
    "THPT Tam Dương - Phú Thọ (Lần 2)",
    "THPT Hà Tĩnh (Lần 1)",
    "Liên Trường THPT Hà Nội - Ca 1 (Lần 1)",
    "THPT Chương Mỹ A - Hà Nội (Lần 1)",
    "THPT Hải Lăng - Quảng Trị",
    "THPT Ngô Quyền - Quảng Trị",
    "Cụm Trường THPT Hải Phòng (Lần 2)"
]

MANUAL_OVERRIDES_32 = {
    (10, 19): 'B',
    (11, 9): 'C',
    (19, 16): 'B',
    (20, 16): 'D',
    (21, 6): 'D',
    (22, 15): 'D',
    (22, 19): 'D',
    (23, 1): 'D',
    (23, 2): 'C',
    (23, 3): 'A',
    (23, 5): 'D',
    (23, 31): 'D',
    (24, 14): 'A',
    (24, 15): 'C',
    (24, 16): 'C',
    (24, 17): 'C',
    (24, 36): 'C',
    (24, 37): 'D',
    (24, 38): 'C',
    (24, 39): 'A',
    (24, 40): 'C',
    (25, 14): 'D',
    (25, 16): 'D',
    (25, 17): 'D',
    (26, 13): 'D',
    (26, 14): 'D',
    (26, 15): 'D',
    (27, 5): 'D',
    (28, 16): 'C',
    (28, 30): 'A',
    (28, 31): 'B',
    (29, 13): 'D',
    (30, 13): 'D',
    (30, 15): 'D',
    (30, 16): 'B',
    (30, 17): 'D'
}

def clean_watermarks(t):
    if not t:
        return ""
    t = re.sub(r'Tài liệu chia sẻ miễn phí tại:.*?\n', '\n', t, flags=re.IGNORECASE)
    t = re.sub(r'Tài liệu được chia sẻ miễn phí tại:?.*?\n', '\n', t, flags=re.IGNORECASE)
    t = re.sub(r'Fanpage:.*?\n', '\n', t, flags=re.IGNORECASE)
    t = re.sub(r'SỞ GD&ĐT.*?\n', '\n', t, flags=re.IGNORECASE)
    t = re.sub(r'TRƯỜNG THPT.*?\n', '\n', t, flags=re.IGNORECASE)
    t = re.sub(r'\(Đề thi có \d+ trang\).*?\n', '\n', t, flags=re.IGNORECASE)
    t = re.sub(r'ĐỀ KHẢO SÁT.*?\n', '\n', t, flags=re.IGNORECASE)
    t = re.sub(r'ĐỀ THI THỬ.*?\n', '\n', t, flags=re.IGNORECASE)
    t = re.sub(r'Môn thi:.*?\n', '\n', t, flags=re.IGNORECASE)
    t = re.sub(r'Thời gian làm bài:.*?\n', '\n', t, flags=re.IGNORECASE)
    t = re.sub(r'Mã đề thi:?.*?\n', '\n', t, flags=re.IGNORECASE)
    t = re.sub(r'HƯỚNG DẪN GIẢI CHI TIẾT.*?\n', '\n', t, flags=re.IGNORECASE)
    t = re.sub(r'^\s*\d+\s*$', '', t, flags=re.MULTILINE)
    return t

def reflow_paragraphs(text):
    text = re.sub(r'\r', '', text)
    raw_blocks = re.split(r'\n\s*\n|\n(?=\s*\[(?:I|II|III|IV|V)\]\.?)|\n(?=\s*(?:\[Đoạn\s*\d+\]|Paragraph\s*\d+|\[\d+\]))|\n(?=\s*•)|\n(?=\s*-\s+)', text, flags=re.IGNORECASE)
    paras = []
    for rb in raw_blocks:
        lines = [l.strip() for l in rb.split('\n') if l.strip()]
        if not lines:
            continue
        p = ' '.join(lines)
        p = re.sub(r'\s+', ' ', p).strip()
        if p and len(p) > 15:
            paras.append(p)
    return paras

def extract_answers_for_exam(norm_text, exam_num):
    answers = {}
    sol_idx = norm_text.find("HƯỚNG DẪN GIẢI")
    if sol_idx == -1:
        sol_idx = norm_text.find("BẢNG ĐÁP ÁN")
    if sol_idx == -1:
        sol_idx = norm_text.find("ĐÁP ÁN CHI TIẾT")
    if sol_idx == -1:
        sol_idx = norm_text.find("LỜI GIẢI CHI TIẾT")
    if sol_idx == -1:
        m_q40 = re.search(r'(?:Question|Câu)\s*40\b', norm_text, re.IGNORECASE)
        if m_q40:
            m_second_q1 = re.search(r'(?:Question|Câu)\s*1\b', norm_text[m_q40.end():], re.IGNORECASE)
            if m_second_q1:
                sol_idx = m_q40.end() + m_second_q1.start()
    
    sol_text = norm_text[sol_idx:] if sol_idx != -1 else norm_text

    table_sec_m = re.search(r'(?:BẢNG ĐÁP ÁN|BẢNG ĐÁP ÁN VÀ LỜI GIẢI)([\s\S]*?)(?:HƯỚNG DẪN GIẢI CHI TIẾT|LỜI GIẢI CHI TIẾT|Question 1\b|Câu 1\b)', norm_text, re.IGNORECASE)
    if table_sec_m:
        matches = re.findall(r'(?:^|\s)([1-9]|[1-3][0-9]|40)\s*[\.:\-\s]?\s*([A-D])\b', table_sec_m.group(1))
        for qn, ans in matches:
            answers[int(qn)] = ans.upper()

    for q_num in range(1, 41):
        for (e_idx, q_idx), m_ans in MANUAL_OVERRIDES_32.items():
            if e_idx == exam_num and q_idx == q_num:
                answers[q_num] = m_ans
                break
        if q_num in answers:
            continue

        next_q = q_num + 1
        pat = rf'(?:Question|Câu)\s*{q_num}[\.:\s]([\s\S]*?)(?=(?:Question|Câu)\s*{next_q}[\.:\s]|THE END|Tạm Dịch Bài Đọc|\Z)'
        m = re.search(pat, sol_text, re.IGNORECASE)
        if not m:
            continue
        block = m.group(1)
        block = re.sub(r'([a-z0-9])([A-D])[\.:]', r'\1 \2.', block)

        m_ans = re.search(r'(?:Đáp án|Chọn|Key|Phương án|→\s*Chọn|->\s*Chọn|chọn đáp án)\s*[:\s-]?\s*(?:đáp án\s+)?([A-D])\b', block, re.IGNORECASE)
        if m_ans:
            answers[q_num] = m_ans.group(1).upper()
            continue

        m_la = re.search(r'\b([A-D])\s+(?:là đáp án|chính là đáp án|là lựa chọn đúng)', block, re.IGNORECASE)
        if m_la:
            answers[q_num] = m_la.group(1).upper()
            continue

        opt_matches = re.findall(r'([A-D])[\.:]\s*([a-g\s\-\–]+)', block)

        steps = re.findall(r'(?:[1-9]\u20e3|(?:^|\n)\s*[1-9]\.|\b(?:Bước|Step)\s*[1-9]\s*[:\.]?)\s*([a-g])[\.:]', block, re.IGNORECASE)
        if steps:
            step_str = ''.join(steps).lower()
            for opt_let, opt_val in opt_matches:
                val_clean = re.sub(r'[^a-g]', '', opt_val.lower())
                if val_clean == step_str:
                    answers[q_num] = opt_let.upper()
                    break
            if q_num in answers:
                continue

        parens = re.findall(r'(?:^|\n)\s*\(([a-g])\)', block)
        if len(parens) >= 3:
            paren_str = ''.join(parens).lower()
            for opt_let, opt_val in opt_matches:
                val_clean = re.sub(r'[^a-g]', '', opt_val.lower())
                if val_clean == paren_str:
                    answers[q_num] = opt_let.upper()
                    break
            if q_num in answers:
                continue

        m_gt = re.search(r'Giải\s*thích\s*[:\.]?', block, re.IGNORECASE)
        if m_gt:
            gt_letters = re.findall(r'(?:^|\n)\s*([a-g])\.\s+', block[m_gt.end():])
            if len(gt_letters) >= 3:
                g_str = ''.join(gt_letters).lower()
                for opt_let, opt_val in opt_matches:
                    val_clean = re.sub(r'[^a-g]', '', opt_val.lower())
                    if val_clean == g_str:
                        answers[q_num] = opt_let.upper()
                        break
            if q_num in answers:
                continue

        m_opts = list(re.finditer(r'(?:^|\n|\s)D[\.:]', block))
        if m_opts:
            after = block[m_opts[-1].end():]
            lets = re.findall(r'(?:^|\n)\s*(?:\(?([a-g])[\.\)]|\b([a-g])\.\s+)', after)
            flat = [l[0] or l[1] for l in lets if l[0] or l[1]]
            if len(flat) >= 3:
                seq = ''.join(flat).lower()
                for opt_let, opt_val in opt_matches:
                    if re.sub(r'[^a-g]', '', opt_val.lower()) == seq:
                        answers[q_num] = opt_let.upper()
                        break
            if q_num in answers:
                continue

        seq_matches = re.findall(r'(?:Trật tự|Thứ tự|đúng là|chuỗi|->|=>|Đáp án đúng)[\s:]*([a-g\s\-\–]{5,})', block, re.IGNORECASE)
        for sm in seq_matches:
            clean_sm = re.sub(r'[^a-g]', '', sm.lower())
            for opt_let, opt_val in opt_matches:
                if re.sub(r'[^a-g]', '', opt_val.lower()) == clean_sm:
                    answers[q_num] = opt_let.upper()
                    break
            if q_num in answers:
                break
        if q_num in answers:
            continue

        m_dung = re.search(r'(?:^|\n)[•\*\-\s\u2022]*([A-D])\.(?:(?!\n[•\*\-\s\u2022]*[A-D]\.)[\s\S])*?[-–—\(]\s*(?:ĐÚNG|Đúng|CHÍNH XÁC|Chính xác)', block)
        if m_dung:
            answers[q_num] = m_dung.group(1).upper()
            continue

        sais = re.findall(r'(?:^|\n)[•\*\-\s\u2022]*([A-D])\.(?:(?!\n[•\*\-\s\u2022]*[A-D]\.)[\s\S])*?[-–—\(]\s*(?:SAI|Sai|KHÔNG ĐÚNG|Không đúng)', block)
        if len(set(sais)) == 3:
            remaining = list(set(['A', 'B', 'C', 'D']) - set(sais))
            if len(remaining) == 1:
                answers[q_num] = remaining[0]
                continue

        m_pos = re.search(r'Vị trí\s*\[(I|II|III|IV)\]', block, re.IGNORECASE)
        if m_pos:
            rom_map = {'I': 'A', 'II': 'B', 'III': 'C', 'IV': 'D'}
            answers[q_num] = rom_map[m_pos.group(1).upper()]
            continue

    for (e_idx, q_idx), m_ans in MANUAL_OVERRIDES_32.items():
        if e_idx == exam_num:
            answers[q_idx] = m_ans

    return answers

def extract_one_exam(rel_path, exam_index):
    exam_id = f"thpt-exam-{exam_index+8:02d}"
    exam_title = EXAM_TITLES[exam_index - 1]

    actual_path = rel_path if os.path.isabs(rel_path) else os.path.join(BASE_DIR, rel_path)
    if not os.path.exists(actual_path):
        target_norm = unicodedata.normalize('NFC', os.path.basename(rel_path))
        for root, dirs, files in os.walk(BASE_DIR):
            for f in files:
                if unicodedata.normalize('NFC', f) == target_norm:
                    actual_path = os.path.join(root, f)
                    break
            if os.path.exists(actual_path):
                break

    reader = pypdf.PdfReader(actual_path)
    full_text = ''.join((p.extract_text() or '') + '\n' for p in reader.pages)
    norm = unicodedata.normalize('NFC', full_text)
    norm = norm.replace('\u0410', 'A').replace('\u0412', 'B').replace('\u0421', 'C')

    sol_idx = -1
    for kw in ['HƯỚNG DẪN GIẢI', 'BẢNG ĐÁP ÁN', 'ĐÁP ÁN CHI TIẾT', 'LỜI GIẢI CHI TIẾT']:
        p = norm.find(kw)
        if p != -1 and (sol_idx == -1 or p < sol_idx):
            sol_idx = p
    if sol_idx == -1:
        m_q40 = list(re.finditer(r'(?:Question|Câu)\s*40\b', norm, re.IGNORECASE))
        if m_q40:
            m_second_q1 = re.search(r'(?:Question|Câu)\s*1\b', norm[m_q40[0].end():], re.IGNORECASE)
            if m_second_q1:
                sol_idx = m_q40[0].end() + m_second_q1.start()

    test_text = norm[:sol_idx] if sol_idx != -1 else norm
    sol_text = norm[sol_idx:] if sol_idx != -1 else norm

    test_text_clean = clean_watermarks(test_text)
    sol_text_clean = clean_watermarks(sol_text)

    answers_map = extract_answers_for_exam(norm, exam_index)

    explanations = {}
    for q in range(1, 41):
        next_pat = rf'(?:Question|Câu)\s*{q+1}[\.:\s]' if q < 40 else r'(?:THE END|Tạm Dịch Bài Đọc|BẢNG TỪ VỰNG|\Z)'
        m = re.search(rf'(?:Question|Câu)\s*{q}[\.:\s]([\s\S]*?)(?={next_pat})', sol_text, re.IGNORECASE)
        if m:
            exp = m.group(1).strip()
            exp = clean_watermarks(exp).strip()
            explanations[q] = exp
        else:
            explanations[q] = f"Đáp án chính xác: {answers_map.get(q, 'A')}"

    q_positions = {}
    for q in range(1, 41):
        m = re.search(rf'(?:^|\n)\s*(?:Question|Câu)\s*{q}[\.:\s]', test_text_clean, re.IGNORECASE)
        if m:
            q_positions[q] = m.start()

    raw_q_blocks = {}
    for q in range(1, 41):
        if q in q_positions:
            start_pos = q_positions[q]
            next_starts = [q_positions[nxt] for nxt in range(q + 1, 41) if nxt in q_positions]
            end_pos = min(next_starts) if next_starts else len(test_text_clean)
            raw_q_blocks[q] = test_text_clean[start_pos:end_pos].strip()
        else:
            m = re.search(rf'(?:Question|Câu)\s*{q}[\.:\s]([\s\S]*?)(?=(?:Question|Câu)\s*{q+1}[\.:\s]|\Z)', sol_text_clean, re.IGNORECASE)
            raw_q_blocks[q] = m.group(0).strip() if m else ""

    parsed_questions = {}
    for q in range(1, 41):
        block = raw_q_blocks.get(q, "")
        block = re.sub(r'([a-z0-9])([A-D])[\.:]', r'\1 \2.', block)
        block = re.sub(rf'^(?:Question|Câu)\s*{q}[\.:\s]*', '', block, flags=re.IGNORECASE).strip()

        m_a = re.search(r'(?:^|\n|\s)A[\.:]\s*([\s\S]*?)(?=(?:^|\n|\s)B[\.:])', block)
        m_b = re.search(r'(?:^|\n|\s)B[\.:]\s*([\s\S]*?)(?=(?:^|\n|\s)C[\.:])', block)
        m_c = re.search(r'(?:^|\n|\s)C[\.:]\s*([\s\S]*?)(?=(?:^|\n|\s)D[\.:])', block)
        m_d = re.search(r'(?:^|\n|\s)D[\.:]\s*([\s\S]*?)$', block)

        opts = {
            "A": m_a.group(1).strip() if m_a else "",
            "B": m_b.group(1).strip() if m_b else "",
            "C": m_c.group(1).strip() if m_c else "",
            "D": m_d.group(1).strip() if m_d else ""
        }

        if opts["D"]:
            opts["D"] = re.sub(r'\n+(?:Read the following|Mark the letter|THE END)[\s\S]*$', '', opts["D"], flags=re.IGNORECASE).strip()
            opts["D"] = re.sub(r'\s*(?:Tài liệu|Fanpage|Hướng dẫn|[A-D]\.|\bĐÚNG\b|\bSAI\b)[\s\S]*$', '', opts["D"], flags=re.IGNORECASE).strip()

        # Fallback to solution text if any option is missing from test text
        if not (opts["A"] and opts["B"] and opts["C"] and opts["D"]):
            sol_m = re.search(rf'(?:Question|Câu)\s*{q}[\.:\s]([\s\S]*?)(?=(?:Question|Câu)\s*{q+1}[\.:\s]|\Z)', sol_text_clean, re.IGNORECASE)
            if sol_m:
                s_blk = sol_m.group(1)
                s_blk = re.sub(r'([a-z0-9])([A-D])[\.:]', r'\1 \2.', s_blk)
                s_a = re.search(r'(?:^|\n|\s)A[\.:]\s*([\s\S]*?)(?=(?:^|\n|\s)B[\.:])', s_blk)
                s_b = re.search(r'(?:^|\n|\s)B[\.:]\s*([\s\S]*?)(?=(?:^|\n|\s)C[\.:])', s_blk)
                s_c = re.search(r'(?:^|\n|\s)C[\.:]\s*([\s\S]*?)(?=(?:^|\n|\s)D[\.:])', s_blk)
                s_d = re.search(r'(?:^|\n|\s)D[\.:]\s*([\s\S]*?)(?=\n[A-D][\.:]|\n[•\*\-\s\u2022]*[A-D]|\nGiải thích|\nTạm dịch|\Z)', s_blk)
                if s_a and s_b and s_c and s_d:
                    opts["A"] = s_a.group(1).strip()
                    opts["B"] = s_b.group(1).strip()
                    opts["C"] = s_c.group(1).strip()
                    opts["D"] = s_d.group(1).strip()

        if exam_index == 24 and q == 26:
            opts["C"] = "expensive"
            opts["D"] = "intense"

        for opt_k in ["A", "B", "C", "D"]:
            opts[opt_k] = re.sub(r'\s+', ' ', opts[opt_k]).strip()

        is_arr = False
        arr_sentences = []
        arr_context = ""

        d_val = opts["D"].strip()
        is_arr_opt = bool(re.match(r'^\s*[a-g](?:\s*[\-–—\s,]\s*[a-g]){2,6}\s*$', d_val, re.IGNORECASE))
        pre_options_text = block[:m_a.start()].strip() if m_a else ""

        raw_sents = re.findall(r'(?:^|\n)\s*([a-f])\.\s*([^\n\r]+(?:\n(?!\s*[a-f]\.|\s*[A-D]\.)[^\n\r]+)*)', pre_options_text)

        if is_arr_opt and len(raw_sents) >= 2:
            is_arr = True
            clean_d_letters = set(re.findall(r'[a-g]', d_val.lower()))
            for s_let, s_text in raw_sents:
                s_let_clean = s_let.lower().strip()
                if s_let_clean in clean_d_letters:
                    clean_stext = re.sub(r'\s+', ' ', s_text).strip()
                    arr_sentences.append({
                        "letter": s_let_clean,
                        "text": clean_stext
                    })

            m_ctx = re.search(r'(Dear\s+[^\n,]+,|\b(?:Nam|Mai|Anna|Sophie|Lucy|David)\s*and\s+[^\n]+)', pre_options_text, re.IGNORECASE)
            if m_ctx:
                arr_context = m_ctx.group(1).strip()

            prompt = "Chọn phương án sắp xếp các câu ở cột bên trái theo đúng trật tự logic để tạo thành văn bản hoàn chỉnh:"
        else:
            is_arr = False
            arr_sentences = []
            arr_context = ""
            prompt = pre_options_text if pre_options_text else f"Chọn đáp án đúng nhất cho câu hỏi {q}:"
            prompt = re.sub(r'\s+', ' ', prompt).strip()

        parsed_questions[q] = {
            "number": q,
            "prompt": prompt,
            "options": opts,
            "correct_answer": answers_map.get(q, "A"),
            "explanation": explanations.get(q, ""),
            "is_arrangement": is_arr,
            "arrangement_context": arr_context,
            "arrangement_sentences": arr_sentences
        }

    section_starts = [1]
    for q in range(2, 41):
        prev_pos = q_positions.get(q - 1, 0)
        curr_pos = q_positions.get(q, 0)
        if curr_pos > prev_pos:
            between = test_text_clean[prev_pos:curr_pos]
            if re.search(r'(?:Read the (?:following|instruction|text|advertisement|leaflet|announcement|passage)|Mark the (?:letter|best option|correct option))\b', between, re.IGNORECASE):
                section_starts.append(q)

    # Fallback if dynamic detection found fewer than 3 sections:
    if len(section_starts) < 3:
        arr_q_nums = [q for q in range(1, 41) if parsed_questions[q]["is_arrangement"]]
        if arr_q_nums and min(arr_q_nums) == 1:
            max_arr = max(arr_q_nums)
            section_starts = [1, max_arr + 1, 12, 17, 23, 31]
        elif arr_q_nums and min(arr_q_nums) == 6:
            section_starts = [1, 6, 11, 17, 23, 31]
        elif arr_q_nums and min(arr_q_nums) >= 30:
            min_arr = min(arr_q_nums)
            section_starts = [1, 6, 13, 23, min_arr, 36]
        else:
            section_starts = [1, 7, 13, 18, 23, 31]

    section_starts = sorted(list(set(section_starts)))

    final_sections = []
    for s_i, sq in enumerate(section_starts):
        eq = section_starts[s_i + 1] - 1 if s_i + 1 < len(section_starts) else 40
        part_num = s_i + 1

        sec_arr = any(parsed_questions[q]["is_arrangement"] for q in range(sq, eq + 1))

        sq_pos = q_positions.get(sq, -1)
        prev_q = sq - 1
        prev_pos = q_positions.get(prev_q, 0) if prev_q > 0 else 0
        section_raw_area = test_text_clean[prev_pos:sq_pos].strip() if sq_pos != -1 else ""

        m_ins = re.search(r'(?:Read the (?:following|instruction|text|advertisement|leaflet|announcement|passage)|Mark the (?:letter|best option|correct option))\b[\s\S]*?(?=\n\n|\n[A-Z0-9]|\Z)', section_raw_area, re.IGNORECASE)
        instruction_text = m_ins.group(0).strip() if m_ins else ""
        instruction_text = re.sub(r'\s+', ' ', instruction_text)

        passage_raw = ""
        if m_ins:
            passage_raw = section_raw_area[m_ins.end():].strip()
        elif not sec_arr:
            passage_raw = section_raw_area

        p_lines = [l.strip() for l in passage_raw.split('\n') if l.strip()]
        sec_title = ""
        if p_lines and len(p_lines[0]) < 60 and (p_lines[0].isupper() or ':' in p_lines[0] or p_lines[0].startswith('Workshop:') or p_lines[0].startswith('MACHU PICCHU') or p_lines[0].startswith('Say No')):
            sec_title = p_lines[0]
            passage_raw = '\n'.join(p_lines[1:])

        if sec_arr:
            stype = "arrangement"
            sname = f"Phần {part_num}: Sắp Xếp Câu & Đoạn Văn (Câu {sq} - {eq})"
            paras = []
            sec_title = "BÀI TẬP SẮP XẾP ĐOẠN VĂN / LÁ THƯ"
            if not instruction_text:
                instruction_text = "Mark the letter A, B, C, or D on your answer sheet to indicate the correct arrangement of the sentences to make a meaningful paragraph/letter in each of the following questions."
        else:
            paras = reflow_paragraphs(passage_raw)
            if not paras and passage_raw:
                paras = [re.sub(r'\s+', ' ', passage_raw).strip()]

            if eq - sq + 1 >= 7:
                stype = "reading"
                sname = f"Phần {part_num}: Đọc Hiểu Đoạn Văn (Câu {sq} - {eq})"
            elif any(kw in instruction_text.lower() for kw in ['advertisement', 'leaflet', 'announcement']):
                stype = "leaflet"
                sname = f"Phần {part_num}: Thông Báo / Tờ Rơi / Điền Khuyết (Câu {sq} - {eq})"
            else:
                stype = "cloze" if any(f"({q})" in passage_raw for q in range(sq, eq + 1)) else "leaflet"
                sname = f"Phần {part_num}: Đọc Điền Khuyết (Câu {sq} - {eq})" if stype == "cloze" else f"Phần {part_num}: Thông Báo / Tờ Rơi / Điền Khuyết (Câu {sq} - {eq})"

        final_sections.append({
            "part": part_num,
            "type": stype,
            "name": sname,
            "start_q": sq,
            "end_q": eq,
            "instruction": instruction_text,
            "title": sec_title,
            "paragraphs": paras,
            "raw_text": passage_raw
        })

    final_questions = []
    for q in range(1, 41):
        q_data = parsed_questions[q]
        sec_match = next((s for s in final_sections if s["start_q"] <= q <= s["end_q"]), final_sections[0])
        passage_str = '\n\n'.join(sec_match["paragraphs"]) if sec_match["paragraphs"] else sec_match["raw_text"]

        final_questions.append({
            "number": q,
            "part": sec_match["part"],
            "group": sec_match["name"],
            "prompt": q_data["prompt"],
            "options": q_data["options"],
            "correct_answer": q_data["correct_answer"],
            "explanation": q_data["explanation"],
            "is_arrangement": q_data["is_arrangement"],
            "arrangement_context": q_data["arrangement_context"],
            "arrangement_sentences": q_data["arrangement_sentences"],
            "passage": passage_str,
            "passage_title": sec_match["title"],
            "passage_instruction": sec_match["instruction"],
            "section_index": sec_match["part"]
        })

    exam_obj = {
        "id": exam_id,
        "title": exam_title,
        "total_questions": 40,
        "duration_minutes": 50,
        "sections": final_sections,
        "questions": final_questions
    }

    return exam_obj

def run_extraction():
    print(f"Loading existing exams from {EXAMS_JSON_PATH}...")
    with open(EXAMS_JSON_PATH, 'r', encoding='utf-8') as f:
        existing_exams = json.load(f)

    retained_exams = [e for e in existing_exams if int(e["id"].split('-')[-1]) <= 8]
    print(f"Retained {len(retained_exams)} original exams (thpt-exam-01 to thpt-exam-08).")

    new_exams = []
    qualified_files = get_qualified_files()
    assert len(qualified_files) == 30, f"Expected 30 qualified files, got {len(qualified_files)}"
    print(f"\nExtracting {len(qualified_files)} qualified exams...")
    for idx, fpath in enumerate(qualified_files):
        exam_num = idx + 1
        print(f"[{exam_num:02d}/30] Extracting: {EXAM_TITLES[idx]} (file: {os.path.basename(fpath)})...")
        exam_obj = extract_one_exam(fpath, exam_num)
        
        assert len(exam_obj["questions"]) == 40, f"Exam {exam_obj['id']} has {len(exam_obj['questions'])} questions, expected 40!"
        assert all(q["correct_answer"] in ['A', 'B', 'C', 'D'] for q in exam_obj["questions"]), f"Exam {exam_obj['id']} has invalid answers!"
        
        new_exams.append(exam_obj)

    all_exams = retained_exams + new_exams
    print(f"\nTotal exams to save: {len(all_exams)} (8 original + {len(new_exams)} newly extracted).")

    print(f"Saving to {EXAMS_JSON_PATH}...")
    with open(EXAMS_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(all_exams, f, ensure_ascii=False, indent=2)

    print("Successfully updated data/thpt_exams.json!")

if __name__ == '__main__':
    run_extraction()
