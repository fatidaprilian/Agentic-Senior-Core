#!/usr/bin/env node

/**
 * rules-guardian-audit.mjs
 *
 * Cross-session consistency audit for architecture direction.
 * Ensures session handoff contains an active architecture contract summary,
 * detects direction drift, and requires explicit user confirmation before
 * direction changes are applied.
 */

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPOSITORY_ROOT = resolve(__dirname, '..');

const ONBOARDING_REPORT_PATH = '.agent-context/state/onboarding-report.json';
const ARCHITECTURE_RULE_PATH = '.agent-context/rules/architecture.md';
const PR_CHECKLIST_PATH = '.agent-context/review-checklists/pr-checklist.md';
const REVIEW_PROMPT_PATH = '.agent-context/prompts/review-code.md';

const DEFAULT_WORKFLOW = 'standard';
const SUPPORTED_WORKFLOWS = new Set([
  'auto',
  'standard',
  'review-request',
  'pr-preparation',
  'session-handoff',
  'direction-change',
]);

const CORE_PATTERN_SIGNALS = [
  {
    pattern: 'layer-separation',
    snippet: 'Every layer has ONE job.',
  },
  {
    pattern: 'modular-monolith-default',
    snippet: 'Default Architecture: Modular Monolith',
  },
  {
    pattern: 'feature-based-grouping',
    snippet: 'Project Structure: Feature-Based Grouping',
  },
  {
    pattern: 'rules-as-guardian-cross-session',
    snippet: 'Rules as Guardian (Cross-Session Consistency)',
  },
];

const REQUIRED_ARCHITECTURE_RULE_SNIPPETS = [
  '## Rules as Guardian (Cross-Session Consistency)',
  'Session handoff must include active architecture contract summary.',
  'Detect drift before changing declared stack or core patterns.',
  'Direction changes require explicit user confirmation before applying changes.',
];

const REQUIRED_PR_CHECKLIST_SNIPPETS = [
  'Session handoff includes active architecture contract summary',
  'Drift detection warns before direction changes',
  'Direction changes require explicit user confirmation',
];

const REQUIRED_REVIEW_PROMPT_SNIPPETS = [
  'Enforce cross-session consistency guardian: session handoff must include active architecture contract summary, drift detection must warn before direction changes, and direction changes require explicit user confirmation.',
];

function pushResult(results, isPassed, checkName, details) {
  results.push({
    checkName,
    passed: isPassed,
    details,
  });
}

function normalizeFilePath(filePath) {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
}

function parseGitFileList(rawOutput) {
  if (typeof rawOutput !== 'string' || rawOutput.trim().length === 0) {
    return [];
  }

  return rawOutput
    .split(/\r?\n/)
    .map((filePath) => filePath.trim())
    .filter((filePath) => filePath.length > 0)
    .map(normalizeFilePath);
}

function runGitFileQuery(commandArguments) {
  try {
    const rawOutput = execFileSync('git', commandArguments, {
      cwd: REPOSITORY_ROOT,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    });

    return parseGitFileList(rawOutput);
  } catch {
    return [];
  }
}

function runGitRawQuery(commandArguments) {
  try {
    return execFileSync('git', commandArguments, {
      cwd: REPOSITORY_ROOT,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    });
  } catch {
    return '';
  }
}

function uniqueSorted(filePaths) {
  return Array.from(new Set(filePaths)).sort((leftPath, rightPath) => leftPath.localeCompare(rightPath));
}

