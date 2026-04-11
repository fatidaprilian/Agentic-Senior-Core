# Analysis Priority Matrix

This document captures the execution priorities after the `2.0.2` release and the latest deep-scan audit.

## Version Status

- Current released version: `2.0.2`
- `V2.0` core capabilities are shipped and stable.
- The highest-value forward horizons are `V2.5` and `V3.0`, with selective `2.0.x` hardening.

## Executive Summary

Agentic-Senior-Core has moved beyond repository-level governance into a verified, transactional governance platform.
The current bottleneck is no longer foundational architecture.
The bottleneck is execution hygiene: token efficiency adoption, compatibility policy closure, benchmark anti-regression, and documentation synchronization.

The highest-return strategy is:
1. Finish high-impact `2.0.x` hardening.
2. Lock measurable quality gates.
3. Move to `V2.5` benchmark rigor.

## Priority Matrix

### 1. Token Optimization Adoption and Safety

Risk
- Shell-heavy sessions still burn unnecessary tokens when compact command paths are not enforced.
- Teams may assume all tool calls are filtered, while built-in read/grep/glob flows can bypass shell proxy behavior.

Impact
- Faster context exhaustion and higher API limit pressure in long sessions.
- Lower signal-to-noise in command outputs can reduce review quality.

Recommendation
- Keep token optimization as an optional policy layer with safe fallback behavior.
- Maintain explicit command rewrite guidance in compiled governance rules.
- Add installation and hook guidance without forcing hard dependency on external binaries.

### 2. Compatibility and Evidence Closure

Risk
- Compatibility checks exist in evidence-level validation, but coverage is not yet uniformly enforced across all artifact entry points.
- Some roadmap language remains marked as pending despite partial implementation.

Impact
- Marketplace trust signals can become inconsistent between artifacts.
- Maintainers may receive mixed signals about what is done versus in-progress.

Recommendation
- Promote compatibility manifest checks from partial to explicit release-gate policy.
- Require compatibility declarations for all target skill domains and blueprints.
- Update roadmap wording from binary pending status to clear completion state labels.

### 3. Release Gate Hardening (Frontend + Security)

Risk
- Frontend parity checklist is present but not yet a strict release blocker in all release paths.
- Local dependency security auditing is still policy intent and not operationalized in tooling.

Impact
- Release quality can drift between CI flows.
- Supply-chain risk review can remain reactive instead of preventative.

Recommendation
- Integrate frontend parity and dependency security checks directly into release gate scripts.
- Fail release when mandatory hardening checks are missing.
- Add test coverage for new gate logic before enabling strict mode by default.

### 4. V2.5 Benchmark and Anti-Regression Engine

Risk
- Existing benchmarking is strong but still single-system-biased for cross-model quality control.
- Regression deltas are not yet blocked by deterministic, model-agnostic scenarios.

Impact
- Quality declines can pass unnoticed between releases.
- Writer and judge confirmation bias risk remains material.

Recommendation
- Build reproducible benchmark scenarios for planning, refactor, security, and delivery flows.
- Enforce writer and judge separation by model role.
- Block releases on threshold regressions with replay fixtures.

### 5. Documentation and Repository Hygiene Synchronization

Risk
- Strategic documents can lag behind shipped functionality.
- Local benchmark clones and generated artifacts can pollute repository context if not ignored.

Impact
- Contributors can prioritize the wrong backlog.
- Agent context becomes noisier and less deterministic.

Recommendation
- Keep roadmap and matrix documents synchronized with shipped version and test baselines.
- Keep local benchmark work under ignored directories.
- Remove generated artifacts from tracked sources unless explicitly required.

### 6. V3.0 Enterprise Federation Preparation

Risk
- Cross-repo policy drift controls and signed bundle distribution are not yet operational.
- Enterprise migration can stall without early schema and governance registry decisions.

Impact
- Portfolio governance at scale remains manual.
- Override policies can become difficult to audit across multiple repositories.

Recommendation
- Start design contracts early for signed bundle metadata and override registry inheritance.
- Keep `V3.0` design artifacts machine-readable and validation-friendly from day one.

## Suggested Sequence

1. Close `2.0.x` hardening gaps: compatibility closure, frontend parity gate, dependency audit enforcement.
2. Operationalize token optimization adoption with explicit integration guidance and fallback policy.
3. Build and gate `V2.5` benchmark harness with regression blocking.
4. Prepare `V3.0` federation contracts for signed bundles, drift detection, and override governance.

## Bottom Line

The platform is no longer in `1.x` transition mode.
`2.0.2` should be treated as the stable baseline, with immediate focus on hardening and measurable anti-regression.

That keeps execution coherent:
- `2.0.x` for closure and quality hardening
- `V2.5` for model-agnostic benchmark control
- `V3.0` for enterprise federated governance operations
