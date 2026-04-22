/**
 * Init Command — Interactive project initialization.
 * Depends on: constants, utils, detector, compiler
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  PROJECT_SCOPE_CHOICES,
  CLI_VERSION,
  AGENT_CONTEXT_DIR,
  INIT_PRESETS,
  PROFILE_PRESETS,
  GOLDEN_STANDARD_PROFILE_NAME,
  BLUEPRINT_RECOMMENDATIONS,
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
  pathExists,
} from '../utils.mjs';

import {
  detectProjectContext,
  buildDetectionSummary,
  formatDetectionCandidates,
  detectUiScopeSignals,
} from '../detector.mjs';
import { compileDynamicContext, writeSelectedPolicy, writeOnboardingReport } from '../compiler.mjs';
import {
  filterStackFileNamesByCandidates,
  filterBlueprintFileNamesByCandidates,
  normalizeAdditionalStackSelection,
  normalizeAdditionalBlueprintSelection,
  deriveAdditionalBlueprintFileNamesFromStacks,
  resolveScopeStackCandidates,
  resolveScopeBlueprintCandidates,
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
  buildDesignIntentSeedFromSignals,
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
import { recommendArchitecture } from '../architect.mjs';

export { REPO_ROOT } from '../constants.mjs';
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

function resolveProjectScopeLabelFromKey(projectScopeKey) {
  return PROJECT_SCOPE_CHOICES.find((scopeChoice) => scopeChoice.key === projectScopeKey)?.label
    || PROJECT_SCOPE_CHOICES.find((scopeChoice) => scopeChoice.key === 'both')?.label
    || 'Both (frontend + backend)';
}

function inferProjectScopeFromDiscoveryAnswers(discoveryAnswers) {
  const normalizedDomain = String(discoveryAnswers?.primaryDomain || '').trim().toLowerCase();
  const normalizedDescription = [
    discoveryAnswers?.projectDescription,
    ...(Array.isArray(discoveryAnswers?.features) ? discoveryAnswers.features : []),
  ].join(' ').toLowerCase();

  if (
    normalizedDomain.includes('api service')
    || normalizedDomain.includes('cli tool')
    || normalizedDomain.includes('library')
  ) {
    return 'backend-only';
  }

  if (normalizedDomain.includes('mobile app')) {
    return 'frontend-only';
  }

  if (normalizedDomain.includes('web application')) {
    if (/(landing page|marketing site|showcase|portfolio|brochure|company profile)/.test(normalizedDescription)) {
      return 'frontend-only';
    }

    return 'both';
  }

  return 'both';
}

function resolveSilentCiGuardrailsDefault({
  initOptions,
  selectedPreset,
  selectedPolicyProfile,
}) {
  if (typeof initOptions.ci === 'boolean') {
    return {
      value: initOptions.ci,
      shouldAsk: false,
    };
  }

  if (typeof selectedPreset?.ci === 'boolean') {
    return {
      value: selectedPreset.ci,
      shouldAsk: false,
    };
  }

  if (selectedPolicyProfile.lockCi) {
    return {
      value: selectedPolicyProfile.defaultCi,
      shouldAsk: false,
    };
  }

  return {
    value: selectedPolicyProfile.defaultCi,
    shouldAsk: true,
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

function buildInitExistingProjectDesignIntentSeed({
  targetDirectoryPath,
  packageManifest,
  selectedStackFileName,
  selectedBlueprintFileName,
  uiScopeSignals,
  architectureProjectDescription,
}) {
  const projectName = String(packageManifest?.name || path.basename(targetDirectoryPath)).trim() || 'existing-ui-project';
  const isMobileUiProject = String(selectedStackFileName || '').toLowerCase().includes('react-native')
    || String(selectedStackFileName || '').toLowerCase().includes('flutter')
    || uiScopeSignals.signalReasons.some((signalReason) => signalReason.includes('android') || signalReason.includes('ios'));
  const resolvedDomain = isMobileUiProject ? 'Mobile app' : 'Web application';
  const projectDescription = String(packageManifest?.description || architectureProjectDescription || '').trim()
    || `Existing ${resolvedDomain.toLowerCase()} detected during init. Create a project-specific dynamic design contract before shipping new UI work.`;

  return buildDesignIntentSeedFromSignals({
    projectName,
    projectDescription,
    primaryDomain: resolvedDomain,
    features: [],
    initContext: {
      stackFileName: selectedStackFileName,
      blueprintFileName: selectedBlueprintFileName,
    },
    status: 'seed-generated-during-init',
    supplementalFields: {
      initSignals: {
        detectedFrom: uiScopeSignals.signalReasons,
        generatedBy: 'init-existing-project-seed',
      },
      repoEvidence: {
        uiSignalReasons: uiScopeSignals.signalReasons,
        frontendMetrics: uiScopeSignals.frontendEvidenceMetrics || null,
        designEvidenceSummary: uiScopeSignals.designEvidenceSummary || null,
        workspaceUiEntries: uiScopeSignals.workspaceUiEntries || [],
      },
    },
  });
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

    const selectedPreset = initOptions.preset ? INIT_PRESETS[initOptions.preset] || null : null;

    const selectedStackFileNameFromOption = initOptions.stack
      ? matchFileNameFromInput(initOptions.stack, stackFileNames)
      : null;
    const selectedBlueprintFileNameFromOption = initOptions.blueprint
      ? matchFileNameFromInput(initOptions.blueprint, blueprintFileNames)
      : null;
    if (initOptions.stack && !selectedStackFileNameFromOption) {
      throw new Error(`Unknown stack: ${initOptions.stack}`);
    }

    if (initOptions.blueprint && !selectedBlueprintFileNameFromOption) {
      throw new Error(`Unknown blueprint: ${initOptions.blueprint}`);
    }

    if (initOptions.preset && !selectedPreset) {
      throw new Error(`Unknown preset: ${initOptions.preset}`);
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

    const selectedPolicyProfileName = initOptions.profile
      ? initOptions.profile
      : initOptions.newbie
        ? 'beginner'
        : GOLDEN_STANDARD_PROFILE_NAME;

    const selectedPolicyProfile = PROFILE_PRESETS[selectedPolicyProfileName];
    if (!selectedPolicyProfile) {
      throw new Error(`Unknown internal policy profile: ${selectedPolicyProfileName}`);
    }

    console.log(`\nReview thresholds: ${formatBlockingSeverities(selectedPolicyProfile.blockingSeverities)}.`);

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
        selectedProfile: selectedPolicyProfileName,
        selectedProfileDisplayName: selectedPolicyProfile.displayName,
        blockingSeverities: selectedPolicyProfile.blockingSeverities,
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
        `- Active review thresholds: ${formatBlockingSeverities(selectedPolicyProfile.blockingSeverities)}`
      );
      console.log('- Major constraints:');
      for (const majorConstraint of detectionMajorConstraints) {
        console.log(`  - ${majorConstraint}`);
      }
    }

    const hasReliableDetectedStack = projectDetection.hasExistingProjectFiles
      && projectDetection.recommendedStackFileName
      && (projectDetection.confidenceLabel === 'high' || projectDetection.confidenceLabel === 'medium');

    const shouldAutoApplyDetectedStack = hasReliableDetectedStack
      && !selectedStackFileNameFromOption
      && !selectedPreset?.stack
      && !selectedPolicyProfile.defaultStackFileName;
    let detectedBlueprintFileName = projectDetection.recommendedBlueprintFileName
      || BLUEPRINT_RECOMMENDATIONS[projectDetection.recommendedStackFileName]
      || null;

    let selectedManualStackFileName = null;
    let selectedManualBlueprintFileName = null;
    let selectedAdditionalStackFileNames = [];
    let selectedAdditionalBlueprintFileNames = [];
    let detectedSetupWasApplied = false;
    let selectedProjectScopeKey = 'both';
    let selectedProjectScopeLabel = resolveProjectScopeLabelFromKey('both');
    let architectureRecommendation = null;
    let architectureProjectDescription = String(initOptions.projectDescription || '').trim();
    let discoveryAnswers = null;
    const ciGuardrailsSelection = resolveSilentCiGuardrailsDefault({
      initOptions,
      selectedPreset,
      selectedPolicyProfile,
    });
    const isFreshProjectTarget = !projectDetection.hasExistingProjectFiles
      && wasDirectoryEffectivelyEmpty
      && !hadExistingProjectDocsBeforeInit;
    const shouldRunInteractiveScaffolding = isInteractiveSession
      && (initOptions.scaffoldDocs === true || (initOptions.scaffoldDocs !== false && isFreshProjectTarget));

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

    if (initOptions.projectConfig) {
      discoveryAnswers = await loadProjectConfig(initOptions.projectConfig);
      console.log(`\nLoaded project configuration from: ${initOptions.projectConfig}`);
    } else if (shouldRunInteractiveScaffolding) {
      discoveryAnswers = await runProjectDiscovery(userInterface, {
        defaultProjectName: path.basename(resolvedTargetDirectoryPath),
        defaultProjectDescription: architectureProjectDescription,
        defaultIncludeCiGuardrails: ciGuardrailsSelection.value,
        askForCiGuardrails: ciGuardrailsSelection.shouldAsk,
      });
    } else if (initOptions.scaffoldDocs === true && !isInteractiveSession) {
      throw new Error('Non-interactive scaffolding requires --project-config when --scaffold-docs is enabled.');
    }

    if (discoveryAnswers?.projectDescription) {
      architectureProjectDescription = discoveryAnswers.projectDescription;
    }

    if (discoveryAnswers) {
      selectedProjectScopeKey = inferProjectScopeFromDiscoveryAnswers(discoveryAnswers);
      selectedProjectScopeLabel = resolveProjectScopeLabelFromKey(selectedProjectScopeKey);
    }

    const shouldUseSilentArchitectureSelection = !selectedStackFileNameFromOption
      && !selectedPreset?.stack
      && !shouldAutoApplyDetectedStack
      && !selectedPolicyProfile.defaultStackFileName;

    if (shouldUseSilentArchitectureSelection) {
      const architectureScopeStackCandidates = filterStackFileNamesByCandidates(
        stackFileNames,
        resolveScopeStackCandidates(selectedProjectScopeKey)
      );
      const architectureScopeBlueprintCandidates = filterBlueprintFileNamesByCandidates(
        blueprintFileNames,
        resolveScopeBlueprintCandidates(selectedProjectScopeKey)
      );

      architectureRecommendation = recommendArchitecture({
        projectDescription: architectureProjectDescription || `A software project named ${path.basename(resolvedTargetDirectoryPath)}.`,
        projectDetection,
        stackFileNames: architectureScopeStackCandidates,
        blueprintFileNames: architectureScopeBlueprintCandidates,
      });

      architectureRecommendation.projectDomain = {
        key: selectedProjectScopeKey,
        label: selectedProjectScopeLabel,
      };
      architectureRecommendation.userVeto = {
        applied: false,
        selectedStackFileName: architectureRecommendation.recommendedStackFileName,
        selectedBlueprintFileName: architectureRecommendation.recommendedBlueprintFileName,
        source: projectDetection.hasExistingProjectFiles ? 'silent-existing-bootstrap' : 'silent-fresh-bootstrap',
      };

      selectedManualStackFileName = architectureRecommendation.recommendedStackFileName;
      selectedManualBlueprintFileName = architectureRecommendation.recommendedBlueprintFileName;

      if (!projectDetection.hasExistingProjectFiles) {
        detectionTransparency.quickConfirmation.response = 'fresh-project-streamlined';
        detectionTransparency.decision.mode = 'fresh-project-streamlined';
      }
    }

    const blueprintDisplayChoices = blueprintFileNames.map((blueprintFileName) => toTitleCase(blueprintFileName));

    const selectedResolvedStackFileName = selectedStackFileNameFromOption
      || selectedPreset?.stack
      || selectedManualStackFileName
      || (detectedSetupWasApplied ? projectDetection.recommendedStackFileName : null)
      || selectedPolicyProfile.defaultStackFileName
      || stackFileNames[0];

    selectedAdditionalStackFileNames = normalizeAdditionalStackSelection(
      selectedResolvedStackFileName,
      selectedAdditionalStackFileNames
    );

    const recommendedBlueprintFileName = detectedSetupWasApplied
      && detectedBlueprintFileName
      ? detectedBlueprintFileName
      : BLUEPRINT_RECOMMENDATIONS[selectedResolvedStackFileName] || null;

    if (!recommendedBlueprintFileName && !selectedBlueprintFileNameFromOption && !selectedPolicyProfile.defaultBlueprintFileName) {
      console.log('\nI could not map that stack to a first-party blueprint automatically, so I will ask you to choose one.');
    }

    const selectedResolvedBlueprintFileName = selectedBlueprintFileNameFromOption
      || selectedPreset?.blueprint
      || selectedManualBlueprintFileName
      || recommendedBlueprintFileName
      || selectedPolicyProfile.defaultBlueprintFileName
      || blueprintFileNames[
        blueprintDisplayChoices.indexOf(
          await askChoice('Which blueprint should I scaffold into the compiled rulebook?', blueprintDisplayChoices, userInterface)
        )
      ];

    if (architectureRecommendation) {
      architectureRecommendation.appliedStackFileName = selectedResolvedStackFileName;
      architectureRecommendation.appliedBlueprintFileName = selectedResolvedBlueprintFileName;
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

    const includeCiGuardrails = typeof discoveryAnswers?.includeCiGuardrails === 'boolean'
      ? discoveryAnswers.includeCiGuardrails
      : ciGuardrailsSelection.shouldAsk
        ? (!isInteractiveSession
          ? ciGuardrailsSelection.value
          : await askYesNo(
            'Enable CI/CD quality checks (guardrails) and the LLM Judge policy?',
            userInterface,
            ciGuardrailsSelection.value
          ))
        : ciGuardrailsSelection.value;

    detectionTransparency.activeRulesSummary.ciGuardrailsEnabled = includeCiGuardrails;

    detectionTransparency.decision.selectedProjectScopeKey = selectedProjectScopeKey;
    detectionTransparency.decision.selectedProjectScopeLabel = selectedProjectScopeLabel;

    await createBackup(resolvedTargetDirectoryPath);

    await copyGovernanceAssetsToTarget(resolvedTargetDirectoryPath, {
      includeMcpTemplate: shouldIncludeMcpTemplate,
    });

    let memoryContinuityState = null;
    if (isMemoryContinuityEnabled) {
      memoryContinuityState = createMemoryContinuityState({
        isEnabled: true,
      });

      await writeMemoryContinuityState(resolvedTargetDirectoryPath, memoryContinuityState);
      console.log(`Project memory continuity metadata enabled (${memoryContinuityState.hydrationMode}, host-supported).`);
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
    const supplementalMaterializedDocFileNames = [];
    if (discoveryAnswers) {
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

    const existingProjectUiScopeSignals = projectDetection.hasExistingProjectFiles
      ? await detectUiScopeSignals({
        targetDirectoryPath: resolvedTargetDirectoryPath,
        selectedStackFileName: selectedResolvedStackFileName,
        selectedBlueprintFileName: selectedResolvedBlueprintFileName,
      })
      : null;
    const designIntentTargetPath = path.join(resolvedTargetDirectoryPath, 'docs', 'design-intent.json');
    const shouldSeedExistingUiDesignIntent = projectDetection.hasExistingProjectFiles
      && existingProjectUiScopeSignals?.isUiScopeLikely === true
      && !(await pathExists(designIntentTargetPath));

    if (shouldSeedExistingUiDesignIntent) {
      const docsDirectoryPath = path.join(resolvedTargetDirectoryPath, 'docs');
      const designIntentSeedContent = buildInitExistingProjectDesignIntentSeed({
        targetDirectoryPath: resolvedTargetDirectoryPath,
        packageManifest: existingProjectUiScopeSignals.packageManifest,
        selectedStackFileName: selectedResolvedStackFileName,
        selectedBlueprintFileName: selectedResolvedBlueprintFileName,
        uiScopeSignals: existingProjectUiScopeSignals,
        architectureProjectDescription,
      });

      await ensureDirectory(docsDirectoryPath);
      await fs.writeFile(designIntentTargetPath, designIntentSeedContent, 'utf8');
      supplementalMaterializedDocFileNames.push('design-intent.json');

      console.log('\nExisting UI/frontend scope detected. Seeded docs/design-intent.json so the machine-readable design contract exists before UI implementation work continues.');
    }

    await compileDynamicContext({
      targetDirectoryPath: resolvedTargetDirectoryPath,
      selectedStackFileName: selectedResolvedStackFileName,
      selectedAdditionalStackFileNames,
      selectedBlueprintFileName: selectedResolvedBlueprintFileName,
      selectedAdditionalBlueprintFileNames,
      includeCiGuardrails,
    });

    await writeSelectedPolicy(resolvedTargetDirectoryPath, selectedPolicyProfileName);

    const setupDurationMs = Date.now() - setupStartedAt;
    await writeOnboardingReport({
      targetDirectoryPath: resolvedTargetDirectoryPath,
      selectedProfileName: selectedPolicyProfileName,
      selectedPreset: initOptions.preset || null,
      projectScope: {
        key: selectedProjectScopeKey,
        label: selectedProjectScopeLabel,
      },
      projectTopology: discoveryAnswers?.architectureStyle || null,
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
      uiScopeSignals: existingProjectUiScopeSignals,
    });

    console.log('\nInitialization complete.');
    console.log(`- Target directory: ${resolvedTargetDirectoryPath}`);
    if (initOptions.preset) {
      console.log(`- Preset: ${initOptions.preset}`);
    }
    if (!projectDetection.hasExistingProjectFiles) {
      console.log(`- Project domain: ${selectedProjectScopeLabel}`);
      if (discoveryAnswers?.architectureStyle) {
        console.log(`- Project topology: ${discoveryAnswers.architectureStyle}`);
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
    console.log(`- Review thresholds: ${formatBlockingSeverities(selectedPolicyProfile.blockingSeverities)}`);
    console.log(`- Setup time: ${formatDuration(setupDurationMs)}`);
    console.log('- Generated files: .instructions.md, .agent-instructions.md, compiled adapters, and .agent-context/state/onboarding-report.json');
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
    if (supplementalMaterializedDocFileNames.length > 0) {
      console.log(`- Design seed docs: ${supplementalMaterializedDocFileNames.length} files generated in docs/`);
    }
    console.log(`- Repository workflows copied: no (workflows remain source-repo assets)`);
    console.log(`- MCP configuration: ${shouldIncludeMcpTemplate ? 'auto-configured for your IDEs (VS Code, Cursor, Zed, Gemini)' : 'disabled (--no-mcp-template)'}`);
    if (isMemoryContinuityEnabled) {
      console.log('- Memory continuity policy: enabled (index + selective hydration; host support required)');
    } else {
      console.log('- Memory continuity policy: disabled (--no-memory-continuity)');
    }
    if (isTokenOptimizationEnabled) {
      console.log(`- Token optimization policy: enabled for ${selectedTokenAgentName}`);
    } else {
      console.log('- Token optimization policy: disabled (--no-token-optimize)');
    }
    console.log('\nPlain-language summary:');
    console.log(`I prepared a repo-grounded rules operations pack (Federated Governance baseline) for a ${toTitleCase(selectedResolvedStackFileName)} project using the ${toTitleCase(selectedResolvedBlueprintFileName)} blueprint.`);
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
    } else if (supplementalMaterializedDocFileNames.includes('design-intent.json')) {
      console.log('I also seeded docs/design-intent.json for this existing UI repository so future UI work starts from a machine-readable design contract without forcing a canned visual concept.');
      console.log('\nPrompt starter examples (copy and adapt in your IDE):');
      console.log('- If docs/DESIGN.md is missing, execute .agent-context/prompts/bootstrap-design.md now and refine docs/design-intent.json into a complete design contract before building UI components.');
      console.log('- Keep docs/design-intent.json and docs/DESIGN.md synchronized whenever the UI direction changes.');
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
