# Product Roadmap

This document tracks the product delivery plan and current execution reality.

## V1.6 (2026) — Enterprise Reliability and Team Workflow

Release status: Completed and released on 2026-03-19.

Original plan targeted Q2-Q4 2026, but implementation landed earlier (Q2 2026).

### Delivered Scope
1. Foundation and governance
   - Team profile packs shipped: startup, regulated, platform.
   - CLI support shipped: `agentic-senior-core init --profile-pack <name>`.
   - Override governance hardening shipped: required `Owner` and `Expiry` metadata, `YYYY-MM-DD` validation, expiry warning window, and expired-entry validation failure.
2. CI and detection quality
   - LLM Judge machine-readable reporting shipped: `JSON_REPORT` line output + artifact file `.agent-context/state/llm-judge-report.json`.
   - Severity normalization shipped for CI parity across GitHub Actions and GitLab CI (`critical`, `high`, `medium`, `low`).
   - Detection transparency shipped: confidence score, confidence gap, ranked candidates, and reasoning persisted in onboarding report.
3. Upgrade and benchmarking
   - Upgrade assistant shipped: `agentic-senior-core upgrade [target-directory] [--dry-run] [--yes]`.
   - Expanded smoke tests shipped for profile matrix and upgrade dry-run.
   - Benchmark command shipped: `npm run benchmark:detection`.

### V1.6 KPI Snapshot (Baseline)
- Detection top-1 accuracy: 91.67% (fixture benchmark baseline).
- Manual correction rate proxy: 8.33% (fixture benchmark baseline).
- Smoke test pass rate: 100% on current suite.

### Release Exit Criteria for V1.6
- Team profile packs and override governance validations are shipped and documented.
- CI annotations are available for GitHub Actions and GitLab CI.
- Detection accuracy benchmark command is published.
- Smoke tests cover beginner, balanced, and strict profile scenarios.

## V1.7 (H2 2026) — Frontend Product Experience

Release status: Completed and released on 2026-03-30.

Note: this repository is a governance and enablement engine, not a runtime frontend app. V1.7 therefore ships a frontend execution-quality pack (standards, gates, templates, and CI artifacts) that downstream projects use to implement UI work.

### Delivered Scope
1. Frontend quality gate assets
   - Frontend usability checklist shipped: `.agent-context/review-checklists/frontend-usability.md`.
   - Frontend execution playbook shipped: `docs/v1.7-execution-playbook.md`.
   - V1.7 issue decomposition shipped: `docs/v1.7-issue-breakdown.md`.
2. Frontend audit and CI automation
   - Frontend usability audit script shipped: `scripts/frontend-usability-audit.mjs`.
   - CI workflow shipped: `.github/workflows/frontend-usability-gate.yml`.
   - Frontend audit report artifact generation shipped for each run.
3. Execution workflow tooling
   - GitHub issue template shipped: `.github/ISSUE_TEMPLATE/v1.7-frontend-work-item.yml`.
   - NPM command shipped: `npm run audit:frontend-usability`.

### V1.7 KPI Snapshot (Governance Baseline)
- Frontend usability gate assets: present and validated.
- Frontend audit workflow: present and configured to upload report artifacts.
- Execution planning coverage: Q3 and Q4 issue breakdown fully enumerated.

### Release Exit Criteria for V1.7
- Frontend usability checklist is versioned and validated in repository checks.
- Frontend usability CI workflow publishes report artifacts.
- V1.7 issue breakdown and execution playbook are published.
- Issue template for V1.7 frontend work is available.

## V1.8 (2026) — Enterprise Release Operations and Compliance

Release status: Completed and released on 2026-03-30.

V1.8 upgrades release governance from policy-only to CI-enforced evidence with machine-readable outputs and compliance artifacts.

### Delivered Scope
1. Release governance gate
   - Release gate script shipped: `scripts/release-gate.mjs`.
   - NPM command shipped: `npm run gate:release`.
   - CI workflow shipped: `.github/workflows/release-gate.yml` with artifact upload.
2. Supply-chain compliance baseline
   - CycloneDX SBOM generator shipped: `scripts/generate-sbom.mjs`.
   - NPM command shipped: `npm run sbom:generate`.
   - CI workflow shipped: `.github/workflows/sbom-compliance.yml` with SBOM artifact upload.
3. Operational readiness standards
   - Release operations checklist shipped: `.agent-context/review-checklists/release-operations.md`.
   - Operations execution guide shipped: `docs/v1.8-operations-playbook.md`.
   - Enterprise operations automated tests shipped: `tests/enterprise-ops.test.mjs`.

### V1.8 KPI Snapshot (Operations Baseline)
- Release gate report generation: pass and artifact-ready.
- SBOM generation: pass and artifact-ready.
- Validator enforcement: V1.8 required assets validated.

### Release Exit Criteria for V1.8
- `npm run gate:release` passes with zero failed checks.
- `npm run sbom:generate` emits valid CycloneDX JSON payload.
- Release and SBOM CI workflows publish artifacts each run.
- Release operations checklist and playbook are published.

