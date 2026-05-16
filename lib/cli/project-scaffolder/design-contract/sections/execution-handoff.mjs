/**
 * Design execution and handoff sections of the design intent contract:
 * execution policy gates, the structured handoff payload, the review rubric,
 * and the context-hygiene rules that govern continuity across sessions.
 */

import { GENERICITY_DRIFT_SIGNALS, VALID_BOLD_SIGNALS } from '../signal-vocab.mjs';

export function buildDesignExecutionPolicySection() {
  return {
    representationStrategy: 'surface-plan-v1',
    seedRefinementRequiredBeforeUiImplementation: true,
    requireSurfacePlan: true,
    requireComponentGraph: true,
    requireViewportMutationPlan: true,
    requireInteractionStateMatrix: true,
    requireContentPriorityMap: true,
    requireTaskFlowNarrative: true,
    requireSignatureMoveRationale: true,
    requireCreativeCommitmentGate: true,
    requireStructuredHandoff: true,
    requireRepoEvidenceAlignment: true,
    forbidScreenshotDependency: true,
    separateRequiredOutcomesFromCandidateMoves: true,
    forbidCandidateMovesAsLockedRequirements: true,
    forbidLibraryThemeAsVisualAuthority: true,
    forbidLiteralAnchorChromeWithoutProductFunction: true,
    handoffFormatVersion: 'ui-handoff-v1',
    requirePerSurfaceMutationOps: true,
    forbidUniformSiblingSurfaceTreatment: true,
    zeroBasedRedesignResetsPriorVisualsWhenRequested: true,
    semanticReviewFocus: [
      'distinctiveness-vs-genericity',
      'contract-fidelity',
      'hierarchy-and-task-priority',
      'component-state-behavior',
      'cross-viewport-mutation',
    ],
  };
}

export function buildDesignExecutionHandoffSection({ projectName, primaryDomain, mutationRules }) {
  return {
    version: 'ui-handoff-v1',
    location: 'inline-design-intent',
    status: 'seed-needs-refinement',
    seedMode: 'structure-first-scaffold',
    requiresTaskSpecificRefinement: true,
    primaryExperienceGoal: `Define the main ${String(primaryDomain || 'product').toLowerCase()} journey for ${projectName} from repo evidence, brief, and docs.`,
    surfacePlan: [
      {
        surfaceId: 'agent-defined-primary-experience',
        role: 'primary-context-synthesized-by-agent',
        goal: 'Choose the first task path from product evidence; reject template shells.',
        antiPatterns: ['dashboard-default', 'scale-only-responsive-layout'],
      },
    ],
    componentGraph: {
      nodes: [
        { id: 'primary-experience', role: 'agent-defined-primary', priority: 'high' },
        { id: 'supporting-context', role: 'agent-defined-support', priority: 'medium' },
      ],
      edges: [
        { from: 'primary-experience', to: 'supporting-context', relationship: 'task-priority-support' },
      ],
    },
    contentPriorityMap: {
      primary: ['agent-defined-core-task-or-reading-path'],
      secondary: ['agent-defined-supporting-context'],
      deferred: ['agent-defined-deferred-or-hidden-content'],
    },
    viewportMutationPlan: {
      mobile: {
        primaryOperation: 'agent-defined-mobile-recomposition',
        requiredSurfaceActions: [
          'choose-mobile-task-order',
          'disclose-or-remove-low-priority-content',
        ],
        forbiddenPatterns: ['scale-only-shrink'],
        rationale: mutationRules.mobile,
      },
      tablet: {
        primaryOperation: 'agent-defined-tablet-regrouping',
        requiredSurfaceActions: [
          'define-medium-width-grouping',
          'preserve-task-clarity',
        ],
        forbiddenPatterns: ['uniform-module-grid-without-role-change'],
        rationale: mutationRules.tablet,
      },
      desktop: {
        primaryOperation: 'agent-defined-desktop-composition',
        requiredSurfaceActions: [
          'use-space-to-improve-hierarchy',
          'avoid-equalizing-unrelated-content',
        ],
        forbiddenPatterns: ['interchangeable-dashboard-or-landing-chrome'],
        rationale: mutationRules.desktop,
      },
    },
    interactionStateMatrix: [
      {
        componentId: 'primary-interaction',
        states: ['default', 'hover', 'focus', 'loading', 'error'],
        notes: 'Refine states from project language and anchor; reject anonymous panels.',
      },
    ],
    expressionFlexibility: {
      lockedOutcomes: [
        'preserve-primary-user-goal',
        'preserve-accessibility-floor',
        'preserve-production-content-policy',
        'preserve-forbidden-patterns',
      ],
      candidateSignatureMoves: [
        'agent-defined-candidate-move-not-locked-until-refined',
      ],
      flexibleAxes: [
        'palette-primitives',
        'typeface-choice',
        'surface-treatment',
        'component-library-skin',
        'motion-implementation',
        'anchor-artifact-literalness',
      ],
      lockingRule: 'A candidate move becomes required only after repo evidence, product function, accessibility need, or explicit user approval makes it necessary.',
    },
    taskFlowNarrative: [
      `Entry: start ${projectName} from real evidence, not a generic opener.`,
      'Resolution: define proof, feedback, recovery, and next action.',
    ],
    visualResetStrategy: {
      activatesWhenUserRequests: [
        'redesign from zero',
        'redesain dari 0',
      ],
      existingUiAllowedAs: ['content-evidence', 'behavior-evidence', 'asset-source-evidence'],
      existingUiForbiddenAs: ['palette-source', 'layout-source', 'motion-source'],
      requiredResetAxes: ['composition', 'hierarchy', 'motion-or-interaction', 'responsive-information-architecture'],
    },
    signatureMoveRationale: 'Choose one project-specific visual, motion, type, or interaction move.',
    creativeCommitment: {
      status: 'agent-must-complete-before-ui-implementation',
      requiredFields: [
        'specificReferencePoint',
        'signatureMotion',
        'typographicDecision',
      ],
      failureMode: 'generic quality words without a real-world reference fail',
    },
    implementationGuardrails: {
      requireBuildFromHandoff: true,
      requireGapNotesBeforeFallback: true,
      forbidGenericLayoutFallbackWithoutReason: true,
      requireLockedVsFlexibleDecisionReview: true,
      forbidCandidateMoveHardcoding: true,
      forbidTestingDemoCopyInUi: true,
      forbidTerminalOnlyUserFlows: true,
    },
  };
}

