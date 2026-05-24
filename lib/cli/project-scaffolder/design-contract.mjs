/**
 * Design Intent Contract builder. Composes the structured contract from
 * focused section builders living under `design-contract/`. Public exports
 * preserve the original surface so callers (project-scaffolder, storage,
 * prompt-builders) do not need to change.
 *
 * Public exports:
 *   shouldBootstrapDesignDocument
 *   buildDesignIntentSeedFromSignals
 *   buildDesignIntentSeed
 *   validateDesignContractCompleteness  (re-exported from validation)
 *   validateDesignIntentContract        (re-exported from validation)
 */

import { toTitleCase } from '../utils.mjs';
import { DESIGN_REQUIRED_SECTIONS } from './constants.mjs';
import {
  validateDesignContractCompleteness,
  validateDesignIntentContract,
} from './design-contract/validation.mjs';

import { buildStructureFirstSeedSignals, shouldBootstrapDesignDocument } from './design-contract/seed-signals.mjs';
import { FORBIDDEN_PATTERN_SIGNALS } from './design-contract/signal-vocab.mjs';
import { buildConceptualAnchorSection } from './design-contract/sections/conceptual-anchor.mjs';
import { buildResearchDossierMetadata } from './design-contract/research-dossier-migration.mjs';
import {
  buildAccessibilityPolicySection,
  buildAiSafeUiAuditSection,
  buildMotionPaletteDecisionSection,
  buildProductionContentPolicySection,
} from './design-contract/sections/audits.mjs';
import {
  buildContextHygieneSection,
  buildDesignExecutionHandoffSection,
  buildDesignExecutionPolicySection,
  buildReviewRubricSection,
} from './design-contract/sections/execution-handoff.mjs';

