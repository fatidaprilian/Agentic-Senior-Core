/**
 * Project Scaffolder — Dynamic project documentation generator.
 * Generates project-specific docs during init when the target folder is empty.
 * Depends on: constants.mjs, utils.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CLI_VERSION } from './constants.mjs';
import { ensureDirectory, askChoice, askYesNo, toTitleCase, pathExists } from './utils.mjs';

const CURRENT_FILE_PATH = fileURLToPath(import.meta.url);
const CURRENT_DIRECTORY_PATH = path.dirname(CURRENT_FILE_PATH);
const TEMPLATES_DIRECTORY_PATH = path.join(CURRENT_DIRECTORY_PATH, 'templates');
const SUPPORTED_DOC_LANGUAGES = new Set(['en', 'id']);
const PROJECT_DOC_FILE_NAMES = [
  'project-brief.md',
  'architecture-decision-record.md',
  'database-schema.md',
  'api-contract.md',
  'flow-overview.md',
];

export const PROJECT_DOC_TEMPLATE_VERSION = '1.2.0';

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

const DISCOVERY_MODE_CHOICES = [
  'Quick mode (mostly choices, fastest)',
  'Detailed mode (type your own answers)',
];

const DESCRIPTION_TEMPLATE_CHOICES = [
  'Marketplace / commerce platform',
  'Internal operations dashboard',
  'SaaS workflow product',
  'Developer platform / API product',
  'Content and community platform',
  'Other',
];

const FEATURE_PRESET_CHOICES = [
  'MVP foundation (auth, core CRUD, role-based access)',
  'Commerce flow (catalog, cart, checkout)',
  'Operations flow (dashboard, approvals, reporting)',
  'API platform flow (keys, rate-limit, webhooks)',
  'Content flow (publish, moderation, search)',
  'Other',
];

const FEATURE_PRESET_MAP = {
  'MVP foundation (auth, core CRUD, role-based access)': [
    'Authentication and user profiles',
    'Core CRUD workflow for primary resources',
    'Role-based access control',
  ],
  'Commerce flow (catalog, cart, checkout)': [
    'Product catalog and filtering',
    'Shopping cart and wishlist',
    'Checkout and payment processing flow',
  ],
  'Operations flow (dashboard, approvals, reporting)': [
    'Operational dashboard with KPIs',
    'Approval workflow and audit trail',
    'Reporting and export functionality',
  ],
  'API platform flow (keys, rate-limit, webhooks)': [
    'API key management',
    'Rate limiting and usage quotas',
    'Webhook delivery and retry handling',
  ],
  'Content flow (publish, moderation, search)': [
    'Draft and publish workflow',
    'Moderation queue and policy checks',
    'Search and discovery experience',
  ],
};

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

function parseDockerStrategy(dockerStrategy) {
  const normalizedDockerStrategy = String(dockerStrategy || '').toLowerCase();

  if (normalizedDockerStrategy.includes('both development and production')) {
    return {
      dockerStrategy: DOCKER_STRATEGY_CHOICES[3],
      hasDocker: true,
      useDockerDevelopment: true,
      useDockerProduction: true,
    };
  }

  if (normalizedDockerStrategy.includes('development only')) {
    return {
      dockerStrategy: DOCKER_STRATEGY_CHOICES[1],
      hasDocker: true,
      useDockerDevelopment: true,
      useDockerProduction: false,
    };
  }

  if (normalizedDockerStrategy.includes('production only')) {
    return {
      dockerStrategy: DOCKER_STRATEGY_CHOICES[2],
      hasDocker: true,
      useDockerDevelopment: false,
      useDockerProduction: true,
    };
  }

  return {
    dockerStrategy: DOCKER_STRATEGY_CHOICES[0],
    hasDocker: false,
    useDockerDevelopment: false,
    useDockerProduction: false,
  };
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

function resolveLocalizedTemplateFileName(templateFileName, docsLanguage) {
  if (docsLanguage === 'en') {
    return templateFileName;
  }

  return templateFileName.replace(/\.md\.tmpl$/i, `.md.${docsLanguage}.tmpl`);
}

async function resolveTemplateFilePath(templateFileName, docsLanguage) {
  const localizedTemplateFileName = resolveLocalizedTemplateFileName(templateFileName, docsLanguage);
  const localizedTemplateFilePath = path.join(TEMPLATES_DIRECTORY_PATH, localizedTemplateFileName);

  if (await pathExists(localizedTemplateFilePath)) {
    return localizedTemplateFilePath;
  }

  const defaultTemplateFilePath = path.join(TEMPLATES_DIRECTORY_PATH, templateFileName);
  if (await pathExists(defaultTemplateFilePath)) {
    return defaultTemplateFilePath;
  }

  return null;
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

  const selectedDiscoveryMode = await askChoice(
    'How do you want to answer project questions?',
    DISCOVERY_MODE_CHOICES,
    userInterface
  );

  const isQuickMode = selectedDiscoveryMode === DISCOVERY_MODE_CHOICES[0];

  const defaultProjectName = (options.defaultProjectName || '').trim();
  let projectName = '';

  if (isQuickMode && defaultProjectName) {
    const projectNameSource = await askChoice(
      'Project name source:',
      [
        `Use folder name (${defaultProjectName})`,
        'Type custom project name',
      ],
      userInterface
    );

    if (projectNameSource.startsWith('Use folder name')) {
      projectName = defaultProjectName;
    }
  }

  if (!projectName) {
    const projectNamePrompt = defaultProjectName
      ? `Project name (press Enter to use folder name: ${defaultProjectName}): `
      : 'Project name: ';

    projectName = (await userInterface.question(projectNamePrompt)).trim();

    if (!projectName && defaultProjectName) {
      projectName = defaultProjectName;
    }
  }

  if (!projectName) {
    throw new Error('Project name is required for documentation scaffolding.');
  }

  let projectDescription = '';
  if (isQuickMode) {
    const selectedDescriptionTemplate = await askChoice(
      'Project description template:',
      DESCRIPTION_TEMPLATE_CHOICES,
      userInterface
    );

    if (selectedDescriptionTemplate === 'Other') {
      projectDescription = (await userInterface.question('One-line description: ')).trim();
    } else {
      projectDescription = `${selectedDescriptionTemplate} for ${projectName}.`;
    }
  } else {
    projectDescription = (await userInterface.question('One-line description: ')).trim();
  }

  if (!projectDescription) {
    projectDescription = `A ${projectName} project.`;
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

  let dockerStrategy = DOCKER_STRATEGY_CHOICES[0];
  if (isQuickMode) {
    dockerStrategy = await askChoice(
      'Containerization strategy:',
      DOCKER_STRATEGY_CHOICES,
      userInterface
    );
  } else {
    const useDocker = await askYesNo(
      'Use Docker for this project (development and/or production)?',
      userInterface,
      false
    );

    if (useDocker) {
      const useDockerDevelopment = await askYesNo(
        'Use Docker for development workflow?',
        userInterface,
        true
      );
      const useDockerProduction = await askYesNo(
        'Use Docker for production runtime/build?',
        userInterface,
        true
      );

      dockerStrategy = resolveDockerStrategy({
        useDocker,
        useDockerDevelopment,
        useDockerProduction,
      });
    }
  }

  const parsedDockerStrategy = parseDockerStrategy(dockerStrategy);

  let features = [];
  if (isQuickMode) {
    const selectedFeaturePreset = await askChoice(
      'Feature set:',
      FEATURE_PRESET_CHOICES,
      userInterface
    );

    if (selectedFeaturePreset === 'Other') {
      features = await askFeatureList(userInterface);
    } else {
      features = FEATURE_PRESET_MAP[selectedFeaturePreset] || [];
    }
  } else {
    features = await askFeatureList(userInterface);
  }

  if (features.length === 0) {
    features.push('Core functionality (define during development)');
  }

  let additionalContext = 'No additional context provided.';
  if (isQuickMode) {
    const wantsAdditionalContext = await askYesNo(
      'Add additional context now?',
      userInterface,
      false
    );

    if (wantsAdditionalContext) {
      additionalContext = (await userInterface.question('Additional context: ')).trim()
        || 'No additional context provided.';
    }
  } else {
    additionalContext = (await userInterface.question('\nAdditional context (optional, press Enter to skip): ')).trim()
      || 'No additional context provided.';
  }

  return {
    projectName,
    projectDescription,
    primaryDomain,
    databaseChoice,
    authStrategy,
    dockerStrategy: parsedDockerStrategy.dockerStrategy,
    useDockerDevelopment: parsedDockerStrategy.useDockerDevelopment,
    useDockerProduction: parsedDockerStrategy.useDockerProduction,
    features,
    additionalContext,
  };
}

/**
 * Determine which documents to generate based on project discovery answers.
 */
