import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

test('Enterprise Operations Tests', async (t) => {
  await t.test('release gate outputs machine-readable report', () => {
    const releaseGateOutput = execSync(`node ${join(process.cwd(), 'scripts', 'release-gate.mjs')}`).toString();
    const releaseGateReport = JSON.parse(releaseGateOutput);

    assert.equal(releaseGateReport.gateName, 'release-gate');
    assert.equal(releaseGateReport.passed, true);
    assert.equal(releaseGateReport.failureCount, 0);
    assert.ok(Array.isArray(releaseGateReport.results));
    assert.ok(releaseGateReport.results.length >= 6);

    const compatibilityCoverageResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'compatibility-manifest-coverage'
    );
    assert.ok(compatibilityCoverageResult);
    assert.equal(compatibilityCoverageResult.passed, true);

    const backendRuleCoverageResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'backend-universal-principles-rule-coverage'
    );
    assert.ok(backendRuleCoverageResult);
    assert.equal(backendRuleCoverageResult.passed, true);

    const backendChecklistCoverageResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'backend-universal-principles-checklist-coverage'
    );
    assert.ok(backendChecklistCoverageResult);
    assert.equal(backendChecklistCoverageResult.passed, true);

    const backendRefactorGuidanceCoverageResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'backend-universal-principles-refactor-guidance-coverage'
    );
    assert.ok(backendRefactorGuidanceCoverageResult);
    assert.equal(backendRefactorGuidanceCoverageResult.passed, true);

    const documentationBoundaryAuditResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'documentation-boundary-audit'
    );
    assert.ok(documentationBoundaryAuditResult);
    assert.equal(documentationBoundaryAuditResult.passed, true);

    const documentationBoundaryHardRuleResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'documentation-boundary-hard-rule'
    );
    assert.ok(documentationBoundaryHardRuleResult);
    assert.equal(documentationBoundaryHardRuleResult.passed, true);

    const frontendParityChecklistResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'frontend-parity-checklist-coverage'
    );
    assert.ok(frontendParityChecklistResult);
    assert.equal(frontendParityChecklistResult.passed, true);

    const frontendAuditResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'frontend-usability-audit'
    );
    assert.ok(frontendAuditResult);
    assert.equal(frontendAuditResult.passed, true);

    const frontendExcellenceRubricResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'frontend-excellence-rubric-coverage'
    );
    assert.ok(frontendExcellenceRubricResult);
    assert.equal(frontendExcellenceRubricResult.passed, true);

    const benchmarkThresholdGateResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'benchmark-threshold-gate'
    );
    assert.ok(benchmarkThresholdGateResult);
    assert.equal(benchmarkThresholdGateResult.passed, true);

    const benchmarkRegressionBlockResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'benchmark-regression-block'
    );
    assert.ok(benchmarkRegressionBlockResult);
    assert.equal(benchmarkRegressionBlockResult.passed, true);

    assert.equal(typeof releaseGateReport.diagnostics, 'object');
    assert.equal(releaseGateReport.diagnostics?.benchmarkGate?.gateName, 'benchmark-gate');
    assert.equal(releaseGateReport.diagnostics?.benchmarkGate?.passed, true);
  });

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
    assert.ok(Array.isArray(benchmarkIntelligenceReport.watchlist));
    assert.ok(benchmarkIntelligenceReport.watchlist.length >= 3);
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
    assert.equal(typeof weeklyGovernanceReport.skillTrust.allRequiredVerified, 'boolean');
    assert.ok(Array.isArray(weeklyGovernanceReport.skillTrust.domains));
    assert.equal(typeof weeklyGovernanceReport.commitSignals.windowDays, 'number');
    assert.ok(Array.isArray(weeklyGovernanceReport.history));
  });
});
