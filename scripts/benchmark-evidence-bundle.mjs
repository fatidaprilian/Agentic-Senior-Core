#!/usr/bin/env node

/**
 * benchmark-evidence-bundle.mjs
 *
 * Benchmark evidence bundle with reproducibility, trend history,
 * security signals, and reliability early warnings.
 */

import { existsSync, readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_FILE_PATH);
const REPOSITORY_ROOT = resolve(SCRIPT_DIR, '..');
const ARGUMENT_FLAGS = new Set(process.argv.slice(2));
const isStdoutOnlyMode = ARGUMENT_FLAGS.has('--stdout-only');

const PACKAGE_JSON_PATH = join(REPOSITORY_ROOT, 'package.json');
const REPRO_PROFILE_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'benchmark-reproducibility.json');
const BENCHMARK_THRESHOLD_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'benchmark-thresholds.json');
const MEMORY_SCHEMA_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'memory-schema-v1.json');
const MEMORY_ADAPTER_CONTRACT_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'memory-adapter-contract.json');
const OUTPUT_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'benchmark-evidence-bundle.json');
const HISTORY_OUTPUT_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'benchmark-history.json');
const TREND_JSON_OUTPUT_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'benchmark-trend-report.json');
const TREND_CSV_OUTPUT_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'benchmark-trend-report.csv');

const MAX_HISTORY_ENTRIES = 90;
const RELIABILITY_THRESHOLDS = {
  minimumConfidenceGap: 0.1,
  maximumLowConfidenceRate: 0.2,
  maximumIncorrectDetectionRate: 0.1,
};

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

function toRelativePath(filePath) {
  return relative(REPOSITORY_ROOT, filePath).replace(/\\/g, '/');
}

function toFiniteNumber(rawValue, fallbackValue = null) {
  const parsedValue = Number(rawValue);
  if (!Number.isFinite(parsedValue)) {
    return fallbackValue;
  }

  return parsedValue;
}

function parseJsonPayload(rawPayload) {
  const payloadText = String(rawPayload || '').trim();
  if (!payloadText) {
    return { parsed: null, error: 'Payload is empty' };
  }

  try {
    return { parsed: JSON.parse(payloadText), error: null };
  } catch {
    const firstCurlyBracketIndex = payloadText.indexOf('{');
    const lastCurlyBracketIndex = payloadText.lastIndexOf('}');

    if (firstCurlyBracketIndex !== -1 && lastCurlyBracketIndex > firstCurlyBracketIndex) {
      const candidatePayload = payloadText.slice(firstCurlyBracketIndex, lastCurlyBracketIndex + 1);
      try {
        return { parsed: JSON.parse(candidatePayload), error: null };
      } catch (secondError) {
        return {
          parsed: null,
          error: secondError instanceof Error ? secondError.message : String(secondError),
        };
      }
    }

    return { parsed: null, error: 'No JSON object found in payload' };
  }
}

function runJsonScript(scriptRelativePath) {
  const absoluteScriptPath = join(REPOSITORY_ROOT, scriptRelativePath);
  const executionResult = spawnSync('node', [absoluteScriptPath], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10,
  });

  const stdoutContent = (executionResult.stdout || '').trim();
  const stderrContent = (executionResult.stderr || '').trim();
  const exitCode = typeof executionResult.status === 'number' ? executionResult.status : 1;

  if (!stdoutContent) {
    return {
      scriptPath: scriptRelativePath,
      exitCode,
      parsedReport: null,
      parseError: 'Script produced no stdout JSON payload',
      stderr: stderrContent,
    };
  }

  try {
    return {
      scriptPath: scriptRelativePath,
      exitCode,
      parsedReport: JSON.parse(stdoutContent),
      parseError: null,
      stderr: stderrContent,
    };
  } catch (jsonParseError) {
    const parseErrorMessage = jsonParseError instanceof Error ? jsonParseError.message : String(jsonParseError);
    return {
      scriptPath: scriptRelativePath,
      exitCode,
      parsedReport: null,
      parseError: parseErrorMessage,
      stderr: stderrContent,
    };
  }
}

