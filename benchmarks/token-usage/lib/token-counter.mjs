/**
 * token-counter.mjs
 *
 * Cross-provider token counter for the Phase 0 baseline benchmark.
 *
 * Design goals:
 * - Native counting (accurate) when an SDK supports it locally (tiktoken) or via a free
 *   count-tokens API endpoint (Anthropic, Gemini).
 * - Graceful fallback to a tiktoken cl100k_base estimate when no API key is configured
 *   or the network call fails.
 * - Consistent output shape across all providers so the runner code stays simple.
 *
 * Hard rules from phase-0-baseline.md:
 * - This module MUST NOT call generation APIs. Only count-tokens endpoints are allowed.
 * - All SDKs are in devDependencies, NEVER package.json#dependencies.
 *
 * @module benchmarks/token-usage/lib/token-counter
 */

import { get_encoding, encoding_for_model } from 'tiktoken';

const SUPPORTED_PROVIDERS = new Set([
  'anthropic',
  'openai',
  'gemini',
  'grok',
  'deepseek',
  'qwen',
]);

/**
 * Map a provider+model pair to a tiktoken encoding name. Used both for OpenAI native
 * counting (where the encoding actually matches the model's tokenizer) and as the
 * fallback estimator for providers without a native local tokenizer.
 *
 * @param {string} provider
 * @param {string} model
 * @returns {string}
 */
function pickTiktokenEncoding(provider, model) {
  if (provider === 'openai') {
    const lowered = model.toLowerCase();
    if (
      lowered.includes('gpt-4o')
      || lowered.includes('gpt-4.1')
      || lowered.startsWith('o1')
      || lowered.startsWith('o3')
      || lowered.startsWith('o4')
    ) {
      return 'o200k_base';
    }
    if (lowered.includes('gpt-4') || lowered.includes('gpt-3.5')) {
      return 'cl100k_base';
    }
    return 'cl100k_base';
  }
  return 'cl100k_base';
}

/**
 * Count tokens with tiktoken (synchronous, offline, no network).
 *
 * @param {string} text
 * @param {string} encodingName
 * @returns {number}
 */
function countWithTiktoken(text, encodingName) {
  let encoder = null;
  try {
    encoder = get_encoding(encodingName);
    return encoder.encode(text).length;
  } finally {
    if (encoder && typeof encoder.free === 'function') {
      encoder.free();
    }
  }
}

/**
 * Count tokens for OpenAI models using the matching tiktoken encoder.
 *
 * @param {string} text
 * @param {string} model
 * @returns {Promise<{token_count: number, method: string, accurate: boolean}>}
 */
async function countOpenAi(text, model) {
  let encoder = null;
  try {
    encoder = encoding_for_model(model);
    const tokenCount = encoder.encode(text).length;
    return { token_count: tokenCount, method: 'tiktoken-encoding-for-model', accurate: true };
  } catch {
    const fallbackEncoding = pickTiktokenEncoding('openai', model);
    const tokenCount = countWithTiktoken(text, fallbackEncoding);
    return {
      token_count: tokenCount,
      method: `tiktoken-${fallbackEncoding}-fallback`,
      accurate: true,
    };
  } finally {
    if (encoder && typeof encoder.free === 'function') {
      encoder.free();
    }
  }
}

/**
 * Count tokens for Anthropic Claude via the free count-tokens API. Falls back to a
 * tiktoken cl100k_base estimate when no API key is available or the network fails.
 *
 * @param {string} text
 * @param {string} model
 * @returns {Promise<{token_count: number, method: string, accurate: boolean}>}
 */
