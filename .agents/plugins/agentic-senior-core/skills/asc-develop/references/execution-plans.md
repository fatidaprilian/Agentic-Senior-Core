# Execution Plans, Discovery & Autonomous Rulings

Structured specification and execution protocol for multi-step features, greenfield builds, and cross-module refactors.

---

## 1. Look Before You Ask (Pre-Plan Discovery)

Before asking clarifying questions or drafting a plan:
1. **Exhaust Repository Evidence:** Read target routes, controllers, services, schemas, and analogous tests first. Never ask the user a question that `package.json`, database migrations, or existing modules already answer.
2. **Single-Question Gate:** When genuine product or contract ambiguity remains, ask at most **one** focused question (or one compact multiple-choice prompt). Present 2–3 concrete approaches with explicit operational trade-offs (complexity, schema impact, latency), placing the recommended option first.
3. **Fast-Path Trivial Tasks:** If every requirement is already explicit in a small single-file request, skip plan ceremony and execute directly with test verification.

---

## 2. Task Right-Sizing & Exact Signatures

Write plans for an engineer with zero prior context of the conversation:

1. **Map File Responsibility First:** List every file to create or modify and its single clear responsibility before decomposing tasks. Respect established repository layout.
2. **Exact Contracts Up Front:** Specify exact function names, parameter types, return shapes, error codes, and file paths in the plan.
3. **Testable Task Boundaries:** A task is the smallest unit that delivers an independently testable behavior. Fold config, types, and wiring into the task whose test requires them.
4. **Atomic 4-Step Task Cycle:**
   - Write the failing test targeting the exact signature.
   - Run the test runner and confirm it fails for the expected reason (`RED`).
   - Write the minimum implementation code required to pass (`GREEN`).
   - Run the test runner fresh and confirm `exit 0`.

---

## 3. Continuous Execution: Rulings, Not Stalls

Once the user approves a plan (or requests direct execution), execute all tasks continuously without pausing between steps to ask *"Should I continue?"*.

1. **Autonomous Rulings on Minor Ambiguities:** When encountering an implementation detail not explicitly covered by the spec (edge-case defaults, internal helper naming, local validation order), decide immediately using codebase conventions and record the decision inline:
   - `Ruling: <what was decided> — <technical rationale> — <remediation cost if wrong>`
   - If the ruling defers non-critical scope via a stub, log it in `.agents/debt-ledger.json`.
2. **The Four Hard Stop Conditions:** Halt execution and ask the user **only** when hitting:
   - An irreversible or destructive data/file operation.
   - A security boundary, authentication, or authorization contract change not approved in the spec.
   - An external side effect outside the local workspace (`git push`, package publish, production API mutation).
   - A fundamental contradiction in requirements where every path forward is pure guesswork.

