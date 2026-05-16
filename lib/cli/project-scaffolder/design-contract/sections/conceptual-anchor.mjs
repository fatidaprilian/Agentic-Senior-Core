/**
 * Conceptual anchor section of the design intent contract. Encodes the rules
 * that force agents to commit to a real-world reference, motion, and typography
 * decision before UI implementation, instead of defaulting to spatial cliches.
 */

export function buildConceptualAnchorSection() {
  return {
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
      avoidSpatialPlaceMetaphorByDefault: true,
      preferMechanismOverPlace: true,
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
      'room',
      'darkroom',
      'counting-room',
      'control-room',
      'war-room',
      'studio',
      'lab',
      'cockpit',
      'command-center',
    ],
    sourceDomains: [
      'complex-physical-engineering',
      'cinematic-behavior-and-transition-systems',
      'experimental-editorial-structure',
      'scientific-instrumentation',
      'workflow-and-custody-systems',
      'material-artifacts-and-instruments',
      'premium-interactive-web-experiences',
    ],
    visualRiskBudget: {
      mode: 'high-distinctiveness-with-accessibility-and-performance-guardrails',
      allowRichMotionAndMicroInteraction: true,
      rejectTimidDefaultWhenAnchorSupportsExpressiveUi: true,
      rejectDependencyFearAsDownshiftReason: true,
      requireReducedMotionFallback: true,
    },
    literalTranslationPolicy: {
      preferNonLiteralTranslation: true,
      allowedLiteralUse: 'Only use literal anchor artifacts when they serve a named product function, control, state, or task overlay.',
      forbiddenLiteralUse: 'Do not turn anchor artifacts into decorative wallpaper, required chrome, default texture, or unavoidable theme props.',
    },
    spatialAutopilotPolicy: {
      forbiddenHabitTerms: ['room', 'darkroom', 'counting-room', 'control-room', 'war-room', 'studio', 'lab', 'cockpit', 'command-center'],
      allowedOnlyWhen: 'The product has a real physical place model, operational environment, or user workflow that depends on that place metaphor.',
      replacementPreference: 'Use artifacts, custody flows, instruments, data behaviors, material systems, editorial systems, service rituals, or interaction mechanisms.',
      reviewQuestion: 'Could this anchor still work if the word "room" was removed? If not, revise before UI code.',
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
  };
}
