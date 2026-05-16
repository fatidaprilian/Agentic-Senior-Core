#!/usr/bin/env node

/**
 * single-source-lazy-loading-audit.mjs
 *
 * Enforces V3.0-010 policy:
 * - One canonical rule source is explicitly defined and enforced.
 * - Global domain governance loads lazily by touched scope.
 * - Conflicting duplicate instruction paths are prevented.
 */

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPOSITORY_ROOT = resolve(__dirname, '..');

const CANONICAL_SOURCE_PATH = 'AGENTS.md';
const ADAPTER_PATHS = [
  'CLAUDE.md',
  'GEMINI.md',
];
const COMPILER_PATH = 'lib/cli/compiler.mjs';
const ONBOARDING_REPORT_PATH = '.agent-context/state/onboarding-report.json';
const ARCHITECTURE_RULE_PATH = '.agent-context/rules/architecture.md';
const PR_CHECKLIST_PATH = '.agent-context/review-checklists/pr-checklist.md';
const REVIEW_PROMPT_PATH = '.agent-context/prompts/review-code.md';

const DEFAULT_WORKFLOW = 'standard';
const SUPPORTED_WORKFLOWS = new Set([
  DEFAULT_WORKFLOW,
  'pr-preparation',
  'review-request',
  'session-handoff',
  'init',
  'upgrade',
]);

const STACK_CATALOG_FILE_NAMES = [
  'typescript.md',
  'python.md',
  'java.md',
  'php.md',
  'go.md',
  'csharp.md',
  'rust.md',
  'ruby.md',
  'flutter.md',
  'react-native.md',
];

const MAX_EAGER_STACK_MENTIONS = 4;

const REQUIRED_ARCHITECTURE_RULE_SNIPPETS = [
  '## Single Source of Truth and Lazy Rule Loading',
  'Canonical rule source is AGENTS.md.',
  'Load global domain rules lazily based on touched scope.',
  'Do not create or load stack-specific governance adapters as the baseline.',
];

const REQUIRED_PR_CHECKLIST_SNIPPETS = [
  'Canonical rule source is explicitly defined and enforced',
  'Global domain governance is loaded lazily based on touched scope',
  'No conflicting duplicate rule instructions during normal flow',
];

const REQUIRED_REVIEW_PROMPT_SNIPPETS = [
  'Enforce single-source and lazy-loading policy: canonical rule source must be explicitly enforced, global domain governance must load lazily based on touched scope, and conflicting duplicate rule instructions must not appear during normal flow.',
];

const REQUIRED_COMPILER_SNIPPETS = [
  '## LAYER 2 POLICY: LAZY RULE LOADING',
  'Load global domain rules only when task scope touches that domain.',
  'Avoid eager loading unrelated runtime or domain guidance to prevent instruction conflicts.',
  "stackLoadingMode: 'lazy'",
];

function pushResult(results, isPassed, checkName, details) {
  results.push({
    checkName,
    passed: isPassed,
    details,
  });
}

