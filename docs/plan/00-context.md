# Execution Plan — Agentic-Senior-Core v4

> **Audience:** Maintainer (Farid) + AI coding agent yang dipakai untuk eksekusi.
> **Bahasa:** Bahasa Indonesia untuk narasi, English untuk istilah teknis.
> **Status:** Phase 1 completed. Phase 2 awaiting GATE C approval.

---

## TUJUAN OVERALL

Naikkan repo dari skor agregat **7.4/10 → 9.2-9.3/10** dalam 6 bulan dengan eksekusi terukur. Target dicapai bukan via marketing, melainkan via **public benchmark JSON yang reproducible per release**.

**Goal substantif user:**
- Token efficiency maksimal (target -40-60% reduction tanpa quality drop)
- Cross-model compatibility (Claude, GPT, Gemini, Grok, open models)
- Anti-halu mechanism yang real (bukan klaim tagline)
- Tidak buang substansi rules (lossless restructure, bukan destructive compression)

---

## DECISIONS YANG SUDAH FINAL

Decision di bawah ini sudah triangulated dari 3 sumber research independen (Perplexity + Claude + Gemini Deep Research, Mei 2026). **Jangan re-debate kecuali ada data baru yang bertentangan.**

> 📚 **Untuk empirical foundation, edge cases, dan reasoning detail**, baca `research-foundation.md`. Setiap decision di sini punya section lengkap di sana dengan:
> - Why (empirical reasoning)
> - Sources (research yang back claim)
> - Edge cases (situasi ambigu yang sering muncul)
> - What NOT to do (anti-pattern)

### D1: Format Instruksi → Numbered Markdown + YAML Frontmatter
- Bukan prosa, bukan pure DSL
- Cross-model compatible, ~15-25% token saving vs prose
- Backed by EACL Findings 2026 (structured format +6.74% accuracy untuk reasoning)
- Mitigates "Curse of Instructions" (rule retrievable per ID)

### D2: Source Strategy → Single canonical AGENTS.md + thin adapter generator
- AGENTS.md = source of truth tunggal
- Auto-generate: CLAUDE.md (`@AGENTS.md` import), GEMINI.md, `.cursor/rules/main.mdc`, `.windsurfrules`
- Backed by ETH Zurich context-file study (arXiv 2602.11988): context files can reduce SWE-bench-style task success and raise inference cost, so keep agent instructions factual, directive, and minimal.

### D3: MCP Strategy → Optional + REPOSITION untuk validation, BUKAN delivery rules
- MCP delivery untuk static rules = anti-pattern (3 sources convergence)
- MCP yang valid: `validate_against_rules()`, `lookup_rule()`, `audit_compliance()`
- Pattern reverse: MCP **mengecek** rules, bukan **mengirim** rules
- Konsisten dengan Cloudflare Code Mode (98%+ token saving via dynamic discovery)

### D4: Caching Architecture → Three-Layer Sandwich
- Layer 1 STATIC PREFIX (cacheable, ~5K tokens): identity + tool defs + always-include critical rules
- Layer 2 SEMI-STATIC (cacheable): project AGENTS.md + loaded skills
- Layer 3 DYNAMIC (NOT cached): retrieved rules + code + user message + history
- Universal ordering bekerja di semua provider (Claude, OpenAI, Gemini, Grok, DeepSeek)

### D5: Retrieval Implementation → DEFER ke Phase 4, conditional
- ~50 rules sekarang masih cukup dengan static always-include
- Trigger: rules > 30 active OR miss-rate > 10% OR token cost masih > target
- Stack saat dibutuhkan: nomic-embed-text v1.5 + sqlite-vec + lunr.js BM25 hybrid
- Opt-in via `--retrieval` flag (hindari install size impact untuk casual user)

### D6: Anti-Halu Stack → Three-mechanism layered
- L1 Pre-prompt: numbered rules + ID + anti-sycophancy clause (zero cost)
- L2 In-flight: reflection block dengan rule citation requirement (low cost)
- L3 Post-hoc: MCP validation tool + AST linter di CI (medium cost)
- **Strict prohibition:** No LLMLingua/lossy compression untuk rules. Compression Paradox evidence is benchmark-dependent but shows severe worst-case output expansion on MBPP/DeepSeek, so lossless structure is the safe rules path.

---

## PROHIBITED PATTERNS (Hard Rules)

Pattern di bawah ini dilarang absolut. Kalau agent menyarankan, **tolak dan rujuk dokumen ini**:

1. **Lossy prompt compression untuk rules content** (LLMLingua, token-deletion, summarization yang membuang detail)
2. **MCP server sebagai delivery mechanism untuk static rules** (anti-pattern)
3. **Maintain N file paralel** (CLAUDE.md, GEMINI.md, .cursorrules) — harus auto-generated dari AGENTS.md tunggal
4. **LLM-generated AGENTS.md content** (-3% task success per ETH Zurich, hindari prosa filosofis, keep faktual & directive)
5. **Heavyweight runtime dependencies** untuk core (devDeps OK untuk benchmarks)
6. **Implementasi tanpa baseline measurement** — Phase 0 wajib selesai sebelum optimasi apa pun

---

## CARA PAKAI FOLDER INI

```
docs/plan/
├── 00-context.md            ← FILE INI. Baca dulu (overview).
├── research-foundation.md   ← Empirical foundation + edge cases per decision.
├── phase-0-baseline.md      ← Phase yang sedang aktif. Execute-ready.
└── agent-prompt-template.md ← Template instruksi untuk paste ke IDE agent.
```

