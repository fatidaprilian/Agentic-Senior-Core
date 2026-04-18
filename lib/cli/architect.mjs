import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BLUEPRINT_RECOMMENDATIONS } from './constants.mjs';
import { ensureDirectory, pathExists, toTitleCase } from './utils.mjs';

export const ARCHITECT_DEFAULT_TOKEN_BUDGET = 900;
export const ARCHITECT_DEFAULT_TIMEOUT_MS = 1500;
export const ARCHITECT_MIN_TOKEN_BUDGET = 200;
export const ARCHITECT_MAX_TOKEN_BUDGET = 4000;
export const ARCHITECT_MIN_TIMEOUT_MS = 200;
export const ARCHITECT_MAX_TIMEOUT_MS = 10000;
export const ARCHITECT_DEFAULT_RESEARCH_MODE = 'snapshot';

const ARCHITECT_ALLOWED_RESEARCH_MODES = new Set(['snapshot', 'realtime']);
const ARCHITECT_DEFAULT_REALTIME_SIGNAL_ENV_KEY = 'AGENTIC_ARCHITECT_REALTIME_SIGNAL_JSON';
const ARCHITECT_DEFAULT_REALTIME_SIGNAL_PATH_ENV_KEY = 'AGENTIC_ARCHITECT_REALTIME_SIGNAL_PATH';
const ARCHITECT_ALLOWED_PALETTE_ROLES = ['base', 'surface', 'accent', 'success', 'danger'];
const ARCHITECT_ALLOWED_TYPOGRAPHY_SCALES = ['compact', 'balanced', 'expressive'];
const ARCHITECT_ALLOWED_SPACING_PATTERNS = ['compact-grid', 'balanced-grid', 'airy-grid'];
const ARCHITECT_ALLOWED_MOTION_CHARACTERISTICS = [
  'subtle-enter',
  'staggered-reveal',
  'state-feedback',
  'conversion-focus',
  'calm-transition',
];

const ARCHITECT_MODULE_FILE_PATH = fileURLToPath(import.meta.url);
const ARCHITECT_PACKAGE_ROOT = path.resolve(path.dirname(ARCHITECT_MODULE_FILE_PATH), '..', '..');
const ARCHITECT_RESEARCH_SNAPSHOT_FILE_PATH = path.join(
  ARCHITECT_PACKAGE_ROOT,
  '.agent-context',
  'state',
  'stack-research-snapshot.json'
);

const FALLBACK_STACK_RESEARCH_SNAPSHOT = {
  schemaVersion: '1.0.0',
  snapshotId: 'ecosystem-signals-fallback',
  generatedAt: '2026-04-18T00:00:00.000Z',
  deterministic: true,
  sourceName: 'Agentic-Senior-Core internal fallback snapshot',
  sourceUrl: 'state://stack-research-snapshot/fallback',
  trustedRealtimeSources: [
    {
      sourceId: 'awwwards-trend-feed',
      sourceName: 'Awwwards Trend Feed',
      sourceUrl: 'https://www.awwwards.com',
    },
  ],
  stackSignals: [
    {
      stackFileName: 'typescript.md',
      measuredAt: '2026-04-18T00:00:00.000Z',
      metrics: { ecosystemMaturity: 0.91, talentAvailability: 0.9, deliveryVelocity: 0.89 },
    },
    {
      stackFileName: 'python.md',
      measuredAt: '2026-04-18T00:00:00.000Z',
      metrics: { ecosystemMaturity: 0.92, talentAvailability: 0.88, deliveryVelocity: 0.9 },
    },
    {
      stackFileName: 'java.md',
      measuredAt: '2026-04-18T00:00:00.000Z',
      metrics: { ecosystemMaturity: 0.89, talentAvailability: 0.83, deliveryVelocity: 0.8 },
    },
    {
      stackFileName: 'php.md',
      measuredAt: '2026-04-18T00:00:00.000Z',
      metrics: { ecosystemMaturity: 0.79, talentAvailability: 0.75, deliveryVelocity: 0.84 },
    },
    {
      stackFileName: 'go.md',
      measuredAt: '2026-04-18T00:00:00.000Z',
      metrics: { ecosystemMaturity: 0.84, talentAvailability: 0.78, deliveryVelocity: 0.82 },
    },
    {
      stackFileName: 'csharp.md',
      measuredAt: '2026-04-18T00:00:00.000Z',
      metrics: { ecosystemMaturity: 0.86, talentAvailability: 0.8, deliveryVelocity: 0.79 },
    },
    {
      stackFileName: 'rust.md',
      measuredAt: '2026-04-18T00:00:00.000Z',
      metrics: { ecosystemMaturity: 0.74, talentAvailability: 0.63, deliveryVelocity: 0.67 },
    },
    {
      stackFileName: 'ruby.md',
      measuredAt: '2026-04-18T00:00:00.000Z',
      metrics: { ecosystemMaturity: 0.7, talentAvailability: 0.62, deliveryVelocity: 0.72 },
    },
    {
      stackFileName: 'react-native.md',
      measuredAt: '2026-04-18T00:00:00.000Z',
      metrics: { ecosystemMaturity: 0.72, talentAvailability: 0.67, deliveryVelocity: 0.74 },
    },
    {
      stackFileName: 'flutter.md',
      measuredAt: '2026-04-18T00:00:00.000Z',
      metrics: { ecosystemMaturity: 0.75, talentAvailability: 0.69, deliveryVelocity: 0.76 },
    },
  ],
};

const ARCHITECT_PREFERENCE_FILE_PATH = process.env.AGENTIC_ARCHITECT_PREF_FILE
  ? path.resolve(process.env.AGENTIC_ARCHITECT_PREF_FILE)
  : path.join(os.homedir(), '.agentic-senior-core', 'architect-preferences.json');

