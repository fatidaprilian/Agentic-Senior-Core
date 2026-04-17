#!/usr/bin/env node

/**
 * release-gate.mjs
 *
 * Enterprise release gate for V1.8.
 * Produces machine-readable output for CI and fails fast on missing release evidence.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPOSITORY_ROOT = resolve(__dirname, '..');

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const NODE_MIN_PATTERN = /^\d+(\.\d+)?$/;
const SUPPORTED_COMPATIBILITY_PLATFORMS = new Set(['windows', 'linux', 'macos']);
const REQUIRED_SKILL_DOMAINS = [
  'backend',
  'frontend',
  'fullstack',
  'cli',
  'distribution',
  'review-quality',
];
const FRONTEND_PARITY_CHECKLIST_PATH = '.agent-context/review-checklists/frontend-skill-parity.md';
const FRONTEND_EXCELLENCE_RUBRIC_PATH = '.agent-context/review-checklists/frontend-excellence-rubric.md';
const FRONTEND_AUDIT_SCRIPT_PATH = 'scripts/frontend-usability-audit.mjs';
const DOCUMENTATION_BOUNDARY_AUDIT_SCRIPT_PATH = 'scripts/documentation-boundary-audit.mjs';
const CONTEXT_TRIGGERED_AUDIT_SCRIPT_PATH = 'scripts/context-triggered-audit.mjs';
const RULES_GUARDIAN_AUDIT_SCRIPT_PATH = 'scripts/rules-guardian-audit.mjs';
const EXPLAIN_ON_DEMAND_AUDIT_SCRIPT_PATH = 'scripts/explain-on-demand-audit.mjs';
const BACKEND_ARCHITECTURE_RULE_PATH = '.agent-context/rules/architecture.md';
const BACKEND_REVIEW_CHECKLIST_PATH = '.agent-context/review-checklists/pr-checklist.md';
const REFACTOR_PROMPT_PATH = '.agent-context/prompts/refactor.md';
const REQUIRED_FRONTEND_PARITY_SNIPPETS = [
  'Architecture and Composition',
  'Interaction and Motion',
  'Accessibility and Responsiveness',
  'UX Narrative and Conversion Clarity',
  'Release Evidence',
];
const REQUIRED_BACKEND_ARCHITECTURE_RULE_SNIPPETS = [
  'No clever hacks.',
  'No premature abstraction.',
  'Readability over brevity.',
  'backend and shared core modules',
];
const REQUIRED_BACKEND_REVIEW_CHECKLIST_SNIPPETS = [
  'No clever hacks in backend and shared core modules',
  'No premature abstraction (base classes/util layers created only after repeated stable patterns)',
  'Readability over brevity for maintainability',
];
const REQUIRED_REFACTOR_PROMPT_SNIPPETS = [
  'Enforce backend universal principles: no clever hacks, no premature abstraction, readability over brevity.',
  'Prioritize maintainability over compressed one-liners.',
];
const REQUIRED_FRONTEND_EXCELLENCE_RUBRIC_SNIPPETS = [
  'Visual Direction and Identity',
  'Typography Quality',
  'Color System Diversity and Contrast',
  'Interaction Choreography',
  'Language and Content Consistency',
  'Text Contrast and Collision Safety',
  'UX Narrative and Conversion Clarity',
  'Template Diversity and Originality',
  'Low-Diversity Template Output Policy',
  'Awwwards-level reference quality',
];
const BENCHMARK_GATE_SCRIPT_PATH = 'scripts/benchmark-gate.mjs';

function readText(relativeFilePath) {
  const absolutePath = resolve(REPOSITORY_ROOT, relativeFilePath);
  if (!existsSync(absolutePath)) {
    return '';
  }

  return readFileSync(absolutePath, 'utf8');
}

function pushResult(results, isPassed, checkName, details) {
  results.push({
    checkName,
    passed: isPassed,
    details,
  });
}

function parseMachineReadableReport(rawOutput) {
  if (typeof rawOutput !== 'string' || rawOutput.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(rawOutput);
  } catch {
    return null;
  }
}

function runMachineReadableScript(scriptRelativePath, scriptArguments = []) {
  try {
    const rawOutput = execFileSync('node', [scriptRelativePath, ...scriptArguments], {
      cwd: REPOSITORY_ROOT,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    });

    return {
      report: parseMachineReadableReport(rawOutput),
      executionErrorMessage: null,
    };
  } catch (scriptExecutionError) {
    const rawOutput = scriptExecutionError && typeof scriptExecutionError === 'object' && 'stdout' in scriptExecutionError
      ? String(scriptExecutionError.stdout ?? '')
      : '';
    const parsedReport = parseMachineReadableReport(rawOutput);
    const executionErrorMessage = scriptExecutionError instanceof Error
      ? scriptExecutionError.message
      : 'Unknown execution error';

    return {
      report: parsedReport,
      executionErrorMessage,
    };
  }
}

function validateCompatibilityManifestShape(parsedManifest, skillDomainName) {
  const validationErrors = [];

  if (!Array.isArray(parsedManifest.ides) || parsedManifest.ides.length === 0) {
    validationErrors.push(`Domain ${skillDomainName} must define non-empty ides[]`);
  }

  if (!Array.isArray(parsedManifest.platforms) || parsedManifest.platforms.length === 0) {
    validationErrors.push(`Domain ${skillDomainName} must define non-empty platforms[]`);
  } else {
    const unsupportedPlatformName = parsedManifest.platforms.find(
      (platformName) => !SUPPORTED_COMPATIBILITY_PLATFORMS.has(platformName)
    );

    if (unsupportedPlatformName) {
      validationErrors.push(`Domain ${skillDomainName} has unsupported platform: ${unsupportedPlatformName}`);
    }
  }

  if (typeof parsedManifest.nodeMin !== 'string' || !NODE_MIN_PATTERN.test(parsedManifest.nodeMin)) {
    validationErrors.push(`Domain ${skillDomainName} must define nodeMin as "18" or "18.0" style string`);
  }

  return validationErrors;
}

function runReleaseGate() {
  const results = [];
  const diagnostics = {};
  const packageJsonPath = 'package.json';
  const changelogPath = 'CHANGELOG.md';
  const roadmapPath = 'docs/roadmap.md';

  const packageJsonContent = readText(packageJsonPath);
  if (!packageJsonContent) {
    pushResult(results, false, 'package-json-exists', `Missing ${packageJsonPath}`);
  }

  let packageManifest = null;
  if (packageJsonContent) {
    try {
      packageManifest = JSON.parse(packageJsonContent);
      pushResult(results, true, 'package-json-parse', 'package.json is valid JSON');
    } catch (packageParseError) {
      const parseMessage = packageParseError instanceof Error ? packageParseError.message : 'Unknown parse error';
      pushResult(results, false, 'package-json-parse', `Cannot parse package.json: ${parseMessage}`);
    }
  }

  const releaseVersion = packageManifest?.version;
  if (!releaseVersion || !VERSION_PATTERN.test(releaseVersion)) {
    pushResult(results, false, 'version-semver', `Invalid package version: ${String(releaseVersion)}`);
  } else {
    pushResult(results, true, 'version-semver', `Version ${releaseVersion} matches x.y.z format`);
  }

  const changelogContent = readText(changelogPath);
  if (!changelogContent) {
    pushResult(results, false, 'changelog-exists', `Missing ${changelogPath}`);
  } else if (!releaseVersion) {
    pushResult(results, false, 'changelog-version-entry', 'Cannot check changelog because version is invalid');
  } else if (!changelogContent.includes(`## ${releaseVersion} - `)) {
    pushResult(results, false, 'changelog-version-entry', `Missing release header for ${releaseVersion} in CHANGELOG.md`);
  } else {
    pushResult(results, true, 'changelog-version-entry', `Found release header for ${releaseVersion}`);
  }

  const roadmapContent = readText(roadmapPath);
  if (!roadmapContent) {
    pushResult(results, false, 'roadmap-exists', `Missing ${roadmapPath}`);
  } else if (!roadmapContent.includes('V1.8')) {
    pushResult(results, false, 'roadmap-v18', 'Roadmap does not mention V1.8 release track');
  } else {
    pushResult(results, true, 'roadmap-v18', 'Roadmap includes V1.8 release track');
  }

  const requiredEnterpriseFiles = [
    '.agent-context/review-checklists/release-operations.md',
    'docs/v1.8-operations-playbook.md',
    '.github/workflows/release-gate.yml',
    '.github/workflows/sbom-compliance.yml',
    '.github/workflows/governance-weekly-report.yml',
    'scripts/governance-weekly-report.mjs',
  ];

  for (const requiredEnterpriseFile of requiredEnterpriseFiles) {
    const absoluteRequiredPath = resolve(REPOSITORY_ROOT, requiredEnterpriseFile);
    if (!existsSync(absoluteRequiredPath)) {
      pushResult(results, false, 'required-enterprise-file', `Missing ${requiredEnterpriseFile}`);
      continue;
    }

    pushResult(results, true, 'required-enterprise-file', `${requiredEnterpriseFile} is present`);
  }

  let validatedCompatibilityManifestCount = 0;

  for (const skillDomainName of REQUIRED_SKILL_DOMAINS) {
    const compatibilityManifestPath = `.agent-context/skills/${skillDomainName}/compatibility-manifest.json`;
    const compatibilityManifestContent = readText(compatibilityManifestPath);

    if (!compatibilityManifestContent) {
      pushResult(results, false, 'compatibility-manifest', `Missing ${compatibilityManifestPath}`);
      continue;
    }

    let parsedCompatibilityManifest;
    try {
      parsedCompatibilityManifest = JSON.parse(compatibilityManifestContent);
    } catch (compatibilityManifestParseError) {
      const parseErrorMessage = compatibilityManifestParseError instanceof Error
        ? compatibilityManifestParseError.message
        : 'Unknown parse error';
      pushResult(results, false, 'compatibility-manifest', `Invalid JSON in ${compatibilityManifestPath}: ${parseErrorMessage}`);
      continue;
    }

    const compatibilityValidationErrors = validateCompatibilityManifestShape(
      parsedCompatibilityManifest,
      skillDomainName
    );

    if (compatibilityValidationErrors.length > 0) {
      pushResult(results, false, 'compatibility-manifest', compatibilityValidationErrors.join('; '));
      continue;
    }

    validatedCompatibilityManifestCount += 1;
    pushResult(results, true, 'compatibility-manifest', `${compatibilityManifestPath} is valid`);
  }

  if (validatedCompatibilityManifestCount === REQUIRED_SKILL_DOMAINS.length) {
    pushResult(
      results,
      true,
      'compatibility-manifest-coverage',
      `Validated ${validatedCompatibilityManifestCount}/${REQUIRED_SKILL_DOMAINS.length} required skill compatibility manifests`
    );
  } else {
    pushResult(
      results,
      false,
      'compatibility-manifest-coverage',
      `Validated ${validatedCompatibilityManifestCount}/${REQUIRED_SKILL_DOMAINS.length} required skill compatibility manifests`
    );
  }

  const backendArchitectureRuleContent = readText(BACKEND_ARCHITECTURE_RULE_PATH);
  if (!backendArchitectureRuleContent) {
    pushResult(results, false, 'backend-universal-principles-rule-exists', `Missing ${BACKEND_ARCHITECTURE_RULE_PATH}`);
  } else {
    pushResult(results, true, 'backend-universal-principles-rule-exists', `${BACKEND_ARCHITECTURE_RULE_PATH} is present`);

    const missingBackendArchitectureRuleSnippets = REQUIRED_BACKEND_ARCHITECTURE_RULE_SNIPPETS.filter(
      (requiredSnippet) => !backendArchitectureRuleContent.includes(requiredSnippet)
    );

    if (missingBackendArchitectureRuleSnippets.length === 0) {
      pushResult(results, true, 'backend-universal-principles-rule-coverage', 'Backend universal rule snippets are complete');
    } else {
      pushResult(
        results,
        false,
        'backend-universal-principles-rule-coverage',
        `Missing backend universal rule snippets: ${missingBackendArchitectureRuleSnippets.join(', ')}`
      );
    }
  }

  const backendReviewChecklistContent = readText(BACKEND_REVIEW_CHECKLIST_PATH);
  if (!backendReviewChecklistContent) {
    pushResult(results, false, 'backend-universal-principles-checklist-exists', `Missing ${BACKEND_REVIEW_CHECKLIST_PATH}`);
  } else {
    pushResult(results, true, 'backend-universal-principles-checklist-exists', `${BACKEND_REVIEW_CHECKLIST_PATH} is present`);

    const missingBackendChecklistSnippets = REQUIRED_BACKEND_REVIEW_CHECKLIST_SNIPPETS.filter(
      (requiredSnippet) => !backendReviewChecklistContent.includes(requiredSnippet)
    );

    if (missingBackendChecklistSnippets.length === 0) {
      pushResult(results, true, 'backend-universal-principles-checklist-coverage', 'Backend review checklist snippets are complete');
    } else {
      pushResult(
        results,
        false,
        'backend-universal-principles-checklist-coverage',
        `Missing backend review checklist snippets: ${missingBackendChecklistSnippets.join(', ')}`
      );
    }
  }

  const refactorPromptContent = readText(REFACTOR_PROMPT_PATH);
  if (!refactorPromptContent) {
    pushResult(results, false, 'backend-universal-principles-refactor-guidance-exists', `Missing ${REFACTOR_PROMPT_PATH}`);
  } else {
    pushResult(results, true, 'backend-universal-principles-refactor-guidance-exists', `${REFACTOR_PROMPT_PATH} is present`);

    const missingRefactorPromptSnippets = REQUIRED_REFACTOR_PROMPT_SNIPPETS.filter(
      (requiredSnippet) => !refactorPromptContent.includes(requiredSnippet)
    );

    if (missingRefactorPromptSnippets.length === 0) {
      pushResult(results, true, 'backend-universal-principles-refactor-guidance-coverage', 'Backend refactor guidance snippets are complete');
    } else {
      pushResult(
        results,
        false,
        'backend-universal-principles-refactor-guidance-coverage',
        `Missing backend refactor guidance snippets: ${missingRefactorPromptSnippets.join(', ')}`
      );
    }
  }

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

    if (documentationBoundaryAuditExecution.report.passed === true) {
      pushResult(
        results,
        true,
        'documentation-boundary-hard-rule',
        'Documentation hard-rule passed for all triggered boundaries'
      );
    } else {
      const failedDocumentationBoundaries = Array.isArray(documentationBoundaryAuditExecution.report.failures)
        ? documentationBoundaryAuditExecution.report.failures
        : [];
      const failureSummary = failedDocumentationBoundaries.length > 0
        ? failedDocumentationBoundaries.join('; ')
        : 'Documentation boundary audit failed without boundary failure details';
      pushResult(
        results,
        false,
        'documentation-boundary-hard-rule',
        `Documentation hard-rule failed: ${failureSummary}`
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

    if (contextTriggeredAuditExecution.report.strictAuditMode === true) {
      pushResult(
        results,
        true,
        'context-triggered-strict-mode-auto',
        `Strict audit mode activated automatically for workflow=${contextTriggeredAuditExecution.report.workflow}`
      );
    } else {
      pushResult(
        results,
        false,
        'context-triggered-strict-mode-auto',
        `Strict audit mode was not activated for workflow=${contextTriggeredAuditExecution.report.workflow}`
      );
    }

    if (contextTriggeredAuditExecution.report.passed === true) {
      pushResult(
        results,
        true,
        'context-triggered-security-performance-hard-rule',
        'Context-triggered security and performance audit hard-rule passed'
      );
    } else {
      const failedAuditDetails = Array.isArray(contextTriggeredAuditExecution.report.failures)
        ? contextTriggeredAuditExecution.report.failures.join('; ')
        : 'Unknown context-triggered audit failures';
      pushResult(
        results,
        false,
        'context-triggered-security-performance-hard-rule',
        `Context-triggered audit failed: ${failedAuditDetails}`
      );
    }
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

    if (sessionHandoffIncluded) {
      pushResult(
        results,
        true,
        'rules-guardian-session-handoff',
        'Session handoff includes active architecture contract summary'
      );
    } else {
      pushResult(
        results,
        false,
        'rules-guardian-session-handoff',
        'Rules guardian report is missing session handoff architecture contract summary'
      );
    }

    const requiresExplicitConfirmation = rulesGuardianAuditExecution.report?.confirmationPolicy?.requiresExplicitUserConfirmation === true;

    if (requiresExplicitConfirmation) {
      pushResult(
        results,
        true,
        'rules-guardian-confirmation-policy',
        'Direction change policy requires explicit user confirmation'
      );
    } else {
      pushResult(
        results,
        false,
        'rules-guardian-confirmation-policy',
        'Rules guardian report does not enforce explicit user confirmation policy'
      );
    }

    if (rulesGuardianAuditExecution.report.passed === true) {
      pushResult(
        results,
        true,
        'rules-guardian-drift-confirmation',
        'Rules guardian drift detection and confirmation checks passed'
      );
    } else {
      const failedAuditDetails = Array.isArray(rulesGuardianAuditExecution.report.failures)
        ? rulesGuardianAuditExecution.report.failures.join('; ')
        : 'Unknown rules guardian audit failures';
      pushResult(
        results,
        false,
        'rules-guardian-drift-confirmation',
        `Rules guardian audit failed: ${failedAuditDetails}`
      );
    }
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

    if (defaultHiddenStatePolicyPassed) {
      pushResult(
        results,
        true,
        'explain-on-demand-default-hidden-state',
        'Default response mode hides unnecessary state-file internals'
      );
    } else {
      pushResult(
        results,
        false,
        'explain-on-demand-default-hidden-state',
        'Default response mode exposes state internals or visibility flags are inconsistent'
      );
    }

    const diagnosticExplicitRequestPolicyPassed = explainOnDemandAuditExecution.report?.responsePolicy?.diagnosticRequiresExplicitRequest === true;

    if (diagnosticExplicitRequestPolicyPassed) {
      pushResult(
        results,
        true,
        'explain-on-demand-explicit-request-gate',
        'State internals are gated behind explicit diagnostic request'
      );
    } else {
      pushResult(
        results,
        false,
        'explain-on-demand-explicit-request-gate',
        'Explain-on-demand policy does not require explicit diagnostic request'
      );
    }

    const diagnosticExplainabilityPassed = explainOnDemandAuditExecution.report?.diagnosticMode?.canExplainStateDecisions === true;

    if (diagnosticExplainabilityPassed) {
      pushResult(
        results,
        true,
        'explain-on-demand-diagnostic-explainability',
        'Diagnostic mode can explain relevant state decisions when requested'
      );
    } else {
      pushResult(
        results,
        false,
        'explain-on-demand-diagnostic-explainability',
        'Explain-on-demand audit cannot provide diagnostic state decision explanations'
      );
    }

    if (explainOnDemandAuditExecution.report.passed === true) {
      pushResult(
        results,
        true,
        'explain-on-demand-hard-rule',
        'Explain-on-demand hard-rule passed'
      );
    } else {
      const failedAuditDetails = Array.isArray(explainOnDemandAuditExecution.report.failures)
        ? explainOnDemandAuditExecution.report.failures.join('; ')
        : 'Unknown explain-on-demand audit failures';
      pushResult(
        results,
        false,
        'explain-on-demand-hard-rule',
        `Explain-on-demand audit failed: ${failedAuditDetails}`
      );
    }
  }

  const frontendParityChecklistContent = readText(FRONTEND_PARITY_CHECKLIST_PATH);
  if (!frontendParityChecklistContent) {
    pushResult(results, false, 'frontend-parity-checklist-exists', `Missing ${FRONTEND_PARITY_CHECKLIST_PATH}`);
  } else {
    pushResult(results, true, 'frontend-parity-checklist-exists', `${FRONTEND_PARITY_CHECKLIST_PATH} is present`);

    const missingFrontendParitySnippets = REQUIRED_FRONTEND_PARITY_SNIPPETS.filter(
      (requiredSnippet) => !frontendParityChecklistContent.includes(requiredSnippet)
    );

    if (missingFrontendParitySnippets.length === 0) {
      pushResult(results, true, 'frontend-parity-checklist-coverage', 'Frontend parity checklist sections are complete');
    } else {
      pushResult(
        results,
        false,
        'frontend-parity-checklist-coverage',
        `Missing frontend parity checklist sections: ${missingFrontendParitySnippets.join(', ')}`
      );
    }
  }

  const frontendExcellenceRubricContent = readText(FRONTEND_EXCELLENCE_RUBRIC_PATH);
  if (!frontendExcellenceRubricContent) {
    pushResult(results, false, 'frontend-excellence-rubric-exists', `Missing ${FRONTEND_EXCELLENCE_RUBRIC_PATH}`);
  } else {
    pushResult(results, true, 'frontend-excellence-rubric-exists', `${FRONTEND_EXCELLENCE_RUBRIC_PATH} is present`);

    const missingFrontendExcellenceSnippets = REQUIRED_FRONTEND_EXCELLENCE_RUBRIC_SNIPPETS.filter(
      (requiredSnippet) => !frontendExcellenceRubricContent.includes(requiredSnippet)
    );

    if (missingFrontendExcellenceSnippets.length === 0) {
      pushResult(results, true, 'frontend-excellence-rubric-coverage', 'Frontend excellence rubric sections are complete');
    } else {
      pushResult(
        results,
        false,
        'frontend-excellence-rubric-coverage',
        `Missing frontend excellence rubric sections: ${missingFrontendExcellenceSnippets.join(', ')}`
      );
    }
  }

  try {
    const frontendAuditRawOutput = execFileSync('node', [FRONTEND_AUDIT_SCRIPT_PATH], {
      cwd: REPOSITORY_ROOT,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    });
    const frontendAuditReport = JSON.parse(frontendAuditRawOutput);

    if (frontendAuditReport.passed === true) {
      pushResult(results, true, 'frontend-usability-audit', 'frontend-usability-audit report passed');
    } else {
      const failureDetails = Array.isArray(frontendAuditReport.failures)
        ? frontendAuditReport.failures.join('; ')
        : 'Unknown frontend audit failures';
      pushResult(results, false, 'frontend-usability-audit', `frontend-usability-audit reported failures: ${failureDetails}`);
    }
  } catch (frontendAuditError) {
    const frontendAuditErrorMessage = frontendAuditError instanceof Error
      ? frontendAuditError.message
      : 'Unknown frontend audit execution error';
    pushResult(results, false, 'frontend-usability-audit', `Failed to execute frontend usability audit: ${frontendAuditErrorMessage}`);
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

    if (benchmarkGateExecution.report.passed === true) {
      pushResult(results, true, 'benchmark-regression-block', 'Benchmark thresholds are healthy; release remains eligible');
    } else {
      const failedBenchmarkChecks = Array.isArray(benchmarkGateExecution.report.results)
        ? benchmarkGateExecution.report.results
          .filter((benchmarkCheckResult) => !benchmarkCheckResult.passed)
          .map((benchmarkCheckResult) => `${benchmarkCheckResult.checkName}: ${benchmarkCheckResult.details}`)
        : [];
      const failureSummary = failedBenchmarkChecks.length > 0
        ? failedBenchmarkChecks.join('; ')
        : 'Benchmark gate failed but did not report individual failed checks';
      pushResult(
        results,
        false,
        'benchmark-regression-block',
        `Benchmark threshold regression detected. ${failureSummary}`
      );
    }
  }

  const failureCount = results.filter((checkResult) => !checkResult.passed).length;
  const releaseGateReport = {
    generatedAt: new Date().toISOString(),
    gateName: 'release-gate',
    passed: failureCount === 0,
    failureCount,
    diagnostics,
    results,
  };

  console.log(JSON.stringify(releaseGateReport, null, 2));
  process.exit(releaseGateReport.passed ? 0 : 1);
}

runReleaseGate();
