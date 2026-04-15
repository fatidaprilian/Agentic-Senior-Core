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

/**
 * Run the project discovery interview.
 * Returns a structured object with all user responses.
 */
export async function runProjectDiscovery(userInterface) {
  console.log('\n--- Project Discovery ---');
  console.log('I will ask a few questions to generate project-specific documentation.');
  console.log('This helps AI agents understand your project before writing code.\n');

  const projectName = (await userInterface.question('Project name: ')).trim();
  if (!projectName) {
    throw new Error('Project name is required for documentation scaffolding.');
  }

  const projectDescription = (await userInterface.question('One-line description: ')).trim() || `A ${projectName} project.`;

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

  console.log('\nList your key features (one per line, press Enter twice to finish):');
  const features = [];
  let consecutiveEmptyLineCount = 0;

  while (features.length < 10) {
    const featureLine = (await userInterface.question(`  Feature ${features.length + 1}: `)).trim();

    if (!featureLine) {
      consecutiveEmptyLineCount += 1;
      if (consecutiveEmptyLineCount >= 1 && features.length >= 1) {
        break;
      }
      continue;
    }

    consecutiveEmptyLineCount = 0;
    features.push(featureLine);
  }

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
    blueprintFileName: initContext.blueprintFileName,
    blueprintDisplayName: toTitleCase(initContext.blueprintFileName),
    cliVersion: CLI_VERSION,
    generatedAt: new Date().toISOString(),
    generatedDate: new Date().toISOString().split('T')[0],
    hasDatabase,
    hasAuth,
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
  initContext
) {
  const docsDirectoryPath = path.join(targetDirectoryPath, 'docs');
  await ensureDirectory(docsDirectoryPath);

  const templateContext = buildTemplateContext(discoveryAnswers, initContext);
  const { documentManifest } = resolveDocumentManifest(discoveryAnswers);
  const generatedFileNames = [];

  for (const documentEntry of documentManifest) {
    const templateFilePath = path.join(TEMPLATES_DIRECTORY_PATH, documentEntry.templateFileName);

    if (!(await pathExists(templateFilePath))) {
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
    templateVersion: '1.0.0',
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
    features: Array.isArray(configEntries.features) ? configEntries.features : [],
    additionalContext: configEntries.additionalContext || configEntries.context || 'No additional context provided.',
  };
}
