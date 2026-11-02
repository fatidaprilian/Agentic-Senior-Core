---
name: asc-ui
description: >
  Trigger this skill when the user is working on: user interfaces, UI components, UX design, frontend layouts, microcopy, typography, design systems, modals, forms, tables, dashboards, empty states, or error UI. Also trigger when the user says: "design this page", "clean up this UI", "write UI copy", "fix UI slop", "make it look professional", "too verbose", "improve the design", "bikin UI", "rapikan tampilan", "tulisan UI berlebihan", "terlalu kaku", "jangan kayak AI", "bahasanya aneh". Also trigger when creating or editing files matching: `*.tsx`, `*.jsx`, `*.vue`, `*.svelte`, `*.html`, `*.blade.php`, `*.css`, or UI component files.
---

# Universal UI/UX Engineering & Anti-Slop Guidelines

Universal engineering and microcopy standards for human-grade, scannable, and robust digital interfaces. Eliminates generic "AI Slop" — verbose text, redundant headings, corporate filler, awkward foreign loanwords, and cookie-cutter layouts.

Grounded in: Nielsen Norman Group (Microcopy & Scannability), Refactoring UI (Hierarchy & Spacing), Apple HIG & Google Material Design 3 (Action Semantics & Tone), and W3C Internationalization / Localization Best Practices.

---

## 1. UX Microcopy & Text De-sloppification

LLMs naturally gravitate toward corporate marketing fluff and redundant explanations. In functional UI (dashboards, forms, settings, tables, dialogs), text is a tool for orientation and action, not a brochure.

### The Redundancy Elimination Rule (Kill Useless Subtitles)
- **Zero Echo Subtitles:** If a heading or label is self-explanatory (e.g., *"Payment Methods"*, *"Invoice History"*, *"Team Members"*), **NEVER** add an explanatory subtitle repeating the heading's words (e.g., *"Manage, view, and organize all your payment methods here"*).
- **Subtitle Criterion:** A subtitle is permitted **ONLY** if it contains an essential technical constraint or irreversible risk:
  - *Allowed:* *"API keys are shown once upon creation and cannot be retrieved later."*
  - *Forbidden:* *"View and manage your API keys to authenticate requests."*
- **Field Helper Text:** Only describe formatting constraints or privacy rules (e.g., `Max 10MB (PDF, PNG)`). Do not re-explain the field name (`Enter your email address here`).

### The 50% Word Reduction Rule
- Cut default AI-generated copy by at least 50%. Strip preamble, conversational filler, and passive voice.
- **Before (AI Slop):** *"In order to successfully proceed with saving your profile changes, please make sure all required fields are accurately filled out."*
- **After (Clean UI):** *"Fill out all required fields to save."*

### Active, Imperative Action Labels (Buttons & Controls)
- **Direct Verb + Noun:** Use concise, concrete verbs indicating the immediate outcome: `Save`, `Delete Project`, `Export CSV`, `Send Invite`, `Upgrade Plan`.
- **Banned Action Phrases:** Never use `Click here to...`, `Press to...`, `Proceed`, or vague single words like `Submit` or `OK` when a descriptive verb exists.

### Banned Marketing Buzzwords in Functional UI
Never use hyperbolic adjectives in application interfaces:
- **Forbidden:** `seamless`, `seamlessly`, `effortless`, `effortlessly`, `empower`, `robust`, `revolutionize`, `dynamic`, `all-in-one`, `supercharge`, `elevate`, `unlock the power of`, `at your fingertips`, `cutting-edge`.
- Treat an admin dashboard or business tool with utilitarian dignity. Describe the system state neutrally.

---

## 2. Language Purity & Localization Discipline

AI frequently creates "localization slop" by mixing languages, fabricating awkward hybrid loanwords, or inserting literal dictionary translations that sound unnatural to native speakers.

### Strict Single-Language Consistency
- **Zero Hybrid Code-Switching:** The UI must maintain 100% language purity for its target locale. Never mix English tech slang into non-English interfaces unless it is an established international symbol (e.g., `ID`, `URL`, `API`).
  - *Forbidden (Gado-gado/Jaksel):* *"Submit formulir Anda untuk meng-empower efisiensi dashboard."*
  - *Correct (Indonesian):* *"Kirim formulir untuk memperbarui data ringkasan."*
  - *Correct (English):* *"Submit the form to update dashboard data."*

