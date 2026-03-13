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

### Option 1: Interactive CLI (Recommended)

```bash
bunx @fatidaprilian/agentic-senior-core init
```

The CLI asks:
1. What is your core stack?
2. Which blueprint do you want to scaffold?
3. Include CI/CD guardrails?

After answers are provided, the CLI runs the Dynamic Context Compiler and generates compiled governance files (`.cursorrules` and `.windsurfrules`) in your target project root.

### Option 2: Legacy Script (Compatibility Wrapper)

```bash
./scripts/init-project.sh /path/to/your/project
```

The script now forwards execution to the interactive CLI.

---

## Core Capabilities

- **Delivery Engine (CLI):** Interactive setup via `bunx`/`npx`.
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
│   ├── validate.ts                 # Repository validator
│   └── init-project.sh             # Legacy compatibility wrapper
├── package.json
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

## Validation

```bash
bun run validate
```

---

## Roadmap

### V1.0 — TypeScript Focus
- [x] Universal rule foundations
- [x] TypeScript stack profile
- [x] Next.js and NestJS blueprints
- [x] PR and security checklists
- [x] Multi-agent compatibility

### V1.1 (Complete) — Multi-Language
- [x] Python, Java, PHP, Go, and C# stacks/blueprints
- [x] Performance and architecture review checklists

### V1.2 (Complete) — Advanced Patterns
- [x] Microservices decision framework
- [x] Event-driven patterns
- [x] CI/CD pipeline blueprints
- [x] Database design patterns
- [x] Observability blueprint

### V1.3 (Complete) — System Extensions & Infrastructure
- [x] Rust and Ruby stacks
- [x] Realtime and frontend architecture rules
- [x] GraphQL/gRPC, IaC, and Kubernetes blueprints

### V1.4 (Complete) — Dynamic Governance Engine
- [x] EPIC 1: Delivery Engine (Interactive CLI)
- [x] EPIC 2: Dynamic Context Compiler
- [x] EPIC 3: Codebase Intelligence (`.agent-context/state/`)
- [x] EPIC 4: Override System (`.agent-override.md`)
- [x] EPIC 5: Automated Guardrails & LLM-as-a-Judge
- [x] EPIC 6: MCP & Self-Healing Loop (`mcp.json`)

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
