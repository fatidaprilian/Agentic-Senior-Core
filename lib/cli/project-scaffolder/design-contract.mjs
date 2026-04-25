import { toTitleCase } from '../utils.mjs';
import { DESIGN_REQUIRED_SECTIONS } from './constants.mjs';

export function shouldBootstrapDesignDocument(discoveryAnswers, initContext) {
  const normalizedDomain = String(discoveryAnswers.primaryDomain || '').trim().toLowerCase();
  const normalizedBlueprint = String(initContext.blueprintFileName || '').trim().toLowerCase();

  const isUiDomain = normalizedDomain.includes('web')
    || normalizedDomain.includes('mobile')
    || normalizedDomain.includes('frontend')
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
    designPhilosophy: `Use ${evidenceSourceLabel} to synthesize the design system for ${projectName || 'this project'}. This seed is only a decision scaffold: the LLM must choose the visual language, libraries, color system, typography, spacing, and interaction model from ${projectContextLabel}, current repo evidence, and live official documentation when a technology claim is needed.`,
    typographyScaleRatio: 'agent-calibrated-from-content-platform-and-readability',
    baseGridUnit: 'agent-calibrated-from-platform-density-and-implementation-stack',
    spacingPattern: 'agent-defined-from-task-flow-and-viewport-needs',
    densityMode: 'agent-defined-from-user-task-device-and-content-pressure',
    colorIntent: `Choose semantic palette roles from ${projectContextLabel}, current repo evidence, and accessibility needs. Do not inherit fixed palettes or generic SaaS color defaults from this scaffold.`,
    paletteRoles: ['agent-defined-semantic-roles'],
    distinctiveMoves: [
      'Choose one recognizable design move from product task, audience, content, repo evidence, and current docs; do not inherit a scaffold preset.',
    ],
    motionPurpose: 'Default to a modern motion plan for UI work: use expressive transitions, spatial choreography, micro-interactions, and motion libraries when they strengthen hierarchy, continuity, feedback, memorability, or perceived product quality. If implementation needs a motion library, the LLM must choose a current compatible option from official docs instead of relying on an offline default.',
    componentMorphology: {
      mobile: 'Recompose the experience for touch, task priority, and constrained attention. Mobile should be a deliberate mobile design, not a shrunken desktop.',
      tablet: 'Regroup surfaces for medium-width use, preserving task clarity without cloning either desktop or mobile blindly.',
      desktop: 'Use the available space to improve hierarchy, scanability, and interaction quality without defaulting to template grids or generic dashboard chrome.',
    },
    mutationRules: {
      mobile: 'Define a mobile-specific composition with reordered, merged, or disclosed content where appropriate. Scale-only shrink behavior is failure.',
      tablet: 'Define a tablet-specific regrouping strategy rather than a width-only reduction of desktop.',
      desktop: 'Define a desktop composition that uses space intentionally and avoids generic equal-weight modules unless the project evidence justifies them.',
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
      finalDecisionAuthority: 'agent-llm-from-project-fit-accessibility-performance-maintainability-and-current-official-docs',
    },
    conceptualAnchor: {
      mode: 'required-when-no-external-research',
      seedMode: 'selection-policy-only',
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
          'agentResearchMode',
          'sourceDomain',
          'rationale',
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
      respectReducedMotion: true,
    },
    componentMorphology: {
      requireStateBehaviorMatrix: true,
      preserveIdentityAcrossViewports: true,
      seedBehaviorsRequireRefinement: true,
      stateKeys: ['default', 'focus', 'loading', 'error'],
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
      primaryExperienceGoal: `Define the main ${String(primaryDomain || 'product').toLowerCase()} journey for ${projectName} from repo evidence, the brief, and current docs. The seed must not prescribe final layout.`,
      surfacePlan: [
        {
          surfaceId: 'agent-defined-primary-experience',
          role: 'primary-context-synthesized-by-agent',
          goal: 'Choose the first task or reading path from product evidence and reject template shells.',
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
          notes: 'Refine states from project language and the conceptual anchor; do not use anonymous default panels.',
        },
      ],
      taskFlowNarrative: [
        `Entry: define how ${projectName} starts the journey from real evidence, not a generic opener.`,
        'Resolution: define proof, feedback, recovery, and next action without leftover template chrome.',
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
      signatureMoveRationale: 'Agent must choose one project-specific visual, motion, typographic, or interaction move and explain why generic fallback weakens it.',
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
          question: 'Does the UI feel authored and project-specific rather than like a default framework or template kit?',
        },
        {
          key: 'contractFidelity',
          blockingByDefault: true,
          question: 'Does the changed UI still follow the explicit design contract, interaction priorities, and accessibility boundaries?',
        },
        {
          key: 'visualConsistency',
          blockingByDefault: false,
          question: 'Do typography, spacing, color usage, and component behaviors still feel like one system?',
        },
        {
          key: 'heuristicUxQuality',
          blockingByDefault: false,
          question: 'Does the UI preserve task clarity, feedback quality, and user confidence in the touched flows?',
        },
        {
          key: 'motionDiscipline',
          blockingByDefault: false,
          question: 'Does motion act as part of the design language while staying purposeful, performant, reduced-motion-safe, and consistent with the product tone?',
        },
      ],
      genericitySignals: [
        'offline-prescribed-style-used-as-final-direction',
        'unresearched-library-or-framework-choice',
        'missing-conceptual-anchor-without-external-research',
        'visual-decisions-not-derived-from-conceptual-anchor',
        'timid-anchor-that-renames-dashboard-or-admin-shell',
        'motion-suppressed-without-accessibility-or-performance-reason',
        'scale-only-responsive-layout',
        'zero-based-redesign-kept-prior-visual-dna',
        'restyle-instead-of-recomposition',
      ],
      validBoldSignals: [
        'single-cohesive-conceptual-anchor',
        'high-variance-candidate-selection',
        'context-derived-visual-direction',
        'responsive-recomposition-by-task-priority',
        'purposeful-motion-with-reduced-motion-path',
      ],
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
      approvedExternalConstraintUsage: 'Convert explicit user-supplied external constraints into current-project rules without comparing against or imitating the source surface.',
      driftSignals: [
        'palette-reused-without-brief-support',
        'prior-ui-visual-dna-carried-into-reset-request',
      ],
    },
    experiencePrinciples: [
      'Design must feel project-specific, not interchangeable with generic SaaS templates.',
      'Major interface decisions must be explainable in product and user terms.',
      'Accessibility, responsiveness, and implementation realism are non-negotiable.',
      'Cross-viewport behavior must reorganize tasks and navigation, not just scale the desktop layout down.',
      'A single agent-chosen conceptual anchor must unify typography, spacing, morphology, motion, and responsive composition when user research is absent.',
      'Expressive motion and spatial interaction are expected for modern UI work when they support the anchor; keep them accessible and performant instead of suppressing them by default.',
      'When the user asks for a zero-based redesign, existing UI becomes content and behavior evidence only; prior visual DNA must be discarded unless explicitly approved.',
    ],
    forbiddenPatterns: [
      'offline-prescribed-style-used-as-final-direction',
      'missing-conceptual-anchor-without-external-research',
      'visual-decisions-not-derived-from-conceptual-anchor',
      'timid-anchor-that-renames-dashboard-or-admin-shell',
      'motion-suppressed-without-accessibility-or-performance-reason',
      'scale-only-responsive-layout',
      'zero-based-redesign-kept-prior-visual-dna',
      'restyle-instead-of-recomposition',
      'single-safe-typographic-family-without-role-contrast-or-rationale',
    ],
    validationHints: {
      rejectArbitraryHexOnlyPalette: true,
      requireViewportMutationRules: true,
      requirePerceptualColorRationale: true,
      requireTokenLayering: true,
      requireTokenAliasingPlan: true,
      allowHexDerivatives: true,
      requireMotionRationale: true,
      requireStateMorphology: true,
      requireAccessibilitySplit: true,
      requireWcagHardFloor: true,
      requireStructuredDesignExecutionPolicy: true,
      requireStructuredDesignHandoff: true,
      requireVisualResetStrategyWhenZeroBasedRedesignRequested: true,
      requireConceptualAnchorWhenNoExternalResearch: true,
      requireAgentLedAnchorResearchWhenUserResearchMissing: true,
      rejectTimidDashboardAnchor: true,
      requireReviewRubric: true,
      requireGenericityExplanation: true,
      genericityAutoFail: true,
      requireSignatureMove: true,
      rejectTemplateNeutralLayout: true,
    },
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

