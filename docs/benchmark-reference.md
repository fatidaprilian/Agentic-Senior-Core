# Benchmark and Stack Reference

Historical note: This file is benchmark background. Treat it as evidence history, not active governance policy. Current agent behavior is controlled by `AGENTS.md`, `.agent-context/`, and the active roadmap backlog.

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
npm run benchmark:adaptive-context
npm run benchmark:ascx
npm run benchmark:compact-natural
npm run benchmark:writer-judge
npm run benchmark:bundle
npm run benchmark:continuity
```

## Adaptive Context Benchmark

The Adaptive Context benchmark verifies that local deterministic triggers can map request text to the required ASC rule families before any model call is made.

Current fixture scope: 31 labeled prompts, including mixed Indonesian requests, implicit failure language, frontend visual defects, configuration exposure, worker silence, auth middleware cleanup, budget false-positive checks, idempotent endpoints, realtime recovery, and dependency update requests.

Refresh the report:

```bash
npm run benchmark:adaptive-context
```

Output: machine-readable JSON on stdout with fixture results, selected rule labels, selected rule files, selected prompts, selected docs, uncertainty, budget summary, and fallback status.

The same manifest shape is exposed to users through:

```bash
agentic-senior-core context "<request>" --json --file src/app/page.tsx
```

File path signals are optional. They let the resolver select context from known touched files instead of request wording alone.

## ASCX Runtime Token Saver Benchmark

The ASCX benchmark verifies that the explicit local `ascx` wrapper can reduce noisy command output while preserving debugging evidence.

Current fixture scope: `git status` clean/staged/unstaged/noisy output, `git diff` small/large/generated/binary/deleted output, `npm test` passing/failing/crashing output including expected error-like logs in passing tests, and unsafe pipe/redirect passthrough cases.

Refresh the report:

```bash
npm run benchmark:ascx
```

Output: machine-readable JSON on stdout with fixture results, compression state, original exit code, raw tee path status, estimated token reduction, evidence preservation pass rate, continuation pass rate, false success count, and tee write failures.

Current MVP contract: only `git status`, `git diff`, and `npm test` are compressed. Unsupported commands and unsafe shell syntax pass through without compression.

Generate docs-quality drift report:

```bash
npm run report:docs-quality-drift
```

## Compact Natural Mode Benchmark

The Compact Natural benchmark verifies that user-facing agent replies can become shorter without losing required technical evidence, actionability, calibration, or professional register.

Refresh the report:

```bash
npm run benchmark:compact-natural
```

Output: machine-readable JSON on stdout with fixture results, Compact Quality Score (CQS), estimated token reduction, mandatory evidence failures, semantic/actionability/calibration failures, register failures, and negative-control escape count.

Current fixture design is bias-safe by default: fixtures store required evidence atoms, claims, actions, and negative controls rather than long canonical "ideal answer" examples. The benchmark is deterministic and provider-free.

## Writer-Judge and Evidence Outputs

- Bundle output: .agent-context/state/benchmark-evidence-bundle.json
- Writer-judge matrix: .agent-context/state/benchmark-writer-judge-matrix.json
- Writer-judge config: .agent-context/state/benchmark-writer-judge-config.json
- Continuity benchmark: .agent-context/state/memory-continuity-benchmark.json

## Runtime and Stack Boundary

This repository no longer publishes static stack-fit tables or external benchmark watchlists. Runtime and dependency recommendations must come from the target repository evidence, the user's constraints, and current official documentation when ecosystem facts matter.

## Caching Effectiveness Reporting Format

This section defines the required shape for any document, JSON artifact, README claim, or release note that reports prompt-caching numbers attributable to this rules pack. It exists to prevent a single universal "caching saving" figure from mixing integration modes that have very different control surfaces.

### Why per-integration

Caching benefit is not a property of the rules pack alone. It is a joint property of:

1. The rules pack content (Layer 1 and Layer 2 stability).
2. The provider's caching mechanics (multiplier, TTL, eligibility threshold).
3. The integration path the user runs (direct API, programmatic SDK, or IDE wrapper).

When the user runs through an IDE wrapper, the wrapper controls the request path. The rules pack contributes prefix stability, but the saving is not measurable from the rules pack side because we do not see the wrapper's actual request shape.

### Integration modes

Recognized integration modes:

- `direct_api_anthropic`
- `direct_api_openai`
- `direct_api_gemini`
- `claude_code_sdk_programmatic`
- `claude_code_cli`
- `cursor`
- `windsurf`
- `codex_cli_openai`
- `kiro`

When a new integration is added, append it here and to the per-integration JSON shape below. Do not collapse two integrations into one row even if they target the same provider.

### Required JSON shape

Any caching-effectiveness report MUST split results per integration mode. Use the following shape:

```json
{
  "report_version": "<semver>",
  "generated_at": "<ISO 8601 timestamp>",
  "description": "<short>",
  "integration_breakdown": [
    {
      "integration_mode": "direct_api_anthropic",
      "control_surface": "user-controlled cache_control",
      "measurable_from_rules_pack": true,
      "method": "<e.g. tiktoken-cl100k_base-offline-estimate plus documented multiplier>",
      "scenario": "<e.g. with_loaded_rules>",
      "average_total_input_tokens": 0,
      "average_cacheable_layer_1_plus_2_tokens": 0,
      "average_warm_read_effective_tokens": 0,
      "effective_reduction_percent": 0,
      "source_url": "<official caching docs URL>",
      "verified_at": "<ISO date>"
    },
    {
      "integration_mode": "direct_api_openai",
      "control_surface": "automatic prefix detection",
      "measurable_from_rules_pack": false,
      "method": "eligibility-only",
      "scenario": "<e.g. with_loaded_rules>",
      "average_total_input_tokens": 0,
      "average_cacheable_layer_1_plus_2_tokens": 0,
      "average_warm_read_effective_tokens": null,
      "effective_reduction_percent": null,
      "source_url": "<official caching docs URL>",
      "verified_at": "<ISO date>",
      "note": "Model-specific pricing required; do not encode a universal multiplier."
    },
    {
      "integration_mode": "claude_code_sdk_programmatic",
      "control_surface": "user-controlled cache_control via SDK",
      "measurable_from_rules_pack": true,
      "method": "<documented multiplier>",
      "source_url": "https://www.claude.com/blog/lessons-from-building-claude-code-prompt-caching-is-everything"
    },
    {
      "integration_mode": "claude_code_cli",
      "control_surface": "internal to CLI",
      "measurable_from_rules_pack": false,
      "method": "indirect-via-prefix-stability",
      "source_url": "https://code.claude.com/docs/en/agent-sdk/modifying-system-prompts",
      "note": "Caching is not user-controlled. The rules pack's contribution is prefix stability; the saving is not measurable from the rules pack side."
    },
    {
      "integration_mode": "cursor",
      "control_surface": "abstracted by IDE",
      "measurable_from_rules_pack": false,
      "method": "indirect-via-prefix-stability",
      "source_url": "https://docs.cursor.com/context/rules",
      "note": "Caching is not user-controlled. The rules pack's contribution is prefix stability; the saving is not measurable from the rules pack side."
    },
    {
      "integration_mode": "windsurf",
      "control_surface": "abstracted by IDE",
      "measurable_from_rules_pack": false,
      "method": "indirect-via-prefix-stability",
      "source_url": "https://docs.windsurf.com/windsurf/cascade/memories",
      "note": "Caching is not user-controlled. The rules pack's contribution is prefix stability; the saving is not measurable from the rules pack side."
    },
    {
      "integration_mode": "codex_cli_openai",
      "control_surface": "automatic prefix detection",
      "measurable_from_rules_pack": false,
      "method": "indirect-via-prefix-stability",
      "source_url": "https://developers.openai.com/codex",
      "note": "Caching is not user-controlled. The rules pack's contribution is prefix stability; the saving is not measurable from the rules pack side."
    },
    {
      "integration_mode": "kiro",
      "control_surface": "no public caching docs",
      "measurable_from_rules_pack": false,
      "method": "indirect-via-prefix-stability",
      "source_url": null,
      "note": "No public caching documentation. Treat as indirect prefix stability only."
    }
  ]
}
```

Notes:

- `measurable_from_rules_pack` MUST be `true` only for integration modes where this rules pack can produce a verifiable, reproducible token-cost reduction figure with a citable provider multiplier or documented pricing path.
- `effective_reduction_percent` MUST be `null` when `measurable_from_rules_pack` is `false`. Do not insert estimates or aspirational numbers.
- `source_url` MUST point to official documentation. Blog posts and engineering write-ups are acceptable when the official docs do not cover the specific behavior; mark them in `note` if so.
- When publishing a single headline number anywhere (README, CHANGELOG, marketing page), label it explicitly with its `integration_mode`. Never publish a single universal "caching_saving" figure that mixes these integration modes.

### Anti-patterns

- A README line that says "v4 saves 89% on caching" without naming the integration mode.
- A JSON artifact that emits a `caching_saving` field at the top level without `integration_mode`.
- A CHANGELOG entry that quotes Anthropic warm-cache numbers as if they applied to Cursor or Windsurf users.
- A benchmark report that fabricates an "OpenAI saving" number when only eligibility, not pricing-backed multipliers, was measured.

When the per-integration shape is not yet populated for a new integration, mark its row with `measurable_from_rules_pack: false`, `effective_reduction_percent: null`, and a `note` explaining why. Do not omit the row.

## Release Benchmark Bundle

The release benchmark bundle is the single hash-verified manifest that a release candidate references. It does not regenerate any Phase 0-3 numbers; it only points to the locked artifacts and records SHA-256 hashes plus a non-marketing summary section.

### Build the bundle

```bash
npm run build:release-bundle
```

Output: `benchmarks/results/release-bundle-<release_target>.json`. The current release target is `4.0.0`; the corresponding output file is `benchmarks/results/release-bundle-4.0.0.json`.

### Verify the bundle

```bash
npm run audit:release-bundle
```

This audit is also wired into `npm run validate`. It fails when:

- the bundle file is missing or invalid JSON;
- a referenced artifact path is missing;
- a referenced artifact's SHA-256 hash drifts from the recorded value;
- the bundle's `release_status` is not one of `release-candidate-unpublished` or `released`.

### Bundle shape

```json
{
  "bundle_version": "<semver>",
  "release_target": "<semver>",
  "release_status": "release-candidate-unpublished | released",
  "generated_at": "<ISO 8601>",
  "description": "<non-marketing summary>",
  "sources": {
    "research_foundation": "docs/architecture/decisions-foundation.md",
    "d4_caching_scope_matrix": "docs/architecture/decisions-foundation.md#d4",
    "caching_reporting_format": "docs/benchmark-reference.md",
    "historical_record": "docs/archive/HISTORY.md"
  },
  "integrity": {
    "hash_algorithm": "SHA-256",
    "missing_artifact_count": 0,
    "missing_artifacts": []
  },
  "artifacts": [
    {
      "artifact_id": "<short id>",
      "role": "token-baseline | cache-simulation | anti-halu-benchmark | supply-chain-snapshot",
      "relative_path": "benchmarks/results/<file>.json",
      "description": "<short>",
      "status": "present",
      "sha256": "<hex>",
      "size_bytes": 0,
      "summary": { "...": "role-specific" }
    }
  ]
}
```

### Anti-patterns

- Re-running Phase 0-3 measurements at release time. The bundle is reference-only.
- Editing artifact files manually after the bundle is built without re-running `build:release-bundle`. The audit will catch the hash drift.
- Inserting a marketing-style universal "X% caching saving" claim into the bundle description. Use the per-integration JSON shape from "Caching Effectiveness Reporting Format" instead.
- Setting `release_status` to `released` before Gate D approves publication.
