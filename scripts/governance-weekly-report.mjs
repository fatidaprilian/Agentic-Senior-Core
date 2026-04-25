#!/usr/bin/env node

/**
 * governance-weekly-report.mjs
 *
 * Aggregates weekly governance readiness signals for maintainers.
 * Produces a machine-readable report with trend, trust, and release posture.
 */

import { existsSync, readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_FILE_PATH);
const REPOSITORY_ROOT = resolve(SCRIPT_DIR, '..');
const QUALITY_TREND_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'quality-trend-report.json');
const REPORT_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'weekly-governance-report.json');
const ARGUMENT_FLAGS = new Set(process.argv.slice(2));
const isStdoutOnlyMode = ARGUMENT_FLAGS.has('--stdout-only');
const WEEKLY_WINDOW_DAYS = 7;
const HISTORY_LIMIT = 26;
const BACKEND_REQUIRED_DOMAIN_NAMES = new Set([
  'backend-architecture',
  'backend-security',
  'backend-data-access',
  'backend-error-handling',
  'backend-api-contract',
  'backend-testing',
  'backend-performance',
  'backend-idempotency',
  'backend-risk-map',
]);
const REQUIRED_VERIFIED_DOMAINS = new Set([
  'canonical-instructions',
  'frontend-design-contract',
  'frontend-architecture',
  ...Array.from(BACKEND_REQUIRED_DOMAIN_NAMES),
  'pr-checklist',
  'architecture-review',
  'mcp-server',
  'state-continuity',
]);
const GOVERNANCE_SURFACE_PATHS = {
  'canonical-instructions': '.instructions.md',
  'frontend-design-contract': '.agent-context/prompts/bootstrap-design.md',
  'frontend-architecture': '.agent-context/rules/frontend-architecture.md',
  'backend-architecture': '.agent-context/rules/architecture.md',
  'backend-security': '.agent-context/rules/security.md',
  'backend-data-access': '.agent-context/rules/database-design.md',
  'backend-error-handling': '.agent-context/rules/error-handling.md',
  'backend-api-contract': '.agent-context/rules/api-docs.md',
  'backend-testing': '.agent-context/rules/testing.md',
  'backend-performance': '.agent-context/rules/performance.md',
  'backend-idempotency': '.agent-context/rules/event-driven.md',
  'backend-risk-map': '.agent-context/state/architecture-map.md',
  'pr-checklist': '.agent-context/review-checklists/pr-checklist.md',
  'architecture-review': '.agent-context/review-checklists/architecture-review.md',
  'mcp-server': 'scripts/mcp-server.mjs',
  'state-continuity': '.agent-context/state',
};
const BACKEND_GOVERNANCE_COVERAGE = [
  {
    constraint: 'Layered architecture and separation of concerns',
    status: 'covered',
    sourcePaths: [
      '.agent-context/rules/architecture.md',
      '.agent-context/review-checklists/architecture-review.md',
    ],
    signal: 'Transport, application, domain, and infrastructure boundaries are explicit.',
  },
  {
    constraint: 'Global backend/API rule routing',
    status: 'strengthened',
    sourcePaths: [
      '.instructions.md',
      '.agent-context/rules/architecture.md',
      '.agent-context/prompts/refactor.md',
    ],
    signal: 'Backend/API governance routes by problem domain and stays stack-agnostic; no stack-specific governance adapters are created.',
  },
  {
    constraint: 'Zero-trust input validation',
    status: 'strengthened',
    sourcePaths: [
      '.agent-context/rules/security.md',
      '.agent-context/review-checklists/pr-checklist.md',
    ],
    signal: 'User-controlled body, query, params, headers, cookies, files, webhooks, and job payloads must be validated before service logic.',
  },
  {
    constraint: 'Data access performance and integrity',
    status: 'strengthened',
    sourcePaths: [
      '.agent-context/rules/database-design.md',
      '.agent-context/rules/performance.md',
      '.agent-context/state/architecture-map.md',
    ],
    signal: 'Backend reads must avoid N+1 and unbounded list responses; multi-write mutations need transaction or recovery evidence.',
  },
  {
    constraint: 'Distributed consistency and outbox safety',
    status: 'strengthened',
    sourcePaths: [
      '.agent-context/rules/event-driven.md',
      '.agent-context/rules/database-design.md',
      '.agent-context/rules/microservices.md',
    ],
    signal: 'Dual-write flows need outbox or equivalent replay safety, and cross-service consistency must define saga, compensation, or recovery behavior instead of defaulting to two-phase commit.',
  },
  {
    constraint: 'Safe centralized API errors',
    status: 'strengthened',
    sourcePaths: [
      '.agent-context/rules/error-handling.md',
      '.agent-context/rules/api-docs.md',
    ],
    signal: 'HTTP/API responses use safe machine-readable error shapes, may align with RFC 9457 Problem Details, and preserve safe trace/correlation identifiers without leaking internals.',
  },
  {
    constraint: 'Sensitive mutation idempotency',
    status: 'strengthened',
    sourcePaths: [
      '.agent-context/rules/api-docs.md',
      '.agent-context/rules/testing.md',
      '.agent-context/rules/event-driven.md',
    ],
    signal: 'Payments, orders, status changes, and other risky mutations must document and test duplicate-submit behavior.',
  },
  {
    constraint: 'API contract and behavior testing',
    status: 'strengthened',
    sourcePaths: [
      '.agent-context/rules/testing.md',
      '.agent-context/review-checklists/pr-checklist.md',
    ],
    signal: 'API tests cover validation, auth, documented error shapes, pagination defaults, empty states, and mutation retry safety.',
  },
];