### No Artificial Hybrid Neologisms
- Never create unidiomatic grammatical Frankenstein words by attaching native affixes to English stems:
  - *Forbidden:* `meng-generate`, `di-submit`, `meng-approve`, `di-cancel`, `men-delete`.
  - *Use established native terms:* `membuat / menghasilkan`, `kirim`, `setujui`, `dibatalkan`, `hapus`.

### Deterministic Microcopy Glossary
- Never exhibit "Thesaurus Syndrome" (swapping words across dialogs to avoid repetition). Control labels must remain mechanically deterministic across every screen:
  - Cancellation must always be `Batal` (ID) or `Cancel` (EN) — never alternate with `Urungkan`, `Tutup`, or `Kembali` for identical actions.
  - Deletion must always be `Hapus` (ID) or `Delete` (EN).
  - Saving must always be `Simpan` (ID) or `Save` (EN).

### Dynamic Text Expansion Budget
- Non-English translations (Indonesian, German, French, Spanish) are typically 20% to 40% longer than English equivalents.
- Containers, button labels, table headers, and badges must never have rigid fixed pixel widths (`w-[120px]`) that cause text clipping or awkward multi-line wrapping. Use flexible flex/grid layouts with sensible min-widths and text truncation (`truncate` with title tooltips) where appropriate.

---

## 3. Visual Layout & Anti-Cookie-Cutter Design

AI tools default to an easily recognizable, generic layout template ("The AI Starter Pack"). Avoid these homogenized visual tropes:

### The Banned AI Visual Starter Pack
- **No Purple-to-Cyan/Indigo Gradients:** Avoid cliché violet/teal neon glows on dark backgrounds unless explicitly mandated by existing brand tokens. Use solid, high-contrast semantic surfaces.
- **No Cardocalypse (Identical 3-Card Feature Grids):** Do not default every page or dashboard to 3 identical rounded cards, each sporting an abstract Lucide/Heroicon icon and 2 lines of generic gray text. Vary layout structure based on data type (tables, summary metrics, compact lists, detail panels).
- **No Gratuitous Glassmorphism:** Never slap `backdrop-blur-md bg-white/10` onto functional surfaces where it degrades contrast, creates readability issues on scroll, or wastes rendering performance.
- **No Bouncy/Distracting Hover Animations:** Interactive elements should provide snappy, predictable feedback (`transition-colors duration-150`, subtle border shifts). Avoid unprompted bounce, scale expansions (`hover:scale-105`), or floating wiggles on utilitarian buttons.

### Information Density & Scannability (Refactoring UI)
- **Scannable Hierarchy:** Use font weight (`font-semibold`) and color contrast (`text-foreground` vs `text-muted-foreground`) to establish visual hierarchy before increasing font size.
- **Compact Utilitarian Density:** Avoid excessive whitespace bloat (`p-12`, giant empty margins) on functional productivity tools. Deliver compact, legible data tables with sticky headers, clear row borders, and inline status badges.
- **Single Design Source of Truth:** Reuse existing design tokens, CSS variables, and spacing scales (`spacing`, `radius`, `palette`). Do not invent ad-hoc hex codes (`#6366f1`, `#3b82f6`) or arbitrary inline styles.

---

## 4. State Quad & Feedback Architecture

Every asynchronous view or mutation must deterministically handle all states:

### The Data State Quad
1. **Loading State:** Render proportional skeleton screens matching the actual layout shape (never a single generic spinner in the middle of a blank canvas).
2. **Empty State:**
   - Maximum 1 direct sentence stating reality + 1 primary action button.
   - *Good:* *"No active projects. [Create Project]"*
   - *Forbidden:* Flowery essays (*"Your workspace is a blank canvas awaiting your creative brilliance..."*).
3. **Error State:**
   - Factual description of what failed + 1 clear recovery button (`[Retry]`).
   - *Good:* *"Unable to load invoices. [Retry]"*
   - *Forbidden:* Apologetic colloquialisms (*"Oopsie! Something went wrong on our end..."*).
4. **Populated State:** High-density, cleanly structured data presentation.

### Action Mutation Feedback
- Every mutation button (submit, delete, update) **MUST** immediately reflect a pending state:
  - Disable the button (`disabled`).
  - Show an inline spinner or change text to ongoing action (`Saving...`).
