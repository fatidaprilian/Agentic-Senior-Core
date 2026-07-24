<div align="center">

# Agentic-Senior-Core

### Universal AI coding rules. Write code like a staff engineer, not a junior.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Minimalism plugins cut the code. This plugin makes sure what remains is production-safe.**

**Install once. Works across all projects. Supports 23+ AI coding agents.**

</div>

## How Skills & Hooks Work (Multi-Tier Architecture)

Agentic Senior Core operates on a two-tier architecture:

1. **Instructional Layer (Universal — Works in 23+ AI Tools)**:
   - **Rules (`AGENTS.md` / `agentic-senior-core.md`) & Skills (`SKILL.md`)** are cross-compatible across **Google Antigravity IDE, Claude Code, Cursor, Windsurf, Copilot, Codex, Kiro, Roo, OpenCode, Zed, Aider, etc.**.
   - **Automatic Skill Triggering**: Agents attempt to detect and load skills if your prompt matches the skill's description (e.g., asking "perform a security audit" loads `asc-audit`).
   - **Manual Skill Triggering (Highly Recommended)**: Explicitly call skills using commands like `/asc-refactor` or `/asc-new-project` for guaranteed execution.

2. **Active Enforcement Layer (Hooks — Host-Specific Hard Guardrails)**:
   - **Hard-Block Guardrails**: For tools supporting active hook execution engines (Claude Code, GitHub Copilot CLI, Google Antigravity IDE, Cursor), ASC automatically intercepts tool calls:
     - **PreToolUse Hard Block**: Immediately rejects edits adding stdlib-duplicating dependencies (e.g., `lodash`, `moment`, `uuid`) before execution (`permissionDecision: "deny"`). Escape hatch available via `.asc/dependency-allowlist.json`.
     - **PostToolUse Advisory**: Soft nudges for LOC deltas, spec drift, and workflow gate bypasses.

---

## Install

### Step 1: Install / Update the package

To install or forcefully update to the absolute latest version:

```bash
npm install -g @ryuenn3123/agentic-senior-core@latest
```

> [!TIP]
> **Why not `npm update -g`?** npm's update command aggressively respects SemVer restrictions and local cache, which can trap you on older patch versions. Always use `@latest` to forcefully pull the absolute newest build.

### Step 2: Set up for your AI tool

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

Repeat per project — or install once globally with `asc global --windsurf` (writes `~/.codeium/windsurf/memories/global_rules.md`, applies to all workspaces; skipped if you already have your own global rules file).

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

Copies one file to `.github/copilot-instructions.md`. Repeat per project — or install once globally with `asc global --copilot` (user-level instructions file in your VS Code profile, applies to all workspaces).

</details>

<details>
<summary><b>Kiro</b> (IDE)</summary>

```bash
asc adapter --kiro
```

Copies one file to `.kiro/steering/agentic-senior-core.md`. Repeat per project. A global option exists (`asc global --kiro` → `~/.kiro/steering/`), but some Kiro builds have known bugs loading global steering — prefer the per-project adapter if rules are not picked up.

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

**Terminal agents** (Claude Code, Codex, Gemini, Copilot CLI) = install once, always-on, zero per-project files.
**IDE agents** = one file per project via `asc adapter`, or install once globally via `asc global` (below).

### Global install (all projects, zero project files)

Most IDE tools also support user-level rules that apply to **every project** — no files in any repo root. One command installs them all:

```bash
asc global --all
```

| Tool | Global location | Notes |
|------|----------------|-------|
| Google Antigravity (2.0, IDE, CLI) | `~/.gemini/config/plugins/...` and `~/.gemini/antigravity-cli/plugins/...` | Plugin bundle (skills, hooks, rules) |
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

---

## What It Does

AI coding agents over-build by default. Ask for a date picker, the agent installs a library, writes a wrapper component, adds a stylesheet, and opens a timezone discussion. Worse — they silently skip input validation, concatenate SQL strings, commit secrets, and return stack traces to clients.

Code reduction plugins solve the first problem. ASC solves both.

This plugin loads universal engineering rules on every session. Before writing any code, the agent runs a decision ladder:

1. Does this need to be built at all?
2. Does the codebase already have this?
3. Does the stdlib or a native platform feature cover it?
4. Does an already-installed dependency solve it?
5. Can this be one straightforward function?
6. Only then: write the minimum code that works.

## Marking Simplification

When you pick the minimal option at step 5 or 6, and it isn't obviously trivial:
- Leave a one-line comment noting why, and the upgrade trigger if there is a ceiling.
  Example: `// minimal: single global lock — split per-account if throughput becomes an issue`
- Leave one runnable check (assertion, small test, or `__main__` demo) proving it works.
  Skip only for genuinely trivial one-liners.

The rules also cover security, architecture, testing, error handling, API design, database safety, frontend accessibility, infrastructure, resilience, and async patterns. All universal invariants -- no project-specific configuration needed.

