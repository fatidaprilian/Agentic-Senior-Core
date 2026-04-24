#!/usr/bin/env node

/**
 * documentation-boundary-audit.mjs
 *
 * Enforces documentation sync only on changed scope boundaries.
 * If public surface, API contract, or database structure files change,
 * matching documentation updates must be present in the same change scope.
 */

import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPOSITORY_ROOT = resolve(__dirname, '..');
const DOCUMENTATION_BOUNDARY_AUDIT_REPORT_VERSION = '2.1.0';
const AUTO_DOCS_SYNC_SCOPE_PHASE = 'phase-1';
const AUTO_DOCS_SYNC_SCOPE_BOUNDARIES = [
  'public-surface',
  'api-contract',
  'database-structure',
];

const CORE_DOCUMENTATION_FILES = new Set(['README.md', 'CHANGELOG.md']);

const BOUNDARY_RULES = [
  {
    boundaryName: 'public-surface',
    requirement: 'Public surface changes must update README.md, CHANGELOG.md, or docs/* in the same scope.',
    requiredDocumentationUpdates: [
      'README.md',
      'CHANGELOG.md',
      'docs/architecture-decision-record.md',
      'docs/flow-overview.md',
    ],
    trigger(filePath) {
      return /^(bin\/|lib\/|scripts\/)/.test(filePath) && !isDocumentationFilePath(filePath);
    },
    docsMatcher(filePath) {
      return filePath === 'README.md' || filePath === 'CHANGELOG.md' || filePath.startsWith('docs/');
    },
  },
  {
    boundaryName: 'api-contract',
    requirement: 'API endpoint or contract changes must update API/OpenAPI documentation in the same scope.',
    requiredDocumentationUpdates: [
      'docs/api-contract.md',
      'docs/flow-overview.md',
      '.agent-context/rules/api-docs.md',
      'README.md',
    ],
    trigger(filePath) {
      return !isDocumentationFilePath(filePath)
        && (
          /(api|openapi|controller|route|endpoint)/i.test(filePath)
          || /api[-_/]?contract/i.test(filePath)
        );
    },
    docsMatcher(filePath) {
      return filePath === '.agent-context/rules/api-docs.md'
        || /^(docs\/.*(api|contract|openapi))/i.test(filePath)
        || filePath === 'README.md';
    },
  },
  {
    boundaryName: 'database-structure',
    requirement: 'Database structure changes must update schema or migration documentation in the same scope.',
    requiredDocumentationUpdates: [
      'docs/database-schema.md',
      'docs/flow-overview.md',
      '.agent-context/rules/database-design.md',
      'README.md',
    ],
    trigger(filePath) {
      return !isDocumentationFilePath(filePath)
        && /(database|schema|migration|repository|sql|prisma|typeorm|knex)/i.test(filePath);
    },
    docsMatcher(filePath) {
      return filePath === '.agent-context/rules/database-design.md'
        || /^(docs\/.*(database|schema|migration))/i.test(filePath)
        || filePath === 'README.md';
    },
  },
];

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

function isDocumentationFilePath(filePath) {
  return CORE_DOCUMENTATION_FILES.has(filePath)
    || filePath.startsWith('docs/')
    || filePath.startsWith('.agent-context/review-checklists/')
    || filePath === '.agent-context/rules/api-docs.md'
    || filePath === '.agent-context/rules/database-design.md';
}

function evaluateBoundary(boundaryRule, changedFiles, changedDocumentationFiles) {
  const boundaryChangedFiles = changedFiles.filter((filePath) => boundaryRule.trigger(filePath));
  const expectedDocumentationPaths = Array.isArray(boundaryRule.requiredDocumentationUpdates)
    ? boundaryRule.requiredDocumentationUpdates
    : [];

  if (boundaryChangedFiles.length === 0) {
    return {
      boundaryName: boundaryRule.boundaryName,
      requirement: boundaryRule.requirement,
      triggered: false,
      passed: true,
      changedFiles: [],
      documentationFiles: [],
      expectedDocumentationPaths,
      missingDocumentationUpdates: false,
      requiredActions: [],
      details: 'Boundary not triggered by changed scope.',
    };
  }

  const matchingDocumentationFiles = changedDocumentationFiles.filter((filePath) => boundaryRule.docsMatcher(filePath));
  const boundaryPassed = matchingDocumentationFiles.length > 0;
  const requiredActions = boundaryPassed
    ? []
    : [
      `Update one or more boundary docs: ${expectedDocumentationPaths.join(', ')}`,
      'Re-run scripts/documentation-boundary-audit.mjs before merge.',
    ];

  const details = boundaryPassed
    ? `Boundary triggered and synchronized with documentation updates: ${matchingDocumentationFiles.join(', ')}`
    : 'Boundary triggered without required documentation updates.';

  return {
    boundaryName: boundaryRule.boundaryName,
    requirement: boundaryRule.requirement,
    triggered: true,
    passed: boundaryPassed,
    changedFiles: boundaryChangedFiles,
    documentationFiles: matchingDocumentationFiles,
      expectedDocumentationPaths,
      missingDocumentationUpdates: !boundaryPassed,
      requiredActions,
    details,
  };
}

