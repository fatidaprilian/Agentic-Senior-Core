#!/usr/bin/env node

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
import {
  ALLOWED_SEVERITIES,
  OVERRIDE_WARNING_WINDOW_DAYS,
} from './validate/config.mjs';
import {
  validateDependencyFreshnessAutomationCoverage,
  validateDetectionTransparencyCoverage,
  validateDeterministicBoundaryEnforcementCoverage,
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
const CANONICAL_INSTRUCTION_PATH = join(ROOT_DIR, '.instructions.md');
const PACKAGE_JSON_PATH = join(ROOT_DIR, 'package.json');
const PACKAGE_LOCK_PATH = join(ROOT_DIR, 'package-lock.json');
const BUN_LOCK_PATH = join(ROOT_DIR, 'bun.lock');
const CHANGELOG_PATH = join(ROOT_DIR, 'CHANGELOG.md');
const README_PATH = join(ROOT_DIR, 'README.md');
const POLICY_FILE_PATH = join(ROOT_DIR, '.agent-context', 'policies', 'llm-judge-threshold.json');
const OVERRIDE_FILE_PATH = join(ROOT_DIR, '.agent-override.md');
const GENERATED_RULE_FILES = ['.cursorrules', '.windsurfrules'];

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
    'scripts/sync-thin-adapters.mjs',
    'scripts/v3-purge-audit.mjs',
    'scripts/release-gate.mjs',
    'scripts/generate-sbom.mjs',
    '.cursorrules',
    '.windsurfrules',
    '.agent-override.md',
    '.agent-context/policies/llm-judge-threshold.json',
    'mcp.json',
    'AGENTS.md',
    '.github/copilot-instructions.md',
    '.gemini/instructions.md',
    'README.md',
    'CHANGELOG.md',
    'docs/faq.md',
    'docs/deep-dive.md',
    'docs/terminology-mapping.md',
    'docs/archive/v1.7-execution-playbook.md',
    'docs/archive/v1.7-issue-breakdown.md',
    'docs/archive/v1.8-operations-playbook.md',
    'docs/archive/v2-upgrade-playbook.md',
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
    'review-checklists/pr-checklist.md',
    'review-checklists/architecture-review.md',
    'prompts/init-project.md',
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

function stripMarkdownCodeBlocks(markdownText) {
  return markdownText.replace(/```[\s\S]*?```/g, '');
}

function parseOverrideExpiryDate(rawExpiryValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawExpiryValue)) {
    return null;
  }

  const parsedDate = new Date(`${rawExpiryValue}T00:00:00.000Z`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

async function validateOverrideGovernance() {
  console.log('\nChecking override governance...');

  const overrideContent = await readTextFile(OVERRIDE_FILE_PATH);
  const overrideContentWithoutCodeBlocks = stripMarkdownCodeBlocks(overrideContent);
  const overrideEntryPattern = /\[Rule:\s*([^\]]+)\]([\s\S]*?)(?=\n\[Rule:|$)/g;
  const overrideEntries = [];
  let overrideEntryMatch = overrideEntryPattern.exec(overrideContentWithoutCodeBlocks);

  while (overrideEntryMatch) {
    const ruleName = overrideEntryMatch[1].trim();
    const entryBody = overrideEntryMatch[2];
    const ownerMatch = entryBody.match(/(?:^|\n)Owner:\s*(.+)/);
    const expiryMatch = entryBody.match(/(?:^|\n)Expiry:\s*(.+)/);

    overrideEntries.push({
      ruleName,
      owner: ownerMatch ? ownerMatch[1].trim() : '',
      expiry: expiryMatch ? expiryMatch[1].trim() : '',
    });

    overrideEntryMatch = overrideEntryPattern.exec(overrideContentWithoutCodeBlocks);
  }

  if (overrideEntries.length === 0) {
    pass('No active override entries found; governance baseline remains strict');
    return;
  }

  const currentDate = new Date();

  for (const overrideEntry of overrideEntries) {
    const overrideContextLabel = `[Rule: ${overrideEntry.ruleName}]`;

    if (!overrideEntry.owner) {
      fail(`${overrideContextLabel} is missing Owner metadata`);
      continue;
    }

    pass(`${overrideContextLabel} owner is defined`);

    if (!overrideEntry.expiry) {
      fail(`${overrideContextLabel} is missing Expiry metadata`);
      continue;
    }

    const expiryDate = parseOverrideExpiryDate(overrideEntry.expiry);
    if (!expiryDate) {
      fail(`${overrideContextLabel} has invalid Expiry format (expected YYYY-MM-DD)`);
      continue;
    }

    const remainingMilliseconds = expiryDate.getTime() - currentDate.getTime();
    const remainingDays = Math.floor(remainingMilliseconds / (1000 * 60 * 60 * 24));

    if (remainingMilliseconds < 0) {
      fail(`${overrideContextLabel} is expired (${overrideEntry.expiry})`);
      continue;
    }

    pass(`${overrideContextLabel} expiry is valid (${overrideEntry.expiry})`);

    if (remainingDays <= OVERRIDE_WARNING_WINDOW_DAYS) {
      warn(`${overrideContextLabel} expires in ${remainingDays} day(s); renew or remove soon`);
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
  const versionPattern = /^\d+\.\d+\.\d+$/;

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

  if (Array.isArray(packageJson.files) && packageJson.files.includes('.instructions.md')) {
    pass('package.json publishes canonical .instructions.md');
  } else {
    fail('package.json must publish .instructions.md so init and upgrade can copy the canonical root instructions file');
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
    'docs/archive/v2-upgrade-playbook.md',
  ];

  for (const requiredReadmeSnippet of requiredReadmeSnippets) {
    if (readmeContent.includes(requiredReadmeSnippet)) {
      pass(`README.md mentions ${requiredReadmeSnippet}`);
    } else {
      fail(`README.md must mention ${requiredReadmeSnippet}`);
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
  await validateOverrideGovernance();
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
