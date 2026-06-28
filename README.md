<div align="center">

# Agentic-Senior-Core

### Universal AI coding rules. Write code like a staff engineer, not a junior.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Install once. Works across all projects. Supports 16+ AI coding agents.**

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
<summary><b>Windsurf</b> (IDE)</summary>

```bash
asc adapter --windsurf
```

Copies one file to `.windsurf/rules/agentic-senior-core.md`. Repeat per project.

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
<summary><b>Devin / Hermes / OpenCode / OpenClaw / Antigravity</b></summary>

Plugin manifests ship in the npm package at their standard paths (`.devin-plugin/`, `plugin.yaml`, `.opencode/plugins/`, `.openclaw/skills/`, `.agents/`). After global npm install, each host auto-discovers or manually register per host docs.

</details>

<details>
<summary><b>All IDE adapters at once</b></summary>

```bash
asc adapter --all
```

Generates adapter files for Cursor, Windsurf, Cline, Copilot, and Kiro in one go.

</details>

**Terminal agents** (Claude Code, Codex, Gemini, Copilot CLI) = install once, always-on, zero per-project files.
**IDE agents** (Cursor, Windsurf, Cline, Copilot VS Code, Kiro) = one file per project via `asc adapter`.

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
| Antigravity | Terminal agent | Auto-detected | No |
| Cursor | IDE | `asc adapter --cursor` | Yes (1 file) |
| Windsurf | IDE | `asc adapter --windsurf` | Yes (1 file) |
| Cline | VS Code ext | `asc adapter --cline` | Yes (1 file) |
| GitHub Copilot | VS Code ext | `asc adapter --copilot` | Yes (1 file) |
| Kiro | IDE | `asc adapter --kiro` | Yes (1 file) |

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
asc adapter [--cursor|--windsurf|--cline|--copilot|--kiro|--all]
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
