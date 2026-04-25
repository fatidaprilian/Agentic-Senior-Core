<div align="center">

# Agentic-Senior-Core

### Force your AI Agent to code like a Staff Engineer, not a Junior.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Production-grade Rules Engine (Governance Engine) for AI coding agents.**
Works with Cursor, Windsurf, GitHub Copilot, Claude Code, Gemini, and other LLM-powered IDE workflows.

Latest release: 3.0.28 (2026-04-25).

Highlights in 3.0.28:
- Memory continuity now requires agents to refresh `.agent-context/state/active-memory.json` directly at completion boundaries when material project progress happened.
- Token optimization now exposes an output folding strategy that preserves failures, file/line details, and actionable warnings while folding repetitive shell noise.
- UI design guidance now treats expressive motion as a first-class default for modern interfaces instead of letting safety wording become an excuse for static screens.
- Agents must use live/current-year research for ecosystem, framework, dependency, Docker, and modern UI/library claims instead of offline repository guesses.
- Frontend guidance rejects safe dashboard/admin-panel defaults and requires responsive recomposition.

</div>

---


## 60-Second Start


```bash
npx @ryuenn3123/agentic-senior-core init
```

One command to initialize rules, checklists, and strict AI coding guidelines context for your project.

> **See [docs/deep-dive.md](docs/deep-dive.md) and [docs/roadmap.md](docs/roadmap.md) for advanced configuration, planning mode, snapshot, and realtime options.**

- This command writes `.agent-context/state/v3-purge-audit.json` and reports whether static directory deletion is safe.

---

## Design Direction

For UI, UX, layout, screen, Tailwind, frontend, or redesign work, the pack routes agents through the design bootstrap and frontend architecture rules before code changes.

The intended behavior is agent-led, not offline-template-led:

- Existing projects: read the real repository, docs, UI surface, and current user brief before changing design.
- Fresh projects: ask the LLM agent to recommend the stack and design approach from current evidence instead of silently choosing a hardcoded framework.
- No visual reference provided: synthesize one modern conceptual anchor first, then derive typography, spacing, morphology, motion, and responsive behavior from that anchor.
- Modern UI claims: research current-year libraries and patterns when relevant; 2026 work should use 2026 evidence, and future years should update automatically through agent research.
- Anti-generic rule: avoid safe dashboard shells, admin panels, card grids, scale-only mobile layouts, and static no-motion interfaces unless the product context explicitly justifies them.

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
| `agentic-senior-core init` | Initialize the project guidance pack and compiled AI rulebook |
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

Upgrade now performs managed-surface synchronization by default: obsolete governance files under managed paths are pruned so the pack stays aligned with the latest release.
Use `--no-prune` if you want to keep legacy managed files.

---

## Terminology Mapping (Final)

| Canonical Term | Developer-Facing Alias | Usage Rule |
|----------------|------------------------|------------|
| Federated Governance | Federated Rules Operations | Use canonical term in formal policy artifacts. |
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
