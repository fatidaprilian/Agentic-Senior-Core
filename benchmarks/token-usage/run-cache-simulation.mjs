#!/usr/bin/env node
/**
 * run-cache-simulation.mjs
 *
 * Phase 2 offline warm-cache simulator. It reads the benchmark fixture assembly,
 * applies the provider cache matrix, and writes a reproducible JSON report. This
 * script does not call provider generation APIs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { simulateProviderCacheEconomics } from './lib/cache-economics.mjs';
import { listProviderCacheEntries } from './lib/provider-cache-matrix.mjs';
import { buildCacheLayeredScenarioPrompts, loadFixtures } from './runners/_shared.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_PATH);
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const RESULTS_DIR = path.join(REPOSITORY_ROOT, 'benchmarks', 'results');
const CACHE_SIMULATION_REPORT_VERSION = '2.0.0';

const DEFAULT_MODELS = Object.freeze({
  anthropic: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929',
  openai: process.env.OPENAI_MODEL ?? 'gpt-4o-2024-08-06',
  gemini: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  grok: process.env.GROK_MODEL ?? 'grok-4-fast',
  deepseek: process.env.DEEPSEEK_MODEL ?? 'deepseek-v3.1',
  qwen: process.env.QWEN_MODEL ?? 'qwen3-coder-30b',
});

function todayStamp() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function summarizeResults(results) {
  const summary = new Map();
  for (const result of results) {
    const key = `${result.provider}:${result.scenario}`;
    const existing = summary.get(key) ?? {
      provider: result.provider,
      scenario: result.scenario,
      fixture_count: 0,
      layer_1_plus_2_eligible_count: 0,
      average_total_input_tokens: 0,
      average_cacheable_layer_1_plus_2_tokens: 0,
      average_warm_read_effective_tokens: null,
      projectionQuality: result.economic_projection.projectionQuality,
      accurate: result.economic_projection.accurate,
    };
    existing.fixture_count += 1;
    if (result.eligibility.layer_1_plus_2_eligible) {
      existing.layer_1_plus_2_eligible_count += 1;
    }
    existing.average_total_input_tokens += result.token_counts.total_input_tokens;
    existing.average_cacheable_layer_1_plus_2_tokens += result.token_counts.cache_eligible_layer_1_plus_2_tokens;
    if (typeof result.economic_projection.warm_read_effective_tokens === 'number') {
      existing.average_warm_read_effective_tokens =
        (existing.average_warm_read_effective_tokens ?? 0)
        + result.economic_projection.warm_read_effective_tokens;
    }
    summary.set(key, existing);
  }

  return [...summary.values()].map((entry) => ({
    ...entry,
    average_total_input_tokens: entry.average_total_input_tokens / entry.fixture_count,
    average_cacheable_layer_1_plus_2_tokens:
      entry.average_cacheable_layer_1_plus_2_tokens / entry.fixture_count,
    average_warm_read_effective_tokens:
      entry.average_warm_read_effective_tokens === null
        ? null
        : entry.average_warm_read_effective_tokens / entry.fixture_count,
  }));
}

export function buildCacheSimulationReport() {
  const fixtures = loadFixtures();
  const providerEntries = listProviderCacheEntries();
  const results = [];

  for (const fixture of fixtures) {
    const layered = buildCacheLayeredScenarioPrompts(fixture);
    const scenarios = [
      { name: 'always_included', contract: layered.alwaysIncluded },
      { name: 'with_loaded_rules', contract: layered.withLoadedRules },
    ];

    for (const providerEntry of providerEntries) {
      for (const scenario of scenarios) {
        results.push({
          fixture_id: fixture.id,
          fixture_filename: fixture._filename,
          fixture_category: fixture.category,
          ...simulateProviderCacheEconomics({
            provider: providerEntry.provider,
            model: DEFAULT_MODELS[providerEntry.provider],
            scenarioName: scenario.name,
            contract: scenario.contract,
          }),
        });
      }
    }
  }

  return {
    report_version: CACHE_SIMULATION_REPORT_VERSION,
    generated_at: new Date().toISOString(),
    description:
      'Phase 2 offline warm-cache simulation. Separates measured offline token counts from provider economic projections. No generation API was called.',
    token_counting: {
      method: 'tiktoken-cl100k_base-offline-estimate',
      accurate: false,
      reason: 'Offline deterministic simulation avoids provider token-count endpoints and generation APIs.',
    },
    fixture_count: fixtures.length,
    provider_count: providerEntries.length,
    scenario_count: 2,
    providers: providerEntries.map((entry) => ({
      provider: entry.provider,
      cacheMode: entry.cacheMode,
      sourceUrl: entry.sourceUrl,
      verifiedAt: entry.verifiedAt,
      costModelType: entry.costModel.type,
      projectionQuality: entry.costModel.projectionQuality,
    })),
    summary: summarizeResults(results),
    results,
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const stdoutOnly = args.has('--stdout-only');
  const report = buildCacheSimulationReport();
  const serialized = JSON.stringify(report, null, 2);

  if (stdoutOnly) {
    process.stdout.write(serialized + '\n');
    return;
  }

  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
  const outputFilename = `cache-phase-2-${todayStamp()}.json`;
  const outputPath = path.join(RESULTS_DIR, outputFilename);
  fs.writeFileSync(outputPath, serialized + '\n', 'utf8');
  console.log(`Wrote ${path.relative(REPOSITORY_ROOT, outputPath)}`);
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('run-cache-simulation.mjs')) {
  await main();
}
