# Product Roadmap

Historical note: This file preserves older release-track context. Use `docs/deep-analysis-and-roadmap-backlog.md` for the active next-work backlog and `.instructions.md` plus `.agent-context/` for current governance policy.

This document tracks the product delivery plan and current execution reality.

## V1.6 (2026) — Reliability and Team Workflow

Release status: Completed and released on 2026-03-19.

Original plan targeted Q2-Q4 2026, but implementation landed earlier (Q2 2026).

### Delivered Scope
1. Foundation and governance
   - Scope-hint onboarding shipped without offline stack or blueprint selection.
   - CLI support favors one default review-threshold path over multiple profile surfaces.
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
- Preset-driven onboarding and override governance validations are shipped and documented.
- CI annotations are available for GitHub Actions and GitLab CI.
- Detection accuracy benchmark command is published.
- Smoke tests cover beginner, balanced, and strict profile scenarios.

## V1.7 (H2 2026) — Frontend Product Experience

Release status: Completed and released on 2026-03-30.

Note: this repository is a governance and enablement engine, not a runtime frontend app. V1.7 therefore ships a frontend execution-quality pack (standards, gates, templates, and CI artifacts) that downstream projects use to implement UI work.

### Delivered Scope
1. Frontend quality gate assets
   - Frontend usability checklist shipped: `.agent-context/review-checklists/frontend-usability.md`.
   - Frontend execution playbook shipped and archived: `docs/archive/v1.7-execution-playbook.md`.
   - V1.7 issue decomposition shipped and archived: `docs/archive/v1.7-issue-breakdown.md`.
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

## V1.8 (2026) — Release Operations and Compliance

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
   - Operations execution guide shipped and archived: `docs/archive/v1.8-operations-playbook.md`.
   - Operations automated tests shipped: `tests/operations.test.mjs`.

### V1.8 KPI Snapshot (Operations Baseline)
- Release gate report generation: pass and artifact-ready.
- SBOM generation: pass and artifact-ready.
- Validator enforcement: V1.8 required assets validated.

### Release Exit Criteria for V1.8
- `npm run gate:release` passes with zero failed checks.
- `npm run sbom:generate` emits valid CycloneDX JSON payload.
- Release and SBOM CI workflows publish artifacts each run.
- Release operations checklist and playbook are published.

## V2.0 and V2.5 Historical Track

Release status: Completed and archived.

The older V2.0/V2.5 direction included marketplace, external benchmark-watchlist, and static stack-research experiments. Those surfaces are no longer active governance. The retained active behavior is narrower:

- Scope-first onboarding without offline stack or blueprint selection.
- Transactional install, preflight, backup, and rollback safeguards.
- Release, SBOM, benchmark, documentation-boundary, and governance report automation.
- Frontend governance based on repo evidence, current task constraints, and the design contract, not copied external packs.
- Provider-agnostic memory continuity with privacy redaction.

Current runtime, framework, dependency, and ecosystem decisions must come from the target repository evidence, user constraints, and live official documentation when those claims can drift.

## V3.0 (2026) - Federated Rules Cloud and Policy Ops

Release status: V3.0.0 completed and released on 2026-04-18.

Follow-up governance expansion continues in 3.x after the 3.0 baseline cut.

This release aims to move beyond repository-level governance toward federated rules operations (Federated Governance).

### Terminology Mapping (Final)

| Canonical Term | Developer-Facing Alias | Usage Rule |
|----------------|------------------------|------------|
| Federated Governance | Federated Rules Operations | Use canonical term in formal policy artifacts. |
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
- Version bump to `3.0.0` has been completed after release gate verification; subsequent scope continues under 3.x planning.

### V3.0 Success Metrics
- Policy drift detection coverage reaches 100% for onboarded repositories.
- Governance bundle attestation coverage reaches 100% for managed releases.
- Mean time to governance rollback is below 15 minutes.

### V3.0 Exit Criteria
- Federated rules operations are production-ready with signed bundle distribution.
- Portfolio dashboard and incident playbooks are published and tested.
- Compliance and provenance artifacts are generated and retained by default.
