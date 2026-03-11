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

This is **not** a boilerplate. It's a **knowledge base** — a set of strict engineering rules, blueprints, and checklists that AI agents read to produce **production-grade code** instead of "just make it work" code.

Think of it as giving your AI pair programmer **10 years of production experience** through carefully crafted instructions.

### Before Agentic-Senior-Core
```
You: "Build me a user registration API"
AI:  *Creates a single file with no validation, any types, console.log,
      hardcoded secrets, no error handling, and 47 TODO comments*
```

### After Agentic-Senior-Core
```
You: "Build me a user registration API"
AI:  *Creates properly layered modules with Zod validation, typed errors,
      structured logging, security headers, tests, and API documentation*
```

---

## Quick Start

### Option 1: One-Liner (Recommended)

```bash
curl -sSL https://raw.githubusercontent.com/fatidaprilian/Agentic-Senior-Core/main/scripts/init-project.sh | bash -s -- .
```

### Option 2: Clone and Copy

```bash
git clone https://github.com/fatidaprilian/Agentic-Senior-Core.git
./Agentic-Senior-Core/scripts/init-project.sh /path/to/your/project
```

> **Manual alternative:** Copy `.agent-context/` and the entry point files (`.cursorrules`, `AGENTS.md`, etc.) directly into your project root.

### First Command to Your Agent

```
I want to build [PROJECT NAME].

Scan .agent-context/ to understand our engineering standards.
Create the initial project structure based on blueprints/api-nextjs.md.
```

---

## Repository Structure

```
.
├── .cursorrules                    # Cursor AI entry point
├── .windsurfrules                  # Windsurf entry point
├── AGENTS.md                       # Universal agent discovery
├── .github/copilot-instructions.md # GitHub Copilot entry point
├── .gemini/instructions.md         # Antigravity / Gemini entry point
├── .agents/workflows/              # Antigravity workflow definitions
│   ├── init-project.md             # /init-project slash command
│   ├── review-code.md              # /review-code slash command
│   └── refactor.md                 # /refactor slash command
│
├── .agent-context/                 # The Knowledge Base
│   ├── rules/                      # Universal engineering laws
│   │   ├── naming-conv.md          # Clean naming (no more x, data, temp)
│   │   ├── architecture.md         # Layer separation & module structure
│   │   ├── security.md             # Trust nothing, validate everything
│   │   ├── performance.md          # N+1 death penalty, measure first
│   │   ├── error-handling.md       # Never swallow, always context
│   │   ├── testing.md              # Test pyramid, AAA, factories
│   │   ├── git-workflow.md         # Conventional Commits, atomic PRs
│   │   ├── efficiency-vs-hype.md   # Stable > trendy, justify deps
│   │   └── api-docs.md             # OpenAPI mandatory, zero-doc death penalty
│   │
│   ├── stacks/                     # Language-specific profiles
│   │   └── typescript.md           # Strict TS: no any, Zod, ESM
│   │
│   ├── blueprints/                 # Project scaffolding templates
│   │   ├── api-nextjs.md           # Next.js App Router API
│   │   └── nestjs-logic.md         # NestJS module structure
│   │
│   ├── review-checklists/          # AI self-audit guides
│   │   ├── pr-checklist.md         # 10-category quality gate
│   │   └── security-audit.md       # OWASP-aligned security review
│   │
│   └── prompts/                    # Ready-to-use power prompts
│       ├── init-project.md         # Scaffold a new project
│       ├── review-code.md          # Trigger self-review
│       └── refactor.md             # Refactor to follow rules
│
├── scripts/
│   ├── validate.ts                 # Bun-powered repo validator
│   └── init-project.sh             # Copy rules into a new project
│
├── package.json                    # npm/npx support
├── CONTRIBUTING.md                 # How to contribute
├── LICENSE                         # MIT
└── README.md                       # You are here
```

---

## Key Features

