/**
 * openai-runner.mjs
 *
 * OpenAI token-usage runner. Uses tiktoken locally — fully offline, accurate,
 * and does not call any API.
 */

import { countTokens } from '../lib/token-counter.mjs';
import { loadFixtures, measureFixture } from './_shared.mjs';

const PROVIDER_SPEC = {
  provider: 'openai',
  model: process.env.OPENAI_MODEL ?? 'gpt-4o-2024-08-06',
};

export async function runOpenAiBenchmark() {
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

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('openai-runner.mjs')) {
  const benchmarkOutput = await runOpenAiBenchmark();
  process.stdout.write(JSON.stringify(benchmarkOutput, null, 2) + '\n');
}
