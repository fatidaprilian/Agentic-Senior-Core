import {
  DOCS_BY_LABEL,
  PROMPT_CATALOG,
  RULE_FAMILY_CATALOG,
  STATE_BY_LABEL,
} from './adaptive-context/catalog.mjs';

export function getRuleFamilyCatalog() {
  return RULE_FAMILY_CATALOG.map((ruleFamily) => ({ ...ruleFamily }));
}

export function normalizeRequestText(requestText) {
  return String(requestText || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function findMatchedTriggers(normalizedRequestText, triggers) {
  return triggers.filter((triggerText) => triggerMatchesRequest(normalizedRequestText, triggerText));
}

function escapeRegExp(rawText) {
  return rawText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function triggerMatchesRequest(normalizedRequestText, triggerText) {
  if (!normalizedRequestText || !triggerText) {
    return false;
  }

  if (/^[a-z0-9 ]+$/.test(triggerText)) {
    const triggerPattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(triggerText)}([^a-z0-9]|$)`);
    return triggerPattern.test(normalizedRequestText);
  }

  return normalizedRequestText.includes(triggerText);
}

function compareCatalogEntries(leftEntry, rightEntry) {
  return leftEntry.priority - rightEntry.priority || leftEntry.label.localeCompare(rightEntry.label);
}

function uniqueSortedValues(values) {
  return Array.from(new Set(values)).sort((leftValue, rightValue) => leftValue.localeCompare(rightValue));
}

function collectDocsForLabels(labels) {
  const selectedDocs = ['docs/doc-index.md'];

  for (const label of labels) {
    selectedDocs.push(...(DOCS_BY_LABEL[label] || []));
  }

  return uniqueSortedValues(selectedDocs);
}

function collectStateForLabels(labels) {
  const selectedState = ['.agent-context/state/onboarding-report.json'];

  for (const label of labels) {
    selectedState.push(...(STATE_BY_LABEL[label] || []));
  }

  return uniqueSortedValues(selectedState);
}

function collectPromptsForRequest(normalizedRequestText, labels) {
  const selectedPrompts = [];

  for (const promptEntry of PROMPT_CATALOG) {
    const labelMatched = Array.isArray(promptEntry.labels)
      && promptEntry.labels.some((label) => labels.includes(label));
    const triggerMatched = findMatchedTriggers(normalizedRequestText, promptEntry.triggers).length > 0;

    if (labelMatched || triggerMatched) {
      selectedPrompts.push(promptEntry.promptPath);
    }
  }

  return uniqueSortedValues(selectedPrompts);
}

function resolveUncertainty(labels, evidenceEntries, normalizedRequestText) {
  if (!normalizedRequestText) {
    return 'high';
  }

  if (labels.length === 0) {
    return 'high';
  }

  const hasSparseEvidence = evidenceEntries.some((evidenceEntry) => evidenceEntry.matchedTriggers.length === 1);
  const hasManyLabels = labels.length >= 6;

  if (hasManyLabels || hasSparseEvidence) {
    return 'medium';
  }

  return 'low';
}

export function buildSelectedContextManifest(options = {}) {
  const {
    requestId = 'adhoc-request',
    requestText = '',
  } = options;

  const normalizedRequestText = normalizeRequestText(requestText);
  const matchedRuleEntries = RULE_FAMILY_CATALOG
    .map((ruleFamily) => ({
      ...ruleFamily,
      matchedTriggers: findMatchedTriggers(normalizedRequestText, ruleFamily.triggers),
    }))
    .filter((ruleFamily) => ruleFamily.matchedTriggers.length > 0)
    .sort(compareCatalogEntries);

  const labels = matchedRuleEntries.map((ruleFamily) => ruleFamily.label);
  const selectedRules = matchedRuleEntries.map((ruleFamily) => ruleFamily.rulePath);
  const selectedRuleSet = new Set(selectedRules);
  const skippedRules = RULE_FAMILY_CATALOG
    .map((ruleFamily) => ruleFamily.rulePath)
    .filter((rulePath) => !selectedRuleSet.has(rulePath))
    .sort((leftPath, rightPath) => leftPath.localeCompare(rightPath));
  const evidenceEntries = matchedRuleEntries.map((ruleFamily) => ({
    label: ruleFamily.label,
    matchedTriggers: ruleFamily.matchedTriggers,
  }));
  const uncertainty = resolveUncertainty(labels, evidenceEntries, normalizedRequestText);

  return {
    schemaVersion: 'adaptive-context-manifest-v1',
    requestId,
    labels,
    selectedRules,
    selectedPrompts: collectPromptsForRequest(normalizedRequestText, labels),
    selectedDocs: collectDocsForLabels(labels),
    selectedState: collectStateForLabels(labels),
    skippedRules,
    uncertainty,
    fallbackRequired: uncertainty === 'high',
    evidence: evidenceEntries,
  };
}

function compareRequiredLabels(requiredLabels, actualLabels) {
  const actualLabelSet = new Set(actualLabels);

  return requiredLabels.filter((requiredLabel) => !actualLabelSet.has(requiredLabel));
}

function compareExtraLabels(expectedLabels, actualLabels) {
  const expectedLabelSet = new Set(expectedLabels);

  return actualLabels.filter((actualLabel) => !expectedLabelSet.has(actualLabel));
}

export function evaluateAdaptiveContextFixtures(fixtures) {
  const fixtureResults = fixtures.map((fixtureEntry) => {
    const manifest = buildSelectedContextManifest({
      requestId: fixtureEntry.id,
      requestText: fixtureEntry.requestText,
    });
    const missedRequiredLabels = compareRequiredLabels(fixtureEntry.requiredLabels, manifest.labels);
    const extraLabels = compareExtraLabels(fixtureEntry.allowedLabels || fixtureEntry.requiredLabels, manifest.labels);

    return {
      id: fixtureEntry.id,
      passed: missedRequiredLabels.length === 0,
      missedRequiredLabels,
      extraLabels,
      manifest,
    };
  });
  const failedFixtures = fixtureResults.filter((fixtureResult) => !fixtureResult.passed);
  const missedRequiredLabelCount = fixtureResults.reduce(
    (totalCount, fixtureResult) => totalCount + fixtureResult.missedRequiredLabels.length,
    0
  );
  const extraLabelCount = fixtureResults.reduce(
    (totalCount, fixtureResult) => totalCount + fixtureResult.extraLabels.length,
    0
  );

  return {
    reportName: 'adaptive-context-benchmark',
    generatedAt: new Date().toISOString(),
    fixtureCount: fixtureResults.length,
    passed: failedFixtures.length === 0,
    passedCount: fixtureResults.length - failedFixtures.length,
    failedCount: failedFixtures.length,
    missedRequiredLabelCount,
    extraLabelCount,
    results: fixtureResults,
  };
}
