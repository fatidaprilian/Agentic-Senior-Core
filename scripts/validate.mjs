#!/usr/bin/env node

// @file-size-exception: Pre-existing 600 LOC main validator orchestrator; planned for split in Phase 1 governance refactor.
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
import { runCacheLayerContractAudit } from './audit-cache-layer-contract.mjs';
import { runCachingScopeHygieneAudit } from './audit-caching-scope-hygiene.mjs';
import { runTypographyPaletteAntiRepeatAudit } from '../lib/cli/audits/typography-palette-anti-repeat-audit.mjs';
import { runAuditFileSize } from './audit-file-size.mjs';
import { runReflectionCitationAudit } from './audit-reflection-citations.mjs';
import { runReleaseBundleAudit } from './audit-release-bundle.mjs';
import { runRuleIdUniquenessAudit } from './audit-rule-id-uniqueness.mjs';
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

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readTextFile(filePath) {
  return readFile(filePath, 'utf8');
}

async function collectFiles(directoryPath, fileExtensionMatcher) {
  const matchingFilePaths = [];

  async function walk(currentDirectoryPath) {
    const directoryEntries = await readdir(currentDirectoryPath, { withFileTypes: true });

    for (const directoryEntry of directoryEntries) {
      if (
        directoryEntry.name === '.git'
        || directoryEntry.name === 'node_modules'
        || directoryEntry.name === '.agentic-backup'
        || directoryEntry.name === '.benchmarks'
      ) {
        continue;
      }

      const entryPath = join(currentDirectoryPath, directoryEntry.name);

      if (directoryEntry.isDirectory()) {
        await walk(entryPath);
        continue;
      }

      if (fileExtensionMatcher(directoryEntry.name)) {
        matchingFilePaths.push(entryPath);
      }
    }
  }

  await walk(directoryPath);
  return matchingFilePaths;
}

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

