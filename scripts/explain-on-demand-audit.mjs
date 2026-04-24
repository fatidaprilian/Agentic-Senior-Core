#!/usr/bin/env node

/**
 * explain-on-demand-audit.mjs
 *
 * Enforces invisible state management defaults and explicit diagnostic
 * visibility rules for state internals.
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

const DEFAULT_MODE = 'default';
const SUPPORTED_MODES = new Set([DEFAULT_MODE, 'diagnostic']);
const DEFAULT_WORKFLOW = 'standard';

const REQUIRED_ARCHITECTURE_RULE_SNIPPETS = [
  '## Invisible State Management with Explain-on-Demand',
  'Default responses must avoid unnecessary state-file internals.',
  'State internals are exposed only on explicit user request.',
  'Diagnostic mode explains relevant state decisions when needed.',
];

const REQUIRED_PR_CHECKLIST_SNIPPETS = [
  'Default responses avoid unnecessary state-file internals',
  'State internals are exposed only on explicit request',
  'Diagnostic mode can explain relevant state decisions when needed',
];

const REQUIRED_REVIEW_PROMPT_SNIPPETS = [
  'Review the code with a production-risk mindset.',
];

const INTERNAL_STATE_SIGNAL_PATTERNS = [
  /\.agent-context\/state\//i,
  /\bautoDetection\b/i,
  /\brankedCandidates\b/i,
  /\bconfidenceGap\b/i,
  /\bschemaVersion\b/i,
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

function parseCliArguments(argumentList) {
  let mode = DEFAULT_MODE;
  let workflow = DEFAULT_WORKFLOW;
  let explicitStateRequest = false;

  for (let argumentIndex = 0; argumentIndex < argumentList.length; argumentIndex += 1) {
    const argumentValue = argumentList[argumentIndex];

    if (argumentValue === '--state-debug') {
      explicitStateRequest = true;
      continue;
    }

    if (argumentValue === '--mode') {
      const nextArgumentValue = argumentList[argumentIndex + 1];
      if (nextArgumentValue && !nextArgumentValue.startsWith('--')) {
        mode = nextArgumentValue;
        argumentIndex += 1;
      }
      continue;
    }

    if (argumentValue.startsWith('--mode=')) {
      mode = argumentValue.slice('--mode='.length);
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
    }
  }

  const normalizedMode = String(mode || '').trim().toLowerCase();

  return {
    mode: SUPPORTED_MODES.has(normalizedMode) ? normalizedMode : DEFAULT_MODE,
    workflow: String(workflow || '').trim().toLowerCase() || DEFAULT_WORKFLOW,
    explicitStateRequest,
  };
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

function buildDefaultResponseSummary(onboardingReport) {
  const runtimeDecision = String(onboardingReport?.runtimeDecision?.mode || onboardingReport?.selectedStack || 'unknown-runtime-decision').trim() || 'unknown-runtime-decision';
  const architectureDecision = String(onboardingReport?.architectureDecision?.mode || onboardingReport?.selectedBlueprint || 'unknown-architecture-decision').trim() || 'unknown-architecture-decision';
  const selectedProfile = String(onboardingReport?.selectedProfile || 'unknown-profile').trim() || 'unknown-profile';

  return `Active setup summary: runtimeDecision=${runtimeDecision}, architectureDecision=${architectureDecision}, profile=${selectedProfile}.`;
}

function detectInternalSignals(textValue) {
  const normalizedText = String(textValue || '');
  return INTERNAL_STATE_SIGNAL_PATTERNS.some((signalPattern) => signalPattern.test(normalizedText));
}

function buildDiagnosticDecisionSummaries(onboardingReport) {
  const explanations = [];

  const runtimeDecision = String(onboardingReport?.runtimeDecision?.mode || onboardingReport?.selectedStack || '').trim();
  if (runtimeDecision) {
    explanations.push(`Runtime decision: ${runtimeDecision}.`);
  }

  const architectureDecision = String(onboardingReport?.architectureDecision?.mode || onboardingReport?.selectedBlueprint || '').trim();
  if (architectureDecision) {
    explanations.push(`Architecture decision: ${architectureDecision}.`);
  }

  const selectedProfile = String(onboardingReport?.selectedProfile || '').trim();
  if (selectedProfile) {
    explanations.push(`Profile decision: selectedProfile=${selectedProfile}.`);
  }

  const detectionReasoning = String(onboardingReport?.autoDetection?.detectionReasoning || '').trim();
  if (detectionReasoning) {
    explanations.push(`Detection reasoning: ${detectionReasoning}`);
  }

  if (typeof onboardingReport?.ciGuardrailsEnabled === 'boolean') {
    explanations.push(`CI guardrails decision: ciGuardrailsEnabled=${String(onboardingReport.ciGuardrailsEnabled)}.`);
  }

  return explanations;
}

function runAudit() {
  const parsedArguments = parseCliArguments(process.argv.slice(2));
  const changedScope = collectChangedFiles();
  const changedFiles = changedScope.files;
  const results = [];
  const failures = [];
  const warnings = [];

  pushResult(results, true, 'context-workflow', `workflow=${parsedArguments.workflow}`);
  pushResult(results, true, 'explain-mode', `mode=${parsedArguments.mode}`);
  pushResult(
    results,
    true,
    'state-debug-explicit-request',
    parsedArguments.explicitStateRequest
      ? 'Explicit state diagnostic request received'
      : 'No explicit state diagnostic request provided'
  );

  assertSnippetCoverage(
    'explain-on-demand-architecture-rule',
    ARCHITECTURE_RULE_PATH,
    REQUIRED_ARCHITECTURE_RULE_SNIPPETS,
    failures,
    results
  );

  assertSnippetCoverage(
    'explain-on-demand-pr-checklist',
    PR_CHECKLIST_PATH,
    REQUIRED_PR_CHECKLIST_SNIPPETS,
    failures,
    results
  );

  assertSnippetCoverage(
    'explain-on-demand-review-prompt',
    REVIEW_PROMPT_PATH,
    REQUIRED_REVIEW_PROMPT_SNIPPETS,
    failures,
    results
  );

  const onboardingReportContent = readText(ONBOARDING_REPORT_PATH);
  const onboardingReport = parseOnboardingReport(onboardingReportContent);

  if (!onboardingReportContent) {
    failures.push(`Missing state source: ${ONBOARDING_REPORT_PATH}`);
    pushResult(results, false, 'state-source', `Missing ${ONBOARDING_REPORT_PATH}`);
  } else if (!onboardingReport) {
    failures.push(`Invalid state source JSON: ${ONBOARDING_REPORT_PATH}`);
    pushResult(results, false, 'state-source', `Cannot parse ${ONBOARDING_REPORT_PATH}`);
  } else {
    pushResult(results, true, 'state-source', `${ONBOARDING_REPORT_PATH} is present and valid`);
  }

  const defaultResponseSummary = buildDefaultResponseSummary(onboardingReport);
  const defaultModeExposesStateInternals = detectInternalSignals(defaultResponseSummary);

  if (defaultModeExposesStateInternals) {
    failures.push('Default response exposes state internals');
    pushResult(
      results,
      false,
      'default-response-invisible-state',
      'Default response leaks internal state details'
    );
  } else {
    pushResult(
      results,
      true,
      'default-response-invisible-state',
      'Default response avoids unnecessary state-file internals'
    );
  }

  const diagnosticDecisionSummaries = buildDiagnosticDecisionSummaries(onboardingReport);
  const canExplainStateDecisions = diagnosticDecisionSummaries.length > 0;

  if (parsedArguments.mode === 'diagnostic' && !parsedArguments.explicitStateRequest) {
    failures.push('Diagnostic mode requested without explicit state request');
    pushResult(
      results,
      false,
      'diagnostic-explicit-request-gate',
      'Diagnostic mode requires explicit request. Re-run with --state-debug when user asks for state-level details.'
    );
  } else {
    pushResult(
      results,
      true,
      'diagnostic-explicit-request-gate',
      parsedArguments.mode === 'diagnostic'
        ? 'Diagnostic mode is explicitly requested and permitted'
        : 'Diagnostic mode not requested; default hidden-state behavior applies'
    );
  }

  if (!canExplainStateDecisions) {
    failures.push('Diagnostic mode cannot explain relevant state decisions');
    pushResult(
      results,
      false,
      'diagnostic-explain-state-decisions',
      'No state decision explanations available'
    );
  } else {
    pushResult(
      results,
      true,
      'diagnostic-explain-state-decisions',
      `Diagnostic mode can explain ${diagnosticDecisionSummaries.length} state decision points`
    );
  }

  if (parsedArguments.mode === 'default' && parsedArguments.explicitStateRequest) {
    warnings.push('Explicit state request was provided in default mode; internal state details remain hidden unless diagnostic mode is selected.');
  }

  const reportPayload = {
    generatedAt: new Date().toISOString(),
    auditName: 'explain-on-demand-audit',
    workflow: parsedArguments.workflow,
    mode: parsedArguments.mode,
    source: changedScope.source,
    changedFileCount: changedFiles.length,
    changedFiles,
    responsePolicy: {
      defaultModeExposesStateInternals,
      diagnosticRequiresExplicitRequest: true,
      explicitStateRequestReceived: parsedArguments.explicitStateRequest,
    },
    defaultResponse: {
      summary: defaultResponseSummary,
      containsStateInternals: defaultModeExposesStateInternals,
    },
    diagnosticMode: {
      requested: parsedArguments.mode === 'diagnostic',
      allowed: parsedArguments.mode !== 'diagnostic' || parsedArguments.explicitStateRequest,
      canExplainStateDecisions,
      stateDecisionExplanations: parsedArguments.mode === 'diagnostic' && parsedArguments.explicitStateRequest
        ? diagnosticDecisionSummaries
        : [],
      availableDecisionCount: diagnosticDecisionSummaries.length,
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
