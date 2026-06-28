# Contributing to Agentic-Senior-Core

Thanks for wanting to make AI agents write better code.

---

## What You Can Contribute

| Type | Where | Notes |
|------|-------|-------|
| Rule improvement | `AGENTS.md` | All rules live in one file |
| New skill | `skills/<name>/SKILL.md` | Long-form workflow guidance |
| New command | `commands/<name>.md` + `.toml` | Claude `.md`, Gemini `.toml` |
| New host adapter | See adapter guide below | One file per host |
| Bug fix | Any file | Typos, broken links, incorrect rules |

---

## Content Quality Standard

Every rule must be opinionated, specific, and enforceable.

### Litmus Test

- Does your rule include concrete BANNED / REQUIRED boundaries?
- Would an AI agent enforce it without ambiguity?
- Does it teach the reader WHY, not just WHAT?

If all three are "yes", it belongs here.

---

## How to Edit Rules

All universal rules live in `AGENTS.md`. This is the single source of truth injected into every host via hooks.

1. Edit `AGENTS.md`
2. Run `npm test` to verify structure and size constraints
3. Open a PR

Keep `AGENTS.md` under 8KB (~1,200 tokens). Every byte is injected on every session start across all hosts. Concise rules with high signal-to-noise ratio.

---

## How to Add a Skill

Skills are long-form workflows that users invoke on demand (not always-on). They don't count against the always-on token budget.

1. Create `skills/<name>/SKILL.md` with frontmatter:
   ```yaml
   ---
   name: asc-<name>
   description: One-line description
   ---
   ```
2. Create matching command files:
   - `commands/<name>.md` (Claude Code format)
   - `commands/<name>.toml` (Gemini format: `description` + `prompt` fields)
3. If the skill should be available in OpenClaw, copy `SKILL.md` to `.openclaw/skills/<name>/SKILL.md`
4. Run `npm test`
5. Open a PR

---

## How to Add a Host Adapter

### Plugin-tier hosts (hooks + skills + commands)

These hosts support full plugin systems. Create the host's manifest in its standard directory:

| Host | Manifest path | Format |
|------|--------------|--------|
| Claude Code | `.claude-plugin/plugin.json` | JSON: name, version, skills, commands, hooks |
| Codex CLI | `.codex-plugin/plugin.json` | JSON: name, skills, hooks, interface |
| Copilot CLI | `.github/plugin/plugin.json` | JSON |
| Devin | `.devin-plugin/plugin.json` | JSON minimal |
| Hermes | `plugin.yaml` + `__init__.py` | YAML + Python |
| OpenCode | `.opencode/plugins/agentic-senior-core.mjs` | JS module |

### Instruction-tier hosts (single file copy)

These hosts read a rules file from a standard path. The adapter file contains the full `AGENTS.md` content with host-specific frontmatter.

| Host | Adapter path |
|------|-------------|
| Cursor | `.cursor/rules/agentic-senior-core.mdc` |
| Windsurf | `.windsurf/rules/agentic-senior-core.md` |
| Cline | `.clinerules/agentic-senior-core.md` |
| Copilot (VS Code) | `.github/copilot-instructions.md` |
| Kiro | `.kiro/steering/agentic-senior-core.md` |

After adding a new adapter:
1. Add the file path to `package.json` `files` array
2. Add the adapter to `lib/cli/commands/adapter.mjs` if it's instruction-tier
3. Add a test assertion in `tests/adapter.test.mjs`
4. Update `README.md` supported hosts table

### Keeping adapter content aligned

All instruction-tier adapter files must contain the same rule content as `AGENTS.md`. When you update `AGENTS.md`, update all adapter files. The test suite validates that all adapter files exist.

---

## PR Process

1. **Fork** the repository
2. **Branch** from `main`: `feat/add-hermes-adapter` or `fix/security-rule-typo`
3. **Write** your content following the quality standard
4. **Test**: `npm test` must pass
5. **Commit** with Conventional Commits: `feat(adapters): add hermes plugin`
6. **Open PR** with what you changed and why

---

## What We Don't Accept

- Generic content that reads like auto-generated filler
- Rules without concrete enforcement boundaries
- PRs that don't update tests for structural changes

---

## Local Development

The npm package is published under `@ryuenn3123`, while the GitHub repository is hosted under `fatidaprilian`.

### Architecture (v5.x)

```
AGENTS.md                    <-- single source of truth for rules
hooks/session-start.js       <-- injects AGENTS.md on session start (CommonJS)
hooks/subagent-start.js      <-- injects AGENTS.md into subagents (CommonJS)
skills/*/SKILL.md            <-- on-demand workflow guidance
commands/*.md                <-- Claude Code commands
commands/*.toml              <-- Gemini CLI commands
.claude-plugin/              <-- Claude Code plugin manifest
.codex-plugin/               <-- Codex CLI plugin manifest
.cursor/rules/               <-- Cursor adapter (instruction-tier)
.windsurf/rules/             <-- Windsurf adapter
lib/cli/commands/adapter.mjs <-- CLI adapter generator
tests/adapter.test.mjs       <-- structure validation tests
```

```bash
git clone https://github.com/fatidaprilian/Agentic-Senior-Core.git
cd Agentic-Senior-Core
npm test
```

---

## Questions?

Open an issue. Describe what you want to add and why.
