# V2 Upgrade Playbook (Benchmark-Driven)

This playbook defines how Agentic-Senior-Core stays ahead of benchmark repositories while maintaining stable enterprise delivery.

## Benchmark Inputs (Mandatory)
- `sickn33/antigravity-awesome-skills`
- `github/awesome-copilot`
- `MiniMax-AI/skills`

## Objective
- Convert benchmark intelligence into enforceable governance assets.
- Prioritize measurable quality improvements over feature volume.
- Make frontend quality parity mandatory by default.
- Make `advance` the default skill tier for new work.

## Adopt / Adapt / Improve Matrix

### 1. antigravity-awesome-skills
- Adopt:
  - Transactional installation semantics.
  - Backup and rollback safety checkpoints.
  - Package preflight checks and forbidden-content blocking.
- Adapt:
  - Integrate installer hardening into this repository validator and release gate scripts.
- Improve:
  - Add machine-readable reliability score per artifact.

### 2. awesome-copilot
- Adopt:
  - Role-based contribution flow (planner, reviewer, researcher).
  - Strict validation and contribution hygiene.
- Adapt:
  - Translate role flow into repository checklists and issue templates.
- Improve:
  - Add benchmark-to-action SLA tracking in roadmap execution.

### 3. MiniMax skills (Frontend Mandatory)
- Adopt:
  - Frontend delivery emphasis from `frontend-dev` skill profile.
  - Strong UX direction with animation, responsive behavior, and interaction quality.
- Adapt:
  - Map frontend parity checks into checklist gates and release evidence.
- Improve:
  - Add governance checks for narrative clarity, motion safety, and accessibility readiness.

## Execution Phases

### Phase A: Governance Foundation
- Add and enforce frontend skill parity checklist.
- Link parity checks to release gate and validator requirements.
- Add benchmark baseline references in roadmap.
- Add plug-and-play init presets for common stack and blueprint combinations.
- Add a numbered launch path so first-run setup is guided instead of command-heavy.
- Extend starter coverage for mobile and observability presets where the stack inventory supports them.

### Phase B: Competitive Quality Gates
- Add benchmark scan cadence and owner assignment.
- Add anti-regression quality thresholds for benchmark deltas.
- Add replay fixtures for prior benchmark failures.
- Keep frontend accessibility and UI architecture packs aligned with expert-tier guidance.

### Phase C: Trust and Distribution Ops
- Add trust tiers (`verified`, `community`, `experimental`).
- Add evidence bundle requirements and provenance metadata.
- Add quality trend report for each release cycle.

## Required Evidence for V2 Upgrades
- Updated roadmap with baseline benchmark references.
- Frontend parity checklist completed with pass status.
- Validator and release gate confirmation logs.
- Weekly benchmark intelligence report with owner and due date.
- Skill platform catalog present with domain packs and tier rules.

## Command Sequence

```bash
npm run validate
npm test
npm run gate:release
npm run audit:frontend-usability
```

## Profile and Preset Guidance (Common Usage Patterns)

Use presets when you want fast, low-friction onboarding. Use profile packs when you need team governance defaults.

### Quick Decision Rule
- Use `--preset` when you know the project shape.
- Use `--profile-pack` when your team already has governance expectations.
- Use `--profile` + `--stack` + `--blueprint` only for custom combinations.

### Recommended Starting Commands

| Scenario | Recommended Command | Why |
|----------|---------------------|-----|
| Web product startup | `npx @ryuenn3123/agentic-senior-core init --preset frontend-web` | Fast fullstack default with balanced guardrails |
| Backend API service | `npx @ryuenn3123/agentic-senior-core init --preset backend-api` | API-oriented baseline with safe defaults |
| Enterprise Java API | `npx @ryuenn3123/agentic-senior-core init --preset java-enterprise-api` | Strict profile and enterprise-ready Spring stack |
| .NET enterprise API | `npx @ryuenn3123/agentic-senior-core init --preset dotnet-enterprise-api` | Strict governance tuned for C# service teams |
| Laravel API delivery | `npx @ryuenn3123/agentic-senior-core init --preset php-laravel-api` | Laravel blueprint aligned to current migration guidance |
| Platform team module | `npx @ryuenn3123/agentic-senior-core init --profile-pack platform` | Reuses platform defaults (Go + service blueprint) |
| Regulated domain project | `npx @ryuenn3123/agentic-senior-core init --profile-pack regulated` | Compliance-first defaults and locked CI guardrails |
| Startup team governance | `npx @ryuenn3123/agentic-senior-core init --profile-pack startup` | Balanced defaults with speed-oriented onboarding |

### Practical Overrides
- To keep a profile pack but switch delivery shape, add `--stack` and `--blueprint`.
- To force CI behavior, add `--ci true` or `--ci false`.
- To keep migration safe for existing repos, use `upgrade --dry-run` before `upgrade --yes`.
