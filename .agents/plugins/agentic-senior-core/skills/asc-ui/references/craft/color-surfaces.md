# Craft: Color Systems & Surface Elevation

Grounded in: Apple HIG, Google Material Design 3, and Refactoring UI Color Strategies.

---

## 1. Token-First Color Architecture

- **Semantic Tokens Only:**
  - Every surface, border, and text color must resolve through declared CSS variables or semantic framework tokens:
    - Backgrounds: `bg-background`, `bg-card`, `bg-muted`, `bg-popover`.
    - Text: `text-foreground`, `text-muted-foreground`, `text-primary-foreground`.
    - Borders: `border-border`, `border-input`, `border-primary`.
  - **Zero Raw Hex Literals in Markup:** Never write inline hex values (`#6366f1`, `#3b82f6`) or arbitrary utility classes (`bg-blue-600`) outside the root token definition.

---

## 2. The 60-30-10 Distribution Rule

- **60% Dominant Neutral Surface:**
  - The canvas base floor (tinted neutral like slate, zinc, or warm stone—never dead `#000000` or sterile `#ffffff`).
- **30% Structural Neutral Containers:**
  - Cards, table backgrounds, navigation headers, sidebars, and divider lines.
- **10% Purposeful Accent:**
  - The dedicated brand accent hue.
  - **Accent Exclusivity:** Accent color is reserved strictly for interactive affordances: Primary CTA button, active navigation indicator, unread dot, selected checkbox.
  - **Forbidden:** Never use the accent color as background wallpaper, card borders, or decorative section dividers.

---

## 3. Surface Elevation & The "Ghost Card" Ban

- **Stepped Tonal Elevation:**
  - Build depth through background tone steps rather than heavy drop shadows:
    - *Base Canvas:* `bg-background` (Level 0)
    - *Containers & Cards:* `bg-card` (Level 1)
    - *Recessed Inset Wells (Search bars, secondary filters, code blocks):* `bg-muted/50`
- **Declare Elevation Once (Ban The Ghost Card):**
  - Never apply both a distinct 1px border AND a wide, blurry drop shadow to the same container (`border border-slate-200 shadow-lg`). This creates an unnatural "ghost card".
  - Choose one clear depth language:
    - *Border-Driven:* Crisp 1px hairline border with alpha (`border-border/60`) and zero or minimal shadow (`shadow-xs`).
    - *Shadow-Driven:* Floating elevation (`shadow-md`) with borderless or subtle color shift.
- **Tinted Secondary Text on Colored Surfaces:**
  - When placing secondary text on a colored or dark surface, tint the text using the parent background hue or foreground token (`text-primary-foreground/70`).
  - **Never use neutral gray text (`text-slate-400`) on a saturated or colored background.** It produces a muddy, dirty optical illusion.