### Before / After

<details>
<summary><b>Without ASC</b> — AI-generated endpoint (common output)</summary>

```javascript
app.post('/users', (req, res) => {
  const { name, email, password } = req.body;
  // No input validation
  // SQL injection via string concatenation
  const query = `INSERT INTO users (name, email, password)
                 VALUES ('${name}', '${email}', '${password}')`;
  db.run(query, (err) => {
    if (err) {
      // Stack trace leaked to client
      res.status(500).json({ error: err.message, stack: err.stack });
    } else {
      // Password returned in response
      res.json({ name, email, password, message: 'User created' });
    }
  });
});
```

Issues: no input validation, SQL injection, plaintext password stored and returned, internal error details leaked, no auth check.

</details>

<details>
<summary><b>With ASC</b> — same prompt, rules active</summary>

```javascript
app.post('/users', authenticate, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const hash = await bcrypt.hash(password, 12);
  const stmt = db.prepare(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
  );
  stmt.run(name, email, hash);
  res.status(201).json({ name, email });
});
```

Validated input, parameterized query, hashed password, safe error response, auth middleware, no sensitive data in response.

</details>

### Not lazy about

Input validation at trust boundaries, parameterized queries, auth checks, error handling that prevents data loss, accessibility, anything explicitly requested. These are never skipped.

---

## Supported Hosts

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

## Commands

Available on plugin hosts (Claude Code, Codex, Gemini CLI):

| Command | Purpose |
|---------|---------|
| `/asc-new-project` | Greenfield workflow (Define -> Spec -> Implement -> Validate) |
| `/asc-add-feature` | Brownfield workflow (Research -> Plan -> Implement) |
| `/asc-refactor` | Structured refactoring workflow |
| `/asc-review` | Production-risk code review with severity-ordered findings |
| `/asc-audit` | Security and architecture audit |
| `/asc-reference` | Domain-specific rules (testing, API, database, frontend, infra, resilience) |
| `/asc-debt` | Track deferred enforcement violations (add, list, resolve, summary) |
| `/asc-help` | Show available commands |

---

## CLI

```bash
asc adapter [--cursor|--devin|--windsurf|--cline|--copilot|--kiro|--continue|--zed|--aider|--kilocode|--roo|--openhands|--all]
asc global [--antigravity|--cline|--kilocode|--kiro|--openhands|--windsurf|--copilot|--roo|--all]
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

ASC covers security, architecture, testing, API design, database safety, accessibility, infrastructure, and resilience — domains that code-reduction and minimalism plugins explicitly leave out of scope. They reduce volume; ASC enforces safety on what remains.

Use them together. No conflicts — ASC is designed to be complementary.

---

## Benchmarks

Measured on `claude-opus-4-6` using headless Claude Code sessions against real tasks.

| | LOC | Tokens | Cost | Duration | Safety |
|---|---|---|---|---|---|
| **Simple tasks** | 0% | -3% to -8% | -1% | -2% to -13% | 100% |
| **Complex tasks** | **-18%** | **-30%** | **-42%** | **-18%** | 100% |

On complex, ambiguous tasks (auth systems, insecure CRUD refactors) — where over-engineering typically occurs — ASC produces **18% less code**, uses **30% fewer tokens**, costs **42% less**, and finishes **18% faster**.

On trivial tasks the model is already concise, so gains are marginal.

Full methodology and raw data: [`benchmarks/RESULTS.md`](benchmarks/RESULTS.md)

> Model: `claude-opus-4-6` · n=1-2 per task · Baseline = Claude without rules (not zero-prompt).
> Opus is inherently disciplined — gains on more verbose models would likely be larger.

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

---

## Grounded In

Every rule and skill workflow is derived from established engineering standards, not invented conventions.

| Domain | Standards |
|--------|-----------|
| Security & audit | OWASP Top 10, OWASP ASVS v4, CWE classification, CVSS report structure |
| Code review | OWASP Risk Rating Methodology, Google Engineering Practices |
| Architecture | Clean Architecture, Hexagonal Architecture |
| Workflows | RPI & QRSPI (Dex Horthy/HumanLayer), SDD (GitHub Spec Kit) |
| Refactoring | Fowler's Refactoring, Rule of Three, YAGNI (XP/Kent Beck) |
| Database | Fowler's Money Pattern, UTC timestamp convention, migration versioning |
| Accessibility | WCAG 2.2 AA |
| Resilience | Nygard's Release It!, AWS Well-Architected Reliability Pillar |
| Technical debt | Cunningham's debt metaphor (1992) |
| Instruction design | Low instruction density for higher LLM compliance — supported by IFScale (arXiv:2507.11538) and RECAST (arXiv:2505.19030) |

The decision ladder (check before building) and debt ledger format are ASC-specific implementations grounded in these principles.
