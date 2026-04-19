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
  BLUEPRINT_RECOMMENDATIONS,
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
} from '../detector.mjs';
import {
  buildCompiledRulesContent,
  writeSelectedPolicy,
  writeOnboardingReport,
  loadOnboardingReportIfExists,
} from '../compiler.mjs';

import { runPreflightChecks } from '../preflight.mjs';
import { createBackup } from '../backup.mjs';
import { performRollback } from '../rollback.mjs';
import { detectProjectDocTemplateStaleness } from '../project-scaffolder.mjs';

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
    'Keep stack rule loading lazy and scoped to touched code.',
    'Upgrade keeps prior onboarding choices unless user overrides them.',
  ];
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
    console.log('Running rules operations upgrade assistant (Federated Governance baseline) for an existing repository.');

    const managedSurfacePlan = await analyzeManagedGovernanceSurface(resolvedTargetDirectoryPath);

    const stackFileNames = await collectFileNames(path.join(AGENT_CONTEXT_DIR, 'stacks'));
    const blueprintFileNames = await collectFileNames(path.join(AGENT_CONTEXT_DIR, 'blueprints'));
    const existingOnboardingReport = await loadOnboardingReportIfExists(resolvedTargetDirectoryPath);
    const projectDetection = await detectProjectContext(resolvedTargetDirectoryPath);

    const selectedProfileName = PROFILE_PRESETS[existingOnboardingReport?.selectedProfile]
      ? existingOnboardingReport.selectedProfile
      : 'balanced';

    const selectedStackFileName = stackFileNames.includes(existingOnboardingReport?.selectedStack)
      ? existingOnboardingReport.selectedStack
      : projectDetection.recommendedStackFileName || 'typescript.md';

    const selectedAdditionalStackFileNames = Array.isArray(existingOnboardingReport?.selectedAdditionalStacks)
      ? Array.from(new Set(existingOnboardingReport.selectedAdditionalStacks.filter(
        (stackFileName) => stackFileNames.includes(stackFileName) && stackFileName !== selectedStackFileName
      )))
      : Array.from(new Set((projectDetection.secondaryStackFileNames || []).filter(
        (stackFileName) => stackFileNames.includes(stackFileName) && stackFileName !== selectedStackFileName
      )));

    const selectedBlueprintFileName = blueprintFileNames.includes(existingOnboardingReport?.selectedBlueprint)
      ? existingOnboardingReport.selectedBlueprint
      : BLUEPRINT_RECOMMENDATIONS[selectedStackFileName] || 'api-nextjs.md';

    const selectedAdditionalBlueprintFileNames = Array.isArray(existingOnboardingReport?.selectedAdditionalBlueprints)
      ? Array.from(new Set(existingOnboardingReport.selectedAdditionalBlueprints.filter(
        (blueprintFileName) => blueprintFileNames.includes(blueprintFileName) && blueprintFileName !== selectedBlueprintFileName
      )))
      : Array.from(new Set(selectedAdditionalStackFileNames
        .map((stackFileName) => BLUEPRINT_RECOMMENDATIONS[stackFileName] || null)
        .filter((blueprintFileName) => blueprintFileName && blueprintFileName !== selectedBlueprintFileName)));

    const includeCiGuardrails = typeof existingOnboardingReport?.ciGuardrailsEnabled === 'boolean'
      ? existingOnboardingReport.ciGuardrailsEnabled
      : true;

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
    if (projectDetection.recommendedStackFileName) {
      const confidenceScoreLabel = Number(projectDetection.confidenceScore || 0).toFixed(2);
      console.log(
        `- Detected stack: ${toTitleCase(projectDetection.recommendedStackFileName)} (${projectDetection.confidenceLabel}, score ${confidenceScoreLabel})`
      );
    } else {
      console.log('- Detected stack: unresolved (insufficient markers).');
    }
    console.log('- Active rules baseline: canonical .instructions.md -> compiled .cursorrules/.windsurfrules');
    console.log(
      `- Active review profile: ${toTitleCase(selectedProfileName)} (blocking severities: ${(
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
      selectedProfileName,
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
    console.log(`- Profile: ${toTitleCase(selectedProfileName)}`);
    console.log(`- Stack: ${toTitleCase(selectedStackFileName)}`);
    if (selectedAdditionalStackFileNames.length > 0) {
      console.log(`- Additional stacks: ${selectedAdditionalStackFileNames.map((stackFileName) => toTitleCase(stackFileName)).join(', ')}`);
    }
    console.log(`- Blueprint: ${toTitleCase(selectedBlueprintFileName)}`);
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
      console.log('Recommendation: regenerate docs with init --scaffold-docs or update the files manually to match the latest template version.');
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

      await fs.writeFile(currentRulesPath, plannedRulesContent, 'utf8');
      await fs.writeFile(path.join(resolvedTargetDirectoryPath, '.windsurfrules'), plannedRulesContent, 'utf8');
      await writeSelectedPolicy(resolvedTargetDirectoryPath, selectedProfileName);

      const setupDurationMs = Date.now() - setupStartedAt;
      await writeOnboardingReport({
        targetDirectoryPath: resolvedTargetDirectoryPath,
        selectedProfileName,
        selectedProfilePack: existingOnboardingReport?.selectedProfilePack || null,
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

      console.log('\nRefreshed files: .cursorrules, .windsurfrules, .agent-context/state/onboarding-report.json');
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
