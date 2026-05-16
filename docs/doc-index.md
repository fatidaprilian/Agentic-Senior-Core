# Documentation Index

Use this file to pick the smallest useful docs set before loading deeper context.

## Start Here

- `README.md`: public overview, setup, commands, validation, and release flow.
- `docs/project-brief.md`: product scope, users, and current constraints.
- `docs/architecture-decision-record.md`: accepted architecture and operating decisions.
- `docs/flow-overview.md`: init, upgrade, optimize, validation, and release flows.
- `docs/api-contract.md`: CLI commands, generated files, and public script contracts.

## Specialized References

- `docs/DESIGN.md`: UI/design governance context for this repo's docs and assets.
- `docs/integration-playbook.md`: CI/CD, IDE, and agent-entrypoint integration guidance, plus the per-tool caching scope matrix and per-integration adoption sections.
- `docs/benchmark-reference.md`: Benchmark history and the canonical "Caching Effectiveness Reporting Format" for any caching report attributable to this pack.
- `docs/deep-dive.md`: internal behavior details for advanced contributors.
- `docs/terminology-mapping.md`: canonical terminology and developer-facing aliases.
- `docs/deep-analysis-and-roadmap-backlog.md`: active roadmap and completed governance slices.
- `docs/architecture-vision.md`: planned dynamic knowledge surfaces declared in `mcp.json` (status: planned).
- `docs/faq.md`: common questions and troubleshooting context.

## Conditional Docs

- Add `docs/database-schema.md` only if persistent data is introduced.
- Add PRD, SRS, technical-design, or ERD files only when the topic outgrows the core docs or needs a separate owner.
