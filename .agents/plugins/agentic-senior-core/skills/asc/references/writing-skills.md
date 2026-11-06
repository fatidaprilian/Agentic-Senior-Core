# Authoring Agentic Skills & Routers

Engineering guidelines for creating high-performance, token-efficient skills for Antigravity, Claude Code, Codex, and other AI coding agents.

---

## 1. Skill Discovery & Trigger Precision

Research into agent skill selection shows that models degrade in tool and skill routing when descriptions summarize internal workflows.

### 1.1 The Description Rules
1. **Trigger-Only Content:** Descriptions must contain ONLY triggering conditions: user tasks, symptom phrases, and file match patterns.
2. **Zero Workflow Summaries:** Never describe how the skill works or what steps it executes inside the description. When a description outlines the workflow, the agent executes the summary directly and skips loading the full skill body.
3. **Character Budget:** Keep descriptions concise (under 500 characters).
4. **Symptom Keywords:** Include authentic user vocabulary, colloquial complaints (*"too slow"*, *"flaky"*, *"looks broken on mobile"*), and non-English equivalents (*"bikin tes"*, *"rapikan tampilan"*).

| Anti-Pattern Description (Banned) | Deterministic Trigger Description (Enforced) |
|---|---|
| `description: Handles Greenfield, Brownfield, and Refactoring workflows by researching analogous code, making a plan, and running tests.` | `description: Trigger when building a new feature, creating an endpoint, adding components, scaffolding a project, or refactoring existing code. Trigger when user says: 'add a feature', 'build endpoint', 'refactor this', 'clean up'.` |

---

## 2. The Router + On-Demand References Pattern

Loading complete domain encyclopedias into every agent session wastes prompt cache tokens and causes attention degradation.

```
┌────────────────────────────────────────────────────────┐
│ SKILL.md (Router: < 150 Lines)                         │
├────────────────────────────────────────────────────────┤
│ 1. Trigger Frontmatter                                 │
│ 2. The Quality Floor (Bans & Invariants)               │
│ 3. Core Pre-flight & Classification Decision Tree      │
│ 4. Reference Routing Table ────────┐                   │
│ 5. Verification & Handoff Sweep    │                   │
└────────────────────────────────────┼───────────────────┘
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
       ┌───────────────────────────┐   ┌───────────────────────────┐
       │ references/domain-a.md    │   │ references/domain-b.md    │
       │ (Loaded on demand only)   │   │ (Loaded on demand only)   │
       └───────────────────────────┘   └───────────────────────────┘
```

### 2.1 The 150-Line Router Budget
`SKILL.md` must stay under 150 lines:
- **The Floor:** 10–15 unbending bans or architectural invariants.
- **Decision Engine:** High-level classification (Surface Modes, TDD tiers, Refine vs. Redesign).
- **Load Map:** A concise markdown table linking user tasks to specific files in `references/`.
- **Handoff Sweep:** Mechanical checklist executed before claiming completion.

### 2.2 Deep Domain References (`references/*.md`)
Offload detailed explanations, code examples, schemas, and nuance to separate markdown files in `references/`. The agent reads only the relevant reference file when that specific branch of work executes.

---

## 3. The Zero Disk Checkpoint Invariant

Skills must never clutter user repositories with transient agent state files.

- **Banned:** Writing `PRD.md`, `workflow-gate.json`, `test-checklist.json`, or temporary progress trackers into the user's project root.
- **Enforced:** Store transient plans and state in conversation memory or agent brain artifacts (`brain/<id>/`). Read existing project documentation (`DESIGN.md`, `CONVENTIONS.md`) if present, but never mutate project directories without user instruction.

---

## 4. Verification Gates Over Written Promises

A skill without a verifiable gate is merely a suggestion.
- Every modification must be coupled with an automated verification command (linter, unit test, Playwright run, or slop pattern check).
- Mandate fresh execution evidence: require the agent to execute the runner fresh and verify exit code 0 before claiming completion.

