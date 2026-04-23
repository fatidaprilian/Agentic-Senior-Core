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
    tokenSystem: {
      sourceOfTruth: 'docs/design-intent.json',
      taxonomyOrder: ['primitive', 'semantic', 'component'],
      primitiveColorSpace: 'OKLCH',
      requireSemanticAliases: true,
      componentTokensConsumeSemantic: true,
      forbidDirectComponentPrimitiveBypass: true,
    },
    crossViewportAdaptation: {
      mutationRules: {
        mobile: 'Stack content and reprioritize primary actions.',
        tablet: 'Reduce density and convert large grids into two columns.',
        desktop: 'Expand layout and preserve comparison workflows.',
      },
    },
    motionSystem: {
      allowMeaningfulMotion: true,
      respectReducedMotion: true,
      preferTransformAndOpacity: true,
    },
    componentMorphology: {
      requireStateBehaviorMatrix: true,
      preserveIdentityAcrossViewports: true,
    },
    accessibilityPolicy: {
      hardComplianceFloor: 'WCAG-2.2-AA',
      advisoryContrastModel: 'APCA',
      failOnHardViolations: true,
    },
    designExecutionPolicy: {
      representationStrategy: 'surface-plan-v1',
      requireSurfacePlan: true,
      requireComponentGraph: true,
      requireViewportMutationPlan: true,
      requireInteractionStateMatrix: true,
      requireContentPriorityMap: true,
      requireTaskFlowNarrative: true,
      requireSignatureMoveRationale: true,
      requireStructuredHandoff: true,
      requireRepoEvidenceAlignment: true,
      forbidScreenshotDependency: true,
      handoffFormatVersion: 'ui-handoff-v1',
      semanticReviewFocus: [
        'distinctiveness-vs-genericity',
        'contract-fidelity',
        'hierarchy-and-task-priority',
        'component-state-behavior',
        'cross-viewport-mutation',
      ],
    },
    designExecutionHandoff: {
      version: 'ui-handoff-v1',
      location: 'inline-design-intent',
      status: 'ready',
      primaryExperienceGoal: 'Drive one decisive UI action with explicit supporting proof and authored hierarchy.',
      surfacePlan: [
        {
          surfaceId: 'primary-entry-surface',
          role: 'primary-task-entry',
          goal: 'Establish the first task immediately.',
          primaryAction: 'Start the main user flow.',
          supportingModules: ['context', 'proof'],
          signatureMoveHint: 'Use one authored surface tension instead of a generic hero.',
        },
      ],
      componentGraph: {
        nodes: [
          { id: 'primary-action-surface', role: 'task-driver', priority: 'high' },
          { id: 'supporting-context-rail', role: 'context-support', priority: 'medium' },
        ],
        edges: [
          { from: 'primary-action-surface', to: 'supporting-context-rail', relationship: 'context-support' },
        ],
      },
      contentPriorityMap: {
        primary: ['primary-task'],
        secondary: ['supporting-proof'],
        deferred: ['tertiary-detail'],
      },
      viewportMutationPlan: {
        mobile: 'Prioritize the primary task first.',
        tablet: 'Preserve hierarchy with condensed chrome.',
        desktop: 'Expose richer supporting context without weakening the main task.',
      },
      interactionStateMatrix: [
        {
          componentId: 'primary-action-control',
          states: ['default', 'hover', 'focus', 'loading', 'success', 'error'],
          notes: 'Primary action states stay decisive and legible.',
        },
      ],
      taskFlowNarrative: [
        'Entry: orient the user quickly.',
        'Decision: confirm the next action with proof and hierarchy.',
        'Resolution: return clear feedback and the next useful move.',
      ],
      signatureMoveRationale: 'The layout should feel authored through one clear visual tension.',
      implementationGuardrails: {
        requireBuildFromHandoff: true,
        requireGapNotesBeforeFallback: true,
        forbidGenericLayoutFallbackWithoutReason: true,
      },
    },
    reviewRubric: {
      version: 'ui-rubric-v1',
      dimensions: [
        { key: 'distinctiveness', blockingByDefault: false, question: 'Does the UI feel authored?' },
        { key: 'contractFidelity', blockingByDefault: true, question: 'Does the UI follow the contract?' },
        { key: 'visualConsistency', blockingByDefault: false, question: 'Does the system stay coherent?' },
        { key: 'heuristicUxQuality', blockingByDefault: false, question: 'Does the flow stay clear and trustworthy?' },
        { key: 'motionDiscipline', blockingByDefault: false, question: 'Does motion stay purposeful and safe?' },
      ],
      genericitySignals: [
        'safe-centered-hero-without-product-rationale',
        'balanced-card-grid-without-priority-shift',
        'default-framework-button-and-input-treatment',
      ],
      validBoldSignals: [
        'one-clear-signature-move',
        'project-specific-layout-tension',
        'purposeful-motion-as-identity',
      ],
      reportingRules: {
        mustExplainGenericity: true,
        mustSeparateTasteFromFailure: true,
        contractFidelityOverridesPersonalTaste: true,
      },
    },
    repoEvidence: {
      designEvidenceSummary: {
        summaryVersion: 'v1',
        source: 'lightweight-static-scan',
      },
    },
    contextHygiene: {
      continuityMode: 'opt-in-only',
      repoEvidenceOverridesMemory: true,
      requireExplicitContinuityApproval: true,
      forbidCarryoverWhenUnapproved: true,
    },
  };

  function withTemporaryDesignIntent(designIntentValue, runTest) {
    const previousDesignIntent = existsSync(designIntentPath)
      ? readFileSync(designIntentPath, 'utf8')
      : null;

    writeFileSync(designIntentPath, `${JSON.stringify(designIntentValue, null, 2)}\n`, 'utf8');

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

  await t.test('ui-design-judge stays advisory for the repo workflow', () => {
    withTemporaryDesignIntent(sampleDesignIntent, () => {
      const output = execSync(`node ${uiDesignJudgePath}`, {
        env: {
          ...process.env,
          PR_DIFF: sampleUiDiff,
          UI_DESIGN_JUDGE_MOCK_RESPONSE: 'JSON_VERDICT: {"alignmentScore":82,"genericityAssessment":{"status":"mixed","reason":"The UI still carries one template-like grouping pattern, but the contract remains visible."},"tasteVsFailureSeparated":true,"rubricBreakdown":[{"dimension":"distinctiveness","score":68,"verdict":"acceptable","reason":"The direction is somewhat authored but still leans on one familiar grouping move.","blocking":false},{"dimension":"contractFidelity","score":61,"verdict":"weak","reason":"The mobile hierarchy drifted from the contract.","blocking":true}],"notes":["Contract stays opinionated without becoming generic."],"findings":[{"area":"responsive","severity":"major","problem":"Mobile layout still mirrors desktop grouping.","evidence":"Cards remain three-up in the supplied diff.","recommendation":"Stack content and reprioritize CTAs for small screens.","blockingRecommended":true}]}',
        },
      }).toString();

      const report = JSON.parse(output);
      assert.equal(report.auditName, 'ui-design-judge');
      assert.equal(report.mode, 'advisory');
      assert.equal(report.advisoryOnly, true);
      assert.equal(report.provider, 'mock');
      assert.equal(report.contractPresent, true);
      assert.equal(report.passed, true);
      assert.equal(report.summary.changedUiFileCount, 1);
      assert.equal(report.summary.alignmentScore, 82);
      assert.equal(report.summary.designExecutionSignalCount, 9);
      assert.equal(report.summary.genericityStatus, 'mixed');
      assert.equal(report.summary.blockingCandidateCount, 1);
      assert.equal(report.semanticJudge.attempted, true);
      assert.equal(report.designExecution.policyPresent, true);
      assert.equal(report.designExecution.contractReady, true);
      assert.equal(report.designExecution.handoffPresent, true);
      assert.equal(report.designExecution.handoffReady, true);
      assert.equal(report.designExecution.handoffArtifactCount >= 8, true);
      assert.equal(report.designExecution.screenshotDependencyForbidden, true);
      assert.ok(Array.isArray(report.designExecution.semanticReviewFocus));
      assert.equal(report.rubric.expectedDimensions.length, 5);
      assert.equal(report.rubric.genericityAssessment.status, 'mixed');
      assert.equal(report.rubric.tasteVsFailureSeparated, true);
      assert.equal(report.rubric.breakdown[0].dimension, 'distinctiveness');
      assert.equal(report.findings[0].severity, 'high');
    });
  });

  await t.test('ui-design-judge stays non-blocking when no provider is configured', () => {
    withTemporaryDesignIntent(sampleDesignIntent, () => {
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
      assert.equal(report.designExecution.handoffReady, true);
      assert.equal(report.summary.genericityStatus, 'unclear');
      assert.equal(report.rubric.genericityAssessment.status, 'unclear');
      assert.match(report.notes.join(' '), /No LLM provider configured/);
    });
  });

  await t.test('ui-design-judge surfaces missing structured execution capabilities without blocking', () => {
    const incompleteDesignIntent = {
      ...sampleDesignIntent,
      designExecutionPolicy: {
        ...sampleDesignIntent.designExecutionPolicy,
        requireComponentGraph: false,
        requireViewportMutationPlan: false,
        semanticReviewFocus: ['contract-fidelity'],
      },
    };

    withTemporaryDesignIntent(incompleteDesignIntent, () => {
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
      assert.equal(report.provider, 'none');
      assert.equal(report.designExecution.policyPresent, true);
      assert.equal(report.designExecution.contractReady, false);
      assert.equal(report.designExecution.handoffPresent, true);
      assert.equal(report.rubric.expectedDimensions.length, 5);
      assert.ok(report.designExecution.missingCapabilities.includes('requireComponentGraph'));
      assert.ok(report.designExecution.missingCapabilities.includes('requireViewportMutationPlan'));
      assert.match(report.notes.join(' '), /missing required capabilities/i);
    });
  });
});
