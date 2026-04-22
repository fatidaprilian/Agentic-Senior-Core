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

function inferDesignKeywords(discoveryAnswers) {
  const normalizedDescription = String(discoveryAnswers.projectDescription || '').toLowerCase();
  const normalizedDomain = String(discoveryAnswers.primaryDomain || '').toLowerCase();
  const normalizedFeatures = Array.isArray(discoveryAnswers.features)
    ? discoveryAnswers.features.map((featureValue) => String(featureValue).toLowerCase()).join(' ')
    : '';
  const aggregateText = `${normalizedDescription} ${normalizedDomain} ${normalizedFeatures}`;

  if (aggregateText.includes('commerce') || aggregateText.includes('catalog') || aggregateText.includes('checkout')) {
    return {
      designPhilosophy: 'Conversion clarity with premium restraint.',
      brandAdjectives: ['clear', 'desirable', 'confident'],
      antiAdjectives: ['cluttered', 'hesitant', 'coupon-noisy'],
      typographyScaleRatio: '1.200',
      baseGridUnit: 8,
      densityMode: 'conversion-focused',
      colorIntent: 'Use a restrained neutral foundation with one controlled accent reserved for buying cues and trust moments.',
      distinctiveMoves: [
        'Use product hierarchy and buying cues without turning the interface into a discount template.',
        'Keep decision-critical information prominent while secondary merchandising stays quiet.',
        'Let imagery and spacing create premium perception before decorative effects do.',
      ],
      motionPurpose: 'Use motion to reinforce buying confidence, product continuity, and premium delight. It may be theatrical at key moments if it stays fast, legible, and supportive of decision-making.',
      motionChoreography: 'Favor fast hover and focus feedback, confident sheet choreography, product-media continuity, and one or two signature reveal moments. Avoid autoplay spectacle that distracts from purchase decisions.',
      motionDurations: {
        desktop: 180,
        mobile: 240,
      },
      componentMorphology: {
        mobile: 'Product cards should compress supporting metadata, pin purchase actions closer to the thumb zone, and move comparison into progressive disclosure or bottom sheets.',
        tablet: 'Cards and merch modules should preserve comparison affordances while reducing tertiary chrome and keeping visual hierarchy stable.',
        desktop: 'Cards can expand media, comparison, and reassurance copy while keeping buying cues dominant and visually disciplined.',
      },
      mutationRules: {
        mobile: 'Convert browsing into vertically stacked product cards, move cart and filter actions into sticky or bottom-sheet patterns, and keep thumb-reach actions persistent.',
        tablet: 'Preserve browsing flow with a two-column rhythm, collapse tertiary filters, and keep comparison moments visible without forcing desktop density.',
        desktop: 'Expose multi-column merchandising, comparison views, and richer product context while keeping the purchase path visually dominant.',
      },
    };
  }

  if (aggregateText.includes('dashboard') || aggregateText.includes('operations') || aggregateText.includes('report')) {
    return {
      designPhilosophy: 'Operational calm under high information density.',
      brandAdjectives: ['calm', 'precise', 'trustworthy'],
      antiAdjectives: ['chaotic', 'gimmicky', 'visually exhausting'],
      typographyScaleRatio: '1.125',
      baseGridUnit: 4,
      densityMode: 'high-density-scanning',
      colorIntent: 'Use neutrals for structure and reserve accent saturation for status shifts, risky actions, and alerts.',
      distinctiveMoves: [
        'Prioritize scanning clarity and status recognition over decorative density.',
        'Use visual weight to separate signal from operational noise.',
        'Reserve strong accents for alerts, decisions, and state transitions only.',
      ],
      motionPurpose: 'Use motion as operational feedback and state continuity, while still allowing decisive state transitions that make dense workflows feel alive and controlled.',
      motionChoreography: 'Prefer fast transitions for filters, drawers, status reveals, and row expansion, but allow strong confirmation moments when they improve confidence and scan clarity.',
      motionDurations: {
        desktop: 160,
        mobile: 220,
      },
      componentMorphology: {
        mobile: 'Data rows should become prioritized cards or grouped summaries, with filters and secondary tools moving into sheets or drawers.',
        tablet: 'Operational panels should retain split-view logic where possible, while tertiary panels collapse behind explicit toggles.',
        desktop: 'Dense tables, side panels, and comparison surfaces can remain visible simultaneously, with state treatments optimized for rapid scanning.',
      },
      mutationRules: {
        mobile: 'Collapse dense tables into prioritized cards or row groups, move filters into drawers or sheets, and pin the most critical actions to the bottom reach zone.',
        tablet: 'Keep two-column or split-pane workflows, collapse tertiary panels, and maintain fast scan paths for operators using touch or keyboard.',
        desktop: 'Expose the highest-density views with visible navigation, comparison surfaces, and simultaneous context panels for power users.',
      },
    };
  }

  if (aggregateText.includes('developer') || aggregateText.includes('api') || aggregateText.includes('platform')) {
    return {
      designPhilosophy: 'Technical precision with explicit structure and honest feedback.',
      brandAdjectives: ['precise', 'technical', 'transparent'],
      antiAdjectives: ['vague', 'marketing-heavy', 'template-polished'],
      typographyScaleRatio: '1.125',
      baseGridUnit: 4,
      densityMode: 'technical-utility',
      colorIntent: 'Anchor the interface in disciplined neutrals and use accent color only where state, feedback, or code-adjacent interaction needs emphasis.',
      distinctiveMoves: [
        'Make structure and feedback feel exact without becoming sterile.',
        'Use code-adjacent rhythm and hierarchy to build trust with technical users.',
        'Keep complexity legible through spacing, grouping, and explicit interaction states.',
      ],
      motionPurpose: 'Use motion to clarify causality, reveal system state, preserve context, and give technical workflows a sense of precision instead of dead stillness.',
      motionChoreography: 'Prefer sharp panel transitions, command feedback, disclosure motion, and occasional signature transitions that feel exact rather than ornamental.',
      motionDurations: {
        desktop: 170,
        mobile: 230,
      },
      componentMorphology: {
        mobile: 'Technical panes should flatten into sequential sections, with commands and diagnostics colocated near the content they affect.',
        tablet: 'Split views should survive where useful, with explicit panel toggles and condensed chrome for code-adjacent tasks.',
        desktop: 'Navigation, documentation, diagnostics, and active work surfaces can remain concurrently visible when it improves expert comprehension.',
      },
      mutationRules: {
        mobile: 'Switch multi-pane technical layouts into stacked sections, turn secondary navigation into segmented or sheet-based controls, and keep commands near the content they affect.',
        tablet: 'Retain split-view comprehension where possible, compress chrome, and keep documentation or diagnostics adjacent to the active task.',
        desktop: 'Expose full navigation, dense comparison surfaces, and multi-pane workflows for expert scanning and debugging.',
      },
    };
  }

  if (aggregateText.includes('content') || aggregateText.includes('community') || aggregateText.includes('publish')) {
    return {
      designPhilosophy: 'Editorial flow with warm but controlled expression.',
      brandAdjectives: ['editorial', 'warm', 'expressive'],
      antiAdjectives: ['flat', 'anonymous', 'feed-generic'],
      typographyScaleRatio: '1.200',
      baseGridUnit: 8,
      densityMode: 'reading-first',
      colorIntent: 'Let typography and surface contrast lead while chroma supports hierarchy and key participation actions.',
      distinctiveMoves: [
        'Build a strong reading rhythm so content feels curated rather than dumped into cards.',
        'Use contrast and spacing to guide attention between creation, moderation, and discovery.',
        'Give key interaction moments personality without sacrificing clarity.',
      ],
      motionPurpose: 'Use motion to support reading rhythm, reveal structure, and reward contribution moments with visible craft, not generic restraint.',
      motionChoreography: 'Favor reveal choreography for section transitions, expressive but measured feedback on participation, and media behavior that feels alive without becoming noisy.',
      motionDurations: {
        desktop: 190,
        mobile: 250,
      },
      componentMorphology: {
        mobile: 'Reading surfaces should dominate while secondary discovery and community tools collapse behind sheets, tabs, or segmented controls.',
        tablet: 'Editorial modules can balance reading and discovery, provided the primary narrative flow remains obvious.',
        desktop: 'Long-form content, secondary navigation, and related discovery modules can coexist without fragmenting the reading rhythm.',
      },
      mutationRules: {
        mobile: 'Prioritize reading and contribution flows in a single-column narrative stack, tuck secondary discovery tools behind sheets, and keep primary creation actions within reach.',
        tablet: 'Balance narrative reading with supporting discovery modules, using two-column compositions only where hierarchy stays obvious.',
        desktop: 'Use wider editorial compositions, visible secondary navigation, and modular discovery surfaces without breaking reading rhythm.',
      },
    };
  }

  return {
    designPhilosophy: 'Project-specific clarity with one authored tension and one memorable visual bet.',
    brandAdjectives: ['clear', 'human', 'distinct'],
    antiAdjectives: ['generic', 'template-like', 'trend-chasing'],
    typographyScaleRatio: '1.200',
    baseGridUnit: 8,
    densityMode: 'balanced-authored',
    colorIntent: 'Use a restrained perceptual palette with one deliberate accent budget instead of interchangeable template colors.',
    distinctiveMoves: [
      'Create a visual direction with one memorable tension instead of stacking fashionable effects.',
      'Use rhythm, hierarchy, and motion intentionally so the interface feels authored.',
      'Keep the system flexible enough to evolve with product scope without losing identity.',
    ],
    motionPurpose: 'Allow motion to create continuity, feedback, perceived craft, and memorability. Optimize bold choreography instead of defaulting to restraint. Reject only motion that harms comprehension, accessibility, or runtime performance.',
    motionChoreography: 'Use fast purposeful transitions for most interactions, but allow a small number of signature transitions or reveal moments when they strengthen product identity and remain technically cheap.',
    motionDurations: {
      desktop: 180,
      mobile: 240,
    },
    componentMorphology: {
      mobile: 'Primary components should simplify structure, prioritize direct tasks, and collapse supporting detail into explicit disclosure.',
      tablet: 'Components should preserve hierarchy and task continuity while reducing density and compressing tertiary chrome.',
      desktop: 'Components can expose richer states, denser supporting information, and broader navigation affordances without losing clarity.',
    },
    mutationRules: {
      mobile: 'Stack primary tasks vertically, convert secondary navigation into thumb-friendly overlays or sheets, and simplify dense comparison layouts into progressive disclosure.',
      tablet: 'Preserve hierarchy with fewer columns, condensed chrome, and adaptive navigation that maintains task continuity.',
      desktop: 'Expose the full layout system, highest information density, and broadest navigation affordances without sacrificing clarity.',
    },
  };
}

