# Refactor Skill

Structured refactoring workflow. Preserves existing behavior while improving structure.

Grounded in: Fowler's Refactoring (read-understand-smallest scope-preserve behavior), Rule of Three (abstraction threshold), YAGNI principle (XP/Kent Beck). Empirical evidence: agents dominate low-level refactors (rename, extract, type changes) but struggle with multi-file architectural changes (arXiv, 15k+ instance study).

## YAGNI Scan (Before Any Restructuring)

Before changing structure, scan for speculative code to remove:
- "Just in case" logic, unused feature flags, dead branches behind config toggles.
- Abstractions wrapping a single implementation with no second consumer.
- Premature extension points (plugin hooks, strategy patterns) with one concrete path.

Removing speculative code is the highest-value, lowest-risk refactor type.

## Classify Before Proceeding

After reading the target code, classify the refactor:

- **Low-level** (rename, extract method, type safety, dead code removal): proceed after explaining the change. No approval gate needed.
- **High-level** (move module, change architecture, redesign abstractions, multi-file structural changes): output a plan with specific files and rationale, then **stop and wait for user approval** before implementing.

**Known limitation:** The high-level refactor gate is a skill-text instruction — the agent self-classifies and self-stops. Unlike `/asc-add-feature` and `/asc-new-project`, this gate is not backed by the PostToolUse hook or workflow-gate.json. If the agent bypasses the gate, there is no automated nudge.

## Before Editing

1. Read the target code and understand existing patterns.
2. Identify the smallest relevant scope for the refactor.
3. Classify the refactor (see above). If high-level, stop and present a plan.
4. If the change touches UI, check accessibility and responsive behavior.
5. If the change touches dependencies, verify current official docs.

## Refactor Rules

- Improve clarity, boundaries, naming, validation, error handling, and tests.
- Prioritize maintainability over compressed one-liners.
- Keep the main flow traceable. Use early returns where they reduce nesting.
- Introduce abstractions only when the repeated pattern is real and visible.
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