export function buildReviewRubricSection() {
  return {
    version: 'ui-rubric-v1',
    genericityAutoFail: true,
    dimensions: [
      { key: 'distinctiveness', blockingByDefault: true, question: 'Is the UI authored and product-specific?' },
      { key: 'contractFidelity', blockingByDefault: true, question: 'Does the UI follow contract, priorities, and accessibility?' },
      { key: 'visualConsistency', blockingByDefault: false, question: 'Do type, spacing, color, and states form one system?' },
      { key: 'heuristicUxQuality', blockingByDefault: false, question: 'Does the UI preserve clarity, feedback, and confidence?' },
      { key: 'motionDiscipline', blockingByDefault: false, question: 'Is motion purposeful, performant, reduced-motion-safe, and on-tone?' },
    ],
    genericitySignals: [...GENERICITY_DRIFT_SIGNALS],
    validBoldSignals: [...VALID_BOLD_SIGNALS],
    reportingRules: {
      mustExplainGenericity: true,
      mustSeparateTasteFromFailure: true,
      contractFidelityOverridesPersonalTaste: true,
    },
  };
}

export function buildContextHygieneSection() {
  return {
    continuityMode: 'opt-in-only',
    allowedSources: [
      'current-repo-evidence',
      'current-user-brief',
      'current-project-docs',
      'explicitly-approved-current-task-constraints',
    ],
    taintedSources: [
      'prior-chat-visual-memory',
      'unrelated-project-aesthetics',
      'remembered-screenshots-without-current-approval',
      'generic-template-recall',
    ],
    repoEvidenceOverridesMemory: true,
    requireExplicitContinuityApproval: true,
    forbidCarryoverWhenUnapproved: true,
    approvedExternalConstraintUsage: 'Convert approved external constraints into current-project rules; do not imitate source surfaces.',
    externalWebsiteReferencePolicy: 'Use outside websites for mechanics, constraints, and quality bar analysis only. Do not copy layout rhythm, palette, component skin, visual metaphor, or brand posture.',
    driftSignals: [
      'palette-reused-without-brief-support',
      'prior-ui-visual-dna-carried-into-reset-request',
      'room-or-control-room-anchor-repeated-without-product-need',
      'external-reference-copied-instead-of-translated',
    ],
  };
}
