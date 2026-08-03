---
name: asc-adapter
description: >
  Trigger this skill when the user says: "install ASC", "set up rules", "configure for Cursor", "add to Windsurf", "set up Copilot", "initialize plugin", "generate adapter", "install for my IDE", "set up Antigravity", "add to Kiro", "configure Roo", "set up for my editor", "install rules for this project", "add ASC to this repo". Also trigger for any request to install, configure, or initialize Agentic Senior Core rules or adapter files for an AI coding tool.
---

# ASC Adapter

Detect installed AI coding hosts and generate adapter files for the current project.

## When to use

Run this when setting up a new project or when a developer wants ASC rules active across all their AI coding tools.

## Steps

1. Run `asc status` to detect which AI coding hosts are installed on this system.
2. Check which adapter files already exist in the current project directory.
3. For any detected host that is missing an adapter, run `asc adapter --<host>` to generate it.
4. Use `asc adapter --all` to generate adapters for all supported hosts at once.

## Supported hosts

Plugin hosts (always-on, no adapter needed): Claude Code, Codex CLI, Gemini CLI, Antigravity CLI, Copilot CLI, Devin CLI, Hermes, OpenCode, OpenClaw.

Adapter hosts (one file per project): Cursor, Devin Desktop, Cline, GitHub Copilot, Kiro, Continue, Zed, Aider, Kilo Code, Roo Code, OpenHands.

## Commands

```bash
asc status                # Show detected hosts
asc adapter --all         # Generate all adapters
asc adapter --cursor      # Generate for specific host
asc install-git-hook      # Install native Git pre-commit hook (recommended for all hosts)
asc uninstall             # Remove all ASC adapter files and git hooks
asc uninstall --dry-run   # Preview what would be removed
```

## Notes

- Adapter files contain the ASC universal coding rules, compressed to fit within each host's size limits.
- Cursor uses `.mdc` format with `alwaysApply: true` frontmatter.
- Windsurf is now Devin Desktop. Use `--devin` for the preferred path, `--windsurf` for legacy.
- Zed also reads `AGENTS.md` natively, so the adapter is optional.
- **Git Pre-Commit Hook (`asc install-git-hook`)**: Host plugin runtimes vary — adapter hosts and certain chat surfaces (e.g., Antigravity IDE / Antigravity 2.0 chat interface) do not run agent lifecycle hooks. Installing the native Git pre-commit hook ensures 100% deterministic duplicate code blocking and ESLint auto-fixing directly via Git on all hosts.
