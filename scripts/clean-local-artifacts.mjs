#!/usr/bin/env node

import { rm, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_FILE_PATH), '..');

const LOCAL_ARTIFACT_PATHS = [
  'test_output.txt',
  'validate_output.txt',
  'release-gate-report.json',
  '.benchmarks',
  '.zed',
  '.agentic-backup',
  '.agent-context/state/active-memory.json',
  '.agent-context/state/v3-purge-audit.json',
  '.agent-context/state/llm-judge-report.json',
  '.agent-context/state/benchmark-analysis.json',
  '.agent-context/state/benchmark-evidence-bundle.json',
  '.agent-context/state/benchmark-history.json',
  '.agent-context/state/benchmark-trend-report.csv',
  '.agent-context/state/benchmark-trend-report.json',
  '.agent-context/state/benchmark-writer-judge-matrix.json',
  '.agent-context/state/docs-quality-drift-report.json',
  '.agent-context/state/memory-continuity-benchmark.json',
  '.agent-context/state/quality-trend-report.json',
  '.agent-context/state/token-optimization-benchmark.json',
  '.agent-context/state/weekly-governance-report.json',
];

function resolveLocalArtifactPath(relativePath) {
  const resolvedPath = resolve(REPOSITORY_ROOT, relativePath);
  const repositoryRelativePath = relative(REPOSITORY_ROOT, resolvedPath);

  if (
    repositoryRelativePath.startsWith('..')
    || repositoryRelativePath === ''
    || resolve(repositoryRelativePath) === repositoryRelativePath
  ) {
    throw new Error(`Refusing to clean path outside repository root: ${relativePath}`);
  }

  return resolvedPath;
}

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

let removedCount = 0;
let skippedCount = 0;

for (const relativePath of LOCAL_ARTIFACT_PATHS) {
  const targetPath = resolveLocalArtifactPath(relativePath);

  if (!(await pathExists(targetPath))) {
    skippedCount += 1;
    continue;
  }

  await rm(targetPath, {
    force: true,
    recursive: true,
  });

  removedCount += 1;
  console.log(`removed ${relativePath}`);
}

console.log(`local artifact cleanup complete: removed=${removedCount}, skipped=${skippedCount}`);
