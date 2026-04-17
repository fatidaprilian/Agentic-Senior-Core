# Benchmark and Stack Reference

This document contains detailed benchmark, stack fit, and comparison data moved out of README as part of V3.0-001 onboarding compression.

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

## Supported Stack Map

| Stack | Recommended Blueprint | Best Fit |
|-------|-----------------------|----------|
| TypeScript | api-nextjs | Web app, fullstack product, CLI tooling |
| Python | fastapi-service | API service, automation, data-heavy backend |
| Go | go-service | Small, fast services and platform tooling |
| Java | spring-boot-api | Enterprise APIs and service-oriented systems |
| PHP | laravel-api | Conventional product backends |
| C# | aspnet-api | Microsoft stack services and enterprise apps |
| Rust | go-service | Performance-sensitive backend work |
| Ruby | laravel-api | Mature product services and backend workflows |
| React Native | mobile-app | Cross-platform mobile applications |
| Flutter | mobile-app | Cross-platform mobile applications |

## Benchmark Comparison (Current State)

| Capability | antigravity-awesome-skills | awesome-copilot | MiniMax-AI/skills | Agentic-Senior-Core |
|------------|----------------------------|-----------------|-------------------|---------------------|
| Skill organization | Large curated library | Resource catalog and governance docs | Domain-focused packs | Unified folder-based domain packs with tier routing |
| Architecture guidance | Strong practical patterns | Strong SoC and layered architecture | Strong applied templates | Consolidated architecture plus domain enforcement |
| CLI governance | Limited | Moderate | Moderate | Init and upgrade governance with dry-run and structured reports |
| Distribution operations | Basic | Moderate | Strong release checklists | Publish, rollback, compatibility gates, benchmark, and SBOM flows |
| Review quality | Pattern-oriented | Checklist-oriented | Gate-oriented | Planning, security, and benchmark review model with CI integration |
