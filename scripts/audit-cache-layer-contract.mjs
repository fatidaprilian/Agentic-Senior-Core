#!/usr/bin/env node
/**
 * audit-cache-layer-contract.mjs
 *
 * Phase 2 cache-layer integrity gate. Validates provider cache metadata,
 * fixture segmentation, and the emitted cache simulation JSON without calling
 * provider APIs.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CACHE_LAYER_DEFINITIONS,
  CACHE_LAYER_IDS,
  validateCacheLayerContract,
} from '../benchmarks/token-usage/lib/cache-layer-contract.mjs';
import {
  CACHE_MATRIX_VERIFIED_AT,
  PROVIDER_CACHE_MATRIX,
  listProviderCacheEntries,
} from '../benchmarks/token-usage/lib/provider-cache-matrix.mjs';
import {
  buildCacheLayeredScenarioPrompts,
  loadFixtures,
} from '../benchmarks/token-usage/runners/_shared.mjs';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_FILE_PATH), '..');
const DEFAULT_RESULT_PATH = join(REPOSITORY_ROOT, 'benchmarks', 'results', 'cache-phase-2-2026-05-16.json');
const ARGS = new Set(process.argv.slice(2));
const JSON_ONLY = ARGS.has('--json');

const REQUIRED_PROVIDER_KEYS = [
  'provider',
  'sourceUrl',
  'sourceType',
  'verifiedAt',
  'cacheMode',
  'minimumCacheableTokens',
  'costModel',
];

function addViolation(violations, kind, detail, context = {}) {
  violations.push({ kind, detail, ...context });
}

function validateProviderMatrix(violations) {
  for (const entry of listProviderCacheEntries()) {
    for (const key of REQUIRED_PROVIDER_KEYS) {
      if (!(key in entry)) {
        addViolation(violations, 'provider-metadata.missing-key', `${entry.provider} missing ${key}`, { provider: entry.provider });
      }
    }

    if (entry.sourceType === 'official-docs') {
      if (typeof entry.sourceUrl !== 'string' || !entry.sourceUrl.startsWith('https://')) {
        addViolation(violations, 'provider-metadata.invalid-source-url', `${entry.provider} official sourceUrl must be https`, { provider: entry.provider });
      }
      if (entry.verifiedAt !== CACHE_MATRIX_VERIFIED_AT) {
        addViolation(violations, 'provider-metadata.invalid-verified-at', `${entry.provider} verifiedAt must be ${CACHE_MATRIX_VERIFIED_AT}`, { provider: entry.provider });
      }
    }

    if (entry.provider === 'anthropic') {
      const ttlOptions = entry.costModel?.ttlOptions;
      if (ttlOptions?.['5m']?.writeMultiplier !== 1.25 || ttlOptions?.['5m']?.readMultiplier !== 0.1) {
        addViolation(violations, 'provider-metadata.anthropic-5m-multiplier', 'Anthropic 5m cache multipliers drifted');
      }
      if (ttlOptions?.['1h']?.writeMultiplier !== 2.0 || ttlOptions?.['1h']?.readMultiplier !== 0.1) {
        addViolation(violations, 'provider-metadata.anthropic-1h-multiplier', 'Anthropic 1h cache multipliers drifted');
      }
    }

    if (['openai', 'gemini'].includes(entry.provider) && entry.costModel?.accurate !== false) {
      addViolation(violations, 'provider-metadata.fake-universal-pricing', `${entry.provider} must not claim universal accurate pricing`, { provider: entry.provider });
    }
  }
}

function validateLayerDefinitions(violations) {
  const definitionIds = Object.keys(CACHE_LAYER_DEFINITIONS);
  const uniqueDefinitionIds = new Set(definitionIds);
  if (definitionIds.length !== uniqueDefinitionIds.size) {
    addViolation(violations, 'layer-definition.duplicate-id', 'Cache layer definition IDs must be unique');
  }

  const expectedIds = [
    CACHE_LAYER_IDS.STATIC_PREFIX,
    CACHE_LAYER_IDS.SEMI_STATIC_CONTEXT,
    CACHE_LAYER_IDS.DYNAMIC_SUFFIX,
  ];
  if (JSON.stringify(definitionIds) !== JSON.stringify(expectedIds)) {
    addViolation(violations, 'layer-definition.unexpected-order', `Expected ${expectedIds.join(', ')}, got ${definitionIds.join(', ')}`);
  }
}

function validateFixtureSegmentation(violations) {
  const fixtures = loadFixtures();
  let auditedScenarioCount = 0;
  for (const fixture of fixtures) {
    const layered = buildCacheLayeredScenarioPrompts(fixture);
    const scenarios = [
      { name: 'always_included', contract: layered.alwaysIncluded },
      { name: 'with_loaded_rules', contract: layered.withLoadedRules },
    ];

    for (const scenario of scenarios) {
      auditedScenarioCount += 1;
      try {
        validateCacheLayerContract(scenario.contract);
      } catch (error) {
        addViolation(violations, 'fixture-segmentation.invalid-contract', error.message, {
          fixture_id: fixture.id,
          scenario: scenario.name,
        });
      }

      const layerIds = scenario.contract.layers.map((layer) => layer.id);
      if (new Set(layerIds).size !== layerIds.length) {
        addViolation(violations, 'fixture-segmentation.duplicate-layer-id', 'Fixture contract contains duplicate layer IDs', {
          fixture_id: fixture.id,
          scenario: scenario.name,
        });
      }

      for (const layer of [
        scenario.contract.layer_1_static_prefix,
        scenario.contract.layer_2_semi_static_context,
      ]) {
        if (layer.content.includes(fixture.user_message)) {
          addViolation(violations, 'fixture-segmentation.dynamic-leak', `Fixture user message leaked into ${layer.id}`, {
            fixture_id: fixture.id,
            scenario: scenario.name,
          });
        }
      }

      if (scenario.contract.layer_3_dynamic_suffix.content.trim().length === 0) {
        addViolation(violations, 'fixture-segmentation.missing-dynamic-layer', 'Layer 3 dynamic suffix is empty', {
          fixture_id: fixture.id,
          scenario: scenario.name,
        });
      }
    }
  }
  return { fixtureCount: fixtures.length, auditedScenarioCount };
}

function validateSimulationResultJson(violations, resultPath = DEFAULT_RESULT_PATH) {
  if (!existsSync(resultPath)) {
    addViolation(violations, 'result-json.missing', `Missing cache simulation result: ${resultPath}`);
    return { resultPath, resultCount: 0 };
  }

  const parsed = JSON.parse(readFileSync(resultPath, 'utf8'));
  if (parsed.report_version !== '2.0.0') {
    addViolation(violations, 'result-json.schema-version', `Unexpected report_version ${parsed.report_version}`);
  }
  if (!Array.isArray(parsed.results) || parsed.results.length === 0) {
    addViolation(violations, 'result-json.results-empty', 'results must be a non-empty array');
    return { resultPath, resultCount: 0 };
  }

  const expectedResultCount = parsed.fixture_count * parsed.provider_count * parsed.scenario_count;
  if (parsed.results.length !== expectedResultCount) {
    addViolation(violations, 'result-json.result-count', `Expected ${expectedResultCount} rows, got ${parsed.results.length}`);
  }

  for (const result of parsed.results) {
    if (!result.token_counts || !result.economic_projection) {
      addViolation(violations, 'result-json.missing-separation', 'Result must separate token_counts and economic_projection', {
        fixture_id: result.fixture_id,
        provider: result.provider,
        scenario: result.scenario,
      });
      continue;
    }
    if (typeof result.token_counts.layer_3_dynamic_suffix !== 'number' || result.token_counts.layer_3_dynamic_suffix <= 0) {
      addViolation(violations, 'result-json.missing-layer-3-tokens', 'Layer 3 token count must be present and positive', {
        fixture_id: result.fixture_id,
        provider: result.provider,
        scenario: result.scenario,
      });
    }
    if (result.economic_projection.accurate === true && (!result.source?.sourceUrl || !result.source?.verifiedAt)) {
      addViolation(violations, 'result-json.accurate-without-source', 'Accurate projection requires official source metadata', {
        fixture_id: result.fixture_id,
        provider: result.provider,
        scenario: result.scenario,
      });
    }
    if (['openai', 'gemini'].includes(result.provider) && result.economic_projection.first_request_effective_tokens !== null) {
      addViolation(violations, 'result-json.fake-openai-gemini-savings', `${result.provider} must not emit exact savings without pricing metadata`, {
        fixture_id: result.fixture_id,
        scenario: result.scenario,
      });
    }
  }

  return { resultPath, resultCount: parsed.results.length };
}

export function runCacheLayerContractAudit({ resultPath = DEFAULT_RESULT_PATH } = {}) {
  const violations = [];
  validateProviderMatrix(violations);
  validateLayerDefinitions(violations);
  const segmentationStats = validateFixtureSegmentation(violations);
  const resultStats = validateSimulationResultJson(violations, resultPath);

  return {
    auditName: 'audit-cache-layer-contract',
    reportVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    providerCount: Object.keys(PROVIDER_CACHE_MATRIX).length,
    ...segmentationStats,
    ...resultStats,
    violationCount: violations.length,
    violations,
    passed: violations.length === 0,
  };
}

function main() {
  const report = runCacheLayerContractAudit();

  if (JSON_ONLY) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exit(report.passed ? 0 : 1);
  }

  console.log('===============================================');
  console.log('  audit:cache-layer-contract');
  console.log('===============================================');
  console.log(`  Providers:          ${report.providerCount}`);
  console.log(`  Fixtures:           ${report.fixtureCount}`);
  console.log(`  Layered scenarios:  ${report.auditedScenarioCount}`);
  console.log(`  Result rows:        ${report.resultCount}`);
  console.log('');

  if (report.passed) {
    console.log('  Cache layer contract audit clean.');
    process.stderr.write(`AUDIT_CACHE_LAYER_REPORT: ${JSON.stringify({ passed: true, providerCount: report.providerCount, resultCount: report.resultCount })}\n`);
    process.exit(0);
  }

  console.log('  Violations:');
  for (const violation of report.violations) {
    console.log(`    [${violation.kind}] ${violation.detail}`);
  }
  process.stderr.write(`AUDIT_CACHE_LAYER_REPORT: ${JSON.stringify({ passed: false, violationCount: report.violationCount })}\n`);
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('audit-cache-layer-contract.mjs')) {
  main();
}
