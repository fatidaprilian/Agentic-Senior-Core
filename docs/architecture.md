# Architecture & Philosophy

## How Skills & Hooks Work (Multi-Tier Architecture)

Agentic Senior Core operates on a two-tier architecture:

1. **Instructional Layer (Universal — Works in 23+ AI Tools)**:
   - **Rules, skills, and hooks in `.agents/plugins/agentic-senior-core/`** are the canonical bundle and work across **Google Antigravity IDE, Claude Code, Cursor, Windsurf, Copilot, Codex, Kiro, Roo, OpenCode, Zed, Aider, etc.**.
   - **Automatic Skill Triggering**: Agents attempt to detect and load skills if your prompt matches the skill's description (e.g., asking "perform a security audit" loads `asc-audit`).
   - **Manual Skill Triggering (Highly Recommended)**: Explicitly call skills using commands like `/asc-refactor` or `/asc-new-project` for guaranteed execution.

2. **Active Enforcement Layer (Hooks — Host-Specific Hard Guardrails)**:
   - **Hard-Block Guardrails**: For tools supporting active hook execution engines (Claude Code, GitHub Copilot CLI, Google Antigravity IDE, Cursor), ASC automatically intercepts tool calls:
     - **PreToolUse Hard Block**: Immediately rejects edits adding stdlib-duplicating dependencies (e.g., `lodash`, `moment`, `uuid`) before execution (`permissionDecision: "deny"`). Escape hatch available via `.asc/dependency-allowlist.json`.
     - **PostToolUse Advisory**: Soft nudges for LOC deltas, duplicate code blocks (jscpd), spec drift, and workflow gate bypasses.

---

## Grounded In

Every rule and skill workflow is derived from established engineering standards, not invented conventions.

| Domain | Standards |
|--------|-----------|
| Security & audit | OWASP Top 10 (2025), OWASP ASVS v5.0, CWE classification, CVSS report structure |
| Code review | OWASP Risk Rating Methodology, Google Engineering Practices |
| Architecture | Clean Architecture, Hexagonal Architecture |
| Workflows | RPI & QRSPI (Dex Horthy/HumanLayer), SDD (GitHub Spec Kit) |
| Refactoring | Fowler's Refactoring, Rule of Three, YAGNI (XP/Kent Beck) |
| Database | Fowler's Money Pattern, UTC timestamp convention, migration versioning |
| Accessibility | WCAG 2.2 AA |
| Resilience | Nygard's Release It!, AWS Well-Architected Reliability Pillar |
| Technical debt | Cunningham's debt metaphor (1992) |
| Instruction design | Low instruction density for higher LLM compliance — supported by IFScale (arXiv:2507.11538). Scaffold-rule compliance gaps measured by OctoBench (arXiv:2601.10343, ACL 2026) |

The decision ladder (check before building) and debt ledger format are ASC-specific implementations grounded in these principles.

---

## Migration from v4.x

v5.0 was a breaking change. The per-project system (`.agent-context/`, bridge files, project scaffolding) is replaced by the universal plugin system.

Clean up v4 artifacts from any project:
```bash
# Preview what will be removed
asc clean --dry-run

# Remove v4 files (.agent-context/, AGENTS.md, CLAUDE.md, GEMINI.md, etc.)
asc clean
```

This removes `.agent-context/`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and other v4 bridge files from the current project directory. The global plugin replaces all of them.
