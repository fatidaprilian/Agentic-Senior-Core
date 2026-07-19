# Changelog

## 5.8.0

### Added
- **Workflow skills**: `/asc-new-project` (greenfield: Define → Spec → Implement → Validate), `/asc-add-feature` (brownfield: Research → Plan → Implement). Both use explicit phase gates with human approval checkpoints.
- **Workflow gate enforcement**: PostToolUse hook checks `workflow-gate.json` state — nudges the agent if source/config files are edited during research or plan phases. 4-hour staleness auto-clear for abandoned sessions. Enforcement is advisory (nudges, not hard blocks); bypasses are logged to the debt ledger.
- **Refactor upgrade**: `/asc-refactor` now includes YAGNI scan as a pre-step and complexity classification gate (low-level → proceed, high-level → stop for approval). Grounded in empirical evidence (arXiv, 15k+ instance study on agent refactoring patterns).
- Commands: `asc-new-project.md`, `asc-new-project.toml`, `asc-add-feature.md`, `asc-add-feature.toml`
- Architecture docs: workflow gate enforcement, scaffolding-spec design decision, `post-edit-enforce.js` in file structure

### Changed
- `hooks/post-edit-enforce.js`: added `fs` import, `checkWorkflowGate` function, staleness handling. Gate check fires for all file types except `.md`.
- `skills/asc/SKILL.md` (both locations): enforcement section updated to include workflow gate checks and explicit "advisory, not hard blocks" language.
- `skills/asc-refactor/SKILL.md` (both locations): added YAGNI scan, classify-before-proceeding, known-limitation disclosure. Before Editing steps renumbered (3→5). All original content preserved.
- `commands/asc-help.md` and `.toml`: added new commands to listing.
- `README.md`: commands table, "Grounded In" table (added QRSPI/SDD).

### Grounding
- RPI & QRSPI (Dex Horthy/HumanLayer, Coding Agents Conference March 2026)
- Spec-Driven Development (GitHub Spec Kit)
- Agent refactoring patterns (arXiv empirical study, 15k+ instances)
- Agentic Engineering vs Vibe Coding (Wendell Adriel, Andrej Karpathy)

## 5.7.0

- `feat: add asc global command for user-level rules install`

## 5.6.0

- `chore: benchmark tasks and results`

## 5.5.0

- `feat: enforcement loop, debt ledger, benchmark runner, negative instruction audit`

## 5.4.0

- `feat: merge minimalism rules, evidence-based prompt optimization`

## 5.3.0

- `feat: expand to 23+ hosts, add uninstall command, adapter skill`

## 5.2.0

- `feat: Antigravity proper format, clean command, upgrade docs`

## 5.1.0

- `feat: universal plugin system with 16+ host support`