function runNodeScript(scriptRelativePath, argumentsList = []) {
  const absoluteScriptPath = join(REPOSITORY_ROOT, scriptRelativePath);
  const executionResult = spawnSync('node', [absoluteScriptPath, ...argumentsList], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10,
  });

  return {
    scriptPath: scriptRelativePath,
    exitCode: typeof executionResult.status === 'number' ? executionResult.status : 1,
    stdout: (executionResult.stdout || '').trim(),
    stderr: (executionResult.stderr || '').trim(),
  };
}

function runNpmAuditIndicator() {
  const executionResult = spawnSync('npm', ['audit', '--json', '--omit=dev'], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10,
  });

  const combinedOutput = [executionResult.stdout, executionResult.stderr].filter(Boolean).join('\n').trim();
  const { parsed: parsedAuditReport, error: parseError } = parseJsonPayload(combinedOutput);
  const exitCode = typeof executionResult.status === 'number' ? executionResult.status : 1;

  if (!parsedAuditReport || parseError) {
    return {
      isAvailable: false,
      exitCode,
      severityCounts: null,
      hasKnownVulnerabilities: null,
      error: parseError || 'Unable to parse npm audit output',
    };
  }

  const vulnerabilityMetadata = parsedAuditReport.metadata?.vulnerabilities || null;
  const severityCounts = vulnerabilityMetadata
    ? {
        info: toFiniteNumber(vulnerabilityMetadata.info, 0),
        low: toFiniteNumber(vulnerabilityMetadata.low, 0),
        moderate: toFiniteNumber(vulnerabilityMetadata.moderate, 0),
        high: toFiniteNumber(vulnerabilityMetadata.high, 0),
        critical: toFiniteNumber(vulnerabilityMetadata.critical, 0),
        total: toFiniteNumber(vulnerabilityMetadata.total, 0),
      }
    : null;

  if (!severityCounts) {
    return {
      isAvailable: false,
      exitCode,
      severityCounts: null,
      hasKnownVulnerabilities: null,
      error: parsedAuditReport.error?.summary || 'npm audit report does not include vulnerability metadata',
    };
  }

  return {
    isAvailable: true,
    exitCode,
    severityCounts,
    hasKnownVulnerabilities: severityCounts.total > 0,
    error: null,
  };
}

function summarizeExecution(scriptExecutionResult) {
  return {
    scriptPath: scriptExecutionResult.scriptPath,
    exitCode: scriptExecutionResult.exitCode,
    parseError: scriptExecutionResult.parseError,
    stderr: scriptExecutionResult.stderr || null,
    reportName: scriptExecutionResult.parsedReport?.reportName || scriptExecutionResult.parsedReport?.gateName || null,
    passed: typeof scriptExecutionResult.parsedReport?.passed === 'boolean'
      ? scriptExecutionResult.parsedReport.passed
      : null,
  };
}

function appendUniqueTextValues(baseValues, additionalValues) {
  const mergedValues = [...baseValues];
  for (const additionalValue of additionalValues) {
    if (!mergedValues.includes(additionalValue)) {
      mergedValues.push(additionalValue);
    }
  }

  return mergedValues;
}

function buildRubricSummary(thresholdConfiguration, intelligenceReport, memoryContinuityReport) {
  return {
    benchmarkThresholds: {
      minimumTop1Accuracy: thresholdConfiguration?.minimumTop1Accuracy ?? null,
      maximumManualCorrectionRate: thresholdConfiguration?.maximumManualCorrectionRate ?? null,
      maximumTop1AccuracyDrop: thresholdConfiguration?.maximumTop1AccuracyDrop ?? null,
      maximumManualCorrectionIncrease: thresholdConfiguration?.maximumManualCorrectionIncrease ?? null,
    },
    intelligenceSlaDays: intelligenceReport?.reviewSlaDays ?? null,
    staticExternalWatchlistRetired: intelligenceReport?.staticExternalWatchlistRetired === true,
    reliabilityThresholds: RELIABILITY_THRESHOLDS,
    continuityThresholds: memoryContinuityReport?.thresholds || null,
  };
}

