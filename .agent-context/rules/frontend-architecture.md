# Frontend Design and Interaction Boundaries

Load this rule for UI-facing work. Keep the loaded surface small.

## Activation

Use this rule for UI, UX, page, screen, component, layout, landing, dashboard, form, onboarding, animation, interaction, redesign, visual refresh, responsive fix, hierarchy fix, and frontend deliverables inside fullstack or backend work.

## Authority

- Use current repo evidence, the active brief, and current project docs as valid style context.
- Treat `.agent-context/` as design governance authority.
- Treat `README.md` as public and developer overview, setup, usage, and user-facing context only when design or architecture rules conflict.
- Do not choose final style, framework, palette, typography, layout paradigm, or animation library offline.
- Research current official docs before adding a new UI, animation, scroll, 3D, canvas, charting, icon, styling, or primitive library.
- Dynamic UI Foundation: do not hardcode shadcn/ui, Tailwind-only, native-only, or any component library as the universal answer, and do not avoid them out of guardrail fear when they fit. Tailwind-first is valid when the stack, token model, and team workflow support it; pure Tailwind, vanilla CSS, shadcn/ui, or any kit is not neutral by itself. Modern primitives, motion/canvas/WebGL helpers, charting libraries, and styling tools are valid when product evidence, accessibility, runtime constraints, and official docs support them.
- For fresh projects, prefer official framework scaffolders or setup commands when official docs show they produce the current supported shape. Build files manually only when approved architecture, repo constraints, or learning/prototype scope makes that better.
- Keep design continuity opt-in. Repo evidence outranks memory residue.

## Required Design Contract

Before UI code, create or refine `docs/DESIGN.md` and `docs/design-intent.json`. The contract must record `motionPaletteDecision`, `designFlexibilityPolicy`, `conceptualAnchor`, `derivedTokenLogic`, `aiSafeUiAudit`, `designExecutionPolicy`, `designExecutionHandoff`, `reviewRubric`, `contextHygiene`, `libraryResearchStatus`, and `libraryDecisions[]`.

## Anti-Generic UI Gate

Do not ship interchangeable dashboard chrome, balanced card grids, centered marketing shells, generic component-kit surfaces, generic abstract logos, or nonfunctional background decoration unless the product earns them.

For new screens or broad redesigns, make at least three at-a-glance product-specific signals visible. Signals may be data treatment, iconography, state language, motion behavior, spatial structure, typography, material logic, or color behavior.

Use the rename test: if the UI can be renamed to another product category without changing composition, palette, iconography, and motion language, revise before implementation is considered complete.

Use the old-design regression test for broad redesigns: if the UI reads as the previous design with fewer details, removed animation, simplified sections, or a new palette on the same composition, revise before implementation is considered complete.

Background lines, grids, scanlines, noise, glows, blobs, abstract logos, calibration marks, and decorative geometry are invalid as wallpaper. Do not use grid or line backgrounds as first-output filler. Use them only for a named product function such as alignment, crop guidance, map/route orientation, timeline reading, measurement, status, or motion continuity.

Measurement, calibration, crop, map, route, and inspection marks are task-bound overlays or control affordances. They must not become the page background, hero backdrop, or default visual texture. When a conceptual anchor and a forbidden visual motif conflict, the forbidden motif wins; translate the anchor into layout, hierarchy, density, typography, state behavior, materials, and interaction instead of literal decorative texture.

Production UI must read as ship-ready: no visible testing, demo, sample, placeholder, lorem, TODO, coming soon, or scaffold labels unless they are intentional product states. User-facing workflows need an operable UI path; terminal-only core flows are valid only for CLI, developer-tool, or runbook products.

## Dynamic Anchor Gate

If the user gives no current-task visual research or reference:
- Do not count old UI, existing design docs, or scaffold seeds as research.
- Choose one high-variance non-software conceptual anchor before UI code.
- Internally reject the safest dashboard, portal, card-grid, admin-shell, or minimalist-web-app mental model.
- Do not let the fallback anchor become a generic place metaphor. Avoid room, darkroom, counting room, control room, war room, studio, lab, cockpit, and command center unless the product actually depends on that place model; prefer product-specific artifacts, workflows, custody chains, instruments, data behaviors, material systems, editorial systems, service rituals, or interaction mechanisms over "where the UI lives".
- Record one real-world anchor reference, one signature motion behavior, and one typographic decision with role contrast.
- Derive typography, spacing, morphology, motion, and responsive recomposition from that anchor.
- Translate the anchor into workflow, hierarchy, density, typography, state behavior, and interaction before using literal artifacts. Do not turn anchor artifacts into required chrome, wallpaper, decorative props, or component-kit theme objects without a named product function.
- Reject anchors described only by generic quality words such as modern, clean, premium, expressive, minimal, or bold.

