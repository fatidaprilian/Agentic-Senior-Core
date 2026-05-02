# Benchmark and Stack Reference

Historical note: This file is benchmark background. Treat it as evidence history, not active governance policy. Current agent behavior is controlled by `.instructions.md`, `.agent-context/`, and the active roadmap backlog.

This document contains local benchmark background moved out of README as part of V3.0-001 onboarding compression. It does not define stack defaults, vendor preferences, or external comparison baselines.

## Token Efficiency Benchmark Snapshot

Latest local benchmark snapshot date: 2026-04-11
Source: .agent-context/state/token-optimization-benchmark.json

| Scenario | Baseline Token Estimate | Agentic Native Token Estimate | Native Savings | RTK Token Estimate | RTK Status |
|----------|-------------------------|-------------------------------|----------------|--------------------|------------|
| Latest commit detail review | 3798 | 177 | 95.34% | 3798 | Detected (rtk v0.35.0) |
| Commit history review | 3730 | 889 | 76.17% | 1610 | Detected (rtk v0.35.0) |
| Search result scan | 5339 | 1099 | 79.42% | 5339 | Detected (rtk v0.35.0) |
| Average | - | - | 83.64% | 18.95% savings | Detected (rtk v0.35.0) |

Method notes:
- Estimate formula: ceil(output_chars / 4)
- Values represent command-output estimates, not provider-specific tokenizer counts.
- RTK behavior can vary by host utility availability.

Refresh benchmark data:

```bash
npm run benchmark:token
```

## Benchmark Commands

```bash
npm run benchmark:detection
npm run benchmark:writer-judge
npm run benchmark:bundle
npm run benchmark:continuity
```

Generate docs-quality drift report:

```bash
npm run report:docs-quality-drift
```

## Writer-Judge and Evidence Outputs

- Bundle output: .agent-context/state/benchmark-evidence-bundle.json
- Writer-judge matrix: .agent-context/state/benchmark-writer-judge-matrix.json
- Writer-judge config: .agent-context/state/benchmark-writer-judge-config.json
- Continuity benchmark: .agent-context/state/memory-continuity-benchmark.json

## Runtime and Stack Boundary

This repository no longer publishes static stack-fit tables or external benchmark watchlists. Runtime and dependency recommendations must come from the target repository evidence, the user's constraints, and current official documentation when ecosystem facts matter.