function buildReliabilitySignals(detectionBenchmarkReport) {
  const fixtureResults = Array.isArray(detectionBenchmarkReport?.fixtures) ? detectionBenchmarkReport.fixtures : [];
  const fixtureCount = fixtureResults.length;

  const incorrectFixtures = fixtureResults.filter((fixtureResult) => fixtureResult?.isCorrect === false);
  const lowConfidenceFixtures = fixtureResults.filter((fixtureResult) => {
    const confidenceGap = toFiniteNumber(fixtureResult?.confidenceGap, 0);
    return confidenceGap < RELIABILITY_THRESHOLDS.minimumConfidenceGap;
  });
  const manualCorrectionFixtures = fixtureResults.filter((fixtureResult) => fixtureResult?.needsManualCorrection === true);

  const incorrectDetectionRate = fixtureCount === 0
    ? 0
    : Number((incorrectFixtures.length / fixtureCount).toFixed(4));
  const lowConfidenceRate = fixtureCount === 0
    ? 0
    : Number((lowConfidenceFixtures.length / fixtureCount).toFixed(4));
  const manualCorrectionRate = fixtureCount === 0
    ? 0
    : Number((manualCorrectionFixtures.length / fixtureCount).toFixed(4));

  const reliabilityChecks = [
    {
      checkName: 'incorrect-detection-rate',
      passed: incorrectDetectionRate <= RELIABILITY_THRESHOLDS.maximumIncorrectDetectionRate,
      details: `incorrectRate=${incorrectDetectionRate} max=${RELIABILITY_THRESHOLDS.maximumIncorrectDetectionRate}`,
    },
    {
      checkName: 'low-confidence-rate',
      passed: lowConfidenceRate <= RELIABILITY_THRESHOLDS.maximumLowConfidenceRate,
      details: `lowConfidenceRate=${lowConfidenceRate} max=${RELIABILITY_THRESHOLDS.maximumLowConfidenceRate}`,
    },
    {
      checkName: 'manual-correction-early-warning',
      passed: manualCorrectionRate <= 0.12,
      details: `manualCorrectionRate=${manualCorrectionRate} warningThreshold=0.12`,
    },
  ];

  const failureCount = reliabilityChecks.filter((reliabilityCheck) => !reliabilityCheck.passed).length;
  const riskLevel = failureCount === 0
    ? (incorrectFixtures.length > 0 || lowConfidenceFixtures.length > 0 ? 'monitor' : 'stable')
    : (failureCount >= 2 ? 'high' : 'elevated');

  return {
    passed: failureCount === 0,
    failureCount,
    riskLevel,
    thresholds: RELIABILITY_THRESHOLDS,
    metrics: {
      fixtureCount,
      incorrectFixtureCount: incorrectFixtures.length,
      lowConfidenceFixtureCount: lowConfidenceFixtures.length,
      manualCorrectionFixtureCount: manualCorrectionFixtures.length,
      incorrectDetectionRate,
      lowConfidenceRate,
      manualCorrectionRate,
    },
    checks: reliabilityChecks,
    flaggedFixtures: fixtureResults
      .filter((fixtureResult) => fixtureResult?.isCorrect === false || fixtureResult?.needsManualCorrection === true)
      .map((fixtureResult) => ({
        fixtureName: fixtureResult.fixtureName,
        confidenceGap: fixtureResult.confidenceGap,
        detectedStack: fixtureResult.detectedStack,
        expectedStack: fixtureResult.expectedStack,
        isCorrect: fixtureResult.isCorrect,
        needsManualCorrection: fixtureResult.needsManualCorrection,
      })),
  };
}

