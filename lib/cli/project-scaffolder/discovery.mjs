import fs from 'node:fs/promises';

import { askChoice, askYesNo } from '../utils.mjs';
import {
  ARCHITECTURE_STYLE_CHOICES,
  AUTH_CHOICES,
  DATABASE_CHOICES,
  DOCKER_STRATEGY_CHOICES,
  DOMAIN_CHOICES,
  SUPPORTED_DOC_LANGUAGES,
} from './constants.mjs';

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

function resolveArchitectureStyle(rawArchitectureStyle) {
  const normalizedArchitectureStyle = String(rawArchitectureStyle || '').trim().toLowerCase();

  if (!normalizedArchitectureStyle) {
    return ARCHITECTURE_STYLE_CHOICES[0];
  }

  if (normalizedArchitectureStyle === 'monolith' || normalizedArchitectureStyle === 'modular monolith') {
    return ARCHITECTURE_STYLE_CHOICES[0];
  }

  if (
    normalizedArchitectureStyle === 'microservice'
    || normalizedArchitectureStyle === 'microservices'
    || normalizedArchitectureStyle === 'distributed'
    || normalizedArchitectureStyle === 'distributed system'
    || normalizedArchitectureStyle === 'microservice / distributed system'
  ) {
    return ARCHITECTURE_STYLE_CHOICES[1];
  }

  const directMatch = ARCHITECTURE_STYLE_CHOICES.find(
    (architectureStyleChoice) => architectureStyleChoice.toLowerCase() === normalizedArchitectureStyle
  );

  return directMatch || ARCHITECTURE_STYLE_CHOICES[0];
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

  const projectNamePrompt = defaultProjectName
    ? `Project name (press Enter to use folder name: ${defaultProjectName}): `
    : 'Project name: ';

  let projectName = (await userInterface.question(projectNamePrompt)).trim();

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

  const architectureStyle = await askChoice(
    'Project topology:',
    ARCHITECTURE_STYLE_CHOICES,
    userInterface
  );

  const includeCiGuardrails = shouldAskForCiGuardrails
    ? await askYesNo(
      'Enable CI/CD quality checks (guardrails) and the LLM Judge policy?',
      userInterface,
      defaultIncludeCiGuardrails
    )
    : defaultIncludeCiGuardrails;

  const domainSelection = await askChoice('Primary domain:', DOMAIN_CHOICES, userInterface);
  let primaryDomain = domainSelection;
  if (domainSelection === 'Other') {
    primaryDomain = (await userInterface.question('Describe your domain: ')).trim() || 'Custom domain';
  }

  const databaseSelection = await askChoice('Database needs:', DATABASE_CHOICES, userInterface);
  let databaseChoice = databaseSelection;
  if (databaseSelection === 'Other') {
    databaseChoice = (await userInterface.question('Describe your database setup: ')).trim() || 'Custom database';
  }

  const authSelection = await askChoice('Auth strategy:', AUTH_CHOICES, userInterface);
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
    architectureStyle,
    includeCiGuardrails,
    primaryDomain,
    databaseChoice,
    authStrategy,
    dockerStrategy,
    features,
    additionalContext: 'No additional context provided.',
  };
}

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
    architectureStyle: resolveArchitectureStyle(configEntries.architectureStyle || configEntries.topology || configEntries.serviceTopology),
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
