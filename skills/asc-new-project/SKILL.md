# New Project Workflow

Structured greenfield workflow. Prevents building before alignment on what to build.

Grounded in: Spec-Driven Development (SDD) with scaffolding-spec approach. Specs guide implementation, then the code becomes the source of truth — specs are not maintained as living documents unless the team explicitly opts in.

## Gate Mechanism

This workflow nudges the agent to stop at each phase boundary, same enforcement tier as the existing decision ladder — not a hard block. Bypasses are logged to the debt ledger.

**Known limitation:** Bypass-to-debt-ledger logging is self-reported by the agent, not enforced by the hook. The PostToolUse hook has no MCP access — it nudges the agent to log, but cannot write the debt entry itself.

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
2. Write per-feature specs with acceptance criteria and edge cases.
3. Specs are scaffolding — they guide the build, then the code is the source of truth.
4. Output specs for review.
5. **STOP and wait for user approval.** Do not implement.

## Phase 3: Implement

1. On approval of Phase 2, update `workflow-gate.json` phase to `implement`.
2. Build against the approved specs. Apply the ASC decision ladder on every file.
3. Run the decision ladder: does this need to exist? Does stdlib cover it? One function or full module?

## Phase 4: Validate

1. Run tests. Check each spec's acceptance criteria.
2. Confirm nothing was over-built beyond what the specs required.
3. On completion, clear the state in `workflow-gate.json` by overwriting it with `{}`.
