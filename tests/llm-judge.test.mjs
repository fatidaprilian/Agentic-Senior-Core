import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('LLM Judge Tests', async (t) => {
  const judgePath = join(process.cwd(), 'scripts', 'llm-judge.mjs');
  const uiDesignJudgePath = join(process.cwd(), 'scripts', 'ui-design-judge.mjs');
  const designIntentPath = join(process.cwd(), 'docs', 'design-intent.json');
  const sampleUiDiff = [
    'diff --git a/src/App.tsx b/src/App.tsx',
    '--- a/src/App.tsx',
    '+++ b/src/App.tsx',
    '@@ -1,3 +1,3 @@',
    '-export function App() { return <div className="old">Old</div>; }',
    '+export function App() { return <main className="new">New</main>; }',
    '',
  ].join('\n');
  const sampleDesignIntent = {
    projectDomain: 'test-ui-governance',
    designPhilosophy: 'Contract-first UI that avoids generic defaults.',
    mathSystems: {
      typographyScaleRatio: '1.250',
      baseGridUnit: 8,
    },
    colorTruth: {
      format: 'OKLCH',
      allowHexDerivatives: true,
      primaryHue: '250',
      backgroundStrategy: 'contextual contrast pacing',
    },
    crossViewportAdaptation: {
      mutationRules: {
        mobile: 'Stack content and reprioritize primary actions.',
        tablet: 'Reduce density and convert large grids into two columns.',
        desktop: 'Expand layout and preserve comparison workflows.',
      },
    },
    validationHints: {
      requireViewportMutationRules: true,
    },
  };

  function withTemporaryDesignIntent(runTest) {
    const previousDesignIntent = existsSync(designIntentPath)
      ? readFileSync(designIntentPath, 'utf8')
      : null;

    writeFileSync(designIntentPath, `${JSON.stringify(sampleDesignIntent, null, 2)}\n`, 'utf8');

    try {
      runTest();
    } finally {
      if (previousDesignIntent === null) {
        unlinkSync(designIntentPath);
      } else {
        writeFileSync(designIntentPath, previousDesignIntent, 'utf8');
      }
    }
  }

  await t.test('dry-run mode does not error and produces JSON_VERDICT', () => {
    const temporaryOutputDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-judge-'));

    try {
      // In CI environment or normal environments, dry-run shouldn't ask for API keys.
      const output = execSync(`node ${judgePath} --dry-run`, {
        env: {
          ...process.env,
          LLM_JUDGE_OUTPUT_PATH: join(temporaryOutputDirectory, 'llm-judge-report.json'),
        },
      }).toString();
    
      // It should output VERDICT: JSON_VERDICT: []  (dry run — no LLM call made)
      assert.match(output, /JSON_VERDICT:\s*\[\]/);
      assert.match(output, /JSON_REPORT:/);
      assert.match(output, /"schemaVersion":"1.0"/);
      assert.match(output, /"provider":"dry-run"/);
      assert.match(output, /dry run — no LLM call made/);
    } finally {
      rmSync(temporaryOutputDirectory, { recursive: true, force: true });
    }
  });

  await t.test('ui-design-judge dry-run stays advisory and emits machine-readable JSON', () => {
    const temporaryOutputDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-ui-judge-'));

    try {
      withTemporaryDesignIntent(() => {
        const output = execSync(`node ${uiDesignJudgePath} --dry-run`, {
          env: {
            ...process.env,
            PR_DIFF: sampleUiDiff,
            UI_DESIGN_JUDGE_CHANGED_FILES: 'src/App.tsx',
            UI_DESIGN_JUDGE_OUTPUT_PATH: join(temporaryOutputDirectory, 'ui-design-judge-report.json'),
          },
        }).toString();

        const report = JSON.parse(output);
        assert.equal(report.auditName, 'ui-design-judge');
        assert.equal(report.mode, 'advisory');
        assert.equal(report.advisoryOnly, true);
        assert.equal(report.provider, 'dry-run');
        assert.equal(report.contractPresent, true);
        assert.equal(report.summary.changedUiFileCount, 1);
        assert.match(report.notes.join(' '), /Dry run enabled/);
      });
    } finally {
      rmSync(temporaryOutputDirectory, { recursive: true, force: true });
    }
  });

  await t.test('ui-design-judge mock provider keeps advisory mode non-blocking', () => {
    const temporaryOutputDirectory = mkdtempSync(join(tmpdir(), 'agentic-senior-core-ui-judge-'));

    try {
      withTemporaryDesignIntent(() => {
        const output = execSync(`node ${uiDesignJudgePath}`, {
          env: {
            ...process.env,
            PR_DIFF: sampleUiDiff,
            UI_DESIGN_JUDGE_CHANGED_FILES: 'src/App.tsx',
            UI_DESIGN_JUDGE_OUTPUT_PATH: join(temporaryOutputDirectory, 'ui-design-judge-report.json'),
            UI_DESIGN_JUDGE_MOCK_RESPONSE: 'JSON_VERDICT: {"alignmentScore":82,"notes":["Contract stays opinionated without becoming generic."],"findings":[{"area":"responsive","severity":"major","problem":"Mobile layout still mirrors desktop grouping.","evidence":"Cards remain three-up in the supplied diff.","recommendation":"Stack content and reprioritize CTAs for small screens.","blockingRecommended":true}]}',
          },
        }).toString();

        const report = JSON.parse(output);
        assert.equal(report.auditName, 'ui-design-judge');
        assert.equal(report.provider, 'mock');
        assert.equal(report.mode, 'advisory');
        assert.equal(report.advisoryOnly, true);
        assert.equal(report.passed, true);
        assert.equal(report.summary.alignmentScore, 82);
        assert.equal(report.summary.driftCount, 1);
        assert.equal(report.summary.blockingCandidateCount, 1);
        assert.equal(report.findings[0].severity, 'high');
        assert.equal(report.findings[0].blockingRecommended, true);
      });
    } finally {
      rmSync(temporaryOutputDirectory, { recursive: true, force: true });
    }
  });

  await t.test('ui-design-judge strict mode can fail explicitly when blocking drift is present', () => {
    withTemporaryDesignIntent(() => {
      assert.throws(() => {
        execSync(`node ${uiDesignJudgePath} --strict`, {
          env: {
            ...process.env,
            PR_DIFF: sampleUiDiff,
            UI_DESIGN_JUDGE_CHANGED_FILES: 'src/App.tsx',
            UI_DESIGN_JUDGE_EMIT_JSON: 'false',
            UI_DESIGN_JUDGE_MOCK_RESPONSE: 'JSON_VERDICT: {"alignmentScore":61,"notes":["Strict review requested."],"findings":[{"area":"genericity","severity":"high","problem":"Interactive styling regressed to generic template defaults.","evidence":"Buttons and cards use undifferentiated utility classes without the contract hierarchy.","recommendation":"Reapply the design contract tokens and viewport-specific structure.","blockingRecommended":true}]}',
          },
          stdio: 'pipe',
        });
      }, /Command failed/u);
    });
  });
});
