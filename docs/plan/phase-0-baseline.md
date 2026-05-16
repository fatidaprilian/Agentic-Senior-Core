# Phase 0 — Baseline & Cleanup

> **Status:** 🟡 Ready to execute
> **Estimated effort:** 8-15 jam aktif (1-2 minggu kalender, tergantung availability)
> **Prerequisite:** Sudah baca `00-context.md`

---

## TUJUAN PHASE 0

Phase 0 punya **dua fungsi yang saling terkait**:

1. **Punya angka konkret (baseline)** — sebelum klaim "kami hemat 40%", kita harus tahu start point. Tanpa ini, semua optimasi setelah Phase 0 = klaim tanpa data = gimik.
2. **Bersihkan technical debt yang sudah teridentifikasi** — supaya tidak menumpuk dan menyulitkan phase berikutnya.

**Kenapa ini critical:** Output utama Phase 0 adalah `benchmarks/results/baseline-{date}.json`. File ini akan jadi **comparator** untuk semua claim di phase 1-5. Tanpa baseline, repo akan terjebak loop "kelihatan lebih baik" tanpa pembuktian.

---

## SCOPE & BOUNDARY

### In Scope
- Bangun benchmark harness untuk token measurement (lokasi: `benchmarks/token-usage/`)
- Run baseline measurement pada current rules pack (3.0.50) tanpa modifikasi
- Cleanup file-file yang melanggar threshold internal sendiri
- Cleanup test stderr noise yang sudah teridentifikasi
- Hapus / archive klaim "9-layer dynamic injection" yang virtual

### Out of Scope (Jangan Sentuh di Phase 0)
- Format migration ke numbered markdown (itu Phase 1)
- Caching architecture implementation (itu Phase 2)
- MCP validation tools (itu Phase 3)
- Retrieval / embedding (itu Phase 4)
- Apa pun yang **mengubah behavior rules pack** — Phase 0 harus measure unchanged baseline

### Hard Boundaries (Wajib Dipatuhi)
- **Zero runtime dependencies untuk core** — devDependencies OK untuk benchmark scripts
- **Zero breaking change ke public API** — ini measurement-only phase
- **Tidak ubah file di `.agent-context/`** — itu yang sedang diukur
- **Tidak modify rules content** — kalau diubah, baseline jadi kotor dan tidak reflective

---

## TASK BREAKDOWN

### Task 0.1: Setup Benchmark Harness Skeleton

**Tujuan:** Buat folder structure dan boilerplate yang akan host semua benchmark.

**Steps:**
1. Buat folder structure:
   ```
   benchmarks/
   ├── token-usage/
   │   ├── fixtures/          (task fixtures, akan diisi Task 0.2)
   │   ├── runners/           (provider-specific runners)
   │   ├── lib/               (shared utilities)
   │   └── README.md          (dokumentasi cara run)
   ├── results/
   │   └── .gitkeep
   └── README.md              (overview semua benchmark)
   ```
2. Buat `benchmarks/README.md` dengan:
   - Tujuan folder
   - Cara run benchmark
   - Cara interpret results
   - Reproducibility notes (Node version, environment vars yang dibutuhkan)
3. Update `.gitignore` di repo root untuk:
   - Allow `benchmarks/results/*.json` di-commit (kita PUBLISH ini)
   - Ignore `benchmarks/.cache/` kalau ada cache lokal

**Acceptance criteria:**
- [ ] Folder structure sesuai di atas
- [ ] `benchmarks/README.md` ada dan jelaskan workflow
- [ ] `.gitignore` updated, `benchmarks/results/*.json` tracked
- [ ] `npm run validate` masih PASS (tidak break existing gates)
- [ ] Tidak ada runtime dependency baru di `package.json#dependencies`

**Files yang boleh dibuat/dimodifikasi:**
- `benchmarks/**` (new)
- `.gitignore`

---

### Task 0.2: Buat 10 Task Fixtures yang Representative

**Tujuan:** Buat 10 task standard yang akan dipakai untuk measure token usage. Task harus **reflective dari real use case rules pack ini**, bukan generic.

**Steps:**
1. Buat 10 file fixture di `benchmarks/token-usage/fixtures/`, format JSON:
   ```json
   {
     "id": "task-01-init-react-project",
     "category": "scaffolding",
     "description": "User minta init project React baru dengan TypeScript",
     "user_message": "Initialize a new React project with TypeScript and Tailwind",
     "expected_rules_triggered": ["FE-ARCH", "FE-TYPE", "TEST-001"],
     "context_size_target": "small"
   }
   ```
