import path from 'node:path';

import {
  PROJECT_SCOPE_CHOICES,
  BLUEPRINT_RECOMMENDATIONS,
} from './constants.mjs';

import {
  recommendArchitecture,
  formatArchitectureRecommendation,
  createUpdatedArchitectPreference,
  shouldApplyRepeatedOverridePreference,
} from './architect.mjs';

import {
  askChoice,
  askYesNo,
  toTitleCase,
} from './utils.mjs';

import {
  filterStackFileNamesByCandidates,
  filterBlueprintFileNamesByCandidates,
  resolveProjectScopeKeyFromLabel,
  resolveScopeStackCandidates,
  resolveScopeBlueprintCandidates,
} from './init-selection.mjs';

const DEFAULT_PROJECT_SCOPE_KEY = 'both';
const DEFAULT_PROJECT_SCOPE_LABEL = PROJECT_SCOPE_CHOICES.find(
  (scopeChoice) => scopeChoice.key === DEFAULT_PROJECT_SCOPE_KEY
)?.label || 'Both (frontend + backend)';

export async function resolveArchitectureSelection({
  shouldRunArchitectureRecommendation,
  initOptions,
  projectDetection,
  stackFileNames,
  blueprintFileNames,
  userInterface,
  isInteractiveSession,
  initialSelectedProjectScopeKey,
  initialSelectedProjectScopeLabel,
  initialSelectedManualStackFileName,
  initialSelectedManualBlueprintFileName,
  architectPreferenceState,
  askStackSelection,
  askBlueprintSelection,
  detectionTransparency,
}) {
  let selectedProjectScopeKey = initialSelectedProjectScopeKey || DEFAULT_PROJECT_SCOPE_KEY;
  let selectedProjectScopeLabel = initialSelectedProjectScopeLabel || DEFAULT_PROJECT_SCOPE_LABEL;
  let selectedManualStackFileName = initialSelectedManualStackFileName || null;
  let selectedManualBlueprintFileName = initialSelectedManualBlueprintFileName || null;
  let architectureRecommendation = null;
  let nextArchitectPreferenceState = architectPreferenceState;
  let architectPreferenceUpdated = false;

  if (!shouldRunArchitectureRecommendation) {
    return {
      selectedProjectScopeKey,
      selectedProjectScopeLabel,
      selectedManualStackFileName,
      selectedManualBlueprintFileName,
      architectureProjectDescription: '',
      architectureRecommendation,
      architectPreferenceState: nextArchitectPreferenceState,
      architectPreferenceUpdated,
    };
  }

  let architectureProjectDescription = String(initOptions.projectDescription || '').trim();
  const isFreshProjectFlow = !projectDetection.hasExistingProjectFiles;

  if (isFreshProjectFlow && isInteractiveSession) {
    const selectedProjectScopeInput = await askChoice(
      'Project domain (frontend only, backend only, or both):',
      PROJECT_SCOPE_CHOICES.map((scopeChoice) => scopeChoice.label),
      userInterface
    );

    selectedProjectScopeKey = resolveProjectScopeKeyFromLabel(selectedProjectScopeInput);
    selectedProjectScopeLabel = selectedProjectScopeInput;

    if (!architectureProjectDescription) {
      architectureProjectDescription = (await userInterface.question(
        '\nProject description (free text): '
      )).trim();
    }
  }

  if (!architectureProjectDescription && isInteractiveSession && !isFreshProjectFlow) {
    architectureProjectDescription = (await userInterface.question(
      '\nDescribe your project in one short paragraph for architecture recommendation: '
    )).trim();
  }

  if (!architectureProjectDescription) {
    architectureProjectDescription = `A software project named ${path.basename(initOptions.targetDirectoryPath)}.`;
  }

  const scopeStackCandidates = filterStackFileNamesByCandidates(
    stackFileNames,
    resolveScopeStackCandidates(selectedProjectScopeKey)
  );
  const scopeBlueprintCandidates = filterBlueprintFileNamesByCandidates(
    blueprintFileNames,
    resolveScopeBlueprintCandidates(selectedProjectScopeKey)
  );

  architectureRecommendation = recommendArchitecture({
    projectDescription: architectureProjectDescription,
    projectDetection,
    stackFileNames: scopeStackCandidates,
    blueprintFileNames: scopeBlueprintCandidates,
    tokenBudget: initOptions.architectTokenBudget,
    timeoutMs: initOptions.architectTimeoutMs,
    researchMode: initOptions.architectResearchMode,
    enableRealtimeResearch: initOptions.enableRealtimeResearch,
    realtimeSignalFilePath: initOptions.architectRealtimeSignalFile,
  });

  architectureRecommendation.projectDomain = {
    key: selectedProjectScopeKey,
    label: selectedProjectScopeLabel,
  };

  architectureRecommendation.userVeto = {
    applied: false,
    selectedStackFileName: architectureRecommendation.recommendedStackFileName,
    selectedBlueprintFileName: architectureRecommendation.recommendedBlueprintFileName,
    source: 'recommendation',
  };

  console.log(formatArchitectureRecommendation(architectureRecommendation));

  const shouldSkipRecommendationDebate = shouldApplyRepeatedOverridePreference(
    nextArchitectPreferenceState,
    architectureRecommendation.recommendedStackFileName
  );

  if (isFreshProjectFlow) {
    selectedManualStackFileName = architectureRecommendation.recommendedStackFileName;
    selectedManualBlueprintFileName = architectureRecommendation.recommendedBlueprintFileName;

    if (detectionTransparency) {
      detectionTransparency.quickConfirmation.response = 'fresh-project-two-question';
      detectionTransparency.decision.mode = 'fresh-project-two-question-auto';
    }
  } else if (shouldSkipRecommendationDebate) {
    architectureRecommendation.failureModes.repeatedOverride = true;
    selectedManualStackFileName = stackFileNames.includes(nextArchitectPreferenceState.preferredStackFileName)
      ? nextArchitectPreferenceState.preferredStackFileName
      : architectureRecommendation.recommendedStackFileName;
    selectedManualBlueprintFileName = blueprintFileNames.includes(nextArchitectPreferenceState.preferredBlueprintFileName)
      ? nextArchitectPreferenceState.preferredBlueprintFileName
      : architectureRecommendation.recommendedBlueprintFileName;
    architectureRecommendation.userVeto = {
      applied: true,
      selectedStackFileName: selectedManualStackFileName,
      selectedBlueprintFileName: selectedManualBlueprintFileName,
      source: 'saved-preference',
    };
    console.log(
      `Repeated override preference detected. Applying ${toTitleCase(selectedManualStackFileName)} + ${toTitleCase(selectedManualBlueprintFileName)} without additional debate.`
    );
  } else if (!isInteractiveSession) {
    selectedManualStackFileName = architectureRecommendation.recommendedStackFileName;
    selectedManualBlueprintFileName = architectureRecommendation.recommendedBlueprintFileName;
  } else {
    const shouldApplyRecommendedArchitecture = await askYesNo(
      'Apply this architecture recommendation?',
      userInterface,
      true
    );

    if (shouldApplyRecommendedArchitecture) {
      selectedManualStackFileName = architectureRecommendation.recommendedStackFileName;
      selectedManualBlueprintFileName = architectureRecommendation.recommendedBlueprintFileName;
    } else {
      const vetoStackFileName = await askStackSelection(
        'User veto received. Select stack to apply immediately:',
        stackFileNames,
        userInterface
      );

      const vetoBlueprintCandidates = filterBlueprintFileNamesByCandidates(
        blueprintFileNames,
        [BLUEPRINT_RECOMMENDATIONS[vetoStackFileName]].filter(Boolean)
      );

      const vetoBlueprintFileName = await askBlueprintSelection(
        'Select blueprint to apply immediately (no further debate):',
        vetoBlueprintCandidates,
        userInterface
      );

      selectedManualStackFileName = vetoStackFileName;
      selectedManualBlueprintFileName = vetoBlueprintFileName;
      architectureRecommendation.userVeto = {
        applied: true,
        selectedStackFileName: vetoStackFileName,
        selectedBlueprintFileName: vetoBlueprintFileName,
        source: 'interactive-veto',
      };

      nextArchitectPreferenceState = createUpdatedArchitectPreference(nextArchitectPreferenceState, {
        selectedStackFileName: vetoStackFileName,
        selectedBlueprintFileName: vetoBlueprintFileName,
      });
      architectPreferenceUpdated = true;

      if (nextArchitectPreferenceState.overrideCount >= 2) {
        architectureRecommendation.failureModes.repeatedOverride = true;
      }

      console.log(
        `Veto applied. Proceeding with ${toTitleCase(vetoStackFileName)} + ${toTitleCase(vetoBlueprintFileName)} without recommendation loops.`
      );
    }
  }

  return {
    selectedProjectScopeKey,
    selectedProjectScopeLabel,
    selectedManualStackFileName,
    selectedManualBlueprintFileName,
    architectureProjectDescription,
    architectureRecommendation,
    architectPreferenceState: nextArchitectPreferenceState,
    architectPreferenceUpdated,
  };
}
