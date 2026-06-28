# Refactor Skill

Structured refactoring workflow. Preserves existing behavior while improving structure.

## Before Editing

1. Read the target code and understand existing patterns.
2. Identify the smallest relevant scope for the refactor.
3. If the change touches UI, check accessibility and responsive behavior.
4. If the change touches dependencies, verify current official docs.

## Refactor Rules

- Improve clarity, boundaries, naming, validation, error handling, and tests.
- Prioritize maintainability over compressed one-liners.
- Keep the main flow traceable. Use early returns where they reduce nesting.
- Do not introduce abstractions before the repeated pattern is real.
- Split large files when the split makes the flow easier to understand.
- Remove code that does not carry behavior, safety, clarity, maintainability, or test value.
- Prefer the shorter implementation only when it keeps the same guarantees.
- Run a final simplification pass before completion.
- Update tests and docs whenever behavior contracts, public APIs, data shape, or UI contracts change.

## For Every Change, Explain

- What risk or friction existed.
- What changed.
- Why the new shape is safer or easier to maintain.

## Validation

- Existing behavior is preserved unless the user approved a change.
- Edge cases, empty states, error paths, and rollback paths are handled.
- Public contracts remain stable or are versioned.
- Tests pass.
