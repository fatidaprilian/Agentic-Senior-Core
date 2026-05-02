/**
 * Init Command — Interactive project initialization.
 * Depends on: constants, utils, detector, compiler
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  CLI_VERSION,
  AGENT_CONTEXT_DIR,
  INIT_PRESETS,
  PROFILE_PRESETS,
  GOLDEN_STANDARD_PROFILE_NAME,
  AGENT_DECISION_STACK_FILE_NAME,
  AGENT_DECISION_BLUEPRINT_FILE_NAME,
} from '../constants.mjs';

import {
  ensureDirectory,
  askYesNo,
  toTitleCase,
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
  normalizeAdditionalStackSelection,
  normalizeAdditionalBlueprintSelection,
} from '../init-selection.mjs';
import {
  buildExistingProjectMajorConstraints,
  resolveDetectedSetupDecision,
} from '../init-detection-flow.mjs';
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
  ensureActiveMemorySnapshot,
  writeMemoryContinuityState,
} from '../memory-continuity.mjs';
import {
  buildInitExistingProjectDesignIntentSeed,
  inferExistingProjectDescriptionHint,
} from './init/project-context.mjs';
import {
  detectRuntimeEnvironment,
  resolveRuntimeEnvironmentKeyFromLabel,
  resolveRuntimeEnvironmentLabelFromKey,
} from './init/runtime-environment.mjs';
import {
  inferProjectScopeFromDiscoveryAnswers,
  normalizeExplicitProfileFileName,
  resolveProjectScopeLabelFromKey,
  resolveSilentCiGuardrailsDefault,
} from './init/setup-decisions.mjs';

export { REPOSITORY_ROOT } from '../constants.mjs';
export {
  parseInitArguments,
  normalizeRuntimeEnvironmentKey,
} from '../init-options.mjs';
export {
  resolveProjectScopeKeyFromLabel,
  normalizeAdditionalStackSelection,
  normalizeAdditionalBlueprintSelection,
} from '../init-selection.mjs';
export {
  detectRuntimeEnvironment,
  resolveRuntimeEnvironmentKeyFromLabel,
  resolveRuntimeEnvironmentLabelFromKey,
} from './init/runtime-environment.mjs';

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

    if (discoveredStackFileNames.length === 0 || discoveredBlueprintFileNames.length === 0) {
      console.log('[INFO] Static stack/blueprint profiles are not fully present. Using compatibility labels for dynamic reasoning mode.');
    }

    const selectedPreset = initOptions.preset ? INIT_PRESETS[initOptions.preset] || null : null;

    const selectedStackFileNameFromOption = initOptions.stack
      ? normalizeExplicitProfileFileName(initOptions.stack, discoveredStackFileNames)
      : null;
    const selectedBlueprintFileNameFromOption = initOptions.blueprint
      ? normalizeExplicitProfileFileName(initOptions.blueprint, discoveredBlueprintFileNames)
      : null;

    if (initOptions.preset && !selectedPreset) {
      throw new Error(`Unknown preset: ${initOptions.preset}`);
    }

    console.log(`\nAgentic-Senior-Core CLI v${CLI_VERSION}`);
    console.log('I will copy the project guidance pack into your target folder and compile a single rulebook for your AI tools.');

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
        compiledRulebook: '.agent-instructions.md',
        legacyThinAdapters: ['.cursorrules', '.windsurfrules', '.clauderc'],
        generatedBridgeAdapters: [
          'AGENTS.md',
          'CLAUDE.md',
          'GEMINI.md',
          '.cursor/rules/agentic-senior-core.mdc',
          '.windsurf/rules/agentic-senior-core.md',
          '.github/copilot-instructions.md',
          '.github/instructions/agentic-senior-core.instructions.md',
          '.gemini/instructions.md',
        ],
        stackLoadingMode: 'lazy',
        domainRuleLoadingMode: 'lazy',
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

      if (projectDetection.detectedStackFileName) {
        const confidenceScoreLabel = Number(projectDetection.confidenceScore || 0).toFixed(2);
        console.log(
          `- Detected stack: ${toTitleCase(projectDetection.detectedStackFileName)} (${projectDetection.confidenceLabel}, score ${confidenceScoreLabel})`
        );

        if (projectDetection.secondaryStackFileNames?.length) {
          console.log(
            `- Secondary stack signals: ${projectDetection.secondaryStackFileNames.map((stackFileName) => toTitleCase(stackFileName)).join(', ')}`
          );
        }
      } else {
        console.log('- Detected stack: unresolved (insufficient markers).');
      }

      console.log('- Active rules baseline: canonical .instructions.md -> compiled .agent-instructions.md + legacy thin root adapters');
      console.log(
        `- Active review thresholds: ${formatBlockingSeverities(selectedPolicyProfile.blockingSeverities)}`
      );
      console.log('- Major constraints:');
      for (const majorConstraint of detectionMajorConstraints) {
        console.log(`  - ${majorConstraint}`);
      }
    }

    const hasReliableDetectedStack = projectDetection.hasExistingProjectFiles
      && projectDetection.detectedStackFileName
      && (projectDetection.confidenceLabel === 'high' || projectDetection.confidenceLabel === 'medium');

    const shouldAutoApplyDetectedStack = false;
    let selectedManualStackFileName = null;
    let selectedManualBlueprintFileName = null;
    let selectedAdditionalStackFileNames = [];
    let selectedAdditionalBlueprintFileNames = [];
    let detectedSetupWasApplied = false;
    let selectedProjectScopeKey = 'both';
    let selectedProjectScopeLabel = resolveProjectScopeLabelFromKey('both');
    let projectDescriptionHint = String(initOptions.projectDescription || '').trim();
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

    if (projectDetection.hasExistingProjectFiles && !projectDescriptionHint) {
      projectDescriptionHint = await inferExistingProjectDescriptionHint(resolvedTargetDirectoryPath);
      if (projectDescriptionHint) {
        console.log(`- Project context evidence: ${projectDescriptionHint}`);
      } else {
        console.log('- Project context evidence: unresolved from lightweight file scan; agent must inspect project files before coding.');
      }
    }
    detectionTransparency.projectContextEvidence = projectDescriptionHint || null;

    const detectedSetupDecision = await resolveDetectedSetupDecision({
      shouldAutoApplyDetectedStack,
      projectDetection,
      detectionTransparency,
      initialSelectedManualStackFileName: selectedManualStackFileName,
      initialSelectedManualBlueprintFileName: selectedManualBlueprintFileName,
      initialSelectedAdditionalStackFileNames: selectedAdditionalStackFileNames,
    });

    detectedSetupWasApplied = detectedSetupDecision.detectedSetupWasApplied;
    selectedManualStackFileName = detectedSetupDecision.selectedManualStackFileName;
    selectedManualBlueprintFileName = detectedSetupDecision.selectedManualBlueprintFileName;
    selectedAdditionalStackFileNames = detectedSetupDecision.selectedAdditionalStackFileNames;
    if (initOptions.projectConfig) {
      discoveryAnswers = await loadProjectConfig(initOptions.projectConfig);
      console.log(`\nLoaded project configuration from: ${initOptions.projectConfig}`);
    } else if (shouldRunInteractiveScaffolding) {
      discoveryAnswers = await runProjectDiscovery(userInterface, {
        defaultProjectName: path.basename(resolvedTargetDirectoryPath),
        defaultProjectDescription: projectDescriptionHint,
        defaultIncludeCiGuardrails: ciGuardrailsSelection.value,
        askForCiGuardrails: ciGuardrailsSelection.shouldAsk,
      });
    } else if (initOptions.scaffoldDocs === true && !isInteractiveSession) {
      throw new Error('Non-interactive scaffolding requires --project-config when --scaffold-docs is enabled.');
    }

    if (discoveryAnswers?.projectDescription) {
      projectDescriptionHint = discoveryAnswers.projectDescription;
    }

    if (discoveryAnswers) {
      selectedProjectScopeKey = inferProjectScopeFromDiscoveryAnswers(discoveryAnswers);
      selectedProjectScopeLabel = resolveProjectScopeLabelFromKey(selectedProjectScopeKey);
    }

    const selectedResolvedStackFileName = selectedStackFileNameFromOption
      || selectedManualStackFileName
      || selectedPolicyProfile.defaultStackFileName
      || AGENT_DECISION_STACK_FILE_NAME;

    selectedAdditionalStackFileNames = normalizeAdditionalStackSelection(
      selectedResolvedStackFileName,
      selectedAdditionalStackFileNames
    );

    const selectedResolvedBlueprintFileName = selectedBlueprintFileNameFromOption
      || selectedManualBlueprintFileName
      || selectedPolicyProfile.defaultBlueprintFileName
      || AGENT_DECISION_BLUEPRINT_FILE_NAME;

    selectedAdditionalBlueprintFileNames = normalizeAdditionalBlueprintSelection(
      selectedResolvedBlueprintFileName,
      selectedAdditionalBlueprintFileNames.length > 0
        ? selectedAdditionalBlueprintFileNames
        : []
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
      await ensureActiveMemorySnapshot(resolvedTargetDirectoryPath, {
        projectName: path.basename(resolvedTargetDirectoryPath),
      });
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
        projectDescriptionHint,
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
        activeSnapshotFile: isMemoryContinuityEnabled ? '.agent-context/state/active-memory.json' : null,
      },
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
    console.log(`- Runtime decision: ${selectedResolvedStackFileName === AGENT_DECISION_STACK_FILE_NAME ? 'agent recommendation required from current repo/brief evidence' : toTitleCase(selectedResolvedStackFileName)}`);
    if (selectedAdditionalStackFileNames.length > 0) {
      console.log(`- Additional stacks: ${selectedAdditionalStackFileNames.map((stackFileName) => toTitleCase(stackFileName)).join(', ')}`);
    }
    console.log(`- Architecture decision: ${selectedResolvedBlueprintFileName === AGENT_DECISION_BLUEPRINT_FILE_NAME ? 'agent recommendation required from current repo/brief evidence' : toTitleCase(selectedResolvedBlueprintFileName)}`);
    if (selectedAdditionalBlueprintFileNames.length > 0) {
      console.log(`- Additional blueprints: ${selectedAdditionalBlueprintFileNames.map((blueprintFileName) => toTitleCase(blueprintFileName)).join(', ')}`);
    }
    console.log(`- Runtime environment: ${resolveRuntimeEnvironmentLabelFromKey(selectedRuntimeEnvironmentKey)} (detected: ${detectedRuntimeEnvironment.label})`);
    console.log(`- CI/CD quality checks (guardrails): ${includeCiGuardrails ? 'enabled' : 'disabled'}`);
    console.log(`- Review thresholds: ${formatBlockingSeverities(selectedPolicyProfile.blockingSeverities)}`);
    console.log(`- Setup time: ${formatDuration(setupDurationMs)}`);
    console.log('- Generated files: .instructions.md, .agent-instructions.md, legacy thin adapters, generated bridge adapters, and .agent-context/state/onboarding-report.json');
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
    if (selectedResolvedStackFileName === AGENT_DECISION_STACK_FILE_NAME || selectedResolvedBlueprintFileName === AGENT_DECISION_BLUEPRINT_FILE_NAME) {
      console.log('I prepared a repo-grounded guidance pack that asks your AI agent to recommend runtime and architecture choices from the current brief, repo evidence, and live research before coding.');
    } else {
      console.log(`I prepared a repo-grounded guidance pack using your explicit runtime constraint (${toTitleCase(selectedResolvedStackFileName)}) and architecture constraint (${toTitleCase(selectedResolvedBlueprintFileName)}).`);
    }
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
    console.log('Your AI tools will now receive one compiled rulebook, thin discovery adapters, and the original source rules. Your review threshold is stored in .agent-context/policies/llm-judge-threshold.json.');
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
