/**
 * Structural-shape validators for the design intent contract: top-level mode,
 * project block, design philosophy, external research intake, and the design
 * flexibility policy. Each validator pushes its findings onto the shared error
 * accumulator and returns it.
 */

import { hasNonEmptyString } from './helpers.mjs';

export function validateModeAndProjectShape(designIntentContract, validationErrors) {
  if (designIntentContract.mode !== 'dynamic') {
    validationErrors.push('designIntent.mode must equal "dynamic".');
  }

  if (!designIntentContract.project || typeof designIntentContract.project !== 'object') {
    validationErrors.push('designIntent.project must exist.');
  }

  if (!designIntentContract.designPhilosophy || typeof designIntentContract.designPhilosophy !== 'string') {
    validationErrors.push('designIntent.designPhilosophy must be a non-empty string.');
  }
  return validationErrors;
}

export function validateExternalResearchIntake(designIntentContract, validationErrors) {
  if (!designIntentContract.externalResearchIntake || typeof designIntentContract.externalResearchIntake !== 'object') {
    validationErrors.push('designIntent.externalResearchIntake must exist.');
    return validationErrors;
  }

  const externalResearchIntake = designIntentContract.externalResearchIntake;
  if (externalResearchIntake.userSuppliedResearchPolicy !== 'read-as-candidate-evidence-not-final-prescription') {
    validationErrors.push('designIntent.externalResearchIntake.userSuppliedResearchPolicy must preserve user research as candidate evidence.');
  }
  if (externalResearchIntake.requireOfficialDocsVerificationForTechnologyClaims !== true) {
    validationErrors.push('designIntent.externalResearchIntake.requireOfficialDocsVerificationForTechnologyClaims must equal true.');
  }
  if (
    !Array.isArray(externalResearchIntake.candidateDomains)
    || !externalResearchIntake.candidateDomains.includes('motion-and-scroll')
  ) {
    validationErrors.push('designIntent.externalResearchIntake.candidateDomains must include motion-and-scroll.');
  }
  return validationErrors;
}

export function validateDesignFlexibilityPolicy(designIntentContract, validationErrors) {
  if (!designIntentContract.designFlexibilityPolicy || typeof designIntentContract.designFlexibilityPolicy !== 'object') {
    validationErrors.push('designIntent.designFlexibilityPolicy must exist.');
    return validationErrors;
  }

  const designFlexibilityPolicy = designIntentContract.designFlexibilityPolicy;
  if (designFlexibilityPolicy.mode !== 'locked-outcomes-flexible-expression') {
    validationErrors.push('designIntent.designFlexibilityPolicy.mode must equal "locked-outcomes-flexible-expression".');
  }
  if (!hasNonEmptyString(designFlexibilityPolicy.contractRole)) {
    validationErrors.push('designIntent.designFlexibilityPolicy.contractRole must be a non-empty string.');
  }
  if (!Array.isArray(designFlexibilityPolicy.lockedOutcomeTypes) || designFlexibilityPolicy.lockedOutcomeTypes.length < 4) {
    validationErrors.push('designIntent.designFlexibilityPolicy.lockedOutcomeTypes must list the locked outcome categories.');
  }
  if (!Array.isArray(designFlexibilityPolicy.flexibleExpressionAxes) || designFlexibilityPolicy.flexibleExpressionAxes.length < 4) {
    validationErrors.push('designIntent.designFlexibilityPolicy.flexibleExpressionAxes must list flexible expression axes.');
  }
  if (!hasNonEmptyString(designFlexibilityPolicy.tokenLockingRule)) {
    validationErrors.push('designIntent.designFlexibilityPolicy.tokenLockingRule must be a non-empty string.');
  }
  if (!String(designFlexibilityPolicy.signatureMovePolicy || '').includes('candidate')) {
    validationErrors.push('designIntent.designFlexibilityPolicy.signatureMovePolicy must separate candidate moves from required outcomes.');
  }
  if (!String(designFlexibilityPolicy.libraryVisualLanguagePolicy || '').includes('Libraries supply')) {
    validationErrors.push('designIntent.designFlexibilityPolicy.libraryVisualLanguagePolicy must keep libraries from dictating visual language.');
  }
  if (!String(designFlexibilityPolicy.literalAnchorPolicy || '').includes('Translate anchors')) {
    validationErrors.push('designIntent.designFlexibilityPolicy.literalAnchorPolicy must require non-literal anchor translation.');
  }
  return validationErrors;
}
