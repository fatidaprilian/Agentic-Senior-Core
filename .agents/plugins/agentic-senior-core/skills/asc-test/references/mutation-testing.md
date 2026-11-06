# Mutation Testing & Test Suite Integrity

Staff-grade guidelines for mutation testing and eradicating false-positive test suites. Grounded in the principles of **Stryker Mutator**.

---

## 1. The Fallacy of Code Coverage

Code coverage (line, branch, or statement coverage) measures only what code was executed; it does **not** measure whether assertions were made:
```javascript
// A test with 100% line coverage and ZERO verification value:
it('calculates invoice total', () => {
  const result = calculateTotal(mockCart);
  // No assertions! Or weak assertion: assert.ok(result);
});
```
Such tests give false confidence: business logic can break completely while 100% of tests continue to pass.

**Mutation testing** tests the test suite: it introduces small synthetic defects (**mutants**) into the production code. If your tests fail, the mutant is **killed** (good). If your tests pass despite the corrupted logic, the mutant **survives** (flawed test coverage).

---

## 2. Standard Mutant Operators

| Mutant Class | Original Code | Mutated Code | Verification Test Expectation |
|---|---|---|---|
| **Equality Operator** | `if (user.role === 'admin')` | `if (user.role !== 'admin')` | Test asserting admin access must fail immediately. |
| **Relational Boundary** | `if (balance >= price)` | `if (balance > price)` | Boundary test where `balance === price` must fail. |
| **Logical Connector** | `if (hasToken && isValid)` | `if (hasToken \|\| isValid)` | Test with valid token and invalid state must fail. |
| **Return Constant** | `return totalAmount;` | `return 0;` or `return null;` | Result consumer assertion must fail. |
| **Statement Deletion** | `await auditLog.record(event);` | `/* deleted */` | Audit persistence assertion must fail. |

---

## 3. The Mutation Integrity Score

$$\text{Mutation Score} = \left( \frac{\text{Killed Mutants}}{\text{Total Mutants}} \right) \times 100\%$$

- **Target Threshold**: Core business logic, pricing, authorization checks, and security boundaries must achieve a Mutation Score of $\ge 80\%$.
- **Survived Mutant Triage**:
  - Every survived mutant indicates an untested boundary or missing assertion.
  - Fix: Do not modify production code; write a specific failure assertion that kills the surviving mutant.

---

## 4. The Agentic Mutant Sanity Check

When introducing or refactoring a critical function (e.g. auth check, payment math, permissions):
1. **Identify the core decision branch** (e.g. `if (isAuthorized) return allow();`).
2. **Inject a manual mutant**: temporarily invert the condition (`if (!isAuthorized)`).
3. **Run the test runner**:
   - If tests still pass $\to$ **FLAG AS CRITICAL TEST DEFECT**. Your tests are not testing the logic.
   - Add the missing negative test case until the mutant is killed.
4. **Revert the mutant** and confirm the full test suite turns green.

