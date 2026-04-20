# DESIGN.md (Dynamic Contract Guide)

This repository ships governance assets, not a finished application UI. In target projects, `docs/DESIGN.md` is the human-readable half of a dynamic design contract.

When `agentic-senior-core init` detects UI scope, the target project should synthesize:
- `docs/DESIGN.md` for design direction, rationale, and implementation guidance
- `docs/design-intent.json` for machine-readable design intent and anti-generic constraints

The contract should be generated using:
- `.agent-context/prompts/bootstrap-design.md`
- `.agent-context/rules/frontend-architecture.md`

`docs/DESIGN.md` should stay structural and project-specific:
- define design intent, visual direction, component language, accessibility, responsiveness, and anti-patterns
- explain why the system fits the product and users
- avoid turning reference styles into fixed templates

`docs/design-intent.json` should keep the machine-readable contract aligned with the markdown file so future UI tasks stay dynamic without drifting into generic output.
