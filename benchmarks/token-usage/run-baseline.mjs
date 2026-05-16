#!/usr/bin/env node
/**
 * run-baseline.mjs
 *
 * Phase 0 baseline orchestrator.
 *
 * Runs each provider runner across all fixtures and aggregates the results into
 * a single JSON output. Writes to benchmarks/results/baseline-{YYYY-MM-DD}.json
 * by default; supply --stdout-only to print to stdout without writing.
 *
 * The baseline measures two scenarios per fixture:
 *   - always_included (AGENTS.md only)
 *   - with_loaded_rules (AGENTS.md plus on-demand-routed rules)
 *
 * For Anthropic and Gemini, native count-tokens APIs are used when the
 * corresponding API key is set (ANTHROPIC_API_KEY, GOOGLE_API_KEY or
 * GEMINI_API_KEY). Otherwise the runner falls back to a tiktoken cl100k_base
 * estimate and reports accurate=false.
 *
 * NOTE: This script does NOT call any generation API and does NOT incur usage
 * cost on the generation endpoints. Only the free count-tokens endpoints are
 * touched, and only when an API key is present.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runClaudeBenchmark } from './runners/claude-runner.mjs';
import { runOpenAiBenchmark } from './runners/openai-runner.mjs';
import { runGeminiBenchmark } from './runners/gemini-runner.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_PATH);
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const RESULTS_DIR = path.join(REPOSITORY_ROOT, 'benchmarks', 'results');

const BASELINE_REPORT_VERSION = '0.1.0';

function todayStamp() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function deriveProviderRunStats(providerRun) {
  const allInaccurate = providerRun.results.every((entry) => entry.accurate === false);
  return {
    provider: providerRun.provider,
    model: providerRun.model,
    fixture_count: providerRun.fixture_count,
    measurement_method: providerRun.results[0]?.measurement_method ?? 'unknown',
    accurate_overall: !allInaccurate
      && providerRun.results.every((entry) => entry.accurate === true),
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const stdoutOnly = args.has('--stdout-only');

  const claudeRun = await runClaudeBenchmark();
  const openAiRun = await runOpenAiBenchmark();
  const geminiRun = await runGeminiBenchmark();

  const providerRuns = [claudeRun, openAiRun, geminiRun];

  const aggregateReport = {
    report_version: BASELINE_REPORT_VERSION,
    generated_at: new Date().toISOString(),
    description:
      'Phase 0 token-usage baseline. Measures system-prompt + user-message token counts'
      + ' across providers using free count-tokens APIs and tiktoken estimates.'
      + ' No generation API was called.',
    schema: {
      scenarios: {
        always_included: 'AGENTS.md only — what every task always ships.',
        with_loaded_rules:
          'AGENTS.md plus rules resolved from expected_rules_triggered — realistic on-demand routing.',
      },
    },
    providers: providerRuns.map(deriveProviderRunStats),
    runs: providerRuns,
  };

  const serialized = JSON.stringify(aggregateReport, null, 2);

  if (stdoutOnly) {
    process.stdout.write(serialized + '\n');
    return;
  }

  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
  const outputFilename = `baseline-${todayStamp()}.json`;
  const outputPath = path.join(RESULTS_DIR, outputFilename);
  fs.writeFileSync(outputPath, serialized + '\n', 'utf8');
  console.log(`Wrote ${path.relative(REPOSITORY_ROOT, outputPath)}`);
}

await main();