2. Distribusi 10 task:
   - **3 scaffolding tasks** (init project, add module, setup feature)
   - **2 design/UI tasks** (redesign component, add animation, responsive layout)
   - **2 backend tasks** (add API endpoint, fix N+1 query)
   - **1 security task** (add auth, fix CSRF)
   - **1 refactor task** (split file > 500 LOC, rename across files)
   - **1 review task** (review PR diff)
3. Setiap task harus mention rule IDs yang **diharapkan** ter-trigger (untuk Phase 3 nanti — tidak measure di Phase 0, hanya catat).

**Acceptance criteria:**
- [ ] 10 file fixture tersedia di `benchmarks/token-usage/fixtures/`
- [ ] Setiap fixture punya: `id`, `category`, `description`, `user_message`, `expected_rules_triggered` (boleh empty array di Phase 0), `context_size_target`
- [ ] Distribusi sesuai di atas (3 scaffolding + 2 design + 2 backend + 1 security + 1 refactor + 1 review)
- [ ] Task realistic — bukan "hello world" generic, tapi reflective use case actual rules pack

**Files yang boleh dibuat/dimodifikasi:**
- `benchmarks/token-usage/fixtures/*.json` (new)

---

### 🚦 GATE A — Review Fixtures dengan User

**STOP HERE. Tunggu user review.**

Sebelum lanjut ke Task 0.3, agent harus:
1. List 10 fixture yang dibuat
2. Tampilkan summary tiap fixture (id + description)
3. Tanya user: "Apakah fixtures ini representative? Ada yang harus diganti/tambah/kurangi?"

**Alasan gate:** Kalau fixtures tidak reflective, semua data baseline akan misleading. User harus validate dulu.

---

### Task 0.3: Implementasi Token Counter Wrapper

**Tujuan:** Bikin utility yang count token untuk Anthropic, OpenAI, dan Gemini secara akurat.

**Constraints:**
- **Tidak boleh tambah heavyweight runtime deps** (anthropic SDK, openai SDK = OK sebagai devDependencies)
- Output harus consistent format antar provider
- Boleh pakai `tiktoken` untuk OpenAI (akurat), `@anthropic-ai/sdk` count_tokens method untuk Claude, Google's `@google/genai` `countTokens()` untuk Gemini
- Untuk Grok dan open models (DeepSeek, Qwen): pakai `tiktoken` dengan `cl100k_base` sebagai approximation, tandai sebagai estimate di output

**Steps:**
1. Buat `benchmarks/token-usage/lib/token-counter.mjs` dengan signature:
   ```javascript
   /**
    * @param {string} text
    * @param {string} provider - 'anthropic' | 'openai' | 'gemini' | 'grok' | 'deepseek' | 'qwen'
    * @param {string} model - specific model identifier
    * @returns {Promise<{provider, model, token_count, method, accurate}>}
    */
   export async function countTokens(text, provider, model) { ... }
   ```
2. Method options:
   - `'native'` — pakai SDK official (anthropic count_tokens, openai tiktoken, gemini countTokens)
   - `'estimate'` — pakai tiktoken cl100k_base untuk provider tanpa native counter
3. Output JSON harus include `accurate: boolean` flag (true kalau native, false kalau estimate)
4. Add devDependencies (HANYA di devDependencies, BUKAN dependencies):
   - `@anthropic-ai/sdk` (untuk count_tokens)
   - `tiktoken` (untuk OpenAI dan estimates)
   - `@google/genai` (untuk Gemini countTokens)
5. Buat `benchmarks/token-usage/lib/token-counter.test.mjs` dengan test:
   - Counts work untuk semua 6 providers
   - Returns consistent shape
   - Estimate flag set correctly

**Acceptance criteria:**
- [ ] `token-counter.mjs` ada dengan signature yang spec
- [ ] Support 6 providers (anthropic, openai, gemini, grok, deepseek, qwen)
- [ ] Output shape consistent: `{provider, model, token_count, method, accurate}`
- [ ] Test file ada dan PASS
- [ ] `package.json#dependencies` masih kosong / unchanged
- [ ] `package.json#devDependencies` punya 3 SDK yang ditambahkan
- [ ] `npm test` masih PASS keseluruhan
- [ ] `npm run validate` masih PASS

**Files yang boleh dibuat/dimodifikasi:**
- `benchmarks/token-usage/lib/token-counter.mjs` (new)
- `benchmarks/token-usage/lib/token-counter.test.mjs` (new)
- `package.json` (devDependencies only)

---

### Task 0.4: Build Provider Runners

**Tujuan:** Bikin runner per provider yang execute fixture dan output token measurement.

