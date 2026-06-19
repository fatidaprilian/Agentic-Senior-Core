#!/usr/bin/env node

// Phase 1 governance refactor completed: monolithic script split into modular sub-files.
/**
 * validate.mjs — Repository Integrity Validator
 *
 * Validates the Agentic-Senior-Core repository:
 * - Required files exist
 * - Markdown and JSON documents are readable
 * - Cross-references resolve from the correct source directory
 * - Version references stay consistent for release builds
 * - LLM Judge policy configuration is valid
 *
 * Usage: node scripts/validate.mjs
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALLOWED_SEVERITIES } from './validate/config.mjs';
import { runCacheLayerContractAudit } from './validate/audits/cache-layer-contract.mjs';
import { runCachingScopeHygieneAudit } from './validate/audits/caching-scope-hygiene.mjs';

import { runAuditFileSize } from './validate/audits/file-size.mjs';
import { runReflectionCitationAudit } from './validate/audits/reflection-citations.mjs';
import { runReleaseBundleAudit } from './validate/audits/release-bundle.mjs';
import { runRuleIdUniquenessAudit } from './validate/audits/rule-id-uniqueness.mjs';
import {
  validateDependencyFreshnessAutomationCoverage,
  validateDetectionTransparencyCoverage,
  validateDeterministicBoundaryEnforcementCoverage,
  validateDiagramFormatCoverage,
  validateDockerRuntimeAutomationCoverage,
  validateHumanWritingGovernance,
  validateInstructionAdapters,
  validateRulesOnlyActiveSurfaceCoverage,
  validateSkillPurgeSurface,
  validateStackDecisionBoundaryCoverage,
  validateTemplateFreeBootstrapCoverage,
  validateTerminologyMapping,
  validateUiDesignAutomationCoverage,
  validateUniversalSopConsolidationCoverage,
  validateUpgradeUiContractWarningCoverage,
} from './validate/coverage-checks.mjs';
import {
  validateRequiredFiles,
  validateRuleFiles,
  validateChecklistConsolidation,
} from './validate/file-structure.mjs';
import {
  validateMarkdownFiles,
  validateCrossReferences,
  validateAgentsManifest,
  validateDocumentationFlow,
} from './validate/markdown-content.mjs';
import {
  validatePackageMetadata,
  validatePolicyFile,
  validateVersionConsistency,
  validateMcpConfiguration,
} from './validate/project-metadata.mjs';
import { fileExists, readTextFile, collectFiles, normalizeLineEndings } from './validate/utils.mjs';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const ROOT_DIR = resolve(dirname(SCRIPT_FILE_PATH), '..');
const AGENT_CONTEXT_DIR = join(ROOT_DIR, '.agent-context');
const CANONICAL_INSTRUCTION_PATH = join(ROOT_DIR, 'AGENTS.md');
const PACKAGE_JSON_PATH = join(ROOT_DIR, 'package.json');
const PACKAGE_LOCK_PATH = join(ROOT_DIR, 'package-lock.json');
const BUN_LOCK_PATH = join(ROOT_DIR, 'bun.lock');
const CHANGELOG_PATH = join(ROOT_DIR, 'CHANGELOG.md');
const README_PATH = join(ROOT_DIR, 'README.md');
const POLICY_FILE_PATH = join(ROOT_DIR, '.agent-context', 'policies', 'llm-judge-threshold.json');
const GENERATED_RULE_FILES = [];

const validationResult = {
  passed: 0,
  failed: 0,
  errors: [],
  warnings: [],
};



function pass(message) {
  validationResult.passed += 1;
  console.log(`  PASS ${message}`);
}

function fail(message) {
  validationResult.failed += 1;
  validationResult.errors.push(message);
  console.log(`  FAIL ${message}`);
}

function warn(message) {
  validationResult.warnings.push(message);
  console.log(`  WARN ${message}`);
}




async function validateFileSizeAudit() {
  console.log('\nChecking file size threshold (audit:file-size)...');
  const report = runAuditFileSize();

  if (report.passed) {
    pass(`File size audit clean: ${report.scannedFileCount} files scanned, ${report.exemptedCount} exempted under @file-size-exception`);
  } else {
    for (const violation of report.violations) {
      fail(`File exceeds ${report.threshold} LOC: ${violation.filePath} (${violation.lineCount} LOC). Split into focused submodules or declare a justified // @file-size-exception: <reason> marker in the first 5 lines.`);
    }
  }
}

async function validateCacheLayerContractAudit() {
  console.log('\nChecking cache layer contract (audit:cache-layer-contract)...');
  const report = runCacheLayerContractAudit();

  if (report.passed) {
    pass(`Cache layer contract audit clean: ${report.providerCount} provider(s), ${report.fixtureCount} fixture(s), ${report.resultCount} result row(s)`);
  } else {
    for (const violation of report.violations) {
      fail(`Cache layer contract violation [${violation.kind}]: ${violation.detail}`);
    }
  }
}

async function validateRuleIdUniquenessAudit() {
  console.log('\nChecking rule ID uniqueness (audit:rule-id-uniqueness)...');
  const report = runRuleIdUniquenessAudit();

  if (report.passed) {
    pass(`Rule ID audit clean: ${report.migratedFileCount} migrated rule file(s), ${report.skippedFileCount} pre-migration, ${report.knownSectionIdCount} section ID(s), ${report.refMentionCount} [REF:] mention(s) all resolve`);
  } else {
    for (const violation of report.violations) {
      fail(`Rule ID violation [${violation.kind}] in ${violation.file}: ${violation.detail}`);
    }
  }
}

async function validateReflectionCitationAudit() {
  console.log('\nChecking reflection citations (audit:reflection-citations)...');
  const report = runReflectionCitationAudit();

  if (report.passed) {
    pass(`Reflection citation audit clean: ${report.surfaceCount} surface(s), ${report.knownRuleIdCount} known rule ID(s)`);
  } else {
    for (const violation of report.violations) {
      fail(`Reflection citation violation [${violation.kind}] in ${violation.file}: ${violation.detail}`);
    }
  }
}

async function validateCachingScopeHygieneAudit() {
  console.log('\nChecking caching scope hygiene (audit:caching-scope-hygiene)...');
  const report = runCachingScopeHygieneAudit();

  if (report.passed) {
    pass(`Caching scope hygiene clean: ${report.surfaceCount} public surface(s), ${report.totalClaimCount} caching saving claim(s) all integration-scoped`);
  } else {
    for (const violation of report.violations) {
      fail(`Caching scope hygiene violation [${violation.kind}] in ${violation.file}:${violation.line}: ${violation.detail}`);
    }
  }
}



async function validateReleaseBundleAudit() {
  console.log('\nChecking release benchmark bundle (audit:release-bundle)...');
  const report = runReleaseBundleAudit();

  if (report.passed) {
    pass(`Release bundle integrity clean: ${report.artifactCount} artifact(s), release_target=${report.releaseTarget}, release_status=${report.releaseStatus}`);
  } else {
    for (const violation of report.violations) {
      fail(`Release bundle violation [${violation.kind}]: ${violation.detail}`);
    }
  }
}


async function main() {
  console.log('===============================================');
  console.log('  Agentic-Senior-Core Repository Validator');
  console.log('===============================================');

  const coverageValidationContext = {
    AGENT_CONTEXT_DIR,
    CANONICAL_INSTRUCTION_PATH,
    ROOT_DIR,
    fail,
    fileExists,
    normalizeLineEndings,
    pass,
    readTextFile,
  };

  const generalValidationContext = {
    ...coverageValidationContext,
    PACKAGE_JSON_PATH,
    PACKAGE_LOCK_PATH,
    BUN_LOCK_PATH,
    CHANGELOG_PATH,
    README_PATH,
    POLICY_FILE_PATH,
    GENERATED_RULE_FILES,
    collectFiles,
    warn,
  };

  await validateRequiredFiles(generalValidationContext);
  await validateMarkdownFiles(generalValidationContext);
  await validateRuleFiles(generalValidationContext);
  await validateChecklistConsolidation(generalValidationContext);
  await validateAgentsManifest(generalValidationContext);
  await validateCrossReferences(generalValidationContext);
  await validatePackageMetadata(generalValidationContext);
  await validatePolicyFile(generalValidationContext);
  await validateVersionConsistency(generalValidationContext);
  await validateDocumentationFlow(generalValidationContext);
  await validateTerminologyMapping(coverageValidationContext);
  await validateDetectionTransparencyCoverage(coverageValidationContext);
  await validateStackDecisionBoundaryCoverage(coverageValidationContext);
  await validateUniversalSopConsolidationCoverage(coverageValidationContext);
  await validateDiagramFormatCoverage(coverageValidationContext);
  await validateTemplateFreeBootstrapCoverage(coverageValidationContext);
  await validateUpgradeUiContractWarningCoverage(coverageValidationContext);
  await validateUiDesignAutomationCoverage(coverageValidationContext);
  await validateDockerRuntimeAutomationCoverage(coverageValidationContext);
  await validateDependencyFreshnessAutomationCoverage(coverageValidationContext);
  await validateDeterministicBoundaryEnforcementCoverage(coverageValidationContext);
  await validateRulesOnlyActiveSurfaceCoverage(coverageValidationContext);
  await validateMcpConfiguration(generalValidationContext);
  await validateHumanWritingGovernance(coverageValidationContext);
  await validateInstructionAdapters(coverageValidationContext);
  await validateSkillPurgeSurface(coverageValidationContext);
  await validateCacheLayerContractAudit();
  await validateReflectionCitationAudit();
  await validateCachingScopeHygieneAudit();

  await validateReleaseBundleAudit();
  await validateFileSizeAudit();
  await validateRuleIdUniquenessAudit();

  console.log('\n===============================================');
  console.log('  RESULTS');
  console.log('===============================================');
  console.log(`  Passed: ${validationResult.passed}`);
  console.log(`  Failed: ${validationResult.failed}`);
  console.log(`  Warnings: ${validationResult.warnings.length}`);
  console.log('===============================================');

  if (validationResult.failed > 0) {
    console.log('\nVALIDATION FAILED\n');
    process.exit(1);
  }

  console.log('\nALL CHECKS PASSED\n');
}

main().catch((error) => {
  console.error('Validator crashed:', error);
  process.exit(1);
});