function buildDesignIntentContractObject({
  projectName,
  projectDescription,
  primaryDomain,
  features = [],
  initContext,
  architectureRecommendation = null,
  status = 'seed-needs-design-synthesis',
  supplementalFields = {},
}) {
  const inferredKeywords = inferDesignKeywords({
    projectDescription,
    primaryDomain,
    features,
  });
  const normalizedPrimaryDomain = String(primaryDomain || '').trim().toLowerCase();
  const resolvedSpacingPattern = inferredKeywords.densityMode === 'dense'
    ? 'compact-grid'
    : normalizedPrimaryDomain.includes('mobile')
      ? 'mobile-first-single-axis'
      : inferredKeywords.densityMode === 'focused'
        ? 'high-contrast-rhythm'
        : 'balanced-grid';

  return {
    mode: 'dynamic',
    status,
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
      trendStance: 'trend-aware-not-trend-chasing',
      distinctiveMoves: inferredKeywords.distinctiveMoves,
      copiedReferenceAllowed: false,
    },
    mathSystems: {
      typographyScaleRatio: inferredKeywords.typographyScaleRatio,
      baseGridUnit: inferredKeywords.baseGridUnit,
      spacingPattern: resolvedSpacingPattern,
      densityMode: inferredKeywords.densityMode,
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
      paletteRoles: ['base', 'surface', 'accent'],
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
      respectReducedMotion: true,
      preferTransformAndOpacity: true,
      avoidDecorativeMotionForItsOwnSake: true,
    },
    componentMorphology: {
      requireStateBehaviorMatrix: true,
      preserveIdentityAcrossViewports: true,
      stateKeys: ['default', 'hover', 'focus', 'active', 'disabled', 'loading', 'error'],
      viewportBehavior: inferredKeywords.componentMorphology,
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
  architectureRecommendation = null,
  status = 'seed-needs-design-synthesis',
  supplementalFields = {},
}) {
  const designIntentContract = buildDesignIntentContractObject({
    projectName,
    projectDescription,
    primaryDomain,
    features,
    initContext,
    architectureRecommendation,
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
  architectureRecommendation,
}) {
  return buildDesignIntentSeedFromSignals({
    projectName: discoveryAnswers.projectName,
    projectDescription: discoveryAnswers.projectDescription,
    primaryDomain: discoveryAnswers.primaryDomain,
    features: discoveryAnswers.features,
    initContext,
    architectureRecommendation,
    status: 'seed-needs-design-synthesis',
  });
}
