# Research Foundation — Mengapa Decision-Decision Ini Final

> **Audience:** AI agent yang eksekusi plan + maintainer di masa depan yang mau challenge decision.
> **Bahasa:** Bahasa Indonesia untuk narasi, English untuk istilah teknis.
> **Last research consolidation:** Mei 2026.

---

## CARA PAKAI DOKUMEN INI

File ini adalah **empirical foundation** untuk semua decision di `00-context.md`. Setiap decision (D1-D6) dijelaskan dengan format:

1. **What** — apa keputusannya
2. **Why** — empirical reasoning
3. **Sources** — research yang back claim
4. **Edge cases** — situasi yang sering jadi ambigu, plus jawabannya
5. **What NOT to do** — anti-pattern yang harus ditolak

**Aturan untuk agent yang membaca dokumen ini:**

- Decision di sini **bukan opini** — ada empirical foundation. Jangan re-debate kecuali ada data baru post-Mei 2026 yang bertentangan.
- Kalau encounter edge case, cek section "Edge cases" di decision yang relevan **sebelum** asumsi.
- Kalau situasi tidak ter-cover di "Edge cases", tanya user, jangan asumsi.

---

## RESEARCH METHODOLOGY

Decisions di-triangulate dari 3 deep research reports yang dijalankan paralel di Mei 2026:

- **Perplexity Deep Research** — paling konservatif, banyak "no recent data found" yang jujur. URL citation verifiable.
- **Claude Deep Research** — analitis terdalam, banyak numerical guidelines, MMMT-IF data, ETH Zurich findings, Cloudflare Code Mode.
- **Gemini Deep Research** — paling detail, banyak ArXiv ID. Source list di-cross-check, mayoritas terverifikasi.

**Trust rule yang dipakai:**

| Confidence | Definisi | Use |
|---|---|---|
| **HIGH** | Muncul di 2+ sources independen | Decision-grade, langsung pakai |
| **MEDIUM** | 1 source kuat dengan citation primer (ArXiv, official docs, NIST) | Pakai dengan caveat |
| **LOW** | 1 source tanpa citation primer | Treat sebagai hypothesis, tunggu validation |

---

## D1 — Format Instruksi: Numbered Markdown + YAML Frontmatter

### What
Rules pack ditulis dalam format:

```markdown
---
id: SEC-001
priority: critical
scope: all-tasks
applies_to: [backend, fullstack]
---

## SEC-001: Authentication Boundaries

1. Setiap endpoint user-facing WAJIB validate JWT signature
2. Algorithm pinning REQUIRED — reject `alg: none`
3. Token TTL maksimal 1 jam
4. Refresh token rotation MANDATORY pada logout
```

**Bukan:**
- Prosa narratif yang panjang
- Pure DSL custom yang tidak dipahami AI
- YAML murni tanpa human-readable narrative
- Markdown tanpa numbering atau ID system

### Why

**1. Curse of Instructions (research finding)**
Studi OpenReview ICLR mengidentifikasi fenomena "Curse of Instructions" — ketika instruksi sistem berisi puluhan kondisi, model gagal eksponensial mengikuti semua secara bersamaan. Numbered list dengan rule ID memitigasi ini karena:
- Model bisa retrieve specific rule ("Apply SEC-001") tanpa scan seluruh prosa
- Setiap rule = atomic unit yang bisa di-reference

**2. Token efficiency tanpa kehilangan substansi (EACL Findings 2026)**
Empirical study membuktikan structured format menghasilkan **+6.74% accuracy** untuk reasoning tasks vs prose. Estimasi token efficiency 15-30% gain (belum di-benchmark formal untuk instruction sets — itu tugas Phase 0 untuk validate).

**3. Cross-model compatibility**
Markdown adalah format yang dipahami **semua model 2026** native — Claude, GPT, Gemini, Grok, open models (Qwen, DeepSeek, Llama). Pure DSL gagal di model <12B parameter (MetaGlyph paper finding).

**4. ETH Zurich finding tentang AGENTS.md**
ArXiv 2601.18341, study di 129K repos: AGENTS.md yang berisi prosa filosofis menurunkan task success -3% dan menaikkan cost +20%. Format harus **faktual & directive**, bukan narrative.

### Sources (HIGH confidence — triangulated)

