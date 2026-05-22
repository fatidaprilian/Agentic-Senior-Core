# Compact Natural Benchmark Plan

Status: deterministic MVP benchmark implemented locally.
Last updated: 2026-05-22.

## Goal

Prove that Compact Natural Mode reduces user-facing output while preserving technical meaning, evidence, actionability, and professional register.

Token count is an efficiency metric, not a quality metric.

## Metrics

### Quality

- evidence preservation
- semantic equivalence
- actionability
- calibration and uncertainty preservation
- register quality
- redundancy elimination

### Efficiency

- baseline output token estimate
- compact output token estimate
- token reduction percentage
- sentence count before and after
- redundant sentence count

## Compact Quality Score

Score each dimension from 0 to 3:

- Evidence Preservation
- Semantic Equivalence
- Actionability
- Calibration
- Register Quality
- Redundancy Elimination

```text
CQS = total_score / 18
```

Target:

```text
CQS >= 0.80
token reduction >= 40% for summary/debug/review tasks
mandatory evidence failures = 0
```

Do not fold token reduction into CQS. A short wrong answer is still a failed answer.

## Mandatory Evidence Atoms

Fail the fixture if any required atom is removed or paraphrased:

- command
- code identifier
- file path
- line number
- test name
- exit code
- error message
- assertion mismatch
- destructive-operation warning
- breaking change
- assumption
- validation status
- next action

## Fixture Categories

Initial categories:

1. final implementation summary
2. debug root cause from command output
3. test failure explanation
4. passing test summary with noisy logs
5. single code review finding
6. multi-file code review summary
7. refactor summary with behavior-preservation claim
8. security finding
9. destructive command explanation
10. planning/architecture answer
11. commit message
12. PR description
13. dependency update risk summary
14. API behavior change summary
15. assumption challenge

Fixture design rule:

Avoid long canonical "ideal answer" examples that can become accidental style anchors. Keep fixture answer samples short and treat them as scorer inputs, not style guidance.

Each fixture stores:

- task type
- verbose baseline answer
- compact candidate answer
- required evidence atoms
- required technical claims
- required next actions
- calibration requirements
- negative controls that must fail

## Release Gates

Do not enable Compact Natural Mode globally until:

1. Mandatory evidence preservation is 100%.
2. CQS target passes across the fixture set.
3. Register quality has no dialect or broken-grammar failures.
4. Security and destructive-command fixtures pass with no hidden warnings.
5. Planning fixtures keep decision rationale and tradeoffs.
6. The benchmark report separates quality, evidence, and token reduction.

Current command:

```bash
npm run benchmark:compact-natural
```

## Red Flags

Fail the mode if it:

- replaces exact paths with vague locations
- paraphrases commands or flags
- hides tests that were not run
- drops assumptions
- drops uncertainty
- converts risk into confidence
- uses fragment dialect
- makes architecture answers too short to explain tradeoffs
