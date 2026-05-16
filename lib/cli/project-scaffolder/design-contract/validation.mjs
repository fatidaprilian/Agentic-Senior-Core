/**
 * Design intent contract validators. Composed from focused sub-modules under
 * `validation/` so each validation domain (anchor, audits, execution handoff,
 * structural systems) can be reviewed in isolation.
 *
 * Public exports preserve the original surface:
 *   validateDesignContractCompleteness — incremental shape check used by seeds
 *   validateDesignIntentContract       — full sequential validation pipeline
 */

import { validateDesignContractCompleteness } from './validation/completeness.mjs';
import {
  validateDesignFlexibilityPolicy,
  validateExternalResearchIntake,
  validateModeAndProjectShape,
} from './validation/structural-validators.mjs';
import {
  validateConceptualAnchor,
  validateMathSystems,
} from './validation/anchor-validators.mjs';
import {
  validateAiSafeUiAudit,
  validateProductionContentPolicy,
} from './validation/audit-validators.mjs';
import {
  validateAccessibilityPolicy,
  validateColorTruth,
  validateComponentMorphology,
  validateContextHygiene,
  validateCrossViewportAdaptation,
  validateMotionSystem,
  validateTokenSystem,
} from './validation/system-validators.mjs';
import {
  validateDesignExecutionHandoff,
  validateDesignExecutionPolicy,
  validateRequiredSectionsAndForbiddenPatterns,
  validateReviewRubric,
} from './validation/execution-validators.mjs';

export { validateDesignContractCompleteness };

export function validateDesignIntentContract(designIntentContract) {
  const validationErrors = [];

  if (!designIntentContract || typeof designIntentContract !== 'object') {
    return ['Design intent contract must be an object.'];
  }

  validationErrors.push(...validateDesignContractCompleteness(designIntentContract));

  validateModeAndProjectShape(designIntentContract, validationErrors);
  validateExternalResearchIntake(designIntentContract, validationErrors);
  validateDesignFlexibilityPolicy(designIntentContract, validationErrors);
  validateConceptualAnchor(designIntentContract, validationErrors);
  validateMathSystems(designIntentContract, validationErrors);
  validateAiSafeUiAudit(designIntentContract, validationErrors);
  validateProductionContentPolicy(designIntentContract, validationErrors);
  validateTokenSystem(designIntentContract, validationErrors);
  validateColorTruth(designIntentContract, validationErrors);
  validateCrossViewportAdaptation(designIntentContract, validationErrors);
  validateMotionSystem(designIntentContract, validationErrors);
  validateComponentMorphology(designIntentContract, validationErrors);
  validateAccessibilityPolicy(designIntentContract, validationErrors);
  validateContextHygiene(designIntentContract, validationErrors);
  validateDesignExecutionPolicy(designIntentContract, validationErrors);
  validateDesignExecutionHandoff(designIntentContract, validationErrors);
  validateReviewRubric(designIntentContract, validationErrors);
  validateRequiredSectionsAndForbiddenPatterns(designIntentContract, validationErrors);

  return validationErrors;
}
