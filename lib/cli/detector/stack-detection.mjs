/**
 * Stack detection: scores known marker sets per language ecosystem, ranks them,
 * and emits an explanation of what was chosen and why. Used by the CLI to seed
 * detection summaries and ranked candidate lists.
 */

import { toTitleCase } from '../utils.mjs';
import { collectNestedWorkspaceProjects, collectProjectMarkers } from './workspace-scan.mjs';

export function collectStackDetectionCandidates(markerNames, evidencePrefix = null) {
  const detectionCandidates = [];
  const withEvidencePrefix = (evidenceItem) => evidencePrefix ? `${evidencePrefix}: ${evidenceItem}` : evidenceItem;

  if (
    markerNames.has('package.json')
    || markerNames.has('tsconfig.json')
    || markerNames.has('next.config.js')
    || markerNames.has('next.config.mjs')
    || markerNames.has('vite.config.js')
    || markerNames.has('vite.config.mjs')
    || markerNames.has('vite.config.ts')
  ) {
    const evidence = [];
    let confidenceScore = 0.7;

    if (markerNames.has('package.json')) {
      evidence.push(withEvidencePrefix('package.json'));
      confidenceScore += 0.12;
    }

    if (markerNames.has('tsconfig.json')) {
      evidence.push(withEvidencePrefix('tsconfig.json'));
      confidenceScore += 0.12;
    }

    if (markerNames.has('next.config.js') || markerNames.has('next.config.mjs')) {
      evidence.push(withEvidencePrefix('Next.js config'));
      confidenceScore += 0.05;
    }

    if (markerNames.has('vite.config.js') || markerNames.has('vite.config.mjs') || markerNames.has('vite.config.ts')) {
      evidence.push(withEvidencePrefix('Vite config'));
      confidenceScore += 0.08;
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
      evidence: markerNames.has('pyproject.toml')
        ? [withEvidencePrefix('pyproject.toml')]
        : [withEvidencePrefix('requirements.txt')],
    });
  }

  if (markerNames.has('pom.xml') || markerNames.has('build.gradle') || markerNames.has('build.gradle.kts')) {
    const evidence = [];
    if (markerNames.has('pom.xml')) evidence.push(withEvidencePrefix('pom.xml'));
    if (markerNames.has('build.gradle') || markerNames.has('build.gradle.kts')) evidence.push(withEvidencePrefix('Gradle build file'));
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
      evidence: [withEvidencePrefix('composer.json')],
    });
  }

  if (markerNames.has('go.mod')) {
    detectionCandidates.push({
      stackFileName: 'go.md',
      confidenceScore: 0.96,
      evidence: [withEvidencePrefix('go.mod')],
    });
  }

  if (markerNames.has('Cargo.toml')) {
    detectionCandidates.push({
      stackFileName: 'rust.md',
      confidenceScore: 0.96,
      evidence: [withEvidencePrefix('Cargo.toml')],
    });
  }

  if (markerNames.has('Gemfile')) {
    detectionCandidates.push({
      stackFileName: 'ruby.md',
      confidenceScore: 0.95,
      evidence: [withEvidencePrefix('Gemfile')],
    });
  }

  const hasDotNetMarker = Array.from(markerNames).some(
    (markerName) => markerName.endsWith('.sln') || markerName.endsWith('.csproj'),
  );
  if (hasDotNetMarker) {
    detectionCandidates.push({
      stackFileName: 'csharp.md',
      confidenceScore: 0.95,
      evidence: [withEvidencePrefix('.sln or .csproj file')],
    });
  }

  if (
    markerNames.has('package.json')
    && (markerNames.has('android') || markerNames.has('ios') || markerNames.has('react-native.config.js'))
  ) {
    detectionCandidates.push({
      stackFileName: 'react-native.md',
      confidenceScore: 0.9,
      evidence: [withEvidencePrefix('package.json'), withEvidencePrefix('mobile runtime markers')],
    });
  }

  if (markerNames.has('pubspec.yaml')) {
    detectionCandidates.push({
      stackFileName: 'flutter.md',
      confidenceScore: 0.94,
      evidence: [withEvidencePrefix('pubspec.yaml')],
    });
  }

  return detectionCandidates;
}

