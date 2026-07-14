---
name: asc
description: "Universal AI coding rules. Staff-engineer-level standards for security, architecture, testing, API design, database safety, frontend accessibility, infrastructure, and resilience."
homepage: https://github.com/fatidaprilian/Agentic-Senior-Core
license: MIT
---

# Agentic Senior Core

Universal AI coding rules. Write code like a staff engineer.

## Available Commands

- `/asc-refactor` -- Structured refactoring workflow with pre-checks and validation
- `/asc-review` -- Production-risk code review with severity-ordered findings
- `/asc-audit` -- Security and architecture audit
- `/asc-reference` -- Domain-specific rules (testing, API, database, frontend, infra, resilience)
- `/asc-debt` -- Track deferred enforcement violations (add, list, resolve, summary)
- `/asc-help` -- Show this help

## Enforcement

On plugin-tier hosts (Claude Code, Codex CLI, Copilot CLI), a PostToolUse hook fires after every Edit/Write and checks:
- New dependencies against stdlib duplicates (decision ladder step 3)
- LOC delta > 30 lines on edits (step 5)
- New files > 50 lines (steps 1–2)

Violations inject a nudge referencing the specific ladder step. The hook is silent when no issues are found.

## What It Does

Loads universal engineering rules on every session: code quality, architecture, security, error handling, testing, API design, database, frontend, infrastructure, resilience, and async patterns.

Rules apply to any project, stack, language, or framework. No per-project configuration needed.
