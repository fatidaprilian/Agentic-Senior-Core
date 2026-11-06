# Systematic Root-Cause Debugging

> **Core Invariant:** Zero production code edits before root-cause investigation is complete. Patching symptoms without proving the failure mechanism creates cascading regressions.

---

## 1. The Four Mandatory Debugging Phases

Complete each phase in strict order for every bug report, runtime crash, 500 error, build break, or failing test:

### Phase 1: Root-Cause Investigation (Read-Only)
Before modifying any file in `src/` or `app/`:
1. **Read Raw Failure Evidence:** Capture the exact error message, HTTP status, stack trace line numbers, and exit code without skimming.
2. **Trace Data Flow Backward:** Follow the failing variable or state from the crash site back to its trust boundary (request payload, DB query result, environment variable, async race window). Identify *where* invalid state originated, not merely where it threw.
3. **Check Recent Deltas:** Inspect recent modifications (`ascx git status`, `ascx git diff`, `ascx git log -n 5`) touching the module, config, or dependencies.
4. **Compare Working Analog:** Locate a working endpoint or handler in the same codebase and compare middleware order, types, and null/error guards.

### Phase 2: Falsifiable Hypothesis & Deterministic Reproduction
1. **State One Explicit Hypothesis:** *"Function `X` fails with `Y` when input `Z` occurs because condition `W` is unchecked at line `N`."*
2. **Write the Reproduction Test First:** Follow `references/regression-proof.md` to create an automated unit, integration, or CLI reproduction test targeting that exact input.
3. **Confirm Expected Failure (`RED`):** Execute the test fresh (`ascx npm test -- ...`, `ascx pytest ...`). It **must fail** with the exact symptom under investigation. If it passes, your hypothesis is incomplete—return to Phase 1.

### Phase 3: Minimal Root-Cause Fix
1. **Single-Cause Change:** Fix the root cause at its origin boundary (for example, normalize/validate at input entry rather than sprinkling defensive `?.` checks downstream).
2. **Zero Bundled Refactoring:** Do not mix style cleanups, renames, or unrelated feature changes into a bugfix diff.
3. **Two-Failure Circuit Breaker:** If two consecutive code edits fail to turn the reproduction test green, **STOP editing**. Revert the speculative edits, re-examine architectural assumptions from Phase 1, and report the exact blocker if an external constraint is involved.

### Phase 4: Regression & Whole-Suite Proof
1. Execute the reproduction test fresh and confirm `exit 0` (`GREEN`).
2. Perform the revert check in `references/regression-proof.md` when fixing subtle logic guards.
3. Run the complete test suite fresh (`ascx npm test` or project runner) to prove zero collateral regressions before claiming the bug is resolved.

