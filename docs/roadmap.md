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

### Planned Scope
1. Marketplace trust framework
   - Define public trust tiers: `verified`, `community`, `experimental`.
   - Publish a weighted acceptance scorecard for skills and plugins.
   - Require machine-readable evidence bundles for each accepted artifact.
   - Add plug-and-play init presets so the first install stays simple while still offering stack-specific choice.
   - Add a numbered launcher so GitHub, npm, bootstrap, and preset paths are selectable without memorizing commands.
2. Installer and distribution hardening
   - Add transactional install flow with preflight checks, backup points, and automatic rollback.
   - Enforce plugin-safe packaging and forbidden-content detection before publish.
   - Introduce compatibility manifest checks by IDE and runtime target.
   - Require local security auditing before introducing new third-party packages or dependency updates.
3. Governance observability
   - Emit quality trend artifacts (pass rates, rejection categories, rollback frequency).
   - Add weekly governance report generation for maintainers.
4. Frontend mandate track
   - Require frontend parity gates aligned to `MiniMax-AI/skills` `frontend-dev` quality profile.
   - Add visual motion, accessibility, responsive behavior, and conversion narrative checks.
   - Enforce frontend skill parity checklist in CI for release eligibility.
   - Keep the frontend expert pack aligned with the validation gate and README guidance.
   - Extend starter coverage for mobile and observability flows so new presets map to real stack and blueprint assets.

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

Target window: Q3 2026.

This release focuses on staying ahead by proving sustained quality gains against benchmark repositories and model families.

### Benchmark Baseline Sources
- `sickn33/antigravity-awesome-skills`
- `github/awesome-copilot`
- `MiniMax-AI/skills`

### Planned Scope
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

### V2.5 Success Metrics
- Benchmark coverage reaches at least 85% for core workflow categories.
- Quality regression escape rate is below 2% per release cycle.
- Competitive scan to action SLA is at most 14 days.

### V2.5 Exit Criteria
- Benchmark harness and anti-regression gates are mandatory in CI.
- Competitive intelligence reports are generated on schedule and tracked.
- At least two benchmark-driven improvements land each cycle.

## V3.0 (2026) - Enterprise Governance Cloud and Federated Policy Ops

Target window: Q4 2026.

This release aims to move beyond repository-level governance toward federated enterprise operations.

### Planned Scope
1. Federated governance operations
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

### V3.0 Success Metrics
- Policy drift detection coverage reaches 100% for onboarded repositories.
- Governance bundle attestation coverage reaches 100% for enterprise releases.
- Mean time to governance rollback is below 15 minutes.

### V3.0 Exit Criteria
- Federated policy operations are production-ready with signed bundle distribution.
- Portfolio dashboard and incident playbooks are published and tested.
- Compliance and provenance artifacts are generated and retained by default.
