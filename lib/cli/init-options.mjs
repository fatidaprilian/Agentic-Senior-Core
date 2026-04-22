/**
 * Init Options Parser — isolates CLI option parsing from init runtime flow.
 */
import { normalizeDocsLanguage } from './project-scaffolder.mjs';
import { normalizeAgentName } from './token-optimization.mjs';
import { normalizeChoiceInput, matchProfileNameFromInput } from './utils.mjs';

export function normalizeRuntimeEnvironmentKey(rawRuntimeEnvironmentKey) {
  const normalizedRuntimeEnvironmentKey = normalizeChoiceInput(String(rawRuntimeEnvironmentKey || 'auto'));
  const supportedRuntimeEnvironmentKeys = new Set(['auto', 'linux-wsl', 'linux', 'windows', 'macos']);
  return supportedRuntimeEnvironmentKeys.has(normalizedRuntimeEnvironmentKey) ? normalizedRuntimeEnvironmentKey : null;
}

export function parseInitArguments(commandArguments) {
  const parsedInitOptions = {
    targetDirectory: '.',
    preset: undefined,
    profile: undefined,
    stack: undefined,
    blueprint: undefined,
    ci: undefined,
    newbie: false,
    tokenOptimize: true,
    memoryContinuity: true,
    tokenAgent: 'copilot',
    includeMcpTemplate: true,
    scaffoldDocs: undefined,
    docsLang: 'en',
    docsLangProvided: false,
    projectConfig: undefined,
    projectDescription: '',
    runtimeEnv: 'auto',
    runtimeEnvProvided: false,
  };

  for (let argumentIndex = 0; argumentIndex < commandArguments.length; argumentIndex++) {
    const currentArgument = commandArguments[argumentIndex];

    if (!currentArgument.startsWith('--')) {
      parsedInitOptions.targetDirectory = currentArgument;
      continue;
    }

    if (currentArgument === '--profile') {
      parsedInitOptions.profile = matchProfileNameFromInput(commandArguments[argumentIndex + 1] || '');
      argumentIndex += 1;
      continue;
    }

    if (currentArgument === '--preset') {
      parsedInitOptions.preset = normalizeChoiceInput(commandArguments[argumentIndex + 1] || '');
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith('--preset=')) {
      parsedInitOptions.preset = normalizeChoiceInput(currentArgument.split('=')[1]);
      continue;
    }

    if (currentArgument.startsWith('--profile=')) {
      parsedInitOptions.profile = matchProfileNameFromInput(currentArgument.split('=')[1]);
      continue;
    }

    if (currentArgument === '--stack') {
      parsedInitOptions.stack = commandArguments[argumentIndex + 1];
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith('--stack=')) {
      parsedInitOptions.stack = currentArgument.split('=')[1];
      continue;
    }

    if (currentArgument === '--blueprint') {
      parsedInitOptions.blueprint = commandArguments[argumentIndex + 1];
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith('--blueprint=')) {
      parsedInitOptions.blueprint = currentArgument.split('=')[1];
      continue;
    }

    if (currentArgument === '--ci') {
      const ciRawValue = commandArguments[argumentIndex + 1];
      parsedInitOptions.ci = ciRawValue?.toLowerCase() === 'true';
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith('--ci=')) {
      parsedInitOptions.ci = currentArgument.split('=')[1]?.toLowerCase() === 'true';
      continue;
    }

    if (currentArgument === '--newbie') {
      parsedInitOptions.newbie = true;
      continue;
    }

    if (currentArgument === '--token-optimize') {
      parsedInitOptions.tokenOptimize = true;
      continue;
    }

    if (currentArgument === '--memory-continuity') {
      parsedInitOptions.memoryContinuity = true;
      continue;
    }

    if (currentArgument === '--token-agent') {
      parsedInitOptions.tokenAgent = commandArguments[argumentIndex + 1] || 'copilot';
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith('--token-agent=')) {
      parsedInitOptions.tokenAgent = currentArgument.split('=')[1] || 'copilot';
      continue;
    }

    if (currentArgument === '--no-token-optimize') {
      parsedInitOptions.tokenOptimize = false;
      continue;
    }

    if (currentArgument === '--no-memory-continuity') {
      parsedInitOptions.memoryContinuity = false;
      continue;
    }

    if (currentArgument === '--mcp-template') {
      parsedInitOptions.includeMcpTemplate = true;
      continue;
    }

    if (currentArgument === '--no-mcp-template') {
      parsedInitOptions.includeMcpTemplate = false;
      continue;
    }

    if (currentArgument === '--scaffold-docs') {
      parsedInitOptions.scaffoldDocs = true;
      continue;
    }

    if (currentArgument === '--no-scaffold-docs') {
      parsedInitOptions.scaffoldDocs = false;
      continue;
    }

    if (currentArgument === '--docs-lang') {
      parsedInitOptions.docsLang = commandArguments[argumentIndex + 1] || 'en';
      parsedInitOptions.docsLangProvided = true;
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith('--docs-lang=')) {
      parsedInitOptions.docsLang = currentArgument.split('=')[1] || 'en';
      parsedInitOptions.docsLangProvided = true;
      continue;
    }

    if (currentArgument === '--project-config') {
      parsedInitOptions.projectConfig = commandArguments[argumentIndex + 1];
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith('--project-config=')) {
      parsedInitOptions.projectConfig = currentArgument.split('=')[1];
      continue;
    }

    if (currentArgument === '--project-description') {
      parsedInitOptions.projectDescription = commandArguments[argumentIndex + 1] || '';
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith('--project-description=')) {
      parsedInitOptions.projectDescription = currentArgument.split('=')[1] || '';
      continue;
    }

    if (currentArgument === '--runtime-env') {
      parsedInitOptions.runtimeEnv = commandArguments[argumentIndex + 1] || 'auto';
      parsedInitOptions.runtimeEnvProvided = true;
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith('--runtime-env=')) {
      parsedInitOptions.runtimeEnv = currentArgument.split('=')[1] || 'auto';
      parsedInitOptions.runtimeEnvProvided = true;
      continue;
    }

    throw new Error(`Unknown option: ${currentArgument}`);
  }

  if (parsedInitOptions.newbie && parsedInitOptions.profile && parsedInitOptions.profile !== 'beginner') {
    throw new Error('--newbie can only be combined with --profile beginner');
  }

  const normalizedDocsLanguage = normalizeDocsLanguage(parsedInitOptions.docsLang || 'en');
  if (!normalizedDocsLanguage) {
    throw new Error('--docs-lang must be one of: en, id');
  }

  const normalizedRuntimeEnvironment = normalizeRuntimeEnvironmentKey(parsedInitOptions.runtimeEnv || 'auto');
  if (!normalizedRuntimeEnvironment) {
    throw new Error('--runtime-env must be one of: auto, linux-wsl, linux, windows, macos');
  }

  parsedInitOptions.docsLang = normalizedDocsLanguage;
  parsedInitOptions.runtimeEnv = normalizedRuntimeEnvironment;
  parsedInitOptions.tokenAgent = normalizeAgentName(parsedInitOptions.tokenAgent);

  return parsedInitOptions;
}
