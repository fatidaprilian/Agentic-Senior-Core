#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { scoreAntiHaluFixtures } from './lib/scorer.mjs';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_FILE_PATH);
const REPOSITORY_ROOT = resolve(SCRIPT_DIR, '..', '..');
const RESULTS_DIR = join(REPOSITORY_ROOT, 'benchmarks', 'results');
const RESULT_FILENAME = 'anti-halu-phase-3-2026-05-16.json';

export function buildAntiHaluBenchmarkReport(fixtures) {
  return scoreAntiHaluFixtures(fixtures);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const stdoutOnly = args.has('--stdout-only');
  const report = buildAntiHaluBenchmarkReport();
  const serialized = `${JSON.stringify(report, null, 2)}\n`;

  if (stdoutOnly) {
    process.stdout.write(serialized);
    return;
  }

  if (!existsSync(RESULTS_DIR)) {
    mkdirSync(RESULTS_DIR, { recursive: true });
  }

  const outputPath = join(RESULTS_DIR, RESULT_FILENAME);
  writeFileSync(outputPath, serialized, 'utf8');
  console.log(`Wrote ${relative(REPOSITORY_ROOT, outputPath)}`);
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('run-benchmark.mjs')) {
  await main();
}
