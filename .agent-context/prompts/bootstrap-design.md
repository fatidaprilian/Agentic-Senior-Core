# Design Direction Prompt

Use this prompt for UI, UX, frontend layout, screen, or redesign work. Create or refine `docs/DESIGN.md` before writing UI code.

## Authority

- Use current repo evidence, project docs, and `.agent-context/` as style context.
- Do not copy layout rhythm, palette, component skin, or brand posture from external references without explicit user approval.
- WCAG 2.2 AA is the hard compliance floor.
- Before choosing a new UI library, research current official docs. Do not default to any component kit or styling tool by habit, and do not avoid them when they fit.

## Step 1: Name Your Defaults

Before any visual choice, name three design directions you are most tempted to use for this project. For each:
1. Name the specific visual pattern (layout, palette, density, motion, typography).
2. Argue against it: why would it flatten what is specific about THIS product's core purpose and data shape?
3. Derive your search direction from the rejection argument.

## Step 2: Choose an Anchor

Pick one concrete, googleable real-world reference whose interaction mechanics (not surface styling) translate to this UI. The anchor must be specific enough that renaming the product to a different category breaks coherence.

Hard constraints:
- Reject generic quality words as anchors: "modern", "clean", "premium", "minimal", "bold" are not anchors.
- Do not default to spatial place metaphors (room, studio, lab, cockpit, command center). Prefer artifacts, workflows, instruments, data behaviors, or interaction mechanisms.
- Record what mechanic is borrowed and what is explicitly NOT borrowed (palette, component skin, layout rhythm).

## Step 3: Creative Commitments

Record before coding:
1. **Typography**: Choose distinctive fonts with meaningful role contrast. Avoid Inter, Roboto, Arial, Space Grotesk, system fonts.
2. **Color and palette**: Dominant colors with sharp accents. Name what product evidence makes the palette fit. Name one color behavior that would not transfer to another category.
3. **Motion and interaction**: Define one signature motion behavior more specific than "smooth." One well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions.
4. **Composition**: One composition choice that avoids interchangeable card stacks. Create atmosphere and depth rather than solid backgrounds.

## Previous Directions (do not repeat)

If `docs/DESIGN.md` contains a list of previous directions, treat every entry as a blocklist. The chosen anchor must differ from every blocklisted entry on conceptual family, hierarchy, and motion. Restating an existing direction with new wording is not a new direction.

## Named Defaults to Avoid

- `dev-tool default`: condensed tabular numerics, monospace on dark slate, monochrome status dots, minimal chrome
- `AI-startup landing default`: purple-to-pink gradient hero, floating glass cards, three-up feature grid, vague hero copy
- `SaaS admin default`: left-side icon-only nav, top utility bar, three-card KPI row above data table, neutral grey
- `marketing site default`: hero image with headline, three feature tiles, pricing tiers, testimonial carousel

Avoid: purple gradients on white, predictable centered-everything composition, solid-color backgrounds without depth, cookie-cutter component patterns. Never converge on common choices across generations.

## Post-Implementation Check

After generating UI code, answer:
1. If the product name were removed, would a designer identify what specific product this was built for? If no, revise the concept.
2. Does the primary viewport avoid the centered-everything default? If no, name the product reason or revise.
3. Name the one default you were most tempted to use. Confirm it was rejected with a product-specific reason.

## Redesign Protocol

When the user says "redesign from zero" or equivalent: treat existing UI as behavioral evidence only. Rewrite design docs. Change primary composition, hierarchy, interaction model, and responsive architecture. Do not ship a palette swap or same hero with new colors.

## Required Docs

Generate or refine `docs/DESIGN.md` before UI implementation. Keep design rationale, creative commitments, and any anti-repeat notes in the markdown contract instead of a separate machine-readable JSON file.
