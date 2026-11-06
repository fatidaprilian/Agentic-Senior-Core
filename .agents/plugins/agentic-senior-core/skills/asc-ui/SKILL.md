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
14. **Single-language purity:** Never mix languages on one surface; preserve monolingual consistency across headings, labels, errors, and actions.
15. **Icon semantics:** Never use raw unicode or emojis as icons. Use dedicated SVG icons; mark decorative icons `aria-hidden="true"`.
16. **Substance over restraint:** Stripping slop is only half the job. Replace removed ornaments with real substance: strong typographic scale contrast, full-field color anchors, and authentic interface fragments. Never leave an empty, sterile wireframe void.
17. **Product over skill (No geek cosplay):** The real-world domain dictates aesthetics. Never inject terminal windows, ASCII art, or pseudo-telemetry consoles into civic, educational, or commercial products (`references/modes/genre-calibration.md`).
18. **The Purpose-Gate:** Every component, widget, or scorecard must enable an actual user task. Never invent unearned widgets, sliders, or simulated feeds without real business data.
19. **Anti-card-soup invariant:** Never wrap structural layout sections (header, nav, rails, tables) into floating rounded card islands. Use a Unified Spatial Canvas with hairline dividers (`divide-y`, `border-r`). Cards are strictly for discrete, interchangeable items (`references/divergence.md`).

---

## 2. Pre-Flight & Material Inventory (BLOCKING GATE)

Before declaring markup, drafting redesign plans, or inspecting user code:

1. **Step 1 — Workspace Brand Audit (Brownfield vs Greenfield):**
   - Check project styling configuration: `app.css`, `globals.css`, `tailwind.config.*`, or `components/ui`.
   - **Brownfield Rule:** If the project already defines brand tokens (e.g. custom brand colors, established fonts, existing UI library), **DO NOT OVERRIDE THEM**. Calibrate neutrals to the brand's color temperature (single neutral family law) and respect established naming.
   - **Greenfield Fallback:** If the repository is brand new with zero tokens, read `references/modes/genre-calibration.md` and select a starting palette from `references/craft/themes-catalog.md`.
2. **Step 2 — Silent Discipline & Real Visual Benchmarks:**
   - Review `references/craft/composition-patterns.md` and inspect matching `references/visuals/real-*.png` / `*-dom.json` for authentic human-designed spacing and layout hierarchies rather than enclosing sections in repetitive `1px` boxes.
   - **Silent Meta-Rules:** Never emit internal framework rules, theme catalog names, or parenthetical foreign translations in user deliverables. Focus purely on technical facts.
3. **Step 3 — Workspace Material Inventory:**
   - **Real:** Concrete numbers, existing endpoints, actual data attributes from controllers/models.
   - **Pictures:** Actual screenshots and product visual assets.
   - **Absent:** Missing quotes, missing logos, or unverified metrics—these are omitted entirely.

---

## 3. Surface Modes & Ambition Scaling

Visual posture is governed by the surface type, not product branding. Every surface maps to an enforced mode reference file:

- **Operate (`references/modes/operate.md`):** Dense scannability, master-detail rails, `tabular-nums`, inline progressive disclosure.
- **Persuade (`references/modes/persuade.md`):** 80-word viewport budget, asymmetric posture, single signature element, zero equal-weight 3-card grids.
- **Read (`references/modes/read.md`):** 65–75ch measure (`max-w-prose`), dual-rail navigation, syntax-highlighted code blocks.
- **Experience (`references/modes/experience.md`):** Receding interface chrome, full-bleed visual canvas, tactile exploration.

---

## 4. Scope Classification: Refine vs. Redesign

Never split the difference into cosmetic polish on a discarded look:
- **Polish / Refinement:** Preserves layout structure, DOM hierarchy, and design tokens. Resolves contrast, missing state quad, microcopy, and lint issues.
- **Restyle:** Preserves layout geometry. Replaces color tokens, typographic scales, corner radiuses, and elevation shadows.
- **Full Redesign:** Replaces entire spatial geometry and posture. Mandatory decoupled protocol: extract data/contracts first, discard old DOM, establish clear spatial posture and theme tokens, and compile directly to production files with complete layout coherence.

---

## 5. On-Demand Reference Library

> [!IMPORTANT]
> **Resolution Note:** All paths below are relative to this `SKILL.md` file's parent folder (`.../skills/asc-ui/`). When calling `read_file`, prepend this skill's directory path.

| Target Domain / Task Requirement | Mandatory Reference Path |
|---|---|
| Domain & genre calibration (Anti-geek cosplay) | `references/modes/genre-calibration.md` |
| Concrete structural layouts & anti-1px cage | `references/craft/composition-patterns.md` |
| Real-world visual benchmarks & rendered DOMs | `references/visuals/` (13 live domains) |
| Curated material themes (Greenfield reference) | `references/craft/themes-catalog.md` |
| Waivable defaults & waiver syntax | `references/reflexes.md` |
| Typography, line-height & tabular numbers | `references/craft/typography.md` |
| Color tokens, single neutral family & elevation | `references/craft/color-surfaces.md` |
| Micro-interactions & GPU motion | `references/craft/motion.md` |
| Native surfaces (selection, caret, scrollbars) | `references/craft/browser-surfaces.md` |
| 50% reduction, active verbs & natural i18n | `references/copy-i18n.md` |
| Responsive reflow, dvh & touch targets | `references/mobile-responsive.md` |
| WCAG 2.2 AA contrast & keyboard operability | `references/accessibility.md` |
| The Data State System & mutation feedback | `references/states-feedback.md` |
| Anti-convergence & layout diversity | `references/divergence.md` |
| Structured UI audit matrix | `references/redesign-audit.md` |

---

## 6. Verification & Handoff Sweep

Before completing any UI task, run this mechanical check:
1. **Brand & Reference Compliance:** Confirm project tokens were respected (or greenfield constraints followed). Verify zero clumsy literal translations or meta-jargon leaks.
2. **Finish Gate Sweep:** Verify zero text clipping (+30% expansion buffer), zero awkward text wraps, and 4px/8px spacing grid consistency.
3. **Visual Verification (`asc preview`):** If a local dev server is running or an HTML prototype exists, run `asc preview <url|file> [--mobile]` to inspect the rendered visual balance before handoff.
4. **Data States:** Loading skeleton, empty state, error with retry, and populated data are all handled.
5. **Pending Feedback:** Buttons disable and display feedback during ongoing mutations.
6. **Contrast & Focus:** Verify keyboard tab flow and high-contrast `:focus-visible` styling.
7. **Lint Check:** Verify changes against `hooks/lib/known-ui-slop-patterns.json`.
