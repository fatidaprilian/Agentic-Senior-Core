# Architecture Decision Record

## Status
Accepted - 2026-05-07

## Context
- This repository ships Agentic-Senior-Core as a Node.js ESM CLI plus governance assets (rules, prompts, policies, and review checklists).
- Consumers install via npm and run the CLI to scaffold, validate, or enforce governance in their projects.
- The repository prioritizes deterministic governance checks and cross-platform compatibility.

## Decision
- Keep the core runtime as a Node.js ESM CLI with a single bin entry in package metadata.
- Store governance assets under `.agent-context/` and expose thin adapters at the repo root for external tooling.
- Use repo-local scripts for validation and release gates to keep enforcement deterministic and consistent.

## Consequences
- CLI changes must preserve cross-platform behavior and the published file allowlist.
- Governance asset changes require synchronized tests and changelog updates.
- Release workflow uses the bump script and validation gate before publishing.
