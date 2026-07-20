# Changelog

## 5.8.7

### Fixed
- **Double Rules in Antigravity IDE**: Prevented `asc global` from injecting rules into `~/.gemini/GEMINI.md`. Since the plugin is now correctly installed in `config/plugins/agentic-senior-core/`, Antigravity IDE natively auto-loads the `rules/agentic-senior-core.md` from inside the plugin bundle. Injecting into `GEMINI.md` caused the rules to be loaded twice, doubling the context token usage from 1,250 to 2,500. `asc global` will now clean up the old injected rules from `GEMINI.md` if they exist.

## 5.8.6

### Fixed
- **Reverted Antigravity IDE plugin path to `config/plugins`**: The IDE's official path for user-installed plugins is indeed `~/.gemini/config/plugins/<name>/`. The `antigravity-ide/plugins/` path is exclusively for Google's bundled first-party plugins (like SecureCoder). The installation script has been corrected to use `config/plugins/` again.
- Auto-cleanup of the mistaken `antigravity-ide/plugins/agentic-senior-core` path from v5.8.4.

## 5.8.5

### Fixed
- **Skills not appearing in Antigravity IDE mentions**: Added standard YAML frontmatter (`name`, `description`) to all `SKILL.md` files. Without this frontmatter, Antigravity IDE cannot discover and register the skills for slash commands (e.g. `/asc-refactor`).

## 5.8.4

### Changed (Reverted in 5.8.6)
- **Antigravity IDE plugin path**: Temporarily moved to `~/.gemini/antigravity-ide/plugins/<name>/` based on SecureCoder's location, but this is incorrect for user plugins. Reverted in 5.8.6.

## 5.8.3

### Fixed
- **Antigravity IDE global skills not loading**: `asc global --antigravity` was writing the plugin bundle to `~/.gemini/config/plugins/agentic-senior-core/` — a path that Antigravity IDE does not scan. Plugin bundle now installs to `~/.gemini/antigravity-ide/plugins/agentic-senior-core/`, the actual plugin directory used by Antigravity IDE (confirmed by inspecting the SecureCoder plugin installed by Google at the same location).
- **Antigravity IDE global rules**: rules now also append to `~/.gemini/GEMINI.md` (guarded — appends if you have existing content, replaces the ASC section on re-runs).
- Old paths (`~/.gemini/config/plugins/agentic-senior-core/`, `~/.gemini/config/skills/asc*`) are automatically cleaned up on re-install.
- Added WSL / dual-environment note to README (install separately in each terminal if using both Windows and WSL).

## 5.8.2

### Changed
- Refined the `## Workflow` section in `AGENTS.md` to properly include `/asc-refactor` as a high-level classification gate.
- Fixed the phase descriptions to accurately reflect the design (e.g. `define/spec gate` for new projects, rather than generic research/plan).
- Integrated the `/asc-reference` suggestion into a cleaner bulleted list.

## 5.8.1

### Changed
- Added a soft-suggestion `## Workflow` section to `AGENTS.md` (and all adapter variants) to explicitly offer `/asc-new-project` or `/asc-add-feature` workflows when starting a project or adding a non-trivial feature. This ensures the agent knows these gates exist and can suggest them to the user without enforcing a hard block on trivial edits.

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
