#!/usr/bin/env node
// @ts-check

/**
 * audit-release-bundle.mjs
 *
 * Phase 5 Task 5.4 integrity gate. Validates that
 * benchmarks/results/release-bundle-4.0.0.json exists, references real source
 * artifacts, and that each recorded SHA-256 hash still matches the current
 * file content. Wired into npm run validate.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_FILE_PATH), '../../..');
const ARGS = new Set(process.argv.slice(2));
const JSON_ONLY = ARGS.has('--json');

const DEFAULT_BUNDLE_PATH = join(REPOSITORY_ROOT, 'benchmarks', 'results', 'release-bundle-4.0.0.json');

function sha256Hex(buffer) {
  // Normalize CRLF -> LF before hashing so bundle integrity is reproducible
  // across platforms (Windows working tree may be CRLF; CI checkouts are LF).
  const normalized = buffer.toString('utf8').replace(/\r\n/g, '\n');
  const hash = createHash('sha256');
  hash.update(normalized, 'utf8');
  return hash.digest('hex');
}

export function runReleaseBundleAudit(options = {}) {
  const rootDir = options.rootDir ? resolve(String(options.rootDir)) : REPOSITORY_ROOT;
  const bundlePath = options.bundlePath ? resolve(String(options.bundlePath)) : DEFAULT_BUNDLE_PATH;
  const violations = [];

  if (!existsSync(bundlePath)) {
    violations.push({
      kind: 'bundle.missing',
      detail: `Release bundle is missing at ${bundlePath}. Run scripts/build-release-benchmark-bundle.mjs to regenerate.`,
    });
    return finalizeReport(violations, { bundlePath, artifactCount: 0 });
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(bundlePath, 'utf8'));
  } catch (error) {
    violations.push({
      kind: 'bundle.invalid-json',
      detail: `Release bundle is not valid JSON: ${error?.message || error}`,
    });
    return finalizeReport(violations, { bundlePath, artifactCount: 0 });
  }

  if (!Array.isArray(parsed.artifacts) || parsed.artifacts.length === 0) {
    violations.push({
      kind: 'bundle.empty',
      detail: 'Release bundle artifacts array must be non-empty.',
    });
    return finalizeReport(violations, { bundlePath, artifactCount: 0 });
  }

  if (parsed.integrity?.hash_algorithm !== 'SHA-256') {
    violations.push({
      kind: 'bundle.unexpected-hash-algorithm',
      detail: `Expected hash_algorithm "SHA-256", got "${parsed.integrity?.hash_algorithm}".`,
    });
  }

  if (parsed.release_status !== 'release-candidate-unpublished' && parsed.release_status !== 'released') {
    violations.push({
      kind: 'bundle.invalid-release-status',
      detail: `release_status must be either "release-candidate-unpublished" or "released"; got "${parsed.release_status}".`,
    });
  }

  for (const artifact of parsed.artifacts) {
    if (!artifact.relative_path || typeof artifact.relative_path !== 'string') {
      violations.push({
        kind: 'artifact.missing-relative-path',
        detail: `Artifact "${artifact.artifact_id}" missing relative_path.`,
      });
      continue;
    }

    const absolutePath = join(rootDir, artifact.relative_path);
    if (!existsSync(absolutePath)) {
      violations.push({
        kind: 'artifact.missing-file',
        detail: `Artifact "${artifact.artifact_id}" references missing file at ${artifact.relative_path}.`,
      });
      continue;
    }

    if (!artifact.sha256 || typeof artifact.sha256 !== 'string') {
      violations.push({
        kind: 'artifact.missing-sha256',
        detail: `Artifact "${artifact.artifact_id}" missing sha256 hash.`,
      });
      continue;
    }

    const currentHash = sha256Hex(readFileSync(absolutePath));
    if (currentHash !== artifact.sha256) {
      violations.push({
        kind: 'artifact.hash-mismatch',
        detail: `Artifact "${artifact.artifact_id}" sha256 drift: bundle records ${artifact.sha256}, current file is ${currentHash}. Regenerate the bundle via scripts/build-release-benchmark-bundle.mjs.`,
      });
    }
  }

  return finalizeReport(violations, {
    bundlePath,
    artifactCount: parsed.artifacts.length,
    releaseTarget: parsed.release_target || null,
    releaseStatus: parsed.release_status || null,
  });
}

function finalizeReport(violations, extras) {
  return {
    auditName: 'audit-release-bundle',
    reportVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    violationCount: violations.length,
    passed: violations.length === 0,
    violations,
    ...extras,
  };
}


