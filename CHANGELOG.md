# Changelog

## 6.4.5

### Fixed
- **Global `hooks.json` copy for Antigravity CLI & IDE**: `asc global` now copies master `hooks.json` directly to global root hook locations (`~/.gemini/antigravity-cli/hooks.json`, `~/.gemini/config/hooks.json`, `~/.gemini/hooks.json`). This ensures Antigravity CLI on Linux/WSL detects user hooks natively when running outside of local `.agents` workspace directories.

## 6.4.4

### Fixed
- **Antigravity CLI Binary Resolution (`findAgyBinaryPath`)**: Fixed silent `spawn agy ENOENT` failure during `asc global` when `agy` binary is not in default Node.js subprocess `PATH`. Automatically resolves `%LOCALAPPDATA%\agy\bin\agy.exe` (Windows) and `~/.local/share/agy/bin/agy` (Linux/WSL) to execute `agy plugin install` successfully and register components into `agy plugin list`.

## 6.4.3

### Fixed
- **Antigravity CLI automatic plugin registration**: `asc global --antigravity` now automatically executes `agy plugin install` to register the plugin in Antigravity CLI's active plugin registry on Linux/WSL/Windows.
- **Antigravity CLI path resolution**: Updated master `hooks.json` require() fallback chain (`g3`) to include `~/.gemini/antigravity-cli/plugins/agentic-senior-core/hooks/` so hooks resolve properly across external workspaces.

## 6.4.2

### Fixed
- **Antigravity CLI hooks not firing (WSL/Linux)**: Two root causes identified and fixed:
  1. **`plugin.json` schema rejection**: CLI enforces `additionalProperties: false` — only `name`, `description`, `$schema` are valid. Our manifest had 6 extra fields (`version`, `contextFileName`, `rules`, `commands`, `skills`, `hooks`) causing silent plugin rejection. Fix: `asc global --antigravity` now writes a minimal CLI-compatible manifest to the CLI plugin path while keeping the full one for IDE.
  2. **`hooks.json` format mismatch**: CLI uses named-hook keys (`{ "hook-name": { "PreToolUse": [...] } }`), not the IDE wrapper format (`{ "hooks": { "PreToolUse": [...] } }`). Fix: `asc global --antigravity` now converts hooks.json to CLI format during install, including patching the `require()` fallback chain to include `~/.gemini/antigravity-cli/plugins/` path.

## 6.4.1

### Fixed
- **SOURCE_EXTENSIONS single source of truth**: Git pre-commit runner script now imports the extension list from `hooks/constants.cjs` at generation time instead of hardcoding a duplicate. Regenerating the hook after changing `constants.cjs` propagates updates automatically.
- **README documentation**: Added Git Pre-Commit Hook section documenting auto-install via `asc adapter`, standalone `asc install-git-hook` command, and Antigravity IDE hooks known limitation.

### Added
- **Integration tests for git pre-commit hook**: 3 end-to-end tests creating real git repos with staged files — verifies duplicate blocking (exit 1 with `[ASC Dedup]` message), clean commit pass-through (exit 0), and silent ESLint skip when no config exists. Tests skip gracefully if `jscpd` is unavailable.

## 6.4.0

### Added
- **Native Git Pre-Commit Hook (`asc install-git-hook`)**: Layer 3 deterministic defense for non-hook hosts (Cursor, Windsurf, Copilot, Antigravity chat, etc.). Runs via Git's native hook system, supporting `.husky/` and standard `.git/hooks/`.
- **Automatic Git Hook Integration in CLI**: `asc global --all` automatically configures global Git pre-commit hooks via `git config --global core.hooksPath`. `asc adapter` automatically installs pre-commit hooks into the target repository.
- **Configurable Agent Hook Thresholds**: `NEW_FILE_LINE_THRESHOLD` and `LOC_DELTA_THRESHOLD` are now overridable in `.asc/dedup-config.json`.
- **Hardened Transcript Parsing**: `extractToolCallFromTranscript()` now parses JSON Lines line-by-line with graceful recovery and `ASC_DEBUG=1` diagnostic logging.
- **ESLint TS Auto-Fix Step**: Git pre-commit runner automatically executes `eslint --fix` on staged JS/TS files in projects with TypeScript + ESLint configurations before performing duplicate scanning.
- **Arrow Shorthand Void-Expression Rule**: Added strict rule against returning void expressions from arrow function shorthands to prevent `@typescript-eslint/no-confusing-void-expression` lint breaks.

