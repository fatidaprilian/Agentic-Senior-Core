/**
 * Conceptual anchor and math systems validators: enforces the anti-generic
 * anchor selection contract, source domains, visual risk budget, literal
 * translation policy, derived axes, final anchor contract, and the math
 * systems block.
 */

import { hasNonEmptyString } from './helpers.mjs';

const SEED_STATUSES = new Set([
  'seed-needs-design-synthesis',
  'seed-generated-during-init',
  'seed-generated-during-upgrade',
]);

function validateUserResearchAbsencePolicy(conceptualAnchor, validationErrors) {
  const userResearchAbsencePolicy = conceptualAnchor.userResearchAbsencePolicy;
  if (!userResearchAbsencePolicy || typeof userResearchAbsencePolicy !== 'object') {
    validationErrors.push('designIntent.conceptualAnchor.userResearchAbsencePolicy must exist.');
    return;
  }
  if (userResearchAbsencePolicy.userSuppliedResearchOnly !== true) {
    validationErrors.push('designIntent.conceptualAnchor.userResearchAbsencePolicy.userSuppliedResearchOnly must equal true.');
  }
  if (userResearchAbsencePolicy.scaffoldSeedDoesNotCountAsResearch !== true) {
    validationErrors.push('designIntent.conceptualAnchor.userResearchAbsencePolicy.scaffoldSeedDoesNotCountAsResearch must equal true.');
  }
  if (userResearchAbsencePolicy.priorUiDoesNotCountAsResearch !== true) {
    validationErrors.push('designIntent.conceptualAnchor.userResearchAbsencePolicy.priorUiDoesNotCountAsResearch must equal true.');
  }
  if (userResearchAbsencePolicy.requireAgentLedResearchWhenAvailable !== true) {
    validationErrors.push('designIntent.conceptualAnchor.userResearchAbsencePolicy.requireAgentLedResearchWhenAvailable must equal true.');
  }
}

function validateCandidateSelectionPolicy(conceptualAnchor, validationErrors) {
  const candidateSelectionPolicy = conceptualAnchor.candidateSelectionPolicy;
  if (!candidateSelectionPolicy || typeof candidateSelectionPolicy !== 'object') {
    validationErrors.push('designIntent.conceptualAnchor.candidateSelectionPolicy must exist.');
    return;
  }
  if (candidateSelectionPolicy.considerAtLeast < 3) {
    validationErrors.push('designIntent.conceptualAnchor.candidateSelectionPolicy.considerAtLeast must be at least 3.');
  }
  if (candidateSelectionPolicy.discardObviousCandidateCount < 2) {
    validationErrors.push('designIntent.conceptualAnchor.candidateSelectionPolicy.discardObviousCandidateCount must be at least 2.');
  }
  if (candidateSelectionPolicy.minimumCandidateDistance !== 'high') {
    validationErrors.push('designIntent.conceptualAnchor.candidateSelectionPolicy.minimumCandidateDistance must equal "high".');
  }
  if (candidateSelectionPolicy.discardPredictableCandidates !== true) {
    validationErrors.push('designIntent.conceptualAnchor.candidateSelectionPolicy.discardPredictableCandidates must equal true.');
  }
  if (candidateSelectionPolicy.preferDistinctiveOverSafe !== true) {
    validationErrors.push('designIntent.conceptualAnchor.candidateSelectionPolicy.preferDistinctiveOverSafe must equal true.');
  }
  if (candidateSelectionPolicy.doNotRevealHiddenCandidateList !== true) {
    validationErrors.push('designIntent.conceptualAnchor.candidateSelectionPolicy.doNotRevealHiddenCandidateList must equal true.');
  }
  if (candidateSelectionPolicy.outputOnlyChosenAnchor !== true) {
    validationErrors.push('designIntent.conceptualAnchor.candidateSelectionPolicy.outputOnlyChosenAnchor must equal true.');
  }
}

function validateCreativeCommitmentPolicy(conceptualAnchor, validationErrors) {
  const creativeCommitmentPolicy = conceptualAnchor.creativeCommitmentPolicy;
  if (!creativeCommitmentPolicy || typeof creativeCommitmentPolicy !== 'object') {
    validationErrors.push('designIntent.conceptualAnchor.creativeCommitmentPolicy must exist.');
    return;
  }
  if (creativeCommitmentPolicy.requiredBeforeComplianceReview !== true) {
    validationErrors.push('designIntent.conceptualAnchor.creativeCommitmentPolicy.requiredBeforeComplianceReview must equal true.');
  }
  if (creativeCommitmentPolicy.recordInDesignDocs !== true) {
    validationErrors.push('designIntent.conceptualAnchor.creativeCommitmentPolicy.recordInDesignDocs must equal true.');
  }
  if (
    !Array.isArray(creativeCommitmentPolicy.requiredCommitmentFields)
    || !creativeCommitmentPolicy.requiredCommitmentFields.includes('specificReferencePoint')
    || !creativeCommitmentPolicy.requiredCommitmentFields.includes('signatureMotion')
    || !creativeCommitmentPolicy.requiredCommitmentFields.includes('typographicDecision')
  ) {
    validationErrors.push('designIntent.conceptualAnchor.creativeCommitmentPolicy.requiredCommitmentFields must include specificReferencePoint, signatureMotion, and typographicDecision.');
  }
  if (creativeCommitmentPolicy.rejectGenericQualityWordsOnly !== true) {
    validationErrors.push('designIntent.conceptualAnchor.creativeCommitmentPolicy.rejectGenericQualityWordsOnly must equal true.');
  }
}