- **OpenReview ICLR 2026** — Curse of Instructions paper
- **EACL Findings 2026** — Structured vs prose format comparison
- **ArXiv 2601.18341** — ETH Zurich AGENTS.md study (129K repos)
- **3 research reports** convergence di "structured > prose" untuk LLM instructions

### Edge Cases (Sering Jadi Ambigu)

**Q1: Rule X butuh penjelasan panjang konteks, masih boleh numbered?**
Ya. Numbered list bisa berisi sub-bullet dengan penjelasan, asalkan main numbered point tetap directive (action-oriented).

```markdown
1. WAJIB validate JWT signature pada setiap user-facing endpoint
   - Library yang disetujui: jsonwebtoken (Node.js), pyjwt (Python)
   - Algoritma yang disetujui: RS256, ES256
   - Eksplisit reject: `alg: none`, `alg: HS*` (kecuali untuk internal service-to-service)
```

**Q2: Boleh ada paragraf intro sebelum numbered list?**
Maksimum 1 paragraf, max 3 kalimat, **factual context only** (bukan motivational/philosophical). Contoh OK:
> "Authentication boundaries adalah perimeter kritis. Pelanggaran di sini = full account compromise."

Contoh NOT OK (filosofis, ETH Zurich red flag):
> "We believe in defense-in-depth as a core engineering value. Security is everyone's responsibility, and..."

**Q3: Rule yang sangat sederhana (1 baris) butuh full structure?**
Ya, tetap pakai YAML frontmatter + ID + numbered (walau cuma 1 item). Konsistensi struktur penting untuk machine parsing.

**Q4: Boleh nested structure (sub-rules)?**
Hindari nesting > 2 level. Kalau butuh deeper, pecah jadi multiple rules dengan ID terpisah (SEC-001, SEC-001-A, SEC-001-B).

**Q5: Negative instructions ("don't do X") — boleh?**
Lebih baik **rephrase ke positive form** untuk model open-source compatibility.

❌ "Jangan gunakan `var`"
✅ "HANYA gunakan `const` atau `let`"

❌ "Jangan return `null`"
✅ "Return `Result<T, Error>` type, atau throw explicit error"

Alasan: research membuktikan model next-token prediction kadang justru "trigger" pattern yang dilarang karena attention mechanism. Positive framing lebih reliable.

### What NOT to Do

- ❌ **Tulis prosa filosofis** — ETH Zurich -3% success
- ❌ **LLM-generated content untuk rules** — sama, ETH Zurich finding
- ❌ **Pure custom DSL** — gagal di open model <12B
- ❌ **YAML murni tanpa human narrative** — manusia jadi sulit maintain
- ❌ **Numbered tanpa ID** — kehilangan referenceability untuk reflection block (D6 Layer 2)

---

## D2 — Source Strategy: Single AGENTS.md + Adapter Generator

### What
- **AGENTS.md di root = source of truth tunggal**
- Auto-generate adapter files saat `init` atau `sync`:
  - `CLAUDE.md` → satu baris `@AGENTS.md`
  - `GEMINI.md` → satu baris import (kalau tool support)
  - `.cursor/rules/main.mdc` → derived dengan YAML frontmatter `globs`
  - `.windsurfrules` → derived
- Hindari maintain N file paralel manual

### Why

**1. AGENTS.md adalah konsensus de facto 2026**
- 60.000+ open-source repos sudah adopt (agents.md official)
- **Linux Foundation Agentic AI Foundation (AAIF)** Desember 2025: AGENTS.md masuk governance bersama MCP dan Goose
- AAIF members: OpenAI, Anthropic, Google, AWS, Bloomberg, Cloudflare
- Native support: Codex CLI, Devin, Amp, Goose, Aider, Continue
- Adapter support: Cursor (via reading), Claude Code (via @AGENTS.md import), Windsurf

**2. Maintenance overhead nightmare avoidance**
Maintain CLAUDE.md + GEMINI.md + .cursorrules + .windsurfrules + dll secara manual = N place to update tiap rule change. Single source = O(1) maintenance.

**3. Cache invalidation control**
Kalau N files maintained manually, drift between files menyebabkan inconsistency. Auto-generate dari single source guarantees parity.

### Sources (HIGH confidence — triangulated)

- **agents.md official** — adoption metrics
- **Linux Foundation AAIF announcement** — Desember 2025
- **3 research reports** convergence
- **ArXiv 2601.18341** ETH Zurich — AGENTS.md effective tapi watch content quality

