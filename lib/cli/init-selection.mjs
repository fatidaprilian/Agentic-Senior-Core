/**
 * Init Selection Helpers — stack/blueprint filtering and scope normalization.
 */
import {
  PROJECT_SCOPE_CHOICES,
} from './constants.mjs';

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

export function resolveScopeBlueprintCandidates(projectScopeKey) {
  void projectScopeKey;
  return null;
}
