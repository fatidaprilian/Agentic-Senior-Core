/**
 * gemini-runner.mjs
 *
 * Google Gemini token-usage runner.
 *
 * Uses the free models.countTokens API when GOOGLE_API_KEY (or GEMINI_API_KEY) is
 * set, otherwise falls back to a tiktoken cl100k_base estimate via the shared
 * token counter.
 */

import { countTokens } from '../lib/token-counter.mjs';
import { loadFixtures, measureFixture } from './_shared.mjs';

const PROVIDER_SPEC = {
  provider: 'gemini',
  model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
};

export async function runGeminiBenchmark() {
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

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('gemini-runner.mjs')) {
  const benchmarkOutput = await runGeminiBenchmark();
  process.stdout.write(JSON.stringify(benchmarkOutput, null, 2) + '\n');
}
