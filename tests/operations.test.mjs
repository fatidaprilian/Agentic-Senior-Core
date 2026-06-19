import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

import {
  createActiveMemorySnapshot,
  validateActiveMemorySnapshot,
} from '../lib/cli/memory-continuity.mjs';
import { scoreAntiHaluFixtures } from '../benchmarks/anti-halu/lib/scorer.mjs';
import { runReflectionCitationAudit } from '../scripts/validate/audits/reflection-citations.mjs';
import { runCacheLayerContractAudit } from '../scripts/validate/audits/cache-layer-contract.mjs';

test('Operations Tests', async (t) => {

  await t.test('SBOM generator emits CycloneDX payload', () => {
    const sbomOutput = execSync(`node ${join(process.cwd(), 'scripts', 'generate-sbom.mjs')}`).toString();
    const sbomPayload = JSON.parse(sbomOutput);

    assert.equal(sbomPayload.bomFormat, 'CycloneDX');
    assert.equal(sbomPayload.specVersion, '1.5');
    assert.ok(sbomPayload.metadata?.component?.name);
    assert.ok(Array.isArray(sbomPayload.components));
  });

  await t.test('benchmark gate outputs machine-readable report', () => {
    const benchmarkGateOutput = execSync(`node ${join(process.cwd(), 'scripts', 'benchmark-gate.mjs')}`).toString();
    const benchmarkGateReport = JSON.parse(benchmarkGateOutput);

    assert.equal(benchmarkGateReport.gateName, 'benchmark-gate');
    assert.equal(typeof benchmarkGateReport.passed, 'boolean');
    assert.ok(Array.isArray(benchmarkGateReport.results));
    assert.ok(benchmarkGateReport.results.length >= 2);
  });

  await t.test('benchmark intelligence outputs machine-readable report', () => {
    const benchmarkIntelligenceOutput = execSync(`node ${join(process.cwd(), 'scripts', 'benchmark-intelligence.mjs')}`).toString();
    const benchmarkIntelligenceReport = JSON.parse(benchmarkIntelligenceOutput);

    assert.equal(benchmarkIntelligenceReport.reportName, 'benchmark-intelligence');
    assert.equal(typeof benchmarkIntelligenceReport.passed, 'boolean');
    assert.equal(benchmarkIntelligenceReport.staticExternalWatchlistRetired, true);
    assert.ok(Array.isArray(benchmarkIntelligenceReport.watchlist));
    assert.equal(benchmarkIntelligenceReport.watchlist.length, 0);
  });

  await t.test('benchmark evidence bundle outputs machine-readable report', () => {
    const benchmarkEvidenceBundleOutput = execSync(`node ${join(process.cwd(), 'scripts', 'benchmark-evidence-bundle.mjs')} --stdout-only`).toString();
    const benchmarkEvidenceBundleReport = JSON.parse(benchmarkEvidenceBundleOutput);

    assert.equal(benchmarkEvidenceBundleReport.reportName, 'benchmark-evidence-bundle');
    assert.equal(typeof benchmarkEvidenceBundleReport.passed, 'boolean');
    assert.equal(typeof benchmarkEvidenceBundleReport.releaseVersion, 'string');
    assert.ok(Array.isArray(benchmarkEvidenceBundleReport.commandExamples));
    assert.ok(Array.isArray(benchmarkEvidenceBundleReport.rerunInstructions));
    assert.ok(Array.isArray(benchmarkEvidenceBundleReport.rawInputs.scenarios));
    assert.ok(Array.isArray(benchmarkEvidenceBundleReport.executions));
    assert.ok(benchmarkEvidenceBundleReport.executions.length >= 3);
    assert.ok(Array.isArray(benchmarkEvidenceBundleReport.history));
    assert.ok(benchmarkEvidenceBundleReport.history.length >= 1);

    assert.equal(typeof benchmarkEvidenceBundleReport.reliabilitySignals.passed, 'boolean');
    assert.ok(Array.isArray(benchmarkEvidenceBundleReport.reliabilitySignals.checks));
    assert.equal(typeof benchmarkEvidenceBundleReport.bugIndicators.incorrectDetectionRate, 'number');

    assert.equal(typeof benchmarkEvidenceBundleReport.securityIndicators.forbiddenContent.passed, 'boolean');
    assert.equal(typeof benchmarkEvidenceBundleReport.securityIndicators.vulnerabilityScan.isAvailable, 'boolean');

    assert.equal(benchmarkEvidenceBundleReport.trendReport.reportName, 'benchmark-trend-report');
    assert.ok(Array.isArray(benchmarkEvidenceBundleReport.trendReport.trendTable));
    assert.ok(Array.isArray(benchmarkEvidenceBundleReport.trendReport.chartSeries.top1Accuracy));
    assert.equal(benchmarkEvidenceBundleReport.outputs.memoryContinuityBenchmark.reportName, 'memory-continuity-benchmark');
  });

  await t.test('memory continuity benchmark outputs machine-readable report', () => {
    const continuityOutput = execSync(`node ${join(process.cwd(), 'scripts', 'memory-continuity-benchmark.mjs')} --stdout-only`).toString();
    const continuityReport = JSON.parse(continuityOutput);

    assert.equal(continuityReport.reportName, 'memory-continuity-benchmark');
    assert.equal(typeof continuityReport.passed, 'boolean');
    assert.equal(typeof continuityReport.continuitySummary.averageRelevantRecall, 'number');
    assert.equal(typeof continuityReport.continuitySummary.averageSessionStartTokenSavingsPercent, 'number');
    assert.equal(typeof continuityReport.adapterCoverage.passed, 'boolean');
    assert.ok(Array.isArray(continuityReport.adapterCoverage.requiredAdapterIds));
    assert.ok(Array.isArray(continuityReport.scenarios));
    assert.ok(continuityReport.scenarios.length >= 3);
    assert.ok(Array.isArray(continuityReport.checks));
  });

  await t.test('active memory snapshot validation rejects secrets and raw-log persistence', () => {
    const activeMemorySnapshot = createActiveMemorySnapshot({ projectName: 'demo-project' });
    assert.deepEqual(validateActiveMemorySnapshot(activeMemorySnapshot), []);

    const unsafeSnapshot = {
      ...activeMemorySnapshot,
      progress: {
        ...activeMemorySnapshot.progress,
        pendingIssues: [
          'Investigate deployment failure with token=abc123',
        ],
      },
      privacy: {
        ...activeMemorySnapshot.privacy,
        storeRawChatLogs: true,
      },
    };

    const validationErrors = validateActiveMemorySnapshot(unsafeSnapshot);
    assert.ok(validationErrors.some((validationError) => validationError.includes('secret-like')));
    assert.ok(validationErrors.some((validationError) => validationError.includes('storeRawChatLogs')));
  });

  await t.test('ui rubric calibration outputs machine-readable report', () => {
    const calibrationOutput = execSync(`node ${join(process.cwd(), 'scripts', 'ui-rubric-calibration.mjs')}`).toString();
    const calibrationReport = JSON.parse(calibrationOutput);

    assert.equal(calibrationReport.reportName, 'ui-rubric-calibration');
    assert.equal(calibrationReport.passed, true);
    assert.equal(calibrationReport.failureCount, 0);
    assert.equal(typeof calibrationReport.accuracyPercent, 'number');
    assert.ok(Array.isArray(calibrationReport.results));
    assert.ok(calibrationReport.results.length >= 5);
  });

  await t.test('benchmark writer-judge matrix outputs machine-readable report', () => {
    const writerJudgeOutput = execSync(`node ${join(process.cwd(), 'scripts', 'benchmark-writer-judge-matrix.mjs')} --stdout-only`).toString();
    const writerJudgeReport = JSON.parse(writerJudgeOutput);

    assert.equal(writerJudgeReport.reportName, 'benchmark-writer-judge-matrix');
    assert.equal(typeof writerJudgeReport.passed, 'boolean');
    assert.equal(typeof writerJudgeReport.methodology.blindReviewMode, 'boolean');
    assert.ok(Array.isArray(writerJudgeReport.writerDirectory));
    assert.ok(Array.isArray(writerJudgeReport.comparisonMatrix));
    assert.ok(writerJudgeReport.comparisonMatrix.length >= 1);
    assert.equal(typeof writerJudgeReport.summary.passRatePercent, 'number');
  });

  await t.test('token optimization benchmark outputs machine-readable report', () => {
    const tokenBenchmarkOutput = execSync(`node ${join(process.cwd(), 'scripts', 'token-optimization-benchmark.mjs')} --stdout-only`).toString();
    const tokenBenchmarkReport = JSON.parse(tokenBenchmarkOutput);

    assert.equal(tokenBenchmarkReport.reportName, 'token-optimization-benchmark');
    assert.ok(Array.isArray(tokenBenchmarkReport.scenarios));
    assert.ok(tokenBenchmarkReport.scenarios.length >= 3);
    assert.equal(typeof tokenBenchmarkReport.summary.averageNativeSavingsPercent, 'number');
  });

  await t.test('cache layer contract audit outputs machine-readable report', () => {
    const cacheLayerAuditReport = runCacheLayerContractAudit();

    assert.equal(cacheLayerAuditReport.auditName, 'audit-cache-layer-contract');
    assert.equal(cacheLayerAuditReport.passed, true);
    assert.equal(cacheLayerAuditReport.violationCount, 0);
    assert.equal(cacheLayerAuditReport.providerCount, 6);
    assert.equal(cacheLayerAuditReport.fixtureCount, 10);
    assert.equal(cacheLayerAuditReport.resultCount, 120);
  });

  await t.test('reflection citation audit outputs machine-readable report', () => {
    const reflectionAuditReport = runReflectionCitationAudit();

    assert.equal(reflectionAuditReport.auditName, 'audit-reflection-citations');
    assert.equal(reflectionAuditReport.passed, true);
    assert.equal(reflectionAuditReport.violationCount, 0);
    assert.ok(reflectionAuditReport.knownRuleIdCount >= 1);
  });

  await t.test('reflection citation audit rejects unknown rule IDs', () => {
    const report = runReflectionCitationAudit({
      sourceOverrides: {
        'AGENTS.md': [
          '## Bounded Reflection',
          'REFLECTION',
          'Rules: FAKE-999',
          'Risk:',
          'Action:',
          'valid rule IDs',
          'hidden chain-of-thought',
        ].join('\n'),
      },
    });

    assert.equal(report.passed, false);
    assert.ok(report.violations.some((violation) => violation.kind === 'rule-id.unknown'));
  });

  await t.test('reflection citation audit rejects missing required snippets', () => {
    const report = runReflectionCitationAudit({
      sourceOverrides: {
        'AGENTS.md': 'No reflection contract here.',
      },
    });

    assert.equal(report.passed, false);
    assert.ok(report.violations.some((violation) => violation.kind === 'reflection.snippet-missing'));
  });


  await t.test('anti-halu scorer rejects fake rule IDs and unsupported claims', () => {
    const report = scoreAntiHaluFixtures([
      {
        id: 'negative-control',
        category: 'negative_control',
        risk: 'Synthetic failure control for the offline scorer.',
        candidateResponse: 'This is compliant with FAKE-999 and 100% guaranteed to be correct.',
        expectations: {
          requiresRuleCitation: true,
          expectedRuleIds: ['ARCH-005'],
          requiresRefusal: false,
          requiresCompliantAlternative: false,
        },
      },
    ]);

    assert.equal(report.passedCount, 0);
    assert.equal(report.failureCategories.rule_id_missing, 1);
    assert.equal(report.failureCategories.rule_id_unknown, 1);
    assert.ok(report.failureCategories.unsupported_claim >= 1);
  });

  await t.test('quality trend report outputs machine-readable report', () => {
    const qualityTrendOutput = execSync(`node ${join(process.cwd(), 'scripts', 'quality-trend-report.mjs')} --stdout-only`).toString();
    const qualityTrendReport = JSON.parse(qualityTrendOutput);

    assert.equal(qualityTrendReport.reportName, 'quality-trend-report');
    assert.equal(typeof qualityTrendReport.governanceHealth.gatePassRatePercent, 'number');
    assert.ok(Array.isArray(qualityTrendReport.governanceHealth.gateSummaries));
    assert.ok(Array.isArray(qualityTrendReport.rejectionCategories));
    assert.equal(typeof qualityTrendReport.rollbackSignals.windowDays, 'number');
    assert.equal(typeof qualityTrendReport.tokenEfficiency.isAvailable, 'boolean');
    assert.ok(Array.isArray(qualityTrendReport.history));
  });

  await t.test('docs quality drift report outputs machine-readable report', () => {
    const docsQualityOutput = execSync(`node ${join(process.cwd(), 'scripts', 'docs-quality-drift-report.mjs')} --stdout-only`).toString();
    const docsQualityReport = JSON.parse(docsQualityOutput);

    assert.equal(docsQualityReport.reportName, 'docs-quality-drift-report');
    assert.equal(typeof docsQualityReport.passed, 'boolean');
    assert.equal(typeof docsQualityReport.summary.documentCount, 'number');
    assert.equal(typeof docsQualityReport.summary.qualityScore, 'number');
    assert.equal(typeof docsQualityReport.summary.averageWordsPerSentence, 'number');
    assert.ok(Array.isArray(docsQualityReport.fileSummaries));
    assert.ok(Array.isArray(docsQualityReport.history));
  });

  await t.test('weekly governance report outputs machine-readable report', () => {
    const weeklyGovernanceOutput = execSync(`node ${join(process.cwd(), 'scripts', 'governance-weekly-report.mjs')} --stdout-only`).toString();
    const weeklyGovernanceReport = JSON.parse(weeklyGovernanceOutput);

    assert.equal(weeklyGovernanceReport.reportName, 'weekly-governance-report');
    assert.equal(typeof weeklyGovernanceReport.releaseReadiness.isReady, 'boolean');
    assert.ok(Array.isArray(weeklyGovernanceReport.releaseReadiness.blockers));
    assert.equal(typeof weeklyGovernanceReport.governanceSurfaceTrust.allRequiredVerified, 'boolean');
    assert.ok(Array.isArray(weeklyGovernanceReport.governanceSurfaceTrust.domains));
    assert.equal(weeklyGovernanceReport.backendGovernance.status, 'verified');
    assert.ok(Array.isArray(weeklyGovernanceReport.backendGovernance.coverage));
    assert.ok(weeklyGovernanceReport.backendGovernance.coverage.length >= 8);
    assert.match(weeklyGovernanceReport.backendGovernance.coverage.map((coverageEntry) => coverageEntry.constraint).join(' '), /Global backend\/API rule routing/);
    assert.equal(typeof weeklyGovernanceReport.backendGovernance.verifiedSurfaceCount, 'number');
    assert.equal(typeof weeklyGovernanceReport.commitSignals.windowDays, 'number');
    assert.ok(Array.isArray(weeklyGovernanceReport.history));
  });
});
