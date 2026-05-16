# Phase 2 Outcome - Caching Layer

> **Status:** Completed on 2026-05-16. Phase 3 can start after maintainer approval.
> **Scope:** Model provider cache metadata, split benchmark prompts into cacheable layers, simulate warm-cache economics, and add a validation gate that prevents dynamic content from entering cacheable prefixes.

---

## Executive Summary

Phase 2 implemented the three-layer caching contract from D4 without turning this package into a live provider gateway:

- Layer 1: static governance prefix, cacheable.
- Layer 2: semi-static project context, cacheable.
- Layer 3: dynamic user/request content, never cacheable.

The benchmark harness now emits cache-layered prompt contracts from the same fixtures used by Phase 0 and Phase 1. The cache simulation writes `benchmarks/results/cache-phase-2-2026-05-16.json` with 120 rows: 10 fixtures, 6 providers, and 2 scenarios.

The strongest result is the Anthropic 5-minute prompt-cache projection. For `with_loaded_rules`, the average cold input is 8,483.1 tokens and the average warm-read effective input is 907.26 tokens. That is an 89.31% effective-token reduction on repeat reads, using the documented Anthropic cache read multiplier.

---

## Provider Matrix

| Provider | Cache mode | Source status | Projection status |
|---|---|---|---|
| Anthropic | explicit breakpoint | official docs verified 2026-05-16 | official multiplier |
| OpenAI | automatic prefix | official docs verified 2026-05-16 | eligibility-only |
| Gemini | explicit cached content plus implicit prefix ordering | official docs verified 2026-05-16 | eligibility-only |
| Grok | estimate-only | no official cache source locked | no economic projection |
| DeepSeek | estimate-only | no official cache source locked | no economic projection |
| Qwen | estimate-only | no official cache source locked | no economic projection |

OpenAI and Gemini are intentionally not assigned fabricated universal savings multipliers. Their results report cache eligibility and request-shape guidance only.

---

## Cache Simulation Results

Source of truth: `benchmarks/results/cache-phase-2-2026-05-16.json`.

| Provider | Scenario | Avg total input | Avg Layer 1+2 cacheable | Cacheable ratio | Eligible fixtures | Avg warm-read effective | Projection |
|---|---|---:|---:|---:|---:|---:|---|
| Anthropic | `always_included` | 2,719.5 | 2,654.0 | 97.59% | 10/10 | 330.90 | official multiplier |
| Anthropic | `with_loaded_rules` | 8,483.1 | 8,417.6 | 99.23% | 10/10 | 907.26 | official multiplier |
| OpenAI | `always_included` | 2,719.5 | 2,654.0 | 97.59% | 10/10 | n/a | eligibility-only |
| OpenAI | `with_loaded_rules` | 8,483.1 | 8,417.6 | 99.23% | 10/10 | n/a | eligibility-only |
| Gemini | `always_included` | 2,719.5 | 2,654.0 | 97.59% | 10/10 | n/a | eligibility-only |
| Gemini | `with_loaded_rules` | 8,483.1 | 8,417.6 | 99.23% | 10/10 | n/a | eligibility-only |
| Grok | `always_included` | 2,719.5 | 2,654.0 | 97.59% | 0/10 | n/a | none |
| Grok | `with_loaded_rules` | 8,483.1 | 8,417.6 | 99.23% | 0/10 | n/a | none |
| DeepSeek | `always_included` | 2,719.5 | 2,654.0 | 97.59% | 0/10 | n/a | none |
| DeepSeek | `with_loaded_rules` | 8,483.1 | 8,417.6 | 99.23% | 0/10 | n/a | none |
| Qwen | `always_included` | 2,719.5 | 2,654.0 | 97.59% | 0/10 | n/a | none |
| Qwen | `with_loaded_rules` | 8,483.1 | 8,417.6 | 99.23% | 0/10 | n/a | none |

Anthropic break-even read count is 2 for both scenarios. The first request is more expensive than a cold uncached request because the cache write multiplier applies. The second request is where the cached path becomes cheaper.

---

## Cache Layer Integrity

The new `audit:cache-layer-contract` gate validates:

- provider cache metadata and official-source timestamps;
- cache layer ID uniqueness and stable layer definitions;
- Layer 1 and Layer 2 exclusion of fixture-specific user messages;
- Layer 3 presence for every fixture;
- cache simulation JSON shape and result count;
- no fabricated OpenAI or Gemini universal pricing multiplier.

The audit is wired into `npm run validate`, so future changes that leak dynamic fixture text into cacheable layers fail before release.

---

## Known Estimate Gaps

- Token counts in the cache simulation use deterministic offline `tiktoken-cl100k_base` estimates. This keeps the simulation reproducible and avoids generation or provider token-count APIs.
- Anthropic economic projections use official prompt-caching multipliers, but the input token count remains the offline estimate.
- OpenAI and Gemini cache economics require model-specific pricing metadata. Phase 2 reports eligibility only.
- Grok, DeepSeek, and Qwen remain estimate-only until official cache semantics and cost documentation are locked.

---

## Phase 3 Recommendation

Start Phase 3 anti-halu work from the stable rule IDs and cache-layer contract that now exist:

1. Add the low-cost pre-prompt anti-sycophancy and rule-citation requirement.
2. Add a bounded reflection block that cites numbered rule IDs without dumping full rule prose into Layer 3.
3. Keep post-hoc validation outside the prompt path where possible, using MCP or local audits as the enforcement layer.

This should preserve the Phase 2 cache win: stable governance stays in Layer 1/2, while task-specific evidence and generated citations stay in Layer 3.

---

## Gate Results

- `npm run benchmark:cache-phase-2`: wrote `benchmarks/results/cache-phase-2-2026-05-16.json`.
- `npm test`: 167/167 passing.
- `npm run validate`: 562 passing, 0 failing, 2 existing warnings.
- `npm run gate:release`: passing.
- `npm publish`: not run.
- `git push`: not run.

---

## Gate C Resolution

Phase 2 is complete and Phase 3 can start after maintainer approval. The RC remains local and unpublished, as required by the accepted Phase 1 GATE C Option A.
