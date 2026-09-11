#!/usr/bin/env node
// Report generator for harness results (headless and OpenCode runners).
// Reads benchmarks/.cache/{headless,opencode}-*.json and prints paired per-task stats:
// median per condition, per-run paired deltas, and a paired bootstrap CI
// (2,000 resamples) per METHODOLOGY.md rule 4.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CACHE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.cache');
const BOOTSTRAP_RESAMPLES = 2000;

async function loadResults() {
    try {
        const files = (await fs.readdir(CACHE_DIR)).filter((f) => (f.startsWith('headless-') || f.startsWith('opencode-')) && f.endsWith('.json'));
        const results = [];
        for (const file of files) {
            results.push(JSON.parse(await fs.readFile(path.join(CACHE_DIR, file), 'utf8')));
        }
        return results;
    } catch {
        return [];
    }
}

function median(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Deterministic PRNG so reports are reproducible.
function mulberry32(seed) {
    return function next() {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Paired bootstrap CI for the median of per-run deltas (withAsc - withoutAsc).
// Pairs are matched by run index within each task.
function pairedBootstrapCi(deltas) {
    if (deltas.length === 0) return { low: 0, high: 0 };
    const random = mulberry32(42);
    const medians = [];
    for (let i = 0; i < BOOTSTRAP_RESAMPLES; i++) {
        const sample = [];
        for (let j = 0; j < deltas.length; j++) {
            sample.push(deltas[Math.floor(random() * deltas.length)]);
        }
        medians.push(median(sample));
    }
    medians.sort((a, b) => a - b);
    const lowIndex = Math.floor(BOOTSTRAP_RESAMPLES * 0.025);
    const highIndex = Math.ceil(BOOTSTRAP_RESAMPLES * 0.975) - 1;
    return { low: medians[lowIndex], high: medians[highIndex] };
}

function pct(medianWith, medianWithout) {
    if (medianWithout === 0) return 'N/A';
    const delta = ((medianWith - medianWithout) / medianWithout) * 100;
    return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`;
}

function summarizeRuns(runs, metricGetter) {
    return runs.map(metricGetter);
}

async function main() {
    const results = await loadResults();
    if (results.length === 0) {
        console.log('No results in benchmarks/.cache/. Run a harness first:');
        console.log('  node benchmarks/harness/opencode-run.mjs --task benchmarks/tasks/greenfield-api --runs 1');
        return;
    }

    const tasks = [...new Set(results.map((r) => r.task))];

    console.log('\n# ASC Headless Benchmark Report\n');

    for (const task of tasks) {
        const withAsc = results.filter((r) => r.task === task && r.condition === 'with-asc');
        const withoutAsc = results.filter((r) => r.task === task && r.condition === 'without-asc');

        if (withAsc.length === 0 || withoutAsc.length === 0) {
            console.log(`## ${task} (incomplete — has ${withAsc.length} with-asc, ${withoutAsc.length} without-asc runs)\n`);
            continue;
        }

        console.log(`## ${task}  (n=${Math.min(withAsc.length, withoutAsc.length)} pairs)\n`);
        console.log('| Metric               | With ASC (median) | Without (median) | Delta   | 95% CI of paired delta | Verdict |');
        console.log('|----------------------|-------------------|------------------|---------|------------------------|---------|');

        const metrics = [
            ['Billed cost (USD)', (r) => r.billedCostUSD],
            ['Prompt tokens', (r) => r.usage.promptTokens],
            ['Cached tokens', (r) => r.usage.cachedTokens],
            ['Output tokens', (r) => r.usage.completionTokens],
            ['Turns', (r) => r.usage.turns],
            ['Duration (ms)', (r) => r.durationMs],
            ['LOC net delta', (r) => r.diff.netDelta],
        ];

        for (const [label, getter] of metrics) {
            const withValues = summarizeRuns(withAsc, getter);
            const withoutValues = summarizeRuns(withoutAsc, getter);
            const medWith = median(withValues);
            const medWithout = median(withoutValues);

            // Pair by run index (both conditions run in the same order per task).
            const pairCount = Math.min(withValues.length, withoutValues.length);
            const deltas = [];
            for (let i = 0; i < pairCount; i++) {
                deltas.push(withValues[i] - withoutValues[i]);
            }
            const ci = pairedBootstrapCi(deltas);

            const ciIncludesZero = ci.low <= 0 && ci.high >= 0;
            const verdict = ciIncludesZero
                ? 'no significant difference'
                : (median(deltas) > 0 ? 'ASC higher' : 'ASC lower');

            const ciText = deltas.length >= 3 ? `[${ci.low.toFixed(4)}, ${ci.high.toFixed(4)}]` : 'n<3 (report only)';
            console.log(`| ${label.padEnd(20)} | ${String(medWith).padEnd(17)} | ${String(medWithout).padEnd(16)} | ${pct(medWith, medWithout).padEnd(7)} | ${ciText.padEnd(22)} | ${verdict} |`);
        }
        console.log('');
    }

    console.log('Interpretation per METHODOLOGY.md: if the 95% CI includes zero, report');
    console.log('"no significant difference" — do not claim the point estimate.');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