**Steps:**
1. Buat runner skeleton di `benchmarks/token-usage/runners/`:
   - `claude-runner.mjs`
   - `openai-runner.mjs`
   - `gemini-runner.mjs`
   - `_shared.mjs` (logic shared antar runner)
2. Setiap runner harus:
   - Load AGENTS.md current state (full content)
   - Load fixture dari args
   - Construct prompt sesuai struktur current rules pack
   - Count input token (system prompt + rules + user message) **TANPA actually call API**
   - Output JSON ke stdout dengan shape:
     ```json
     {
       "fixture_id": "task-01-init-react-project",
       "provider": "anthropic",
       "model": "claude-3-5-sonnet-20241022",
       "input_token_breakdown": {
         "system_prompt": 123,
         "rules_pack": 4567,
         "user_message": 89,
         "total": 4779
       },
       "method": "native",
       "accurate": true,
       "timestamp": "2026-05-16T..."
     }
     ```
3. Buat orchestrator `benchmarks/token-usage/run-baseline.mjs` yang:
   - Loop semua fixture × semua provider
   - Run runner masing-masing
   - Aggregate output ke single JSON
   - Write ke `benchmarks/results/baseline-{YYYY-MM-DD}.json`

**Constraints:**
- **JANGAN actually call API** di Phase 0 — ini measurement-only, jangan boros API credit
- Token counting cukup pakai count_tokens method yang gratis
- Kalau provider butuh API key untuk count_tokens, document di README mana env var yang diperlukan

**Acceptance criteria:**
- [ ] 3 runner files (claude, openai, gemini) plus `_shared.mjs`
- [ ] Orchestrator `run-baseline.mjs` ada
- [ ] Run `node benchmarks/token-usage/run-baseline.mjs` menghasilkan JSON di `benchmarks/results/`
- [ ] JSON output sesuai shape yang di-spec
- [ ] Breakdown system_prompt vs rules_pack vs user_message accurate
- [ ] README di `benchmarks/token-usage/` jelaskan cara run + env var yang dibutuhkan

**Files yang boleh dibuat/dimodifikasi:**
- `benchmarks/token-usage/runners/*.mjs` (new)
- `benchmarks/token-usage/run-baseline.mjs` (new)
- `benchmarks/token-usage/README.md` (new)

---

### 🚦 GATE B — Run Baseline & Review Numbers

**STOP HERE. Tunggu user review hasil baseline.**

Sebelum lanjut ke task cleanup (0.5+), agent harus:
1. Run `node benchmarks/token-usage/run-baseline.mjs`
2. Tampilkan hasil: total token per fixture per provider, breakdown system/rules/user
3. Tanya user: "Angka ini make sense? Ada anomaly yang perlu investigasi?"

**Alasan gate:** Kalau baseline numbers aneh (terlalu kecil, terlalu besar, breakdown tidak masuk akal), kemungkinan ada bug di runner yang harus diperbaiki **sebelum** dilakukan cleanup. Kalau cleanup duluan, baseline hilang.

---

### Task 0.5: Pecah File > 500 LOC

**Tujuan:** Refactor file yang melanggar threshold internal sendiri (lihat `.agent-context/rules/architecture.md`).

**Files target (sudah teridentifikasi):**
1. `lib/cli/project-scaffolder/design-contract/validation.mjs` — 909 baris
2. `lib/cli/project-scaffolder/design-contract.mjs` — 837 baris
3. `lib/cli/detector.mjs` — 691 baris
4. `scripts/llm-judge.mjs` — 661 baris
5. `lib/cli/detector/design-evidence.mjs` — 610 baris

**Steps per file:**
1. Read file lengkap, identifikasi natural decomposition (per validator type, per detection category, per concern)
2. Pecah ke sub-files di sub-folder yang sama
3. Original file jadi thin re-export aggregator (jaga backward compat dengan import paths existing)
4. Run `npm test` setiap file selesai dipecah — **WAJIB PASS** sebelum lanjut file berikut
5. Run `npm run validate` setelah selesai semua

**Constraints:**
- Setiap pecahan harus < 500 LOC
- Backward compatibility import path absolutely required (jangan break existing imports)
- Tidak ubah behavior — pure structural refactor
- Commit per file (5 commit terpisah, lebih mudah review/revert)

**Acceptance criteria:**
- [ ] 5 file target sudah dipecah, semua sub-file < 500 LOC
- [ ] Original file masih ada sebagai re-export aggregator
- [ ] `npm test` PASS (109 tests)
- [ ] `npm run validate` PASS (542+ checks)
- [ ] `npm run gate:release` PASS
- [ ] Tidak ada breaking change di public API

