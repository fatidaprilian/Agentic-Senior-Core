# Clean Code, Complexity Thresholds & Architectural Smells

Universal maintainability and structural hygiene standards grounded in SonarSource Cognitive Complexity (Rule S3776), Martin Fowler's refactoring catalog, and Clean Architecture dependency boundaries.

---

## 1. Quantitative Complexity Ceilings

| Metric | Universal Threshold | Required Remediation When Exceeded |
|---|---|---|
| **Cognitive Complexity** | <= 15 per function/method | Extract focused helpers, invert conditionals to guard clauses, or replace complex branches with lookup tables. |
| **Nesting Depth** | <= 3 levels | Flatten nested `if`/`try`/`for` blocks using early returns (`return` / `continue` / `throw`) at failure paths first. |
| **Function Parameters** | <= 3 positional arguments | Group 4+ related inputs into an explicit Parameter Object or validated options structure. |
| **Boolean Mode Flags** | 0 switching flags | Never pass a boolean flag to alter internal control flow (`save(data, true)`); split into distinct named functions (`createRecord`, `updateRecord`). |
| **Algorithmic Scaling** | < O(n^2) on unbounded lists | Never nest linear scans inside loops over unbounded collections; pre-index into a hash map or set (`O(1)` lookup) or push joins to the database. |

---

## 2. Design Smells Audit Checklist

Flag and remediate these structural smells when reviewing new or modified code:

1. **God Service / God Module:** A single unit combining transport parsing, business logic, SQL/persistence queries, and external notifications. Split into distinct protocol translation, domain service, and persistence repository boundaries.
2. **Feature Envy:** A method inspecting and mutating multiple properties of another object rather than delegating behavior to the owning domain type.
3. **Primitive Obsession:** Passing raw strings or floating-point numbers across domains for constrained concepts (currency amounts, email addresses, identifiers, state machines). Use integer minor units or fixed decimal types for currency and validated domain types or enums for bounded states.
4. **Dead Code & Orphaned Exports:** Flag unreachable branches, unused imports, commented-out code blocks, unreferenced helper functions, and retired feature flags. Delete unused code rather than leaving historical remnants.
5. **Rule of Three Duplication:** Allow up to two similar blocks to avoid premature wrong abstractions; mandate consolidation into a pure, stateless shared helper once three or more clones appear (`asc dedup` / `jscpd`).

---

## 3. Dependency Direction & Acyclic Boundaries

Enforce inward-pointing dependencies across modular monoliths and services:

```
[ Transport / UI ] ──▶ [ Application / Service ] ──▶ [ Domain Core ]
                                  ▲
                                  │
                        [ Persistence / I/O ]
```

- **Zero Upward Coupling:** Domain logic and shared utilities must never import HTTP controllers, UI components, or request context objects.
- **Zero Circular Imports:** Two modules must never depend on each other directly or transitively. Extract shared contracts into a dedicated interface or schema module to break cycles.
- **No Premature Over-Engineering (YAGNI):** Reject speculative interfaces, generic factories, or multi-layer wrappers introduced for a single concrete implementation with no active second consumer.