function collectChangedFiles() {
  const workingTreeFiles = runGitFileQuery(['diff', '--name-only']);
  const stagedFiles = runGitFileQuery(['diff', '--name-only', '--cached']);
  const workingScopeFiles = uniqueSorted([...workingTreeFiles, ...stagedFiles]);

  if (workingScopeFiles.length > 0) {
    return {
      source: 'working-tree-and-index',
      files: workingScopeFiles,
    };
  }

  const latestCommitRangeFiles = runGitFileQuery(['diff', '--name-only', 'HEAD~1..HEAD']);
  if (latestCommitRangeFiles.length > 0) {
    return {
      source: 'latest-commit-range',
      files: uniqueSorted(latestCommitRangeFiles),
    };
  }

  const headCommitFiles = runGitFileQuery(['show', '--pretty=format:', '--name-only', 'HEAD']);
  if (headCommitFiles.length > 0) {
    return {
      source: 'head-commit',
      files: uniqueSorted(headCommitFiles),
    };
  }

  return {
    source: 'none',
    files: [],
  };
}

function readText(relativeFilePath) {
  const absolutePath = resolve(REPOSITORY_ROOT, relativeFilePath);
  if (!existsSync(absolutePath)) {
    return '';
  }

  return readFileSync(absolutePath, 'utf8');
}

function readPreviousRevisionText(relativeFilePath) {
  const rawOutput = runGitRawQuery(['show', `HEAD~1:${relativeFilePath}`]);
  return typeof rawOutput === 'string' && rawOutput.length > 0
    ? rawOutput
    : '';
}

function parseOnboardingReport(onboardingReportContent) {
  if (typeof onboardingReportContent !== 'string' || onboardingReportContent.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(onboardingReportContent);
  } catch {
    return null;
  }
}

function normalizeCorePatterns(corePatterns) {
  if (!Array.isArray(corePatterns)) {
    return [];
  }

  return Array.from(new Set(corePatterns
    .map((patternValue) => String(patternValue || '').trim().toLowerCase())
    .filter((patternValue) => patternValue.length > 0))).sort((leftValue, rightValue) => (
    leftValue.localeCompare(rightValue)
  ));
}

function detectCorePatterns(architectureRuleContent) {
  return CORE_PATTERN_SIGNALS
    .filter((signalEntry) => architectureRuleContent.includes(signalEntry.snippet))
    .map((signalEntry) => signalEntry.pattern);
}

function parseCliArguments(argumentList) {
  let workflow = DEFAULT_WORKFLOW;
  let confirmDirectionChange = false;
  let proposedStack = '';
  let proposedBlueprint = '';
  let proposedCorePatterns = [];

  for (let argumentIndex = 0; argumentIndex < argumentList.length; argumentIndex += 1) {
    const argumentValue = argumentList[argumentIndex];

    if (argumentValue === '--confirm-direction-change') {
      confirmDirectionChange = true;
      continue;
    }

    if (argumentValue === '--workflow') {
      const nextArgumentValue = argumentList[argumentIndex + 1];
      if (nextArgumentValue && !nextArgumentValue.startsWith('--')) {
        workflow = nextArgumentValue;
        argumentIndex += 1;
      }
      continue;
    }

    if (argumentValue.startsWith('--workflow=')) {
      workflow = argumentValue.slice('--workflow='.length);
      continue;
    }

    if (argumentValue === '--proposed-stack') {
      const nextArgumentValue = argumentList[argumentIndex + 1];
      if (nextArgumentValue && !nextArgumentValue.startsWith('--')) {
        proposedStack = nextArgumentValue;
        argumentIndex += 1;
      }
      continue;
    }

    if (argumentValue.startsWith('--proposed-stack=')) {
      proposedStack = argumentValue.slice('--proposed-stack='.length);
      continue;
    }

    if (argumentValue === '--proposed-blueprint') {
      const nextArgumentValue = argumentList[argumentIndex + 1];
      if (nextArgumentValue && !nextArgumentValue.startsWith('--')) {
        proposedBlueprint = nextArgumentValue;
        argumentIndex += 1;
      }
      continue;
    }

    if (argumentValue.startsWith('--proposed-blueprint=')) {
      proposedBlueprint = argumentValue.slice('--proposed-blueprint='.length);
      continue;
    }

    if (argumentValue === '--proposed-core-patterns') {
      const nextArgumentValue = argumentList[argumentIndex + 1];
      if (nextArgumentValue && !nextArgumentValue.startsWith('--')) {
        proposedCorePatterns = nextArgumentValue.split(',');
        argumentIndex += 1;
      }
      continue;
    }

    if (argumentValue.startsWith('--proposed-core-patterns=')) {
      proposedCorePatterns = argumentValue.slice('--proposed-core-patterns='.length).split(',');
    }
  }

  const normalizedWorkflow = String(workflow).trim().toLowerCase() || DEFAULT_WORKFLOW;

  return {
    workflow: SUPPORTED_WORKFLOWS.has(normalizedWorkflow) ? normalizedWorkflow : DEFAULT_WORKFLOW,
    confirmDirectionChange,
    proposedStack: String(proposedStack || '').trim(),
    proposedBlueprint: String(proposedBlueprint || '').trim(),
    proposedCorePatterns: normalizeCorePatterns(proposedCorePatterns),
  };
}

