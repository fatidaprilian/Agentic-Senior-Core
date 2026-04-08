/**
 * Stack Detector — Project context auto-detection.
 * Depends on: constants.mjs, utils.mjs
 */
import fs from 'node:fs/promises';

import { BLUEPRINT_RECOMMENDATIONS } from './constants.mjs';
import { toTitleCase } from './utils.mjs';

export async function collectProjectMarkers(targetDirectoryPath) {
  const markerNames = new Set();
  const directoryEntries = await fs.readdir(targetDirectoryPath, { withFileTypes: true });

  for (const directoryEntry of directoryEntries) {
    if (directoryEntry.name === '.git' || directoryEntry.name === 'node_modules') {
      continue;
    }

    markerNames.add(directoryEntry.name);
  }

  return markerNames;
}

export async function detectProjectContext(targetDirectoryPath) {
  const markerNames = await collectProjectMarkers(targetDirectoryPath);
  const detectionCandidates = [];
  const hasExistingProjectFiles = markerNames.size > 0;

  if (markerNames.has('package.json') || markerNames.has('tsconfig.json') || markerNames.has('next.config.js') || markerNames.has('next.config.mjs')) {
    const evidence = [];
    let confidenceScore = 0.7;

    if (markerNames.has('package.json')) {
      evidence.push('package.json');
      confidenceScore += 0.12;
    }

    if (markerNames.has('tsconfig.json')) {
      evidence.push('tsconfig.json');
      confidenceScore += 0.12;
    }

    if (markerNames.has('next.config.js') || markerNames.has('next.config.mjs')) {
      evidence.push('Next.js config');
      confidenceScore += 0.05;
    }

    detectionCandidates.push({
      stackFileName: 'typescript.md',
      confidenceScore: Math.min(confidenceScore, 0.97),
      evidence,
    });
  }

  if (markerNames.has('pyproject.toml') || markerNames.has('requirements.txt')) {
    detectionCandidates.push({
      stackFileName: 'python.md',
      confidenceScore: markerNames.has('pyproject.toml') ? 0.96 : 0.78,
      evidence: markerNames.has('pyproject.toml') ? ['pyproject.toml'] : ['requirements.txt'],
    });
  }

  if (markerNames.has('pom.xml') || markerNames.has('build.gradle') || markerNames.has('build.gradle.kts')) {
    const evidence = [];
    if (markerNames.has('pom.xml')) evidence.push('pom.xml');
    if (markerNames.has('build.gradle') || markerNames.has('build.gradle.kts')) evidence.push('Gradle build file');
    detectionCandidates.push({
      stackFileName: 'java.md',
      confidenceScore: markerNames.has('pom.xml') ? 0.95 : 0.84,
      evidence,
    });
  }

  if (markerNames.has('composer.json')) {
    detectionCandidates.push({
      stackFileName: 'php.md',
      confidenceScore: 0.95,
      evidence: ['composer.json'],
    });
  }

  if (markerNames.has('go.mod')) {
    detectionCandidates.push({
      stackFileName: 'go.md',
      confidenceScore: 0.96,
      evidence: ['go.mod'],
    });
  }

  if (markerNames.has('Cargo.toml')) {
    detectionCandidates.push({
      stackFileName: 'rust.md',
      confidenceScore: 0.96,
      evidence: ['Cargo.toml'],
    });
  }

  if (markerNames.has('Gemfile')) {
    detectionCandidates.push({
      stackFileName: 'ruby.md',
      confidenceScore: 0.95,
      evidence: ['Gemfile'],
    });
  }

  const hasDotNetMarker = Array.from(markerNames).some((markerName) => markerName.endsWith('.sln') || markerName.endsWith('.csproj'));
  if (hasDotNetMarker) {
    detectionCandidates.push({
      stackFileName: 'csharp.md',
      confidenceScore: 0.95,
      evidence: ['.sln or .csproj file'],
    });
  }

  if (markerNames.has('package.json') && (markerNames.has('android') || markerNames.has('ios') || markerNames.has('react-native.config.js'))) {
    detectionCandidates.push({
      stackFileName: 'react-native.md',
      confidenceScore: 0.9,
      evidence: ['package.json', 'mobile runtime markers'],
    });
  }

  if (markerNames.has('pubspec.yaml')) {
    detectionCandidates.push({
      stackFileName: 'flutter.md',
      confidenceScore: 0.94,
      evidence: ['pubspec.yaml'],
    });
  }

  if (detectionCandidates.length === 0) {
    return {
      hasExistingProjectFiles,
      recommendedStackFileName: null,
      recommendedBlueprintFileName: null,
      confidenceLabel: null,
      confidenceScore: 0,
      confidenceGap: 0,
      detectionReasoning: 'No known project markers were detected.',
      rankedCandidates: [],
      evidence: [],
    };
  }

  detectionCandidates.sort((leftCandidate, rightCandidate) => rightCandidate.confidenceScore - leftCandidate.confidenceScore);
  const strongestCandidate = detectionCandidates[0];
  const secondStrongestCandidate = detectionCandidates[1];
  const confidenceGap = secondStrongestCandidate
    ? Number((strongestCandidate.confidenceScore - secondStrongestCandidate.confidenceScore).toFixed(2))
    : Number(strongestCandidate.confidenceScore.toFixed(2));
  const isAmbiguous = secondStrongestCandidate
    && confidenceGap < 0.08;
  const confidenceLabel = strongestCandidate.confidenceScore >= 0.9
    ? 'high'
    : strongestCandidate.confidenceScore >= 0.78
      ? 'medium'
      : 'low';
  const evidence = isAmbiguous
    ? [...strongestCandidate.evidence, `multiple stack signals detected`]
    : strongestCandidate.evidence;
  const rankedCandidates = detectionCandidates.slice(0, 3).map((detectionCandidate) => ({
    stackFileName: detectionCandidate.stackFileName,
    confidenceScore: Number(detectionCandidate.confidenceScore.toFixed(2)),
    evidence: detectionCandidate.evidence,
  }));
  const detectionReasoning = isAmbiguous
    ? `Top signal ${toTitleCase(strongestCandidate.stackFileName)} is close to ${toTitleCase(secondStrongestCandidate.stackFileName)} (confidence gap ${confidenceGap}).`
    : `Top signal ${toTitleCase(strongestCandidate.stackFileName)} won with confidence ${strongestCandidate.confidenceScore.toFixed(2)} from markers: ${strongestCandidate.evidence.join(', ') || 'none'}.`;

  return {
    hasExistingProjectFiles,
    recommendedStackFileName: strongestCandidate.stackFileName,
    recommendedBlueprintFileName: BLUEPRINT_RECOMMENDATIONS[strongestCandidate.stackFileName] || null,
    confidenceLabel,
    confidenceScore: strongestCandidate.confidenceScore,
    confidenceGap,
    detectionReasoning,
    rankedCandidates,
    evidence,
  };
}

export function buildDetectionSummary(projectDetection) {
  if (!projectDetection.recommendedStackFileName) {
    return 'I did not find enough stack markers to auto-detect this project confidently.';
  }

  const readableEvidence = projectDetection.evidence.length > 0
    ? projectDetection.evidence.join(', ')
    : 'basic project markers';

  const confidenceGapSummary = typeof projectDetection.confidenceGap === 'number'
    ? ` Confidence gap: ${projectDetection.confidenceGap}.`
    : '';

  return `This folder looks like ${toTitleCase(projectDetection.recommendedStackFileName)} with ${projectDetection.confidenceLabel} confidence based on ${readableEvidence}.${confidenceGapSummary}`;
}

export function formatDetectionCandidates(rankedCandidates) {
  if (!rankedCandidates?.length) {
    return 'No ranked candidates available.';
  }

  return rankedCandidates
    .map((candidate, candidateIndex) => {
      const evidenceSummary = candidate.evidence?.length ? candidate.evidence.join(', ') : 'no direct markers';
      return `${candidateIndex + 1}. ${toTitleCase(candidate.stackFileName)} (score ${candidate.confidenceScore}) via ${evidenceSummary}`;
    })
    .join('\n');
}
