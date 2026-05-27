/**
 * Conceptual anchor section of the design intent contract. Encodes the rules
 * that force agents to commit to a real-world reference, motion, and typography
 * decision before UI implementation, instead of defaulting to spatial cliches.
 *
 * Carries the Section 3 dossier from
 * `.agent-context/prompts/research-design.md`:
 *   - categoryCodes (Section 3a)
 *   - anchorReference (Section 3b)
 *   - creativeCommitments (Section 3c)
 */

export function buildConceptualAnchorSection() {
  return {
    mode: 'required-when-no-external-research',
    seedMode: 'selection-policy-only',
    anchorReference: 'agent-defined-anchor-reference',
    researchBrief: '.agent-context/prompts/research-design.md',
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
      preferSpecificOverGeneric: true,
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
      'premium-interactive-web-experiences',
      'cinematic-campaign-and-product-launch', 
      'contemporary-editorial-digital-design',
      'cinematic-behavior-and-transition-systems',
      'experimental-editorial-structure',
      'complex-physical-engineering',
      'material-artifacts-and-instruments',
      'workflow-and-custody-systems',
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
    categoryCodes: {
      mode: 'agent-must-complete-before-ui-implementation',
      blockingByDefault: true,
      researchBriefSection: 'Section 3',
      researchBriefPath: '.agent-context/prompts/research-design.md',
      minimumEntries: 3,
      specificityRule: 'A category code is only valid if a reader unfamiliar with the project can visualize a specific aesthetic direction from the text alone, without seeing the UI and without knowing the product name.',
      antiLeakageRule: 'Listing a cliche identifies a trap; it does not endorse an aesthetic. Examples in the brief are NOT target aesthetics for any project. Each category code must carry an explicit rejection note so the cliche cannot quietly become the target.',
      failingExamples: [
        'clean typography (too abstract, applies to anything)',
        'modern color palette (not falsifiable)',
        'smooth animations (describes nothing specific)',
      ],
      passingExamples: [
        "children's storybook illustration site: hand-painted gouache textures with irregular hand-lettered titles, off-grid spreads with whitespace gutters, page-turn pacing rather than scroll (instantly recognizable as kids book category default)",
        'luxury car configurator: full-bleed monochrome photography on black, ultra-thin sans-serif tracked wide, slow horizontal scroll with locked vertical alignment, micro-counters that tick instead of slide (instantly recognizable as luxury auto category default)',
        'academic philosophy journal: high-contrast black-on-cream, book-class serif body at 11pt with generous leading, footnote markers with hover panels, numbered table-of-contents navigation, no hero imagery (instantly recognizable as academic journal category default)',
      ],
      passingExamplesPolicy: 'These examples illustrate the description format only. They are AI-defaultable cliches of their categories and must NOT be adopted as target aesthetics for any project.',
      commonAiSafeClichesToReject: [
        'dev-tool default: condensed tabular numerics with minimal chrome and monospace code blocks on dark slate background, sans-serif metadata at 11-12px, monochrome status dots, single-line settings rows',
        'AI-startup landing default: purple-to-pink gradient hero with floating 3D glass cards, sans-serif display type at 700-900 weight, vague hero copy, three-up feature grid below the fold',
        'health/wellness app default: mint accent on white surface with coral status indicators, rounded pill-shaped buttons, friendly sans-serif at high weight, soft drop shadows on cards',
        'SaaS admin default: left-side icon-only nav, top utility bar, three-card KPI row above a single data table, neutral grey-on-white with one accent color, modal-driven detail flows',
        'marketing site default: hero image with one-line headline plus subhead, three feature tiles below, two pricing tiers, testimonial carousel, footer link grid',
      ],
      commonAiSafeClichesPolicy: 'If the project sits anywhere near one of these AI-safe defaults, the matching cliche must appear in candidateEntries with an explicit rejection note. Software products pattern-match one of these without intervention; naming the trap is required even when the trap is uncomfortable to admit.',
      selfTestRule: 'Read each category code aloud to someone unfamiliar with the project. If they cannot visualize a specific aesthetic direction from the text alone, the code is too abstract; revise. If they say "that is basically the X cliche", the description is specific enough; the cliche then belongs on the reject list with a rejection note, not as a candidate target.',
      requiredFieldsPerEntry: [
        'description',
        'categoryDefaultReason',
        'rejectionNote',
      ],
      forbiddenPlaceholderPhrases: [
        'clean typography',
        'modern color palette',
        'smooth animations',
        'best practices',
        'good design',
      ],
      candidateEntries: [],
    },

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