function readJsonOrNull(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function runJsonScript(scriptRelativePath, scriptArguments = []) {
  const absoluteScriptPath = join(REPOSITORY_ROOT, scriptRelativePath);
  const commandResult = spawnSync('node', [absoluteScriptPath, ...scriptArguments], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10,
  });

  const standardOutput = (commandResult.stdout || '').trim();
  const standardError = (commandResult.stderr || '').trim();
  const exitCode = typeof commandResult.status === 'number' ? commandResult.status : 1;

  if (!standardOutput) {
    return {
      scriptPath: scriptRelativePath,
      exitCode,
      parsedReport: null,
      parseError: 'Script produced no stdout JSON payload',
      stderr: standardError,
    };
  }

  try {
    return {
      scriptPath: scriptRelativePath,
      exitCode,
      parsedReport: JSON.parse(standardOutput),
      parseError: null,
      stderr: standardError,
    };
  } catch (jsonParseError) {
    const parseErrorMessage = jsonParseError instanceof Error ? jsonParseError.message : String(jsonParseError);
    return {
      scriptPath: scriptRelativePath,
      exitCode,
      parsedReport: null,
      parseError: parseErrorMessage,
      stderr: standardError,
    };
  }
}

function loadQualityTrendReport() {
  const existingQualityTrend = readJsonOrNull(QUALITY_TREND_PATH);
  if (existingQualityTrend) {
    return {
      source: 'state-file',
      report: existingQualityTrend,
      freshness: existingQualityTrend.generatedAt || null,
    };
  }

  const generatedQualityTrend = runJsonScript('scripts/quality-trend-report.mjs', ['--stdout-only']);
  return {
    source: 'generated-stdout',
    report: generatedQualityTrend.parsedReport,
    freshness: generatedQualityTrend.parsedReport?.generatedAt || null,
    parseError: generatedQualityTrend.parseError,
    exitCode: generatedQualityTrend.exitCode,
  };
}

function collectCommitSignals(windowDays) {
  const commitLogResult = spawnSync('git', ['log', `--since=${windowDays}.days`, '--pretty=format:%s'], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });

  if (commitLogResult.status !== 0) {
    return {
      windowDays,
      commitCount: 0,
      releaseCommitCount: 0,
      rollbackCommitCount: 0,
      releaseFrequencyPercent: null,
      rollbackFrequencyPercent: null,
      error: (commitLogResult.stderr || 'Failed to read git log').trim(),
    };
  }

  const commitSubjects = (commitLogResult.stdout || '')
    .split(/\r?\n/u)
    .map((subjectLine) => subjectLine.trim())
    .filter((subjectLine) => subjectLine.length > 0);

  const commitCount = commitSubjects.length;
  const releaseCommitCount = commitSubjects.filter((subjectLine) => /release|publish|chore\(release\)/i.test(subjectLine)).length;
  const rollbackCommitCount = commitSubjects.filter((subjectLine) => /rollback|revert/i.test(subjectLine)).length;

  return {
    windowDays,
    commitCount,
    releaseCommitCount,
    rollbackCommitCount,
    releaseFrequencyPercent: commitCount === 0 ? 0 : Number(((releaseCommitCount / commitCount) * 100).toFixed(2)),
    rollbackFrequencyPercent: commitCount === 0 ? 0 : Number(((rollbackCommitCount / commitCount) * 100).toFixed(2)),
    error: null,
  };
}

