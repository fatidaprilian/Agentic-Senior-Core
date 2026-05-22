# Documentation Index

Use this file to pick the smallest useful docs set before loading deeper context.

## Start Here

- `README.md`: public overview, setup, commands, terminology mapping, validation, and release flow.
- `docs/project-brief.md`: product scope, users, and current constraints.
- `docs/architecture-decision-record.md`: accepted architecture and operating decisions.
- `docs/flow-overview.md`: init, upgrade, optimize, validation, and release flows.
- `docs/api-contract.md`: CLI commands, generated files, and public script contracts.

## Specialized References

- `docs/DESIGN.md`: UI/design governance context for this repo's docs and assets.
- `docs/integration-playbook.md`: CI/CD, IDE, and agent-entrypoint integration guidance, plus the per-tool caching scope matrix and per-integration adoption sections.
- `docs/benchmark-reference.md`: Benchmark history and the canonical "Caching Effectiveness Reporting Format" for any caching report attributable to this pack.
- `plans/compact-natural-mode/`: response-compression plan, task formats, integration surface, and benchmark gates. The installed prompt lives at `.agent-context/prompts/compact-natural-mode.md`.
- `docs/architecture/decisions-foundation.md`: empirical foundation for the v4 decisions; cite this when defending caching, format, or anti-halu choices.
- `docs/architecture/format-spec.md`: canonical rule-file format used by the citation contract.
- `docs/deep-dive.md`: internal behavior details for advanced contributors.
- `docs/deep-analysis-and-roadmap-backlog.md`: active roadmap and completed governance slices.
- `docs/architecture-vision.md`: planned dynamic knowledge surfaces declared in `mcp.json` (status: planned).
- `docs/faq.md`: common questions and troubleshooting context.

## Backend Rule Pack (Layer 1)

The fifteen v4 rule files plus the six added in 4.1.0 live under `.agent-context/rules/`. AGENTS.md routes which rules to load by task scope; do not load the directory by default. New in 4.1.0: `observability.md` (`OBS-*`), `resilience.md` (`RES-*`), `migrations.md` (`MIG-*`), `background-jobs.md` (`JOB-*`), `config-and-flags.md` (`CFG-*`), `api-versioning.md` (`VER-*`).

## Historical Record

- `docs/archive/HISTORY.md`: consolidated record of phase outcomes, archived playbooks, retired roadmap, and dated audit snapshots; do not treat as live decisions.
- `docs/archive/CHANGELOG-archive.md`: pre-v3 release history.
- `docs/archive/migrations/`: one-shot v3-to-v4 migration tooling kept for reference; not on any active code path.

## Conditional Docs

- Add `docs/database-schema.md` only if persistent data is introduced.
- Add PRD, SRS, technical-design, or ERD files only when the topic outgrows the core docs or needs a separate owner.
