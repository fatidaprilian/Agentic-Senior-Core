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
import { validateSkillTopicContent } from './skill-tier-policy.mjs';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const ROOT_DIR = resolve(dirname(SCRIPT_FILE_PATH), '..');
const AGENT_CONTEXT_DIR = join(ROOT_DIR, '.agent-context');
const PACKAGE_JSON_PATH = join(ROOT_DIR, 'package.json');
const CHANGELOG_PATH = join(ROOT_DIR, 'CHANGELOG.md');
const README_PATH = join(ROOT_DIR, 'README.md');
const POLICY_FILE_PATH = join(ROOT_DIR, '.agent-context', 'policies', 'llm-judge-threshold.json');
const OVERRIDE_FILE_PATH = join(ROOT_DIR, '.agent-override.md');
const SKILLS_DIR = join(AGENT_CONTEXT_DIR, 'skills');
const GENERATED_RULE_FILES = ['.cursorrules', '.windsurfrules'];
const ALLOWED_SEVERITIES = new Set(['critical', 'high', 'medium', 'low']);
const OVERRIDE_WARNING_WINDOW_DAYS = 30;

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
      if (directoryEntry.name === '.git' || directoryEntry.name === 'node_modules') {
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

async function validateRequiredFiles() {
  console.log('\nChecking required files...');

  const requiredFiles = [
    'bin/agentic-senior-core.js',
    'scripts/validate.mjs',
    'scripts/llm-judge.mjs',
    'scripts/detection-benchmark.mjs',
    'scripts/benchmark-gate.mjs',
    'scripts/benchmark-intelligence.mjs',
    'scripts/frontend-usability-audit.mjs',
    'scripts/release-gate.mjs',
    'scripts/generate-sbom.mjs',
    'scripts/init-project.sh',
    'scripts/init-project.ps1',
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
    'docs/v1.7-execution-playbook.md',
    'docs/v1.7-issue-breakdown.md',
    'docs/v1.8-operations-playbook.md',
    'docs/v2-upgrade-playbook.md',
    '.agent-context/state/benchmark-watchlist.json',
    '.agent-context/state/skill-platform.json',
    '.agent-context/skills/index.json',
    '.github/workflows/release-gate.yml',
    '.github/workflows/sbom-compliance.yml',
    '.github/workflows/benchmark-intelligence.yml',
    'tests/cli-smoke.test.mjs',
    'tests/llm-judge.test.mjs',
    'tests/enterprise-ops.test.mjs',
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
  console.log('\nChecking rule, stack, blueprint, checklist, and state files...');

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
    'stacks/typescript.md',
    'stacks/python.md',
    'stacks/java.md',
    'stacks/php.md',
    'stacks/go.md',
    'stacks/csharp.md',
    'stacks/rust.md',
    'stacks/ruby.md',
    'blueprints/api-nextjs.md',
    'blueprints/nestjs-logic.md',
    'blueprints/fastapi-service.md',
    'blueprints/laravel-api.md',
    'blueprints/spring-boot-api.md',
    'blueprints/go-service.md',
    'blueprints/aspnet-api.md',
    'blueprints/ci-github-actions.md',
    'blueprints/ci-gitlab.md',
    'blueprints/observability.md',
    'blueprints/graphql-grpc-api.md',
    'blueprints/infrastructure-as-code.md',
    'blueprints/kubernetes-manifests.md',
    'profiles/startup.md',
    'profiles/regulated.md',
    'profiles/platform.md',
    'review-checklists/pr-checklist.md',
    'review-checklists/frontend-usability.md',
    'review-checklists/frontend-skill-parity.md',
    'review-checklists/release-operations.md',
    'review-checklists/security-audit.md',
    'review-checklists/performance-audit.md',
    'review-checklists/architecture-review.md',
    'skills/README.md',
    'skills/frontend/README.md',
    'skills/backend/README.md',
    'skills/fullstack/README.md',
    'skills/cli/README.md',
    'skills/distribution/README.md',
    'skills/review-quality/README.md',
    'skills/frontend.md',
    'skills/backend.md',
    'skills/fullstack.md',
    'skills/cli.md',
    'skills/distribution.md',
    'skills/review-quality.md',
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

async function validateSkillTierQuality() {
  console.log('\nChecking skill tier quality...');

  const skillMarkdownFiles = await collectFiles(SKILLS_DIR, (fileName) => fileName.endsWith('.md'));
  const scopedSkillTopicFiles = skillMarkdownFiles.filter((skillFilePath) => {
    if (skillFilePath.endsWith('README.md')) {
      return false;
    }

    const relativeSkillPath = relative(SKILLS_DIR, skillFilePath);
    return /[\\/]/.test(relativeSkillPath);
  });

  for (const skillTopicPath of scopedSkillTopicFiles) {
    const skillTopicContent = await readTextFile(skillTopicPath);
    const relativeSkillTopicPath = relative(ROOT_DIR, skillTopicPath);
    const validationResult = validateSkillTopicContent(skillTopicContent);

    if (!validationResult.isValid) {
      if (validationResult.reason === 'missing-tier') {
        fail(`${relativeSkillTopicPath} is missing explicit Tier metadata`);
        continue;
      }

      if (validationResult.reason === 'unsupported-tier') {
        fail(`${relativeSkillTopicPath} has unsupported tier: ${validationResult.detectedTier}`);
        continue;
      }

      if (validationResult.reason === 'word-count') {
        fail(`${relativeSkillTopicPath} tier ${validationResult.detectedTier} must include at least ${validationResult.minimumRules.minWords} words (found ${validationResult.wordCount})`);
        continue;
      }

      if (validationResult.reason === 'heading-count') {
        fail(`${relativeSkillTopicPath} tier ${validationResult.detectedTier} must include at least ${validationResult.minimumRules.minHeadings} section headings (found ${validationResult.headingCount})`);
        continue;
      }

      if (validationResult.reason === 'checklist-count') {
        fail(`${relativeSkillTopicPath} tier ${validationResult.detectedTier} must include at least ${validationResult.minimumRules.minChecklistItems} checklist item(s) (found ${validationResult.checklistCount})`);
        continue;
      }

      if (validationResult.reason === 'code-block-count') {
        fail(`${relativeSkillTopicPath} tier ${validationResult.detectedTier} must include at least ${validationResult.minimumRules.minCodeBlocks} code block(s) (found ${validationResult.codeBlockCount})`);
        continue;
      }

      fail(`${relativeSkillTopicPath} failed tier validation`);
      continue;
    }

    pass(`${relativeSkillTopicPath} tier ${validationResult.detectedTier} quality gate passed`);
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
    'GitHub Template',
    'scripts/init-project.ps1',
    'scripts/init-project.sh',
    'npx @fatidaprilian/agentic-senior-core init',
    'npm run validate',
    'docs/faq.md',
    'docs/deep-dive.md',
    'docs/v2-upgrade-playbook.md',
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
  const lintServerCommand = mcpConfiguration.servers?.lint?.command;
  const testServerCommand = mcpConfiguration.servers?.test?.command;

  if (lintServerCommand === 'node') {
    pass('MCP lint server uses Node');
  } else {
    fail('MCP lint server must use Node');
  }

  if (testServerCommand === 'node') {
    pass('MCP test server uses Node');
  } else {
    fail('MCP test server must use Node');
  }
}

async function main() {
  console.log('===============================================');
  console.log('  Agentic-Senior-Core Repository Validator');
  console.log('===============================================');

  await validateRequiredFiles();
  await validateMarkdownFiles();
  await validateRuleFiles();
  await validateSkillTierQuality();
  await validateOverrideGovernance();
  await validateAgentsManifest();
  await validateCrossReferences();
  await validatePackageMetadata();
  await validatePolicyFile();
  await validateVersionConsistency();
  await validateDocumentationFlow();
  await validateMcpConfiguration();

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