/**
 * UI scope detection: combines marker sets, package.json dependencies, nested
 * workspace evidence, and explicit user scope keys to decide whether the
 * current target directory is a UI surface. Triggers the lightweight design
 * evidence scan when the answer is yes.
 */

import { collectFrontendDesignEvidence } from './design-evidence.mjs';
import { DIRECT_UI_MARKER_NAMES } from './constants.mjs';
import { collectNestedWorkspaceProjects, collectProjectMarkers, readPackageJsonIfExists } from './workspace-scan.mjs';

const UI_DEPENDENCY_NAMES = ['next', 'react', 'react-dom', 'react-native', 'expo', 'tailwindcss'];

function analyzeUiSignalsForMarkerSet(markerNames, packageManifest, sourceLabel = null) {
  const detectedUiMarkers = DIRECT_UI_MARKER_NAMES.filter((markerName) => markerNames.has(markerName));
  const dependencySource = {
    ...(packageManifest?.dependencies || {}),
    ...(packageManifest?.devDependencies || {}),
  };
  const detectedUiDependencies = UI_DEPENDENCY_NAMES.filter((dependencyName) => dependencySource[dependencyName]);
  const hasStrongUiMarker = detectedUiMarkers.some((markerName) => (
    markerName.startsWith('next.config')
    || markerName === 'react-native.config.js'
    || markerName === 'android'
    || markerName === 'ios'
  ));
  const hasUiDependencies = detectedUiDependencies.length > 0;
  const hasStructuralUiMarkers = detectedUiMarkers.length >= 2;
  const signalReasons = [];
  const sourcePrefix = sourceLabel ? `${sourceLabel}: ` : '';

  if (detectedUiMarkers.length > 0) {
    signalReasons.push(`${sourcePrefix}ui markers: ${detectedUiMarkers.join(', ')}`);
  }

  if (detectedUiDependencies.length > 0) {
    signalReasons.push(`${sourcePrefix}ui dependencies: ${detectedUiDependencies.join(', ')}`);
  }

  return {
    signalReasons,
    detectedUiMarkers,
    detectedUiDependencies,
    hasStrongUiMarker,
    hasUiDependencies,
    hasStructuralUiMarkers,
  };
}

export async function detectUiScopeSignals({
  targetDirectoryPath,
  selectedStackFileName,
  selectedBlueprintFileName,
  packageManifest = null,
  projectScopeKey = null,
  projectScopeSourceLabel = 'project scope',
}) {
  const signalReasons = [];
  const markerNames = await collectProjectMarkers(targetDirectoryPath);
  const resolvedPackageManifest = packageManifest || await readPackageJsonIfExists(targetDirectoryPath);
  const nestedWorkspaceProjects = await collectNestedWorkspaceProjects(targetDirectoryPath);

  const normalizedProjectScopeKey = String(projectScopeKey || '').trim().toLowerCase();
  if (normalizedProjectScopeKey === 'frontend-only' || normalizedProjectScopeKey === 'both') {
    signalReasons.push(`${projectScopeSourceLabel}: ${normalizedProjectScopeKey}`);
  }

  const selectedStackKey = String(selectedStackFileName || '').trim().toLowerCase();
  if (selectedStackKey === 'react-native.md' || selectedStackKey === 'flutter.md') {
    signalReasons.push(`selected stack implies UI runtime: ${selectedStackKey}`);
  }

  const selectedBlueprintKey = String(selectedBlueprintFileName || '').trim().toLowerCase();
  if (selectedBlueprintKey.includes('frontend') || selectedBlueprintKey.includes('landing') || selectedBlueprintKey.includes('mobile-app')) {
    signalReasons.push(`selected blueprint implies UI scope: ${selectedBlueprintKey}`);
  }

  const rootUiSignals = analyzeUiSignalsForMarkerSet(markerNames, resolvedPackageManifest);
  signalReasons.push(...rootUiSignals.signalReasons);

  const nestedUiSignals = nestedWorkspaceProjects
    .map((nestedWorkspaceProject) => ({
      ...nestedWorkspaceProject,
      ...analyzeUiSignalsForMarkerSet(
        nestedWorkspaceProject.markerNames,
        nestedWorkspaceProject.packageManifest,
        `workspace ${nestedWorkspaceProject.relativePath}`,
      ),
    }))
    .filter((nestedWorkspaceProject) => nestedWorkspaceProject.signalReasons.length > 0);

  for (const nestedUiSignal of nestedUiSignals) {
    signalReasons.push(...nestedUiSignal.signalReasons);
  }

  const detectedUiMarkers = Array.from(new Set([
    ...rootUiSignals.detectedUiMarkers,
    ...nestedUiSignals.flatMap((nestedUiSignal) => nestedUiSignal.detectedUiMarkers),
  ]));
  const detectedUiDependencies = Array.from(new Set([
    ...rootUiSignals.detectedUiDependencies,
    ...nestedUiSignals.flatMap((nestedUiSignal) => nestedUiSignal.detectedUiDependencies),
  ]));

  const hasStrongUiMarker = rootUiSignals.hasStrongUiMarker
    || nestedUiSignals.some((nestedUiSignal) => nestedUiSignal.hasStrongUiMarker);
  const hasUiDependencies = rootUiSignals.hasUiDependencies
    || nestedUiSignals.some((nestedUiSignal) => nestedUiSignal.hasUiDependencies);
  const hasStructuralUiMarkers = rootUiSignals.hasStructuralUiMarkers
    || nestedUiSignals.some((nestedUiSignal) => nestedUiSignal.hasStructuralUiMarkers);
  const isUiScopeLikely = signalReasons.length > 0
    && (hasStrongUiMarker || hasUiDependencies || hasStructuralUiMarkers || normalizedProjectScopeKey.length > 0);
  const preferredUiWorkspaceEntry = nestedUiSignals.find((nestedUiSignal) => (
    nestedUiSignal.hasStrongUiMarker
    || nestedUiSignal.hasUiDependencies
    || nestedUiSignal.hasStructuralUiMarkers
  )) || null;
  const frontendScanRootDirectoryPaths = (
    !rootUiSignals.hasStrongUiMarker
    && !rootUiSignals.hasUiDependencies
    && !rootUiSignals.hasStructuralUiMarkers
    && nestedUiSignals.length > 0
  )
    ? nestedUiSignals.map((nestedUiSignal) => nestedUiSignal.directoryPath)
    : [];
  const designEvidence = isUiScopeLikely
    ? await collectFrontendDesignEvidence({
      targetDirectoryPath,
      markerNames,
      scanRootDirectoryPaths: frontendScanRootDirectoryPaths,
    })
    : null;
  const frontendEvidenceMetrics = designEvidence?.frontendEvidenceMetrics || null;
  const designEvidenceSummary = designEvidence?.designEvidenceSummary || null;

  return {
    isUiScopeLikely,
    signalReasons,
    detectedUiMarkers,
    detectedUiDependencies,
    frontendEvidenceMetrics,
    designEvidenceSummary,
    packageManifest: preferredUiWorkspaceEntry?.packageManifest || resolvedPackageManifest,
    workspaceUiEntries: nestedUiSignals.map((nestedUiSignal) => ({
      relativePath: nestedUiSignal.relativePath,
      detectedUiMarkers: nestedUiSignal.detectedUiMarkers,
      detectedUiDependencies: nestedUiSignal.detectedUiDependencies,
    })),
  };
}
