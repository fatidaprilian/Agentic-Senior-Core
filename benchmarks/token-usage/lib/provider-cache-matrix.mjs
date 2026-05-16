/**
 * Provider prompt-cache metadata for Phase 2 benchmark simulations.
 *
 * This module is intentionally declarative. It records official cache mechanics,
 * thresholds, and pricing confidence without calling provider generation APIs.
 */

import { SUPPORTED_PROVIDER_LIST } from './token-counter.mjs';

export const CACHE_MATRIX_VERIFIED_AT = '2026-05-16';

export const CACHE_MODES = Object.freeze({
  EXPLICIT_BREAKPOINT: 'explicit-breakpoint',
  AUTOMATIC_PREFIX: 'automatic-prefix',
  EXPLICIT_CACHED_CONTENT: 'explicit-cached-content',
  ESTIMATE_ONLY: 'estimate-only',
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const child of Object.values(value)) {
    deepFreeze(child);
  }
  return value;
}

const providerCacheMatrix = {
  anthropic: {
    provider: 'anthropic',
    sourceUrl: 'https://platform.claude.com/docs/en/build-with-claude/prompt-caching',
    sourceType: 'official-docs',
    verifiedAt: CACHE_MATRIX_VERIFIED_AT,
    cacheMode: CACHE_MODES.EXPLICIT_BREAKPOINT,
    blockingGateEligible: true,
    minimumCacheableTokens: {
      default: 1024,
      'claude-sonnet-4-5-20250929': 1024,
    },
    costModel: {
      type: 'documented-multiplier',
      accurate: true,
      projectionQuality: 'official-multiplier',
      units: 'base-input-token-multiplier',
      ttlOptions: {
        '5m': {
          writeMultiplier: 1.25,
          readMultiplier: 0.1,
        },
        '1h': {
          writeMultiplier: 2.0,
          readMultiplier: 0.1,
        },
      },
    },
    mechanics: {
      requestShape: 'cache_control on stable content blocks or top-level automatic caching',
      stablePrefixRequired: true,
      usageFields: ['cache_creation_input_tokens', 'cache_read_input_tokens'],
    },
  },
  openai: {
    provider: 'openai',
    sourceUrl: 'https://developers.openai.com/api/docs/guides/prompt-caching',
    sourceType: 'official-docs',
    verifiedAt: CACHE_MATRIX_VERIFIED_AT,
    cacheMode: CACHE_MODES.AUTOMATIC_PREFIX,
    blockingGateEligible: true,
    minimumCacheableTokens: {
      default: 1024,
    },
    costModel: {
      type: 'model-specific-pricing-required',
      accurate: false,
      projectionQuality: 'eligibility-only',
      units: null,
      reason: 'OpenAI cached-input pricing is model-specific; do not encode a universal multiplier.',
    },
    mechanics: {
      requestShape: 'automatic prefix cache on supported models',
      stablePrefixRequired: true,
      routingHints: ['put static content first', 'put variable content last', 'use stable prompt_cache_key when appropriate'],
      usageFields: ['usage.prompt_tokens_details.cached_tokens'],
    },
  },
  gemini: {
    provider: 'gemini',
    sourceUrl: 'https://ai.google.dev/gemini-api/docs/caching',
    sourceType: 'official-docs',
    verifiedAt: CACHE_MATRIX_VERIFIED_AT,
    cacheMode: CACHE_MODES.EXPLICIT_CACHED_CONTENT,
    blockingGateEligible: true,
    minimumCacheableTokens: {
      default: null,
      'gemini-2.5-flash': 1024,
      'gemini-2.5-pro': 4096,
    },
    costModel: {
      type: 'model-specific-pricing-required',
      accurate: false,
      projectionQuality: 'eligibility-only',
      units: null,
      reason: 'Gemini cache pricing and storage economics are model-specific; do not encode a universal multiplier.',
    },
    mechanics: {
      requestShape: 'explicit cachedContents object for stable corpus, with Gemini 2.5 implicit prefix caching available',
      stablePrefixRequired: true,
      lifecycle: ['ttl', 'expire_time', 'cachedContent reference'],
      usageFields: ['usage_metadata'],
    },
  },
  grok: {
    provider: 'grok',
    sourceUrl: null,
    sourceType: 'none-verified',
    verifiedAt: null,
    cacheMode: CACHE_MODES.ESTIMATE_ONLY,
    blockingGateEligible: false,
    minimumCacheableTokens: {
      default: null,
    },
    costModel: {
      type: 'unsupported-estimate',
      accurate: false,
      projectionQuality: 'none',
      units: null,
      reason: 'No official prompt-caching source was verified for this phase.',
    },
    mechanics: {
      requestShape: 'not modeled',
      stablePrefixRequired: true,
      usageFields: [],
    },
  },
  deepseek: {
    provider: 'deepseek',
    sourceUrl: null,
    sourceType: 'none-verified',
    verifiedAt: null,
    cacheMode: CACHE_MODES.ESTIMATE_ONLY,
    blockingGateEligible: false,
    minimumCacheableTokens: {
      default: null,
    },
    costModel: {
      type: 'unsupported-estimate',
      accurate: false,
      projectionQuality: 'none',
      units: null,
      reason: 'No official prompt-caching source was verified for this phase.',
    },
    mechanics: {
      requestShape: 'not modeled',
      stablePrefixRequired: true,
      usageFields: [],
    },
  },
  qwen: {
    provider: 'qwen',
    sourceUrl: null,
    sourceType: 'none-verified',
    verifiedAt: null,
    cacheMode: CACHE_MODES.ESTIMATE_ONLY,
    blockingGateEligible: false,
    minimumCacheableTokens: {
      default: null,
    },
    costModel: {
      type: 'unsupported-estimate',
      accurate: false,
      projectionQuality: 'none',
      units: null,
      reason: 'No official prompt-caching source was verified for this phase.',
    },
    mechanics: {
      requestShape: 'not modeled',
      stablePrefixRequired: true,
      usageFields: [],
    },
  },
};

const matrixProviders = Object.keys(providerCacheMatrix).sort();
const supportedProviders = [...SUPPORTED_PROVIDER_LIST].sort();

if (JSON.stringify(matrixProviders) !== JSON.stringify(supportedProviders)) {
  throw new Error(
    `provider-cache-matrix: provider set must match token counter providers; got ${matrixProviders.join(', ')}`,
  );
}

export const PROVIDER_CACHE_MATRIX = deepFreeze(providerCacheMatrix);

export function listProviderCacheEntries() {
  return Object.values(PROVIDER_CACHE_MATRIX);
}

export function getProviderCacheEntry(provider) {
  const entry = PROVIDER_CACHE_MATRIX[provider];
  if (!entry) {
    throw new TypeError(
      `getProviderCacheEntry: provider must be one of ${Object.keys(PROVIDER_CACHE_MATRIX).join(', ')}, got ${provider}`,
    );
  }
  return entry;
}

export function getMinimumCacheableTokens(provider, model = 'default') {
  const entry = getProviderCacheEntry(provider);
  return entry.minimumCacheableTokens[model] ?? entry.minimumCacheableTokens.default ?? null;
}

export function hasDocumentedCostModel(provider) {
  return getProviderCacheEntry(provider).costModel.type === 'documented-multiplier';
}

export function isCacheGateEligible(provider) {
  return getProviderCacheEntry(provider).blockingGateEligible === true;
}
