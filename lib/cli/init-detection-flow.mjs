export function buildExistingProjectMajorConstraints({ mode = 'init' } = {}) {
  if (mode === 'upgrade') {
    return [
      'Preserve existing project markers and avoid forced stack migration.',
      'Use runtime markers as evidence only unless the user already recorded an explicit runtime constraint.',
      'Upgrade keeps prior explicit onboarding constraints but does not create new stack or blueprint decisions.',
    ];
  }

  return [
    'Preserve existing project markers and avoid forced stack migration.',
    'Use detected runtime markers as evidence only; do not convert them into stack migration or design direction.',
    'Explicit stack or blueprint overrides are constraints only when the user provides them.',
  ];
}

export async function resolveDetectedSetupDecision({
  shouldAutoApplyDetectedStack,
  projectDetection,
  detectionTransparency,
  initialSelectedManualStackFileName,
  initialSelectedManualBlueprintFileName,
  initialSelectedAdditionalStackFileNames,
}) {
  let selectedManualStackFileName = initialSelectedManualStackFileName || null;
  let selectedManualBlueprintFileName = initialSelectedManualBlueprintFileName || null;
  let selectedAdditionalStackFileNames = initialSelectedAdditionalStackFileNames || [];
  let detectedSetupWasApplied = false;

  if (shouldAutoApplyDetectedStack) {
    detectionTransparency.quickConfirmation.response = 'evidence-only';
    detectionTransparency.decision.mode = 'existing-project-evidence-only';
    selectedAdditionalStackFileNames = [];
  } else if (projectDetection.hasExistingProjectFiles && projectDetection.detectedStackFileName) {
    detectionTransparency.quickConfirmation.response = 'evidence-only';
    detectionTransparency.decision.mode = 'existing-project-evidence-only';
  } else if (!projectDetection.hasExistingProjectFiles) {
    detectionTransparency.quickConfirmation.response = 'not-applicable';
    detectionTransparency.decision.mode = 'fresh-agent-decision-required';
  }

  return {
    detectedSetupWasApplied,
    selectedManualStackFileName,
    selectedManualBlueprintFileName,
    selectedAdditionalStackFileNames,
  };
}
