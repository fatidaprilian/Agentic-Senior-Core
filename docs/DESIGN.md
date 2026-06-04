# DESIGN.md (Compact Token File Standard)

This repository ships governance assets, not a finished application UI. In target projects, `docs/DESIGN.md` is a compact design token file that agents read every session for visual consistency.

## Token File Role

When `agentic-senior-core init` detects UI scope, the target project should synthesize `docs/DESIGN.md` as a compact token file using:
- `.agent-context/prompts/bootstrap-design.md` (three-step direction process)
- `.agent-context/rules/frontend-architecture.md` (engineering constraints)

## Required Format

`docs/DESIGN.md` must contain these sections only:
1. **Anchor**: one sentence naming the interaction anchor and borrowed mechanic
2. **Tokens**: typography, colors (OKLCH), spacing, radius, shadow, motion values
3. **Constraints**: WCAG 2.2 AA floor plus up to 3 product-specific anti-patterns
4. **Previous Directions**: anchors used in prior iterations (blocklist for redesign)

Target size: under 400 tokens. Rationale, derivation logic, and research evidence stay in agent working memory during the session but do not persist to the token file.
