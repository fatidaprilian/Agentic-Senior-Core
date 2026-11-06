# Regression Proof & Bugfix Verification

A bugfix is unproven until an automated test fails without the fix and passes with it.

---

## 1. The Three-Step Bugfix Verification Protocol

Never fix a bug by immediately editing production code. Follow this deterministic sequence:

```
┌─────────────────────────┐
│ 1. REPRODUCTION TEST    │ ──► Run fresh: MUST FAIL (RED)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. IMPLEMENT FIX        │ ──► Run fresh: MUST PASS (GREEN)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 3. REGRESSION PROOF     │ ──► Revert fix: MUST FAIL
└─────────────────────────┘     Re-apply fix: MUST PASS
```

### Step 1: Write the Reproduction Test
- Author a test that isolates the reported failure condition.
- Run the test runner:
  ```bash
  ascx npm test -- -t "reproduces issue #42"
  ```
- **Verification:** The test MUST fail. If the test passes before you touch production code, you have either failed to reproduce the bug or written an assertion that tests the wrong condition.

### Step 2: Implement the Minimal Fix
- Edit production code to eliminate the bug.
- Run the reproduction test fresh: it must pass with exit code 0.

### Step 3: Regression Verification (Revert & Confirm)
To prove that the test actually guards against the bug:
1. Temporarily comment out or revert the fix in production code.
2. Run the test fresh: **The test must fail.**
3. Re-apply the fix.
4. Run the full test suite fresh: **All tests must pass.**

---

## 2. Claim Verification Standards

Every claim regarding test results or bug fixes requires concrete execution evidence:

| Claim | Requires (Sufficient Evidence) | NOT Sufficient (Invalid Evidence) |
|---|---|---|
| *"Bug is fixed."* | A reproduction test failed before the fix, passes with the fix, fails when fix is temporarily reverted, and full suite passes. | *"The code logic looks sound."*<br>*"The compiler reports 0 syntax errors."*<br>*"I refreshed the browser page once."* |
| *"All tests pass."* | Fresh execution of the entire test suite showing 0 failures and exit code 0 in the current session. | *"Tests passed in an earlier turn."*<br>*"I only modified a small utility function."*<br>*"The linter reported no warnings."* |
| *"Refactoring didn't break anything."* | Full test suite passed before refactoring and passes after refactoring with zero modified assertions. | *"No imports were changed."*<br>*"The types align in the IDE."* |
| *"Test is hermetic."* | Test passes when run in isolation and when run alongside other tests in randomized order. | *"Test passes when run as the first test in the suite."* |

