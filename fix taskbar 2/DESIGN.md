---
name: Cozy Study Nook
colors:
  surface: '#fff8f3'
  surface-dim: '#e0d9d3'
  surface-bright: '#fff8f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf2ec'
  surface-container: '#f4ede6'
  surface-container-high: '#eee7e1'
  surface-container-highest: '#e8e1db'
  on-surface: '#1e1b17'
  on-surface-variant: '#43483f'
  inverse-surface: '#33302c'
  inverse-on-surface: '#f7efe9'
  outline: '#74796f'
  outline-variant: '#c4c8bc'
  surface-tint: '#4b6540'
  primary: '#4b6540'
  on-primary: '#ffffff'
  primary-container: '#86a378'
  on-primary-container: '#203918'
  inverse-primary: '#b1cfa1'
  secondary: '#8d4e24'
  on-secondary: '#ffffff'
  secondary-container: '#feab79'
  on-secondary-container: '#783d14'
  tertiary: '#3b6379'
  on-tertiary: '#ffffff'
  tertiary-container: '#78a0b8'
  on-tertiary-container: '#05374b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ccecbc'
  primary-fixed-dim: '#b1cfa1'
  on-primary-fixed: '#092104'
  on-primary-fixed-variant: '#344d2a'
  secondary-fixed: '#ffdbc9'
  secondary-fixed-dim: '#ffb68c'
  on-secondary-fixed: '#321200'
  on-secondary-fixed-variant: '#70370f'
  tertiary-fixed: '#c3e8ff'
  tertiary-fixed-dim: '#a4cce5'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#214b60'
  background: '#fff8f3'
  on-background: '#1e1b17'
  surface-variant: '#e8e1db'
typography:
  display-lg:
    fontFamily: Comfortaa
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Comfortaa
    fontSize: 38px
    fontWeight: '700'
    lineHeight: 46px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Comfortaa
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Comfortaa
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
  headline-sm:
    fontFamily: Comfortaa
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Comfortaa
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
  label-md:
    fontFamily: Comfortaa
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Comfortaa
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

This design system embraces an affectionate, tactile, and hand-illustrated picture-book aesthetic. It draws inspiration from cozy lo-fi study spaces, storybook picture illustrations, and children's stationery notebooks. The primary emotional goal is to transform daily habit formation—specifically hydration and wellness tracking—from a clinical or rigid chore into a comforting, mindful ritual shared with a companion mascot.

The visual style blends **Tactile Storybook Skeuomorphism** with warm, soft-minimal surface construction:
- **Paper Realism:** Surfaces evoke textured washi paper, warm fibrous vellum, and creamy handmade craft stock rather than cold digital white.
- **Organic Crayon & Colored Pencil Strokes:** UI boundaries, speech bubbles, indicators, and numeric display metrics mimic organic, hand-pressured pencil or crayon sketches with subtle wobble and softening.
- **Sticker & Paper Cutout Depth:** Interactive cards, pills, and bottom sheets mimic smooth die-cut paper layers resting gently on the desk canvas.
- **Tone of Voice:** Warm, conversational, reassuring, and gentle. The system avoids clinical jargon ("80 FL OZ CONSUMED") in favor of friendly guidance ("Churbito counts every sip you take!").

## Colors

The palette is rooted in muted pastel pigments reminiscent of vintage wax crayons and colored artist pencils applied over warm handmade paper:

- **Primary (`#86a378` - Sage Matcha):** Used for primary confirmations, completed state markers, selected cards, progress washes, and comforting affirmations.
- **Secondary (`#e89868` - Warm Tiger Ochre / Peach):** Evokes the cozy fur of the study mascot, sunset table lamps, warmth, and active highlight states.
- **Tertiary (`#88b0c8` - Dusty Hydration Blue):** The signature sketch tone for water quantities, dynamic drawn liquid values, and fluid habit meters.
- **Accent Soft Lavender (`#b7a6cb`):** Used sparingly for background rugs, cozy cushions, and secondary informational badges.
- **Neutrals & Surfaces:**
  - Base Paper Canvas: `#f6f3eb` to `#faf7f0` textured warm vellum.
  - Card & Modal Sheet Container: `#fffefb` (warm creamy stationery white) and translucent Sage Tint (`rgba(134, 163, 120, 0.14)`).
  - Pencil Ink Neutral: `#2d2a26` (soft charcoal pencil graphite, deliberately avoiding harsh `#000000` pitch black to maintain hand-drawn softness).
  - Muted Graphite Note: `#746e66` for secondary descriptions, hints, and subtle dividers.

## Typography

Typography establishes an inviting balance between child-like handwritten storybook warmth and clear mobile glanceability:

- **Display & Headlines (`Comfortaa`):** Expresses the round, chubby, organic contour of crayon marks and friendly speech bubbles. All main headers, key numbers, dialogues, and button titles use rounded geometric terminals to simulate marker-lettered sketchbook notes.
- **Body & Secondary Copy (`Plus Jakarta Sans`):** Provides soft, humanistic clarity for multiple lines of copy, secondary units, and data descriptions. While maintaining rounded apertures that complement the headline font, it ensures high legibility on small mobile displays.
- **Custom Drawn Numbers:** Primary target metric digits (e.g., "90 oz", "6 oz") feature thick hollow or shaded crayon outlines reminiscent of colored pencil doodles in the tertiary blue tint (`#88b0c8`).

