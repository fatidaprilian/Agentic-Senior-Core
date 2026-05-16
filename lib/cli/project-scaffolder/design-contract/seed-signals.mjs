/**
 * Lightweight seed-signal helpers used by the contract builder to fill in
 * mathSystems, motion intent, and copy describing the project context. Kept
 * separate so the contract builder file stays focused on assembly.
 */

export function shouldBootstrapDesignDocument(discoveryAnswers, initContext) {
  const normalizedDomain = String(discoveryAnswers.primaryDomain || '').trim().toLowerCase();
  const normalizedBlueprint = String(initContext.blueprintFileName || '').trim().toLowerCase();

  const isUiDomain = normalizedDomain.includes('web')
    || normalizedDomain.includes('mobile')
    || normalizedDomain.includes('frontend')
    || normalizedDomain.includes('fullstack')
    || normalizedDomain.includes('ui');

  const isBackendOnlyDomain = normalizedDomain.includes('api service')
    || normalizedDomain.includes('cli tool')
    || normalizedDomain.includes('library');

  const blueprintLooksUi = normalizedBlueprint.includes('frontend')
    || normalizedBlueprint.includes('landing')
    || normalizedBlueprint.includes('ui');

  if (isUiDomain) {
    return true;
  }

  if (!isBackendOnlyDomain && blueprintLooksUi) {
    return true;
  }

  return false;
}

export function buildStructureFirstSeedSignals({
  projectName,
  projectDescription,
  primaryDomain,
  supplementalFields = {},
}) {
  const normalizedDescription = String(projectDescription || '').trim();
  const repoEvidenceSummary = supplementalFields?.repoEvidence?.designEvidenceSummary || null;
  const hasRepoEvidence = Boolean(
    repoEvidenceSummary
    || (Array.isArray(supplementalFields?.repoEvidence?.workspaceUiEntries)
      && supplementalFields.repoEvidence.workspaceUiEntries.length > 0),
  );
  const evidenceSourceLabel = hasRepoEvidence
    ? 'current repo evidence, existing UI code, and the active brief'
    : 'the active brief and any repo evidence available at synthesis time';
  const projectContextLabel = normalizedDescription
    ? `the product context "${normalizedDescription}"`
    : 'the current product context';

  return {
    designPhilosophy: `Synthesize design for ${projectName || 'this project'} from ${evidenceSourceLabel}. Choose visual language, libraries, color, type, spacing, and interaction from ${projectContextLabel}; verify technology claims with official docs.`,
    typographyScaleRatio: 'agent-calibrated-from-content-platform-and-readability',
    baseGridUnit: 'agent-calibrated-from-platform-density-and-implementation-stack',
    spacingPattern: 'agent-defined-from-task-flow-and-viewport-needs',
    densityMode: 'agent-defined-from-user-task-device-and-content-pressure',
    colorIntent: `Choose semantic palette roles from ${projectContextLabel}, repo evidence, and accessibility. Reject scaffold or SaaS palette defaults.`,
    paletteRoles: ['agent-defined-semantic-roles'],
    distinctiveMoves: [
      'Choose one product-specific move from task, audience, content, repo evidence, and docs.',
    ],
    motionPurpose: 'Use expressive motion when it improves hierarchy, continuity, feedback, memorability, or confidence. Verify new motion libraries with official docs.',
    componentMorphology: {
      mobile: 'Recompose for touch, task priority, and constrained attention.',
      tablet: 'Regroup surfaces for medium width without cloning desktop or mobile.',
      desktop: 'Use space for hierarchy and scanability; avoid template grids.',
    },
    mutationRules: {
      mobile: 'Reorder, merge, or disclose content for mobile. Reject scale-only shrink.',
      tablet: 'Regroup for tablet instead of width-only desktop reduction.',
      desktop: 'Use space intentionally; avoid equal-weight modules without evidence.',
    },
  };
}
