---
name: asc-adapter
description: >
  Detect installed AI coding hosts and generate adapter files for the current project. Use this skill when user asks to install, configure, setup, or initialize Agentic Senior Core rules, adapter files, or plugins for their IDE (Cursor, Windsurf, Devin, Copilot, Roo, Cline, Aider, Kiro).
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
asc uninstall             # Remove all ASC adapter files
asc uninstall --dry-run   # Preview what would be removed
```

## Notes

- Adapter files contain the ASC universal coding rules, compressed to fit within each host's size limits.
- Cursor uses `.mdc` format with `alwaysApply: true` frontmatter.
- Windsurf is now Devin Desktop. Use `--devin` for the preferred path, `--windsurf` for legacy.
- Zed also reads `AGENTS.md` natively, so the adapter is optional.
