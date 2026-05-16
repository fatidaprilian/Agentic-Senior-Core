# Phase 1 — Format Migration

> **Status:** 🟡 Ready to execute (after GATE D approval)
> **Estimated effort:** 12-20 jam aktif (2-3 minggu kalender, tergantung availability)
> **Prerequisite:** Phase 0 complete (`phase-0-outcome.md`), Decision B = **B1 (hard cut at v4.0.0)**, baseline locked at `benchmarks/results/baseline-2026-05-16.json`

---

## TUJUAN PHASE 1

Phase 1 mengubah format internal rules pack dari prosa Markdown ad-hoc menjadi **numbered Markdown + YAML frontmatter dengan stable rule IDs**. Output adalah token efficiency yang terukur dan rule-citation surface yang siap dipakai Phase 3 anti-halu.

**Kenapa ini critical:** D1 (research-foundation.md) sudah lock decision ini berdasarkan EACL Findings 2026 (+6.74% accuracy untuk reasoning) dan Curse of Instructions paper (numbered list memitigasi degradation pada banyak instruksi). Tapi keputusan itu **belum divalidasi pada repo ini**. Phase 1 wajib measure dulu di 1 file pilot sebelum migrate semua.

**Goal substantif user:**
- Token efficiency terukur (target: 10-25% reduction per rule, validated against `baseline-2026-05-16.json`)
- Stable rule ID system yang Phase 3 reflection block bisa pakai (e.g. `FRONTEND-014`, `ARCH-002`)
- Lossless restructure — substansi rule tidak dibuang, hanya direstrukturisasi
- Tidak introduce new framework, library, or runtime dependency

---

## DECISIONS YANG SUDAH FINAL

Decision di bawah ini sudah locked sebelum Phase 1 mulai. Jangan re-debate.

### Decision B = B1: Hard Cut at v4.0.0

- Drop format lama. Migration tool wajib.
- Major version bump (v3.0.50 → v4.0.0).
- README dan CHANGELOG harus expose breaking change clearly.
- Backward-compat shim ditolak — repo ini bukan library yang dipakai jutaan user; honest break > silent ambiguity.

### Anthropic Counter Stays as Estimate

User declined top-up. Baseline numbers untuk Claude tetap pakai `tiktoken cl100k_base` estimate dengan `accurate=false` flag. Footnote permanen di `phase-0-outcome.md`. Phase 1 measurement comparator pakai OpenAI native (high confidence) dan Gemini native (high confidence) sebagai primary; Claude estimate sebagai cross-check.

### Migration Order: Big Files First

Sesuai recommendation Phase 0 outcome:
1. `frontend-architecture.md` (11,342 chars) — paling besar
2. `architecture.md` (9,533 chars) — kedua besar
3. Semua rule lain setelah pilot validation berhasil

Kalau pilot rule (frontend-architecture.md) gagal hit ≥10% token reduction target, **STOP** dan reconsider format choice (Task 1.4 GATE A).

---

## SCOPE & BOUNDARY

### In Scope
- Bikin format spec dokumen (canonical numbered Markdown + YAML frontmatter shape)
- Lock ID scheme untuk semua 15 rule files (bahkan yang belum dimigrate)
- Build migration helper (`scripts/migrate-rule-format.mjs` — devtool, bukan runtime dep)
- Migrate `frontend-architecture.md` sebagai pilot
- Re-run `baseline` benchmark, compare against Phase 0 baseline
- Migrate `architecture.md` setelah pilot validated
- Migrate sisa 13 rule files setelah dua di atas validated
- Update AGENTS.md routing table untuk reference new IDs
- Update validate gate untuk recognize numbered format
- Bump version ke `4.0.0-rc.1` (release candidate, belum publish)
- Update CHANGELOG dengan migration note + Migration Guide untuk downstream consumers

