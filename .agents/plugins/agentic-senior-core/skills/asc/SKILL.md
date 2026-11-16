---
name: asc
description: >
  Trigger this skill when the user asks: "what are the rules", "coding guidelines", "best practices", "how should I write this", "staff engineer approach", "map this codebase", "document our patterns", "fingerprint this repository", "learn my preferences", "bootstrap preferences", "log this debt", "add to debt ledger", "install ASC", "configure for Cursor", "set up adapter", "apa aturannya", "panduan koding", "petakan codebase", "pasang asc".
---

# Agentic Senior Core: Repository Meta-Tools (`asc`)

Codebase convention fingerprinting, adaptive preferences, technical debt tracking, skill authoring, and host adapter synchronization. Grounded in Google Engineering Practices, OWASP, and USENIX Security.

---

## 1. The 7 Core Skills Architecture

Agentic Senior Core organizes operational guidance into 7 focused, non-overlapping playbooks:

1. **`/asc` (This Skill)**: Core rules, repository convention fingerprinting, adaptive preferences, debt ledger, skill pressure testing, and host adapter setup.
2. **`/asc-develop`**: Greenfield scaffolding, brownfield feature execution (`Ruling:` protocol), subagent orchestration, and structured refactoring.
3. **`/asc-review`**: Clean code review, complexity/resource/DTO enforcement, Conventional Comments PR evaluation, OWASP audits, and clone checks.
4. **`/asc-test`**: Systematic root-cause debugging, TDD, verification gates, Playwright E2E, UAT checklists, regression proofs, and flaky test remediation.
5. **`/asc-reference`**: Backend architecture guidance for REST/GraphQL APIs, SQL indexing/transactions/migrations, container configs, and network resilience.
6. **`/asc-ui`**: Semantic frontend engineering, layout shell/action boundaries, token/primitive reuse, 4-state data contracts, mobile touch targets, and WCAG 2.2 accessibility.
7. **`/asc-pentest`**: Authorized dynamic security verification: scope gates, Pentest Task Trees, multi-principal BOLA/IDOR matrices, and OWASP API Top 10 stateful fuzzing.

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
asc global          # Auto-detect installed AI tools and sync global rules/skills/hooks
asc global --all    # Force-install global rules for all supported hosts
asc adapter --all   # Generate workspace adapters for all detected IDEs
asc dedup           # Scan codebase for Rule-of-Three structural/token clones
asc bootstrap       # Configure project UI/architecture baseline bans (.agents/adaptive_preferences.json)
asc preview <html/> # Open static HTML mockup or capture headless browser screenshot
asc uninstall       # Clean up adapter files and hooks
```

---

## 6. On-Demand Reference Library

> [!IMPORTANT]
> **Reference Path Resolution:**
> Reference files do NOT reside in the user workspace root. They are located adjacent to this `SKILL.md` file:
> `<skill_directory>/references/<file>.md`
> Prepend this skill's directory path when calling `read_file`.

When authoring, refactoring, or tailoring skills, you MUST call `read_file` on `references/writing-skills.md` before generating skill files:

| Topic / Requirement | Mandatory Reference Path |
|---|---|
| Authoring skills, trigger descriptions & 150-line routers | `references/writing-skills.md` |
