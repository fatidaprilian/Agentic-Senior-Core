<div align="center">

# Agentic-Senior-Core

### Change your AI Agent to code like a Staff Engineer, not a Junior.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Production-grade Rules Engine (Governance Engine) for AI coding agents.**
Works with Cursor, Windsurf, GitHub Copilot, Claude Code, Gemini, and other LLM-powered IDE workflows.

Current package version: 4.1.0. Last published version before this release: 4.0.3.

Highlights:
- Uses `AGENTS.md` as the canonical instruction entrypoint.
- Keeps Claude Code and Gemini bridges as native `@AGENTS.md` imports.
- Resolves task scope through the Adaptive Context gate, then loads detailed rules lazily from `.agent-context/`.
- Keeps MCP workspace files opt-in through `--mcp-template`.

</div>

---

## Why this exists

A coding agent that has read every framework tutorial on the internet still ships junior-grade work because nothing in its training tells it which trade-off matters in your codebase. This pack is a small set of plain-language rules an agent loads only when the work scope calls for them: data, endpoints, observability, resilience, migrations, jobs, configuration, versioning, security, design, and a few more. The rules are written as invariants and as bad habits to reject, not as opinions about which framework is fashionable. An agent that reads them treats your repo with the discipline of a senior engineer the first time, instead of after three rounds of review. You install it with one command, you can revert it with a backup, and it does not depend on any particular IDE or LLM provider.

### Long-Term Stability

The rules in this pack are written as invariants, outcomes, and freshness criteria, not as named patterns, library prescriptions, or magic-number thresholds. A migration rule says "DDL expected to hold a lock longer than the service's acceptable request-latency threshold must use an online migration mechanism", not "use pgroll for tables larger than ten million rows". A resilience rule says "fail fast when a dependency is unhealthy and shed load before shared resources are exhausted", not "implement a circuit breaker using library X". The intent is that each rule continues to tell a future maintainer the right thing to do across at least three years of framework and tooling churn. Where a rule cites a specific tool name or numeric threshold, the citation block at the bottom of the rule carries a freshness anchor and (in the next release) a `last_validated` date so the next maintainer knows when the technology references were last cross-checked against current practice.

---

## What's New in v4.1

This release adds six backend rule files that bring the backend pack to parity with the existing frontend rule. They are technology-neutral by construction and follow the same v4 numbered-Markdown format as the prior fifteen rules.

- `observability.md` (`OBS-*`) — observability as structured per-request events; metrics, logs, and traces as derived views; SLO-backed alerting; cardinality, signal-substitution, and audit-stream rules.
- `resilience.md` (`RES-*`) — explicit timeouts and deadline propagation, idempotency-required retries, dependency isolation, fail-fast as outcome (not named pattern), explicit graceful degradation, observable backpressure.
- `migrations.md` (`MIG-*`) — expand-contract / parallel-change for live data, deploy-ordering invariant, lock-posture rule keyed to the service's own latency budget, idempotent resumable backfills, mandatory risk fields per migration ticket.
- `background-jobs.md` (`JOB-*`) — job-shape selection (scheduled vs queued vs stream vs one-shot), per-job ownership and runbook, job-level idempotency, lease/checkpoint/graceful-shutdown for long jobs, poison-message and dead-letter discipline, UTC schedules, jittered fan-out, explicit backpressure.
- `config-and-flags.md` (`CFG-*`) — configuration sources and startup validation, secret handling, four-way feature-flag taxonomy (release / kill switch / experiment / entitlement) with per-flag owner and expiry, safe defaults on flag-service outage, no-branch-on-environment rule.
- `api-versioning.md` (`VER-*`) — single versioning strategy per surface, breaking-vs-non-breaking definitions, deprecation discipline (in-band signal via RFC 9745 / RFC 8594 where adopted, plus migration guide and telemetry), explicit support windows, additive evolution as default, CI-blocking compatibility checks.

Plus targeted refinements to four existing rules:

- `frontend-architecture.md` — FE-012 Data state surface, FE-017 Interactivity priority, FE-018 Internationalization as layout, FE-019 Theme as context.
- `security.md` — SEC-003 authn vs authz, SEC-004 memory-hard credential storage, SEC-005 cryptographically verifiable service-to-service identity.
- `database-design.md` — DATA-003 money and time (no floating-point money, UTC for real-world moments), DATA-004 concurrency and write conflicts.
- `api-docs.md` — API-005 cross-reference to the new versioning rule, API-012 idempotency as a runtime invariant (not just a documentation field).

