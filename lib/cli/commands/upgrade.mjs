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
  copyGovernanceAssetsToTarget,
} from '../utils.mjs';

import { detectProjectContext } from '../detector.mjs';
import {
  buildCompiledRulesContent,
  writeSelectedPolicy,
  writeOnboardingReport,
  loadOnboardingReportIfExists,
} from '../compiler.mjs';

import { runPreflightChecks } from '../preflight.mjs';
import { createBackup } from '../backup.mjs';
import { performRollback } from '../rollback.mjs';
import { inferSkillDomainNamesFromSelection } from '../skill-selector.mjs';
import { evaluateSkillDomainCompatibility } from '../compatibility.mjs';

export function parseUpgradeArguments(commandArguments) {
  const parsedUpgradeOptions = {
    targetDirectory: '.',
    dryRun: false,
    skipConfirmation: false,
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

    throw new Error(`Unknown option: ${currentArgument}`);
  }

  return parsedUpgradeOptions;
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
    console.log('Running upgrade assistant for an existing repository.');

    await copyGovernanceAssetsToTarget(resolvedTargetDirectoryPath);

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

    const selectedBlueprintFileName = blueprintFileNames.includes(existingOnboardingReport?.selectedBlueprint)
      ? existingOnboardingReport.selectedBlueprint
      : BLUEPRINT_RECOMMENDATIONS[selectedStackFileName] || 'api-nextjs.md';

    const includeCiGuardrails = typeof existingOnboardingReport?.ciGuardrailsEnabled === 'boolean'
      ? existingOnboardingReport.ciGuardrailsEnabled
      : true;

    const selectedSkillDomainNames = inferSkillDomainNamesFromSelection(
      selectedStackFileName,
      selectedBlueprintFileName
    );
    const compatibilityWarnings = await evaluateSkillDomainCompatibility(
      resolvedTargetDirectoryPath,
      selectedSkillDomainNames
    );

    if (compatibilityWarnings.length > 0) {
      console.log('\n[WARN] Compatibility checks reported potential issues for this environment:');
      for (const compatibilityWarning of compatibilityWarnings) {
        console.log(`- ${compatibilityWarning}`);
      }
      console.log('Upgrade will continue, but review these warnings before production use.');
    }

    const currentRulesPath = path.join(resolvedTargetDirectoryPath, '.cursorrules');
    const currentRulesContent = await pathExists(currentRulesPath)
      ? await fs.readFile(currentRulesPath, 'utf8')
      : '';

    const plannedRulesContent = await buildCompiledRulesContent({
      targetDirectoryPath: resolvedTargetDirectoryPath,
      selectedProfileName,
      selectedStackFileName,
      selectedBlueprintFileName,
      includeCiGuardrails,
    });

    const isRulesContentChanged = currentRulesContent !== plannedRulesContent;
    const currentRuleLineCount = currentRulesContent ? currentRulesContent.split(/\r?\n/).length : 0;
    const plannedRuleLineCount = plannedRulesContent.split(/\r?\n/).length;

    console.log('\nUpgrade preview:');
    console.log(`- Target directory: ${resolvedTargetDirectoryPath}`);
    console.log(`- Profile: ${toTitleCase(selectedProfileName)}`);
    console.log(`- Stack: ${toTitleCase(selectedStackFileName)}`);
    console.log(`- Blueprint: ${toTitleCase(selectedBlueprintFileName)}`);
    console.log(`- CI/CD guardrails: ${includeCiGuardrails ? 'enabled' : 'disabled'}`);
    console.log(`- Existing rules lines: ${currentRuleLineCount}`);
    console.log(`- Planned rules lines: ${plannedRuleLineCount}`);
    console.log(`- Rules changed: ${isRulesContentChanged ? 'yes' : 'no'}`);

    if (upgradeOptions.dryRun) {
      console.log('\nDry run enabled. No files were modified.');
      return;
    }

    const shouldApplyUpgrade = upgradeOptions.skipConfirmation
      ? true
      : await askYesNo('Apply upgrade and write migrated files?', userInterface, true);

    if (!shouldApplyUpgrade) {
      console.log('Upgrade cancelled by user.');
      return;
    }

    const backup = await createBackup(resolvedTargetDirectoryPath);

    try {
      await fs.writeFile(currentRulesPath, plannedRulesContent, 'utf8');
      await fs.writeFile(path.join(resolvedTargetDirectoryPath, '.windsurfrules'), plannedRulesContent, 'utf8');
      await writeSelectedPolicy(resolvedTargetDirectoryPath, selectedProfileName);

      const setupDurationMs = Date.now() - setupStartedAt;
      await writeOnboardingReport({
        targetDirectoryPath: resolvedTargetDirectoryPath,
        selectedProfileName,
        selectedProfilePack: existingOnboardingReport?.selectedProfilePack || null,
        selectedStackFileName,
        selectedBlueprintFileName,
        includeCiGuardrails,
        setupDurationMs,
        projectDetection,
        selectedSkillDomains: selectedSkillDomainNames,
        compatibilityWarnings,
        operationMode: 'upgrade',
      });

      console.log('\nUpgrade complete.');
      console.log(`- Rules rewritten: ${isRulesContentChanged ? 'yes' : 'no (metadata refreshed)'}`);
      console.log(`- Setup time: ${formatDuration(setupDurationMs)}`);
      console.log('- Updated files: .cursorrules, .windsurfrules, .agent-context/state/onboarding-report.json');
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
