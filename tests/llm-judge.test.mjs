import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('LLM Judge Tests', async (t) => {
  const judgePath = join(process.cwd(), 'scripts', 'llm-judge.mjs');
  const uiDesignJudgePath = join(process.cwd(), 'scripts', 'ui-design-judge.mjs');
  const designGuidePath = join(process.cwd(), 'docs', 'DESIGN.md');
  const sampleUiDiff = [
    'diff --git a/src/App.tsx b/src/App.tsx',
    '--- a/src/App.tsx',
    '+++ b/src/App.tsx',
    '@@ -1,3 +1,3 @@',
    '-export function App() { return <div className="old">Old</div>; }',
    '+export function App() { return <main className="new">New</main>; }',
    '',
  ].join('\n');
  const sampleDesignGuide = [
    '# DESIGN.md',
    '## Anchor',
    'Use physical tactile realism.',
    '## Tokens',
    '- Colors: OKLCH',
    '## Constraints',
    '- WCAG 2.2 AA floor',
  ].join('\n');

  function withTemporaryDesignGuide(designGuideValue, runTest) {
    const previousDesignGuide = existsSync(designGuidePath)
      ? readFileSync(designGuidePath, 'utf8')
      : null;

    writeFileSync(designGuidePath, designGuideValue, 'utf8');

    try {
      runTest();
    } finally {
      if (previousDesignGuide === null) {
        unlinkSync(designGuidePath);
      } else {
        writeFileSync(designGuidePath, previousDesignGuide, 'utf8');
      }
    }
  }

  await t.test('dry-run mode does not error and produces JSON_VERDICT', () => {
    const temporaryOutputDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-judge-'));

    try {
      const output = execSync(`node ${judgePath} --dry-run`, {
        env: {
          ...process.env,
          LLM_JUDGE_OUTPUT_PATH: join(temporaryOutputDirectory, 'llm-judge-report.json'),
        },
      }).toString();

      assert.match(output, /JSON_VERDICT:\s*\[\]/);
      assert.match(output, /JSON_REPORT:/);
      assert.match(output, /"schemaVersion":"1.0"/);
      assert.match(output, /"provider":"dry-run"/);
    } finally {
      rmSync(temporaryOutputDirectory, { recursive: true, force: true });
    }
  });

  await t.test('ui-design-judge stays non-blocking when no provider is configured', () => {
    withTemporaryDesignGuide(sampleDesignGuide, () => {
      const output = execSync(`node ${uiDesignJudgePath}`, {
        env: {
          ...process.env,
          PR_DIFF: sampleUiDiff,
          OPENAI_API_KEY: '',
          ANTHROPIC_API_KEY: '',
          GEMINI_API_KEY: '',
          UI_DESIGN_JUDGE_MOCK_RESPONSE: '',
        },
      }).toString();

      const report = JSON.parse(output);
      assert.equal(report.auditName, 'ui-design-judge');
      assert.equal(report.provider, 'none');
      assert.equal(report.mode, 'advisory');
      assert.equal(report.advisoryOnly, true);
      assert.equal(report.passed, true);
      assert.equal(report.semanticJudge.skipped, true);
      assert.equal(report.semanticJudge.skipReason, 'no-provider-configured');
      assert.equal(report.summary.genericityStatus, 'unclear');
      assert.match(report.notes.join(' '), /No LLM provider configured/);
    });
  });

  await t.test('ui-design-judge executes with mock provider and evaluates DESIGN.md', () => {
    withTemporaryDesignGuide(sampleDesignGuide, () => {
      const output = execSync(`node ${uiDesignJudgePath}`, {
        env: {
          ...process.env,
          PR_DIFF: sampleUiDiff,
          UI_DESIGN_JUDGE_MOCK_RESPONSE: 'JSON_VERDICT: {"alignmentScore":82,"genericityAssessment":{"status":"generic","reason":"Mock reason"},"tasteVsFailureSeparated":true,"rubricBreakdown":[],"notes":["Test note"],"findings":[{"area":"responsive","severity":"major","problem":"Mock problem","evidence":"Mock evidence","requiredAction":"Mock action","blockingRecommended":false}]}',
        },
      }).toString();

      const report = JSON.parse(output);
      assert.equal(report.auditName, 'ui-design-judge');
      assert.equal(report.provider, 'mock');
      assert.equal(report.contractPresent, true);
      assert.equal(report.summary.changedUiFileCount, 1);
      assert.equal(report.semanticJudge.attempted, true);
    });
  });
});