Plus repository hygiene: archive consolidation into `docs/archive/HISTORY.md`, removal of the v3-purge and migrate-rule-format tooling (now under `docs/archive/migrations/`), and inlining of the terminology mapping into this README.

## What's New in v4 (prior)

The internal `.agent-context/rules/` pack is now numbered Markdown with YAML frontmatter and stable section IDs (e.g. `FE-004`, `ARCH-009`, `API-006`). This is a breaking change for downstream consumers that parse rule headings; the migration guide lives in `CHANGELOG.md` under `4.0.0`. Repository-wide impact:

- Rules are now citable by ID, which the new bounded reflection block in `AGENTS.md` and the validation MCP tools (`lookup_rule`, `validate_against_rules`, `audit_compliance`) rely on.
- A three-layer prompt caching contract (D4 in `docs/architecture/decisions-foundation.md`) is now enforced by `npm run audit:cache-layer-contract`.
- A provider-free anti-halu benchmark is included (`benchmarks/anti-halu/`); pass rate and citation validity are reproducible locally.
- Caching numbers are scoped per integration. The 89.31% Anthropic warm-cache effective reduction reported in `benchmarks/results/cache-phase-2-2026-05-16.json` applies to direct provider API and Claude Code SDK programmatic mode only. IDE wrapper integrations (Cursor, Windsurf, Codex CLI, Kiro) receive prefix stability without a measurable per-pack saving. See `docs/integration-playbook.md` for the per-tool matrix and `docs/benchmark-reference.md` for the required reporting JSON shape.


## 60-Second Start


```bash
npx @ryuenn3123/agentic-senior-core init
```

One command to initialize `AGENTS.md`, native import bridges, checklists, policies, state files, and the lazy `.agent-context/` rule library for your project.

> **See [docs/doc-index.md](docs/doc-index.md), [docs/deep-dive.md](docs/deep-dive.md), and [docs/deep-analysis-and-roadmap-backlog.md](docs/deep-analysis-and-roadmap-backlog.md) for deeper CLI, architecture, integration, and roadmap context.**

- Default init copies the compact instruction surface and writes onboarding, selected policy, token optimization, and memory continuity state.
- Installed agents are instructed to run the Adaptive Context resolver when available before selecting task rules; file path signals can be passed when the agent already knows the touched files.
- MCP workspace files are disabled by default. Add `--mcp-template` when you want starter IDE MCP configuration files.
- When project docs are scaffolded, `docs/doc-index.md` is used as the compact map for deeper docs so agents can read the right files without scanning every Markdown file.
- Local backup snapshots are written under `.agentic-backup/`; init and upgrade ensure that folder is ignored by the target repository.
- Package scope is `@ryuenn3123`; the GitHub repository owner is `fatidaprilian`.

---

## Design Direction

For UI, UX, layout, screen, Tailwind, frontend, or redesign work, the pack routes agents through the design bootstrap and frontend architecture rules before code changes.

The intended behavior is agent-led, not offline-template-led:

- Existing projects: read the real repository, docs, UI surface, and current user brief before changing design.
- Fresh projects: ask the LLM agent to recommend the stack and design approach from current evidence instead of silently choosing a hardcoded framework.
- No visual reference provided: synthesize one modern conceptual anchor first, then derive typography, spacing, morphology, motion, and responsive behavior from that anchor.
- Modern UI claims: research current-year libraries and patterns when relevant; 2026 work should use 2026 evidence, and future years should update automatically through agent research.
- Anti-generic rule: avoid safe dashboard shells, admin panels, card grids, scale-only mobile layouts, and static no-motion interfaces unless the product context explicitly justifies them.

UI design work runs a research dossier prompt (`.agent-context/prompts/research-design.md`) before the bootstrap prompt. The dossier captures product reading, reference intake, category cliches, a morphological matrix, and five anchor candidates with a strengthened rename test. The contract carries a 90-day `researchVerifiedAt` freshness gate and an anti-repeat ledger seeded from prior anchor, palette, motion, and typography choices on existing projects, so additive UI work within the freshness window skips the research stage while redesigns and stale dossiers re-run it.

---

## MCP Quick Setup (VS Code)

1. Generate workspace MCP config:

