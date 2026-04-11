# Gemini Instructions - Thin Adapter

Adapter Mode: thin
Adapter Source: .instructions.md
Canonical Snapshot SHA256: 361ac86172268a2f20d4f7a1e407c7dd122f1b0c265d085e872254718b078d22

Canonical policy source: [.instructions.md](../.instructions.md).

## Bootstrap Sequence

1. Load [.instructions.md](../.instructions.md) first.
2. Apply baseline rules from [.agent-context/rules/](../.agent-context/rules).
3. Load language profile from [.agent-context/stacks/](../.agent-context/stacks).
4. Use [.agent-context/blueprints/](../.agent-context/blueprints) when creating new modules/projects.
5. Load domain skills from [.agent-context/skills/](../.agent-context/skills).
6. Load request templates from [.agent-context/prompts/](../.agent-context/prompts).
7. Apply team defaults from [.agent-context/profiles/](../.agent-context/profiles), state awareness from [.agent-context/state/](../.agent-context/state), and policy thresholds from [.agent-context/policies/](../.agent-context/policies).

## Completion Gate

Run [.agent-context/review-checklists/pr-checklist.md](../.agent-context/review-checklists/pr-checklist.md) before declaring completion.