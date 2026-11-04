# Test Design & Architecture

Tests are executable specifications. Poorly designed tests produce false confidence, brittle maintenance overhead, and resistance to refactoring.

---

## 1. Test Behavior, Not Implementation

Tests must verify external contracts and observable behavior, never internal implementation mechanics.

### 1.1 The Black-Box Principle
- **Test against public boundaries:** Input arguments, returned values, emitted events, persisted database state, or HTTP responses.
- **Never assert on internal plumbing:** Do not inspect private class variables, call counts on internal private methods, or local temporary variables.
- **The Refactoring Test:** If you rewrite an internal algorithm without changing inputs or outputs, your tests should remain completely green. If internal refactoring breaks tests, the tests are coupled to implementation details.

---

## 2. Mocking Discipline & External Boundaries

Mocking is a technique for isolating external unmanaged systems, not an excuse to avoid running real code.

### 2.1 The Iron Rule of Mocking
> **Never mock the unit under test.**
> Mock *only* external boundaries: third-party HTTP services, payment gateways, message brokers, system clock, or operating system hardware calls.

### 2.2 Mocking Hierarchy
Prefer real code or robust test doubles over fragile call-count mocks:

1. **Real Implementation (Preferred):** Use the actual domain code, real validation functions, and real in-memory data structures.
2. **In-Memory Fakes:** A working in-memory repository or fake mailer that stores sent emails in an array. Fakes preserve semantic behavior without network overhead.
3. **Boundary Stubs:** Fixed responses for external third-party HTTP endpoints (e.g., Stripe API, GitHub OAuth).
4. **Spy/Call Mocks (Use with caution):** Asserting `expect(spy).toHaveBeenCalledWith(...)` couples tests to internal call order. Use only when the side-effect *is* the contract (e.g., verifying an audit log event was dispatched).

---

## 3. Test Isolation & Hermetic State

Every test must run in complete isolation.

- **Zero Test Order Dependency:** Tests must succeed when run in isolation, sequentially, or shuffled in random order (`--randomize`).
- **Teardown Shared Resources:** If a test modifies an environment variable (`process.env.NODE_ENV`), writes to a database, or creates a temporary file on disk, it must restore or delete the resource in an explicit `afterEach` or `finally` block.
- **No Shared Mutable Fixtures:** Never mutate a shared global object across multiple tests. Use factory functions (`createUser()`) that return fresh independent instances for every test.

---

## 4. Test Structure: The AAA Pattern

Structure every test into three distinct, visually separated phases:

```typescript
describe('TransferService', () => {
  it('deducts balance from sender and credits receiver on successful transfer', async () => {
    // 1. Arrange: Setup fresh state and dependencies
    const sender = await createTestAccount({ balance: 1000 });
    const receiver = await createTestAccount({ balance: 200 });
    const service = new TransferService();

    // 2. Act: Execute the single behavior under test
    const result = await service.transfer({
      fromId: sender.id,
      toId: receiver.id,
      amount: 300,
    });

    // 3. Assert: Verify the observable outcome
    expect(result.status).toBe('COMPLETED');
    expect(await getBalance(sender.id)).toBe(700);
    expect(await getBalance(receiver.id)).toBe(500);
  });
});
```

- **One primary action per test:** Keep the `Act` step to a single method invocation.
- **Specific assertions:** Avoid vague assertions like `expect(result).toBeDefined()`. Assert concrete values.