function validateVisualRiskBudgetAndLiteralPolicy(conceptualAnchor, validationErrors) {
  const visualRiskBudget = conceptualAnchor.visualRiskBudget;
  if (!visualRiskBudget || typeof visualRiskBudget !== 'object') {
    validationErrors.push('designIntent.conceptualAnchor.visualRiskBudget must exist.');
  } else {
    if (visualRiskBudget.mode !== 'high-distinctiveness-with-accessibility-and-performance-guardrails') {
      validationErrors.push('designIntent.conceptualAnchor.visualRiskBudget.mode must preserve high-distinctiveness guardrails.');
    }
    if (visualRiskBudget.allowRichMotionAndMicroInteraction !== true) {
      validationErrors.push('designIntent.conceptualAnchor.visualRiskBudget.allowRichMotionAndMicroInteraction must equal true.');
    }
    if (visualRiskBudget.rejectTimidDefaultWhenAnchorSupportsExpressiveUi !== true) {
      validationErrors.push('designIntent.conceptualAnchor.visualRiskBudget.rejectTimidDefaultWhenAnchorSupportsExpressiveUi must equal true.');
    }
    if (visualRiskBudget.requireReducedMotionFallback !== true) {
      validationErrors.push('designIntent.conceptualAnchor.visualRiskBudget.requireReducedMotionFallback must equal true.');
    }
  }

  const literalTranslationPolicy = conceptualAnchor.literalTranslationPolicy;
  if (!literalTranslationPolicy || typeof literalTranslationPolicy !== 'object') {
    validationErrors.push('designIntent.conceptualAnchor.literalTranslationPolicy must exist.');
    return;
  }
  if (literalTranslationPolicy.preferNonLiteralTranslation !== true) {
    validationErrors.push('designIntent.conceptualAnchor.literalTranslationPolicy.preferNonLiteralTranslation must equal true.');
  }
  if (!hasNonEmptyString(literalTranslationPolicy.allowedLiteralUse)) {
    validationErrors.push('designIntent.conceptualAnchor.literalTranslationPolicy.allowedLiteralUse must be a non-empty string.');
  }
  if (!String(literalTranslationPolicy.forbiddenLiteralUse || '').includes('decorative wallpaper')) {
    validationErrors.push('designIntent.conceptualAnchor.literalTranslationPolicy.forbiddenLiteralUse must reject decorative wallpaper.');
  }
}

function validateFinalAnchorContract(conceptualAnchor, validationErrors) {
  if (
    !Array.isArray(conceptualAnchor.requiredDerivedAxes)
    || !conceptualAnchor.requiredDerivedAxes.includes('typography')
    || !conceptualAnchor.requiredDerivedAxes.includes('responsive-composition')
  ) {
    validationErrors.push('designIntent.conceptualAnchor.requiredDerivedAxes must include typography and responsive-composition.');
  }
  const finalAnchorContract = conceptualAnchor.finalAnchorContract;
  if (!finalAnchorContract || typeof finalAnchorContract !== 'object') {
    validationErrors.push('designIntent.conceptualAnchor.finalAnchorContract must exist.');
    return;
  }
  if (
    !Array.isArray(finalAnchorContract.requiredFields)
    || !finalAnchorContract.requiredFields.includes('anchorReference')
    || !finalAnchorContract.requiredFields.includes('agentResearchMode')
    || !finalAnchorContract.requiredFields.includes('specificReferencePoint')
    || !finalAnchorContract.requiredFields.includes('signatureMotion')
    || !finalAnchorContract.requiredFields.includes('typographicDecision')
    || !finalAnchorContract.requiredFields.includes('derivedTokenLogic')
    || !finalAnchorContract.requiredFields.includes('visualRiskBudget')
    || !finalAnchorContract.requiredFields.includes('motionRiskBudget')
    || !finalAnchorContract.requiredFields.includes('cohesionChecks')
  ) {
    validationErrors.push('designIntent.conceptualAnchor.finalAnchorContract.requiredFields must require anchorReference, agentResearchMode, specificReferencePoint, signatureMotion, typographicDecision, derivedTokenLogic, visualRiskBudget, motionRiskBudget, and cohesionChecks.');
  }
  if (
    !Array.isArray(finalAnchorContract.derivedTokenLogicAxes)
    || !finalAnchorContract.derivedTokenLogicAxes.includes('motion')
    || !finalAnchorContract.derivedTokenLogicAxes.includes('morphology')
  ) {
    validationErrors.push('designIntent.conceptualAnchor.finalAnchorContract.derivedTokenLogicAxes must include motion and morphology.');
  }
  if (
    !Array.isArray(finalAnchorContract.cohesionChecks)
    || !finalAnchorContract.cohesionChecks.includes('no-dashboard-mental-model')
    || !finalAnchorContract.cohesionChecks.includes('motion-derived-from-anchor')
  ) {
    validationErrors.push('designIntent.conceptualAnchor.finalAnchorContract.cohesionChecks must reject dashboard mental models and require motion derivation.');
  }
}

