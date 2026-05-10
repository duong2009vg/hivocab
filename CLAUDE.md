# Hi - Master Vocabulary App

## Tổng quan
App học từ vựng tiếng Anh theo phương pháp lặp lại ngắt quãng (Spaced Repetition).
Frontend hoàn chỉnh trong A7.html. Backend dùng Supabase.

---

## Stack & Files

| File | Vai trò |
|---|---|
| `A7.html` | Toàn bộ UI, routing hash-based, KHÔNG tách file |
| `dataLayer.js` | Module `HiDB` — mọi tương tác với Supabase |
| `sessionEngine.js` | Module `HiSession` — thuật toán SM-2, quản lý phiên học |
| `sessionUI.js` | Module `HiSessionUI` — render 4 dạng bài tập |
| `dictionary.js` | Wrapper Free Dictionary API |
| `supabase_schema.sql` | Schema DB — KHÔNG tự sửa, hỏi trước |

---

## Design System — KHÔNG được thay đổi

### Màu sắc (Material Design 3 tokens)
```
Primary:           #006192
Secondary:         #316762
Tertiary:          #ac2e00
Surface:           #f9faf7
On-surface:        dùng class text-on-surface
Error:             dùng class text-error / bg-error
```

### Typography
- Font chính: **Hanken Grotesk**
- Landing page: **Inter**
- Icons: **Google Material Symbols Outlined** (class: `material-symbols-outlined`)
- Icon filled: thêm class `icon-fill`

### Component classes hay dùng
```css
glass-card        /* glassmorphism card: bg blur + border */
soft-shadow       /* box-shadow nhẹ */
fade-in           /* animation xuất hiện */
active:scale-95   /* feedback khi bấm */
hover:-translate-y-1  /* hover card nổi lên */
```

### Card chuẩn
```html
<div class="glass-card soft-shadow rounded-xl p-5 md:p-6">...</div>
<!-- hoặc dạng blur mạnh hơn: -->
<div class="bg-surface-container-lowest/80 backdrop-blur-[24px] border border-outline-variant/30 rounded-2xl soft-shadow">...</div>
```

### Button chuẩn
```html
<!-- Primary -->
<button class="bg-primary text-on-primary px-6 py-3.5 rounded-xl md:rounded-full font-bold text-sm hover:bg-surface-tint transition-colors">

<!-- Secondary/Ghost -->
<button class="bg-primary/10 text-primary hover:bg-primary/20 font-bold text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-1">

<!-- Disabled -->
<button class="bg-surface-variant text-on-surface-variant px-6 py-3.5 rounded-xl font-bold text-sm cursor-not-allowed opacity-50" disabled>
```

### Dark mode
- Toggle qua class `dark` trên thẻ `<html>`
- Lưu vào `localStorage('theme')`
- Hàm: `window.toggleTheme()`

---

## Layout

### Desktop
- Sidebar trái cố định: `w-64`, fixed
- Main content: `lg:ml-64`
- Max width content: `max-w-5xl mx-auto`

### Mobile
- Fixed top header (height ~64px): `pt-20`
- Fixed bottom nav bar: `pb-28`
- Không có sidebar

### Routing
- Hash-based: `#dashboard`, `#topics`, `#topic-detail`, `#vocabulary`, `#settings`, `#learning`
- Hàm điều hướng: `navigateTo('dashboard')`
- Mỗi page là `<div id="page-xxx" class="page">`

---

## Supabase — Database Schema

### Bảng chính
```
topics         (id, user_id, name, icon, created_at, updated_at)
words          (id, topic_id, word, phonetic, meaning, example_sentence, created_at)
word_progress  (id, user_id, word_id, level, next_review_at, last_reviewed_at, review_count)
study_sessions (id, user_id, session_date, words_reviewed, created_at)
```

### Quy tắc Supabase
- RLS bật trên tất cả bảng — mọi query tự filter theo `auth.uid()`
- KHÔNG dùng `localStorage` để lưu data
- KHÔNG query trực tiếp DB, phải qua `HiDB`

---

## HiDB API (dataLayer.js)