function parseBooleanFromEnvironment(rawEnvironmentValue) {
  const normalizedEnvironmentValue = String(rawEnvironmentValue || '').trim().toLowerCase();
  return normalizedEnvironmentValue === '1'
    || normalizedEnvironmentValue === 'true'
    || normalizedEnvironmentValue === 'yes'
    || normalizedEnvironmentValue === 'y';
}

function buildArchitectureContract(onboardingReport, corePatterns) {
  return {
    stack: String(onboardingReport?.selectedStack || 'unknown').trim() || 'unknown',
    blueprint: String(onboardingReport?.selectedBlueprint || 'unknown').trim() || 'unknown',
    profile: String(onboardingReport?.selectedProfile || 'unknown').trim() || 'unknown',
    corePatterns: normalizeCorePatterns(corePatterns),
  };
}

function toComparableContractValue(value) {
  if (Array.isArray(value)) {
    return normalizeCorePatterns(value).join(',');
  }

  return String(value || '').trim();
}

function detectContractDrift(baseContract, targetContract, driftSource) {
  const driftItems = [];
  const fieldNames = ['stack', 'blueprint', 'profile', 'corePatterns'];

  for (const fieldName of fieldNames) {
    const baseValue = toComparableContractValue(baseContract?.[fieldName]);
    const targetValue = toComparableContractValue(targetContract?.[fieldName]);

    if (baseValue !== targetValue) {
      driftItems.push({
        field: fieldName,
        from: baseValue,
        to: targetValue,
        source: driftSource,
      });
    }
  }

  return driftItems;
}

function buildSessionHandoffSummary(architectureContract) {
  const corePatternsSummary = architectureContract.corePatterns.length > 0
    ? architectureContract.corePatterns.join(', ')
    : 'none';

  return `Architecture contract summary: stack=${architectureContract.stack}, blueprint=${architectureContract.blueprint}, profile=${architectureContract.profile}, corePatterns=${corePatternsSummary}.`;
}

function assertSnippetCoverage(sourceLabel, sourcePath, requiredSnippets, failures, results) {
  const sourceContent = readText(sourcePath);

  if (!sourceContent) {
    failures.push(`Missing ${sourceLabel} source: ${sourcePath}`);
    pushResult(results, false, `${sourceLabel}-source-exists`, `Missing ${sourcePath}`);
    return;
  }

  pushResult(results, true, `${sourceLabel}-source-exists`, `${sourcePath} is present`);

  const missingSnippets = requiredSnippets.filter((requiredSnippet) => !sourceContent.includes(requiredSnippet));

  if (missingSnippets.length > 0) {
    failures.push(`Missing ${sourceLabel} snippets: ${missingSnippets.join(', ')}`);
    pushResult(
      results,
      false,
      `${sourceLabel}-source-coverage`,
      `Missing snippets in ${sourcePath}: ${missingSnippets.join(', ')}`
    );
    return;
  }

  pushResult(results, true, `${sourceLabel}-source-coverage`, `${sourceLabel} snippets are complete`);
}

