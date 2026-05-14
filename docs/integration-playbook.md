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

## Next Action

When adding a new CI provider or IDE integration, extend this file first, then update roadmap status and release notes in the same change.