```bash
npx @ryuenn3123/agentic-senior-core init --mcp-template
```

2. Open `MCP: Open Workspace Folder Configuration`.
3. Confirm `.vscode/mcp.json` points to `node ./scripts/mcp-server.mjs` with `cwd: ${workspaceFolder}`.
4. Trust and start the server in Chat Customizations > MCP Servers.

Optional: enable `chat.mcp.autoStart` (Experimental) for auto-restart when MCP config changes.

If you see `Property $schema is not allowed`, keep `.vscode/mcp.json` without `$schema` and keep only `servers`.

---

## Core Commands

| Command | Purpose |
|---------|---------|
| `agentic-senior-core init` | Initialize the compact project guidance pack and native agent entrypoints |
| `agentic-senior-core upgrade --dry-run` | Preview managed-surface upgrades |
| `agentic-senior-core context "<request>" --json --file src/app/page.tsx` | Resolve request labels, rules, prompts, docs, file signals, and fallback status |
| `agentic-senior-core optimize --show` | Show token optimization state |
| `npm run clean:local` | Remove ignored local reports, backups, benchmarks, and active-memory state |
| `agentic-senior-core mcp` | Start local MCP stdio runtime |

---

## Upgrade Existing Governance Pack

```bash
npx @ryuenn3123/agentic-senior-core upgrade --dry-run
npx @ryuenn3123/agentic-senior-core upgrade --yes
```

Use `--dry-run` first to preview changes safely, then apply with `--yes`.

Upgrade now performs managed-surface synchronization by default: obsolete Agentic-managed instruction files are pruned so the pack stays aligned with the latest release.
Use `--no-prune` if you want to keep legacy managed files.

When upgrade creates `.agentic-backup/`, it also keeps the target root `.gitignore` aligned with that local-only backup folder. The backup is for rollback safety, not a source of truth and not a file to commit.

## Instruction Entrypoints

The canonical installed source is `AGENTS.md`.

Default init and upgrade now keep the project root compact:
- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- `.agent-context/`

`CLAUDE.md` and `GEMINI.md` are native import bridges that load `AGENTS.md`. Detailed rules, prompts, checklists, policies, and state stay under `.agent-context/` and load by task scope.

Deprecated legacy files such as `.instructions.md`, `.agent-instructions.md`, `.cursorrules`, `.windsurfrules`, `.agent-override.md`, tool-specific rule directories, and copied Copilot/Gemini instruction folders are no longer generated by default. Upgrade prunes Agentic-managed copies while preserving user-owned files without Agentic markers.

---

## Terminology Mapping (Final)

| Canonical Term | Developer-Facing Alias | Usage Rule |
|----------------|------------------------|------------|
| Federated Governance | Federated Rules Operations | Use canonical term in formal policy artifacts. |
| Governance Engine | Rules Engine | Use alias in onboarding and day-to-day developer docs. |
| Guardrails | Quality Checks | Use alias in implementation guidance and quickstart docs. |

Rule: on first mention in developer-facing docs, include canonical term in parentheses.

Examples:
- `Federated Rules Operations (Federated Governance)`
- `Rules Engine (Governance Engine)`
- `quality checks (guardrails)`

Compliance boundary: formal policy and audit artifacts must keep canonical terminology for operational traceability.

---

## Reference Docs

- FAQ: docs/faq.md
- Deep dive internals: docs/deep-dive.md
- Project history (phase outcomes, archived playbooks, retired roadmap): docs/archive/HISTORY.md
- Integration playbook: docs/integration-playbook.md
- Benchmark and stack reference: docs/benchmark-reference.md
- Active roadmap and backlog: docs/deep-analysis-and-roadmap-backlog.md

---

## Validation

```bash
npm run validate
npm test
npm run gate:release
```

---

## Release and npm Publish Flow

This repository publishes to npm automatically through GitHub Actions on every push to `main`.

Release checklist:

1. Run `node scripts/bump-version.mjs <version>`.
2. Fill the matching release notes in `CHANGELOG.md`.
3. Run `npm run check:adapters`, `npm run validate`, `npm test`, `npm run gate:release`, and `git diff --check`.
4. Commit with a Conventional Commit message.
5. Push to `origin/main`.

Important notes:

- If the npm version already exists, publish fails.
- Publish requires valid `NPM_TOKEN` in repository secrets.

---

## License

MIT - Use freely, enforce strictly.