function runAudit() {
  const parsedArguments = parseCliArguments(process.argv.slice(2));
  const changedScope = collectChangedFiles();
  const changedFiles = changedScope.files;
  const results = [];
  const failures = [];
  const warnings = [];

  const envConfirmationFlag = parseBooleanFromEnvironment(process.env.RULES_GUARDIAN_CONFIRM_DIRECTION_CHANGE);
  const confirmationProvided = parsedArguments.confirmDirectionChange || envConfirmationFlag;
  const confirmationSource = parsedArguments.confirmDirectionChange
    ? 'cli-flag'
    : (envConfirmationFlag ? 'environment-variable' : 'none');

  pushResult(results, true, 'context-workflow', `workflow=${parsedArguments.workflow}`);
  pushResult(
    results,
    true,
    'direction-change-confirmation-flag',
    confirmationProvided
      ? `Explicit direction-change confirmation provided via ${confirmationSource}`
      : 'Explicit direction-change confirmation not provided'
  );

  assertSnippetCoverage(
    'rules-guardian-architecture-rule',
    ARCHITECTURE_RULE_PATH,
    REQUIRED_ARCHITECTURE_RULE_SNIPPETS,
    failures,
    results
  );

  assertSnippetCoverage(
    'rules-guardian-pr-checklist',
    PR_CHECKLIST_PATH,
    REQUIRED_PR_CHECKLIST_SNIPPETS,
    failures,
    results
  );

  assertSnippetCoverage(
    'rules-guardian-review-prompt',
    REVIEW_PROMPT_PATH,
    REQUIRED_REVIEW_PROMPT_SNIPPETS,
    failures,
    results
  );

  const onboardingReportContent = readText(ONBOARDING_REPORT_PATH);
  const onboardingReport = parseOnboardingReport(onboardingReportContent);

  if (!onboardingReportContent) {
    failures.push(`Missing architecture contract source: ${ONBOARDING_REPORT_PATH}`);
    pushResult(results, false, 'architecture-contract-source', `Missing ${ONBOARDING_REPORT_PATH}`);
  } else if (!onboardingReport) {
    failures.push(`Cannot parse architecture contract source: ${ONBOARDING_REPORT_PATH}`);
    pushResult(results, false, 'architecture-contract-source', `Invalid JSON in ${ONBOARDING_REPORT_PATH}`);
  } else {
    pushResult(results, true, 'architecture-contract-source', `${ONBOARDING_REPORT_PATH} is present and valid`);
  }

  const architectureRuleContent = readText(ARCHITECTURE_RULE_PATH);
  const activeCorePatterns = detectCorePatterns(architectureRuleContent);

  if (activeCorePatterns.length === 0) {
    failures.push('Cannot resolve active core patterns from architecture rule snippets');
    pushResult(
      results,
      false,
      'architecture-core-patterns',
      `No core pattern signals detected in ${ARCHITECTURE_RULE_PATH}`
    );
  } else {
    pushResult(
      results,
      true,
      'architecture-core-patterns',
      `Resolved ${activeCorePatterns.length} core pattern signals: ${activeCorePatterns.join(', ')}`
    );
  }

  const activeContract = buildArchitectureContract(onboardingReport, activeCorePatterns);
  const sessionHandoffSummary = buildSessionHandoffSummary(activeContract);
  const sessionHandoffIncluded = sessionHandoffSummary.trim().length > 0;

  if (sessionHandoffIncluded) {
    pushResult(results, true, 'session-handoff-contract-summary', sessionHandoffSummary);
  } else {
    failures.push('Session handoff summary is missing');
    pushResult(results, false, 'session-handoff-contract-summary', 'Session handoff summary is empty');
  }

  const previousOnboardingReport = parseOnboardingReport(readPreviousRevisionText(ONBOARDING_REPORT_PATH));
  const previousArchitectureRuleContent = readPreviousRevisionText(ARCHITECTURE_RULE_PATH) || architectureRuleContent;
  const previousCorePatterns = detectCorePatterns(previousArchitectureRuleContent);

  const previousContract = buildArchitectureContract(
    previousOnboardingReport || onboardingReport,
    previousCorePatterns.length > 0 ? previousCorePatterns : activeCorePatterns
  );

  const proposedContract = {
    stack: parsedArguments.proposedStack || activeContract.stack,
    blueprint: parsedArguments.proposedBlueprint || activeContract.blueprint,
    profile: activeContract.profile,
    corePatterns: parsedArguments.proposedCorePatterns.length > 0
      ? parsedArguments.proposedCorePatterns
      : activeContract.corePatterns,
  };

  const persistedContractDrift = detectContractDrift(
    previousContract,
    activeContract,
    'persisted-change-since-previous-session'
  );
  const proposedContractDrift = detectContractDrift(
    activeContract,
    proposedContract,
    'proposed-direction-change'
  );

  const driftItems = [...persistedContractDrift, ...proposedContractDrift];
  const persistedDriftDetected = persistedContractDrift.length > 0;
  const proposedDirectionChangeDetected = proposedContractDrift.length > 0;
  const driftDetected = driftItems.length > 0;

  if (driftDetected) {
    const driftSummary = driftItems
      .map((driftItem) => `${driftItem.field}: ${driftItem.from} -> ${driftItem.to} (${driftItem.source})`)
      .join('; ');
    warnings.push(`Direction drift detected: ${driftSummary}`);
    pushResult(results, true, 'direction-drift-detection', `Drift detected: ${driftSummary}`);
  } else {
    pushResult(results, true, 'direction-drift-detection', 'No direction drift detected');
  }

  if (proposedDirectionChangeDetected && !confirmationProvided) {
    failures.push('Direction change detected without explicit user confirmation');
    pushResult(
      results,
      false,
      'direction-change-explicit-confirmation',
      'Direction change detected. Re-run with --confirm-direction-change (or set RULES_GUARDIAN_CONFIRM_DIRECTION_CHANGE=true) after explicit user approval.'
    );
  } else if (proposedDirectionChangeDetected && confirmationProvided) {
    pushResult(
      results,
      true,
      'direction-change-explicit-confirmation',
      `Direction change confirmed explicitly via ${confirmationSource}`
    );
  } else if (persistedDriftDetected) {
    pushResult(
      results,
      true,
      'direction-change-explicit-confirmation',
      'Persisted drift detected from previous session; explicit confirmation is required only for new proposed direction changes'
    );
  } else {
    pushResult(
      results,
      true,
      'direction-change-explicit-confirmation',
      'No direction change detected; explicit confirmation not required'
    );
  }

  const reportPayload = {
    generatedAt: new Date().toISOString(),
    auditName: 'rules-guardian-audit',
    workflow: parsedArguments.workflow,
    source: changedScope.source,
    changedFileCount: changedFiles.length,
    changedFiles,
    confirmationPolicy: {
      requiresExplicitUserConfirmation: true,
      requiredForProposedDirectionChange: true,
      confirmationProvided,
      confirmationSource,
    },
    sessionHandoff: {
      included: sessionHandoffIncluded,
      contractSummary: sessionHandoffSummary,
      activeArchitectureContract: activeContract,
      previousArchitectureContract: previousContract,
      proposedArchitectureContract: proposedContract,
    },
    driftDetection: {
      driftDetected,
      persistedDriftDetected,
      proposedDirectionChangeDetected,
      driftItemCount: driftItems.length,
      persistedDriftItemCount: persistedContractDrift.length,
      proposedDriftItemCount: proposedContractDrift.length,
      driftItems,
    },
    passed: failures.length === 0,
    failureCount: failures.length,
    failures,
    warnings,
    results,
  };

  console.log(JSON.stringify(reportPayload, null, 2));
  process.exit(reportPayload.passed ? 0 : 1);
}

runAudit();