### Out of Scope (Jangan Sentuh di Phase 1)
- Caching architecture (itu Phase 2)
- MCP validation tools (itu Phase 3)
- Retrieval / embedding (itu Phase 4)
- Refactor 7 file > 500 LOC yang ditandai `@file-size-exception` di Phase 0 — itu separate Phase 1 sub-task setelah format migration selesai (Task 1.10 conditional)
- Benchmark suite expansion — current 10 fixtures sudah representative
- Add reflection block ke prompts — itu Phase 3
- Anti-sycophancy clause — itu Phase 3

### Hard Boundaries (Wajib Dipatuhi)
- **Lossless migration** — jika reformat menghapus substansi rule, itu reformat gagal. Migration helper wajib roundtrip-validate (parse new → render back to old shape → diff harus minimal).
- **Zero new runtime dependencies** — `package.json#dependencies` harus tetap `{}`. Migration helper boleh pakai devDeps (e.g. `js-yaml` untuk parse frontmatter).
- **Preserve all snippet checks** di `scripts/validate/config.mjs` — semua kebab-case keywords yang sudah ada di rule files harus tetap accessible (entah di body content atau di YAML frontmatter `keywords`).
- **No cross-file references break** — kalau `frontend-architecture.md` referenced from `bootstrap-design.md`, link harus tetap valid.
- **AGENTS.md routing table** harus tetap functional — boleh tambah ID column, tapi keyword-based scope routing must still work for legacy IDE consumers.

---

## TASK BREAKDOWN

### Task 1.1: Define Canonical Format Spec

**Tujuan:** Lock format shape sebelum migration. Spec ini akan jadi reference untuk semua 15 rule files.

**Steps:**
1. Buat `docs/plan/format-spec.md` dengan canonical example. Format wajib include:
   - YAML frontmatter dengan `id`, `priority`, `scope`, `applies_to`, `keywords`, `version`
   - Numbered Markdown body dengan stable rule IDs (e.g. `## FRONTEND-001: <Name>`)
   - Sub-rules pakai numbering konsisten (1, 1.1, 1.2, 2, 2.1...)
   - Positive framing wajib (lihat D1 Q5 di research-foundation.md)
   - Maksimum 1 paragraf intro per section, 3 kalimat, factual only
2. Lock ID scheme:
   - Prefix per file (frontend-architecture → `FE`, architecture → `ARCH`, security → `SEC`, dst.)
   - Numeric suffix incrementing dari 001
   - Sub-rules pakai dash (`FE-001-A`, `FE-001-B`) max 1 level deep
3. Tulis 1 contoh full migration di format-spec.md (e.g. `frontend-architecture.md` Activation section di kedua format)

**Acceptance criteria:**
- [ ] `docs/plan/format-spec.md` ada
- [ ] ID prefix per 15 rule files terdokumentasi (table)
- [ ] Contoh full before/after disertakan
- [ ] Spec di-review user sebelum lanjut Task 1.2

**Files yang boleh dibuat/dimodifikasi:**
- `docs/plan/format-spec.md` (new)

---

### 🚦 GATE A — Review Format Spec

**STOP HERE. Tunggu user review format-spec.md.**

Sebelum lanjut Task 1.2, agent harus:
1. Tampilkan canonical format example
2. Tampilkan ID prefix table untuk 15 rule files
3. Tampilkan before/after contoh dari frontend-architecture.md
4. Tanya user: "Format ini lock atau ada adjustment?"

**Alasan gate:** Format spec susah di-undo setelah migrate. Validate dulu sebelum masuk migration loop.

---

### Task 1.2: Build Migration Helper Tool

**Tujuan:** Bikin `scripts/migrate-rule-format.mjs` yang convert old → new format dengan roundtrip validation.

**Steps:**
1. Buat script di `scripts/migrate-rule-format.mjs`:
   - Input: path ke rule file lama
   - Output: rule file baru di temp location (untuk diff review)
   - Wajib: parse old structure (best-effort — section headings + bullet lists), assign IDs sesuai prefix table dari format-spec, generate YAML frontmatter dari heuristic
