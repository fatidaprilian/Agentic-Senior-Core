# Phase 3 Plan - Anti-Halu Stack

> **Status:** Ready for execution after Phase 2 GATE C approval.
> **Scope:** Add a measurable anti-hallucination stack using rule IDs, bounded reflection, and post-hoc validation without breaking the Phase 2 cache split.
> **Locked source:** D6 in `docs/plan/research-foundation.md`.

---

## Objective

Implement the D6 three-mechanism anti-halu stack:

1. **Pre-prompt prevention:** anti-sycophancy and rule-citation requirements in stable governance text.
2. **In-flight forcing function:** bounded reflection block that cites existing rule IDs before risky implementation or review actions.
3. **Post-hoc validation:** local/MCP validation tools and audits that catch missing or invalid rule references.

The implementation must preserve the Phase 2 cache architecture:

- Layer 1 and Layer 2 remain stable and cacheable.
- Layer 3 holds task-specific evidence, user requests, diffs, command output, and generated citations.
- No lossy compression is allowed for rules content.

---

## Source Constraints

### Research foundation

D6 says the anti-halu stack is defense in depth:

- L1 pre-prompt: numbered rules, rule IDs, anti-sycophancy clause, positive framing.
- L2 in-flight: reflection block with required rule ID citations.
- L3 post-hoc: MCP validation tool and CI/audit checks.

Supporting sources listed in `research-foundation.md`:

- MMMT-IF / ManyIFEval: self-critique loop improves instruction following by about +14 to +16 points in the cited scenarios.
- ArXiv 2603.23528: lossy compression can trigger severe provider-dependent output expansion.
- ArXiv 2603.23527: output expansion is benchmark-dependent, so rules must stay lossless.
- ArXiv 2601.06818: AgentHallu framework for hallucination attribution.

### Phase 2 constraints

From `phase-2-outcome.md`:

- `with_loaded_rules` average total input: 8,483.1 tokens.
- Average Layer 1+2 cacheable input: 8,417.6 tokens.
- Anthropic average warm-read effective input: 907.26 tokens.
- Layer 1+2 cacheable ratio: 99.23%.

Phase 3 must not turn stable cacheable text into volatile task-specific text.

---

## Non-Goals

- Do not add retrieval. Retrieval remains Phase 4 and conditional.
- Do not add runtime dependencies.
- Do not call provider generation APIs.
- Do not introduce lossy prompt compression for rules.
- Do not claim hallucination-rate improvements without a reproducible benchmark artifact.
- Do not make MCP the delivery mechanism for static rules.

---

## Task 3.1: Add Stable Anti-Sycophancy and Rule-Citation Contract

**Goal:** Add the minimum stable governance text needed for D6 L1 without bloating dynamic task context.

**Steps:**
1. Add a short anti-sycophancy clause to the canonical instruction surface.
2. Require agents to cite rule IDs when rejecting user requests that conflict with rules.
3. Require agents to cite rule IDs when a task touches high-risk boundaries.
4. Keep language directive and factual, not motivational.
5. Update docs that describe the installed instruction contract.

**Acceptance criteria:**
- [ ] Canonical instruction surface includes anti-sycophancy behavior.
- [ ] Rule citation requirement references existing v4 IDs.
- [ ] No new root adapter policy duplication.
- [ ] `npm run validate` passes.
- [ ] `npm test` count does not drop.

**Files allowed:**
- `AGENTS.md`
- `.agent-context/rules/architecture.md`
- `.agent-context/rules/api-docs.md`
- `.agent-context/prompts/review-code.md`
- `docs/flow-overview.md`
- `docs/plan/phase-3-anti-halu.md`
- tests only if existing gates need coverage.

---

## Task 3.2: Add Bounded Reflection Block Contract

**Goal:** Add an in-flight reflection contract that improves rule adherence without dumping full rule prose into Layer 3.

**Steps:**
1. Define a compact reflection block format.
2. Require only rule IDs and one-line rationale, not copied rule text.
3. Scope reflection to risky actions:
   - implementation before file edits;
   - public contract changes;
   - rule conflict or refusal;
   - release or publish gates;
   - security, data, API, testing, or architecture boundaries.
4. Keep default user-facing responses concise.
5. Ensure the contract does not require exposing hidden chain-of-thought.

**Acceptance criteria:**
- [ ] Reflection block format is documented.
- [ ] Reflection block cites valid rule IDs.
- [ ] Reflection block does not require full rule prose.
- [ ] Reflection block is scoped, not required for every trivial message.
- [ ] `npm run validate` passes.
- [ ] `npm test` count does not drop.

**Files allowed:**
- `AGENTS.md`
- `.agent-context/prompts/init-project.md`
- `.agent-context/prompts/refactor.md`
- `.agent-context/prompts/review-code.md`
- `.agent-context/prompts/bootstrap-design.md`
- `.agent-context/review-checklists/pr-checklist.md`
- `docs/plan/phase-3-anti-halu.md`
- tests only if existing gates need coverage.

---

## Task 3.3: Add Rule Lookup and Compliance MCP Tools

**Goal:** Implement D6 L3 as validation tools, not static-rule delivery.

**Steps:**
1. Add `lookup_rule` to return a rule section by ID from `.agent-context/rules/*.md`.
2. Add `validate_against_rules` to validate provided rule IDs and report unknown or ambiguous IDs.
3. Add `audit_compliance` as a lightweight compliance report for diff text or rule-citation text.
4. Keep all tools deterministic and local.
5. Do not add runtime dependencies.

**Acceptance criteria:**
- [ ] MCP tool registry exposes `lookup_rule`.
- [ ] MCP tool registry exposes `validate_against_rules`.
- [ ] MCP tool registry exposes `audit_compliance`.
- [ ] Tools return machine-readable JSON.
- [ ] Unknown rule IDs fail clearly.
- [ ] Existing MCP tests pass.
- [ ] `npm test` count increases.

