# Craft: Typography & Typesetting

Grounded in: Refactoring UI, Bringhurst's The Elements of Typographic Style, and W3C Type Best Practices.

---

## 1. Font Roles & Typographic Contrast

- **Strict Dual-Role System:**
  - *Display Role:* Conveys brand character and emotional tone (used for H1, hero headlines, large section markers).
  - *Body/Functional Role:* Maximizes optical legibility at scale (used for paragraphs, tables, form inputs, button labels, navigation).
  - Never mix more than two font families on a single screen unless one is a dedicated monospace face for literal code.
- **Weight Contrast Before Size Inflation:**
  - Build strong typographic hierarchy by varying font weights (`font-bold` vs `font-normal`) and contrast tokens (`text-foreground` vs `text-muted-foreground`) before jumping to oversized font sizes.
  - A clean 24px `font-bold` title paired with a 14px `text-muted-foreground` subtitle establishes clearer hierarchy than inflating the title to 48px with identical gray values.
- **The Generative Scale Contrast Floor ($Display \ge 3.5\times Body$):**
  - On landing, marketing, and hero surfaces (`Persuade`), the primary headline must establish an optical scale step over body text:
    - Target: $Display \ge 3.5\times Body$ (e.g. `text-5xl` to `text-7xl` [48px–72px] display vs `text-base` [16px] or `text-sm` [14px] body).
    - Heading leading must be tight: `leading-[1.05]` to `leading-tight`.
    - An under-scaled heading ($< 2.5\times$ body, such as 24px H1) collapses optical gravity and makes marketing pages look like internal memo forms.

---

## 2. Tracking, Leading & Measure

- **Tracking (Letter-Spacing) Floor:**
  - Large display headings (> 32px): Tighten tracking slightly (`tracking-tight` / `-0.02em` to `-0.03em`).
  - **The -0.04em Floor:** Never track tighter than `-0.04em`. Extreme negative tracking collides letterforms and destroys legibility.
  - Body text (14px–18px): Standard tracking (`tracking-normal` / `0em`). Never tighten body prose.
  - Uppercase tags/codes: Subtle positive tracking (`tracking-wider` / `+0.05em`).
- **Leading (Line-Height) Matching:**
  - Large headings: `leading-tight` (1.1 to 1.25). Loose leading on large display text creates disjointed lines.
  - Body prose: `leading-relaxed` (1.6 to 1.75). Tight leading on body text causes reading fatigue.
- **Line Measure Floor:**
  - Cap continuous reading prose at **65–75 characters per line** (`max-w-prose` / ~680px).

---

## 3. Tabular Numbers & Numeric Craft

- **Tabular Numerals (`tabular-nums`):**
  - All numbers that change, compare, or align in columns **MUST** carry `tabular-nums` (via CSS `font-variant-numeric: tabular-nums` or Tailwind class `tabular-nums`).
  - Applies to: prices, balances, data table columns, timers, percentages, and metrics.
  - *Distinction from font-mono:* Use `tabular-nums` with the standard sans-serif face. Do not force `font-mono` on numbers unless the numbers represent technical addresses, hashes, or code tokens.

---

## 4. The Absolute Ban on Eyebrows & Tracked Heading Kickers

- **Zero Eyebrow Labels:**
  - Never place a small, uppercase, tracked kicker label above a heading (e.g. `FEATURES`, `WHAT WE DO`, `WHY CHOOSE US`).
  - An eyebrow is the defining hallmark of generic AI template generation. It adds zero informational value and insults the reader's intelligence.
  - Let the heading carry its own weight. Delete the kicker entirely.

