# Phase 5 - Hardening And Adoption

> **Status:** Ready for execution after Gate A review of this plan. Generated 2026-05-16 following Gate C Option A: accept Phase 3, skip Phase 4 retrieval, proceed to Phase 5.
> **Estimated effort:** 10-16 active hours, depending on coverage uplift scope and supply-chain audit depth.
> **Prerequisite:** Phase 0/1/2/3 complete. `4.0.0-rc.1` is locked locally and unpublished. `git push` and `npm publish` have not been run.
> **Locked sources:** D1-D6 in `docs/plan/research-foundation.md`; Gate C resolution recorded in `docs/plan/phase-3-outcome.md`.

---

## Objective

Phase 5 turns the validated v4 governance pack into a publishable release without breaking the lossless, honest-measurement contract that Phases 0-3 established. The deliverable is a v4.0.0 candidate that:

1. Tells the public surface (README, CHANGELOG, integration playbook, FAQ) the truth about what v4 changes, what numbers mean, and which integrations measurably benefit.
2. Ships a single reproducible benchmark bundle that any reader can re-run.
3. Closes supply-chain and install-size hygiene gaps before publish.
4. Lifts test count and coverage toward the locked Phase 5 success-metric targets without inflating tests with low-value coverage.
5. Stops at a release decision gate (Gate D). Publishing `4.0.0` is strategic (Kategori C) and requires explicit maintainer approval.

Phase 5 must not:

- Add retrieval (still Phase 4, deferred).
- Add runtime dependencies.
- Inflate tests by adding low-value or tautological coverage.
- Publish `4.0.0` without explicit Gate D approval.
- Re-debate D1-D6 or any Phase 1-3 locked decisions.
- Make universal caching claims that mix integration modes.

---

## Source Constraints

### Repo evidence (verified at plan generation time)

- `docs/plan/00-context.md` records Phase 0/1/2/3 completion; Phase 4 is Gate C resolved as skipped.
- `docs/plan/phase-1-outcome.md`: 15 rules migrated, OpenAI native aggregate `with_loaded_rules` delta `+8.86%` versus locked Phase 0 baseline (under the +10% cap).
- `docs/plan/phase-2-outcome.md` plus the Phase 3 refresh: Anthropic `with_loaded_rules` warm-read effective reduction `89.31%` for direct API integration (scope caveat applies for IDE wrappers per Task 6 scope-fix pass).
- `docs/plan/phase-3-outcome.md`: anti-halu offline benchmark pass rate `100%`, citation validity rate `100%`, unknown rule IDs `0`, runtime dependencies added `0`.
- `benchmarks/results/baseline-2026-05-16.json`, `benchmarks/results/cache-phase-2-2026-05-16.json`, `benchmarks/results/anti-halu-phase-3-2026-05-16.json` are the three primary artifacts that will be referenced by the v4.0.0 release bundle.
- Current `npm test` count: 176/176 passing.
- Current `npm run validate` count: 565 passing, 0 failing, 2 existing warnings.
- Current `npm run gate:release`: passing.
- Current `npm pack --dry-run` snapshot: package size ~264.7 kB, unpacked size ~1.0 MB, total files 154.
- `package.json` description: `Force your AI Agent to code like a Staff Engineer, not a Junior.`
- `package.json` `version`: `4.0.0-rc.1` (unpublished).

### Phase 5 success-metric targets (from `00-context.md`)

