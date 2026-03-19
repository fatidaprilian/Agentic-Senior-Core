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

This milestone is intentionally shifted to 2026 H2 to follow immediately after V1.6 completion.

### Q3 2026 — Frontend System Foundation
1. Visual language and token architecture
   - Define a non-generic design language with intentional typography, color system, spacing scale, and motion tokens.
   - Establish responsive breakpoints and density rules for docs and product surfaces.
2. Frontend architecture baseline
   - Define component layering (primitives, composites, page sections) and content-driven layout contracts.
   - Add accessibility baseline: focus management, contrast, keyboard navigation, reduced-motion support.

Success metrics:
- 100% UI surfaces consume shared tokens (no ad-hoc style constants in page code).
- WCAG AA contrast coverage for all primary UI text elements.

### Q4 2026 — Human-Crafted UX, Responsiveness, and Conversion
1. Homepage and docs shell redesign
   - Replace generic block layouts with editorial, brand-forward composition and narrative flow.
   - Build mobile-first navigation and responsive reading rhythm for technical docs.
2. Interaction and motion quality
   - Add purposeful transitions (page load, section reveal, hierarchy emphasis).
   - Keep motion performant and compliant with reduced-motion preferences.
3. Trust and conversion loop
   - Improve onboarding CTA clarity (template, bootstrap scripts, npm paths) using user journey telemetry.
   - Add visual regression checks and frontend usability checklist in release gates.

Success metrics:
- Lighthouse mobile performance >= 90 on core pages.
- 0 critical responsive regressions across common viewport ranges.
- 25% reduction in onboarding drop-off between landing and first successful init.
