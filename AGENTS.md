# AGENTS.md - Thin Adapter

Adapter Mode: thin
Adapter Source: .instructions.md
Canonical Snapshot SHA256: 361ac86172268a2f20d4f7a1e407c7dd122f1b0c265d085e872254718b078d22

This file is an adapter entrypoint for agent discovery.
The canonical policy source is [.instructions.md](.instructions.md).

## Mandatory Bootstrap Chain

1. Load [.instructions.md](.instructions.md) first as the single source of truth.
2. Read baseline governance from [.agent-context/rules/](.agent-context/rules).
3. Load language conventions from [.agent-context/stacks/](.agent-context/stacks).
4. Load scaffolding references from [.agent-context/blueprints/](.agent-context/blueprints) when creating modules/projects.
5. Load domain packs from [.agent-context/skills/](.agent-context/skills).
6. Apply request templates from [.agent-context/prompts/](.agent-context/prompts).
7. Apply team governance defaults from [.agent-context/profiles/](.agent-context/profiles).
8. Read change-risk maps from [.agent-context/state/](.agent-context/state).
9. Enforce policy thresholds from [.agent-context/policies/](.agent-context/policies).

## Trigger Rules

- New project or module requests: propose architecture first and wait for approval.
- Refactor or fix requests: propose plan first, then execute safely.
- Completion: run [.agent-context/review-checklists/pr-checklist.md](.agent-context/review-checklists/pr-checklist.md) before declaring done.

If this adapter drifts from canonical behavior, refresh from [.instructions.md](.instructions.md) and update the hash metadata.