---
name: asc-ui
description: >
  Trigger this skill when working on: UI components, UX design, layouts, microcopy, typography, design systems, modals, forms, tables, dashboards, empty states, or error UI. Also trigger when the user says: "design this page", "clean up UI", "write UI copy", "fix UI slop", "make it look professional", "too verbose", "improve the design", "broken on mobile", "bikin UI", "rapikan tampilan", "tulisan UI berlebihan", "tampilan di hp rusak", "terlalu kaku", "jangan kayak AI". Also trigger when creating or editing files matching: `*.tsx`, `*.jsx`, `*.vue`, `*.svelte`, `*.html`, `*.blade.php`, `*.css`, or UI component files.
---

# Deterministic Frontend & UI Engineering Router (`asc-ui`)

Enforces structural semantics, token reuse, state completeness, accessibility, and anti-card-soup invariants across frontend codebases. Pure visual art direction belongs to design tools (Figma MCP, Stitch) or pre-built component kits (Shadcn/Radix blocks); this skill governs verifiable UI engineering.

---

## 1. The Quality Floor (Non-Negotiable Invariants)

1. **Token & primitive reuse:** Resolve all colors, radii, and spacing through project CSS variables/tokens and existing `components/ui/` primitives. Zero raw hex codes (`#6366f1`) and zero mixed neutral families (never mix `slate` with `stone`).
2. **Anti-card-soup rule:** Never stack two or more multi-column card grids consecutively on a page, and never render sequential steps (`01`, `02`, `03`), rubrics, or people directories as bordered cards.
3. **No card-in-card or ghost elevation:** Never nest a bordered rounded card inside another card. Choose either `border` OR `shadow-sm`, never both.
4. **GPU-only motion & reduced motion:** Never use `transition-all` or animate layout geometry (`width`, `height`, `top`, `left`). Respect `@media (prefers-reduced-motion: reduce)`.
5. **Focus & WCAG 2.2 AA contrast:** Maintain $\ge$ 4.5:1 text contrast (3:1 large text/controls). Never apply `outline-none` without an immediate `:focus-visible` ring replacement.
6. **Mobile containment & touch targets:** Use `min-h-dvh` (never `100vh`/`h-screen`), `overflow-x: clip` on root shells, and minimum **44x44px** hit targets on touch controls.
7. **Zero hallucinated proof or ornaments:** Never invent testimonials, partner logos, unbacked KPIs, small-caps eyebrow kickers above headings, purple-to-blue gradients, or terminal cosplay in non-developer apps.
8. **Single-language microcopy:** Keep every visible string on a surface in one language with natural domain terms—zero mixed-language neologisms and zero literal translation calques.

---

## 2. Pre-Flight & Reuse Gate (BLOCKING)

Before writing or refactoring any UI file (`*.tsx`, `*.jsx`, `*.vue`, `*.svelte`, `*.html`, `*.blade.php`, `*.css`):

1. **Audit Workspace Primitives:** Inspect `components/ui/`, shared layouts, `app.css`/`globals.css`, and Tailwind config. Reuse existing tables, dialogs, buttons, and form primitives rather than inventing ad-hoc markup.
2. **Load Mandatory Reference Branch (1-Hop):**
   - Building a new page, dashboard, or multi-section layout $\rightarrow$ **MUST** `read_file` `references/data-to-structure.md` before writing markup.
   - Implementing async data views, forms, modals, or interactive controls $\rightarrow$ **MUST** `read_file` `references/states-and-a11y.md`.
   - Adjusting responsive behavior, CSS tokens, or localized UI copy $\rightarrow$ **MUST** `read_file` `references/responsive-and-copy.md`.

---

## 3. Data-to-Structure Mapping

Never default to `Card` grids as a generic layout wrapper. Select containers strictly by data shape:

| Data Shape | Required Semantic Structure |
| :--- | :--- |
| Sequential workflow (`Step 1 -> 4`) | Connected `<ol>` stepper or timeline |
| Criteria, weights, pricing, logs, records | `<table/>` with `sticky top-0` header & `tabular-nums` |
| Team members, rosters, activity streams | Compact `divide-y divide-border` rows |
| 3–5 summary counts / KPIs | Flat `<dl>` stat strip with hairline dividers |
| Independent catalog items / isolated auth form | Single-level `Card` container |

---

## 4. On-Demand Engineering References

> [!IMPORTANT]
> Paths below are relative to this `SKILL.md` directory (`.../skills/asc-ui/`). Prepend this skill's folder path when calling `read_file`.

| Engineering Concern | Reference Path |
| :--- | :--- |
| Anti-card-soup structural templates (`<ol>`, `<table>`, `divide-y`, `<dl>`) | `references/data-to-structure.md` |
| 4-state data contract, pending mutation lock & WCAG 2.2 AA focus/contrast | `references/states-and-a11y.md` |
| Brownfield token reuse, `100dvh` mobile reflow, GPU transitions & microcopy | `references/responsive-and-copy.md` |

---

## 5. Verification & Handoff Sweep

Before declaring any UI task complete:
1. **Structural Rhythm Check:** Confirm the page does not stack consecutive card grids and uses `<table>`, `<ol>`, or `divide-y` lists where required.
2. **State & Mutation Check:** Verify loading skeleton, empty state, error state with retry, and `disabled` pending state on submit buttons.
3. **Mobile & Overflow Check:** Confirm `min-h-dvh`, wrapped horizontal tables (`overflow-x-auto`), and no fixed-pixel button widths (`w-[120px]`) that clip +30% text expansion.
4. **Rendered Preview (`asc preview`):** When a local server or static HTML target is available, run `asc preview <url|file> [--mobile]` to inspect rendered layout balance before handoff.
