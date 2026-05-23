import path from 'node:path';

import { buildDesignIntentSeedFromSignals } from '../../project-scaffolder.mjs';

export function buildUpgradeDesignIntentSeed({
  targetDirectoryPath,
  packageManifest,
  selectedStackFileName,
  selectedBlueprintFileName,
  uiScopeSignals,
}) {
  const projectName = String(packageManifest?.name || path.basename(targetDirectoryPath)).trim()
    || 'existing-ui-project';
  const isMobileUiProject = String(selectedStackFileName || '').toLowerCase().includes('react-native')
    || String(selectedStackFileName || '').toLowerCase().includes('flutter')
    || uiScopeSignals.signalReasons.some((signalReason) => {
      return signalReason.includes('android') || signalReason.includes('ios');
    });
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
