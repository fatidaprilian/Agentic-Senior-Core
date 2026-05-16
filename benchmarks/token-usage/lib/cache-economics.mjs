/**
 * cache-economics.mjs
 *
 * Offline warm-cache economics for Phase 2. Counts prompt-layer tokens locally
 * and only projects effective-token economics when the provider matrix includes
 * an official documented cost model.
 */

import { get_encoding } from 'tiktoken';
import {
  getMinimumCacheableTokens,
  getProviderCacheEntry,
  hasDocumentedCostModel,
} from './provider-cache-matrix.mjs';

export const OFFLINE_TOKEN_COUNT_METHOD = 'tiktoken-cl100k_base-offline-estimate';

export function countOfflineTokens(text) {
  if (typeof text !== 'string') {
    throw new TypeError('countOfflineTokens: text must be a string');
  }
  let encoder = null;
  try {
    encoder = get_encoding('cl100k_base');
    return encoder.encode(text).length;
  } finally {
    if (encoder && typeof encoder.free === 'function') {
      encoder.free();
    }
  }
}

export function countContractLayerTokens(contract) {
  if (!contract || typeof contract !== 'object') {
    throw new TypeError('countContractLayerTokens: contract must be an object');
  }
  const layer1Tokens = countOfflineTokens(contract.layer_1_static_prefix.content);
  const layer2Tokens = countOfflineTokens(contract.layer_2_semi_static_context.content);
  const layer3Tokens = countOfflineTokens(contract.layer_3_dynamic_suffix.content);
  return {
    method: OFFLINE_TOKEN_COUNT_METHOD,
    accurate: false,
    layer_1_static_prefix: layer1Tokens,
    layer_2_semi_static_context: layer2Tokens,
    layer_3_dynamic_suffix: layer3Tokens,
    cache_eligible_layer_1_tokens: layer1Tokens,
    cache_eligible_layer_1_plus_2_tokens: layer1Tokens + layer2Tokens,
    total_input_tokens: layer1Tokens + layer2Tokens + layer3Tokens,
  };
}

export function calculateBreakEvenReadCount({
  totalInputTokens,
  firstRequestEffectiveTokens,
  warmReadEffectiveTokens,
}) {
  for (let requestCount = 1; requestCount <= 10000; requestCount += 1) {
    const uncachedCost = requestCount * totalInputTokens;
    const cachedCost = firstRequestEffectiveTokens
      + Math.max(0, requestCount - 1) * warmReadEffectiveTokens;
    if (cachedCost <= uncachedCost) {
      return requestCount;
    }
  }
  return null;
}

function projectDocumentedMultiplierEconomics({ tokenCounts, providerEntry, ttl }) {
  const ttlModel = providerEntry.costModel.ttlOptions[ttl];
  if (!ttlModel) {
    throw new Error(`No documented cache TTL option '${ttl}' for ${providerEntry.provider}`);
  }

  const cacheableTokens = tokenCounts.cache_eligible_layer_1_plus_2_tokens;
  const dynamicTokens = tokenCounts.layer_3_dynamic_suffix;
  const firstRequestEffectiveTokens = cacheableTokens * ttlModel.writeMultiplier + dynamicTokens;
  const warmReadEffectiveTokens = cacheableTokens * ttlModel.readMultiplier + dynamicTokens;

  return {
    accurate: true,
    projectionQuality: providerEntry.costModel.projectionQuality,
    costModelType: providerEntry.costModel.type,
    ttl,
    cacheScope: 'layer-1-plus-layer-2',
    first_request_effective_tokens: firstRequestEffectiveTokens,
    warm_read_effective_tokens: warmReadEffectiveTokens,
    break_even_read_count: calculateBreakEvenReadCount({
      totalInputTokens: tokenCounts.total_input_tokens,
      firstRequestEffectiveTokens,
      warmReadEffectiveTokens,
    }),
    multipliers: ttlModel,
  };
}

function projectEligibilityOnlyEconomics({ providerEntry }) {
  return {
    accurate: false,
    projectionQuality: providerEntry.costModel.projectionQuality,
    costModelType: providerEntry.costModel.type,
    ttl: null,
    cacheScope: null,
    first_request_effective_tokens: null,
    warm_read_effective_tokens: null,
    break_even_read_count: null,
    multipliers: null,
    reason: providerEntry.costModel.reason,
  };
}

export function simulateProviderCacheEconomics({
  provider,
  model,
  scenarioName,
  contract,
  ttl = '5m',
}) {
  const providerEntry = getProviderCacheEntry(provider);
  const tokenCounts = countContractLayerTokens(contract);
  const minimumCacheableTokens = getMinimumCacheableTokens(provider, model);
  const eligibility = {
    minimum_cacheable_tokens: minimumCacheableTokens,
    layer_1_eligible: minimumCacheableTokens === null
      ? false
      : tokenCounts.cache_eligible_layer_1_tokens >= minimumCacheableTokens,
    layer_1_plus_2_eligible: minimumCacheableTokens === null
      ? false
      : tokenCounts.cache_eligible_layer_1_plus_2_tokens >= minimumCacheableTokens,
  };

  const economicProjection = hasDocumentedCostModel(provider)
    ? projectDocumentedMultiplierEconomics({ tokenCounts, providerEntry, ttl })
    : projectEligibilityOnlyEconomics({ providerEntry });

  return {
    provider,
    model,
    scenario: scenarioName,
    cacheMode: providerEntry.cacheMode,
    source: {
      sourceUrl: providerEntry.sourceUrl,
      sourceType: providerEntry.sourceType,
      verifiedAt: providerEntry.verifiedAt,
    },
    token_counts: tokenCounts,
    eligibility,
    economic_projection: economicProjection,
  };
}