export function validateConceptualAnchor(designIntentContract, validationErrors) {
  if (!designIntentContract.conceptualAnchor || typeof designIntentContract.conceptualAnchor !== 'object') {
    validationErrors.push('designIntent.conceptualAnchor must exist.');
    return validationErrors;
  }

  const conceptualAnchor = designIntentContract.conceptualAnchor;
  const isSeedStatus = SEED_STATUSES.has(designIntentContract.status);

  if (conceptualAnchor.mode !== 'required-when-no-external-research') {
    validationErrors.push('designIntent.conceptualAnchor.mode must equal "required-when-no-external-research".');
  }
  if (conceptualAnchor.seedMode !== 'selection-policy-only') {
    validationErrors.push('designIntent.conceptualAnchor.seedMode must equal "selection-policy-only".');
  }
  if (conceptualAnchor.requiresAgentSelectionBeforeUiImplementation !== true) {
    validationErrors.push('designIntent.conceptualAnchor.requiresAgentSelectionBeforeUiImplementation must equal true.');
  }
  if (!hasNonEmptyString(conceptualAnchor.anchorReference)) {
    validationErrors.push('designIntent.conceptualAnchor.anchorReference must be a stable non-empty ID.');
  }

  validateUserResearchAbsencePolicy(conceptualAnchor, validationErrors);
  validateCandidateSelectionPolicy(conceptualAnchor, validationErrors);
  validateCreativeCommitmentPolicy(conceptualAnchor, validationErrors);

  if (
    !Array.isArray(conceptualAnchor.forbiddenFinalAnchorTerms)
    || !conceptualAnchor.forbiddenFinalAnchorTerms.includes('dashboard')
    || !conceptualAnchor.forbiddenFinalAnchorTerms.includes('cards')
    || !conceptualAnchor.forbiddenFinalAnchorTerms.includes('safe-admin-layout')
  ) {
    validationErrors.push('designIntent.conceptualAnchor.forbiddenFinalAnchorTerms must reject basic UI labels.');
  }
  if (
    !Array.isArray(conceptualAnchor.sourceDomains)
    || conceptualAnchor.sourceDomains.length < 4
    || !conceptualAnchor.sourceDomains.includes('complex-physical-engineering')
    || !conceptualAnchor.sourceDomains.includes('cinematic-behavior-and-transition-systems')
    || !conceptualAnchor.sourceDomains.includes('workflow-and-custody-systems')
    || !conceptualAnchor.sourceDomains.includes('premium-interactive-web-experiences')
  ) {
    validationErrors.push('designIntent.conceptualAnchor.sourceDomains must list broad non-template anchor domains.');
  }

  validateVisualRiskBudgetAndLiteralPolicy(conceptualAnchor, validationErrors);
  validateFinalAnchorContract(conceptualAnchor, validationErrors);
  validateCategoryCodes(conceptualAnchor, validationErrors, { isSeedStatus });
  return validationErrors;
}

export function validateMathSystems(designIntentContract, validationErrors) {
  if (!designIntentContract.mathSystems || typeof designIntentContract.mathSystems !== 'object') {
    validationErrors.push('designIntent.mathSystems must exist.');
    return validationErrors;
  }
  if (!String(designIntentContract.mathSystems.typographyScaleRatio || '').trim()) {
    validationErrors.push('designIntent.mathSystems.typographyScaleRatio must describe the chosen or pending type scale decision.');
  }
  if (!String(designIntentContract.mathSystems.baseGridUnit || '').trim()) {
    validationErrors.push('designIntent.mathSystems.baseGridUnit must describe the chosen or pending spacing grid decision.');
  }
  return validationErrors;
}