const STACK_SIGNAL_WEIGHTS = {
  'typescript.md': [
    { term: 'typescript', weight: 0.9 },
    { term: 'javascript', weight: 0.8 },
    { term: 'node', weight: 0.55 },
    { term: 'next.js', weight: 0.7 },
    { term: 'nextjs', weight: 0.7 },
    { term: 'react', weight: 0.45 },
    { term: 'web app', weight: 0.45 },
    { term: 'frontend', weight: 0.4 },
    { term: 'dashboard', weight: 0.35 },
  ],
  'python.md': [
    { term: 'python', weight: 0.95 },
    { term: 'fastapi', weight: 0.8 },
    { term: 'machine learning', weight: 0.8 },
    { term: 'ml', weight: 0.4 },
    { term: 'data', weight: 0.45 },
    { term: 'ai', weight: 0.45 },
    { term: 'automation', weight: 0.35 },
    { term: 'analytics', weight: 0.35 },
  ],
  'java.md': [
    { term: 'java', weight: 0.9 },
    { term: 'spring', weight: 0.75 },
    { term: 'enterprise', weight: 0.45 },
    { term: 'bank', weight: 0.35 },
    { term: 'regulated', weight: 0.35 },
    { term: 'jvm', weight: 0.35 },
  ],
  'php.md': [
    { term: 'php', weight: 0.9 },
    { term: 'laravel', weight: 0.8 },
    { term: 'cms', weight: 0.4 },
    { term: 'wordpress', weight: 0.35 },
  ],
  'go.md': [
    { term: 'go', weight: 0.5 },
    { term: 'golang', weight: 0.9 },
    { term: 'high throughput', weight: 0.55 },
    { term: 'microservice', weight: 0.45 },
    { term: 'kubernetes', weight: 0.45 },
    { term: 'latency', weight: 0.35 },
    { term: 'concurrency', weight: 0.35 },
  ],
  'csharp.md': [
    { term: '.net', weight: 0.9 },
    { term: 'dotnet', weight: 0.9 },
    { term: 'c#', weight: 0.75 },
    { term: 'asp.net', weight: 0.8 },
    { term: 'microsoft', weight: 0.35 },
  ],
  'rust.md': [
    { term: 'rust', weight: 0.9 },
    { term: 'systems', weight: 0.45 },
    { term: 'performance', weight: 0.35 },
    { term: 'memory safety', weight: 0.4 },
    { term: 'low latency', weight: 0.4 },
  ],
  'ruby.md': [
    { term: 'ruby', weight: 0.9 },
    { term: 'rails', weight: 0.8 },
    { term: 'monolith', weight: 0.35 },
    { term: 'crud', weight: 0.3 },
  ],
  'react-native.md': [
    { term: 'react native', weight: 0.9 },
    { term: 'mobile', weight: 0.4 },
    { term: 'android', weight: 0.35 },
    { term: 'ios', weight: 0.35 },
    { term: 'cross-platform', weight: 0.4 },
  ],
  'flutter.md': [
    { term: 'flutter', weight: 0.95 },
    { term: 'dart', weight: 0.8 },
    { term: 'mobile', weight: 0.4 },
    { term: 'android', weight: 0.35 },
    { term: 'ios', weight: 0.35 },
    { term: 'cross-platform', weight: 0.4 },
  ],
};

const STACK_TRADEOFF_SUMMARIES = {
  'typescript.md': 'great fullstack velocity, but dependency churn and runtime startup need discipline.',
  'python.md': 'fast AI and API delivery, but strict latency targets may need extra optimization.',
  'java.md': 'strong enterprise reliability, but setup and boilerplate are heavier.',
  'php.md': 'rapid web product iteration, but architecture boundaries must be guarded early.',
  'go.md': 'excellent throughput and operational simplicity, but abstractions are intentionally minimal.',
  'csharp.md': 'strong for Microsoft-centered teams, but cross-platform tooling choices should be explicit.',
  'rust.md': 'top performance and safety, but development ramp-up is steeper.',
  'ruby.md': 'high productivity for product teams, but scaling strategy should be planned early.',
  'react-native.md': 'single codebase for mobile, but native edge cases still require platform attention.',
  'flutter.md': 'consistent UI across mobile platforms, but ecosystem fit should be checked per package.',
};

function clampNumericValue(value, minimumValue, maximumValue) {
  return Math.min(Math.max(value, minimumValue), maximumValue);
}

function estimateTokenUsage(textValue) {
  return Math.ceil(String(textValue || '').length / 4);
}

function resolveConfidenceLabel(confidenceScore) {
  if (confidenceScore >= 0.85) {
    return 'high';
  }

  if (confidenceScore >= 0.7) {
    return 'medium';
  }

  return 'low';
}

function resolveRecommendedBlueprintFileName(stackFileName, blueprintFileNames) {
  const recommendedBlueprintFileName = BLUEPRINT_RECOMMENDATIONS[stackFileName] || null;
  if (recommendedBlueprintFileName && blueprintFileNames.includes(recommendedBlueprintFileName)) {
    return recommendedBlueprintFileName;
  }

  return blueprintFileNames[0] || null;
}

function normalizeArchitectResearchMode(rawMode) {
  const normalizedMode = String(rawMode || ARCHITECT_DEFAULT_RESEARCH_MODE).trim().toLowerCase();
  if (ARCHITECT_ALLOWED_RESEARCH_MODES.has(normalizedMode)) {
    return normalizedMode;
  }

  return ARCHITECT_DEFAULT_RESEARCH_MODE;
}

function isValidIsoTimestamp(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

function toIsoTimestamp(value, fallbackValue = new Date().toISOString()) {
  return isValidIsoTimestamp(value) ? new Date(value).toISOString() : fallbackValue;
}

function loadStackResearchSnapshot() {
  try {
    if (!existsSync(ARCHITECT_RESEARCH_SNAPSHOT_FILE_PATH)) {
      return {
        snapshot: FALLBACK_STACK_RESEARCH_SNAPSHOT,
        sourcePath: 'fallback://embedded-snapshot',
      };
    }

    const snapshotContent = readFileSync(ARCHITECT_RESEARCH_SNAPSHOT_FILE_PATH, 'utf8');
    const parsedSnapshot = JSON.parse(snapshotContent);

    if (!Array.isArray(parsedSnapshot?.stackSignals) || parsedSnapshot.stackSignals.length === 0) {
      return {
        snapshot: FALLBACK_STACK_RESEARCH_SNAPSHOT,
        sourcePath: 'fallback://embedded-snapshot',
      };
    }

    return {
      snapshot: parsedSnapshot,
      sourcePath: ARCHITECT_RESEARCH_SNAPSHOT_FILE_PATH,
    };
  } catch {
    return {
      snapshot: FALLBACK_STACK_RESEARCH_SNAPSHOT,
      sourcePath: 'fallback://embedded-snapshot',
    };
  }
}

function normalizeMetricValue(value, fallbackValue = 0) {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) {
    return fallbackValue;
  }

  return clampNumericValue(parsedValue, 0, 1);
}

