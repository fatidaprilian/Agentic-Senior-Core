# GitHub Copilot Instructions - Thin Adapter

Adapter Mode: thin
Adapter Source: .instructions.md
Canonical Snapshot SHA256: 58ca52e08f9503f55d49dfc64f800bb1124774251db4614478dbdfa618834445

The canonical policy source for this repository is [.instructions.md](../.instructions.md).

If your host stops at this file, follow this minimum floor:
- Read `.agent-instructions.md` next when it exists.
- For UI or redesign requests, load [.agent-context/prompts/bootstrap-design.md](../.agent-context/prompts/bootstrap-design.md) and [.agent-context/rules/frontend-architecture.md](../.agent-context/rules/frontend-architecture.md) before coding.
- If UI scope and `docs/DESIGN.md` or `docs/design-intent.json` is missing, materialize them before UI implementation.
- For backend/API/data/auth/event requests, load relevant global rules from [.agent-context/rules/](../.agent-context/rules) and do not create stack-specific governance adapters.
- Memory continuity is host-dependent project memory and does not replace bootstrap loading.

## Required Load Order

1. Read [.instructions.md](../.instructions.md) first as the canonical baseline.
2. If `.agent-instructions.md` exists, read it next as the compiled project-specific snapshot.
3. Read baseline rules in [.agent-context/rules/](../.agent-context/rules).
4. Load request templates from [.agent-context/prompts/](../.agent-context/prompts).
5. Apply review contracts from [.agent-context/review-checklists/](../.agent-context/review-checklists).
6. Apply state awareness from [.agent-context/state/](../.agent-context/state) and thresholds from [.agent-context/policies/](../.agent-context/policies).
7. Resolve runtime, structure, and dependency choices from project context docs plus live evidence.

## Bootstrap Receipt

For non-trivial coding, review, planning, or governance work, produce a short Bootstrap Receipt before implementation output: `loaded_files`, `selected_rules`, `skipped_rules`, `unreachable_files`, and `validation_plan`.

## Completion Gate

Run [.agent-context/review-checklists/pr-checklist.md](../.agent-context/review-checklists/pr-checklist.md) before declaring work complete.
