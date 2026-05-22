import fs from 'node:fs/promises';
import path from 'node:path';

import { ensureDirectory, formatDuration } from '../utils.mjs';
import { loadOnboardingReportIfExists } from '../compiler.mjs';
import {
  TOKEN_OPTIMIZATION_REPORT_FILE_NAME,
  normalizeAgentName,
  detectRtkBinary,
  detectAscxRuntime,
  checkAscxTeeReadiness,
  resolveRuntimeTokenSaverMode,
  buildRuntimeTokenSaverWarnings,
  buildRuntimeTokenSaverNextAction,
  buildRtkInstallHint,
  buildRtkHookCommand,
  createTokenOptimizationState,
  readTokenOptimizationState,
  writeTokenOptimizationState,
} from '../token-optimization.mjs';

export function parseOptimizeArguments(commandArguments) {
  const parsedOptimizeOptions = {
    targetDirectory: '.',
    agent: 'copilot',
    enabled: true,
    mode: 'configure',
    show: false,
  };

  function setOptimizeMode(nextMode) {
    if (parsedOptimizeOptions.mode !== 'configure' && parsedOptimizeOptions.mode !== nextMode) {
      throw new Error(`Conflicting optimize modes: ${parsedOptimizeOptions.mode} and ${nextMode}`);
    }

    parsedOptimizeOptions.mode = nextMode;
  }

  for (let argumentIndex = 0; argumentIndex < commandArguments.length; argumentIndex++) {
    const currentArgument = commandArguments[argumentIndex];

    if (currentArgument === 'install') {
      setOptimizeMode('install');
      parsedOptimizeOptions.enabled = true;
      continue;
    }

    if (currentArgument === 'off') {
      setOptimizeMode('off');
      parsedOptimizeOptions.enabled = false;
      continue;
    }

    if (currentArgument === 'status') {
      setOptimizeMode('status');
      continue;
    }

    if (currentArgument === 'doctor') {
      setOptimizeMode('doctor');
      continue;
    }

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
      if (parsedOptimizeOptions.mode === 'off') {
        setOptimizeMode('install');
      }
      continue;
    }

    if (currentArgument === '--disable') {
      parsedOptimizeOptions.enabled = false;
      if (parsedOptimizeOptions.mode === 'install') {
        setOptimizeMode('off');
      }
      continue;
    }

    if (currentArgument === '--show') {
      setOptimizeMode('show');
      parsedOptimizeOptions.show = true;
      continue;
    }

    if (currentArgument === '--status') {
      setOptimizeMode('status');
      continue;
    }

    if (currentArgument === '--doctor') {
      setOptimizeMode('doctor');
      continue;
    }

    throw new Error(`Unknown option: ${currentArgument}`);
  }

  parsedOptimizeOptions.agent = normalizeAgentName(parsedOptimizeOptions.agent);
  return parsedOptimizeOptions;
}

function formatStatusLine(label, value) {
  return `${label}: ${value}`;
}

async function buildRuntimeTokenSaverStatus(resolvedTargetDirectoryPath, options = {}) {
  const onboardingReport = await loadOnboardingReportIfExists(resolvedTargetDirectoryPath);
  const existingOptimizationState = await readTokenOptimizationState(resolvedTargetDirectoryPath);
  const ascxDetection = detectAscxRuntime();
  const rtkDetection = detectRtkBinary();
  const teeReadiness = await checkAscxTeeReadiness(resolvedTargetDirectoryPath, {
    writeProbe: options.writeProbe === true,
  });
  const mode = resolveRuntimeTokenSaverMode({
    tokenOptimizationState: existingOptimizationState,
    ascxDetection,
    rtkDetection,
  });
  const warnings = buildRuntimeTokenSaverWarnings({
    mode,
    onboardingReport,
    ascxDetection,
    teeReadiness,
    rtkDetection,
  });

  return {
    targetDirectory: resolvedTargetDirectoryPath,
    initialized: Boolean(onboardingReport),
    mode,
    ascx: ascxDetection,
    tee: teeReadiness,
    rtk: rtkDetection,
    nineRouter: {
      status: 'not-checked',
      reason: 'localhost probing is intentionally deferred',
    },
    warnings,
    nextAction: buildRuntimeTokenSaverNextAction({ mode, warnings }),
    tokenOptimizationState: existingOptimizationState,
  };
}

function printRuntimeTokenSaverStatus(statusReport, options = {}) {
  const title = options.title || 'Runtime token saver status';
  const ascxStatus = statusReport.ascx.isAvailable
    ? `found (${statusReport.ascx.source})`
    : 'missing';
  const rtkStatus = statusReport.rtk.isAvailable
    ? `detected${statusReport.rtk.version ? ` (${statusReport.rtk.version})` : ''}`
    : 'not-detected';

  console.log(title);
  console.log(formatStatusLine('target', statusReport.targetDirectory));
  console.log(formatStatusLine('initialized', statusReport.initialized ? 'yes' : 'no'));
  console.log(formatStatusLine('mode', statusReport.mode));
  console.log(formatStatusLine('ascx', ascxStatus));
  console.log(formatStatusLine('tee', `${statusReport.tee.status} (${statusReport.tee.path})`));
  console.log(formatStatusLine('rtk', rtkStatus));
  console.log(formatStatusLine('9router', statusReport.nineRouter.status));

  if (statusReport.warnings.length > 0) {
    console.log('warnings:');
    for (const warning of statusReport.warnings) {
      console.log(`- ${warning}`);
    }
  } else {
    console.log('warnings: none');
  }

  console.log(formatStatusLine('next_action', statusReport.nextAction));
}

export async function runOptimizeCommand(targetDirectoryArgument, optimizeOptions = {}) {
  const optimizationStartedAt = Date.now();
  const resolvedTargetDirectoryPath = path.resolve(targetDirectoryArgument || '.');

  await ensureDirectory(resolvedTargetDirectoryPath);

  const selectedAgentName = normalizeAgentName(optimizeOptions.agent || 'copilot');
  const rtkDetection = detectRtkBinary();

  if (optimizeOptions.mode === 'status') {
    const statusReport = await buildRuntimeTokenSaverStatus(resolvedTargetDirectoryPath);
    printRuntimeTokenSaverStatus(statusReport);
    return;
  }

  if (optimizeOptions.mode === 'doctor') {
    const statusReport = await buildRuntimeTokenSaverStatus(resolvedTargetDirectoryPath, {
      writeProbe: true,
    });
    printRuntimeTokenSaverStatus(statusReport, {
      title: 'ASCX runtime token saver doctor',
    });
    return;
  }

  if (optimizeOptions.show || optimizeOptions.mode === 'show') {
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
    isEnabled: optimizeOptions.mode === 'off' ? false : optimizeOptions.enabled,
    selectedAgentName,
    rtkDetection,
  });

  await writeTokenOptimizationState(resolvedTargetDirectoryPath, tokenOptimizationState);

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
  console.log('- Updated files: .agent-context/state/token-optimization.json and .agent-context/state/token-optimization-report.json');

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
