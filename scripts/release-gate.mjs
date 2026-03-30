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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPOSITORY_ROOT = resolve(__dirname, '..');

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

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

function runReleaseGate() {
  const results = [];
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
  ];

  for (const requiredEnterpriseFile of requiredEnterpriseFiles) {
    const absoluteRequiredPath = resolve(REPOSITORY_ROOT, requiredEnterpriseFile);
    if (!existsSync(absoluteRequiredPath)) {
      pushResult(results, false, 'required-enterprise-file', `Missing ${requiredEnterpriseFile}`);
      continue;
    }

    pushResult(results, true, 'required-enterprise-file', `${requiredEnterpriseFile} is present`);
  }

  const failureCount = results.filter((checkResult) => !checkResult.passed).length;
  const releaseGateReport = {
    generatedAt: new Date().toISOString(),
    gateName: 'release-gate',
    passed: failureCount === 0,
    failureCount,
    results,
  };

  console.log(JSON.stringify(releaseGateReport, null, 2));
  process.exit(releaseGateReport.passed ? 0 : 1);
}

runReleaseGate();
