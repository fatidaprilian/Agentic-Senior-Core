---
name: asc
description: >
  Trigger this skill when the user asks: "what are the rules", "coding guidelines", "best practices", "how should I write this", "staff engineer approach", "map this codebase", "document our patterns", "fingerprint this repository", "learn my preferences", "bootstrap preferences", "log this debt", "add to debt ledger", "install ASC", "configure for Cursor", "set up adapter", "apa aturannya", "panduan koding", "petakan codebase", "pasang asc". Covers Core Overview, Codebase Fingerprinting, Adaptive Preferences, Debt Tracking, and IDE Adapters.
---

# Agentic Senior Core: Architecture & Meta-Tools (`asc`)

Universal AI coding rules and meta-tooling playbook. Grounded in Google Engineering Practices, OWASP, and USENIX Security.

---

## 1. The 5 Core Meta-Skills Architecture

Agentic Senior Core organizes operational guidance into 5 high-density, non-overlapping playbooks:

1. **`/asc` (This Skill)**: Core engineering rules, codebase convention fingerprinting, adaptive preferences, debt tracking, and IDE adapter setup.
2. **`/asc-develop`**: Engineering lifecycle for greenfield scaffolding, brownfield feature implementation, and structured refactoring.
3. **`/asc-review`**: Quality and security assurance: production PR reviews, deep vulnerability audits (OWASP / ASI), and code clone deduplication.
4. **`/asc-reference`**: Domain architecture reference for REST/GraphQL APIs, database queries/migrations, testing contracts, infrastructure, and resilience.
5. **`/asc-ui`**: Human-interface engineering: UI visuals, UX microcopy hygiene, strict single-language localization, mobile reflow (`dvh`/`clamp`), and WCAG 2.2 AA accessibility.

---

## 2. Repository Fingerprinting

Extract this repository's architectural and procedural conventions before undertaking major changes. The goal is evidence-backed alignment with this codebase.

### Procedure
1. **Map Runtime & Stack**: Inspect package manifests, test runners, and deployment configs.
2. **Analogous Modules**: Locate at least 2 existing modules. Record their layer splits, naming conventions, validation schemas, error handling, and notification patterns.
3. **Evidence-Backed Conventions**: Report only falsifiable findings with file and line references. Separate observations from proposals.
4. **Project Conventions File**: When approved by the user, record project-specific conventions in `CONVENTIONS.md` at the project root. Never overwrite universal ASC rules.

---

## 3. Adaptive Preferences & Baseline Onboarding

Customize AI coding behavior and design preferences dynamically.

### Workflow
- **Elicit Baseline Preferences**: Use `asc bootstrap` to select design slop patterns to ban (e.g. generic gradients, unlinked Inter font, stripped focus rings).
- **Learn from Corrections**: When a user corrects a styling or architectural choice (e.g. *"never use modals for multi-step flows"*, *"always use date-fns"*), log the rule into `.agents/adaptive_preferences.json` via `addRule()`.
- **Enforcement**: Project preferences are automatically consulted during code generation and compiled into local git hooks.

---

## 4. Technical Debt Ledger

Track deferred quality violations and temporary stubs systematically.

### Ledger Standards
- When an ASC nudge or quality violation is deferred with user consent, tag the stub in code:
  `// ASC-STUB: [reason] [ASC-DEBT-xxx]`
- Record the item in `.agents/debt-ledger.json` with timestamp, file location, severity, and planned remediation.
- Never let temporary mocks or hardcoded values silently masquerade as completed production integrations.

---

## 5. Host Adapters & Setup

Synchronize ASC rules and skills across all installed AI coding tools.

### Supported Tools
- **Native Plugin Hosts (Zero setup)**: Antigravity, Claude Code, Codex CLI, Copilot CLI, OpenCode, Kilo Code.
- **Adapter Hosts (Single file in project)**: Cursor (`.cursor/rules/agentic-senior-core.mdc`), Windsurf/Devin (`.devin/rules/`), Cline, Continue, Zed, Aider.

### CLI Utility Commands
```bash
asc status          # Detect installed AI coding tools
asc global --all    # Install global rules and smart git hook dispatcher
asc adapter --all   # Generate workspace adapters for all detected IDEs
asc adapter --cursor # Generate adapter specifically for Cursor
asc uninstall       # Clean up adapter files and hooks
```
