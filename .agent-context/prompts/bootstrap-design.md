# Bootstrap Dynamic Design Contract

When a user requests UI, UX, frontend layout, screen, Tailwind, animation, or redesign work, create or refine:
- `docs/DESIGN.md` for human-readable design reasoning
- `docs/design-intent.json` for machine-readable design intent, guardrails, and review signals

This contract is a decision scaffold, not a style preset. It must guide the LLM to choose well from the current repo, current user brief, current project docs, and live official documentation when a technology or library claim matters.

## Core Rule

We guide the agent; we do not pick the final style, stack, framework, palette, typography, layout paradigm, or animation library offline.

The agent must:
1. Read [AGENTS.md](../../AGENTS.md), this prompt, [frontend-architecture.md](../rules/frontend-architecture.md), current UI code, current project docs, and existing design docs before UI edits.
2. If `docs/DESIGN.md` or `docs/design-intent.json` exists, refine them instead of replacing them blindly.
3. If either design doc is missing, create it before UI implementation.
4. Use current repo evidence, product copy, route names, component names, user goals, and existing constraints as the source of truth.
5. Treat prior-chat visuals, unrelated project memory, benchmark screenshots, and famous-product aesthetics as tainted unless the user explicitly asks for continuity.
6. When choosing a new UI, animation, styling, or component library, research current official docs and choose the latest stable compatible option for this project. Do not rely on offline defaults.
7. Keep external references non-copying: extract constraints and reasoning only, never clone the surface.

## Design Quality Bar

The UI must feel authored by a strong UI/UX designer, not assembled from default cards and safe framework chrome.

Do:
- Synthesize a visual direction from the project context and explain why it fits.
- Choose color, typography, spacing, motion, density, and component morphology dynamically from the product and audience.
- Use modern, expressive interaction when it improves hierarchy, feedback, delight, confidence, or memorability.
- Keep frontend code clean, componentized, accessible, and easy to maintain.
- Use tokens and semantic aliases so future changes do not require rewriting components.
- Make design decisions explicit before coding, then implement consistently.

Do not:
- Default to generic SaaS heroes, balanced card grids, soft startup gradients, or dashboard chrome without product rationale.
- Let desktop, tablet, and mobile be the same design merely scaled down.
- Let heading, body, data, and metadata collapse into one safe typographic treatment without rationale.
- Reuse colors, layout shapes, or motion signatures from unrelated memory.
- Add decorative animation that hurts clarity, accessibility, or runtime performance.
- Choose a dependency because this repo scaffold mentioned it. The LLM must verify fit from current project context and official docs.

## Responsive Rule

Responsive design means recomposition, not resizing.

For every UI task, define how major surfaces change across mobile, tablet, and desktop:
- What is reordered, merged, hidden, disclosed, or promoted?
- What interaction changes for touch and narrow screens?
- What content priority changes by viewport?
- What is explicitly forbidden, such as scale-only shrink or preserving desktop order without reason?

## Required `docs/DESIGN.md` Sections

1. Design Intent and Product Personality
2. Audience and Use-Context Signals
3. Visual Direction and Distinctive Moves
4. Color, Typography, Spacing, and Density Decisions
5. Token Architecture and Alias Strategy
6. Responsive Recomposition Plan
7. Motion, Interaction, and Feedback Rules
8. Component Language, States, and Morphology
9. Source Boundaries and Context Hygiene
10. Accessibility Non-Negotiables
11. Anti-Patterns to Avoid
12. Implementation Notes for Future UI Tasks

## Required `docs/design-intent.json` Behavior

The JSON must stay machine-readable and project-specific. It should record:
- the confirmed project context and assumptions to validate
- agent-chosen visual direction, not scaffold-chosen direction
- agent-chosen semantic color roles, typography system, spacing rhythm, and motion approach
- token layering with primitive, semantic, and component tokens
- viewport mutation rules for mobile, tablet, and desktop
- interaction-state expectations for key components
- accessibility hard floor and advisory readability checks
- review rubric for distinctiveness, contract fidelity, hierarchy, responsive recomposition, motion discipline, and accessibility
- forbidden patterns that are concrete bad habits for this project
- repo evidence when available, including `repoEvidence.designEvidenceSummary`

## Accessibility and Review

WCAG 2.2 AA is the hard floor. APCA may be used only as advisory perceptual tuning and must never waive a WCAG failure.

The review must block or flag:
- inaccessible contrast, focus, target size, keyboard, auth, or dynamic-status behavior
- scale-only responsive behavior
- unresearched dependency choices
- default component-kit styling without product rationale
- visual direction copied from unrelated memory or external references
- genericity findings that cannot name the exact drift signal

Wait for user approval before generating Figma or code assets when the user only asked for planning or design direction.
