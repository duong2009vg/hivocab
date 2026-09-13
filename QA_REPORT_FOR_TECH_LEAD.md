# 📄 HIVOCAB - BÁO CÁO KIỂM THỬ KỸ THUẬT (QA HANDOFF REPORT)

**Người lập báo cáo**: QA / Software Tester  
**Dự án**: Hi - Master Vocabulary App (`hivocab`)  
**Đối tượng nhận báo cáo**: Tech Lead / Core Developers  
**Ngày lập**: 13/09/2026  
**Đánh giá tổng thể**: **7.5 / 10** — Tính năng phong phú, UI mượt và hiện đại. Tuy nhiên, tồn tại 2 lỗi nghiêm trọng liên quan đến logic cốt lõi Spaced Repetition và nguy cơ crash trang Topics, cùng 3 lỗi trung bình về múi giờ và cú pháp JavaScript.

---

## 1. BẢNG TỔNG HỢP TRIAGE & ĐỘ ƯU TIÊN (PRIORITY MATRIX)

| Mã lỗi | Mức độ (Severity) | Ưu tiên (Priority) | File ảnh hưởng | Tóm tắt sự cố | Đề xuất phân công |
|---|:---:|:---:|---|---|---|
| **[BUG-01]** | **HIGH** | **P1 (Khẩn cấp)** | `sessionEngine.js` | Từ mới (Lv0) làm sai vẫn tính là đúng, tự nhảy lên Lv1 và không quay lại queue | Core Algorithm Dev |
| **[BUG-02]** | **HIGH** | **P1 (Khẩn cấp)** | `dataLayer.js` | Fallback `getTopics` bị crash `TypeError: Cannot read properties of null` | Backend / DataLayer Dev |
| **[BUG-03]** | **MEDIUM** | **P2 (Quan trọng)** | `dataLayer.js` | Lệch múi giờ UTC/Local làm mất chuỗi Streak của user học từ 00h-07h sáng | Backend / DataLayer Dev |
| **[BUG-04]** | **MEDIUM** | **P2 (Quan trọng)** | `index.html` | Vỡ cú pháp JS (`SyntaxError`) khi tra/phát âm từ vựng có dấu nháy đơn (`'`) | Frontend Dev |
| **[BUG-05]** | **MEDIUM** | **P2 (Quan trọng)** | `thptExam.js` | Đường dẫn tuyệt đối `/data/thpt_exams.json` gây lỗi 404 khi deploy ở thư mục con | Frontend Dev |
| **[BUG-06]** | **LOW** | **P3 (Cải thiện)** | `sessionUI.js` | Paste từ ghép có gạch nối (`-`) bị nuốt ký tự trong bài tập Điền từ | Frontend UI Dev |
| **[BUG-07]** | **LOW** | **P3 (Cải thiện)** | `sessionUI.js` | Lắng nghe bàn phím toàn cục (`keydown`) không được dọn dẹp khi rời phiên học | Frontend UI Dev |

---

## 2. CHI TIẾT LỖI KỸ THUẬT & HƯỚNG DẪN KHẮC PHỤC

---

### 🔴 [BUG-01] Logic Spaced Repetition sai lệch: Từ mới làm SAI vẫn tự động hoàn thành và lên Level

