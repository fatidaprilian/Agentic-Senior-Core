// @ts-check

import { existsSync, readFileSync } from 'node:fs';
import {
  DESIGN_EXECUTION_REQUIRED_CAPABILITIES,
  DESIGN_GUIDE_PATH,
  DESIGN_INTENT_PATH,
} from './constants.mjs';

export function normalizeStringArray(rawValue) {
  if (!Array.isArray(rawValue)) {
    return [];
  }

  return rawValue
    .map((entryValue) => String(entryValue || '').trim())
    .filter(Boolean);
}

export function loadDesignIntent() {
  if (!existsSync(DESIGN_INTENT_PATH)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(DESIGN_INTENT_PATH, 'utf8'));
  } catch {
    return null;
  }
}

export function loadDesignGuide() {
  if (!existsSync(DESIGN_GUIDE_PATH)) {
    return '';
  }

  return readFileSync(DESIGN_GUIDE_PATH, 'utf8');
}

function hasRepoEvidenceSummary(designIntentContent) {
  return Boolean(
    designIntentContent?.repoEvidence?.designEvidenceSummary
    && typeof designIntentContent.repoEvidence.designEvidenceSummary === 'object'
  );
}

function summarizeDesignExecutionHandoff(designIntentContent) {
  const designExecutionHandoff = designIntentContent?.designExecutionHandoff
  && typeof designIntentContent.designExecutionHandoff === 'object'
    ? designIntentContent.designExecutionHandoff
    : {};

  const surfacePlan = Array.isArray(designExecutionHandoff.surfacePlan)
    ? designExecutionHandoff.surfacePlan
    : [];
  const componentGraphNodes = Array.isArray(designExecutionHandoff.componentGraph?.nodes)
    ? designExecutionHandoff.componentGraph.nodes
    : [];
  const componentGraphEdges = Array.isArray(designExecutionHandoff.componentGraph?.edges)
    ? designExecutionHandoff.componentGraph.edges
    : [];
  const interactionStateMatrix = Array.isArray(designExecutionHandoff.interactionStateMatrix)
    ? designExecutionHandoff.interactionStateMatrix
    : [];
  const taskFlowNarrative = normalizeStringArray(designExecutionHandoff.taskFlowNarrative);
  const contentPriorityMap = designExecutionHandoff.contentPriorityMap
  && typeof designExecutionHandoff.contentPriorityMap === 'object'
    ? designExecutionHandoff.contentPriorityMap
    : {};
  const viewportMutationPlan = designExecutionHandoff.viewportMutationPlan
  && typeof designExecutionHandoff.viewportMutationPlan === 'object'
    ? designExecutionHandoff.viewportMutationPlan
    : {};

  const artifactChecks = [
    { name: 'surfacePlan', present: surfacePlan.length > 0 },
    { name: 'componentGraphNodes', present: componentGraphNodes.length > 1 },
    { name: 'componentGraphEdges', present: componentGraphEdges.length > 0 },
    {
      name: 'contentPriorityMap',
      present: ['primary', 'secondary', 'deferred'].every((bucketKey) => Array.isArray(contentPriorityMap?.[bucketKey]) && contentPriorityMap[bucketKey].length > 0),
    },
    {
      name: 'viewportMutationPlan',
      present: ['mobile', 'tablet', 'desktop'].every((viewportKey) => String(viewportMutationPlan?.[viewportKey] || '').trim().length > 0),
    },
    { name: 'interactionStateMatrix', present: interactionStateMatrix.length > 0 },
    { name: 'taskFlowNarrative', present: taskFlowNarrative.length > 1 },
    { name: 'signatureMoveRationale', present: String(designExecutionHandoff.signatureMoveRationale || '').trim().length > 0 },
  ];

  const presentArtifacts = artifactChecks.filter((artifactCheck) => artifactCheck.present).map((artifactCheck) => artifactCheck.name);
  const missingArtifacts = artifactChecks.filter((artifactCheck) => !artifactCheck.present).map((artifactCheck) => artifactCheck.name);
  const implementationGuardrails = designExecutionHandoff.implementationGuardrails
  && typeof designExecutionHandoff.implementationGuardrails === 'object'
    ? designExecutionHandoff.implementationGuardrails
    : {};

  return {
    present: Object.keys(designExecutionHandoff).length > 0,
    version: typeof designExecutionHandoff.version === 'string' ? designExecutionHandoff.version : null,
    handoffReady: (typeof designExecutionHandoff.version === 'string' && designExecutionHandoff.version === 'ui-handoff-v1')
      && missingArtifacts.length === 0
      && implementationGuardrails.requireBuildFromHandoff === true
      && implementationGuardrails.requireGapNotesBeforeFallback === true
      && implementationGuardrails.forbidGenericLayoutFallbackWithoutReason === true,
    artifactCount: presentArtifacts.length,
    presentArtifacts,
    missingArtifacts,
  };
}

