# Agentic-Senior-Core - Deep Analysis and Roadmap Backlog

Date: 2026-04-11
Current Version: 2.0.4
Status: Stable and release-ready

---

## Part 1: Current State Audit

### 1.1 Health Check Snapshot

| Gate | Result |
|------|--------|
| npm run validate | pass (target: 424 checks, 0 failed, 0 warnings) |
| npm test | pass (target: 25 tests, 0 failed) |
| Version consistency | package.json, CHANGELOG, .cursorrules, .windsurfrules aligned |
| Release gate | machine-readable JSON report, blocking failures supported |
| Forbidden content gate | integrated in npm run gate:release |

Note: final numbers are re-validated before each release commit.

### 1.2 Asset Inventory (2026-04-11)

| Category | Count | Notes |
|----------|-------|-------|
| Universal rules | 14 | complete rule baseline |
| Stack profiles | 10 | typescript, python, java, php, go, csharp, rust, ruby, flutter, react-native |
| Blueprints | 14 | includes mobile-app and observability |
| Review checklists | 8 | includes marketplace-acceptance |
| Skill domains | 6 | backend, frontend, fullstack, cli, distribution, review-quality |
| Scripts | 15 | validate, release gate, benchmark, trust, evidence, security checks |
| CI workflows | 6 | publish + release + benchmark + sbom + frontend gates |
| Tests | 5 files | smoke, enterprise ops, knowledge injection, llm judge, skill tier |
| State files | 8 | maps, benchmark state, onboarding, skill platform, token benchmark report |
| Docs | 12 | includes deep analysis and semantic audit docs |

### 1.3 Maturity by Subsystem

| Subsystem | Maturity | Current Position |
|-----------|----------|------------------|
| Rule engine | mature | stable and complete |
| Stack and blueprint system | mature | broad language and delivery coverage |
| Validator and release safety | mature | strict checks, publish-time blocking enabled |
| Skill platform | growing | broad coverage, some depth expansion still pending |
| CLI engine | growing | modularized, optimize/init/upgrade safety now strong |
| Benchmark system | growing | ready for multi-model expansion in V2.5 |
| Marketplace trust layer | growing | trust tiers and evidence are available |
| Enterprise federation | planned | V3.0 scope |

### 1.4 Major Changes Landed in 2.0.x

Completed:
- CLI modularization and thin entrypoint
- Trust tiers and evidence bundle validation
- Transactional install safety: preflight, backup, rollback
- Forbidden content publish protection
- Token optimization mode with optional external proxy detection and native fallback
- Init auto-enable token optimization flags
- Init default-on token optimization for all init paths, with `--no-token-optimize` opt-out
- Compatibility manifests for all six skill domains
- Compatibility warnings in init/upgrade
- Strict compatibility validation in release gate for publish-time blocking

---

## Part 2: Updated Backlog Status

### 2.1 V2.0 Remaining Work

| Issue | Title | Priority | Status | Notes |
|------|-------|----------|--------|-------|
| V2.0-010 | Numbered launcher UX | P1 | done | launch menu exists and tested |
| V2.0-011 | Preset expansion | P1 | partial | base presets exist, expansion can continue |
| V2.0-012 | Quality trend artifacts | P2 | pending | report generation not finalized |
| V2.0-013 | Weekly governance report | P3 | pending | depends on V2.0-012 |
| V2.0-014 | Frontend parity CI hard enforcement | P1 | pending | recommended before next major release |
| V2.0-015 | Expand mobile-app blueprint depth | P3 | pending | blueprint still relatively thin |
| V2.0-016 | Frontend skill depth to advance tier | P1 | pending | high user-facing value |
| V2.0-017 | Fullstack/CLI/distribution/review depth | P2 | pending | content depth and examples |

### 2.2 New Action Items from Semantic Scan and Ops Feedback

#### V2.0-018: Instruction Adapter Consolidation

Priority: P1

Scope:
- Keep one canonical policy source.
- Convert AGENTS/coplanar tool entry files into thin adapters.
- Add drift detection rule for adapter files.

Acceptance:
- High-overlap instruction duplication reduced.
- No behavior regression in Copilot/Cursor/Gemini entrypoints.

#### V2.0-019: Progressive Compatibility Policy (User-Friendly)

Priority: P1
Status: done

Scope:
- Keep init and upgrade compatibility feedback as warnings for onboarding comfort.
- Keep release and publish checks strict for maintainers.
- Document this split clearly so external users are not surprised.

Acceptance:
- New users are not blocked during setup.
- Maintainers cannot publish with invalid compatibility metadata.

### 2.3 Completion Checklist (2.0.x)

- [x] Token optimization command and state/report wiring
- [x] Compatibility manifests + strict publish gate validation
- [x] Init defaults to token optimization on all entry paths
- [x] Token optimization opt-out via `--no-token-optimize`
- [x] Token optimization benchmark script + JSON artifact
- [x] README token usage comparison table from benchmark snapshot
- [ ] Instruction adapter consolidation (V2.0-018)
- [ ] Frontend parity CI hard enforcement (V2.0-014)
- [ ] Quality trend artifacts (V2.0-012)

### 2.4 Token Optimization Focus Track

- [x] Default token optimization enabled on init
- [x] Native fallback guidance and command rewrite matrix
- [x] Local benchmark harness (`benchmark:token`)
- [x] README benchmark transparency table
- [x] RTK runtime benchmark population on Windows benchmark host (`rtk` v0.35.0)

Current benchmark note:
- Latest benchmark artifact reports native savings average `83.64%` and RTK savings average `18.95%` on current Windows host profile.

---

## Part 3: Recommended Next Steps (Pragmatic and Friendly for External Users)

1. Do instruction adapter consolidation first (V2.0-018).
- This reduces maintenance drift without changing user-facing CLI behavior.

2. Continue with two high-impact quality tasks after that.
- V2.0-014 frontend parity CI hard gate.
- V2.0-012 quality trend artifact generation.

---

## Part 4: Versioning Policy for Auto Publish

Because GitHub push triggers npm publish, every release-intent push must include:
- package version bump (semantic versioning)
- CHANGELOG entry for the same version
- compiled rule markers synced to the same version in .cursorrules and .windsurfrules
- passing validate and test gates before push

Recommended release cadence:
- Docs-only non-release updates: keep local or batch them.
- Any push that can trigger publish: bump patch version at minimum.

---

## Part 5: V2.5 and V3.0 Direction

### V2.5 (Benchmark Expansion)

Top goals:
- reproducible benchmark scenarios
- writer-judge separation across multiple models
- anti-regression release blocking
- benchmark history trend analysis

### V3.0 (Federated Governance)

Top goals:
- signed governance bundle distribution
- org-level override registry with expiry governance
- policy drift detection across repositories
- provenance and portfolio-level quality reporting

---

## Working Assumptions

- Node.js 18+ remains baseline.
- Package remains ESM-first.
- Trust and compatibility metadata are mandatory for publish safety.
- User onboarding remains simple: strictness increases by lifecycle stage, not by first-run friction.
