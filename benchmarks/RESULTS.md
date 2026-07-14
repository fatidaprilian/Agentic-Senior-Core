# Benchmark Results

Model: `claude-opus-4-6` | Date: 2026-07-14 | Runs: 1 per combination

## greenfield-api

Add a GET /api/health endpoint returning JSON with status, timestamp, and Node version.

| Metric | With ASC | Without ASC | Delta |
|--------|----------|-------------|-------|
| LOC added | +9 | +9 | 0% |
| LOC removed | 0 | 0 | — |
| Files changed | 2 | 2 | — |
| Tokens (total) | 4,192 | 4,322 | -3% |
| Tokens (output) | 252 | 248 | +2% |
| Cost | $0.0504 | $0.0509 | -1% |
| Duration | 20.1s | 23.2s | -13% |
| Turns | 4 | 5 | -20% |

## refactor-bloat

Simplify utils.js without changing the exported API.

| Metric | With ASC | Without ASC | Delta |
|--------|----------|-------------|-------|
| LOC added | +10 | +10 | 0% |
| LOC removed | -97 | -97 | 0% |
| Net delta | -87 | -87 | 0% |
| Files changed | 2 | 2 | — |
| Tokens (total) | 4,980 | 5,410 | -8% |
| Tokens (output) | 1,017 | 942 | +8% |
| Cost | $0.0704 | $0.0708 | -1% |
| Duration | 36.7s | 37.4s | -2% |
| Turns | 4 | 4 | 0% |

## Summary

With ASC rules active:
- Token consumption reduced 3-8% (input savings from fewer turns and leaner context)
- Duration reduced 2-13%
- Code output identical in both tasks (same LOC delta, same functional result)
- No safety violations observed in either mode

The ASC ruleset provides modest efficiency gains without degrading code quality on these tasks.
