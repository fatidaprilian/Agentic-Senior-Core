<div align="center">

# Agentic-Senior-Core

### Universal AI coding rules. Write code like a staff engineer, not a junior.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Install once. Works across all projects. Supports 23+ AI coding agents.**

</div>

---

## Install

### Step 1: Install the package

```bash
npm install -g @ryuenn3123/agentic-senior-core
```

### Step 2: Set up for your AI tool

<details>
<summary><b>Claude Code</b> (terminal agent)</summary>

Rules load automatically via plugin hooks. No per-project files needed.

```bash
claude plugin add fatidaprilian/Agentic-Senior-Core
```

After install, every Claude Code session injects the rules on startup -- including subagents.

</details>

<details>
<summary><b>Codex CLI</b> (terminal agent)</summary>

```bash
codex plugins install agentic-senior-core
```

Rules load automatically via plugin hooks on every session.

</details>

<details>
<summary><b>Gemini CLI</b> (terminal agent)</summary>

Auto-detected. Gemini CLI reads `gemini-extension.json` from the installed package and loads `AGENTS.md` as context. Commands available as `.toml` format (`/asc-refactor`, `/asc-review`, `/asc-audit`).

</details>

<details>
<summary><b>Copilot CLI</b> (terminal agent)</summary>

Plugin files ship at `.github/plugin/`. After global npm install, register the plugin per your Copilot CLI version. Rules inject via hooks on every session.

</details>

<details>
<summary><b>Cursor</b> (IDE)</summary>

Run from your project root:

```bash
asc adapter --cursor
```

This copies one file to `.cursor/rules/agentic-senior-core.mdc`. Cursor reads it automatically on every session. Repeat per project.

</details>

<details>
<summary><b>Windsurf / Devin Desktop</b> (IDE)</summary>

Windsurf was acquired by Cognition and renamed to Devin Desktop. Use `--devin` for the preferred path:

```bash
asc adapter --devin
```

This copies one file to `.devin/rules/agentic-senior-core.md`. For legacy Windsurf installations:

```bash
asc adapter --windsurf
```

Repeat per project.

</details>

<details>
<summary><b>Cline</b> (VS Code extension)</summary>

```bash
asc adapter --cline
```

Copies one file to `.clinerules/agentic-senior-core.md`. Repeat per project.

</details>

<details>
<summary><b>GitHub Copilot</b> (VS Code extension)</summary>

```bash
asc adapter --copilot
```

Copies one file to `.github/copilot-instructions.md`. Repeat per project.

</details>

<details>
<summary><b>Kiro</b> (IDE)</summary>

```bash
asc adapter --kiro
```

Copies one file to `.kiro/steering/agentic-senior-core.md`. Repeat per project.

</details>

<details>
<summary><b>Continue</b> (VS Code extension)</summary>

```bash
asc adapter --continue
```

Copies one file to `.continue/rules/agentic-senior-core.md`. Repeat per project.

</details>

<details>
<summary><b>Zed</b> (IDE)</summary>

```bash
asc adapter --zed
```

Copies one file to `.zed/rules/agentic-senior-core.md`. Zed also reads `AGENTS.md` natively, so this is optional if you already have AGENTS.md in your project. Repeat per project.

</details>

<details>
<summary><b>Aider</b> (terminal agent)</summary>

```bash
asc adapter --aider
```

Copies one file to `CONVENTIONS.md` at project root. Aider reads this automatically. Repeat per project.

</details>

<details>
<summary><b>Kilo Code</b> (VS Code extension)</summary>

```bash
asc adapter --kilocode
```

Copies one file to `.kilocode/rules/agentic-senior-core.md`. Repeat per project.

</details>

<details>
<summary><b>Roo Code</b> (VS Code extension)</summary>

```bash
asc adapter --roo
```

Copies one file to `.roo/rules/agentic-senior-core.md`. Repeat per project.

</details>

<details>
<summary><b>OpenHands</b></summary>

```bash
asc adapter --openhands
```

Copies one file to `.openhands/microagents/agentic-senior-core.md`. Repeat per project.

</details>

<details>
<summary><b>Google Antigravity IDE</b></summary>

**Option A -- workspace rules (per project):**

Copy the rules file into your project's `.agents/rules/` directory:

```bash
# Create the directory first, then copy
mkdir -p .agents/rules

# From the npm package (after Step 1)
cp "$(npm root -g)/@ryuenn3123/agentic-senior-core/.agents/rules/agentic-senior-core.md" .agents/rules/
```

PowerShell (Windows):
```powershell
mkdir .agents\rules -Force
cp "$(npm root -g)/@ryuenn3123/agentic-senior-core/.agents/rules/agentic-senior-core.md" .agents\rules\
```

Antigravity IDE reads it automatically with `trigger: always_on`.

**Option B -- global plugin (all projects):**

Copy the plugin bundle to Antigravity's global plugin directory:

```powershell
# Windows
xcopy /E /I "%APPDATA%\npm\node_modules\@ryuenn3123\agentic-senior-core\.agents\plugins\agentic-senior-core" "%USERPROFILE%\.gemini\config\plugins\agentic-senior-core"
```

```bash
# macOS / Linux
cp -r "$(npm root -g)/@ryuenn3123/agentic-senior-core/.agents/plugins/agentic-senior-core" ~/.gemini/config/plugins/
```

The plugin bundle includes rules, skills (`/asc-review`, `/asc-audit`, `/asc-refactor`), and `plugin.json`.

</details>

<details>
<summary><b>Google Antigravity CLI</b></summary>