## V2.0 (2026) - Verified Skill Marketplace and Trust Scoring

Target window: Q2 2026.

This release shifts from governance pack distribution to a verified skill marketplace model with measurable trust signals.

### Benchmark Baseline Sources
- `sickn33/antigravity-awesome-skills`: installer safety pipeline, package hardening, rollback semantics.
- `github/awesome-copilot`: governance-driven contribution model, role-based planning and review loops.
- `MiniMax-AI/skills`: mandatory frontend delivery patterns via `frontend-dev` and multi-tool installation support.

### Delivered Scope
1. Marketplace trust framework
   - DEFINED public trust tiers: `verified`, `community`, `experimental`.
   - SHIPPED a weighted acceptance scorecard for skills and plugins.
   - SHIPPED machine-readable evidence bundles requirement for accepted artifacts.
   - SHIPPED plug-and-play init presets for fast, stack-specific installations.
   - SHIPPED a numbered interactive launcher for seamless bootstrapping.
2. Installer and distribution hardening
   - SHIPPED transactional install flow with preflight checks, backup points, and automatic rollback.
   - SHIPPED forbidden-content detection (API keys, stray paths, debuggers) as a strict publish gate.
   - SHIPPED compatibility manifest checks by IDE and runtime target in release and validation gates.
   - [Pending] Require local security auditing before introducing new third-party packages or dependency updates.
3. Governance observability
   - SHIPPED quality trend artifacts (pass rates, rejection categories, rollback frequency).
   - SHIPPED weekly governance report generation for maintainers.
4. Frontend mandate track
   - SHIPPED frontend parity gates aligned to `MiniMax-AI/skills` `frontend-dev` quality profile.
   - SHIPPED visual motion, accessibility, responsive behavior, and conversion narrative checks in frontend skill depth packs.
   - SHIPPED frontend skill parity checklist hard enforcement in release eligibility gates.
   - SHIPPED frontend/fullstack/distribution/review depth expansion with verified trust-tier evidence on required release domains.
   - SHIPPED starter coverage extension for mobile and observability flows with additional stack-specific presets.

### V2.0 Success Metrics
- At least 95% of published marketplace artifacts include complete evidence bundles.
- Rollback safety checks execute on 100% of install failures.
- Acceptance decision reproducibility reaches at least 90% across maintainers.
- Frontend parity checklist pass rate reaches 100% for release candidates.

### V2.0 Exit Criteria
- Marketplace trust tiers and scorecard are documented and enforced in CI.
- Transactional installer and rollback validation pass in automated tests.
- Governance observability artifacts are generated on every release pipeline run.
- Frontend parity checklist is versioned, enforced, and attached to release artifacts.

## V2.5 (2026) - Model-Agnostic Benchmark and Anti-Regressions

Release status: Completed and released on 2026-04-17.

Original plan targeted Q3 2026, but implementation landed earlier (Q2 2026).

This release focuses on staying ahead by proving sustained quality gains against benchmark repositories and model families.

Final delivery snapshot (2026-04-17):
- Frontend excellence rubric and release-enforced checklist hooks are implemented.
- Init onboarding supports scope-first stack filtering, runtime environment hinting, Docker dev/prod strategy capture, and dual-web blueprint context capture.
- Benchmark evidence bundle appends per-run history snapshots and emits chart-ready trend outputs (JSON and CSV) with release-over-release deltas.
- Benchmark evidence bundle includes bug/vulnerability indicators plus reliability early-warning checks for risky quality degradation.
- Cross-agent memory continuity pilot baseline is implemented with provider-agnostic schema, adapter contract, privacy redaction controls, and continuity benchmark reporting.

### Benchmark Baseline Sources
- `sickn33/antigravity-awesome-skills`
- `github/awesome-copilot`
- `MiniMax-AI/skills`

### Delivered Scope
1. Benchmark harness expansion
   - Add reproducible benchmark scenarios for planning, refactor, security, and delivery workflows.
   - Compare output quality across multiple model providers with the same rule packs.
   - Persist benchmark histories for trend and regression detection.
   - Separate code generation and judge roles so the writer and auditor are not the same trust source.
   - Require cross-model verification for benchmark and judge workflows to reduce confirmation bias.
2. Anti-regression quality gates
   - Block releases when benchmark deltas cross configured quality thresholds.
   - Add deterministic replay fixtures for previously failed benchmark runs.
   - Integrate benchmark gates into release and pull request workflows.
3. Competitive intelligence loop
   - Add scheduled scan workflow to monitor benchmark repos and detect new patterns.
   - Produce actionable adopt or adapt recommendations with owner assignment.
   - Treat frontend skill updates from `MiniMax-AI/skills` as mandatory inputs for each cycle.