## Motion, Palette, and 3D

- Product categories are heuristics, not style presets.
- Choose motion density from task, content density, brand intent, device budget, performance, and accessibility.
- Map states before coding: default, hover, focus-visible, active, disabled, loading, empty, error, success, transition.
- Distinguish motion (visual continuity between states) from interaction design (state machines, focus transfer on route/modal/error transitions, optimistic updates where safe, skeleton shapes that match real content, `aria-live` for status, keyboard paths, scroll-driven progressive disclosure). Record at least one interaction-design decision per major flow alongside motion choices.
- Prefer visually exploratory, product-derived palettes while preserving WCAG contrast and status clarity.
- Do not default to dark slate, cream/beige/tan, purple-blue gradients, monochrome palettes, cyber-neon terminals, or uniform card surfaces without product evidence.
- Treat motion, 3D, WebGL, canvas, scroll choreography, and animation libraries as first-class options.
- Omit rich motion or spatial UI only after naming the product-fit reason and the replacement interaction quality.
- For new screens or broad redesigns, research the expressive implementation path instead of defaulting to static native CSS. Use native or already-installed tools only when they can still deliver the chosen ambition, or when a concrete blocker is documented. Do not downshift because adding a package feels inconvenient; downshift only for a concrete product-fit, accessibility, security, compatibility, device, maintenance, or measured performance reason.
- Prefer micro-interactions in 150-300ms, layout transitions in 300-500ms, transform/opacity for high-frequency motion, explicit easing, bounded stagger, and reduced-motion alternatives unless evidence changes the budget.
- Keep reduced-motion, keyboard, loading, performance, mobile, and non-3D fallbacks explicit.
- Use component kits or headless primitives for behavior and accessibility when they fit. Replace library-default visual language with project-specific composition, tokens, motion, state treatment, and morphology.
- Keep design-intent flexible: lock user goals, accessibility, production readiness, forbidden patterns, and approved continuity; keep exact palette primitives, font families, radius/shadow values, component skins, candidate signature moves, and external website inspiration flexible until evidence or approval locks them. Convert references into product-fit rules; do not copy layout, palette, component skin, brand posture, or visual metaphor.
## Zero-Based Redesign

If the user asks for a redesign from zero:
- Treat existing UI as behavioral/content evidence only.
- Discard prior palette, typography, hero composition, navigation placement, component morphology, motion signature, and image framing unless the user requests continuity.
- Rewrite or materially update both design docs before coding.
- Change primary composition, content hierarchy, interaction model, and responsive information architecture.
- Reject palette swaps, dark-mode flips, and restyled heroes.
- Reject implementations that remove animation, media, depth, or interaction density merely to reduce complexity when the request calls for a more distinctive experience.

## Responsive Mutation

Responsive quality is not scale-only.

- Mobile must prioritize the first decisive action.
- Tablet must regroup surfaces instead of shrinking desktop.
- Desktop may expose more context but must not become interchangeable admin chrome.
- At least one major surface must change position, grouping, priority, or disclosure strategy between mobile and desktop.
- Prefer container queries, dynamic viewport units, support-checked selectors, subgrid, popover, or disclosure primitives when they simplify recomposition and fallbacks are clear.

## Accessibility

- WCAG 2.2 AA is the hard floor.
- APCA is advisory perceptual tuning only.
- Hard checks include focus visibility, focus appearance, target size, keyboard access, accessible authentication, color-only meaning, and dynamic status/state access.
- Fix accessibility issues without flattening the UI into generic safe chrome unless no expressive safe option remains.

## CSS Production Hardening

- Plan overflow, wrapping, truncation, empty, loading, error, and extreme-content behavior before declaring a layout complete.
- Prefer `min()`, `max()`, `clamp()`, stable aspect ratios, container-relative sizing, OKLCH, and tinted neutrals for new tokens when supported; preserve existing design-system tokens.
- Prefer composition primitives that match content meaning: named `grid-template-areas` for editorial regions, subgrid for nested alignment across siblings, container queries for component-level responsiveness independent of viewport, and explicit stacking context (`isolation: isolate`) when overlap or z-depth carries meaning. Do not default to flex column when content has structure that grid expresses better.
- Treat recursive card nesting, uniform radius everywhere, shadow on every surface, arbitrary spacing, gray text on saturated color, and library-default skins as drift signals requiring product rationale.

## Implementation Boundaries

- Follow the shipped project stack and current repo patterns.
- Do not hardcode Zustand, React Query, smart/dumb component doctrine, or framework-specific architecture as universal design law.
- Keep structure feature-oriented when it improves maintainability.
- Keep component states recognizable across hover, focus, loading, success, empty, and error.
- Do not let repeated surfaces share one visual treatment by habit; repetition needs a product reason.
