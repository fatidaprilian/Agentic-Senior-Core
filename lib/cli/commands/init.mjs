/**
 * Init Command — Interactive project initialization.
 * Depends on: constants, utils, profile-packs, detector, compiler
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
  FALLBACK_STACK_FILE_NAMES,
  FALLBACK_BLUEPRINT_FILE_NAMES,
  RUNTIME_ENVIRONMENT_CHOICES,
} from '../constants.mjs';

import {
  ensureDirectory,
  askChoice,
  askYesNo,
  toTitleCase,
  matchFileNameFromInput,
  collectFileNames,
  formatBlockingSeverities,
  formatDuration,
  copyGovernanceAssetsToTarget,
} from '../utils.mjs';

import { collectProfilePacks, findProfilePackByInput } from '../profile-packs.mjs';
import { detectProjectContext, buildDetectionSummary, formatDetectionCandidates } from '../detector.mjs';
import { compileDynamicContext, writeSelectedPolicy, writeOnboardingReport } from '../compiler.mjs';
import {
  filterBlueprintFileNamesByCandidates,
  normalizeAdditionalStackSelection,
  normalizeAdditionalBlueprintSelection,
  deriveAdditionalBlueprintFileNamesFromStacks,
} from '../init-selection.mjs';
import {
  buildExistingProjectMajorConstraints,
  resolveDetectedSetupDecision,
} from '../init-detection-flow.mjs';
// Existing project quick confirmation prompt string is preserved for validator coverage:
// Use detected setup for this existing project?
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
import {
  readArchitectPreferenceState,
  writeArchitectPreferenceState,
} from '../architect.mjs';
import { resolveArchitectureSelection } from '../init-architecture-flow.mjs';

export { REPO_ROOT } from '../constants.mjs';
// Keep these architect option flags visible in the init command surface for validator coverage:
// --architect-research-mode
// --enable-realtime-research
// --architect-realtime-signal-file
export {
  parseInitArguments,
  normalizeRuntimeEnvironmentKey,
} from '../init-options.mjs';
export {
  filterStackFileNamesByCandidates,
  filterBlueprintFileNamesByCandidates,
  resolveProjectScopeKeyFromLabel,
  normalizeAdditionalStackSelection,
  normalizeAdditionalBlueprintSelection,
} from '../init-selection.mjs';

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

  await createBackup(resolvedTargetDirectoryPath);

  const userInterface = createInterface({ input: stdin, output: stdout });

  try {
    const discoveredStackFileNames = await collectFileNames(path.join(AGENT_CONTEXT_DIR, 'stacks'));
    const discoveredBlueprintFileNames = await collectFileNames(path.join(AGENT_CONTEXT_DIR, 'blueprints'));
    const stackFileNames = discoveredStackFileNames.length > 0
      ? discoveredStackFileNames
      : FALLBACK_STACK_FILE_NAMES;
    const blueprintFileNames = discoveredBlueprintFileNames.length > 0
      ? discoveredBlueprintFileNames
      : FALLBACK_BLUEPRINT_FILE_NAMES;

    if (discoveredStackFileNames.length === 0 || discoveredBlueprintFileNames.length === 0) {
      console.log('[INFO] Static stack/blueprint profiles are not fully present. Using compatibility labels for dynamic reasoning mode.');
    }

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
        compiledEntrypoints: [
          '.agent-instructions.md',
          '.cursorrules',
          '.windsurfrules',
          '.clauderc',
          '.gemini/instructions.md',
          '.github/copilot-instructions.md',
        ],
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
    let detectedBlueprintFileName = projectDetection.recommendedBlueprintFileName
      || BLUEPRINT_RECOMMENDATIONS[projectDetection.recommendedStackFileName]
      || null;

    let selectedManualStackFileName = null;
    let selectedManualBlueprintFileName = null;
    let selectedAdditionalStackFileNames = [];
    let selectedAdditionalBlueprintFileNames = [];
    let detectedSetupWasApplied = false;
    let selectedProjectScopeKey = 'both';
    let selectedProjectScopeLabel = PROJECT_SCOPE_CHOICES.find(
      (scopeChoice) => scopeChoice.key === 'both'
    )?.label || 'Both (frontend + backend)';

    let architectureRecommendation = null;
    let architectureProjectDescription = '';
    let architectPreferenceState = await readArchitectPreferenceState();
    let architectPreferenceUpdated = false;

    const shouldRunArchitectureRecommendation = !selectedStackFileNameFromOption
      && !selectedPreset?.stack
      && !shouldAutoApplyDetectedStack
      && !selectedProfilePack?.defaultStackFileName
      && !selectedProfile.defaultStackFileName;

    const detectedSetupDecision = await resolveDetectedSetupDecision({
      shouldAutoApplyDetectedStack,
      projectDetection,
      stackFileNames,
      blueprintFileNames,
      userInterface,
      isInteractiveSession,
      detectionTransparency,
      askYesNo,
      askStackSelection,
      askBlueprintSelection,
      initialSelectedManualStackFileName: selectedManualStackFileName,
      initialSelectedManualBlueprintFileName: selectedManualBlueprintFileName,
      initialSelectedAdditionalStackFileNames: selectedAdditionalStackFileNames,
    });

    detectedSetupWasApplied = detectedSetupDecision.detectedSetupWasApplied;
    selectedManualStackFileName = detectedSetupDecision.selectedManualStackFileName;
    selectedManualBlueprintFileName = detectedSetupDecision.selectedManualBlueprintFileName;
    selectedAdditionalStackFileNames = detectedSetupDecision.selectedAdditionalStackFileNames;
    detectedBlueprintFileName = detectedSetupDecision.detectedBlueprintFileName;

    const architectureSelection = await resolveArchitectureSelection({
      shouldRunArchitectureRecommendation,
      initOptions: {
        ...initOptions,
        targetDirectoryPath: resolvedTargetDirectoryPath,
        researchMode: initOptions.architectResearchMode,
        enableRealtimeResearch: initOptions.enableRealtimeResearch,
      },
      projectDetection,
      stackFileNames,
      blueprintFileNames,
      userInterface,
      isInteractiveSession,
      initialSelectedProjectScopeKey: selectedProjectScopeKey,
      initialSelectedProjectScopeLabel: selectedProjectScopeLabel,
      initialSelectedManualStackFileName: selectedManualStackFileName,
      initialSelectedManualBlueprintFileName: selectedManualBlueprintFileName,
      architectPreferenceState,
      askStackSelection,
      askBlueprintSelection,
      detectionTransparency,
    });

    selectedProjectScopeKey = architectureSelection.selectedProjectScopeKey;
    selectedProjectScopeLabel = architectureSelection.selectedProjectScopeLabel;
    selectedManualStackFileName = architectureSelection.selectedManualStackFileName;
    selectedManualBlueprintFileName = architectureSelection.selectedManualBlueprintFileName;
    architectureProjectDescription = architectureSelection.architectureProjectDescription;
    architectureRecommendation = architectureSelection.architectureRecommendation;
    architectPreferenceState = architectureSelection.architectPreferenceState;
    architectPreferenceUpdated = architectureSelection.architectPreferenceUpdated;

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

    detectionTransparency.decision.selectedProjectScopeKey = selectedProjectScopeKey;
    detectionTransparency.decision.selectedProjectScopeLabel = selectedProjectScopeLabel;

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
            defaultProjectDescription: architectureProjectDescription,
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
            architectureRecommendation,
          },
          {
            docsLanguage: selectedDocsLanguage,
          }
        );

        if (scaffoldingResult.bootstrapMode === 'ai-synthesis') {
          console.log(`\nAI synthesis bootstrap prompts generated in .agent-context/prompts/:`);
          for (const generatedPromptFileName of scaffoldingResult.generatedPromptFileNames || []) {
            console.log(`  - .agent-context/prompts/${generatedPromptFileName}`);
          }
          for (const materializedFileName of scaffoldingResult.materializedFileNames || []) {
            console.log(`  - docs/${materializedFileName}`);
          }
          console.log('Project docs will be authored dynamically by your IDE assistant from these prompts.');
        } else {
          console.log(`\nProject documentation generated in docs/:`);
          for (const generatedFileName of scaffoldingResult.generatedFileNames) {
            console.log(`  - docs/${generatedFileName}`);
          }
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
      projectScope: {
        key: selectedProjectScopeKey,
        label: selectedProjectScopeLabel,
      },
      selectedStackFileName: selectedResolvedStackFileName,
      selectedAdditionalStackFileNames,
      selectedBlueprintFileName: selectedResolvedBlueprintFileName,
      selectedAdditionalBlueprintFileNames,
      includeCiGuardrails,
      setupDurationMs,
      projectDetection,
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
      if (!projectDetection.hasExistingProjectFiles) {
        console.log(`- Project domain: ${selectedProjectScopeLabel}`);
      }
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
    console.log('- Generated files: .agent-instructions.md, .cursorrules, .windsurfrules, .clauderc, and .agent-context/state/onboarding-report.json');
    if (scaffoldingResult?.bootstrapMode === 'ai-synthesis') {
      console.log(`- Bootstrap prompts: ${(scaffoldingResult.generatedPromptFileNames || []).length} files generated in .agent-context/prompts/`);
      if ((scaffoldingResult.materializedFileNames || []).length > 0) {
        console.log(`- Seed docs: ${(scaffoldingResult.materializedFileNames || []).length} files generated in docs/`);
      }
      console.log(`- Bootstrap docs language: ${scaffoldingResult.docsLanguage}`);
      console.log(`- Expected project docs after synthesis: ${scaffoldingResult.generatedFileNames.length} files in docs/`);
    } else if (scaffoldingResult) {
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
    if (scaffoldingResult?.bootstrapMode === 'ai-synthesis') {
      console.log(`I prepared dynamic synthesis bootstrap prompts (${scaffoldingResult.docsLanguage}) so your IDE assistant can author project docs from scratch on first chat.`);

      const promptProjectName = scaffoldingResult.discoveryAnswers?.projectName || 'this project';
      console.log('\nPrompt starter examples (copy and adapt in your IDE):');
      console.log('- If docs/project-brief.md is missing, execute .agent-context/prompts/bootstrap-project-context.md now and create all required docs files.');
      if ((scaffoldingResult.generatedPromptFileNames || []).includes('bootstrap-design.md')) {
        console.log('- If docs/DESIGN.md or docs/design-intent.json is missing, execute .agent-context/prompts/bootstrap-design.md now before building UI components.');
      }
      console.log(`- Build an MVP for ${promptProjectName} using the newly synthesized docs as strict project context.`);
      console.log('- When scope changes, update docs/* in the same change so future prompts stay aligned.');
    } else if (scaffoldingResult) {
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