### The Reasoning Clause
Every time the agent corrects your code, it **must explain why**:
```
REASONING CHAIN
================
Rule Violated: security.md > Injection Prevention
Problem:       User input is interpolated into SQL query — SQL injection risk
Solution:      Use parameterized query with $1 placeholder
Why Better:    Parameterized queries are immune to SQL injection by design
```

The AI doesn't just fix your code — it **teaches you**.

### "Galak" Rules (Opinionated & Strict)
These aren't gentle suggestions. They're **enforceable standards**:

| Rule | Stance |
|------|--------|
| `naming-conv.md` | Single-letter variables? **BANNED.** |
| `architecture.md` | SQL in controller? **Architecture is broken.** |
| `security.md` | Hardcoded secrets? **INSTANT REJECTION.** |
| `performance.md` | N+1 queries? **Death penalty.** |
| `error-handling.md` | Empty catch block? **Fireable offense.** |
| `efficiency-vs-hype.md` | 50KB library for 5 lines of code? **REJECTED.** |
| `api-docs.md` | Endpoint without OpenAPI spec? **Doesn't exist.** |

### Multi-Agent Compatible
One knowledge base, works everywhere:

| Agent | Discovery File |
|-------|---------------|
| Cursor AI | `.cursorrules` |
| Windsurf | `.windsurfrules` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Antigravity (Google) | `.gemini/instructions.md` + `.agents/workflows/` |
| Claude Code / Gemini | `AGENTS.md` |

### Blueprints, Not Boilerplate
Blueprints are **instructions**, not code files. The AI reads the blueprint and generates fresh, up-to-date code following the latest patterns — not a stale template from 2 years ago.

---

## The "Vibe Coding" Workflow

```
Step 1: Clone & Open
  git clone → copy into your project → open in Cursor/Windsurf

Step 2: The Initiation Prompt
  "Build [Project]. Scan .agent-context/ and scaffold from blueprints/api-nextjs.md"

Step 3: Agent Builds Like a Pro
  Proper layers, Zod validation, typed errors, structured logging, tests

Step 4: Self-Correction
  "Run review based on review-checklists/pr-checklist.md"
  Agent audits and fixes its own code

Step 5: Ship It
```

---

## Validation

```bash
bun scripts/validate.ts
```

---

## Roadmap

### V1.0 — TypeScript Focus
- [x] 9 universal rule files (including api-docs)
- [x] TypeScript stack profile
- [x] Next.js & NestJS blueprints
- [x] PR & security checklists
- [x] Multi-agent compatibility (Cursor, Windsurf, Copilot, Antigravity, Claude Code)

### V1.1 (Current) — Multi-Language
- [x] Python stack + FastAPI blueprint
- [x] Java stack + Spring Boot blueprint
- [x] PHP stack + Laravel blueprint
- [x] Go stack profile
- [x] C#/.NET stack profile
- [x] Performance & architecture review checklists

### V1.2 (Planned) — Advanced Patterns
- [ ] Microservices decision framework (when to split, how to split)
- [ ] Event-driven architecture patterns (pub/sub, CQRS, event sourcing)
- [ ] CI/CD pipeline blueprints (GitHub Actions, GitLab CI)
- [ ] Database design patterns (normalization rules, indexing strategy)
- [ ] Observability blueprint (metrics, tracing, alerting)
- [ ] Go blueprint (chi/stdlib HTTP service)
- [ ] C# blueprint (ASP.NET Minimal API service)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines. The short version:

1. Fork the repo
2. Add your rule/stack/blueprint — must pass the **"galak" test** (opinionated, specific, enforceable)
3. Run `bun scripts/validate.ts` to verify
4. Open a PR

If a rule can't make an AI agent argue with a developer, it's not strict enough.

---

## License

MIT — Use freely, enforce strictly.

---

<div align="center">

**Stop letting AI write junior code.**
**Give it the rules of a Staff Engineer.**

</div>
