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
    assert.match(compatibilityCoverageResult.details, /retired in V3 purge mode/);

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

    const documentationBoundaryDiagnosticsResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'documentation-boundary-diagnostics-machine-readable'
    );
    assert.ok(documentationBoundaryDiagnosticsResult);
    assert.equal(documentationBoundaryDiagnosticsResult.passed, true);

    const autoDocsScopePhaseOneResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'auto-docs-sync-scope-phase1'
    );
    assert.ok(autoDocsScopePhaseOneResult);
    assert.equal(autoDocsScopePhaseOneResult.passed, true);

    const autoDocsRolloutMetricsResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'auto-docs-sync-rollout-metrics'
    );
    assert.ok(autoDocsRolloutMetricsResult);
    assert.equal(autoDocsRolloutMetricsResult.passed, true);

    const contextTriggeredAuditResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'context-triggered-audit'
    );
    assert.ok(contextTriggeredAuditResult);
    assert.equal(contextTriggeredAuditResult.passed, true);

    const contextTriggeredStrictModeResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'context-triggered-strict-mode-auto'
    );
    assert.ok(contextTriggeredStrictModeResult);
    assert.equal(contextTriggeredStrictModeResult.passed, true);

    const contextTriggeredHardRuleResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'context-triggered-security-performance-hard-rule'
    );
    assert.ok(contextTriggeredHardRuleResult);
    assert.equal(contextTriggeredHardRuleResult.passed, true);

    const rulesGuardianAuditResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'rules-guardian-audit'
    );
    assert.ok(rulesGuardianAuditResult);
    assert.equal(rulesGuardianAuditResult.passed, true);

    const rulesGuardianSessionHandoffResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'rules-guardian-session-handoff'
    );
    assert.ok(rulesGuardianSessionHandoffResult);
    assert.equal(rulesGuardianSessionHandoffResult.passed, true);

    const rulesGuardianConfirmationPolicyResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'rules-guardian-confirmation-policy'
    );
    assert.ok(rulesGuardianConfirmationPolicyResult);
    assert.equal(rulesGuardianConfirmationPolicyResult.passed, true);

    const rulesGuardianDriftConfirmationResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'rules-guardian-drift-confirmation'
    );
    assert.ok(rulesGuardianDriftConfirmationResult);
    assert.equal(rulesGuardianDriftConfirmationResult.passed, true);

    const explainOnDemandAuditResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'explain-on-demand-audit'
    );
    assert.ok(explainOnDemandAuditResult);
    assert.equal(explainOnDemandAuditResult.passed, true);

    const explainOnDemandDefaultHiddenResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'explain-on-demand-default-hidden-state'
    );
    assert.ok(explainOnDemandDefaultHiddenResult);
    assert.equal(explainOnDemandDefaultHiddenResult.passed, true);

    const explainOnDemandExplicitRequestGateResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'explain-on-demand-explicit-request-gate'
    );
    assert.ok(explainOnDemandExplicitRequestGateResult);
    assert.equal(explainOnDemandExplicitRequestGateResult.passed, true);

    const explainOnDemandDiagnosticExplainabilityResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'explain-on-demand-diagnostic-explainability'
    );
    assert.ok(explainOnDemandDiagnosticExplainabilityResult);
    assert.equal(explainOnDemandDiagnosticExplainabilityResult.passed, true);

    const explainOnDemandHardRuleResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'explain-on-demand-hard-rule'
    );
    assert.ok(explainOnDemandHardRuleResult);
    assert.equal(explainOnDemandHardRuleResult.passed, true);

    const singleSourceLazyLoadingAuditResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'single-source-lazy-loading-audit'
    );
    assert.ok(singleSourceLazyLoadingAuditResult);
    assert.equal(singleSourceLazyLoadingAuditResult.passed, true);

    const canonicalRuleSourceHardRuleResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'canonical-rule-source-hard-rule'
    );
    assert.ok(canonicalRuleSourceHardRuleResult);
    assert.equal(canonicalRuleSourceHardRuleResult.passed, true);

    const lazyRuleLoadingHardRuleResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'lazy-rule-loading-hard-rule'
    );
    assert.ok(lazyRuleLoadingHardRuleResult);
    assert.equal(lazyRuleLoadingHardRuleResult.passed, true);

    const noConflictingDuplicateRulesResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'no-conflicting-duplicate-rule-instructions'
    );
    assert.ok(noConflictingDuplicateRulesResult);
    assert.equal(noConflictingDuplicateRulesResult.passed, true);

    const architectureChecklistResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'architecture-review-checklist-coverage'
    );
    assert.ok(architectureChecklistResult);
    assert.equal(architectureChecklistResult.passed, true);

    const frontendAuditResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'frontend-usability-audit'
    );
    assert.ok(frontendAuditResult);
    assert.equal(frontendAuditResult.passed, true);

    const uiDesignJudgeAdvisoryResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'ui-design-judge-advisory'
    );
    assert.ok(uiDesignJudgeAdvisoryResult);
    assert.equal(uiDesignJudgeAdvisoryResult.passed, true);

    const uiDesignJudgePolicyResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'ui-design-judge-non-blocking-policy'
    );
    assert.ok(uiDesignJudgePolicyResult);
    assert.equal(uiDesignJudgePolicyResult.passed, true);

    const uiDesignJudgeHybridResult = releaseGateReport.results.find(
      (resultEntry) => resultEntry.checkName === 'ui-design-judge-hybrid-diagnostics'
    );
    assert.ok(uiDesignJudgeHybridResult);
    assert.equal(uiDesignJudgeHybridResult.passed, true);

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
    assert.equal(releaseGateReport.diagnostics?.documentationBoundaryAudit?.autoDocsSyncScope?.phase, 'phase-1');
    assert.equal(typeof releaseGateReport.diagnostics?.documentationBoundaryAudit?.rolloutMetrics?.precision, 'number');
    assert.equal(typeof releaseGateReport.diagnostics?.documentationBoundaryAudit?.rolloutMetrics?.recall, 'number');
    assert.equal(releaseGateReport.diagnostics?.contextTriggeredAudit?.auditName, 'context-triggered-audit');
    assert.equal(releaseGateReport.diagnostics?.contextTriggeredAudit?.strictAuditMode, true);
    assert.equal(releaseGateReport.diagnostics?.rulesGuardianAudit?.auditName, 'rules-guardian-audit');
    assert.equal(releaseGateReport.diagnostics?.rulesGuardianAudit?.sessionHandoff?.included, true);
    assert.equal(releaseGateReport.diagnostics?.explainOnDemandAudit?.auditName, 'explain-on-demand-audit');
    assert.equal(releaseGateReport.diagnostics?.explainOnDemandAudit?.responsePolicy?.defaultModeExposesStateInternals, false);
    assert.equal(releaseGateReport.diagnostics?.explainOnDemandAudit?.responsePolicy?.diagnosticRequiresExplicitRequest, true);
    assert.equal(releaseGateReport.diagnostics?.singleSourceLazyLoadingAudit?.auditName, 'single-source-lazy-loading-audit');
    assert.equal(releaseGateReport.diagnostics?.singleSourceLazyLoadingAudit?.canonicalSource?.enforced, true);
    assert.equal(releaseGateReport.diagnostics?.singleSourceLazyLoadingAudit?.lazyRuleLoading?.enforced, true);
    assert.equal(releaseGateReport.diagnostics?.uiDesignJudge?.auditName, 'ui-design-judge');
    assert.equal(releaseGateReport.diagnostics?.uiDesignJudge?.advisoryOnly, true);
    assert.equal(typeof releaseGateReport.diagnostics?.uiDesignJudge?.summary?.meaningfulDiffViewportCount, 'number');
    assert.equal(typeof releaseGateReport.diagnostics?.uiDesignJudge?.deterministicVisual?.reportPresent, 'boolean');
    assert.equal(typeof releaseGateReport.diagnostics?.uiDesignJudge?.semanticJudge?.skipped, 'boolean');
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