4. Frontend excellence track
   - Define an advanced frontend quality rubric inspired by high-end frontend references (including Builder.io quality signals) and manual design workflow standards.
   - Enforce non-template visual outputs through explicit diversity checks for color systems, typography pairings, spacing rhythm, and layout composition.
   - Extend frontend skill packs with expert-level UI and UX patterns, interaction choreography, and responsive behavior quality gates.
   - Treat `MiniMax-AI/skills` frontend depth as a minimum baseline and require measurable improvements above that baseline in each release cycle.
5. Framework currency and ecosystem refresh
   - Upgrade PHP stack and Laravel blueprint defaults to Laravel 13 with a PHP 8.3+ baseline.
   - Add migration guardrails for common 12.x to 13.x issues (CSRF middleware rename, non-empty `uniqueBy` for `upsert`, cache `serializable_classes` policy).
   - Keep dependency guidance in sync with Laravel 13 targets (`laravel/framework:^13.0`, `laravel/tinker:^3.0`, `phpunit/phpunit:^12.0`, `pestphp/pest:^4.0`).
6. Cross-agent memory continuity pilot
   - Define a vendor-agnostic memory schema for observations, summaries, and action traces.
   - Build adapter contracts so Claude Code, Gemini CLI, and VS Code chat workflows can write/read the same local memory store.
   - Add privacy controls and redaction tags so sensitive context can be excluded before persistence.
   - Hydrate new chat sessions with concise relevant memory context to reduce cold-start behavior without provider lock-in.

### V2.5 Success Metrics
- Benchmark coverage reaches at least 85% for core workflow categories.
- Quality regression escape rate is below 2% per release cycle.
- Competitive scan to action SLA is at most 14 days.
- Frontend benchmark outputs achieve at least 90% pass rate on advanced design rubric checks (visual diversity, UX clarity, responsiveness, and accessibility).
- At least one frontend quality uplift sourced from competitive intelligence lands in each V2.5 cycle.
- Laravel guidance is fully migrated to 13.x across stack profiles, blueprints, and setup prompts.
- Cross-agent memory reuse reaches at least 80% relevant recall on benchmarked continuity scenarios.

### V2.5 Exit Criteria
- Benchmark harness and anti-regression gates are mandatory in CI.
- Competitive intelligence reports are generated on schedule and tracked.
- At least two benchmark-driven improvements land each cycle.
- Frontend excellence rubric is enforced in CI and linked to release eligibility.
- Laravel 13 migration guardrails are published and referenced by onboarding and upgrade flows.
- Cross-agent memory pilot can persist and retrieve session context through a provider-agnostic interface.

## V3.0 (2026) - Enterprise Governance Cloud and Federated Policy Ops

Target window: Q4 2026.

This release aims to move beyond repository-level governance toward federated rules operations (Federated Governance).

### Terminology Mapping (Final)

| Canonical Enterprise Term | Developer-Facing Alias | Usage Rule |
|---------------------------|------------------------|------------|
| Federated Governance | Federated Rules Operations | Use canonical term in compliance and audit artifacts. |
| Governance Engine | Rules Engine | Use alias in onboarding and day-to-day developer docs. |
| Guardrails | Quality Checks | Use alias in implementation guidance and quickstart docs. |

Rule: on first mention in developer-facing docs, include canonical term in parentheses.

Reference: docs/terminology-mapping.md

### Planned Scope
1. Federated rules operations (Federated Governance)
   - Support centralized policy distribution with signed versioned governance bundles.
   - Add organization-level override registry with expiry enforcement and audit trails.
   - Provide policy drift detection across multiple repositories.
2. Compliance and provenance upgrades
   - Add artifact provenance attestations for governance bundles and releases.
   - Expand SBOM and release evidence to include cross-repository dependency provenance.
   - Introduce compliance readiness packs mapped to regulated environments.
3. Operations control plane
   - Deliver portfolio-level dashboards for quality, security, and policy conformance.
   - Add controlled rollout and rollback channels for governance updates.
   - Define incident playbooks for governance failures and policy breaches.
4. Dynamic context delivery modernization
   - Evaluate MCP-native domain retrieval for rule packs that are only needed during specific edits.
   - Revisit RAG-style retrieval when compiled context becomes too dense for the current compiler model.
   - Keep compiled rule files as the default until retrieval proves lower-friction and more reliable.

### V3.0 Top Goals Intake Policy (Roadmap-First)
- All candidate work for V3.0 (optimization, refactor, reliability, security, and DX improvements) must be recorded in roadmap top goals before implementation starts.
- Every candidate goal must define measurable success metrics and a clear exit condition before being moved to execution.
- Version bump to `3.0.0` is allowed only after V3.0 exit criteria are fully satisfied.

### V3.0 Success Metrics
- Policy drift detection coverage reaches 100% for onboarded repositories.
- Governance bundle attestation coverage reaches 100% for enterprise releases.
- Mean time to governance rollback is below 15 minutes.

### V3.0 Exit Criteria
- Federated rules operations are production-ready with signed bundle distribution.
- Portfolio dashboard and incident playbooks are published and tested.
- Compliance and provenance artifacts are generated and retained by default.
