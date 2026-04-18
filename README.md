<div align="center">

# Agentic-Senior-Core

### Force your AI Agent to code like a Staff Engineer, not a Junior.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Production-grade Rules Engine (Governance Engine) for AI coding agents.**
Works with Cursor, Windsurf, GitHub Copilot, Claude Code, Gemini, and other LLM-powered IDE workflows.

Latest release: 3.0.0 (2026-04-18).

Highlights in 3.0.0:
- Universal IDE adapter surface is completed and synchronized through thin adapters.
- Scoped auto-docs sync rollout is active with explicit phase-1 boundaries and precision/recall evidence.
- Init and scaffolding flow is slimmer, template-free on active path, and validated by deterministic release gates.

</div>

---

## 60-Second Start

```bash
npx @ryuenn3123/agentic-senior-core init
```

That one command initializes your project with compiled rules, review checklists, and state context.

Golden Standard mode is now the default path: init applies the recommended quality profile automatically, without a beginner/balanced/strict prompt on first run.

Optional team default path:

```bash
npx @ryuenn3123/agentic-senior-core init --profile-pack startup
```

Project-description-first path (AI as Architect with veto control):

```bash
npx @ryuenn3123/agentic-senior-core init --project-description "Machine learning API for fraud detection"
```

Default init path now attempts trusted realtime stack research first (with automatic snapshot fallback):

```bash
npx @ryuenn3123/agentic-senior-core init --project-description "Event-driven payments platform"
```

Force deterministic snapshot-only mode:

```bash
npx @ryuenn3123/agentic-senior-core init --project-description "Event-driven payments platform" --architect-research-mode snapshot
```

Optional trusted realtime enrichment (explicitly gated):

```bash
npx @ryuenn3123/agentic-senior-core init --project-description "Modern conversion-focused product website" --architect-research-mode realtime --enable-realtime-research --architect-realtime-signal-file ./realtime-signals.json
```

AI-first project context bootstrap (no static docs template rendering):

- Init now generates bootstrap prompts under `.agent-context/prompts/`.
- On first IDE chat, execute `bootstrap-project-context.md` when `docs/project-brief.md` is missing.
- For UI-first projects, execute `bootstrap-design.md` when `docs/DESIGN.md` is missing.
- The assistant should synthesize docs from scratch into `docs/` and treat them as living context.

Canonical instruction output (multi-tool bridge):

- Init now generates `.agent-instructions.md` as canonical instruction source.
- Init also syncs adapter files for tool compatibility: `.cursorrules`, `.windsurfrules`, `.clauderc`, `.gemini/instructions.md`, and `.github/copilot-instructions.md`.

V3 purge readiness dry-run (no deletion):

```bash
npm run audit:v3-purge
```

- This command writes `.agent-context/state/v3-purge-audit.json` and reports whether static directory deletion is safe.

---

## Before / After

```text
Before:
"Build me a user registration API"
=> one file, weak validation, no typed errors, weak structure

After:
"Build me a user registration API"
=> layered modules, validated inputs, typed errors, tests, docs updates
```

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
| `agentic-senior-core init` | Initialize rules operations context (Federated Governance baseline) |
| `agentic-senior-core upgrade --dry-run` | Preview safe upgrades |
| `agentic-senior-core optimize --show` | Show token optimization state |
| `npm run audit:v3-purge` | Run deep purge readiness audit (no deletion) |
| `agentic-senior-core mcp` | Start local MCP stdio runtime |

---

## Upgrade Existing Governance Pack

```bash
npx @ryuenn3123/agentic-senior-core upgrade --dry-run
npx @ryuenn3123/agentic-senior-core upgrade --yes
```

Use `--dry-run` first to preview changes safely, then apply with `--yes`.

---

## Terminology Mapping (Final)

| Canonical Enterprise Term | Developer-Facing Alias | Usage Rule |
|---------------------------|------------------------|------------|
| Federated Governance | Federated Rules Operations | Use canonical term in compliance/audit artifacts. |
| Governance Engine | Rules Engine | Use alias in onboarding and day-to-day developer docs. |
| Guardrails | Quality Checks | Use alias in implementation guidance and quickstart docs. |

Rule: on first mention in developer-facing docs, include canonical term in parentheses.

Full mapping reference: docs/terminology-mapping.md

---

## Reference Docs

- FAQ: docs/faq.md
- Deep dive internals: docs/deep-dive.md
- V2 upgrade playbook: docs/v2-upgrade-playbook.md
- Integration playbook: docs/integration-playbook.md
- Benchmark and stack reference: docs/benchmark-reference.md
- Terminology mapping reference: docs/terminology-mapping.md
- Product roadmap: docs/roadmap.md

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

1. Bump `package.json` version.
2. Add matching release notes in `CHANGELOG.md`.
3. Push to `main`.

Important notes:

- If the npm version already exists, publish fails.
- Publish requires valid `NPM_TOKEN` in repository secrets.

---

## License

MIT - Use freely, enforce strictly.
