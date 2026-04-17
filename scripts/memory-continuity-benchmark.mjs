#!/usr/bin/env node

/**
 * memory-continuity-benchmark.mjs
 *
 * Provider-agnostic continuity benchmark for cross-agent memory retrieval.
 * Measures new-session hydration relevance, token savings, and privacy redaction safety.
 */

import { existsSync, readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MEMORY_SCHEMA_VERSION,
  SUPPORTED_MEMORY_ADAPTER_IDS,
  normalizeMemoryObservation,
  buildSessionStartIndex,
  hydrateIndexedObservations,
  estimateTokenUsage,
} from '../lib/cli/memory-continuity.mjs';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_FILE_PATH);
const REPOSITORY_ROOT = resolve(SCRIPT_DIR, '..');
const ARGUMENT_FLAGS = new Set(process.argv.slice(2));
const isStdoutOnlyMode = ARGUMENT_FLAGS.has('--stdout-only');

const MEMORY_SCHEMA_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'memory-schema-v1.json');
const MEMORY_ADAPTER_CONTRACT_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'memory-adapter-contract.json');
const OUTPUT_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'memory-continuity-benchmark.json');

const THRESHOLDS = {
  minimumRelevantRecall: 0.8,
  minimumSessionStartTokenSavingsPercent: 35,
  maximumUnsafeObservationCount: 0,
};

const MEMORY_FIXTURES = [
  {
    id: 'obs-001',
    adapterId: 'claude-code',
    eventType: 'decision',
    projectId: 'agentic-senior-core',
    sessionId: 'session-a',
    timestamp: '2026-04-17T02:30:00.000Z',
    title: 'Docker development lane agreed',
    summary: 'Team agreed Docker for development and production lanes with separate optimization priorities.',
    detail: 'Use compose for local build loop. Production images must stay minimal. api_key=prod-key-placeholder should be stored outside code.',
    tags: ['docker', 'dev-prod-split', 'runtime'],
    privacyLevel: 'internal',
  },
  {
    id: 'obs-002',
    adapterId: 'gemini-cli',
    eventType: 'context',
    projectId: 'agentic-senior-core',
    sessionId: 'session-b',
    timestamp: '2026-04-17T02:31:00.000Z',
    title: 'Runtime environment policy',
    summary: 'Windows and Linux or WSL command context should be explicit in generated guidance.',
    detail: 'Runtime hint: prefer linux-wsl for container tasks on Windows hosts. <private>internal machine hostname and user alias</private>',
    tags: ['runtime', 'linux-wsl', 'windows'],
    privacyLevel: 'restricted',
  },
  {
    id: 'obs-003',
    adapterId: 'vscode-chat',
    eventType: 'summary',
    projectId: 'agentic-senior-core',
    sessionId: 'session-c',
    timestamp: '2026-04-17T02:32:00.000Z',
    title: 'Frontend excellence baseline',
    summary: 'Frontend rubric must enforce visual direction, typography intent, and responsive behavior checks.',
    detail: 'Use diversity checks for layout and style systems, and avoid template output repetition.',
    tags: ['frontend', 'rubric', 'quality'],
    privacyLevel: 'internal',
  },
  {
    id: 'obs-004',
    adapterId: 'claude-code',
    eventType: 'issue',
    projectId: 'agentic-senior-core',
    sessionId: 'session-d',
    timestamp: '2026-04-17T02:33:00.000Z',
    title: 'Nested template conditional issue',
    summary: 'Nested conditional blocks caused unresolved placeholders in generated docs.',
    detail: 'Fix by precomputing placeholder text before rendering template.',
    tags: ['template', 'rendering', 'fix'],
    privacyLevel: 'internal',
  },
  {
    id: 'obs-005',
    adapterId: 'gemini-cli',
    eventType: 'tool-use',
    projectId: 'agentic-senior-core',
    sessionId: 'session-e',
    timestamp: '2026-04-17T02:34:00.000Z',
    title: 'Benchmark trend report generated',
    summary: 'History and trend csv outputs are generated each run for release-over-release review.',
    detail: 'Artifacts include benchmark-history json and benchmark-trend-report csv for quick chart ingestion.',
    tags: ['benchmark', 'trend', 'history'],
    privacyLevel: 'internal',
  },
];

