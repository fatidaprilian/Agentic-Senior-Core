import { DOCS_BY_LABEL, PROMPT_CATALOG, RULE_FAMILY_CATALOG, STATE_BY_LABEL } from './adaptive-context/catalog.mjs';
import { CONTEXT_FILE_CATALOG } from './adaptive-context/file-signals.mjs';
import { IMPLICATION_CATALOG } from './adaptive-context/implications.mjs';

const CONTEXT_BUDGET_POLICY = Object.freeze({
  maxRecommendedRuleCount: 5,
  maxFallbackRuleCount: 7,
});

export function getRuleFamilyCatalog() {
  return RULE_FAMILY_CATALOG.map((ruleFamily) => ({ ...ruleFamily }));
}

export function normalizeRequestText(requestText) {
  return String(requestText || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function triggerMatchesRequest(text, trigger) {
  if (!text || !trigger) return false;
  return /^[a-z0-9 ]+$/.test(trigger)
    ? new RegExp(`(^|[^a-z0-9])${trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`).test(text)
    : text.includes(trigger);
}

const uniqueSorted = (arr) => Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));

function resolveUncertainty(labels, evidence, text) {
  if (!text || !labels.length) return 'high';
  const hasSparseEvidence = evidence.some(e => (e.matchedTriggers.length + e.matchedFiles.length + e.matchedImplications.length) === 1);
  return (labels.length >= 6 || hasSparseEvidence) ? 'medium' : 'low';
}

function buildContextBudget(labels, evidence) {
  const selectedRuleCount = labels.length;
  const evidenceSignalCount = evidence.reduce((sum, e) => sum + e.matchedTriggers.length + e.matchedFiles.length + e.matchedImplications.length, 0);
  const overRecommendedRuleCount = Math.max(0, selectedRuleCount - CONTEXT_BUDGET_POLICY.maxRecommendedRuleCount);
  const overFallbackRuleCount = Math.max(0, selectedRuleCount - CONTEXT_BUDGET_POLICY.maxFallbackRuleCount);
  
  let status = 'within-budget';
  if (overFallbackRuleCount > 0) status = 'fallback-required';
  else if (overRecommendedRuleCount > 0) status = 'wide-context';

  return {
    status,
    selectedRuleCount,
    evidenceSignalCount,
    maxRecommendedRuleCount: CONTEXT_BUDGET_POLICY.maxRecommendedRuleCount,
    maxFallbackRuleCount: CONTEXT_BUDGET_POLICY.maxFallbackRuleCount,
    overRecommendedRuleCount,
    overFallbackRuleCount,
  };
}