function calculateSnapshotSignalScore(snapshotSignalEntry) {
  const metrics = snapshotSignalEntry?.metrics || {};
  const ecosystemMaturity = normalizeMetricValue(metrics.ecosystemMaturity, 0.65);
  const talentAvailability = normalizeMetricValue(metrics.talentAvailability, 0.65);
  const deliveryVelocity = normalizeMetricValue(metrics.deliveryVelocity, 0.65);
  const aggregateScore = (ecosystemMaturity + talentAvailability + deliveryVelocity) / 3;

  return {
    aggregateScore,
    metrics: {
      ecosystemMaturity,
      talentAvailability,
      deliveryVelocity,
    },
  };
}

function parseRealtimeSignalPayloadFromJson(rawJsonContent) {
  try {
    const parsedPayload = JSON.parse(rawJsonContent);
    if (!Array.isArray(parsedPayload?.stackSignals)) {
      return null;
    }

    return parsedPayload;
  } catch {
    return null;
  }
}

function loadRealtimeSignalPayload(realtimeSignalFilePath) {
  const normalizedRealtimeSignalFilePath = String(realtimeSignalFilePath || '').trim();
  if (normalizedRealtimeSignalFilePath) {
    try {
      const absoluteRealtimeSignalPath = path.resolve(normalizedRealtimeSignalFilePath);
      if (existsSync(absoluteRealtimeSignalPath)) {
        const filePayload = parseRealtimeSignalPayloadFromJson(readFileSync(absoluteRealtimeSignalPath, 'utf8'));
        if (filePayload) {
          return {
            payload: filePayload,
            sourcePath: absoluteRealtimeSignalPath,
          };
        }
      }
    } catch {
      // Ignore file loading errors and continue to environment fallback.
    }
  }

  const signalPathFromEnvironment = String(process.env[ARCHITECT_DEFAULT_REALTIME_SIGNAL_PATH_ENV_KEY] || '').trim();
  if (signalPathFromEnvironment) {
    try {
      const absoluteRealtimeSignalPath = path.resolve(signalPathFromEnvironment);
      if (existsSync(absoluteRealtimeSignalPath)) {
        const filePayload = parseRealtimeSignalPayloadFromJson(readFileSync(absoluteRealtimeSignalPath, 'utf8'));
        if (filePayload) {
          return {
            payload: filePayload,
            sourcePath: absoluteRealtimeSignalPath,
          };
        }
      }
    } catch {
      // Ignore file loading errors and continue to environment JSON fallback.
    }
  }

  const signalJsonFromEnvironment = String(process.env[ARCHITECT_DEFAULT_REALTIME_SIGNAL_ENV_KEY] || '').trim();
  if (signalJsonFromEnvironment) {
    const payloadFromEnvironment = parseRealtimeSignalPayloadFromJson(signalJsonFromEnvironment);
    if (payloadFromEnvironment) {
      return {
        payload: payloadFromEnvironment,
        sourcePath: `env://${ARCHITECT_DEFAULT_REALTIME_SIGNAL_ENV_KEY}`,
      };
    }
  }

  return {
    payload: null,
    sourcePath: null,
  };
}

function normalizeStackSignalBoost(value) {
  const normalizedSignal = normalizeMetricValue(value, 0);
  return Number((normalizedSignal * 0.35).toFixed(4));
}

function normalizePaletteRoles(rawPaletteRoles) {
  if (!Array.isArray(rawPaletteRoles) || rawPaletteRoles.length === 0) {
    return ['base', 'surface', 'accent'];
  }

  const sanitizedRoles = rawPaletteRoles
    .map((paletteRole) => String(paletteRole || '').trim().toLowerCase())
    .filter((paletteRole) => ARCHITECT_ALLOWED_PALETTE_ROLES.includes(paletteRole));

  if (sanitizedRoles.length === 0) {
    return ['base', 'surface', 'accent'];
  }

  return Array.from(new Set(sanitizedRoles));
}

function normalizeTypographyScale(rawTypographyScale) {
  const normalizedScale = String(rawTypographyScale || '').trim().toLowerCase();
  if (ARCHITECT_ALLOWED_TYPOGRAPHY_SCALES.includes(normalizedScale)) {
    return normalizedScale;
  }

  return 'balanced';
}

function normalizeSpacingPattern(rawSpacingPattern) {
  const normalizedPattern = String(rawSpacingPattern || '').trim().toLowerCase();
  if (ARCHITECT_ALLOWED_SPACING_PATTERNS.includes(normalizedPattern)) {
    return normalizedPattern;
  }

  return 'balanced-grid';
}

function normalizeMotionCharacteristics(rawMotionCharacteristics) {
  if (!Array.isArray(rawMotionCharacteristics) || rawMotionCharacteristics.length === 0) {
    return ['subtle-enter', 'state-feedback'];
  }

  const sanitizedCharacteristics = rawMotionCharacteristics
    .map((motionCharacteristic) => String(motionCharacteristic || '').trim().toLowerCase())
    .filter((motionCharacteristic) => ARCHITECT_ALLOWED_MOTION_CHARACTERISTICS.includes(motionCharacteristic));

  if (sanitizedCharacteristics.length === 0) {
    return ['subtle-enter', 'state-feedback'];
  }

  return Array.from(new Set(sanitizedCharacteristics));
}

