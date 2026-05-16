/**
 * provider-cache-matrix.test.mjs
 *
 * Tests for the Phase 2 provider prompt-cache metadata. These tests run fully
 * offline and only validate documented mechanics encoded in the local matrix.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SUPPORTED_PROVIDER_LIST } from './token-counter.mjs';
import {
  CACHE_MATRIX_VERIFIED_AT,
  CACHE_MODES,
  PROVIDER_CACHE_MATRIX,
  getMinimumCacheableTokens,
  getProviderCacheEntry,
  hasDocumentedCostModel,
  isCacheGateEligible,
  listProviderCacheEntries,
} from './provider-cache-matrix.mjs';

const OFFICIAL_PROVIDERS = ['anthropic', 'openai', 'gemini'];
const ESTIMATE_ONLY_PROVIDERS = ['grok', 'deepseek', 'qwen'];

test('provider cache matrix covers the benchmark provider set', () => {
  assert.deepEqual(
    Object.keys(PROVIDER_CACHE_MATRIX).sort(),
    [...SUPPORTED_PROVIDER_LIST].sort(),
  );
  assert.equal(listProviderCacheEntries().length, SUPPORTED_PROVIDER_LIST.length);
});

test('official provider entries include source metadata verified on 2026-05-16', () => {
  for (const provider of OFFICIAL_PROVIDERS) {
    const entry = getProviderCacheEntry(provider);
    assert.equal(entry.sourceType, 'official-docs');
    assert.equal(entry.verifiedAt, CACHE_MATRIX_VERIFIED_AT);
    assert.equal(entry.verifiedAt, '2026-05-16');
    assert.match(entry.sourceUrl, /^https:\/\//);
    assert.equal(isCacheGateEligible(provider), true);
  }
});

test('Anthropic encodes exact documented prompt-cache cost multipliers', () => {
  const anthropic = getProviderCacheEntry('anthropic');
  assert.equal(anthropic.cacheMode, CACHE_MODES.EXPLICIT_BREAKPOINT);
  assert.equal(anthropic.costModel.type, 'documented-multiplier');
  assert.equal(anthropic.costModel.accurate, true);
  assert.equal(anthropic.costModel.ttlOptions['5m'].writeMultiplier, 1.25);
  assert.equal(anthropic.costModel.ttlOptions['5m'].readMultiplier, 0.1);
  assert.equal(anthropic.costModel.ttlOptions['1h'].writeMultiplier, 2.0);
  assert.equal(anthropic.costModel.ttlOptions['1h'].readMultiplier, 0.1);
  assert.equal(hasDocumentedCostModel('anthropic'), true);
});

test('OpenAI and Gemini avoid fake universal cache-pricing multipliers', () => {
  for (const provider of ['openai', 'gemini']) {
    const entry = getProviderCacheEntry(provider);
    assert.equal(entry.costModel.type, 'model-specific-pricing-required');
    assert.equal(entry.costModel.accurate, false);
    assert.equal(entry.costModel.projectionQuality, 'eligibility-only');
    assert.equal(entry.costModel.units, null);
    assert.equal(hasDocumentedCostModel(provider), false);
    assert.ok(!('ttlOptions' in entry.costModel));
  }
});

test('provider cache modes match the Phase 2 contract', () => {
  assert.equal(getProviderCacheEntry('anthropic').cacheMode, CACHE_MODES.EXPLICIT_BREAKPOINT);
  assert.equal(getProviderCacheEntry('openai').cacheMode, CACHE_MODES.AUTOMATIC_PREFIX);
  assert.equal(getProviderCacheEntry('gemini').cacheMode, CACHE_MODES.EXPLICIT_CACHED_CONTENT);
  for (const provider of ESTIMATE_ONLY_PROVIDERS) {
    assert.equal(getProviderCacheEntry(provider).cacheMode, CACHE_MODES.ESTIMATE_ONLY);
  }
});

test('minimum cacheable-token thresholds are provider and model aware', () => {
  assert.equal(getMinimumCacheableTokens('anthropic', 'claude-sonnet-4-5-20250929'), 1024);
  assert.equal(getMinimumCacheableTokens('anthropic', 'unknown-claude-model'), 1024);
  assert.equal(getMinimumCacheableTokens('openai', 'gpt-5'), 1024);
  assert.equal(getMinimumCacheableTokens('gemini', 'gemini-2.5-flash'), 1024);
  assert.equal(getMinimumCacheableTokens('gemini', 'gemini-2.5-pro'), 4096);
  assert.equal(getMinimumCacheableTokens('gemini', 'unknown-gemini-model'), null);
});

test('estimate-only providers do not masquerade as documented cache implementations', () => {
  for (const provider of ESTIMATE_ONLY_PROVIDERS) {
    const entry = getProviderCacheEntry(provider);
    assert.equal(entry.sourceUrl, null);
    assert.equal(entry.sourceType, 'none-verified');
    assert.equal(entry.verifiedAt, null);
    assert.equal(entry.blockingGateEligible, false);
    assert.equal(entry.costModel.accurate, false);
    assert.equal(entry.costModel.projectionQuality, 'none');
    assert.equal(isCacheGateEligible(provider), false);
  }
});

test('getProviderCacheEntry rejects unknown providers', () => {
  assert.throws(
    () => getProviderCacheEntry('unknown-provider'),
    /provider must be one of/,
  );
});
