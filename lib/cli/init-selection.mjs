/**
 * Init Selection Helpers — stack/blueprint filtering and scope normalization.
 */
import {
  BLUEPRINT_RECOMMENDATIONS,
  PROJECT_SCOPE_CHOICES,
  PROJECT_SCOPE_STACK_FILTERS,
  WEB_FRONTEND_BLUEPRINT_CANDIDATES,
  WEB_BACKEND_BLUEPRINT_CANDIDATES,
} from './constants.mjs';

export function filterStackFileNamesByCandidates(allStackFileNames, preferredStackFileNames) {
  if (!Array.isArray(preferredStackFileNames) || preferredStackFileNames.length === 0) {
    return allStackFileNames;
  }

  const filteredStackFileNames = preferredStackFileNames.filter((stackFileName) => allStackFileNames.includes(stackFileName));
  return filteredStackFileNames.length > 0 ? filteredStackFileNames : allStackFileNames;
}

export function filterBlueprintFileNamesByCandidates(allBlueprintFileNames, preferredBlueprintFileNames) {
  if (!Array.isArray(preferredBlueprintFileNames) || preferredBlueprintFileNames.length === 0) {
    return allBlueprintFileNames;
  }

  const filteredBlueprintFileNames = preferredBlueprintFileNames.filter(
    (blueprintFileName) => allBlueprintFileNames.includes(blueprintFileName)
  );

  return filteredBlueprintFileNames.length > 0 ? filteredBlueprintFileNames : allBlueprintFileNames;
}

export function resolveProjectScopeKeyFromLabel(selectedProjectScopeLabel) {
  const projectScopeEntry = PROJECT_SCOPE_CHOICES.find((scopeChoice) => scopeChoice.label === selectedProjectScopeLabel);
  return projectScopeEntry?.key || 'both';
}

export function normalizeAdditionalStackSelection(selectedStackFileName, additionalStackFileNames) {
  if (!Array.isArray(additionalStackFileNames) || additionalStackFileNames.length === 0) {
    return [];
  }

  return Array.from(new Set(additionalStackFileNames.filter((stackFileName) => stackFileName && stackFileName !== selectedStackFileName)));
}

export function normalizeAdditionalBlueprintSelection(selectedBlueprintFileName, additionalBlueprintFileNames) {
  if (!Array.isArray(additionalBlueprintFileNames) || additionalBlueprintFileNames.length === 0) {
    return [];
  }

  return Array.from(new Set(additionalBlueprintFileNames.filter(
    (blueprintFileName) => blueprintFileName && blueprintFileName !== selectedBlueprintFileName
  )));
}

export function deriveAdditionalBlueprintFileNamesFromStacks(
  additionalStackFileNames,
  allBlueprintFileNames,
  selectedBlueprintFileName
) {
  const derivedBlueprintFileNames = [];

  for (const additionalStackFileName of additionalStackFileNames || []) {
    const mappedBlueprintFileName = BLUEPRINT_RECOMMENDATIONS[additionalStackFileName];
    if (!mappedBlueprintFileName) {
      continue;
    }

    if (!allBlueprintFileNames.includes(mappedBlueprintFileName)) {
      continue;
    }

    if (mappedBlueprintFileName === selectedBlueprintFileName) {
      continue;
    }

    derivedBlueprintFileNames.push(mappedBlueprintFileName);
  }

  return Array.from(new Set(derivedBlueprintFileNames));
}

export function resolveScopeStackCandidates(projectScopeKey) {
  return PROJECT_SCOPE_STACK_FILTERS[projectScopeKey] || null;
}

export function resolveScopeBlueprintCandidates(projectScopeKey) {
  if (projectScopeKey === 'frontend-only') {
    return WEB_FRONTEND_BLUEPRINT_CANDIDATES;
  }

  if (projectScopeKey === 'backend-only') {
    return WEB_BACKEND_BLUEPRINT_CANDIDATES;
  }

  return Array.from(new Set([
    ...WEB_FRONTEND_BLUEPRINT_CANDIDATES,
    ...WEB_BACKEND_BLUEPRINT_CANDIDATES,
  ]));
}
