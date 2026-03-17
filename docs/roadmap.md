# Product Roadmap

This document contains the detailed, product-oriented roadmap for the next major iteration.

## V1.6 (2026) — Enterprise Reliability and Team Workflow

### Q2 2026 — Foundation and Governance
1. Team profile packs
   - Deliver reusable profile bundles for startup, regulated, and platform teams.
   - Support organization-level defaults with local override boundaries.
2. Override governance hardening
   - Enforce owner metadata for every override entry.
   - Add expiry validation with warning windows before expiry.

Success metrics:
- 90% of override entries include owner and expiry metadata.
- 0 critical validation gaps for expired overrides in CI.
- At least 3 profile packs adopted in real repositories.

### Q3 2026 — CI and Detection Quality
1. Stronger CI annotations
   - Export LLM Judge findings in machine-friendly output for PR annotations.
   - Normalize severity mapping across GitHub Actions and GitLab CI.
2. Better project detection accuracy
   - Improve confidence scoring for mixed repositories.
   - Print transparent reasoning for stack and blueprint suggestions.

Success metrics:
- 95% severity mapping consistency across CI providers.
- 85% top-1 stack detection accuracy on benchmark fixture repositories.
- 50% reduction of manual stack correction during init flow.

### Q4 2026 — Upgrade Experience and Benchmarking
1. Upgrade and migration assistant
   - Add CLI upgrade command for existing repositories.
   - Show migration diff summary before writing files.
2. Quality gates and onboarding benchmarks
   - Expand smoke tests with profile-specific scenarios.
   - Track initialization success rate and setup duration trends.

Success metrics:
- 90% successful automated upgrade runs on benchmark repositories.
- Median setup time below 3 minutes for newbie initialization mode.
- 99% pass rate for smoke tests on supported profiles.

## Release Exit Criteria for V1.6

- Team profile packs and override governance validations are shipped and documented.
- CI annotations are available for GitHub Actions and GitLab CI.
- Detection accuracy benchmark and upgrade benchmark are published.
- Smoke tests cover beginner, balanced, and strict profile scenarios.
