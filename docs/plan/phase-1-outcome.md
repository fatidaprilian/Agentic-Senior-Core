# Phase 1 Outcome — Format Migration

> **Status:** Completed on 2026-05-16. Phase 2 is awaiting GATE C approval.
> **Scope:** Convert the internal rules pack to v4 numbered Markdown with YAML frontmatter and stable citation IDs.

---

## Executive Summary

Phase 1 migrated all 15 Layer 1 rule files to v4 format:

- YAML frontmatter with `id_prefix`, `title`, `scope`, and compact `keywords`.
- Stable section headings in `## <PREFIX>-NNN: <Title>` form.
- Lossless rule substance with 100% roundtrip overlap in migrated helper/review checks.
- Rule ID audit wired into `npm run validate`.

Final aggregate token result stays inside the revised +10% cap:

| Provider | Measurement | Phase 0 `with_loaded_rules` | Phase 1 final | Delta | Accurate |
|---|---:|---:|---:|---:|---|
| Anthropic | `cl100k_base` estimate fallback | 77,950 | 84,831 | +8.83% | No |
| OpenAI | native tiktoken | 77,861 | 84,763 | +8.86% | Yes |
| Gemini | native count-tokens API | 83,068 | 90,900 | +9.43% | Yes |

The primary comparator is OpenAI native because Phase 0 locked it as the high-confidence baseline. The final +8.86% result is below the +10% aggregate cap.

---

## ID Prefixes Locked

| Rule file | Prefix | Status |
|---|---:|---|
| `frontend-architecture.md` | `FE` | migrated |
| `architecture.md` | `ARCH` | migrated |
| `realtime.md` | `REAL` | migrated |
| `naming-conv.md` | `NAME` | migrated |
| `event-driven.md` | `EVT` | migrated |
| `performance.md` | `PERF` | migrated |
| `microservices.md` | `MS` | migrated |
| `testing.md` | `TEST` | migrated |
| `error-handling.md` | `ERR` | migrated |
| `database-design.md` | `DATA` | migrated |
| `security.md` | `SEC` | migrated |
| `efficiency-vs-hype.md` | `DEP` | migrated |
| `docker-runtime.md` | `DOCK` | migrated |
| `git-workflow.md` | `GIT` | migrated |
| `api-docs.md` | `API` | migrated |

The locked prefix table lives in `scripts/migrate-rule-format/id-prefix-table.mjs`.

---

## Per-File Measurements

OpenAI `gpt-4o-2024-08-06` tiktoken counts, comparing current files against Phase 0 commit `c6a35d3`.

| Rule file | Before chars | After chars | Before tokens | After tokens | Delta |
|---|---:|---:|---:|---:|---:|
| `frontend-architecture.md` | 11,342 | 11,971 | 2,174 | 2,431 | +257 (+11.82%) |
| `architecture.md` | 9,533 | 9,992 | 1,872 | 2,081 | +209 (+11.16%) |
| `realtime.md` | 907 | 1,149 | 169 | 242 | +73 (+43.20%) |
| `naming-conv.md` | 939 | 1,280 | 191 | 290 | +99 (+51.83%) |
| `event-driven.md` | 1,645 | 2,002 | 301 | 407 | +106 (+35.22%) |
| `performance.md` | 1,649 | 1,977 | 325 | 423 | +98 (+30.15%) |
| `microservices.md` | 2,182 | 2,514 | 398 | 499 | +101 (+25.38%) |
| `testing.md` | 2,115 | 2,412 | 389 | 488 | +99 (+25.45%) |
| `error-handling.md` | 2,315 | 2,568 | 447 | 540 | +93 (+20.81%) |
| `database-design.md` | 2,765 | 3,007 | 518 | 605 | +87 (+16.80%) |
| `security.md` | 2,791 | 3,043 | 540 | 635 | +95 (+17.59%) |
| `efficiency-vs-hype.md` | 2,674 | 3,006 | 490 | 605 | +115 (+23.47%) |
| `docker-runtime.md` | 4,302 | 4,576 | 823 | 924 | +101 (+12.27%) |
| `git-workflow.md` | 5,176 | 5,187 | 1,348 | 1,302 | -46 (-3.41%) |
| `api-docs.md` | 6,548 | 6,953 | 1,313 | 1,483 | +170 (+12.95%) |