| Metric | Baseline | Phase 5 target | Source |
|---|---|---|---|
| Token per task (input, cold) | locked Phase 0 baseline | `-40%` versus Phase 0 cold | benchmarks/results/baseline-2026-05-16.json |
| Token per task (input, warm cache) | locked Phase 0 baseline | `-75%` versus Phase 0 cold (Anthropic, direct API only) | benchmarks/results/cache-phase-2-2026-05-16.json |
| Rule adherence rate (Claude) | unmeasured offline | `>=75%` via AgentHallu-style eval | future provider-backed eval (Kategori C escalate before run) |
| Rule adherence rate (GPT) | unmeasured offline | `>=65%` via AgentHallu-style eval | same |
| Rule adherence rate (open models) | unmeasured offline | `>=55%` via AgentHallu-style eval | same |
| Install size (core) | ~1.0 MB unpacked | `<=2 MB` unpacked, `<=300 kB` packed | npm pack --dry-run |
| Install size (with retrieval) | n/a | `<=120 MB` opt-in (Phase 4 deferred) | not enforced in Phase 5 |
| Test coverage statement | unknown | `>=80%` statements via Node native `--experimental-test-coverage` | npm test --coverage |
| OpenSSF Scorecard | unknown | `>=9.0` | scorecard CLI run locally; full score requires GitHub repository signal |
| Validate gate count | 565 | `>=800` | npm run validate |

Phase 5 will not lie about any of these. If a target is not reachable inside Phase 5 scope, log it honestly and either escalate (Kategori C) or defer with a documented reason.

### Hard boundaries

- Lossless content guarantee from Phase 1 stays intact; no rule prose is rewritten for token savings during Phase 5.
- Per-tool caching scope matrix from `research-foundation.md` D4 governs every public caching claim. README, CHANGELOG, FAQ, and the integration playbook MUST follow it.
- The 89.31% Anthropic warm-read figure is direct-API + Claude Code SDK programmatic only. IDE wrappers receive prefix stability without measurable per-pack saving.
- AgentHallu provider-backed evaluation is escalated (Kategori C) before any provider generation key is used. Phase 5 default path is the existing offline anti-halu benchmark only.
- `npm publish` requires Gate D approval. Phase 5 must verify that publish would succeed, but must not publish.

---

## Non-Goals

- Add or pilot retrieval, embeddings, or vector search.
- Add a runtime dependency to `dependencies` of `package.json`.
- Change canonical rule IDs locked in Phase 1.
- Re-run Phase 1 migration measurements or rewrite Phase 2/3 outcome numbers.
- Push branches, open PRs to upstream, or create release tags before Gate D.
- Modify `.agent-context/rules/*.md` content beyond cross-reference fixes if any link breaks during the public-surface refresh.
- Generate marketing-style language. Public surfaces stay factual and directive per `research-foundation.md` D2.

---

## Task Breakdown

### Task 5.1: Public Surface Refresh for v4

**Goal:** Update the public-facing surfaces so they describe the v4 governance pack truthfully and in sync with Phase 1-3 outcomes.

**Steps:**

1. Refresh `README.md`:
   - Update the "Current package version" line from `3.0.48` to `4.0.0-rc.1` and clarify that the RC is unpublished until Gate D.
   - Add a short "What's new in v4" subsection sourced from CHANGELOG `4.0.0-rc.1`.
   - Add a one-line pointer to `docs/integration-playbook.md` for the per-integration caching matrix.
   - Keep the language directive and factual; no marketing claims.
2. Refresh `CHANGELOG.md`:
   - Move the `Unreleased -> Documentation` scope-fix entry into a stable position relative to `4.0.0-rc.1`.
   - Add a v4.0.0 finalization stub under `Unreleased` only when Gate D approves; keep it absent until then.
3. Refresh `docs/integration-playbook.md`:
   - Add the per-tool caching scope matrix from `research-foundation.md` D4 in summary form, with the same source URLs.
   - Add a per-integration "How v4 reaches your agent" paragraph for: Claude Code SDK programmatic, Claude Code CLI, Cursor, Windsurf, Codex CLI, Kiro.
   - Defer to `docs/benchmark-reference.md` "Caching Effectiveness Reporting Format" for the JSON shape.
4. Refresh `docs/faq.md`:
   - Add: "Does v4 save 89% on caching for me?" Answer follows the scope caveat. Do not claim universal saving.
   - Add: "Why does v4 break v3 prose-shape parsers?" pointing to CHANGELOG migration guide.