async function collectSkillTrustSignals() {
  const trustRows = [];
  const tierCounts = {
    verified: 0,
    community: 0,
    experimental: 0,
  };

  const sortedDomainNames = Array.from(REQUIRED_VERIFIED_DOMAINS).sort((leftName, rightName) => {
    return leftName.localeCompare(rightName);
  });

  for (const skillDomainName of sortedDomainNames) {
    const relativeSurfacePath = GOVERNANCE_SURFACE_PATHS[skillDomainName];
    const absoluteSurfacePath = join(REPOSITORY_ROOT, relativeSurfacePath);
    const surfaceExists = existsSync(absoluteSurfacePath);
    const trustTier = surfaceExists ? 'verified' : 'experimental';
    const trustScore = surfaceExists ? 100 : 0;

    if (typeof tierCounts[trustTier] === 'number') {
      tierCounts[trustTier] += 1;
    }

    trustRows.push({
      domain: skillDomainName,
      tier: trustTier,
      score: trustScore,
      sourcePath: relativeSurfacePath,
    });
  }

  const requiredVerifiedDomainFailures = trustRows
    .filter((trustRow) => REQUIRED_VERIFIED_DOMAINS.has(trustRow.domain) && trustRow.tier !== 'verified')
    .map((trustRow) => trustRow.domain);

  return {
    domains: trustRows,
    tierCounts,
    requiredVerifiedDomains: Array.from(REQUIRED_VERIFIED_DOMAINS),
    requiredVerifiedDomainFailures,
    allRequiredVerified: requiredVerifiedDomainFailures.length === 0,
  };
}

function buildBackendGovernancePosture(skillTrustSignals) {
  const backendSurfaceRows = skillTrustSignals.domains.filter((trustRow) => {
    return BACKEND_REQUIRED_DOMAIN_NAMES.has(trustRow.domain);
  });
  const missingBackendSurfaceNames = backendSurfaceRows
    .filter((trustRow) => trustRow.tier !== 'verified')
    .map((trustRow) => trustRow.domain);
  const verifiedSurfaceCount = backendSurfaceRows.length - missingBackendSurfaceNames.length;

  return {
    status: missingBackendSurfaceNames.length === 0 ? 'verified' : 'needs-attention',
    summary: missingBackendSurfaceNames.length === 0
      ? 'Backend governance is verified across architecture, security, data access, error handling, API contracts, testing, performance, idempotency, and risk-map surfaces.'
      : 'Backend governance is missing one or more required surfaces.',
    requiredSurfaceCount: backendSurfaceRows.length,
    verifiedSurfaceCount,
    missingSurfaceNames: missingBackendSurfaceNames,
    coverage: BACKEND_GOVERNANCE_COVERAGE,
    developmentFocus: [
      {
        focus: 'Keep backend guidance global and stack-agnostic.',
        reason: 'The repo should enforce architecture, security, API, data, error, event, and testing thinking without building Nest, Laravel, FastAPI, Express, Go, or other stack-specific governance adapters.',
      },
      {
        focus: 'Use framework facts only when implementing inside an existing project.',
        reason: 'LLMs can apply current ecosystem knowledge directly; governance should route the relevant global constraints instead of acting as a stack detector.',
      },
    ],
  };
}

function buildBlockers(qualityTrendReport, skillTrustSignals, commitSignals) {
  const blockers = [];

  const qualityGatePassRatePercent = qualityTrendReport?.governanceHealth?.gatePassRatePercent;
  if (typeof qualityGatePassRatePercent !== 'number' || qualityGatePassRatePercent < 100) {
    blockers.push('Governance gate pass rate is below 100%.');
  }

  if (!skillTrustSignals.allRequiredVerified) {
    blockers.push(
      `Required verified skill domains missing: ${skillTrustSignals.requiredVerifiedDomainFailures.join(', ')}`
    );
  }

  if (commitSignals.error) {
    blockers.push(`Commit signal extraction failed: ${commitSignals.error}`);
  }

  return blockers;
}

