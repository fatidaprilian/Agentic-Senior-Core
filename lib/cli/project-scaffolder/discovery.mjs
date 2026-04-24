import fs from 'node:fs/promises';

import { askChoice, askYesNo } from '../utils.mjs';
import {
  ARCHITECTURE_STYLE_CHOICES,
  DOCKER_STRATEGY_CHOICES,
  SUPPORTED_DOC_LANGUAGES,
} from './constants.mjs';

const PROJECT_SCOPE_CHOICES = [
  'Frontend only',
  'Backend only',
  'Both (frontend + backend)',
];

const AGENT_RECOMMENDATION_REQUIRED = 'Agent recommendation required from current brief, repo evidence, and live official docs';

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
    return AGENT_RECOMMENDATION_REQUIRED;
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

export function normalizeDocsLanguage(rawDocsLanguage = 'en') {
  const normalizedDocsLanguage = String(rawDocsLanguage || 'en').trim().toLowerCase();
  return SUPPORTED_DOC_LANGUAGES.has(normalizedDocsLanguage) ? normalizedDocsLanguage : null;
}

export async function runProjectDiscovery(userInterface, options = {}) {
  console.log('\n--- Project Setup ---');
  console.log('I will ask the minimum needed questions, then let the AI agent recommend unresolved technical decisions from the brief, repo evidence, and live official docs.\n');
  console.log('You can answer in your own language.');
  console.log('CLI prompts stay in English, but non-English answers are fully supported.\n');

  const defaultProjectName = (options.defaultProjectName || '').trim();
  const defaultProjectDescription = String(options.defaultProjectDescription || '').trim();
  const defaultIncludeCiGuardrails = typeof options.defaultIncludeCiGuardrails === 'boolean'
    ? options.defaultIncludeCiGuardrails
    : true;
  const shouldAskForCiGuardrails = options.askForCiGuardrails !== false;

  const projectName = defaultProjectName || 'Untitled project';
  const briefPrompt = defaultProjectDescription
    ? `One-line project brief (press Enter to use current brief): `
    : 'One-line project brief (optional but recommended): ';
  const projectBriefAnswer = (await userInterface.question(briefPrompt)).trim();
  const projectDescription = projectBriefAnswer
    || defaultProjectDescription
    || 'Project brief unresolved. The AI agent must ask for or infer product context before implementation.';

  const projectScope = await askChoice('Project scope:', PROJECT_SCOPE_CHOICES, userInterface);
  const primaryDomain = projectScope === 'Frontend only'
    ? 'Frontend/UI application'
    : projectScope === 'Backend only'
      ? 'Backend/API service'
      : 'Fullstack product';

  const dockerStrategy = await askChoice(
    'Containerization strategy:',
    DOCKER_STRATEGY_CHOICES,
    userInterface
  );

  const includeCiGuardrails = shouldAskForCiGuardrails
    ? await askYesNo(
      'Enable CI/CD quality checks (guardrails) and the LLM Judge policy?',
      userInterface,
      defaultIncludeCiGuardrails
    )
    : defaultIncludeCiGuardrails;

  return {
    projectName,
    projectDescription,
    architectureStyle: AGENT_RECOMMENDATION_REQUIRED,
    includeCiGuardrails,
    primaryDomain,
    databaseChoice: AGENT_RECOMMENDATION_REQUIRED,
    authStrategy: AGENT_RECOMMENDATION_REQUIRED,
    dockerStrategy,
    features: [],
    additionalContext: 'Fresh-project technical decisions are intentionally unresolved. The AI agent must recommend them from current context and official docs before coding.',
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
    primaryDomain: configEntries.primaryDomain || configEntries.domain || AGENT_RECOMMENDATION_REQUIRED,
    databaseChoice: configEntries.databaseChoice || configEntries.database || AGENT_RECOMMENDATION_REQUIRED,
    authStrategy: configEntries.authStrategy || configEntries.auth || AGENT_RECOMMENDATION_REQUIRED,
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
