/**
 * Upgrade Command — Governance upgrade assistant.
 * Depends on: constants, utils, detector, compiler
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  CLI_VERSION,
  AGENT_CONTEXT_DIR,
  PROFILE_PRESETS,
  AGENT_DECISION_STACK_FILE_NAME,
  AGENT_DECISION_BLUEPRINT_FILE_NAME,
} from '../constants.mjs';

import {
  ensureDirectory,
  askYesNo,
  toTitleCase,
  collectFileNames,
  formatDuration,
  pathExists,
  analyzeManagedGovernanceSurface,
  copyGovernanceAssetsToTarget,
} from '../utils.mjs';

import {
  detectProjectContext,
  buildDetectionSummary,
  formatDetectionCandidates,
  detectUiScopeSignals,
} from '../detector.mjs';
import {
  buildCompiledRulesContent,
  compileDynamicContext,
  writeSelectedPolicy,
  writeOnboardingReport,
  loadOnboardingReportIfExists,
} from '../compiler.mjs';

import { runPreflightChecks } from '../preflight.mjs';
import { createBackup } from '../backup.mjs';
import { performRollback } from '../rollback.mjs';
import {
  detectProjectDocTemplateStaleness,
  buildDesignIntentSeedFromSignals,
} from '../project-scaffolder.mjs';
import { ensureActiveMemorySnapshot } from '../memory-continuity.mjs';

export function parseUpgradeArguments(commandArguments) {
  const parsedUpgradeOptions = {
    targetDirectory: '.',
    dryRun: false,
    skipConfirmation: false,
    includeMcpTemplate: true,
    pruneManagedSurface: true,
  };

  for (let argumentIndex = 0; argumentIndex < commandArguments.length; argumentIndex++) {
    const currentArgument = commandArguments[argumentIndex];

    if (!currentArgument.startsWith('--')) {
      parsedUpgradeOptions.targetDirectory = currentArgument;
      continue;
    }

    if (currentArgument === '--dry-run') {
      parsedUpgradeOptions.dryRun = true;
      continue;
    }

    if (currentArgument === '--yes') {
      parsedUpgradeOptions.skipConfirmation = true;
      continue;
    }

    if (currentArgument === '--mcp-template') {
      parsedUpgradeOptions.includeMcpTemplate = true;
      continue;
    }

    if (currentArgument === '--no-mcp-template') {
      parsedUpgradeOptions.includeMcpTemplate = false;
      continue;
    }

    if (currentArgument === '--prune') {
      parsedUpgradeOptions.pruneManagedSurface = true;
      continue;
    }

    if (currentArgument === '--no-prune') {
      parsedUpgradeOptions.pruneManagedSurface = false;
      continue;
    }

    throw new Error(`Unknown option: ${currentArgument}`);
  }

  return parsedUpgradeOptions;
}

function buildExistingProjectMajorConstraints() {
  return [
    'Preserve existing project markers and avoid forced stack migration.',
    'Use runtime markers as evidence only unless the user already recorded an explicit runtime constraint.',
    'Upgrade keeps prior explicit onboarding constraints but does not create new stack or blueprint decisions.',
  ];
}

function buildUpgradeDesignIntentSeed({
  targetDirectoryPath,
  packageManifest,
  selectedStackFileName,
  selectedBlueprintFileName,
  uiScopeSignals,
}) {
  const projectName = String(packageManifest?.name || path.basename(targetDirectoryPath)).trim() || 'existing-ui-project';
  const isMobileUiProject = String(selectedStackFileName || '').toLowerCase().includes('react-native')
    || String(selectedStackFileName || '').toLowerCase().includes('flutter')
    || uiScopeSignals.signalReasons.some((signalReason) => signalReason.includes('android') || signalReason.includes('ios'));
  const resolvedDomain = isMobileUiProject ? 'Mobile app' : 'Web application';
  const projectDescription = String(packageManifest?.description || '').trim()
    || `Existing ${resolvedDomain.toLowerCase()} detected during upgrade. Create a project-specific dynamic design contract before shipping new UI work.`;

  return buildDesignIntentSeedFromSignals({
    projectName,
    projectDescription,
    primaryDomain: resolvedDomain,
    features: [],
    initContext: {
      stackFileName: selectedStackFileName,
      blueprintFileName: selectedBlueprintFileName,
    },
    status: 'seed-generated-during-upgrade',
    supplementalFields: {
      upgradeSignals: {
        detectedFrom: uiScopeSignals.signalReasons,
        generatedBy: 'upgrade-seed',
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

export async function runUpgradeCommand(targetDirectoryArgument, upgradeOptions = {}) {
  const resolvedTargetDirectoryPath = path.resolve(targetDirectoryArgument || '.');

  if (resolvedTargetDirectoryPath.toLowerCase() === 'c:\\windows' || resolvedTargetDirectoryPath.toLowerCase() === 'c:\\windows\\system32') {
    console.error('\n[FATAL] Target directory resolved to a Windows system folder (C:\\Windows).');
    console.error('If you are running Windows npm from inside WSL, this is caused by cmd.exe lacking UNC path support.');
    console.error('Please install and use a native Linux Node.js/npm directly inside WSL to setup your project.');
    process.exit(1);
  }

  const setupStartedAt = Date.now();
  await ensureDirectory(resolvedTargetDirectoryPath);

  const preflightResult = await runPreflightChecks(resolvedTargetDirectoryPath, 'upgrade');
  if (!preflightResult.passed) {
      console.error('\n[FATAL] Preflight checks failed. Upgrading here would cause errors or data loss:');
      console.error(JSON.stringify(preflightResult, null, 2));
      throw new Error('Preflight checks failed.');
  }

  const userInterface = createInterface({ input: stdin, output: stdout });

  try {
    console.log(`\nAgentic-Senior-Core CLI v${CLI_VERSION}`);
    console.log('Running managed guidance upgrade for an existing repository.');

    const managedSurfacePlan = await analyzeManagedGovernanceSurface(resolvedTargetDirectoryPath, {
      includeMcpTemplate: upgradeOptions.includeMcpTemplate === true,
    });

    const stackFileNames = await collectFileNames(path.join(AGENT_CONTEXT_DIR, 'stacks'));
    const blueprintFileNames = await collectFileNames(path.join(AGENT_CONTEXT_DIR, 'blueprints'));
    const existingOnboardingReport = await loadOnboardingReportIfExists(resolvedTargetDirectoryPath);
    const projectDetection = await detectProjectContext(resolvedTargetDirectoryPath);
    const selectedProfileName = PROFILE_PRESETS[existingOnboardingReport?.selectedProfile]
      ? existingOnboardingReport.selectedProfile
      : 'balanced';

    const hasExplicitRuntimeConstraint = existingOnboardingReport?.runtimeDecision?.mode === 'explicit-constraint';
    const hasExplicitArchitectureConstraint = existingOnboardingReport?.architectureDecision?.mode === 'explicit-constraint';

    const selectedStackFileName = hasExplicitRuntimeConstraint && stackFileNames.includes(existingOnboardingReport?.selectedStack)
      ? existingOnboardingReport.selectedStack
      : AGENT_DECISION_STACK_FILE_NAME;

    const selectedAdditionalStackFileNames = hasExplicitRuntimeConstraint && Array.isArray(existingOnboardingReport?.selectedAdditionalStacks)
      ? Array.from(new Set(existingOnboardingReport.selectedAdditionalStacks.filter(
        (stackFileName) => stackFileNames.includes(stackFileName) && stackFileName !== selectedStackFileName
      )))
      : [];

    const selectedBlueprintFileName = hasExplicitArchitectureConstraint && blueprintFileNames.includes(existingOnboardingReport?.selectedBlueprint)
      ? existingOnboardingReport.selectedBlueprint
      : AGENT_DECISION_BLUEPRINT_FILE_NAME;

    const selectedAdditionalBlueprintFileNames = hasExplicitArchitectureConstraint && Array.isArray(existingOnboardingReport?.selectedAdditionalBlueprints)
      ? Array.from(new Set(existingOnboardingReport.selectedAdditionalBlueprints.filter(
        (blueprintFileName) => blueprintFileNames.includes(blueprintFileName) && blueprintFileName !== selectedBlueprintFileName
      )))
      : [];

    const includeCiGuardrails = typeof existingOnboardingReport?.ciGuardrailsEnabled === 'boolean'
      ? existingOnboardingReport.ciGuardrailsEnabled
      : true;
    const uiScopeSignals = await detectUiScopeSignals({
      targetDirectoryPath: resolvedTargetDirectoryPath,
      selectedStackFileName,
      selectedBlueprintFileName,
      projectScopeKey: existingOnboardingReport?.projectScope?.key || null,
      projectScopeSourceLabel: 'onboarding project scope',
    });
    const packageManifest = uiScopeSignals.packageManifest;
    const designContractPaths = ['docs/DESIGN.md', 'docs/design-intent.json'];
    const missingDesignContractPaths = [];

    for (const designContractPath of designContractPaths) {
      const absoluteDesignContractPath = path.join(resolvedTargetDirectoryPath, ...designContractPath.split('/'));
      if (!(await pathExists(absoluteDesignContractPath))) {
        missingDesignContractPaths.push(designContractPath);
      }
    }
    const shouldSeedDesignIntentOnApply = uiScopeSignals.isUiScopeLikely
      && missingDesignContractPaths.includes('docs/design-intent.json');
    const designIntentSeedContent = shouldSeedDesignIntentOnApply
      ? buildUpgradeDesignIntentSeed({
        targetDirectoryPath: resolvedTargetDirectoryPath,
        packageManifest,
        selectedStackFileName,
        selectedBlueprintFileName,
        uiScopeSignals,
      })
      : null;

    const detectionMajorConstraints = buildExistingProjectMajorConstraints();
    const detectionTransparency = {
      declaredAt: new Date().toISOString(),
      declarationType: 'existing-project',
      declarationShown: true,
      detectionSummary: buildDetectionSummary(projectDetection),
      activeRulesSummary: {
        canonicalSource: '.instructions.md',
        compiledEntrypoints: ['.cursorrules', '.windsurfrules'],
        stackLoadingMode: 'lazy',
        selectedProfile: selectedProfileName,
        selectedProfileDisplayName: toTitleCase(selectedProfileName),
        blockingSeverities: PROFILE_PRESETS[selectedProfileName]?.blockingSeverities || [],
        ciGuardrailsEnabled: includeCiGuardrails,
      },
      majorConstraints: detectionMajorConstraints,
      quickConfirmation: {
        offered: false,
        response: 'upgrade-auto',
        source: 'upgrade-assistant',
      },
      decision: {
        mode: 'upgrade-auto',
        selectedStackFileName,
        selectedBlueprintFileName,
      },
    };

    console.log('\nExisting project detection transparency:');
    if (projectDetection.detectedStackFileName) {
      const confidenceScoreLabel = Number(projectDetection.confidenceScore || 0).toFixed(2);
      console.log(
        `- Detected stack: ${toTitleCase(projectDetection.detectedStackFileName)} (${projectDetection.confidenceLabel}, score ${confidenceScoreLabel})`
      );
    } else {
      console.log('- Detected stack: unresolved (insufficient markers).');
    }
    console.log('- Active rules baseline: canonical .instructions.md -> compiled .cursorrules/.windsurfrules');
    console.log(
      `- Active review thresholds: ${(
        PROFILE_PRESETS[selectedProfileName]?.blockingSeverities || []
      ).join(', ') || 'none'})`
    );
    console.log('- Top candidates:');
    console.log(formatDetectionCandidates(projectDetection.rankedCandidates));
    console.log('- Major constraints:');
    for (const majorConstraint of detectionMajorConstraints) {
      console.log(`  - ${majorConstraint}`);
    }

    const projectDocStalenessReport = await detectProjectDocTemplateStaleness(resolvedTargetDirectoryPath);

    const currentRulesPath = path.join(resolvedTargetDirectoryPath, '.cursorrules');
    const currentRulesContent = await pathExists(currentRulesPath)
      ? await fs.readFile(currentRulesPath, 'utf8')
      : '';

    const plannedRulesContent = await buildCompiledRulesContent({
      targetDirectoryPath: resolvedTargetDirectoryPath,
      selectedStackFileName,
      selectedAdditionalStackFileNames,
      selectedBlueprintFileName,
      selectedAdditionalBlueprintFileNames,
      includeCiGuardrails,
    });

    const isRulesContentChanged = currentRulesContent !== plannedRulesContent;
    const currentRuleLineCount = currentRulesContent ? currentRulesContent.split(/\r?\n/).length : 0;
    const plannedRuleLineCount = plannedRulesContent.split(/\r?\n/).length;

    console.log('\nUpgrade preview:');
    console.log(`- Target directory: ${resolvedTargetDirectoryPath}`);
    console.log(`- Runtime decision: ${selectedStackFileName === AGENT_DECISION_STACK_FILE_NAME ? 'agent recommendation required from repo evidence' : toTitleCase(selectedStackFileName)}`);
    if (selectedAdditionalStackFileNames.length > 0) {
      console.log(`- Additional stacks: ${selectedAdditionalStackFileNames.map((stackFileName) => toTitleCase(stackFileName)).join(', ')}`);
    }
    console.log(`- Architecture decision: ${selectedBlueprintFileName === AGENT_DECISION_BLUEPRINT_FILE_NAME ? 'agent recommendation required from repo evidence' : toTitleCase(selectedBlueprintFileName)}`);
    if (selectedAdditionalBlueprintFileNames.length > 0) {
      console.log(`- Additional blueprints: ${selectedAdditionalBlueprintFileNames.map((blueprintFileName) => toTitleCase(blueprintFileName)).join(', ')}`);
    }
    console.log(`- CI/CD quality checks (guardrails): ${includeCiGuardrails ? 'enabled' : 'disabled'}`);
    console.log(`- Existing rules lines: ${currentRuleLineCount}`);
    console.log(`- Planned rules lines: ${plannedRuleLineCount}`);
    console.log(`- Rules changed: ${isRulesContentChanged ? 'yes' : 'no'}`);
    console.log(`- Managed surface stale files: ${managedSurfacePlan.staleFiles.length}`);
    console.log(`- Managed surface stale directories: ${managedSurfacePlan.staleDirectories.length}`);
    console.log(`- Managed surface sync mode: 1:1 (prune enabled)`);
    console.log(`- Managed surface prune mode: ${upgradeOptions.pruneManagedSurface === true ? 'enabled (default)' : 'disabled (--no-prune)'}`);
    console.log(`- MCP config write mode: ${upgradeOptions.includeMcpTemplate === true ? 'enabled (default)' : 'disabled (--no-mcp-template)'}`);
    if (projectDocStalenessReport.hasProjectDocs) {
      console.log(`- Project docs detected: ${projectDocStalenessReport.checkedFileNames.length}`);
      console.log(`- Project docs expected template version: ${projectDocStalenessReport.expectedTemplateVersion}`);
      console.log(`- Project docs stale files: ${projectDocStalenessReport.staleFiles.length}`);
    }

    if (managedSurfacePlan.staleFiles.length > 0 || managedSurfacePlan.staleDirectories.length > 0) {
      console.log('\nManaged surface stale paths preview (up to 5):');
      const previewPaths = [
        ...managedSurfacePlan.staleFiles,
        ...managedSurfacePlan.staleDirectories,
      ].slice(0, 5);
      for (const previewPath of previewPaths) {
        console.log(`- ${previewPath}`);
      }
      if (managedSurfacePlan.staleFiles.length + managedSurfacePlan.staleDirectories.length > previewPaths.length) {
        console.log('- ...');
      }
    }

    if (projectDocStalenessReport.staleFiles.length > 0) {
      console.log('\n[WARN] Some project docs were generated from older template versions:');
      for (const staleDoc of projectDocStalenessReport.staleFiles) {
        const detectedVersionLabel = staleDoc.detectedTemplateVersion || 'missing';
        console.log(`- docs/${staleDoc.fileName} (detected: ${detectedVersionLabel}, expected: ${projectDocStalenessReport.expectedTemplateVersion})`);
      }
      console.log('Required action: regenerate docs with init --scaffold-docs or update the files manually to match the latest template version.');
    }

    if (uiScopeSignals.isUiScopeLikely && missingDesignContractPaths.length > 0) {
      console.log('\n[WARN] UI/frontend scope was detected, but the dynamic design contract is incomplete:');
      for (const missingDesignContractPath of missingDesignContractPaths) {
        console.log(`- Missing ${missingDesignContractPath}`);
      }
      if (uiScopeSignals.signalReasons.length > 0) {
        console.log(`- Detection signals: ${uiScopeSignals.signalReasons.join('; ')}`);
      }
      if (Array.isArray(uiScopeSignals.workspaceUiEntries) && uiScopeSignals.workspaceUiEntries.length > 0) {
        console.log(`- Nested UI workspaces: ${uiScopeSignals.workspaceUiEntries.map((workspaceUiEntry) => workspaceUiEntry.relativePath).join(', ')}`);
      }
      if (shouldSeedDesignIntentOnApply) {
        console.log('- Planned seed on apply: docs/design-intent.json');
      }
      console.log('Required action: create or refresh docs/DESIGN.md and docs/design-intent.json before allowing UI implementation work.');
      console.log('Upgrade synchronizes governance assets and can seed docs/design-intent.json, but it does not author project-specific docs/DESIGN.md automatically.');
    }

    if (upgradeOptions.dryRun) {
      console.log('\nDry run enabled. No files were modified.');
      return;
    }

    const shouldApplyUpgrade = upgradeOptions.skipConfirmation
      ? true
      : await askYesNo('Apply upgrade and synchronize managed files?', userInterface, true);

    if (!shouldApplyUpgrade) {
      console.log('Upgrade cancelled by user.');
      return;
    }

    await createBackup(resolvedTargetDirectoryPath);

    try {
      const governanceSyncResult = await copyGovernanceAssetsToTarget(resolvedTargetDirectoryPath, {
        includeMcpTemplate: upgradeOptions.includeMcpTemplate === true,
        pruneManagedSurface: upgradeOptions.pruneManagedSurface === true,
        managedSurfacePlan,
      });
      const supplementalCreatedFileNames = [];
      const shouldEnsureActiveMemorySnapshot = existingOnboardingReport?.memoryContinuity?.enabled !== false;

      if (shouldSeedDesignIntentOnApply && designIntentSeedContent) {
        const docsDirectoryPath = path.join(resolvedTargetDirectoryPath, 'docs');
        const designIntentTargetPath = path.join(docsDirectoryPath, 'design-intent.json');
        await ensureDirectory(docsDirectoryPath);
        await fs.writeFile(designIntentTargetPath, designIntentSeedContent, 'utf8');
        supplementalCreatedFileNames.push('docs/design-intent.json');
      }

      if (shouldEnsureActiveMemorySnapshot) {
        const activeMemoryResult = await ensureActiveMemorySnapshot(resolvedTargetDirectoryPath, {
          projectName: packageManifest?.name || path.basename(resolvedTargetDirectoryPath),
        });

        if (activeMemoryResult.created) {
          supplementalCreatedFileNames.push('.agent-context/state/active-memory.json');
        }
      }

      await compileDynamicContext({
        targetDirectoryPath: resolvedTargetDirectoryPath,
        selectedStackFileName,
        selectedAdditionalStackFileNames,
        selectedBlueprintFileName,
        selectedAdditionalBlueprintFileNames,
        includeCiGuardrails,
      });
      await writeSelectedPolicy(resolvedTargetDirectoryPath, selectedProfileName);

      const setupDurationMs = Date.now() - setupStartedAt;
      await writeOnboardingReport({
        targetDirectoryPath: resolvedTargetDirectoryPath,
        selectedProfileName,
        projectScope: existingOnboardingReport?.projectScope || null,
        selectedStackFileName,
        selectedAdditionalStackFileNames,
        selectedBlueprintFileName,
        selectedAdditionalBlueprintFileNames,
        includeCiGuardrails,
        setupDurationMs,
        projectDetection,
        runtimeEnvironment: existingOnboardingReport?.runtimeEnvironment || null,
        operationMode: 'upgrade',
        detectionTransparency,
        uiScopeSignals,
      });

      console.log('\nUpgrade complete.');
      console.log(`- Governance surface sync: 1:1 (${governanceSyncResult.updatedFiles.length} updated, ${governanceSyncResult.createdFiles.length} new, ${governanceSyncResult.deletedManagedFiles.length} deleted, ${governanceSyncResult.unchangedFiles.length} unchanged)`);
      console.log(`- Rules rewritten: ${isRulesContentChanged ? 'yes' : 'no (metadata refreshed)'}`);
      if (governanceSyncResult.deletedManagedDirectories.length > 0) {
        console.log(`- Managed stale directories removed: ${governanceSyncResult.deletedManagedDirectories.length}`);
      }
      console.log(`- Setup time: ${formatDuration(setupDurationMs)}`);

      if (governanceSyncResult.updatedFiles.length > 0 || governanceSyncResult.createdFiles.length > 0 || governanceSyncResult.deletedManagedFiles.length > 0) {
        console.log('\nDetailed changes:');
        governanceSyncResult.createdFiles.forEach((fileName) => console.log(`  [NEW]     ${fileName}`));
        governanceSyncResult.updatedFiles.forEach((fileName) => console.log(`  [UPDATED] ${fileName}`));
        governanceSyncResult.deletedManagedFiles.forEach((fileName) => console.log(`  [DELETED] ${fileName}`));
      }
      if (supplementalCreatedFileNames.length > 0) {
        if (!(governanceSyncResult.updatedFiles.length > 0 || governanceSyncResult.createdFiles.length > 0 || governanceSyncResult.deletedManagedFiles.length > 0)) {
          console.log('\nDetailed changes:');
        }
        supplementalCreatedFileNames.forEach((fileName) => console.log(`  [NEW]     ${fileName} (seed)`));
      }

      console.log('\nRefreshed files: .instructions.md, .agent-instructions.md, compiled adapters, and .agent-context/state/onboarding-report.json');
    } catch (error) {
      console.error('\n[FATAL] An error occurred during upgrade. Attempting automatic rollback...');
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
    }
  } finally {
    userInterface.close();
  }
}