**Files yang boleh dimodifikasi:**
- 5 file target di atas
- Sub-files baru di folder yang sama dengan target

---

### Task 0.6: Add audit:file-size.mjs ke Validate Gate

**Tujuan:** Auto-enforce 500 LOC threshold supaya tidak terulang di masa depan.

**Steps:**
1. Buat `scripts/audit-file-size.mjs`:
   - Scan `lib/**/*.mjs`, `scripts/**/*.mjs`, `bin/**/*.{js,mjs}`
   - Skip test files (`*.test.mjs`)
   - Hard fail kalau ada file > 500 LOC
   - Allow override via comment marker: `// @file-size-exception: <reason>` di first 5 lines (untuk legitimate exception, tapi tetap log warning)
   - Output machine-readable JSON di stderr saat fail
2. Add ke `scripts/validate.mjs` dependency chain
3. Add npm script `audit:file-size`
4. Run dan pastikan PASS setelah Task 0.5 selesai

**Acceptance criteria:**
- [ ] `scripts/audit-file-size.mjs` ada
- [ ] Detect file > 500 LOC dengan correct count
- [ ] Honor `@file-size-exception` marker
- [ ] Integrated ke `validate.mjs`
- [ ] `npm run audit:file-size` PASS setelah Task 0.5
- [ ] `npm run validate` PASS dengan check baru ini included

**Files yang boleh dibuat/dimodifikasi:**
- `scripts/audit-file-size.mjs` (new)
- `scripts/validate.mjs` (modify)
- `package.json#scripts` (add `audit:file-size`)

---

### Task 0.7: Fix HEAD~1 stderr Noise di Tests

**Tujuan:** Bersihkan broken-window di test output.

**Background:** Saat run `npm test`, ada 9× stderr message:
```
fatal: ambiguous argument 'HEAD~1..HEAD': unknown revision or path not in the working tree.
```
Test fallback bekerja (tests PASS), tapi noise merusak persepsi quality.

**Steps:**
1. Locate source di `tests/operations.test.mjs` (atau script yang dipanggil dari sana)
2. Find git command yang asumsi HEAD~1 exists
3. Add guard: kalau `git rev-parse HEAD~1` fail, gracefully skip diff-based check dengan eksplisit log "no previous commit, skipping diff comparison"
4. Suppress stderr (redirect ke /dev/null atau pakai `git ls-tree` alternative)
5. Run `npm test` — pastikan **zero stderr noise** dari git fatal

**Acceptance criteria:**
- [ ] `npm test` output bersih, no `fatal: ambiguous argument` messages
- [ ] Test count masih sama (109 PASS)
- [ ] Behavior unchanged — test masih cover same paths

**Files yang boleh dimodifikasi:**
- `tests/operations.test.mjs` atau scripts yang relevant
- Files di `scripts/` yang punya git command tanpa guard

---

### Task 0.8: Hapus / Archive Klaim "9-Layer Dynamic Injection"

**Tujuan:** Honest documentation. Klaim yang terlalu besar tanpa implementasi nyata = gimik.

**Background:** `mcp.json` mention "9-layer dynamic knowledge injection" tapi 4 dari 9 layer adalah `"path": "dynamic", "type": "virtual"`. Itu placeholder konseptual, bukan implementasi runtime konkret.

**Steps:**
1. Read `mcp.json` lengkap
2. Identifikasi semua reference ke "9-layer", "dynamic injection", "knowledge layers"
3. Pilih action:
   - **Option A:** Hapus virtual layers, keep only real ones (down-grade ke "5-layer static knowledge injection" yang akurat)
   - **Option B:** Move full 9-layer claim ke `docs/architecture-vision.md` sebagai future roadmap (jujur), keep `mcp.json` jadi factual current state
4. Update `README.md` dan `docs/` yang reference klaim ini
5. Buat `docs/archive/9-layer-injection-original-design.md` sebagai historical record (transparan, bukan delete diam-diam)

**Pertanyaan untuk user di GATE C (sebelum eksekusi task ini):** Pilih Option A atau Option B?

**Acceptance criteria:**
- [ ] User memilih Option A atau B
- [ ] Klaim tidak akurat sudah dihapus / di-honest-kan di `mcp.json`
- [ ] Reference di `README.md` dan `docs/` updated
- [ ] Archive file di `docs/archive/` ada dengan original design (transparency)
- [ ] `npm run validate` PASS (forbidden-content-check tidak break)

**Files yang boleh dimodifikasi:**
- `mcp.json`
- `README.md`
- `docs/*.md` (yang reference klaim ini)
- `docs/archive/9-layer-injection-original-design.md` (new)

