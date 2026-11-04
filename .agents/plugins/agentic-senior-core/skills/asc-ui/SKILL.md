---
name: asc-ui
description: >
  Trigger this skill when working on: UI components, UX design, layouts, microcopy, typography, design systems, modals, forms, tables, dashboards, empty states, or error UI. Also trigger when the user says: "design this page", "clean up UI", "write UI copy", "fix UI slop", "make it look professional", "too verbose", "improve the design", "broken on mobile", "bikin UI", "rapikan tampilan", "tulisan UI berlebihan", "tampilan di hp rusak", "terlalu kaku", "jangan kayak AI". Also trigger when creating or editing files matching: `*.tsx`, `*.jsx`, `*.vue`, `*.svelte`, `*.html`, `*.blade.php`, `*.css`, or UI component files.
---

# Universal UI/UX Engineering & Anti-Slop Router

Staff-grade design engineering for resilient, scannable, human-grade interfaces. Enforces the visual floor and routes deep craft guidance on demand.

---

## 1. The Quality Floor (Non-Negotiable Bans)

Every UI edit must satisfy these 15 rules without exception:

1. **Token discipline:** All colors, spacing, and typography must resolve through declared design tokens or CSS variables. Zero raw hex codes (`#6366f1`) or arbitrary inline pixel values.
2. **Animation safety:** Never use `transition: all`. Never animate layout dimensions (`width`, `height`, `top`, `left`). Animate only GPU properties (`transform`, `opacity`).
3. **Reduced motion:** Every CSS animation or transition must respect `@media (prefers-reduced-motion: reduce)`.
4. **Focus visibility:** Never strip focus indicators (`outline-none`) without an immediate high-contrast `:focus-visible` replacement.
5. **No hallucinated material:** Never invent metrics, testimonials, customer quotes, or fake partner logos.
6. **No eyebrows or kicker tags:** Headings carry their own weight. Never place `text-[11px] uppercase tracking-wider` micro-labels above titles.
7. **No AI cliché gradients:** Never use purple-to-blue/indigo gradients or text clipping (`bg-clip-text text-transparent`).
8. **No card-in-card nesting:** Never nest rounded bordered cards inside other rounded cards.
9. **Single elevation declaration:** Choose either a 1px border OR an elevation shadow, never both (ban the ghost card).
10. **Mobile viewport unit:** Use `min-h-dvh` or `100dvh` for full-height containers, never `100vh` or `h-screen`.
11. **Mobile containment:** Set `overflow-x: clip` on root shells. Never leak horizontal scrolling.
12. **Touch targets:** Minimum 44×44px hit target with $\ge$ 8px clearance for all interactive touch controls.
13. **Contrast floor:** Meet WCAG 2.2 AA (4.5:1 normal text, 3:1 large text and UI component boundaries).
14. **Single-language purity:** Never mix languages on one surface; ban hybrid neologisms (`di-submit`, `meng-generate`).
15. **Icon semantics:** Never use raw unicode or emojis as icons. Use dedicated SVG icons; mark decorative icons `aria-hidden="true"`.
16. **Substance over restraint:** Stripping slop is only half the job. Replace removed ornaments with real substance: strong typographic scale contrast, full-field color anchors, and authentic interface fragments. Never leave an empty, sterile wireframe void.

---

## 2. Pre-Flight & Material Inventory

Before declaring markup, inspect the workspace:
1. **Design Tokens:** Read project CSS variables, Tailwind configuration, or existing components in `components/` or `ui/`. If `DESIGN.md` exists, read it (read-only). Never create or edit persistent checkpoint files.
2. **Take the Material Inventory:**
   - **Real:** Concrete numbers, existing endpoints, actual data attributes.
   - **Pictures:** Actual screenshots and product visual assets.
   - **Absent:** Missing quotes, missing logos, or unverified metrics—these are omitted entirely.

---

## 3. Surface Modes & Ambition Scaling

Determine visual posture from the **surface**, not the product brand:

- **Operate (`references/modes/operate.md`):** Dashboards, settings, data tables, developer tools. Prioritizes dense scannability, master-detail rails, `tabular-nums`, and inline progressive disclosure.
- **Persuade (`references/modes/persuade.md`):** Landing pages, pricing tiers, conversion flows. 80-word viewport budget, asymmetric postures, single signature element, zero equal-weight 3-card grids.
- **Read (`references/modes/read.md`):** Documentation, changelogs, knowledge bases. 65–75ch measure (`max-w-prose`), dual-rail navigation, syntax-highlighted code blocks.
- **Experience (`references/modes/experience.md`):** Showcases, portfolios, interactive galleries. Receding interface chrome, full-bleed visual canvas, tactile exploration.

---

## 4. Scope Classification: Refine vs. Redesign

- **Refinement:** Preserves layout structure, component APIs, DOM hierarchy, and color tokens. Polishes padding rhythm, contrast, microcopy, and state completeness.
- **Redesign:** Replaces the visual hierarchy, typographic pairing, and surface mode while strictly preserving data bindings, event handlers, and business logic.

---

## 5. On-Demand Reference Library

Load these references only when working on that specific domain:

| Topic | Reference Path |
|---|---|
| Waivable defaults & waiver syntax | [references/reflexes.md](references/reflexes.md) |
| Typography, line-height & tabular numbers | [references/craft/typography.md](references/craft/typography.md) |
| Color tokens, 60-30-10 & elevation | [references/craft/color-surfaces.md](references/craft/color-surfaces.md) |
| Micro-interactions & GPU motion | [references/craft/motion.md](references/craft/motion.md) |
| Native surfaces (selection, caret, scrollbars) | [references/craft/browser-surfaces.md](references/craft/browser-surfaces.md) |
| 50% reduction, active verbs & i18n | [references/copy-i18n.md](references/copy-i18n.md) |
| Responsive reflow, dvh & touch targets | [references/mobile-responsive.md](references/mobile-responsive.md) |
| WCAG 2.2 AA contrast & keyboard operability | [references/accessibility.md](references/accessibility.md) |
| The Data State Quad & mutation feedback | [references/states-feedback.md](references/states-feedback.md) |
| Anti-convergence, 3 Waves of Tells & Mirror Test | [references/divergence.md](references/divergence.md) |
| Structured UI audit matrix | [references/redesign-audit.md](references/redesign-audit.md) |

---

## 6. Verification & Handoff Sweep

Before completing any UI task, run this mechanical check:
1. **State Quad:** Loading skeleton, empty state, error with retry, and populated data are all handled.
2. **Pending Feedback:** Buttons disable and display feedback during ongoing mutations.
3. **Contrast & Focus:** Verify keyboard tab flow and high-contrast `:focus-visible` styling.
4. **Lint Check:** Verify changes against `hooks/lib/known-ui-slop-patterns.json`.