2. Helper wajib produce **diff report** yang show:
   - Token count before/after (pakai existing `benchmarks/token-usage/lib/token-counter.mjs`)
   - Lossy content warnings (kalau ada section yang tidak bisa direpresentasikan di new format)
   - Suggested manual review points
3. Roundtrip validation:
   - Helper provide reverse function (new → old approximation)
   - Run reverse, compare ke original, fail kalau >5% content drift
   - Drift detection: compare substantial-word-set (filter out structure tokens)
4. Tambah devDep kalau dibutuhkan (`js-yaml` candidate, ~70KB ok untuk dev only)
5. Tests di `scripts/migrate-rule-format.test.mjs`:
   - Round-trip preserves substance
   - YAML frontmatter valid
   - All numbered IDs unique within file
   - All IDs match prefix table

**Acceptance criteria:**
- [ ] `scripts/migrate-rule-format.mjs` ada
- [ ] Test file ada dan PASS
- [ ] Roundtrip validation built-in
- [ ] `package.json#dependencies` masih `{}`
- [ ] `npm test` keseluruhan PASS (125+ → 130+)
- [ ] `npm run validate` PASS

**Files yang boleh dibuat/dimodifikasi:**
- `scripts/migrate-rule-format.mjs` (new)
- `scripts/migrate-rule-format.test.mjs` (new)
- `package.json` (devDependencies + new test path)

---

### Task 1.3: Migrate `frontend-architecture.md` (Pilot)

**Tujuan:** First real migration. Validate format choice dengan data.

**Steps:**
1. Run `node scripts/migrate-rule-format.mjs .agent-context/rules/frontend-architecture.md` to produce candidate
2. Manual review — fix any lossy warnings, verify ID assignments make semantic sense
3. Replace `.agent-context/rules/frontend-architecture.md` with new version
4. Update any cross-references (search for `frontend-architecture.md` in repo)
5. Re-run `node --env-file=.env benchmarks/token-usage/run-baseline.mjs` to generate `baseline-{date}.json`
6. Compare to `baseline-2026-05-16.json`:
   - Per-fixture deltas for fixtures that load `frontend-architecture` (task-04, task-05, task-01)
   - Aggregate provider deltas
7. Run `npm test && npm run validate` — must PASS
8. Document migration result in inline comment di top of new file (1-line: `<!-- Migrated 2026-XX-XX from prose v3 to numbered v4 format -->`)

**Acceptance criteria:**
- [ ] `frontend-architecture.md` migrated to new format
- [ ] All cross-references updated
- [ ] New baseline `benchmarks/results/baseline-{date}.json` produced
- [ ] Per-file token delta within +15% of original (revised GATE B threshold; ≥10% reduction is no longer required)
- [ ] 100% directives carry unique `FE-NNN` IDs; zero ambiguous prose references ("see above", "earlier", etc.)
- [ ] All `[REF:FE-NNN]` cross-refs (if any) resolve
- [ ] `npm test` PASS (137+)
- [ ] `npm run validate` PASS — including all snippet checks for frontend-architecture.md
- [ ] Frontmatter schema compliant with trimmed shape (no `last_migrated`, no `version` for v1, keywords array 4-6 entries)

**Files yang boleh dibuat/dimodifikasi:**
- `.agent-context/rules/frontend-architecture.md`
- `benchmarks/results/baseline-{date}.json` (new dated file)
- Cross-reference fixes wherever found

---

### 🚦 GATE B — Pilot Validation

**STOP HERE. Tunggu user review pilot result.**