function synthesizeDesignSignals({
  normalizedProjectDescription,
  recommendedStackFileName,
  realtimePayload,
  snapshotGeneratedAt,
}) {
  const descriptionText = String(normalizedProjectDescription || '');
  const looksLikeFinancialSurface = /fraud|bank|payment|regulated|security/.test(descriptionText);
  const looksLikeGrowthSurface = /marketing|landing|conversion|sales|campaign/.test(descriptionText);
  const looksLikeDataProduct = /analytics|dashboard|report|insight|data/.test(descriptionText);

  let paletteRoles = ['base', 'surface', 'accent'];
  let typographyScale = 'balanced';
  let spacingPattern = 'balanced-grid';
  let motionCharacteristics = ['subtle-enter', 'state-feedback'];

  if (looksLikeFinancialSurface) {
    paletteRoles = ['base', 'surface', 'accent', 'danger', 'success'];
    motionCharacteristics = ['calm-transition', 'state-feedback'];
  } else if (looksLikeGrowthSurface) {
    paletteRoles = ['base', 'surface', 'accent', 'success'];
    typographyScale = 'expressive';
    motionCharacteristics = ['staggered-reveal', 'conversion-focus', 'state-feedback'];
  }

  if (looksLikeDataProduct || recommendedStackFileName === 'python.md') {
    spacingPattern = 'compact-grid';
  }

  const realtimeDesignSignals = realtimePayload?.designSignals || null;
  if (realtimeDesignSignals) {
    paletteRoles = normalizePaletteRoles(realtimeDesignSignals.paletteRoles || paletteRoles);
    typographyScale = normalizeTypographyScale(realtimeDesignSignals.typographyScale || typographyScale);
    spacingPattern = normalizeSpacingPattern(realtimeDesignSignals.spacingPattern || spacingPattern);
    motionCharacteristics = normalizeMotionCharacteristics(
      realtimeDesignSignals.motionCharacteristics || motionCharacteristics
    );
  }

  return {
    generatedAt: snapshotGeneratedAt,
    normalizedSignals: {
      paletteRoles,
      typographyScale,
      spacingPattern,
      motionCharacteristics,
    },
    sourcePolicy: {
      normalizedSignalsOnly: true,
      copiedExternalProse: false,
      blockedInputPacks: ['DESIGN.md'],
    },
  };
}

function buildEvidenceCitation({
  citationId,
  sourceType,
  sourceName,
  sourceUrl,
  measuredAt,
  stackFileName,
  metrics,
  note,
}) {
  return {
    citationId,
    sourceType,
    sourceName,
    sourceUrl,
    measuredAt: toIsoTimestamp(measuredAt),
    stackFileName,
    metrics,
    note,
  };
}

function buildFallbackRecommendation({
  stackFileNames,
  blueprintFileNames,
  tokenBudget,
  timeoutMs,
  usedTokens,
  elapsedMs,
  timeoutTriggered,
  requestedResearchMode,
  effectiveResearchMode,
  snapshot,
  snapshotSourcePath,
  realtimeGateEnabled,
  realtimeSignalsLoaded,
  realtimeSignalSourcePath,
  normalizedProjectDescription,
}) {
  const fallbackStackFileName = stackFileNames.includes('typescript.md')
    ? 'typescript.md'
    : stackFileNames[0] || 'typescript.md';
  const fallbackBlueprintFileName = resolveRecommendedBlueprintFileName(fallbackStackFileName, blueprintFileNames);
  const fallbackSnapshotSignal = Array.isArray(snapshot?.stackSignals)
    ? snapshot.stackSignals.find((stackSignal) => stackSignal.stackFileName === fallbackStackFileName) || null
    : null;
  const fallbackSnapshotMetrics = calculateSnapshotSignalScore(fallbackSnapshotSignal);
  const fallbackEvidenceCitations = [
    buildEvidenceCitation({
      citationId: `snapshot:${snapshot?.snapshotId || 'fallback'}:${fallbackStackFileName}`,
      sourceType: 'snapshot',
      sourceName: snapshot?.sourceName || 'Stack research snapshot',
      sourceUrl: snapshot?.sourceUrl || snapshotSourcePath,
      measuredAt: fallbackSnapshotSignal?.measuredAt || snapshot?.generatedAt,
      stackFileName: fallbackStackFileName,
      metrics: fallbackSnapshotMetrics.metrics,
      note: 'Deterministic snapshot baseline used for fallback recommendation.',
    }),
  ];

  const fallbackDesignGuidance = synthesizeDesignSignals({
    normalizedProjectDescription,
    recommendedStackFileName: fallbackStackFileName,
    realtimePayload: null,
    snapshotGeneratedAt: toIsoTimestamp(snapshot?.generatedAt),
  });

  return {
    projectDescription: String(normalizedProjectDescription || '').trim(),
    recommendedStackFileName: fallbackStackFileName,
    recommendedBlueprintFileName: fallbackBlueprintFileName,
    confidenceLabel: 'low',
    confidenceScore: 0.45,
    rationaleSentences: [
      `I recommend ${toTitleCase(fallbackStackFileName)} with ${toTitleCase(fallbackBlueprintFileName)} as a safe fallback path.`,
      'The architecture recommendation budget was constrained before a stronger stack signal could be computed.',
      `Main trade-off: ${STACK_TRADEOFF_SUMMARIES[fallbackStackFileName] || 'validate ecosystem fit before production rollout.'}`,
    ],
    alternatives: [],
    uncertaintyNotes: [
      timeoutTriggered
        ? 'Timeout guardrail triggered before recommendation analysis completed.'
        : 'Input signals were not strong enough for a high-confidence architecture recommendation.',
    ],
    signalSummary: 'fallback mode',
    failureModes: {
      lowConfidence: true,
      dataConflict: false,
      repeatedOverride: false,
      realtimeGated: requestedResearchMode === 'realtime' && !realtimeGateEnabled,
      realtimeUnavailable: requestedResearchMode === 'realtime' && realtimeGateEnabled && !realtimeSignalsLoaded,
    },
    research: {
      requestedMode: requestedResearchMode,
      effectiveMode: effectiveResearchMode,
      deterministic: effectiveResearchMode === 'snapshot',
      snapshotId: snapshot?.snapshotId || 'fallback',
      snapshotGeneratedAt: toIsoTimestamp(snapshot?.generatedAt),
      snapshotSourcePath,
      realtimeGateEnabled,
      realtimeSignalsLoaded,
      realtimeSignalSourcePath,
      trustedRealtimeSources: Array.isArray(snapshot?.trustedRealtimeSources)
        ? snapshot.trustedRealtimeSources
        : [],
    },
    evidenceCitations: fallbackEvidenceCitations,
    designGuidance: fallbackDesignGuidance,
    researchBudget: {
      tokenBudget,
      timeoutMs,
      usedTokens: Math.min(usedTokens, tokenBudget),
      elapsedMs: Math.min(elapsedMs, timeoutMs),
      tokenBudgetCapped: usedTokens >= tokenBudget,
      timeoutTriggered,
    },
  };
}

