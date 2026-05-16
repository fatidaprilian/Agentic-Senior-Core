/**
 * claude-runner.mjs
 *
 * Anthropic Claude token-usage runner.
 *
 * Measures token counts for the Phase 0 baseline. Uses the free
 * messages.countTokens API when ANTHROPIC_API_KEY is set, otherwise falls back
 * to a tiktoken cl100k_base estimate via the shared token counter.
 */

import { countTokens } from '../lib/token-counter.mjs';
import { loadFixtures, measureFixture } from './_shared.mjs';

const PROVIDER_SPEC = {
  provider: 'anthropic',
  model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929',
};

export async function runClaudeBenchmark() {
  const fixtures = loadFixtures();
  const results = [];
  for (const fixture of fixtures) {
    const entry = await measureFixture(fixture, PROVIDER_SPEC, countTokens);
    results.push(entry);
  }
  return {
    provider: PROVIDER_SPEC.provider,
    model: PROVIDER_SPEC.model,
    fixture_count: fixtures.length,
    results,
  };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('claude-runner.mjs')) {
  const benchmarkOutput = await runClaudeBenchmark();
  process.stdout.write(JSON.stringify(benchmarkOutput, null, 2) + '\n');
}
