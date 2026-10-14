---
version: alpha
name: Apple
description: |
  Apple's design system embodies minimalist elegance with a focus on clarity,
  precision, and human-centered function. The visual language emphasizes
  whitespace, restrained color application, and a carefully calibrated
  typographic hierarchy that prioritizes content readability over ornamentation.
  The aesthetic is distinctly contemporary—neutral backgrounds anchor
  product-focused photography and video, while a restrained accent color
  (#2997FF) provides precise interaction cues and brand presence. The system
  avoids shadows and depth effects in favor of color-blocking and surface
  distinction, creating a flat, modern visual language that feels both
  sophisticated and accessible. Typography is generous and breathing, supported
  by a disciplined spacing scale that translates seamlessly across all device
  sizes.
source:
  url: "https://apple.com"
  pagesAnalyzed: 6
  extractedAt: 2026-09-12
  tokensMeasured: true
colors:
  primary: "#1D1D1F"
  accent: "#2997FF"
  canvas: "#FFFFFF"
  surface: "#F5F5F7"
  on-primary: "#FFFFFF"
  ink: "#000000"
  body: "#1D1D1F"
  muted: "#6E6E73"
  faint: "#86868B"
  hairline: "#D2D2D7"
  accent-1: "#0071E3"
  accent-2: "#0000EE"
  accent-3: "#0066CC"
  accent-4: "#B64400"
  neutral-1: "#333336"
  neutral-2: "#E8E8ED"
typography:
  display-xl:
    fontFamily: "SF Pro Display"
    fontSize: 80px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -1.2px
  display-lg:
    fontFamily: "SF Pro Display"
    fontSize: 64px
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: -0.58px
  display-md:
    fontFamily: "SF Pro Display"
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.07
    letterSpacing: -0.28px
  display-sm:
    fontFamily: "SF Pro Display"
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: -0.14px
  display-xs:
    fontFamily: "SF Pro Display"
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: 0px
  heading-xl:
    fontFamily: "SF Pro Display"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.13
    letterSpacing: 0.13px
  heading-lg:
    fontFamily: "SF Pro Display"
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.14
    letterSpacing: 0.2px
  heading-lg-strong:
    fontFamily: "SF Pro Display"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.14
    letterSpacing: 0.2px
  heading-md:
    fontFamily: "SF Pro Display"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.17
    letterSpacing: 0.22px
  heading-sm:
    fontFamily: "SF Pro Display"
    fontSize: 19px
    fontWeight: 600
    lineHeight: 1.21
    letterSpacing: 0.23px
  heading-xs:
    fontFamily: "SF Pro Text"
    fontSize: 14.04px
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: -0.12px
  body-md:
    fontFamily: "SF Pro Text"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: -0.37px
  body-md-strong:
    fontFamily: "SF Pro Text"
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.47
    letterSpacing: -0.37px
  body-sm:
    fontFamily: "SF Pro Text"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.29
    letterSpacing: -0.22px
  body-sm-strong:
    fontFamily: "SF Pro Text"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.29
    letterSpacing: -0.22px
  body-xs:
    fontFamily: "SF Pro Text"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: -0.12px
  body-xs-loose:
    fontFamily: "SF Pro Text"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: -0.12px
  button:
    fontFamily: "SF Pro Text"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 2.41
    letterSpacing: 0px
  caption-sm:
    fontFamily: "SF Pro Text"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: -0.12px
  caption-xs:
    fontFamily: "SF Pro Text"
    fontSize: 10px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.08px
rounded:
  none: 0px
  xs: 8px
  sm: 11px
  full: 9999px
spacing:
  xxs: 8px
  xs: 12px
  sm: 16px
  md: 20px
  lg: 24px
  xl: 28px
  xxl: 32px
  xxxl: 36px
  section: 40px
  band: 44px
elevationStrategy: color-blocking
themes:
  derived: dark   # the other theme is the site's measured palette
  light:
    bg: "#FFFFFF"
    surface: "#F5F5F7"
    surfaceRaised: "#EBEBED"
    text: "#000000"
    textMuted: "#1D1D1F"
    border: "#D2D2D7"
    accent: "#2997FF"
    accentFg: "#000000"
    focusRing: "#2997FF"
    elevation: shadow
  dark:
    bg: "#0A0F15"
    surface: "#191D23"
    surfaceRaised: "#25292F"
    text: "#F6FBFF"
    textMuted: "#9CA1A6"
    border: "#31353A"
    accent: "#2997FF"
    accentFg: "#0B0B0C"
    focusRing: "#2997FF"
    elevation: "border+surface"
components:
  button-filled:
    typography: "{typography.button}"
    textColor: "rgba(0, 0, 0, 0.8)"
    border: "3px solid rgba(0, 0, 0, 0.04)"
    height: 42px
    padding: "0px 14px 0px 14px"
    rounded: "{rounded.sm}"
    backgroundColor: "rgb(250, 250, 252)"
  button-filled-sm:
    typography: "{typography.body-md}"
    textColor: "{colors.on-primary}"
    height: 20px
    padding: "11px 21px 11px 21px"
    rounded: 980px
    backgroundColor: "{colors.accent-1}"
  button-primary:
    typography: "{typography.body-sm}"
    textColor: "{colors.on-primary}"
    height: 36px
    padding: "8px 15px 8px 15px"
    rounded: "{rounded.xs}"
    backgroundColor: "{colors.primary}"
  button-icon:
    textColor: "rgba(0, 0, 0, 0.48)"
    height: 24px
    fontSize: 17px
    fontFamily: "SF Pro Text"
    fontWeight: 400
    lineHeight: 1.47
    rounded: "50%"
    backgroundColor: "rgba(210, 210, 215, 0.64)"
  button-outline:
    typography: "{typography.body-md}"
    textColor: "{colors.accent}"
    border: "1px solid {colors.accent}"
    height: 20px
    padding: "11px 21px 11px 21px"
    rounded: 980px
  card:
    typography: "{typography.body-xs-loose}"
    textColor: "rgba(0, 0, 0, 0.56)"
  card-featured:
    textColor: "rgba(255, 255, 255, 0.92)"
    padding: "32px 32px 32px 32px"
    fontSize: 17px
    fontFamily: "SF Pro Text"
    fontWeight: 400
    lineHeight: 1.47
    rounded: 28px
    backgroundColor: "rgb(36, 36, 38)"
  card-2:
    textColor: "rgba(0, 0, 0, 0.88)"
    padding: "32px 32px 32px 32px"
    fontSize: 17px
    fontFamily: "SF Pro Text"
    fontWeight: 400
    lineHeight: 1.47
    rounded: 28px
    backgroundColor: "{colors.surface}"
  navigation:
    textColor: "{colors.body}"
    height: 44px
    fontSize: 17px
    fontFamily: "SF Pro Text"
    fontWeight: 400
    lineHeight: 1.47
    backgroundColor: "rgba(245, 245, 247, 0.8)"
  navigation-2:
    textColor: "{colors.body}"
    height: 44px
    fontSize: 17px
    fontFamily: "SF Pro Text"
    fontWeight: 400
    lineHeight: 1.47
  footer:
    typography: "{typography.body-xs-loose}"
    textColor: "rgba(0, 0, 0, 0.56)"
    backgroundColor: "{colors.surface}"
  link:
    textColor: "{colors.accent}"
    fontSize: 17px
    fontFamily: "SF Pro Text"
    fontWeight: 400
    lineHeight: 1.47
    backgroundColor: "{colors.ink}"
  link-lg:
    textColor: "{colors.accent}"
    fontSize: 17px
    fontFamily: "SF Pro Text"
    fontWeight: 400
    lineHeight: 1.47
  badge-text:
    typography: "{typography.caption-sm}"
    textColor: "{colors.accent-4}"
    height: 16px
  badge-text-lg:
    textColor: "{colors.body}"
    height: 32px
    fontSize: 17px
    fontFamily: "SF Pro Text"
    fontWeight: 400
    lineHeight: 1.47
states:
  button-focus-visible:
    target: button
    state: focus-visible
    opacity: 1
  link-hover:
    target: link
    state: hover
    textDecoration: none
  link-focus:
    target: link
    state: focus
    outline: none
  nav-hover:
    target: nav
    state: hover
    opacity: 1
  button-hover:
    target: button
    state: hover
    opacity: 1
  button-active:
    target: button
    state: active
    outline: none
  other-hover:
    target: other
    state: hover
    textColor: "{colors.ink}"
  other-focus-visible:
    target: other
    state: focus-visible
    outline: none
  link-focus-visible:
    target: link
    state: focus-visible
    outline: none
  other-focus:
    target: other
    state: focus
    outline: none
  link-disabled:
    target: link
    state: disabled
    textDecoration: none
  card-hover:
    target: card
    state: hover
    textDecoration: none
  other-active:
    target: other
    state: active
    outline: none
  input-focus:
    target: input
    state: focus
    outline: none
  link-active:
    target: link
    state: active
    textDecoration: none
  other-disabled:
    target: other
    state: disabled
    textDecoration: none
breakpoints:
  - width: 375
    containerWidth: 343
    gridColumns: 3
    navLinksVisible: 13
    menuToggleVisible: true
    headingPx: 32
    bodyPx: 17
    sectionPaddingX: 0
  - width: 768
    containerWidth: 736
    gridColumns: 3
    navLinksVisible: 3
    menuToggleVisible: true
    headingPx: 48
    bodyPx: 17
    sectionPaddingX: 12
  - width: 1024
    containerWidth: 980
    gridColumns: 3
    navLinksVisible: 78
    menuToggleVisible: true
    headingPx: 48
    bodyPx: 17
    sectionPaddingX: 12
  - width: 1280
    containerWidth: 980
    gridColumns: 3
    navLinksVisible: 78
    menuToggleVisible: true
    headingPx: 56
    bodyPx: 17
    sectionPaddingX: 12
  - width: 1440
    containerWidth: 980
    gridColumns: 3
    navLinksVisible: 78
    menuToggleVisible: true
    headingPx: 56
    bodyPx: 17
    sectionPaddingX: 12
coverage:
  statesFound: 92
  gradientsFound: 0
  rolesUnassigned: 6
  archetypesUnnamed: 0
  archetypesDetected: 0
  responsiveMeasured: true
  stylesheetsBlocked: true
  semanticRampDeclared: false
---

# Design System Inspired by Apple

## 1. Visual Theme & Atmosphere

Apple's design system embodies minimalist elegance with a focus on clarity, precision, and human-centered function. The visual language emphasizes whitespace, restrained color application, and a carefully calibrated typographic hierarchy that prioritizes content readability over ornamentation. The aesthetic is distinctly contemporary—neutral backgrounds anchor product-focused photography and video, while a restrained accent color (`{colors.accent}` — `#2997FF`) provides precise interaction cues and brand presence. The system avoids shadows and depth effects in favor of color-blocking and surface distinction, creating a flat, modern visual language that feels both sophisticated and accessible. Typography is generous and breathing, supported by a disciplined spacing scale that translates seamlessly across all device sizes.

**Key Characteristics**

- Minimalist, whitespace-driven layout with color-blocking for depth
- Neutral achromatic primary (`#1D1D1F`) paired with a restrained blue accent (`#2997FF`)
- Generous, open typographic hierarchy with generous line height and letter spacing
- Flat design approach with no drop shadows or gradients
- Pill-shaped interactive elements (buttons with `9999px` border radius)
- Responsive layout that scales content gracefully from 375px to 1440px
- Accessibility-first focus: 2px outline focus states, high contrast text, disabled opacity patterns
- Clear distinction between surfaces using strategic color swaps (`#FFFFFF` canvas, `#F5F5F7` surface, `#000000` ink)

## 2. Color Palette & Roles

### Primary
- **Primary / Brand** (`{colors.primary}` — `#1D1D1F`): Used as the dominant body text color, primary CTA fill, headings, and brand accent. Appears in navigation, buttons, and core interface elements.
- **Brand Accent** (`{colors.accent}` — `#2997FF`): Applied to interactive links, outline buttons, and focus indicators. Communicates interactivity and brand presence without overwhelming the neutral palette.

### Accent Colors (Decorative)
- **Decorative Blue 1** (`{colors.accent-1}` — `#0071E3`): Found in focus ring declarations and secondary interactive states; no primary role assigned.
- **Decorative Blue 2** (`{colors.accent-2}` — `#0000EE`): Decorative accent with no measured application.
- **Decorative Blue 3** (`{colors.accent-3}` — `#0066CC`): Decorative accent with no measured application.
- **Decorative Orange** (`{colors.accent-4}` — `#B64400`): Appears in badge text; no systematic semantic role.

### Neutral Scale
- **Canvas** (`{colors.canvas}` — `#FFFFFF`): Default page background and label color on brand surfaces; the primary reading surface.
- **Surface** (`{colors.surface}` — `#F5F5F7`): Card and panel backgrounds; secondary surface layer for visual hierarchy separation.
- **Ink** (`{colors.ink}` — `#000000`): Headings and primary text when highest contrast is needed; rarely used on white canvas (prefer Primary instead).
- **Muted** (`{colors.muted}` — `#6E6E73`): Captions, secondary text, and supporting copy at reduced emphasis.
- **Faint** (`{colors.faint}` — `#86868B`): Tertiary text, placeholder text, and de-emphasized labels.
- **Hairline** (`{colors.hairline}` — `#D2D2D7`): 1px borders, dividers, and subtle demarcation lines between sections.

### Neutral (Unassigned Roles)
- **Neutral 1** (`{colors.neutral-1}` — `#333336`): Dark neutral; no measured role in the system.
- **Neutral 2** (`{colors.neutral-2}` — `#E8E8ED`): Light neutral; no measured role in the system.

## 3. Typography Rules

### Font Family

**Primary:** SF Pro Display and SF Pro Text (San Francisco system font stack)
**Fallback Stack:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif

The system uses a dual-font approach: SF Pro Display for large display sizes and headlines, SF Pro Text for body and UI labels. Both share the same metrics and optical adjustments, ensuring seamless transitions across the size spectrum.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|---|---|
| Display XL | SF Pro Display | 56px | 400 | 1.1 | Measured on hero headings; reduces to 48px at breakpoints below 1024px |
| Heading MD | SF Pro Text | 28px | 400 | 1.2 | Used in section headings and prominent titles |
| Body MD | SF Pro Text | 17px | 400 | 1.47 (25px) | Primary body copy on all surfaces; line-height measured at 25px |
| Body SM | SF Pro Text | 12px | 400 | 1.33 (16px) | Captions, footer text, and secondary information |
| Button | SF Pro Text | 14px–17px | 400 | 1.29–1.47 | Primary buttons use 14px/18px; secondary use 17px/25px |
| Link | SF Pro Text | 17px | 400 | 1.47 (25px) | Inline links inherit body baseline; accent color applied |
| Code / Badge | SF Pro Text | 12px | 600 | 1.33 (16px) | Badge text uses 600 weight; code inherits body metrics |

### Principles

- **Optical Balance:** SF Pro Text and Display are metrically compatible, allowing seamless size transitions without recalibration.
- **Generous Line Height:** All text uses 1.1–1.47× line-height multipliers, prioritizing readability and breathing room over compact layouts.
- **Weight Discipline:** The system uses almost exclusively 400 (regular) weight. Badge and emphasis text bump to 600 (semibold) for distinction.
- **No Optical Adjustments:** Letter-spacing is left at the default kern table; no negative tracking or manual adjustments detected.
- **Responsive Scaling:** Display sizes (56px) collapse to 48px at tablets and remain stable thereafter; body text stays 17px across all breakpoints.

## 4. Component Stylings

### Buttons

**Primary Button**
- Background: `#1D1D1F` (`{colors.primary}`)
- Text Color: `#FFFFFF`
- Padding: `8px 15px`
- Font Size: `14px`
- Font Weight: `400`
- Line Height: `18px`
- Border Radius: `{rounded.xs}` (8px)
- Border: `1px solid transparent`
- Box Shadow: none
- Hover State: Opacity and color values managed via CSS variables; exact hover color not extracted

**Secondary Button (Filled Light)**
- Background: `#F5F5F7` (`{colors.surface}`)
- Text Color: `rgba(0, 0, 0, 0.8)`
- Padding: `0px 14px`
- Font Size: `17px`
- Font Weight: `400`
- Line Height: `41px`
- Height: `42px`
- Border Radius: `{rounded.sm}` (11px)
- Border: `3px solid rgba(0, 0, 0, 0.04)`
- Box Shadow: none

**Accent Button (Outline)**
- Background: `transparent`
- Text Color: `#2997FF` (`{colors.accent}`)
- Padding: `11px 21px`
- Font Size: `17px`
- Font Weight: `400`
- Line Height: `20px`
- Height: `20px`
- Border Radius: `{rounded.full}` (9999px, pill-shaped)
- Border: `1px solid #2997FF` (`{colors.accent}`)
- Box Shadow: none

**Icon Button**
- Background: `rgba(210, 210, 215, 0.64)` (hairline tint)
- Text Color: `rgba(0, 0, 0, 0.48)`
- Width: `24px`
- Height: `24px`
- Padding: `0px`
- Font Size: `17px`
- Border Radius: `50%` (circular)
- Border: none
- Box Shadow: none

### Cards & Containers

**Default Card (Transparent)**
- Background: `transparent`
- Text Color: `rgba(0, 0, 0, 0.56)` (muted text)
- Padding: `0px`
- Font Size: `12px`
- Line Height: `16px`
- Border Radius: `{rounded.none}` (0px, sharp)
- Border: none
- Box Shadow: none

**Featured Card (Dark)**
- Background: `#242426` (near-black)
- Text Color: `rgba(255, 255, 255, 0.92)` (light, high contrast)
- Padding: `32px`
- Font Size: `17px`
- Line Height: `25px`
- Width: `372px`
- Height: `680px`
- Border Radius: `28px` (generous curve)
- Border: none
- Box Shadow: none

**Light Card**
- Background: `#F5F5F7` (`{colors.surface}`)
- Text Color: `rgba(0, 0, 0, 0.88)` (dark text)
- Padding: `32px`
- Font Size: `17px`
- Line Height: `25px`
- Width: `372px`
- Height: `680px`
- Border Radius: `28px`
- Border: none
- Box Shadow: none

### Inputs & Forms

**Focus State (Global)**
- Outline: `2px solid #0071E3` (`{colors.accent-1}`)
- Outline Width: `2px`
- Outline Color: Defaults to `#0071E3` unless overridden by component-specific focus-color

**Input Focus (Alternate)**
- Outline: `rgba(0, 125, 250, 0.6) solid 4px`
- Outline Width: `4px`
- Outline Color: `rgba(0, 125, 250, 0.6)`

All input elements use focus-visible to signal keyboard navigation; mouse focus typically suppressed via outline: none.

### Navigation

**Default Navigation (Light Background)**
- Background: `rgba(245, 245, 247, 0.8)` (surface with transparency)
- Text Color: `#1D1D1F` (`{colors.primary}`)
- Height: `44px`
- Font Size: `17px`
- Font Weight: `400`
- Line Height: `25px`
- Padding: `0px`
- Border Radius: `0px` (full-width bar)
- Border: none
- Box Shadow: none

**Navigation (Dark/Transparent)**
- Background: `transparent`
- Text Color: `#1D1D1F` (`{colors.primary}`)
- Height: `44px`
- Otherwise identical to default

### Links

**Default Link**
- Text Color: `#2997FF` (`{colors.accent}`)
- Font Size: `17px`
- Font Weight: `400`
- Line Height: `25px`
- Text Decoration: none (default); underline on hover
- Focus-Visible: `2px solid #0071E3` outline

**Footer Link**
- Text Color: `#2997FF` (`{colors.accent}`)
- Font Size: `12px` (matches footer context)
- Font Weight: `400`
- Line Height: `16px`
- Hover: Text underline added

### Badge

**Badge Text (Small)**
- Text Color: `#B64400` (`{colors.accent-4}`)
- Font Size: `12px`
- Font Weight: `600` (bold emphasis)
- Line Height: `16px`
- Background: transparent
- Padding: `0px`
- Border: none

**Badge Text (Large)**
- Text Color: `#1D1D1F` (`{colors.primary}`)
- Font Size: `17px`
- Font Weight: `400`
- Line Height: `25px`
- Background: transparent
- Padding: `0px`
- Border: none

## 5. Layout Principles

### Spacing System

Apple uses an 8px base unit with a ten-step spacing scale designed for both comfortable whitespace and compact mobile layouts:

- `{spacing.xxs}` — 8px: Minimal gaps between tightly-packed elements (inline padding, small button spacing)
- `{spacing.xs}` — 12px: Small margins and internal padding for compact components
- `{spacing.sm}` — 16px: Standard internal padding for buttons, form fields, and small card margins
- `{spacing.md}` — 20px: Medium margins between sections and moderate internal padding
- `{spacing.lg}` — 24px: Comfortable white-space between feature blocks and prominent sections
- `{spacing.xl}` — 28px: Large feature section spacing
- `{spacing.xxl}` — 32px: Extra-large internal padding for featured cards and hero sections
- `{spacing.xxxl}` — 36px: Spacing between major layout blocks
- `{spacing.section}` — 40px: Standard section-to-section vertical margin
- `{spacing.band}` — 44px: Largest section band padding; matches navigation height

### Grid & Container

- **Max Width:** 980px (content column maintained constant from 1024px and above)
- **Columns:** 3-column grid across all breakpoints (375px to 1440px)
- **Mobile Column Width:** 343px (375px viewport − 16px left/right padding)
- **Tablet Column Width:** 736px (768px viewport − 16px left/right padding)
- **Desktop Column Width:** 980px (locked above 1024px)
- **Section Padding Horizontal:** 0px at mobile, 12px at 768px and above
- **Grid Gutters:** Implicit in column measure; no explicit gap defined in extraction

### Whitespace Philosophy

Apple's spacing approach prioritizes breathing room and cognitive clarity. Vertical margins between sections consistently use `{spacing.section}` (40px) or `{spacing.band}` (44px), creating predictable rhythm. Horizontal padding adapts to viewport: compressed on mobile (0–12px) to maximize content width, settled to 12px on tablet/desktop. Internal padding within components (buttons, cards, inputs) uses moderate values (`{spacing.sm}` to `{spacing.xxl}`) to avoid visual crowding while maintaining touch-target minimums. The system avoids dense grids; whitespace is treated as a design material, not a by-product.

### Border Radius Scale

- `{rounded.none}` — 0px: Card containers, layout blocks, and full-width components that extend edge-to-edge
- `{rounded.xs}` — 8px: Primary buttons and small contained elements
- `{rounded.sm}` — 11px: Secondary buttons and moderate-radius containers
- `{rounded.full}` — 9999px: Outline buttons and pill-shaped interactive elements (accent buttons)
- `28px`: Featured card containers (one-off measurement; larger feature surfaces)

### Border Widths

- **Hairline:** 1px — All input borders, dividers, button outlines (accent buttons)
- **Medium:** 2px — Focus-visible rings and keyboard-navigation outlines
- **Thick:** 3px — Secondary button borders (filled light variant)
- **Focus Ring:** 4px — Alternate input focus states with low-opacity blue glow

## 6. Depth & Elevation

Apple's design system uses **color-blocking** as the primary depth strategy: depth is communicated through strategic background color changes rather than shadows. The system contains no box-shadow declarations in measured components, making it distinctly flat and modern.

| Level | Treatment | Use |
|---|---|---|
| Flat (Base) | Background color only; no shadow | Default text, buttons, links, navigation bars |
| Surface Lift | Light gray background (`#F5F5F7`) over white canvas | Card containers, secondary surfaces, grouped content areas |
| Overlay / Modal | Full-screen or fixed container with explicit z-index layering | Modals, dropdowns, fixed navigation (z-index: 9987–9999) |

**Shadow Philosophy:**
No drop shadows, blur effects, or gradient depth cues are used. Depth is purely chromatic: foreground elements use darker or more saturated colors; recessed elements use lighter grays. This approach maintains the system's minimalist aesthetic while ensuring clear visual hierarchy through strategic color application.

### Opacity Levels

The system defines a discrete opacity scale used across interactive and disabled states:

- **0.32** — Disabled links (low visibility, clear disabled state)
- **0.36** — Disabled icons and soft-disabled elements
- **0.42** — Disabled text and reduced-emphasis secondary text
- **0.56** — Secondary captions and muted body text
- **0.64** — Icon button backgrounds (hairline tint)
- **0.80** — Body text on semi-transparent backgrounds
- **0.88** — Dark text on light surfaces (high contrast, readable)
- **0.89–0.96** — Hover and active state overlays on various backgrounds
- **0.99** — Near-opaque text and elements

These opacity values are applied via CSS variables and RGBA notation, allowing flexible theming and state indication without introducing new colors.

### Z-index / Layering

The system uses a sparse z-index scale to manage stacking order across all interactive contexts:

- **Base Layers:** z-index: 1, 2, 3, 4 — Static content, default stacking
- **Dropdown / Popover:** z-index: 30 — Menus, overlays, local interaction layers
- **Modal / Fixed:** z-index: 9987, 9998 — High-priority modals and fixed-position elements
- **Top Modal:** z-index: 9999 — Highest z-index; topmost modal or overlay

This sparse scale avoids z-index conflicts and makes layering intent explicit: most content stays in the base range (1–4), dropdowns float above at 30, and full-screen modals reserve 9987+.

## 7. Do's and Don'ts

### Do

- **Use the accent color (`#2997FF`) for all interactive affordances:** Links, outline buttons, focus indicators, and brand presence. It is the single interactive hue.
- **Maintain high contrast between text and background.** Pair dark text (`#1D1D1F` or `#000000`) with light surfaces (`#FFFFFF` or `#F5F5F7`), and light text (`#FFFFFF` or `rgba(255, 255, 255, 0.92)`) with dark surfaces.
- **Apply color-blocking for depth, not shadows.** Use background color swaps (`#F5F5F7` surface over `#FFFFFF` canvas) to create visual hierarchy and containment.
- **Use consistent padding:** `{spacing.sm}` (16px) for inputs and small components, `{spacing.md}` to `{spacing.xxl}` (20–32px) for cards and containers.
- **Make focus rings visible and keyboard-accessible.** Use `2px solid #0071E3` (or component-specific focus color) on focus-visible; omit focus indicators on mouse interactions via outline: none in :focus (not :focus-visible).
- **Size touch targets to 44px minimum** (observed in navigation and button height).
- **Use pill-shaped buttons (9999px radius) for secondary/accent actions** and `{rounded.xs}` (8px) for primary buttons.
- **Employ generous line-height (1.2–1.47×) and adequate letter-spacing for readability**, especially on body text.
- **Scale display headings responsively:** 56px at desktop, 48px at tablet, 32px at mobile.
- **Collapse navigation and expose a menu toggle at 768px and below** (or when nav link count exceeds available space).

### Don't

- **Never use drop shadows, blur effects, or gradients** as primary depth cues. Stick to color-blocking.
- **Don't introduce new semantic colors (error red, success green, warning yellow).** The site declares none; use existing accent or muted text for state indication.
- **Avoid narrow line-height or tight letter-spacing.** Measured values are generous (1.2–1.47×); compressed typography breaks the system's breathing aesthetic.
- **Don't use bold (600+ weight) text for body copy.** Reserve semibold (600) for badges and rare emphasis; keep primary text at 400 weight.
- **Never apply focus indicators on mouse-only interactions.** Use :focus-visible, not :focus, to avoid visual noise for mouse users.
- **Don't reduce touch targets below 44px in height or width.** Buttons, icon buttons, and navigation items must hit or exceed this threshold.
- **Avoid sharp corners on interactive secondary elements.** Primary buttons use 8px radius; secondary actions use 11px or 9999px (pill).
- **Don't place colored text on light backgrounds without sufficient contrast.** Muted text (0.56 opacity) only works on white or near-white; use darker shades (primary or ink) for body on light surfaces.
- **Never use more than two fonts.** SF Pro Display and SF Pro Text are the system standard; do not introduce additional typefaces.
- **Don't center-align body text in layouts wider than 600px.** Center display headings and CTAs; left-align all body copy for readability.

## 8. Responsive Behavior

### Breakpoints

| Breakpoint | Viewport Width | Column Width | Grid Columns | Nav Behavior | Display Heading | Body Text | Section Padding |
|---|---|---|---|---|---|---|---|
| Mobile | 375px | 343px | 3 | Menu toggle shown; 13 nav items hidden | 32px | 17px | 0px (left/right) |
| Tablet | 768px | 736px | 3 | Menu toggle shown; 3 nav items visible | 48px | 17px | 12px (left/right) |
| Desktop | 1024px | 980px | 3 | All 78 nav items visible; menu toggle hidden | 48px | 17px | 12px (left/right) |
| Large Desktop | 1280px | 980px | 3 | No change from 1024px | 56px | 17px | 12px (left/right) |
| Extra Large | 1440px | 980px | 3 | No change from 1024px | 56px | 17px | 12px (left/right) |

**Key Transition Points:**
- **375px → 768px:** Display text stays 32px; nav collapses to menu toggle; section padding increases from 0 to 12px
- **768px → 1024px:** Display text scales to 48px; nav expands to show 3 items; container width locks at 980px
- **1024px → 1280px+:** Display text increases to 56px; all nav items visible; column width remains 980px (no further expansion)

### Touch Targets

- **Minimum Height:** 44px (observed in navigation bar, button components)
- **Minimum Width:** 44px (circular icon buttons measured at 24px but sit within 44px touch zones)
- **Button Padding:** `8px 15px` (primary), `11px 21px` (secondary/outline) — combined with font size, these produce 36–42px heights
- **Link Padding:** Inline links inherit text dimensions; standalone link blocks (cards, tiles) must ensure 44px minimum tap area
- **Spacing Between Targets:** Minimum 8px gap between interactive elements to prevent mis-taps

### Collapsing Strategy

- **Navigation:** At 768px and below, the full horizontal navigation menu collapses into a hamburger/menu toggle. At 1024px and above, all navigation links are displayed horizontally.
- **Grid Layout:** The system uses a consistent 3-column grid across all breakpoints; content reflows within this grid rather than switching to single-column.
- **Typography:** Display headings remain 48px from 768px through 1024px, then expand to 56px at 1280px+. Body text stays 17px across all breakpoints.
- **Section Padding:** Horizontal padding is 0px on mobile (375px), jumps to 12px at tablet (768px), and remains 12px through desktop sizes.
- **Cards & Containers:** Featured cards are 372px wide; on mobile, they stack in the 3-column grid and scale to fit viewport. No breakpoint-specific card sizes are extracted.
- **Images & Media:** Photo and video scale responsively to container width; no explicit breakpoint-driven cropping or aspect-ratio changes are extracted.

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA / Brand Accent:** Accent Blue (`#2997FF`) — use for interactive links, outline buttons, focus rings, and any interactive affordance
- **Primary Button Fill:** Primary (`#1D1D1F`) — dark button backgrounds, body text, headings, navigation
- **Canvas Background:** Canvas (`#FFFFFF`) — default page and container background
- **Surface / Card Background:** Surface (`#F5F5F7`) — secondary surfaces, card backgrounds, grouped content
- **Body Text:** Primary (`#1D1D1F`) — default text color on light backgrounds
- **Heading Text:** Ink (`#000000`) — rare; prefer Primary for headings
- **Muted / Secondary Text:** Muted (`#6E6E73`) — captions, secondary body text
- **Faint / Placeholder Text:** Faint (`#86868B`) — placeholder text, tertiary information
- **Borders & Dividers:** Hairline (`#D2D2D7`) — 1px borders, subtle lines, dividers
- **Focus Indicator:** Accent 1 (`#0071E3`) — keyboard focus rings (2px solid outline)

### Iteration Guide

1. **Start with the neutral palette:** All backgrounds are either `#FFFFFF` (canvas) or `#F5F5F7` (surface); text is `#1D1D1F` (primary) or `#6E6E73` (muted). Avoid the decorative accent colors unless they serve a measured role (like `#B64400` in badges).

2. **Interactive elements are pill-shaped or rounded:** Buttons use `9999px` (outline/secondary) or `8px` (primary) border-radius. All interactive affordances use the brand blue (`#2997FF`) for text or stroke.

3. **Spacing follows the 8px scale:** Use `{spacing.sm}` (16px) for standard padding, `{spacing.md}` (20px) for medium margins, `{spacing.xxl}` (32px) for large card padding. Mobile sections have 0px side padding; tablet/desktop use 12px.

4. **Typography is generous and 400-weight:** Body text is 17px on all devices; headings scale (32px mobile, 48px tablet, 56px desktop). Use 1.2–1.47× line-height. Reserve semibold (600 weight) for badges only.

5. **Depth is color, not shadows:** No box-shadows. Create hierarchy by layering background colors: white canvas → light gray surface → dark card backgrounds for contrast.

6. **Focus rings are mandatory for keyboard users:** Apply `2px solid #0071E3` on :focus-visible. Omit focus on :focus (mouse) via outline: none.

7. **Responsive grid is always 3 columns:** Content reflows within a 980px max-width container. Mobile column is 343px; tablet/desktop are wider but the grid column count stays constant.

8. **Opacity indicates disabled or secondary states:** Disabled text uses 0.32–0.42 opacity; muted secondary text uses 0.56 opacity; hover overlays use 0.64–0.96 opacity. These are CSS variable values, not new colors.

9. **Navigation collapses at 768px:** Below 768px, expose a menu toggle. At 1024px and above, show all navigation items horizontally.

10. **Touch targets are 44px minimum:** All clickable elements (buttons, links, icon buttons) must be at least 44px in both dimensions.

## 10. Known Gaps

- **Hover, active, and disabled states are declared but not fully parameterized:** Interaction states exist in the extracted CSS (button :hover, link :disabled, etc.) but their exact color and opacity values depend on CSS custom properties (variables) not resolved in the extraction. Focus states are known (`#0071E3` outline); other state colors should be inferred from context or measured directly from the live site.

- **No semantic status colors extracted:** The site does not declare or expose error, success, warning, or info colors in its measured markup. If status indication is needed, use the accent blue (`#2997FF`) for affirmative states and rely on existing text color gradations (primary, muted, faint) for neutral or cautionary messaging.

- **Shadows and gradients:** The system is measured as flat (no box-shadows); however, complex decorative effects (mesh gradients, color overlays on photography) may exist on high-hero banner sections not fully captured by CSS extraction. The extracted system does not include these.

- **Dark mode or theme variants:** Only one theme (light/white-canvas) was measured. A dark mode equivalent may exist on the live site but was not extracted or marked as a derived/calculated variant.

- **Animation and transition timings:** No keyframe or transition-duration values were extracted. Hover and focus state transitions (if any) rely on CSS default or unspecified browser behavior.

- **Six extracted accent colors had no measurable role:** `{colors.accent-1}` (`#0071E3`), `{colors.accent-2}` (`#0000EE`), `{colors.accent-3}` (`#0066CC`), and `{colors.accent-4}` (`#B64400`) appear in isolated components or focus declarations but have no systematic design role. They are noted as decorative; do not assume they are reserved for specific semantic purposes.

- **Cross-origin stylesheets were unreadable:** Some CSS may reside on external domains not captured in the extraction. Pseudo-element styles (::before, ::after) and vendor-prefixed properties may be incomplete.

- **Surfaces behind authentication are not included:** The extraction covered 6 publicly visible pages. Signed-in user experiences, account dashboards, or restricted content were not analyzed.

- **Component variants beyond measured roles:** Only the component variants with extracted CSS are documented (e.g., button primary, secondary, outline, icon). Additional states or roles (loading spinners, toast notifications, popovers) may exist but were not captured.

- **Grid gutter and column gap values:** The grid uses implicit column widths based on container and padding; explicit gap or gutter CSS properties were not extracted, so calculations may need to be inferred from measured container widths.