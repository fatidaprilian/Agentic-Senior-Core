/**
 * Project Scaffolder — Dynamic project documentation generator.
 * Generates project-specific docs during init when the target folder is empty.
 * Depends on: constants.mjs, utils.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import { ensureDirectory, askChoice, askYesNo, toTitleCase, pathExists } from './utils.mjs';

const SUPPORTED_DOC_LANGUAGES = new Set(['en', 'id']);
const PROJECT_DOC_FILE_NAMES = [
  'project-brief.md',
  'architecture-decision-record.md',
  'database-schema.md',
  'api-contract.md',
  'flow-overview.md',
];
const UI_DESIGN_CONTRACT_FILE_NAMES = ['DESIGN.md', 'design-intent.json'];

// Legacy project docs may still carry this version header; keep for upgrade staleness checks.
export const PROJECT_DOC_TEMPLATE_VERSION = '1.2.0';
export const PROJECT_DOC_SYNTHESIS_PROMPT_VERSION = '2.0.0';

const DOMAIN_CHOICES = [
  'API service',
  'Web application',
  'Mobile app',
  'CLI tool',
  'Library / SDK',
  'Other',
];

const DATABASE_CHOICES = [
  'None (stateless service)',
  'SQL (PostgreSQL, MySQL, SQLite)',
  'NoSQL (MongoDB, Redis, DynamoDB)',
  'Both (SQL primary + cache layer)',
  'Other',
];

const AUTH_CHOICES = [
  'None (public service)',
  'JWT (stateless token auth)',
  'OAuth 2.0 (third-party login)',
  'Session-based (server-side sessions)',
  'API Key (simple key auth)',
  'Other',
];

const DOCKER_STRATEGY_CHOICES = [
  'No Docker (run services directly)',
  'Docker for development only',
  'Docker for production only',
  'Docker for both development and production',
];

function parseBooleanLikeValue(rawValue) {
  const normalizedValue = String(rawValue || '').trim().toLowerCase();
  if (['true', 'yes', 'y', '1'].includes(normalizedValue)) {
    return true;
  }

  if (['false', 'no', 'n', '0'].includes(normalizedValue)) {
    return false;
  }

  return null;
}

function resolveDockerStrategy({ dockerStrategy, useDocker, useDockerDevelopment, useDockerProduction }) {
  if (typeof dockerStrategy === 'string' && dockerStrategy.trim().length > 0) {
    const normalizedDockerStrategy = dockerStrategy.trim().toLowerCase();
    const directMatch = DOCKER_STRATEGY_CHOICES.find(
      (dockerStrategyChoice) => dockerStrategyChoice.toLowerCase() === normalizedDockerStrategy
    );

    if (directMatch) {
      return directMatch;
    }
  }

  const normalizedUseDocker = typeof useDocker === 'boolean' ? useDocker : parseBooleanLikeValue(useDocker);
  const normalizedUseDockerDevelopment = typeof useDockerDevelopment === 'boolean'
    ? useDockerDevelopment
    : parseBooleanLikeValue(useDockerDevelopment);
  const normalizedUseDockerProduction = typeof useDockerProduction === 'boolean'
    ? useDockerProduction
    : parseBooleanLikeValue(useDockerProduction);

  if (normalizedUseDocker === false) {
    return DOCKER_STRATEGY_CHOICES[0];
  }

  if (normalizedUseDockerDevelopment === true && normalizedUseDockerProduction === true) {
    return DOCKER_STRATEGY_CHOICES[3];
  }

  if (normalizedUseDockerDevelopment === true && normalizedUseDockerProduction !== true) {
    return DOCKER_STRATEGY_CHOICES[1];
  }

  if (normalizedUseDockerProduction === true && normalizedUseDockerDevelopment !== true) {
    return DOCKER_STRATEGY_CHOICES[2];
  }

  if (normalizedUseDocker === true) {
    return DOCKER_STRATEGY_CHOICES[3];
  }

  return DOCKER_STRATEGY_CHOICES[0];
}

async function askFeatureList(userInterface) {
  console.log('\nList your key features (one per line, press Enter to finish):');

  const features = [];
  while (features.length < 10) {
    const featureLine = (await userInterface.question(`  Feature ${features.length + 1}: `)).trim();
    if (!featureLine) {
      break;
    }

    features.push(featureLine);
  }

  return features;
}

export function normalizeDocsLanguage(rawDocsLanguage = 'en') {
  const normalizedDocsLanguage = String(rawDocsLanguage || 'en').trim().toLowerCase();
  return SUPPORTED_DOC_LANGUAGES.has(normalizedDocsLanguage) ? normalizedDocsLanguage : null;
}

/**
 * Run the project discovery interview.
 * Returns a structured object with all user responses.
 */