5. Refresh `docs/doc-index.md`:
   - Ensure `docs/integration-playbook.md` and `docs/benchmark-reference.md` are referenced where appropriate.
6. Refresh `mcp.json` if any user-facing description still implies retrieval is shipped; align wording with `docs/architecture-vision.md`.

**Acceptance criteria:**

- [ ] `README.md` mentions `4.0.0-rc.1` and the unpublished status.
- [ ] `README.md` does not contain a universal "X% caching saving" claim.
- [ ] `docs/integration-playbook.md` carries the per-tool caching matrix and links to `docs/benchmark-reference.md`.
- [ ] `docs/faq.md` answers the caching-scope question and the v4 breaking-change question.
- [ ] `docs/doc-index.md` lists the new references where natural.
- [ ] `npm test`: count >=176, all pass.
- [ ] `npm run validate`: 0 failures, count >= current 565.
- [ ] `npm run gate:release`: pass.

**Files allowed:**

- `README.md`
- `CHANGELOG.md`
- `docs/integration-playbook.md`
- `docs/faq.md`
- `docs/doc-index.md`
- `mcp.json` (description fields only)
- `docs/plan/phase-5-hardening.md`

---

### Task 5.2: Test And Validate Coverage Uplift

**Goal:** Move from current `npm test` 176 and `npm run validate` 565 toward the Phase 5 targets (test coverage `>=80%` statements, validate count `>=800`) without inflating tests with low-value cases.

**Steps:**

1. Audit existing test surface to identify uncovered modules in `lib/`, `bin/`, `scripts/`, `benchmarks/`. Use `node --experimental-test-coverage` once to get a starting coverage map.
2. Prioritize coverage uplift on:
   - migration helper edge cases (split renderer, parser quirks);
   - cache-layer contract (already 99.23% cacheable ratio; add boundary tests for forbidden inputs);
   - reflection-citation audit (extra negative cases for unknown IDs);
   - MCP rule-validation tools (additional fixtures for `lookup_rule`, `audit_compliance`).
3. Audit existing validate gate to identify quick wins for new validate checks that catch real drift, not synthetic checks. Examples worth adding:
   - link integrity for `[REF:<PREFIX>-NNN]` resolved across `.agent-context/`;
   - frontmatter `keywords` cap (4-6) drift detection for new rule files;
   - OpenAPI-style negative test that AGENTS.md does not contain caching claims without integration-mode label.
4. Add tests and validate checks. Do not add tautological coverage.
5. Re-run `npm test`, `npm run validate`, `npm run gate:release`. Record final counts.

**Acceptance criteria:**

- [ ] `npm test` count strictly greater than 176, all pass. Stretch target: at least one of (a) statement coverage `>=80%` reported by Node native coverage; (b) test count `>=215`. If neither is reached, log the gap honestly with reasons in the outcome and escalate Kategori C if the gap is material.
- [ ] `npm run validate` count `>=700` (intermediate target). If `>=800` requires synthetic checks, stop at the highest honest count and log the reason.
- [ ] No test depends on network or provider APIs.
- [ ] No new runtime dependency added.

**Files allowed:**

- `tests/**`
- `benchmarks/**/*.test.mjs`
- `scripts/audit-*.mjs`
- `scripts/validate.mjs`
- `scripts/validate/**`
- `package.json` only for new audit script wiring
- `docs/plan/phase-5-hardening.md`

---

### Task 5.3: Supply-Chain And Security Hardening

**Goal:** Close low-cost, high-signal supply-chain gaps before publishing.

**Steps:**