export function summarizeDesignExecutionPolicy(designIntentContent) {
  const designExecutionPolicy = designIntentContent?.designExecutionPolicy
  && typeof designIntentContent.designExecutionPolicy === 'object'
    ? designIntentContent.designExecutionPolicy
    : {};

  const requiredCapabilities = DESIGN_EXECUTION_REQUIRED_CAPABILITIES.map((capability) => ({
    name: capability,
    enabled: designExecutionPolicy[capability] === true,
  }));
  const enabledCapabilities = requiredCapabilities
    .filter((capability) => capability.enabled)
    .map((capability) => capability.name);
  const missingCapabilities = requiredCapabilities
    .filter((capability) => !capability.enabled)
    .map((capability) => capability.name);
  const semanticReviewFocus = normalizeStringArray(designExecutionPolicy.semanticReviewFocus);
  const representationStrategy = typeof designExecutionPolicy.representationStrategy === 'string'
    ? designExecutionPolicy.representationStrategy
    : null;
  const repoEvidenceAvailable = hasRepoEvidenceSummary(designIntentContent);
  const screenshotDependencyForbidden = designExecutionPolicy.forbidScreenshotDependency === true;
  const handoffFormatVersion = typeof designExecutionPolicy.handoffFormatVersion === 'string'
    ? designExecutionPolicy.handoffFormatVersion
    : null;
  const handoffSummary = summarizeDesignExecutionHandoff(designIntentContent);
  const policyPresent = Object.keys(designExecutionPolicy).length > 0;
  const contractReady = policyPresent
    && representationStrategy === 'surface-plan-v1'
    && handoffFormatVersion === 'ui-handoff-v1'
    && missingCapabilities.length === 0
    && semanticReviewFocus.length >= 4
    && screenshotDependencyForbidden
    && handoffSummary.handoffReady
    && repoEvidenceAvailable;

  const notes = [];
  if (!policyPresent) {
    notes.push('designExecutionPolicy is missing from docs/design-intent.json.');
  }
  if (representationStrategy !== 'surface-plan-v1') {
    notes.push('Structured design execution should declare representationStrategy "surface-plan-v1".');
  }
  if (handoffFormatVersion !== 'ui-handoff-v1') {
    notes.push('Structured design execution should declare handoffFormatVersion "ui-handoff-v1".');
  }
  if (missingCapabilities.length > 0) {
    notes.push(`Structured design execution is missing required capabilities: ${missingCapabilities.join(', ')}.`);
  }
  if (semanticReviewFocus.length < 4) {
    notes.push('Structured design execution should declare semantic review focus dimensions before UI implementation review.');
  }
  if (!screenshotDependencyForbidden) {
    notes.push('Structured design execution must explicitly forbid screenshot dependency as a baseline requirement.');
  }
  if (!handoffSummary.handoffReady) {
    notes.push(`Structured design handoff is incomplete: ${handoffSummary.missingArtifacts.join(', ') || 'missing or invalid handoff metadata'}.`);
  }
  if (!repoEvidenceAvailable) {
    notes.push('repoEvidence.designEvidenceSummary is missing or unreadable.');
  }
  if (notes.length === 0) {
    notes.push('Structured design execution policy is present and ready for contract review.');
  }

  return {
    policyPresent,
    representationStrategy,
    contractReady,
    screenshotDependencyForbidden,
    repoEvidenceAvailable,
    handoffPresent: handoffSummary.present,
    handoffVersion: handoffSummary.version,
    handoffReady: handoffSummary.handoffReady,
    handoffArtifactCount: handoffSummary.artifactCount,
    presentHandoffArtifacts: handoffSummary.presentArtifacts,
    missingHandoffArtifacts: handoffSummary.missingArtifacts,
    repoEvidenceSummaryVersion: repoEvidenceAvailable
      ? String(designIntentContent.repoEvidence.designEvidenceSummary.summaryVersion || '')
      : null,
    requiredCapabilities: requiredCapabilities.map((capability) => capability.name),
    enabledCapabilities,
    missingCapabilities,
    semanticReviewFocus,
    notes,
  };
}

export function summarizeReviewRubric(designIntentContent) {
  const reviewRubric = designIntentContent?.reviewRubric && typeof designIntentContent.reviewRubric === 'object'
    ? designIntentContent.reviewRubric
    : {};

  const dimensions = Array.isArray(reviewRubric.dimensions)
    ? reviewRubric.dimensions
      .map((dimension) => ({
        key: String(dimension?.key || '').trim(),
        blockingByDefault: dimension?.blockingByDefault === true,
        question: String(dimension?.question || '').trim(),
      }))
      .filter((dimension) => Boolean(dimension.key))
    : [];

  return {
    version: typeof reviewRubric.version === 'string' ? reviewRubric.version : null,
    dimensions,
    genericitySignals: normalizeStringArray(reviewRubric.genericitySignals),
    validBoldSignals: normalizeStringArray(reviewRubric.validBoldSignals),
    reportingRules: reviewRubric.reportingRules && typeof reviewRubric.reportingRules === 'object'
      ? {
        mustExplainGenericity: reviewRubric.reportingRules.mustExplainGenericity === true,
        mustSeparateTasteFromFailure: reviewRubric.reportingRules.mustSeparateTasteFromFailure === true,
        contractFidelityOverridesPersonalTaste: reviewRubric.reportingRules.contractFidelityOverridesPersonalTaste === true,
      }
      : {
        mustExplainGenericity: false,
        mustSeparateTasteFromFailure: false,
        contractFidelityOverridesPersonalTaste: false,
      },
  };
}