## Layout & Spacing

The layout is built as a focused, single-column storybook viewport optimized for natural vertical reading on mobile devices:

- **Canvas Anchoring:** Content is organized vertically into a tranquil hierarchy: 
  1. Upper thought/narrative block (soft conversational headers).
  2. Central illustrated character vignette (mascot, room plants, cozy furniture).
  3. Lower interactive paper card / sheet (choice tiles, bottom-docked action buttons, sip incrementers).
- **Rhythm & Grid:** A lightweight 4-column mobile grid with generous `1.25rem` (`20px`) outer page margins ensures interactive touch targets remain insulated from device edges while preserving an airy, storybook feeling.
- **Whitespace Allocation:** Vertical breathing space (`space-xl`) between narrative bubbles and mascot illustrations prevents the UI from feeling congested, letting the hand-drawn elements feel placed on a physical work surface.

## Elevation & Depth

Rather than relying on modern blurred drop-shadows or stark harsh elevation levels, depth in this system is created through physical stationery layering:

- **Layer 0 (Canvas):** Warm, fibrous grain background (`#f6f3eb`) with an optional micro paper-texture overlay.
- **Layer 1 (Card & Paper Slips):** Soft creamy beige (`#fffefb`) or pale tinted sage (`rgba(134, 163, 120, 0.18)`). Cards feature gentle 1px to 1.5px organic graphite borders (`rgba(45, 42, 38, 0.12)`) and subtle paper-press drop shadows (`box-shadow: 0 4px 12px rgba(100, 90, 75, 0.05)`).
- **Layer 2 (Floating Sheets & Modals):** White stationery bottom sheets that slide up like sticky notepads. They use a rounded pill drag handle (`#c7c2b6`) and a warm ambient perimeter haze (`box-shadow: 0 -8px 24px rgba(70, 60, 45, 0.08)`).
- **Speech Bubbles & Mascot Prompts:** Rendered with hand-drawn organic pebble hulls, finished with a subtle crayon fill tone and paper edge border.

## Shapes

The shape philosophy is organic, soft, and hand-finished:

- **Pill & Pebble Rounding:** High-radius pill forms (`roundedness: 3`) dominate buttons, badges, increment circles, and speech bubbles to create a cozy, friendly, and non-threatening aesthetic.
- **Wobbly / Organic Curves:** Interactive cards, selection containers, and speech bubbles apply slightly asymmetrical border radii (e.g., `22px 26px 20px 24px`) to mimic naturally cut paper craft or hand-sketched boundaries.
- **Checkmarks & Icons:** Minimalist, hand-drawn outline icons with rounded cap terminals and uneven line weights that resemble ballpoint or soft pencil doodles.

## Components

### Buttons
- **Primary Action Pill:** Generous 56px height, fully pill-shaped (`border-radius: 9999px`), filled with muted sage green (`#86a378`) and charcoal pencil text (`#2d2a26`). Active/pressed states exhibit a gentle 0.98 scale and slightly darker moss tint (`#749267`).
- **Secondary / Ghost Pill:** Pale cream surface (`#fffefb`) with a faint 1.5px hand-sketched border (`rgba(45, 42, 38, 0.18)`) and charcoal labeling.
- **Stepper Buttons (+ / -):** 40px circular pebble buttons with pale sage tint (`rgba(134, 163, 120, 0.2)`), featuring centered, rounded-terminal symbols.

### Selection Cards & Option Tiles
- Softly rounded rectangular blocks (`rounded-xl` / ~20px) styled with low-contrast sketch boundaries.
- **Selected State:** Filled with a soft matcha wash (`rgba(134, 163, 120, 0.24)`), bordered with a 1.5px solid sage outline (`#86a378`), and marked with a circular check icon at the right edge.
- **Unselected State:** Filled with creamy white (`#fffefb`) or subtle muted cream (`rgba(255, 254, 251, 0.7)`), separated by 8px gaps.

### Quick-Select Chips
- Pill or rounded rectangular mini-badges (e.g., "4 oz", "6 oz", "10 oz", "24 oz").
- Highlighted chip uses an outlined sage badge (`#86a378` border with `#eef4eb` interior) to indicate the active volume before pouring.

### Input Fields & Steppers
- Styled as clean notebook entry rows: left-aligned icon doodled in colored pencil, comfortable typography, and subtle chevron indicators on the right.
- Numerical displays highlight large crayon-outlined values with smaller subscript unit labels (`oz`, `ml`).

### Speech Bubbles & Dialog Prompts
- Pebble-shaped organic enclosures (`border-radius: 28px 24px 26px 8px`) colored in mossy sage green or warm peach with slight pencil-textured shading, containing encouraging dialogue lines spoken by the study companion mascot.

### Bottom Sheet (Add Sip & Logs)
- Slides over the canvas as a thick cream card with a top-center rounded pill pull handle, housing quick-tap sip presets and increment controls.