1. Run `npm audit --omit=dev --json` and `npm audit --json` (full). Resolve any actionable High/Critical issues. Document any unresolved item with a clear reason in `docs/plan/phase-5-outcome.md`.
2. Verify `package-lock.json` is committed and current. Lockfile must match `package.json`.
3. Run `npm run sbom:generate` and verify the SBOM artifact is current. Add a release-bundle SBOM step in Task 5.5.
4. Run a local OpenSSF Scorecard check using the official scorecard CLI against the GitHub repository if available. Capture the report into `benchmarks/results/scorecard-2026-05-16.json` if reachable; otherwise log the missing prerequisite (e.g. GitHub auth) honestly without fabricating a score.
5. Verify `package.json` `files` whitelist still excludes test, plan, and benchmark sources from the published tarball. Run `npm pack --dry-run` and confirm the packed-file count is bounded.
6. Verify `.npmignore` and `package.json#files` do not ship `.env`, `.env.*`, `.agentic-backup`, `.agent-context/state/active-memory.json`, or any private artifact.
7. Sign-off note that no secret values were echoed during the run.

**Acceptance criteria:**

- [ ] `npm audit --omit=dev` reports 0 High and 0 Critical (or each remaining one is documented).
- [ ] `package-lock.json` is committed and consistent with `package.json`.
- [ ] SBOM artifact is generated successfully.
- [ ] Scorecard CLI either runs and reports a score, or its absence is logged honestly with the prerequisite.
- [ ] `npm pack --dry-run` shows packed size `<=300 kB` and unpacked size `<=2 MB`. If above, file list is reviewed and tightened.
- [ ] No `.env` or active-memory file appears in the packed file list.

**Files allowed:**

- `package.json` (only `files` array tightening; no version bump in this task)
- `package-lock.json`
- `.npmignore` (only if a real leak is found)
- `scripts/generate-sbom.mjs` (only for fixes; not a rewrite)
- `benchmarks/results/scorecard-2026-05-16.json` (created if scorecard runs)
- `docs/plan/phase-5-hardening.md`

---

### Task 5.4: Release Benchmark Bundle

**Goal:** Produce a single reproducible benchmark bundle that the v4.0.0 release will reference, without re-running Phase 1-3 measurements destructively.

**Steps:**

1. Add `scripts/build-release-benchmark-bundle.mjs` that:
   - reads the existing locked artifacts (`baseline-2026-05-16.json`, `cache-phase-2-2026-05-16.json`, `anti-halu-phase-3-2026-05-16.json`);
   - validates each top-level shape and integrity flags (e.g. `accurate`, `projectionQuality`, `integration_mode`, `scope_caveat`);
   - emits `benchmarks/results/release-bundle-4.0.0.json` containing references, hashes (SHA-256) of the source files, and a single non-marketing summary section.
2. Add an audit script `scripts/audit-release-bundle.mjs` that:
   - validates the bundle exists, all referenced files exist, and the recorded hashes match the current files;
   - is wired into `npm run validate`.
3. Do not regenerate Phase 0-3 numbers. Phase 5 only references and hashes.
4. Document the bundle in `docs/benchmark-reference.md` so future releases follow the same shape.

**Acceptance criteria:**

- [ ] `benchmarks/results/release-bundle-4.0.0.json` exists and references the three locked artifacts by hash.
- [ ] `npm run audit:release-bundle` exists and is part of `npm run validate`.
- [ ] Bundle does not contain any caching claim that omits integration mode.
- [ ] No new runtime dependency added.
- [ ] No source benchmark file was modified.

**Files allowed:**

- `scripts/build-release-benchmark-bundle.mjs`
- `scripts/audit-release-bundle.mjs`
- `scripts/validate.mjs` (wire-up only)
- `package.json` (script entries only)
- `benchmarks/results/release-bundle-4.0.0.json`
- `docs/benchmark-reference.md`
- `docs/plan/phase-5-hardening.md`

---

### Task 5.5: Adoption Surface (Per-Integration Playbook)

**Goal:** Translate the per-tool caching matrix and the per-integration JSON shape into a user-facing adoption playbook so downstream IDE users get one clear page.

**Steps:**

