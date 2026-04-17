import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { BLUEPRINT_RECOMMENDATIONS } from './constants.mjs';
import { ensureDirectory, pathExists, toTitleCase } from './utils.mjs';

export const ARCHITECT_DEFAULT_TOKEN_BUDGET = 900;
export const ARCHITECT_DEFAULT_TIMEOUT_MS = 1500;
export const ARCHITECT_MIN_TOKEN_BUDGET = 200;
export const ARCHITECT_MAX_TOKEN_BUDGET = 4000;
export const ARCHITECT_MIN_TIMEOUT_MS = 200;
export const ARCHITECT_MAX_TIMEOUT_MS = 10000;

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

function buildFallbackRecommendation({
  stackFileNames,
  blueprintFileNames,
  tokenBudget,
  timeoutMs,
  usedTokens,
  elapsedMs,
  timeoutTriggered,
}) {
  const fallbackStackFileName = stackFileNames.includes('typescript.md')
    ? 'typescript.md'
    : stackFileNames[0] || 'typescript.md';
  const fallbackBlueprintFileName = resolveRecommendedBlueprintFileName(fallbackStackFileName, blueprintFileNames);

  return {
    projectDescription: '',
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
    },
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
}) {
  const startedAt = Date.now();
  const boundedTokenBudget = clampNumericValue(tokenBudget, ARCHITECT_MIN_TOKEN_BUDGET, ARCHITECT_MAX_TOKEN_BUDGET);
  const boundedTimeoutMs = clampNumericValue(timeoutMs, ARCHITECT_MIN_TIMEOUT_MS, ARCHITECT_MAX_TIMEOUT_MS);
  const normalizedDescription = String(projectDescription || '').trim().toLowerCase();
  const effectiveDescriptionSeed = normalizedDescription || 'general software project';
  let effectiveDescription = effectiveDescriptionSeed;
  let usedTokens = estimateTokenUsage(effectiveDescription) + 120;
  const uncertaintyNotes = [];

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
    });
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
    const totalScore = 0.2 + keywordSignalScore + detectionSignalScore;

    return {
      stackFileName,
      totalScore,
      keywordSignalScore,
      detectionSignalScore,
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
  const signalSummary = strongestCandidate.matchedSignals.length > 0
    ? strongestCandidate.matchedSignals.slice(0, 4).join(', ')
    : 'limited direct stack keywords';

  const rationaleSentences = [
    `I recommend ${toTitleCase(recommendedStackFileName)} with ${toTitleCase(recommendedBlueprintFileName)} for this project.`,
    `The strongest evidence in your description is ${signalSummary}, combined with available repository signals.`,
    `Main trade-off: ${STACK_TRADEOFF_SUMMARIES[recommendedStackFileName] || 'validate ecosystem fit before production rollout.'}`,
  ];

  if (lowConfidence) {
    rationaleSentences.push('Confidence is low, so review alternatives before finalizing architecture.');
  }

  const alternatives = scoredStackCandidates
    .slice(1, 3)
    .map((stackCandidate) => {
      const alternativeBlueprintFileName = resolveRecommendedBlueprintFileName(stackCandidate.stackFileName, blueprintFileNames);
      return {
        stackFileName: stackCandidate.stackFileName,
        blueprintFileName: alternativeBlueprintFileName,
        oneLineTradeoff: STACK_TRADEOFF_SUMMARIES[stackCandidate.stackFileName]
          || 'validate fit with your runtime and team constraints.',
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
    },
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
  const outputLines = [
    '\nArchitecture recommendation (project-description-first):',
    `- Stack: ${toTitleCase(architectureRecommendation.recommendedStackFileName)}`,
    `- Blueprint: ${toTitleCase(architectureRecommendation.recommendedBlueprintFileName)}`,
    `- Confidence: ${architectureRecommendation.confidenceLabel} (${architectureRecommendation.confidenceScore})`,
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