export function recommendArchitecture({
  projectDescription,
  projectDetection,
  stackFileNames,
  blueprintFileNames,
  tokenBudget = ARCHITECT_DEFAULT_TOKEN_BUDGET,
  timeoutMs = ARCHITECT_DEFAULT_TIMEOUT_MS,
  researchMode = ARCHITECT_DEFAULT_RESEARCH_MODE,
  enableRealtimeResearch = false,
  realtimeSignalFilePath = null,
}) {
  const startedAt = Date.now();
  const boundedTokenBudget = clampNumericValue(tokenBudget, ARCHITECT_MIN_TOKEN_BUDGET, ARCHITECT_MAX_TOKEN_BUDGET);
  const boundedTimeoutMs = clampNumericValue(timeoutMs, ARCHITECT_MIN_TIMEOUT_MS, ARCHITECT_MAX_TIMEOUT_MS);
  const requestedResearchMode = normalizeArchitectResearchMode(researchMode);
  const { snapshot: stackResearchSnapshot, sourcePath: snapshotSourcePath } = loadStackResearchSnapshot();
  const snapshotGeneratedAt = toIsoTimestamp(stackResearchSnapshot.generatedAt);
  const realtimeGateEnabled = requestedResearchMode === 'realtime' && enableRealtimeResearch === true;
  const realtimeSignalPayloadResult = realtimeGateEnabled
    ? loadRealtimeSignalPayload(realtimeSignalFilePath)
    : { payload: null, sourcePath: null };
  const realtimeSignalPayload = realtimeSignalPayloadResult.payload;
  const realtimeSignalsLoaded = Array.isArray(realtimeSignalPayload?.stackSignals)
    && realtimeSignalPayload.stackSignals.length > 0;
  const effectiveResearchMode = realtimeGateEnabled && realtimeSignalsLoaded
    ? 'realtime'
    : 'snapshot';
  const normalizedDescription = String(projectDescription || '').trim().toLowerCase();
  const effectiveDescriptionSeed = normalizedDescription || 'general software project';
  let effectiveDescription = effectiveDescriptionSeed;
  let usedTokens = estimateTokenUsage(effectiveDescription) + 120;
  const uncertaintyNotes = [];

  if (requestedResearchMode === 'realtime' && !realtimeGateEnabled) {
    uncertaintyNotes.push('Realtime research mode requested but gate is off. Using deterministic snapshot baseline.');
  }

  if (requestedResearchMode === 'realtime' && realtimeGateEnabled && !realtimeSignalsLoaded) {
    uncertaintyNotes.push('Realtime research gate is on, but no trusted realtime payload was available. Using deterministic snapshot baseline.');
  }

  if (usedTokens > boundedTokenBudget) {
    effectiveDescription = effectiveDescription.slice(0, Math.max(120, boundedTokenBudget * 4));
    usedTokens = boundedTokenBudget;
    uncertaintyNotes.push('Token budget guardrail trimmed input context before recommendation.');
  }

  if ((Date.now() - startedAt) > boundedTimeoutMs) {
    return buildFallbackRecommendation({
      stackFileNames,
      blueprintFileNames,
      tokenBudget: boundedTokenBudget,
      timeoutMs: boundedTimeoutMs,
      usedTokens,
      elapsedMs: Date.now() - startedAt,
      timeoutTriggered: true,
      requestedResearchMode,
      effectiveResearchMode,
      snapshot: stackResearchSnapshot,
      snapshotSourcePath,
      realtimeGateEnabled,
      realtimeSignalsLoaded,
      realtimeSignalSourcePath: realtimeSignalPayloadResult.sourcePath,
      normalizedProjectDescription: normalizedDescription,
    });
  }

  const snapshotSignalByStackFileName = new Map();
  for (const snapshotSignalEntry of stackResearchSnapshot?.stackSignals || []) {
    if (!snapshotSignalEntry?.stackFileName) {
      continue;
    }

    snapshotSignalByStackFileName.set(snapshotSignalEntry.stackFileName, snapshotSignalEntry);
  }

  const realtimeSignalByStackFileName = new Map();
  if (realtimeSignalsLoaded) {
    for (const realtimeSignalEntry of realtimeSignalPayload.stackSignals) {
      const stackFileName = realtimeSignalEntry?.stackFileName;
      if (!stackFileName || !stackFileNames.includes(stackFileName)) {
        continue;
      }

      const rawRealtimeSignalStrength = realtimeSignalEntry.signalStrength
        ?? realtimeSignalEntry.metrics?.signalStrength
        ?? 0;
      const normalizedRealtimeSignalStrength = normalizeMetricValue(rawRealtimeSignalStrength, 0);
      realtimeSignalByStackFileName.set(stackFileName, {
        signalBoost: normalizeStackSignalBoost(normalizedRealtimeSignalStrength),
        measuredAt: realtimeSignalEntry.measuredAt || realtimeSignalPayload.generatedAt || snapshotGeneratedAt,
        sourceName: realtimeSignalEntry.sourceName || realtimeSignalPayload.sourceName || 'Trusted realtime source',
        sourceUrl: realtimeSignalEntry.sourceUrl || realtimeSignalPayload.sourceUrl || realtimeSignalPayloadResult.sourcePath,
        metrics: {
          signalStrength: normalizedRealtimeSignalStrength,
          freshnessHours: Number(realtimeSignalEntry.metrics?.freshnessHours) || 0,
        },
      });
    }
  }

  const detectionScoreByStackFileName = new Map();
  for (const rankedCandidate of projectDetection?.rankedCandidates || []) {
    const confidenceScore = Number(rankedCandidate.confidenceScore) || 0;
    if (confidenceScore <= 0) {
      continue;
    }

    detectionScoreByStackFileName.set(
      rankedCandidate.stackFileName,
      confidenceScore * 1.75
    );
  }

  const scoredStackCandidates = stackFileNames.map((stackFileName) => {
    const configuredSignals = STACK_SIGNAL_WEIGHTS[stackFileName] || [];
    const matchedSignals = [];
    let keywordSignalScore = 0;

    for (const configuredSignal of configuredSignals) {
      if (!effectiveDescription.includes(configuredSignal.term)) {
        continue;
      }

      keywordSignalScore += configuredSignal.weight;
      matchedSignals.push(configuredSignal.term);
    }

    const detectionSignalScore = detectionScoreByStackFileName.get(stackFileName) || 0;
    const snapshotSignalEntry = snapshotSignalByStackFileName.get(stackFileName) || null;
    const snapshotSignalScorePayload = calculateSnapshotSignalScore(snapshotSignalEntry);
    const snapshotSignalScore = normalizeStackSignalBoost(snapshotSignalScorePayload.aggregateScore);
    const realtimeSignalPayloadEntry = realtimeSignalByStackFileName.get(stackFileName) || null;
    const realtimeSignalScore = realtimeSignalPayloadEntry?.signalBoost || 0;
    const totalScore = 0.2 + keywordSignalScore + detectionSignalScore + snapshotSignalScore + realtimeSignalScore;

    return {
      stackFileName,
      totalScore,
      keywordSignalScore,
      detectionSignalScore,
      snapshotSignalScore,
      snapshotMetrics: snapshotSignalScorePayload.metrics,
      realtimeSignalScore,
      realtimeMetrics: realtimeSignalPayloadEntry?.metrics || null,
      snapshotMeasuredAt: snapshotSignalEntry?.measuredAt || stackResearchSnapshot.generatedAt,
      realtimeMeasuredAt: realtimeSignalPayloadEntry?.measuredAt || null,
      realtimeSourceName: realtimeSignalPayloadEntry?.sourceName || null,
      realtimeSourceUrl: realtimeSignalPayloadEntry?.sourceUrl || null,
      matchedSignals,
    };
  }).sort((leftCandidate, rightCandidate) => rightCandidate.totalScore - leftCandidate.totalScore);

  if (scoredStackCandidates.length === 0) {
    return buildFallbackRecommendation({
      stackFileNames,
      blueprintFileNames,
      tokenBudget: boundedTokenBudget,
      timeoutMs: boundedTimeoutMs,
      usedTokens,
      elapsedMs: Date.now() - startedAt,
      timeoutTriggered: false,
      requestedResearchMode,
      effectiveResearchMode,
      snapshot: stackResearchSnapshot,
      snapshotSourcePath,
      realtimeGateEnabled,
      realtimeSignalsLoaded,
      realtimeSignalSourcePath: realtimeSignalPayloadResult.sourcePath,
      normalizedProjectDescription: normalizedDescription,
    });
  }

  const strongestCandidate = scoredStackCandidates[0];
  const secondCandidate = scoredStackCandidates[1] || null;
  const scoreGap = secondCandidate
    ? strongestCandidate.totalScore - secondCandidate.totalScore
    : strongestCandidate.totalScore;

  let confidenceScore = 0.55
    + Math.min(strongestCandidate.totalScore / 8, 0.25)
    + Math.min(Math.max(scoreGap, 0) / 3, 0.18);

  if (strongestCandidate.matchedSignals.length === 0) {
    confidenceScore -= 0.2;
  }

  if (secondCandidate && scoreGap < 0.18) {
    confidenceScore -= 0.1;
  }

  confidenceScore = clampNumericValue(confidenceScore, 0.35, 0.97);

  const confidenceLabel = resolveConfidenceLabel(confidenceScore);
  const lowConfidence = confidenceScore < 0.7;
  const dataConflict = Boolean(secondCandidate && scoreGap < 0.18);

  if (lowConfidence) {
    uncertaintyNotes.push('Low confidence: description did not map strongly to a single stack profile.');
  }

  if (dataConflict) {
    uncertaintyNotes.push('Data conflict: top stack candidates are close, so trade-offs need manual confirmation.');
  }

  const recommendedStackFileName = strongestCandidate.stackFileName;
  const recommendedBlueprintFileName = resolveRecommendedBlueprintFileName(recommendedStackFileName, blueprintFileNames);
  const signalSummaryParts = [];
  if (strongestCandidate.matchedSignals.length > 0) {
    signalSummaryParts.push(strongestCandidate.matchedSignals.slice(0, 4).join(', '));
  }
  signalSummaryParts.push(`snapshot ${strongestCandidate.snapshotSignalScore.toFixed(2)}`);
  if (strongestCandidate.realtimeSignalScore > 0) {
    signalSummaryParts.push(`realtime ${strongestCandidate.realtimeSignalScore.toFixed(2)}`);
  }
  const signalSummary = signalSummaryParts.join(', ');

  const rationaleSentences = [
    `I recommend ${toTitleCase(recommendedStackFileName)} with ${toTitleCase(recommendedBlueprintFileName)} for this project.`,
    `The strongest evidence in your description is ${signalSummary}, combined with available repository signals.`,
    `Main trade-off: ${STACK_TRADEOFF_SUMMARIES[recommendedStackFileName] || 'validate ecosystem fit before production rollout.'}`,
  ];

  if (lowConfidence) {
    rationaleSentences.push('Confidence is low, so review alternatives before finalizing architecture.');
  }

  const evidenceCitations = [
    buildEvidenceCitation({
      citationId: `snapshot:${stackResearchSnapshot.snapshotId || 'snapshot'}:${recommendedStackFileName}`,
      sourceType: 'snapshot',
      sourceName: stackResearchSnapshot.sourceName || 'Stack research snapshot',
      sourceUrl: stackResearchSnapshot.sourceUrl || snapshotSourcePath,
      measuredAt: strongestCandidate.snapshotMeasuredAt || snapshotGeneratedAt,
      stackFileName: recommendedStackFileName,
      metrics: strongestCandidate.snapshotMetrics,
      note: 'Deterministic stack research snapshot signal.',
    }),
  ];

  if (projectDetection?.recommendedStackFileName) {
    evidenceCitations.push(
      buildEvidenceCitation({
        citationId: `detector:${projectDetection.recommendedStackFileName}`,
        sourceType: 'detection',
        sourceName: 'Existing project marker detector',
        sourceUrl: 'state://project-detection',
        measuredAt: snapshotGeneratedAt,
        stackFileName: projectDetection.recommendedStackFileName,
        metrics: {
          confidenceScore: Number(projectDetection.confidenceScore || 0),
          confidenceGap: Number(projectDetection.confidenceGap || 0),
        },
        note: 'Repository marker detection signal used for stack recommendation bias.',
      })
    );
  }

  if (effectiveResearchMode === 'realtime') {
    const realtimeCitationCandidate = strongestCandidate.realtimeSignalScore > 0
      ? strongestCandidate
      : scoredStackCandidates.find((stackCandidate) => stackCandidate.realtimeSignalScore > 0) || null;

    if (realtimeCitationCandidate) {
      const realtimeCitationOnRecommendedStack = realtimeCitationCandidate.stackFileName === recommendedStackFileName;
      evidenceCitations.push(
        buildEvidenceCitation({
          citationId: `realtime:${realtimeCitationCandidate.stackFileName}`,
          sourceType: 'realtime',
          sourceName: realtimeCitationCandidate.realtimeSourceName || 'Trusted realtime source',
          sourceUrl: realtimeCitationCandidate.realtimeSourceUrl || realtimeSignalPayloadResult.sourcePath,
          measuredAt: realtimeCitationCandidate.realtimeMeasuredAt || snapshotGeneratedAt,
          stackFileName: realtimeCitationCandidate.stackFileName,
          metrics: realtimeCitationCandidate.realtimeMetrics
            || { signalStrength: realtimeCitationCandidate.realtimeSignalScore },
          note: realtimeCitationOnRecommendedStack
            ? 'Optional realtime signal, loaded only when realtime research is explicitly gated on.'
            : 'Optional realtime signal loaded for an alternative stack signal; used as supporting evidence in realtime mode.',
        })
      );
    } else if (realtimeSignalsLoaded && Array.isArray(realtimeSignalPayload?.stackSignals) && realtimeSignalPayload.stackSignals.length > 0) {
      const fallbackRealtimeSignal = realtimeSignalPayload.stackSignals[0];
      const fallbackRealtimeSignalStrength = normalizeMetricValue(
        fallbackRealtimeSignal?.signalStrength
          ?? fallbackRealtimeSignal?.metrics?.signalStrength
          ?? 0,
        0
      );

      evidenceCitations.push(
        buildEvidenceCitation({
          citationId: 'realtime:payload-fallback',
          sourceType: 'realtime',
          sourceName: fallbackRealtimeSignal?.sourceName || realtimeSignalPayload.sourceName || 'Trusted realtime source',
          sourceUrl: fallbackRealtimeSignal?.sourceUrl || realtimeSignalPayload.sourceUrl || realtimeSignalPayloadResult.sourcePath,
          measuredAt: fallbackRealtimeSignal?.measuredAt || realtimeSignalPayload.generatedAt || snapshotGeneratedAt,
          stackFileName: recommendedStackFileName,
          metrics: {
            signalStrength: fallbackRealtimeSignalStrength,
          },
          note: 'Optional realtime payload loaded, but stack mapping did not match current candidate set. Stored as trace citation.',
        })
      );
    }
  }

  const designGuidance = synthesizeDesignSignals({
    normalizedProjectDescription: normalizedDescription,
    recommendedStackFileName,
    realtimePayload: effectiveResearchMode === 'realtime' ? realtimeSignalPayload : null,
    snapshotGeneratedAt,
  });

  const alternatives = scoredStackCandidates
    .slice(1, 3)
    .map((stackCandidate) => {
      const alternativeBlueprintFileName = resolveRecommendedBlueprintFileName(stackCandidate.stackFileName, blueprintFileNames);
      return {
        stackFileName: stackCandidate.stackFileName,
        blueprintFileName: alternativeBlueprintFileName,
        oneLineTradeoff: STACK_TRADEOFF_SUMMARIES[stackCandidate.stackFileName]
          || 'validate fit with your runtime and team constraints.',
        evidenceSummary: `keyword=${stackCandidate.keywordSignalScore.toFixed(2)}, detection=${stackCandidate.detectionSignalScore.toFixed(2)}, snapshot=${stackCandidate.snapshotSignalScore.toFixed(2)}, realtime=${stackCandidate.realtimeSignalScore.toFixed(2)}`,
      };
    });

  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs > boundedTimeoutMs) {
    return buildFallbackRecommendation({
      stackFileNames,
      blueprintFileNames,
      tokenBudget: boundedTokenBudget,
      timeoutMs: boundedTimeoutMs,
      usedTokens,
      elapsedMs,
      timeoutTriggered: true,
      requestedResearchMode,
      effectiveResearchMode,
      snapshot: stackResearchSnapshot,
      snapshotSourcePath,
      realtimeGateEnabled,
      realtimeSignalsLoaded,
      realtimeSignalSourcePath: realtimeSignalPayloadResult.sourcePath,
      normalizedProjectDescription: normalizedDescription,
    });
  }

  return {
    projectDescription: String(projectDescription || '').trim(),
    recommendedStackFileName,
    recommendedBlueprintFileName,
    confidenceLabel,
    confidenceScore: Number(confidenceScore.toFixed(2)),
    rationaleSentences,
    alternatives,
    uncertaintyNotes,
    signalSummary,
    failureModes: {
      lowConfidence,
      dataConflict,
      repeatedOverride: false,
      realtimeGated: requestedResearchMode === 'realtime' && !realtimeGateEnabled,
      realtimeUnavailable: requestedResearchMode === 'realtime' && realtimeGateEnabled && !realtimeSignalsLoaded,
    },
    research: {
      requestedMode: requestedResearchMode,
      effectiveMode: effectiveResearchMode,
      deterministic: effectiveResearchMode === 'snapshot',
      snapshotId: stackResearchSnapshot.snapshotId || 'snapshot',
      snapshotGeneratedAt,
      snapshotSourcePath,
      realtimeGateEnabled,
      realtimeSignalsLoaded,
      realtimeSignalSourcePath: realtimeSignalPayloadResult.sourcePath,
      trustedRealtimeSources: Array.isArray(stackResearchSnapshot.trustedRealtimeSources)
        ? stackResearchSnapshot.trustedRealtimeSources
        : [],
    },
    evidenceCitations,
    designGuidance,
    researchBudget: {
      tokenBudget: boundedTokenBudget,
      timeoutMs: boundedTimeoutMs,
      usedTokens: Math.min(usedTokens, boundedTokenBudget),
      elapsedMs,
      tokenBudgetCapped: usedTokens >= boundedTokenBudget,
      timeoutTriggered: false,
    },
  };
}