Original Phase 1 plan targeted ≥10% token reduction. **Pilot data (Task 1.2 raw helper output on frontend-architecture.md: +9.71% delta) showed this target was inherited from a generic prose-vs-structured estimate that does not apply to this repo's already-lean imperative prose.** Per the cost decomposition (frontmatter +70 tokens, section ID prefixes +56, numbered list prefixes +222 vs original `- ` bullets +54, total +282 tokens of pure structural markup), hitting -10% would require ~23% body compression — lossy, not restructure. Phase 1 pivots to the research-backed primary axis (citability, accuracy) per `research-foundation.md` D1 (EACL Findings 2026 cites +6.74% reasoning accuracy, not token reduction). Token discipline becomes a no-regression guard, not a reduction target.

Revised acceptance criteria:

**1. Token discipline (no-regression guard):**
- Standard rule files (original v3 file >=600 OpenAI tokens): per-file delta vs the original v3 file **must stay below +15%**
- Tiny rule files (original v3 file <600 OpenAI tokens): percentage delta is diagnostic only; absolute overhead **must stay at or below +120 OpenAI tokens**
- Aggregate delta across all 15 migrated rules: **must stay at or below +5%**
- 100% lossless roundtrip per file (existing `roundtrip-validate.mjs` ≥95% substantial-word overlap, validated per file in Task 1.2)

**Tiny-rule policy (locked after Task 1.5 attempted batch):**
The +15% per-file ceiling is meaningful for medium and large rules, but it breaks down on tiny files because the v4 structural floor is mostly fixed-cost. A trimmed frontmatter block plus one ID-prefixed H2 and numbered list markers added +64 to +104 OpenAI tokens on the first tiny-rule attempt, producing +31.56% to +41.88% despite lossless content. For files below 600 original OpenAI tokens, use the +120-token absolute overhead cap plus the aggregate +5% cap as the enforcement gate. Log the percentage anyway for transparency.

**2. Citability (research-backed primary axis):**
- 100% of directives carry a unique stable rule ID under the locked prefix
- 100% of `[REF:<PREFIX>-NNN]` references resolve to a real section ID
- Zero ambiguous prose references in the migrated rules ("see above", "earlier", "the next section", etc.) — replace with explicit `[REF:...]`
- New `audit:rule-id-uniqueness` check is wired into `npm run validate`

**3. Structural quality:**
- All existing validate gate snippet checks pass (snippets stay in body or move into frontmatter `keywords` per Task 1.7)
- All cross-doc references updated (no broken anchors in `AGENTS.md`, `prompts/`, `review-checklists/`, or `docs/`)
- Frontmatter schema compliant per `format-spec.md` section 1.1, with the trimmed shape applied: drop `version` for first-time-v1 files, drop `last_migrated` (git history is the audit trail), keywords array hand-picked at 4-6 entries (not 12 auto-extracted)

**Acceptance branches:**
- ✅ **PASS**: All three groups meet criteria → proceed Task 1.4.
- ⚠️ **MARGINAL**: Standard-file delta between +15% and +20%, tiny-file overhead between +120 and +150 tokens, OR aggregate delta between +5% and +10% → tampilkan numbers, ask user apakah lanjut atau revise format spec.
- ❌ **FAIL**: Any standard-file delta > +20%, tiny-file overhead > +150 tokens, aggregate > +10%, roundtrip drift, or test/validate failure → STOP, lapor diagnostic, re-evaluate format choice. Do not migrate more files until format issue resolved.

**Alasan gate (revised):** Phase 1 success now hinges on citability quality plus a no-regression token guard, not raw reduction. The pilot proved that already-lean imperative prose has minimal compressible surface; forcing token reduction would either kill a research-validated format or push the repo into ugly micro-optimizations that hurt readability. Phase 3 reflection blocks consume `[REF:FE-014]` style citations — that is where the format pays off, not at the `tiktoken` level.

---

### Task 1.4: Migrate `architecture.md`

**Tujuan:** Second migration. Confirm format scales beyond pilot.

**Steps:** Same as Task 1.3 but for `architecture.md` (prefix `ARCH-`).