function validateCategoryCodes(conceptualAnchor, validationErrors, options = {}) {
  const { isSeedStatus = false } = options;
  const categoryCodes = conceptualAnchor.categoryCodes;
  if (!categoryCodes || typeof categoryCodes !== 'object') {
    validationErrors.push('designIntent.conceptualAnchor.categoryCodes must exist (Section 3 of research-design.md).');
    return;
  }
  if (categoryCodes.mode !== 'agent-must-complete-before-ui-implementation') {
    validationErrors.push('designIntent.conceptualAnchor.categoryCodes.mode must equal "agent-must-complete-before-ui-implementation".');
  }
  if (categoryCodes.blockingByDefault !== true) {
    validationErrors.push('designIntent.conceptualAnchor.categoryCodes.blockingByDefault must equal true.');
  }
  if (categoryCodes.researchBriefSection !== 'Section 3') {
    validationErrors.push('designIntent.conceptualAnchor.categoryCodes.researchBriefSection must equal "Section 3".');
  }
  if (!hasNonEmptyString(categoryCodes.researchBriefPath) || !categoryCodes.researchBriefPath.includes('research-design.md')) {
    validationErrors.push('designIntent.conceptualAnchor.categoryCodes.researchBriefPath must point to the research-design.md brief.');
  }
  if (!Number.isInteger(categoryCodes.minimumEntries) || categoryCodes.minimumEntries < 3) {
    validationErrors.push('designIntent.conceptualAnchor.categoryCodes.minimumEntries must be an integer >= 3.');
  }
  if (!hasNonEmptyString(categoryCodes.specificityRule)) {
    validationErrors.push('designIntent.conceptualAnchor.categoryCodes.specificityRule must be a non-empty string.');
  }
  if (!hasNonEmptyString(categoryCodes.antiLeakageRule)) {
    validationErrors.push('designIntent.conceptualAnchor.categoryCodes.antiLeakageRule must be a non-empty string that prevents the example cliches from being read as target aesthetics.');
  }
  if (!hasNonEmptyString(categoryCodes.selfTestRule)) {
    validationErrors.push('designIntent.conceptualAnchor.categoryCodes.selfTestRule must be a non-empty string.');
  }
  if (!Array.isArray(categoryCodes.failingExamples) || categoryCodes.failingExamples.length < 3) {
    validationErrors.push('designIntent.conceptualAnchor.categoryCodes.failingExamples must list at least 3 failing examples to anchor the specificity floor.');
  }
  if (!Array.isArray(categoryCodes.passingExamples) || categoryCodes.passingExamples.length < 3) {
    validationErrors.push('designIntent.conceptualAnchor.categoryCodes.passingExamples must list at least 3 passing examples to anchor the specificity floor.');
  }
  if (!hasNonEmptyString(categoryCodes.passingExamplesPolicy)) {
    validationErrors.push('designIntent.conceptualAnchor.categoryCodes.passingExamplesPolicy must be a non-empty string clarifying that the passing examples are description-format illustrations, not target aesthetics.');
  }
  if (!Array.isArray(categoryCodes.commonAiSafeClichesToReject) || categoryCodes.commonAiSafeClichesToReject.length < 3) {
    validationErrors.push('designIntent.conceptualAnchor.categoryCodes.commonAiSafeClichesToReject must list at least 3 AI-safe defaults the agent has to name and reject when the project sits near them.');
  }
  if (!hasNonEmptyString(categoryCodes.commonAiSafeClichesPolicy)) {
    validationErrors.push('designIntent.conceptualAnchor.categoryCodes.commonAiSafeClichesPolicy must be a non-empty string requiring the matching cliche to appear with a rejection note when the project pattern-matches it.');
  }
  if (
    !Array.isArray(categoryCodes.requiredFieldsPerEntry)
    || !categoryCodes.requiredFieldsPerEntry.includes('description')
    || !categoryCodes.requiredFieldsPerEntry.includes('categoryDefaultReason')
    || !categoryCodes.requiredFieldsPerEntry.includes('rejectionNote')
  ) {
    validationErrors.push('designIntent.conceptualAnchor.categoryCodes.requiredFieldsPerEntry must require description, categoryDefaultReason, and rejectionNote.');
  }
  if (!Array.isArray(categoryCodes.forbiddenPlaceholderPhrases) || categoryCodes.forbiddenPlaceholderPhrases.length === 0) {
    validationErrors.push('designIntent.conceptualAnchor.categoryCodes.forbiddenPlaceholderPhrases must list the abstract phrases that fail the specificity self-test.');
  }
  if (!Array.isArray(categoryCodes.candidateEntries)) {
    validationErrors.push('designIntent.conceptualAnchor.categoryCodes.candidateEntries must be an array (empty in the seed; populated by the agent).');
  }
}

