/**
 * Cross-agent memory continuity utilities.
 * Provides provider-agnostic observation normalization, privacy redaction,
 * lightweight indexing, and selective hydration helpers.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import { pathExists } from './utils.mjs';

const PRIVATE_BLOCK_PATTERN = /<private>[\s\S]*?<\/private>/gi;

const INLINE_SENSITIVE_PATTERNS = [
  {
    reason: 'api-key-like-value',
    pattern: /\b(api[_-]?key)\b\s*[:=]\s*[^\s,;]+/gi,
    replacer: (_match, fieldName) => `${fieldName}=[REDACTED]`,
  },
  {
    reason: 'token-like-value',
    pattern: /\b(token)\b\s*[:=]\s*[^\s,;]+/gi,
    replacer: (_match, fieldName) => `${fieldName}=[REDACTED]`,
  },
  {
    reason: 'password-like-value',
    pattern: /\b(password|passwd|pwd)\b\s*[:=]\s*[^\s,;]+/gi,
    replacer: (_match, fieldName) => `${fieldName}=[REDACTED]`,
  },
  {
    reason: 'bearer-token',
    pattern: /\bBearer\s+[A-Za-z0-9._-]+/g,
    replacer: () => 'Bearer [REDACTED]',
  },
];

export const MEMORY_SCHEMA_VERSION = '1.0.0';
export const MEMORY_CONTINUITY_STATE_FILE_NAME = 'memory-continuity.json';

const MEMORY_CONTINUITY_STATE_SCHEMA_VERSION = 'memory-continuity-v1';

export const SUPPORTED_MEMORY_ADAPTER_IDS = Object.freeze([
  'claude-code',
  'gemini-cli',
  'vscode-chat',
]);

export const SUPPORTED_MEMORY_EVENT_TYPES = Object.freeze([
  'prompt',
  'tool-use',
  'decision',
  'summary',
  'issue',
  'context',
]);

function toIsoTimestamp(rawValue) {
  if (typeof rawValue !== 'string' || rawValue.trim().length === 0) {
    return new Date().toISOString();
  }

  const parsedDate = new Date(rawValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return new Date().toISOString();
  }

  return parsedDate.toISOString();
}

function toNonEmptyString(rawValue, fallbackValue = '') {
  if (typeof rawValue !== 'string') {
    return fallbackValue;
  }

  const normalizedValue = rawValue.trim();
  return normalizedValue.length > 0 ? normalizedValue : fallbackValue;
}

function normalizeTags(rawTags) {
  if (!Array.isArray(rawTags)) {
    return [];
  }

  const tagSet = new Set();
  for (const rawTag of rawTags) {
    const normalizedTag = toNonEmptyString(String(rawTag || '')).toLowerCase();
    if (normalizedTag) {
      tagSet.add(normalizedTag);
    }
  }

  return Array.from(tagSet);
}

function normalizeMemoryAdapterIds(rawAdapterIds) {
  if (!Array.isArray(rawAdapterIds) || rawAdapterIds.length === 0) {
    return [...SUPPORTED_MEMORY_ADAPTER_IDS];
  }

  const normalizedAdapterIdSet = new Set();
  for (const rawAdapterId of rawAdapterIds) {
    const normalizedAdapterId = toNonEmptyString(String(rawAdapterId || '')).toLowerCase();
    if (!normalizedAdapterId) {
      continue;
    }

    if (!SUPPORTED_MEMORY_ADAPTER_IDS.includes(normalizedAdapterId)) {
      continue;
    }

    normalizedAdapterIdSet.add(normalizedAdapterId);
  }

  if (normalizedAdapterIdSet.size === 0) {
    return [...SUPPORTED_MEMORY_ADAPTER_IDS];
  }

  return Array.from(normalizedAdapterIdSet);
}

export function estimateTokenUsage(rawText = '') {
  const normalizedText = String(rawText || '');
  return Math.max(1, Math.ceil(normalizedText.length / 4));
}

export function redactSensitiveMemoryText(rawText = '') {
  let normalizedText = String(rawText || '');
  const redactionReasons = new Set();
  let privateTagRedactionCount = 0;
  let inlineRedactionCount = 0;

  normalizedText = normalizedText.replace(PRIVATE_BLOCK_PATTERN, () => {
    privateTagRedactionCount += 1;
    redactionReasons.add('private-tag');
    return '[REDACTED_PRIVATE_BLOCK]';
  });

  for (const sensitivePattern of INLINE_SENSITIVE_PATTERNS) {
    normalizedText = normalizedText.replace(sensitivePattern.pattern, (...replacerArguments) => {
      inlineRedactionCount += 1;
      redactionReasons.add(sensitivePattern.reason);
      return sensitivePattern.replacer(...replacerArguments);
    });
  }

  return {
    redactedText: normalizedText,
    wasRedacted: privateTagRedactionCount > 0 || inlineRedactionCount > 0,
    privateTagRedactionCount,
    inlineRedactionCount,
    redactionReasons: Array.from(redactionReasons),
  };
}

export function normalizeMemoryObservation(rawObservation, options = {}) {
  const fallbackAdapterId = options.fallbackAdapterId || 'unknown-adapter';
  const observationId = toNonEmptyString(rawObservation?.id, `${fallbackAdapterId}-${Date.now()}`);
  const adapterId = toNonEmptyString(rawObservation?.adapterId, fallbackAdapterId);

  const eventTypeCandidate = toNonEmptyString(rawObservation?.eventType, 'context').toLowerCase();
  const eventType = SUPPORTED_MEMORY_EVENT_TYPES.includes(eventTypeCandidate)
    ? eventTypeCandidate
    : 'context';

  const rawDetail = toNonEmptyString(rawObservation?.detail, '');
  const detailRedaction = redactSensitiveMemoryText(rawDetail);

  const rawSummary = toNonEmptyString(rawObservation?.summary, detailRedaction.redactedText.slice(0, 220));
  const summaryRedaction = redactSensitiveMemoryText(rawSummary);

  const title = toNonEmptyString(rawObservation?.title, `${eventType} from ${adapterId}`);
  const tags = normalizeTags(rawObservation?.tags);

  return {
    id: observationId,
    projectId: toNonEmptyString(rawObservation?.projectId, 'default-project'),
    sessionId: toNonEmptyString(rawObservation?.sessionId, 'default-session'),
    adapterId,
    eventType,
    timestamp: toIsoTimestamp(rawObservation?.timestamp),
    title,
    summary: summaryRedaction.redactedText,
    detail: detailRedaction.redactedText,
    tags,
    privacy: {
      level: toNonEmptyString(rawObservation?.privacyLevel, 'internal'),
      redactionApplied: detailRedaction.wasRedacted || summaryRedaction.wasRedacted,
      redactionReasons: Array.from(new Set([
        ...detailRedaction.redactionReasons,
        ...summaryRedaction.redactionReasons,
      ])),
      privateTagRedactionCount: detailRedaction.privateTagRedactionCount + summaryRedaction.privateTagRedactionCount,
      inlineRedactionCount: detailRedaction.inlineRedactionCount + summaryRedaction.inlineRedactionCount,
    },
  };
}

export function scoreObservationRelevance(queryText, normalizedObservation) {
  const normalizedQuery = toNonEmptyString(queryText, '').toLowerCase();
  if (!normalizedQuery) {
    return 0;
  }

  const queryTerms = normalizedQuery
    .split(/\s+/)
    .map((queryTerm) => queryTerm.trim())
    .filter((queryTerm) => queryTerm.length > 2);

  if (queryTerms.length === 0) {
    return 0;
  }

  const searchableContent = [
    normalizedObservation.title,
    normalizedObservation.summary,
    normalizedObservation.detail,
    normalizedObservation.tags.join(' '),
    normalizedObservation.eventType,
    normalizedObservation.adapterId,
  ].join(' ').toLowerCase();

  let matchCount = 0;
  for (const queryTerm of queryTerms) {
    if (searchableContent.includes(queryTerm)) {
      matchCount += 1;
    }
  }

  return Number((matchCount / queryTerms.length).toFixed(4));
}

export function buildSessionStartIndex(normalizedObservations, options = {}) {
  const queryText = toNonEmptyString(options.queryText, '');
  const maxIndexEntries = Number.isFinite(Number(options.limit)) ? Math.max(1, Number(options.limit)) : 8;

  const rankedEntries = normalizedObservations
    .map((normalizedObservation) => {
      const relevanceScore = scoreObservationRelevance(queryText, normalizedObservation);
      const indexLine = `${normalizedObservation.id}|${normalizedObservation.adapterId}|${normalizedObservation.eventType}|${normalizedObservation.title}`;
      const indexTokenEstimate = estimateTokenUsage(indexLine);

      return {
        id: normalizedObservation.id,
        adapterId: normalizedObservation.adapterId,
        eventType: normalizedObservation.eventType,
        timestamp: normalizedObservation.timestamp,
        title: normalizedObservation.title,
        summarySnippet: normalizedObservation.summary.slice(0, 120),
        tags: normalizedObservation.tags,
        relevanceScore,
        indexTokenEstimate,
      };
    })
    .sort((leftEntry, rightEntry) => {
      if (rightEntry.relevanceScore !== leftEntry.relevanceScore) {
        return rightEntry.relevanceScore - leftEntry.relevanceScore;
      }

      return rightEntry.timestamp.localeCompare(leftEntry.timestamp);
    });

  const indexEntries = rankedEntries.slice(0, maxIndexEntries);
  const totalTokenEstimate = indexEntries.reduce(
    (tokenAccumulator, indexEntry) => tokenAccumulator + indexEntry.indexTokenEstimate,
    0
  );

  return {
    indexEntries,
    totalTokenEstimate,
    totalCandidateCount: rankedEntries.length,
  };
}

export function hydrateIndexedObservations(indexEntries, normalizedObservations, options = {}) {
  const fullFetchLimit = Number.isFinite(Number(options.fullFetchLimit))
    ? Math.max(1, Number(options.fullFetchLimit))
    : 2;

  const observationLookup = new Map(normalizedObservations.map((normalizedObservation) => [
    normalizedObservation.id,
    normalizedObservation,
  ]));

  const selectedIds = indexEntries.slice(0, fullFetchLimit).map((indexEntry) => indexEntry.id);
  const hydratedObservations = selectedIds
    .map((selectedId) => observationLookup.get(selectedId))
    .filter(Boolean);

  const hydrationTokenEstimate = hydratedObservations.reduce(
    (tokenAccumulator, hydratedObservation) => tokenAccumulator + estimateTokenUsage(hydratedObservation.detail),
    0
  );

  return {
    selectedIds,
    hydratedObservations,
    hydrationTokenEstimate,
  };
}

export function createMemoryContinuityState(options = {}) {
  const isEnabled = options.isEnabled !== false;
  const sessionStartIndexLimit = Number.isFinite(Number(options.sessionStartIndexLimit))
    ? Math.max(1, Number(options.sessionStartIndexLimit))
    : 8;
  const fullHydrationLimit = Number.isFinite(Number(options.fullHydrationLimit))
    ? Math.max(1, Number(options.fullHydrationLimit))
    : 2;

  return {
    schemaVersion: MEMORY_CONTINUITY_STATE_SCHEMA_VERSION,
    enabled: isEnabled,
    hydrationMode: 'progressive-disclosure',
    adapters: normalizeMemoryAdapterIds(options.adapterIds),
    retrieval: {
      sessionStartIndexLimit,
      fullHydrationLimit,
    },
    privacy: {
      redactPrivateTags: true,
      redactInlineSensitivePatterns: true,
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function readMemoryContinuityState(targetDirectoryPath) {
  const stateFilePath = path.join(
    targetDirectoryPath,
    '.agent-context',
    'state',
    MEMORY_CONTINUITY_STATE_FILE_NAME
  );

  if (!(await pathExists(stateFilePath))) {
    return null;
  }

  try {
    const stateContent = await fs.readFile(stateFilePath, 'utf8');
    const parsedState = JSON.parse(stateContent);
    if (typeof parsedState.enabled !== 'boolean') {
      return null;
    }

    parsedState.adapters = normalizeMemoryAdapterIds(parsedState.adapters);
    return parsedState;
  } catch {
    return null;
  }
}

export async function writeMemoryContinuityState(targetDirectoryPath, memoryContinuityState) {
  const stateDirectoryPath = path.join(targetDirectoryPath, '.agent-context', 'state');
  const stateFilePath = path.join(stateDirectoryPath, MEMORY_CONTINUITY_STATE_FILE_NAME);

  await fs.mkdir(stateDirectoryPath, { recursive: true });
  await fs.writeFile(stateFilePath, JSON.stringify(memoryContinuityState, null, 2) + '\n', 'utf8');
}

export function buildMemoryContinuityGuidanceBlock(memoryContinuityState) {
  if (!memoryContinuityState?.enabled) {
    return [
      'Memory continuity mode is disabled for this repository.',
      'Use explicit session summaries when handing off context across tools.',
    ].join('\n');
  }

  const adapterGuidanceLine = memoryContinuityState.adapters?.length
    ? `Supported adapters: ${memoryContinuityState.adapters.join(', ')}.`
    : `Supported adapters: ${SUPPORTED_MEMORY_ADAPTER_IDS.join(', ')}.`;

  const sessionStartIndexLimit = Number.isFinite(Number(memoryContinuityState.retrieval?.sessionStartIndexLimit))
    ? Number(memoryContinuityState.retrieval.sessionStartIndexLimit)
    : 8;
  const fullHydrationLimit = Number.isFinite(Number(memoryContinuityState.retrieval?.fullHydrationLimit))
    ? Number(memoryContinuityState.retrieval.fullHydrationLimit)
    : 2;

  return [
    'Memory continuity mode is enabled.',
    'Hydration mode: progressive-disclosure.',
    adapterGuidanceLine,
    '',
    'Session-start retrieval policy:',
    `- Load compact index first (limit: ${sessionStartIndexLimit} entries).`,
    `- Hydrate full detail only for highest-value entries (limit: ${fullHydrationLimit}).`,
    '- Always redact sensitive text before persistence (<private> blocks and inline secret-like fields).',
    '',
    'Host compatibility scope:',
    '- Works for local IDE, CLI, and cloud IDE chat hosts that implement the memory adapter contract or MCP retrieval path.',
    '- Generic web chat sessions without repository tools cannot auto-hydrate runtime memory and should rely on manual summary export/import.',
  ].join('\n');
}