function normalizeLineEndings(content) {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

async function validateRequiredFiles() {
  console.log('\nChecking required files...');

  const requiredFiles = [
    'bin/agentic-senior-core.js',
    'scripts/validate.mjs',
    'scripts/llm-judge.mjs',
    'scripts/detection-benchmark.mjs',
    'scripts/benchmark-evidence-bundle.mjs',
    'scripts/benchmark-writer-judge-matrix.mjs',
    'scripts/benchmark-gate.mjs',
    'scripts/benchmark-intelligence.mjs',
    'scripts/memory-continuity-benchmark.mjs',
    'scripts/docs-quality-drift-report.mjs',
    'scripts/governance-weekly-report.mjs',
    'scripts/mcp-server.mjs',
    'scripts/mcp-server/constants.mjs',
    'scripts/mcp-server/tool-registry.mjs',
    'scripts/mcp-server/tools.mjs',
    'scripts/frontend-usability-audit.mjs',
    'scripts/ui-design-judge.mjs',
    'scripts/documentation-boundary-audit.mjs',
    'scripts/context-triggered-audit.mjs',
    'scripts/rules-guardian-audit.mjs',
    'scripts/explain-on-demand-audit.mjs',
    'scripts/single-source-lazy-loading-audit.mjs',
    'scripts/audit-cache-layer-contract.mjs',
    'scripts/audit-typography-palette-anti-repeat.mjs',
    'lib/cli/audits/typography-palette-anti-repeat-audit.mjs',
    'lib/cli/commands/audit-design-anti-repeat.mjs',
    'scripts/sync-thin-adapters.mjs',
    'scripts/release-gate.mjs',
    'scripts/generate-sbom.mjs',
    '.agent-context/policies/llm-judge-threshold.json',
    '.agent-context/prompts/compact-natural-mode.md',
    '.agent-context/prompts/research-design.md',
    'mcp.json',
    'AGENTS.md',
    'CLAUDE.md',
    'GEMINI.md',
    'README.md',
    'CHANGELOG.md',
    'docs/doc-index.md',
    'docs/project-brief.md',
    'docs/flow-overview.md',
    'docs/api-contract.md',
    'docs/faq.md',
    'docs/deep-dive.md',
    'docs/archive/HISTORY.md',
    'docs/archive/CHANGELOG-archive.md',
    '.agent-context/state/benchmark-reproducibility.json',
    '.agent-context/state/benchmark-writer-judge-config.json',
    '.agent-context/state/memory-schema-v1.json',
    '.agent-context/state/memory-adapter-contract.json',
    '.vscode/mcp.json',
    '.github/workflows/release-gate.yml',
    '.github/workflows/sbom-compliance.yml',
    '.github/workflows/benchmark-intelligence.yml',
    '.github/workflows/docs-quality-drift-report.yml',
    '.github/workflows/governance-weekly-report.yml',
    'tests/cli-smoke.test.mjs',
    'tests/mcp-server.test.mjs',
    'tests/llm-judge.test.mjs',
    'tests/operations.test.mjs',
    'LICENSE',
    '.gitignore',
  ];

  for (const requiredFilePath of requiredFiles) {
    const absoluteRequiredFilePath = join(ROOT_DIR, requiredFilePath);

    if (await fileExists(absoluteRequiredFilePath)) {
      pass(requiredFilePath);
      continue;
    }

    fail(`Missing required file: ${requiredFilePath}`);
  }
}

async function validateMarkdownFiles() {
  console.log('\nChecking markdown content...');

  const markdownFilePaths = await collectFiles(ROOT_DIR, (fileName) => fileName.endsWith('.md'));

  for (const markdownFilePath of markdownFilePaths) {
    const markdownContent = await readTextFile(markdownFilePath);
    const relativeMarkdownPath = relative(ROOT_DIR, markdownFilePath);

    if (markdownContent.trim().length === 0) {
      fail(`Empty markdown file: ${relativeMarkdownPath}`);
      continue;
    }

    pass(`${relativeMarkdownPath} (${markdownContent.length} chars)`);
  }
}

async function validateRuleFiles() {
  console.log('\nChecking rule, checklist, prompt, and state files...');

  const expectedPaths = [
    'rules/naming-conv.md',
    'rules/architecture.md',
    'rules/security.md',
    'rules/performance.md',
    'rules/error-handling.md',
    'rules/testing.md',
    'rules/git-workflow.md',
    'rules/efficiency-vs-hype.md',
    'rules/api-docs.md',
    'rules/microservices.md',
    'rules/event-driven.md',
    'rules/database-design.md',
    'rules/realtime.md',
    'rules/frontend-architecture.md',
    'rules/docker-runtime.md',
    'rules/observability.md',
    'rules/resilience.md',
    'rules/migrations.md',
    'rules/background-jobs.md',
    'rules/config-and-flags.md',
    'rules/api-versioning.md',
    'review-checklists/pr-checklist.md',
    'review-checklists/architecture-review.md',
    'prompts/init-project.md',
    'prompts/compact-natural-mode.md',
    'prompts/bootstrap-design.md',
    'prompts/refactor.md',
    'prompts/review-code.md',
    'state/architecture-map.md',
    'state/dependency-map.md',
  ];

  for (const expectedPath of expectedPaths) {
    const absoluteExpectedPath = join(AGENT_CONTEXT_DIR, expectedPath);

    if (!(await fileExists(absoluteExpectedPath))) {
      fail(`Missing agent context file: .agent-context/${expectedPath}`);
      continue;
    }

    const fileContent = await readTextFile(absoluteExpectedPath);
    if (fileContent.trim().length < 100) {
      fail(`Agent context file is suspiciously short: .agent-context/${expectedPath}`);
      continue;
    }

    pass(`.agent-context/${expectedPath}`);
  }
}

async function validateChecklistConsolidation() {
  console.log('\nChecking review checklist consolidation...');

  const reviewChecklistDirectoryPath = join(AGENT_CONTEXT_DIR, 'review-checklists');
  const checklistEntries = await readdir(reviewChecklistDirectoryPath, { withFileTypes: true });
  const checklistFileNames = checklistEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort((leftName, rightName) => leftName.localeCompare(rightName));

  const expectedChecklistFileNames = ['architecture-review.md', 'pr-checklist.md'];

  if (checklistFileNames.length <= 2) {
    pass(`Checklist count is consolidated (${checklistFileNames.length}/2)`);
  } else {
    fail(`Checklist count exceeds limit (${checklistFileNames.length}/2): ${checklistFileNames.join(', ')}`);
  }

  for (const expectedChecklistFileName of expectedChecklistFileNames) {
    if (checklistFileNames.includes(expectedChecklistFileName)) {
      pass(`Checklist exists: .agent-context/review-checklists/${expectedChecklistFileName}`);
    } else {
      fail(`Missing consolidated checklist: .agent-context/review-checklists/${expectedChecklistFileName}`);
    }
  }
}

async function validateCrossReferences() {
  console.log('\nChecking internal links...');

  const markdownFilePaths = await collectFiles(ROOT_DIR, (fileName) => fileName.endsWith('.md'));
  const linkPattern = /\[([^\]]*)\]\((?!https?:\/\/|#)([^)]+)\)/g;
  let checkedLinkCount = 0;

  for (const markdownFilePath of markdownFilePaths) {
    const markdownContent = await readTextFile(markdownFilePath);
    const currentFileDirectory = dirname(markdownFilePath);
    const relativeMarkdownPath = relative(ROOT_DIR, markdownFilePath);
    let linkMatch = linkPattern.exec(markdownContent);

    while (linkMatch) {
      const rawLinkTarget = linkMatch[2].split('#')[0];
      if (rawLinkTarget) {
        checkedLinkCount += 1;
        const resolvedLinkPath = resolve(currentFileDirectory, rawLinkTarget);

        if (await fileExists(resolvedLinkPath)) {
          pass(`${relativeMarkdownPath} → ${linkMatch[2]}`);
        } else {
          fail(`Broken link in ${relativeMarkdownPath}: ${linkMatch[2]}`);
        }
      }

      linkMatch = linkPattern.exec(markdownContent);
    }
  }

  if (checkedLinkCount === 0) {
    warn('No internal links were found in markdown files');
  }
}

async function validateAgentsManifest() {
  console.log('\nChecking AGENTS.md manifest links...');

  const agentsContent = await readTextFile(join(ROOT_DIR, 'AGENTS.md'));
  const fileReferencePattern = /\[`?([^`\]]+)`?\]\(([^)]+)\)/g;
  let manifestLinkCount = 0;
  let fileReferenceMatch = fileReferencePattern.exec(agentsContent);

  while (fileReferenceMatch) {
    const manifestLinkTarget = fileReferenceMatch[2];

    if (!manifestLinkTarget.startsWith('http')) {
      manifestLinkCount += 1;
      const resolvedManifestLinkPath = resolve(ROOT_DIR, manifestLinkTarget);

      if (await fileExists(resolvedManifestLinkPath)) {
        pass(`AGENTS.md → ${manifestLinkTarget}`);
      } else {
        fail(`AGENTS.md references missing file: ${manifestLinkTarget}`);
      }
    }

    fileReferenceMatch = fileReferencePattern.exec(agentsContent);
  }

  if (manifestLinkCount === 0) {
    warn('AGENTS.md does not contain any local manifest links');
  }
}

async function validatePackageMetadata() {
  console.log('\nChecking package metadata...');

  const packageJson = JSON.parse(await readTextFile(PACKAGE_JSON_PATH));
  const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

  if (typeof packageJson.version !== 'string' || !versionPattern.test(packageJson.version)) {
    fail('package.json version must be a semantic version string');
  } else {
    pass(`package.json version ${packageJson.version}`);
  }

  if (packageJson.scripts?.validate === 'node ./scripts/validate.mjs') {
    pass('package.json validate script is Node-first');
  } else {
    fail('package.json validate script must use node ./scripts/validate.mjs');
  }

  if (packageJson.scripts?.test) {
    pass('package.json test script exists');
  } else {
    fail('package.json test script is missing');
  }

  if (packageJson.devDependencies && Object.keys(packageJson.devDependencies).length > 0) {
    warn('package.json still has devDependencies; review whether they are necessary');
  } else {
    pass('package.json has no unnecessary devDependencies');
  }

  if (Array.isArray(packageJson.files) && packageJson.files.includes('AGENTS.md')) {
    pass('package.json publishes canonical AGENTS.md');
  } else {
    fail('package.json must publish AGENTS.md so init and upgrade can copy the canonical root instructions file');
  }

  if (await fileExists(BUN_LOCK_PATH)) {
    fail('bun.lock must not be tracked while npm is the package manager source of truth');
  } else {
    pass('No bun.lock drift file present');
  }
}

async function validatePolicyFile() {
  console.log('\nChecking LLM Judge policy...');

  const policyContent = await readTextFile(POLICY_FILE_PATH);
  const parsedPolicy = JSON.parse(policyContent);
  const selectedProfileName = parsedPolicy.selectedProfile;
  const profileThresholds = parsedPolicy.profileThresholds;

  if (typeof selectedProfileName !== 'string') {
    fail('Policy file must define selectedProfile as a string');
  } else {
    pass(`LLM Judge selected profile: ${selectedProfileName}`);
  }

  if (!profileThresholds || typeof profileThresholds !== 'object') {
    fail('Policy file must define profileThresholds');
    return;
  }

  for (const [profileName, profileSettings] of Object.entries(profileThresholds)) {
    if (!Array.isArray(profileSettings.blockingSeverities)) {
      fail(`Policy profile ${profileName} must define blockingSeverities`);
      continue;
    }

    const invalidSeverity = profileSettings.blockingSeverities.find((severity) => !ALLOWED_SEVERITIES.has(severity));
    if (invalidSeverity) {
      fail(`Policy profile ${profileName} uses unsupported severity: ${invalidSeverity}`);
      continue;
    }

    pass(`Policy profile ${profileName} blocking severities are valid`);
  }

  if (typeof profileThresholds[selectedProfileName] === 'object') {
    pass('Policy selectedProfile points to a valid profile');
  } else {
    fail('Policy selectedProfile must match one of the configured profileThresholds');
  }
}

async function validateVersionConsistency() {
  console.log('\nChecking release version consistency...');

  const packageJson = JSON.parse(await readTextFile(PACKAGE_JSON_PATH));
  const packageVersion = packageJson.version;
  const changelogContent = await readTextFile(CHANGELOG_PATH);

  if (changelogContent.includes(`## ${packageVersion}`)) {
    pass(`CHANGELOG.md contains release entry for ${packageVersion}`);
  } else {
    fail(`CHANGELOG.md is missing a ## ${packageVersion} heading`);
  }

  if (await fileExists(PACKAGE_LOCK_PATH)) {
    const packageLock = JSON.parse(await readTextFile(PACKAGE_LOCK_PATH));
    const rootLockVersion = packageLock.packages?.['']?.version;
    if (packageLock.version === packageVersion && rootLockVersion === packageVersion) {
      pass(`package-lock.json matches package version ${packageVersion}`);
    } else {
      fail(`package-lock.json version drift: expected ${packageVersion}, found ${packageLock.version || 'missing'} / ${rootLockVersion || 'missing'}`);
    }
  } else {
    fail('package-lock.json is required for npm release consistency');
  }

  for (const generatedRuleFileName of GENERATED_RULE_FILES) {
    const generatedRuleContent = await readTextFile(join(ROOT_DIR, generatedRuleFileName));

    if (generatedRuleContent.includes(`Generated by Agentic-Senior-Core CLI v${packageVersion}`)) {
      pass(`${generatedRuleFileName} matches package version ${packageVersion}`);
    } else {
      fail(`${generatedRuleFileName} does not match package version ${packageVersion}`);
    }
  }
}