- Display clear, localized toast or banner confirmation upon completion with actionable retry on failure.
- Never silently swallow mutation errors. Wrap critical route widgets in localized React/Vue Error Boundaries.

---

## 5. Mobile-First Responsive Reflow & Touch Ergonomics

Mobile layout is a distinct, intentional reflow — not the desktop layout squeezed into a narrow viewport.

### Intentional Reflow Over Shrunken Desktops
- **Re-stack and Re-order:** When the viewport narrows, multi-column grids must collapse into a clean, single-column stack. Side-by-side card grids must never squeeze horizontally until text wraps into 2-letter lines.
- **Content-Driven Breakpoints:** Place breakpoints where content begins to stress or break readability, never based on a rigid list of marketing device specs (e.g., iPhone 14 width). Test by dragging viewports smoothly across the full 320px–1024px range.
- **Mobile Section Padding:** Desktop padding scales (96px, 128px) create absurd vertical wastelands on phones. Reduce section vertical padding to a mobile register (typically 32px–48px / `py-8` to `py-12`).

### Responsive Units & Viewport Traps
- **Dynamic Viewport Height (`dvh`):** Never use `100vh` for full-screen hero or drawer elements on mobile. Mobile browser chrome (address and navigation bars) dynamically expands and collapses, causing `100vh` to trigger involuntary page scrolling and button clipping. Use `min-h-dvh` or `h-dvh`.
- **Fluid Typography:** Avoid rigid fixed-pixel headings (`font-size: 48px`). Use fluid typography (`clamp(1.5rem, 4vw + 1rem, 2.75rem)`) or explicit responsive font classes (`text-2xl sm:text-4xl lg:text-5xl`).

### Touch Targets & Thumb-Zone Ergonomics
- **44x44px Minimum Touch Target:** Every interactive element (buttons, icon links, checkbox toggles, chips) must have a touch target of at least 44x44px (`min-h-[44px] min-w-[44px]`). If an icon is small (16px), pad its container (`p-3`).
- **Touch Clearance:** Maintain at least 8px spacing between adjacent touch targets to eliminate accidental mis-taps.
- **Reachability:** Place primary mobile actions (submit, filters, navigation) within comfortable thumb reach (bottom sheets, sticky action bars) rather than marooning them at the extreme top corners.

### Zero Horizontal Scroll Leaks
- The entire mobile page must maintain zero horizontal overflow.
- **Tables & Code Blocks:** Wrap wide tables and code blocks in dedicated horizontal scroll containers (`overflow-x-auto max-w-full`) with visible scroll indications, preventing them from blowing out the body width.
- **Long Unbroken Strings:** Protect against email addresses, hashes, or URLs overflowing cards using `break-words` or `truncate`.

---

## 6. Human Accessibility & Contrast Engine (WCAG 2.2 AA)

An interface that excludes users with diverse vision, motor, or device constraints is structurally broken.

### Mathematical Contrast Minimums
Always meet WCAG 2.2 AA contrast ratios:
- **Normal Body Text (< 18px or regular < 14px bold):** Minimum **4.5:1** contrast against adjacent background.
- **Large Text (>= 18px or bold >= 14px):** Minimum **3.0:1** contrast.
- **Non-Text Components & States:** Minimum **3.0:1** for input borders, focus indicators, status badges, and active icons against their background (WCAG 1.4.11).

### The Grey-on-Grey Hallucination Trap
Human eyes consistently overestimate contrast on subtle grey pairs:
- `#777777` on pure white (`#FFFFFF`) produces **4.48:1** (FAILS normal text AA; minimum safe pure gray is `#767676` which achieves 4.54:1).
- `#555555` on pure black (`#000000`) produces **2.82:1** (FAILS all text AA).
- When placing text over gradient backgrounds or images, add a solid scrim or compute contrast at the lightest/darkest coordinate point, not just the center.

### Keyboard Operability & Focus Rings
- **Zero Stripped Focus Rings:** Never write `outline: none` or `focus:outline-none` without an immediate high-contrast `:focus-visible` replacement (`focus-visible:ring-2 focus-visible:ring-offset-2`). Stripping focus breaks keyboard navigation completely.
- **No Mouse-Only Patterns:** Never gate critical functionality behind hover (`:hover`) without an equivalent keyboard or touch focus trigger.
- **Dialog Escape Hatch:** Every modal, drawer, or dropdown must close immediately upon pressing the `Escape` key and restore keyboard focus to the triggering element.


