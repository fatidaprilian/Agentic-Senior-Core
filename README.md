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

### Zero-Install: GitHub Template (New user friendly!)

The absolute fastest way to start your next top-tier project is to use this repository as a template.
The **Use this template** button is in the GitHub repository header (top-right area), not inside this README text.
If you prefer a direct link, open: **[Create from template](https://github.com/fatidaprilian/Agentic-Senior-Core/generate)**.
Your new repository will instantly possess all the rules, configurations, and AI context files directly out of the box — zero CLI needed.

### Option 1: Interactive via GitHub Source (Pre-publish friendly)

If npm package publication is not ready yet, run the CLI directly from GitHub and still keep the full interactive experience.

```bash
npm exec --yes --package=github:fatidaprilian/Agentic-Senior-Core agentic-senior-core init .
```

This gives the same interactive prompts to choose your profile (`beginner`, `balanced`, `strict`), stack, blueprint, and CI guardrails.

### Option 2: GitHub Bootstrap Scripts (No npx required)

Run directly from this repository bootstrap script and inject rules into your project root.

Bootstrap script paths: `scripts/init-project.ps1` (Windows) and `scripts/init-project.sh` (Linux/macOS).

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\init-project.ps1 -TargetDirectory . -Profile balanced -Stack typescript -Blueprint api-nextjs -Ci true
```

Linux/macOS Bash:

```bash
bash ./scripts/init-project.sh . --profile balanced --stack typescript --blueprint api-nextjs --ci true
```

Both scripts clone Agentic-Senior-Core into a temporary directory, run the same CLI engine, then clean up automatically.

If you want interactive selection, omit `-Profile`, `-Stack`, `-Blueprint`, and `-Ci` on the script command.

### Option 3: Interactive Auto-Setup via npm/npx (Post-publish)

If you have an existing project and want to infuse it with Staff-level context:

```bash
npx @fatidaprilian/agentic-senior-core init
```

Use team defaults (V1.6 track) with profile packs:

```bash
npx @fatidaprilian/agentic-senior-core init --profile-pack startup
```

The CLI is smart. It auto-detects your current development stack, helps you build a governance profile (select from `beginner`, `balanced`, or `strict`), and writes the compiled rules straight to your root automatically!

If you are totally new to concepts like blueprints and guardrails, no problem — just run:
```bash
npx @fatidaprilian/agentic-senior-core init --newbie
```

### Skill Selector

Use the unified skill selector to pick the right pack for a domain:

```bash
agentic-senior-core skill frontend --tier advance
agentic-senior-core skill backend --tier expert
agentic-senior-core skill fullstack --json
```

When you run `init`, the CLI now auto-activates the matching skill packs for the chosen stack and blueprint, so the compiled governance context includes the relevant frontend, backend, fullstack, and CLI guidance by default.

### Option 4: Clone and Play
Want to poke around under the hood? Just clone the repo and `npx @fatidaprilian/agentic-senior-core init` locally. No runtime dependencies needed — everything uses native Node.js!

### Upgrade Existing Governance Packs (V1.6)

Preview migration changes safely:

```bash
npx @fatidaprilian/agentic-senior-core upgrade --dry-run
```

Apply migration updates:

```bash
npx @fatidaprilian/agentic-senior-core upgrade --yes
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

- **Delivery Engine (CLI):** Interactive setup via GitHub source, bootstrap scripts, or `npx` after publish.
- **Dynamic Context Compiler:** Merges universal rules + selected stack + selected blueprint + optional CI guardrails into one dense, indexed rule file.
- **Codebase Intelligence:** `.agent-context/state/` gives architecture/dependency boundaries so the agent understands high-risk areas.
- **Override System:** `.agent-override.md` allows controlled enterprise exceptions without forking core rules.
- **Automated Guardrails:** CI blueprints include LLM-as-a-Judge flow using `pr-checklist.md`.
- **Machine-Readable CI Output:** LLM Judge emits `JSON_REPORT` payloads and writes `.agent-context/state/llm-judge-report.json` for PR/MR annotation tooling.
- **MCP Self-Healing Loop:** `mcp.json` defines diagnostics + fix proposal workflow when lint/CI fails.

---

## Repository Structure

```text
.
├── .cursorrules                    # Dynamic compiled governance entry point
├── .windsurfrules                  # Dynamic compiled governance entry point
├── .agent-override.md              # Team-specific exceptions (scoped + expiry)
├── mcp.json                        # MCP self-healing workflow config
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
