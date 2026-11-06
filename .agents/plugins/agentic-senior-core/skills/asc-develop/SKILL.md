---
name: asc-develop
description: >
  Trigger this skill when the user is: building a new feature, creating an endpoint, adding components, scaffolding a new project, starting from scratch, or refactoring existing code. Trigger when the user says: "add a feature", "build this endpoint", "implement this", "extend this", "wire up", "create a new route", "add a new page", "tambah fitur", "bikin endpoint", "new project", "start from scratch", "scaffold this", "bootstrap app", "bikin project baru", "buat aplikasi baru", "refactor this", "clean up this code", "rewrite this", "extract this into", "simplify this module", "rapikan kode ini", "refactor ini".
---

# Engineering Lifecycle Playbook (`asc-develop`)

Universal engineering workflow for greenfield development, feature implementation, and structured refactoring. Enforces strict specification alignment, analog module reuse, and automated validation without cluttering repositories with disk checkpoint files.

Grounded in: Fowler's Refactoring, Spec-Driven Development (SDD), and HumanLayer RPI.

---

## Mode 1: Greenfield (New Project Scaffolding)

Use when creating a new application, service, or repository from zero.

### Step 1: Define & Clarify (No Code)
1. Clarify essential project requirements with the user: target runtime, platform, frameworks, performance bounds, and explicit non-goals.
2. Propose the top-level directory layout and module boundaries following idiomatic conventions of the chosen stack.
3. Present an architectural summary and wait for user alignment before writing files.

### Step 2: Architecture & Implementation Hierarchy
1. Apply the ASC Decision Ladder to every module:
   - Does this need to be built?
   - Can standard library or native platform handle it?
   - Can this be one straightforward function?
2. Build the core domain entities, data models, and services first before protocol/transport controllers.
3. For frontend interfaces, follow `/asc-ui`. For documentation and prose (READMEs, ADRs), enforce the Universal Prose Floor (zero AI throat-clearing, 50% word reduction, zero buzzwords).
4. Generate a quality gate workflow (e.g., `.github/workflows/quality-gate.yml`) that runs linter, type-check, and tests.

### Step 3: Validation
1. Verify acceptance criteria against the initial specification.
2. Confirm no unnecessary dependencies or speculative abstractions were introduced.

---

## Mode 2: Brownfield (Feature Implementation)

Use when adding endpoints, components, pages, or capabilities to an existing codebase.

### Step 1: Research (Codebase & Pattern Inventory)
1. Map existing code: scan analogous modules to inspect their layer split, naming conventions, error handling, and notification patterns.
2. **Reuse Inventory**: Identify existing shared components (`components/`, `ui/`), utility functions, and active toast/banner providers. Explicitly decide what must **NOT** be rebuilt.
3. Present a factual research summary identifying reused components and implementation direction. Stop and confirm before implementing.

### Step 2: Implementation Plan & Fallback Matrix
1. Define a step-by-step implementation plan with targeted files and functions.
2. **Failure Modes & Fallback Matrix**: Define concrete behavior for failure scenarios:
   - What happens on network/API failure or timeout?
   - What feedback does the user see? (Pending state, inline field error, toast/banner with retry).
   - How can the system recover? (Retry, cached fallback, degraded mode).
3. If building UI or writing documentation, ensure compliance with the Universal Prose Floor and `/asc-ui` (zero marketing fluff, single-language consistency, mobile reflow, WCAG AA contrast).

### Step 3: Implement & Validate (TDD Integration)
1. Follow the TDD cycle via `/asc-test`: write the failing test first (RED), write minimal code to pass (GREEN), then refactor.
2. **Empirical Test Execution**: Run the project test suite (`ascx npm test`, `ascx pytest`, `ascx cargo test`). The test runner **MUST** exit with code 0.
3. Never weaken or delete test assertions to simulate a passing run. Fix the underlying business logic.

---

## Mode 3: Refactoring (Structure Modernization)

Use when restructuring, simplifying, or modernizing code without changing external behavior.

### Step 1: YAGNI Scan & Baseline Verification
1. **Verify Baseline**: Run project tests to ensure all existing tests pass before touching code. Do not refactor on broken tests.
2. **YAGNI Scan**: Identify speculative code to remove:
   - "Just in case" abstractions wrapping a single implementation with no second consumer.
   - Dead branches, unused flags, and premature extension points.

### Step 2: Scope & Execution
1. **Low-Level Refactors** (rename, extract helper, type tightening, dead code removal): Proceed immediately.
2. **High-Level Refactors** (moving modules, altering architecture boundaries, redesigning contracts): Propose the plan and rationale, then confirm before applying.
3. Apply Refactor Invariants:
   - Maintain flat happy paths via early returns over nested `if/else`.
   - Preserve all user feedback indicators, error notifications, and fallbacks.
   - Never drop error-handling branches.
   - Run a final simplification pass.

### Step 3: Verification
1. Re-run tests to confirm that behavior, public contracts, and error handling remain identical.
2. For every changed module, confirm that readability, maintainability, and safety have improved.
