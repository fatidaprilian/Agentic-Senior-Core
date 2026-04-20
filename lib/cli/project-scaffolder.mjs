/**
 * Project Scaffolder — Dynamic project documentation generator.
 * Generates project-specific docs during init when the target folder is empty.
 * Depends on: constants.mjs, utils.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import { ensureDirectory, askChoice, toTitleCase, pathExists } from './utils.mjs';

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
  console.log('\n--- Project Discovery ---');
  console.log('I will ask a few questions to generate project-specific documentation.');
  console.log('This helps AI agents understand your project before writing code.\n');
  console.log('You can answer in your own language.');
  console.log('CLI prompts stay in English, but non-English answers are fully supported.\n');

  const defaultProjectName = (options.defaultProjectName || '').trim();
  const defaultProjectDescription = String(options.defaultProjectDescription || '').trim();
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

  let features = await askFeatureList(userInterface);

  if (features.length === 0) {
    features.push('Core functionality (define during development)');
  }

  const additionalContext = (await userInterface.question('\nAdditional context (optional, press Enter to skip): ')).trim()
    || 'No additional context provided.';

  return {
    projectName,
    projectDescription,
    primaryDomain,
    databaseChoice,
    authStrategy,
    dockerStrategy,
    features,
    additionalContext,
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

function inferDesignKeywords(discoveryAnswers) {
  const normalizedDescription = String(discoveryAnswers.projectDescription || '').toLowerCase();
  const normalizedDomain = String(discoveryAnswers.primaryDomain || '').toLowerCase();
  const normalizedFeatures = Array.isArray(discoveryAnswers.features)
    ? discoveryAnswers.features.map((featureValue) => String(featureValue).toLowerCase()).join(' ')
    : '';
  const aggregateText = `${normalizedDescription} ${normalizedDomain} ${normalizedFeatures}`;

  if (aggregateText.includes('commerce') || aggregateText.includes('catalog') || aggregateText.includes('checkout')) {
    return {
      brandAdjectives: ['clear', 'desirable', 'confident'],
      antiAdjectives: ['cluttered', 'hesitant', 'coupon-noisy'],
      distinctiveMoves: [
        'Use product hierarchy and buying cues without turning the interface into a discount template.',
        'Keep decision-critical information prominent while secondary merchandising stays quiet.',
        'Let imagery and spacing create premium perception before decorative effects do.',
      ],
    };
  }

  if (aggregateText.includes('dashboard') || aggregateText.includes('operations') || aggregateText.includes('report')) {
    return {
      brandAdjectives: ['calm', 'precise', 'trustworthy'],
      antiAdjectives: ['chaotic', 'gimmicky', 'visually exhausting'],
      distinctiveMoves: [
        'Prioritize scanning clarity and status recognition over decorative density.',
        'Use visual weight to separate signal from operational noise.',
        'Reserve strong accents for alerts, decisions, and state transitions only.',
      ],
    };
  }

  if (aggregateText.includes('developer') || aggregateText.includes('api') || aggregateText.includes('platform')) {
    return {
      brandAdjectives: ['precise', 'technical', 'transparent'],
      antiAdjectives: ['vague', 'marketing-heavy', 'template-polished'],
      distinctiveMoves: [
        'Make structure and feedback feel exact without becoming sterile.',
        'Use code-adjacent rhythm and hierarchy to build trust with technical users.',
        'Keep complexity legible through spacing, grouping, and explicit interaction states.',
      ],
    };
  }

  if (aggregateText.includes('content') || aggregateText.includes('community') || aggregateText.includes('publish')) {
    return {
      brandAdjectives: ['editorial', 'warm', 'expressive'],
      antiAdjectives: ['flat', 'anonymous', 'feed-generic'],
      distinctiveMoves: [
        'Build a strong reading rhythm so content feels curated rather than dumped into cards.',
        'Use contrast and spacing to guide attention between creation, moderation, and discovery.',
        'Give key interaction moments personality without sacrificing clarity.',
      ],
    };
  }

  return {
    brandAdjectives: ['clear', 'human', 'distinct'],
    antiAdjectives: ['generic', 'template-like', 'trend-chasing'],
    distinctiveMoves: [
      'Create a visual direction with one memorable tension instead of stacking fashionable effects.',
      'Use rhythm, hierarchy, and motion intentionally so the interface feels authored.',
      'Keep the system flexible enough to evolve with product scope without losing identity.',
    ],
  };
}

function buildDesignIntentSeed({
  discoveryAnswers,
  initContext,
  architectureRecommendation,
}) {
  const inferredKeywords = inferDesignKeywords(discoveryAnswers);
  const designSignals = architectureRecommendation?.designGuidance?.normalizedSignals || null;

  return `${JSON.stringify({
    mode: 'dynamic',
    status: 'seed-needs-design-synthesis',
    project: {
      name: discoveryAnswers.projectName,
      context: discoveryAnswers.projectDescription,
      domain: discoveryAnswers.primaryDomain,
      stack: toTitleCase(initContext.stackFileName),
      blueprint: toTitleCase(initContext.blueprintFileName),
    },
    brandAdjectives: inferredKeywords.brandAdjectives,
    antiAdjectives: inferredKeywords.antiAdjectives,
    visualDirection: {
      trendStance: 'trend-aware-not-trend-chasing',
      distinctiveMoves: inferredKeywords.distinctiveMoves,
      copiedReferenceAllowed: false,
    },
    experiencePrinciples: [
      'Design must feel project-specific, not interchangeable with generic SaaS templates.',
      'Major interface decisions must be explainable in product and user terms.',
      'Accessibility, responsiveness, and implementation realism are non-negotiable.',
    ],
    forbiddenPatterns: [
      'generic-saas-hero',
      'copycat-brand-system',
      'unjustified-default-gradients',
      'placeholder-design-language',
    ],
    requiredDesignSections: [
      'Design Intent and Product Personality',
      'Audience and Use-Context Signals',
      'Visual Direction and Distinctive Moves',
      'Color System and Semantic Roles',
      'Typography System and Hierarchy',
      'Spacing, Layout Rhythm, and Density Strategy',
      'Interaction, Motion, and Feedback Rules',
      'Component Language and Shared Patterns',
      'Accessibility Non-Negotiables',
      'Responsive Strategy',
      'Anti-Patterns to Avoid',
      'Implementation Notes for Future UI Tasks',
    ],
    implementation: {
      requiredDeliverables: ['docs/DESIGN.md', 'docs/design-intent.json'],
      requireDesignRationale: true,
      requireDistinctVisualDirection: true,
      requireMachineReadableContract: true,
      bootstrapPrompt: '.agent-context/prompts/bootstrap-design.md',
    },
    architectSignals: designSignals,
  }, null, 2)}\n`;
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
    : '1. Core functionality (define during implementation)';

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
    '2. Keep content original, specific to this project, and actionable for implementation.',
    '3. After writing docs, continue coding tasks using these docs as living project context.',
    '',
  ].join('\n');
}

function buildDesignBootstrapPrompt({
  discoveryAnswers,
  initContext,
  docsLanguage,
  architectureRecommendation,
}) {
  const designSignals = architectureRecommendation?.designGuidance?.normalizedSignals || null;
  const designSignalsJson = JSON.stringify(designSignals, null, 2);
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
    '4. Color System (tokens, semantic roles, accessibility rationale)',
    '5. Typography System (pairing, scale, usage rules)',
    '6. Spacing, Layout Rhythm, and Density Strategy',
    '7. Motion and Interaction Principles',
    '8. Component Language (cards, forms, nav, states)',
    '9. Accessibility Non-Negotiables',
    '10. Responsive Strategy',
    '11. Anti-Patterns to Avoid',
    '12. Implementation Notes for Future UI Tasks',
    '',
    '## Required design-intent.json Fields',
    '1. mode',
    '2. status',
    '3. project',
    '4. brandAdjectives',
    '5. antiAdjectives',
    '6. visualDirection',
    '7. experiencePrinciples',
    '8. forbiddenPatterns',
    '9. requiredDesignSections',
    '10. implementation',
    '',
    '## Hard Rules',
    '1. No copy-paste from external style guides.',
    '2. Every major decision must include psychological/product rationale.',
    '3. Keep implementation feasible for the selected stack and blueprint.',
    '4. Keep tone decisive like an art director, not generic AI boilerplate.',
    '5. Do not anchor the final design language to a famous brand reference. Translate inspiration into original project-specific principles.',
    '6. Reject interchangeable hero layouts, generic SaaS gradients, and trend-chasing decoration unless the project context explicitly justifies them.',
    '',
    '## Project Inputs',
    `- Project name: ${discoveryAnswers.projectName}`,
    `- Product context: ${discoveryAnswers.projectDescription}`,
    `- Domain: ${discoveryAnswers.primaryDomain}`,
    `- Stack: ${toTitleCase(initContext.stackFileName)}`,
    `- Blueprint: ${toTitleCase(initContext.blueprintFileName)}`,
    '',
    '## Architect Design Signals (raw control vector)',
    'Use this only as baseline fuel, then expand into full design direction with original reasoning:',
    '```json',
    designSignalsJson || 'null',
    '```',
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
