# Plugin Architecture

## Design Decisions

### Evidence base

Architecture decisions are grounded in two research tracks:

1. **Academic (Consensus)**: Structured task-relevant instructions improve LLM code generation by +25.4% Pass@1. Diminishing returns on length. No evidence that consolidated vs modular format matters. Style guide evidence is weak (2 studies only).

2. **Technical (official docs)**: Claude Code, Codex CLI, Copilot CLI, Gemini CLI, Devin, Hermes, OpenCode, and OpenClaw each define their own plugin manifest format, hook event naming, and command schema.

### Layered delivery

Based on the research, ASC uses a two-layer approach:

- **Always-on policy** (`AGENTS.md`, ~1,200 tokens): Injected via hooks on every session start. Short, high-signal, universal invariants. This is the layer where prompt caching matters (10% cost per cache hit, break-even after 1 read).

- **On-demand skills** (`skills/*/SKILL.md`): Long-form workflow guidance invoked by the user. Not always-on, so length has no cost unless invoked. This is where detailed procedures live (refactoring workflow, review checklist, audit methodology).

### Hook architecture

Claude Code's SessionStart hook context does not propagate to subagents. This is a known limitation (ponytail issue #252). ASC addresses this with a separate SubagentStart hook that re-injects `AGENTS.md`.

Hook scripts use CommonJS (`require`) for maximum compatibility across Node.js versions and host environments.

### Workflow gate enforcement

The PostToolUse hook (`post-edit-enforce.js`) also checks for active workflow gates. When a workflow skill (`asc-new-project`, `asc-add-feature`) sets a gate via MCP `state_write` to `.agent-context/state/workflow-gate.json`, the hook reads it on every Edit/Write and nudges the agent if source or config files are edited during research or plan phases. `.md` files are exempt (research/plan outputs are markdown).

Gate state auto-clears after 4 hours (staleness fallback for abandoned sessions). Workflows clear the gate explicitly on completion.

All enforcement is advisory — nudges injected as `additionalContext`, not hard blocks. Bypasses are logged to the debt ledger (self-reported by the agent; the hook has no MCP access).

### Scaffolding specs (workflow design decision)

Workflow skills use specs as scaffolding: they guide the build, then the code is the source of truth. Specs are not maintained as living documents. This is an opinionated choice — living-doc maintenance tax grows with complexity (observed in SDD/SpecKit adoption) and conflicts with ASC's "minimum viable process" philosophy.

### Host detection

Hook scripts detect the current host via environment variables:

| Variable | Host |
|----------|------|
| `CLAUDE_PLUGIN_ROOT` | Claude Code |
| `COPILOT_PLUGIN_DATA` | Copilot CLI |
| `PLUGIN_DATA` | Codex CLI |
| _(none)_ | Fallback: raw stdout |

Output format varies by host: Copilot expects `{additionalContext}`, Codex expects `{systemMessage, hookSpecificOutput}`, Claude reads raw stdout.

## File structure

```
.claude-plugin/plugin.json       Plugin manifest (Claude Code)
.claude-plugin/marketplace.json  Marketplace catalog
.codex-plugin/plugin.json        Plugin manifest (Codex CLI)
.devin-plugin/plugin.json        Plugin manifest (Devin)
.github/plugin/                  Plugin manifest (Copilot CLI)
.agents/                         Plugin manifest (Antigravity/Gemini)
.opencode/plugins/               Plugin module (OpenCode)
.openclaw/skills/                Skill copies (OpenClaw)
plugin.yaml + __init__.py        Plugin manifest (Hermes)
gemini-extension.json            Extension config (Gemini CLI)
hooks/hooks.json                 Claude hook definitions
hooks/copilot-hooks.json         Copilot hook definitions
hooks/session-start.js           SessionStart hook (CommonJS)
hooks/subagent-start.js          SubagentStart hook (CommonJS)
hooks/post-edit-enforce.js       PostToolUse hook — ladder + workflow gate checks
skills/*/SKILL.md                On-demand skill definitions
commands/*.md                    Claude Code commands
commands/*.toml                  Gemini CLI commands
AGENTS.md                        Universal rules (single source of truth)
```

## Token budget

| Component | Tokens | When loaded |
|-----------|--------|------------|
| `AGENTS.md` | ~800 | Every session + every subagent |
| `asc-reference` skill | ~400 | On-demand (domain-specific rules) |
| Other skills | ~500-800 | On user invocation only |
| Commands | 0 (metadata only) | On user invocation only |

Total always-on cost: ~800 tokens per session (~34% reduction from v5.4).