export function resolveDocumentManifest(discoveryAnswers) {
  const hasDatabase = !discoveryAnswers.databaseChoice.toLowerCase().startsWith('none');
  const hasAuth = !discoveryAnswers.authStrategy.toLowerCase().startsWith('none');
  const isApiOrWebDomain = ['API service', 'Web application'].includes(discoveryAnswers.primaryDomain)
    || discoveryAnswers.primaryDomain.toLowerCase().includes('api')
    || discoveryAnswers.primaryDomain.toLowerCase().includes('web');

  const documentManifest = [
    { templateFileName: 'project-brief.md.tmpl', outputFileName: 'project-brief.md', alwaysInclude: true },
    { templateFileName: 'architecture-decision-record.md.tmpl', outputFileName: 'architecture-decision-record.md', alwaysInclude: true },
    { templateFileName: 'flow-overview.md.tmpl', outputFileName: 'flow-overview.md', alwaysInclude: true },
  ];

  if (hasDatabase) {
    documentManifest.push({
      templateFileName: 'database-schema.md.tmpl',
      outputFileName: 'database-schema.md',
      alwaysInclude: false,
    });
  }

  if (isApiOrWebDomain) {
    documentManifest.push({
      templateFileName: 'api-contract.md.tmpl',
      outputFileName: 'api-contract.md',
      alwaysInclude: false,
    });
  }

  return { documentManifest, hasDatabase, hasAuth };
}

