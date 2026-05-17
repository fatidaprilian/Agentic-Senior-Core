# Benchmarks

Reproducible measurement suites untuk repo ini. Setiap release publish hasil benchmark di `benchmarks/results/{name}-{date}.json` supaya klaim bisa diverifikasi.

## Folder Structure

```
benchmarks/
├── token-usage/        Token measurement per provider untuk rules pack delivery
├── results/            Output JSON yang dipublish per release (tracked di git)
└── README.md
```

## Active Benchmarks

| Suite | Folder | Status | Output |
|-------|--------|--------|--------|
| Token usage baseline | `token-usage/` | Phase 0 (in progress) | `results/baseline-{YYYY-MM-DD}.json` |

## Running Benchmarks

Setiap suite punya README sendiri di sub-folder. Lihat `token-usage/README.md` untuk instruksi spesifik.

## Reproducibility Requirements

1. Node version: lihat `package.json#engines` (jika ada) atau gunakan Node 22 LTS minimum.
2. Tidak boleh tambah dependency runtime ke core (`package.json#dependencies`). Benchmark hanya boleh pakai `devDependencies`.
3. Output JSON harus deterministic — jika ada nilai yang berubah antar run (timestamp, host info), pisahkan ke field metadata terpisah.
4. Setiap result file harus include schema version + timestamp + tooling version supaya hasil lama tetap interpretable.

## Result Files Convention

- Tracked di git (`benchmarks/results/*.json` whitelisted di `.gitignore`).
- Naming: `{suite-name}-{YYYY-MM-DD}.json` atau `{suite-name}-{semver}.json`.
- Tidak boleh berisi raw API response yang bisa expose secrets atau data user.
- Latest baseline per suite is referenced from `docs/archive/phase-2-outcome.md` and the live decision authority in `docs/architecture/decisions-foundation.md`.

## Why This Exists

Klaim seperti "hemat 40% token" atau "rule adherence +14pt" tanpa data reproducible = marketing. Suite di folder ini = comparator wajib untuk setiap claim di README atau release notes.
