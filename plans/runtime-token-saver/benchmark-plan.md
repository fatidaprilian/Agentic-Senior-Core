# Runtime Token Saver Benchmark Plan

Status: MVP benchmark implemented locally.
Last updated: 2026-05-22.

## Benchmark Goal

Prove that ASC runtime token saving reduces command output while preserving enough evidence for a coding agent to continue safely.

The benchmark must measure more than token count. It must measure whether the compressed result still lets the agent debug correctly.

## Metrics

### Token Efficiency

- raw output size
- compact output size
- estimated token count before compression
- estimated token count after compression
- compression ratio
- added metadata size
- wrapper latency

### Evidence Preservation

- command preserved
- exit code preserved
- file path preserved
- line number preserved
- root error preserved
- assertion message preserved
- failing test name preserved
- changed file list preserved where relevant
- truncation marker present when output is incomplete
- raw tee path present when detail is removed

### Operational Safety

- passthrough count
- unsupported command count
- parse failure count
- tee write failure count
- false success count
- rerun count in agent evals
- raw tee read count
- double-compression warnings

### Agent Continuation

- continuation check count
- continuation pass rate
- failed continuation check count
- next-action support for changed files, hunk anchors, failing tests, raw tee decisions, and unsafe passthrough cases

## Fixture Categories

Fixtures live under:

```text
benchmarks/runtime-token-saver/
```

Run the MVP benchmark:

```bash
npm run benchmark:ascx
```

Current MVP fixture scope:

- `git status` clean repo
- `git status` many modified files
- `git status` staged and unstaged changes
- `git diff` small diff
- `git diff` large diff with truncation
- `git diff` generated lockfile noise
- `git diff` binary file signal
- `git diff` deleted file
- `npm test` all pass
- `npm test` pass with expected error-like logs
- `npm test` one failure
- `npm test` multiple failures
- `npm test` crash before tests run
- unsafe pipe passthrough
- unsafe redirect passthrough

Fixture categories:

1. Git status
   - clean repo
   - many modified files
   - staged and unstaged changes
   - untracked files

2. Git diff (implemented)
   - small diff
   - large diff
   - binary file signal
   - generated file noise
   - deleted file

3. Later: Git log
   - short history
   - long history
   - merge commits
   - reverse order request

4. Later: Search output
   - `rg` with many matches
   - repeated matches in vendor folders
   - no matches
   - binary match warning

5. JavaScript and TypeScript
   - `npm test` in MVP
   - `npm run build` later
   - `tsc --noEmit`
   - Vitest failures
   - Jest failures
   - ESLint or Biome output

6. General logs
   - repeated identical lines
   - stack traces
   - progress bars
   - package manager noise
   - warning floods

7. Unsafe shell cases
   - pipes
   - redirects
   - command substitution
   - loops
   - `xargs`
   - env-var prefixed commands

Unsafe cases should verify passthrough behavior.

## Release Gates

Do not release runtime token saver until these are true:

1. No false success on failing commands.
2. Exit code is preserved for all fixtures.
3. Raw tee file is written for every failed compressed command.
4. Every truncated output includes an explicit truncation marker.
5. Every compressed failure includes a raw output path.
6. Unsupported commands pass through safely.
7. Unsafe shell constructs pass through safely.
8. The benchmark report separates token savings from evidence quality.
9. Continuation pass rate is 100% for the MVP fixture set.
10. Later: `doctor` detects RTK and 9Router overlap risk.
11. Windows behavior is documented honestly before broad release claims.

## Acceptance Targets

Initial targets:

```text
git status: 50%+ reduction, no lost state
git diff: 40%+ reduction on large diffs, changed files preserved
rg: 50%+ reduction on noisy search, match files preserved
npm test: 50%+ reduction on failure output, failing tests preserved
logs: 60%+ reduction on repeated lines, repetition count preserved
```

These are starting targets, not marketing claims. Public claims need measured data from the actual benchmark.

## Agent Continuation Eval

Token savings alone are not enough.

Current fixtures include small continuation probes:

- Can the agent identify the failing file?
- Can the agent identify the failing line?
- Can the agent avoid rerunning the same command unnecessarily?
- Can the agent decide whether it needs the raw tee file?
- Can the agent explain what information was truncated?

The saved output passes only if it supports the next correct engineering action.

## Benchmark Output

Current report shape:

```json
{
  "reportName": "runtime-token-saver-benchmark",
  "generatedAt": "2026-05-18T00:00:00.000Z",
  "fixtures": [],
  "summary": {
    "rawBytes": 0,
    "compactBytes": 0,
    "estimatedTokenReduction": 0,
    "evidencePreservationPassRate": 0,
    "falseSuccessCount": 0,
    "teeWriteFailures": 0,
    "continuationPassRate": 0,
    "continuationCheckCount": 0,
    "failedContinuationCheckCount": 0
  }
}
```

## Anti-Goals

Do not benchmark only happy-path output.

Do not report only the best compression ratio.

Do not claim RTK or 9Router numbers as ASC numbers.

Do not use a lossy summary as the only source of truth when the raw output was needed.
