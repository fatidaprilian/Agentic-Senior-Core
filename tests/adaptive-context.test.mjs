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

test('adaptive context manifest handles implicit natural requests', () => {
  const cases = [
    {
      requestText: 'something broke after I pushed the migration yesterday',
      expectedLabels: ['MIG', 'ERR'],
    },
    {
      requestText: 'this page flickers on mobile and text overlaps',
      expectedLabels: ['FE'],
    },
    {
      requestText: 'audit pembayaran ini, takut kebuka akses user lain',
      expectedLabels: ['SEC'],
    },
    {
      requestText: 'bisa cek kenapa checkout lemot banget pas query order',
      expectedLabels: ['DATA', 'PERF'],
    },
    {
      requestText: 'update env var for staging without exposing key',
      expectedLabels: ['CFG', 'SEC'],
    },
    {
      requestText: 'remove duplicate code in auth middleware',
      expectedLabels: ['SEC', 'ARCH'],
    },
  ];

  for (const caseEntry of cases) {
    const manifest = buildSelectedContextManifest({
      requestText: caseEntry.requestText,
    });

    for (const expectedLabel of caseEntry.expectedLabels) {
      assert.ok(
        manifest.labels.includes(expectedLabel),
        `${caseEntry.requestText} should select ${expectedLabel}`
      );
    }
    assert.equal(manifest.fallbackRequired, false);
  }
});

test('adaptive context manifest uses file context signals', () => {
  const manifest = buildSelectedContextManifest({
    requestText: 'fix this behavior',
    contextFiles: [
      'src/app/login/page.tsx',
      'src/middleware/auth.ts',
      'prisma/migrations/20260522_add_orders/migration.sql',
    ],
  });

  assert.ok(manifest.contextFiles.includes('src/app/login/page.tsx'));
  assert.ok(manifest.labels.includes('FE'));
  assert.ok(manifest.labels.includes('SEC'));
  assert.ok(manifest.labels.includes('DATA'));
  assert.ok(manifest.labels.includes('MIG'));
});

test('adaptive context catalog covers every shipped rule family', () => {
  const rulePaths = getRuleFamilyCatalog().map((ruleFamily) => ruleFamily.rulePath);

  assert.ok(rulePaths.includes('.agent-context/rules/architecture.md'));
  assert.ok(rulePaths.includes('.agent-context/rules/security.md'));
  assert.ok(rulePaths.includes('.agent-context/rules/frontend-architecture.md'));
  assert.ok(rulePaths.includes('.agent-context/rules/api-versioning.md'));
  assert.equal(new Set(rulePaths).size, rulePaths.length);
});
