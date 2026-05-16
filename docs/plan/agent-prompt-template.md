# Agent Prompt Template

> **Cara pakai:** Copy salah satu prompt di bawah ini, paste ke chat agent IDE kamu (Cursor, Windsurf, Claude Code, Kiro, dll).
> Pilih prompt sesuai stage yang sedang aktif.

---

## PROMPT 1 — Memulai Phase 0 (gunakan ini pertama kali)

```
Saya punya execution plan terstruktur di docs/plan/ untuk upgrade repo ini ke v4.

Tugas kamu sekarang:

1. WAJIB baca file berikut SECARA URUT:
   - docs/plan/00-context.md (overview + decisions summary)
   - docs/plan/research-foundation.md (empirical foundation + edge cases per decision)
   - docs/plan/phase-0-baseline.md (phase yang sedang aktif)

2. Setelah baca semua 3 file, summarize ke saya:
   - Tujuan Phase 0 dengan kata-kata kamu sendiri (1 paragraf)
   - 9 task yang akan dieksekusi (urut, nama dan tujuan singkat saja)
   - 4 GATE yang akan kamu temui dan tunggu approval saya
   - 3 prohibited patterns yang paling kritis untuk tidak dilanggar (dari 00-context.md)
   - 1 contoh edge case dari research-foundation.md yang relevan untuk Phase 0

3. Aturan eksekusi (WAJIB dipatuhi):
   - Eksekusi task BERURUTAN, jangan parallel atau loncat
   - Berhenti di setiap 🚦 GATE dan tunggu approval saya
   - Setiap task selesai, run `npm test && npm run validate` sebagai sanity check
   - Kalau ada ambiguity, CEK DULU research-foundation.md section yang relevan
   - Kalau tetap ambigu setelah cek research-foundation, TANYA SAYA jangan asumsi
   - Jangan modifikasi file di luar scope task yang sedang dikerjakan
   - Jangan ubah file di .agent-context/ — itu yang sedang diukur, harus tetap baseline
   - Commit per task dengan format: `chore(phase-0): <description>` atau `refactor(phase-0): ...`
   - Bekerja di branch `phase-0-baseline`, bukan `main`

4. Hard prohibitions (lihat docs/plan/00-context.md untuk full list):
   - JANGAN tambah runtime dependencies ke core (devDeps OK untuk benchmark)
   - JANGAN ubah behavior rules pack — ini measurement-only phase
   - JANGAN skip GATE — selalu stop dan lapor
   - JANGAN re-debate decisions yang ada di research-foundation.md kecuali ada data baru post-Mei 2026

Setelah summarize point 1-2, TUNGGU saya bilang "go" sebelum mulai Task 0.1.
```

---

## PROMPT 2 — Lanjutkan setelah GATE (kalau session terputus)

```
Saya melanjutkan eksekusi Phase 0. Saya sudah approve sampai [GATE X].

1. Baca docs/plan/00-context.md untuk context
2. Baca docs/plan/research-foundation.md untuk empirical foundation (penting kalau ada edge case)
3. Baca docs/plan/phase-0-baseline.md untuk detail task
4. Cek progress dengan:
   - git log --oneline phase-0-baseline | head -20
   - git status
5. Tampilkan ke saya:
   - Task mana yang sudah complete (berdasarkan commits)
   - Task mana yang sedang in-progress (kalau ada uncommitted changes)
   - Next task apa
6. TUNGGU saya bilang "lanjut" sebelum mulai task berikutnya

Aturan eksekusi sama seperti sebelumnya: berurutan, stop di GATE, cek research-foundation kalau ambigu.
```

---

## PROMPT 3 — Hadapi situasi error / unexpected

```
Saya hadapi error / situasi yang tidak diantisipasi di docs/plan/phase-0-baseline.md.

Situasi:
[deskripsikan error / situasi]

Tolong:
1. Baca docs/plan/00-context.md (terutama section "PROHIBITED PATTERNS" dan "DECISIONS YANG SUDAH FINAL")
2. Baca docs/plan/research-foundation.md — cari decision yang relevan dengan situasi ini, baca section "Edge cases" dan "What NOT to do"
3. Baca docs/plan/phase-0-baseline.md untuk konteks task
4. JANGAN langsung fix. Analyze dulu:
   - Apakah ini bug di code, bug di plan, atau ambiguity dalam instruksi?
   - Apakah ada edge case di research-foundation.md yang persis match?
   - Apakah ada decision yang sudah final yang relevan?
   - Apa 2-3 opsi penyelesaian dengan trade-off?
5. Kasih saya analysis + opsi, TUNGGU saya pilih sebelum eksekusi
```