Requires [Antigravity CLI](https://antigravity.google) (`agy`) installed separately.

```bash
agy plugin install https://github.com/fatidaprilian/Agentic-Senior-Core.git
```

</details>

<details>
<summary><b>Devin / Hermes / OpenCode / OpenClaw</b></summary>

Plugin manifests ship in the npm package at their standard paths (`.devin-plugin/`, `plugin.yaml`, `.opencode/plugins/`, `.openclaw/skills/`). After global npm install, each host auto-discovers or manually register per host docs.

</details>

<details>
<summary><b>All IDE adapters at once</b></summary>

```bash
asc adapter --all
```

Generates adapter files for Cursor, Devin Desktop, Windsurf, Cline, Copilot, Kiro, Continue, Zed, Aider, Kilo Code, Roo Code, and OpenHands in one go.

</details>

**Terminal agents** (Claude Code, Codex, Gemini, Copilot CLI) = install once, always-on, zero per-project files.
**IDE agents** (Cursor, Devin Desktop, Cline, Copilot VS Code, Kiro, Continue, Zed, Aider, Kilo Code, Roo Code, OpenHands, Antigravity) = one file per project via `asc adapter` or copy.

### Updating

Already installed? Just update the global package:

```bash
npm update -g @ryuenn3123/agentic-senior-core
```

Terminal agent plugins pick up the new version automatically on next session. For IDE adapters, re-run `asc adapter --all` in each project to refresh the adapter files.

---

## What It Does

AI coding agents over-build by default. Ask for a date picker, the agent installs a library, writes a wrapper component, adds a stylesheet, and opens a timezone discussion.

This plugin loads universal engineering rules on every session. Before writing any code, the agent runs a decision ladder:

1. Does this need to be built at all?
2. Does the codebase already have this?
3. Does the stdlib or a native platform feature cover it?
4. Does an already-installed dependency solve it?
5. Can this be one straightforward function?
6. Only then: write the minimum code that works.

The rules also cover security, architecture, testing, error handling, API design, database safety, frontend accessibility, infrastructure, resilience, and async patterns. All universal invariants -- no project-specific configuration needed.

### Not lazy about

Input validation at trust boundaries, parameterized queries, auth checks, error handling that prevents data loss, accessibility, anything explicitly requested. These are never skipped.

---

## Supported Hosts

| Host | Type | Install | Per-project files? |
|------|------|---------|-------------------|
| Claude Code | Terminal agent | `claude plugin add` | No |
| Codex CLI | Terminal agent | `codex plugins install` | No |
| Gemini CLI | Terminal agent | Auto-detected | No |
| Copilot CLI | Terminal agent | Plugin registration | No |
| Devin | Terminal agent | Auto-detected | No |
| Hermes | Terminal agent | Plugin registration | No |
| OpenCode | Terminal agent | Auto-detected | No |
| OpenClaw | Terminal agent | Auto-detected | No |
| Antigravity IDE | IDE | Copy rules or plugin bundle | No (global) / Yes (rules) |
| Antigravity CLI | Terminal agent | `agy plugin install` | No |
| Cursor | IDE | `asc adapter --cursor` | Yes (1 file) |
| Devin Desktop | IDE | `asc adapter --devin` | Yes (1 file) |
| Windsurf (legacy) | IDE | `asc adapter --windsurf` | Yes (1 file) |
| Cline | VS Code ext | `asc adapter --cline` | Yes (1 file) |
| GitHub Copilot | VS Code ext | `asc adapter --copilot` | Yes (1 file) |
| Kiro | IDE | `asc adapter --kiro` | Yes (1 file) |
| Continue | VS Code ext | `asc adapter --continue` | Yes (1 file) |
| Zed | IDE | `asc adapter --zed` | Yes (1 file) |
| Aider | Terminal agent | `asc adapter --aider` | Yes (1 file) |
| Kilo Code | VS Code ext | `asc adapter --kilocode` | Yes (1 file) |
| Roo Code | VS Code ext | `asc adapter --roo` | Yes (1 file) |
| OpenHands | Agent | `asc adapter --openhands` | Yes (1 file) |

---

## Commands

Available on plugin hosts (Claude Code, Codex, Gemini CLI):

| Command | Purpose |
|---------|---------|
| `/asc-refactor` | Structured refactoring workflow |
| `/asc-review` | Production-risk code review with severity-ordered findings |
| `/asc-audit` | Security and architecture audit |
| `/asc-help` | Show available commands |

---

## CLI

```bash
asc adapter [--cursor|--devin|--windsurf|--cline|--copilot|--kiro|--continue|--zed|--aider|--kilocode|--roo|--openhands|--all]
asc uninstall [--dry-run]
asc clean [--dry-run]
asc status
asc mcp
asc --version
asc --help
```

`ascx` is a token-saving command wrapper that compresses noisy output while preserving debugging evidence. Install globally and use as: `ascx git status`, `ascx npm test`.

---

## Works With Other Plugins

ASC covers universal engineering standards (security, architecture, testing, API design, database safety). It is complementary to:

- **ponytail** -- YAGNI minimalism and code reduction
- **awesome-cursorrules** -- Framework-specific context and stack declarations

Use them together. No conflicts.

---

## Migration from v4.x

v5.0 is a breaking change. The per-project system (`.agent-context/`, bridge files, project scaffolding) is replaced by the universal plugin system.

Clean up v4 artifacts from any project:
```bash
# Preview what will be removed
asc clean --dry-run

# Remove v4 files (.agent-context/, AGENTS.md, CLAUDE.md, GEMINI.md, etc.)
asc clean
```

This removes `.agent-context/`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and other v4 bridge files from the current project directory. The global plugin replaces all of them.

---

## Token Budget

| Component | Tokens | When loaded |
|-----------|--------|------------|
| Rules (`AGENTS.md`) | ~1,200 | Every session + every subagent |
| Each skill | ~500-800 | On user invocation only |
| Commands | 0 | Metadata only |

Total always-on cost: ~1,200 tokens per session.
