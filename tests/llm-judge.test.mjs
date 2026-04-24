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
    mode: 'dynamic',
    status: 'ready',
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
      requirePerSurfaceMutationOps: true,
      forbidUniformSiblingSurfaceTreatment: true,
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
      seedMode: 'structure-first-scaffold',
      requiresTaskSpecificRefinement: true,
      primaryExperienceGoal: 'Ask the LLM to define the primary experience from current context instead of using an offline style preset.',
      surfacePlan: [
        {
          surfaceId: 'agent-defined-primary-experience',
          role: 'llm-synthesized-from-current-context',
          goal: 'Define the first task or reading path from current evidence.',
          primaryAction: 'The LLM chooses the main action after reading the repo and brief.',
          supportingModules: ['agent-defined-from-current-context'],
          signatureMoveHint: 'Choose one authored move from current context.',
          layoutAntiPatternToAvoid: 'template-default-without-product-rationale',
        },
        {
          surfaceId: 'agent-defined-supporting-experience',
          role: 'llm-synthesized-supporting-context',
          goal: 'Define supporting or recovery surfaces from real user needs.',
          primaryAction: 'The LLM chooses what support belongs beside, below, or behind disclosure.',
          supportingModules: ['agent-defined-from-current-context'],
          signatureMoveHint: 'Explain responsive changes from task priority.',
          layoutAntiPatternToAvoid: 'scale-only-responsive-layout',
        },
      ],
      componentGraph: {
        nodes: [
          { id: 'agent-defined-primary-experience', role: 'primary-experience-after-synthesis', priority: 'high' },
          { id: 'agent-defined-supporting-experience', role: 'supporting-experience-after-synthesis', priority: 'medium' },
        ],
        edges: [
          { from: 'agent-defined-primary-experience', to: 'agent-defined-supporting-experience', relationship: 'agent-defined-from-task-priority' },
        ],
      },
      contentPriorityMap: {
        primary: ['primary-task'],
        secondary: ['supporting-proof'],
        deferred: ['tertiary-detail'],
      },
      viewportMutationPlan: {
        mobile: {
          primaryOperation: 'agent-defined-mobile-recomposition',
          requiredSurfaceActions: ['choose-mobile-specific-task-order', 'merge-disclose-or-remove-low-priority-content'],
          forbiddenPatterns: ['scale-only-responsive-layout'],
          rationale: 'Mobile must privilege the first decisive action instead of preserving desktop balance.',
        },
        tablet: {
          primaryOperation: 'regroup-and-condense',
          requiredSurfaceActions: ['preserve-dominant-surface', 'reduce-simultaneous-supporting-surfaces'],
          forbiddenPatterns: ['three-or-more-sibling-panels-with-shared-treatment'],
          rationale: 'Tablet should simplify simultaneous surfaces without becoming a shrunken desktop.',
        },
        desktop: {
          primaryOperation: 'expand-with-contrast',
          requiredSurfaceActions: ['maintain-dominant-surface-hierarchy', 'expose-supporting-context-with-contrast'],
          forbiddenPatterns: ['interchangeable-dashboard-chrome'],
          rationale: 'Desktop can show more context, but it should not revert to admin-shell defaults.',
        },
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
      genericityAutoFail: true,
      dimensions: [
        { key: 'distinctiveness', blockingByDefault: true, question: 'Does the UI feel authored?' },
        { key: 'contractFidelity', blockingByDefault: true, question: 'Does the UI follow the contract?' },
        { key: 'visualConsistency', blockingByDefault: false, question: 'Does the system stay coherent?' },
        { key: 'heuristicUxQuality', blockingByDefault: false, question: 'Does the flow stay clear and trustworthy?' },
        { key: 'motionDiscipline', blockingByDefault: false, question: 'Does motion stay purposeful and safe?' },
      ],
      genericitySignals: [
        'offline-prescribed-style-used-as-final-direction',
        'unresearched-library-or-framework-choice',
        'default-component-kit-treatment-without-product-rationale',
        'template-shell-without-product-rationale',
      ],
      validBoldSignals: [
        'context-derived-visual-direction',
        'official-docs-backed-library-choice',
        'purposeful-motion-as-identity',
        'responsive-recomposition-by-task-priority',
      ],
      reportingRules: {
        mustExplainGenericity: true,
        mustSeparateTasteFromFailure: true,
        contractFidelityOverridesPersonalTaste: true,
      },
    },
    forbiddenPatterns: [
      'offline-prescribed-style-used-as-final-direction',
      'unresearched-library-or-framework-choice',
      'default-component-kit-treatment-without-product-rationale',
      'template-shell-without-product-rationale',
      'scale-only-responsive-layout',
      'single-safe-typographic-family-without-role-contrast-or-rationale',
    ],
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

  await t.test('ui-design-judge keeps advisory mode but escalates generic auto-fail findings', () => {
    withTemporaryDesignIntent(sampleDesignIntent, () => {
      const output = execSync(`node ${uiDesignJudgePath}`, {
        env: {
          ...process.env,
          PR_DIFF: sampleUiDiff,
          UI_DESIGN_JUDGE_MOCK_RESPONSE: 'JSON_VERDICT: {"alignmentScore":82,"genericityAssessment":{"status":"generic","reason":"The redesign still uses template-shell-without-product-rationale and default-component-kit-treatment-without-product-rationale, so it ignores the agent-defined direction expected by the contract."},"tasteVsFailureSeparated":true,"rubricBreakdown":[{"dimension":"distinctiveness","score":52,"verdict":"weak","reason":"The visual direction falls back to scaffold defaults instead of a project-specific move.","blocking":true},{"dimension":"contractFidelity","score":61,"verdict":"weak","reason":"The mobile hierarchy drifted from the contract and kept scale-only responsive behavior.","blocking":true}],"notes":["Contract stays opinionated without becoming generic."],"findings":[{"area":"responsive","severity":"major","problem":"Mobile layout still mirrors desktop grouping and preserves scale-only responsive behavior.","evidence":"Cards remain three-up in the supplied diff and preserve the same surface treatment.","requiredAction":"Recompose the layout around current task priority and replace default-component-kit-treatment-without-product-rationale with a context-derived direction.","blockingRecommended":false}]}',
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
      assert.equal(report.summary.genericityStatus, 'generic');
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
      assert.equal(report.rubric.genericityAssessment.status, 'generic');
      assert.equal(report.rubric.tasteVsFailureSeparated, true);
      assert.equal(report.rubric.calibration.version, 'ui-rubric-calibration-v1');
      assert.equal(report.rubric.calibration.providerStatus, 'generic');
      assert.equal(report.rubric.calibration.calibratedStatus, 'generic');
      assert.equal(report.rubric.calibration.contractDriftDetected, true);
      assert.ok(report.rubric.calibration.matchedGenericitySignals.includes('template-shell-without-product-rationale'));
      assert.ok(report.rubric.calibration.matchedGenericitySignals.includes('default-component-kit-treatment-without-product-rationale'));
      assert.ok(report.rubric.calibration.matchedForbiddenPatterns.includes('template-shell-without-product-rationale'));
      assert.ok(report.notes.join(' ').includes('genericityAutoFail triggered'));
      assert.equal(report.rubric.breakdown[0].dimension, 'distinctiveness');
      assert.equal(report.findings[0].severity, 'high');
      assert.equal(report.findings[0].blockingRecommended, true);
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
      assert.equal(report.rubric.calibration.calibratedStatus, 'unclear');
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
