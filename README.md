<div align="center">

# Agentic-Senior-Core

### Force your AI Agent to code like a Staff Engineer, not a Junior.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Universal engineering standards for AI coding agents.**
Works with Cursor · Windsurf · GitHub Copilot · Claude Code · Gemini · Any LLM-powered IDE.

</div>

---

## What is This?

This is **not** a boilerplate. It's a **dynamic governance engine**: strict engineering rules, stack profiles, blueprints, review checklists, override policies, and state maps that keep AI output production-grade.

Think of it as giving your AI pair programmer **10 years of production experience** through carefully crafted instructions and guardrails.

### Before Agentic-Senior-Core
```text
You: "Build me a user registration API"
AI:  *Creates a single file with no validation, any types, console.log,
      hardcoded secrets, no error handling, and 47 TODO comments*
```

### After Agentic-Senior-Core
```text
You: "Build me a user registration API"
AI:  *Creates properly layered modules with Zod validation, typed errors,
      structured logging, security headers, tests, and API documentation*
```

---

## Quick Start

### Method 1 (Recommended): npm package

The npm package is already published. For most users, this is the default path.

**Step 1: Navigate to your project folder**
```bash
cd /path/to/your-project
```

**Step 2: Run initialization (does not require install)**

Use `npx` or `npm exec` — both download the package temporarily, run it in your project folder, then clean up automatically.

```bash
npx @ryuenn3123/agentic-senior-core init
# or
npm exec --yes @ryuenn3123/agentic-senior-core init
```

**Alternative: Global install (optional)**

If you want the tool available system-wide without repeating `npx`:

```bash
npm install -g @ryuenn3123/agentic-senior-core
# Then from any project folder:
agentic-senior-core init
```

| Approach | Installation | Where to Run | Use Case |
|----------|--------------|---|---|
| **npx (default)** | None — temporary download | Inside your project folder | Clearest workflow; no system pollution |
| **Global install** | System-wide | From anywhere | Convenience if using frequently across many projects |

> Note: Both approaches do the same thing: create `.cursorrules`, `.instructions.md`, `.agent-context/` **in your current project folder**. The only difference is convenience. Use `npx` if unsure — it's clearer and doesn't clutter your system.

**Use team defaults with profile packs:**

```bash
npx @ryuenn3123/agentic-senior-core init --profile-pack startup
```

### Method 2: GitHub template and source execution

Use this method if your team prefers source-based bootstrap or template-first onboarding.