async function countAnthropic(text, model) {
  if (!process.env.ANTHROPIC_API_KEY) {
    const tokenCount = countWithTiktoken(text, 'cl100k_base');
    return {
      token_count: tokenCount,
      method: 'tiktoken-cl100k_base-estimate-no-api-key',
      accurate: false,
    };
  }
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic();
    const response = await client.messages.countTokens({
      model,
      messages: [{ role: 'user', content: text }],
    });
    return {
      token_count: response.input_tokens,
      method: 'anthropic-messages-count-tokens',
      accurate: true,
    };
  } catch (error) {
    const tokenCount = countWithTiktoken(text, 'cl100k_base');
    return {
      token_count: tokenCount,
      method: 'tiktoken-cl100k_base-estimate-anthropic-call-failed',
      accurate: false,
      fallback_reason: error?.message ?? String(error),
    };
  }
}

/**
 * Count tokens for Google Gemini via the free count-tokens API. Falls back to a
 * tiktoken cl100k_base estimate when no API key is available or the network fails.
 *
 * @param {string} text
 * @param {string} model
 * @returns {Promise<{token_count: number, method: string, accurate: boolean}>}
 */
async function countGemini(text, model) {
  const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const tokenCount = countWithTiktoken(text, 'cl100k_base');
    return {
      token_count: tokenCount,
      method: 'tiktoken-cl100k_base-estimate-no-api-key',
      accurate: false,
    };
  }
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.countTokens({
      model,
      contents: text,
    });
    const tokenCount = typeof response?.totalTokens === 'number' ? response.totalTokens : 0;
    return {
      token_count: tokenCount,
      method: 'gemini-models-count-tokens',
      accurate: true,
    };
  } catch (error) {
    const tokenCount = countWithTiktoken(text, 'cl100k_base');
    return {
      token_count: tokenCount,
      method: 'tiktoken-cl100k_base-estimate-gemini-call-failed',
      accurate: false,
      fallback_reason: error?.message ?? String(error),
    };
  }
}

/**
 * Count tokens for providers without a native local tokenizer (Grok, DeepSeek, Qwen)
 * using a tiktoken cl100k_base approximation. Always marked accurate=false so consumers
 * know the number is an estimate.
 *
 * @param {string} text
 * @returns {{token_count: number, method: string, accurate: boolean}}
 */
function countViaCl100kEstimate(text) {
  const tokenCount = countWithTiktoken(text, 'cl100k_base');
  return {
    token_count: tokenCount,
    method: 'tiktoken-cl100k_base-estimate',
    accurate: false,
  };
}

/**
 * Count tokens for the given text under a specific provider/model pair.
 *
 * Output shape is stable across providers:
 *   {
 *     provider: string,
 *     model: string,
 *     token_count: number,
 *     method: string,
 *     accurate: boolean,
 *     fallback_reason?: string,
 *   }
 *
 * @param {string} text
 * @param {string} provider - one of: anthropic, openai, gemini, grok, deepseek, qwen
 * @param {string} model
 * @returns {Promise<{provider: string, model: string, token_count: number, method: string, accurate: boolean}>}
 */
export async function countTokens(text, provider, model) {
  if (typeof text !== 'string') {
    throw new TypeError('countTokens: text must be a string');
  }
  if (typeof provider !== 'string' || !SUPPORTED_PROVIDERS.has(provider)) {
    throw new TypeError(
      `countTokens: provider must be one of ${[...SUPPORTED_PROVIDERS].join(', ')}, got ${provider}`,
    );
  }
  if (typeof model !== 'string' || model.length === 0) {
    throw new TypeError('countTokens: model must be a non-empty string');
  }

  let result;
  switch (provider) {
    case 'openai':
      result = await countOpenAi(text, model);
      break;
    case 'anthropic':
      result = await countAnthropic(text, model);
      break;
    case 'gemini':
      result = await countGemini(text, model);
      break;
    case 'grok':
    case 'deepseek':
    case 'qwen':
      result = countViaCl100kEstimate(text);
      break;
    default:
      throw new Error(`countTokens: unhandled provider ${provider}`);
  }

  return {
    provider,
    model,
    ...result,
  };
}

export const SUPPORTED_PROVIDER_LIST = Object.freeze([...SUPPORTED_PROVIDERS]);