export function formatArchitectureRecommendation(architectureRecommendation) {
  const researchModeSummary = architectureRecommendation.research
    ? `${architectureRecommendation.research.requestedMode} -> ${architectureRecommendation.research.effectiveMode}`
    : 'snapshot';
  const outputLines = [
    '\nArchitecture recommendation (project-description-first):',
    `- Stack: ${toTitleCase(architectureRecommendation.recommendedStackFileName)}`,
    `- Blueprint: ${toTitleCase(architectureRecommendation.recommendedBlueprintFileName)}`,
    `- Confidence: ${architectureRecommendation.confidenceLabel} (${architectureRecommendation.confidenceScore})`,
    `- Research mode: ${researchModeSummary}`,
    '- Rationale:',
    ...architectureRecommendation.rationaleSentences.map((sentence, sentenceIndex) => `  ${sentenceIndex + 1}. ${sentence}`),
    '- Alternatives:',
  ];

  if (architectureRecommendation.alternatives.length === 0) {
    outputLines.push('  1. No strong alternatives detected from current input signals.');
  } else {
    outputLines.push(
      ...architectureRecommendation.alternatives.map(
        (alternative, alternativeIndex) => `  ${alternativeIndex + 1}. ${toTitleCase(alternative.stackFileName)} + ${toTitleCase(alternative.blueprintFileName)}: ${alternative.oneLineTradeoff}`
      )
    );
  }

  if (architectureRecommendation.uncertaintyNotes.length > 0) {
    outputLines.push('- Uncertainty notes:');
    outputLines.push(
      ...architectureRecommendation.uncertaintyNotes.map(
        (uncertaintyNote, uncertaintyIndex) => `  ${uncertaintyIndex + 1}. ${uncertaintyNote}`
      )
    );
  }

  const cautionLabels = [];
  if (architectureRecommendation.failureModes.lowConfidence) {
    cautionLabels.push('low-confidence');
  }
  if (architectureRecommendation.failureModes.dataConflict) {
    cautionLabels.push('data-conflict');
  }
  if (architectureRecommendation.failureModes.repeatedOverride) {
    cautionLabels.push('repeated-override');
  }

  if (cautionLabels.length > 0) {
    outputLines.push(`- Caution labels: ${cautionLabels.join(', ')}`);
  }

  if (Array.isArray(architectureRecommendation.evidenceCitations) && architectureRecommendation.evidenceCitations.length > 0) {
    outputLines.push('- Evidence citations (measurable source + timestamp):');
    outputLines.push(
      ...architectureRecommendation.evidenceCitations.map((citationEntry, citationIndex) => {
        const metricsSummary = Object.entries(citationEntry.metrics || {})
          .map(([metricKey, metricValue]) => `${metricKey}=${metricValue}`)
          .join(', ');
        return `  ${citationIndex + 1}. [${citationEntry.sourceType}] ${citationEntry.sourceName} @ ${citationEntry.measuredAt} (${metricsSummary || 'no metrics'})`;
      })
    );
  }

  if (architectureRecommendation.designGuidance?.normalizedSignals) {
    const normalizedSignals = architectureRecommendation.designGuidance.normalizedSignals;
    outputLines.push('- Design signal synthesis (normalized, no copied external prose):');
    outputLines.push(`  1. Palette roles: ${normalizedSignals.paletteRoles.join(', ')}`);
    outputLines.push(`  2. Typography scale: ${normalizedSignals.typographyScale}`);
    outputLines.push(`  3. Spacing pattern: ${normalizedSignals.spacingPattern}`);
    outputLines.push(`  4. Motion characteristics: ${normalizedSignals.motionCharacteristics.join(', ')}`);
  }

  outputLines.push(
    `- Research guardrails: ${architectureRecommendation.researchBudget.usedTokens}/${architectureRecommendation.researchBudget.tokenBudget} tokens, ${architectureRecommendation.researchBudget.elapsedMs}ms/${architectureRecommendation.researchBudget.timeoutMs}ms`
  );

  return outputLines.join('\n');
}

