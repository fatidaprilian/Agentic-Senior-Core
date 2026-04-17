/**
 * Cross-agent memory continuity utilities.
 * Provides provider-agnostic observation normalization, privacy redaction,
 * lightweight indexing, and selective hydration helpers.
 */

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
