/**
 * cache-economics.test.mjs
 *
 * Tests for the offline Phase 2 warm-cache simulator math.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCacheLayerContract } from './cache-layer-contract.mjs';
import {
  calculateBreakEvenReadCount,
  countOfflineTokens,
  simulateProviderCacheEconomics,
} from './cache-economics.mjs';

function makeContract() {
  return buildCacheLayerContract({
    layer1StaticPrefix: 'stable instructions '.repeat(300),
    layer2SemiStaticContext: 'selected rules '.repeat(300),
    layer3DynamicSuffix: 'user request '.repeat(40),
    layer2InputSources: ['rules/testing.md'],
  });
}

test('countOfflineTokens is deterministic and local', () => {
  const first = countOfflineTokens('stable content for tokenizer');
  const second = countOfflineTokens('stable content for tokenizer');
  assert.equal(first, second);
  assert.ok(first > 0);
});

test('Anthropic simulation uses documented write and read multipliers', () => {
  const result = simulateProviderCacheEconomics({
    provider: 'anthropic',
    model: 'claude-sonnet-4-5-20250929',
    scenarioName: 'with_loaded_rules',
    contract: makeContract(),
    ttl: '5m',
  });

  const cacheable = result.token_counts.cache_eligible_layer_1_plus_2_tokens;
  const dynamic = result.token_counts.layer_3_dynamic_suffix;
  assert.equal(result.economic_projection.accurate, true);
  assert.equal(result.economic_projection.first_request_effective_tokens, cacheable * 1.25 + dynamic);
  assert.equal(result.economic_projection.warm_read_effective_tokens, cacheable * 0.1 + dynamic);
  assert.deepEqual(result.economic_projection.multipliers, {
    writeMultiplier: 1.25,
    readMultiplier: 0.1,
  });
});

test('Anthropic one-hour TTL uses the documented 2.0 write multiplier', () => {
  const result = simulateProviderCacheEconomics({
    provider: 'anthropic',
    model: 'claude-sonnet-4-5-20250929',
    scenarioName: 'with_loaded_rules',
    contract: makeContract(),
    ttl: '1h',
  });

  const cacheable = result.token_counts.cache_eligible_layer_1_plus_2_tokens;
  const dynamic = result.token_counts.layer_3_dynamic_suffix;
  assert.equal(result.economic_projection.first_request_effective_tokens, cacheable * 2.0 + dynamic);
  assert.equal(result.economic_projection.warm_read_effective_tokens, cacheable * 0.1 + dynamic);
});

test('OpenAI and Gemini simulations do not invent universal savings multipliers', () => {
  for (const providerSpec of [
    { provider: 'openai', model: 'gpt-4o-2024-08-06' },
    { provider: 'gemini', model: 'gemini-2.5-flash' },
  ]) {
    const result = simulateProviderCacheEconomics({
      ...providerSpec,
      scenarioName: 'with_loaded_rules',
      contract: makeContract(),
    });
    assert.equal(result.economic_projection.accurate, false);
    assert.equal(result.economic_projection.projectionQuality, 'eligibility-only');
    assert.equal(result.economic_projection.first_request_effective_tokens, null);
    assert.equal(result.economic_projection.warm_read_effective_tokens, null);
    assert.equal(result.economic_projection.break_even_read_count, null);
  }
});

test('break-even read count finds the first request count where cached cost wins', () => {
  assert.equal(
    calculateBreakEvenReadCount({
      totalInputTokens: 1100,
      firstRequestEffectiveTokens: 1325,
      warmReadEffectiveTokens: 200,
    }),
    2,
  );
});

test('eligibility respects provider and model thresholds', () => {
  const geminiFlash = simulateProviderCacheEconomics({
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    scenarioName: 'with_loaded_rules',
    contract: makeContract(),
  });
  const geminiPro = simulateProviderCacheEconomics({
    provider: 'gemini',
    model: 'gemini-2.5-pro',
    scenarioName: 'with_loaded_rules',
    contract: makeContract(),
  });

  assert.equal(geminiFlash.eligibility.minimum_cacheable_tokens, 1024);
  assert.equal(geminiPro.eligibility.minimum_cacheable_tokens, 4096);
  assert.equal(typeof geminiFlash.eligibility.layer_1_plus_2_eligible, 'boolean');
  assert.equal(typeof geminiPro.eligibility.layer_1_plus_2_eligible, 'boolean');
});
