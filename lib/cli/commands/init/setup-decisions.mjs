import { PROJECT_SCOPE_CHOICES } from '../../constants.mjs';
import { matchFileNameFromInput, normalizeChoiceInput } from '../../utils.mjs';

export function resolveProjectScopeLabelFromKey(projectScopeKey) {
  return PROJECT_SCOPE_CHOICES.find((scopeChoice) => scopeChoice.key === projectScopeKey)?.label
    || PROJECT_SCOPE_CHOICES.find((scopeChoice) => scopeChoice.key === 'both')?.label
    || 'Both (frontend + backend)';
}

export function inferProjectScopeFromDiscoveryAnswers(discoveryAnswers) {
  const normalizedDomain = String(discoveryAnswers?.primaryDomain || '').trim().toLowerCase();
  const normalizedDescription = [
    discoveryAnswers?.projectDescription,
    ...(Array.isArray(discoveryAnswers?.features) ? discoveryAnswers.features : []),
  ].join(' ').toLowerCase();

  if (
    normalizedDomain.includes('api service')
    || normalizedDomain.includes('cli tool')
    || normalizedDomain.includes('library')
  ) {
    return 'backend-only';
  }

  if (normalizedDomain.includes('mobile app')) {
    return 'frontend-only';
  }

  if (normalizedDomain.includes('web application')) {
    if (/(landing page|marketing site|showcase|portfolio|brochure|company profile)/.test(normalizedDescription)) {
      return 'frontend-only';
    }

    return 'both';
  }

  return 'both';
}

export function resolveSilentCiGuardrailsDefault({
  initOptions,
  selectedPreset,
  selectedPolicyProfile,
}) {
  if (typeof initOptions.ci === 'boolean') {
    return {
      value: initOptions.ci,
      shouldAsk: false,
    };
  }

  if (typeof selectedPreset?.ci === 'boolean') {
    return {
      value: selectedPreset.ci,
      shouldAsk: false,
    };
  }

  if (selectedPolicyProfile.lockCi) {
    return {
      value: selectedPolicyProfile.defaultCi,
      shouldAsk: false,
    };
  }

  return {
    value: selectedPolicyProfile.defaultCi,
    shouldAsk: true,
  };
}

export function normalizeExplicitProfileFileName(rawInput, discoveredFileNames) {
  const matchedFileName = Array.isArray(discoveredFileNames) && discoveredFileNames.length > 0
    ? matchFileNameFromInput(rawInput, discoveredFileNames)
    : null;

  if (matchedFileName) {
    return matchedFileName;
  }

  const normalizedBaseName = normalizeChoiceInput(String(rawInput || '').replace(/\.md$/i, ''));
  return normalizedBaseName ? `${normalizedBaseName}.md` : null;
}
