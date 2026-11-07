# Architecture & Philosophy

## How Skills & Hooks Work (Multi-Tier Architecture)

Agentic Senior Core operates on a two-tier architecture:

### 1. Instructional Layer (Universal — Works Across 23+ AI Tools)
- **Canonical Plugin Bundle**: Rules, skills, and hooks in `.agents/plugins/agentic-senior-core/` distribute across Google Antigravity, Claude Code, Cursor, Windsurf, Copilot, Codex, Kiro, Roo, OpenCode, Zed, Aider, and others.
- **7 Orthogonal Meta-Skills (< 150 lines per router)**:
  1. `/asc`: Architecture, codebase convention fingerprinting, debt tracking, skill authoring with subagent pressure-testing (`references/writing-skills.md`).
  2. `/asc-develop`: Engineering lifecycle, greenfield scaffolding, brownfield features, 1-hop execution plans (`references/execution-plans.md`), subagent orchestration (`references/subagent-orchestration.md`), and refactoring.
  3. `/asc-review`: Production PR reviews, deep vulnerability audits (OWASP / ASI), and token-level clone deduplication.
  4. `/asc-test`: 4-phase systematic root-cause debugging (`references/systematic-debugging.md`), Iron Law of TDD, verification gates, regression proofs, and Playwright E2E.
  5. `/asc-reference`: Backend architecture reference for REST/GraphQL APIs, database indexing/transactions/migrations, Docker/K8s configs, and service resilience.
  6. `/asc-ui`: Deterministic frontend engineering: anti-card-soup data-to-structure mapping (`references/data-to-structure.md`), 4-state contracts & WCAG 2.2 AA (`references/states-and-a11y.md`), token reuse, `min-h-dvh` mobile containment, and single-language microcopy.
  7. `/asc-pentest`: Authorized dynamic security verification: scope gates, Pentest Task Trees, multi-principal BOLA/IDOR matrices, and OWASP API Top 10 stateful fuzzing.
- **Dual Triggering**:
  - **Natural Language Triggering**: Host checks YAML `description` keyword triggers across English and Indonesian symptom phrases.
  - **Slash Command Triggering**: Explicit invocation via `/asc`, `/asc-develop`, `/asc-review`, `/asc-test`, `/asc-reference`, `/asc-ui`, or `/asc-pentest`.

### 2. Active Enforcement Layer (Deterministic Hooks)
- **Google Antigravity Lifecycle Hooks (`<plugin_root>/hooks.json`)**:
  - `SessionStart`: Injects the canonical rule into context.
  - `PreToolUse`: Intercepts package manifest edits and terminal commands, blocking unvetted dependencies and unauthorized git commits/pushes.
  - `PostInvocation`: Inspects transcript diffs to flag UI Card Soup ($\ge 3$ consecutive card grids without semantic tables/steppers) and warns when production code is modified during bug investigations without prior reproduction commands.
  - `Stop`: Blocks turn termination when source code was edited without a subsequent verification command.
- **Claude Code, Codex CLI, Copilot CLI Hooks (`hooks/hooks.json`)**:
  - Pre-tool dependency gates and post-tool advisory nudges for LOC deltas and duplicate code blocks (`jscpd`).
- **Universal Git Pre-Commit Hook**:
  - Installed via `asc global` or `asc adapter` (`~/.asc/global-hooks/pre-commit`), enforcing token-level clone checks and typed ESLint auto-fixes across all host environments.
- **Cache-Safety Invariant**:
  - Injections are append-only and deterministic to preserve LLM prompt caches (PointFive, arXiv:2607.12161). Hooks never rewrite earlier conversation turns.

---

## Grounded In

Every rule and skill workflow derives from established engineering literature:

| Domain | Standards & Citations |
|---|---|
| Security & Audit | OWASP Top 10 (2025), OWASP ASVS v5.0, CWE, CVSS, OWASP Agentic Top 10 (ASI01-ASI10) |
| Code Review | OWASP Risk Rating Methodology, Google Engineering Practices (Code Review Guide) |
| Architecture | Clean Architecture, Hexagonal Architecture, Google SRE System Design (Fail-fast invariants, fail-safe dependencies) |
| Workflows | Spec-Driven Development (SDD), RPI (HumanLayer) |
| Refactoring | Fowler's Refactoring, Rule of Three, YAGNI (Kent Beck) |
| Database | Fowler's Money Pattern, UTC timestamp convention, migration versioning |
| Accessibility & UI States | WCAG 2.2 AA, W3C WAI-ARIA 1.2 / APG, Nielsen Norman Group UX Heuristics (#1 Visibility, #9 Error Recovery) |
| UI/UX Engineering & Anti-Slop | Nielsen Norman Group (Microcopy & Scannability), Refactoring UI (Hierarchy & Spacing), Apple HIG & Google Material 3 (Action Semantics), W3C I18n / Localization Best Practices |
| Resilience & Fallbacks | AWS Well-Architected Reliability Pillar (REL05-BP01), Nygard's Release It!, Fowler's Circuit Breaker |
| Technical Debt | Cunningham's Debt Metaphor (1992), Fowler's Technical Debt Taxonomy |
| Clone & Dedup | GitClear Analysis (211M LOC), token-level clone detection via `jscpd` |
| Adaptive Preferences | TRACE (arXiv:2606.13174) correction mining, Khroma/Deezer cold-start preference elicitation |
| Instruction Design | Low instruction density for LLM compliance — IFScale (arXiv:2507.11538), OctoBench (arXiv:2601.10343, ACL 2026) |

---

## Migration from v4.x

Clean up legacy v4 artifacts (`.agent-context/`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`):

```bash
# Preview files to remove
asc clean --dry-run

# Execute cleanup
asc clean
```