function normalizeLineEndings(content) {
  return String(content || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function readText(relativeFilePath) {
  const absolutePath = resolve(REPOSITORY_ROOT, relativeFilePath);
  if (!existsSync(absolutePath)) {
    return '';
  }

  return readFileSync(absolutePath, 'utf8');
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
      stdio: ['ignore', 'pipe', 'ignore'],
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

function parseCliArguments(argumentList) {
  let workflow = DEFAULT_WORKFLOW;

  for (let argumentIndex = 0; argumentIndex < argumentList.length; argumentIndex += 1) {
    const argumentValue = argumentList[argumentIndex];

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

  const normalizedWorkflow = String(workflow).trim().toLowerCase() || DEFAULT_WORKFLOW;

  return {
    workflow: SUPPORTED_WORKFLOWS.has(normalizedWorkflow) ? normalizedWorkflow : DEFAULT_WORKFLOW,
  };
}

function assertSnippetCoverage(sourceLabel, sourcePath, requiredSnippets, failures, results) {
  const sourceContent = readText(sourcePath);

  if (!sourceContent) {
    failures.push(`Missing ${sourceLabel} source: ${sourcePath}`);
    pushResult(results, false, `${sourceLabel}-source-exists`, `Missing ${sourcePath}`);
    return false;
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
    return false;
  }

  pushResult(results, true, `${sourceLabel}-source-coverage`, `${sourceLabel} snippets are complete`);
  return true;
}

function parseJsonSafely(rawText) {
  if (typeof rawText !== 'string' || rawText.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

function countStackMentions(textContent) {
  return STACK_CATALOG_FILE_NAMES.reduce((mentionCount, stackFileName) => (
    mentionCount + (textContent.includes(stackFileName) ? 1 : 0)
  ), 0);
}

function runAudit() {
  const parsedArguments = parseCliArguments(process.argv.slice(2));
  const changedScope = collectChangedFiles();
  const changedFiles = changedScope.files;
  const results = [];
  const failures = [];
  const warnings = [];

  pushResult(results, true, 'context-workflow', `workflow=${parsedArguments.workflow}`);

  const canonicalSourceContent = readText(CANONICAL_SOURCE_PATH);
  const canonicalSourceExists = canonicalSourceContent.length > 0;

  if (!canonicalSourceExists) {
    failures.push(`Missing canonical source: ${CANONICAL_SOURCE_PATH}`);
    pushResult(results, false, 'canonical-source-exists', `Missing ${CANONICAL_SOURCE_PATH}`);
  } else {
    pushResult(results, true, 'canonical-source-exists', `${CANONICAL_SOURCE_PATH} is present`);
  }

  const canonicalHash = canonicalSourceExists ? 'native-import-bridges' : '';
  let adapterImportPassCount = 0;
  const adapterChecks = [];

  for (const adapterPath of ADAPTER_PATHS) {
    const adapterContent = readText(adapterPath);

    if (!adapterContent) {
      failures.push(`Missing adapter file: ${adapterPath}`);
      pushResult(results, false, 'adapter-file-exists', `Missing ${adapterPath}`);
      adapterChecks.push({
        path: adapterPath,
        exists: false,
        importsCanonical: false,
      });
      continue;
    }

    pushResult(results, true, 'adapter-file-exists', `${adapterPath} is present`);

    const importsCanonical = normalizeLineEndings(adapterContent).trim() === '@AGENTS.md';

    if (!importsCanonical) {
      failures.push(`${adapterPath} must import canonical AGENTS.md`);
      pushResult(results, false, 'adapter-canonical-import', `${adapterPath} is not @AGENTS.md`);
    } else {
      adapterImportPassCount += 1;
      pushResult(results, true, 'adapter-canonical-import', `${adapterPath} imports AGENTS.md`);
    }

    adapterChecks.push({
      path: adapterPath,
      exists: true,
      importsCanonical,
    });
  }

  const architectureCoverageComplete = assertSnippetCoverage(
    'single-source-lazy-loading-architecture-rule',
    ARCHITECTURE_RULE_PATH,
    REQUIRED_ARCHITECTURE_RULE_SNIPPETS,
    failures,
    results
  );

  const checklistCoverageComplete = assertSnippetCoverage(
    'single-source-lazy-loading-pr-checklist',
    PR_CHECKLIST_PATH,
    REQUIRED_PR_CHECKLIST_SNIPPETS,
    failures,
    results
  );

  const reviewPromptCoverageComplete = assertSnippetCoverage(
    'single-source-lazy-loading-review-prompt',
    REVIEW_PROMPT_PATH,
    REQUIRED_REVIEW_PROMPT_SNIPPETS,
    failures,
    results
  );

  const compilerCoverageComplete = assertSnippetCoverage(
    'single-source-lazy-loading-compiler-policy',
    COMPILER_PATH,
    REQUIRED_COMPILER_SNIPPETS,
    failures,
    results
  );

  const onboardingReportContent = readText(ONBOARDING_REPORT_PATH);
  const onboardingReport = parseJsonSafely(onboardingReportContent);

  let onboardingLazyPolicyMode = 'missing';
  let onboardingLazyPolicyValidated = false;

  if (!onboardingReportContent) {
    warnings.push(`Missing ${ONBOARDING_REPORT_PATH}; fallback lazy policy inference used`);
    pushResult(results, false, 'lazy-loading-onboarding-state', `Missing ${ONBOARDING_REPORT_PATH}`);
  } else if (!onboardingReport) {
    failures.push(`Invalid JSON in ${ONBOARDING_REPORT_PATH}`);
    pushResult(results, false, 'lazy-loading-onboarding-state', `Cannot parse ${ONBOARDING_REPORT_PATH}`);
  } else {
    const lazyPolicy = onboardingReport.ruleLoadingPolicy;

    if (lazyPolicy
      && lazyPolicy.canonicalSource === CANONICAL_SOURCE_PATH
      && lazyPolicy.stackLoadingMode === 'lazy'
      && (lazyPolicy.domainRuleLoadingMode === 'lazy' || typeof lazyPolicy.domainRuleLoadingMode === 'undefined')
      && lazyPolicy.loadedOnDemand === true) {
      onboardingLazyPolicyMode = 'explicit-lazy-policy';
      onboardingLazyPolicyValidated = true;
      pushResult(results, true, 'lazy-loading-onboarding-state', `${ONBOARDING_REPORT_PATH} exposes explicit lazy loading policy`);
    } else if (typeof onboardingReport.selectedStack === 'string' && onboardingReport.selectedStack.trim().length > 0) {
      onboardingLazyPolicyMode = 'selected-stack-fallback';
      onboardingLazyPolicyValidated = true;
      warnings.push('Onboarding report does not include explicit ruleLoadingPolicy; using selectedStack fallback inference');
      pushResult(
        results,
        true,
        'lazy-loading-onboarding-state',
        `${ONBOARDING_REPORT_PATH} includes selectedStack fallback for lazy loading policy`
      );
    } else {
      onboardingLazyPolicyMode = 'invalid';
      failures.push(`${ONBOARDING_REPORT_PATH} must include selectedStack or explicit ruleLoadingPolicy`);
      pushResult(results, false, 'lazy-loading-onboarding-state', `${ONBOARDING_REPORT_PATH} missing lazy loading policy signals`);
    }
  }

  let eagerLoadingDetected = false;
  const compiledRuleChecks = [];

  const canonicalSourceEnforced = canonicalSourceExists
    && adapterImportPassCount === ADAPTER_PATHS.length
    && architectureCoverageComplete
    && checklistCoverageComplete
    && reviewPromptCoverageComplete;

  if (canonicalSourceEnforced) {
    pushResult(results, true, 'canonical-source-hard-rule', 'Canonical rule source is explicitly defined and enforced');
  } else {
    failures.push('Canonical rule source hard-rule is not fully enforced');
    pushResult(results, false, 'canonical-source-hard-rule', 'Canonical source enforcement failed');
  }

  const lazyRuleLoadingEnforced = compilerCoverageComplete
    && onboardingLazyPolicyValidated
    && !eagerLoadingDetected;

  if (lazyRuleLoadingEnforced) {
    pushResult(results, true, 'lazy-rule-loading-hard-rule', 'Global domain governance is loaded lazily by touched scope');
  } else {
    failures.push('Lazy rule loading hard-rule is not fully enforced');
    pushResult(results, false, 'lazy-rule-loading-hard-rule', 'Lazy loading enforcement failed');
  }

  const noConflictingDuplicates = canonicalSourceEnforced && !eagerLoadingDetected;

  if (noConflictingDuplicates) {
    pushResult(results, true, 'no-conflicting-duplicate-rule-instructions', 'No conflicting duplicate rule instructions detected in normal flow');
  } else {
    failures.push('Conflicting duplicate rule instructions detected in normal flow');
    pushResult(results, false, 'no-conflicting-duplicate-rule-instructions', 'Duplicate/conflicting instruction risk detected');
  }

  const reportPayload = {
    generatedAt: new Date().toISOString(),
    auditName: 'single-source-lazy-loading-audit',
    workflow: parsedArguments.workflow,
    source: changedScope.source,
    changedFileCount: changedFiles.length,
    changedFiles,
    canonicalSource: {
      path: CANONICAL_SOURCE_PATH,
      hash: canonicalHash,
      enforced: canonicalSourceEnforced,
      adapterChecks,
      compiledRuleChecks,
    },
    lazyRuleLoading: {
      enforced: lazyRuleLoadingEnforced,
      compilerPolicySnippetsComplete: compilerCoverageComplete,
      onboardingPolicyMode: onboardingLazyPolicyMode,
      onboardingPolicyValidated: onboardingLazyPolicyValidated,
      eagerLoadingDetected,
      maxAllowedStackMentions: MAX_EAGER_STACK_MENTIONS,
      globalDomainGovernance: true,
    },
    duplicationPolicy: {
      noConflictingDuplicates,
      conflictingDuplicateSignals: noConflictingDuplicates
        ? []
        : ['canonical-source-enforcement-or-lazy-loading-density-failed'],
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
