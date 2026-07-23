---
name: asc-new-project
description: >
  Structured greenfield workflow. Prevents building before alignment on what to build. Use this skill for greenfield projects, scaffolding new repositories, bootstrapping apps, starting from scratch, planning new system architectures, or creating a new project.
---

# New Project Workflow

Structured greenfield workflow. Prevents building before alignment on what to build.

Grounded in: Spec-Driven Development (SDD) with scaffolding-spec approach. Core spec documents guide greenfield implementation (`PRD.md`, `Architecture.md`, `Design.md`, `Schema.md`). Once implemented, the code becomes the primary ground truth, while docs are updated on structural changes.

## Gate Mechanism & 4 Spec Document Requirement

This workflow nudges the agent to stop at each phase boundary, same enforcement tier as the existing decision ladder — not a hard block. Bypasses are logged to the debt ledger.

For greenfield projects (`asc-new-project`), Phase 2 requires creating the **4 Core SDD Documents** in `docs/` or project root:
1. `PRD.md` — Product intent, goals, non-goals, and user problems.
2. `Architecture.md` — System structure, module boundaries, and tech stack choices.
3. `Design.md` — UX / UI layout, component hierarchy, interaction rules.
4. `Schema.md` — Data contracts, database entities, API endpoints.

*Note on Rules:* Coding conventions and project constraints are automatically loaded from global plugin rules (`agentic-senior-core.md`) or workspace `AGENTS.md`. No duplicate `docs/Rules.md` file is required.

To track phase, write to `workflow-gate.json` via the `state_write` MCP tool.
Format:
```json
{
  "workflow": "asc-new-project",
  "phase": "<current_phase>",
  "updatedAt": "<ISO-timestamp>"
}
```

## Phase 1: Define (No Code)

1. Write `workflow-gate.json` with phase `research`.
2. Clarify with the user: tech stack, target platform, constraints, non-goals.
3. Propose a directory structure and module boundaries.
4. Output a project brief summarizing decisions.
5. **STOP and wait for user approval.** Do not write specs or code.

## Phase 2: Spec (No Implementation Code)

1. On approval of Phase 1, update `workflow-gate.json` phase to `plan`.
2. Generate the 4 core SDD documents from templates (`docs/PRD.md`, `docs/Architecture.md`, `docs/Design.md`, `docs/Schema.md`).
3. Verify exact file naming — check for typos like `Architectyre.md`.
4. Output specs for review.
5. **STOP and wait for user approval.** Do not implement code.

## Phase 3: Implement

1. On approval of Phase 2, update `workflow-gate.json` phase to `implement`.
2. Run Anti Context-Blindness check: verify entities/tables mentioned in `Schema.md` or `Architecture.md` align with proposed code targets.
3. Build against the approved specs. Apply the ASC decision ladder on every file.
4. Run the decision ladder: does this need to exist? Does stdlib cover it? One function or full module?

## Phase 4: Validate

1. Run tests. Check each spec's acceptance criteria.
2. Confirm nothing was over-built beyond what the specs required.
3. On completion, clear the state in `workflow-gate.json` by overwriting it with `{}`.
