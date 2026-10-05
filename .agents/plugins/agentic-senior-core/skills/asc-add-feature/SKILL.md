---
name: asc-add-feature
description: >
  Trigger this skill when the user says: "add a feature", "build this endpoint", "implement this", "add this component", "extend this", "integrate this", "wire up", "add support for", "create a new route", "add a new page", "hook this up", "connect this to", "make it do X", "add a button for", "tambah fitur", "bikin endpoint", "buat halaman baru", "implementasikan ini", "sambungkan ke". Also trigger for any non-trivial addition to an existing codebase — new endpoints, UI components, services, or integrations. Also trigger when the user describes new functionality to add to a working project. Do NOT trigger for creating new projects/codebases from scratch (use asc-new-project instead), or restructuring existing code without behavior changes (use asc-refactor instead).
---

# Add Feature Workflow

Structured brownfield workflow. Adapted from QRSPI to prevent context rot and ensure alignment before building.

Grounded in: RPI (Dex Horthy, HumanLayer 2025) with corrections from QRSPI 8-stage evolution (Coding Agents Conference, March 2026). Plan-reading illusion fix and instruction budget constraint applied. Stages 2/5/7 adapted; stages 1/3/4/6/8 skipped as too heavyweight for individual-developer workflow.

## Gate Mechanism & Scaled Spec Requirement

This workflow nudges the agent to stop at each phase boundary, same enforcement tier as the existing decision ladder — not a hard block. Bypasses are logged to the debt ledger.

For brownfield feature development (`asc-add-feature`), Phase 2 requires a lightweight **PRD.md** (or feature spec in `docs/PRD.md`) defining product intent, goals, and non-goals to avoid scope creep and context rot.

To track phase, write to `workflow-gate.json` at the project root (or via standard file writing tools).
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
3. **UI Component, Notification & Error Pattern Inventory**: Scan existing shared components (`components/`, `ui/`), page patterns, active toast/notification providers (e.g., Sonner, react-hot-toast, custom alert banners), and existing fallback/error boundary conventions. Explicitly identify what must NOT be rebuilt.
4. Output a factual research summary that separates what exists from what is proposed, including explicit `[REUSED COMPONENTS & HELPERS]` and `[NOTIFICATION & ERROR CONVENTIONS]` lists, with file paths for the two or three claims that drive the plan.
5. **STOP and wait for user approval.** Do not plan or implement.

## Phase 2: Plan

1. On approval of Phase 1, update `workflow-gate.json` phase to `plan`.
2. Ensure `docs/PRD.md` or feature brief exists.
3. Check if `.github/workflows/asc-quality-gate.yml` exists. If not, include scaffolding it in your plan (must run linter, type-check, and audit) and remind the user to enable Branch Protection.
4. Create a numbered, step-by-step implementation plan with specific files, functions, and line references.
5. Include a "Don't Build" list and a "Reused Components" list from the research phase. For any proposed new UI component, justify why existing components cannot be reused or extended via props/variants.
6. **Mandatory Failure Modes, Fallbacks & User Feedback Matrix**: Define concrete behavior for every failure scenario:
   - What happens on network/API failure or timeout? (Specify exact fallback data or state).
   - What feedback does the user see? (Specify pending spinner, field error, or toast/banner message).
   - How can the user recover? (Retry button, offline warning, or fallback form).
7. **Callout: Plan-Reading Illusion.** Ask the user to explicitly verify the critical plan claims against the referenced files, not just skim it.
8. Output the plan.
9. **STOP and wait for user approval.** Do not implement.

## Phase 3: Implement

1. On approval of Phase 2, update `workflow-gate.json` phase to `implement`.
2. Recommend a fresh context (intentional compaction) at the phase boundary or after roughly 20-30 tool calls. Do not wait until degradation is subjectively noticeable.
3. Execute the approved plan.
4. **Mandatory Verification**:
   - Execute the project test suite (`ascx test`, `npm test`, `pytest`, `go test ./...`, or `cargo test`). The test runner MUST exit with code 0. Do NOT declare completion or weaken test assertions if tests fail.
   - Verify failure and edge-case behavior: ensure pending indicators resolve, mutation errors show user-facing notifications with retry, and non-critical dependency failures trigger defined fallbacks instead of white-screens or unhandled rejections.
5. On verified pass, give a short comprehension summary of what changed and why, then clear the state in `workflow-gate.json` by overwriting it with `{}`.
