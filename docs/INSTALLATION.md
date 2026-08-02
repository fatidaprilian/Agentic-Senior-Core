# Installation & Supported Hosts

Agentic Senior Core supports 23+ AI coding agents.

### Step 1: Install / Update the package

To install or forcefully update to the absolute latest version:

```bash
npm install -g @ryuenn3123/agentic-senior-core@latest
```

> [!TIP]
> **Why not `npm update -g`?** npm's update command aggressively respects SemVer restrictions and local cache, which can trap you on older patch versions. Always use `@latest` to forcefully pull the absolute newest build.

---

### Step 2: Set up for your AI tool

**Terminal agents** (Claude Code, Codex, Gemini, Copilot CLI) = install once, always-on, zero per-project files.
**IDE agents** = one file per project via `asc adapter`, or install once globally via `asc global` (below).

<details>
<summary><b>Claude Code</b> (terminal agent)</summary>

Rules load automatically via plugin hooks. No per-project files needed.

From inside Claude Code, add the marketplace then install:

```
/plugin marketplace add fatidaprilian/Agentic-Senior-Core
/plugin install agentic-senior-core@agentic-senior-core
```

Or from your terminal shell:

```bash
claude plugin marketplace add fatidaprilian/Agentic-Senior-Core
claude plugin install agentic-senior-core@agentic-senior-core
```

After install, every Claude Code session injects the rules on startup -- including subagents.

</details>

<details>
<summary><b>Codex CLI & Extension</b> (terminal & IDE agent)</summary>

Install via Codex plugin command:

```bash
codex plugin marketplace add fatidaprilian/Agentic-Senior-Core
codex plugin install agentic-senior-core
```

Or install global rules and plugin marketplace catalog via ASC CLI:

```bash
asc global --codex
```

Rules and hooks load automatically on every session with zero per-project files.

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

This copies one file to `.cursor/rules/agentic-senior-core.mdc` with official YAML frontmatter (`alwaysApply: true`). Cursor reads it automatically on every session. Repeat per project.

</details>

<details>
<summary><b>Windsurf / Devin Desktop</b> (IDE)</summary>

Windsurf was acquired by Cognition and renamed to Devin Desktop. Use `--devin` for the preferred path:

```bash
asc adapter --devin
```

This copies one file to `.devin/rules/agentic-senior-core.md` with `trigger: always_on` frontmatter. For legacy Windsurf installations:

```bash
asc adapter --windsurf
```

Repeat per project — or install once globally with `asc global --windsurf` (writes to modern `~/.windsurf/rules/agentic-senior-core.md` and legacy `~/.codeium/windsurf/memories/global_rules.md`, applying to all workspaces).

</details>

<details>
<summary><b>Cline</b> (VS Code extension)</summary>

```bash
asc adapter --cline
```

Copies one file to `.clinerules/agentic-senior-core.md`. Repeat per project — or install once globally with `asc global --cline` (rules land in `~/Documents/Cline/Rules/`, apply to all projects).

</details>

<details>
<summary><b>GitHub Copilot</b> (VS Code extension)</summary>

```bash
asc adapter --copilot
```

Copies one file to `.github/copilot-instructions.md` with `applyTo: '**'` frontmatter. Repeat per project — or install once globally with `asc global --copilot` (user-level instructions file in your VS Code profile, applies to all workspaces).

</details>

<details>
<summary><b>Kiro</b> (IDE)</summary>

```bash
asc adapter --kiro
```

Copies one file to `.kiro/steering/agentic-senior-core.md` with official `inclusion: always` frontmatter. Repeat per project. A global option exists (`asc global --kiro` → `~/.kiro/steering/`).

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

Copies one file to `CONVENTIONS.md` at project root. Aider reads this automatically. Repeat per project — or set it once globally in `~/.aider.conf.yml` with an absolute path into the npm package (`read: <npm root -g>/@ryuenn3123/agentic-senior-core/CONVENTIONS.md`). That pointer auto-updates with `npm update -g`.

</details>

<details>
<summary><b>Kilo Code</b> (VS Code extension)</summary>

```bash
asc adapter --kilocode
```

Copies one file to `.kilocode/rules/agentic-senior-core.md`. Repeat per project — or install once globally with `asc global --kilocode`. On Kilo v7+, the zero-maintenance option is pointing the `instructions:` array in `~/.config/kilo/kilo.jsonc` at the rules file inside the npm package (auto-updates with `npm update -g`).

</details>

<details>
<summary><b>Roo Code</b> (VS Code extension)</summary>

```bash
asc adapter --roo
```

Copies one file to `.roo/rules/agentic-senior-core.md`. Repeat per project — or install once globally with `asc global --roo` (`~/.roo/rules/`). Note: Roo Code was discontinued in May 2026; support is kept for existing installs.

</details>

<details>
<summary><b>OpenHands</b></summary>

```bash
asc adapter --openhands
```

Copies one file to `.openhands/microagents/agentic-senior-core.md`. Repeat per project — or install once globally with `asc global --openhands` (`~/.openhands/microagents/`, loaded in all conversations for CLI/headless/dev modes; Docker runs need the directory mounted).

</details>

<details>
<summary><b>Google Antigravity (2.0, IDE, and CLI)</b></summary>

**Option A -- workspace rules (per project for 2.0 and IDE only):**

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

Antigravity IDE and 2.0 read it automatically with `trigger: always_on`. *(Note: Antigravity CLI does not support workspace plugins, use Option B for CLI).*

