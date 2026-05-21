import {
  DOCS_BY_LABEL,
  PROMPT_CATALOG,
  RULE_FAMILY_CATALOG,
  STATE_BY_LABEL,
} from './adaptive-context/catalog.mjs';
import { CONTEXT_FILE_CATALOG } from './adaptive-context/file-signals.mjs';
import { IMPLICATION_CATALOG } from './adaptive-context/implications.mjs';

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

function normalizeContextFilePath(contextFilePath) {
  return String(contextFilePath || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .toLowerCase();
}

function normalizeContextFiles(contextFiles) {
  if (!Array.isArray(contextFiles)) {
    return [];
  }

  return contextFiles
    .map(normalizeContextFilePath)
    .filter(Boolean);
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

function createRuleEntryMap() {
  const ruleEntryMap = new Map();

  for (const ruleFamily of RULE_FAMILY_CATALOG) {
    ruleEntryMap.set(ruleFamily.label, {
      ...ruleFamily,
      matchedTriggers: [],
      matchedFiles: [],
      matchedImplications: [],
    });
  }

  return ruleEntryMap;
}

function getMatchedRuleEntries(ruleEntryMap) {
  return Array.from(ruleEntryMap.values())
    .filter((ruleFamily) => {
      return ruleFamily.matchedTriggers.length > 0
        || ruleFamily.matchedFiles.length > 0
        || ruleFamily.matchedImplications.length > 0;
    })
    .sort(compareCatalogEntries);
}

function pushUniqueSignal(values, nextValue) {
  if (nextValue && !values.includes(nextValue)) {
    values.push(nextValue);
  }
}

function applyDirectTextSignals(ruleEntryMap, normalizedRequestText) {
  for (const ruleFamily of RULE_FAMILY_CATALOG) {
    const matchedTriggers = findMatchedTriggers(normalizedRequestText, ruleFamily.triggers);
    const targetRuleEntry = ruleEntryMap.get(ruleFamily.label);

    for (const matchedTrigger of matchedTriggers) {
      pushUniqueSignal(targetRuleEntry.matchedTriggers, matchedTrigger);
    }
  }
}

function applyContextFileSignals(ruleEntryMap, normalizedContextFiles) {
  for (const contextFilePath of normalizedContextFiles) {
    for (const fileSignal of CONTEXT_FILE_CATALOG) {
      if (!fileSignal.patterns.some((filePattern) => filePattern.test(contextFilePath))) {
        continue;
      }

      const targetRuleEntry = ruleEntryMap.get(fileSignal.label);
      pushUniqueSignal(targetRuleEntry.matchedFiles, contextFilePath);
    }
  }
}

function applyImplicationSignals(ruleEntryMap, normalizedRequestText) {
  const matchedLabelSet = new Set(getMatchedRuleEntries(ruleEntryMap).map((ruleFamily) => ruleFamily.label));

  for (const implicationRule of IMPLICATION_CATALOG) {
    const hasRequiredLabel = implicationRule.requiresAnyLabel.some((label) => matchedLabelSet.has(label));
    if (!hasRequiredLabel) {
      continue;
    }

    const matchedTriggers = findMatchedTriggers(normalizedRequestText, implicationRule.triggers);
    if (matchedTriggers.length === 0) {
      continue;
    }

    const targetRuleEntry = ruleEntryMap.get(implicationRule.label);
    const implicationDetail = `${implicationRule.reason}: ${matchedTriggers.join(', ')}`;
    pushUniqueSignal(targetRuleEntry.matchedImplications, implicationDetail);
    matchedLabelSet.add(implicationRule.label);
  }
}

function countEvidenceSignals(evidenceEntry) {
  return evidenceEntry.matchedTriggers.length
    + evidenceEntry.matchedFiles.length
    + evidenceEntry.matchedImplications.length;
}

function resolveUncertainty(labels, evidenceEntries, normalizedRequestText) {
  if (!normalizedRequestText) {
    return 'high';
  }

  if (labels.length === 0) {
    return 'high';
  }

  const hasSparseEvidence = evidenceEntries.some((evidenceEntry) => countEvidenceSignals(evidenceEntry) === 1);
  const hasManyLabels = labels.length >= 6;

  if (hasManyLabels || hasSparseEvidence) {
    return 'medium';
  }

  return 'low';
}

export function buildSelectedContextManifest(options = {}) {
  const {
    contextFiles = [],
    requestId = 'adhoc-request',
    requestText = '',
  } = options;

  const normalizedRequestText = normalizeRequestText(requestText);
  const normalizedContextFiles = normalizeContextFiles(contextFiles);
  const ruleEntryMap = createRuleEntryMap();

  applyDirectTextSignals(ruleEntryMap, normalizedRequestText);
  applyContextFileSignals(ruleEntryMap, normalizedContextFiles);
  applyImplicationSignals(ruleEntryMap, normalizedRequestText);

  const matchedRuleEntries = getMatchedRuleEntries(ruleEntryMap);

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
    matchedFiles: ruleFamily.matchedFiles,
    matchedImplications: ruleFamily.matchedImplications,
  }));
  const uncertainty = resolveUncertainty(labels, evidenceEntries, normalizedRequestText);

  return {
    schemaVersion: 'adaptive-context-manifest-v1',
    requestId,
    contextFiles: normalizedContextFiles,
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
