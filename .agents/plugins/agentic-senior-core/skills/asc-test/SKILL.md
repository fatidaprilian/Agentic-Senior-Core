---
name: asc-test
description: >
  Trigger this skill when the user is: writing unit tests, integration tests, E2E tests, UAT checklists, reproducing bugs, fixing flaky tests, or verifying test coverage. Also trigger when the user says: "write a test", "TDD", "add tests", "verify this bug", "flaky test", "test this endpoint", "E2E test", "playwright", "UAT", "regression test", "bikin tes", "cara ngetes", "tes gagal terus". Also trigger when creating or editing files matching: `*.test.*`, `*.spec.*`, `tests/*`, `__tests__/*`, or `e2e/*`.
---

# Testing, TDD, Verification & UAT Router

Staff-grade testing playbook and verification gates. Enforces test-first discipline and routes deep testing guidance on demand.

---

## 1. The Iron Law of TDD

> **THE IRON LAW:** No production code shall be written without a failing test first.

Every feature, bugfix, or refactor must follow the Red-Green-Refactor sequence:
1. **RED:** Write a minimal failing test. Execute it and confirm it fails for the expected reason.
2. **GREEN:** Write the minimum production code necessary to make the test pass.
3. **REFACTOR:** Clean up code structure while keeping the test suite green.

---

## 2. The Verification Gate

Never make a claim regarding test status without fresh execution evidence:

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ 1. IDENTIFY CMD  │ ───► │  2. RUN FRESH    │ ───► │ 3. CONFIRM CLAIM │
└──────────────────┘      └──────────────────┘      └──────────────────┘
Locate exact test         Execute runner, read      State pass/fail with
command in project        exit code directly        raw exit code & logs
```

1. **Identify the Command:** Determine the exact test command from `package.json`, `Makefile`, `pytest.ini`, or project manifests.
2. **Execute Fresh:** Run the command in the current turn. Past execution results or assumptions are invalid.
3. **Confirm Claim:** Read the raw exit code and failed assertion count before reporting results.

---

## 3. Rationalization Prevention Table

| Rationalization | Fallacy | Operational Rule |
|---|---|---|
| *"The change is too trivial to test."* | Trivial changes cause silent regressions. | Write the test. If it takes 2 minutes to write the fix, it takes 2 minutes to write the test. |
| *"I'll write tests after the code works."* | Tests written after mirror bugs. | Write the failing assertion before implementing the behavior. |
| *"It's just UI / frontend wiring."* | Visual wiring has state logic. | Form validation, button states, and error handling are pure logic and testable. |
| *"Mocking this dependency is too hard."* | Architecture smells. | Difficulty in testing indicates tight coupling. Extract pure functions or use in-memory fakes. |
| *"Tests take too long to run."* | Slowness masks bugs. | Run the focused sub-suite during development; run the full suite before handoff. |

---

## 4. Testing Decision Tree

Select the lowest testing tier that validates the requirement:

```
                       Is this pure business logic or algorithm?
                                     │
                     ┌───────────────┴───────────────┐
                    YES                              NO
                     │                               │
             ┌───────────────┐        Does it involve database, cache, or HTTP APIs?
             │ 1. UNIT TEST  │                       │
             └───────────────┘               ┌───────┴───────┐
                                            YES              NO
                                             │               │
                                     ┌───────────────┐   Does it involve browser UI or
                                     │2. INTEGRATION │   multi-step user journeys?
                                     └───────────────┘       │
                                                     ┌───────┴───────┐
                                                    YES              NO
                                                     │               │
                                             ┌───────────────┐ ┌───────────┐
                                             │ 3. E2E (TEST) │ │  4. UAT   │
                                             └───────────────┘ └───────────┘
```

---

## 5. On-Demand Reference Library

Load these references only when working on that specific domain:

| Topic | Reference Path |
|---|---|
| Red-Green-Refactor mechanics & whole-suite checks | [references/tdd-cycle.md](references/tdd-cycle.md) |
| Behavior testing, boundary isolation & mocking | [references/test-design.md](references/test-design.md) |
| Playwright E2E, reconnaissance & locator hierarchy | [references/e2e-playwright.md](references/e2e-playwright.md) |
| Given/When/Then acceptance criteria & edge case quad | [references/uat.md](references/uat.md) |
| 3-step bugfix verification & regression proof | [references/regression-proof.md](references/regression-proof.md) |
| Flakiness root causes & 50-run stress loop | [references/flaky-tests.md](references/flaky-tests.md) |

---

## 6. Verification & Handoff Sweep

Before declaring any coding or testing task complete:
1. **Regression Proof:** For bugfixes, confirm the test failed without the fix and passes with it.
2. **Whole-Suite Run:** Execute the full test suite (`ascx npm test` or project test runner); confirm exit code 0.
3. **No Assertions Weakened:** Verify no existing test assertions were deleted or commented out to simulate success.
4. **Hermetic State:** Ensure tests clean up temporary files, database records, and environment variables.

