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
  const normalizedDomain = String(primaryDomain || '').trim().toLowerCase();
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
  const isMobileLikeSurface = normalizedDomain.includes('mobile');

  return {
    designPhilosophy: `Use ${evidenceSourceLabel} to synthesize a project-specific design system for ${projectName || 'this project'}. Treat this seed as structural scaffolding that must be refined before UI implementation, not as final art direction.`,
    brandAdjectives: ['project-specific', 'intentional', 'evidence-led'],
    antiAdjectives: ['template-neutral', 'copycat', 'unjustified-defaults'],
    typographyScaleRatio: '1.200',
    baseGridUnit: 8,
    spacingPattern: isMobileLikeSurface ? 'mobile-first-single-axis' : 'adaptive-task-priority',
    densityMode: isMobileLikeSurface ? 'touch-priority' : 'adaptive-task-priority',
    colorIntent: `Define palette roles from ${projectContextLabel} and refine them with repo evidence. Treat the listed palette roles as minimum semantic categories, not final visual choices.`,
    paletteRoles: ['base', 'surface', 'text', 'muted', 'accent', 'border', 'focus', 'success', 'warning', 'danger'],
    distinctiveMoves: [
      'Derive one memorable signature move from the product task, current repo evidence, and the active brief before locking the layout language.',
      'Use task priority, hierarchy, and surface relationships to replace template-neutral hero or card-grid defaults.',
      'Document why the final visual move belongs to this project and what generic fallback it intentionally avoids.',
    ],
    motionPurpose: 'Use motion to clarify causality, hierarchy, state feedback, and perceived product quality. The final motion tone must be refined from repo evidence and the active brief, not inherited from this seed alone.',
    motionChoreography: 'Keep motion purposeful, reduced-motion-safe, and tied to state or surface changes. Any signature choreography must be justified in docs/DESIGN.md before it becomes part of the system.',
    motionDurations: {
      desktop: 180,
      mobile: 240,
    },
    componentMorphology: {
      mobile: 'Simplify the primary task surface, keep decisive actions in easy reach, and move supporting context behind explicit disclosure when space gets tight.',
      tablet: 'Preserve task continuity while compressing tertiary chrome and keeping priority boundaries obvious across shared surfaces.',
      desktop: 'Expose the richest version of the task flow and supporting context without defaulting to symmetrical template composition.',
    },
    mutationRules: {
      mobile: 'Recompose the flow around the first decisive action, collapse secondary navigation into explicit overlays or sheets, and re-rank supporting context below the primary task.',
      tablet: 'Preserve task continuity with fewer simultaneous surfaces, condensed chrome, and explicit boundaries between primary, supporting, and deferred content.',
      desktop: 'Expose the fullest version of the task flow, supporting context, and navigation system without falling back to interchangeable dashboard or hero defaults.',
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
      stack: toTitleCase(initContext.stackFileName),
      blueprint: toTitleCase(initContext.blueprintFileName),
    },
    designPhilosophy: inferredKeywords.designPhilosophy,
    brandAdjectives: inferredKeywords.brandAdjectives,
    antiAdjectives: inferredKeywords.antiAdjectives,
    visualDirection: {
      seedMode: 'scaffold-only',
      requiresProjectSpecificSynthesis: true,
      trendStance: 'trend-aware-not-trend-chasing',
      distinctiveMoves: inferredKeywords.distinctiveMoves,
      copiedReferenceAllowed: false,
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
      aliasingStrategy: 'Primitive tokens hold raw values, semantic tokens carry intent, and component tokens consume semantic aliases instead of raw values.',
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
      tokenLayerRoles: {
        primitive: 'Raw values such as colors, spacing, radius, typography, and motion primitives.',
        semantic: 'Contextual intent tokens such as primary action, muted surface, emphasis text, or critical state.',
        component: 'Component-scoped tokens that consume semantic aliases and preserve local consistency without redefining the system.',
      },
      platformOutputs: ['json-contract', 'css-variables'],
    },
    colorTruth: {
      format: 'OKLCH',
      allowHexDerivatives: true,
      requirePerceptualLightnessCurve: true,
      paletteRoles: inferredKeywords.paletteRoles,
      rolePolicy: 'minimum-semantic-scaffold',
      rolesAreMinimumScaffold: true,
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
      choreography: inferredKeywords.motionChoreography,
      desktopDurationMs: inferredKeywords.motionDurations.desktop,
      mobileDurationMs: inferredKeywords.motionDurations.mobile,
      seedToneLocked: false,
      respectReducedMotion: true,
      preferTransformAndOpacity: true,
      avoidDecorativeMotionForItsOwnSake: true,
    },
    componentMorphology: {
      requireStateBehaviorMatrix: true,
      preserveIdentityAcrossViewports: true,
      seedBehaviorsRequireRefinement: true,
      stateKeys: ['default', 'hover', 'focus', 'active', 'disabled', 'loading', 'error'],
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
      primaryExperienceGoal: `Refine the main ${String(primaryDomain || 'product').toLowerCase()} journey in ${projectName} so the first decisive action, supporting context, and signature move come from repo evidence and the active brief rather than scaffold defaults.`,
      surfacePlan: [
        {
          surfaceId: 'primary-entry-surface',
          role: 'primary-task-entry',
          goal: `Map the first meaningful task in ${projectName} and replace generic hero filler with task-first hierarchy justified by repo evidence and the active brief.`,
          primaryAction: 'Define the first decisive action or decision point explicitly during refinement instead of inheriting placeholder CTA language.',
          supportingModules: ['context', 'proof', 'navigation'],
          signatureMoveHint: 'Document one project-specific signature move for the primary surface and explain which generic fallback it intentionally rejects.',
        },
        {
          surfaceId: 'supporting-proof-surface',
          role: 'trust-and-context',
          goal: 'Define how proof, explanation, or operational context supports the main task without turning the layout into a template-neutral secondary rail.',
          primaryAction: 'Clarify what supporting proof or status belongs near the main task once the product-specific flow is confirmed.',
          supportingModules: ['status', 'metadata', 'secondary-actions'],
          signatureMoveHint: 'Explain how this supporting surface reinforces the primary task without competing for dominance or collapsing into generic chrome.',
        },
      ],
      componentGraph: {
        nodes: [
          {
            id: 'primary-action-surface',
            role: 'task-driver',
            priority: 'high',
          },
          {
            id: 'supporting-context-rail',
            role: 'context-support',
            priority: 'medium',
          },
          {
            id: 'feedback-status-module',
            role: 'feedback-and-proof',
            priority: 'medium',
          },
        ],
        edges: [
          {
            from: 'primary-action-surface',
            to: 'supporting-context-rail',
            relationship: 'context-support',
          },
          {
            from: 'primary-action-surface',
            to: 'feedback-status-module',
            relationship: 'state-feedback',
          },
        ],
      },
      contentPriorityMap: {
        primary: [
          'core-task-entry',
          'primary-status-or-value-message',
          'decisive-action-labeling',
        ],
        secondary: [
          'supporting-proof',
          'navigation-context',
          'secondary-actions',
        ],
        deferred: [
          'deep-explanation',
          'tertiary-metadata',
          'low-priority-decoration',
        ],
      },
      viewportMutationPlan: {
        mobile: inferredKeywords.mutationRules.mobile,
        tablet: inferredKeywords.mutationRules.tablet,
        desktop: inferredKeywords.mutationRules.desktop,
      },
      interactionStateMatrix: [
        {
          componentId: 'primary-action-control',
          states: ['default', 'hover', 'focus', 'loading', 'success', 'error'],
          notes: 'Refine these states with project-specific feedback language and visual treatment, but keep them legible, decisive, and consistent across all supported viewports.',
        },
        {
          componentId: 'primary-content-module',
          states: ['default', 'focus', 'expanded', 'loading', 'error'],
          notes: 'Refine this module so it preserves hierarchy and progressive disclosure without collapsing into anonymous cards or safe default dashboard panels.',
        },
      ],
      taskFlowNarrative: [
        `Entry: refine how ${projectName} establishes the first meaningful action using current task evidence instead of generic product-marketing framing.`,
        'Decision: define the hierarchy, proof, and state language that help the user choose the next step without defaulting to generic card-grid or hero habits.',
        'Resolution: specify the feedback, recovery path, and next useful action so progress remains visible without hiding behind decorative confirmation states.',
      ],
      signatureMoveRationale: 'Explain which project-specific surface, motion, typographic, or compositional move anchors the system and why a generic fallback would weaken the product.',
      implementationGuardrails: {
        requireBuildFromHandoff: true,
        requireGapNotesBeforeFallback: true,
        forbidGenericLayoutFallbackWithoutReason: true,
      },
    },
    reviewRubric: {
      version: 'ui-rubric-v1',
      dimensions: [
        {
          key: 'distinctiveness',
          blockingByDefault: false,
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
          question: 'If motion is present, does it stay purposeful, performant, reduced-motion-safe, and consistent with the product tone?',
        },
      ],
      genericitySignals: [
        'safe-centered-hero-without-product-rationale',
        'balanced-card-grid-without-priority-shift',
        'default-framework-button-and-input-treatment',
        'trend-gradient-without-structural-role',
        'interchangeable-dashboard-chrome',
      ],
      validBoldSignals: [
        'one-clear-signature-move',
        'project-specific-layout-tension',
        'purposeful-motion-as-identity',
        'distinct-typographic-hierarchy',
        'non-template-task-priority',
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
        'explicitly-approved-reference-systems',
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
      approvedReferenceUsage: 'Adapt reasoning and constraints from approved references without copying the surface 1:1.',
      driftSignals: [
        'palette-reused-without-brief-support',
        'motion-signature-reused-without-approval',
        'layout-shape-matches-unrelated-project-memory',
      ],
    },
    experiencePrinciples: [
      'Design must feel project-specific, not interchangeable with generic SaaS templates.',
      'Major interface decisions must be explainable in product and user terms.',
      'Accessibility, responsiveness, and implementation realism are non-negotiable.',
      'Cross-viewport behavior must reorganize tasks and navigation, not just scale the desktop layout down.',
      'Motion may add character, memorability, and continuity when it improves the product experience, but it must stay purposeful, performant, and optional for reduced-motion users.',
      'At least one surface, compositional move, typographic decision, or motion motif should be recognizable at a glance.',
    ],
    forbiddenPatterns: [
      'generic-saas-hero',
      'copycat-brand-system',
      'unjustified-default-gradients',
      'placeholder-design-language',
      'scale-only-responsive-layout',
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
      requireReviewRubric: true,
      requireGenericityExplanation: true,
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

  if (!designIntentContract.mathSystems || typeof designIntentContract.mathSystems !== 'object') {
    validationErrors.push('designIntent.mathSystems must exist.');
  } else {
    if (!/^\d+(\.\d+)?$/.test(String(designIntentContract.mathSystems.typographyScaleRatio || '').trim())) {
      validationErrors.push('designIntent.mathSystems.typographyScaleRatio must be numeric text.');
    }
    if (!Number.isInteger(designIntentContract.mathSystems.baseGridUnit) || designIntentContract.mathSystems.baseGridUnit <= 0) {
      validationErrors.push('designIntent.mathSystems.baseGridUnit must be a positive integer.');
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
    if (!Array.isArray(paletteRoles) || paletteRoles.length < 4) {
      validationErrors.push('designIntent.colorTruth.paletteRoles must define the minimum semantic palette roles.');
    } else {
      for (const requiredPaletteRole of ['base', 'surface', 'text', 'accent']) {
        if (!paletteRoles.includes(requiredPaletteRole)) {
          validationErrors.push(`designIntent.colorTruth.paletteRoles is missing "${requiredPaletteRole}".`);
        }
      }
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
    if (!String(designIntentContract.contextHygiene.approvedReferenceUsage || '').trim()) {
      validationErrors.push('designIntent.contextHygiene.approvedReferenceUsage must be a non-empty string.');
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
        if (!String(viewportMutationPlan[viewportKey] || '').trim()) {
          validationErrors.push(`designIntent.designExecutionHandoff.viewportMutationPlan.${viewportKey} must be a non-empty string.`);
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