function buildHistoryEntry(weeklyReport) {
  return {
    generatedAt: weeklyReport.generatedAt,
    readinessStatus: weeklyReport.releaseReadiness.isReady ? 'ready' : 'blocked',
    blockerCount: weeklyReport.releaseReadiness.blockers.length,
    gatePassRatePercent: weeklyReport.qualitySignals.governanceHealth.gatePassRatePercent,
    verifiedSkillDomainCount: weeklyReport.skillTrust.tierCounts.verified,
    backendVerifiedSurfaceCount: weeklyReport.backendGovernance?.verifiedSurfaceCount ?? null,
    releaseFrequencyPercent: weeklyReport.commitSignals.releaseFrequencyPercent,
    rollbackFrequencyPercent: weeklyReport.commitSignals.rollbackFrequencyPercent,
  };
}

function mergeHistory(previousReport, currentHistoryEntry) {
  const existingHistory = Array.isArray(previousReport?.history) ? previousReport.history : [];
  const mergedHistory = [...existingHistory, currentHistoryEntry];

  if (mergedHistory.length <= HISTORY_LIMIT) {
    return mergedHistory;
  }

  return mergedHistory.slice(mergedHistory.length - HISTORY_LIMIT);
}

async function runWeeklyGovernanceReport() {
  const qualityTrendState = loadQualityTrendReport();
  const qualityTrendReport = qualityTrendState.report;

  const skillTrustSignals = await collectSkillTrustSignals();
  const backendGovernance = buildBackendGovernancePosture(skillTrustSignals);
  const commitSignals = collectCommitSignals(WEEKLY_WINDOW_DAYS);
  const blockers = buildBlockers(qualityTrendReport, skillTrustSignals, commitSignals);

  const weeklyReportSnapshot = {
    generatedAt: new Date().toISOString(),
    reportName: 'weekly-governance-report',
    methodology: {
      qualityTrendSource: qualityTrendState.source,
      qualityTrendGeneratedAt: qualityTrendState.freshness,
      commitWindowDays: WEEKLY_WINDOW_DAYS,
      requiredVerifiedDomains: Array.from(REQUIRED_VERIFIED_DOMAINS),
    },
    qualitySignals: {
      governanceHealth: {
        availableGateCount: qualityTrendReport?.governanceHealth?.availableGateCount ?? null,
        passedGateCount: qualityTrendReport?.governanceHealth?.passedGateCount ?? null,
        gatePassRatePercent: qualityTrendReport?.governanceHealth?.gatePassRatePercent ?? null,
      },
      rejectionCategories: Array.isArray(qualityTrendReport?.rejectionCategories)
        ? qualityTrendReport.rejectionCategories
        : [],
      tokenEfficiency: qualityTrendReport?.tokenEfficiency || null,
    },
    skillTrust: skillTrustSignals,
    backendGovernance,
    commitSignals,
    releaseReadiness: {
      isReady: blockers.length === 0,
      blockers,
      summary: blockers.length === 0
        ? 'Weekly governance posture is ready for maintenance releases with frontend and backend governance surfaces verified.'
        : 'Weekly governance posture is blocked by unresolved readiness signals.',
    },
    artifact: {
      path: REPORT_PATH,
      writeMode: isStdoutOnlyMode ? 'stdout-only' : 'stdout-and-file',
    },
  };

  const previousReport = readJsonOrNull(REPORT_PATH);
  const history = mergeHistory(previousReport, buildHistoryEntry(weeklyReportSnapshot));
  const weeklyReport = {
    ...weeklyReportSnapshot,
    history,
  };

  if (!isStdoutOnlyMode) {
    await fs.mkdir(dirname(REPORT_PATH), { recursive: true });
    await fs.writeFile(REPORT_PATH, JSON.stringify(weeklyReport, null, 2) + '\n', 'utf8');
  }

  return weeklyReport;
}

runWeeklyGovernanceReport()
  .then((weeklyReport) => {
    console.log(JSON.stringify(weeklyReport, null, 2));
  })
  .catch((reportError) => {
    const errorMessage = reportError instanceof Error ? reportError.message : String(reportError);
    console.error(`Weekly governance report failed: ${errorMessage}`);
    process.exit(1);
  });
