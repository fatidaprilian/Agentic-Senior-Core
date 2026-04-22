import fs from 'node:fs/promises';
import path from 'node:path';

import { ensureDirectory, pathExists } from '../utils.mjs';
import {
  PROJECT_DOC_FILE_NAMES,
  PROJECT_DOC_SYNTHESIS_PROMPT_VERSION,
  PROJECT_DOC_TEMPLATE_VERSION,
  UI_DESIGN_CONTRACT_FILE_NAMES,
} from './constants.mjs';
import {
  buildSynthesisContext,
  normalizeDocsLanguage,
  resolveProjectDocTargets,
} from './discovery.mjs';
import {
  buildDesignIntentSeed,
  shouldBootstrapDesignDocument,
} from './design-contract.mjs';
import {
  buildDesignBootstrapPrompt,
  buildProjectContextBootstrapPrompt,
} from './prompt-builders.mjs';

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
