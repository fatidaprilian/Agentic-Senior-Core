---
name: asc-develop
description: >
  Trigger this skill when the user is: building a new feature, creating an endpoint, planning multi-step tasks, dispatching subagents, scaffolding a new project, or refactoring existing code. Trigger when the user says: "add a feature", "build this endpoint", "make a plan", "break down tasks", "implement this", "wire up", "new project", "scaffold this", "refactor this", "clean up this code", "tambah fitur", "bikin endpoint", "bikin plan", "pecah task", "bikin project baru", "rapikan kode ini", "refactor ini".
---

# Engineering Lifecycle & Execution Router (`asc-develop`)

Universal workflow for greenfield scaffolding, feature planning/implementation, subagent orchestration, and refactoring without repository disk clutter.

---

## 0. Mandatory 1-Hop Pre-Flight Gate (BLOCKING)

> [!IMPORTANT]
> Paths below are relative to this `SKILL.md` directory (`.../skills/asc-develop/`). Prepend this skill's folder path when calling `read_file`.

Before drafting multi-step plans, asking clarifying questions, or dispatching subagents:
1. **Multi-step feature, architecture plan, or continuous task execution** $\rightarrow$ **MUST** `read_file` `references/execution-plans.md` first (*Look Before You Ask*, exact signatures, and *Rulings, Not Stalls*).
2. **Executing $\ge$ 2 independent module tasks or parallel branches** $\rightarrow$ **MUST** `read_file` `references/subagent-orchestration.md` first (fresh context isolation, 2-pass review gate).
3. **Tasks touching $\ge 3$ files, major refactors, or risky migrations** $\rightarrow$ **MUST** `read_file` `references/git-worktrees.md` (Step 0 detection, isolated workspace, subproject guards).

---

## Mode 1: Greenfield (New Project Scaffolding)

### Step 1: Define & Clarify (Look Before You Ask)
1. Clarify only unresolved requirements (target runtime, frameworks, non-goals) in at most one focused question with 2–3 concrete options.
2. Propose top-level directory layout and exact module contracts; confirm alignment before writing files.

### Step 2: Architecture & Implementation Hierarchy
1. Apply the 1–6 Decision Ladder to every module (needed $\rightarrow$ reuse $\rightarrow$ stdlib $\rightarrow$ installed dep $\rightarrow$ single function $\rightarrow$ minimal code).
2. Implement core domain models and services before transport controllers.
3. For frontend views, follow `/asc-ui`. Enforce clean single-language prose (50% word reduction, zero marketing buzzwords).
4. Add an automated quality gate workflow (lint, type-check, test).

---

## Mode 2: Brownfield (Feature Implementation)

### Step 1: Research & Reuse Inventory
1. Inspect analogous modules for layer splits, naming conventions, validation, and error handling.
2. Identify existing components (`components/ui/`), helpers, and notification providers that must **NOT** be rebuilt.

### Step 2: Right-Sized Plan & Fallback Matrix
1. Break work into testable atomic tasks with exact file paths and function signatures (`references/execution-plans.md`).
2. Define failure handling: network/DB failure recovery, pending UI states, and structured error responses (RFC 9457).

### Step 3: TDD Implementation & Autonomous Rulings
1. Execute each task via `/asc-test` (`RED` failing test $\rightarrow$ `GREEN` minimal code $\rightarrow$ `REFACTOR`).
2. Resolve minor spec ambiguities autonomously using inline `Ruling:` notes (`references/execution-plans.md`); stop only for destructive, security, or external side effects.
3. Run the test suite fresh (`ascx npm test`, `ascx pytest`, `ascx cargo test`) and confirm `exit 0`.

---

## Mode 3: Refactoring (Structure Modernization)

1. **Baseline Check:** Run existing tests first; never refactor on a failing baseline.
2. **YAGNI Scan:** Remove single-consumer wrapper abstractions, dead branches, and unused flags.
3. **Scope Gate:** Execute local renames/extractions directly; confirm cross-module boundary changes first.
4. **Invariants:** Flatten happy paths with early returns, preserve all error branches and user feedback states, and re-run the full test suite (`exit 0`).

---

## On-Demand Reference Library

| Lifecycle Requirement | Mandatory Reference Path |
| :--- | :--- |
| Discovery, bite-sized plans, exact signatures & `Ruling:` execution | `references/execution-plans.md` |
| Isolated subagent dispatch & 2-pass Spec/Quality review gate | `references/subagent-orchestration.md` |
| Workspace isolation, Step 0 detection & clean merge/cleanup | `references/git-worktrees.md` |