export async function readArchitectPreferenceState() {
  if (!(await pathExists(ARCHITECT_PREFERENCE_FILE_PATH))) {
    return null;
  }

  try {
    const rawPreferenceContent = await fs.readFile(ARCHITECT_PREFERENCE_FILE_PATH, 'utf8');
    const parsedPreferencePayload = JSON.parse(rawPreferenceContent);
    const parsedPreferenceState = parsedPreferencePayload?.preference;

    if (!parsedPreferenceState?.preferredStackFileName) {
      return null;
    }

    return {
      preferredStackFileName: parsedPreferenceState.preferredStackFileName,
      preferredBlueprintFileName: parsedPreferenceState.preferredBlueprintFileName || null,
      overrideCount: Number(parsedPreferenceState.overrideCount) || 0,
      lastOverrideAt: parsedPreferenceState.lastOverrideAt || null,
    };
  } catch {
    return null;
  }
}

export function createUpdatedArchitectPreference(currentPreferenceState, {
  selectedStackFileName,
  selectedBlueprintFileName,
}) {
  const currentOverrideCount = Number(currentPreferenceState?.overrideCount) || 0;

  return {
    preferredStackFileName: selectedStackFileName,
    preferredBlueprintFileName: selectedBlueprintFileName,
    overrideCount: currentOverrideCount + 1,
    lastOverrideAt: new Date().toISOString(),
  };
}

export function shouldApplyRepeatedOverridePreference(preferenceState, recommendedStackFileName) {
  if (!preferenceState?.preferredStackFileName) {
    return false;
  }

  if ((Number(preferenceState.overrideCount) || 0) < 2) {
    return false;
  }

  return preferenceState.preferredStackFileName !== recommendedStackFileName;
}

export async function writeArchitectPreferenceState(preferenceState) {
  const preferencePayload = {
    schemaVersion: '1.0.0',
    updatedAt: new Date().toISOString(),
    preference: {
      preferredStackFileName: preferenceState.preferredStackFileName,
      preferredBlueprintFileName: preferenceState.preferredBlueprintFileName,
      overrideCount: preferenceState.overrideCount,
      lastOverrideAt: preferenceState.lastOverrideAt,
    },
  };

  await ensureDirectory(path.dirname(ARCHITECT_PREFERENCE_FILE_PATH));
  await fs.writeFile(ARCHITECT_PREFERENCE_FILE_PATH, JSON.stringify(preferencePayload, null, 2) + '\n', 'utf8');
}