GitHub template:
- **[Create from template](https://github.com/fatidaprilian/Agentic-Senior-Core/generate)**

GitHub source execution (interactive):

```bash
npm exec --yes --package=github:fatidaprilian/Agentic-Senior-Core agentic-senior-core init .
```

GitHub bootstrap scripts:
- Windows: `scripts/init-project.ps1`
- Linux/macOS: `scripts/init-project.sh`

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\init-project.ps1 -TargetDirectory . -Profile balanced -Stack typescript -Blueprint api-nextjs -Ci true
```

Linux/macOS Bash:

```bash
bash ./scripts/init-project.sh . --profile balanced --stack typescript --blueprint api-nextjs --ci true
```

### Preset starters

Use presets when you want faster onboarding with less manual selection.

```bash
npx @ryuenn3123/agentic-senior-core init --preset frontend-web
npx @ryuenn3123/agentic-senior-core init --preset backend-api
npx @ryuenn3123/agentic-senior-core init --preset mobile-react-native
npx @ryuenn3123/agentic-senior-core init --preset java-enterprise-api
npx @ryuenn3123/agentic-senior-core init --preset dotnet-enterprise-api
```

Expanded preset catalog:

- `frontend-web`, `backend-api`, `fullstack-product`, `platform-governance`
- `mobile-react-native`, `mobile-flutter`, `observability-platform`
- `typescript-nestjs-service`, `java-enterprise-api`, `dotnet-enterprise-api`, `php-laravel-api`, `kubernetes-platform`

### Newbie mode

If you are new to stacks, blueprints, and guardrails, run:

```bash
npx @ryuenn3123/agentic-senior-core init --newbie
```

### Important behavior

- `init` creates governance files **in your project folder** (the folder where you run the command).
- `init` does not copy repository workflows from this project into your target repository.
- MCP server registration and trust/start are manual in IDE settings.
- MCP workspace scaffold is opt-in via `--mcp-template` and creates `.vscode/mcp.json`.

**What files are created?**
```
your-project/
├── .cursorrules          (agent instructions for Cursor)
├── .windsurfrules        (agent instructions for Windsurf)
├── .instructions.md      (canonical governance and AI behavior policy)
├── .agent-context/       (blueprints, skills, rules, profiles, state maps)
└── .vscode/
    └── mcp.json          (only if --mcp-template is used)
```

### MCP Setup in VS Code (No File Picker)

If you are looking for a file picker in the MCP UI, that is expected because VS Code uses MCP server registration, not generic JSON file import.

1. Generate workspace MCP config:

```bash
npx @ryuenn3123/agentic-senior-core init --mcp-template
```

2. Open Command Palette and run `MCP: Open Workspace Folder Configuration`.
3. Confirm the file is `.vscode/mcp.json` with server `agentic-senior-core`.
4. The generated server command is `node ./scripts/mcp-server.mjs` with `cwd` set to `${workspaceFolder}`.
5. Open Chat Customizations > MCP Servers, then trust/start the server.

If logs repeatedly show `Waiting for server to respond to initialize request`, upgrade to the latest package version, regenerate the workspace config with `--mcp-template`, and restart the MCP server.

### CLI Command Reference

All available commands:

| Command | Purpose | Example |
|---------|---------|---------|
| `launch` | Numbered onboarding launcher | `agentic-senior-core launch` |
| `init` | Initialize governance in a project | `agentic-senior-core init . --profile balanced` |
| `upgrade` | Upgrade existing governance safely | `agentic-senior-core upgrade . --dry-run` |
| `optimize` | Manage token optimization profile | `agentic-senior-core optimize . --show` |
| `mcp` | Start local MCP stdio server runtime | `agentic-senior-core mcp` |
| `rollback` | Roll back from backup snapshot | `agentic-senior-core rollback .` |
| `skill` | Select domain skill pack by tier | `agentic-senior-core skill frontend --tier advance` |
| `--version` | Print CLI version | `agentic-senior-core --version` |

### Skill Selector

Use the unified skill selector to pick the right pack for a domain:

```bash
agentic-senior-core skill frontend --tier advance
agentic-senior-core skill backend --tier expert
agentic-senior-core skill fullstack --json
```

When you run `init`, the CLI now auto-activates the matching skill packs for the chosen stack and blueprint, so the compiled governance context includes the relevant frontend, backend, fullstack, and CLI guidance by default.

### Token Optimization Mode (Enabled by Default on Init)

Use this mode when your AI session is shell-heavy and context usage is high.
By default, every `init` flow enables token optimization automatically (npx, npm exec, global CLI, preset, and interactive wizard).
The optimization engine works in two modes:
- Native fallback mode (no external dependency required)
- External proxy mode (auto-detected when available)

Quick start:

```bash
agentic-senior-core optimize . --agent copilot --enable
agentic-senior-core optimize . --show
agentic-senior-core optimize . --disable

# Auto-enable during project initialization
npx @ryuenn3123/agentic-senior-core init --token-optimize --token-agent copilot

# Opt out when needed
npx @ryuenn3123/agentic-senior-core init --no-token-optimize
```

When enabled, the CLI writes `.agent-context/state/token-optimization.json`, regenerates compiled rules, and adds compact command guidance to `.cursorrules` and `.windsurfrules`.
If an external token proxy is available, the CLI prints setup hints. If not, native fallback guidance stays active, so outside users are not forced to install extra tooling.

### Token Efficiency Benchmark Snapshot

Latest local benchmark (2026-04-11) from `.agent-context/state/token-optimization-benchmark.json`:

| Scenario | Baseline Token Estimate | Agentic Native Token Estimate | Native Savings | RTK Token Estimate | RTK Status |
|----------|-------------------------|-------------------------------|----------------|--------------------|------------|
| Latest commit detail review | 3798 | 177 | 95.34% | 3798 | Detected (`rtk` v0.35.0) |
| Commit history review | 3730 | 889 | 76.17% | 1610 | Detected (`rtk` v0.35.0) |
| Search result scan | 5339 | 1099 | 79.42% | 5339 | Detected (`rtk` v0.35.0) |
| Average | - | - | 83.64% | 18.95% savings | Detected (`rtk` v0.35.0) |

Method note:
- Estimate formula is `ceil(output_chars / 4)`.
- This is a command-output estimate, not provider-specific tokenizer output.
- RTK results depend on host utilities. On Windows hosts without GNU `grep` or `ls`, RTK may fall back to `rtk git ...` paths for some scenarios.

Reproduce and refresh this table:

```bash
npm run benchmark:token
```

### Install and Setup Choices

The CLI now supports a smaller decision surface for first-time setup:

| Path | Best for |
|------|----------|
| `agentic-senior-core launch` | Numbered interactive chooser for install and preset paths |
| GitHub Template | Zero-install project bootstrap |
| npm exec / npx | One-off setup on an existing repo |
| npm install -g | Repeated local use from the shell |
| `--preset` | Fast bootstrap with a curated stack and blueprint |
| `optimize` | Optional token-aware shell output guidance with native fallback |

### Supported Stack Map

Use the stack that matches the project you are actually starting:

| Stack | Recommended Blueprint | Best Fit |
|-------|-----------------------|----------|
| TypeScript | api-nextjs | Web app, fullstack product, CLI tooling |
| Python | fastapi-service | API service, automation, data-heavy backend |
| Go | go-service | Small, fast services and platform tooling |
| Java | spring-boot-api | Enterprise APIs and service-oriented systems |
| PHP | laravel-api | Conventional product backends |
| C# | aspnet-api | Microsoft stack services and enterprise apps |
| Rust | go-service | Performance-sensitive backend work |
| Ruby | laravel-api | Mature product services and backend workflows |
| React Native | mobile-app | Cross-platform mobile applications |
| Flutter | mobile-app | Cross-platform mobile applications |

### Benchmark Comparison (Current State)

| Capability | antigravity-awesome-skills | awesome-copilot | MiniMax-AI/skills | Agentic-Senior-Core |
|------------|----------------------------|-----------------|-------------------|---------------------|
| Skill organization | Large curated library | Resource catalog + governance docs | Domain-focused packs | Unified folder-based domain packs with tier routing |
| Architecture guidance | Strong practical patterns | Strong SoC and layered architecture | Strong applied templates | Consolidated architecture + domain enforcement |
| CLI governance | Limited | Moderate | Moderate | Init/upgrade/output governance with dry-run and structured reports |
| Distribution operations | Basic | Moderate | Strong release checklists | Publish, rollback, compatibility gates plus benchmark/sbom flows |
| Review quality | Pattern-oriented | Checklist-oriented | Gate-oriented | Planning/security/benchmark review model with CI integration |

### Option 4: Clone and Play
Want to poke around under the hood? Just clone the repo and `npx @ryuenn3123/agentic-senior-core init` locally. No runtime dependencies needed — everything uses native Node.js!

### Upgrade Existing Governance Packs (V1.x to V2.x)

Yes, the upgrade flow still works. Use `--dry-run` first to preview changes, then apply with `--yes` when you are ready.

Preview migration changes safely:

```bash
npx @ryuenn3123/agentic-senior-core upgrade --dry-run
```

Apply migration updates:

```bash
npx @ryuenn3123/agentic-senior-core upgrade --yes
```

---

## Further Reading

Our documentation has shifted into dedicated tracks to keep this README light:
- **[FAQ / Concepts](docs/faq.md)**: Unfamiliar with Stacks, Blueprints, or Guardrails? Stalled on basic logic? Start here.
- **[Deep Dive / Internals](docs/deep-dive.md)**: Explore the dynamic compiler, severity profiles, MCP integration, and granular LLM overrides here.
- **[V2 Upgrade Playbook](docs/v2-upgrade-playbook.md)**: Benchmark-driven upgrade execution from antigravity-awesome-skills, awesome-copilot, and MiniMax skills.
- **[Skill Platform](.agent-context/skills/README.md)**: Unified skill packs for frontend, backend, fullstack, CLI, distribution, and review quality with `advance` as the default tier.
      The skill platform is now folder-based, so each domain has its own README and topic docs like a curated skills library.

---

## Core Capabilities

- **Delivery Engine (CLI):** Interactive setup via GitHub source, bootstrap scripts, or `npx` after publish. Supported by a robust transactional installer with rollback protection.
- **Verified Skill Marketplace:** Distribute and validate plugins securely with automated 4-dimension Trust Scoring and Evidence Bundles constraint validation.
- **Dynamic Context Compiler:** Merges universal rules + selected stack + selected blueprint + optional CI guardrails into one dense, indexed rule file.
- **Codebase Intelligence:** `.agent-context/state/` gives architecture/dependency boundaries so the agent understands high-risk areas.
- **Override System:** `.agent-override.md` allows controlled enterprise exceptions without forking core rules.
- **Automated Guardrails:** CI blueprints include LLM-as-a-Judge flow using `pr-checklist.md`.
- **Pre-Publish Safety:** Built-in forbidden content checks detect hardcoded secrets and stray debugger artifacts before hitting the NPM registry.
- **Machine-Readable CI Output:** LLM Judge emits `JSON_REPORT` payloads and writes `.agent-context/state/llm-judge-report.json` for PR/MR annotation tooling.
- **MCP Runtime Server:** `scripts/mcp-server.mjs` exposes validate/test/release checks as MCP tools.
- **MCP Registration Model:** IDE MCP server registration is manual; workspace config lives in `.vscode/mcp.json` (`--mcp-template`).

---

## Repository Structure

```text
.
├── .cursorrules                    # Dynamic compiled governance entry point
├── .windsurfrules                  # Dynamic compiled governance entry point
├── .agent-override.md              # Team-specific exceptions (scoped + expiry)
├── mcp.json                        # Governance metadata and knowledge-layer contract
├── .vscode/
│   └── mcp.json                    # VS Code MCP workspace server configuration
├── AGENTS.md                       # Universal agent discovery
├── .github/copilot-instructions.md # GitHub Copilot entry point
├── .gemini/instructions.md         # Antigravity / Gemini entry point
├── bin/
│   └── agentic-senior-core.js      # Interactive CLI (Delivery Engine)
├── .agent-context/
│   ├── rules/                      # Universal engineering laws
│   ├── stacks/                     # Language-specific profiles
│   ├── blueprints/                 # Scaffolding and pipeline templates
│   ├── review-checklists/          # AI self-audit guides
│   ├── prompts/                    # Ready-to-use prompts
│   └── state/                      # Architecture and dependency state maps
│       ├── architecture-map.md
│       └── dependency-map.md
├── scripts/
│   ├── validate.mjs                # Repository validator
│   ├── llm-judge.mjs               # LLM-as-a-Judge CI gate
│   ├── mcp-server.mjs              # Local MCP stdio server (validate/test/release tools)
│   ├── init-project.sh             # GitHub bootstrap script (Linux/macOS)
│   └── init-project.ps1            # GitHub bootstrap script (Windows)
├── docs/
│   ├── faq.md
│   └── deep-dive.md
├── tests/
│   ├── cli-smoke.test.mjs
│   └── llm-judge.test.mjs
├── package.json
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

## Validation

Ensure everything is running smoothly before merging rules patches:

```bash
npm run validate
```

Track stack-detection KPI trends:

```bash
npm run benchmark:detection
```

Generate governance observability artifacts:

```bash
npm run report:quality-trend
npm run report:governance-weekly
```

## Release and npm Publish Flow

This repository publishes to npm automatically through GitHub Actions on every push to `main`.

Release checklist:
1. Bump `package.json` version.
2. Add matching release notes in `CHANGELOG.md`.
3. Push to `main`.

Important notes for maintainers and forks:
- If the npm version already exists, publish will fail.
- Publish requires valid `NPM_TOKEN` in repository secrets.

---

## Roadmap

### Completed Milestones
- V1.0 to V1.3: Core rules, multi-language stacks, advanced architecture patterns, and infrastructure blueprints.
- V1.4: Dynamic Governance Engine (interactive CLI, context compiler, state maps, override system, guardrails, MCP self-healing).
- V1.5: Newbie-First Experience (Node-first runtime, zero-install onboarding path, smart auto-detection, profile presets, LLM severity thresholds, docs split, smoke tests).

### V1.6 (Released) — Enterprise Reliability and Team Workflow
- Team profile packs and safer override governance shipped.
- CI annotation standardization and stronger detection transparency shipped.
- Upgrade assistant and benchmark coverage shipped.

### V1.7 (Released) — Frontend Product Experience Governance Pack
- Frontend usability checklist, execution playbook, and issue template shipped.
- Frontend usability audit script and CI artifact workflow shipped.

### V1.8 (Released) — Enterprise Release Operations and Compliance
- Release-gate automation shipped with machine-readable artifact output.
- CycloneDX SBOM generation and compliance artifact workflow shipped.
- Operations playbook and release-operations checklist shipped.

### Current Forward Plan
- V2.0: Skill marketplace trust tiers, transactional installs, rollback safety, and launch-menu onboarding.
- V2.5: Cross-model benchmark harness, anti-regression quality gates, and advanced frontend design quality track (non-template UI direction, stronger UX craft, and frontend parity beyond baseline benchmark repos).
- V3.0: Enterprise governance cloud, policy drift detection, and org-level override registry.

Detailed timeline and success metrics: [docs/roadmap.md](docs/roadmap.md)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution standards and workflow.

---

## License

MIT — Use freely, enforce strictly.

---

<div align="center">

**Stop letting AI write junior code.**
**Give it the rules of a Staff Engineer.**

</div>
