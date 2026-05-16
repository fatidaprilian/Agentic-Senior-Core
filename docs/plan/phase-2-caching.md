# Phase 2 - Caching Layer

> **Status:** Ready for execution. GATE C Option A was accepted on 2026-05-16.
> **Estimated effort:** 8-14 active hours, depending on provider-matrix depth and benchmark wiring.
> **Prerequisite:** Phase 1 complete, `4.0.0-rc.1` prepared locally, `npm publish` not run.

---

## TUJUAN PHASE 2

Phase 2 turns the D4 "Three-Layer Sandwich" caching decision into a measurable repo contract. This repository does not own a live LLM gateway, so Phase 2 must not pretend to call provider generation APIs or magically enable caching for every IDE. The correct deliverable is a provider-aware cache layer contract, benchmark simulation, and validation gate that downstream agents or integrations can use without guessing where stable and dynamic prompt content belongs.

**Goal substantif user:**
- Reduce effective warm input cost without deleting rule substance.
- Keep stable governance content at the front of prompts so provider caches can hit.
- Prove the expected warm-cache impact with reproducible JSON.
- Keep provider behavior honest: native explicit caching where supported, automatic caching where provider-owned, and estimates clearly marked.
- Preserve `4.0.0-rc.1` as unpublished until Phase 5.

---

## EVIDENCE BASE

### Repo evidence

Source of truth for Phase 2:
- `docs/plan/research-foundation.md` D4 locks the Three-Layer Sandwich.
- `docs/plan/phase-1-outcome.md` records the Phase 1 final token totals.
- `benchmarks/results/baseline-2026-05-16.json` is the current dated benchmark file after Phase 1 migration.
- `git show c6a35d3:benchmarks/results/baseline-2026-05-16.json` is the locked Phase 0 comparison baseline.

Current Phase 1 totals for `with_loaded_rules`:

| Provider | Current total | Phase 0 total | Delta | Accurate |
|---|---:|---:|---:|---|
| Anthropic | 84,831 | 77,950 | +8.83% | No |
| OpenAI | 84,763 | 77,861 | +8.86% | Yes |
| Gemini | 90,900 | 83,068 | +9.43% | Yes |

### Live official docs verified on 2026-05-16

Use these as the Phase 2 provider source set:

| Provider | Official source | Relevant finding |
|---|---|---|
| Anthropic | `https://platform.claude.com/docs/en/build-with-claude/prompt-caching` | `cache_control` marks cache breakpoints. Default cache lifetime is 5 minutes. 1-hour TTL is available with `ttl: "1h"`. Cache write/read multipliers are documented: 5-minute write 1.25x, 1-hour write 2.0x, read 0.1x base input price. Claude Sonnet 4.5 minimum cacheable prompt length is 1,024 tokens. |
| OpenAI | `https://developers.openai.com/api/docs/guides/prompt-caching` | Prompt caching is automatic on supported models for prompts of 1,024 tokens or more. Exact prefix matches matter; static content belongs first and dynamic content last. Usage exposes `cached_tokens`. `prompt_cache_key` can improve routing. |
| Gemini | `https://ai.google.dev/gemini-api/docs/caching` | Gemini has implicit caching on Gemini 2.5+ and explicit cached content. Model minimums differ: Gemini 2.5 Flash is 1,024 tokens and Gemini 2.5 Pro is 4,096 tokens. Explicit caches have TTL and can be used for repeated repository analysis. |

Do not hardcode claims from non-official blog posts in Phase 2. If a provider has no current official caching docs or pricing source, mark the projection as estimated and keep the provider out of blocking gates.

---

## DECISIONS YANG SUDAH FINAL

### D4: Three-Layer Sandwich

Prompt ordering is locked:

1. **Layer 1 - Static Prefix:** stable identity, canonical instruction surface, tool definitions, and cache policy metadata.
2. **Layer 2 - Semi-Static Context:** project AGENTS.md, selected stable rules, selected prompts, loaded skills, and generated adapter context that is stable for the current task family.
3. **Layer 3 - Dynamic Suffix:** user request, code snippets, diffs, command output, volatile timestamps, retrieved content, and conversation history.

Layer 1 and Layer 2 are cache candidates. Layer 3 is not cached.

### Provider priority

Implement the measurable contract in this order:

