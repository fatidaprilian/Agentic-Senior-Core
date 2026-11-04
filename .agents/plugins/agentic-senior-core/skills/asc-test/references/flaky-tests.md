# Flaky Tests Diagnosis & Remediation

A flaky test is a test that exhibits both passing and failing results under identical code and execution configurations. Flaky tests erode team trust in CI and mask real production defects.

---

## 1. The Five Root Causes of Flakiness

```
┌────────────────────────────────────────────────────────┐
│             THE 5 FLAKINESS ROOT CAUSES                │
├────────────────────────────────────────────────────────┤
│ 1. Asynchronous Race Conditions (Unawaited Promises)   │
│ 2. Shared Mutable State (Polluted Databases or Globals)│
│ 3. Time, Date & Timezone Leaks                         │
│ 4. Non-Deterministic Collection Ordering               │
│ 5. Network Latency & Port Collisions                   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Root Cause Diagnostics & Remediation

### 2.1 Asynchronous Race Conditions
- **Symptom:** Test occasionally fails with `Cannot read property of undefined` or misses an assertion before background work finishes.
- **Root Cause:** A fire-and-forget Promise or unawaited async operation.
- **Remediation:** Always `await` every asynchronous call:
  ```typescript
  // FLAKY: Background work runs concurrently with test teardown
  service.processQueue();
  expect(queue.isEmpty()).toBe(true);

  // DETERMINISTIC: Await completion before asserting
  await service.processQueue();
  expect(queue.isEmpty()).toBe(true);
  ```

### 2.2 Shared Mutable State
- **Symptom:** Test passes when run alone, but fails when run as part of the full suite.
- **Root Cause:** A preceding test inserted records into a database, set a global variable, or modified an in-memory cache without cleanup.
- **Remediation:** Ensure hermetic isolation in `beforeEach` and `afterEach`:
  ```typescript
  afterEach(async () => {
    await db.clean();
    sinon.restore();
    delete process.env.FEATURE_FLAG;
  });
  ```

### 2.3 Time, Date & Timezone Sensitivity
- **Symptom:** Tests fail at midnight, on month boundaries, during Daylight Saving Time (DST) transitions, or in CI runners located in UTC.
- **Root Cause:** Direct invocation of `new Date()` or `Date.now()` without frozen timers.
- **Remediation:** Freeze time deterministically:
  ```typescript
  // Use fake timers locked to a fixed UTC epoch
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  ```

### 2.4 Non-Deterministic Collection Ordering
- **Symptom:** Array equality assertions fail intermittently: `Expected [1, 2], Received [2, 1]`.
- **Root Cause:** SQL `SELECT` queries without an explicit `ORDER BY`, or iterating over JavaScript `Set` / Go `map`.
- **Remediation:** Sort collections or compare using set equivalence:
  ```typescript
  // FLAKY: Relies on non-guaranteed database return order
  expect(results.map(r => r.id)).toEqual(['id-1', 'id-2']);

  // DETERMINISTIC: Explicit sorting before comparison
  expect(results.map(r => r.id).sort()).toEqual(['id-1', 'id-2']);
  ```

---

## 3. The 50-Run Stress Loop Protocol

When investigating a suspected flaky test, stress-test it in isolation:

```bash
# Bash / PowerShell stress loop
for ($i=1; $i -le 50; $i++) {
  ascx npm test -- -t "SuspectedFlakySuite"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Flake detected on iteration $i"
    break
  }
}
```

A test is verified fixed only when it passes 50 consecutive runs under randomized order without failure.

