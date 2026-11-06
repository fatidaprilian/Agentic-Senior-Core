# Subagent Orchestration & Worktree Isolation

Delegate independent implementation tasks to fresh subagents to keep parent coordination context small while enforcing two-stage verification gates.

---

## 1. Dispatch Criteria

Use subagents **only** when all three conditions hold:
1. An implementation plan contains $\ge$ 2 tasks with clearly separated module responsibilities.
2. Target file write sets do not overlap (preventing concurrent file write collisions).
3. Subagent tooling (`invoke_subagent` or host equivalent) is available in the runtime.

Keep tightly coupled sequential edits inline in the current session—subagent handoff overhead outweighs benefits when tasks mutate the same files.

---

## 2. Self-Contained Subagent Prompts

Subagents must never guess missing context. Every subagent prompt must explicitly state:
1. **Scoped Objective:** The single task deliverable and explicit non-goals (which files NOT to touch).
2. **Exact File Paths & Signatures:** Target implementation file(s), test file(s), and required input/output contracts.
3. **Analogous Pattern Reference:** One existing file path in the workspace whose naming, error handling, and layer split must be matched.
4. **Verification Command:** The exact test command (`ascx npm test -- ...`, `ascx pytest ...`) the subagent must run and pass before reporting back.

---

## 3. Two-Pass Review Gate Per Task

Never trust a subagent's verbal summary alone. After each subagent finishes, inspect `ascx git status` and `ascx git diff`, then verify two gates in order:

1. **Pass 1 — Spec Compliance:**
   - Did the subagent implement every requirement and edge case in the task contract?
   - Did it introduce unrequested features, extra files, or unauthorized dependencies?
2. **Pass 2 — Code Quality & Security:**
   - Are inputs validated at trust boundaries, queries parameterized, and resource-level authorization checks enforced?
   - Does the happy path use flat early returns without duplicated codebase utilities?
   - Run the task test command fresh and confirm `exit 0`.

When all tasks finish, run the full repository test suite once across the combined diff before handoff.

---

## 4. Git Worktree Isolation (`git worktree`)

When running parallel feature streams or risky refactors without disturbing the active working directory:

1. **Verify Ignore Rule:** Confirm `.worktrees/` is listed in `.gitignore` before creating local worktrees (or place worktrees in a sibling temp directory outside the repo).
2. **Create Isolated Worktree:**
   ```bash
   ascx git worktree add -b feat/<short-name> .worktrees/<short-name>
   ```
3. **Baseline Check:** Run the existing test suite inside the new worktree before writing changes to confirm a clean starting baseline.
4. **Clean Teardown:** After changes are verified and merged (with user confirmation), remove the worktree via `ascx git worktree remove .worktrees/<short-name>`.