1. Anthropic first because `cache_control` gives explicit breakpoints and exact read/write multipliers.
2. OpenAI second because automatic prefix caching rewards stable ordering and exposes `cached_tokens`, but pricing is model-specific.
3. Gemini third because explicit cached content is useful, but it requires provider-specific cache object lifecycle.
4. Grok, DeepSeek, Qwen stay estimate-only unless current official docs and SDK/API affordances are verified during the task.

### No runtime delivery dependency

Phase 2 must not add a runtime dependency just to model caching. Dev-only benchmark dependencies are allowed if they are small, maintained, and justified. Generation API calls are out of scope.

---

## SCOPE AND BOUNDARY

### In scope

- Define a cache layer contract for prompt assembly.
- Add deterministic cacheable/dynamic prompt segmentation for the token benchmark harness.
- Add an offline warm-cache economics simulator.
- Add provider metadata with source URL and `verifiedAt`.
- Add validation that blocks dynamic content from stable cache layers.
- Update docs and state to reflect Phase 2 readiness.
- Produce a Phase 2 benchmark JSON under `benchmarks/results/`.

### Out of scope

- Provider generation calls.
- Real cache creation against paid APIs.
- Retrieval, embeddings, and vector search. That remains Phase 4 conditional.
- Reflection block and anti-halu enforcement. That remains Phase 3.
- Publishing `4.0.0-rc.1`.
- Runtime dependency additions.
- Changing the v4 rule format from Phase 1.

### Hard boundaries

- Do not estimate successful cache hits when measurement or simulation fails.
- Do not move user requests, diffs, command outputs, or timestamps into a cacheable layer.
- Do not reorder rule content in a way that breaks existing scope routing or citations.
- Do not hide provider limitations. Mark estimates with `accurate=false` or `projectionQuality`.
- Do not treat OpenAI, Gemini, or Anthropic as interchangeable; each has different cache affordances.

---

## CACHE LAYER CONTRACT

Phase 2 uses this logical shape:

```json
{
  "schemaVersion": "cache-layer-contract-v1",
  "layers": [
    {
      "id": "layer-1-static-prefix",
      "cachePolicy": "stable-cache-candidate",
      "allowedInputs": ["AGENTS.md", "adapter-import-bridges", "tool-definitions", "provider-cache-policy"],
      "forbiddenInputs": ["user-message", "diff", "command-output", "timestamp"]
    },
    {
      "id": "layer-2-semi-static-context",
      "cachePolicy": "task-family-cache-candidate",
      "allowedInputs": ["selected-rules", "selected-prompts", "review-checklists", "loaded-skills"],
      "forbiddenInputs": ["volatile-retrieval", "session-log", "test-output"]
    },
    {
      "id": "layer-3-dynamic-suffix",
      "cachePolicy": "never-cache",
      "allowedInputs": ["user-message", "code-snippets", "diffs", "command-results", "conversation-history"]
    }
  ]
}
```

The benchmark harness should produce the contract from the real assembled benchmark fixtures, not from a hand-written ideal prompt.

---

## TASK BREAKDOWN

### Task 2.1: Lock Cache Layer Contract and Provider Matrix

**Tujuan:** Convert D4 into a concrete local contract before writing benchmark code.

**Steps:**
1. Add a compact provider matrix to the Phase 2 implementation surface. Prefer a JSON or JS module over prose-only data.
2. Include source metadata per provider:
   - `sourceUrl`
   - `verifiedAt`
   - `cacheMode` (`explicit-breakpoint`, `automatic-prefix`, `explicit-cached-content`, or `estimate-only`)
   - `minimumCacheableTokens`
   - `costModel`
3. Add Anthropic multipliers exactly from official docs:
   - 5-minute write: 1.25x
   - 1-hour write: 2.0x
   - cache read: 0.1x
4. For OpenAI and Gemini, record the mechanics and thresholds, but make cost multipliers model-configured or unknown unless a current official pricing entry is encoded with source metadata.
5. Document that Phase 2 produces a contract and simulator, not live provider cache writes.

**Acceptance criteria:**
- [ ] Provider matrix exists and is imported by the benchmark/simulator code.
- [ ] Source metadata includes official URLs and `verifiedAt: "2026-05-16"`.
- [ ] Anthropic cost model includes read/write multipliers.
- [ ] OpenAI/Gemini entries avoid fake universal pricing.
- [ ] No runtime dependency is added.