Tiny files below 600 original OpenAI tokens were governed by the +120 token absolute overhead cap. All tiny-rule overheads stayed within that cap. Standard files stayed within the +15% per-file cap.

---

## Per-Fixture Aggregate Measurements

OpenAI native `with_loaded_rules` fixture deltas:

| Fixture | Phase 0 | Phase 1 final | Delta |
|---|---:|---:|---:|
| `01-init-react-typescript-tailwind` | 7,397 | 8,077 | +680 (+9.19%) |
| `02-add-billing-microservice` | 9,506 | 10,383 | +877 (+9.23%) |
| `03-scaffold-cli-tool-go` | 7,067 | 7,677 | +610 (+8.63%) |
| `04-redesign-dashboard-component` | 8,373 | 8,838 | +465 (+5.55%) |
| `05-add-page-transition-motion` | 8,364 | 8,829 | +465 (+5.56%) |
| `06-add-paginated-orders-list` | 8,097 | 9,058 | +961 (+11.87%) |
| `07-webhook-retry-dlq` | 7,105 | 8,002 | +897 (+12.62%) |
| `08-add-jwt-auth-flow` | 7,770 | 8,633 | +863 (+11.11%) |
| `09-split-large-nestjs-module` | 5,636 | 6,153 | +517 (+9.17%) |
| `10-review-pr-diff` | 8,546 | 9,113 | +567 (+6.63%) |

The per-fixture percentages can exceed +10% on high-rule-load fixtures; the locked cap is aggregate across all 10 fixtures.

---

## Gate Results

- `npm test`: 145/145 passing.
- `npm run validate`: 556 passing, 0 failing, 2 existing warnings.
- `audit:rule-id-uniqueness`: 15 migrated rule files, 0 pre-migration files, 69 section IDs, 4 `[REF:]` mentions, all resolving.
- `package.json` and `package-lock.json`: bumped to `4.0.0-rc.1`.
- `CHANGELOG.md`: includes `4.0.0-rc.1` breaking-change and migration-guide sections.
- `npm publish`: not run.

---

## Known Issues / Debt

- Phase 1 increased cold input tokens by +8.86% in the primary OpenAI comparator. This is accepted under the revised +10% aggregate cap because the format's primary value is stable citability for Phase 3, not raw cold-token reduction.
- `AGENTS.md` still has the existing non-blocking validator warning about no local manifest links.
- Anthropic counts remain `cl100k_base` estimates because the API count-tokens call was unavailable during Phase 0; OpenAI and Gemini remain the high-confidence comparators.
- `phase-2-caching.md` has not been generated. It waits for GATE C approval.

---

## Phase 2 Recommendation

Start Phase 2 with prompt caching for stable prefixes:

1. Cache Layer 1 static governance: `AGENTS.md`, root adapters, and stable rule routing metadata.
2. Cache Layer 2 semi-static project context: selected rule files and task-relevant stable docs.
3. Keep Layer 3 dynamic: user request, current code snippets, diffs, command results, and retrieved volatile context.

Rationale: Anthropic official docs price cache reads at 0.1x base input cost for prompt caching. Under that model, the cold +10% cap implies about 8,565 warm effective tokens, versus about 8,175 at the old +5% cap. The warm delta is about 390 effective tokens per request, so caching dominates the cost curve once Phase 2 is active.

Source: Anthropic prompt caching docs, `https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching`.

---

## Gate C Questions

1. Confirm Phase 1 is complete.
2. Approve Phase 2 caching direction or provide adjustments.
3. Keep `4.0.0-rc.1` unpublished until Phase 5 hardening, unless early adopter RC feedback is needed sooner.
