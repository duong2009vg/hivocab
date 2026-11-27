# HiVocab — Design System (`DESIGN.md`)

## Visual World: Cozy Crayon Study Room
HiVocab's authenticated app screens operate in **Operate Mode** inside the **Cozy Crayon Study Room** visual world: warm cream sketchbook paper, tactile charcoal ink outlines, calm botanical sage for mastery, terracotta for primary study actions, and Bé Hổ Churbito + the 3D antique bookshelf as the signature moves.

> The world lends four things only: **type, palette, density, and the signature move**. Layout, navigation, and interactive controls remain clear, familiar, fast-scanning study tools.

## Color Tokens

| Role | Token / CSS Var | Hex | Usage |
| :--- | :--- | :--- | :--- |
| Canvas ground | `--hi-canvas` | `#FAF5EB` | Main page paper ground |
| Secondary panel / rail | `--hi-panel` | `#F5EFE3` | Desktop sidebar, subtle recessed strips |
| Elevated surface | `--hi-surface` | `#FFFDF9` | Primary cards, inspectors, modals |
| Primary ink & outline | `--hi-ink` / `--hi-border` | `#382E2B` | Headings, primary text (>11:1 contrast), crayon borders |
| Secondary muted ink | `--hi-muted` | `#6E6259` | Subtitles, metadata, captions (≥5.1:1 on `#FAF5EB`) |
| Subtle internal divider | `--hi-divider` | `#E3D7C5` | Inner borders, table dividers, track borders |
| Primary action (Terracotta) | `--hi-terracotta` | `#D95D39` | Main review/add CTAs, active alerts |
| Mastery / Active Nav (Sage) | `--hi-sage` | `#4D6B53` | Active sidebar item, mastered progress, completed quests |
| Focus / Exam (Cerulean) | `--hi-cerulean` | `#2A7BA0` | THPT exam roadmap, audio/lookup accents |
| Streak / Highlight (Amber) | `--hi-amber` | `#D98A1C` | Streaks, Pro crown, mid-level FSRS bars |

## Typography
- **UI & Body:** `Quicksand`, sans-serif (weights 500, 600, 700). Carries navigation, buttons, labels, body copy, and word rows.
- **Display / Brand Headings:** `Comfortaa`, `Quicksand`, sans-serif — reserved for page headlines, book covers, and brand marks (never used for dense UI metadata or tiny chips).
- **Phonetics & Data:** `SF Mono`, `Menlo`, `Consolas`, monospace for IPA; `font-variant-numeric: tabular-nums` on all counters, streak figures, percentages, and FSRS-6 metrics.
- **Scale:** Compact fixed `rem` steps suited for 13–14" laptops (`14.25px` root at 1024–1439px / short viewports, `15px` at 1440px, `16px` at 1600px+).

## Elevation & Borders
- **Cozy Crayon cards:** `2px solid #382E2B`, radius `20px–24px`, crisp tactile offset `2px 3px 0px #382E2B` (`shadow-crayonSm`).
- **Secondary / nested items:** Never nest heavy crayon shadows inside cards — inner items use soft `1px–1.5px` `#E3D7C5` borders on `#FAF5EB` or `#FFFFFF`.
- **Mobile Bottom Navigation:** Retains its dedicated floating frosted-glass capsule style (`bg-white/80 backdrop-blur-xl`, deep olive active pill `#5a7d4d`) per user preference.

## Motion & Accessibility
- **Easing:** Smooth exponential deceleration `--hi-ease-out: cubic-bezier(0.22, 1, 0.36, 1)` (`150ms–240ms`). No elastic/bounce easing (`cubic-bezier(0.34, 1.56, ...)` or `animate-bounce`).
- **Touch targets:** Minimum `44px × 44px` for mobile interactive controls and primary buttons.
- **Reduced motion:** All decorative animations respect `@media (prefers-reduced-motion: reduce)`.
- **Browser surfaces:** Selection uses warm amber tint (`rgba(217, 138, 28, 0.22)`), focus rings use `#4D6B53` (`2px solid` with `2px` offset).