**Files allowed:**
- `benchmarks/token-usage/lib/provider-cache-matrix.mjs`
- `benchmarks/token-usage/lib/provider-cache-matrix.test.mjs`
- `docs/plan/phase-2-caching.md`

---

### Task 2.2: Build Cache Layer Segmentation for Benchmarks

**Tujuan:** Split existing benchmark prompts into stable and dynamic layers using real fixture assembly.

**Steps:**
1. Extend benchmark shared utilities without changing Phase 0/Phase 1 result shape.
2. Add a new builder that returns:
   - `layer_1_static_prefix`
   - `layer_2_semi_static_context`
   - `layer_3_dynamic_suffix`
   - `full_prompt`
3. Keep existing `always_included` and `with_loaded_rules` scenarios intact for historical comparisons.
4. Hash each layer with a stable algorithm such as SHA-256 to detect accidental reordering.
5. Ensure the dynamic layer includes the fixture user message and any volatile context.

**Acceptance criteria:**
- [ ] Existing `npm test` still passes.
- [ ] New tests prove Layer 1 hash stays stable across fixtures.
- [ ] New tests prove Layer 3 differs when the user message differs.
- [ ] Existing baseline runner output remains backward-compatible.
- [ ] No dynamic fields appear in Layer 1 or Layer 2.

**Files allowed:**
- `benchmarks/token-usage/runners/_shared.mjs`
- `benchmarks/token-usage/lib/cache-layer-contract.mjs`
- `benchmarks/token-usage/lib/cache-layer-contract.test.mjs`
- `tests/*` only if the repo test entrypoint needs a dedicated test file.

---

### Task 2.3: Add Offline Warm-Cache Simulator

**Tujuan:** Produce reproducible cold vs warm effective-token estimates without calling generation APIs.

**Steps:**
1. Add a script that reads the current benchmark assembly and provider matrix.
2. For each fixture/provider, compute:
   - total input tokens
   - cache-eligible Layer 1 tokens
   - cache-eligible Layer 1 + 2 tokens
   - dynamic Layer 3 tokens
   - first-request effective token cost
   - warm-read effective token cost
   - break-even read count
3. For Anthropic, use the official multiplier model.
4. For OpenAI and Gemini, calculate cacheable-token eligibility and usage-field expectations. Only compute money/effective cost when a model-specific multiplier is present in the matrix.
5. Emit `benchmarks/results/cache-phase-2-YYYY-MM-DD.json`.

**Acceptance criteria:**
- [ ] Script emits machine-readable JSON.
- [ ] JSON separates measured token counts from economic projections.
- [ ] Projections include `accurate`, `projectionQuality`, or equivalent flags.
- [ ] Anthropic warm effective token math is reproducible from matrix constants.
- [ ] No generation API is called.

**Files allowed:**
- `benchmarks/token-usage/run-cache-simulation.mjs`
- `benchmarks/token-usage/lib/cache-economics.mjs`
- `benchmarks/token-usage/lib/cache-economics.test.mjs`
- `benchmarks/results/cache-phase-2-2026-05-16.json`
- `package.json` only for scripts/test entrypoints.

---

### Task 2.4: Add Provider Request Shape Blueprints

**Tujuan:** Give downstream integrations exact request-shape guidance without forcing this package to become an LLM gateway.

**Steps:**
1. Add a docs or generated-report section that shows provider-specific mapping:
   - Claude: `cache_control` on Layer 1 and optionally Layer 2.
   - OpenAI: static prefix ordering plus stable `prompt_cache_key` guidance.
   - Gemini: explicit cached content for stable corpus and implicit prefix ordering for Gemini 2.5+.
2. Include "what invalidates cache" warnings:
   - tool/schema changes
   - timestamps in cacheable layers
   - volatile user request blocks before stable context
   - provider/model changes
3. Keep code samples minimal and clearly non-secret.

**Acceptance criteria:**
- [ ] Provider blueprints are linked from `docs/plan/phase-2-caching.md`.
- [ ] Examples do not contain real API keys.
- [ ] Each provider notes how to observe cache usage in response metadata.
- [ ] OpenAI and Gemini examples do not claim exact savings unless pricing metadata exists.

