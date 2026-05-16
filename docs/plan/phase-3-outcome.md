# Phase 3 Outcome - Anti-Halu Stack

> **Status:** Completed on 2026-05-16. Gate C requires maintainer approval before Phase 4 is skipped or implemented.
> **Scope:** Add anti-sycophancy, bounded reflection, deterministic rule validation tools, citation drift audits, and a provider-free anti-halu benchmark.

---

## Executive Summary

Phase 3 implemented the D6 three-mechanism anti-halu stack without adding runtime dependencies or provider generation calls:

- L1 pre-prompt: stricter rule authority and rule-ID citation requirements in `AGENTS.md`.
- L2 in-flight: bounded reflection format that cites rule IDs without exposing hidden chain-of-thought.
- L3 post-hoc: MCP rule lookup/compliance tools, reflection citation audit, and offline benchmark scoring.

The offline anti-halu benchmark passed all 5 fixtures with a 100% pass rate and 100% citation validity rate. The fixture set covers rule conflicts, missing docs claims, public API changes without docs, fake dependency/setup claims, and uncited compliance claims.

---

## Implemented Mechanisms

| Mechanism | Shipped surface | Validation |
|---|---|---|
| Anti-sycophancy and rule citation contract | `AGENTS.md`, `docs/flow-overview.md` | `npm run validate`, `npm run gate:release` |
| Bounded Reflection block | `AGENTS.md`, `.agent-context/review-checklists/pr-checklist.md` | `npm run validate`, `npm test` |
| MCP rule validation tools | `lookup_rule`, `validate_against_rules`, `audit_compliance` | MCP server tests |
| Reflection citation drift audit | `scripts/audit-reflection-citations.mjs` | `npm run audit:reflection-citations`, `npm run validate` |
| Offline anti-halu benchmark | `benchmarks/anti-halu/**` | `npm run benchmark:anti-halu`, operations tests |

---

## Benchmark Results

Source of truth: `benchmarks/results/anti-halu-phase-3-2026-05-16.json`.

| Metric | Result |
|---|---:|
| Fixture count | 5 |
| Passed fixtures | 5 |
| Failed fixtures | 0 |
| Pass rate | 100% |
| Citation validity rate | 100% |
| Unknown rule ID count | 0 |
| Runtime dependencies added | 0 |
| Provider generation API calls | 0 |

Failure categories were all zero:

- `rule_id_missing`: 0
- `rule_id_unknown`: 0
- `conflict_handling`: 0
- `alternative_missing`: 0
- `unsupported_claim`: 0

---

## Token And Cache Impact

Phase 3 changed stable prompt surfaces, so the cache simulation was rerun.

Source of truth: `benchmarks/results/cache-phase-2-2026-05-16.json`.

| Provider | Scenario | Avg total input | Avg Layer 1+2 cacheable | Eligible fixtures | Avg warm-read effective | Effective reduction |
|---|---|---:|---:|---:|---:|---:|
| Anthropic | `with_loaded_rules` | 8,588.7 | 8,523.2 | 10/10 | 917.82 | 89.31% |

The prior Phase 2 Anthropic `with_loaded_rules` average total input was 8,483.1 tokens. Phase 3 raised that by 105.6 tokens (+1.24%) while preserving the same 89.31% warm-read effective-token reduction. The cache split remains intact: Layer 1 and Layer 2 remain cacheable, while task-specific evidence and generated citations stay dynamic.

---

## Risks And Limits

- The benchmark is deterministic and provider-free. It validates expected response patterns, not live model behavior.
- The fixture set is intentionally small for Phase 3 closeout. It covers the highest-risk hallucination categories in the plan, but it is not a full AgentHallu-style trajectory benchmark.
- False positives can occur if a compliant response uses different refusal or alternative wording than the current marker set.
- False negatives can occur if a response cites valid rule IDs but still mishandles a nuanced rule conflict outside the fixture patterns.
- The benchmark does not prove cross-provider adherence rates yet. It provides a reproducible local floor before any future provider-backed evaluation.

---

## Gate Results

- `npm run benchmark:anti-halu`: wrote `benchmarks/results/anti-halu-phase-3-2026-05-16.json`.
- `npm run benchmark:cache-phase-2`: refreshed `benchmarks/results/cache-phase-2-2026-05-16.json`.
- `npm test`: 176/176 passing.
- `npm run validate`: 564 passing, 0 failing, 2 existing warnings.
- `npm run gate:release`: passing.
- `npm publish`: not run.
- `git push`: not run.

Existing validation warnings:

- `AGENTS.md does not contain any local manifest links`
- `package.json still has devDependencies; review whether they are necessary`

---

## Gate C Recommendation

Recommendation: skip Phase 4 retrieval for this release candidate and proceed to Phase 5 hardening.

Reasoning:

- Anti-halu benchmark pass rate is 100%, above the >=80% Phase 3 target.
- Citation validity is 100%, with zero unknown rule IDs.
- No unresolved rule-miss categories were observed in the offline benchmark.
- Warm-cache economics still hit 89.31% effective reduction on Anthropic `with_loaded_rules`.
- Runtime dependency count did not increase.
- The retrieval trigger should remain conditional until measured miss-rate exceeds 10%, active loaded rules exceed the practical context budget, or cache/token targets regress.

Gate C options:

- Option A: Accept Phase 3, skip Phase 4 retrieval for now, generate Phase 5 hardening plan. Recommended.
- Option B: Accept Phase 3, generate a narrow Phase 4 retrieval spike before Phase 5.
- Option C: Expand Phase 3 anti-halu fixtures before deciding Phase 4.

`4.0.0-rc.1` remains local and unpublished.