---

### 🚦 GATE C — Decision Point untuk Task 0.8

**STOP HERE. Tunggu user pilih Option A atau B untuk klaim 9-layer.**

---

### Task 0.9: Compile Phase 0 Outcome Report

**Tujuan:** Dokumentasi closing untuk handoff ke Phase 1.

**Steps:**
1. Buat `docs/plan/phase-0-outcome.md` dengan:
   - Summary apa yang dilakukan
   - Baseline numbers (link ke `benchmarks/results/baseline-{date}.json`)
   - Files refactored (list 5 file yang dipecah, before/after LOC)
   - New tooling added (file-size audit, token counter, runners)
   - Known issues / debt yang masih ada
   - **Recommendation untuk Phase 1**: berdasarkan baseline, optimasi mana yang paling high-impact?
2. Update `00-context.md` status table — Phase 0 → ✅ Completed
3. Generate first version of Phase 1 detail file (`phase-1-format.md`) **menunggu approval user**

**Acceptance criteria:**
- [ ] `docs/plan/phase-0-outcome.md` ada dan komprehensif
- [ ] `00-context.md` status table updated
- [ ] Recommendation untuk Phase 1 backed by baseline data
- [ ] Tidak generate `phase-1-format.md` sampai user approve recommendation

---

### 🚦 GATE D — Phase 0 Complete, Approve Phase 1 Direction

**STOP HERE. Final gate Phase 0.**

Tampilkan ke user:
1. Phase 0 outcome summary
2. Baseline numbers highlighted (top 3 insights)
3. Recommendation untuk Phase 1
4. Pertanyaan untuk user:
   - "Setuju Phase 0 selesai?"
   - "Setuju recommendation Phase 1 atau ada adjustment?"
   - "Decision B (breaking change tolerance) — pilih B1 / B2 / B3?"

Setelah approval, generate `phase-1-format.md` dengan detail yang sama-detail seperti file ini.

---

## SUMMARY CHECKLIST PHASE 0

```
[ ] Task 0.1 — Setup benchmark harness skeleton
[ ] Task 0.2 — Build 10 representative fixtures
[ ] 🚦 GATE A — Review fixtures
[ ] Task 0.3 — Token counter wrapper
[ ] Task 0.4 — Provider runners + orchestrator
[ ] 🚦 GATE B — Review baseline numbers
[ ] Task 0.5 — Pecah 5 file > 500 LOC
[ ] Task 0.6 — audit:file-size enforcement
[ ] Task 0.7 — Fix HEAD~1 stderr noise
[ ] 🚦 GATE C — Decision: Option A/B untuk klaim 9-layer
[ ] Task 0.8 — Hapus / honest klaim 9-layer
[ ] Task 0.9 — Outcome report + Phase 1 recommendation
[ ] 🚦 GATE D — Approval Phase 1 direction
```

---

## DELIVERABLES PHASE 0

Setelah Phase 0 selesai, repo akan punya:

1. ✅ `benchmarks/token-usage/` — token measurement infrastructure (reusable untuk Phase 1-5)
2. ✅ `benchmarks/results/baseline-{date}.json` — baseline angka untuk comparator
3. ✅ 5 file refactored ke <500 LOC dengan backward compat
4. ✅ `scripts/audit-file-size.mjs` — auto-enforce threshold
5. ✅ Test output bersih (no stderr noise)
6. ✅ Honest documentation (no overclaim "9-layer dynamic injection")
7. ✅ `docs/plan/phase-0-outcome.md` — summary report
8. ✅ Decision B answered (B1/B2/B3 untuk Phase 1)

---

## NOTES FOR AGENT

**Saat eksekusi:**
- Eksekusi task **berurutan**, jangan parallel
- Berhenti di setiap **🚦 GATE** dan lapor ke user
- Setiap task selesai, run **`npm test && npm run validate`** sebagai sanity check sebelum lanjut
- Kalau test/validate fail, **STOP dan investigate**, jangan force lanjut
- Commit per task selesai dengan message format: `chore(phase-0): <task description>` atau `refactor(phase-0): ...`
- Branch strategy: kerjakan di `phase-0-baseline` branch, bukan langsung `main`

**Saat ambigu:**
- Bukan asumsi, tanya user
- Tampilkan opsi yang relevan dengan trade-off jelas
- Tunggu jawaban sebelum eksekusi

**Saat selesai:**
- Selalu run final check: `npm test && npm run validate && npm run gate:release`
- Update status di `00-context.md`
- Tampilkan summary singkat ke user
