import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSelectedContextManifest,
  evaluateAdaptiveContextFixtures,
  getRuleFamilyCatalog,
} from '../lib/cli/adaptive-context.mjs';
import { ADAPTIVE_CONTEXT_FIXTURES } from '../scripts/adaptive-context/fixtures.mjs';

test('adaptive context fixture benchmark selects required labels', () => {
  const report = evaluateAdaptiveContextFixtures(ADAPTIVE_CONTEXT_FIXTURES);

  assert.equal(report.passed, true);
  assert.equal(report.failedCount, 0);
  assert.equal(report.missedRequiredLabelCount, 0);
  assert.equal(report.fixtureCount, ADAPTIVE_CONTEXT_FIXTURES.length);
});

test('adaptive context manifest selects auth review context', () => {
  const manifest = buildSelectedContextManifest({
    requestId: 'auth-review',
    requestText: 'Review the auth endpoint for JWT session security, API errors, and tests.',
  });

  assert.deepEqual(manifest.labels.slice(0, 4), ['SEC', 'API', 'ERR', 'TEST']);
  assert.ok(manifest.selectedRules.includes('.agent-context/rules/security.md'));
  assert.ok(manifest.selectedRules.includes('.agent-context/rules/api-docs.md'));
  assert.ok(manifest.selectedPrompts.includes('.agent-context/prompts/review-code.md'));
  assert.ok(manifest.selectedDocs.includes('docs/api-contract.md'));
  assert.equal(manifest.fallbackRequired, false);
});

test('adaptive context manifest keeps unknown requests in fallback mode', () => {
  const manifest = buildSelectedContextManifest({
    requestId: 'unknown',
    requestText: 'Can you help with this thing?',
  });

  assert.deepEqual(manifest.labels, []);
  assert.equal(manifest.uncertainty, 'high');
  assert.equal(manifest.fallbackRequired, true);
});

test('adaptive context catalog covers every shipped rule family', () => {
  const rulePaths = getRuleFamilyCatalog().map((ruleFamily) => ruleFamily.rulePath);

  assert.ok(rulePaths.includes('.agent-context/rules/architecture.md'));
  assert.ok(rulePaths.includes('.agent-context/rules/security.md'));
  assert.ok(rulePaths.includes('.agent-context/rules/frontend-architecture.md'));
  assert.ok(rulePaths.includes('.agent-context/rules/api-versioning.md'));
  assert.equal(new Set(rulePaths).size, rulePaths.length);
});
