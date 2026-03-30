# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.8.0 - 2026-03-30
### Added
- Enterprise release operations checklist (`.agent-context/review-checklists/release-operations.md`).
- V1.8 operations playbook (`docs/v1.8-operations-playbook.md`).
- Release gate script with machine-readable output (`scripts/release-gate.mjs`) and npm command (`npm run gate:release`).
- CycloneDX SBOM generator (`scripts/generate-sbom.mjs`) and npm command (`npm run sbom:generate`).
- CI release gate artifact workflow (`.github/workflows/release-gate.yml`).
- CI SBOM compliance artifact workflow (`.github/workflows/sbom-compliance.yml`).
- Enterprise operations test suite (`tests/enterprise-ops.test.mjs`).

### Changed
- Repository validator now enforces V1.8 release-governance and compliance assets.
- Test command now includes enterprise operations checks.

## 1.7.0 - 2026-03-30
### Added
- Frontend usability checklist for release gating (`.agent-context/review-checklists/frontend-usability.md`).
- V1.7 execution playbook (`docs/v1.7-execution-playbook.md`).
- Frontend usability audit script (`scripts/frontend-usability-audit.mjs`) and npm command (`npm run audit:frontend-usability`).
- Frontend usability CI workflow that publishes audit report artifacts (`.github/workflows/frontend-usability-gate.yml`).
- GitHub issue template for V1.7 frontend work items (`.github/ISSUE_TEMPLATE/v1.7-frontend-work-item.yml`).

### Changed
- Repository validator now enforces V1.7 frontend governance assets.
- Roadmap now marks V1.7 as delivered governance and execution-quality pack for downstream frontend implementations.

## 1.6.0 - 2026-03-19
### Added
- Team profile packs for `startup`, `regulated`, and `platform` in `.agent-context/profiles/`.
- New CLI option `--profile-pack <name>` to apply organization defaults during `init`.
- New CLI command `upgrade` with `--dry-run` and `--yes` options for migration previews and controlled writes.
- Onboarding report metadata now records selected profile pack (`name` and `sourceFile`).
- Onboarding report now records `operationMode` (`init` or `upgrade`) and expanded detection reasoning metadata.
- LLM Judge now emits a machine-readable annotation payload (`JSON_REPORT`) and writes report artifacts.
- Added `npm run benchmark:detection` command backed by `scripts/detection-benchmark.mjs` for top-1 detection KPI tracking.
- Added lightweight CI workflow to publish detection benchmark artifacts on each run (`.github/workflows/benchmark-detection.yml`).

### Changed
- Repository validator now enforces override governance metadata checks for `Owner` and `Expiry`.
- Validator now checks profile pack files as required `.agent-context` assets.
- CLI smoke tests now cover profile pack initialization, profile matrix scenarios, and upgrade dry-run flow.
- LLM Judge now normalizes severity levels for CI provider parity (GitHub/GitLab/local).

## 1.5.0 - Unreleased
### Added
- Zero-Conf onboarding for complete beginners (`--newbie` flag).
- Smart auto-detection for existing projects (stack + blueprint suggestions).
- Profile presets (`beginner`, `balanced`, `strict`).
- `llm-judge-threshold.json` to handle LLM review severities.
- Split documentation paths (FAQ and Deep Dive).
- Refactored all internal tools from Bun to Node-native.