/**
 * Build template context from discovery answers and init selections.
 */
export function buildTemplateContext(discoveryAnswers, initContext) {
  const hasDatabase = !discoveryAnswers.databaseChoice.toLowerCase().startsWith('none');
  const hasAuth = !discoveryAnswers.authStrategy.toLowerCase().startsWith('none');
  const additionalStackFileNames = Array.isArray(initContext.additionalStackFileNames)
    ? initContext.additionalStackFileNames
    : [];
  const additionalBlueprintFileNames = Array.isArray(initContext.additionalBlueprintFileNames)
    ? initContext.additionalBlueprintFileNames
    : [];
  const parsedDockerStrategy = parseDockerStrategy(discoveryAnswers.dockerStrategy);

  const baseUrlMap = {
    'API service': 'http://localhost:3000',
    'Web application': 'http://localhost:3000/api',
    'Mobile app': 'http://localhost:3000/api',
    'CLI tool': 'N/A',
    'Library / SDK': 'N/A',
  };

  return {
    projectName: discoveryAnswers.projectName,
    projectDescription: discoveryAnswers.projectDescription,
    primaryDomain: discoveryAnswers.primaryDomain,
    databaseChoice: discoveryAnswers.databaseChoice,
    authStrategy: discoveryAnswers.authStrategy,
    features: discoveryAnswers.features,
    additionalContext: discoveryAnswers.additionalContext,
    stackFileName: initContext.stackFileName,
    stackDisplayName: toTitleCase(initContext.stackFileName),
    additionalStackFileNames,
    additionalStackDisplayNames: additionalStackFileNames.length > 0
      ? additionalStackFileNames.map((stackFileName) => toTitleCase(stackFileName))
      : null,
    blueprintFileName: initContext.blueprintFileName,
    blueprintDisplayName: toTitleCase(initContext.blueprintFileName),
    additionalBlueprintFileNames,
    additionalBlueprintDisplayNames: additionalBlueprintFileNames.length > 0
      ? additionalBlueprintFileNames.map((blueprintFileName) => toTitleCase(blueprintFileName))
      : null,
    runtimeEnvironmentKey: initContext.runtimeEnvironmentKey || 'linux',
    runtimeEnvironmentLabel: initContext.runtimeEnvironmentLabel || 'Linux',
    cliVersion: CLI_VERSION,
    templateVersion: PROJECT_DOC_TEMPLATE_VERSION,
    generatedAt: new Date().toISOString(),
    generatedDate: new Date().toISOString().split('T')[0],
    hasDatabase,
    hasAuth,
    hasDocker: parsedDockerStrategy.hasDocker,
    dockerStrategy: parsedDockerStrategy.dockerStrategy,
    useDockerDevelopment: parsedDockerStrategy.useDockerDevelopment,
    useDockerProduction: parsedDockerStrategy.useDockerProduction,
    dockerDevelopmentGuidance: parsedDockerStrategy.useDockerDevelopment
      ? '- Development containers are required: optimize for fast rebuilds, bind mounts, and debug-friendly startup.'
      : '',
    dockerProductionGuidance: parsedDockerStrategy.useDockerProduction
      ? '- Production containers are required: use multi-stage builds, non-root runtime, and minimal image footprint.'
      : '',
    baseUrl: baseUrlMap[discoveryAnswers.primaryDomain] || 'http://localhost:3000',
  };
}

