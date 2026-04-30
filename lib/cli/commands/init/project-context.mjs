import fs from 'node:fs/promises';
import path from 'node:path';

import { buildDesignIntentSeedFromSignals } from '../../project-scaffolder.mjs';

function normalizeContextLine(rawText) {
  return String(rawText || '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function readTextIfExists(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}

function extractMarkdownContext(rawMarkdown) {
  return String(rawMarkdown || '')
    .split(/\r?\n/)
    .map((line) => normalizeContextLine(line.replace(/^#+\s*/, '')))
    .filter((line) => line && !line.startsWith('---') && !line.startsWith('```'))
    .slice(0, 3)
    .join(' ');
}

export async function inferExistingProjectDescriptionHint(targetDirectoryPath) {
  const evidence = [];
  const packageJsonContent = await readTextIfExists(path.join(targetDirectoryPath, 'package.json'));

  if (packageJsonContent) {
    try {
      const packageManifest = JSON.parse(packageJsonContent);
      const packageSummary = [
        normalizeContextLine(packageManifest.name),
        normalizeContextLine(packageManifest.description),
      ].filter(Boolean).join(': ');

      if (packageSummary) {
        evidence.push(`package.json: ${packageSummary}`);
      }
    } catch {
      // Invalid package metadata should not block init; other files can still provide context.
    }
  }

  for (const relativeDocPath of ['docs/project-brief.md', 'docs/README.md', 'README.md']) {
    const docContext = extractMarkdownContext(
      await readTextIfExists(path.join(targetDirectoryPath, relativeDocPath))
    );

    if (docContext) {
      evidence.push(`${relativeDocPath}: ${docContext}`);
    }
  }

  return evidence.slice(0, 3).join(' | ');
}

export function buildInitExistingProjectDesignIntentSeed({
  targetDirectoryPath,
  packageManifest,
  selectedStackFileName,
  selectedBlueprintFileName,
  uiScopeSignals,
  projectDescriptionHint,
}) {
  const projectName = String(packageManifest?.name || path.basename(targetDirectoryPath)).trim() || 'existing-ui-project';
  const isMobileUiProject = String(selectedStackFileName || '').toLowerCase().includes('react-native')
    || String(selectedStackFileName || '').toLowerCase().includes('flutter')
    || uiScopeSignals.signalReasons.some((signalReason) => signalReason.includes('android') || signalReason.includes('ios'));
  const resolvedDomain = isMobileUiProject ? 'Mobile app' : 'Web application';
  const projectDescription = String(packageManifest?.description || projectDescriptionHint || '').trim()
    || `Existing ${resolvedDomain.toLowerCase()} detected during init. Create a project-specific dynamic design contract before shipping new UI work.`;

  return buildDesignIntentSeedFromSignals({
    projectName,
    projectDescription,
    primaryDomain: resolvedDomain,
    features: [],
    initContext: {
      stackFileName: selectedStackFileName,
      blueprintFileName: selectedBlueprintFileName,
    },
    status: 'seed-generated-during-init',
    supplementalFields: {
      initSignals: {
        detectedFrom: uiScopeSignals.signalReasons,
        generatedBy: 'init-existing-project-seed',
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