**Acceptance criteria:**
- [ ] `architecture.md` migrated
- [ ] All cross-references updated
- [ ] New baseline produced and committed
- [ ] Per-file token delta within +15% of original
- [ ] 100% directives carry unique `ARCH-NNN` IDs
- [ ] `npm test && npm run validate` PASS
- [ ] All rule IDs unique under `ARCH-` prefix

---

### Task 1.5: Migrate Remaining 13 Rule Files

**Tujuan:** Bulk migration setelah format proven by 2 pilots.

**Steps:**
1. Per file, run migration helper
2. Manual review per file (estimate: 15-30 menit per file)
3. Commit per 2-3 files (jangan commit semua sekaligus — easier review/revert)
4. Re-run baseline after every commit
5. Monitor aggregate trend

**File order (smallest first to build confidence):**
1. `realtime.md` (907 chars)
2. `naming-conv.md` (939 chars)
3. `event-driven.md` (1,645 chars)
4. `performance.md` (1,649 chars)
5. `microservices.md` (2,182 chars)
6. `testing.md` (2,115 chars)
7. `error-handling.md` (2,315 chars)
8. `database-design.md` (2,765 chars)
9. `security.md` (2,791 chars)
10. `efficiency-vs-hype.md` (2,674 chars)
11. `docker-runtime.md` (4,302 chars)
12. `git-workflow.md` (5,176 chars)
13. `api-docs.md` (6,548 chars)

**Acceptance criteria per file:**
- [ ] Migrated to new format
- [ ] Cross-references updated
- [ ] All IDs unique under file's prefix
- [ ] Standard files stay within +15% token delta; tiny files (<600 original OpenAI tokens) stay within +120 token absolute overhead
- [ ] `npm test && npm run validate` PASS after each commit

**Aggregate acceptance criteria:**
- [ ] All 15 rules in new format (frontend-architecture, architecture from earlier tasks + 13 here)
- [ ] **Aggregate token delta across all 10 fixtures stays at or below +5%** vs Phase 0 baseline (`baseline-2026-05-16.json`). No standard file > +15% delta; no tiny file > +120 OpenAI tokens absolute overhead.
- [ ] Validate gate passes; all snippet checks still match (snippets may now appear in YAML keywords array OR body)
- [ ] `audit:rule-id-uniqueness` (added in Task 1.7) reports zero collisions across the rules pack

---

### Task 1.6: Update AGENTS.md Routing Table

**Tujuan:** Update top-level routing table to use new IDs.

**Steps:**
1. Update AGENTS.md "Layer 1: Rules" section to:
   - Keep filename references (backward-compat for IDE consumers)
   - Add ID column / mention (e.g. "load `frontend-architecture.md` (FE-*)")
2. For routing scope unions (e.g. "Backend/API endpoint"), keep keyword-based routing but add ID examples
3. Verify AGENTS.md still under `compact (180/180 lines)` snippet check
4. Run `npm test && npm run validate`

**Acceptance criteria:**
- [ ] AGENTS.md updated
- [ ] Still <= 180 lines (existing snippet check)
- [ ] All routing scopes still functional (test by running `frontend-usability-audit` and equivalent — they read AGENTS.md content)
- [ ] `npm test && npm run validate` PASS

