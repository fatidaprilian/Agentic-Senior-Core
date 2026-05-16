# Integration Playbook (GitHub Actions, Jenkins, VS Code, JetBrains)

This playbook keeps integration behavior consistent across CI/CD and IDE environments.
Use it when onboarding a new repository or when governance checks drift.

## Scope

- CI/CD runners: GitHub Actions and Jenkins
- IDE workflows: VS Code and JetBrains
- Shared controls: validation, tests, release gate, and governance instruction loading

## Shared Baseline (All Environments)

Run the same command sequence before release:

```bash
npm run validate
npm test
npm run gate:release
```

Required governance sources:

- `AGENTS.md`
- `.agent-context/rules/`
- `.agent-context/prompts/`
- `.agent-context/state/`
- `.agent-context/review-checklists/pr-checklist.md`

## AI Host Entrypoint Verification

Checked on 2026-05-14 against current vendor documentation.

| Host | Supported entrypoints | Source |
| --- | --- | --- |
| Codex | `AGENTS.md` | OpenAI Codex `AGENTS.md` documentation: https://github.com/openai/codex/blob/main/docs/agents_md.md |
| Cursor | `AGENTS.md`, `.cursor/rules/*.mdc`; legacy `.cursorrules` remains supported but deprecated | Cursor Rules documentation: https://docs.cursor.com/context/rules |
| Windsurf | `AGENTS.md`, `.windsurf/rules/*.md` | Windsurf `AGENTS.md` documentation: https://docs.windsurf.com/windsurf/cascade/agents-md |
| GitHub Copilot | `AGENTS.md`, `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, root `CLAUDE.md`, root `GEMINI.md` | GitHub Copilot repository instructions documentation: https://docs.github.com/en/copilot/how-tos/custom-instructions/adding-repository-custom-instructions-for-github-copilot |
| Claude Code | `CLAUDE.md` with `@AGENTS.md` import | Claude Code memory documentation: https://code.claude.com/docs/en/memory |
| Gemini CLI | `GEMINI.md` with `@AGENTS.md` import; `context.fileName` can also include `AGENTS.md` | Gemini CLI context file documentation: https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md |

Policy:
- Keep `AGENTS.md` canonical.
- Keep `CLAUDE.md` and `GEMINI.md` as native import bridges.
- Keep vendor-specific generated entrypoints out of the default install unless a current vendor requirement justifies them.
- Preserve user-owned instruction files during upgrade when they lack Agentic-Senior-Core managed markers.

## GitHub Actions Playbook

1. Use repository workflows in `.github/workflows/` as the source of truth.
2. Keep release protection enabled with `release-gate.yml`.
3. Keep weekly reporting enabled with `governance-weekly-report.yml`.

Minimal workflow shape:

```yaml
name: governance-ci
on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run validate
      - run: npm test
      - run: npm run gate:release
