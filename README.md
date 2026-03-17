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
Click the **[Use this template]** button on the GitHub UI at the top right of this repository.
Your new repository will instantly possess all the rules, configurations, and AI context files directly out of the box — zero CLI needed.

### Option 1: Interactive Auto-Setup (Recommended)

If you have an existing project and want to infuse it with Staff-level context:

```bash
npx @fatidaprilian/agentic-senior-core init
```

The CLI is smart. It auto-detects your current development stack, helps you build a governance profile (select from `beginner`, `balanced`, or `strict`), and writes the compiled rules straight to your root automatically!

If you are totally new to concepts like blueprints and guardrails, no problem — just run:
```bash
npx @fatidaprilian/agentic-senior-core init --newbie
```

### Option 2: Clone and Play
Want to poke around under the hood? Just clone the repo and `npx @fatidaprilian/agentic-senior-core init` locally. No runtime dependencies needed — everything uses native Node.js!

---

## Further Reading

Our documentation has shifted into dedicated tracks to keep this README light:
- **[FAQ / Concepts](docs/faq.md)**: Unfamiliar with Stacks, Blueprints, or Guardrails? Stalled on basic logic? Start here.
- **[Deep Dive / Internals](docs/deep-dive.md)**: Explore the dynamic compiler, severity profiles, MCP integration, and granular LLM overrides here.

---

## Core Capabilities

- **Delivery Engine (CLI):** Interactive setup via `npx`.
- **Dynamic Context Compiler:** Merges universal rules + selected stack + selected blueprint + optional CI guardrails into one dense, indexed rule file.
- **Codebase Intelligence:** `.agent-context/state/` gives architecture/dependency boundaries so the agent understands high-risk areas.
- **Override System:** `.agent-override.md` allows controlled enterprise exceptions without forking core rules.
- **Automated Guardrails:** CI blueprints include LLM-as-a-Judge flow using `pr-checklist.md`.
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
│   └── init-project.sh             # Legacy compatibility wrapper
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

---

## Roadmap

### Completed Milestones
- V1.0 to V1.3: Core rules, multi-language stacks, advanced architecture patterns, and infrastructure blueprints.
- V1.4: Dynamic Governance Engine (interactive CLI, context compiler, state maps, override system, guardrails, MCP self-healing).
- V1.5: Newbie-First Experience (Node-first runtime, zero-install onboarding path, smart auto-detection, profile presets, LLM severity thresholds, docs split, smoke tests).

### V1.6 (Planned) — Enterprise Reliability and Team Workflow
- Team profile packs and safer override governance.
- CI annotation standardization and stronger detection accuracy.
- Upgrade assistant, benchmark coverage, and onboarding KPIs.

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