**Files yang boleh dimodifikasi:**
- `AGENTS.md`
- `CLAUDE.md` / `GEMINI.md` if their import behavior depends on ID surface (unlikely; they're 2-line @AGENTS.md imports — should be no-op)

---

### Task 1.7: Update Validate Gate Snippet Checks + Add Rule-ID Audit

**Tujuan:** Snippet checks di `scripts/validate/config.mjs` mungkin perlu update karena content distribution berubah (some kebab-case keywords sekarang di YAML keywords array, some still di body). Plus add `audit:rule-id-uniqueness` to enforce GATE B citability axis going forward.

**Steps:**
1. Run `npm run validate` after Task 1.5 selesai
2. List failing snippet checks (jika ada)
3. Untuk setiap fail:
   - Decide: keep snippet (find new location in body), update path (kalau snippet sekarang di different file due to migration), or update validate config to look at YAML frontmatter `keywords` array
4. Update `scripts/validate/config.mjs` minimally — prefer keep-snippet-in-body when possible (preserves grep-based discovery)
5. Add `// @file-size-exception` re-check — config.mjs might grow if we add new snippet locations
6. Build `scripts/audit-rule-id-uniqueness.mjs`. Reads every file under `.agent-context/rules/`, parses YAML frontmatter for `id_prefix`, parses every `## <PREFIX>-NNN: ` heading, and verifies:
   - every section ID matches its file's `id_prefix`
   - no ID is reused within a single file
   - every `[REF:<PREFIX>-NNN]` mention in the rules pack OR in `prompts/` OR in `review-checklists/` resolves to a real section ID
   - no ambiguous prose references ("see above", "earlier", "the next section") survive in any rule body
7. Wire into `npm run validate` like `audit:file-size`. Add `audit:rule-id-uniqueness` to `package.json` scripts.

**Acceptance criteria:**
- [ ] All snippet checks pass
- [ ] `scripts/validate/config.mjs` still under file-size budget OR `@file-size-exception` updated
- [ ] No silent removal of governance snippets
- [ ] `scripts/audit-rule-id-uniqueness.mjs` exists, exits 0 when clean, exits 1 on any of the 4 conditions above
- [ ] Wired into `npm run validate`; `npm run validate` PASS

**Files yang boleh dimodifikasi:**
- `scripts/validate/config.mjs`
- `scripts/validate/coverage-checks.mjs` (kalau perlu support YAML keyword check mode)
- `scripts/validate.mjs` (wire new audit)
- `scripts/audit-rule-id-uniqueness.mjs` (new)
- `package.json` (new script)

---

### Task 1.8: Bump Version to v4.0.0-rc.1

**Tujuan:** Mark this as breaking-change RC. Don't publish yet — RC for internal validation only.

**Steps:**
1. `package.json#version` → `4.0.0-rc.1`
2. Update `package-lock.json` versions
3. Update CHANGELOG.md:
   - New section `## 4.0.0-rc.1 - 2026-XX-XX`
   - Sub-section `### Breaking changes` listing format migration
   - Sub-section `### Migration guide` with 1-2 paragraphs explaining how downstream consumers can update
4. Run validate's version-consistency check — must pass

**Acceptance criteria:**
- [ ] `package.json` version updated
- [ ] `package-lock.json` consistent
- [ ] CHANGELOG.md has 4.0.0-rc.1 section
- [ ] `npm run validate` PASS (especially version consistency check)
- [ ] **DO NOT** run `npm publish` — RC stays unpublished until Phase 5 hardening

**Files yang boleh dimodifikasi:**
- `package.json`
- `package-lock.json`
- `CHANGELOG.md`

---

### Task 1.9: Compile Phase 1 Outcome Report

**Tujuan:** Closing artifact untuk handoff ke Phase 2.

**Steps:**
1. Buat `docs/plan/phase-1-outcome.md` dengan:
   - Summary: what migrated, ID schemes locked
   - Token reduction numbers per provider per fixture (table)
   - Aggregate reduction vs Phase 0 baseline
   - Files migrated table (before/after chars + token count)
   - Known issues / debt
   - Phase 2 recommendation: caching architecture priority area based on what's static vs dynamic now
2. Update `00-context.md` status table — Phase 1 → ✅ Completed, Phase 2 → 🟡 Awaiting GATE
3. Generate first version of `phase-2-caching.md` **menunggu approval user**

**Acceptance criteria:**
- [ ] `docs/plan/phase-1-outcome.md` ada dan komprehensif
- [ ] `00-context.md` status table updated
- [ ] Token reduction data backed by `benchmarks/results/baseline-{date}.json`
- [ ] `phase-2-caching.md` not auto-generated; wait for user approval at GATE D

---

### 🚦 GATE C — Phase 1 Complete, Approve Phase 2 Direction

**STOP HERE. Final gate Phase 1.**

Tampilkan ke user:
1. Phase 1 outcome summary (top 3 numbers)
2. Aggregate token reduction achieved
3. Recommendation untuk Phase 2 (caching architecture)
4. Pertanyaan untuk user:
   - "Setuju Phase 1 selesai?"
   - "Setuju recommendation Phase 2 atau ada adjustment?"
   - "RC version (4.0.0-rc.1) tetap unpublished sampai Phase 5, atau Anda mau publish RC ke npm sekarang untuk early adopter feedback?"

Setelah approval, generate `phase-2-caching.md` dengan detail level yang sama dengan file ini.

---

## SUMMARY CHECKLIST PHASE 1

```
[ ] Task 1.1 — Define canonical format spec
[ ] 🚦 GATE A — Review format spec
[ ] Task 1.2 — Build migration helper tool
[ ] Task 1.3 — Migrate frontend-architecture.md (pilot)
[ ] 🚦 GATE B — Pilot validation
[ ] Task 1.4 — Migrate architecture.md
[ ] Task 1.5 — Migrate remaining 13 rule files
[ ] Task 1.6 — Update AGENTS.md routing table
[ ] Task 1.7 — Update validate gate snippet checks
[ ] Task 1.8 — Bump version to v4.0.0-rc.1
[ ] Task 1.9 — Outcome report + Phase 2 recommendation
[ ] 🚦 GATE C — Approval Phase 2 direction
```

---

## DELIVERABLES PHASE 1

Setelah Phase 1 selesai, repo akan punya:

1. ✅ `docs/plan/format-spec.md` — canonical format reference
2. ✅ `scripts/migrate-rule-format.mjs` — devtool untuk format migration
3. ✅ 15 rule files dalam new format dengan stable IDs
4. ✅ Updated AGENTS.md routing table
5. ✅ Updated validate gate snippet checks
6. ✅ `package.json` v4.0.0-rc.1 (unpublished RC)
7. ✅ `benchmarks/results/baseline-{date}.json` — comparable to Phase 0
8. ✅ `docs/plan/phase-1-outcome.md` — summary report
9. ✅ Token reduction validated by data, not vibes

---

## NOTES FOR AGENT

**Saat eksekusi:**
- Eksekusi task **berurutan**, jangan parallel
- Berhenti di setiap **🚦 GATE** dan lapor ke user
- Setiap task selesai, run **`npm test && npm run validate`** sebagai sanity check sebelum lanjut
- Kalau test/validate fail, **STOP dan investigate**, jangan force lanjut
- Commit per task selesai dengan message format: `feat(phase-1): <task description>`, `refactor(phase-1): ...`, atau `docs(phase-1): ...`
- Branch strategy: kerjakan di `main` (per user instruction Phase 0).

**Saat ambigu:**
- Bukan asumsi, tanya user
- Tampilkan opsi yang relevan dengan trade-off jelas
- Tunggu jawaban sebelum eksekusi

**Saat selesai:**
- Selalu run final check: `npm test && npm run validate && npm run gate:release`
- Update status di `00-context.md`
- Tampilkan summary singkat ke user

**Specific Phase 1 reminders:**
- Roundtrip-validate every migration. Lossy = unacceptable.
- Standard-file token delta cap is +15%. Tiny files below 600 original OpenAI tokens use +120 token absolute overhead. Aggregate cap is +5%. Anything above the matching cap triggers GATE B failure path.
- Citability is the primary axis: every directive carries a stable rule ID, no ambiguous prose references survive.
- Hard cut to v4 means CHANGELOG migration guide is mandatory, not optional.
- If snippet checks break en masse, do NOT delete checks. Find new home for the keywords (body or YAML keywords array).
