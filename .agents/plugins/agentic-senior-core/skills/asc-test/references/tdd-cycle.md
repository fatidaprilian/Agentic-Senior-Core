# Test-Driven Development (TDD) Cycle

TDD is an architectural discipline for writing deterministic, verifiable software. The core principle governs all development:

> **Core Principle:** No production code shall be written without a failing test first.

---

## 1. The Three Phases of TDD

```
     ┌────────────────────────────────────────────────────────┐
     ▼                                                        │
┌───────────┐          ┌───────────┐          ┌────────────┐  │
│  1. RED   │ ───────► │ 2. GREEN  │ ───────► │ 3. REFACTOR│ ─┘
└───────────┘          └───────────┘          └────────────┘
Write failing test     Write minimum          Clean up design
Verify failure mode    code to pass           Keep suite green
```

### Phase 1: RED (Observe the Failure)
1. Write a focused, minimal test specifying the single desired behavior.
2. Run the test command fresh.
3. **Inspect the failure reason:** The test must fail because the feature does not exist or the assertion fails.
   - *Failure check:* If the test fails due to a syntax error, unhandled import crash, or missing fixture before the assertion runs, fix the test setup first.
   - *Pass check:* If the test passes immediately without new code, either the behavior already exists, or the test assertion is meaningless.

### Phase 2: GREEN (Minimum Code to Pass)
1. Write the minimum production code required to satisfy the assertion.
2. Do not implement future requirements, speculative edge cases, or premature abstractions.
3. Run the test command fresh and confirm it passes with exit code 0.

### Phase 3: REFACTOR (Improve Structure)
1. Remove duplication, extract helpers, or simplify naming.
2. Maintain identical external behavior.
3. Rerun the test suite after every structural change.

---

## 2. Whole-Suite Verification Gate

Passing an isolated test is insufficient. Local changes frequently break adjacent modules.

Before claiming any task or feature complete:
1. Run the entire test suite (`ascx npm test`, `ascx pytest`, `ascx go test ./...`, or `ascx cargo test`).
2. Read the exit code directly from the runner.
3. If any existing test fails, diagnose whether the failure is a genuine regression or a broken outdated contract. Never weaken assertions to force a green run.

---

## 3. Rationalization Prevention Table

Developers and AI models frequently invent excuses to skip tests. Every excuse has a known failure mode:

| Rationalization | Fallacy | Operational Reality |
|---|---|---|
| *"The change is too simple to test."* | Small changes cause silent regressions. | One-line fixes produce 30% of production breakages. Write the 3-line test. |
| *"I'll write tests after the code works."* | Confirmation bias tests. | Tests written after implementation mirror the existing code bugs and test implementation details rather than contracts. |
| *"It's just UI / frontend wiring."* | Visual wiring has state logic. | Form validation, button states, and error handling are pure logic and fully testable. |
| *"Mocking this dependency is too hard."* | Architecture smells. | Difficulty in testing indicates tight coupling. Extract the business logic into a pure function and test that. |
| *"I verified it manually in the console."* | Ephemeral validation. | Manual checks disappear the moment you close the session. Automated tests protect future refactors permanently. |

