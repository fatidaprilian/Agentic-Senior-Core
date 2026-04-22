import fs from 'node:fs/promises';
import path from 'node:path';

import { ensureDirectory, formatDuration } from '../utils.mjs';
import { compileDynamicContext, loadOnboardingReportIfExists } from '../compiler.mjs';
import {
  TOKEN_OPTIMIZATION_REPORT_FILE_NAME,
  normalizeAgentName,
  detectRtkBinary,
  buildRtkInstallHint,
  buildRtkHookCommand,
  createTokenOptimizationState,
  readTokenOptimizationState,
  writeTokenOptimizationState,
} from '../token-optimization.mjs';

function normalizeMarkdownFileName(rawFileName, fallbackFileName) {
  if (typeof rawFileName !== 'string' || rawFileName.trim().length === 0) {
    return fallbackFileName;
  }

  const normalizedFileName = rawFileName.trim();
  return normalizedFileName.endsWith('.md')
    ? normalizedFileName
    : `${normalizedFileName}.md`;
}

export function parseOptimizeArguments(commandArguments) {
  const parsedOptimizeOptions = {
    targetDirectory: '.',
    agent: 'copilot',
    enabled: true,
    show: false,
  };

  for (let argumentIndex = 0; argumentIndex < commandArguments.length; argumentIndex++) {
    const currentArgument = commandArguments[argumentIndex];

    if (!currentArgument.startsWith('--')) {
      parsedOptimizeOptions.targetDirectory = currentArgument;
      continue;
    }

    if (currentArgument === '--agent') {
      parsedOptimizeOptions.agent = commandArguments[argumentIndex + 1] || 'copilot';
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith('--agent=')) {
      parsedOptimizeOptions.agent = currentArgument.split('=')[1] || 'copilot';
      continue;
    }

    if (currentArgument === '--enable') {
      parsedOptimizeOptions.enabled = true;
      continue;
    }

    if (currentArgument === '--disable') {
      parsedOptimizeOptions.enabled = false;
      continue;
    }

    if (currentArgument === '--show') {
      parsedOptimizeOptions.show = true;
      continue;
    }

    throw new Error(`Unknown option: ${currentArgument}`);
  }

  parsedOptimizeOptions.agent = normalizeAgentName(parsedOptimizeOptions.agent);
  return parsedOptimizeOptions;
}

export async function runOptimizeCommand(targetDirectoryArgument, optimizeOptions = {}) {
  const optimizationStartedAt = Date.now();
  const resolvedTargetDirectoryPath = path.resolve(targetDirectoryArgument || '.');

  await ensureDirectory(resolvedTargetDirectoryPath);

  const selectedAgentName = normalizeAgentName(optimizeOptions.agent || 'copilot');
  const rtkDetection = detectRtkBinary();

  if (optimizeOptions.show) {
    const existingOptimizationState = await readTokenOptimizationState(resolvedTargetDirectoryPath);
    console.log(
      JSON.stringify(
        {
          targetDirectory: resolvedTargetDirectoryPath,
          selectedAgent: selectedAgentName,
          externalProxy: rtkDetection,
          tokenOptimizationState: existingOptimizationState,
        },
        null,
        2
      )
    );
    return;
  }

  const onboardingReport = await loadOnboardingReportIfExists(resolvedTargetDirectoryPath);
  if (!onboardingReport) {
    throw new Error(
      'Token optimization requires an initialized repository. Run "agentic-senior-core init" first.'
    );
  }

  const tokenOptimizationState = createTokenOptimizationState({
    isEnabled: optimizeOptions.enabled,
    selectedAgentName,
    rtkDetection,
  });

  await writeTokenOptimizationState(resolvedTargetDirectoryPath, tokenOptimizationState);

  const selectedStackFileName = normalizeMarkdownFileName(onboardingReport.selectedStack, 'typescript.md');
  const selectedAdditionalStackFileNames = Array.isArray(onboardingReport.selectedAdditionalStacks)
    ? onboardingReport.selectedAdditionalStacks
      .map((stackFileName) => normalizeMarkdownFileName(stackFileName, ''))
      .filter((stackFileName) => stackFileName && stackFileName !== selectedStackFileName)
    : [];
  const selectedBlueprintFileName = normalizeMarkdownFileName(onboardingReport.selectedBlueprint, 'api-nextjs.md');
  const selectedAdditionalBlueprintFileNames = Array.isArray(onboardingReport.selectedAdditionalBlueprints)
    ? onboardingReport.selectedAdditionalBlueprints
      .map((blueprintFileName) => normalizeMarkdownFileName(blueprintFileName, ''))
      .filter((blueprintFileName) => blueprintFileName && blueprintFileName !== selectedBlueprintFileName)
    : [];
  const includeCiGuardrails = typeof onboardingReport.ciGuardrailsEnabled === 'boolean'
    ? onboardingReport.ciGuardrailsEnabled
    : true;

  await compileDynamicContext({
    targetDirectoryPath: resolvedTargetDirectoryPath,
    selectedStackFileName,
    selectedAdditionalStackFileNames,
    selectedBlueprintFileName,
    selectedAdditionalBlueprintFileNames,
    includeCiGuardrails,
  });

  const optimizationDurationMs = Date.now() - optimizationStartedAt;
  const tokenOptimizationReport = {
    generatedAt: new Date().toISOString(),
    targetDirectory: resolvedTargetDirectoryPath,
    enabled: tokenOptimizationState.enabled,
    selectedAgent: tokenOptimizationState.selectedAgent,
    preferredShellProxy: tokenOptimizationState.preferredShellProxy,
    externalProxy: tokenOptimizationState.externalProxy,
    setupDurationMs: optimizationDurationMs,
  };

  const reportFilePath = path.join(
    resolvedTargetDirectoryPath,
    '.agent-context',
    'state',
    TOKEN_OPTIMIZATION_REPORT_FILE_NAME
  );
  await fs.writeFile(reportFilePath, JSON.stringify(tokenOptimizationReport, null, 2) + '\n', 'utf8');

  console.log(`\nToken optimization ${tokenOptimizationState.enabled ? 'enabled' : 'disabled'}.`);
  console.log(`- Target directory: ${resolvedTargetDirectoryPath}`);
  console.log(`- Agent profile: ${tokenOptimizationState.selectedAgent}`);
  console.log(`- Preferred shell proxy: ${tokenOptimizationState.preferredShellProxy}`);
  console.log(`- Setup time: ${formatDuration(optimizationDurationMs)}`);
  console.log('- Updated files: .cursorrules, .windsurfrules, .agent-context/state/token-optimization.json');

  if (tokenOptimizationState.enabled) {
    if (rtkDetection.isAvailable) {
      console.log(`- External proxy detected: ${rtkDetection.version ? `v${rtkDetection.version}` : 'yes'}`);
      console.log('- Recommended hook command:');
      console.log(`  ${buildRtkHookCommand(tokenOptimizationState.selectedAgent)}`);
    } else {
      console.log('- External proxy not detected. Native fallback mode has been activated.');
      console.log(`- Install hint: ${buildRtkInstallHint()}`);
    }
  }
}