### Edge Cases

**Q1: Tool X tidak support AGENTS.md, harus maintain file native?**
Auto-generator harus include adapter untuk tool tersebut. Kalau tool sangat niche dengan format unik, generate dari template parameterized — **tetap dari AGENTS.md sebagai source**, jangan maintain manual.

**Q2: User punya rule khusus untuk tool tertentu (Cursor only feature)?**
Pattern: section di AGENTS.md dengan metadata `applies_to: [cursor]`. Adapter generator filter section yang relevan.

**Q3: Kalau AGENTS.md belum ada di repo user (init flow)?**
Generate AGENTS.md template dari rules pack ini, bukan generate file native langsung. Always go through AGENTS.md.

### What NOT to Do

- ❌ **Maintain N file manually** — drift inevitable
- ❌ **Generate AGENTS.md content via LLM** — ETH Zurich -3% success
- ❌ **Skip AGENTS.md** karena tool target tidak support — tetap bikin, lalu adapter
- ❌ **Hardcode tool-specific format di rules content** — separation of concerns: rules = canonical, adapter = format

---

## D3 — MCP Strategy: Optional + REPOSITION untuk Validation

### What

**MCP TIDAK untuk:**
- ❌ Push rules content ke prompt (anti-pattern)
- ❌ Replace AGENTS.md sebagai delivery mechanism
- ❌ Required untuk basic functionality

**MCP IYA untuk (opt-in, advanced):**
- ✅ `validate_against_rules(code, ruleIds[])` — agent panggil pasca-generation untuk verify compliance
- ✅ `lookup_rule(ruleId)` — drill-down on demand kalau rules library besar
- ✅ `audit_compliance(diff)` — runtime check di CI

Pattern reverse: **MCP mengecek rules, bukan mengirim rules**.

### Why

**1. Cloudflare Code Mode 98% token saving (engineering blog Maret 2026)**
Cloudflare demonstrate bahwa membiarkan agent **discover** dan **call** tools secara dinamis (vs loading all definitions upfront) menghasilkan 98%+ token savings. Pattern ini = anti-thesis dari "dump everything into context".

**2. MCP fatigue / Context war (3 sources convergence)**
Per Mei 2026:
- 9.400+ MCP server aktif di registry
- 78% enterprise AI teams melaporkan ≥1 MCP-backed agent di production
- Tapi: terlalu banyak concurrent MCP server = context window mengisi dengan tool definitions, kualitas menurun
- "MCP Paradox" — fitur yang membuat MCP frictionless juga membuat structurally fragile

**3. Cache invalidation problem**
MCP server return rules content yang berubah-ubah per task = break exact prefix match (D4 caching). File-based AGENTS.md = stable, cacheable.

**4. Security exposure**
- CVE 2026 series: code-mcp RCE, MCP SDK command injection
- 15% remote MCP servers exposed tanpa auth memadai
- Static rules via file = zero attack surface tambahan

### Sources

- **HIGH** — Cloudflare blog Maret 2026 (Code Mode 98% saving)
- **HIGH** — MCP roadmap modelcontextprotocol.io
- **MEDIUM-HIGH** — CVE numbers (SentinelOne + LiteLLM docs sources ada, NIST verification pending)
- **HIGH** — 3 reports convergence di "MCP fatigue real"

### Edge Cases

**Q1: User minta MCP server untuk deliver rules — boleh?**
Tolak dengan rujukan ke decision ini. Tapi tawarkan alternatif:
- File-based AGENTS.md untuk static rules
- MCP tool untuk **validation** (post-generation check)
- MCP tool untuk **lookup** (drill-down kalau rules >100)

**Q2: Validation tool butuh akses ke seluruh rules content — bagaimana implement?**
- Tool punya read access ke `.agent-context/rules/*.md` di filesystem
- Tool query rule by ID (`lookup_rule("SEC-001")`)
- Return rule content sebagai response, **bukan inject ke prompt context**

**Q3: Tool latency concern?**
- STDIO MCP local: ~38ms median (acceptable)
- Remote OAuth-mediated: 100-410ms (defer kalau bisa)
- Default ke local STDIO untuk Phase 3 implementation

### What NOT to Do

- ❌ **MCP server sebagai required dependency** — bikin file-based fallback default
- ❌ **Schema definition heavyweight** — keep tool surface minimal
- ❌ **Multiple MCP server untuk satu domain** — consolidate
- ❌ **MCP tanpa sandbox guidance** — security exposure