function buildBugIndicators(reliabilitySignals) {
  return {
    incorrectFixtureCount: reliabilitySignals.metrics.incorrectFixtureCount,
    incorrectDetectionRate: reliabilitySignals.metrics.incorrectDetectionRate,
    manualCorrectionFixtureCount: reliabilitySignals.metrics.manualCorrectionFixtureCount,
    manualCorrectionRate: reliabilitySignals.metrics.manualCorrectionRate,
    lowConfidenceFixtureCount: reliabilitySignals.metrics.lowConfidenceFixtureCount,
    lowConfidenceRate: reliabilitySignals.metrics.lowConfidenceRate,
    flaggedFixtures: reliabilitySignals.flaggedFixtures,
  };
}

function buildSecurityIndicators(forbiddenContentExecution, npmAuditIndicator) {
  const forbiddenContentPassed = forbiddenContentExecution.exitCode === 0;

  return {
    forbiddenContent: {
      checkName: 'forbidden-content-scan',
      passed: forbiddenContentPassed,
      exitCode: forbiddenContentExecution.exitCode,
      details: forbiddenContentPassed
        ? 'No forbidden content detected'
        : 'Forbidden content scan found one or more violations',
    },
    vulnerabilityScan: {
      checkName: 'npm-audit-indicator',
      isAvailable: npmAuditIndicator.isAvailable,
      hasKnownVulnerabilities: npmAuditIndicator.hasKnownVulnerabilities,
      severityCounts: npmAuditIndicator.severityCounts,
      exitCode: npmAuditIndicator.exitCode,
      error: npmAuditIndicator.error,
    },
  };
}

function readReleaseVersion() {
  const packageJson = readJsonOrNull(PACKAGE_JSON_PATH);
  return typeof packageJson?.version === 'string' && packageJson.version.trim().length > 0
    ? packageJson.version.trim()
    : 'unknown';
}

function loadBenchmarkHistory() {
  const historyPayload = readJsonOrNull(HISTORY_OUTPUT_PATH);

  if (Array.isArray(historyPayload?.history)) {
    return historyPayload.history;
  }

  if (Array.isArray(historyPayload)) {
    return historyPayload;
  }

  return [];
}

function mergeBenchmarkHistory(previousHistoryEntries, currentSnapshot) {
  const mergedHistoryEntries = [...previousHistoryEntries, currentSnapshot];
  if (mergedHistoryEntries.length <= MAX_HISTORY_ENTRIES) {
    return mergedHistoryEntries;
  }

  return mergedHistoryEntries.slice(mergedHistoryEntries.length - MAX_HISTORY_ENTRIES);
}

function buildHistorySnapshot({
  generatedAt,
  releaseVersion,
  detectionBenchmarkReport,
  benchmarkGateReport,
  benchmarkIntelligenceReport,
  reliabilitySignals,
  securityIndicators,
}) {
  return {
    generatedAt,
    releaseVersion,
    fixtureCount: toFiniteNumber(detectionBenchmarkReport?.fixtureCount, 0),
    top1Accuracy: toFiniteNumber(detectionBenchmarkReport?.top1Accuracy, 0),
    manualCorrectionRate: toFiniteNumber(detectionBenchmarkReport?.manualCorrectionRate, 0),
    benchmarkGatePassed: benchmarkGateReport?.passed === true,
    intelligencePassed: benchmarkIntelligenceReport?.passed === true,
    staticExternalWatchlistRetired: benchmarkIntelligenceReport?.staticExternalWatchlistRetired === true,
    reliabilityPassed: reliabilitySignals.passed,
    reliabilityRiskLevel: reliabilitySignals.riskLevel,
    incorrectDetectionRate: reliabilitySignals.metrics.incorrectDetectionRate,
    lowConfidenceRate: reliabilitySignals.metrics.lowConfidenceRate,
    vulnerabilityTotal: securityIndicators.vulnerabilityScan.severityCounts?.total ?? null,
    criticalVulnerabilityCount: securityIndicators.vulnerabilityScan.severityCounts?.critical ?? null,
    forbiddenContentPassed: securityIndicators.forbiddenContent.passed,
  };
}

