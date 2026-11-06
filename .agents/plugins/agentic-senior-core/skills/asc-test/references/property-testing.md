# Generative Property-Based Testing & Invariant Fuzzing

Staff-grade guidelines for property-based testing and generative fuzzing. Grounded in the principles of **Hypothesis** and **fast-check**.

---

## 1. Example-Based vs. Property-Based Testing

Standard unit tests validate specific, hand-picked examples:
```javascript
// Example-based: tests 1 trivial scenario
assert.equal(parsePrice("$19.99"), 1999);
```
Example-based tests suffer from confirmation bias: developers only test inputs they already anticipate.

**Property-based testing** flips the testing paradigm: you define universal system **invariants** (truths that must hold for ALL possible inputs), and the engine executes hundreds or thousands of randomized boundary inputs to prove or disprove the property:
```javascript
import fc from 'fast-check';

// Property-based: tests 100+ generated inputs across extreme boundaries
fc.assert(
  fc.property(fc.integer({ min: 0, max: 1000000 }), (cents) => {
    const formatted = formatCurrency(cents);
    return parseCurrency(formatted) === cents; // Invariant: round-trip fidelity
  })
);
```

---

## 2. Core Invariant Archetypes

Every complex business module should be tested against at least one of these four invariant patterns:

| Invariant Pattern | Definition | Canonical Example |
|---|---|---|
| **Round-Trip (Serialization)** | Transforming $A \to B \to A$ preserves exact identity. | `deserialize(serialize(record)) === record`<br>`base64Decode(base64Encode(data)) === data` |
| **Idempotence** | Applying an operation multiple times yields the same result as applying it once. | `format(format(input)) === format(input)`<br>`cleanHtml(cleanHtml(dirty)) === cleanHtml(dirty)` |
| **Crash Invariance (No 5xx)** | No valid or invalid input shall trigger an unhandled exception or server crash. | For any generated string $s$, `parseAddress(s)` returns a parsed object OR a safe `ValidationFailure` without throwing uncaught errors. |
| **Monotonicity & Invariance** | Mathematical or business logic ordering invariants. | Adding an item to a cart never decreases the cart subtotal (`subtotal(cart + item) >= subtotal(cart)`). |

---

## 3. Boundary Input Generators

When testing pure functions or data transformations, generators must evaluate pathological boundary inputs:

1. **Numeric Boundaries**:
   - `0`, `-0`, `1`, `-1`
   - `Number.MIN_SAFE_INTEGER`, `Number.MAX_SAFE_INTEGER`
   - `Infinity`, `-Infinity`, `NaN`
   - Floating-point precision traps (`0.1 + 0.2`)
2. **String Boundaries**:
   - Empty string `""`
   - Strings with null bytes (`"canary\0danger"`)
   - Unicode RTL override characters (`\u202E`) and emojis
   - Extremely large strings ($10^5$ characters)
   - Unpaired surrogate halves (`\uD800`)
3. **Collection & Tree Boundaries**:
   - Empty arrays `[]`, single-element `[x]`, arrays with duplicates `[x, x]`.
   - Deeply nested objects (depth $> 30$).
   - Objects with prototype poisoning keys (`__proto__`, `constructor`).

---

## 4. Failure Shrinking

When a property test fails on a massive random input (e.g. an array of 500 items containing a string of 4,000 characters), the property testing runner automatically **shrinks** the failure down to the minimal counterexample that still reproduces the bug (e.g. `['\0']`).

**Operational Rule**:
When documenting a property test failure, always report the **minimal shrunk counterexample** rather than the full randomized run seed.

