# V2 Upgrade Playbook (Benchmark-Driven)

Historical note: This playbook records the V2 benchmark-driven direction. V3 purge mode retired the skill marketplace path; use `.instructions.md`, `.agent-context/`, and `docs/deep_analysis_and_roadmap_backlog.md` for current policy and next work.

This playbook defines how Agentic-Senior-Core stays ahead of benchmark repositories while maintaining stable release delivery.

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
- Add scope-hint init presets that do not choose stack or blueprint offline.
- Add a numbered launch path so first-run setup is guided instead of command-heavy.
- Extend scope-hint coverage for mobile and observability flows without locking framework choices.

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

Use presets when you want fast, low-friction scope hints. Presets do not choose the runtime, framework, or architecture.

### Quick Decision Rule
- Use `--preset` when you know the project shape but still want the AI agent to recommend runtime and architecture.
- Use `--stack` + `--blueprint` when you need a custom combination.
- Let the agent validate ecosystem choices with live research instead of relying on stale local stack heuristics.

### Recommended Starting Commands

| Scenario | Recommended Command | Why |
|----------|---------------------|-----|
| Frontend/UI work | `npx @ryuenn3123/agentic-senior-core init --preset frontend-ui` | Scope hint only; AI agent recommends runtime and architecture |
| Backend/API service | `npx @ryuenn3123/agentic-senior-core init --preset backend-service` | Scope hint only; AI agent recommends runtime and architecture |
| Fullstack product | `npx @ryuenn3123/agentic-senior-core init --preset fullstack-product` | Scope hint only; AI agent recommends runtime and architecture |
| Mobile app | `npx @ryuenn3123/agentic-senior-core init --preset mobile-app` | Scope hint only; AI agent recommends native strategy |
| Platform operations | `npx @ryuenn3123/agentic-senior-core init --preset platform-ops` | Scope hint only; AI agent recommends implementation path |
| Observability work | `npx @ryuenn3123/agentic-senior-core init --preset observability` | Scope hint only; AI agent recommends implementation path |

### Practical Overrides
- To switch delivery shape, add `--stack` and `--blueprint`.
- To force CI behavior, add `--ci true` or `--ci false`.
- To keep migration safe for existing repos, use `upgrade --dry-run` before `upgrade --yes`.