---

## PROMPT 4 — Setelah Phase 0 selesai, generate Phase 1

```
Phase 0 sudah complete dan approved (lihat docs/plan/phase-0-outcome.md).

Saya pilih Decision B = [B1 / B2 / B3]
[Tambah konteks lain dari GATE D approval]

Tugas kamu:
1. Baca:
   - docs/plan/00-context.md
   - docs/plan/phase-0-outcome.md (untuk baseline numbers)
2. Generate `docs/plan/phase-1-format.md` dengan format yang sama-detail seperti `phase-0-baseline.md`:
   - Tujuan + scope/boundary
   - Task breakdown dengan acceptance criteria
   - GATE points untuk approval
   - Hard prohibitions
   - Summary checklist
   - Notes for agent
3. Phase 1 fokus: Format Migration (numbered markdown + YAML frontmatter)
4. Decisions yang relevan: D1, D2 di 00-context.md
5. JANGAN start eksekusi Phase 1, hanya generate file plan-nya
6. Setelah file generated, tampilkan summary ke saya untuk review sebelum approve

Pakai pattern yang sama: 8-10 task, 3-4 GATE, deliverables jelas.
```

---

## TROUBLESHOOTING SHORTCUT

### Agent mulai tindak di luar scope

```
STOP. File yang sedang kamu modifikasi tidak ada di scope task ini.

Cek docs/plan/phase-0-baseline.md, section "Files yang boleh dibuat/dimodifikasi" untuk task yang sedang aktif.

Kalau kamu yakin perlu modify file di luar scope, jelaskan kenapa dan tunggu approval saya.
```

### Agent skip GATE

```
STOP. Kamu skip 🚦 GATE [X].

Baca ulang docs/plan/phase-0-baseline.md. Setiap GATE wajib stop dan tunggu approval saya.

Lapor progress sampai task terakhir yang complete, lalu tunggu instruksi saya.
```

### Agent bikin asumsi alih-alih bertanya

```
Kamu bikin asumsi tentang [hal]. 

Aturan plan ini: kalau ambigu, TANYA, jangan asumsi.

Revert perubahan terkait asumsi ini, kasih saya 2-3 opsi dengan trade-off, dan tunggu saya pilih.
```

### Agent claim "done" tapi acceptance criteria tidak tercapai

```
Sebelum claim done, list acceptance criteria di docs/plan/phase-0-baseline.md untuk task ini.

Untuk setiap checkbox, tunjukkan bukti concrete (file path, command output, test result) yang verify kriteria itu tercapai.

Kalau ada criteria yang belum, lanjut kerjakan jangan claim done dulu.
```

---

## PROMPT KHUSUS UNTUK MAINTENANCE

### Update status di 00-context.md setelah Phase selesai

```
Update docs/plan/00-context.md, section "STATUS TRACKING", row Phase [X]:
- Status: ✅ Completed
- Started: [date dari git log]
- Completed: [today]
- Notes: [1-2 sentence summary]

Plus update "Last updated" di bottom file dengan summary outcome.
```

### Generate Phase berikutnya

Lihat PROMPT 4 di atas, ganti angka Phase sesuai yang aktif.

---

## PRINCIPLE PENTING

Agent yang membaca dokumen ini, ingat:

1. **Plan ini hasil research mendalam** — ada di docs/plan/00-context.md section research sources. Decisions di sana **bukan opini**, tapi backed by 2+ independent research sources. Jangan re-debate kecuali ada data baru.

2. **User adalah CTO project ini, kamu eksekutor** — kamu eksekusi task, user yang putuskan strategi. Setiap GATE adalah moment untuk mengembalikan kontrol ke user.

3. **Reproducibility matters lebih dari speed** — repo ini akan publish public benchmark. Setiap angka harus verifiable. Setiap claim harus backed by data.

4. **Honest > Impressive** — kalau task tidak bisa selesai sesuai criteria, lapor jujur. Jangan workaround yang break invariant lain.