### Changed
- CLI `files` list in `package.json` simplified to include `lib/` directory, ensuring all current and future CLI commands are packed into NPM releases cleanly.

## 6.3.0

### Added
- **PreCompact constraint pinning hook**: Reinjects critical security constraints verbatim before context compaction, preventing governance decay. Based on arXiv:2606.22528 Constraint Pinning pattern. Registered as `PreCompact` event in `hooks.json`.
- **Security digest in ladder pulse**: Security constraints (negation-type, most vulnerable to context rot per arXiv:2604.20911) now reinject alongside decision ladder every 3 invocations for hosts without PreCompact support.
- **Polyglot security patterns**: `known-security-patterns.json` expanded from JS-only to Python (`eval`, `subprocess shell=True`, `pickle.loads`, `yaml.load`), Go (SQL/exec interpolation), Rust (`unsafe` without safety comment), and universal patterns (AWS keys, private keys, hardcoded credentials). Language-aware filtering in `checkSecurityPatterns()` prevents cross-language false positives.
- **Polyglot dependency gate**: `pre-tool-dependency-gate.js` now detects `pip`/`uv`/`poetry`/`cargo`/`go get`/`gem`/`bundle` install commands and watches `requirements.txt`/`pyproject.toml`/`go.mod`/`Cargo.toml`/`Gemfile` edits alongside `package.json`.
- **OWASP Agentic Top 10 (ASI01-ASI10)**: `asc-audit` skill now includes Agentic Risk Scope section for auditing AI agent systems, MCP servers, and plugins. Self-referential threat acknowledged: ASC's own state files are potential ASI06 targets.
- **Skill trigger casual coverage**: Added natural-language trigger phrases to 5 skills (`asc-reference`, `asc-audit`, `asc-dedup`, `asc-bootstrap`, `asc`) for better triggering by non-technical users.
- **Keyword-to-command mapping in rules**: `## Workflow` section now includes explicit trigger phrases per command, addressing Vercel eval finding that skills without reinforcement have 53% baseline invocation rate.

### Changed
- **OWASP citations updated**: ASVS v4 → v5.0, Top 10 → 2025 edition across `architecture.md` and `asc-audit/SKILL.md`.
- **RECAST citation corrected**: Removed from `architecture.md` (paper is about training data synthesis, not inference-time instruction density). Replaced with OctoBench (arXiv:2601.10343, ACL 2026) which directly measures scaffold-rule compliance gaps.

### Grounding
- Governance Decay / Constraint Pinning (arXiv:2606.22528, June 2026)
- Security-Recall Divergence (arXiv:2604.20911, April 2026)
- OctoBench (arXiv:2601.10343, ACL 2026)
- OWASP Top 10 for Agentic Applications v2.01 (June 2026)
- Vercel AGENTS.md vs Skills eval (February 2026)

## 5.8.8 – 6.2.4 (Summary)

Versions 5.8.8 through 6.2.4 were released between late 2025 and August 2026. Detailed per-version changelog entries were not maintained during this period. Key changes reconstructed from git history:

- **5.8.8–5.8.12**: Cross-platform fixes (WSL NTFS-ext4 `fs.cp` failure, `copyDirRecursive`, cleanup of destructive OLD_PATHS removal).
- **5.8.13–5.8.20**: Hook system maturation (terminal install command interception, dual-mode exit code 2 blocking for Antigravity IDE, cross-platform path fallback for `hooks.json`).
- **5.8.21–5.8.26**: Rules consolidation to single source of truth, `ascx` wrapper enforcement, English identifier rule, linter/security regex enforcement, CI scaffolding, drift nudging.
- **6.0.0–6.2.0**: Major: duplicate-code detection (jscpd gate), UI slop gate, dual-track adaptive preferences (TRACE compiler), plugin.json configuration.
- **6.2.1–6.2.4**: Codex plugin manifest, marketplace catalog, Antigravity plugin bundle isolation, `config.toml` auto-registration.

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
