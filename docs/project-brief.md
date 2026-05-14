# Project Brief

## Summary

Agentic-Senior-Core is a Node.js ESM CLI and governance asset pack for AI-assisted software projects. It installs a compact instruction surface, project rules, prompts, checklists, policies, and state files that guide coding agents toward evidence-based engineering behavior.

## Users

- Developers who use AI coding agents across IDEs or CLIs.
- Teams that want consistent project bootstrap, review, and release guidance.
- Maintainers of repositories that need compact agent instructions without duplicating policy across tool-specific files.

## Current Product Direction

- Use `AGENTS.md` as the canonical installed instruction source.
- Keep `CLAUDE.md` and `GEMINI.md` as minimal native import bridges to `AGENTS.md`.
- Keep detailed rules, prompts, review checklists, policies, and state under `.agent-context/`.
- Store project-specific decisions in `.agent-context/state/onboarding-report.json` instead of generating large root instruction files.
- Preserve user-owned instruction files during upgrade when they are not Agentic-Senior-Core managed content.

## Non-Goals

- Do not copy every vendor-specific instruction format by default.
- Do not choose runtime stacks or architecture from offline defaults.
- Do not generate app, firmware, or UI code during documentation-first setup unless the user asks or approves it.
- Do not add persistent data storage unless a future feature requires it.

## Assumptions To Validate

- Vendor instruction-file support can change; ecosystem claims must be checked against current official docs before release-impacting changes.
- Existing users may still have old managed files; upgrade should stop generating new legacy surfaces without treating user-owned files as disposable.

## Next Validation Action

Run `npm run validate`, targeted CLI smoke tests, and `npm test` after instruction-surface changes.