```

## Jenkins Playbook

1. Mirror the same command sequence as GitHub Actions.
2. Fail the build on any non-zero exit code.
3. Archive machine-readable artifacts when available.

Example `Jenkinsfile`:

```groovy
pipeline {
  agent any
  stages {
    stage('Install') {
      steps { sh 'npm ci' }
    }
    stage('Validate') {
      steps { sh 'npm run validate' }
    }
    stage('Test') {
      steps { sh 'npm test' }
    }
    stage('Release Gate') {
      steps { sh 'npm run gate:release' }
    }
  }
  post {
    always {
      archiveArtifacts artifacts: '.agent-context/state/*.json', allowEmptyArchive: true
    }
  }
}
```

## VS Code Playbook

1. Keep `AGENTS.md` as the canonical agent entrypoint.
2. Use `.vscode/mcp.json` for local MCP registration (`node ./scripts/mcp-server.mjs`).
3. Run `init` or `upgrade` after pulling governance changes:

```bash
npx @ryuenn3123/agentic-senior-core upgrade --dry-run
npx @ryuenn3123/agentic-senior-core upgrade --yes
```

4. Confirm generated files are present and current:
- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- `.agent-context/state/onboarding-report.json`

## JetBrains Playbook

1. Load repository governance docs in AI assistant context:
- `AGENTS.md`
- `.agent-context/review-checklists/pr-checklist.md`

2. Run the same local verification sequence in JetBrains terminal:

```bash
npm run validate
npm test
npm run gate:release
```

3. Keep prompt behavior consistent with Layer 9 policy:
- User prompts define feature scope.
- Project docs define architecture constraints unless migration is explicitly requested.

## Integration Drift Checklist

- CI and local commands are identical.
- `CLAUDE.md` and `GEMINI.md` still import `AGENTS.md`.
- `AGENTS.md` stays compact and delegates detailed rules to `.agent-context/`.
- Legacy generated adapter files are not created by default.
- Release gate remains green on both CI and local runs.

## Per-Tool Caching Scope

The v4 governance pack benefits from prompt caching, but the measurable saving depends on the integration path. The pack does not control the request path inside IDE wrappers, so any single universal "X% caching saving" claim mixes integration modes that have different control surfaces.

Source of truth: `docs/plan/research-foundation.md` D4 "Per-Tool Caching Scope Matrix".

| Tool / integration | User control over cache | Measurable from rules pack | Documented saving | Source |
| --- | --- | --- | --- | --- |
| Direct provider API (Anthropic) | Yes - `cache_control` honored | Yes | up to 90% on cache reads (5-minute TTL) | https://platform.claude.com/docs/en/build-with-claude/prompt-caching |
| Direct provider API (OpenAI) | No - automatic prefix detection | Eligibility only | model-specific pricing required | https://developers.openai.com/api/docs/guides/prompt-caching |
| Direct provider API (Gemini) | Yes - explicit cached content | Eligibility only | model-specific pricing required | https://ai.google.dev/gemini-api/docs/caching |
| Claude Code SDK (programmatic) | Yes - `cache_control` honored via SDK | Yes | up to 90% on cache reads | https://www.claude.com/blog/lessons-from-building-claude-code-prompt-caching-is-everything |
| Claude Code CLI | No - caching internal | No | indirect via prefix stability | https://code.claude.com/docs/en/agent-sdk/modifying-system-prompts |
| Cursor | No - caching abstracted | No | no public docs | https://docs.cursor.com/context/rules |
| Windsurf | No - caching abstracted | No | no public docs | https://docs.windsurf.com/windsurf/cascade/memories |
| Codex CLI / OpenAI | No - auto prefix detect | No | eligibility only, model-specific pricing | https://developers.openai.com/codex |
| Kiro | Unknown | No | no public caching docs | n/a |

The 89.31% Anthropic warm-cache effective reduction reported in `benchmarks/results/cache-phase-2-2026-05-16.json` is a direct-provider-API number. It applies to direct Anthropic API and Claude Code SDK programmatic mode where `cache_control` is user-controlled. It does not translate into an attributable saving for users running through IDE wrappers; those users get prefix stability, which is not measurable from the rules pack side.

For the required JSON shape when reporting caching numbers, see `docs/benchmark-reference.md` "Caching Effectiveness Reporting Format". Never publish a single universal `caching_saving` figure across mixed integration modes.

## Per-Integration Adoption

Each integration below describes how the v4 governance pack reaches the agent, what the user controls for caching, and the recommended rule-citation pattern (Bounded Reflection block; see `AGENTS.md`).

### Direct provider API

- Pack content reaches the agent through the request body the integrator builds.
- For Anthropic, place stable Layer 1 and Layer 2 prefix content first, mark a `cache_control` breakpoint, then append Layer 3 dynamic content (user message, diff, command output).
- For OpenAI, keep the same prefix order so automatic prefix detection can hit; use `prompt_cache_key` for stability.
- For Gemini, build an explicit `CachedContent` for stable corpus and append the dynamic suffix per request.
- First task example: ask the agent for a small change and require a Bounded Reflection block citing one rule ID (e.g. `ARCH-005`).

### Claude Code SDK (programmatic)

- The SDK honors `cache_control`, so the per-pack saving from D4 is measurable here.
- Keep `AGENTS.md` plus the loaded rules in the cached prefix; keep diffs, command output, and reflection citations in the dynamic suffix.
- First task example: run a refactor and verify the response includes a Bounded Reflection block with at least one resolved rule ID.

### Claude Code CLI

- Caching is internal to the CLI and not user-controlled.
- The pack reaches the agent through `CLAUDE.md` (`@AGENTS.md` import). Keep the import bridge intact; do not duplicate rule prose into Claude memory.
- First task example: ask the agent to review a small diff and require it to cite the rule ID it relied on.

### Cursor

- Caching is abstracted by the IDE; the rules pack contributes prefix stability only.
- Cursor reads `AGENTS.md` and `.cursor/rules/*.mdc`; legacy `.cursorrules` still works but is deprecated.
- Keep `AGENTS.md` in repo root; do not paste rule prose into per-folder Cursor rules.
- First task example: trigger a UI design task and require the Bounded Reflection block to cite a `FE-*` rule ID.

### Windsurf

- Caching is abstracted by the IDE; the rules pack contributes prefix stability only.
- Windsurf reads `AGENTS.md` and `.windsurf/rules/*.md`. Keep canonical rules in `.agent-context/rules/`; the pack does not duplicate them under `.windsurf/`.
- First task example: ask Cascade to apply a rename and verify the response cites the rule ID that authorized the rename.

### Codex CLI / OpenAI

- OpenAI uses automatic prefix caching; saving is not measurable from the pack side, but stable prefix ordering still helps.
- Codex reads `AGENTS.md` directly; no extra adapter file is required.
- First task example: ask Codex to implement a small change and require it to refuse politely if a rule conflicts, citing the rule ID.

### Kiro

- No public caching documentation; treat this as indirect prefix stability only.
- Kiro reads `AGENTS.md`; the pack also exposes `mcp.json` so Kiro can validate against canonical rule IDs through `lookup_rule` and `validate_against_rules`.
- First task example: ask Kiro for a code review and require the Bounded Reflection block to cite the rule IDs the review enforces.

## Next Action

When adding a new CI provider or IDE integration, extend this file first, then update roadmap status and release notes in the same change.