**Option B -- global install (all projects and ALL clients):**

One command (works on all platforms):

```bash
asc global --antigravity
```

This automatically stages the plugin bundle (skills, rules, hooks, and MCP servers) for:
- **Antigravity 2.0 & IDE** (`~/.gemini/config/plugins/agentic-senior-core/`)
- **Antigravity CLI** (`~/.gemini/antigravity-cli/plugins/agentic-senior-core/`)

If you previously installed to legacy locations (v5.8.4 or earlier), the old paths are cleaned up automatically.

> Note: `npm update -g` refreshes the npm package only. The global copy does not auto-update -- re-run `asc global --antigravity` after each update.

> **WSL / dual-environment:** `asc global --antigravity` writes to the HOME directory of the current environment. If you use both Windows native and WSL, run it separately in each terminal.

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

---

## Supported Hosts Summary

| Host | Type | Install | Per-project files? |
|------|------|---------|-------------------|
| Claude Code | Terminal agent | `/plugin install` | No |
| Codex CLI | Terminal agent | `codex plugins install` | No |
| Gemini CLI | Terminal agent | Auto-detected | No |
| Copilot CLI | Terminal agent | Plugin registration | No |
| Devin | Terminal agent | Auto-detected | No |
| Hermes | Terminal agent | Plugin registration | No |
| OpenCode | Terminal agent | Auto-detected | No |
| OpenClaw | Terminal agent | Auto-detected | No |
| Antigravity IDE | IDE | `asc global --antigravity` | No (global) |
| Antigravity CLI | Terminal agent | `agy plugin install` | No |
| Cursor | IDE | `asc adapter --cursor` | Yes (1 file) — or paste User Rules once |
| Devin Desktop | IDE | `asc adapter --devin` | Yes (1 file) |
| Windsurf (legacy) | IDE | `asc global --windsurf` | No (global) — or `asc adapter --windsurf` |
| Cline | VS Code ext | `asc global --cline` | No (global) — or `asc adapter --cline` |
| GitHub Copilot | VS Code ext | `asc global --copilot` | No (global) — or `asc adapter --copilot` |
| Kiro | IDE | `asc adapter --kiro` | Yes (1 file) — global via `asc global --kiro` (buggy in some builds) |
| Continue | VS Code ext | `asc adapter --continue` | Yes (1 file) — or global config.yaml rules |
| Zed | IDE | `asc adapter --zed` | Yes (1 file) — or default rule in Rules Library |
| Aider | Terminal agent | `asc adapter --aider` | Yes (1 file) — or `read:` pointer in `~/.aider.conf.yml` |
| Kilo Code | VS Code ext | `asc global --kilocode` | No (global) — or `asc adapter --kilocode` |
| Roo Code | VS Code ext | `asc global --roo` | No (global) — discontinued May 2026 |
| OpenHands | Agent | `asc global --openhands` | No (global) — or `asc adapter --openhands` |

---

### Global install (all projects, zero project files)

Most IDE tools also support user-level rules that apply to **every project** — no files in any repo root. One command installs them all:

```bash
asc global --all
```

| Tool | Global location | Notes |
|------|----------------|-------|
| Google Antigravity (2.0, IDE, CLI) | `~/.gemini/config/plugins/...` and `~/.gemini/antigravity-cli/plugins/...` | Plugin bundle (skills, hooks, rules) |
| Codex CLI & Extension | `~/.codex/AGENTS.md` and `~/.agents/plugins/` | Global rules and plugin marketplace catalog |
| Cline | `~/Documents/Cline/Rules/` | Toggleable in the Cline rules panel |
| Kilo Code | `~/.kilocode/rules/` | Or point `instructions:` in `~/.config/kilo/kilo.jsonc` at the npm package path — that variant auto-updates |
| Kiro | `~/.kiro/steering/` | Some builds have global-steering loading bugs; fall back to `asc adapter --kiro` |
| OpenHands | `~/.openhands/microagents/` | CLI/headless/dev modes; Docker runs need the mount |
| Windsurf / Devin Desktop | `~/.codeium/windsurf/memories/global_rules.md` | 6,000-char global limit (ASC rules fit); skipped if you already have your own file |
| GitHub Copilot (VS Code) | VS Code profile `prompts/` folder | Installed as a user `*.instructions.md` with `applyTo: '**'` |
| Roo Code | `~/.roo/rules/` | Roo Code was discontinued May 2026; kept for existing installs |

Tools without a global rules **file** (manual one-time setup instead):

- **Cursor** — Settings → Rules → User Rules: paste the contents of `AGENTS.md` (plain text field; a global rules directory is still a Cursor feature request).
- **Zed** — Rules Library in the Agent Panel: create a rule from `AGENTS.md` and mark it as default (paper clip icon).
- **Continue** — add a rules block to the global `config.yaml`.
- **Aider** — add `read: <absolute path to npm package>/CONVENTIONS.md` in `~/.aider.conf.yml`. This is a live pointer: it auto-updates with `npm update -g`, no re-copy ever.

Global rules load first; per-project adapter files (if present) take precedence on conflicts in every tool that supports both.

### Updating

Already installed? Just update the global package:

```bash
npm update -g @ryuenn3123/agentic-senior-core
```

Terminal agent plugins pick up the new version automatically on next session. Global installs and IDE adapter files are static copies — after updating, re-run `asc global --all` once and `asc adapter --all` in each project that uses per-project files. (Aider's `read:` pointer and Kilo's `kilo.jsonc` path variant auto-update — nothing to re-run.)
