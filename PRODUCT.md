# HiVocab — Product Context

## What HiVocab Is
HiVocab is a Vietnamese–English vocabulary and exam preparation web application built for Vietnamese high school students (THPT Quốc Gia 2026–2027), IELTS learners, and self-learners. It combines spaced repetition (FSRS-6 DSR memory engine), a 3D interactive bookshelf of curated and personal topic decks, bilingual IELTS/news reading with reveal curtains, YouTube Shadowing & Dictation studio with AI IPA pronunciation feedback, CBT exam rooms, and vocabulary PvP games.

## Audience & Usage Context
- **Primary users:** Vietnamese students aged 15–24 studying daily on 13–14" laptops (often at 125% Windows scaling) and smartphones (390px–430px viewports) during short commute bursts or focused 20–45 minute study sessions.
- **Language:** Vietnamese UI copy with English target vocabulary, IPA phonetics, and bilingual examples.
- **Primary daily loop:**
  1. Check due reviews on **Trang chủ** (`dashboard`) and launch an FSRS-6 review session immediately.
  2. Browse or resume a study book on **Chủ đề** (`topics`) — the signature 3D antique bookshelf.
  3. Search, filter by memory level (L0–L5), inspect FSRS-6 memory metrics, and drill specific words in **Sổ từ cá nhân** (`vocabulary`).
  4. Practice active skills in **Lộ trình THPT** (`exercises`), **Đọc song ngữ** (`bilingual-reading`), **Shadowing & Dictation** (`studio`), and **Tra cứu từ điển** (`dictionary`).

## Core Product Truths
- **Brand companion:** Bé Hổ Churbito mascot (`/mascot/mascot_cozy.png` and themed mascot illustrations) anchors warmth and encouragement without interfering with focused study.
- **Engine accuracy:** Spaced repetition runs on **FSRS-6** (Stability, Difficulty, Retrievability — DSR model), never stale legacy labels.
- **Real content & metrics:** Always display real user counts, due word counts, streak days, and authentic THPT exam counts (48 exam papers & 29 topics).
- **Platform:** React 19 + Vite 6 + Tailwind CSS 3.4 + Supabase + Cloudflare Pages/Workers.
