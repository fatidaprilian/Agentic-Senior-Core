/**
 * token-counter.test.mjs
 *
 * Tests for the cross-provider token counter. These tests run fully offline — they
 * do NOT require any API key. When ANTHROPIC_API_KEY or GOOGLE_API_KEY are absent
 * (the default in CI for this Phase 0 work), the counter falls back to the tiktoken
 * cl100k_base estimator, which we still verify produces a stable consistent shape.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countTokens, SUPPORTED_PROVIDER_LIST } from './token-counter.mjs';

const SAMPLE_TEXT_SHORT = 'The quick brown fox jumps over the lazy dog.';
const SAMPLE_TEXT_LONG = 'Lorem ipsum dolor sit amet, '.repeat(20);

const PROVIDER_MODEL_MATRIX = [
  { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' },
  { provider: 'openai', model: 'gpt-4o-2024-08-06' },
  { provider: 'openai', model: 'gpt-4-turbo-2024-04-09' },
  { provider: 'gemini', model: 'gemini-2.5-flash' },
  { provider: 'grok', model: 'grok-4-fast' },
  { provider: 'deepseek', model: 'deepseek-v3.1' },
  { provider: 'qwen', model: 'qwen3-coder-30b' },
];

const REQUIRED_KEYS = ['provider', 'model', 'token_count', 'method', 'accurate'];

test('SUPPORTED_PROVIDER_LIST exposes the six supported providers', () => {
  assert.deepEqual(
    [...SUPPORTED_PROVIDER_LIST].sort(),
    ['anthropic', 'deepseek', 'gemini', 'grok', 'openai', 'qwen'],
  );
});

for (const { provider, model } of PROVIDER_MODEL_MATRIX) {
  test(`countTokens returns a stable shape for ${provider}/${model}`, async () => {
    const result = await countTokens(SAMPLE_TEXT_SHORT, provider, model);
    for (const key of REQUIRED_KEYS) {
      assert.ok(key in result, `expected key '${key}' in result for ${provider}/${model}`);
    }
    assert.equal(result.provider, provider);
    assert.equal(result.model, model);
    assert.equal(typeof result.token_count, 'number');
    assert.ok(Number.isFinite(result.token_count) && result.token_count > 0);
    assert.equal(typeof result.method, 'string');
    assert.ok(result.method.length > 0);
    assert.equal(typeof result.accurate, 'boolean');
  });
}

test('countTokens scales with text length (longer text => more tokens)', async () => {
  const shortResult = await countTokens(SAMPLE_TEXT_SHORT, 'openai', 'gpt-4o-2024-08-06');
  const longResult = await countTokens(SAMPLE_TEXT_LONG, 'openai', 'gpt-4o-2024-08-06');
  assert.ok(
    longResult.token_count > shortResult.token_count,
    `expected longer text to yield more tokens; got short=${shortResult.token_count} long=${longResult.token_count}`,
  );
});

test('countTokens marks Grok / DeepSeek / Qwen as estimates (accurate=false)', async () => {
  for (const provider of ['grok', 'deepseek', 'qwen']) {
    const result = await countTokens(SAMPLE_TEXT_SHORT, provider, 'any-model');
    assert.equal(result.accurate, false, `${provider} should be marked accurate=false`);
    assert.ok(
      result.method.includes('estimate'),
      `${provider} method should mention 'estimate', got '${result.method}'`,
    );
  }
});

test('countTokens flags OpenAI as accurate=true (native tiktoken)', async () => {
  const result = await countTokens(SAMPLE_TEXT_SHORT, 'openai', 'gpt-4o-2024-08-06');
  assert.equal(result.accurate, true, 'OpenAI native counting should be accurate=true');
  assert.ok(result.method.startsWith('tiktoken-'));
});

test('countTokens falls back gracefully for Anthropic when no API key is set', async () => {
  const previousKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    const result = await countTokens(SAMPLE_TEXT_SHORT, 'anthropic', 'claude-sonnet-4-5-20250929');
    assert.equal(result.accurate, false);
    assert.ok(
      result.method.includes('estimate') || result.method.includes('fallback'),
      `expected fallback method, got '${result.method}'`,
    );
    assert.ok(result.token_count > 0);
  } finally {
    if (previousKey !== undefined) {
      process.env.ANTHROPIC_API_KEY = previousKey;
    }
  }
});

test('countTokens falls back gracefully for Gemini when no API key is set', async () => {
  const previousGoogle = process.env.GOOGLE_API_KEY;
  const previousGemini = process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const result = await countTokens(SAMPLE_TEXT_SHORT, 'gemini', 'gemini-2.5-flash');
    assert.equal(result.accurate, false);
    assert.ok(
      result.method.includes('estimate') || result.method.includes('fallback'),
      `expected fallback method, got '${result.method}'`,
    );
    assert.ok(result.token_count > 0);
  } finally {
    if (previousGoogle !== undefined) {
      process.env.GOOGLE_API_KEY = previousGoogle;
    }
    if (previousGemini !== undefined) {
      process.env.GEMINI_API_KEY = previousGemini;
    }
  }
});

test('countTokens rejects invalid provider', async () => {
  await assert.rejects(
    () => countTokens('hello', 'unknown-provider', 'some-model'),
    /provider must be one of/,
  );
});

test('countTokens rejects empty model', async () => {
  await assert.rejects(
    () => countTokens('hello', 'openai', ''),
    /model must be a non-empty string/,
  );
});

test('countTokens rejects non-string text', async () => {
  await assert.rejects(
    () => countTokens(12345, 'openai', 'gpt-4o-2024-08-06'),
    /text must be a string/,
  );
});
