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

- `.instructions.md`
- `.agent-context/rules/`
- `.agent-context/prompts/`
- `.agent-context/state/`
- `.agent-context/review-checklists/pr-checklist.md`

## AI Host Entrypoint Verification

Checked on 2026-04-29 against current vendor documentation.

| Host | Supported entrypoints | Source |
| --- | --- | --- |
| Codex | `AGENTS.md` | OpenAI Codex `AGENTS.md` documentation: https://github.com/openai/codex/blob/main/docs/agents_md.md |
| Cursor | `.cursor/rules/*.mdc`, `AGENTS.md`, legacy `.cursorrules` | Cursor Rules documentation: https://docs.cursor.com/context/rules |
| Windsurf | `AGENTS.md`, `.windsurf/rules/*.md` | Windsurf `AGENTS.md` documentation: https://docs.windsurf.com/windsurf/cascade/agents-md |
| GitHub Copilot | `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, `AGENTS.md`, root `CLAUDE.md`, root `GEMINI.md` | GitHub Copilot repository instructions documentation: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions |
| Claude Code | `CLAUDE.md` | Claude Code memory documentation: https://code.claude.com/docs/en/memory |
| Gemini CLI | `GEMINI.md` | Gemini CLI context file documentation: https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md |

Policy:
- Keep `.instructions.md` canonical.
- Keep `.agent-instructions.md` as the only compiled rulebook.
- Keep vendor entrypoints thin unless a vendor requires a compiled file.
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

1. Keep `.github/copilot-instructions.md` and `.github/instructions/agentic-senior-core.instructions.md` aligned with `.instructions.md`.
2. Use `.vscode/mcp.json` for local MCP registration (`node ./scripts/mcp-server.mjs`).
3. Run `init` or `upgrade` after pulling governance changes:

```bash
npx @ryuenn3123/agentic-senior-core upgrade --dry-run
npx @ryuenn3123/agentic-senior-core upgrade --yes
```

4. Confirm generated files are present and current:
- `.agent-instructions.md`
- `.cursorrules` as a legacy thin adapter
- `.windsurfrules` as a legacy thin adapter
- `CLAUDE.md`
- `GEMINI.md`
- `.cursor/rules/agentic-senior-core.mdc`
- `.windsurf/rules/agentic-senior-core.md`
- `.agent-context/state/onboarding-report.json`

## JetBrains Playbook

1. Load repository governance docs in AI assistant context:
- `.instructions.md`
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
- Instruction adapter files still point to `.instructions.md`.
- `.agent-instructions.md` is regenerated after policy changes.
- Legacy root adapters stay thin and point to `.agent-instructions.md` when present.
- Release gate remains green on both CI and local runs.

## Next Action

When adding a new CI provider or IDE integration, extend this file first, then update roadmap status and release notes in the same change.
