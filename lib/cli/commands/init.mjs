/**
 * Init Command — Interactive project initialization.
 * Depends on: constants, utils, profile-packs, skill-selector, detector, compiler
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import path from 'node:path';

import {
  CLI_VERSION,
  AGENT_CONTEXT_DIR,
  INIT_PRESETS,
  PROFILE_PRESETS,
  GOLDEN_STANDARD_PROFILE_NAME,
  BLUEPRINT_RECOMMENDATIONS,
  PROJECT_SCOPE_CHOICES,
  PROJECT_SCOPE_STACK_FILTERS,
  WEB_FRONTEND_STACK_CANDIDATES,
  WEB_BACKEND_STACK_CANDIDATES,
  WEB_FRONTEND_BLUEPRINT_CANDIDATES,
  WEB_BACKEND_BLUEPRINT_CANDIDATES,
  RUNTIME_ENVIRONMENT_CHOICES,
} from '../constants.mjs';

import {
  ensureDirectory,
  askChoice,
  askYesNo,
  toTitleCase,
  normalizeChoiceInput,
  matchFileNameFromInput,
  matchProfileNameFromInput,
  collectFileNames,
  formatBlockingSeverities,
  formatDuration,
  copyGovernanceAssetsToTarget,
} from '../utils.mjs';

import { collectProfilePacks, findProfilePackByInput } from '../profile-packs.mjs';
import { inferSkillDomainNamesFromSelection } from '../skill-selector.mjs';
import { detectProjectContext, buildDetectionSummary, formatDetectionCandidates } from '../detector.mjs';
import { compileDynamicContext, writeSelectedPolicy, writeOnboardingReport } from '../compiler.mjs';
import { runPreflightChecks } from '../preflight.mjs';
import { createBackup } from '../backup.mjs';
import {
  runProjectDiscovery,
  generateProjectDocumentation,
  isDirectoryEffectivelyEmpty,
  hasExistingProjectDocs,
  loadProjectConfig,
  normalizeDocsLanguage,
} from '../project-scaffolder.mjs';
import { performRollback } from '../rollback.mjs';
import {
  createTokenOptimizationState,
  detectRtkBinary,
  normalizeAgentName,
  writeTokenOptimizationState,
} from '../token-optimization.mjs';
import {
  createMemoryContinuityState,
  writeMemoryContinuityState,
} from '../memory-continuity.mjs';
import { evaluateSkillDomainCompatibility } from '../compatibility.mjs';
import {
  ARCHITECT_DEFAULT_TOKEN_BUDGET,
  ARCHITECT_DEFAULT_TIMEOUT_MS,
  ARCHITECT_MIN_TOKEN_BUDGET,
  ARCHITECT_MAX_TOKEN_BUDGET,
  ARCHITECT_MIN_TIMEOUT_MS,
  ARCHITECT_MAX_TIMEOUT_MS,
  recommendArchitecture,
  formatArchitectureRecommendation,
  readArchitectPreferenceState,
  createUpdatedArchitectPreference,
  shouldApplyRepeatedOverridePreference,
  writeArchitectPreferenceState,
} from '../architect.mjs';

export { REPO_ROOT } from '../constants.mjs';

const INIT_DEFAULT_RESEARCH_MODE = 'realtime';

export function parseInitArguments(commandArguments) {
  const parsedInitOptions = {
    targetDirectory: '.',
    preset: undefined,
    profile: undefined,
    profilePack: undefined,
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
    architectTokenBudget: ARCHITECT_DEFAULT_TOKEN_BUDGET,
    architectTimeoutMs: ARCHITECT_DEFAULT_TIMEOUT_MS,
    architectResearchMode: INIT_DEFAULT_RESEARCH_MODE,
    enableRealtimeResearch: true,
    architectRealtimeSignalFile: null,
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

    if (currentArgument === '--profile-pack') {
      parsedInitOptions.profilePack = commandArguments[argumentIndex + 1];
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith('--profile-pack=')) {
      parsedInitOptions.profilePack = currentArgument.split('=')[1];
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

    if (currentArgument === '--architect-token-budget') {
      const rawTokenBudget = Number.parseInt(commandArguments[argumentIndex + 1], 10);
      if (Number.isNaN(rawTokenBudget)) {
        throw new Error('--architect-token-budget must be a number');
      }
      parsedInitOptions.architectTokenBudget = rawTokenBudget;
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith('--architect-token-budget=')) {
      const rawTokenBudget = Number.parseInt(currentArgument.split('=')[1], 10);
      if (Number.isNaN(rawTokenBudget)) {
        throw new Error('--architect-token-budget must be a number');
      }
      parsedInitOptions.architectTokenBudget = rawTokenBudget;
      continue;
    }

    if (currentArgument === '--architect-timeout-ms') {
      const rawTimeoutMs = Number.parseInt(commandArguments[argumentIndex + 1], 10);
      if (Number.isNaN(rawTimeoutMs)) {
        throw new Error('--architect-timeout-ms must be a number');
      }
      parsedInitOptions.architectTimeoutMs = rawTimeoutMs;
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith('--architect-timeout-ms=')) {
      const rawTimeoutMs = Number.parseInt(currentArgument.split('=')[1], 10);
      if (Number.isNaN(rawTimeoutMs)) {
        throw new Error('--architect-timeout-ms must be a number');
      }
      parsedInitOptions.architectTimeoutMs = rawTimeoutMs;
      continue;
    }

    if (currentArgument === '--architect-research-mode') {
      parsedInitOptions.architectResearchMode = commandArguments[argumentIndex + 1] || INIT_DEFAULT_RESEARCH_MODE;
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith('--architect-research-mode=')) {
      parsedInitOptions.architectResearchMode = currentArgument.split('=')[1] || INIT_DEFAULT_RESEARCH_MODE;
      continue;
    }

    if (currentArgument === '--enable-realtime-research') {
      parsedInitOptions.enableRealtimeResearch = true;
      continue;
    }

    if (currentArgument === '--disable-realtime-research') {
      parsedInitOptions.enableRealtimeResearch = false;
      continue;
    }

    if (currentArgument === '--architect-realtime-signal-file') {
      parsedInitOptions.architectRealtimeSignalFile = commandArguments[argumentIndex + 1] || null;
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith('--architect-realtime-signal-file=')) {
      parsedInitOptions.architectRealtimeSignalFile = currentArgument.split('=')[1] || null;
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

  if (!Number.isInteger(parsedInitOptions.architectTokenBudget)
    || parsedInitOptions.architectTokenBudget < ARCHITECT_MIN_TOKEN_BUDGET
    || parsedInitOptions.architectTokenBudget > ARCHITECT_MAX_TOKEN_BUDGET) {
    throw new Error(`--architect-token-budget must be an integer between ${ARCHITECT_MIN_TOKEN_BUDGET} and ${ARCHITECT_MAX_TOKEN_BUDGET}`);
  }

  if (!Number.isInteger(parsedInitOptions.architectTimeoutMs)
    || parsedInitOptions.architectTimeoutMs < ARCHITECT_MIN_TIMEOUT_MS
    || parsedInitOptions.architectTimeoutMs > ARCHITECT_MAX_TIMEOUT_MS) {
    throw new Error(`--architect-timeout-ms must be an integer between ${ARCHITECT_MIN_TIMEOUT_MS} and ${ARCHITECT_MAX_TIMEOUT_MS}`);
  }

  const normalizedArchitectResearchMode = normalizeChoiceInput(
    parsedInitOptions.architectResearchMode || INIT_DEFAULT_RESEARCH_MODE
  );
  const supportedArchitectResearchModes = new Set(['snapshot', 'realtime']);
  if (!supportedArchitectResearchModes.has(normalizedArchitectResearchMode)) {
    throw new Error('--architect-research-mode must be one of: snapshot, realtime');
  }

  parsedInitOptions.docsLang = normalizedDocsLanguage;
  parsedInitOptions.runtimeEnv = normalizedRuntimeEnvironment;
  parsedInitOptions.tokenAgent = normalizeAgentName(parsedInitOptions.tokenAgent);
  parsedInitOptions.architectResearchMode = normalizedArchitectResearchMode;

  return parsedInitOptions;
}

export function filterStackFileNamesByCandidates(allStackFileNames, preferredStackFileNames) {
  if (!Array.isArray(preferredStackFileNames) || preferredStackFileNames.length === 0) {
    return allStackFileNames;
  }

  const filteredStackFileNames = preferredStackFileNames.filter((stackFileName) => allStackFileNames.includes(stackFileName));
  return filteredStackFileNames.length > 0 ? filteredStackFileNames : allStackFileNames;
}

export function filterBlueprintFileNamesByCandidates(allBlueprintFileNames, preferredBlueprintFileNames) {
  if (!Array.isArray(preferredBlueprintFileNames) || preferredBlueprintFileNames.length === 0) {
    return allBlueprintFileNames;
  }

  const filteredBlueprintFileNames = preferredBlueprintFileNames.filter(
    (blueprintFileName) => allBlueprintFileNames.includes(blueprintFileName)
  );

  return filteredBlueprintFileNames.length > 0 ? filteredBlueprintFileNames : allBlueprintFileNames;
}

export function normalizeRuntimeEnvironmentKey(rawRuntimeEnvironmentKey) {
  const normalizedRuntimeEnvironmentKey = normalizeChoiceInput(String(rawRuntimeEnvironmentKey || 'auto'));
  const supportedRuntimeEnvironmentKeys = new Set(['auto', 'linux-wsl', 'linux', 'windows', 'macos']);
  return supportedRuntimeEnvironmentKeys.has(normalizedRuntimeEnvironmentKey) ? normalizedRuntimeEnvironmentKey : null;
}

export function resolveRuntimeEnvironmentKeyFromLabel(selectedRuntimeEnvironmentLabel) {
  const runtimeEnvironmentEntry = RUNTIME_ENVIRONMENT_CHOICES.find(
    (runtimeEnvironmentChoice) => runtimeEnvironmentChoice.label === selectedRuntimeEnvironmentLabel
  );

  return runtimeEnvironmentEntry?.key || null;
}

export function resolveRuntimeEnvironmentLabelFromKey(runtimeEnvironmentKey) {
  const runtimeEnvironmentEntry = RUNTIME_ENVIRONMENT_CHOICES.find(
    (runtimeEnvironmentChoice) => runtimeEnvironmentChoice.key === runtimeEnvironmentKey
  );

  return runtimeEnvironmentEntry?.label || runtimeEnvironmentKey;
}

export function detectRuntimeEnvironment() {
  const isWslEnvironment = Boolean(process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP || process.env.__IS_WSL_TEST__);

  if (isWslEnvironment) {
    return {
      key: 'linux-wsl',
      label: resolveRuntimeEnvironmentLabelFromKey('linux-wsl'),
      shellFamily: 'bash',
      isAutoDetected: true,
      source: 'WSL environment markers',
    };
  }

  if (process.platform === 'win32') {
    return {
      key: 'windows',
      label: resolveRuntimeEnvironmentLabelFromKey('windows'),
      shellFamily: 'powershell',
      isAutoDetected: true,
      source: 'process.platform',
    };
  }

  if (process.platform === 'darwin') {
    return {
      key: 'macos',
      label: resolveRuntimeEnvironmentLabelFromKey('macos'),
      shellFamily: 'bash',
      isAutoDetected: true,
      source: 'process.platform',
    };
  }

  return {
    key: 'linux',
    label: resolveRuntimeEnvironmentLabelFromKey('linux'),
    shellFamily: 'bash',
    isAutoDetected: true,
    source: 'process.platform',
  };
}

export function resolveProjectScopeKeyFromLabel(selectedProjectScopeLabel) {
  const projectScopeEntry = PROJECT_SCOPE_CHOICES.find((scopeChoice) => scopeChoice.label === selectedProjectScopeLabel);
  return projectScopeEntry?.key || 'other';
}

export function normalizeAdditionalStackSelection(selectedStackFileName, additionalStackFileNames) {
  if (!Array.isArray(additionalStackFileNames) || additionalStackFileNames.length === 0) {
    return [];
  }

  return Array.from(new Set(additionalStackFileNames.filter((stackFileName) => stackFileName && stackFileName !== selectedStackFileName)));
}

export function normalizeAdditionalBlueprintSelection(selectedBlueprintFileName, additionalBlueprintFileNames) {
  if (!Array.isArray(additionalBlueprintFileNames) || additionalBlueprintFileNames.length === 0) {
    return [];
  }

  return Array.from(new Set(additionalBlueprintFileNames.filter(
    (blueprintFileName) => blueprintFileName && blueprintFileName !== selectedBlueprintFileName
  )));
}

function deriveAdditionalBlueprintFileNamesFromStacks(additionalStackFileNames, allBlueprintFileNames, selectedBlueprintFileName) {
  const derivedBlueprintFileNames = [];

  for (const additionalStackFileName of additionalStackFileNames || []) {
    const mappedBlueprintFileName = BLUEPRINT_RECOMMENDATIONS[additionalStackFileName];
    if (!mappedBlueprintFileName) {
      continue;
    }

    if (!allBlueprintFileNames.includes(mappedBlueprintFileName)) {
      continue;
    }

    if (mappedBlueprintFileName === selectedBlueprintFileName) {
      continue;
    }

    derivedBlueprintFileNames.push(mappedBlueprintFileName);
  }

  return Array.from(new Set(derivedBlueprintFileNames));
}

async function askStackSelection(promptMessage, selectableStackFileNames, userInterface) {
  const stackDisplayChoices = selectableStackFileNames.map((stackFileName) => toTitleCase(stackFileName));
  const selectedDisplayChoice = await askChoice(promptMessage, stackDisplayChoices, userInterface);
  const selectedIndex = stackDisplayChoices.indexOf(selectedDisplayChoice);
  return selectableStackFileNames[selectedIndex] || selectableStackFileNames[0] || null;
}

async function askBlueprintSelection(promptMessage, selectableBlueprintFileNames, userInterface) {
  const blueprintDisplayChoices = selectableBlueprintFileNames.map((blueprintFileName) => toTitleCase(blueprintFileName));
  const selectedDisplayChoice = await askChoice(promptMessage, blueprintDisplayChoices, userInterface);
  const selectedIndex = blueprintDisplayChoices.indexOf(selectedDisplayChoice);
  return selectableBlueprintFileNames[selectedIndex] || selectableBlueprintFileNames[0] || null;
}

function buildExistingProjectMajorConstraints() {
  return [
    'Preserve existing project markers and avoid forced stack migration.',
    'Keep stack rule loading lazy and scoped to touched code.',
    'Explicit stack or blueprint overrides always win over auto-detection.',
  ];
}

export async function runInitCommand(targetDirectoryArgument, initOptions = {}) {
  const resolvedTargetDirectoryPath = path.resolve(targetDirectoryArgument || '.');
  const isTokenOptimizationEnabled = typeof initOptions.tokenOptimize === 'boolean'
    ? initOptions.tokenOptimize
    : true;
  const isMemoryContinuityEnabled = typeof initOptions.memoryContinuity === 'boolean'
    ? initOptions.memoryContinuity
    : true;
  const shouldIncludeMcpTemplate = initOptions.includeMcpTemplate === true;
  const selectedTokenAgentName = normalizeAgentName(initOptions.tokenAgent || 'copilot');
  const isInteractiveSession = Boolean(stdin.isTTY && stdout.isTTY);

  if (resolvedTargetDirectoryPath.toLowerCase() === 'c:\\windows' || resolvedTargetDirectoryPath.toLowerCase() === 'c:\\windows\\system32') {
    console.error('\n[FATAL] Target directory resolved to a Windows system folder (C:\\Windows).');
    console.error('If you are running Windows npm from inside WSL, this is caused by cmd.exe lacking UNC path support.');
    console.error('Please install and use a native Linux Node.js/npm directly inside WSL to setup your project.');
    process.exit(1);
  }

  const setupStartedAt = Date.now();
  await ensureDirectory(resolvedTargetDirectoryPath);

  const preflightResult = await runPreflightChecks(resolvedTargetDirectoryPath, 'init');
  if (!preflightResult.passed) {
      console.error('\n[FATAL] Preflight checks failed. Initializing here would cause errors or data loss:');
      console.error(JSON.stringify(preflightResult, null, 2));
      throw new Error('Preflight checks failed.');
  }

  const wasDirectoryEffectivelyEmpty = await isDirectoryEffectivelyEmpty(resolvedTargetDirectoryPath);
  const hadExistingProjectDocsBeforeInit = await hasExistingProjectDocs(resolvedTargetDirectoryPath);

  const backup = await createBackup(resolvedTargetDirectoryPath);

  const userInterface = createInterface({ input: stdin, output: stdout });

  try {
    const stackFileNames = await collectFileNames(path.join(AGENT_CONTEXT_DIR, 'stacks'));
    const blueprintFileNames = await collectFileNames(path.join(AGENT_CONTEXT_DIR, 'blueprints'));
    const profilePackDefinitions = await collectProfilePacks(path.dirname(AGENT_CONTEXT_DIR));
    const selectedPreset = initOptions.preset ? INIT_PRESETS[initOptions.preset] || null : null;

    const selectedStackFileNameFromOption = initOptions.stack
      ? matchFileNameFromInput(initOptions.stack, stackFileNames)
      : null;
    const selectedBlueprintFileNameFromOption = initOptions.blueprint
      ? matchFileNameFromInput(initOptions.blueprint, blueprintFileNames)
      : null;
    const selectedProfilePack = initOptions.profilePack
      ? findProfilePackByInput(initOptions.profilePack, profilePackDefinitions)
      : null;

    if (initOptions.stack && !selectedStackFileNameFromOption) {
      throw new Error(`Unknown stack: ${initOptions.stack}`);
    }

    if (initOptions.blueprint && !selectedBlueprintFileNameFromOption) {
      throw new Error(`Unknown blueprint: ${initOptions.blueprint}`);
    }

    if (initOptions.profilePack && !selectedProfilePack) {
      throw new Error(`Unknown profile pack: ${initOptions.profilePack}`);
    }

    if (initOptions.preset && !selectedPreset) {
      throw new Error(`Unknown preset: ${initOptions.preset}`);
    }

    if (selectedProfilePack && !stackFileNames.includes(selectedProfilePack.defaultStackFileName)) {
      throw new Error(
        `Profile pack ${selectedProfilePack.fileName} references unknown stack file: ${selectedProfilePack.defaultStackFileName}`
      );
    }

    if (selectedProfilePack && !blueprintFileNames.includes(selectedProfilePack.defaultBlueprintFileName)) {
      throw new Error(
        `Profile pack ${selectedProfilePack.fileName} references unknown blueprint file: ${selectedProfilePack.defaultBlueprintFileName}`
      );
    }

    console.log(`\nAgentic-Senior-Core CLI v${CLI_VERSION}`);
    console.log('I will copy rules operations assets (Federated Governance baseline) into your target folder and compile a single rulebook for your AI tools.');

    if (selectedPreset) {
      console.log(`Using preset: ${initOptions.preset} (${selectedPreset.description}).`);
    }

    const projectDetection = await detectProjectContext(resolvedTargetDirectoryPath);
    if (projectDetection.hasExistingProjectFiles) {
      console.log('I found files in the target directory, so I checked whether this already looks like an existing project.');
      console.log(buildDetectionSummary(projectDetection));
      console.log('Detection reasoning:');
      console.log(projectDetection.detectionReasoning);
      console.log('Top candidates:');
      console.log(formatDetectionCandidates(projectDetection.rankedCandidates));
    } else {
      console.log('The target directory is empty, so I will guide you through a fresh setup.');
    }

    const detectedRuntimeEnvironment = detectRuntimeEnvironment();
    let selectedRuntimeEnvironmentKey = initOptions.runtimeEnv === 'auto'
      ? detectedRuntimeEnvironment.key
      : initOptions.runtimeEnv;

    if (isInteractiveSession && !initOptions.runtimeEnvProvided) {
      const defaultRuntimeEnvironmentLabel = resolveRuntimeEnvironmentLabelFromKey(selectedRuntimeEnvironmentKey);
      const orderedRuntimeEnvironmentChoices = [
        defaultRuntimeEnvironmentLabel,
        ...RUNTIME_ENVIRONMENT_CHOICES
          .map((runtimeEnvironmentChoice) => runtimeEnvironmentChoice.label)
          .filter((runtimeEnvironmentLabel) => runtimeEnvironmentLabel !== defaultRuntimeEnvironmentLabel),
      ];

      const selectedRuntimeEnvironmentLabel = await askChoice(
        `Runtime environment (auto-detected: ${defaultRuntimeEnvironmentLabel}).`,
        orderedRuntimeEnvironmentChoices,
        userInterface
      );

      selectedRuntimeEnvironmentKey = resolveRuntimeEnvironmentKeyFromLabel(selectedRuntimeEnvironmentLabel)
        || selectedRuntimeEnvironmentKey;
    }

    const hasExplicitProfileSelection = Boolean(
      initOptions.profile
      || selectedPreset?.profile
      || initOptions.newbie
      || selectedProfilePack?.defaultProfileName
    );

    const selectedProfileName = initOptions.profile
      ? initOptions.profile
      : selectedPreset?.profile
        ? selectedPreset.profile
        : initOptions.newbie
          ? 'beginner'
          : selectedProfilePack?.defaultProfileName
            ? selectedProfilePack.defaultProfileName
            : GOLDEN_STANDARD_PROFILE_NAME;

    const selectedProfile = PROFILE_PRESETS[selectedProfileName];
    if (!selectedProfile) {
      throw new Error(`Unknown profile: ${selectedProfileName}`);
    }

    if (!hasExplicitProfileSelection) {
      console.log(`Golden Standard mode enabled. Using ${selectedProfile.displayName} profile by default.`);
    }

    console.log(`\nSelected profile: ${selectedProfile.displayName}`);
    console.log(`This profile will block these review severities in CI: ${formatBlockingSeverities(selectedProfile.blockingSeverities)}.`);

    const detectionMajorConstraints = buildExistingProjectMajorConstraints();
    const detectionTransparency = {
      declaredAt: new Date().toISOString(),
      declarationType: projectDetection.hasExistingProjectFiles ? 'existing-project' : 'fresh-project',
      declarationShown: projectDetection.hasExistingProjectFiles,
      detectionSummary: projectDetection.hasExistingProjectFiles
        ? buildDetectionSummary(projectDetection)
        : 'No existing project markers were detected.',
      activeRulesSummary: {
        canonicalSource: '.instructions.md',
        compiledEntrypoints: ['.cursorrules', '.windsurfrules'],
        stackLoadingMode: 'lazy',
        selectedProfile: selectedProfileName,
        selectedProfileDisplayName: selectedProfile.displayName,
        blockingSeverities: selectedProfile.blockingSeverities,
        ciGuardrailsEnabled: null,
      },
      majorConstraints: detectionMajorConstraints,
      quickConfirmation: {
        offered: false,
        response: projectDetection.hasExistingProjectFiles ? 'pending' : 'not-applicable',
        source: 'existing-project-detection',
      },
      decision: {
        mode: projectDetection.hasExistingProjectFiles ? 'pending' : 'fresh-directory',
        selectedStackFileName: null,
        selectedBlueprintFileName: null,
      },
    };

    if (projectDetection.hasExistingProjectFiles) {
      console.log('\nExisting project detection transparency:');

      if (projectDetection.recommendedStackFileName) {
        const confidenceScoreLabel = Number(projectDetection.confidenceScore || 0).toFixed(2);
        console.log(
          `- Detected stack: ${toTitleCase(projectDetection.recommendedStackFileName)} (${projectDetection.confidenceLabel}, score ${confidenceScoreLabel})`
        );

        if (projectDetection.secondaryStackFileNames?.length) {
          console.log(
            `- Secondary stack signals: ${projectDetection.secondaryStackFileNames.map((stackFileName) => toTitleCase(stackFileName)).join(', ')}`
          );
        }
      } else {
        console.log('- Detected stack: unresolved (insufficient markers).');
      }

      console.log('- Active rules baseline: canonical .instructions.md -> compiled .cursorrules/.windsurfrules');
      console.log(
        `- Active review profile: ${selectedProfile.displayName} (blocking severities: ${formatBlockingSeverities(selectedProfile.blockingSeverities)})`
      );
      console.log('- Major constraints:');
      for (const majorConstraint of detectionMajorConstraints) {
        console.log(`  - ${majorConstraint}`);
      }
    }

    if (selectedProfilePack) {
      console.log(`Applying team profile pack: ${selectedProfilePack.displayName}.`);
      console.log(`Pack defaults: stack ${toTitleCase(selectedProfilePack.defaultStackFileName)}, blueprint ${toTitleCase(selectedProfilePack.defaultBlueprintFileName)}.`);
    }

    const hasReliableDetectedStack = projectDetection.hasExistingProjectFiles
      && projectDetection.recommendedStackFileName
      && (projectDetection.confidenceLabel === 'high' || projectDetection.confidenceLabel === 'medium');

    const shouldAutoApplyDetectedStack = hasReliableDetectedStack
      && !selectedStackFileNameFromOption
      && !selectedPreset?.stack
      && !selectedProfilePack?.defaultStackFileName;
    const detectedBlueprintFileName = projectDetection.recommendedBlueprintFileName
      || BLUEPRINT_RECOMMENDATIONS[projectDetection.recommendedStackFileName]
      || null;

    let selectedManualStackFileName = null;
    let selectedManualBlueprintFileName = null;
    let selectedAdditionalStackFileNames = [];
    let selectedAdditionalBlueprintFileNames = [];
    let detectedSetupWasApplied = false;

    let architectureRecommendation = null;
    let architectPreferenceState = await readArchitectPreferenceState();
    let architectPreferenceUpdated = false;

    const shouldRunArchitectureRecommendation = !selectedStackFileNameFromOption
      && !selectedPreset?.stack
      && !shouldAutoApplyDetectedStack
      && !selectedProfilePack?.defaultStackFileName
      && !selectedProfile.defaultStackFileName;

    if (shouldAutoApplyDetectedStack) {
      if (isInteractiveSession) {
        detectionTransparency.quickConfirmation.offered = true;
        console.log('\nQuick confirmation for existing project detection:');
        console.log(`- Suggested stack: ${toTitleCase(projectDetection.recommendedStackFileName)}`);
        if (detectedBlueprintFileName) {
          console.log(`- Suggested blueprint: ${toTitleCase(detectedBlueprintFileName)}`);
        }

        const shouldUseDetectedSetup = await askYesNo(
          'Use detected setup for this existing project?',
          userInterface,
          true
        );

        if (shouldUseDetectedSetup) {
          detectedSetupWasApplied = true;
          detectionTransparency.quickConfirmation.response = 'confirmed-detected';
          detectionTransparency.decision.mode = 'confirmed-detected';
          console.log(`Using detected stack automatically for this existing project: ${toTitleCase(projectDetection.recommendedStackFileName)}.`);
          if (projectDetection.secondaryStackFileNames?.length) {
            console.log(`Detected additional stack signals: ${projectDetection.secondaryStackFileNames.map((stackFileName) => toTitleCase(stackFileName)).join(', ')}.`);
          }
          selectedAdditionalStackFileNames = projectDetection.secondaryStackFileNames || [];
        } else {
          const overrideStackFileName = await askStackSelection(
            'Override detected stack (quick selection):',
            stackFileNames,
            userInterface
          );
          const overrideBlueprintCandidates = filterBlueprintFileNamesByCandidates(
            blueprintFileNames,
            [BLUEPRINT_RECOMMENDATIONS[overrideStackFileName]].filter(Boolean)
          );
          const overrideBlueprintFileName = await askBlueprintSelection(
            'Override detected blueprint (quick selection):',
            overrideBlueprintCandidates,
            userInterface
          );

          selectedManualStackFileName = overrideStackFileName;
          selectedManualBlueprintFileName = overrideBlueprintFileName;
          selectedAdditionalStackFileNames = normalizeAdditionalStackSelection(
            overrideStackFileName,
            projectDetection.secondaryStackFileNames || []
          );
          detectionTransparency.quickConfirmation.response = 'overridden-detected';
          detectionTransparency.decision.mode = 'overridden-detected';
          console.log(
            `Detection override applied: ${toTitleCase(overrideStackFileName)} + ${toTitleCase(overrideBlueprintFileName)}.`
          );
        }
      } else {
        detectedSetupWasApplied = true;
        detectionTransparency.quickConfirmation.response = 'non-interactive-auto';
        detectionTransparency.decision.mode = 'non-interactive-auto';
        console.log(`Using detected stack automatically for this existing project: ${toTitleCase(projectDetection.recommendedStackFileName)}.`);
        if (projectDetection.secondaryStackFileNames?.length) {
          console.log(`Detected additional stack signals: ${projectDetection.secondaryStackFileNames.map((stackFileName) => toTitleCase(stackFileName)).join(', ')}.`);
        }
        selectedAdditionalStackFileNames = projectDetection.secondaryStackFileNames || [];
      }
    } else if (projectDetection.hasExistingProjectFiles && projectDetection.recommendedStackFileName) {
      detectionTransparency.quickConfirmation.response = 'explicit-selection-or-low-confidence';
      detectionTransparency.decision.mode = 'explicit-selection-or-low-confidence';
    } else if (!projectDetection.hasExistingProjectFiles) {
      detectionTransparency.quickConfirmation.response = 'not-applicable';
      detectionTransparency.decision.mode = 'fresh-directory';
    }

    if (shouldRunArchitectureRecommendation) {
      let architectureProjectDescription = String(initOptions.projectDescription || '').trim();

      if (!architectureProjectDescription && isInteractiveSession) {
        architectureProjectDescription = (await userInterface.question(
          '\nDescribe your project in one short paragraph for architecture recommendation: '
        )).trim();
      }

      if (!architectureProjectDescription) {
        architectureProjectDescription = `A software project named ${path.basename(resolvedTargetDirectoryPath)}.`;
      }

      architectureRecommendation = recommendArchitecture({
        projectDescription: architectureProjectDescription,
        projectDetection,
        stackFileNames,
        blueprintFileNames,
        tokenBudget: initOptions.architectTokenBudget,
        timeoutMs: initOptions.architectTimeoutMs,
        researchMode: initOptions.architectResearchMode,
        enableRealtimeResearch: initOptions.enableRealtimeResearch,
        realtimeSignalFilePath: initOptions.architectRealtimeSignalFile,
      });

      architectureRecommendation.userVeto = {
        applied: false,
        selectedStackFileName: architectureRecommendation.recommendedStackFileName,
        selectedBlueprintFileName: architectureRecommendation.recommendedBlueprintFileName,
        source: 'recommendation',
      };

      console.log(formatArchitectureRecommendation(architectureRecommendation));

      const shouldSkipRecommendationDebate = shouldApplyRepeatedOverridePreference(
        architectPreferenceState,
        architectureRecommendation.recommendedStackFileName
      );

      if (shouldSkipRecommendationDebate) {
        architectureRecommendation.failureModes.repeatedOverride = true;
        selectedManualStackFileName = stackFileNames.includes(architectPreferenceState.preferredStackFileName)
          ? architectPreferenceState.preferredStackFileName
          : architectureRecommendation.recommendedStackFileName;
        selectedManualBlueprintFileName = blueprintFileNames.includes(architectPreferenceState.preferredBlueprintFileName)
          ? architectPreferenceState.preferredBlueprintFileName
          : architectureRecommendation.recommendedBlueprintFileName;
        architectureRecommendation.userVeto = {
          applied: true,
          selectedStackFileName: selectedManualStackFileName,
          selectedBlueprintFileName: selectedManualBlueprintFileName,
          source: 'saved-preference',
        };
        console.log(
          `Repeated override preference detected. Applying ${toTitleCase(selectedManualStackFileName)} + ${toTitleCase(selectedManualBlueprintFileName)} without additional debate.`
        );
      } else if (!isInteractiveSession) {
        selectedManualStackFileName = architectureRecommendation.recommendedStackFileName;
        selectedManualBlueprintFileName = architectureRecommendation.recommendedBlueprintFileName;
      } else {
        const shouldApplyRecommendedArchitecture = await askYesNo(
          'Apply this architecture recommendation?',
          userInterface,
          true
        );

        if (shouldApplyRecommendedArchitecture) {
          selectedManualStackFileName = architectureRecommendation.recommendedStackFileName;
          selectedManualBlueprintFileName = architectureRecommendation.recommendedBlueprintFileName;
        } else {
          const vetoStackFileName = await askStackSelection(
            'User veto received. Select stack to apply immediately:',
            stackFileNames,
            userInterface
          );

          const vetoBlueprintCandidates = filterBlueprintFileNamesByCandidates(
            blueprintFileNames,
            [BLUEPRINT_RECOMMENDATIONS[vetoStackFileName]].filter(Boolean)
          );

          const vetoBlueprintFileName = await askBlueprintSelection(
            'Select blueprint to apply immediately (no further debate):',
            vetoBlueprintCandidates,
            userInterface
          );

          selectedManualStackFileName = vetoStackFileName;
          selectedManualBlueprintFileName = vetoBlueprintFileName;
          architectureRecommendation.userVeto = {
            applied: true,
            selectedStackFileName: vetoStackFileName,
            selectedBlueprintFileName: vetoBlueprintFileName,
            source: 'interactive-veto',
          };

          architectPreferenceState = createUpdatedArchitectPreference(architectPreferenceState, {
            selectedStackFileName: vetoStackFileName,
            selectedBlueprintFileName: vetoBlueprintFileName,
          });
          architectPreferenceUpdated = true;

          if (architectPreferenceState.overrideCount >= 2) {
            architectureRecommendation.failureModes.repeatedOverride = true;
          }

          console.log(
            `Veto applied. Proceeding with ${toTitleCase(vetoStackFileName)} + ${toTitleCase(vetoBlueprintFileName)} without recommendation loops.`
          );
        }
      }
    }

    const blueprintDisplayChoices = blueprintFileNames.map((blueprintFileName) => toTitleCase(blueprintFileName));

    const selectedResolvedStackFileName = selectedStackFileNameFromOption
      || selectedPreset?.stack
      || selectedManualStackFileName
      || (detectedSetupWasApplied ? projectDetection.recommendedStackFileName : null)
      || selectedProfilePack?.defaultStackFileName
      || selectedProfile.defaultStackFileName
      || stackFileNames[0];

    selectedAdditionalStackFileNames = normalizeAdditionalStackSelection(
      selectedResolvedStackFileName,
      selectedAdditionalStackFileNames
    );

    const recommendedBlueprintFileName = detectedSetupWasApplied
      && detectedBlueprintFileName
      ? detectedBlueprintFileName
      : BLUEPRINT_RECOMMENDATIONS[selectedResolvedStackFileName] || null;

    if (!recommendedBlueprintFileName && !selectedBlueprintFileNameFromOption && !selectedProfile.defaultBlueprintFileName) {
      console.log('\nI could not map that stack to a first-party blueprint automatically, so I will ask you to choose one.');
    }

    const selectedResolvedBlueprintFileName = selectedBlueprintFileNameFromOption
      || selectedPreset?.blueprint
      || selectedManualBlueprintFileName
      || recommendedBlueprintFileName
      || selectedProfilePack?.defaultBlueprintFileName
      || selectedProfile.defaultBlueprintFileName
      || blueprintFileNames[
        blueprintDisplayChoices.indexOf(
          await askChoice('Which blueprint should I scaffold into the compiled rulebook?', blueprintDisplayChoices, userInterface)
        )
      ];

    if (architectureRecommendation) {
      architectureRecommendation.appliedStackFileName = selectedResolvedStackFileName;
      architectureRecommendation.appliedBlueprintFileName = selectedResolvedBlueprintFileName;

      if (!architectureRecommendation.userVeto) {
        architectureRecommendation.userVeto = {
          applied: false,
          selectedStackFileName: selectedResolvedStackFileName,
          selectedBlueprintFileName: selectedResolvedBlueprintFileName,
          source: 'recommendation',
        };
      }
    }

    const derivedAdditionalBlueprintFileNames = deriveAdditionalBlueprintFileNamesFromStacks(
      selectedAdditionalStackFileNames,
      blueprintFileNames,
      selectedResolvedBlueprintFileName
    );

    selectedAdditionalBlueprintFileNames = normalizeAdditionalBlueprintSelection(
      selectedResolvedBlueprintFileName,
      selectedAdditionalBlueprintFileNames.length > 0
        ? selectedAdditionalBlueprintFileNames
        : derivedAdditionalBlueprintFileNames
    );

    detectionTransparency.decision.selectedStackFileName = selectedResolvedStackFileName;
    detectionTransparency.decision.selectedBlueprintFileName = selectedResolvedBlueprintFileName;
    detectionTransparency.decision.selectedAdditionalStackFileNames = selectedAdditionalStackFileNames;
    detectionTransparency.decision.selectedAdditionalBlueprintFileNames = selectedAdditionalBlueprintFileNames;
    detectionTransparency.decision.usedDetectedSetup = detectedSetupWasApplied;

    const selectedSkillDomainNames = inferSkillDomainNamesFromSelection(
      selectedResolvedStackFileName,
      selectedResolvedBlueprintFileName,
      selectedAdditionalStackFileNames,
      selectedAdditionalBlueprintFileNames
    );

    const includeCiGuardrails = typeof initOptions.ci === 'boolean'
      ? initOptions.ci
      : typeof selectedPreset?.ci === 'boolean'
        ? selectedPreset.ci
      : selectedProfilePack?.lockCi
        ? selectedProfilePack.defaultCi
        : typeof selectedProfilePack?.defaultCi === 'boolean'
          ? selectedProfilePack.defaultCi
      : selectedProfile.lockCi
        ? selectedProfile.defaultCi
        : await askYesNo('Enable CI/CD quality checks (guardrails) and the LLM Judge policy?', userInterface, selectedProfile.defaultCi);

    detectionTransparency.activeRulesSummary.ciGuardrailsEnabled = includeCiGuardrails;

    await copyGovernanceAssetsToTarget(resolvedTargetDirectoryPath, {
      includeMcpTemplate: shouldIncludeMcpTemplate,
    });

    let memoryContinuityState = null;
    if (isMemoryContinuityEnabled) {
      memoryContinuityState = createMemoryContinuityState({
        isEnabled: true,
      });

      await writeMemoryContinuityState(resolvedTargetDirectoryPath, memoryContinuityState);
      console.log(`Memory continuity policy enabled (${memoryContinuityState.hydrationMode}).`);
    }

    let tokenOptimizationState = null;
    if (isTokenOptimizationEnabled) {
      const detectedExternalProxy = detectRtkBinary();
      tokenOptimizationState = createTokenOptimizationState({
        isEnabled: true,
        selectedAgentName: selectedTokenAgentName,
        rtkDetection: detectedExternalProxy,
      });

      await writeTokenOptimizationState(resolvedTargetDirectoryPath, tokenOptimizationState);
      console.log(
        `Token optimization policy enabled for agent ${tokenOptimizationState.selectedAgent} (${tokenOptimizationState.preferredShellProxy}).`
      );
    }

    const compatibilityWarnings = await evaluateSkillDomainCompatibility(
      resolvedTargetDirectoryPath,
      selectedSkillDomainNames
    );

    if (compatibilityWarnings.length > 0) {
      console.log('\n[WARN] Compatibility checks reported potential issues for this environment:');
      for (const compatibilityWarning of compatibilityWarnings) {
        console.log(`- ${compatibilityWarning}`);
      }
      console.log('Installation will continue, but review these warnings before production use.');
    }

    // --- Project Documentation Scaffolding ---
    let scaffoldingResult = null;
    const isFreshProjectTarget = wasDirectoryEffectivelyEmpty && !hadExistingProjectDocsBeforeInit;
    const shouldOfferScaffolding = initOptions.scaffoldDocs === true
      || Boolean(initOptions.projectConfig)
      || (initOptions.scaffoldDocs !== false && isFreshProjectTarget);

    if (shouldOfferScaffolding) {
      if (initOptions.scaffoldDocs === true && !initOptions.projectConfig && !isInteractiveSession) {
        throw new Error('Non-interactive scaffolding requires --project-config when --scaffold-docs is enabled.');
      }

      const userWantsScaffolding = initOptions.scaffoldDocs === true
        || initOptions.projectConfig
        || (!isInteractiveSession
          ? false
          : await askYesNo(
            'This is a fresh project. Want me to scaffold project documentation (architecture, database, API contract, flow)?',
            userInterface,
            true
          ));

      if (userWantsScaffolding) {
        let discoveryAnswers;

        if (initOptions.projectConfig) {
          discoveryAnswers = await loadProjectConfig(initOptions.projectConfig);
          console.log(`\nLoaded project configuration from: ${initOptions.projectConfig}`);
        } else {
          discoveryAnswers = await runProjectDiscovery(userInterface, {
            defaultProjectName: path.basename(resolvedTargetDirectoryPath),
          });
        }

        const normalizedConfigDocsLanguage = normalizeDocsLanguage(discoveryAnswers.docsLang || '');
        if (discoveryAnswers.docsLang && !normalizedConfigDocsLanguage) {
          throw new Error(`Unsupported docs language in project config: ${discoveryAnswers.docsLang}. Supported values: en, id`);
        }

        // Keep generated docs in English by default to align with the writing scope.
        // A different output language is only used when explicitly requested via --docs-lang.
        const selectedDocsLanguage = initOptions.docsLang;

        if (!initOptions.docsLangProvided && normalizedConfigDocsLanguage && normalizedConfigDocsLanguage !== 'en') {
          console.log('[INFO] Project config docsLang is set, but output defaults to English. Use --docs-lang to override.');
        }

        scaffoldingResult = await generateProjectDocumentation(
          resolvedTargetDirectoryPath,
          discoveryAnswers,
          {
            stackFileName: selectedResolvedStackFileName,
            additionalStackFileNames: selectedAdditionalStackFileNames,
            blueprintFileName: selectedResolvedBlueprintFileName,
            additionalBlueprintFileNames: selectedAdditionalBlueprintFileNames,
            runtimeEnvironmentKey: selectedRuntimeEnvironmentKey,
            runtimeEnvironmentLabel: resolveRuntimeEnvironmentLabelFromKey(selectedRuntimeEnvironmentKey),
          },
          {
            docsLanguage: selectedDocsLanguage,
          }
        );

        console.log(`\nProject documentation generated in docs/:`);
        for (const generatedFileName of scaffoldingResult.generatedFileNames) {
          console.log(`  - docs/${generatedFileName}`);
        }
      }
    }

    await compileDynamicContext({
      targetDirectoryPath: resolvedTargetDirectoryPath,
      selectedProfileName,
      selectedProfilePack,
      selectedStackFileName: selectedResolvedStackFileName,
      selectedAdditionalStackFileNames,
      selectedBlueprintFileName: selectedResolvedBlueprintFileName,
      selectedAdditionalBlueprintFileNames,
      includeCiGuardrails,
    });

    await writeSelectedPolicy(resolvedTargetDirectoryPath, selectedProfileName);

    const setupDurationMs = Date.now() - setupStartedAt;
    await writeOnboardingReport({
      targetDirectoryPath: resolvedTargetDirectoryPath,
      selectedProfileName,
      selectedProfilePack,
      selectedPreset: initOptions.preset || null,
      selectedStackFileName: selectedResolvedStackFileName,
      selectedAdditionalStackFileNames,
      selectedBlueprintFileName: selectedResolvedBlueprintFileName,
      selectedAdditionalBlueprintFileNames,
      includeCiGuardrails,
      setupDurationMs,
      projectDetection,
      selectedSkillDomains: selectedSkillDomainNames,
      compatibilityWarnings,
      runtimeEnvironment: {
        selected: selectedRuntimeEnvironmentKey,
        selectedLabel: resolveRuntimeEnvironmentLabelFromKey(selectedRuntimeEnvironmentKey),
        detected: detectedRuntimeEnvironment.key,
        detectedLabel: detectedRuntimeEnvironment.label,
        detectionSource: detectedRuntimeEnvironment.source,
      },
      operationMode: 'init',
      tokenOptimization: {
        enabled: isTokenOptimizationEnabled,
        selectedAgent: selectedTokenAgentName,
        preferredShellProxy: tokenOptimizationState?.preferredShellProxy || null,
        stateFile: isTokenOptimizationEnabled ? '.agent-context/state/token-optimization.json' : null,
      },
      memoryContinuity: {
        enabled: isMemoryContinuityEnabled,
        hydrationMode: memoryContinuityState?.hydrationMode || null,
        adapters: memoryContinuityState?.adapters || [],
        stateFile: isMemoryContinuityEnabled ? '.agent-context/state/memory-continuity.json' : null,
      },
      architectRecommendation: architectureRecommendation,
      detectionTransparency,
    });

    if (architectPreferenceUpdated && architectPreferenceState) {
      await writeArchitectPreferenceState(architectPreferenceState);
    }

    console.log('\nInitialization complete.');
    console.log(`- Target directory: ${resolvedTargetDirectoryPath}`);
    console.log(`- Profile: ${selectedProfile.displayName}`);
    if (initOptions.preset) {
      console.log(`- Preset: ${initOptions.preset}`);
    }
    if (selectedProfilePack) {
      console.log(`- Team profile pack: ${selectedProfilePack.displayName}`);
    }
    if (architectureRecommendation) {
      console.log(
        `- Architect recommendation: ${toTitleCase(architectureRecommendation.recommendedStackFileName)} + ${toTitleCase(architectureRecommendation.recommendedBlueprintFileName)} (${architectureRecommendation.confidenceLabel})`
      );
      if (architectureRecommendation.userVeto?.applied) {
        console.log(
          `- User veto path: applied (${toTitleCase(architectureRecommendation.userVeto.selectedStackFileName)} + ${toTitleCase(architectureRecommendation.userVeto.selectedBlueprintFileName)})`
        );
      }
    }
    console.log(`- Stack: ${toTitleCase(selectedResolvedStackFileName)}`);
    if (selectedAdditionalStackFileNames.length > 0) {
      console.log(`- Additional stacks: ${selectedAdditionalStackFileNames.map((stackFileName) => toTitleCase(stackFileName)).join(', ')}`);
    }
    console.log(`- Blueprint: ${toTitleCase(selectedResolvedBlueprintFileName)}`);
    if (selectedAdditionalBlueprintFileNames.length > 0) {
      console.log(`- Additional blueprints: ${selectedAdditionalBlueprintFileNames.map((blueprintFileName) => toTitleCase(blueprintFileName)).join(', ')}`);
    }
    console.log(`- Runtime environment: ${resolveRuntimeEnvironmentLabelFromKey(selectedRuntimeEnvironmentKey)} (detected: ${detectedRuntimeEnvironment.label})`);
    console.log(`- CI/CD quality checks (guardrails): ${includeCiGuardrails ? 'enabled' : 'disabled'}`);
    console.log(`- Blocking severities: ${formatBlockingSeverities(selectedProfile.blockingSeverities)}`);
    console.log(`- Setup time: ${formatDuration(setupDurationMs)}`);
    console.log('- Generated files: .cursorrules, .windsurfrules, and .agent-context/state/onboarding-report.json');
    if (scaffoldingResult) {
      console.log(`- Project docs: ${scaffoldingResult.generatedFileNames.length} files generated in docs/`);
      console.log(`- Project docs language: ${scaffoldingResult.docsLanguage}`);
    }
    console.log(`- Repository workflows copied: no (workflows remain source-repo assets)`);
    console.log(`- MCP configuration: ${shouldIncludeMcpTemplate ? 'auto-configured for your IDEs (VS Code, Cursor, Zed, Gemini)' : 'disabled (--no-mcp-template)'}`);
    if (isMemoryContinuityEnabled) {
      console.log('- Memory continuity policy: enabled (index + selective hydration)');
    } else {
      console.log('- Memory continuity policy: disabled (--no-memory-continuity)');
    }
    if (isTokenOptimizationEnabled) {
      console.log(`- Token optimization policy: enabled for ${selectedTokenAgentName}`);
    } else {
      console.log('- Token optimization policy: disabled (--no-token-optimize)');
    }
    console.log('\nPlain-language summary:');
    console.log(`I prepared a ${selectedProfile.displayName.toLowerCase()} rules operations pack (Federated Governance baseline) for a ${toTitleCase(selectedResolvedStackFileName)} project using the ${toTitleCase(selectedResolvedBlueprintFileName)} blueprint.`);
    if (selectedAdditionalStackFileNames.length > 0) {
      console.log(`I also included additional stack context for ${selectedAdditionalStackFileNames.map((stackFileName) => toTitleCase(stackFileName)).join(', ')}.`);
    }
    if (selectedAdditionalBlueprintFileNames.length > 0) {
      console.log(`I also included additional blueprint context for ${selectedAdditionalBlueprintFileNames.map((blueprintFileName) => toTitleCase(blueprintFileName)).join(', ')}.`);
    }
    if (scaffoldingResult) {
      console.log(`I also generated project documentation (${scaffoldingResult.docsLanguage}) based on your project description. AI agents will use docs/ as project context.`);

      const promptProjectName = scaffoldingResult.discoveryAnswers?.projectName || 'this project';
      console.log('\nPrompt starter examples (copy and adapt in your IDE):');
      console.log(`- Build an MVP for ${promptProjectName}. Follow Layer 9 docs and keep the current stack, database, and auth constraints.`);
      console.log('- Add [new feature] and update docs/project-brief.md plus docs/flow-overview.md in the same change.');
      console.log('- If this change needs architecture migration, propose a migration plan first, then implement after approval.');
    }
    console.log('Your AI tools will now receive one compiled rulebook plus the original source rules, and your review threshold is stored in .agent-context/policies/llm-judge-threshold.json.');
    console.log('MCP server registration is manual inside your IDE settings, even when mcp.json exists.');
  } catch (error) {
    console.error('\n[FATAL] An error occurred during initialization. Attempting automatic rollback...');
    try {
        const rollbackReport = await performRollback(resolvedTargetDirectoryPath);
        if (rollbackReport.success) {
            console.error('[OK] Automatic rollback successful. The directory has been restored.');
        } else {
            console.error('[WARN] Automatic rollback completed with errors. You may need to manually clean up.');
        }
    } catch (rbError) {
        console.error(`[FATAL] Automatic rollback failed: ${rbError.message}`);
    }
    throw error;
  } finally {
    userInterface.close();
  }
}
