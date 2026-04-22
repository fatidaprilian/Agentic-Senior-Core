import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BLUEPRINT_RECOMMENDATIONS } from './constants.mjs';
import { ensureDirectory, pathExists, toTitleCase } from './utils.mjs';

const ARCHITECT_MODULE_FILE_PATH = fileURLToPath(import.meta.url);
const ARCHITECT_PACKAGE_ROOT = path.resolve(path.dirname(ARCHITECT_MODULE_FILE_PATH), '..', '..');

const ARCHITECT_PREFERENCE_FILE_PATH = process.env.AGENTIC_ARCHITECT_PREF_FILE
  ? path.resolve(process.env.AGENTIC_ARCHITECT_PREF_FILE)
  : path.join(os.homedir(), '.agentic-senior-core', 'architect-preferences.json');

// Keyword hints — low-confidence bias only, not authoritative research.
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

/**
 * Generates a repo-grounded architecture brief based on project description
 * keywords and repository marker detection. This is an offline brief —
 * for ecosystem-level research, the consuming agent should perform live
 * web research rather than relying on stale local snapshots.
 */
export function recommendArchitecture({
  projectDescription,
  projectDetection,
  stackFileNames,
  blueprintFileNames,
}) {
  const normalizedDescription = String(projectDescription || '').trim().toLowerCase();
  const effectiveDescription = normalizedDescription || 'general software project';
  const uncertaintyNotes = [];

  // Repo marker detection scoring (grounded in actual project files).
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

  // Keyword hint scoring (low-confidence bias, not research).
  const scoredStackCandidates = stackFileNames.map((stackFileName) => {
    const configuredSignals = STACK_SIGNAL_WEIGHTS[stackFileName] || [];
    const matchedKeywords = [];
    let keywordScore = 0;

    for (const configuredSignal of configuredSignals) {
      if (!effectiveDescription.includes(configuredSignal.term)) {
        continue;
      }

      keywordScore += configuredSignal.weight;
      matchedKeywords.push(configuredSignal.term);
    }

    const detectionScore = detectionScoreByStackFileName.get(stackFileName) || 0;
    const totalScore = 0.2 + keywordScore + detectionScore;

    return {
      stackFileName,
      totalScore,
      keywordScore,
      detectionScore,
      matchedKeywords,
    };
  }).sort((leftCandidate, rightCandidate) => rightCandidate.totalScore - leftCandidate.totalScore);

  // Fallback when no candidates can be scored.
  if (scoredStackCandidates.length === 0) {
    const fallbackStackFileName = stackFileNames.includes('typescript.md')
      ? 'typescript.md'
      : stackFileNames[0] || 'typescript.md';
    const fallbackBlueprintFileName = resolveRecommendedBlueprintFileName(fallbackStackFileName, blueprintFileNames);

    return {
      briefType: 'offline',
      projectDescription: String(projectDescription || '').trim(),
      recommendedStackFileName: fallbackStackFileName,
      recommendedBlueprintFileName: fallbackBlueprintFileName,
      confidenceLabel: 'low',
      confidenceScore: 0.35,
      rationaleSentences: [
        `Defaulting to ${toTitleCase(fallbackStackFileName)} with ${toTitleCase(fallbackBlueprintFileName)} as a safe fallback.`,
        'No keyword or detection signals were strong enough for a grounded recommendation.',
        'For ecosystem-level validation, perform live web research before committing to this stack.',
      ],
      alternatives: [],
      uncertaintyNotes: [
        'This is an offline brief based on keyword hints and repo markers only.',
        'Ecosystem fitness was not verified — the agent should research before finalizing.',
      ],
      signalSummary: 'fallback (no strong signals)',
      failureModes: {
        lowConfidence: true,
        dataConflict: false,
        repeatedOverride: false,
      },
    };
  }

  const strongestCandidate = scoredStackCandidates[0];
  const secondCandidate = scoredStackCandidates[1] || null;
  const scoreGap = secondCandidate
    ? strongestCandidate.totalScore - secondCandidate.totalScore
    : strongestCandidate.totalScore;

  let confidenceScore = 0.55
    + Math.min(strongestCandidate.totalScore / 8, 0.25)
    + Math.min(Math.max(scoreGap, 0) / 3, 0.18);

  if (strongestCandidate.matchedKeywords.length === 0) {
    confidenceScore -= 0.2;
  }

  if (secondCandidate && scoreGap < 0.18) {
    confidenceScore -= 0.1;
  }

  confidenceScore = Math.min(Math.max(confidenceScore, 0.35), 0.97);

  const confidenceLabel = resolveConfidenceLabel(confidenceScore);
  const lowConfidence = confidenceScore < 0.7;
  const dataConflict = Boolean(secondCandidate && scoreGap < 0.18);

  if (lowConfidence) {
    uncertaintyNotes.push('Low confidence: description did not map strongly to a single stack profile.');
  }

  if (dataConflict) {
    uncertaintyNotes.push('Data conflict: top stack candidates are close, so trade-offs need manual confirmation.');
  }

  // Offline briefs should always be transparent about their grounding source.
  uncertaintyNotes.push(
    'This brief is grounded in repo markers and keyword hints only. '
    + 'For ecosystem-level validation, the agent should perform live web research.'
  );

  const recommendedStackFileName = strongestCandidate.stackFileName;
  const recommendedBlueprintFileName = resolveRecommendedBlueprintFileName(recommendedStackFileName, blueprintFileNames);

  const signalSummaryParts = [];
  if (strongestCandidate.matchedKeywords.length > 0) {
    signalSummaryParts.push(`keywords: ${strongestCandidate.matchedKeywords.slice(0, 4).join(', ')}`);
  }
  if (strongestCandidate.detectionScore > 0) {
    signalSummaryParts.push(`repo detection: ${strongestCandidate.detectionScore.toFixed(2)}`);
  }
  const signalSummary = signalSummaryParts.length > 0
    ? signalSummaryParts.join('; ')
    : 'weak signals only';

  const rationaleSentences = [
    `Stack brief: ${toTitleCase(recommendedStackFileName)} with ${toTitleCase(recommendedBlueprintFileName)}.`,
    `Grounding signals: ${signalSummary}.`,
    `Main trade-off: ${STACK_TRADEOFF_SUMMARIES[recommendedStackFileName] || 'validate ecosystem fit before production rollout.'}`,
  ];

  if (lowConfidence) {
    rationaleSentences.push('Confidence is low — review alternatives and perform live research before finalizing.');
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
        evidenceSummary: `keyword=${stackCandidate.keywordScore.toFixed(2)}, detection=${stackCandidate.detectionScore.toFixed(2)}`,
      };
    });

  return {
    briefType: 'offline',
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
  };
}

export function formatArchitectureRecommendation(architectureRecommendation) {
  const outputLines = [
    '\nArchitecture brief (offline, repo-grounded):',
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