const CONTINUITY_SCENARIOS = [
  {
    scenarioId: 'docker-lane-hydration',
    query: 'what is docker strategy for development and production',
    expectedObservationIds: ['obs-001'],
  },
  {
    scenarioId: 'runtime-hydration',
    query: 'which runtime target should we prefer on windows with wsl',
    expectedObservationIds: ['obs-002'],
  },
  {
    scenarioId: 'frontend-quality-hydration',
    query: 'show frontend rubric quality decisions',
    expectedObservationIds: ['obs-003'],
  },
];

function readJsonOrNull(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function calculateRecall(expectedObservationIds, selectedIds) {
  if (!Array.isArray(expectedObservationIds) || expectedObservationIds.length === 0) {
    return 1;
  }

  const selectedIdSet = new Set(selectedIds);
  const matchedCount = expectedObservationIds.filter((expectedId) => selectedIdSet.has(expectedId)).length;
  return Number((matchedCount / expectedObservationIds.length).toFixed(4));
}

function summarizePrivacyControls(normalizedObservations) {
  const redactedObservationCount = normalizedObservations.filter(
    (normalizedObservation) => normalizedObservation.privacy.redactionApplied
  ).length;

  const privateTagRedactionCount = normalizedObservations.reduce(
    (countAccumulator, normalizedObservation) => countAccumulator + normalizedObservation.privacy.privateTagRedactionCount,
    0
  );

  const inlineRedactionCount = normalizedObservations.reduce(
    (countAccumulator, normalizedObservation) => countAccumulator + normalizedObservation.privacy.inlineRedactionCount,
    0
  );

  const unsafeObservationCount = normalizedObservations.filter((normalizedObservation) => {
    const detailText = String(normalizedObservation.detail || '');
    return /<private>/i.test(detailText);
  }).length;

  return {
    redactedObservationCount,
    privateTagRedactionCount,
    inlineRedactionCount,
    unsafeObservationCount,
  };
}

function buildAdapterCoverage(adapterContract) {
  const requiredAdapterIds = Array.isArray(adapterContract?.requiredAdapters)
    ? adapterContract.requiredAdapters
    : [...SUPPORTED_MEMORY_ADAPTER_IDS];

  const declaredAdapters = Array.isArray(adapterContract?.adapters)
    ? adapterContract.adapters.map((adapterEntry) => adapterEntry.adapterId)
    : [];

  const availableAdapterIds = Array.from(new Set([
    ...SUPPORTED_MEMORY_ADAPTER_IDS,
    ...declaredAdapters,
  ])).sort();

  const missingAdapterIds = requiredAdapterIds.filter(
    (requiredAdapterId) => !availableAdapterIds.includes(requiredAdapterId)
  );

  return {
    requiredAdapterIds,
    availableAdapterIds,
    missingAdapterIds,
    passed: missingAdapterIds.length === 0,
  };
}

async function runMemoryContinuityBenchmark() {
  const memorySchema = readJsonOrNull(MEMORY_SCHEMA_PATH);
  const memoryAdapterContract = readJsonOrNull(MEMORY_ADAPTER_CONTRACT_PATH);

  const normalizedObservations = MEMORY_FIXTURES.map((memoryFixture) => normalizeMemoryObservation(memoryFixture));

  const fullContextTokenEstimate = normalizedObservations.reduce(
    (tokenAccumulator, normalizedObservation) => tokenAccumulator
      + estimateTokenUsage(normalizedObservation.title)
      + estimateTokenUsage(normalizedObservation.summary)
      + estimateTokenUsage(normalizedObservation.detail),
    0
  );

  const scenarioResults = CONTINUITY_SCENARIOS.map((continuityScenario) => {
    const sessionStartIndex = buildSessionStartIndex(normalizedObservations, {
      queryText: continuityScenario.query,
      limit: 5,
    });

    const hydration = hydrateIndexedObservations(
      sessionStartIndex.indexEntries,
      normalizedObservations,
      { fullFetchLimit: 1 }
    );

    const recall = calculateRecall(continuityScenario.expectedObservationIds, hydration.selectedIds);
    const sessionStartTokenEstimate = sessionStartIndex.totalTokenEstimate + hydration.hydrationTokenEstimate;
    const tokenSavingsPercent = fullContextTokenEstimate === 0
      ? 0
      : Number((((fullContextTokenEstimate - sessionStartTokenEstimate) / fullContextTokenEstimate) * 100).toFixed(2));

    return {
      scenarioId: continuityScenario.scenarioId,
      query: continuityScenario.query,
      expectedObservationIds: continuityScenario.expectedObservationIds,
      indexObservationIds: sessionStartIndex.indexEntries.map((indexEntry) => indexEntry.id),
      hydratedObservationIds: hydration.selectedIds,
      relevantRecall: recall,
      fullContextTokenEstimate,
      sessionStartTokenEstimate,
      sessionStartTokenSavingsPercent: tokenSavingsPercent,
    };
  });

  const averageRelevantRecall = Number((
    scenarioResults.reduce((sum, scenarioResult) => sum + scenarioResult.relevantRecall, 0)
    / scenarioResults.length
  ).toFixed(4));

  const averageSessionStartTokenSavingsPercent = Number((
    scenarioResults.reduce((sum, scenarioResult) => sum + scenarioResult.sessionStartTokenSavingsPercent, 0)
    / scenarioResults.length
  ).toFixed(2));

  const privacyControls = summarizePrivacyControls(normalizedObservations);
  const adapterCoverage = buildAdapterCoverage(memoryAdapterContract);

  const checks = [
    {
      checkName: 'adapter-coverage',
      passed: adapterCoverage.passed,
      details: `required=${adapterCoverage.requiredAdapterIds.length} missing=${adapterCoverage.missingAdapterIds.length}`,
    },
    {
      checkName: 'continuity-recall-threshold',
      passed: averageRelevantRecall >= THRESHOLDS.minimumRelevantRecall,
      details: `averageRelevantRecall=${averageRelevantRecall} minimum=${THRESHOLDS.minimumRelevantRecall}`,
    },
    {
      checkName: 'session-start-token-savings-threshold',
      passed: averageSessionStartTokenSavingsPercent >= THRESHOLDS.minimumSessionStartTokenSavingsPercent,
      details: `averageSessionStartTokenSavingsPercent=${averageSessionStartTokenSavingsPercent} minimum=${THRESHOLDS.minimumSessionStartTokenSavingsPercent}`,
    },
    {
      checkName: 'privacy-redaction-safety',
      passed: privacyControls.unsafeObservationCount <= THRESHOLDS.maximumUnsafeObservationCount,
      details: `unsafeObservationCount=${privacyControls.unsafeObservationCount} max=${THRESHOLDS.maximumUnsafeObservationCount}`,
    },
  ];

  const failureCount = checks.filter((checkResult) => !checkResult.passed).length;

  const reportPayload = {
    generatedAt: new Date().toISOString(),
    reportName: 'memory-continuity-benchmark',
    schemaVersion: MEMORY_SCHEMA_VERSION,
    passed: failureCount === 0,
    failureCount,
    thresholds: THRESHOLDS,
    adapterCoverage,
    privacyControls,
    continuitySummary: {
      totalObservationCount: normalizedObservations.length,
      scenarioCount: scenarioResults.length,
      averageRelevantRecall,
      averageSessionStartTokenSavingsPercent,
    },
    scenarios: scenarioResults,
    references: {
      memorySchemaPath: '.agent-context/state/memory-schema-v1.json',
      memoryAdapterContractPath: '.agent-context/state/memory-adapter-contract.json',
      benchmarkOutputPath: '.agent-context/state/memory-continuity-benchmark.json',
      schemaDeclaredVersion: memorySchema?.schemaVersion || null,
      adapterContractVersion: memoryAdapterContract?.schemaVersion || null,
    },
    checks,
  };

  if (!isStdoutOnlyMode) {
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(reportPayload, null, 2) + '\n', 'utf8');
  }

  console.log(JSON.stringify(reportPayload, null, 2));
  process.exit(reportPayload.passed ? 0 : 1);
}

runMemoryContinuityBenchmark().catch((benchmarkError) => {
  const errorMessage = benchmarkError instanceof Error ? benchmarkError.message : String(benchmarkError);
  console.error(`Memory continuity benchmark failed: ${errorMessage}`);
  process.exit(1);
});
