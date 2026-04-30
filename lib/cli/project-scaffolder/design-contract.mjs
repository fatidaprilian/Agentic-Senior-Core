import { toTitleCase } from '../utils.mjs';
import { DESIGN_REQUIRED_SECTIONS } from './constants.mjs';
import { validateDesignIntentContract } from './design-contract/validation.mjs';

const GENERICITY_DRIFT_SIGNALS = [
  'offline-prescribed-style-used-as-final-direction',
  'unresearched-library-or-framework-choice',
  'missing-conceptual-anchor-without-external-research',
  'visual-decisions-not-derived-from-conceptual-anchor',
  'ai-safe-ui-template-look',
  'ai-color-default-palette-without-product-role-behavior',
  'brandless-clean-template-look',
  'interchangeable-product-renaming-test-fails',
  'decorative-grid-or-glow-wallpaper-without-product-function',
  'safe-cream-slate-or-monochrome-palette-used-as-readability-excuse',
  'generic-abstract-logo-or-iconography',
  'timid-anchor-that-renames-dashboard-or-admin-shell',
  'motion-suppressed-without-accessibility-or-performance-reason',
  'motion-or-3d-omitted-from-fear-without-fit-analysis',
  'scale-only-responsive-layout',
  'zero-based-redesign-kept-prior-visual-dna',
  'restyle-instead-of-recomposition',
];

const FORBIDDEN_PATTERN_SIGNALS = [
  ...GENERICITY_DRIFT_SIGNALS.filter((signal) => signal !== 'unresearched-library-or-framework-choice'),
  'single-safe-typographic-family-without-role-contrast-or-rationale',
];

const VALID_BOLD_SIGNALS = [
  'single-cohesive-conceptual-anchor',
  'high-variance-candidate-selection',
  'context-derived-visual-direction',
  'three-at-a-glance-product-specific-signals',
  'visually-exploratory-accessible-palette-derived-from-product',
  'audacious-accessible-palette-with-product-role-behavior',
  'background-or-geometry-serves-product-function',
  'motion-or-spatial-experience-derived-from-anchor',
  'explicit-3d-canvas-fit-or-nonfit-decision',
  'responsive-recomposition-by-task-priority',
  'purposeful-motion-with-reduced-motion-path',
];

export function shouldBootstrapDesignDocument(discoveryAnswers, initContext) {
  const normalizedDomain = String(discoveryAnswers.primaryDomain || '').trim().toLowerCase();
  const normalizedBlueprint = String(initContext.blueprintFileName || '').trim().toLowerCase();

  const isUiDomain = normalizedDomain.includes('web')
    || normalizedDomain.includes('mobile')
    || normalizedDomain.includes('frontend')
    || normalizedDomain.includes('fullstack')
    || normalizedDomain.includes('ui');

  const isBackendOnlyDomain = normalizedDomain.includes('api service')
    || normalizedDomain.includes('cli tool')
    || normalizedDomain.includes('library');

  const blueprintLooksUi = normalizedBlueprint.includes('frontend')
    || normalizedBlueprint.includes('landing')
    || normalizedBlueprint.includes('ui');

  if (isUiDomain) {
    return true;
  }

  if (!isBackendOnlyDomain && blueprintLooksUi) {
    return true;
  }

  return false;
}

