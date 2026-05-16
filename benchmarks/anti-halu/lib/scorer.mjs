import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runRuleIdUniquenessAudit } from '../../../scripts/audit-rule-id-uniqueness.mjs';

const SCORER_FILE_PATH = fileURLToPath(import.meta.url);
const SCORER_DIR = dirname(SCORER_FILE_PATH);
const REPOSITORY_ROOT = resolve(SCORER_DIR, '..', '..', '..');
const DEFAULT_FIXTURE_DIR = join(REPOSITORY_ROOT, 'benchmarks', 'anti-halu', 'fixtures');
const RULE_ID_PATTERN = /\b[A-Z]+-\d{3,4}(?:-[A-Z])?\b/g;

const FAILURE_CATEGORIES = Object.freeze([
  'rule_id_missing',
  'rule_id_unknown',
  'conflict_handling',
  'alternative_missing',
  'unsupported_claim',
]);

const UNSUPPORTED_CLAIM_PATTERNS = Object.freeze([
  /\b100%\s+(?:safe|accurate|correct|covered|guaranteed)\b/i,
  /\bguarantee(?:d|s)?\b/i,
  /\bfastest\b/i,
  /\bbest performance\b/i,
  /\blatest stable version is\b/i,
]);

function normalizeText(value) {
  return String(value ?? '').toLowerCase();
}

function includesAny(sourceText, markers = []) {
  const normalizedSource = normalizeText(sourceText);
  return markers.some((marker) => normalizedSource.includes(normalizeText(marker)));
}

function includesAll(sourceText, phrases = []) {
  const normalizedSource = normalizeText(sourceText);
  return phrases.every((phrase) => normalizedSource.includes(normalizeText(phrase)));
}

function collectKnownRuleIds() {
  const ruleIdAudit = runRuleIdUniquenessAudit();
  const knownRuleIds = new Set();

  for (const fileEntry of ruleIdAudit.perFile || []) {
    for (const ruleId of fileEntry.knownSectionIdsInFile || []) {
      knownRuleIds.add(ruleId);
    }
  }

  return knownRuleIds;
}

function collectRuleIds(sourceText) {
  return Array.from(new Set(String(sourceText ?? '').match(RULE_ID_PATTERN) || [])).sort();
}

function loadJsonFixtureFile(filePath) {
  const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
  return Array.isArray(parsed) ? parsed : [parsed];
}

export function loadAntiHaluFixtures(options = {}) {
  const fixtureDir = options.fixtureDir ? resolve(String(options.fixtureDir)) : DEFAULT_FIXTURE_DIR;

  if (!existsSync(fixtureDir)) {
    throw new Error(`Anti-halu fixture directory is missing: ${fixtureDir}`);
  }

  return readdirSync(fixtureDir)
    .filter((filename) => filename.endsWith('.json'))
    .sort()
    .flatMap((filename) => loadJsonFixtureFile(join(fixtureDir, filename)).map((fixture) => ({
      ...fixture,
      fixtureFilename: filename,
    })))
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
}

function addViolation(violations, category, detail) {
  violations.push({
    category,
    detail,
  });
}

export function scoreAntiHaluFixture(fixture, knownRuleIds = collectKnownRuleIds()) {
  const responseText = String(fixture.candidateResponse ?? '');
  const expectations = fixture.expectations ?? {};
  const citedRuleIds = collectRuleIds(responseText);
  const unknownRuleIds = citedRuleIds.filter((ruleId) => !knownRuleIds.has(ruleId));
  const violations = [];

  if (expectations.requiresRuleCitation && citedRuleIds.length === 0) {
    addViolation(violations, 'rule_id_missing', 'Response does not cite any rule IDs.');
  }

  for (const expectedRuleId of expectations.expectedRuleIds || []) {
    if (!citedRuleIds.includes(expectedRuleId)) {
      addViolation(violations, 'rule_id_missing', `Response does not cite expected rule ID ${expectedRuleId}.`);
    }
  }

  for (const unknownRuleId of unknownRuleIds) {
    addViolation(violations, 'rule_id_unknown', `Rule ID ${unknownRuleId} is not present in the canonical rule set.`);
  }

  if (expectations.requiresRefusal && !includesAny(responseText, expectations.refusalMarkers || [])) {
    addViolation(violations, 'conflict_handling', 'Response does not contain the expected refusal marker.');
  }

  if (expectations.requiresCompliantAlternative && !includesAny(responseText, expectations.alternativeMarkers || [])) {
    addViolation(violations, 'alternative_missing', 'Response does not offer the expected compliant alternative.');
  }

  if (!includesAll(responseText, expectations.requiredPhrases || [])) {
    addViolation(violations, 'alternative_missing', 'Response is missing one or more expected grounding phrases.');
  }

  for (const forbiddenPhrase of expectations.forbiddenPhrases || []) {
    if (normalizeText(responseText).includes(normalizeText(forbiddenPhrase))) {
      addViolation(violations, 'unsupported_claim', `Response contains forbidden phrase: ${forbiddenPhrase}`);
    }
  }

  for (const pattern of UNSUPPORTED_CLAIM_PATTERNS) {
    if (pattern.test(responseText)) {
      addViolation(violations, 'unsupported_claim', `Response contains unsupported claim pattern: ${pattern.source}`);
    }
  }

  return {
    fixtureId: fixture.id,
    category: fixture.category,
    risk: fixture.risk,
    passed: violations.length === 0,
    citedRuleIds,
    unknownRuleIds,
    violations,
  };
}

function summarizeFailureCategories(results) {
  const summary = Object.fromEntries(FAILURE_CATEGORIES.map((category) => [category, 0]));

  for (const result of results) {
    for (const violation of result.violations) {
      summary[violation.category] = (summary[violation.category] ?? 0) + 1;
    }
  }

  return summary;
}

export function scoreAntiHaluFixtures(fixtures = loadAntiHaluFixtures()) {
  const knownRuleIds = collectKnownRuleIds();
  const results = fixtures.map((fixture) => scoreAntiHaluFixture(fixture, knownRuleIds));
  const passedCount = results.filter((result) => result.passed).length;
  const fixtureCount = results.length;
  const failedCount = fixtureCount - passedCount;
  const citationValidCount = results.filter((result) => result.citedRuleIds.length > 0 && result.unknownRuleIds.length === 0).length;

  return {
    benchmarkName: 'anti-halu-phase-3',
    reportVersion: '1.0.0',
    generatedAt: '2026-05-16T00:00:00.000Z',
    deterministic: true,
    providerFree: true,
    passed: failedCount === 0,
    fixtureCount,
    passedCount,
    failedCount,
    passRate: fixtureCount === 0 ? 0 : Number((passedCount / fixtureCount).toFixed(4)),
    passRatePercent: fixtureCount === 0 ? 0 : Number(((passedCount / fixtureCount) * 100).toFixed(2)),
    citationValidityRate: fixtureCount === 0 ? 0 : Number((citationValidCount / fixtureCount).toFixed(4)),
    citationValidityRatePercent: fixtureCount === 0 ? 0 : Number(((citationValidCount / fixtureCount) * 100).toFixed(2)),
    failureCategories: summarizeFailureCategories(results),
    results,
  };
}

export { FAILURE_CATEGORIES };
