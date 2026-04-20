# GitHub Copilot Instructions - Thin Adapter

Adapter Mode: thin
Adapter Source: .instructions.md
Canonical Snapshot SHA256: 5de5017263401012b3516c76e68be3cfdc5d1f09a2569d5943cfcd4105e0dde4

The canonical policy source for this repository is [.instructions.md](../.instructions.md).

## Required Load Order

1. Read [.instructions.md](../.instructions.md) first.
2. Read baseline rules in [.agent-context/rules/](../.agent-context/rules).
3. Load request templates from [.agent-context/prompts/](../.agent-context/prompts).
4. Apply review contracts from [.agent-context/review-checklists/](../.agent-context/review-checklists).
5. Apply state awareness from [.agent-context/state/](../.agent-context/state) and thresholds from [.agent-context/policies/](../.agent-context/policies).
6. Resolve stack and architecture choices dynamically from project context docs plus live evidence.

## Completion Gate

Run [.agent-context/review-checklists/pr-checklist.md](../.agent-context/review-checklists/pr-checklist.md) before declaring work complete.