- **File**: `sessionEngine.js`
- **Vị trí**: [sessionEngine.js:464-488](file:///c:/Users/MY%20PC/Documents/GitHub/hivocab/sessionEngine.js#L464-L488)
- **Tác động nghiệp vụ**:
  - Khi học một từ mới (`level === 0` hoặc `isNew === true`), nếu người dùng trả lời **SAI** (ở bài tập MCQ, Điền từ, hoặc Nghe điền), hệ thống hiển thị thông báo "Sai rồi, thử dạng bài khác nhé!", nhưng hàm `_processResult` lại **luôn luôn gán `rating = 'good'`**, đánh dấu `wordCompleted = true`, gọi `HiDB.reviewWord(..., 'good')` lên Supabase (nâng từ lên Level 1) và tăng `queueIndex++`.
  - Từ đó **không bao giờ quay lại hàng đợi** để người học thử lại dạng bài khác.
  - Điều này phá vỡ hoàn toàn nguyên lý học Spaced Repetition: chỉ hoàn thành phiên học khi người học trả lời đúng tất cả các từ.

#### Root Cause Analysis (RCA):
```javascript
// sessionEngine.js: dòng 464 - 488
const isNewWord = (item.word.level === 0) || (item.word.isNew === true);
if (isNewWord) {
    _state.completed.push({
        word:     item.word,
        rating:   'good',   // <-- LỖI: Tự động ép rating thành good bất kể đúng/sai
        attempts: item.attempts,
        isNew:    true,
    });

    if (typeof HiDB !== 'undefined') {
        HiDB.reviewWord(item.word.wordId, 'good') // <-- LỖI: Cập nhật DB lên Lv1
            .catch(err => console.error('[HiSession] reviewWord (new word) error:', err));
    }

    _state.queueIndex++;
    return {
        correct:       correct,
        correctAnswer,
        feedback:      correct ? '✓ Chính xác!' : `✗ Đáp án: ${correctAnswer}`,
        rating:        'good',
        wordCompleted: true,   // <-- LỖI: Luôn hoàn thành
        isNewWord:     true,
    };
}
```

#### Đề xuất Code Fix (Solution):
Chỉ cho phép từ mới hoàn thành khi người dùng trả lời **ĐÚNG**. Nếu làm **SAI**, phải đổi sang dạng bài tập khác và đẩy xuống cuối hàng đợi (`_state.queue.push(item)`) tương tự luồng của từ thông thường:
```javascript
// Thay thế đoạn xử lý isNewWord tại sessionEngine.js (dòng 464 - 488):
const isNewWord = (item.word.level === 0) || (item.word.isNew === true);
if (isNewWord) {
    if (correct) {
        _state.completed.push({
            word:     item.word,
            rating:   'good',
            attempts: item.attempts,
            isNew:    true,
        });

        if (typeof HiDB !== 'undefined') {
            HiDB.reviewWord(item.word.wordId, 'good')
                .catch(err => console.error('[HiSession] reviewWord (new word) error:', err));
        }

        _state.queueIndex++;

        return {
            correct:       true,
            correctAnswer,
            feedback:      '✓ Chính xác!',
            rating:        'good',
            wordCompleted: true,
            isNewWord:     true,
        };
    } else {
        // Làm sai: Tăng số lần fail, chuyển sang dạng bài khác và đưa về cuối queue
        item.failCount = (item.failCount || 0) + 1;
        let nextType;
        if (_state.allowedType) {
            nextType = _state.allowedType;
        } else {
            item.usedTypes.push(item.exerciseType);
            nextType = _pickNextType(item.usedTypes);
        }
        item.exerciseType = nextType;
        item.exerciseData = _generateExerciseData(item.word, nextType, _state.allWords);

        _state.queue.push(item);
        _state.queueIndex++;

        return {
            correct:          false,
            correctAnswer,
            feedback:         `✗ Đáp án: ${correctAnswer}`,
            wordCompleted:    false,
            nextExerciseType: nextType,
            failCount:        item.failCount,
            isNewWord:        true,
        };
    }
}
```

---

### 🔴 [BUG-02] Nguy cơ văng lỗi `TypeError` làm sập trang Chủ đề (Topics)

- **File**: `dataLayer.js`
- **Vị trí**: [dataLayer.js:298-300](file:///c:/Users/MY%20PC/Documents/GitHub/hivocab/dataLayer.js#L298-L300)
- **Tác động nghiệp vụ**:
  - Khi người dùng vào trang Topics, nếu RPC `get_topic_summaries` chưa được deploy hoặc lỗi mạng, hệ thống chạy vào khối truy vấn fallback.
  - Tại đây, code gọi `words.flatMap(w => w.word_progress)`. Với các từ chưa từng được học, `w.word_progress` là `null` hoặc `undefined`.
  - `flatMap` sẽ tạo mảng chứa `null` (`[null]`), sau đó gọi `.filter(p => p.user_id === user.id)`. Truy cập `p.user_id` trên `null` gây `TypeError: Cannot read properties of null (reading 'user_id')`.
  - Kết quả: Toàn bộ danh sách chủ đề bị vỡ, người dùng nhìn thấy màn hình trắng hoặc thông báo lỗi đỏ.

#### Root Cause Analysis (RCA):
```javascript
// dataLayer.js: dòng 298 - 300
const progresses = user
    ? words.flatMap(w => w.word_progress).filter(p => p.user_id === user.id)
    : [];
```

#### Đề xuất Code Fix (Solution):
```javascript
// Bổ sung default array || [] và kiểm tra falsy value:
const progresses = user
    ? words.flatMap(w => w.word_progress || []).filter(p => p && p.user_id === user.id)
    : [];
```

---

### 🟡 [BUG-03] Lệch múi giờ UTC/Local làm mất chuỗi học liên tục (Streak)

- **File**: `dataLayer.js`
- **Vị trí**: [dataLayer.js:1371](file:///c:/Users/MY%20PC/Documents/GitHub/hivocab/dataLayer.js#L1371) so với [1482-1495](file:///c:/Users/MY%20PC/Documents/GitHub/hivocab/dataLayer.js#L1482-L1495)
- **Tác động nghiệp vụ**:
  - Hàm `_logStudySession` dùng `new Date().toISOString().split('T')[0]`, chuỗi này được tính theo giờ **UTC**.
  - Trong khi đó, hàm tính streak `_calculateStreak` và lịch Heatmap dùng giờ địa phương của thiết bị (Việt Nam GMT+7).
  - *Ví dụ*: Học viên ôn tập vào lúc **05:00 sáng ngày 14/09/2026** tại Việt Nam. Lúc này giờ UTC vẫn là **22:00 ngày 13/09/2026**. Supabase sẽ ghi nhận phiên học vào ngày `2026-09-13`. Đến 08:00 sáng mở app, Dashboard kiểm tra ngày hôm nay (`2026-09-14`) thì không thấy phiên học nào, dẫn tới hiển thị mất chuỗi Streak hoặc người dùng bị hụt ngày học.

#### Đề xuất Code Fix (Solution):
Tạo helper `_getLocalDateString` dùng chung cho toàn bộ logic ghi log và tính streak:
```javascript
function _getLocalDateString(d = new Date()) {
    const y  = d.getFullYear();
    const m  = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

// Tại dataLayer.js dòng 1371 (trong _logStudySession):
// Thay: const today = new Date().toISOString().split('T')[0];
// Thành:
const today = _getLocalDateString();
```

---

### 🟡 [BUG-04] Lỗi vỡ cú pháp JavaScript (`SyntaxError`) khi xử lý từ có dấu nháy đơn (`'`)

- **File**: `index.html`
- **Vị trí**: [index.html:6171](file:///c:/Users/MY%20PC/Documents/GitHub/hivocab/index.html#L6171), [index.html:5349](file:///c:/Users/MY%20PC/Documents/GitHub/hivocab/index.html#L5349), [index.html:5484](file:///c:/Users/MY%20PC/Documents/GitHub/hivocab/index.html#L5484)
- **Tác động nghiệp vụ**:
  - Khi tra từ điển hoặc xem kho từ vựng có các từ tiếng Anh chứa dấu nháy đơn (ví dụ: `it's`, `let's`, `men's`, `o'clock`, `world's`), mã HTML render dạng inline:
    ```html
    onclick="document.getElementById('dict-input').value='${s}'; window.dictSearch()"
    ```
  - Khi nội suy chuỗi: `value='it's'` -> Dấu nháy đơn đóng chuỗi sớm, tạo ra lỗi cú pháp JavaScript: `Uncaught SyntaxError: Unexpected identifier 's'`.
  - Người dùng bấm vào từ đồng nghĩa hoặc nút loa phát âm không có phản hồi.

#### Đề xuất Code Fix (Solution):
Truyền dữ liệu qua thuộc tính `data-*` thay vì truyền trực tiếp vào chuỗi JavaScript inline:
```javascript
// 1. Tại index.html dòng 6169 - 6173 (render Synonyms):
synEl.innerHTML = r.synonyms.map(s => {
    const safeAttr = typeof _esc === 'function' ? _esc(s) : s;
    return `<span class="px-3 py-1 rounded-full bg-secondary-container/60 text-on-secondary-container text-xs font-medium cursor-pointer hover:bg-secondary-container transition-colors"
                  data-search-word="${safeAttr}"
                  onclick="document.getElementById('dict-input').value=this.dataset.searchWord; window.dictSearch()">${safeAttr}</span>`;
}).join('');

// 2. Tại index.html dòng 5349 và 5484 (nút phát âm):
// Thay chuỗi '${safeWord}' trực tiếp bằng this.dataset.audioWord:
<button data-audio-word="${_esc(w.word)}"
        onclick="if(typeof HiDict!=='undefined'&&HiDict.playWordAudio){HiDict.playWordAudio(this.dataset.audioWord)}else if('speechSynthesis' in window){const u=new SpeechSynthesisUtterance(this.dataset.audioWord);u.lang='en-US';window.speechSynthesis.speak(u);}"
        class="ml-auto p-1.5 rounded-full hover:bg-primary/10 transition-colors text-outline hover:text-primary cursor-pointer" 
        title="Phát âm">
    <span class="material-symbols-outlined text-[20px]">volume_up</span>
</button>
```

---

### 🟡 [BUG-05] Đường dẫn fetch tuyệt đối `/data/thpt_exams.json` gây lỗi 404 trên môi trường deploy thư mục con

- **File**: `thptExam.js`
- **Vị trí**: [thptExam.js:34](file:///c:/Users/MY%20PC/Documents/GitHub/hivocab/thptExam.js#L34)
- **Tác động nghiệp vụ**:
  - `fetch('/data/thpt_exams.json?v=' + Date.now())` chứa dấu gạch chéo đầu dòng (`/`) khiến trình duyệt luôn gửi request về gốc domain (Domain Root).
  - Khi ứng dụng được deploy trên GitHub Pages (URL dạng: `https://username.github.io/hivocab/`) hoặc bất kỳ staging/subfolder nào, request sẽ gửi đến `https://username.github.io/data/thpt_exams.json` và nhận lỗi **404 Not Found**. Kết quả là 38 bộ đề thi THPT không tải được.

#### Đề xuất Code Fix (Solution):
```javascript
// Sửa tại thptExam.js: dòng 34 (bỏ dấu gạch chéo đầu dòng)
const res = await fetch('data/thpt_exams.json?v=' + Date.now());
```

---

### 🟢 [BUG-06] Xử lý dán (paste) từ ghép có dấu gạch nối (`-`) bị mất ký tự

- **File**: `sessionUI.js`
- **Vị trí**: [sessionUI.js:585](file:///c:/Users/MY%20PC/Documents/GitHub/hivocab/sessionUI.js#L585)
- **Tác động nghiệp vụ**:
  - Khi người dùng copy-paste từ ghép (như `well-known`, `state-of-the-art`, `part-time`) vào bài tập Điền từ, đoạn code:
    ```javascript
    const chars = val.toUpperCase().replace(/[^A-Z0-9]/g, '').split('');
    ```
    loại bỏ toàn bộ dấu `-`.
  - Trong khi đó, giao diện vẫn render 1 ô dành cho dấu `-`. Việc thiếu ký tự khiến toàn bộ các chữ cái phía sau bị lệch ô và chấm sai đáp án.

#### Đề xuất Code Fix (Solution):
```javascript
// Cho phép giữ lại dấu gạch ngang và dấu nháy đơn khi paste:
const chars = val.toUpperCase().replace(/[^A-Z0-9\-']/g, '').split('');
```

---

### 🟢 [BUG-07] Rò rỉ sự kiện bàn phím toàn cục (`keydown`) khi chuyển trang

- **File**: `sessionUI.js`
- **Vị trí**: [sessionUI.js:71-74](file:///c:/Users/MY%20PC/Documents/GitHub/hivocab/sessionUI.js#L71-L74)
- **Tác động nghiệp vụ**:
  - Hàm `init()` gắn lắng nghe phím tắt trên thẻ `window` nhưng không có cơ chế `removeEventListener` khi kết thúc hoặc thoát khỏi phiên học.
  - Khi người dùng chuyển sang trang khác (như trang Đề thi THPT hoặc đọc bài), listener này vẫn chạy ngầm và có thể chặn phím Spacebar cuộn trang mặc định của trình duyệt.

#### Đề xuất Code Fix (Solution):
Bổ sung hàm `destroy()` cho `HiSessionUI`:
```javascript
function destroy() {
    if (_keyListenerAttached) {
        window.removeEventListener('keydown', _handleFlashcardKeydown);
        _keyListenerAttached = false;
    }
}

// Bổ sung vào return của HiSessionUI:
return {
    init,
    destroy,
    ...
};
```
Và gọi `HiSessionUI.destroy()` trong hàm `window.navigateTo` khi rời khỏi trang `learning`.

---

## 3. KIẾN NGHỊ VÀ KẾ HOẠCH BÀN GIAO TIẾP THEO

1. **Thứ tự ưu tiên xử lý (Sprint Backlog)**:
   - **Sprint 1 (Ngay lập tức)**: Fix **[BUG-01]** (Core logic Spaced Repetition) và **[BUG-02]** (Crash getTopics fallback).
   - **Sprint 2**: Fix **[BUG-03]** (Múi giờ Streak), **[BUG-04]** (Lỗi Syntax dấu nháy đơn) và **[BUG-05]** (Đường dẫn tương đối cho đề thi THPT).
   - **Sprint 3 (Tối ưu UX)**: Fix **[BUG-06]** (Paste từ ghép) và **[BUG-07]** (Dọn dẹp event listener).

2. **Hỗ trợ từ QA**:
   - QA đã sẵn sàng kịch bản kiểm thử hồi quy (Regression Test). Ngay khi Tech Lead / Dev hoàn thành các commit fix, QA sẽ tiến hành chạy test xác nhận (Verification Test) và nghiệm thu chất lượng hệ thống.

---
*Báo cáo được hoàn thiện bởi QA Tester cho dự án HiVocab.*
