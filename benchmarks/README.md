# Benchmarks

Reproducible measurement suites for this repository. Release-facing claims must point to tracked JSON evidence under `benchmarks/results/` or to deterministic benchmark commands that print machine-readable output.

## Folder Structure

```text
benchmarks/
|-- anti-halu/              Provider-free anti-hallucination fixtures and scorer
|-- compact-natural-mode/   Response compression fixtures and scorer
|-- runtime-token-saver/    ASCX command-output compression fixtures
|-- token-usage/            Provider token-counting and cache simulation benchmark
|-- results/                Tracked release evidence JSON
`-- README.md
```

## Active Benchmarks

| Suite | Folder | Status | Output |
| --- | --- | --- | --- |
| Token usage baseline | `token-usage/` | Historical release evidence | `results/baseline-{YYYY-MM-DD}.json` |
| Cache simulation | `token-usage/` | Historical release evidence | `results/cache-phase-2-{YYYY-MM-DD}.json` |
| Anti-halu benchmark | `anti-halu/` | Active deterministic gate | `results/anti-halu-phase-3-{YYYY-MM-DD}.json` |
| ASCX runtime token saver | `runtime-token-saver/` | Active deterministic gate | stdout via `npm run benchmark:ascx` |
| Compact Natural Mode | `compact-natural-mode/` | Active deterministic gate | stdout via `npm run benchmark:compact-natural` |
| Release benchmark bundle | `results/` | Active integrity gate | `results/release-bundle-{semver}.json` |

## Running Benchmarks

Use the package scripts for active gates:

```bash
npm run benchmark:adaptive-context
npm run benchmark:ascx
npm run benchmark:compact-natural
npm run benchmark:anti-halu
npm run build:release-bundle
npm run audit:release-bundle
```

See `benchmarks/token-usage/README.md` for the provider token-counting benchmark details.

## Reproducibility Requirements

1. Use Node 22 or the runtime version documented by the current package metadata.
2. Do not add runtime dependencies to the core package for benchmark-only work. Benchmark tooling belongs in `devDependencies`.
3. Keep JSON output deterministic where possible. If timestamps or host facts vary, isolate them in metadata fields.
4. Include schema version, timestamp, and tooling version when a result file is tracked so older evidence remains interpretable.

## Result Files Convention

- Track release evidence under `benchmarks/results/*.json`.
- Use `{suite-name}-{YYYY-MM-DD}.json` or `{suite-name}-{semver}.json`.
- Do not store raw API responses, secrets, tokens, or user data.
- Historical phase outcomes are consolidated in `docs/archive/HISTORY.md`.
- Live benchmark reporting rules are in `docs/benchmark-reference.md`.

## Why This Exists

Claims such as "40% token saving" or "rule adherence improved" need reproducible evidence. These suites are the comparator surface for README, changelog, release, and planning claims.
