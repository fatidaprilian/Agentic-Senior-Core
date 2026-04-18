#!/usr/bin/env node

/**
 * context-triggered-audit.mjs
 *
 * Determines whether strict security/performance audits should run based on
 * workflow context, changed scope size, and explicit user override.
 */

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPOSITORY_ROOT = resolve(__dirname, '..');

const PR_CHECKLIST_PATH = '.agent-context/review-checklists/pr-checklist.md';
const ARCHITECTURE_CHECKLIST_PATH = '.agent-context/review-checklists/architecture-review.md';
const DEFAULT_WORKFLOW = 'auto';
const SMALL_EDIT_MAX_FILES = 3;
const MAJOR_FEATURE_MIN_SIGNIFICANT_FILES = 4;

const STRICT_WORKFLOWS = new Set([
  'review-request',
  'pr-intent',
  'pr-preparation',
  'major-feature-completion',
]);

const SUPPORTED_WORKFLOWS = new Set([
  DEFAULT_WORKFLOW,
  ...STRICT_WORKFLOWS,
  'small-edit',
  'standard',
]);

const REQUIRED_PR_CHECKLIST_SNIPPETS = [
  '### 11. Context-Triggered Audit Mode',
  'Strict audit mode activates automatically on review and PR-intent workflows',
  'Small edits avoid heavy checks by default unless strict mode is explicitly requested',
  'User can always force strict audit mode manually',
];