**Reading order untuk agent (WAJIB urut):**
1. **`00-context.md`** (file ini) — overview, decisions summary, prohibited patterns
2. **`research-foundation.md`** — detailed reasoning per decision + edge cases
3. **`phase-X-Y.md`** — phase yang sedang aktif

**Workflow:**
1. Baca 3 file di atas urut
2. Pakai `agent-prompt-template.md` sebagai prompt awal ke agent IDE
3. Eksekusi task dalam phase, **berhenti di setiap GATE** untuk review
4. Setelah phase selesai dan baseline tervalidasi, generate file phase berikutnya

**Aturan untuk agent yang membaca dokumen ini:**
- Eksekusi **per phase**, bukan loncat-loncat
- Setiap task punya **acceptance criteria yang verifiable** — pastikan semua checklist tercapai sebelum claim done
- Setiap **GATE** berarti STOP, lapor progress, tunggu approval user sebelum lanjut
- Kalau ada ambiguity di edge case, **cek `research-foundation.md` section yang relevan** sebelum tanya user
- Kalau tetap ambigu setelah cek research-foundation, **tanya user, jangan asumsi**
- Jangan ubah file di luar scope phase yang sedang aktif

---

## STATUS TRACKING

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| Phase 0 — Baseline & Cleanup | ✅ Completed | 2026-05-16 | 2026-05-16 | See `phase-0-outcome.md`. GATE D approved. |
| Phase 1 — Format Migration | ✅ Completed | 2026-05-16 | 2026-05-16 | See `phase-1-outcome.md`. All 15 rules migrated to v4; final OpenAI aggregate +8.86% under the +10% cap. |
| Phase 2 — Caching Layer | 🟡 Awaiting GATE | — | — | Generate `phase-2-caching.md` after GATE C approval. |
| Phase 3 — Anti-Halu | ⏸ Locked | — | — | Generate setelah Phase 2 selesai |
| Phase 4 — Retrieval (conditional) | ⏸ Locked | — | — | Skip kalau Phase 3 quality target tercapai |
| Phase 5 — Hardening & Adoption | ⏸ Locked | — | — | Generate setelah Phase 3/4 selesai |

---

## SUCCESS METRICS (Final State Targets)

Phase 5 target. Detail measurement methodology di phase masing-masing.

| Metric | Baseline | Target | Source |
|--------|----------|--------|--------|
| Token per task (input, cold) | TBD Phase 0 | -40% | Token counter wrapper |
| Token per task (input, warm cache) | TBD | -75% vs baseline cold | API headers |
| Rule adherence rate (Claude) | TBD | ≥75% | AgentHallu eval |
| Rule adherence rate (GPT) | TBD | ≥65% | AgentHallu eval |
| Rule adherence rate (open) | TBD | ≥55% | AgentHallu eval |
| Install size (core) | ~1.7MB | ≤2MB | npm pack |
| Install size (with retrieval) | N/A | ≤120MB | npm pack opt-in |
| Test coverage statement | ~8% | ≥80% | Node native --experimental-test-coverage |
| OpenSSF Scorecard | unknown | ≥9.0 | scorecard.dev |
| Validate gate count | 542 | ≥800 | npm run validate |

**Critical mandate:** Setiap release publish JSON di `benchmarks/results/{version}.json`. Reproducible. **Inilah pembeda dari competitor yang klaim tanpa data.**

---

## PENDING DECISIONS

Decision yang sudah dijawab user dan locked:

- **Decision B (Phase 1 timing): B1 (hard cut at v4.0.0).** Format lama di-drop, migration tool wajib. CHANGELOG migration guide mandatory.
- **Anthropic counter accuracy:** Skip top-up. Claude tetap pakai `tiktoken cl100k_base` estimate dengan `accurate=false` flag (~0.11% deviation vs OpenAI native, acceptable as relative comparator).
- **Tiny-rule token gate:** Rule files below 600 original OpenAI tokens keep the same v4 format but use a +120 OpenAI-token absolute overhead cap instead of the +15% per-file percentage cap. Aggregate Phase 1 cap is +10%.
- **Aggregate cap strategy:** Option B locked on 2026-05-16. Relax aggregate cap from +5% to +10%, backed by Anthropic prompt-caching math (cache reads cost 0.1x base input price) and local pilot data. Continue Task 1.5 in original file order; keep per-file and tiny-file caps unchanged.

Tidak ada pending decision yang block Phase 1. Phase 2 requires GATE C approval before generating `phase-2-caching.md`.

---

## REFERENSI RESEARCH SOURCES

Decisions di atas backed by:
- **Perplexity Deep Research** Mei 2026 — token caching, MCP fatigue, AGENTS.md adoption
- **Claude Deep Research** Mei 2026 — MMMT-IF data, Cloudflare Code Mode, ETH Zurich findings
- **Gemini Deep Research** Mei 2026 — IFBench, Curse of Instructions, Compression Paradox

Triangulation rule: klaim muncul di 2+ sources independen = HIGH confidence (decision-grade).

**Untuk detail empirical foundation per decision**, lihat `research-foundation.md`. File itu berisi:
- Per-decision reasoning chain
- Specific paper references (ArXiv ID, DOI)
- Edge cases yang sering muncul + jawaban backed-by-research
- Anti-pattern yang harus ditolak

---

**Last updated:** Phase 1 completed 2026-05-16. All 15 rules migrated to v4, `4.0.0-rc.1` prepared but unpublished, and Phase 2 caching awaits GATE C approval.