export function buildSelectedContextManifest({ contextFiles = [], requestId = 'adhoc-request', requestText = '' } = {}) {
  const normText = normalizeRequestText(requestText);
  const normFiles = (Array.isArray(contextFiles) ? contextFiles : [])
    .map(f => String(f || '').trim().replace(/\\/g, '/').replace(/\/+/g, '/').toLowerCase())
    .filter(Boolean);

  const matchedEntries = RULE_FAMILY_CATALOG.map(rule => {
    const matchedTriggers = rule.triggers.filter(t => triggerMatchesRequest(normText, t));
    const filePatterns = CONTEXT_FILE_CATALOG.find(c => c.label === rule.label)?.patterns || [];
    const matchedFiles = normFiles.filter(f => filePatterns.some(p => p.test(f)));
    return { ...rule, matchedTriggers, matchedFiles, matchedImplications: [] };
  });

  const matchedLabelSet = new Set(matchedEntries.filter(e => e.matchedTriggers.length || e.matchedFiles.length).map(e => e.label));

  for (const imp of IMPLICATION_CATALOG) {
    if (imp.requiresAnyLabel.some(l => matchedLabelSet.has(l))) {
      const triggers = imp.triggers.filter(t => triggerMatchesRequest(normText, t));
      if (triggers.length) {
        const target = matchedEntries.find(e => e.label === imp.label);
        if (target) {
          const detail = `${imp.reason}: ${triggers.join(', ')}`;
          if (!target.matchedImplications.includes(detail)) target.matchedImplications.push(detail);
          matchedLabelSet.add(imp.label);
        }
      }
    }
  }

  const matchedRuleEntries = matchedEntries
    .filter(e => e.matchedTriggers.length || e.matchedFiles.length || e.matchedImplications.length)
    .sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label));

  const labels = matchedRuleEntries.map(e => e.label);
  const evidence = matchedRuleEntries.map(({ label, matchedTriggers, matchedFiles, matchedImplications }) => ({ label, matchedTriggers, matchedFiles, matchedImplications }));
  const uncertainty = resolveUncertainty(labels, evidence, normText);
  const budget = buildContextBudget(labels, evidence);

  const selectedRuleSet = new Set(matchedRuleEntries.map(e => e.rulePath));

  const selectedPrompts = PROMPT_CATALOG
    .filter(p => (Array.isArray(p.labels) && p.labels.some(l => labels.includes(l))) || p.triggers.some(t => triggerMatchesRequest(normText, t)))
    .map(p => p.promptPath);

  return {
    schemaVersion: 'adaptive-context-manifest-v1',
    requestId,
    contextFiles: normFiles,
    labels,
    selectedRules: matchedRuleEntries.map(e => e.rulePath),
    selectedPrompts: uniqueSorted(selectedPrompts),
    selectedDocs: uniqueSorted(['docs/doc-index.md', ...labels.flatMap(l => DOCS_BY_LABEL[l] || [])]),
    selectedState: uniqueSorted(['.agent-context/state/onboarding-report.json', ...labels.flatMap(l => STATE_BY_LABEL[l] || [])]),
    skippedRules: RULE_FAMILY_CATALOG.map(r => r.rulePath).filter(r => !selectedRuleSet.has(r)).sort((a, b) => a.localeCompare(b)),
    uncertainty,
    budget,
    fallbackRequired: uncertainty === 'high' || budget.status === 'fallback-required',
    evidence,
  };
}

export function evaluateAdaptiveContextFixtures(fixtures) {
  const results = fixtures.map(fixture => {
    const manifest = buildSelectedContextManifest({ requestId: fixture.id, requestText: fixture.requestText });
    const reqSet = new Set(fixture.requiredLabels);
    const allowSet = new Set(fixture.allowedLabels || fixture.requiredLabels);
    return {
      id: fixture.id,
      passed: fixture.requiredLabels.every(l => manifest.labels.includes(l)),
      missedRequiredLabels: fixture.requiredLabels.filter(l => !manifest.labels.includes(l)),
      extraLabels: manifest.labels.filter(l => !allowSet.has(l)),
      manifest,
    };
  });

  const failed = results.filter(r => !r.passed);
  const selectedRuleCounts = results.map(r => r.manifest.budget.selectedRuleCount);

  return {
    reportName: 'adaptive-context-benchmark',
    generatedAt: new Date().toISOString(),
    fixtureCount: results.length,
    passed: failed.length === 0,
    passedCount: results.length - failed.length,
    failedCount: failed.length,
    missedRequiredLabelCount: results.reduce((sum, r) => sum + r.missedRequiredLabels.length, 0),
    extraLabelCount: results.reduce((sum, r) => sum + r.extraLabels.length, 0),
    budgetSummary: {
      maxSelectedRuleCount: Math.max(0, ...selectedRuleCounts),
      averageSelectedRuleCount: results.length ? Number((selectedRuleCounts.reduce((a, b) => a + b, 0) / results.length).toFixed(2)) : 0,
      overRecommendedFixtureCount: results.filter(r => r.manifest.budget.status !== 'within-budget').length,
      fallbackFixtureCount: results.filter(r => r.manifest.fallbackRequired).length,
      maxRecommendedRuleCount: CONTEXT_BUDGET_POLICY.maxRecommendedRuleCount,
      maxFallbackRuleCount: CONTEXT_BUDGET_POLICY.maxFallbackRuleCount,
    },
    results,
  };
}
