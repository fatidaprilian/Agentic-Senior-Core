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

1. Keep `.github/copilot-instructions.md` aligned with `.instructions.md`.
2. Use `.vscode/mcp.json` for local MCP registration (`node ./scripts/mcp-server.mjs`).
3. Run `init` or `upgrade` after pulling governance changes:

```bash
npx @ryuenn3123/agentic-senior-core upgrade --dry-run
npx @ryuenn3123/agentic-senior-core upgrade --yes
```

4. Confirm generated files are present and current:
- `.cursorrules`
- `.windsurfrules`
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
- Compiled rule files are regenerated after policy changes.
- Release gate remains green on both CI and local runs.

## Next Action

When adding a new CI provider or IDE integration, extend this file first, then update roadmap status and release notes in the same change.