export async function detectProjectContext(targetDirectoryPath) {
  const markerNames = await collectProjectMarkers(targetDirectoryPath);
  const nestedWorkspaceProjects = await collectNestedWorkspaceProjects(targetDirectoryPath);
  const detectionCandidates = [
    ...collectStackDetectionCandidates(markerNames),
    ...nestedWorkspaceProjects.flatMap((nestedWorkspaceProject) => (
      collectStackDetectionCandidates(
        nestedWorkspaceProject.markerNames,
        nestedWorkspaceProject.relativePath,
      )
    )),
  ];
  const hasExistingProjectFiles = markerNames.size > 0;

  if (detectionCandidates.length === 0) {
    return {
      hasExistingProjectFiles,
      detectedStackFileName: null,
      secondaryStackFileNames: [],
      detectedBlueprintFileName: null,
      confidenceLabel: null,
      confidenceScore: 0,
      confidenceGap: 0,
      detectionReasoning: 'No known project markers were detected.',
      rankedCandidates: [],
      evidence: [],
    };
  }

  detectionCandidates.sort(
    (leftCandidate, rightCandidate) => rightCandidate.confidenceScore - leftCandidate.confidenceScore,
  );
  const strongestCandidate = detectionCandidates[0];
  const secondStrongestCandidate = detectionCandidates[1];
  const confidenceGap = secondStrongestCandidate
    ? Number((strongestCandidate.confidenceScore - secondStrongestCandidate.confidenceScore).toFixed(2))
    : Number(strongestCandidate.confidenceScore.toFixed(2));
  const isAmbiguous = secondStrongestCandidate && confidenceGap < 0.08;
  const confidenceLabel = strongestCandidate.confidenceScore >= 0.9
    ? 'high'
    : strongestCandidate.confidenceScore >= 0.78
      ? 'medium'
      : 'low';
  const evidence = isAmbiguous
    ? [...strongestCandidate.evidence, 'multiple stack signals detected']
    : strongestCandidate.evidence;
  const rankedCandidates = detectionCandidates.slice(0, 3).map((detectionCandidate) => ({
    stackFileName: detectionCandidate.stackFileName,
    confidenceScore: Number(detectionCandidate.confidenceScore.toFixed(2)),
    evidence: detectionCandidate.evidence,
  }));
  const secondaryStackFileNames = rankedCandidates
    .slice(1)
    .filter((rankedCandidate) => (strongestCandidate.confidenceScore - rankedCandidate.confidenceScore) < 0.08)
    .map((rankedCandidate) => rankedCandidate.stackFileName);
  const detectionReasoning = isAmbiguous
    ? `Top signal ${toTitleCase(strongestCandidate.stackFileName)} is close to ${toTitleCase(secondStrongestCandidate.stackFileName)} (confidence gap ${confidenceGap}).`
    : `Top signal ${toTitleCase(strongestCandidate.stackFileName)} won with confidence ${strongestCandidate.confidenceScore.toFixed(2)} from markers: ${strongestCandidate.evidence.join(', ') || 'none'}.`;

  return {
    hasExistingProjectFiles,
    detectedStackFileName: strongestCandidate.stackFileName,
    secondaryStackFileNames,
    detectedBlueprintFileName: null,
    confidenceLabel,
    confidenceScore: strongestCandidate.confidenceScore,
    confidenceGap,
    detectionReasoning,
    rankedCandidates,
    evidence,
  };
}

export function buildDetectionSummary(projectDetection) {
  if (!projectDetection.detectedStackFileName) {
    return 'I did not find enough stack markers to auto-detect this project confidently.';
  }

  const readableEvidence = projectDetection.evidence.length > 0
    ? projectDetection.evidence.join(', ')
    : 'basic project markers';

  const confidenceGapSummary = typeof projectDetection.confidenceGap === 'number'
    ? ` Confidence gap: ${projectDetection.confidenceGap}.`
    : '';

  const secondaryStacksSummary = projectDetection.secondaryStackFileNames?.length
    ? ` Secondary stack signals: ${projectDetection.secondaryStackFileNames.map((stackFileName) => toTitleCase(stackFileName)).join(', ')}.`
    : '';

  return `This folder looks like ${toTitleCase(projectDetection.detectedStackFileName)} with ${projectDetection.confidenceLabel} confidence based on ${readableEvidence}.${confidenceGapSummary}${secondaryStacksSummary}`;
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
