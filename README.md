<div align="center">

# Agentic-Senior-Core

### Change your AI Agent to code like a Staff Engineer, not a Junior.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Production-grade Rules Engine for AI coding agents.**
Works with Cursor, Windsurf, GitHub Copilot, Claude Code, Gemini, and other LLM-powered IDE workflows.

</div>

---

## Install

```bash
npx @ryuenn3123/agentic-senior-core init
```

Initializes `AGENTS.md`, native import bridges, checklists, policies, state files, and the lazy `.agent-context/` rule library. Token optimization and Compact Natural Mode are enabled by default.

Options:
- Add `--mcp-template` to generate VS Code MCP workspace config.
- Default init keeps MCP files opt-in.
- Add `--no-token-optimize` only when you do not want ASCX command guidance enabled.
- Add `--local-only` to ignore instructions (AGENTS.md, .agent-context/, and bridges) in .gitignore so they are not pushed to GitHub.
- Local backup snapshots are written under `.agentic-backup/` and excluded from version control.

## Upgrade

```bash
npx @ryuenn3123/agentic-senior-core upgrade --dry-run
npx @ryuenn3123/agentic-senior-core upgrade --yes
```

Preview changes with `--dry-run`, then apply with `--yes`. Upgrade prunes obsolete managed files by default; use `--no-prune` to keep them. User-owned files without Agentic markers are never overwritten.

---

## Core Commands

> [!NOTE]
> To run commands directly without `npx` (e.g., `ascx` or `agentic-senior-core`), install the CLI globally: `npm install -g @ryuenn3123/agentic-senior-core`.

| Command | Purpose |
|---------|---------|
| `agentic-senior-core init` | Initialize the compact project guidance pack and native agent entrypoints |
| `agentic-senior-core upgrade --dry-run` | Preview managed-surface upgrades |
| `agentic-senior-core context "<request>" --json --file src/app/page.tsx` | Resolve request labels, rules, prompts, docs, file signals, budget status, and fallback status |
| `ascx <command>` | Run a command through the local evidence-preserving output wrapper (safely falls back to passthrough if unsupported) |
| `asc optimize status` | Check ASCX runtime token saver readiness |
| `asc optimize doctor` | Diagnose ASCX availability, tee write safety, and compression conflicts |
| `agentic-senior-core optimize --show` | Show token optimization state |
| `agentic-senior-core mcp` | Start local MCP stdio runtime |
| `npm run clean:local` | Remove ignored local reports, backups, benchmarks, and active-memory state |

`ascx` dynamically compresses supported commands with noisy output (e.g., builds, tests, searches, and git logs). Other commands, pipes, redirects, and unsupported shell shapes safely pass through without compression. Compressed output includes a structured footer with command, exit code, filter name, estimated token reduction, and a raw tee path when safety requires it.

`asc` is a short alias for the main `agentic-senior-core` CLI. The doctor does not probe localhost services in this phase; `9router` status remains `not-checked`.

---

## What It Does

A coding agent that has read every framework tutorial still ships junior-grade work because nothing in its training tells it which trade-off matters in your codebase. This pack is a small set of plain-language rules an agent loads only when the work scope calls for them. The rules are written as invariants and bad habits to reject, not as opinions about which framework is fashionable. You install it with one command, revert with a backup, and it does not depend on any IDE or LLM provider.

### How It Works

1. Agent reads `AGENTS.md` at the start of each session.
2. `AGENTS.md` activates the default triad: Adaptive Context for scoped rule selection, ASCX wrappers for supported noisy commands, and Compact Natural Mode for final replies.
3. For shell commands, the agent uses `ascx` wrappers that compress noisy output while preserving debugging evidence (exit codes, file paths, line numbers, root errors, truncation markers, and raw tee paths).
4. For final replies, the agent applies `.agent-context/prompts/compact-natural-mode.md` so answers stay concise without losing commands, paths, errors, assumptions, validation status, risks, or next actions.
5. Detailed rules live under `.agent-context/rules/` and load by scope: 21 rule files covering architecture, security, performance, testing, database, API, frontend, Docker, observability, resilience, migrations, background jobs, configuration, and versioning.

### Instruction Entrypoints

The canonical installed source is `AGENTS.md`.

Default init and upgrade keep the project root compact:
- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- `.agent-context/`

`CLAUDE.md` and `GEMINI.md` are native import bridges that load `AGENTS.md`. Detailed rules, prompts, checklists, policies, and state stay under `.agent-context/` and load by task scope.

Deprecated legacy files (`.instructions.md`, `.agent-instructions.md`, `.cursorrules`, `.windsurfrules`, tool-specific rule directories) are no longer generated. Upgrade prunes Agentic-managed copies while preserving user-owned files.

### Long-Term Stability

Rules are written as invariants, outcomes, and freshness criteria, not as named patterns, library prescriptions, or magic-number thresholds. Where a rule cites a specific tool or threshold, the citation block carries a freshness anchor so the next maintainer knows when the technology references were last validated.

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

## Design Direction

For UI, UX, layout, screen, Tailwind, frontend, or redesign work, the pack routes agents through a research dossier prompt and design bootstrap before code changes. The flow synthesizes a conceptual anchor, derives typography, spacing, morphology, motion, and responsive behavior, and carries a 90-day freshness gate with an anti-repeat ledger to avoid recycling the same visual direction. Existing projects read the real repository and docs first; fresh projects ask the agent to recommend the stack from current evidence instead of hardcoding a framework.

See [docs/doc-index.md](docs/doc-index.md) for the full doc routing map.

---

## What's New

### v4.2

Adds `ascx` command wrapper to optimize token usage via high-signal adapters for `git status`, `git diff`, and `npm test` alongside the `Compact Natural Mode` response compression contract to reduce token overhead while retaining high-fidelity reasoning.

### v4.1

Adds six backend rule files (`OBS-*`, `RES-*`, `MIG-*`, `JOB-*`, `CFG-*`, `VER-*`) and targeted refinements to `frontend-architecture.md`, `security.md`, `database-design.md`, and `api-docs.md`. See [CHANGELOG.md](CHANGELOG.md) for the full list.

### v4.0

Numbered Markdown rules with stable section IDs, bounded reflection, provider-free anti-halu benchmark, three-layer prompt caching contract, and per-integration caching scope enforcement. Caching numbers are scoped per integration; IDE wrapper integrations receive prefix stability without a measurable per-pack saving. See [docs/benchmark-reference.md](docs/benchmark-reference.md) for the reporting format and [CHANGELOG.md](CHANGELOG.md) for details.

Current package version: 4.3.3. Last published version: 4.3.2.

---

## Validation

```bash
npm run validate
npm test
npm run gate:release
npm run benchmark:ascx
```

---

## Reference Docs

- FAQ: docs/faq.md
- Deep dive internals: docs/deep-dive.md
- Deep analysis and roadmap: docs/deep-analysis-and-roadmap-backlog.md
- Integration playbook: docs/integration-playbook.md
- Benchmark and stack reference: docs/benchmark-reference.md
- Project history: docs/archive/HISTORY.md

---

## Release and npm Publish Flow

This repository publishes to npm through GitHub Actions on push to `main`.

Release checklist:

1. Run `node scripts/bump-version.mjs <version>`.
2. Fill the matching release notes in `CHANGELOG.md`.
3. Run `npm run check:adapters`, `npm run validate`, `npm test`, `npm run gate:release`, and `git diff --check`.
4. Commit with a Conventional Commit message.
5. Push to `origin/main`.

Package scope: `@ryuenn3123`. GitHub owner: `fatidaprilian`.

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

## License

MIT - Use freely, enforce strictly.