**Files allowed:**
- `docs/plan/cache-provider-request-shapes.md`
- `docs/plan/phase-2-caching.md`

---

### Task 2.5: Add Cache Layer Audit and Validate Gate

**Tujuan:** Prevent future drift where dynamic content accidentally enters a cacheable prefix.

**Steps:**
1. Add `scripts/audit-cache-layer-contract.mjs`.
2. Validate:
   - provider matrix source metadata exists
   - cache layer IDs are unique
   - Layer 1 and Layer 2 deny known volatile markers
   - Layer 3 is present in every simulated fixture
   - result JSON schema is stable
3. Wire script into `npm run validate`.
4. Add tests for failure behavior if practical.

**Acceptance criteria:**
- [ ] `npm run audit:cache-layer-contract` exists.
- [ ] `npm run validate` includes the audit.
- [ ] Audit fails on volatile markers in cacheable layers.
- [ ] Validate count increases from 557.
- [ ] `npm test` count does not drop.

**Files allowed:**
- `scripts/audit-cache-layer-contract.mjs`
- `scripts/validate.mjs`
- `package.json`
- `tests/operations.test.mjs`

---

### Task 2.6: Run Phase 2 Measurement and Update Outcome

**Tujuan:** Close Phase 2 with numbers that can drive Phase 3.

**Steps:**
1. Run the cache simulation.
2. Run `npm test`.
3. Run `npm run validate`.
4. Run `npm run gate:release` before final phase closeout.
5. Write `docs/plan/phase-2-outcome.md` with:
   - provider matrix summary
   - cold vs warm effective token table
   - cacheable-token ratios
   - known estimate gaps
   - Phase 3 anti-halu recommendation
6. Update `docs/plan/00-context.md`.
7. Update `docs/plan/HANDOFF-STATE.md`.
8. Keep `4.0.0-rc.1` unpublished.

**Acceptance criteria:**
- [ ] `docs/plan/phase-2-outcome.md` exists.
- [ ] `benchmarks/results/cache-phase-2-YYYY-MM-DD.json` exists.
- [ ] `npm test` passes with count >= 145.
- [ ] `npm run validate` passes with 0 failures.
- [ ] `npm run gate:release` passes.
- [ ] Git tracked working tree is clean after local commit.
- [ ] No push and no publish occurred.

---

## GATES

### GATE A - Provider Matrix Integrity

Stop only if one of these occurs:
- Official provider docs contradict D4.
- Anthropic multipliers or minimum cacheable token thresholds cannot be verified.
- Implementing Phase 2 requires a runtime dependency.
- The package would need to become a provider gateway to produce honest output.

If none occur, continue automatically and log the provider matrix in the outcome.

### GATE B - Cache Simulation Integrity

Stop if:
- Simulation cannot distinguish measured tokens from economic projections.
- Warm-cache math needs fabricated pricing for OpenAI or Gemini.
- Layer segmentation puts dynamic content in Layer 1 or Layer 2.
- Any provider result claims `accurate=true` without native measurement or official source metadata.

### GATE C - Phase 2 Complete

At Phase 2 closeout, report:
- cacheable token percentage
- Anthropic warm effective token estimate
- OpenAI/Gemini eligibility numbers
- validation/test/gate results
- whether Phase 3 can start

Do not publish the RC at this gate.

---

## SUCCESS METRICS

| Metric | Target |
|---|---:|
| Layer 1 static prefix stability | same hash across all 10 fixtures |
| Layer 3 dynamic presence | present in 10/10 fixtures |
| Anthropic cache eligibility | Layer 1 >= model minimum for Sonnet 4.5 or documented as below threshold |
| Warm effective token estimate | documented in cache Phase 2 JSON |
| Validate gate | pass, 0 failures |
| Test count | >= 145 |
| Runtime dependencies | 0 added |
| Publish state | not published |

---

## NOTES FOR AGENT

- Treat Phase 2 as measurement and integration-contract work, not provider-side execution.
- Keep official source URLs in data or docs, not only in chat.
- Prefer deterministic modules and tests over hand-maintained calculations.
- Use the existing benchmark harness and do not replace Phase 0/Phase 1 JSON shape.
- Commit locally after each complete task if code changes are substantial.
- Do not push.
- Do not run `npm publish`.