export function validateDesignIntentContract(designIntentContract) {
  const validationErrors = [];

  if (!designIntentContract || typeof designIntentContract !== 'object') {
    return ['Design intent contract must be an object.'];
  }

  if (designIntentContract.mode !== 'dynamic') {
    validationErrors.push('designIntent.mode must equal "dynamic".');
  }

  if (!designIntentContract.project || typeof designIntentContract.project !== 'object') {
    validationErrors.push('designIntent.project must exist.');
  }

  if (!designIntentContract.designPhilosophy || typeof designIntentContract.designPhilosophy !== 'string') {
    validationErrors.push('designIntent.designPhilosophy must be a non-empty string.');
  }

  if (!designIntentContract.externalResearchIntake || typeof designIntentContract.externalResearchIntake !== 'object') {
    validationErrors.push('designIntent.externalResearchIntake must exist.');
  } else {
    if (designIntentContract.externalResearchIntake.userSuppliedResearchPolicy !== 'read-as-candidate-evidence-not-final-prescription') {
      validationErrors.push('designIntent.externalResearchIntake.userSuppliedResearchPolicy must preserve user research as candidate evidence.');
    }
    if (designIntentContract.externalResearchIntake.requireOfficialDocsVerificationForTechnologyClaims !== true) {
      validationErrors.push('designIntent.externalResearchIntake.requireOfficialDocsVerificationForTechnologyClaims must equal true.');
    }
    if (
      !Array.isArray(designIntentContract.externalResearchIntake.candidateDomains)
      || !designIntentContract.externalResearchIntake.candidateDomains.includes('motion-and-scroll')
    ) {
      validationErrors.push('designIntent.externalResearchIntake.candidateDomains must include motion-and-scroll.');
    }
  }

  if (!designIntentContract.conceptualAnchor || typeof designIntentContract.conceptualAnchor !== 'object') {
    validationErrors.push('designIntent.conceptualAnchor must exist.');
  } else {
    const conceptualAnchor = designIntentContract.conceptualAnchor;
    if (conceptualAnchor.mode !== 'required-when-no-external-research') {
      validationErrors.push('designIntent.conceptualAnchor.mode must equal "required-when-no-external-research".');
    }
    if (conceptualAnchor.seedMode !== 'selection-policy-only') {
      validationErrors.push('designIntent.conceptualAnchor.seedMode must equal "selection-policy-only".');
    }
    if (conceptualAnchor.requiresAgentSelectionBeforeUiImplementation !== true) {
      validationErrors.push('designIntent.conceptualAnchor.requiresAgentSelectionBeforeUiImplementation must equal true.');
    }
    const userResearchAbsencePolicy = conceptualAnchor.userResearchAbsencePolicy;
    if (!userResearchAbsencePolicy || typeof userResearchAbsencePolicy !== 'object') {
      validationErrors.push('designIntent.conceptualAnchor.userResearchAbsencePolicy must exist.');
    } else {
      if (userResearchAbsencePolicy.userSuppliedResearchOnly !== true) {
        validationErrors.push('designIntent.conceptualAnchor.userResearchAbsencePolicy.userSuppliedResearchOnly must equal true.');
      }
      if (userResearchAbsencePolicy.scaffoldSeedDoesNotCountAsResearch !== true) {
        validationErrors.push('designIntent.conceptualAnchor.userResearchAbsencePolicy.scaffoldSeedDoesNotCountAsResearch must equal true.');
      }
      if (userResearchAbsencePolicy.priorUiDoesNotCountAsResearch !== true) {
        validationErrors.push('designIntent.conceptualAnchor.userResearchAbsencePolicy.priorUiDoesNotCountAsResearch must equal true.');
      }
      if (userResearchAbsencePolicy.requireAgentLedResearchWhenAvailable !== true) {
        validationErrors.push('designIntent.conceptualAnchor.userResearchAbsencePolicy.requireAgentLedResearchWhenAvailable must equal true.');
      }
    }
    const candidateSelectionPolicy = conceptualAnchor.candidateSelectionPolicy;
    if (!candidateSelectionPolicy || typeof candidateSelectionPolicy !== 'object') {
      validationErrors.push('designIntent.conceptualAnchor.candidateSelectionPolicy must exist.');
    } else {
      if (candidateSelectionPolicy.considerAtLeast < 3) {
        validationErrors.push('designIntent.conceptualAnchor.candidateSelectionPolicy.considerAtLeast must be at least 3.');
      }
      if (candidateSelectionPolicy.discardObviousCandidateCount < 2) {
        validationErrors.push('designIntent.conceptualAnchor.candidateSelectionPolicy.discardObviousCandidateCount must be at least 2.');
      }
      if (candidateSelectionPolicy.minimumCandidateDistance !== 'high') {
        validationErrors.push('designIntent.conceptualAnchor.candidateSelectionPolicy.minimumCandidateDistance must equal "high".');
      }
      if (candidateSelectionPolicy.discardPredictableCandidates !== true) {
        validationErrors.push('designIntent.conceptualAnchor.candidateSelectionPolicy.discardPredictableCandidates must equal true.');
      }
      if (candidateSelectionPolicy.preferDistinctiveOverSafe !== true) {
        validationErrors.push('designIntent.conceptualAnchor.candidateSelectionPolicy.preferDistinctiveOverSafe must equal true.');
      }
      if (candidateSelectionPolicy.doNotRevealHiddenCandidateList !== true) {
        validationErrors.push('designIntent.conceptualAnchor.candidateSelectionPolicy.doNotRevealHiddenCandidateList must equal true.');
      }
      if (candidateSelectionPolicy.outputOnlyChosenAnchor !== true) {
        validationErrors.push('designIntent.conceptualAnchor.candidateSelectionPolicy.outputOnlyChosenAnchor must equal true.');
      }
    }
    if (
      !Array.isArray(conceptualAnchor.forbiddenFinalAnchorTerms)
      || !conceptualAnchor.forbiddenFinalAnchorTerms.includes('dashboard')
      || !conceptualAnchor.forbiddenFinalAnchorTerms.includes('cards')
      || !conceptualAnchor.forbiddenFinalAnchorTerms.includes('safe-admin-layout')
    ) {
      validationErrors.push('designIntent.conceptualAnchor.forbiddenFinalAnchorTerms must reject basic UI labels.');
    }
    if (
      !Array.isArray(conceptualAnchor.sourceDomains)
      || conceptualAnchor.sourceDomains.length < 4
      || !conceptualAnchor.sourceDomains.includes('complex-physical-engineering')
      || !conceptualAnchor.sourceDomains.includes('cinematic-spatial-interface')
      || !conceptualAnchor.sourceDomains.includes('premium-interactive-web-experiences')
    ) {
      validationErrors.push('designIntent.conceptualAnchor.sourceDomains must list broad non-template anchor domains.');
    }
    const visualRiskBudget = conceptualAnchor.visualRiskBudget;
    if (!visualRiskBudget || typeof visualRiskBudget !== 'object') {
      validationErrors.push('designIntent.conceptualAnchor.visualRiskBudget must exist.');
    } else {
      if (visualRiskBudget.mode !== 'high-distinctiveness-with-accessibility-and-performance-guardrails') {
        validationErrors.push('designIntent.conceptualAnchor.visualRiskBudget.mode must preserve high-distinctiveness guardrails.');
      }
      if (visualRiskBudget.allowRichMotionAndMicroInteraction !== true) {
        validationErrors.push('designIntent.conceptualAnchor.visualRiskBudget.allowRichMotionAndMicroInteraction must equal true.');
      }
      if (visualRiskBudget.rejectTimidDefaultWhenAnchorSupportsExpressiveUi !== true) {
        validationErrors.push('designIntent.conceptualAnchor.visualRiskBudget.rejectTimidDefaultWhenAnchorSupportsExpressiveUi must equal true.');
      }
      if (visualRiskBudget.requireReducedMotionFallback !== true) {
        validationErrors.push('designIntent.conceptualAnchor.visualRiskBudget.requireReducedMotionFallback must equal true.');
      }
    }
    if (
      !Array.isArray(conceptualAnchor.requiredDerivedAxes)
      || !conceptualAnchor.requiredDerivedAxes.includes('typography')
      || !conceptualAnchor.requiredDerivedAxes.includes('responsive-composition')
    ) {
      validationErrors.push('designIntent.conceptualAnchor.requiredDerivedAxes must include typography and responsive-composition.');
    }
    const finalAnchorContract = conceptualAnchor.finalAnchorContract;
    if (!finalAnchorContract || typeof finalAnchorContract !== 'object') {
      validationErrors.push('designIntent.conceptualAnchor.finalAnchorContract must exist.');
    } else {
      if (
        !Array.isArray(finalAnchorContract.requiredFields)
        || !finalAnchorContract.requiredFields.includes('agentResearchMode')
        || !finalAnchorContract.requiredFields.includes('derivedTokenLogic')
        || !finalAnchorContract.requiredFields.includes('visualRiskBudget')
        || !finalAnchorContract.requiredFields.includes('motionRiskBudget')
        || !finalAnchorContract.requiredFields.includes('cohesionChecks')
      ) {
        validationErrors.push('designIntent.conceptualAnchor.finalAnchorContract.requiredFields must require agentResearchMode, derivedTokenLogic, visualRiskBudget, motionRiskBudget, and cohesionChecks.');
      }
      if (
        !Array.isArray(finalAnchorContract.derivedTokenLogicAxes)
        || !finalAnchorContract.derivedTokenLogicAxes.includes('motion')
        || !finalAnchorContract.derivedTokenLogicAxes.includes('morphology')
      ) {
        validationErrors.push('designIntent.conceptualAnchor.finalAnchorContract.derivedTokenLogicAxes must include motion and morphology.');
      }
      if (
        !Array.isArray(finalAnchorContract.cohesionChecks)
        || !finalAnchorContract.cohesionChecks.includes('no-dashboard-mental-model')
        || !finalAnchorContract.cohesionChecks.includes('motion-derived-from-anchor')
      ) {
        validationErrors.push('designIntent.conceptualAnchor.finalAnchorContract.cohesionChecks must reject dashboard mental models and require motion derivation.');
      }
    }
  }

  if (!designIntentContract.mathSystems || typeof designIntentContract.mathSystems !== 'object') {
    validationErrors.push('designIntent.mathSystems must exist.');
  } else {
    if (!String(designIntentContract.mathSystems.typographyScaleRatio || '').trim()) {
      validationErrors.push('designIntent.mathSystems.typographyScaleRatio must describe the chosen or pending type scale decision.');
    }
    if (!String(designIntentContract.mathSystems.baseGridUnit || '').trim()) {
      validationErrors.push('designIntent.mathSystems.baseGridUnit must describe the chosen or pending spacing grid decision.');
    }
  }

  if (!designIntentContract.tokenSystem || typeof designIntentContract.tokenSystem !== 'object') {
    validationErrors.push('designIntent.tokenSystem must exist.');
  } else {
    const taxonomyOrder = designIntentContract.tokenSystem.taxonomyOrder;
    if (!Array.isArray(taxonomyOrder) || taxonomyOrder.join('|') !== 'primitive|semantic|component') {
      validationErrors.push('designIntent.tokenSystem.taxonomyOrder must equal ["primitive","semantic","component"].');
    }
    if (designIntentContract.tokenSystem.primitiveColorSpace !== 'OKLCH') {
      validationErrors.push('designIntent.tokenSystem.primitiveColorSpace must equal "OKLCH".');
    }
    if (designIntentContract.tokenSystem.requireSemanticAliases !== true) {
      validationErrors.push('designIntent.tokenSystem.requireSemanticAliases must equal true.');
    }
    if (designIntentContract.tokenSystem.semanticAliasesMutableWithoutComponentRewrite !== true) {
      validationErrors.push('designIntent.tokenSystem.semanticAliasesMutableWithoutComponentRewrite must equal true.');
    }
    if (designIntentContract.tokenSystem.componentTokensConsumeSemantic !== true) {
      validationErrors.push('designIntent.tokenSystem.componentTokensConsumeSemantic must equal true.');
    }
    const fallbackPolicy = designIntentContract.tokenSystem.fallbackPolicy;
    if (!fallbackPolicy || typeof fallbackPolicy !== 'object') {
      validationErrors.push('designIntent.tokenSystem.fallbackPolicy must exist.');
    } else {
      if (fallbackPolicy.forbidRawHexOutsidePrimitives !== true) {
        validationErrors.push('designIntent.tokenSystem.fallbackPolicy.forbidRawHexOutsidePrimitives must equal true.');
      }
      if (fallbackPolicy.forbidRawSpacingOutsidePrimitives !== true) {
        validationErrors.push('designIntent.tokenSystem.fallbackPolicy.forbidRawSpacingOutsidePrimitives must equal true.');
      }
      if (fallbackPolicy.requireDocumentedExceptionForLegacyBypass !== true) {
        validationErrors.push('designIntent.tokenSystem.fallbackPolicy.requireDocumentedExceptionForLegacyBypass must equal true.');
      }
    }
    const namingConstraints = designIntentContract.tokenSystem.namingConstraints;
    if (!namingConstraints || typeof namingConstraints !== 'object') {
      validationErrors.push('designIntent.tokenSystem.namingConstraints must exist.');
    } else {
      if (namingConstraints.forbidCurlyBracesInNames !== true) {
        validationErrors.push('designIntent.tokenSystem.namingConstraints.forbidCurlyBracesInNames must equal true.');
      }
      if (namingConstraints.forbidDotsInNames !== true) {
        validationErrors.push('designIntent.tokenSystem.namingConstraints.forbidDotsInNames must equal true.');
      }
      if (namingConstraints.forbidSquareBracketsInNames !== true) {
        validationErrors.push('designIntent.tokenSystem.namingConstraints.forbidSquareBracketsInNames must equal true.');
      }
    }
  }

  if (!designIntentContract.colorTruth || typeof designIntentContract.colorTruth !== 'object') {
    validationErrors.push('designIntent.colorTruth must exist.');
  } else {
    if (designIntentContract.colorTruth.format !== 'OKLCH') {
      validationErrors.push('designIntent.colorTruth.format must equal "OKLCH".');
    }
    if (designIntentContract.colorTruth.allowHexDerivatives !== true) {
      validationErrors.push('designIntent.colorTruth.allowHexDerivatives must equal true.');
    }
    if (!String(designIntentContract.colorTruth.intent || '').trim()) {
      validationErrors.push('designIntent.colorTruth.intent must be a non-empty string.');
    }
    const paletteRoles = designIntentContract.colorTruth.paletteRoles;
    if (!Array.isArray(paletteRoles) || paletteRoles.length < 1) {
      validationErrors.push('designIntent.colorTruth.paletteRoles must define or request agent-defined semantic palette roles.');
    }
    if (designIntentContract.colorTruth.rolesMustBeAgentDefined !== true) {
      validationErrors.push('designIntent.colorTruth.rolesMustBeAgentDefined must equal true.');
    }
  }

  if (!designIntentContract.crossViewportAdaptation || typeof designIntentContract.crossViewportAdaptation !== 'object') {
    validationErrors.push('designIntent.crossViewportAdaptation must exist.');
  } else {
    const mutationRules = designIntentContract.crossViewportAdaptation.mutationRules;
    if (!mutationRules || typeof mutationRules !== 'object') {
      validationErrors.push('designIntent.crossViewportAdaptation.mutationRules must exist.');
    } else {
      for (const viewportKey of ['mobile', 'tablet', 'desktop']) {
        if (!String(mutationRules[viewportKey] || '').trim()) {
          validationErrors.push(`designIntent.crossViewportAdaptation.mutationRules.${viewportKey} must be a non-empty string.`);
        }
      }
    }
  }

  if (!designIntentContract.motionSystem || typeof designIntentContract.motionSystem !== 'object') {
    validationErrors.push('designIntent.motionSystem must exist.');
  } else {
    if (designIntentContract.motionSystem.allowMeaningfulMotion !== true) {
      validationErrors.push('designIntent.motionSystem.allowMeaningfulMotion must equal true.');
    }
    if (!String(designIntentContract.motionSystem.purpose || '').trim()) {
      validationErrors.push('designIntent.motionSystem.purpose must be a non-empty string.');
    }
    if (designIntentContract.motionSystem.respectReducedMotion !== true) {
      validationErrors.push('designIntent.motionSystem.respectReducedMotion must equal true.');
    }
  }

  if (!designIntentContract.componentMorphology || typeof designIntentContract.componentMorphology !== 'object') {
    validationErrors.push('designIntent.componentMorphology must exist.');
  } else {
    if (designIntentContract.componentMorphology.requireStateBehaviorMatrix !== true) {
      validationErrors.push('designIntent.componentMorphology.requireStateBehaviorMatrix must equal true.');
    }
    if (!Array.isArray(designIntentContract.componentMorphology.stateKeys) || designIntentContract.componentMorphology.stateKeys.length < 4) {
      validationErrors.push('designIntent.componentMorphology.stateKeys must contain multiple interaction states.');
    }
    const viewportBehavior = designIntentContract.componentMorphology.viewportBehavior;
    if (!viewportBehavior || typeof viewportBehavior !== 'object') {
      validationErrors.push('designIntent.componentMorphology.viewportBehavior must exist.');
    } else {
      for (const viewportKey of ['mobile', 'tablet', 'desktop']) {
        if (!String(viewportBehavior[viewportKey] || '').trim()) {
          validationErrors.push(`designIntent.componentMorphology.viewportBehavior.${viewportKey} must be a non-empty string.`);
        }
      }
    }
  }

  if (!designIntentContract.accessibilityPolicy || typeof designIntentContract.accessibilityPolicy !== 'object') {
    validationErrors.push('designIntent.accessibilityPolicy must exist.');
  } else {
    if (designIntentContract.accessibilityPolicy.hardComplianceFloor !== 'WCAG-2.2-AA') {
      validationErrors.push('designIntent.accessibilityPolicy.hardComplianceFloor must equal "WCAG-2.2-AA".');
    }
    if (designIntentContract.accessibilityPolicy.advisoryContrastModel !== 'APCA') {
      validationErrors.push('designIntent.accessibilityPolicy.advisoryContrastModel must equal "APCA".');
    }
    if (designIntentContract.accessibilityPolicy.failOnHardViolations !== true) {
      validationErrors.push('designIntent.accessibilityPolicy.failOnHardViolations must equal true.');
    }
    if (designIntentContract.accessibilityPolicy.advisoryFindingsDoNotBlockByDefault !== true) {
      validationErrors.push('designIntent.accessibilityPolicy.advisoryFindingsDoNotBlockByDefault must equal true.');
    }
    const hardRequirements = designIntentContract.accessibilityPolicy.hardRequirements;
    if (!hardRequirements || typeof hardRequirements !== 'object') {
      validationErrors.push('designIntent.accessibilityPolicy.hardRequirements must exist.');
    } else {
      for (const requirementKey of [
        'textContrastMinimum',
        'nonTextContrast',
        'useOfColorOnlyProhibited',
        'focusVisible',
        'focusAppearance',
        'targetSizeMinimum',
        'keyboardAccess',
        'reflowRequired',
        'accessibleAuthenticationMinimum',
        'statusMessagesAndDynamicStateAccess',
      ]) {
        if (hardRequirements[requirementKey] !== true) {
          validationErrors.push(`designIntent.accessibilityPolicy.hardRequirements.${requirementKey} must equal true.`);
        }
      }
    }
    const advisoryChecks = designIntentContract.accessibilityPolicy.advisoryChecks;
    if (!advisoryChecks || typeof advisoryChecks !== 'object') {
      validationErrors.push('designIntent.accessibilityPolicy.advisoryChecks must exist.');
    } else {
      for (const advisoryKey of [
        'perceptualContrastReview',
        'darkModeContrastTuning',
        'typographyReadabilityTuning',
      ]) {
        if (advisoryChecks[advisoryKey] !== true) {
          validationErrors.push(`designIntent.accessibilityPolicy.advisoryChecks.${advisoryKey} must equal true.`);
        }
      }
    }
  }

  if (!designIntentContract.contextHygiene || typeof designIntentContract.contextHygiene !== 'object') {
    validationErrors.push('designIntent.contextHygiene must exist.');
  } else {
    if (designIntentContract.contextHygiene.continuityMode !== 'opt-in-only') {
      validationErrors.push('designIntent.contextHygiene.continuityMode must equal "opt-in-only".');
    }
    if (designIntentContract.contextHygiene.repoEvidenceOverridesMemory !== true) {
      validationErrors.push('designIntent.contextHygiene.repoEvidenceOverridesMemory must equal true.');
    }
    if (designIntentContract.contextHygiene.requireExplicitContinuityApproval !== true) {
      validationErrors.push('designIntent.contextHygiene.requireExplicitContinuityApproval must equal true.');
    }
    if (designIntentContract.contextHygiene.forbidCarryoverWhenUnapproved !== true) {
      validationErrors.push('designIntent.contextHygiene.forbidCarryoverWhenUnapproved must equal true.');
    }
    if (!Array.isArray(designIntentContract.contextHygiene.allowedSources) || designIntentContract.contextHygiene.allowedSources.length < 4) {
      validationErrors.push('designIntent.contextHygiene.allowedSources must list the approved design evidence sources.');
    }
    if (!Array.isArray(designIntentContract.contextHygiene.taintedSources) || designIntentContract.contextHygiene.taintedSources.length < 3) {
      validationErrors.push('designIntent.contextHygiene.taintedSources must list tainted carryover sources.');
    }
    if (!String(designIntentContract.contextHygiene.approvedExternalConstraintUsage || '').trim()) {
      validationErrors.push('designIntent.contextHygiene.approvedExternalConstraintUsage must be a non-empty string.');
    }
  }

  if (!designIntentContract.designExecutionPolicy || typeof designIntentContract.designExecutionPolicy !== 'object') {
    validationErrors.push('designIntent.designExecutionPolicy must exist.');
  } else {
    if (designIntentContract.designExecutionPolicy.representationStrategy !== 'surface-plan-v1') {
      validationErrors.push('designIntent.designExecutionPolicy.representationStrategy must equal "surface-plan-v1".');
    }
    for (const requiredFlagName of [
      'requireSurfacePlan',
      'requireComponentGraph',
      'requireViewportMutationPlan',
      'requireInteractionStateMatrix',
      'requireContentPriorityMap',
      'requireTaskFlowNarrative',
      'requireSignatureMoveRationale',
      'requireStructuredHandoff',
      'requireRepoEvidenceAlignment',
      'forbidScreenshotDependency',
      'requirePerSurfaceMutationOps',
      'forbidUniformSiblingSurfaceTreatment',
      'zeroBasedRedesignResetsPriorVisualsWhenRequested',
    ]) {
      if (designIntentContract.designExecutionPolicy[requiredFlagName] !== true) {
        validationErrors.push(`designIntent.designExecutionPolicy.${requiredFlagName} must equal true.`);
      }
    }
    if (designIntentContract.designExecutionPolicy.handoffFormatVersion !== 'ui-handoff-v1') {
      validationErrors.push('designIntent.designExecutionPolicy.handoffFormatVersion must equal "ui-handoff-v1".');
    }
    if (
      !Array.isArray(designIntentContract.designExecutionPolicy.semanticReviewFocus)
      || designIntentContract.designExecutionPolicy.semanticReviewFocus.length < 4
    ) {
      validationErrors.push('designIntent.designExecutionPolicy.semanticReviewFocus must list the required review dimensions.');
    }
  }

  if (!designIntentContract.designExecutionHandoff || typeof designIntentContract.designExecutionHandoff !== 'object') {
    validationErrors.push('designIntent.designExecutionHandoff must exist.');
  } else {
    if (designIntentContract.designExecutionHandoff.version !== 'ui-handoff-v1') {
      validationErrors.push('designIntent.designExecutionHandoff.version must equal "ui-handoff-v1".');
    }
    if (designIntentContract.designExecutionHandoff.seedMode !== 'structure-first-scaffold') {
      validationErrors.push('designIntent.designExecutionHandoff.seedMode must equal "structure-first-scaffold".');
    }
    if (designIntentContract.designExecutionHandoff.requiresTaskSpecificRefinement !== true) {
      validationErrors.push('designIntent.designExecutionHandoff.requiresTaskSpecificRefinement must equal true.');
    }
    if (!String(designIntentContract.designExecutionHandoff.primaryExperienceGoal || '').trim()) {
      validationErrors.push('designIntent.designExecutionHandoff.primaryExperienceGoal must be a non-empty string.');
    }
    if (!Array.isArray(designIntentContract.designExecutionHandoff.surfacePlan) || designIntentContract.designExecutionHandoff.surfacePlan.length < 1) {
      validationErrors.push('designIntent.designExecutionHandoff.surfacePlan must define at least one planned surface.');
    }
    const componentGraph = designIntentContract.designExecutionHandoff.componentGraph;
    if (!componentGraph || typeof componentGraph !== 'object') {
      validationErrors.push('designIntent.designExecutionHandoff.componentGraph must exist.');
    } else {
      if (!Array.isArray(componentGraph.nodes) || componentGraph.nodes.length < 2) {
        validationErrors.push('designIntent.designExecutionHandoff.componentGraph.nodes must list the primary execution nodes.');
      }
      if (!Array.isArray(componentGraph.edges) || componentGraph.edges.length < 1) {
        validationErrors.push('designIntent.designExecutionHandoff.componentGraph.edges must define relationships between UI nodes.');
      }
    }
    const contentPriorityMap = designIntentContract.designExecutionHandoff.contentPriorityMap;
    if (!contentPriorityMap || typeof contentPriorityMap !== 'object') {
      validationErrors.push('designIntent.designExecutionHandoff.contentPriorityMap must exist.');
    } else {
      for (const priorityBucket of ['primary', 'secondary', 'deferred']) {
        if (!Array.isArray(contentPriorityMap[priorityBucket]) || contentPriorityMap[priorityBucket].length < 1) {
          validationErrors.push(`designIntent.designExecutionHandoff.contentPriorityMap.${priorityBucket} must contain at least one item.`);
        }
      }
    }
    const viewportMutationPlan = designIntentContract.designExecutionHandoff.viewportMutationPlan;
    if (!viewportMutationPlan || typeof viewportMutationPlan !== 'object') {
      validationErrors.push('designIntent.designExecutionHandoff.viewportMutationPlan must exist.');
    } else {
      for (const viewportKey of ['mobile', 'tablet', 'desktop']) {
        const viewportPlan = viewportMutationPlan[viewportKey];
        if (!viewportPlan || typeof viewportPlan !== 'object') {
          validationErrors.push(`designIntent.designExecutionHandoff.viewportMutationPlan.${viewportKey} must be an object.`);
          continue;
        }
        if (!String(viewportPlan.primaryOperation || '').trim()) {
          validationErrors.push(`designIntent.designExecutionHandoff.viewportMutationPlan.${viewportKey}.primaryOperation must be a non-empty string.`);
        }
        if (!Array.isArray(viewportPlan.requiredSurfaceActions) || viewportPlan.requiredSurfaceActions.length < 2) {
          validationErrors.push(`designIntent.designExecutionHandoff.viewportMutationPlan.${viewportKey}.requiredSurfaceActions must contain at least two actions.`);
        }
        if (!Array.isArray(viewportPlan.forbiddenPatterns) || viewportPlan.forbiddenPatterns.length < 1) {
          validationErrors.push(`designIntent.designExecutionHandoff.viewportMutationPlan.${viewportKey}.forbiddenPatterns must contain at least one anti-pattern.`);
        }
        if (!String(viewportPlan.rationale || '').trim()) {
          validationErrors.push(`designIntent.designExecutionHandoff.viewportMutationPlan.${viewportKey}.rationale must be a non-empty string.`);
        }
      }
    }
    if (!Array.isArray(designIntentContract.designExecutionHandoff.interactionStateMatrix) || designIntentContract.designExecutionHandoff.interactionStateMatrix.length < 1) {
      validationErrors.push('designIntent.designExecutionHandoff.interactionStateMatrix must list key component state expectations.');
    }
    if (!Array.isArray(designIntentContract.designExecutionHandoff.taskFlowNarrative) || designIntentContract.designExecutionHandoff.taskFlowNarrative.length < 2) {
      validationErrors.push('designIntent.designExecutionHandoff.taskFlowNarrative must describe the key UI task flow in sequence.');
    }
    if (!String(designIntentContract.designExecutionHandoff.signatureMoveRationale || '').trim()) {
      validationErrors.push('designIntent.designExecutionHandoff.signatureMoveRationale must explain the chosen authored move.');
    }
    const implementationGuardrails = designIntentContract.designExecutionHandoff.implementationGuardrails;
    if (!implementationGuardrails || typeof implementationGuardrails !== 'object') {
      validationErrors.push('designIntent.designExecutionHandoff.implementationGuardrails must exist.');
    } else {
      for (const requiredFlagName of [
        'requireBuildFromHandoff',
        'requireGapNotesBeforeFallback',
        'forbidGenericLayoutFallbackWithoutReason',
      ]) {
        if (implementationGuardrails[requiredFlagName] !== true) {
          validationErrors.push(`designIntent.designExecutionHandoff.implementationGuardrails.${requiredFlagName} must equal true.`);
        }
      }
    }
  }

  if (!designIntentContract.reviewRubric || typeof designIntentContract.reviewRubric !== 'object') {
    validationErrors.push('designIntent.reviewRubric must exist.');
  } else {
    if (designIntentContract.reviewRubric.version !== 'ui-rubric-v1') {
      validationErrors.push('designIntent.reviewRubric.version must equal "ui-rubric-v1".');
    }
    if (designIntentContract.reviewRubric.genericityAutoFail !== true) {
      validationErrors.push('designIntent.reviewRubric.genericityAutoFail must equal true.');
    }
    if (!Array.isArray(designIntentContract.reviewRubric.dimensions) || designIntentContract.reviewRubric.dimensions.length < 5) {
      validationErrors.push('designIntent.reviewRubric.dimensions must define the required rubric dimensions.');
    } else {
      for (const requiredRubricKey of [
        'distinctiveness',
        'contractFidelity',
        'visualConsistency',
        'heuristicUxQuality',
        'motionDiscipline',
      ]) {
        if (!designIntentContract.reviewRubric.dimensions.some((dimension) => dimension?.key === requiredRubricKey)) {
          validationErrors.push(`designIntent.reviewRubric.dimensions is missing "${requiredRubricKey}".`);
        }
      }
    }
    if (!Array.isArray(designIntentContract.reviewRubric.genericitySignals) || designIntentContract.reviewRubric.genericitySignals.length < 3) {
      validationErrors.push('designIntent.reviewRubric.genericitySignals must list common genericity drift signals.');
    }
    if (!Array.isArray(designIntentContract.reviewRubric.validBoldSignals) || designIntentContract.reviewRubric.validBoldSignals.length < 3) {
      validationErrors.push('designIntent.reviewRubric.validBoldSignals must list legitimate authored signals.');
    }
    if (!designIntentContract.reviewRubric.reportingRules || typeof designIntentContract.reviewRubric.reportingRules !== 'object') {
      validationErrors.push('designIntent.reviewRubric.reportingRules must exist.');
    } else {
      for (const requiredFlagName of [
        'mustExplainGenericity',
        'mustSeparateTasteFromFailure',
        'contractFidelityOverridesPersonalTaste',
      ]) {
        if (designIntentContract.reviewRubric.reportingRules[requiredFlagName] !== true) {
          validationErrors.push(`designIntent.reviewRubric.reportingRules.${requiredFlagName} must equal true.`);
        }
      }
    }
  }

  if (!Array.isArray(designIntentContract.requiredDesignSections) || designIntentContract.requiredDesignSections.length !== DESIGN_REQUIRED_SECTIONS.length) {
    validationErrors.push('designIntent.requiredDesignSections must match the required design contract sections.');
  } else {
    for (const requiredSectionName of DESIGN_REQUIRED_SECTIONS) {
      if (!designIntentContract.requiredDesignSections.includes(requiredSectionName)) {
        validationErrors.push(`designIntent.requiredDesignSections is missing "${requiredSectionName}".`);
      }
    }
  }

  if (!Array.isArray(designIntentContract.forbiddenPatterns) || designIntentContract.forbiddenPatterns.length < 4) {
    validationErrors.push('designIntent.forbiddenPatterns must list concrete anti-generic patterns.');
  }

  return validationErrors;
}

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