**Files allowed:**
- `scripts/mcp-server/tool-registry.mjs`
- `scripts/mcp-server/tools.mjs`
- `scripts/mcp-server/constants.mjs`
- `tests/mcp-server.test.mjs`
- `docs/api-contract.md`
- `docs/flow-overview.md`
- `docs/plan/phase-3-anti-halu.md`

---

## Task 3.4: Add Reflection Citation Audit

**Goal:** Prevent drift where prompts mention reflection or citations but do not validate rule IDs.

**Steps:**
1. Add `scripts/audit-reflection-citations.mjs`.
2. Validate the reflection block snippets in canonical prompts and checklists.
3. Validate all cited rule IDs resolve through the same parser used by rule ID uniqueness audit.
4. Wire the audit into `npm run validate`.
5. Add operations test coverage for machine-readable output.

**Acceptance criteria:**
- [ ] `npm run audit:reflection-citations` exists.
- [ ] `npm run validate` includes the audit.
- [ ] Audit fails on unknown rule IDs.
- [ ] Audit fails when required reflection snippets are missing.
- [ ] `npm test` count increases.

**Files allowed:**
- `scripts/audit-reflection-citations.mjs`
- `scripts/validate.mjs`
- `package.json`
- `tests/operations.test.mjs`
- `docs/flow-overview.md`
- `docs/plan/phase-3-anti-halu.md`

---

## Task 3.5: Add Offline Anti-Halu Evaluation

**Goal:** Produce a reproducible benchmark artifact before claiming quality improvement.

**Steps:**
1. Add fixtures that represent common hallucination risks:
   - user requests that conflict with rules;
   - missing docs claims;
   - public API change without docs;
   - fake dependency/setup claims;
   - uncited rule-compliance claims.
2. Add an offline scorer that checks for:
   - valid rule ID citation;
   - no fake rule IDs;
   - correct refusal or compliant alternative for rule conflicts;
   - no unsupported quality/performance claims.
3. Emit `benchmarks/results/anti-halu-phase-3-2026-05-16.json`.
4. Keep the benchmark deterministic and provider-free.

**Acceptance criteria:**
- [ ] Anti-halu fixture set exists.
- [ ] Offline scorer exists.
- [ ] Benchmark JSON exists.
- [ ] Benchmark report includes pass rate and failure categories.
- [ ] `npm test` count does not drop.
- [ ] `npm run validate` passes.

**Files allowed:**
- `benchmarks/anti-halu/**`
- `benchmarks/results/anti-halu-phase-3-2026-05-16.json`
- `package.json`
- `tests/operations.test.mjs`
- `docs/plan/phase-3-anti-halu.md`

---

## Task 3.6: Run Phase 3 Measurement and Update Outcome

**Goal:** Close Phase 3 with numbers that decide whether Phase 4 retrieval is needed.

**Steps:**
1. Run the anti-halu benchmark.
2. Run cache simulation if prompt surface changed enough to affect Layer 1/2.
3. Run `npm test`.
4. Run `npm run validate`.
5. Run `npm run gate:release`.
6. Write `docs/plan/phase-3-outcome.md` with:
   - implemented mechanisms;
   - benchmark pass rate;
   - citation validity rate;
   - false-positive or false-negative risks;
   - token/caching impact;
   - Phase 4 retrieval recommendation.
7. Update `docs/plan/00-context.md`.
8. Update `docs/plan/HANDOFF-STATE.md`.
9. Keep `4.0.0-rc.1` unpublished.

**Acceptance criteria:**
- [ ] `docs/plan/phase-3-outcome.md` exists.
- [ ] Anti-halu benchmark JSON exists.
- [ ] `npm test` passes with count >= 167.
- [ ] `npm run validate` passes with 0 failures.
- [ ] `npm run gate:release` passes.
- [ ] Phase 4 trigger decision is reported.
- [ ] Git tracked working tree is clean after local commit.
- [ ] No push and no publish occurred.

---

## Gates

### Gate A - Prompt Contract Integrity

Stop only if one of these occurs:

- Anti-sycophancy wording requires a public API or CLI behavior change.
- Reflection block would require exposing hidden chain-of-thought.
- The needed prompt changes make Layer 1/2 volatile.

If none occur, continue automatically and log the contract in the outcome.

### Gate B - Tooling Integrity

Stop only if one of these occurs:

- MCP tools would need a runtime dependency.
- Rule lookup cannot be implemented from local files deterministically.
- Compliance audit needs provider generation calls.

If none occur, continue automatically.

### Gate C - Phase 4 Trigger Decision

At Phase 3 closeout, report:

- anti-halu benchmark pass rate;
- valid citation rate;
- unresolved rule-miss categories;
- token/caching impact;
- whether Phase 4 retrieval is needed.

Phase 4 implementation or skip is strategic. Stop at this gate and ask for maintainer approval.

---

## Success Metrics

| Metric | Target |
|---|---:|
| Valid rule ID citation rate | 100% in offline benchmark |
| Unknown rule ID count | 0 |
| Anti-halu benchmark pass rate | >= 80% for deterministic offline checks |
| Test count | >= 167 |
| Validate failures | 0 |
| Runtime dependencies added | 0 |
| Provider generation API calls | 0 |

---

## Decision Log Seed

Decisions to log in `phase-3-outcome.md` as they are implemented:

- Keep reflection bounded to rule IDs plus one-line rationale.
- Use local deterministic MCP validation tools rather than MCP rule delivery.
- Defer retrieval to Phase 4 unless Phase 3 benchmark exposes miss-rate above the locked threshold.
- Keep `4.0.0-rc.1` unpublished until Phase 5.