/**
 * Render a template string by replacing {{placeholder}} tokens with context values.
 * Supports:
 * - {{key}} for simple values
 * - {{#each key}}...{{this}}...{{/each}} for arrays
 * - {{#if key}}...{{/if}} for conditionals
 */
export function renderTemplate(templateContent, templateContext) {
  let renderedContent = templateContent;

  // Process {{#each key}}...{{/each}} blocks
  renderedContent = renderedContent.replace(
    /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_fullMatch, iteratorKey, iteratorBody) => {
      const iteratorValues = templateContext[iteratorKey];

      if (!Array.isArray(iteratorValues) || iteratorValues.length === 0) {
        return '';
      }

      return iteratorValues
        .map((iteratorValue) => iteratorBody.replace(/\{\{this\}\}/g, iteratorValue))
        .join('');
    }
  );

  // Process {{#if key}}...{{/if}} blocks
  renderedContent = renderedContent.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_fullMatch, conditionKey, conditionBody) => {
      const conditionValue = templateContext[conditionKey];
      return conditionValue ? conditionBody : '';
    }
  );

  // Process simple {{key}} replacements
  renderedContent = renderedContent.replace(
    /\{\{(\w+)\}\}/g,
    (_fullMatch, placeholderKey) => {
      const placeholderValue = templateContext[placeholderKey];

      if (placeholderValue === undefined || placeholderValue === null) {
        return `{{${placeholderKey}}}`;
      }

      if (Array.isArray(placeholderValue)) {
        return placeholderValue.join(', ');
      }

      return String(placeholderValue);
    }
  );

  return renderedContent;
}

/**
 * Generate project documentation files from templates.
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
  await ensureDirectory(docsDirectoryPath);

  const templateContext = buildTemplateContext(discoveryAnswers, initContext);
  const { documentManifest } = resolveDocumentManifest(discoveryAnswers);
  const generatedFileNames = [];

  for (const documentEntry of documentManifest) {
    const templateFilePath = await resolveTemplateFilePath(
      documentEntry.templateFileName,
      normalizedDocsLanguage
    );

    if (!templateFilePath) {
      console.log(`[WARN] Template not found: ${documentEntry.templateFileName}, skipping.`);
      continue;
    }

    const templateContent = await fs.readFile(templateFilePath, 'utf8');
    const renderedContent = renderTemplate(templateContent, templateContext);
    const outputFilePath = path.join(docsDirectoryPath, documentEntry.outputFileName);

    await fs.writeFile(outputFilePath, renderedContent, 'utf8');
    generatedFileNames.push(documentEntry.outputFileName);
  }

  return {
    docsDirectoryPath,
    generatedFileNames,
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