export async function runProjectDiscovery(userInterface, options = {}) {
  console.log('\n--- Project Setup ---');
  console.log('I will ask one focused set of questions to bootstrap project context and documentation.');
  console.log('This helps AI agents understand your project before writing code.\n');
  console.log('You can answer in your own language.');
  console.log('CLI prompts stay in English, but non-English answers are fully supported.\n');

  const defaultProjectName = (options.defaultProjectName || '').trim();
  const defaultProjectDescription = String(options.defaultProjectDescription || '').trim();
  const defaultIncludeCiGuardrails = typeof options.defaultIncludeCiGuardrails === 'boolean'
    ? options.defaultIncludeCiGuardrails
    : true;
  const shouldAskForCiGuardrails = options.askForCiGuardrails !== false;
  let projectName = '';

  const projectNamePrompt = defaultProjectName
    ? `Project name (press Enter to use folder name: ${defaultProjectName}): `
    : 'Project name: ';

  projectName = (await userInterface.question(projectNamePrompt)).trim();

  if (!projectName && defaultProjectName) {
    projectName = defaultProjectName;
  }

  if (!projectName) {
    throw new Error('Project name is required for documentation scaffolding.');
  }

  const projectDescriptionPrompt = defaultProjectDescription
    ? `One-line description (press Enter to use: ${defaultProjectDescription}): `
    : 'One-line description: ';

  let projectDescription = (await userInterface.question(projectDescriptionPrompt)).trim();

  if (!projectDescription) {
    projectDescription = defaultProjectDescription || `A ${projectName} project.`;
  }

  const includeCiGuardrails = shouldAskForCiGuardrails
    ? await askYesNo(
      'Enable CI/CD quality checks (guardrails) and the LLM Judge policy?',
      userInterface,
      defaultIncludeCiGuardrails
    )
    : defaultIncludeCiGuardrails;

  const domainSelection = await askChoice(
    'Primary domain:',
    DOMAIN_CHOICES,
    userInterface
  );

  let primaryDomain = domainSelection;
  if (domainSelection === 'Other') {
    primaryDomain = (await userInterface.question('Describe your domain: ')).trim() || 'Custom domain';
  }

  const databaseSelection = await askChoice(
    'Database needs:',
    DATABASE_CHOICES,
    userInterface
  );

  let databaseChoice = databaseSelection;
  if (databaseSelection === 'Other') {
    databaseChoice = (await userInterface.question('Describe your database setup: ')).trim() || 'Custom database';
  }

  const authSelection = await askChoice(
    'Auth strategy:',
    AUTH_CHOICES,
    userInterface
  );

  let authStrategy = authSelection;
  if (authSelection === 'Other') {
    authStrategy = (await userInterface.question('Describe your auth setup: ')).trim() || 'Custom auth';
  }

  const dockerStrategy = await askChoice(
    'Containerization strategy:',
    DOCKER_STRATEGY_CHOICES,
    userInterface
  );

  const features = await askFeatureList(userInterface);

  return {
    projectName,
    projectDescription,
    includeCiGuardrails,
    primaryDomain,
    databaseChoice,
    authStrategy,
    dockerStrategy,
    features,
    additionalContext: 'No additional context provided.',
  };
}

/**
 * Determine required docs based on project discovery answers.
 */
export function resolveProjectDocTargets(discoveryAnswers) {
  const hasDatabase = !discoveryAnswers.databaseChoice.toLowerCase().startsWith('none');
  const isApiOrWebDomain = ['API service', 'Web application'].includes(discoveryAnswers.primaryDomain)
    || discoveryAnswers.primaryDomain.toLowerCase().includes('api')
    || discoveryAnswers.primaryDomain.toLowerCase().includes('web');

  const requiredDocFileNames = [
    'project-brief.md',
    'architecture-decision-record.md',
    'flow-overview.md',
  ];

  if (hasDatabase) {
    requiredDocFileNames.push('database-schema.md');
  }

  if (isApiOrWebDomain) {
    requiredDocFileNames.push('api-contract.md');
  }

  return { requiredDocFileNames };
}