---

## D4 — Caching Architecture: Three-Layer Sandwich

### What

Setiap prompt struktur 3 layer:

```
Layer 1: STATIC PREFIX (cacheable, ~5K tokens)
- Identity + role
- Tool definitions (stabil per release)
- Always-include critical rules
─── cache_control breakpoint ───

Layer 2: SEMI-STATIC (cacheable, variable)
- Project AGENTS.md content
- Skill files yang sudah loaded
─── cache_control breakpoint ───

Layer 3: DYNAMIC (NOT cached)
- Retrieved rules (kalau retrieval aktif)
- Code context
- User message
- Conversation history
```

### Why

**1. Anthropic TTL regression Maret 2026**
TTL default turun dari 60 menit ke 5 menit secara silent (GitHub Issue #46829, Reddit follow-up dengan data, Anthropic postmortem). Dampak: cost cache creation naik 20-32%. Mitigasi: explicit `cache_control` breakpoint, opsi 1-hour TTL untuk session panjang.

**2. Cache hit savings massif**
- Anthropic: 90% off input untuk cache hit
- OpenAI: 50-90% off (model dependent)
- Gemini: 75-90% off
- Production case study: 85% cost reduction dengan caching benar (50K request/day)

**3. Universal ordering bekerja semua provider**
- Claude: explicit `cache_control` di breakpoint
- OpenAI: auto-detect prefix (1024 token min)
- Gemini: explicit `CachedContent` di Layer 1+2 boundary
- Grok: server affinity via `x-grok-conv-id` header (Tier B finding)
- DeepSeek/Qwen: syntax sama Claude

**4. Break-even analysis**
- Claude 5-min TTL: break-even setelah 1-2 read
- Claude 1-hour TTL: break-even setelah 3 read (worth untuk session panjang)
- OpenAI: tidak ada write penalty, langsung worth

### Sources (HIGH confidence)

- **Anthropic Claude API docs** April 2026
- **OpenAI Prompt Caching docs** Februari 2026
- **Google Gemini Context Caching docs** Mei 2026
- **GitHub Issue anthropics/claude-code #46829** — TTL regression evidence
- **xAI docs official** — Grok caching behavior

### Edge Cases

**Q1: Project AGENTS.md panjang banget (>20K tokens), gimana split Layer 1 vs 2?**

Layer 1 = **rules paling kritis dan paling stable** (security, error-handling, naming). Maksimal ~5K tokens.

Layer 2 = **project-specific context** yang lebih variable.

Kalau Layer 1 + 2 > 50K tokens total: pertimbangkan retrieval (Phase 4 trigger).

**Q2: Tool definitions berubah antar release — break cache?**

Ya. Pattern: keep tool surface stabil per major version. Kalau add tool baru, **append di akhir Layer 1**, bukan insert di tengah.

**Q3: User punya custom rules yang sangat sering berubah — di Layer 2?**

Custom rules yang sering berubah = Layer 3 (dynamic), bukan Layer 2. Layer 2 = "berubah per project setup, TIDAK berubah per task".

**Q4: Conversation history numpuk, tetap di Layer 3?**

Ya, tapi clear session sebelum task baru. Power user pattern: clear session kalau sudah >N turns. Saving 30-70%.

### What NOT to Do

- ❌ **Insert dynamic content di Layer 1** — invalidate cache
- ❌ **Reorder Layer 1 antar request** — exact prefix match break
- ❌ **Forget cache_control marker untuk Claude** — manual cache miss
- ❌ **Skip layer separator markers** — agent harus tahu mana yang stable

---

## D5 — Retrieval Implementation: DEFER ke Phase 4, Conditional

### What

- **Phase 0-3:** Static always-include semua rules. Tidak ada retrieval.
- **Phase 4 (conditional):** Implement retrieval **kalau** measurement menunjukkan kebutuhan.

Trigger Phase 4:
- Rules library tumbuh > 30 active rules
- ATAU user feedback "rule miss rate > 10%"
- ATAU benchmark menunjukkan token cost masih > target meskipun caching aktif

Stack saat dibutuhkan:
- **Embedding:** nomic-embed-text v1.5 via @huggingface/transformers (~120MB, MTEB 62.39)
- **Vector store:** sqlite-vec (Node 22+ native)
- **Hybrid:** + lunr.js BM25 untuk technical jargon
- **Activation:** opt-in via `--retrieval` flag

### Why

**1. Premature optimization risk**
Untuk ~50 rules, retrieval **mungkin tidak worth complexity**:
- Embedding model +120MB install size (vs core <2MB)
- Vector DB infrastructure
- Hybrid retrieval implementation
- Cache invalidation strategy untuk embeddings
- Re-rebuild trigger handling

Kalau static load ~5K tokens cukup untuk hit cache, kompleksitas retrieval = lose-lose.

**2. Retrieval miss rate concern**
- Top-3 retrieval dari 50 rules: estimasi 60-70% recall (no formal benchmark untuk instruction sets)
- Critical rule yang miss = catastrophic failure
- Mitigation: always-include critical layer + retrieved layer

**3. Hybrid retrieval wajib untuk technical jargon (3 sources)**
Pure semantic retrieval kadang miss exact keyword matching (function name, library name). BM25 handle exact match, vector handle semantic. Need both.

**4. Continue.dev validation**
Continue.dev (>$1B coding tool) menggunakan LanceDB + retrieval untuk codebase. Ini validates pattern, tapi mereka punya millions of code files — bukan 50 rules.

### Sources

- **HIGH** — 3 reports convergence di "hybrid retrieval untuk technical jargon"
- **MEDIUM** — embedding model recommendations (Claude rec: nomic-embed)
- **LOW** — formal benchmark untuk instruction set retrieval (gap research)

### Edge Cases

**Q1: User insist retrieval dari Phase 1 — bagaimana?**

Tolak dengan data:
- Tunjukkan bahwa Phase 0 baseline masih bisa di-cache 70%+
- Show install size impact (+120MB)
- Show maintenance burden (rebuild triggers, cache invalidation)
- Offer opt-in flag, bukan default

Kalau user tetap insist setelah edukasi, dokumentasi keputusan di phase outcome.

**Q2: Rules library kecil (<20) — perlu retrieval?**
Tidak. Static always-include lebih efisien.

**Q3: Re-build embeddings kapan?**
- Saat `npm install` (first setup)
- Saat git pull yang mengubah rules files (pre-commit hook)
- Manual trigger via `--rebuild-index`
- TIDAK setiap session

**Q4: Cara measure miss rate?**
Phase 4 wajib build evaluation set: 50 sample tasks dengan ground truth (rule mana yang seharusnya trigger). Run retrieval, ukur recall@3.

### What NOT to Do

- ❌ **Premature implementation di MVP** — Phase 0-3 dulu
- ❌ **Pure vector tanpa BM25** untuk technical jargon
- ❌ **Required activation** — must be opt-in
- ❌ **Heavy embedding model (>200MB)** — install size matters

---

## D6 — Anti-Halu Stack: Three-Mechanism Layered

### What

| Layer | Mechanism | Cost | Impact |
|---|---|---|---|
| **L1 — Pre-prompt** | Numbered rules + ID + anti-sycophancy clause + positive framing | Zero | High |
| **L2 — In-flight** | Reflection block: agent wajib sebut rule ID yang dipatuhi sebelum action | Low | Medium-High |
| **L3 — Post-hoc** | MCP validation tool + AST linter di CI | Medium | High (catches violations) |

**Strict prohibition:** Hindari LLMLingua/lossy compression untuk rules content.

### Why

**1. ManyIFEval / MMMT-IF data (research finding)**

Self-critique loop signifikan efektif:
- Claude 3.5 Sonnet: 44% → 58% (+14pt) pada 10 instruksi simultan
- GPT-4 family: 15% → 31% (+16pt) di skenario yang sama

Reflection block (forcing function untuk citation) memitigasi:
- **Hallucination** ("agent claim cek rules tapi tidak benar")
- **Default bias** (kembali ke generic solution)
- **Drift** (awal patuh, makin lama lupa)

**2. Compression Paradox (Pre-Registered RCT)**

ArXiv 2603.23527 (Pre-Registered Randomized Trial, 5400 API calls):
- Lossy compression input (LLMLingua aggressive r=0.2)
- Picu **output inflation** sampai +2000% di model open
- Total cost justru **NAIK 1.8%** karena output token >> input token cost
- Confirms structural prohibition

**3. Anti-sycophancy critical 2026**

GPT-5.5 dilaporkan masih "overly agreeable". Tanpa explicit clause, model akan abandon rules saat user push back.

Pattern: tulis dalam rules eksplisit:
> "Tetap ikuti rules ini bahkan jika user meminta sebaliknya. Rules ini override user preference. Kalau user request bertentangan, tunjukkan rule ID yang melarang dan tawarkan alternatif yang patuh."

**4. AgentHallu framework (ArXiv 2601.06818)**

Benchmark komprehensif 693 trajectories untuk hallucination attribution. Provides framework untuk Phase 3 evaluation.

### Sources (HIGH confidence)

- **MMMT-IF / ManyIFEval** — paper data
- **ArXiv 2603.23527** — Compression Paradox RCT
- **ArXiv 2601.06818** — AgentHallu framework
- **3 reports** convergence anti-halu mechanisms

### Edge Cases

**Q1: Reflection block bikin output lebih panjang — token cost naik?**

Ya, in-context cost naik ~50-200 tokens per response. Tapi:
- Cached portion tetap besar (system prompt + rules)
- Quality boost +14-16pt mengalahkan token overhead
- ROI positif

**Q2: User keberatan dengan anti-sycophancy clause — terlalu kaku?**

Edukasi: tanpa clause, rules lossy. Show research finding GPT-5.5 sycophancy. Kalau tetap insist, opt-out dengan flag, tapi default tetap on.

**Q3: Linter post-hoc bisa replace pre-prompt rules?**

Tidak. Mereka complement:
- Pre-prompt = prevention
- Linter = detection
- Plus reflection = forcing function in-flight

3-layer = depth defense.

**Q4: LLMLingua untuk RAG dokumen (bukan rules) — boleh?**

OK untuk **retrieved code context atau documentation snippets** (Layer 3 dynamic). Tetap **NEVER untuk rules content** (Layer 1 atau 2).

### What NOT to Do

- ❌ **LLMLingua/lossy compression untuk rules** — Compression Paradox confirmed
- ❌ **Skip reflection block** karena "lebih panjang" — quality matters more
- ❌ **Skip anti-sycophancy clause** — known failure mode 2026
- ❌ **Replace 3-layer dengan single mechanism** — defense in depth

---

## RESEARCH SOURCES INDEX

Ranked by trust level. Klaim dari sources HIGH bisa dipakai langsung sebagai foundation decision. Klaim dari LOW perlu validation.

### HIGH Trust (used for decisions)

- **OpenReview ICLR 2026** — Curse of Instructions
- **EACL Findings 2026** — Structured format superiority
- **ArXiv 2601.18341** — ETH Zurich AGENTS.md study
- **ArXiv 2603.23527** — Compression Paradox RCT
- **ArXiv 2601.06818** — AgentHallu framework
- **GitHub Issue anthropics/claude-code #46829** — TTL regression evidence
- **agents.md official** — adoption metrics
- **Linux Foundation AAIF** — governance backing
- **modelcontextprotocol.io** — MCP roadmap
- **Cloudflare engineering blog Maret 2026** — Code Mode 98% saving
- **Anthropic / OpenAI / Google official docs** — caching mechanics

### MEDIUM Trust (use with caveat)

- **MMMT-IF / ManyIFEval** — paper data, smaller benchmark
- **MTEB leaderboard** — embedding model rankings
- **NoLiMa, RULER** — long-context degradation (uses older models)
- **CVE-2026-7812, CVE-2026-30623** — SentinelOne + LiteLLM sources, NIST verify pending

### LOW Trust (treat as hypothesis)

- **Specific compression ratios** (62-81% MetaGlyph, 99.1% Telegraph) — paper exists, ratio belum diverifikasi langsung
- **Token breakdown percentages** (% system vs code vs history) — practitioner estimates, no vendor telemetry
- **Per-model adherence rate** untuk long system prompts spesifik — research gap
- **xAI Grok `x-grok-conv-id`** — solo Gemini source dengan partial corroboration

---

## CHANGELOG OF DECISIONS

Setiap kali decision di-update, log di sini dengan tanggal + alasan.

| Date | Decision | Change | Reason |
|---|---|---|---|
| 2026-05-16 | All D1-D6 | Initial creation | Triangulated dari 3 research reports |

---

**Last updated:** 2026-05-16. Update dokumen ini setiap encounter edge case yang sering terjadi (add ke section Edge Cases) atau setiap new research findings post-Mei 2026 yang challenge decisions yang ada.
