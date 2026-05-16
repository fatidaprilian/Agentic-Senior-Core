/**
 * Conceptual anchor and math systems validators: enforces the anti-generic
 * anchor selection contract, source domains, visual risk budget, literal
 * translation policy, derived axes, final anchor contract, and the math
 * systems block.
 */

import { hasNonEmptyString } from './helpers.mjs';

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