async function validateDocumentationFlow() {
  console.log('\nChecking documentation flow...');

  const readmeContent = await readTextFile(README_PATH);
  const requiredReadmeSnippets = [
    'npx @ryuenn3123/agentic-senior-core init',
    'npm run validate',
    'docs/faq.md',
    'docs/deep-dive.md',
    'docs/archive/HISTORY.md',
  ];

  for (const requiredReadmeSnippet of requiredReadmeSnippets) {
    if (readmeContent.includes(requiredReadmeSnippet)) {
      pass(`README.md mentions ${requiredReadmeSnippet}`);
    } else {
      fail(`README.md must mention ${requiredReadmeSnippet}`);
    }
  }
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

async function validateTypographyPaletteAntiRepeatAudit() {
  console.log('\nChecking typography and palette anti-repeat ledger (audit:typography-palette-anti-repeat)...');
  const report = runTypographyPaletteAntiRepeatAudit({ repositoryRootPath: ROOT_DIR });

  if (report.skipped) {
    pass(`Typography/palette anti-repeat audit skipped: ${report.reason}`);
    return;
  }

  if (report.passed) {
    pass(`Typography/palette anti-repeat audit clean: ${report.filesScanned} CSS/token file(s) scanned, 0 blocking typography violation(s), ${report.paletteFindingCount} palette finding(s) (${report.paletteSeverity})`);
    return;
  }

  for (const violation of report.typographyViolations) {
    fail(`Typography ledger violation [${violation.kind}] in ${violation.file}:${violation.line}: ${violation.detail}`);
  }
  if (report.paletteSeverity === 'blocking') {
    for (const finding of report.paletteFindings) {
      fail(`Palette ledger violation [${finding.kind}] in ${finding.file}:${finding.line}: ${finding.detail}`);
    }
  } else {
    for (const finding of report.paletteFindings) {
      warn(`Palette ledger advisory [${finding.kind}] in ${finding.file}:${finding.line}: ${finding.detail}`);
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

async function validateMcpConfiguration() {
  console.log('\nChecking MCP configuration...');

  const mcpConfiguration = JSON.parse(await readTextFile(join(ROOT_DIR, 'mcp.json')));
  const workspaceMcpConfiguration = JSON.parse(await readTextFile(join(ROOT_DIR, '.vscode', 'mcp.json')));
  const workspaceServerConfig = workspaceMcpConfiguration.servers?.['agentic-senior-core'];

  if (mcpConfiguration.knowledgeLayers?.enabled === true) {
    pass('Root MCP config has knowledgeLayers enabled');
  } else {
    fail('Root MCP config must have knowledgeLayers.enabled: true');
  }

  if (typeof workspaceMcpConfiguration.$schema === 'undefined') {
    pass('Workspace MCP config omits $schema (supported by current VS Code MCP schema inference)');
  } else if (workspaceMcpConfiguration.$schema === 'vscode://schemas/mcp') {
    pass('Workspace MCP config uses trusted VS Code schema');
  } else {
    fail('Workspace MCP config $schema must be omitted or set to vscode://schemas/mcp');
  }

  if (workspaceServerConfig?.command === 'node') {
    pass('Workspace MCP server command uses Node');
  } else {
    fail('Workspace MCP server command must use Node');
  }

  if (workspaceServerConfig?.cwd === '${workspaceFolder}') {
    pass('Workspace MCP server cwd uses ${workspaceFolder}');
  } else {
    fail('Workspace MCP server cwd must be ${workspaceFolder}');
  }

  if (Array.isArray(workspaceServerConfig?.args) && workspaceServerConfig.args.includes('./scripts/mcp-server.mjs')) {
    pass('Workspace MCP server points to scripts/mcp-server.mjs');
  } else {
    fail('Workspace MCP server must include ./scripts/mcp-server.mjs argument');
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

  await validateRequiredFiles();
  await validateMarkdownFiles();
  await validateRuleFiles();
  await validateChecklistConsolidation();
  await validateAgentsManifest();
  await validateCrossReferences();
  await validatePackageMetadata();
  await validatePolicyFile();
  await validateVersionConsistency();
  await validateDocumentationFlow();
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
  await validateMcpConfiguration();
  await validateHumanWritingGovernance(coverageValidationContext);
  await validateInstructionAdapters(coverageValidationContext);
  await validateSkillPurgeSurface(coverageValidationContext);
  await validateCacheLayerContractAudit();
  await validateReflectionCitationAudit();
  await validateCachingScopeHygieneAudit();
  await validateTypographyPaletteAntiRepeatAudit();
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
