import test from 'node:test';
import assert from 'node:assert/strict';

import { COMPACT_NATURAL_MODE_FIXTURES } from '../benchmarks/compact-natural-mode/fixtures.mjs';
import {
  evaluateCompactNaturalFixtures,
  scoreCompactNaturalCandidate,
} from '../benchmarks/compact-natural-mode/scorer.mjs';

test('compact natural benchmark passes fixtures and rejects negative controls', () => {
  const report = evaluateCompactNaturalFixtures(COMPACT_NATURAL_MODE_FIXTURES);

  assert.equal(report.passed, true);
  assert.equal(report.failedCount, 0);
  assert.ok(report.fixtureCount >= 8);
  assert.ok(report.negativeControlCount >= report.fixtureCount);
  assert.equal(report.negativeControlEscapeCount, 0);
  assert.equal(report.summary.mandatoryEvidenceFailureCount, 0);
  assert.equal(report.summary.registerFailureCount, 0);
  assert.equal(report.summary.semanticFailureCount, 0);
  assert.equal(report.summary.actionabilityFailureCount, 0);
  assert.equal(report.summary.calibrationFailureCount, 0);
  assert.ok(report.summary.averageCompactQualityScore >= 0.8);
});

test('compact natural scorer fails when mandatory evidence is missing', () => {
  const fixture = COMPACT_NATURAL_MODE_FIXTURES.find((fixtureEntry) => {
    return fixtureEntry.id === 'debug-root-cause-session-id';
  });
  const score = scoreCompactNaturalCandidate(
    fixture,
    'Root Cause: The auth callback has a null handling bug. Fix it and rerun tests.'
  );

  assert.equal(score.passed, false);
  assert.equal(score.mandatoryEvidenceFailed, true);
  assert.ok(score.missingEvidenceAtoms.includes('error-message'));
  assert.ok(score.missingEvidenceAtoms.includes('file-line'));
});

test('compact natural scorer fails overconfident validation claims', () => {
  const fixture = COMPACT_NATURAL_MODE_FIXTURES.find((fixtureEntry) => {
    return fixtureEntry.id === 'refactor-summary-behavior-not-verified';
  });
  const score = scoreCompactNaturalCandidate(
    fixture,
    [
      'Changed: Split discount math from `calculateOrderTotal` into `calculateDiscountAmount` in `src/orders/price.ts`.',
      'Behavior change: behavior is unchanged and verified.',
      'Validation: fully verified.',
      'Next: Run `npm test -- order-total.test.mjs`.',
    ].join('\n')
  );

  assert.equal(score.passed, false);
  assert.ok(score.forbiddenOverconfidence.length >= 1);
});
