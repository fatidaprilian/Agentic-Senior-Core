/**
 * Completeness check for the design intent contract: validates the conceptual
 * anchor reference, derived token logic shape, library research status, and
 * library decision entries. Used both standalone (for incremental seeds) and
 * as the first stage of `validateDesignIntentContract`.
 */

import { hasNonEmptyString } from './helpers.mjs';

export function validateDesignContractCompleteness(designIntentContract) {
  const validationIssues = [];
  const conceptualAnchor = designIntentContract?.conceptualAnchor;
  const derivedTokenLogic = designIntentContract?.derivedTokenLogic;
  const libraryDecisions = designIntentContract?.libraryDecisions;

  const anchorReference = conceptualAnchor?.anchorReference || derivedTokenLogic?.anchorReference;
  if (!hasNonEmptyString(anchorReference)) {
    validationIssues.push('designIntent.conceptualAnchor.anchorReference must be a stable non-empty ID for deterministic validation.');
  }

  if (!derivedTokenLogic || typeof derivedTokenLogic !== 'object') {
    validationIssues.push('designIntent.derivedTokenLogic must exist.');
  } else {
    if (derivedTokenLogic.anchorReference !== anchorReference) {
      validationIssues.push('designIntent.derivedTokenLogic.anchorReference must exactly match designIntent.conceptualAnchor.anchorReference.');
    }

    for (const requiredFieldName of [
      'colorDerivationSource',
      'spacingDerivationSource',
      'typographyDerivationSource',
      'motionDerivationSource',
      'colorSpace',
      'spatialBaseUnit',
      'typeScaleMethod',
      'motionBudget',
      'validationRule',
    ]) {
      if (!hasNonEmptyString(derivedTokenLogic[requiredFieldName])) {
        validationIssues.push(`designIntent.derivedTokenLogic.${requiredFieldName} must be a non-empty string.`);
      }
    }

    if (
      hasNonEmptyString(derivedTokenLogic.validationRule)
      && !derivedTokenLogic.validationRule.includes('anchorReference')
    ) {
      validationIssues.push('designIntent.derivedTokenLogic.validationRule must require traceability to anchorReference.');
    }
  }

  if (!['verified', 'pending-verification', 'no-external-library-needed'].includes(designIntentContract?.libraryResearchStatus)) {
    validationIssues.push('designIntent.libraryResearchStatus must be verified, pending-verification, or no-external-library-needed.');
  }

  if (!Array.isArray(libraryDecisions)) {
    validationIssues.push('designIntent.libraryDecisions must be an array.');
  } else {
    for (const [libraryIndex, libraryDecision] of libraryDecisions.entries()) {
      if (!libraryDecision || typeof libraryDecision !== 'object') {
        validationIssues.push(`designIntent.libraryDecisions[${libraryIndex}] must be an object.`);
        continue;
      }

      if (!hasNonEmptyString(libraryDecision.library)) {
        validationIssues.push(`designIntent.libraryDecisions[${libraryIndex}].library must be a non-empty string.`);
      }
      if (!hasNonEmptyString(libraryDecision.purpose)) {
        validationIssues.push(`designIntent.libraryDecisions[${libraryIndex}].purpose must be a non-empty string.`);
      }

      const hasVerification = hasNonEmptyString(libraryDecision.verifiedAt)
        && hasNonEmptyString(libraryDecision.sourceUrl);
      const hasFallback = hasNonEmptyString(libraryDecision.fallbackIfUnavailable);

      if (!hasVerification && !hasFallback) {
        validationIssues.push(`designIntent.libraryDecisions[${libraryIndex}] must either record verification source or provide fallbackIfUnavailable.`);
      }
    }
  }

  return validationIssues;
}
