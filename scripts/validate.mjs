#!/usr/bin/env node

/**
 * validate.mjs — Repository Integrity Validator
 *
 * Validates the Agentic-Senior-Core repository:
 * - Required files exist
 * - Markdown and JSON documents are readable
 * - Cross-references resolve from the correct source directory
 * - Version references stay consistent for release builds
 * - LLM Judge policy configuration is valid
 *
 * Usage: node scripts/validate.mjs
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const ROOT_DIR = resolve(dirname(SCRIPT_FILE_PATH), '..');
const AGENT_CONTEXT_DIR = join(ROOT_DIR, '.agent-context');
const CANONICAL_INSTRUCTION_PATH = join(ROOT_DIR, '.instructions.md');
const PACKAGE_JSON_PATH = join(ROOT_DIR, 'package.json');
const CHANGELOG_PATH = join(ROOT_DIR, 'CHANGELOG.md');
const README_PATH = join(ROOT_DIR, 'README.md');
const POLICY_FILE_PATH = join(ROOT_DIR, '.agent-context', 'policies', 'llm-judge-threshold.json');
const OVERRIDE_FILE_PATH = join(ROOT_DIR, '.agent-override.md');
const GENERATED_RULE_FILES = ['.cursorrules', '.windsurfrules'];
const ALLOWED_SEVERITIES = new Set(['critical', 'high', 'medium', 'low']);
const OVERRIDE_WARNING_WINDOW_DAYS = 30;
const THIN_ADAPTER_PATHS = [
  'AGENTS.md',
  '.github/copilot-instructions.md',
  '.gemini/instructions.md',
];
const FORMAL_ARTIFACT_PATHS = [
  '.instructions.md',
  'README.md',
  'CHANGELOG.md',
  'docs/deep_analysis_and_roadmap_backlog.md',
  '.agent-context/rules/api-docs.md',
  '.agent-context/review-checklists/pr-checklist.md',
  '.agent-context/prompts/review-code.md',
  'AGENTS.md',
  '.github/copilot-instructions.md',
  '.gemini/instructions.md',
];
const REQUIRED_HUMAN_WRITING_SNIPPETS = [
  {
    path: '.agent-context/rules/api-docs.md',
    snippets: [
      '## Human Writing Standard (Mandatory)',
      'This applies to documentation, release notes, onboarding text, review summaries, and agent-facing explanations.',
      'Style baseline findings are advisory by default and must not block endpoint-change commits that already include accurate docs/spec updates.',
      'No emoji in formal artifacts.',
    ],
  },
  {
    path: '.agent-context/review-checklists/pr-checklist.md',
    snippets: [
      'Scope applied: This applies to documentation, release notes, onboarding text, review summaries, and agent-facing explanations',
      'Style scope review is advisory and does not block merge when API docs are synced in the same commit and contract details are correct',
      'No emoji in formal documentation or review summaries',
      'Documentation uses plain English and avoids AI cliches',
    ],
  },
  {
    path: 'docs/deep_analysis_and_roadmap_backlog.md',
    snippets: [
      '## Part 6: Documentation and Explanation Standards (Mandatory)',
      'This applies to documentation, release notes, onboarding text, review summaries, and agent-facing explanations.',
      'No emoji in formal artifacts. This is mandatory.',
    ],
  },
];
const TERMINOLOGY_REFERENCE_PATHS = [
  'README.md',
  'docs/roadmap.md',
];
const REQUIRED_TERMINOLOGY_ROW_PATTERNS = [
  {
    label: 'Federated Governance -> Federated Rules Operations',
    pattern: /\|\s*Federated Governance\s*\|\s*Federated Rules Operations\s*\|/u,
  },
  {
    label: 'Governance Engine -> Rules Engine',
    pattern: /\|\s*Governance Engine\s*\|\s*Rules Engine\s*\|/u,
  },
  {
    label: 'Guardrails -> Quality Checks',
    pattern: /\|\s*Guardrails\s*\|\s*Quality Checks\s*\|/u,
  },
];
const REQUIRED_TERMINOLOGY_RULE_SNIPPET =
  'Rule: on first mention in developer-facing docs, include canonical term in parentheses.';
const TERMINOLOGY_REFERENCE_DOCUMENT_PATH = 'docs/terminology-mapping.md';
const REQUIRED_DEVELOPER_FIRST_MENTION_PATTERNS = [
  {
    path: 'README.md',
    label: 'Rules Engine first mention includes Governance Engine',
    pattern: /Rules Engine\s*\(Governance Engine\)/u,
  },
  {
    path: 'docs/deep-dive.md',
    label: 'Dynamic Rules Engine first mention includes Governance Engine',
    pattern: /Dynamic Rules Engine\s*\(Governance Engine\)/u,
  },
  {
    path: 'docs/faq.md',
    label: 'Quality Checks first mention includes Guardrails',
    pattern: /Quality Checks\s*\(Guardrails\)/u,
  },
  {
    path: '.agent-context/prompts/init-project.md',
    label: 'Init prompt first mention includes Federated Governance baseline',
    pattern: /rules operations context\s*\(Federated Governance baseline\)/iu,
  },
  {
    path: 'lib/cli/commands/init.mjs',
    label: 'Init command wording includes Federated Governance baseline',
    pattern: /rules operations\s+(assets|pack)[^\n]*\(Federated Governance baseline\)/iu,
  },
  {
    path: 'lib/cli/commands/upgrade.mjs',
    label: 'Upgrade command wording includes Federated Governance baseline',
    pattern: /rules operations upgrade assistant\s*\(Federated Governance baseline\)/iu,
  },
  {
    path: 'lib/cli/utils.mjs',
    label: 'CLI help wording includes quality checks and guardrails',
    pattern: /quality checks\s*\(guardrails\)/iu,
  },
];
const COMPLIANCE_TERMINOLOGY_BOUNDARY_PATHS = [
  '.agent-context/review-checklists/pr-checklist.md',
  '.agent-context/review-checklists/architecture-review.md',
  'scripts/release-gate.mjs',
  'scripts/forbidden-content-check.mjs',
];
const COMPLIANCE_ALIAS_TERMS = [
  'Federated Rules Operations',
];
const REQUIRED_COMPLIANCE_CANONICAL_SNIPPETS = [
  {
    path: '.agent-context/review-checklists/pr-checklist.md',
    snippet: '### 15. Universal SOP Consolidation',
    label: 'PR checklist keeps consolidated Universal SOP section',
  },
];
const REQUIRED_DETECTION_TRANSPARENCY_SNIPPETS = [
  {
    path: 'lib/cli/commands/init.mjs',
    snippets: [
      'Existing project detection transparency:',
      'Use detected setup for this existing project?',
      'detectionTransparency',
    ],
  },
  {
    path: 'lib/cli/commands/upgrade.mjs',
    snippets: [
      'Existing project detection transparency:',
      'formatDetectionCandidates(projectDetection.rankedCandidates)',
      'detectionTransparency',
    ],
  },
  {
    path: 'lib/cli/compiler.mjs',
    snippets: [
      'detectionTransparency = null',
      'detectionTransparency: detectionTransparency || null',
    ],
  },
];
const REQUIRED_STACK_RESEARCH_ENGINE_SNIPPETS = [
  {
    path: 'lib/cli/architect.mjs',
    snippets: [
      'ARCHITECT_RESEARCH_SNAPSHOT_FILE_PATH',
      'evidenceCitations',
      'designGuidance',
      'copiedExternalProse: false',
      'realtimeGateEnabled',
      'requestedMode: requestedResearchMode',
    ],
  },
  {
    path: 'lib/cli/commands/init.mjs',
    snippets: [
      '--architect-research-mode',
      '--enable-realtime-research',
      '--architect-realtime-signal-file',
      'researchMode: initOptions.architectResearchMode',
      'enableRealtimeResearch: initOptions.enableRealtimeResearch',
    ],
  },
];
const REQUIRED_UNIVERSAL_SOP_SNIPPETS = [
  {
    path: '.agent-context/rules/architecture.md',
    snippets: [
      '## Universal SOP Baseline (Mandatory)',
      'Security and testing are non-negotiable baseline requirements.',
      'If required project context docs are missing, stop implementation and bootstrap docs before writing application code.',
    ],
  },
  {
    path: '.agent-context/review-checklists/pr-checklist.md',
    snippets: [
      '### 15. Universal SOP Consolidation',
      'Coding flow is blocked if `docs/architecture-decision-record.md` (or `docs/Architecture-Decision-Record.md`) is missing',
      'UI implementation flow is blocked if `docs/DESIGN.md` or `docs/design-intent.json` is missing',
    ],
  },
  {
    path: '.agent-context/prompts/review-code.md',
    snippets: [
      'Enforce Universal SOP hard gate: block coding flow when required project docs are missing (`docs/architecture-decision-record.md`, and for UI scope `docs/DESIGN.md` plus `docs/design-intent.json`).',
    ],
  },
  {
    path: '.agent-context/prompts/refactor.md',
    snippets: [
      '6. Enforce Universal SOP hard gate: stop implementation if `docs/architecture-decision-record.md` is missing, and for UI scope stop if `docs/DESIGN.md` or `docs/design-intent.json` is missing.',
    ],
  },
  {
    path: 'lib/cli/compiler.mjs',
    snippets: [
      'Universal SOP hard block policy:',
      'Hard block: do not write application code until docs/project-brief.md and docs/architecture-decision-record.md exist.',
      'For UI scope: if docs/DESIGN.md or docs/design-intent.json is missing, execute bootstrap-design prompt before implementing UI surfaces.',
    ],
  },
];
const REQUIRED_TEMPLATE_FREE_BOOTSTRAP_SNIPPETS = [
  {
    path: 'lib/cli/project-scaffolder.mjs',
    snippets: [
      'resolveProjectDocTargets',
      'Write project context docs from scratch (no template rendering, no placeholder boilerplate).',
      'For any research-backed claim, include citation metadata (source + fetchedAt timestamp) from the Architect Engine Snapshot.',
      "bootstrapMode: 'ai-synthesis'",
    ],
  },
  {
    path: 'lib/cli/commands/init.mjs',
    snippets: [
      'Project docs will be authored dynamically by your IDE assistant from these prompts.',
      'bootstrap-project-context.md',
      'Seed docs:',
      'I prepared dynamic synthesis bootstrap prompts',
    ],
  },
];
const REQUIRED_UPGRADE_UI_CONTRACT_WARNING_SNIPPETS = [
  {
    path: 'lib/cli/commands/upgrade.mjs',
    snippets: [
      'UI/frontend scope was detected, but the dynamic design contract is incomplete:',
      'docs/design-intent.json',
      'Planned seed on apply: docs/design-intent.json',
      'Upgrade synchronizes governance assets and can seed docs/design-intent.json, but it does not author project-specific docs/DESIGN.md automatically.',
      'detectUiScopeSignals',
      'seed-generated-during-upgrade',
    ],
  },
];
const REQUIRED_UI_DESIGN_AUTOMATION_SNIPPETS = [
  {
    path: '.instructions.md',
    snippets: [
      'UI Design Mode',
      'bootstrap-design.md',
      'frontend-architecture.md',
      'do not eagerly load unrelated backend-only rules',
    ],
  },
  {
    path: '.agent-context/prompts/bootstrap-design.md',
    snippets: [
      'UI Design Mode is context-isolated by default:',
      'Responsive Strategy and Cross-Viewport Adaptation Matrix',
      '`colorTruth.format`',
      '`crossViewportAdaptation.mutationRules.mobile/tablet/desktop`',
      '`motionSystem`',
      '`componentMorphology`',
      'Do not reuse a color palette, component skin, or motion signature from prior chats, memories, or unrelated projects',
      'If no approved reference system exists, synthesize the design from zero using current product context, constraints, and content only.',
    ],
  },
  {
    path: 'scripts/ui-design-judge.mjs',
    snippets: [
      'Advisory-first UI design contract judge.',
      'Repo-internal workflow audit; no user-facing runtime modes.',
      'Runs only in advisory mode for this repository workflow.',
      'Do not reward generic SaaS defaults or popular template patterns.',
      'UI design judge only evaluates changed UI surfaces.',
    ],
  },
  {
    path: 'lib/cli/project-scaffolder.mjs',
    snippets: [
      'colorTruth',
      'crossViewportAdaptation',
      'motionSystem',
      'componentMorphology',
      'requireViewportMutationRules',
      'allowHexDerivatives',
    ],
  },
  {
    path: 'lib/cli/detector.mjs',
    snippets: [
      'hardcodedColorCount',
      'propDrillingCandidateCount',
      'arbitraryBreakpointCount',
      'frontendEvidenceMetrics',
    ],
  },
  {
    path: 'lib/cli/compiler.mjs',
    snippets: [
      'LAYER 5: EXECUTION PROMPTS AND UI TRIGGERS',
      'bootstrap-design.md -> ui, ux, layout, screen, tailwind, frontend, redesign',
      'Keep UI-only requests context-isolated',
    ],
  },
];
const REQUIRED_DOCKER_RUNTIME_AUTOMATION_SNIPPETS = [
  {
    path: '.instructions.md',
    snippets: [
      'docker-runtime.md',
      'For Docker or Compose work, load `docker-runtime.md` and verify the latest official Docker docs before authoring container assets.',
    ],
  },
  {
    path: '.agent-context/rules/docker-runtime.md',
    snippets: [
      'latest official Docker documentation first',
      'Docker Compose Quickstart',
      'Compose file reference',
      'Dockerfile best practices',
      'Prefer current `docker compose` workflows and `compose.yaml`.',
      'Do not add the top-level Compose `version` field by default.',
      'Prefer the latest stable compatible Docker base image',
    ],
  },
  {
    path: '.agent-context/prompts/init-project.md',
    snippets: [
      'If Docker or Compose is in scope, load [docker-runtime.md](../rules/docker-runtime.md) and verify the latest official Docker guidance before authoring container assets.',
      'If containerization is selected, Docker assets must follow [docker-runtime.md](../rules/docker-runtime.md) and the latest official Docker docs instead of stale blog-era patterns.',
    ],
  },
];
const REQUIRED_DEPENDENCY_FRESHNESS_AUTOMATION_SNIPPETS = [
  {
    path: '.instructions.md',
    snippets: [
      'prefer the latest stable compatible dependency set and official setup flow',
    ],
  },
  {
    path: '.agent-context/rules/efficiency-vs-hype.md',
    snippets: [
      'Latest-Compatible-First Rule',
      'latest stable compatible dependency version',
      'official scaffolder or setup command',
      'Only step down to an older dependency version after documenting',
    ],
  },
  {
    path: '.agent-context/prompts/init-project.md',
    snippets: [
      'latest stable compatible dependency set and official framework setup flow first',
      'Prefer official framework setup commands or canonical starter flows',
    ],
  },
];
const FORBIDDEN_TEMPLATE_BOOTSTRAP_SNIPPETS = [
  {
    path: 'lib/cli/project-scaffolder.mjs',
    snippets: [
      '.tmpl',
    ],
  },
];
const REQUIRED_DETERMINISTIC_BOUNDARY_ENFORCEMENT_SNIPPETS = [
  {
    path: 'scripts/documentation-boundary-audit.mjs',
    snippets: [
      'reportVersion',
      'violations',
      'suggestedActions',
      'diagnosticCode',
      'autoDocsSyncScope',
      'rolloutMetrics',
      'precision',
      'recall',
    ],
  },
  {
    path: 'scripts/release-gate.mjs',
    snippets: [
      'documentation-boundary-hard-rule',
      'documentation-boundary-diagnostics-machine-readable',
      'diagnostics.documentationBoundaryAudit',
      'auto-docs-sync-scope-phase1',
      'auto-docs-sync-rollout-metrics',
    ],
  },
];

const validationResult = {
  passed: 0,
  failed: 0,
  errors: [],
  warnings: [],
};

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readTextFile(filePath) {
  return readFile(filePath, 'utf8');
}

async function collectFiles(directoryPath, fileExtensionMatcher) {
  const matchingFilePaths = [];

  async function walk(currentDirectoryPath) {
    const directoryEntries = await readdir(currentDirectoryPath, { withFileTypes: true });

    for (const directoryEntry of directoryEntries) {
      if (
        directoryEntry.name === '.git'
        || directoryEntry.name === 'node_modules'
        || directoryEntry.name === '.agentic-backup'
        || directoryEntry.name === '.benchmarks'
      ) {
        continue;
      }

      const entryPath = join(currentDirectoryPath, directoryEntry.name);

      if (directoryEntry.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      if (fileExtensionMatcher(directoryEntry.name)) {
        matchingFilePaths.push(entryPath);
      }
    }
  }

  await walk(directoryPath);
  return matchingFilePaths;
}

function pass(message) {
  validationResult.passed += 1;
  console.log(`  PASS ${message}`);
}

function fail(message) {
  validationResult.failed += 1;
  validationResult.errors.push(message);
  console.log(`  FAIL ${message}`);
}

function warn(message) {
  validationResult.warnings.push(message);
  console.log(`  WARN ${message}`);
}

function normalizeLineEndings(content) {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

async function validateRequiredFiles() {
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
    'scripts/frontend-usability-audit.mjs',
    'scripts/ui-design-judge.mjs',
    'scripts/documentation-boundary-audit.mjs',
    'scripts/context-triggered-audit.mjs',
    'scripts/rules-guardian-audit.mjs',
    'scripts/explain-on-demand-audit.mjs',
    'scripts/single-source-lazy-loading-audit.mjs',
    'scripts/sync-thin-adapters.mjs',
    'scripts/v3-purge-audit.mjs',
    'scripts/release-gate.mjs',
    'scripts/generate-sbom.mjs',
    '.cursorrules',
    '.windsurfrules',
    '.agent-override.md',
    '.agent-context/policies/llm-judge-threshold.json',
    'mcp.json',
    'AGENTS.md',
    '.github/copilot-instructions.md',
    '.gemini/instructions.md',
    'README.md',
    'CHANGELOG.md',
    'docs/faq.md',
    'docs/deep-dive.md',
    'docs/terminology-mapping.md',
    'docs/v1.7-execution-playbook.md',
    'docs/v1.7-issue-breakdown.md',
    'docs/v1.8-operations-playbook.md',
    'docs/v2-upgrade-playbook.md',
    '.agent-context/state/benchmark-reproducibility.json',
    '.agent-context/state/benchmark-writer-judge-config.json',
    '.agent-context/state/benchmark-watchlist.json',
    '.agent-context/state/stack-research-snapshot.json',
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
    'tests/enterprise-ops.test.mjs',
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

async function validateMarkdownFiles() {
  console.log('\nChecking markdown content...');

  const markdownFilePaths = await collectFiles(ROOT_DIR, (fileName) => fileName.endsWith('.md'));

  for (const markdownFilePath of markdownFilePaths) {
    const markdownContent = await readTextFile(markdownFilePath);
    const relativeMarkdownPath = relative(ROOT_DIR, markdownFilePath);

    if (markdownContent.trim().length === 0) {
      fail(`Empty markdown file: ${relativeMarkdownPath}`);
      continue;
    }

    pass(`${relativeMarkdownPath} (${markdownContent.length} chars)`);
  }
}

async function validateRuleFiles() {
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
    'review-checklists/pr-checklist.md',
    'review-checklists/architecture-review.md',
    'prompts/init-project.md',
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

async function validateChecklistConsolidation() {
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

function stripMarkdownCodeBlocks(markdownText) {
  return markdownText.replace(/```[\s\S]*?```/g, '');
}

function parseOverrideExpiryDate(rawExpiryValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawExpiryValue)) {
    return null;
  }

  const parsedDate = new Date(`${rawExpiryValue}T00:00:00.000Z`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

async function validateOverrideGovernance() {
  console.log('\nChecking override governance...');

  const overrideContent = await readTextFile(OVERRIDE_FILE_PATH);
  const overrideContentWithoutCodeBlocks = stripMarkdownCodeBlocks(overrideContent);
  const overrideEntryPattern = /\[Rule:\s*([^\]]+)\]([\s\S]*?)(?=\n\[Rule:|$)/g;
  const overrideEntries = [];
  let overrideEntryMatch = overrideEntryPattern.exec(overrideContentWithoutCodeBlocks);

  while (overrideEntryMatch) {
    const ruleName = overrideEntryMatch[1].trim();
    const entryBody = overrideEntryMatch[2];
    const ownerMatch = entryBody.match(/(?:^|\n)Owner:\s*(.+)/);
    const expiryMatch = entryBody.match(/(?:^|\n)Expiry:\s*(.+)/);

    overrideEntries.push({
      ruleName,
      owner: ownerMatch ? ownerMatch[1].trim() : '',
      expiry: expiryMatch ? expiryMatch[1].trim() : '',
    });

    overrideEntryMatch = overrideEntryPattern.exec(overrideContentWithoutCodeBlocks);
  }

  if (overrideEntries.length === 0) {
    pass('No active override entries found; governance baseline remains strict');
    return;
  }

  const currentDate = new Date();

  for (const overrideEntry of overrideEntries) {
    const overrideContextLabel = `[Rule: ${overrideEntry.ruleName}]`;

    if (!overrideEntry.owner) {
      fail(`${overrideContextLabel} is missing Owner metadata`);
      continue;
    }

    pass(`${overrideContextLabel} owner is defined`);

    if (!overrideEntry.expiry) {
      fail(`${overrideContextLabel} is missing Expiry metadata`);
      continue;
    }

    const expiryDate = parseOverrideExpiryDate(overrideEntry.expiry);
    if (!expiryDate) {
      fail(`${overrideContextLabel} has invalid Expiry format (expected YYYY-MM-DD)`);
      continue;
    }

    const remainingMilliseconds = expiryDate.getTime() - currentDate.getTime();
    const remainingDays = Math.floor(remainingMilliseconds / (1000 * 60 * 60 * 24));

    if (remainingMilliseconds < 0) {
      fail(`${overrideContextLabel} is expired (${overrideEntry.expiry})`);
      continue;
    }

    pass(`${overrideContextLabel} expiry is valid (${overrideEntry.expiry})`);

    if (remainingDays <= OVERRIDE_WARNING_WINDOW_DAYS) {
      warn(`${overrideContextLabel} expires in ${remainingDays} day(s); renew or remove soon`);
    }
  }
}

async function validateCrossReferences() {
  console.log('\nChecking internal links...');

  const markdownFilePaths = await collectFiles(ROOT_DIR, (fileName) => fileName.endsWith('.md'));
  const linkPattern = /\[([^\]]*)\]\((?!https?:\/\/|#)([^)]+)\)/g;
  let checkedLinkCount = 0;

  for (const markdownFilePath of markdownFilePaths) {
    const markdownContent = await readTextFile(markdownFilePath);
    const currentFileDirectory = dirname(markdownFilePath);
    const relativeMarkdownPath = relative(ROOT_DIR, markdownFilePath);
    let linkMatch = linkPattern.exec(markdownContent);

    while (linkMatch) {
      const rawLinkTarget = linkMatch[2].split('#')[0];
      if (rawLinkTarget) {
        checkedLinkCount += 1;
        const resolvedLinkPath = resolve(currentFileDirectory, rawLinkTarget);

        if (await fileExists(resolvedLinkPath)) {
          pass(`${relativeMarkdownPath} → ${linkMatch[2]}`);
        } else {
          fail(`Broken link in ${relativeMarkdownPath}: ${linkMatch[2]}`);
        }
      }

      linkMatch = linkPattern.exec(markdownContent);
    }
  }

  if (checkedLinkCount === 0) {
    warn('No internal links were found in markdown files');
  }
}

async function validateAgentsManifest() {
  console.log('\nChecking AGENTS.md manifest links...');

  const agentsContent = await readTextFile(join(ROOT_DIR, 'AGENTS.md'));
  const fileReferencePattern = /\[`?([^`\]]+)`?\]\(([^)]+)\)/g;
  let manifestLinkCount = 0;
  let fileReferenceMatch = fileReferencePattern.exec(agentsContent);

  while (fileReferenceMatch) {
    const manifestLinkTarget = fileReferenceMatch[2];

    if (!manifestLinkTarget.startsWith('http')) {
      manifestLinkCount += 1;
      const resolvedManifestLinkPath = resolve(ROOT_DIR, manifestLinkTarget);

      if (await fileExists(resolvedManifestLinkPath)) {
        pass(`AGENTS.md → ${manifestLinkTarget}`);
      } else {
        fail(`AGENTS.md references missing file: ${manifestLinkTarget}`);
      }
    }

    fileReferenceMatch = fileReferencePattern.exec(agentsContent);
  }

  if (manifestLinkCount === 0) {
    warn('AGENTS.md does not contain any local manifest links');
  }
}

async function validatePackageMetadata() {
  console.log('\nChecking package metadata...');

  const packageJson = JSON.parse(await readTextFile(PACKAGE_JSON_PATH));
  const versionPattern = /^\d+\.\d+\.\d+$/;

  if (typeof packageJson.version !== 'string' || !versionPattern.test(packageJson.version)) {
    fail('package.json version must be a semantic version string');
  } else {
    pass(`package.json version ${packageJson.version}`);
  }

  if (packageJson.scripts?.validate === 'node ./scripts/validate.mjs') {
    pass('package.json validate script is Node-first');
  } else {
    fail('package.json validate script must use node ./scripts/validate.mjs');
  }

  if (packageJson.scripts?.test) {
    pass('package.json test script exists');
  } else {
    fail('package.json test script is missing');
  }

  if (packageJson.devDependencies && Object.keys(packageJson.devDependencies).length > 0) {
    warn('package.json still has devDependencies; review whether they are necessary');
  } else {
    pass('package.json has no unnecessary devDependencies');
  }

  if (Array.isArray(packageJson.files) && packageJson.files.includes('.instructions.md')) {
    pass('package.json publishes canonical .instructions.md');
  } else {
    fail('package.json must publish .instructions.md so init and upgrade can copy the canonical root instructions file');
  }
}

async function validatePolicyFile() {
  console.log('\nChecking LLM Judge policy...');

  const policyContent = await readTextFile(POLICY_FILE_PATH);
  const parsedPolicy = JSON.parse(policyContent);
  const selectedProfileName = parsedPolicy.selectedProfile;
  const profileThresholds = parsedPolicy.profileThresholds;

  if (typeof selectedProfileName !== 'string') {
    fail('Policy file must define selectedProfile as a string');
  } else {
    pass(`LLM Judge selected profile: ${selectedProfileName}`);
  }

  if (!profileThresholds || typeof profileThresholds !== 'object') {
    fail('Policy file must define profileThresholds');
    return;
  }

  for (const [profileName, profileSettings] of Object.entries(profileThresholds)) {
    if (!Array.isArray(profileSettings.blockingSeverities)) {
      fail(`Policy profile ${profileName} must define blockingSeverities`);
      continue;
    }

    const invalidSeverity = profileSettings.blockingSeverities.find((severity) => !ALLOWED_SEVERITIES.has(severity));
    if (invalidSeverity) {
      fail(`Policy profile ${profileName} uses unsupported severity: ${invalidSeverity}`);
      continue;
    }

    pass(`Policy profile ${profileName} blocking severities are valid`);
  }

  if (typeof profileThresholds[selectedProfileName] === 'object') {
    pass('Policy selectedProfile points to a valid profile');
  } else {
    fail('Policy selectedProfile must match one of the configured profileThresholds');
  }
}

async function validateVersionConsistency() {
  console.log('\nChecking release version consistency...');

  const packageJson = JSON.parse(await readTextFile(PACKAGE_JSON_PATH));
  const packageVersion = packageJson.version;
  const changelogContent = await readTextFile(CHANGELOG_PATH);

  if (changelogContent.includes(`## ${packageVersion}`)) {
    pass(`CHANGELOG.md contains release entry for ${packageVersion}`);
  } else {
    fail(`CHANGELOG.md is missing a ## ${packageVersion} heading`);
  }

  for (const generatedRuleFileName of GENERATED_RULE_FILES) {
    const generatedRuleContent = await readTextFile(join(ROOT_DIR, generatedRuleFileName));

    if (generatedRuleContent.includes(`Generated by Agentic-Senior-Core CLI v${packageVersion}`)) {
      pass(`${generatedRuleFileName} matches package version ${packageVersion}`);
    } else {
      fail(`${generatedRuleFileName} does not match package version ${packageVersion}`);
    }
  }
}

async function validateDocumentationFlow() {
  console.log('\nChecking documentation flow...');

  const readmeContent = await readTextFile(README_PATH);
  const requiredReadmeSnippets = [
    'npx @ryuenn3123/agentic-senior-core init',
    'npm run validate',
    'docs/faq.md',
    'docs/deep-dive.md',
    'docs/v2-upgrade-playbook.md',
  ];

  for (const requiredReadmeSnippet of requiredReadmeSnippets) {
    if (readmeContent.includes(requiredReadmeSnippet)) {
      pass(`README.md mentions ${requiredReadmeSnippet}`);
    } else {
      fail(`README.md must mention ${requiredReadmeSnippet}`);
    }
  }
}

async function validateTerminologyMapping() {
  console.log('\nChecking terminology mapping consistency...');

  const terminologyReferenceDocumentPath = join(ROOT_DIR, TERMINOLOGY_REFERENCE_DOCUMENT_PATH);

  if (!(await fileExists(terminologyReferenceDocumentPath))) {
    fail(`Missing terminology reference document: ${TERMINOLOGY_REFERENCE_DOCUMENT_PATH}`);
  } else {
    const terminologyReferenceContent = await readTextFile(terminologyReferenceDocumentPath);

    if (terminologyReferenceContent.includes('Dual-Term Mapping')) {
      pass(`${TERMINOLOGY_REFERENCE_DOCUMENT_PATH} includes Dual-Term Mapping section`);
    } else {
      fail(`${TERMINOLOGY_REFERENCE_DOCUMENT_PATH} must include Dual-Term Mapping section`);
    }

    for (const terminologyRowRule of REQUIRED_TERMINOLOGY_ROW_PATTERNS) {
      if (terminologyRowRule.pattern.test(terminologyReferenceContent)) {
        pass(`${TERMINOLOGY_REFERENCE_DOCUMENT_PATH} includes mapping row: ${terminologyRowRule.label}`);
      } else {
        fail(`${TERMINOLOGY_REFERENCE_DOCUMENT_PATH} is missing mapping row: ${terminologyRowRule.label}`);
      }
    }

    if (terminologyReferenceContent.includes('first mention must include canonical term in parentheses')) {
      pass(`${TERMINOLOGY_REFERENCE_DOCUMENT_PATH} defines first-mention canonical term rule`);
    } else {
      fail(`${TERMINOLOGY_REFERENCE_DOCUMENT_PATH} must define first-mention canonical term rule`);
    }

    if (terminologyReferenceContent.includes('Compliance and audit artifacts must keep canonical enterprise terminology')) {
      pass(`${TERMINOLOGY_REFERENCE_DOCUMENT_PATH} defines compliance terminology boundary`);
    } else {
      fail(`${TERMINOLOGY_REFERENCE_DOCUMENT_PATH} must define compliance terminology boundary`);
    }
  }

  for (const terminologyReferencePath of TERMINOLOGY_REFERENCE_PATHS) {
    const absoluteReferencePath = join(ROOT_DIR, terminologyReferencePath);

    if (!(await fileExists(absoluteReferencePath))) {
      fail(`Missing terminology reference source: ${terminologyReferencePath}`);
      continue;
    }

    const referenceContent = await readTextFile(absoluteReferencePath);

    if (referenceContent.includes('Terminology Mapping (Final)')) {
      pass(`${terminologyReferencePath} includes Terminology Mapping (Final)`);
    } else {
      fail(`${terminologyReferencePath} must include Terminology Mapping (Final)`);
    }

    for (const terminologyRowRule of REQUIRED_TERMINOLOGY_ROW_PATTERNS) {
      if (terminologyRowRule.pattern.test(referenceContent)) {
        pass(`${terminologyReferencePath} includes mapping row: ${terminologyRowRule.label}`);
      } else {
        fail(`${terminologyReferencePath} is missing mapping row: ${terminologyRowRule.label}`);
      }
    }

    if (referenceContent.includes(REQUIRED_TERMINOLOGY_RULE_SNIPPET)) {
      pass(`${terminologyReferencePath} includes first-mention canonical term rule`);
    } else {
      fail(`${terminologyReferencePath} must include first-mention canonical term rule`);
    }

    if (referenceContent.includes(TERMINOLOGY_REFERENCE_DOCUMENT_PATH)) {
      pass(`${terminologyReferencePath} links to ${TERMINOLOGY_REFERENCE_DOCUMENT_PATH}`);
    } else {
      fail(`${terminologyReferencePath} must link to ${TERMINOLOGY_REFERENCE_DOCUMENT_PATH}`);
    }
  }

  for (const firstMentionRule of REQUIRED_DEVELOPER_FIRST_MENTION_PATTERNS) {
    const absoluteFirstMentionPath = join(ROOT_DIR, firstMentionRule.path);

    if (!(await fileExists(absoluteFirstMentionPath))) {
      fail(`Missing developer-facing first-mention source: ${firstMentionRule.path}`);
      continue;
    }

    const firstMentionContent = await readTextFile(absoluteFirstMentionPath);
    if (firstMentionRule.pattern.test(firstMentionContent)) {
      pass(`${firstMentionRule.path} keeps first-mention rule: ${firstMentionRule.label}`);
    } else {
      fail(`${firstMentionRule.path} must keep first-mention rule: ${firstMentionRule.label}`);
    }
  }

  for (const compliancePath of COMPLIANCE_TERMINOLOGY_BOUNDARY_PATHS) {
    const absoluteCompliancePath = join(ROOT_DIR, compliancePath);

    if (!(await fileExists(absoluteCompliancePath))) {
      fail(`Missing compliance/audit artifact for terminology boundary: ${compliancePath}`);
      continue;
    }

    const complianceContent = await readTextFile(absoluteCompliancePath);
    for (const aliasTerm of COMPLIANCE_ALIAS_TERMS) {
      if (complianceContent.includes(aliasTerm)) {
        fail(`${compliancePath} must not use developer-facing alias in compliance context: ${aliasTerm}`);
      } else {
        pass(`${compliancePath} keeps canonical terminology boundary for alias: ${aliasTerm}`);
      }
    }
  }

  for (const complianceRule of REQUIRED_COMPLIANCE_CANONICAL_SNIPPETS) {
    const absoluteComplianceRulePath = join(ROOT_DIR, complianceRule.path);

    if (!(await fileExists(absoluteComplianceRulePath))) {
      fail(`Missing compliance canonical source: ${complianceRule.path}`);
      continue;
    }

    const complianceRuleContent = await readTextFile(absoluteComplianceRulePath);
    if (complianceRuleContent.includes(complianceRule.snippet)) {
      pass(`${complianceRule.path} keeps canonical terminology rule: ${complianceRule.label}`);
    } else {
      fail(`${complianceRule.path} must keep canonical terminology rule: ${complianceRule.label}`);
    }
  }
}

async function validateDetectionTransparencyCoverage() {
  console.log('\nChecking existing-project detection transparency coverage...');

  for (const transparencyRule of REQUIRED_DETECTION_TRANSPARENCY_SNIPPETS) {
    const absoluteTransparencyPath = join(ROOT_DIR, transparencyRule.path);

    if (!(await fileExists(absoluteTransparencyPath))) {
      fail(`Missing detection transparency source: ${transparencyRule.path}`);
      continue;
    }

    const transparencyContent = await readTextFile(absoluteTransparencyPath);
    for (const requiredSnippet of transparencyRule.snippets) {
      if (transparencyContent.includes(requiredSnippet)) {
        pass(`${transparencyRule.path} includes detection transparency snippet: ${requiredSnippet}`);
      } else {
        fail(`${transparencyRule.path} is missing detection transparency snippet: ${requiredSnippet}`);
      }
    }
  }
}

async function validateStackResearchEngineCoverage() {
  console.log('\nChecking stack research engine coverage...');

  for (const coverageRule of REQUIRED_STACK_RESEARCH_ENGINE_SNIPPETS) {
    const absoluteCoveragePath = join(ROOT_DIR, coverageRule.path);

    if (!(await fileExists(absoluteCoveragePath))) {
      fail(`Missing stack research source: ${coverageRule.path}`);
      continue;
    }

    const coverageContent = await readTextFile(absoluteCoveragePath);
    for (const requiredSnippet of coverageRule.snippets) {
      if (coverageContent.includes(requiredSnippet)) {
        pass(`${coverageRule.path} includes stack research snippet: ${requiredSnippet}`);
      } else {
        fail(`${coverageRule.path} is missing stack research snippet: ${requiredSnippet}`);
      }
    }
  }
}

async function validateUniversalSopConsolidationCoverage() {
  console.log('\nChecking Universal SOP consolidation coverage...');

  for (const coverageRule of REQUIRED_UNIVERSAL_SOP_SNIPPETS) {
    const absoluteCoveragePath = join(ROOT_DIR, coverageRule.path);

    if (!(await fileExists(absoluteCoveragePath))) {
      fail(`Missing Universal SOP source: ${coverageRule.path}`);
      continue;
    }

    const coverageContent = await readTextFile(absoluteCoveragePath);
    for (const requiredSnippet of coverageRule.snippets) {
      if (coverageContent.includes(requiredSnippet)) {
        pass(`${coverageRule.path} includes Universal SOP snippet: ${requiredSnippet}`);
      } else {
        fail(`${coverageRule.path} is missing Universal SOP snippet: ${requiredSnippet}`);
      }
    }
  }
}

async function validateTemplateFreeBootstrapCoverage() {
  console.log('\nChecking template-free dynamic bootstrap coverage...');

  for (const coverageRule of REQUIRED_TEMPLATE_FREE_BOOTSTRAP_SNIPPETS) {
    const absoluteCoveragePath = join(ROOT_DIR, coverageRule.path);

    if (!(await fileExists(absoluteCoveragePath))) {
      fail(`Missing template-free bootstrap source: ${coverageRule.path}`);
      continue;
    }

    const coverageContent = await readTextFile(absoluteCoveragePath);
    for (const requiredSnippet of coverageRule.snippets) {
      if (coverageContent.includes(requiredSnippet)) {
        pass(`${coverageRule.path} includes template-free bootstrap snippet: ${requiredSnippet}`);
      } else {
        fail(`${coverageRule.path} is missing template-free bootstrap snippet: ${requiredSnippet}`);
      }
    }
  }

  for (const forbiddenRule of FORBIDDEN_TEMPLATE_BOOTSTRAP_SNIPPETS) {
    const absoluteForbiddenPath = join(ROOT_DIR, forbiddenRule.path);

    if (!(await fileExists(absoluteForbiddenPath))) {
      fail(`Missing template-free bootstrap source: ${forbiddenRule.path}`);
      continue;
    }

    const forbiddenContent = await readTextFile(absoluteForbiddenPath);
    for (const forbiddenSnippet of forbiddenRule.snippets) {
      if (forbiddenContent.includes(forbiddenSnippet)) {
        fail(`${forbiddenRule.path} must not include active template snippet: ${forbiddenSnippet}`);
      } else {
        pass(`${forbiddenRule.path} excludes active template snippet: ${forbiddenSnippet}`);
      }
    }
  }
}

async function validateUpgradeUiContractWarningCoverage() {
  console.log('\nChecking upgrade UI contract warning coverage...');

  for (const coverageRule of REQUIRED_UPGRADE_UI_CONTRACT_WARNING_SNIPPETS) {
    const absoluteCoveragePath = join(ROOT_DIR, coverageRule.path);

    if (!(await fileExists(absoluteCoveragePath))) {
      fail(`Missing upgrade UI contract warning source: ${coverageRule.path}`);
      continue;
    }

    const coverageContent = await readTextFile(absoluteCoveragePath);
    for (const requiredSnippet of coverageRule.snippets) {
      if (coverageContent.includes(requiredSnippet)) {
        pass(`${coverageRule.path} includes upgrade UI contract warning snippet: ${requiredSnippet}`);
      } else {
        fail(`${coverageRule.path} is missing upgrade UI contract warning snippet: ${requiredSnippet}`);
      }
    }
  }
}

async function validateUiDesignAutomationCoverage() {
  console.log('\nChecking UI design automation coverage...');

  for (const coverageRule of REQUIRED_UI_DESIGN_AUTOMATION_SNIPPETS) {
    const absoluteCoveragePath = join(ROOT_DIR, coverageRule.path);

    if (!(await fileExists(absoluteCoveragePath))) {
      fail(`Missing UI design automation source: ${coverageRule.path}`);
      continue;
    }

    const coverageContent = await readTextFile(absoluteCoveragePath);
    for (const requiredSnippet of coverageRule.snippets) {
      if (coverageContent.includes(requiredSnippet)) {
        pass(`${coverageRule.path} includes UI design automation snippet: ${requiredSnippet}`);
      } else {
        fail(`${coverageRule.path} is missing UI design automation snippet: ${requiredSnippet}`);
      }
    }
  }
}

async function validateDockerRuntimeAutomationCoverage() {
  console.log('\nChecking Docker runtime automation coverage...');

  for (const coverageRule of REQUIRED_DOCKER_RUNTIME_AUTOMATION_SNIPPETS) {
    const absoluteCoveragePath = join(ROOT_DIR, coverageRule.path);

    if (!(await fileExists(absoluteCoveragePath))) {
      fail(`Missing Docker runtime automation source: ${coverageRule.path}`);
      continue;
    }

    const coverageContent = await readTextFile(absoluteCoveragePath);
    for (const requiredSnippet of coverageRule.snippets) {
      if (coverageContent.includes(requiredSnippet)) {
        pass(`${coverageRule.path} includes Docker runtime automation snippet: ${requiredSnippet}`);
      } else {
        fail(`${coverageRule.path} is missing Docker runtime automation snippet: ${requiredSnippet}`);
      }
    }
  }
}

async function validateDependencyFreshnessAutomationCoverage() {
  console.log('\nChecking dependency freshness automation coverage...');

  for (const coverageRule of REQUIRED_DEPENDENCY_FRESHNESS_AUTOMATION_SNIPPETS) {
    const absoluteCoveragePath = join(ROOT_DIR, coverageRule.path);

    if (!(await fileExists(absoluteCoveragePath))) {
      fail(`Missing dependency freshness automation source: ${coverageRule.path}`);
      continue;
    }

    const coverageContent = await readTextFile(absoluteCoveragePath);
    for (const requiredSnippet of coverageRule.snippets) {
      if (coverageContent.includes(requiredSnippet)) {
        pass(`${coverageRule.path} includes dependency freshness automation snippet: ${requiredSnippet}`);
      } else {
        fail(`${coverageRule.path} is missing dependency freshness automation snippet: ${requiredSnippet}`);
      }
    }
  }
}

async function validateDeterministicBoundaryEnforcementCoverage() {
  console.log('\nChecking deterministic boundary enforcement coverage...');

  for (const coverageRule of REQUIRED_DETERMINISTIC_BOUNDARY_ENFORCEMENT_SNIPPETS) {
    const absoluteCoveragePath = join(ROOT_DIR, coverageRule.path);

    if (!(await fileExists(absoluteCoveragePath))) {
      fail(`Missing deterministic boundary source: ${coverageRule.path}`);
      continue;
    }

    const coverageContent = await readTextFile(absoluteCoveragePath);
    for (const requiredSnippet of coverageRule.snippets) {
      if (coverageContent.includes(requiredSnippet)) {
        pass(`${coverageRule.path} includes deterministic boundary snippet: ${requiredSnippet}`);
      } else {
        fail(`${coverageRule.path} is missing deterministic boundary snippet: ${requiredSnippet}`);
      }
    }
  }
}

function isNormalizedMetricValue(value) {
  return Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 1;
}

async function validateStackResearchSnapshotState() {
  console.log('\nChecking deterministic stack research snapshot state...');

  const snapshotPath = join(ROOT_DIR, '.agent-context', 'state', 'stack-research-snapshot.json');
  if (!(await fileExists(snapshotPath))) {
    fail('Missing deterministic stack research snapshot: .agent-context/state/stack-research-snapshot.json');
    return;
  }

  let snapshotPayload;
  try {
    snapshotPayload = JSON.parse(await readTextFile(snapshotPath));
  } catch {
    fail('Invalid JSON in .agent-context/state/stack-research-snapshot.json');
    return;
  }

  if (snapshotPayload?.deterministic === true) {
    pass('stack-research-snapshot.json declares deterministic: true');
  } else {
    fail('stack-research-snapshot.json must declare deterministic: true');
  }

  const generatedAtValue = String(snapshotPayload?.generatedAt || '');
  if (!Number.isNaN(Date.parse(generatedAtValue))) {
    pass('stack-research-snapshot.json includes valid generatedAt timestamp');
  } else {
    fail('stack-research-snapshot.json must include a valid generatedAt timestamp');
  }

  if (Array.isArray(snapshotPayload?.trustedRealtimeSources) && snapshotPayload.trustedRealtimeSources.length > 0) {
    pass('stack-research-snapshot.json includes trustedRealtimeSources');
  } else {
    fail('stack-research-snapshot.json must include at least one trustedRealtimeSources entry');
  }

  if (!Array.isArray(snapshotPayload?.stackSignals) || snapshotPayload.stackSignals.length === 0) {
    fail('stack-research-snapshot.json must include non-empty stackSignals array');
    return;
  }

  pass(`stack-research-snapshot.json includes ${snapshotPayload.stackSignals.length} stack signal entries`);

  const invalidSignalEntries = snapshotPayload.stackSignals.filter((signalEntry) => {
    const hasStackName = typeof signalEntry?.stackFileName === 'string' && signalEntry.stackFileName.trim().length > 0;
    const hasMeasuredAt = !Number.isNaN(Date.parse(String(signalEntry?.measuredAt || '')));
    const metrics = signalEntry?.metrics || {};
    const hasValidMetrics = isNormalizedMetricValue(metrics.ecosystemMaturity)
      && isNormalizedMetricValue(metrics.talentAvailability)
      && isNormalizedMetricValue(metrics.deliveryVelocity);

    return !(hasStackName && hasMeasuredAt && hasValidMetrics);
  });

  if (invalidSignalEntries.length === 0) {
    pass('stack-research-snapshot.json stackSignals keep measurable metrics and timestamps');
  } else {
    fail(`stack-research-snapshot.json has invalid stackSignals entries: ${invalidSignalEntries.length}`);
  }
}

async function validateMcpConfiguration() {
  console.log('\nChecking MCP configuration...');

  const mcpConfiguration = JSON.parse(await readTextFile(join(ROOT_DIR, 'mcp.json')));
  const lintServerCommand = mcpConfiguration.servers?.lint?.command;
  const testServerCommand = mcpConfiguration.servers?.test?.command;
  const workspaceMcpConfiguration = JSON.parse(await readTextFile(join(ROOT_DIR, '.vscode', 'mcp.json')));
  const workspaceServerConfig = workspaceMcpConfiguration.servers?.['agentic-senior-core'];

  if (lintServerCommand === 'node') {
    pass('MCP lint server uses Node');
  } else {
    fail('MCP lint server must use Node');
  }

  if (testServerCommand === 'node') {
    pass('MCP test server uses Node');
  } else {
    fail('MCP test server must use Node');
  }

  if (typeof workspaceMcpConfiguration.$schema === 'undefined') {
    pass('Workspace MCP config omits $schema (supported by current VS Code MCP schema inference)');
  } else if (workspaceMcpConfiguration.$schema === 'vscode://schemas/mcp') {
    pass('Workspace MCP config uses trusted VS Code schema');
  } else {
    fail('Workspace MCP config $schema must be omitted or set to vscode://schemas/mcp');
  }

  if (workspaceServerConfig?.command === 'node') {
    pass('Workspace MCP server command uses Node');
  } else {
    fail('Workspace MCP server command must use Node');
  }

  if (workspaceServerConfig?.cwd === '${workspaceFolder}') {
    pass('Workspace MCP server cwd uses ${workspaceFolder}');
  } else {
    fail('Workspace MCP server cwd must be ${workspaceFolder}');
  }

  if (Array.isArray(workspaceServerConfig?.args) && workspaceServerConfig.args.includes('./scripts/mcp-server.mjs')) {
    pass('Workspace MCP server points to scripts/mcp-server.mjs');
  } else {
    fail('Workspace MCP server must include ./scripts/mcp-server.mjs argument');
  }
}

async function validateHumanWritingGovernance() {
  console.log('\nChecking human writing governance...');

  const disallowedEmojiPattern = /[\u2705\u274C\u26A0\u{1F4CC}\u{1F536}\u{1F4CE}\u{1F534}\u{1F7E0}\u{1F7E1}\u{1F7E2}]/u;

  for (const formalArtifactPath of FORMAL_ARTIFACT_PATHS) {
    const absoluteFormalArtifactPath = join(ROOT_DIR, formalArtifactPath);

    if (!(await fileExists(absoluteFormalArtifactPath))) {
      fail(`Missing formal artifact for writing governance: ${formalArtifactPath}`);
      continue;
    }

    const formalArtifactContent = await readTextFile(absoluteFormalArtifactPath);

    if (disallowedEmojiPattern.test(formalArtifactContent)) {
      fail(`${formalArtifactPath} contains disallowed emoji symbols in formal text`);
    } else {
      pass(`${formalArtifactPath} has no disallowed emoji symbols`);
    }
  }

  for (const snippetRule of REQUIRED_HUMAN_WRITING_SNIPPETS) {
    const absoluteRulePath = join(ROOT_DIR, snippetRule.path);
    if (!(await fileExists(absoluteRulePath))) {
      fail(`Missing writing governance source: ${snippetRule.path}`);
      continue;
    }

    const writingRuleContent = await readTextFile(absoluteRulePath);
    for (const requiredSnippet of snippetRule.snippets) {
      if (writingRuleContent.includes(requiredSnippet)) {
        pass(`${snippetRule.path} includes writing governance snippet: ${requiredSnippet}`);
      } else {
        fail(`${snippetRule.path} is missing writing governance snippet: ${requiredSnippet}`);
      }
    }
  }
}

async function validateInstructionAdapters() {
  console.log('\nChecking instruction adapter consolidation...');

  const canonicalInstructionContent = normalizeLineEndings(await readTextFile(CANONICAL_INSTRUCTION_PATH));
  const canonicalSnapshotHash = createHash('sha256').update(canonicalInstructionContent).digest('hex');

  for (const thinAdapterPath of THIN_ADAPTER_PATHS) {
    const absoluteAdapterPath = join(ROOT_DIR, thinAdapterPath);

    if (!(await fileExists(absoluteAdapterPath))) {
      fail(`Missing thin adapter file: ${thinAdapterPath}`);
      continue;
    }

    const thinAdapterContent = await readTextFile(absoluteAdapterPath);

    if (
      thinAdapterContent.includes('Adapter Mode: thin')
      && thinAdapterContent.includes('Adapter Source: .instructions.md')
    ) {
      pass(`${thinAdapterPath} declares thin adapter metadata`);
    } else {
      fail(`${thinAdapterPath} must declare Adapter Mode: thin and Adapter Source: .instructions.md`);
    }

    const hashMatch = thinAdapterContent.match(/Canonical Snapshot SHA256:\s*([a-f0-9]{64})/);
    if (!hashMatch) {
      fail(`${thinAdapterPath} must declare Canonical Snapshot SHA256`);
      continue;
    }

    if (hashMatch[1] === canonicalSnapshotHash) {
      pass(`${thinAdapterPath} canonical hash matches .instructions.md`);
    } else {
      fail(`${thinAdapterPath} canonical hash drift detected (expected ${canonicalSnapshotHash})`);
    }

    const thinAdapterLineCount = thinAdapterContent.split(/\r?\n/u).length;
    if (thinAdapterLineCount <= 80) {
      pass(`${thinAdapterPath} remains thin (${thinAdapterLineCount} lines)`);
    } else {
      fail(`${thinAdapterPath} is too large for thin-adapter mode (${thinAdapterLineCount} lines)`);
    }
  }
}

async function validateSkillPurgeSurface() {
  console.log('\nChecking skill and tier purge surface...');

  const skillDirectoryPath = join(AGENT_CONTEXT_DIR, 'skills');
  if (await fileExists(skillDirectoryPath)) {
    fail('Skills directory must be removed: .agent-context/skills');
  } else {
    pass('Skills directory removed: .agent-context/skills');
  }

  const retiredFiles = [
    join(ROOT_DIR, 'lib', 'cli', 'skill-selector.mjs'),
    join(ROOT_DIR, 'scripts', 'skill-tier-policy.mjs'),
    join(ROOT_DIR, 'scripts', 'trust-scorer.mjs'),
  ];

  for (const retiredFilePath of retiredFiles) {
    const relativeRetiredPath = relative(ROOT_DIR, retiredFilePath).replace(/\\/g, '/');
    if (await fileExists(retiredFilePath)) {
      fail(`Retired file still present: ${relativeRetiredPath}`);
    } else {
      pass(`Retired file removed: ${relativeRetiredPath}`);
    }
  }
}

async function main() {
  console.log('===============================================');
  console.log('  Agentic-Senior-Core Repository Validator');
  console.log('===============================================');

  await validateRequiredFiles();
  await validateMarkdownFiles();
  await validateRuleFiles();
  await validateChecklistConsolidation();
  await validateOverrideGovernance();
  await validateAgentsManifest();
  await validateCrossReferences();
  await validatePackageMetadata();
  await validatePolicyFile();
  await validateVersionConsistency();
  await validateDocumentationFlow();
  await validateTerminologyMapping();
  await validateDetectionTransparencyCoverage();
  await validateStackResearchEngineCoverage();
  await validateUniversalSopConsolidationCoverage();
  await validateTemplateFreeBootstrapCoverage();
  await validateUpgradeUiContractWarningCoverage();
  await validateUiDesignAutomationCoverage();
  await validateDockerRuntimeAutomationCoverage();
  await validateDependencyFreshnessAutomationCoverage();
  await validateDeterministicBoundaryEnforcementCoverage();
  await validateStackResearchSnapshotState();
  await validateMcpConfiguration();
  await validateHumanWritingGovernance();
  await validateInstructionAdapters();
  await validateSkillPurgeSurface();

  console.log('\n===============================================');
  console.log('  RESULTS');
  console.log('===============================================');
  console.log(`  Passed: ${validationResult.passed}`);
  console.log(`  Failed: ${validationResult.failed}`);
  console.log(`  Warnings: ${validationResult.warnings.length}`);
  console.log('===============================================');

  if (validationResult.failed > 0) {
    console.log('\nVALIDATION FAILED\n');
    process.exit(1);
  }

  console.log('\nALL CHECKS PASSED\n');
}

main().catch((error) => {
  console.error('Validator crashed:', error);
  process.exit(1);
});