```js
// Auth
HiDB.init(url, key)
HiDB.getCurrentUser()
HiDB.signInWithGoogle()
HiDB.signOut()

// Topics
HiDB.getTopics()                    // → [{ id, name, icon, totalWords, progress }]
HiDB.createTopic(name, icon)
HiDB.deleteTopic(topicId)

// Words
HiDB.getWordsInTopic(topicId)       // → [{ id, word, phonetic, meaning, level, isDue }]
HiDB.addWord(topicId, { word, phonetic, meaning, exampleSentence })
HiDB.deleteWord(wordId)

// SM-2
HiDB.getWordsDueForReview(limit)    // → words cần ôn hôm nay
HiDB.reviewWord(wordId, rating)     // rating: 'easy'|'good'|'hard'
HiDB.calculateNextReview(level, rating) // → { newLevel, nextReviewAt }
HiDB.getIntervalLabel(level)        // → '1 giờ' | '8 giờ' | ...

// Dashboard
HiDB.getDashboardStats()            // → { wordsDueCount, streak, memoryLevels }
```

---

## SM-2 Algorithm

```
Level 1 → ôn lại sau 1 giờ
Level 2 → ôn lại sau 8 giờ
Level 3 → ôn lại sau 24 giờ
Level 4 → ôn lại sau 5–7 ngày (random)
Level 5 → ôn lại sau 15–30 ngày (random)

easy → level + 1 (tối đa 5)
good → giữ nguyên level
hard → level - 1 (tối thiểu 1)
```

---

## HiSession API (sessionEngine.js)

```js
HiSession.startSession(words)       // khởi tạo phiên với mảng words từ HiDB
HiSession.getCurrentItem()          // → { word, exerciseType, exerciseData, attempts }
HiSession.getProgress()             // → { completed, total, percent }
HiSession.isComplete()              // → boolean
HiSession.submitAnswer(userAnswer)  // MCQ: index | Fill/Listen: string
HiSession.rateFlashcard(rating)     // 'easy'|'good'|'hard'
HiSession.speakWord(word, rate)     // TTS qua Web Speech API
HiSession.endSession()              // → { wordsReviewed, completedWords }
```

### Logic phiên học
- User phải trả lời **ĐÚNG tất cả từ** mới kết thúc phiên
- Trả lời **SAI** → đổi sang dạng bài khác, đẩy xuống cuối queue
- Trả lời **ĐÚNG** → từ vào completed, gọi `HiDB.reviewWord()` async

---

## HiSessionUI API (sessionUI.js)

```js
HiSessionUI.init()    // bind #exercise-container, gọi trước startSession
HiSessionUI.render()  // render exercise hiện tại từ HiSession.getCurrentItem()
```

### 4 dạng bài tập
| Type | Mô tả |
|---|---|
| `flashcard` | Mặt trước: nghĩa tiếng Việt → Mặt sau: từ + phiên âm + Hard/Good/Easy |
| `mcq` | Hiện từ tiếng Anh → chọn 1 trong 4 nghĩa tiếng Việt |
| `fill` | Câu ví dụ có chỗ trống → điền từng chữ cái |
| `listen` | Phát âm thanh → nhập từ nghe được |

---

## Dictionary API (dictionary.js)

```js
// Tra từ — trả về null nếu không tìm thấy
await lookupWord('serendipity')
// → { phonetic, audioUrl, definition, example, synonyms }

// Phát âm chuẩn bằng audio URL thật (ưu tiên hơn Web Speech API)
await playWordAudio('serendipity')
```

**Endpoint:** `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
Không cần API key, không giới hạn request.

---

## Quy tắc khi code — BẮT BUỘC

1. **KHÔNG thay đổi màu sắc, font, spacing** của design system
2. **KHÔNG dùng localStorage** để lưu data người dùng
3. **KHÔNG viết lại cả file** — chỉ sửa đúng hàm/section được yêu cầu
4. **KHÔNG tạo thêm file JS mới** nếu không được yêu cầu — thêm vào file có sẵn
5. Mọi call Supabase phải qua **HiDB**, không query thẳng `_supabase`
6. Mọi exercise phải qua **HiSession + HiSessionUI**, không render thẳng HTML
7. Khi thêm UI mới phải dùng đúng **class Tailwind** từ design system, không dùng inline style
8. Responsive: luôn có cả class `md:` và mobile class

---

## Các tính năng chưa làm (TODO)

- [ ] Modal thêm từ mới (có auto-fill từ Dictionary API)
- [ ] Google OAuth thật (thay mock login)
- [ ] Dashboard stats thật từ Supabase
- [ ] Tìm kiếm từ vựng (search box đã có UI)
- [ ] Export từ vựng ra CSV
