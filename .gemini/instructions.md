# Gemini Instructions - Thin Adapter

Adapter Mode: thin
Adapter Source: .instructions.md
Canonical Snapshot SHA256: 060b739f87a77375f261a13c3b2b295993ba67b4172420c4223ba1332d47b0a3

Canonical policy source: [.instructions.md](../.instructions.md).

## Bootstrap Sequence

1. Load [.instructions.md](../.instructions.md) first as the canonical baseline.
2. If `.agent-instructions.md` exists, read it next as the compiled project-specific snapshot.
3. Apply baseline rules from [.agent-context/rules/](../.agent-context/rules).
4. Load request templates from [.agent-context/prompts/](../.agent-context/prompts).
5. Apply review contracts from [.agent-context/review-checklists/](../.agent-context/review-checklists).
6. Apply state awareness from [.agent-context/state/](../.agent-context/state) and policy thresholds from [.agent-context/policies/](../.agent-context/policies).
7. Resolve stack and architecture choices dynamically from project context docs plus live evidence.

## Completion Gate

Run [.agent-context/review-checklists/pr-checklist.md](../.agent-context/review-checklists/pr-checklist.md) before declaring completion.
