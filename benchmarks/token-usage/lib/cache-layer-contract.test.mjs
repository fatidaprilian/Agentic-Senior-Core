/**
 * cache-layer-contract.test.mjs
 *
 * Tests for Phase 2 cache-layer segmentation. These tests keep the historical
 * baseline runner shape stable while proving the new layered builder is usable.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CACHE_LAYER_CONTRACT_SCHEMA_VERSION,
  CACHE_LAYER_IDS,
  hashLayerContent,
  validateCacheLayerContract,
} from './cache-layer-contract.mjs';
import {
  buildCacheLayeredScenarioPrompts,
  buildScenarioPrompts,
  loadFixtures,
  measureFixture,
} from '../runners/_shared.mjs';

const fixtures = loadFixtures();

test('cache-layer builder returns the v1 contract shape for every fixture', () => {
  for (const fixture of fixtures) {
    const layered = buildCacheLayeredScenarioPrompts(fixture);
    for (const scenario of [layered.alwaysIncluded, layered.withLoadedRules]) {
      assert.equal(scenario.schemaVersion, CACHE_LAYER_CONTRACT_SCHEMA_VERSION);
      assert.deepEqual(
        scenario.layers.map((layer) => layer.id),
        [
          CACHE_LAYER_IDS.STATIC_PREFIX,
          CACHE_LAYER_IDS.SEMI_STATIC_CONTEXT,
          CACHE_LAYER_IDS.DYNAMIC_SUFFIX,
        ],
      );
      assert.equal(validateCacheLayerContract(scenario), true);
      assert.equal(scenario.full_prompt.includes(fixture.user_message), true);
    }
  }
});

test('Layer 1 static prefix hash stays stable across all fixtures', () => {
  const layerOneHashes = new Set();
  for (const fixture of fixtures) {
    const layered = buildCacheLayeredScenarioPrompts(fixture);
    layerOneHashes.add(layered.alwaysIncluded.layer_1_static_prefix.contentSha256);
    layerOneHashes.add(layered.withLoadedRules.layer_1_static_prefix.contentSha256);
  }
  assert.equal(layerOneHashes.size, 1);
});

test('Layer 3 dynamic suffix differs when fixture user messages differ', () => {
  const [first, second] = fixtures;
  assert.notEqual(first.user_message, second.user_message);
  const firstLayered = buildCacheLayeredScenarioPrompts(first);
  const secondLayered = buildCacheLayeredScenarioPrompts(second);
  assert.notEqual(
    firstLayered.withLoadedRules.layer_3_dynamic_suffix.contentSha256,
    secondLayered.withLoadedRules.layer_3_dynamic_suffix.contentSha256,
  );
});

test('Layer 1 and Layer 2 do not include exact fixture user messages', () => {
  for (const fixture of fixtures) {
    const layered = buildCacheLayeredScenarioPrompts(fixture);
    for (const scenario of [layered.alwaysIncluded, layered.withLoadedRules]) {
      assert.equal(scenario.layer_1_static_prefix.content.includes(fixture.user_message), false);
      assert.equal(scenario.layer_2_semi_static_context.content.includes(fixture.user_message), false);
      assert.equal(scenario.layer_3_dynamic_suffix.content, fixture.user_message);
    }
  }
});

test('with_loaded_rules full prompt preserves the historical assembly plus user suffix', () => {
  for (const fixture of fixtures) {
    const legacy = buildScenarioPrompts(fixture);
    const layered = buildCacheLayeredScenarioPrompts(fixture);
    const expectedFullPrompt = [
      legacy.withLoadedRules.systemPrompt.trimEnd(),
      legacy.userMessage.trimEnd(),
    ].join('\n\n');
    assert.equal(layered.withLoadedRules.full_prompt, expectedFullPrompt);
  }
});

test('measureFixture result shape remains backward-compatible', async () => {
  const fixture = fixtures[0];
  const countedTexts = [];
  const countFn = async (text, provider, model) => {
    countedTexts.push({ text, provider, model });
    return {
      token_count: Math.max(1, Math.ceil(text.length / 10)),
      method: 'test-counter',
      accurate: true,
    };
  };

  const result = await measureFixture(
    fixture,
    { provider: 'openai', model: 'test-model' },
    countFn,
  );

  assert.deepEqual(Object.keys(result.scenarios).sort(), ['always_included', 'with_loaded_rules']);
  assert.equal('layers' in result.scenarios.always_included, false);
  assert.equal('layers' in result.scenarios.with_loaded_rules, false);
  assert.equal(countedTexts.length, 3);
});

test('hashLayerContent is deterministic sha256 hex', () => {
  const hash = hashLayerContent('stable content');
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.equal(hash, hashLayerContent('stable content'));
  assert.notEqual(hash, hashLayerContent('changed content'));
});
