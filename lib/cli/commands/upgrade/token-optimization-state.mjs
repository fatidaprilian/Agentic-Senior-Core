import {
  createTokenOptimizationState,
  detectRtkBinary,
  normalizeAgentName,
  readTokenOptimizationState,
  writeTokenOptimizationState,
} from '../../token-optimization.mjs';

export async function resolveUpgradeTokenOptimizationPlan(targetDirectoryPath, existingOnboardingReport) {
  const existingState = await readTokenOptimizationState(targetDirectoryPath);
  const optedOut = existingOnboardingReport?.tokenOptimization?.enabled === false;
  const selectedAgentName = normalizeAgentName(
    existingOnboardingReport?.tokenOptimization?.selectedAgent || 'copilot'
  );

  return {
    existingState,
    optedOut,
    selectedAgentName,
    shouldSeed: !existingState && !optedOut,
    previewLabel: optedOut
      ? 'disabled (preserved opt-out)'
      : existingState
        ? 'enabled'
        : 'enabled (will seed missing ASCX state)',
    reportState: existingState
      || (optedOut ? existingOnboardingReport?.tokenOptimization || { enabled: false } : null),
  };
}

export async function applyUpgradeTokenOptimizationPlan(targetDirectoryPath, plan) {
  if (!plan.shouldSeed) {
    return {
      createdFileName: null,
      reportState: plan.reportState,
    };
  }

  const tokenOptimizationState = createTokenOptimizationState({
    isEnabled: true,
    selectedAgentName: plan.selectedAgentName,
    rtkDetection: detectRtkBinary(),
  });

  await writeTokenOptimizationState(targetDirectoryPath, tokenOptimizationState);

  return {
    createdFileName: '.agent-context/state/token-optimization.json',
    reportState: tokenOptimizationState,
  };
}
