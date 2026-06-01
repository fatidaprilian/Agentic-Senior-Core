import { join } from 'node:path';
import { readdir } from 'node:fs/promises';

export async function validateRequiredFiles(context) {
  const { ROOT_DIR, fileExists, pass, fail } = context;
  console.log('\nChecking required files...');

  const requiredFiles = [
    'bin/agentic-senior-core.js',
    'scripts/validate.mjs',
    'scripts/llm-judge.mjs',
    'scripts/detection-benchmark.mjs',
    'scripts/benchmark-evidence-bundle.mjs',
    'scripts/benchmark-writer-judge-matrix.mjs',
    'scripts/benchmark-gate.mjs',
    'scripts/benchmark-intelligence.mjs',
    'scripts/memory-continuity-benchmark.mjs',
    'scripts/docs-quality-drift-report.mjs',
    'scripts/governance-weekly-report.mjs',
    'scripts/mcp-server.mjs',
    'scripts/mcp-server/constants.mjs',
    'scripts/mcp-server/tool-registry.mjs',
    'scripts/mcp-server/tools.mjs',
    'scripts/frontend-usability-audit.mjs',
    'scripts/ui-design-judge.mjs',
    'scripts/documentation-boundary-audit.mjs',
    'scripts/context-triggered-audit.mjs',
    'scripts/rules-guardian-audit.mjs',
    'scripts/explain-on-demand-audit.mjs',
    'scripts/single-source-lazy-loading-audit.mjs',
    'scripts/audit-cache-layer-contract.mjs',
    'scripts/audit-typography-palette-anti-repeat.mjs',
    'lib/cli/audits/typography-palette-anti-repeat-audit.mjs',
    'lib/cli/commands/audit-design-anti-repeat.mjs',
    'scripts/sync-thin-adapters.mjs',
    'scripts/release-gate.mjs',
    'scripts/generate-sbom.mjs',
    '.agent-context/policies/llm-judge-threshold.json',
    '.agent-context/prompts/compact-natural-mode.md',
    'mcp.json',
    'AGENTS.md',
    'CLAUDE.md',
    'GEMINI.md',
    'README.md',
    'CHANGELOG.md',
    'docs/doc-index.md',
    'docs/project-brief.md',
    'docs/flow-overview.md',
    'docs/api-contract.md',
    'docs/faq.md',
    'docs/deep-dive.md',
    'docs/archive/HISTORY.md',
    'docs/archive/CHANGELOG-archive.md',
    '.agent-context/state/benchmark-reproducibility.json',
    '.agent-context/state/benchmark-writer-judge-config.json',
    '.agent-context/state/memory-schema-v1.json',
    '.agent-context/state/memory-adapter-contract.json',
    '.vscode/mcp.json',
    '.github/workflows/release-gate.yml',
    '.github/workflows/sbom-compliance.yml',
    '.github/workflows/benchmark-intelligence.yml',
    '.github/workflows/docs-quality-drift-report.yml',
    '.github/workflows/governance-weekly-report.yml',
    'tests/cli-smoke.test.mjs',
    'tests/mcp-server.test.mjs',
    'tests/llm-judge.test.mjs',
    'tests/operations.test.mjs',
    'LICENSE',
    '.gitignore',
  ];

  for (const requiredFilePath of requiredFiles) {
    const absoluteRequiredFilePath = join(ROOT_DIR, requiredFilePath);

    if (await fileExists(absoluteRequiredFilePath)) {
      pass(requiredFilePath);
      continue;
    }

    fail(`Missing required file: ${requiredFilePath}`);
  }
}

export async function validateRuleFiles(context) {
  const { AGENT_CONTEXT_DIR, fileExists, readTextFile, pass, fail } = context;
  console.log('\nChecking rule, checklist, prompt, and state files...');

  const expectedPaths = [
    'rules/naming-conv.md',
    'rules/architecture.md',
    'rules/security.md',
    'rules/performance.md',
    'rules/error-handling.md',
    'rules/testing.md',
    'rules/git-workflow.md',
    'rules/efficiency-vs-hype.md',
    'rules/api-docs.md',
    'rules/microservices.md',
    'rules/event-driven.md',
    'rules/database-design.md',
    'rules/realtime.md',
    'rules/frontend-architecture.md',
    'rules/docker-runtime.md',
    'rules/observability.md',
    'rules/resilience.md',
    'rules/migrations.md',
    'rules/background-jobs.md',
    'rules/config-and-flags.md',
    'rules/api-versioning.md',
    'review-checklists/pr-checklist.md',
    'review-checklists/architecture-review.md',
    'prompts/init-project.md',
    'prompts/compact-natural-mode.md',
    'prompts/bootstrap-design.md',
    'prompts/refactor.md',
    'prompts/review-code.md',
    'state/architecture-map.md',
    'state/dependency-map.md',
  ];

  for (const expectedPath of expectedPaths) {
    const absoluteExpectedPath = join(AGENT_CONTEXT_DIR, expectedPath);

    if (!(await fileExists(absoluteExpectedPath))) {
      fail(`Missing agent context file: .agent-context/${expectedPath}`);
      continue;
    }

    const fileContent = await readTextFile(absoluteExpectedPath);
    if (fileContent.trim().length < 100) {
      fail(`Agent context file is suspiciously short: .agent-context/${expectedPath}`);
      continue;
    }

    pass(`.agent-context/${expectedPath}`);
  }
}

export async function validateChecklistConsolidation(context) {
  const { AGENT_CONTEXT_DIR, pass, fail } = context;
  console.log('\nChecking review checklist consolidation...');

  const reviewChecklistDirectoryPath = join(AGENT_CONTEXT_DIR, 'review-checklists');
  const checklistEntries = await readdir(reviewChecklistDirectoryPath, { withFileTypes: true });
  const checklistFileNames = checklistEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort((leftName, rightName) => leftName.localeCompare(rightName));

  const expectedChecklistFileNames = ['architecture-review.md', 'pr-checklist.md'];

  if (checklistFileNames.length <= 2) {
    pass(`Checklist count is consolidated (${checklistFileNames.length}/2)`);
  } else {
    fail(`Checklist count exceeds limit (${checklistFileNames.length}/2): ${checklistFileNames.join(', ')}`);
  }

  for (const expectedChecklistFileName of expectedChecklistFileNames) {
    if (checklistFileNames.includes(expectedChecklistFileName)) {
      pass(`Checklist exists: .agent-context/review-checklists/${expectedChecklistFileName}`);
    } else {
      fail(`Missing consolidated checklist: .agent-context/review-checklists/${expectedChecklistFileName}`);
    }
  }
}
