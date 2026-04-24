// @ts-check

import { execFileSync } from 'node:child_process';
import {
  AUTO_DOCS_SYNC_SCOPE_BOUNDARIES,
  AUTO_DOCS_SYNC_SCOPE_PHASE,
  BENCHMARK_GATE_SCRIPT_PATH,
  CONTEXT_TRIGGERED_AUDIT_SCRIPT_PATH,
  DOCUMENTATION_BOUNDARY_AUDIT_SCRIPT_PATH,
  EXPLAIN_ON_DEMAND_AUDIT_SCRIPT_PATH,
  FRONTEND_AUDIT_SCRIPT_PATH,
  REPOSITORY_ROOT,
  RULES_GUARDIAN_AUDIT_SCRIPT_PATH,
  SINGLE_SOURCE_LAZY_LOADING_AUDIT_SCRIPT_PATH,
  UI_DESIGN_JUDGE_SCRIPT_PATH,
} from './constants.mjs';
import { pushResult, runMachineReadableScript } from './runtime.mjs';

export function runAuditReleaseChecks(results, diagnostics) {
  const documentationBoundaryAuditExecution = runMachineReadableScript(DOCUMENTATION_BOUNDARY_AUDIT_SCRIPT_PATH);
  if (!documentationBoundaryAuditExecution.report) {
    const failureDetails = documentationBoundaryAuditExecution.executionErrorMessage
      ? `Documentation boundary audit execution failed before producing a machine-readable report: ${documentationBoundaryAuditExecution.executionErrorMessage}`
      : 'Documentation boundary audit did not produce machine-readable JSON output';
    pushResult(results, false, 'documentation-boundary-audit', failureDetails);
  } else {
    diagnostics.documentationBoundaryAudit = documentationBoundaryAuditExecution.report;
    pushResult(
      results,
      true,
      'documentation-boundary-audit',
      `documentation-boundary-audit executed (passed=${documentationBoundaryAuditExecution.report.passed}, failures=${documentationBoundaryAuditExecution.report.failureCount})`
    );

    const hasMachineReadableBoundaryDiagnostics = typeof documentationBoundaryAuditExecution.report?.reportVersion === 'string'
      && Array.isArray(documentationBoundaryAuditExecution.report?.boundaryResults)
      && Array.isArray(documentationBoundaryAuditExecution.report?.violations)
      && documentationBoundaryAuditExecution.report.boundaryResults.every((boundaryResult) => (
        typeof boundaryResult?.boundaryName === 'string'
        && typeof boundaryResult?.requirement === 'string'
        && Array.isArray(boundaryResult?.expectedDocumentationPaths)
        && Array.isArray(boundaryResult?.requiredActions)
      ));

    if (hasMachineReadableBoundaryDiagnostics) {
      pushResult(
        results,
        true,
        'documentation-boundary-diagnostics-machine-readable',
        `Boundary diagnostics are machine-readable and actionable (reportVersion=${documentationBoundaryAuditExecution.report.reportVersion})`
      );
    } else {
      pushResult(
        results,
        false,
        'documentation-boundary-diagnostics-machine-readable',
        'Documentation boundary diagnostics are missing required machine-readable actionable fields'
      );
    }

    const reportScope = documentationBoundaryAuditExecution.report?.autoDocsSyncScope;
    const explicitBoundaries = Array.isArray(reportScope?.explicitBoundaries)
      ? reportScope.explicitBoundaries
      : [];
    const isPhaseOneScopeBounded = reportScope?.phase === AUTO_DOCS_SYNC_SCOPE_PHASE
      && reportScope?.bounded === true
      && AUTO_DOCS_SYNC_SCOPE_BOUNDARIES.every((boundaryName) => explicitBoundaries.includes(boundaryName));

    if (isPhaseOneScopeBounded) {
      pushResult(
        results,
        true,
        'auto-docs-sync-scope-phase1',
        `Auto-doc sync scope is explicitly bounded to phase-1 boundaries (${explicitBoundaries.join(', ')})`
      );
    } else {
      pushResult(
        results,
        false,
        'auto-docs-sync-scope-phase1',
        'Auto-doc sync scope is missing explicit phase-1 boundary metadata'
      );
    }

    const rolloutMetrics = documentationBoundaryAuditExecution.report?.rolloutMetrics;
    const hasValidPrecision = typeof rolloutMetrics?.precision === 'number'
      && rolloutMetrics.precision >= 0
      && rolloutMetrics.precision <= 1;
    const hasValidRecall = typeof rolloutMetrics?.recall === 'number'
      && rolloutMetrics.recall >= 0
      && rolloutMetrics.recall <= 1;
    const hasTimestampedEvidence = typeof rolloutMetrics?.measuredAt === 'string'
      && rolloutMetrics.measuredAt.length > 0;

    if (hasValidPrecision && hasValidRecall && hasTimestampedEvidence) {
      pushResult(
        results,
        true,
        'auto-docs-sync-rollout-metrics',
        `Auto-doc sync rollout metrics are present (precision=${rolloutMetrics.precision.toFixed(4)}, recall=${rolloutMetrics.recall.toFixed(4)})`
      );
    } else {
      pushResult(
        results,
        false,
        'auto-docs-sync-rollout-metrics',
        'Auto-doc sync rollout metrics are missing precision/recall or timestamped evidence'
      );
    }

    if (documentationBoundaryAuditExecution.report.passed === true) {
      pushResult(results, true, 'documentation-boundary-hard-rule', 'Documentation hard-rule passed for all triggered boundaries');
    } else {
      const failedDocumentationBoundaries = Array.isArray(documentationBoundaryAuditExecution.report.violations)
        ? documentationBoundaryAuditExecution.report.violations.map((violation) => {
          const failureCode = violation?.diagnosticCode || 'BOUNDARY_DOCS_SYNC_REQUIRED';
          const changedFiles = Array.isArray(violation?.changedFiles) && violation.changedFiles.length > 0
            ? violation.changedFiles.join(', ')
            : 'unknown-changed-files';
          const requiredAction = Array.isArray(violation?.requiredActions) && violation.requiredActions.length > 0
            ? violation.requiredActions[0]
            : 'Update matching boundary documentation in the same scope.';
          return `${failureCode} (${violation?.boundaryName || 'unknown-boundary'}): ${changedFiles}. Action: ${requiredAction}`;
        })
        : Array.isArray(documentationBoundaryAuditExecution.report.failures)
          ? documentationBoundaryAuditExecution.report.failures
          : [];
      const failureSummary = failedDocumentationBoundaries.length > 0
        ? failedDocumentationBoundaries.join('; ')
        : '';
      pushResult(
        results,
        false,
        'documentation-boundary-hard-rule',
        `Documentation hard-rule failed: ${failureSummary || 'Documentation boundary audit failed without boundary failure details'}`
      );
    }
  }

  const contextTriggeredAuditExecution = runMachineReadableScript(
    CONTEXT_TRIGGERED_AUDIT_SCRIPT_PATH,
    ['--workflow', 'pr-preparation']
  );
  if (!contextTriggeredAuditExecution.report) {
    const failureDetails = contextTriggeredAuditExecution.executionErrorMessage
      ? `Context-triggered audit execution failed before producing a machine-readable report: ${contextTriggeredAuditExecution.executionErrorMessage}`
      : 'Context-triggered audit did not produce machine-readable JSON output';
    pushResult(results, false, 'context-triggered-audit', failureDetails);
  } else {
    diagnostics.contextTriggeredAudit = contextTriggeredAuditExecution.report;
    pushResult(
      results,
      true,
      'context-triggered-audit',
      `context-triggered-audit executed (passed=${contextTriggeredAuditExecution.report.passed}, strict=${contextTriggeredAuditExecution.report.strictAuditMode}, failures=${contextTriggeredAuditExecution.report.failureCount})`
    );
    pushResult(
      results,
      contextTriggeredAuditExecution.report.strictAuditMode === true,
      'context-triggered-strict-mode-auto',
      contextTriggeredAuditExecution.report.strictAuditMode === true
        ? `Strict audit mode activated automatically for workflow=${contextTriggeredAuditExecution.report.workflow}`
        : `Strict audit mode was not activated for workflow=${contextTriggeredAuditExecution.report.workflow}`
    );
    pushResult(
      results,
      contextTriggeredAuditExecution.report.passed === true,
      'context-triggered-security-performance-hard-rule',
      contextTriggeredAuditExecution.report.passed === true
        ? 'Context-triggered security and performance audit hard-rule passed'
        : `Context-triggered audit failed: ${Array.isArray(contextTriggeredAuditExecution.report.failures) ? contextTriggeredAuditExecution.report.failures.join('; ') : 'Unknown context-triggered audit failures'}`
    );
  }

  const rulesGuardianAuditExecution = runMachineReadableScript(
    RULES_GUARDIAN_AUDIT_SCRIPT_PATH,
    ['--workflow', 'pr-preparation']
  );
  if (!rulesGuardianAuditExecution.report) {
    const failureDetails = rulesGuardianAuditExecution.executionErrorMessage
      ? `Rules guardian audit execution failed before producing a machine-readable report: ${rulesGuardianAuditExecution.executionErrorMessage}`
      : 'Rules guardian audit did not produce machine-readable JSON output';
    pushResult(results, false, 'rules-guardian-audit', failureDetails);
  } else {
    diagnostics.rulesGuardianAudit = rulesGuardianAuditExecution.report;
    pushResult(
      results,
      true,
      'rules-guardian-audit',
      `rules-guardian-audit executed (passed=${rulesGuardianAuditExecution.report.passed}, driftDetected=${rulesGuardianAuditExecution.report?.driftDetection?.driftDetected}, failures=${rulesGuardianAuditExecution.report.failureCount})`
    );

    const sessionHandoffSummary = rulesGuardianAuditExecution.report?.sessionHandoff?.contractSummary;
    const sessionHandoffIncluded = rulesGuardianAuditExecution.report?.sessionHandoff?.included === true
      && typeof sessionHandoffSummary === 'string'
      && sessionHandoffSummary.trim().length > 0;

    pushResult(
      results,
      sessionHandoffIncluded,
      'rules-guardian-session-handoff',
      sessionHandoffIncluded
        ? 'Session handoff includes active architecture contract summary'
        : 'Rules guardian report is missing session handoff architecture contract summary'
    );

    const requiresExplicitConfirmation = rulesGuardianAuditExecution.report?.confirmationPolicy?.requiresExplicitUserConfirmation === true;
    pushResult(
      results,
      requiresExplicitConfirmation,
      'rules-guardian-confirmation-policy',
      requiresExplicitConfirmation
        ? 'Direction change policy requires explicit user confirmation'
        : 'Rules guardian report does not enforce explicit user confirmation policy'
    );
    pushResult(
      results,
      rulesGuardianAuditExecution.report.passed === true,
      'rules-guardian-drift-confirmation',
      rulesGuardianAuditExecution.report.passed === true
        ? 'Rules guardian drift detection and confirmation checks passed'
        : `Rules guardian audit failed: ${Array.isArray(rulesGuardianAuditExecution.report.failures) ? rulesGuardianAuditExecution.report.failures.join('; ') : 'Unknown rules guardian audit failures'}`
    );
  }

  const explainOnDemandAuditExecution = runMachineReadableScript(
    EXPLAIN_ON_DEMAND_AUDIT_SCRIPT_PATH,
    ['--mode', 'default', '--workflow', 'pr-preparation']
  );
  if (!explainOnDemandAuditExecution.report) {
    const failureDetails = explainOnDemandAuditExecution.executionErrorMessage
      ? `Explain-on-demand audit execution failed before producing a machine-readable report: ${explainOnDemandAuditExecution.executionErrorMessage}`
      : 'Explain-on-demand audit did not produce machine-readable JSON output';
    pushResult(results, false, 'explain-on-demand-audit', failureDetails);
  } else {
    diagnostics.explainOnDemandAudit = explainOnDemandAuditExecution.report;
    pushResult(
      results,
      true,
      'explain-on-demand-audit',
      `explain-on-demand-audit executed (passed=${explainOnDemandAuditExecution.report.passed}, mode=${explainOnDemandAuditExecution.report.mode}, failures=${explainOnDemandAuditExecution.report.failureCount})`
    );

    const defaultHiddenStatePolicyPassed = explainOnDemandAuditExecution.report?.responsePolicy?.defaultModeExposesStateInternals === false
      && explainOnDemandAuditExecution.report?.defaultResponse?.containsStateInternals === false;
    pushResult(
      results,
      defaultHiddenStatePolicyPassed,
      'explain-on-demand-default-hidden-state',
      defaultHiddenStatePolicyPassed
        ? 'Default response mode hides unnecessary state-file internals'
        : 'Default response mode exposes state internals or visibility flags are inconsistent'
    );

    const diagnosticExplicitRequestPolicyPassed = explainOnDemandAuditExecution.report?.responsePolicy?.diagnosticRequiresExplicitRequest === true;
    pushResult(
      results,
      diagnosticExplicitRequestPolicyPassed,
      'explain-on-demand-explicit-request-gate',
      diagnosticExplicitRequestPolicyPassed
        ? 'State internals are gated behind explicit diagnostic request'
        : 'Explain-on-demand policy does not require explicit diagnostic request'
    );

    const diagnosticExplainabilityPassed = explainOnDemandAuditExecution.report?.diagnosticMode?.canExplainStateDecisions === true;
    pushResult(
      results,
      diagnosticExplainabilityPassed,
      'explain-on-demand-diagnostic-explainability',
      diagnosticExplainabilityPassed
        ? 'Diagnostic mode can explain relevant state decisions when requested'
        : 'Explain-on-demand audit cannot provide diagnostic state decision explanations'
    );

    pushResult(
      results,
      explainOnDemandAuditExecution.report.passed === true,
      'explain-on-demand-hard-rule',
      explainOnDemandAuditExecution.report.passed === true
        ? 'Explain-on-demand hard-rule passed'
        : `Explain-on-demand audit failed: ${Array.isArray(explainOnDemandAuditExecution.report.failures) ? explainOnDemandAuditExecution.report.failures.join('; ') : 'Unknown explain-on-demand audit failures'}`
    );
  }

  const singleSourceLazyLoadingAuditExecution = runMachineReadableScript(
    SINGLE_SOURCE_LAZY_LOADING_AUDIT_SCRIPT_PATH,
    ['--workflow', 'pr-preparation']
  );
  if (!singleSourceLazyLoadingAuditExecution.report) {
    const failureDetails = singleSourceLazyLoadingAuditExecution.executionErrorMessage
      ? `Single-source lazy-loading audit execution failed before producing a machine-readable report: ${singleSourceLazyLoadingAuditExecution.executionErrorMessage}`
      : 'Single-source lazy-loading audit did not produce machine-readable JSON output';
    pushResult(results, false, 'single-source-lazy-loading-audit', failureDetails);
  } else {
    diagnostics.singleSourceLazyLoadingAudit = singleSourceLazyLoadingAuditExecution.report;
    pushResult(
      results,
      true,
      'single-source-lazy-loading-audit',
      `single-source-lazy-loading-audit executed (passed=${singleSourceLazyLoadingAuditExecution.report.passed}, failures=${singleSourceLazyLoadingAuditExecution.report.failureCount})`
    );
    pushResult(
      results,
      singleSourceLazyLoadingAuditExecution.report?.canonicalSource?.enforced === true,
      'canonical-rule-source-hard-rule',
      singleSourceLazyLoadingAuditExecution.report?.canonicalSource?.enforced === true
        ? 'Canonical rule source is explicitly defined and enforced'
        : 'Canonical rule source enforcement failed in single-source lazy-loading audit'
    );
    pushResult(
      results,
      singleSourceLazyLoadingAuditExecution.report?.lazyRuleLoading?.enforced === true,
      'lazy-rule-loading-hard-rule',
      singleSourceLazyLoadingAuditExecution.report?.lazyRuleLoading?.enforced === true
        ? 'Language-specific guidance is loaded lazily by detected scope'
        : 'Lazy rule loading enforcement failed in single-source lazy-loading audit'
    );
    pushResult(
      results,
      singleSourceLazyLoadingAuditExecution.report?.duplicationPolicy?.noConflictingDuplicates === true,
      'no-conflicting-duplicate-rule-instructions',
      singleSourceLazyLoadingAuditExecution.report?.duplicationPolicy?.noConflictingDuplicates === true
        ? 'No conflicting duplicate rule instructions detected in normal flow'
        : 'Conflicting duplicate rule instructions detected by single-source lazy-loading audit'
    );
  }

  try {
    const frontendAuditRawOutput = execFileSync('node', [FRONTEND_AUDIT_SCRIPT_PATH], {
      cwd: REPOSITORY_ROOT,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    });
    const frontendAuditReport = JSON.parse(frontendAuditRawOutput);
    pushResult(
      results,
      frontendAuditReport.passed === true,
      'frontend-usability-audit',
      frontendAuditReport.passed === true
        ? 'frontend-usability-audit report passed'
        : `frontend-usability-audit reported failures: ${Array.isArray(frontendAuditReport.failures) ? frontendAuditReport.failures.join('; ') : 'Unknown frontend audit failures'}`
    );
  } catch (frontendAuditError) {
    const frontendAuditErrorMessage = frontendAuditError instanceof Error
      ? frontendAuditError.message
      : 'Unknown frontend audit execution error';
    pushResult(results, false, 'frontend-usability-audit', `Failed to execute frontend usability audit: ${frontendAuditErrorMessage}`);
  }

  const uiDesignJudgeExecution = runMachineReadableScript(UI_DESIGN_JUDGE_SCRIPT_PATH);
  if (!uiDesignJudgeExecution.report) {
    const failureDetails = uiDesignJudgeExecution.executionErrorMessage
      ? `UI design judge execution failed before producing a machine-readable report: ${uiDesignJudgeExecution.executionErrorMessage}`
      : 'UI design judge did not produce machine-readable JSON output';
    pushResult(results, false, 'ui-design-judge-advisory', failureDetails);
  } else {
    diagnostics.uiDesignJudge = uiDesignJudgeExecution.report;
    pushResult(
      results,
      true,
      'ui-design-judge-advisory',
      `ui-design-judge executed (passed=${uiDesignJudgeExecution.report.passed}, skipped=${uiDesignJudgeExecution.report.skipped}, mode=${uiDesignJudgeExecution.report.mode})`
    );

    pushResult(
      results,
      uiDesignJudgeExecution.report.passed === true,
      'ui-design-judge-contract-hard-rule',
      uiDesignJudgeExecution.report.passed === true
        ? 'UI design judge contract hard-rule passed or no blocking auto-fail was triggered'
        : `UI design judge reported blocking design drift: ${Array.isArray(uiDesignJudgeExecution.report.findings)
          ? uiDesignJudgeExecution.report.findings
            .filter((finding) => finding?.blockingRecommended === true)
            .map((finding) => `${finding.area}: ${finding.problem}`)
            .join('; ') || 'blocking drift reported without detailed findings'
          : 'blocking drift reported without detailed findings'}`
    );

    pushResult(
      results,
      uiDesignJudgeExecution.report.advisoryOnly === true || uiDesignJudgeExecution.report.autoFailTriggered === true,
      'ui-design-judge-non-blocking-policy',
      uiDesignJudgeExecution.report.advisoryOnly === true
        ? 'UI design judge remains advisory by default when no auto-fail drift is detected'
        : 'UI design judge entered blocking-recommended mode because genericityAutoFail detected named drift'
    );

    const hasStructuredDesignDiagnostics = typeof uiDesignJudgeExecution.report?.summary?.designExecutionSignalCount === 'number'
      && typeof uiDesignJudgeExecution.report?.summary?.genericityStatus === 'string'
      && typeof uiDesignJudgeExecution.report?.designExecution?.policyPresent === 'boolean'
      && typeof uiDesignJudgeExecution.report?.designExecution?.contractReady === 'boolean'
      && typeof uiDesignJudgeExecution.report?.designExecution?.handoffPresent === 'boolean'
      && typeof uiDesignJudgeExecution.report?.designExecution?.handoffReady === 'boolean'
      && Array.isArray(uiDesignJudgeExecution.report?.designExecution?.missingHandoffArtifacts)
      && Array.isArray(uiDesignJudgeExecution.report?.designExecution?.semanticReviewFocus)
      && Array.isArray(uiDesignJudgeExecution.report?.designExecution?.missingCapabilities)
      && Array.isArray(uiDesignJudgeExecution.report?.rubric?.expectedDimensions)
      && Array.isArray(uiDesignJudgeExecution.report?.rubric?.breakdown)
      && typeof uiDesignJudgeExecution.report?.rubric?.genericityAssessment?.status === 'string'
      && typeof uiDesignJudgeExecution.report?.semanticJudge?.attempted === 'boolean'
      && typeof uiDesignJudgeExecution.report?.semanticJudge?.skipped === 'boolean';

    pushResult(
      results,
      hasStructuredDesignDiagnostics,
      'ui-design-judge-structured-diagnostics',
      hasStructuredDesignDiagnostics
        ? 'UI design judge reports structured design execution diagnostics and semantic-review state together'
        : 'UI design judge is missing structured design execution or semantic-review machine-readable fields'
    );
  }

  const benchmarkGateExecution = runMachineReadableScript(BENCHMARK_GATE_SCRIPT_PATH);
  if (!benchmarkGateExecution.report) {
    const failureDetails = benchmarkGateExecution.executionErrorMessage
      ? `Benchmark gate execution failed before producing a machine-readable report: ${benchmarkGateExecution.executionErrorMessage}`
      : 'Benchmark gate did not produce machine-readable JSON output';
    pushResult(results, false, 'benchmark-threshold-gate', failureDetails);
  } else {
    diagnostics.benchmarkGate = benchmarkGateExecution.report;
    pushResult(
      results,
      true,
      'benchmark-threshold-gate',
      `Benchmark threshold gate executed (passed=${benchmarkGateExecution.report.passed}, failures=${benchmarkGateExecution.report.failureCount})`
    );
    pushResult(
      results,
      benchmarkGateExecution.report.passed === true,
      'benchmark-regression-block',
      benchmarkGateExecution.report.passed === true
        ? 'Benchmark thresholds are healthy; release remains eligible'
        : `Benchmark threshold regression detected. ${Array.isArray(benchmarkGateExecution.report.results)
          ? benchmarkGateExecution.report.results
            .filter((benchmarkCheckResult) => !benchmarkCheckResult.passed)
            .map((benchmarkCheckResult) => `${benchmarkCheckResult.checkName}: ${benchmarkCheckResult.details}`)
            .join('; ') || 'Benchmark gate failed but did not report individual failed checks'
          : 'Benchmark gate failed but did not report individual failed checks'}`
    );
  }
}