const REQUIRED_ARCHITECTURE_CHECKLIST_SNIPPETS = [
  '## Backend Universal Principles',
  'No clever hacks in backend and shared core modules',
  'No premature abstraction',
  'Readability over brevity',
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

function parseCliArguments(argumentList) {
  let workflow = DEFAULT_WORKFLOW;
  let strict = false;

  for (let argumentIndex = 0; argumentIndex < argumentList.length; argumentIndex += 1) {
    const argumentValue = argumentList[argumentIndex];

    if (argumentValue === '--strict') {
      strict = true;
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

  const normalizedWorkflow = String(workflow).trim().toLowerCase() || DEFAULT_WORKFLOW;

  return {
    workflow: SUPPORTED_WORKFLOWS.has(normalizedWorkflow) ? normalizedWorkflow : DEFAULT_WORKFLOW,
    strict,
  };
}

function isLightweightFilePath(filePath) {
  return filePath.endsWith('.md')
    || filePath.startsWith('docs/')
    || filePath.startsWith('.agent-context/review-checklists/')
    || filePath.startsWith('.agent-context/rules/')
    || filePath.startsWith('.agent-context/prompts/')
    || filePath === 'CHANGELOG.md'
    || filePath === 'README.md';
}

function countSignificantChangedFiles(changedFiles) {
  return changedFiles.filter((filePath) => (
    filePath.startsWith('bin/')
    || filePath.startsWith('lib/')
    || filePath.startsWith('scripts/')
    || filePath.startsWith('tests/')
  )).length;
}

function detectSmallEdit(changedFiles) {
  const nonLightweightChangedFiles = changedFiles.filter((filePath) => !isLightweightFilePath(filePath));
  return nonLightweightChangedFiles.length <= 1 && changedFiles.length <= SMALL_EDIT_MAX_FILES;
}

function detectMajorFeatureCompletion(changedFiles) {
  const significantChangedFileCount = countSignificantChangedFiles(changedFiles);
  return significantChangedFileCount >= MAJOR_FEATURE_MIN_SIGNIFICANT_FILES;
}

function detectReviewIntentFromEnvironment() {
  const githubEventName = String(process.env.GITHUB_EVENT_NAME || '').toLowerCase();
  const githubEventAction = String(process.env.GITHUB_EVENT_ACTION || '').toLowerCase();
  const gitlabMergeRequestId = String(process.env.CI_MERGE_REQUEST_IID || '').trim();
  const ciPullRequestMarker = String(process.env.CI_PULL_REQUEST || '').toLowerCase();
  const auditWorkflowHint = String(process.env.AUDIT_WORKFLOW || '').toLowerCase();

  if (githubEventName.includes('pull_request') || githubEventAction.includes('pull_request')) {
    return true;
  }

  if (gitlabMergeRequestId.length > 0) {
    return true;
  }

  if (ciPullRequestMarker === 'true' || ciPullRequestMarker === '1') {
    return true;
  }

  return auditWorkflowHint.includes('review') || auditWorkflowHint.includes('pr');
}

function resolveAuditMode(options) {
  const {
    workflow,
    manualForceStrict,
    changedFiles,
  } = options;

  const smallEditDetected = detectSmallEdit(changedFiles);
  const majorFeatureDetected = detectMajorFeatureCompletion(changedFiles);

  if (manualForceStrict) {
    return {
      strictAuditMode: true,
      triggerReason: 'manual-force-strict',
      smallEditDetected,
      majorFeatureDetected,
    };
  }

  if (STRICT_WORKFLOWS.has(workflow)) {
    return {
      strictAuditMode: true,
      triggerReason: `workflow-${workflow}`,
      smallEditDetected,
      majorFeatureDetected,
    };
  }

  if (workflow === 'small-edit') {
    return {
      strictAuditMode: false,
      triggerReason: 'workflow-small-edit-lightweight',
      smallEditDetected: true,
      majorFeatureDetected,
    };
  }

  if (workflow === 'standard') {
    return {
      strictAuditMode: false,
      triggerReason: 'workflow-standard-lightweight',
      smallEditDetected,
      majorFeatureDetected,
    };
  }

  if (detectReviewIntentFromEnvironment()) {
    return {
      strictAuditMode: true,
      triggerReason: 'auto-review-or-pr-intent',
      smallEditDetected,
      majorFeatureDetected,
    };
  }

  if (majorFeatureDetected) {
    return {
      strictAuditMode: true,
      triggerReason: 'auto-major-feature-completion',
      smallEditDetected,
      majorFeatureDetected,
    };
  }

  if (smallEditDetected) {
    return {
      strictAuditMode: false,
      triggerReason: 'auto-small-edit-lightweight',
      smallEditDetected,
      majorFeatureDetected,
    };
  }

  return {
    strictAuditMode: false,
    triggerReason: 'auto-standard-lightweight',
    smallEditDetected,
    majorFeatureDetected,
  };
}

function assertChecklist(checklistLabel, checklistPath, requiredSnippets, failures, results) {
  const absoluteChecklistPath = resolve(REPOSITORY_ROOT, checklistPath);

  if (!existsSync(absoluteChecklistPath)) {
    failures.push(`Missing ${checklistLabel} checklist: ${checklistPath}`);
    pushResult(results, false, `${checklistLabel}-checklist-exists`, `Missing ${checklistPath}`);
    return;
  }

  pushResult(results, true, `${checklistLabel}-checklist-exists`, `${checklistPath} is present`);

  const checklistContent = readFileSync(absoluteChecklistPath, 'utf8');
  const missingChecklistSnippets = requiredSnippets.filter(
    (requiredSnippet) => !checklistContent.includes(requiredSnippet)
  );

  if (missingChecklistSnippets.length > 0) {
    failures.push(`Missing ${checklistLabel} checklist snippets: ${missingChecklistSnippets.join(', ')}`);
    pushResult(
      results,
      false,
      `${checklistLabel}-checklist-coverage`,
      `Missing snippets in ${checklistPath}: ${missingChecklistSnippets.join(', ')}`
    );
    return;
  }

  pushResult(results, true, `${checklistLabel}-checklist-coverage`, `${checklistLabel} checklist snippets are complete`);
}

function runAudit() {
  const parsedArguments = parseCliArguments(process.argv.slice(2));
  const changedScope = collectChangedFiles();
  const changedFiles = changedScope.files;

  const auditMode = resolveAuditMode({
    workflow: parsedArguments.workflow,
    manualForceStrict: parsedArguments.strict,
    changedFiles,
  });

  const results = [];
  const failures = [];

  pushResult(results, true, 'context-workflow', `workflow=${parsedArguments.workflow}`);
  pushResult(
    results,
    true,
    'manual-force-strict-flag',
    parsedArguments.strict ? 'Manual strict mode requested' : 'Manual strict mode not requested'
  );

  if (auditMode.strictAuditMode) {
    pushResult(results, true, 'strict-audit-activation', `Strict audit mode activated (${auditMode.triggerReason})`);

    assertChecklist(
      'pr',
      PR_CHECKLIST_PATH,
      REQUIRED_PR_CHECKLIST_SNIPPETS,
      failures,
      results
    );
    assertChecklist(
      'architecture',
      ARCHITECTURE_CHECKLIST_PATH,
      REQUIRED_ARCHITECTURE_CHECKLIST_SNIPPETS,
      failures,
      results
    );
  } else {
    pushResult(
      results,
      true,
      'strict-audit-lightweight-mode',
      `Strict audits skipped to avoid heavy mode (${auditMode.triggerReason})`
    );
  }

  const reportPayload = {
    generatedAt: new Date().toISOString(),
    auditName: 'context-triggered-audit',
    workflow: parsedArguments.workflow,
    source: changedScope.source,
    changedFileCount: changedFiles.length,
    changedFiles,
    userForcedStrictMode: parsedArguments.strict,
    strictAuditMode: auditMode.strictAuditMode,
    triggerReason: auditMode.triggerReason,
    smallEditDetected: auditMode.smallEditDetected,
    majorFeatureDetected: auditMode.majorFeatureDetected,
    passed: failures.length === 0,
    failureCount: failures.length,
    failures,
    results,
  };

  console.log(JSON.stringify(reportPayload, null, 2));
  process.exit(reportPayload.passed ? 0 : 1);
}

runAudit();