function buildStructureFirstSeedSignals({
  projectName,
  projectDescription,
  primaryDomain,
  supplementalFields = {},
}) {
  const normalizedDescription = String(projectDescription || '').trim();
  const repoEvidenceSummary = supplementalFields?.repoEvidence?.designEvidenceSummary || null;
  const hasRepoEvidence = Boolean(
    repoEvidenceSummary
    || (Array.isArray(supplementalFields?.repoEvidence?.workspaceUiEntries)
      && supplementalFields.repoEvidence.workspaceUiEntries.length > 0)
  );
  const evidenceSourceLabel = hasRepoEvidence
    ? 'current repo evidence, existing UI code, and the active brief'
    : 'the active brief and any repo evidence available at synthesis time';
  const projectContextLabel = normalizedDescription
    ? `the product context "${normalizedDescription}"`
    : 'the current product context';

  return {
    designPhilosophy: `Synthesize design for ${projectName || 'this project'} from ${evidenceSourceLabel}. Choose visual language, libraries, color, type, spacing, and interaction from ${projectContextLabel}; verify technology claims with official docs.`,
    typographyScaleRatio: 'agent-calibrated-from-content-platform-and-readability',
    baseGridUnit: 'agent-calibrated-from-platform-density-and-implementation-stack',
    spacingPattern: 'agent-defined-from-task-flow-and-viewport-needs',
    densityMode: 'agent-defined-from-user-task-device-and-content-pressure',
    colorIntent: `Choose semantic palette roles from ${projectContextLabel}, repo evidence, and accessibility. Reject scaffold or SaaS palette defaults.`,
    paletteRoles: ['agent-defined-semantic-roles'],
    distinctiveMoves: [
      'Choose one product-specific move from task, audience, content, repo evidence, and docs.',
    ],
    motionPurpose: 'Use expressive motion when it improves hierarchy, continuity, feedback, memorability, or confidence. Verify new motion libraries with official docs.',
    componentMorphology: {
      mobile: 'Recompose for touch, task priority, and constrained attention.',
      tablet: 'Regroup surfaces for medium width without cloning desktop or mobile.',
      desktop: 'Use space for hierarchy and scanability; avoid template grids.',
    },
    mutationRules: {
      mobile: 'Reorder, merge, or disclose content for mobile. Reject scale-only shrink.',
      tablet: 'Regroup for tablet instead of width-only desktop reduction.',
      desktop: 'Use space intentionally; avoid equal-weight modules without evidence.',
    },
  };
}