export { shouldBootstrapDesignDocument };
export { validateDesignContractCompleteness, validateDesignIntentContract };

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
      sourceFreshnessPolicy: {
        mode: 'rolling-current-date',
        currentDateAnchor: 'session-current-date',
        trendLookbackMonths: 24,
        implementationClaimsRequire: 'current-official-docs-or-primary-release-notes',
        olderSourcePolicy: 'older sources may support durable principles only when labeled old-timeless; they cannot prove current modernity',
        noLiveResearchFallback: 'set sourceFreshnessStatus to pending-live-verification and do not claim current-year modernity',
      },
      internalVocabularyPolicy: { terms: ['evidence', 'dossier', 'anchor', 'category-code', 'morphology', 'rename-test', 'source-freshness'], rule: 'Use research vocabulary for internal audit only; translate it into product-native language before UI copy, public docs, or user-facing rationale unless the user asks for the research trace.' },
      adaptiveUserConceptPolicy: {
        userConceptIsFirstClassConstraint: true,
        researchRole: 'support-refine-or-challenge-user-concept-with-evidence',
        overrideRequires: 'recorded product accessibility technical or evidence conflict',
        trendDefaultsCannotOverrideUserConceptSilently: true,
      },
      requiredEvidenceTableFields: [
        'claim',
        'sourceUrl',
        'sourceType',
        'publishedOrUpdatedAt',
        'fetchedAt',
        'confidence',
        'decisionImpact',
      ],
      candidateDomains: [
        'visual-direction',
        'motion-and-scroll',
        'ui-primitives-or-rich-media',
        'typography-and-interaction',
      ],
      finalDecisionAuthority: 'project-fit-accessibility-performance-maintainability-delivery-speed-official-docs',
    },
    designFlexibilityPolicy: {
      mode: 'locked-outcomes-flexible-expression',
      contractRole: 'Use docs/design-intent.json as review invariants and handoff structure, not as a frozen visual recipe unless the user explicitly locks a decision.',
      lockedOutcomeTypes: [
        'confirmed-user-goals',
        'repo-evidence-and-runtime-constraints',
        'accessibility-and-production-readiness',
        'forbidden-patterns-and-safety-gates',
        'user-approved-brand-or-continuity-decisions',
      ],
      flexibleExpressionAxes: [
        'exact-palette-primitives',
        'font-family-selection',
        'radius-shadow-and-surface-treatment',
        'component-kit-theme-mapping',
        'signature-move-implementation',
        'literal-anchor-artifacts',
        'spatial-metaphor-and-place-language',
      ],
      tokenLockingRule: 'Semantic roles are required, but exact primitive values stay flexible until repo evidence, accessibility validation, implementation constraints, or explicit user approval locks them.',
      signatureMovePolicy: 'Record the required experience outcome separately from candidate implementation moves; replace a candidate move when another move better fits the product.',
      libraryVisualLanguagePolicy: 'Libraries supply behavior, accessibility, primitives, and delivery speed; they must not dictate final composition, theme, morphology, or visual language.',
      literalAnchorPolicy: 'Translate anchors into workflow, hierarchy, density, typography, material behavior, state language, and interaction grammar before requiring literal props, marks, or chrome.',
      spatialMetaphorPolicy: 'Do not default anchors to room, darkroom, counting room, control room, war room, studio, lab, cockpit, or command center. Use place metaphors only when the product truly depends on a physical place model.',
      externalInspirationPolicy: 'External websites and examples are candidate evidence for constraints, mechanics, and quality bars; do not copy their layout rhythm, palette, component skin, brand posture, or visual metaphor.',
    },
    conceptualAnchor: buildConceptualAnchorSection(),
    researchDossier: {
      metadata: buildResearchDossierMetadata(),
      sourceFreshness: {
        status: 'agent-must-complete-before-ui-implementation',
        freshnessAnchorDate: 'session-current-date',
        rollingLookbackMonths: 24,
        officialDocsRequiredFor: [
          'browser-capability',
          'framework-setup',
          'ui-library',
          'animation-library',
          '3d-canvas-charting-library',
          'styling-tool',
          'accessibility-claim',
        ],
        sourceTypePolicy: {
          official: 'required for implementation and package/API claims when available',
          primary: 'preferred for product/studio/release claims',
          industry: 'allowed for trend discovery after fit filtering',
          opinion: 'advisory only; cannot lock design decisions alone',
          oldTimeless: 'allowed for durable principles only, not current-year modern claims',
          repoEvidence: 'highest authority for product constraints',
          userProvided: 'candidate evidence and concept constraint, not automatic final prescription',
        },
        evidenceTableRequiredFields: [
          'claim',
          'sourceUrl',
          'sourceType',
          'publishedOrUpdatedAt',
          'fetchedAt',
          'confidence',
          'decisionImpact',
        ],
        evidenceTable: [],
      },
    },
    derivedTokenLogic: {
      anchorReference: 'agent-defined-anchor-reference',
      colorDerivationSource: 'Explain semantic color roles from anchorReference; reject generic palettes without anchor evidence.',
      spacingDerivationSource: 'Explain spacing rhythm, density, and exceptions from anchorReference. Spacing grids are layout math, not decorative background lines.',
      typographyDerivationSource: 'Explain display, body, metadata, and data roles from anchorReference.',
      motionDerivationSource: 'Explain duration, easing, choreography, and reduced-motion from anchorReference.',
      colorSpace: 'Prefer OKLCH for newly generated CSS tokens when supported; preserve existing design-system token formats and document fallback color space.',
      spatialBaseUnit: 'Name the base spacing unit, major multiples, density exceptions, and optical exceptions before writing spacing values.',
      typeScaleMethod: 'Prefer fluid clamp() type scales when supported; name ratio, role contrast, balance/wrap behavior, and numeric typography needs.',
      motionBudget: 'Name micro, layout, entrance, easing, stagger, and reduced-motion budgets; prefer transform/opacity for high-frequency motion.',
      validationRule: 'Every semantic token role must trace to anchorReference; keep exact primitive values flexible unless locked by repo evidence, accessibility validation, implementation constraints, or explicit user approval.',
      tokenContinuityClassification: {
        typography: 'pending-research',
        palette: 'pending-research',
        motion: 'pending-research',
        spacing: 'pending-research',
        validValues: ['anchor-derived', 'continuity-retained', 'newly-introduced', 'pending-research'],
        rule: 'For each token category, classify whether the choice is anchor-derived (causally tied to anchorReference real-world reality), continuity-retained (kept from a previous design iteration without re-derivation), or newly-introduced (fresh choice not tied to anchor). Continuity-retained is acceptable; pretending continuity is derivation is not.',
      },
    },
    motionPaletteDecision: buildMotionPaletteDecisionSection(),
    aiSafeUiAudit: buildAiSafeUiAuditSection({ projectName }),
    productionContentPolicy: buildProductionContentPolicySection(),
    libraryResearchStatus: 'pending-verification',
    libraryDecisions: [
      {
        library: 'agent-defined-or-none',
        purpose: 'Select UI-related libraries dynamically from product fit, accessibility, interaction quality, maintenance, and current official docs before imports.',
        verifiedAt: null,
        sourceUrl: null,
        stableVersion: null,
        fallbackIfUnavailable: 'Use native CSS, browser APIs, or existing dependencies.',
        selectionPolicy: 'Do not default to shadcn, native-only, Tailwind-only, or dependency avoidance by habit; do not avoid them out of guardrail fear when they fit.',
        officialScaffolderPolicy: 'For fresh projects, prefer official setup commands when they create the supported project shape; manual assembly requires a documented repo, learning, prototype, or architecture reason.',
        frameworkNeutralityPolicy: 'Next.js, Vite, Astro, React Router, SvelteKit, Laravel, and plain HTML are candidates, not defaults or forbidden choices. Compare at least one plausible alternative when no framework is user-constrained, then choose the technology that removes bottlenecks for this project.',
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
      tokenLockingPolicy: {
        defaultLockState: 'semantic-roles-locked-primitives-flexible',
        lockedByDefault: ['semantic-role-purpose', 'accessibility-floor', 'state-role-meaning'],
        flexibleByDefault: ['exact-color-values', 'font-family', 'radius-values', 'shadow-values', 'component-skin'],
        promotionRule: 'Promote flexible tokens to locked only when user approval, repo evidence, accessibility validation, or implementation constraints require it.',
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
    accessibilityPolicy: buildAccessibilityPolicySection(),
    designExecutionPolicy: buildDesignExecutionPolicySection(),
    designExecutionHandoff: buildDesignExecutionHandoffSection({
      projectName,
      primaryDomain,
      mutationRules: inferredKeywords.mutationRules,
    }),
    reviewRubric: buildReviewRubricSection(),
    contextHygiene: buildContextHygieneSection(),
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
      'requireProductionContentPolicy',
      'requireAiColorAudit',
      'rejectAiColorDefaults',
      'requireMotionSpatialCourageAudit',
      'requireExplicit3dCanvasFitDecision',
      'rejectSafetyAsCreativitySubstitute',
      'rejectAiSafeUiTemplateLook',
      'requireThreeProductSpecificSignals',
      'rejectDecorativeBackgroundPatternsWithoutProductFunction',
      'rejectTestingDemoUiCopy',
      'rejectTerminalOnlyUserFlows',
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
        '.agent-context/prompts/research-design.md',
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

/**
 * Public schema index. Lists the field and signal names that this aggregator
 * is responsible for surfacing, so static validators can confirm the
 * aggregator declares the expected design contract surface in a single
 * grep-able location even after the implementation was split across
 * `design-contract/sections/*` files.
 *
 * Do not consume this array at runtime. It exists for the validate gate.
 */
export const __DESIGN_CONTRACT_SCHEMA_INDEX__ = Object.freeze([
  // top-level structural fields
  'tokenSystem',
  'seedPolicy',
  'structure-first-scaffold',
  'colorTruth',
  'motionPaletteDecision',
  'designFlexibilityPolicy',
  'crossViewportAdaptation',
  'motionSystem',
  'densitySource',
  'seedToneLocked',
  'componentMorphology',
  'seedBehaviorsRequireRefinement',
  'accessibilityPolicy',
  'designExecutionPolicy',
  'designExecutionHandoff',
  'reviewRubric',
  'contextHygiene',
  // ai-safe-ui audit fields
  'aiSafeUiAudit',
  'aiColorAudit',
  'motionSpatialCourageAudit',
  'requireAiColorAudit',
  'requireMotionSpatialCourageAudit',
  'requireAiSafeUiAudit',
  // genericity drift signals consumed by the rubric
  'ai-color-default-palette-without-product-role-behavior',
  'motion-or-3d-omitted-from-fear-without-fit-analysis',
  'ai-safe-ui-template-look',
  'interchangeable-product-renaming-test-fails',
  'decorative-grid-or-glow-wallpaper-without-product-function',
  'offline-prescribed-style-used-as-final-direction',
  'unresearched-library-or-framework-choice',
  'single-safe-typographic-family-without-role-contrast-or-rationale',
  'modern-library-rejected-from-dependency-fear-without-tradeoff-analysis',
  'component-library-selected-by-habit-without-product-fit',
  'official-docs-backed-modern-library-choice',
  // execution policy gates
  'separateRequiredOutcomesFromCandidateMoves',
  'forbidCandidateMovesAsLockedRequirements',
  'seedRefinementRequiredBeforeUiImplementation',
  'requirePerSurfaceMutationOps',
  'forbidUniformSiblingSurfaceTreatment',
  'requireStructuredHandoff',
  'handoffFormatVersion',
  'requireSurfacePlan',
  'requireComponentGraph',
  'requireViewportMutationPlan',
  'requireInteractionStateMatrix',
  'requireContentPriorityMap',
  'forbidScreenshotDependency',
  'semanticReviewFocus',
  'representationStrategy',
  // handoff payload fields
  'seedMode',
  'requiresTaskSpecificRefinement',
  'primaryExperienceGoal',
  'surfacePlan',
  'contentPriorityMap',
  'viewportMutationPlan',
  'interactionStateMatrix',
  'taskFlowNarrative',
  'signatureMoveRationale',
  'implementationGuardrails',
  'expressionFlexibility',
  // rubric fields
  'genericityAutoFail',
  'genericitySignals',
  'validBoldSignals',
  'mustExplainGenericity',
  'mustSeparateTasteFromFailure',
  // accessibility + reference policy
  'hardComplianceFloor',
  'advisoryContrastModel',
  'repoEvidenceOverridesMemory',
  'requireExplicitContinuityApproval',
  'forbidCarryoverWhenUnapproved',
  'approvedExternalConstraintUsage',
  'requireViewportMutationRules',
  'allowHexDerivatives',
  'forbidAutopilotPalettesWithoutEvidence',
  'rolesAreMinimumScaffold',
  // policy hooks consumed by tests + downstream tooling
  'literalTranslationPolicy',
  'spatialAutopilotPolicy',
  'externalWebsiteReferencePolicy',
  'manual-framework-scaffold-used-when-official-setup-fits',
]);
