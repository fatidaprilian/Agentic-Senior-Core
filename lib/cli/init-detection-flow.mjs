import {
  BLUEPRINT_RECOMMENDATIONS,
} from './constants.mjs';

import {
  filterBlueprintFileNamesByCandidates,
  normalizeAdditionalStackSelection,
} from './init-selection.mjs';

import {
  toTitleCase,
} from './utils.mjs';

export function buildExistingProjectMajorConstraints() {
  return [
    'Preserve existing project markers and avoid forced stack migration.',
    'Keep stack rule loading lazy and scoped to touched code.',
    'Explicit stack or blueprint overrides always win over auto-detection.',
  ];
}

export async function resolveDetectedSetupDecision({
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
  initialSelectedManualStackFileName,
  initialSelectedManualBlueprintFileName,
  initialSelectedAdditionalStackFileNames,
}) {
  let selectedManualStackFileName = initialSelectedManualStackFileName || null;
  let selectedManualBlueprintFileName = initialSelectedManualBlueprintFileName || null;
  let selectedAdditionalStackFileNames = initialSelectedAdditionalStackFileNames || [];
  let detectedSetupWasApplied = false;

  const detectedBlueprintFileName = projectDetection.recommendedBlueprintFileName
    || BLUEPRINT_RECOMMENDATIONS[projectDetection.recommendedStackFileName]
    || null;

  if (shouldAutoApplyDetectedStack) {
    if (isInteractiveSession) {
      detectionTransparency.quickConfirmation.offered = true;
      console.log('\nQuick confirmation for existing project detection:');
      console.log(`- Suggested stack: ${toTitleCase(projectDetection.recommendedStackFileName)}`);
      if (detectedBlueprintFileName) {
        console.log(`- Suggested blueprint: ${toTitleCase(detectedBlueprintFileName)}`);
      }

      const shouldUseDetectedSetup = await askYesNo(
        'Use detected setup for this existing project?',
        userInterface,
        true
      );

      if (shouldUseDetectedSetup) {
        detectedSetupWasApplied = true;
        detectionTransparency.quickConfirmation.response = 'confirmed-detected';
        detectionTransparency.decision.mode = 'confirmed-detected';
        console.log(`Using detected stack automatically for this existing project: ${toTitleCase(projectDetection.recommendedStackFileName)}.`);
        if (projectDetection.secondaryStackFileNames?.length) {
          console.log(`Detected additional stack signals: ${projectDetection.secondaryStackFileNames.map((stackFileName) => toTitleCase(stackFileName)).join(', ')}.`);
        }
        selectedAdditionalStackFileNames = projectDetection.secondaryStackFileNames || [];
      } else {
        const overrideStackFileName = await askStackSelection(
          'Override detected stack (quick selection):',
          stackFileNames,
          userInterface
        );
        const overrideBlueprintCandidates = filterBlueprintFileNamesByCandidates(
          blueprintFileNames,
          [BLUEPRINT_RECOMMENDATIONS[overrideStackFileName]].filter(Boolean)
        );
        const overrideBlueprintFileName = await askBlueprintSelection(
          'Override detected blueprint (quick selection):',
          overrideBlueprintCandidates,
          userInterface
        );

        selectedManualStackFileName = overrideStackFileName;
        selectedManualBlueprintFileName = overrideBlueprintFileName;
        selectedAdditionalStackFileNames = normalizeAdditionalStackSelection(
          overrideStackFileName,
          projectDetection.secondaryStackFileNames || []
        );
        detectionTransparency.quickConfirmation.response = 'overridden-detected';
        detectionTransparency.decision.mode = 'overridden-detected';
        console.log(
          `Detection override applied: ${toTitleCase(overrideStackFileName)} + ${toTitleCase(overrideBlueprintFileName)}.`
        );
      }
    } else {
      detectedSetupWasApplied = true;
      detectionTransparency.quickConfirmation.response = 'non-interactive-auto';
      detectionTransparency.decision.mode = 'non-interactive-auto';
      console.log(`Using detected stack automatically for this existing project: ${toTitleCase(projectDetection.recommendedStackFileName)}.`);
      if (projectDetection.secondaryStackFileNames?.length) {
        console.log(`Detected additional stack signals: ${projectDetection.secondaryStackFileNames.map((stackFileName) => toTitleCase(stackFileName)).join(', ')}.`);
      }
      selectedAdditionalStackFileNames = projectDetection.secondaryStackFileNames || [];
    }
  } else if (projectDetection.hasExistingProjectFiles && projectDetection.recommendedStackFileName) {
    detectionTransparency.quickConfirmation.response = 'explicit-selection-or-low-confidence';
    detectionTransparency.decision.mode = 'explicit-selection-or-low-confidence';
  } else if (!projectDetection.hasExistingProjectFiles) {
    detectionTransparency.quickConfirmation.response = 'not-applicable';
    detectionTransparency.decision.mode = 'fresh-directory';
  }

  return {
    detectedSetupWasApplied,
    selectedManualStackFileName,
    selectedManualBlueprintFileName,
    selectedAdditionalStackFileNames,
    detectedBlueprintFileName,
  };
}