function buildDesignIntentContractObject({
  projectName,
  projectDescription,
  primaryDomain,
  features = [],
  initContext,
  status = 'seed-needs-design-synthesis',
  supplementalFields = {},
}) {
  const inferredKeywords = buildStructureFirstSeedSignals({
    projectName,
    projectDescription,
    primaryDomain,
    features,
    supplementalFields,
  });

  return {
    mode: 'dynamic',
    status,
    seedPolicy: {
      mode: 'structure-first-scaffold',
      requiresProjectSpecificRefinement: true,
      forbidLiteralCarryoverAsFinalArtDirection: true,
      repoEvidenceShouldOverrideSeedTaste: true,
    },
    project: {
      name: projectName,
      context: projectDescription,
      domain: primaryDomain,
      runtimeConstraint: initContext.stackFileName === 'agent-decision-runtime.md'
        ? 'agent-recommendation-required'
        : toTitleCase(initContext.stackFileName),
      architectureConstraint: initContext.blueprintFileName === 'agent-decision-architecture.md'
        ? 'agent-recommendation-required'
        : toTitleCase(initContext.blueprintFileName),
    },
    designPhilosophy: inferredKeywords.designPhilosophy,
    visualDirection: {
      seedMode: 'scaffold-only',
      requiresProjectSpecificSynthesis: true,
      selectionAuthority: 'agent-llm-after-current-context-repo-evidence-and-live-official-docs',
      trendStance: 'current-context-first-not-offline-preset-first',
      distinctiveMoves: inferredKeywords.distinctiveMoves,
      copiedReferenceAllowed: false,
    },
    externalResearchIntake: {
      userSuppliedResearchPolicy: 'read-as-candidate-evidence-not-final-prescription',
      requireSummaryOfUsedSignals: true,
      requireFitFiltering: true,
      requireOfficialDocsVerificationForTechnologyClaims: true,
      candidateDomains: [
        'visual-direction',
        'motion-and-scroll',
        'ui-primitives-or-rich-media',
        'typography-and-interaction',
      ],
      finalDecisionAuthority: 'project-fit-accessibility-performance-maintainability-official-docs',
    },
    conceptualAnchor: {
      mode: 'required-when-no-external-research',
      seedMode: 'selection-policy-only',
      anchorReference: 'agent-defined-anchor-reference',
      requiresAgentSelectionBeforeUiImplementation: true,
      userResearchAbsencePolicy: {
        userSuppliedResearchOnly: true,
        scaffoldSeedDoesNotCountAsResearch: true,
        priorUiDoesNotCountAsResearch: true,
        requireAgentLedResearchWhenAvailable: true,
      },
      candidateSelectionPolicy: {
        considerAtLeast: 3,
        discardObviousCandidateCount: 2,
        minimumCandidateDistance: 'high',
        discardPredictableCandidates: true,
        preferDistinctiveOverSafe: true,
        doNotRevealHiddenCandidateList: true,
        outputOnlyChosenAnchor: true,
      },
      creativeCommitmentPolicy: {
        requiredBeforeComplianceReview: true,
        recordInDesignDocs: true,
        requiredCommitmentFields: [
          'specificReferencePoint',
          'signatureMotion',
          'typographicDecision',
        ],
        rejectGenericQualityWordsOnly: true,
        specificityFloor: 'name-real-material-instrument-artifact-architecture-editorial-genre-cinematic-behavior-exhibition-system-scientific-apparatus-or-industrial-mechanism',
      },
      forbiddenFinalAnchorTerms: [
        'dashboard',
        'cards',
        'admin-panel',
        'saas-shell',
        'minimalist-interface',
        'safe-admin-layout',
      ],
      sourceDomains: [
        'complex-physical-engineering',
        'cinematic-spatial-interface',
        'experimental-editorial-structure',
        'scientific-instrumentation',
        'premium-interactive-web-experiences',
      ],
      visualRiskBudget: {
        mode: 'high-distinctiveness-with-accessibility-and-performance-guardrails',
        allowRichMotionAndMicroInteraction: true,
        rejectTimidDefaultWhenAnchorSupportsExpressiveUi: true,
        requireReducedMotionFallback: true,
      },
      requiredDerivedAxes: [
        'typography',
        'morphology',
        'motion',
        'responsive-composition',
      ],
      finalAnchorContract: {
        requiredFields: [
          'name',
          'anchorReference',
          'agentResearchMode',
          'sourceDomain',
          'specificReferencePoint',
          'rationale',
          'signatureMotion',
          'typographicDecision',
          'derivedTokenLogic',
          'visualRiskBudget',
          'motionRiskBudget',
          'cohesionChecks',
        ],
        derivedTokenLogicAxes: [
          'morphology',
          'motion',
        ],
        cohesionChecks: [
          'no-dashboard-mental-model',
          'motion-derived-from-anchor',
        ],
      },
    },
    derivedTokenLogic: {
      anchorReference: 'agent-defined-anchor-reference',
      colorDerivationSource: 'Explain semantic color roles from anchorReference; reject generic palettes without anchor evidence.',
      spacingDerivationSource: 'Explain grid, rhythm, density, and exceptions from anchorReference.',
      typographyDerivationSource: 'Explain display, body, metadata, and data roles from anchorReference.',
      motionDerivationSource: 'Explain duration, easing, choreography, and reduced-motion from anchorReference.',
      validationRule: 'Every token must trace to anchorReference; revise tokens that cannot.',
    },
    motionPaletteDecision: {
      productCategorySignal: 'agent-inferred-starting-heuristic',
      densityDecisionSource: 'Choose motion density from task, content, brand, device, performance, and accessibility. Categories are heuristics.',
      requiredInteractionStates: ['default', 'hover', 'focus-visible', 'active', 'disabled', 'loading', 'empty', 'error', 'success', 'transition'],
      paletteAutopilotRisks: ['dark-slate-default', 'cream-beige-default', 'purple-blue-gradient-default', 'monochrome-template-default', 'uniform-card-surface-default', 'generic-grid-wallpaper-default', 'soft-glow-ai-template-default', 'cyber-neon-terminal-default'],
      spatialDecision: 'State 3D/canvas/WebGL fit. If omitted, name product-fit reason and replacement interaction quality.',
    },
    aiSafeUiAudit: {
      status: 'agent-must-complete-before-ui-implementation',
      failureDefinition: 'AI-safe UI uses template cards, generic marks, decorative grid wallpaper, safe palettes, glow backgrounds, or copied scaffold composition.',
      interchangeabilityTest: `If this UI can be renamed from ${projectName} to another product category without changing composition, palette, iconography, and motion, revise it.`,
      requiredProductSpecificSignals: [
        'agent-defined-product-specific-data-treatment',
        'agent-defined-product-specific-motion-or-state-behavior',
        'agent-defined-product-specific-morphology-iconography-or-spatial-structure',
      ],
      paletteExplorationRule: 'Use a visually exploratory product-derived palette with WCAG contrast and status clarity.',
      backgroundPatternRule: 'Lines, grids, scanlines, noise, glows, blobs, logos, and geometry must serve a named product function.',
      aiColorAudit: {
        status: 'agent-must-complete-before-ui-implementation',
        failureDefinition: 'AI color drift uses safe defaults before deriving roles from the product anchor.',
        autopilotRisks: ['cream-editorial-default', 'dark-slate-dashboard-default', 'purple-blue-gradient-default', 'monochrome-minimal-default', 'cyber-neon-terminal-default', 'soft-glow-atmosphere-default'],
        requiredEvidence: [
          'anchor-derived-color-logic',
          'semantic-role-contrast-beyond-surface-decoration',
          'product-specific-color-behavior-that-would-not-transfer',
        ],
        reviewQuestion: 'Why does this palette belong to this product?',
      },
      motionSpatialCourageAudit: {
        status: 'agent-must-complete-before-ui-implementation',
        defaultStance: 'Treat motion, scroll choreography, canvas, WebGL, and 3D as first-class options.',
        requiredDecisionFields: [
          'signature-motion-or-interaction',
          'spatial-or-3d-fit',
          'performance-and-reduced-motion-fallback',
        ],
        rejectionRule: 'State a product reason and replacement interaction quality before omitting 3D/canvas.',
        reviewQuestion: 'Is the interaction as expressive as the product can responsibly support?',
      },
      reviewQuestion: 'What visible evidence proves this is product-specific?',
      blockingByDefault: true,
    },
    libraryResearchStatus: 'pending-verification',
    libraryDecisions: [
      {
        library: 'agent-defined-or-none',
        purpose: 'Verify UI-related libraries against current official docs before imports.',
        verifiedAt: null,
        sourceUrl: null,
        stableVersion: null,
        fallbackIfUnavailable: 'Use native CSS, browser APIs, or existing dependencies.',
      },
    ],
    mathSystems: {
      typographyScaleRatio: inferredKeywords.typographyScaleRatio,
      baseGridUnit: inferredKeywords.baseGridUnit,
      spacingPattern: inferredKeywords.spacingPattern,
      densityMode: inferredKeywords.densityMode,
      seedValuesRequireCalibration: true,
    },
    tokenSystem: {
      sourceOfTruth: 'docs/design-intent.json',
      taxonomyOrder: ['primitive', 'semantic', 'component'],
      primitiveColorSpace: 'OKLCH',
      requireSemanticAliases: true,
      semanticAliasesMutableWithoutComponentRewrite: true,
      componentTokensConsumeSemantic: true,
      forbidDirectComponentPrimitiveBypass: true,
      aliasReferenceStyle: 'brace-reference',
      fallbackPolicy: {
        forbidRawHexOutsidePrimitives: true,
        forbidRawSpacingOutsidePrimitives: true,
        requireDocumentedExceptionForLegacyBypass: true,
      },
      namingConstraints: {
        forbidCurlyBracesInNames: true,
        forbidDotsInNames: true,
        forbidSquareBracketsInNames: true,
      },
    },
    colorTruth: {
      format: 'OKLCH',
      allowHexDerivatives: true,
      requirePerceptualLightnessCurve: true,
      paletteRoles: inferredKeywords.paletteRoles,
      rolePolicy: 'minimum-semantic-scaffold',
      rolesAreMinimumScaffold: true,
      rolesMustBeAgentDefined: true,
      forbidAutopilotPalettesWithoutEvidence: true,
      intent: inferredKeywords.colorIntent,
    },
    crossViewportAdaptation: {
      adaptByRecomposition: true,
      touchTargetMinPx: 44,
      mutationRules: inferredKeywords.mutationRules,
    },
    motionSystem: {
      allowMeaningfulMotion: true,
      purpose: inferredKeywords.motionPurpose,
      seedToneLocked: false,
      densitySource: 'task-content-brand-device-accessibility',
      respectReducedMotion: true,
    },
    componentMorphology: {
      requireStateBehaviorMatrix: true,
      preserveIdentityAcrossViewports: true,
      seedBehaviorsRequireRefinement: true,
      stateKeys: ['default', 'hover', 'focus-visible', 'active', 'disabled', 'loading', 'empty', 'error', 'success', 'transition'],
      viewportBehavior: inferredKeywords.componentMorphology,
    },
    accessibilityPolicy: {
      hardComplianceFloor: 'WCAG-2.2-AA',
      advisoryContrastModel: 'APCA',
      failOnHardViolations: true,
      advisoryFindingsDoNotBlockByDefault: true,
      hardRequirements: {
        textContrastMinimum: true,
        nonTextContrast: true,
        useOfColorOnlyProhibited: true,
        focusVisible: true,
        focusAppearance: true,
        targetSizeMinimum: true,
        keyboardAccess: true,
        reflowRequired: true,
        accessibleAuthenticationMinimum: true,
        statusMessagesAndDynamicStateAccess: true,
      },
      advisoryChecks: {
        perceptualContrastReview: true,
        darkModeContrastTuning: true,
        typographyReadabilityTuning: true,
      },
    },
    designExecutionPolicy: {
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
    },
    designExecutionHandoff: {
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
          {
            id: 'primary-experience',
            role: 'agent-defined-primary',
            priority: 'high',
          },
          {
            id: 'supporting-context',
            role: 'agent-defined-support',
            priority: 'medium',
          },
        ],
        edges: [
          {
            from: 'primary-experience',
            to: 'supporting-context',
            relationship: 'task-priority-support',
          },
        ],
      },
      contentPriorityMap: {
        primary: [
          'agent-defined-core-task-or-reading-path',
        ],
        secondary: [
          'agent-defined-supporting-context',
        ],
        deferred: [
          'agent-defined-deferred-or-hidden-content',
        ],
      },
      viewportMutationPlan: {
        mobile: {
          primaryOperation: 'agent-defined-mobile-recomposition',
          requiredSurfaceActions: [
            'choose-mobile-task-order',
            'disclose-or-remove-low-priority-content',
          ],
          forbiddenPatterns: [
            'scale-only-shrink',
          ],
          rationale: inferredKeywords.mutationRules.mobile,
        },
        tablet: {
          primaryOperation: 'agent-defined-tablet-regrouping',
          requiredSurfaceActions: [
            'define-medium-width-grouping',
            'preserve-task-clarity',
          ],
          forbiddenPatterns: [
            'uniform-module-grid-without-role-change',
          ],
          rationale: inferredKeywords.mutationRules.tablet,
        },
        desktop: {
          primaryOperation: 'agent-defined-desktop-composition',
          requiredSurfaceActions: [
            'use-space-to-improve-hierarchy',
            'avoid-equalizing-unrelated-content',
          ],
          forbiddenPatterns: [
            'interchangeable-dashboard-or-landing-chrome',
          ],
          rationale: inferredKeywords.mutationRules.desktop,
        },
      },
      interactionStateMatrix: [
        {
          componentId: 'primary-interaction',
          states: ['default', 'hover', 'focus', 'loading', 'error'],
          notes: 'Refine states from project language and anchor; reject anonymous panels.',
        },
      ],
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
      },
    },
    reviewRubric: {
      version: 'ui-rubric-v1',
      genericityAutoFail: true,
      dimensions: [
        {
          key: 'distinctiveness',
          blockingByDefault: true,
          question: 'Is the UI authored and product-specific?',
        },
        {
          key: 'contractFidelity',
          blockingByDefault: true,
          question: 'Does the UI follow contract, priorities, and accessibility?',
        },
        {
          key: 'visualConsistency',
          blockingByDefault: false,
          question: 'Do type, spacing, color, and states form one system?',
        },
        {
          key: 'heuristicUxQuality',
          blockingByDefault: false,
          question: 'Does the UI preserve clarity, feedback, and confidence?',
        },
        {
          key: 'motionDiscipline',
          blockingByDefault: false,
          question: 'Is motion purposeful, performant, reduced-motion-safe, and on-tone?',
        },
      ],
      genericitySignals: [...GENERICITY_DRIFT_SIGNALS],
      validBoldSignals: [...VALID_BOLD_SIGNALS],
      reportingRules: {
        mustExplainGenericity: true,
        mustSeparateTasteFromFailure: true,
        contractFidelityOverridesPersonalTaste: true,
      },
    },
    contextHygiene: {
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
      driftSignals: [
        'palette-reused-without-brief-support',
        'prior-ui-visual-dna-carried-into-reset-request',
      ],
    },
    forbiddenPatterns: [...FORBIDDEN_PATTERN_SIGNALS],
    validationHints: [
      'rejectArbitraryHexOnlyPalette',
      'requireViewportMutationRules',
      'requirePerceptualColorRationale',
      'requireTokenLayering',
      'requireTokenAliasingPlan',
      'allowHexDerivatives',
      'requireMotionRationale',
      'requireStateMorphology',
      'requireAccessibilitySplit',
      'requireWcagHardFloor',
      'requireStructuredDesignExecutionPolicy',
      'requireStructuredDesignHandoff',
      'requireVisualResetStrategyWhenZeroBasedRedesignRequested',
      'requireConceptualAnchorWhenNoExternalResearch',
      'requireAgentLedAnchorResearchWhenUserResearchMissing',
      'rejectTimidDashboardAnchor',
      'requireReviewRubric',
      'requireGenericityExplanation',
      'genericityAutoFail',
      'requireSignatureMove',
      'rejectTemplateNeutralLayout',
      'requireAiSafeUiAudit',
      'requireAiColorAudit',
      'rejectAiColorDefaults',
      'requireMotionSpatialCourageAudit',
      'requireExplicit3dCanvasFitDecision',
      'rejectSafetyAsCreativitySubstitute',
      'rejectAiSafeUiTemplateLook',
      'requireThreeProductSpecificSignals',
      'rejectDecorativeBackgroundPatternsWithoutProductFunction',
    ],
    requiredDesignSections: DESIGN_REQUIRED_SECTIONS,
    implementation: {
      requiredDeliverables: ['docs/DESIGN.md', 'docs/design-intent.json'],
      requireDesignRationale: true,
      requireDistinctVisualDirection: true,
      requireMachineReadableContract: true,
      requireViewportMutationRules: true,
      requirePurposefulMotionGuidelines: true,
      requireRecognizableVisualBet: true,
      requireConceptualAnchor: true,
      bootstrapPrompt: '.agent-context/prompts/bootstrap-design.md',
      autoLoadedRuleFiles: [
        '.agent-context/prompts/bootstrap-design.md',
        '.agent-context/rules/frontend-architecture.md',
      ],
      disallowedAutoLoadedRuleFiles: [
        '.agent-context/rules/database-design.md',
        '.agent-context/rules/docker-runtime.md',
        '.agent-context/rules/microservices.md',
      ],
    },
    ...supplementalFields,
  };
}

export { validateDesignContractCompleteness, validateDesignIntentContract } from './design-contract/validation.mjs';

export function buildDesignIntentSeedFromSignals({
  projectName,
  projectDescription,
  primaryDomain,
  features = [],
  initContext,
  status = 'seed-needs-design-synthesis',
  supplementalFields = {},
}) {
  const designIntentContract = buildDesignIntentContractObject({
    projectName,
    projectDescription,
    primaryDomain,
    features,
    initContext,
    status,
    supplementalFields,
  });
  const validationErrors = validateDesignIntentContract(designIntentContract);

  if (validationErrors.length > 0) {
    throw new Error(`Invalid design intent contract seed: ${validationErrors.join(' ')}`);
  }

  return `${JSON.stringify(designIntentContract, null, 2)}\n`;
}

export function buildDesignIntentSeed({
  discoveryAnswers,
  initContext,
}) {
  return buildDesignIntentSeedFromSignals({
    projectName: discoveryAnswers.projectName,
    projectDescription: discoveryAnswers.projectDescription,
    primaryDomain: discoveryAnswers.primaryDomain,
    features: discoveryAnswers.features,
    initContext,
    status: 'seed-needs-design-synthesis',
  });
}
