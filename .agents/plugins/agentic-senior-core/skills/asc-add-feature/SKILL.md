---
name: asc-add-feature
description: >
  Trigger this skill when the user says: "add a feature", "build this endpoint", "implement this", "add this component", "extend this", "integrate this", "wire up", "add support for", "create a new route", "add a new page", "hook this up", "connect this to", "make it do X", "add a button for". Also trigger for any non-trivial addition to an existing codebase — new endpoints, UI components, services, or integrations. Also trigger when the user describes new functionality to add to a working project.
---

# Add Feature Workflow

Structured brownfield workflow. Adapted from QRSPI to prevent context rot and ensure alignment before building.

Grounded in: RPI (Dex Horthy, HumanLayer 2025) with corrections from QRSPI 8-stage evolution (Coding Agents Conference, March 2026). Plan-reading illusion fix and instruction budget constraint applied. Stages 2/5/7 adapted; stages 1/3/4/6/8 skipped as too heavyweight for individual-developer workflow.

## Gate Mechanism & Scaled Spec Requirement

This workflow nudges the agent to stop at each phase boundary, same enforcement tier as the existing decision ladder — not a hard block. Bypasses are logged to the debt ledger.

For brownfield feature development (`asc-add-feature`), Phase 2 requires a lightweight **PRD.md** (or feature spec in `docs/PRD.md`) defining product intent, goals, and non-goals to avoid scope creep and context rot.

To track phase, write to `workflow-gate.json` via the `state_write` MCP tool.
Format:
```json
{
  "workflow": "asc-add-feature",
  "phase": "<current_phase>",
  "updatedAt": "<ISO-timestamp>"
}
```

## Phase 1: Research (No Code Changes)

1. Write `workflow-gate.json` with phase `research`.
2. Map existing code: patterns, utilities, dependencies already in use. Locate at least one analogous feature/module and record its file paths.
3. Identify what must NOT be rebuilt (e.g., existing validation helpers).
4. Output a factual research summary that separates what exists from what is proposed, with file paths for the two or three claims that drive the plan.
5. **STOP and wait for user approval.** Do not plan or implement.

## Phase 2: Plan

1. On approval of Phase 1, update `workflow-gate.json` phase to `plan`.
2. Ensure `docs/PRD.md` or feature brief exists.
3. Check if `.github/workflows/asc-quality-gate.yml` exists. If not, include scaffolding it in your plan (must run linter, type-check, and audit) and remind the user to enable Branch Protection.
4. Create a numbered, step-by-step implementation plan with specific files, functions, and line references.
5. Include a "Don't Build" list from the research phase.
6. **Callout: Plan-Reading Illusion.** Ask the user to explicitly verify the two or three critical plan claims against the referenced files, not just skim it.
7. Output the plan.
8. **STOP and wait for user approval.** Do not implement.

## Phase 3: Implement

1. On approval of Phase 2, update `workflow-gate.json` phase to `implement`.
2. Recommend a fresh context (intentional compaction) at the phase boundary or after roughly 20-30 tool calls. Do not wait until degradation is subjectively noticeable.
3. Execute the approved plan.
4. Validate: tests pass, no duplicate code introduced, plan items checked off.
5. On completion, give a short comprehension summary of what changed and why, then clear the state in `workflow-gate.json` by overwriting it with `{}`.
