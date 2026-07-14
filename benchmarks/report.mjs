#!/usr/bin/env node
// ASC Benchmark Report Generator
// Reads result files from benchmarks/.cache/ and produces a comparison table.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CACHE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '.cache');

async function loadResults() {
  try {
    const files = await fs.readdir(CACHE_DIR);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));
    const results = [];
    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(CACHE_DIR, file), 'utf8');
      results.push(JSON.parse(content));
    }
    return results;
  } catch {
    return [];
  }
}

function pctDelta(withVal, withoutVal) {
  if (withoutVal === 0) return 'N/A';
  const delta = ((withVal - withoutVal) / withoutVal * 100).toFixed(1);
  return `${delta > 0 ? '+' : ''}${delta}%`;
}

async function report() {
  const results = await loadResults();

  if (results.length === 0) {
    console.log('No benchmark results found in benchmarks/.cache/');
    console.log('Run benchmarks first: node benchmarks/run.mjs --task <dir> --with-asc');
    return;
  }

  const tasks = [...new Set(results.map((r) => r.task))];

  console.log('\n# ASC Benchmark Report\n');

  for (const task of tasks) {
    const withAsc = results.filter((r) => r.task === task && r.withAsc);
    const withoutAsc = results.filter((r) => r.task === task && !r.withAsc);

    if (withAsc.length === 0 || withoutAsc.length === 0) {
      console.log(`## ${task} (incomplete — need both with/without runs)\n`);
      continue;
    }

    const avgWith = average(withAsc);
    const avgWithout = average(withoutAsc);

    console.log(`## ${task}\n`);
    console.log(`| Metric         | With ASC | Without ASC | Delta   |`);
    console.log(`|----------------|----------|-------------|---------|`);
    console.log(`| LOC added      | ${avgWith.linesAdded} | ${avgWithout.linesAdded} | ${pctDelta(avgWith.linesAdded, avgWithout.linesAdded)} |`);
    console.log(`| LOC net delta  | ${avgWith.netDelta} | ${avgWithout.netDelta} | ${pctDelta(avgWith.netDelta, avgWithout.netDelta)} |`);
    console.log(`| Files changed  | ${avgWith.filesChanged} | ${avgWithout.filesChanged} | ${pctDelta(avgWith.filesChanged, avgWithout.filesChanged)} |`);
    console.log(`| Tokens total   | ${avgWith.tokens} | ${avgWithout.tokens} | ${pctDelta(avgWith.tokens, avgWithout.tokens)} |`);
    console.log(`| Duration (ms)  | ${avgWith.duration} | ${avgWithout.duration} | ${pctDelta(avgWith.duration, avgWithout.duration)} |`);
    console.log(`| Runs           | ${withAsc.length} | ${withoutAsc.length} | |`);
    console.log('');
  }
}

function average(runs) {
  const n = runs.length;
  return {
    linesAdded: Math.round(runs.reduce((s, r) => s + r.diff.linesAdded, 0) / n),
    netDelta: Math.round(runs.reduce((s, r) => s + r.diff.netDelta, 0) / n),
    filesChanged: Math.round(runs.reduce((s, r) => s + r.diff.filesChanged, 0) / n),
    tokens: Math.round(runs.reduce((s, r) => s + r.tokens.total, 0) / n),
    duration: Math.round(runs.reduce((s, r) => s + r.durationMs, 0) / n),
  };
}

report().catch((err) => {
  console.error(err);
  process.exit(1);
});
