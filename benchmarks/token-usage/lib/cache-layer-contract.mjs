/**
 * cache-layer-contract.mjs
 *
 * Deterministic Phase 2 prompt segmentation contract. The benchmark harness uses
 * this to separate stable cache candidates from per-request dynamic content.
 */

import crypto from 'node:crypto';

export const CACHE_LAYER_CONTRACT_SCHEMA_VERSION = 'cache-layer-contract-v1';

export const CACHE_LAYER_IDS = Object.freeze({
  STATIC_PREFIX: 'layer-1-static-prefix',
  SEMI_STATIC_CONTEXT: 'layer-2-semi-static-context',
  DYNAMIC_SUFFIX: 'layer-3-dynamic-suffix',
});

export const CACHE_LAYER_DEFINITIONS = Object.freeze({
  [CACHE_LAYER_IDS.STATIC_PREFIX]: Object.freeze({
    cachePolicy: 'stable-cache-candidate',
    allowedInputs: Object.freeze(['AGENTS.md', 'adapter-import-bridges', 'tool-definitions', 'provider-cache-policy']),
    forbiddenInputs: Object.freeze(['user-message', 'diff', 'command-output', 'timestamp']),
  }),
  [CACHE_LAYER_IDS.SEMI_STATIC_CONTEXT]: Object.freeze({
    cachePolicy: 'task-family-cache-candidate',
    allowedInputs: Object.freeze(['selected-rules', 'selected-prompts', 'review-checklists', 'loaded-skills']),
    forbiddenInputs: Object.freeze(['volatile-retrieval', 'session-log', 'test-output']),
  }),
  [CACHE_LAYER_IDS.DYNAMIC_SUFFIX]: Object.freeze({
    cachePolicy: 'never-cache',
    allowedInputs: Object.freeze(['user-message', 'code-snippets', 'diffs', 'command-results', 'conversation-history']),
    forbiddenInputs: Object.freeze([]),
  }),
});

const LAYER_ORDER = Object.freeze([
  CACHE_LAYER_IDS.STATIC_PREFIX,
  CACHE_LAYER_IDS.SEMI_STATIC_CONTEXT,
  CACHE_LAYER_IDS.DYNAMIC_SUFFIX,
]);

export function hashLayerContent(content) {
  if (typeof content !== 'string') {
    throw new TypeError('hashLayerContent: content must be a string');
  }
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function normalizeContent(content) {
  if (content === null || content === undefined) {
    return '';
  }
  if (typeof content !== 'string') {
    throw new TypeError('cache layer content must be a string');
  }
  return content;
}

function buildLayer(id, content, inputSources) {
  const definition = CACHE_LAYER_DEFINITIONS[id];
  if (!definition) {
    throw new TypeError(`buildLayer: unknown layer id ${id}`);
  }
  const normalizedContent = normalizeContent(content);
  const normalizedSources = Array.isArray(inputSources) ? inputSources : [];
  return {
    id,
    cachePolicy: definition.cachePolicy,
    allowedInputs: [...definition.allowedInputs],
    forbiddenInputs: [...definition.forbiddenInputs],
    inputSources: normalizedSources,
    content: normalizedContent,
    contentSha256: hashLayerContent(normalizedContent),
    charLength: normalizedContent.length,
  };
}

export function buildCacheLayerContract({
  layer1StaticPrefix,
  layer2SemiStaticContext = '',
  layer3DynamicSuffix,
  layer2InputSources = [],
}) {
  const layers = [
    buildLayer(CACHE_LAYER_IDS.STATIC_PREFIX, layer1StaticPrefix, ['AGENTS.md']),
    buildLayer(CACHE_LAYER_IDS.SEMI_STATIC_CONTEXT, layer2SemiStaticContext, layer2InputSources),
    buildLayer(CACHE_LAYER_IDS.DYNAMIC_SUFFIX, layer3DynamicSuffix, ['user-message']),
  ];

  return {
    schemaVersion: CACHE_LAYER_CONTRACT_SCHEMA_VERSION,
    layers,
    layer_1_static_prefix: layers[0],
    layer_2_semi_static_context: layers[1],
    layer_3_dynamic_suffix: layers[2],
    full_prompt: layers
      .map((layer) => layer.content.trimEnd())
      .filter((content) => content.length > 0)
      .join('\n\n'),
  };
}

export function validateCacheLayerContract(contract) {
  if (!contract || typeof contract !== 'object') {
    throw new TypeError('validateCacheLayerContract: contract must be an object');
  }
  if (contract.schemaVersion !== CACHE_LAYER_CONTRACT_SCHEMA_VERSION) {
    throw new Error(`Unexpected cache layer schema version: ${contract.schemaVersion}`);
  }
  const ids = contract.layers?.map((layer) => layer.id) ?? [];
  if (JSON.stringify(ids) !== JSON.stringify([...LAYER_ORDER])) {
    throw new Error(`Unexpected cache layer order: ${ids.join(', ')}`);
  }
  for (const layer of contract.layers) {
    if (layer.contentSha256 !== hashLayerContent(layer.content)) {
      throw new Error(`Layer hash mismatch for ${layer.id}`);
    }
  }
  if (contract.layer_3_dynamic_suffix.content.length === 0) {
    throw new Error('Layer 3 dynamic suffix must not be empty');
  }
  return true;
}
