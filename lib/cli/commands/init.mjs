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
  BLUEPRINT_RECOMMENDATIONS,
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
import { evaluateSkillDomainCompatibility } from '../compatibility.mjs';

export { REPO_ROOT } from '../constants.mjs';

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
    tokenAgent: 'copilot',
    includeMcpTemplate: false,
    scaffoldDocs: undefined,
    docsLang: 'en',
    docsLangProvided: false,
    projectConfig: undefined,
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

    if (currentArgument === '--mcp-template') {
      parsedInitOptions.includeMcpTemplate = true;
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

    throw new Error(`Unknown option: ${currentArgument}`);
  }

  if (parsedInitOptions.newbie && parsedInitOptions.profile && parsedInitOptions.profile !== 'beginner') {
    throw new Error('--newbie can only be combined with --profile beginner');
  }

  const normalizedDocsLanguage = normalizeDocsLanguage(parsedInitOptions.docsLang || 'en');
  if (!normalizedDocsLanguage) {
    throw new Error('--docs-lang must be one of: en, id');
  }

  parsedInitOptions.docsLang = normalizedDocsLanguage;
  parsedInitOptions.tokenAgent = normalizeAgentName(parsedInitOptions.tokenAgent);

  return parsedInitOptions;
}

export async function runInitCommand(targetDirectoryArgument, initOptions = {}) {
  const resolvedTargetDirectoryPath = path.resolve(targetDirectoryArgument || '.');
  const isTokenOptimizationEnabled = typeof initOptions.tokenOptimize === 'boolean'
    ? initOptions.tokenOptimize
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
    console.log('I will copy governance files into your target folder and compile a single rulebook for your AI tools.');

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

    const selectedProfileName = initOptions.profile
      ? initOptions.profile
      : selectedPreset?.profile
        ? selectedPreset.profile
      : initOptions.newbie
        ? 'beginner'
        : selectedProfilePack?.defaultProfileName
          ? selectedProfilePack.defaultProfileName
        : normalizeChoiceInput(await askChoice(
          'How much guidance do you want?',
          Object.values(PROFILE_PRESETS).map((profilePreset) => `${profilePreset.displayName} — ${profilePreset.description}`),
          userInterface
        )).split('-')[0];

    const selectedProfile = PROFILE_PRESETS[selectedProfileName];
    if (!selectedProfile) {
      throw new Error(`Unknown profile: ${selectedProfileName}`);
    }

    console.log(`\nSelected profile: ${selectedProfile.displayName}`);
    console.log(`This profile will block these review severities in CI: ${formatBlockingSeverities(selectedProfile.blockingSeverities)}.`);

    if (selectedProfilePack) {
      console.log(`Applying team profile pack: ${selectedProfilePack.displayName}.`);
      console.log(`Pack defaults: stack ${toTitleCase(selectedProfilePack.defaultStackFileName)}, blueprint ${toTitleCase(selectedProfilePack.defaultBlueprintFileName)}.`);
    }

    const shouldApplyDetectedStack = projectDetection.recommendedStackFileName && !selectedStackFileNameFromOption
      ? await askYesNo(
        `Use the detected stack recommendation (${toTitleCase(projectDetection.recommendedStackFileName)})?`,
        userInterface,
        projectDetection.confidenceLabel === 'high'
      )
      : false;

    const stackDisplayChoices = stackFileNames.map((stackFileName) => toTitleCase(stackFileName));
    const blueprintDisplayChoices = blueprintFileNames.map((blueprintFileName) => toTitleCase(blueprintFileName));

    const selectedResolvedStackFileName = selectedStackFileNameFromOption
      || selectedPreset?.stack
      || (shouldApplyDetectedStack ? projectDetection.recommendedStackFileName : null)
      || selectedProfilePack?.defaultStackFileName
      || selectedProfile.defaultStackFileName
      || stackFileNames[
        stackDisplayChoices.indexOf(
          await askChoice('Which stack should this governance pack target?', stackDisplayChoices, userInterface)
        )
      ];

    const recommendedBlueprintFileName = shouldApplyDetectedStack
      ? projectDetection.recommendedBlueprintFileName
      : BLUEPRINT_RECOMMENDATIONS[selectedResolvedStackFileName] || null;

    if (!recommendedBlueprintFileName && !selectedBlueprintFileNameFromOption && !selectedProfile.defaultBlueprintFileName) {
      console.log('\nI could not map that stack to a first-party blueprint automatically, so I will ask you to choose one.');
    }

    const selectedResolvedBlueprintFileName = selectedBlueprintFileNameFromOption
      || selectedPreset?.blueprint
      || recommendedBlueprintFileName
      || selectedProfilePack?.defaultBlueprintFileName
      || selectedProfile.defaultBlueprintFileName
      || blueprintFileNames[
        blueprintDisplayChoices.indexOf(
          await askChoice('Which blueprint should I scaffold into the compiled rulebook?', blueprintDisplayChoices, userInterface)
        )
      ];

    const selectedSkillDomainNames = inferSkillDomainNamesFromSelection(
      selectedResolvedStackFileName,
      selectedResolvedBlueprintFileName
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
        : await askYesNo('Enable CI/CD guardrails and the LLM Judge policy?', userInterface, selectedProfile.defaultCi);

    await copyGovernanceAssetsToTarget(resolvedTargetDirectoryPath, {
      includeMcpTemplate: shouldIncludeMcpTemplate,
    });

    if (isTokenOptimizationEnabled) {
      const detectedExternalProxy = detectRtkBinary();
      const tokenOptimizationState = createTokenOptimizationState({
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
          discoveryAnswers = await runProjectDiscovery(userInterface);
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
            blueprintFileName: selectedResolvedBlueprintFileName,
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
      selectedBlueprintFileName: selectedResolvedBlueprintFileName,
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
      selectedBlueprintFileName: selectedResolvedBlueprintFileName,
      includeCiGuardrails,
      setupDurationMs,
      projectDetection,
      selectedSkillDomains: selectedSkillDomainNames,
      compatibilityWarnings,
      operationMode: 'init',
    });

    console.log('\nInitialization complete.');
    console.log(`- Target directory: ${resolvedTargetDirectoryPath}`);
    console.log(`- Profile: ${selectedProfile.displayName}`);
    if (initOptions.preset) {
      console.log(`- Preset: ${initOptions.preset}`);
    }
    if (selectedProfilePack) {
      console.log(`- Team profile pack: ${selectedProfilePack.displayName}`);
    }
    console.log(`- Stack: ${toTitleCase(selectedResolvedStackFileName)}`);
    console.log(`- Blueprint: ${toTitleCase(selectedResolvedBlueprintFileName)}`);
    console.log(`- CI/CD guardrails: ${includeCiGuardrails ? 'enabled' : 'disabled'}`);
    console.log(`- Blocking severities: ${formatBlockingSeverities(selectedProfile.blockingSeverities)}`);
    console.log(`- Setup time: ${formatDuration(setupDurationMs)}`);
    console.log('- Generated files: .cursorrules, .windsurfrules, and .agent-context/state/onboarding-report.json');
    if (scaffoldingResult) {
      console.log(`- Project docs: ${scaffoldingResult.generatedFileNames.length} files generated in docs/`);
      console.log(`- Project docs language: ${scaffoldingResult.docsLanguage}`);
    }
    console.log(`- Repository workflows copied: no (workflows remain source-repo assets)`);
    console.log(`- MCP template file: ${shouldIncludeMcpTemplate ? 'created (.vscode/mcp.json)' : 'not created by default (use --mcp-template)'}`);
    if (isTokenOptimizationEnabled) {
      console.log(`- Token optimization policy: enabled for ${selectedTokenAgentName}`);
    } else {
      console.log('- Token optimization policy: disabled (--no-token-optimize)');
    }
    console.log('\nPlain-language summary:');
    console.log(`I prepared a ${selectedProfile.displayName.toLowerCase()} governance pack for a ${toTitleCase(selectedResolvedStackFileName)} project using the ${toTitleCase(selectedResolvedBlueprintFileName)} blueprint.`);
    if (scaffoldingResult) {
      console.log(`I also generated project documentation (${scaffoldingResult.docsLanguage}) based on your project description. AI agents will use docs/ as project context.`);
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
