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
  - **Cache-Safety Invariant (why hooks never rewrite conversation history)**: Prompt-cache traffic dominates API cost (PointFive, arXiv:2607.12161), and any mutation of earlier conversation bytes invalidates the cache. Every ASC injection point is therefore append-only and deterministic (no timestamps, request IDs, or run-varying values injected into context): the rules file is injected verbatim at session start, reminders are appended late in context, and `ascx` appends its footer after command output. If a future feature ever needs to compress or rewrite context, it must follow the live-zone-only pattern (never touch the frozen prefix; see docs/GROUNDING.md, Headroom CacheAligner note). An opt-out A/B condition exists via `ASC_CACHE_SAFE=1` (see docs/CONFIGURATION.md).

---

## Grounded In

Every rule and skill workflow is derived from established engineering standards, not invented conventions.

| Domain | Standards |
|--------|-----------|
| Security & audit | OWASP Top 10 (2025), OWASP ASVS v5.0, CWE classification, CVSS report structure, OWASP Agentic Top 10 (ASI01-ASI10) |
| Code review | OWASP Risk Rating Methodology, Google Engineering Practices (Code Review Guide) |
| Architecture | Clean Architecture, Hexagonal Architecture, Google SRE System Design (Fail-fast invariants, fail-safe dependencies) |
| Workflows | RPI & QRSPI (Dex Horthy/HumanLayer), SDD (GitHub Spec Kit) |
| Refactoring | Fowler's Refactoring, Rule of Three, YAGNI (XP/Kent Beck) |
| Database | Fowler's Money Pattern, UTC timestamp convention, migration versioning |
| Accessibility & UI Feedback | WCAG 2.2 AA, W3C WAI-ARIA 1.2 / APG (Status & Alert live regions), Nielsen Norman Group UX Heuristics (#1 Visibility, #9 Error Recovery) |
| Resilience & Fallbacks | AWS Well-Architected Reliability Pillar (REL05-BP01 Hard/Soft dependencies & static fallbacks), Nygard's Release It!, Martin Fowler Circuit Breaker |
| Technical debt | Cunningham's debt metaphor (1992), Martin Fowler Technical Debt Taxonomy |
| Clone & Dedup | GitClear 2024 analysis (211M LOC), token-level clone detection via jscpd |
| Adaptive Preferences | TRACE (arXiv:2606.13174) correction mining, Khroma/Deezer cold-start preference elicitation |
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
