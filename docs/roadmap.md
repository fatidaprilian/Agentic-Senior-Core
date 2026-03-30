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