1. Add or expand a "Per-Integration Adoption" section in `docs/integration-playbook.md` covering: direct provider API, Claude Code SDK programmatic, Claude Code CLI, Cursor, Windsurf, Codex CLI, Kiro.
2. For each integration, document:
   - control surface for caching;
   - whether per-pack saving is measurable from the rules pack side;
   - the recommended rule-citation pattern (Bounded Reflection block from Phase 3);
   - a minimal "first task" example that uses one rule ID.
3. Cross-link `docs/benchmark-reference.md` "Caching Effectiveness Reporting Format" and `research-foundation.md` D4.
4. Keep the language factual and directive. Do not claim performance numbers per integration unless backed by a locked benchmark artifact.

**Acceptance criteria:**

- [ ] All 7 integrations have a section.
- [ ] Each section honestly states whether saving is measurable from the pack side.
- [ ] No integration section contains a fabricated saving percentage.
- [ ] `npm test`, `npm run validate`, `npm run gate:release` pass.

**Files allowed:**

- `docs/integration-playbook.md`
- `docs/doc-index.md` (linkage only)
- `docs/plan/phase-5-hardening.md`

---

### Task 5.6: Release Dry-Run And Version Finalization (Gate D Prep)

**Goal:** Verify the release path end-to-end without publishing, then stop at Gate D.

**Steps:**

1. Run `npm run gate:release` and `npm run forbidden-content-check` (or the equivalent already wired). Capture output.
2. Run `npm pack --dry-run` and review the file list one more time.
3. Confirm `package.json` `version` remains `4.0.0-rc.1` (Phase 5 does not bump to `4.0.0` without Gate D).
4. Compose the final release-note draft as a Phase 5 outcome appendix. The draft is candidate text only; it does not alter `CHANGELOG.md` until Gate D approves.
5. Compose the Gate D escalation report (format below). Stop. Do not run `npm publish`. Do not run `git push`.

**Acceptance criteria:**

- [ ] `npm run gate:release` passes.
- [ ] `npm pack --dry-run` shows the same packed-file scope verified in Task 5.3.
- [ ] `package.json` `version` is unchanged from `4.0.0-rc.1`.
- [ ] Phase 5 outcome contains the final release-note draft as an appendix.
- [ ] Gate D escalation is composed and presented to the maintainer.

**Files allowed:**

- `docs/plan/phase-5-hardening.md`
- `docs/plan/phase-5-outcome.md`
- `docs/plan/HANDOFF-STATE.md`

---

### Task 5.7: Phase 5 Outcome And State Refresh

**Goal:** Close Phase 5 with documented numbers, decisions, deferred items, and a clean handoff state.

**Steps:**

1. Write `docs/plan/phase-5-outcome.md` with:
   - public-surface refresh summary;
   - test/validate counts before and after Task 5.2;
   - supply-chain audit results;
   - release-bundle hashes;
   - adoption playbook delta;
   - Gate D status (pending or approved);
   - Phase 5 success-metric attainment status (each row: hit, partial with reason, deferred with reason).
2. Update `docs/plan/00-context.md` status table:
   - mark Phase 4 as `Skipped (Gate C 2026-05-16)`;
   - mark Phase 5 status accordingly;
   - update success metrics table with measured Phase 5 numbers.
3. Refresh `docs/plan/HANDOFF-STATE.md`.
4. Keep `4.0.0-rc.1` unpublished until Gate D.
5. Final commit.

**Acceptance criteria:**

- [ ] `docs/plan/phase-5-outcome.md` exists.
- [ ] `docs/plan/00-context.md` status table reflects Phase 4 skip and Phase 5 close-out.
- [ ] `docs/plan/HANDOFF-STATE.md` is current.
- [ ] No publish or push has occurred.
- [ ] Working tree is clean after final local commit.

**Files allowed:**

- `docs/plan/phase-5-outcome.md`
- `docs/plan/00-context.md`
- `docs/plan/HANDOFF-STATE.md`
- `docs/plan/phase-5-hardening.md`