function buildReleaseDelta(historyEntries, currentSnapshot) {
  const previousSnapshots = historyEntries.slice(0, -1);
  if (previousSnapshots.length === 0) {
    return null;
  }

  const previousReleaseSnapshot = [...previousSnapshots].reverse().find(
    (historyEntry) => historyEntry.releaseVersion !== currentSnapshot.releaseVersion
  ) || previousSnapshots[previousSnapshots.length - 1];

  const top1AccuracyDelta = Number((currentSnapshot.top1Accuracy - previousReleaseSnapshot.top1Accuracy).toFixed(4));
  const manualCorrectionDelta = Number((currentSnapshot.manualCorrectionRate - previousReleaseSnapshot.manualCorrectionRate).toFixed(4));
  const vulnerabilityDelta =
    (toFiniteNumber(currentSnapshot.vulnerabilityTotal, 0) - toFiniteNumber(previousReleaseSnapshot.vulnerabilityTotal, 0));

  return {
    currentReleaseVersion: currentSnapshot.releaseVersion,
    previousReleaseVersion: previousReleaseSnapshot.releaseVersion,
    comparedSnapshot: {
      currentGeneratedAt: currentSnapshot.generatedAt,
      previousGeneratedAt: previousReleaseSnapshot.generatedAt,
    },
    top1AccuracyDelta,
    manualCorrectionRateDelta: manualCorrectionDelta,
    vulnerabilityTotalDelta: vulnerabilityDelta,
    summary: [
      `top1Accuracy: ${top1AccuracyDelta >= 0 ? '+' : ''}${top1AccuracyDelta}`,
      `manualCorrectionRate: ${manualCorrectionDelta >= 0 ? '+' : ''}${manualCorrectionDelta}`,
      `vulnerabilityTotal: ${vulnerabilityDelta >= 0 ? '+' : ''}${vulnerabilityDelta}`,
    ],
  };
}

function buildTrendTable(historyEntries) {
  return historyEntries.map((historyEntry, index) => ({
    snapshotIndex: index + 1,
    generatedAt: historyEntry.generatedAt,
    releaseVersion: historyEntry.releaseVersion,
    top1Accuracy: historyEntry.top1Accuracy,
    manualCorrectionRate: historyEntry.manualCorrectionRate,
    incorrectDetectionRate: historyEntry.incorrectDetectionRate,
    lowConfidenceRate: historyEntry.lowConfidenceRate,
    staticExternalWatchlistRetired: historyEntry.staticExternalWatchlistRetired === true,
    vulnerabilityTotal: historyEntry.vulnerabilityTotal,
    criticalVulnerabilityCount: historyEntry.criticalVulnerabilityCount,
    benchmarkGatePassed: historyEntry.benchmarkGatePassed,
    intelligencePassed: historyEntry.intelligencePassed,
    reliabilityPassed: historyEntry.reliabilityPassed,
    reliabilityRiskLevel: historyEntry.reliabilityRiskLevel,
  }));
}

function buildChartSeries(historyEntries) {
  return {
    generatedAt: historyEntries.map((historyEntry) => historyEntry.generatedAt),
    top1Accuracy: historyEntries.map((historyEntry) => historyEntry.top1Accuracy),
    manualCorrectionRate: historyEntries.map((historyEntry) => historyEntry.manualCorrectionRate),
    incorrectDetectionRate: historyEntries.map((historyEntry) => historyEntry.incorrectDetectionRate),
    lowConfidenceRate: historyEntries.map((historyEntry) => historyEntry.lowConfidenceRate),
    staticExternalWatchlistRetired: historyEntries.map((historyEntry) => historyEntry.staticExternalWatchlistRetired === true),
    vulnerabilityTotal: historyEntries.map((historyEntry) => historyEntry.vulnerabilityTotal),
  };
}