/**
 * Build synthesis context from discovery answers and init selections.
 */
export function buildSynthesisContext(_discoveryAnswers, initContext) {
  const additionalStackFileNames = Array.isArray(initContext.additionalStackFileNames)
    ? initContext.additionalStackFileNames
    : [];
  const additionalBlueprintFileNames = Array.isArray(initContext.additionalBlueprintFileNames)
    ? initContext.additionalBlueprintFileNames
    : [];

  return {
    stackFileName: initContext.stackFileName,
    additionalStackFileNames,
    blueprintFileName: initContext.blueprintFileName,
    additionalBlueprintFileNames,
    runtimeEnvironmentKey: initContext.runtimeEnvironmentKey || 'linux',
    runtimeEnvironmentLabel: initContext.runtimeEnvironmentLabel || 'Linux',
  };
}

function shouldBootstrapDesignDocument(discoveryAnswers, initContext) {
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

const DESIGN_REQUIRED_SECTIONS = [
  'Design Intent and Product Personality',
  'Audience and Use-Context Signals',
  'Visual Direction and Distinctive Moves',
  'Color Science and Semantic Roles',
  'Typographic Engineering and Hierarchy',
  'Spacing, Layout Rhythm, and Density Strategy',
  'Responsive Strategy and Cross-Viewport Adaptation Matrix',
  'Interaction, Motion, and Feedback Rules',
  'Component Language, Morphology, and Shared Patterns',
  'Accessibility Non-Negotiables',
  'Anti-Patterns to Avoid',
  'Implementation Notes for Future UI Tasks',
];

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
      motionPurpose: 'Use restrained motion to reinforce buying confidence, product continuity, and feedback. Motion should feel premium, not promotional.',
      motionChoreography: 'Favor short hover/focus transitions, sheet choreography, and product-media continuity. Avoid looping hero motion, autoplay spectacle, and parallax-heavy scenes.',
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
      motionPurpose: 'Use motion as operational feedback and state continuity, never as ambient decoration that competes with dense information.',
      motionChoreography: 'Prefer fast transitions for filters, drawers, status reveals, and row expansion. Avoid floaty choreography and ornamental motion that slows scanning.',
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
      motionPurpose: 'Use motion to clarify causality, reveal system state, and preserve context during multi-pane technical workflows.',
      motionChoreography: 'Prefer subtle panel transitions, command feedback, and disclosure motion. Avoid ornamental sweeps that make technical work feel imprecise.',
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
      motionPurpose: 'Use motion to support reading rhythm, reveal structure, and reward contribution moments without overwhelming long-form consumption.',
      motionChoreography: 'Favor reveal choreography for section transitions, lightweight feedback on participation, and measured media behavior. Avoid constant background motion.',
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
    designPhilosophy: 'Project-specific clarity with one authored tension.',
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
    motionPurpose: 'Allow motion when it improves continuity, feedback, or perceived craft. Avoid banning motion outright, but reject decorative movement with no product value.',
    motionChoreography: 'Use short, purposeful transitions and keep heavier choreography rare, opt-in, and explainable in product terms.',
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
      'Motion may add character and continuity when it improves the product experience, but it must stay purposeful, performant, and optional for reduced-motion users.',
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
      allowHexDerivatives: true,
      requireMotionRationale: true,
      requireStateMorphology: true,
    },
    requiredDesignSections: DESIGN_REQUIRED_SECTIONS,
    implementation: {
      requiredDeliverables: ['docs/DESIGN.md', 'docs/design-intent.json'],
      requireDesignRationale: true,
      requireDistinctVisualDirection: true,
      requireMachineReadableContract: true,
      requireViewportMutationRules: true,
      requirePurposefulMotionGuidelines: true,
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

function buildDesignIntentSeed({
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

function buildProjectContextBootstrapPrompt({
  discoveryAnswers,
  initContext,
  expectedDocFileNames,
  docsLanguage,
  architectureRecommendation,
}) {
  const featuresList = Array.isArray(discoveryAnswers.features) && discoveryAnswers.features.length > 0
    ? discoveryAnswers.features.map((feature, featureIndex) => `${featureIndex + 1}. ${feature}`).join('\n')
    : 'Derive the first concrete feature set from the project name, description, and domain. Do not invent arbitrary modules just to fill space.';

  const expectedDocsList = expectedDocFileNames
    .map((fileName, fileIndex) => `${fileIndex + 1}. docs/${fileName}`)
    .join('\n');

  const architectureSnapshot = architectureRecommendation
    ? JSON.stringify({
      stack: architectureRecommendation.recommendedStackFileName,
      blueprint: architectureRecommendation.recommendedBlueprintFileName,
      confidenceLabel: architectureRecommendation.confidenceLabel,
      confidenceScore: architectureRecommendation.confidenceScore,
      research: architectureRecommendation.research,
      evidenceCitations: architectureRecommendation.evidenceCitations,
      designGuidance: architectureRecommendation.designGuidance,
    }, null, 2)
    : 'null';

  return [
    '# Bootstrap Prompt: Dynamic Project Context Synthesis',
    '',
    `Protocol version: ${PROJECT_DOC_SYNTHESIS_PROMPT_VERSION}`,
    '',
    'You are a Lead Solution Architect and Principal Engineer.',
    'Write project context docs from scratch (no template rendering, no placeholder boilerplate).',
    '',
    '## Mission',
    `Create or update these files in ${docsLanguage.toUpperCase()} language:`,
    expectedDocsList,
    '',
    '## Hard Rules',
    '1. No copy-paste from external prose.',
    '2. Every major section must explain rationale and tradeoffs.',
    '3. Keep stack, database, and auth aligned with the project constraints below unless user explicitly requests migration.',
    '4. Output must be implementation-ready for engineers, not generic textbook explanation.',
    '5. For any research-backed claim, include citation metadata (source + fetchedAt timestamp) from the Architect Engine Snapshot.',
    '6. Write for native English speakers at an 8th-grade reading level. Use clear, direct, plain language.',
    '7. Avoid emoji, AI cliches, buzzwords, academic phrasing, padding, and generic filler.',
    '8. Separate confirmed facts from assumptions explicitly. When context is incomplete, add an `Assumptions to Validate` section and a `Next Validation Action` line.',
    '9. If user inputs conflict with repo evidence, call out the conflict and choose the safer interpretation instead of silently forcing a generic answer.',
    '10. Do not invent modules or architecture layers only to make the docs look complete.',
    '',
    '## Project Inputs',
    `- Project name: ${discoveryAnswers.projectName}`,
    `- Project description: ${discoveryAnswers.projectDescription}`,
    `- Primary domain: ${discoveryAnswers.primaryDomain}`,
    `- Database strategy: ${discoveryAnswers.databaseChoice}`,
    `- Auth strategy: ${discoveryAnswers.authStrategy}`,
    `- Docker strategy: ${discoveryAnswers.dockerStrategy}`,
    `- Runtime environment: ${initContext.runtimeEnvironmentLabel || initContext.runtimeEnvironmentKey || 'Linux'}`,
    `- Selected stack: ${toTitleCase(initContext.stackFileName)}`,
    `- Selected blueprint: ${toTitleCase(initContext.blueprintFileName)}`,
    `- Additional stacks: ${Array.isArray(initContext.additionalStackFileNames) && initContext.additionalStackFileNames.length > 0 ? initContext.additionalStackFileNames.map((stackFileName) => toTitleCase(stackFileName)).join(', ') : 'none'}`,
    `- Additional blueprints: ${Array.isArray(initContext.additionalBlueprintFileNames) && initContext.additionalBlueprintFileNames.length > 0 ? initContext.additionalBlueprintFileNames.map((blueprintFileName) => toTitleCase(blueprintFileName)).join(', ') : 'none'}`,
    '',
    '## Key Features',
    featuresList,
    '',
    '## Additional Context',
    discoveryAnswers.additionalContext || 'No additional context provided.',
    '',
    '## Architect Engine Snapshot (for grounding)',
    '```json',
    architectureSnapshot,
    '```',
    '',
    '## Required Execution',
    '1. Create all required docs files listed above with complete Markdown content.',
    '2. Make the docs adaptive to the real repo and prompt context. These are living references, not frozen templates.',
    '3. In docs/project-brief.md and docs/architecture-decision-record.md, include explicit sections for confirmed facts, assumptions to validate, and next validation actions whenever context is incomplete.',
    '4. Keep content original, specific to this project, and actionable for implementation.',
    '5. After writing docs, continue coding tasks using these docs as living project context.',
    '',
  ].join('\n');
}

function buildDesignBootstrapPrompt({
  discoveryAnswers,
  initContext,
  docsLanguage,
  architectureRecommendation,
}) {
  const designIntentSeed = buildDesignIntentSeed({
    discoveryAnswers,
    initContext,
    architectureRecommendation,
  });

  return [
    '# Bootstrap Prompt: Dynamic Design Contract Synthesis',
    '',
    `Protocol version: ${PROJECT_DOC_SYNTHESIS_PROMPT_VERSION}`,
    '',
    'You are the Lead UI/UX Art Director for this project.',
    'Create a dynamic design contract, not a fixed stylistic template.',
    '',
    '## Mission',
    `Author docs/DESIGN.md in ${docsLanguage.toUpperCase()} language with strong art direction and engineering-ready guidance.`,
    'Keep docs/design-intent.json synchronized as the machine-readable source of design intent.',
    '',
    '## Deliverables',
    '1. docs/DESIGN.md',
    '2. docs/design-intent.json',
    '',
    '## Required DESIGN.md Sections',
    '1. Design Vision and Product Personality',
    '2. Audience and Use-Context Signals',
    '3. Visual Direction and Distinctive Moves',
    '4. Color Science and Semantic Roles',
    '5. Typographic Engineering and Hierarchy',
    '6. Spacing, Layout Rhythm, and Density Strategy',
    '7. Responsive Strategy and Cross-Viewport Adaptation Matrix',
    '8. Motion and Interaction Principles',
    '9. Component Language and Morphology (cards, forms, nav, states)',
    '10. Accessibility Non-Negotiables',
    '11. Anti-Patterns to Avoid',
    '12. Implementation Notes for Future UI Tasks',
    '',
    '## Required design-intent.json Fields',
    '1. mode',
    '2. status',
    '3. project',
    '4. designPhilosophy',
    '5. brandAdjectives',
    '6. antiAdjectives',
    '7. visualDirection',
    '8. mathSystems',
    '9. colorTruth',
    '10. crossViewportAdaptation',
    '11. motionSystem',
    '12. componentMorphology',
    '13. experiencePrinciples',
    '14. forbiddenPatterns',
    '15. validationHints',
    '16. requiredDesignSections',
    '17. implementation',
    '',
    '## Hard Rules',
    '1. No copy-paste from external style guides.',
    '2. Every major decision must include psychological/product rationale.',
    '3. Keep implementation feasible for the selected stack and blueprint.',
    '4. Keep tone decisive like an art director, not generic AI boilerplate.',
    '5. Do not anchor the final design language to a famous brand reference. Translate inspiration into original project-specific principles.',
    '6. Reject interchangeable hero layouts, generic SaaS gradients, and trend-chasing decoration unless the project context explicitly justifies them.',
    '7. Encode color intent in perceptual terms first. Hex values may exist only as implementation derivatives.',
    '8. Responsive guidance must include layout mutation rules for mobile, tablet, and desktop. Shrinking the desktop layout is not enough.',
    '9. Motion is allowed when it reinforces feedback, continuity, or hierarchy. Do not remove motion entirely, but reject decorative motion that harms clarity or performance.',
    '10. Define component morphology across interaction states and viewports so cards, forms, nav, and feedback surfaces adapt coherently instead of only resizing.',
    '11. Keep UI-only requests context-isolated. Load frontend design rules first and do not eagerly load backend-only rules unless the task explicitly crosses those boundaries.',
    '',
    '## Project Inputs',
    `- Project name: ${discoveryAnswers.projectName}`,
    `- Product context: ${discoveryAnswers.projectDescription}`,
    `- Domain: ${discoveryAnswers.primaryDomain}`,
    `- Stack: ${toTitleCase(initContext.stackFileName)}`,
    `- Blueprint: ${toTitleCase(initContext.blueprintFileName)}`,
    '',
    '## Seed Machine Contract',
    'Refine this seed instead of discarding it. Keep the final JSON aligned with the markdown design system.',
    '```json',
    designIntentSeed.trim(),
    '```',
    '',
    '## Required Execution',
    '1. Create or update docs/DESIGN.md with complete content.',
    '2. Create or update docs/design-intent.json with machine-readable design intent.',
    '3. Ensure both files stay project-specific, dynamic, and practical for implementation and review.',
    '4. After the contract exists, use it as a first-class source for future UI tasks.',
    '',
  ].join('\n');
}

/**
 * Generate AI-first bootstrap prompts for dynamic project documentation synthesis.
 */
export async function generateProjectDocumentation(
  targetDirectoryPath,
  discoveryAnswers,
  initContext,
  options = {}
) {
  const normalizedDocsLanguage = normalizeDocsLanguage(options.docsLanguage || 'en');
  if (!normalizedDocsLanguage) {
    throw new Error(`Unsupported docs language: ${options.docsLanguage}. Supported values: en, id`);
  }

  const docsDirectoryPath = path.join(targetDirectoryPath, 'docs');
  const promptsDirectoryPath = path.join(targetDirectoryPath, '.agent-context', 'prompts');
  await ensureDirectory(docsDirectoryPath);
  await ensureDirectory(promptsDirectoryPath);

  const synthesisContext = buildSynthesisContext(discoveryAnswers, initContext);
  const { requiredDocFileNames } = resolveProjectDocTargets(discoveryAnswers);
  const expectedDocFileNames = [...requiredDocFileNames];
  const generatedPromptFileNames = [];
  const materializedFileNames = [];

  const projectContextPromptFileName = 'bootstrap-project-context.md';
  const architectureRecommendation = initContext.architectureRecommendation || null;
  const projectContextPromptContent = buildProjectContextBootstrapPrompt({
    discoveryAnswers,
    initContext: synthesisContext,
    expectedDocFileNames,
    docsLanguage: normalizedDocsLanguage,
    architectureRecommendation,
  });
  await fs.writeFile(
    path.join(promptsDirectoryPath, projectContextPromptFileName),
    projectContextPromptContent,
    'utf8'
  );
  generatedPromptFileNames.push(projectContextPromptFileName);

  if (shouldBootstrapDesignDocument(discoveryAnswers, initContext)) {
    const designPromptFileName = 'bootstrap-design.md';
    const designPromptContent = buildDesignBootstrapPrompt({
      discoveryAnswers,
      initContext: synthesisContext,
      docsLanguage: normalizedDocsLanguage,
      architectureRecommendation,
    });
    await fs.writeFile(path.join(promptsDirectoryPath, designPromptFileName), designPromptContent, 'utf8');
    generatedPromptFileNames.push(designPromptFileName);

    const designIntentSeedFileName = 'design-intent.json';
    const designIntentSeedContent = buildDesignIntentSeed({
      discoveryAnswers,
      initContext: synthesisContext,
      architectureRecommendation,
    });
    await fs.writeFile(path.join(docsDirectoryPath, designIntentSeedFileName), designIntentSeedContent, 'utf8');
    materializedFileNames.push(designIntentSeedFileName);

    for (const designContractFileName of UI_DESIGN_CONTRACT_FILE_NAMES) {
      if (!expectedDocFileNames.includes(designContractFileName)) {
        expectedDocFileNames.push(designContractFileName);
      }
    }
  }

  return {
    docsDirectoryPath,
    generatedFileNames: expectedDocFileNames,
    generatedPromptFileNames,
    materializedFileNames,
    bootstrapMode: 'ai-synthesis',
    synthesisPromptVersion: PROJECT_DOC_SYNTHESIS_PROMPT_VERSION,
    templateVersion: PROJECT_DOC_TEMPLATE_VERSION,
    docsLanguage: normalizedDocsLanguage,
    discoveryAnswers,
  };
}

/**
 * Check if the target directory qualifies as "empty" for scaffolding purposes.
 * A directory with only .git is still considered empty.
 */
export async function isDirectoryEffectivelyEmpty(targetDirectoryPath) {
  try {
    const directoryEntries = await fs.readdir(targetDirectoryPath);
    const meaningfulEntries = directoryEntries.filter(
      (entryName) => entryName !== '.git' && entryName !== '.gitignore'
    );
    return meaningfulEntries.length === 0;
  } catch {
    return true;
  }
}

/**
 * Check if project docs already exist in the target directory.
 */
export async function hasExistingProjectDocs(targetDirectoryPath) {
  const projectBriefPath = path.join(targetDirectoryPath, 'docs', 'project-brief.md');
  return pathExists(projectBriefPath);
}

function extractTemplateVersion(documentContent) {
  const templateVersionMatch = documentContent.match(/^(?:Template version|Versi template):\s*(.+)$/im);
  return templateVersionMatch ? templateVersionMatch[1].trim() : null;
}

export async function detectProjectDocTemplateStaleness(targetDirectoryPath) {
  const docsDirectoryPath = path.join(targetDirectoryPath, 'docs');
  const checkedFileNames = [];
  const staleFiles = [];

  for (const projectDocFileName of PROJECT_DOC_FILE_NAMES) {
    const projectDocFilePath = path.join(docsDirectoryPath, projectDocFileName);
    if (!(await pathExists(projectDocFilePath))) {
      continue;
    }

    checkedFileNames.push(projectDocFileName);
    const projectDocContent = await fs.readFile(projectDocFilePath, 'utf8');
    const detectedTemplateVersion = extractTemplateVersion(projectDocContent);

    if (!detectedTemplateVersion || detectedTemplateVersion !== PROJECT_DOC_TEMPLATE_VERSION) {
      staleFiles.push({
        fileName: projectDocFileName,
        detectedTemplateVersion,
      });
    }
  }

  return {
    hasProjectDocs: checkedFileNames.length > 0,
    expectedTemplateVersion: PROJECT_DOC_TEMPLATE_VERSION,
    checkedFileNames,
    staleFiles,
  };
}

/**
 * Load project config from a YAML-like file for non-interactive mode.
 * Uses a simple key: value format (one per line) for zero-dependency parsing.
 */
export async function loadProjectConfig(configFilePath) {
  const configContent = await fs.readFile(configFilePath, 'utf8');
  const configLines = configContent.split(/\r?\n/);
  const configEntries = {};
  let currentKey = null;
  let currentArrayValues = null;

  for (const configLine of configLines) {
    const trimmedLine = configLine.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    if (trimmedLine.startsWith('- ') && currentKey && currentArrayValues !== null) {
      currentArrayValues.push(trimmedLine.slice(2).trim());
      continue;
    }

    if (currentKey && currentArrayValues !== null) {
      configEntries[currentKey] = currentArrayValues;
      currentKey = null;
      currentArrayValues = null;
    }

    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }

    const entryKey = trimmedLine.slice(0, colonIndex).trim();
    const entryValue = trimmedLine.slice(colonIndex + 1).trim();

    if (!entryValue) {
      currentKey = entryKey;
      currentArrayValues = [];
      continue;
    }

    configEntries[entryKey] = entryValue;
  }

  if (currentKey && currentArrayValues !== null) {
    configEntries[currentKey] = currentArrayValues;
  }

  return {
    projectName: configEntries.projectName || configEntries.name || '',
    projectDescription: configEntries.projectDescription || configEntries.description || '',
    includeCiGuardrails: parseBooleanLikeValue(configEntries.includeCiGuardrails) ?? parseBooleanLikeValue(configEntries.ci) ?? true,
    primaryDomain: configEntries.primaryDomain || configEntries.domain || 'API service',
    databaseChoice: configEntries.databaseChoice || configEntries.database || 'None (stateless service)',
    authStrategy: configEntries.authStrategy || configEntries.auth || 'None (public service)',
    dockerStrategy: resolveDockerStrategy({
      dockerStrategy: configEntries.dockerStrategy || configEntries.containerStrategy,
      useDocker: configEntries.useDocker,
      useDockerDevelopment: configEntries.useDockerDevelopment || configEntries.dockerDevelopment,
      useDockerProduction: configEntries.useDockerProduction || configEntries.dockerProduction,
    }),
    features: Array.isArray(configEntries.features) ? configEntries.features : [],
    additionalContext: configEntries.additionalContext || configEntries.context || 'No additional context provided.',
    docsLang: configEntries.docsLang || configEntries.docsLanguage || 'en',
  };
}