---

## Gates

### Gate A - Plan Review

This is the only gate before execution starts. The plan above must be reviewed and approved before Task 5.1 begins. Approval can be a single word "go" if no adjustment is needed; otherwise the reviewer states adjustments and the plan is updated.

### Gate B - Coverage Pragmatism

After Task 5.2 measurement, if reaching `npm run validate >=800` would require synthetic or tautological checks, stop at the highest honest count, log the reason in the outcome, and escalate Kategori C. Do not pad coverage.

### Gate C - Supply-Chain Hard Findings

If `npm audit` surfaces an actionable High or Critical that requires a runtime-dependency update, escalate Kategori C with the diff impact analysis. Do not auto-add a runtime dependency to fix it.

### Gate D - Release Decision

After Task 5.6 dry-run completes, escalate to the maintainer with:

- final test count, validate count, gate-release status;
- packed/unpacked size and file count from `npm pack --dry-run`;
- supply-chain audit summary;
- public-surface diff summary;
- the release-note draft.

The maintainer chooses one of:

- Option A: Bump `4.0.0-rc.1` to `4.0.0`, publish, and tag. Recommended only when all Phase 5 acceptance criteria are met.
- Option B: Stay at `4.0.0-rc.1`, publish the RC under `next` dist-tag for selected adopters.
- Option C: Stay unpublished, queue a follow-up Phase 5.x cycle for any deferred metric.

Phase 5 itself does not run `npm publish`. The maintainer runs the chosen path or instructs the agent to run it.

---

## Success Metrics

| Metric | Target | Source |
|---|---|---|
| Public surfaces refreshed for v4 | README, CHANGELOG, FAQ, doc-index, integration-playbook | Task 5.1 |
| Test count | strictly greater than 176, stretch `>=215` | npm test |
| Validate count | `>=700`, stretch `>=800` | npm run validate |
| `npm audit --omit=dev` | 0 High, 0 Critical (or documented) | Task 5.3 |
| Packed size | `<=300 kB` | npm pack --dry-run |
| Unpacked size | `<=2 MB` | npm pack --dry-run |
| Release benchmark bundle | hashes verified through audit | Task 5.4 |
| Per-integration adoption sections | 7 integrations covered | Task 5.5 |
| Gate D escalation | composed, no publish | Task 5.6 |

Targets that are not yet reachable inside Phase 5 (provider-backed AgentHallu eval, OSSF Scorecard `>=9.0` requiring GitHub repo signal, install-size with retrieval) are logged honestly with the reason and either deferred to a follow-up cycle or escalated.

---

## Decision Log Seed

These are the auto-decided defaults Phase 5 will apply unless evidence overrides them. Log applied decisions with reasoning in `phase-5-outcome.md`.

- Keep `4.0.0-rc.1` unpublished until Gate D.
- Do not add a runtime dependency.
- Do not run any provider generation API call as part of Phase 5.
- AgentHallu provider-backed eval is escalated (Kategori C) before any provider key is wired.
- OpenSSF Scorecard run is best-effort; missing prerequisites (GitHub auth) are logged, not faked.
- `package.json` `files` whitelist is tightened only when a real leak is detected; not refactored speculatively.
- Coverage uplift prioritizes real-drift catchers over synthetic counts.
- Public surfaces follow the per-tool caching scope matrix verbatim; no universal saving claim.

---

## Notes For Agent

- Treat Phase 5 as integration and hygiene work, not feature development.
- Read `docs/plan/research-foundation.md` D4 (per-tool caching scope matrix) and `docs/benchmark-reference.md` "Caching Effectiveness Reporting Format" before editing any public-facing surface.
- Commit per task locally with format `feat(phase-5): <task description>` for code/script work and `docs(phase-5): <task description>` for docs-only changes.
- Do not push, do not publish.
- Stop at Gate D and escalate.
