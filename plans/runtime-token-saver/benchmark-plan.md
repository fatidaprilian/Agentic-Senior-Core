# Runtime Token Saver Benchmark Plan

Status: planned, unshipped.
Last updated: 2026-05-18.

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

## Fixture Categories

Create fixtures under a future benchmark folder. Suggested location:

```text
benchmarks/runtime-token-saver/
```

Fixture categories:

1. Git status
   - clean repo
   - many modified files
   - staged and unstaged changes
   - untracked files

2. Git diff
   - small diff
   - large diff
   - binary file signal
   - generated file noise
   - deleted file

3. Git log
   - short history
   - long history
   - merge commits
   - reverse order request

4. Search output
   - `rg` with many matches
   - repeated matches in vendor folders
   - no matches
   - binary match warning

5. JavaScript and TypeScript
   - `npm test`
   - `npm run build`
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
8. `doctor` detects RTK and 9Router overlap risk.
9. Windows behavior is documented honestly.
10. The benchmark report separates token savings from evidence quality.

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

Add small continuation probes:

- Can the agent identify the failing file?
- Can the agent identify the failing line?
- Can the agent avoid rerunning the same command unnecessarily?
- Can the agent decide whether it needs the raw tee file?
- Can the agent explain what information was truncated?

The saved output passes only if it supports the next correct engineering action.

## Benchmark Output

Future report shape:

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
    "teeWriteFailures": 0
  }
}
```

## Anti-Goals

Do not benchmark only happy-path output.

Do not report only the best compression ratio.

Do not claim RTK or 9Router numbers as ASC numbers.

Do not use a lossy summary as the only source of truth when the raw output was needed.