function convertTrendTableToCsv(trendTable) {
  if (trendTable.length === 0) {
    return '';
  }

  const headers = Object.keys(trendTable[0]);
  const csvRows = [headers.join(',')];

  for (const trendRow of trendTable) {
    const rowValues = headers.map((header) => {
      const rawValue = trendRow[header];
      if (rawValue === null || rawValue === undefined) {
        return '';
      }

      const normalizedValue = String(rawValue).replace(/"/g, '""');
      return `"${normalizedValue}"`;
    });

    csvRows.push(rowValues.join(','));
  }

  return `${csvRows.join('\n')}\n`;
}

async function runBenchmarkEvidenceBundle() {
  const reproducibilityProfile = readJsonOrNull(REPRO_PROFILE_PATH);
  const thresholdConfiguration = readJsonOrNull(BENCHMARK_THRESHOLD_PATH);
  const memorySchemaConfiguration = readJsonOrNull(MEMORY_SCHEMA_PATH);
  const memoryAdapterContractConfiguration = readJsonOrNull(MEMORY_ADAPTER_CONTRACT_PATH);
  const releaseVersion = readReleaseVersion();

  const detectionBenchmarkExecution = runJsonScript('scripts/detection-benchmark.mjs');
  const benchmarkGateExecution = runJsonScript('scripts/benchmark-gate.mjs');
  const benchmarkIntelligenceExecution = runJsonScript('scripts/benchmark-intelligence.mjs');
  const memoryContinuityExecution = runJsonScript('scripts/memory-continuity-benchmark.mjs');
  const forbiddenContentExecution = runNodeScript('scripts/forbidden-content-check.mjs');
  const npmAuditIndicator = runNpmAuditIndicator();

  const executionSummaries = [
    summarizeExecution(detectionBenchmarkExecution),
    summarizeExecution(benchmarkGateExecution),
    summarizeExecution(benchmarkIntelligenceExecution),
    summarizeExecution(memoryContinuityExecution),
  ];

  const executionFailureCount = executionSummaries.filter((executionSummary) => {
    if (executionSummary.parseError) {
      return true;
    }

    if (typeof executionSummary.passed === 'boolean') {
      return executionSummary.passed === false;
    }

    return executionSummary.exitCode !== 0;
  }).length;

  const reliabilitySignals = buildReliabilitySignals(detectionBenchmarkExecution.parsedReport);
  const reliabilityFailureCount = reliabilitySignals.failureCount > 0 ? 1 : 0;
  const failureCount = executionFailureCount + reliabilityFailureCount;
  const securityIndicators = buildSecurityIndicators(forbiddenContentExecution, npmAuditIndicator);
  const bugIndicators = buildBugIndicators(reliabilitySignals);

  const generatedAt = new Date().toISOString();
  const currentSnapshot = buildHistorySnapshot({
    generatedAt,
    releaseVersion,
    detectionBenchmarkReport: detectionBenchmarkExecution.parsedReport,
    benchmarkGateReport: benchmarkGateExecution.parsedReport,
    benchmarkIntelligenceReport: benchmarkIntelligenceExecution.parsedReport,
    reliabilitySignals,
    securityIndicators,
  });
  const previousHistoryEntries = loadBenchmarkHistory();
  const historyEntries = mergeBenchmarkHistory(previousHistoryEntries, currentSnapshot);
  const releaseDelta = buildReleaseDelta(historyEntries, currentSnapshot);
  const trendTable = buildTrendTable(historyEntries);
  const chartSeries = buildChartSeries(historyEntries);

  const trendReport = {
    generatedAt,
    reportName: 'benchmark-trend-report',
    releaseVersion,
    historyCount: historyEntries.length,
    releaseDelta,
    trendTable,
    chartSeries,
    artifacts: {
      historyPath: toRelativePath(HISTORY_OUTPUT_PATH),
      jsonPath: toRelativePath(TREND_JSON_OUTPUT_PATH),
      csvPath: toRelativePath(TREND_CSV_OUTPUT_PATH),
      writeMode: isStdoutOnlyMode ? 'stdout-only' : 'stdout-and-file',
    },
  };

  const historyPayload = {
    generatedAt,
    reportName: 'benchmark-history',
    maxEntries: MAX_HISTORY_ENTRIES,
    history: historyEntries,
  };

  const trendCsvPayload = convertTrendTableToCsv(trendTable);
  const baseRerunInstructions = Array.isArray(reproducibilityProfile?.rerunInstructions)
    ? reproducibilityProfile.rerunInstructions
    : [];
  const baseCommandExamples = Array.isArray(reproducibilityProfile?.commandExamples)
    ? reproducibilityProfile.commandExamples
    : [];
  const rerunInstructions = appendUniqueTextValues(baseRerunInstructions, [
    'Run npm run benchmark:continuity to validate cross-agent memory hydration, privacy redaction, and token-savings behavior.',
  ]);
  const commandExamples = appendUniqueTextValues(baseCommandExamples, [
    'npm run benchmark:continuity',
    'node ./scripts/memory-continuity-benchmark.mjs --stdout-only',
  ]);

  const evidenceBundleReport = {
    generatedAt,
    reportName: 'benchmark-evidence-bundle',
    phase: 'v2.5.2',
    releaseVersion,
    passed: failureCount === 0,
    failureCount,
    methodology: {
      deterministicRuntime: reproducibilityProfile?.deterministicRuntime || null,
      scenarioCount: Array.isArray(reproducibilityProfile?.scenarios) ? reproducibilityProfile.scenarios.length : 0,
      commandCount: commandExamples.length,
    },
    rerunInstructions,
    commandExamples,
    rawInputs: {
      scenarios: Array.isArray(reproducibilityProfile?.scenarios) ? reproducibilityProfile.scenarios : [],
      benchmarkThresholds: thresholdConfiguration,
      benchmarkWatchlist: {
        retired: true,
        reason: 'Static external benchmark watchlists were removed to avoid stale or biasing research inputs.',
      },
      memorySchema: memorySchemaConfiguration,
      memoryAdapterContract: memoryAdapterContractConfiguration,
    },
    rubric: buildRubricSummary(
      thresholdConfiguration,
      benchmarkIntelligenceExecution.parsedReport,
      memoryContinuityExecution.parsedReport
    ),
    bugIndicators,
    reliabilitySignals,
    securityIndicators,
    releaseDelta,
    history: historyEntries,
    trendReport,
    outputs: {
      detectionBenchmark: detectionBenchmarkExecution.parsedReport,
      benchmarkGate: benchmarkGateExecution.parsedReport,
      benchmarkIntelligence: benchmarkIntelligenceExecution.parsedReport,
      memoryContinuityBenchmark: memoryContinuityExecution.parsedReport,
    },
    executions: executionSummaries,
  };

  if (!isStdoutOnlyMode) {
    await fs.mkdir(join(REPOSITORY_ROOT, '.agent-context', 'state'), { recursive: true });
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(evidenceBundleReport, null, 2) + '\n', 'utf8');
    await fs.writeFile(HISTORY_OUTPUT_PATH, JSON.stringify(historyPayload, null, 2) + '\n', 'utf8');
    await fs.writeFile(TREND_JSON_OUTPUT_PATH, JSON.stringify(trendReport, null, 2) + '\n', 'utf8');
    await fs.writeFile(TREND_CSV_OUTPUT_PATH, trendCsvPayload, 'utf8');
  }

  console.log(JSON.stringify(evidenceBundleReport, null, 2));
  process.exit(evidenceBundleReport.passed ? 0 : 1);
}

runBenchmarkEvidenceBundle();