function runDocumentationBoundaryAudit() {
  const changedScope = collectChangedFiles();
  const changedFiles = changedScope.files;
  const changedDocumentationFiles = changedFiles.filter(isDocumentationFilePath);

  const boundaryResults = BOUNDARY_RULES.map((boundaryRule) => (
    evaluateBoundary(boundaryRule, changedFiles, changedDocumentationFiles)
  ));

  const violations = boundaryResults
    .filter((boundaryResult) => boundaryResult.triggered && !boundaryResult.passed)
    .map((boundaryResult) => ({
      boundaryName: boundaryResult.boundaryName,
      requirement: boundaryResult.requirement,
      changedFiles: boundaryResult.changedFiles,
      expectedDocumentationPaths: boundaryResult.expectedDocumentationPaths,
      requiredActions: boundaryResult.requiredActions,
      diagnosticCode: `BOUNDARY_${boundaryResult.boundaryName.toUpperCase().replace(/-/g, '_')}_DOCS_SYNC_REQUIRED`,
    }));

  const failures = violations.map((violation) => {
    const affectedFiles = violation.changedFiles.join(', ');
    return `${violation.boundaryName}: ${violation.requirement} Changed files: ${affectedFiles}`;
  });

  const reportPayload = {
    generatedAt: new Date().toISOString(),
    reportVersion: DOCUMENTATION_BOUNDARY_AUDIT_REPORT_VERSION,
    auditName: 'documentation-boundary-audit',
    source: changedScope.source,
    changedFileCount: changedFiles.length,
    changedFiles,
    boundaryResults,
    violations,
    passed: failures.length === 0,
    failureCount: failures.length,
    failures,
  };

  const triggeredBoundaryResults = boundaryResults.filter((boundaryResult) => boundaryResult.triggered);
  const passedTriggeredBoundaryResults = triggeredBoundaryResults.filter((boundaryResult) => boundaryResult.passed);
  const scopeMatchedDocumentationFiles = uniqueSorted(
    triggeredBoundaryResults.flatMap((boundaryResult) => boundaryResult.documentationFiles),
  );
  const scopeMatchedDocumentationFileSet = new Set(scopeMatchedDocumentationFiles);
  const outOfScopeDocumentationFiles = changedDocumentationFiles.filter(
    (filePath) => !scopeMatchedDocumentationFileSet.has(filePath),
  );

  const precisionNumerator = scopeMatchedDocumentationFiles.length;
  const precisionDenominator = changedDocumentationFiles.length;
  const recallNumerator = passedTriggeredBoundaryResults.length;
  const recallDenominator = triggeredBoundaryResults.length;

  const precision = precisionDenominator > 0 ? precisionNumerator / precisionDenominator : 1;
  const recall = recallDenominator > 0 ? recallNumerator / recallDenominator : 1;

  reportPayload.autoDocsSyncScope = {
    phase: AUTO_DOCS_SYNC_SCOPE_PHASE,
    bounded: true,
    explicitBoundaries: AUTO_DOCS_SYNC_SCOPE_BOUNDARIES,
  };

  reportPayload.rolloutMetrics = {
    measuredAt: reportPayload.generatedAt,
    precision,
    recall,
    precisionNumerator,
    precisionDenominator,
    recallNumerator,
    recallDenominator,
    scopeMatchedDocumentationFiles,
    outOfScopeDocumentationFiles,
  };

  console.log(JSON.stringify(reportPayload, null, 2));
  process.exit(reportPayload.passed ? 0 : 1);
}

runDocumentationBoundaryAudit();
