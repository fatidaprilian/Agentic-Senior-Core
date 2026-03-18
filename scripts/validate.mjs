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

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const ROOT_DIR = resolve(dirname(SCRIPT_FILE_PATH), '..');
const AGENT_CONTEXT_DIR = join(ROOT_DIR, '.agent-context');
const PACKAGE_JSON_PATH = join(ROOT_DIR, 'package.json');
const CHANGELOG_PATH = join(ROOT_DIR, 'CHANGELOG.md');
const README_PATH = join(ROOT_DIR, 'README.md');
const POLICY_FILE_PATH = join(ROOT_DIR, '.agent-context', 'policies', 'llm-judge-threshold.json');
const GENERATED_RULE_FILES = ['.cursorrules', '.windsurfrules'];
const ALLOWED_SEVERITIES = new Set(['critical', 'high', 'medium', 'low']);

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
    'tests/cli-smoke.test.mjs',
    'tests/llm-judge.test.mjs',
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
    'review-checklists/pr-checklist.md',
    'review-checklists/security-audit.md',
    'review-checklists/performance-audit.md',
    'review-checklists/architecture-review.md',
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