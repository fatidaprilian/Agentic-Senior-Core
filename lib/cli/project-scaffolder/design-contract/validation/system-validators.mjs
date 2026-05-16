/**
 * Validators for token system, color truth, viewport adaptation, motion
 * system, component morphology, accessibility policy, and context hygiene
 * sections. These cover the structured systems that drive UI implementation.
 */

import { hasNonEmptyString } from './helpers.mjs';

function validateTokenLockingPolicy(tokenSystem, validationErrors) {
  const tokenLockingPolicy = tokenSystem.tokenLockingPolicy;
  if (!tokenLockingPolicy || typeof tokenLockingPolicy !== 'object') {
    validationErrors.push('designIntent.tokenSystem.tokenLockingPolicy must exist.');
    return;
  }
  if (tokenLockingPolicy.defaultLockState !== 'semantic-roles-locked-primitives-flexible') {
    validationErrors.push('designIntent.tokenSystem.tokenLockingPolicy.defaultLockState must preserve semantic roles while keeping primitives flexible.');
  }
  if (!Array.isArray(tokenLockingPolicy.flexibleByDefault) || tokenLockingPolicy.flexibleByDefault.length < 4) {
    validationErrors.push('designIntent.tokenSystem.tokenLockingPolicy.flexibleByDefault must list flexible primitive axes.');
  }
  if (!hasNonEmptyString(tokenLockingPolicy.promotionRule)) {
    validationErrors.push('designIntent.tokenSystem.tokenLockingPolicy.promotionRule must be a non-empty string.');
  }
}

function validateTokenFallbackAndNaming(tokenSystem, validationErrors) {
  const fallbackPolicy = tokenSystem.fallbackPolicy;
  if (!fallbackPolicy || typeof fallbackPolicy !== 'object') {
    validationErrors.push('designIntent.tokenSystem.fallbackPolicy must exist.');
  } else {
    if (fallbackPolicy.forbidRawHexOutsidePrimitives !== true) {
      validationErrors.push('designIntent.tokenSystem.fallbackPolicy.forbidRawHexOutsidePrimitives must equal true.');
    }
    if (fallbackPolicy.forbidRawSpacingOutsidePrimitives !== true) {
      validationErrors.push('designIntent.tokenSystem.fallbackPolicy.forbidRawSpacingOutsidePrimitives must equal true.');
    }
    if (fallbackPolicy.requireDocumentedExceptionForLegacyBypass !== true) {
      validationErrors.push('designIntent.tokenSystem.fallbackPolicy.requireDocumentedExceptionForLegacyBypass must equal true.');
    }
  }

  const namingConstraints = tokenSystem.namingConstraints;
  if (!namingConstraints || typeof namingConstraints !== 'object') {
    validationErrors.push('designIntent.tokenSystem.namingConstraints must exist.');
    return;
  }
  if (namingConstraints.forbidCurlyBracesInNames !== true) {
    validationErrors.push('designIntent.tokenSystem.namingConstraints.forbidCurlyBracesInNames must equal true.');
  }
  if (namingConstraints.forbidDotsInNames !== true) {
    validationErrors.push('designIntent.tokenSystem.namingConstraints.forbidDotsInNames must equal true.');
  }
  if (namingConstraints.forbidSquareBracketsInNames !== true) {
    validationErrors.push('designIntent.tokenSystem.namingConstraints.forbidSquareBracketsInNames must equal true.');
  }
}

export function validateTokenSystem(designIntentContract, validationErrors) {
  if (!designIntentContract.tokenSystem || typeof designIntentContract.tokenSystem !== 'object') {
    validationErrors.push('designIntent.tokenSystem must exist.');
    return validationErrors;
  }

  const tokenSystem = designIntentContract.tokenSystem;
  const taxonomyOrder = tokenSystem.taxonomyOrder;
  if (!Array.isArray(taxonomyOrder) || taxonomyOrder.join('|') !== 'primitive|semantic|component') {
    validationErrors.push('designIntent.tokenSystem.taxonomyOrder must equal ["primitive","semantic","component"].');
  }
  if (tokenSystem.primitiveColorSpace !== 'OKLCH') {
    validationErrors.push('designIntent.tokenSystem.primitiveColorSpace must equal "OKLCH".');
  }
  if (tokenSystem.requireSemanticAliases !== true) {
    validationErrors.push('designIntent.tokenSystem.requireSemanticAliases must equal true.');
  }
  if (tokenSystem.semanticAliasesMutableWithoutComponentRewrite !== true) {
    validationErrors.push('designIntent.tokenSystem.semanticAliasesMutableWithoutComponentRewrite must equal true.');
  }
  if (tokenSystem.componentTokensConsumeSemantic !== true) {
    validationErrors.push('designIntent.tokenSystem.componentTokensConsumeSemantic must equal true.');
  }

  validateTokenLockingPolicy(tokenSystem, validationErrors);
  validateTokenFallbackAndNaming(tokenSystem, validationErrors);
  return validationErrors;
}

export function validateColorTruth(designIntentContract, validationErrors) {
  if (!designIntentContract.colorTruth || typeof designIntentContract.colorTruth !== 'object') {
    validationErrors.push('designIntent.colorTruth must exist.');
    return validationErrors;
  }
  const colorTruth = designIntentContract.colorTruth;
  if (colorTruth.format !== 'OKLCH') {
    validationErrors.push('designIntent.colorTruth.format must equal "OKLCH".');
  }
  if (colorTruth.allowHexDerivatives !== true) {
    validationErrors.push('designIntent.colorTruth.allowHexDerivatives must equal true.');
  }
  if (!String(colorTruth.intent || '').trim()) {
    validationErrors.push('designIntent.colorTruth.intent must be a non-empty string.');
  }
  const paletteRoles = colorTruth.paletteRoles;
  if (!Array.isArray(paletteRoles) || paletteRoles.length < 1) {
    validationErrors.push('designIntent.colorTruth.paletteRoles must define or request agent-defined semantic palette roles.');
  }
  if (colorTruth.rolesMustBeAgentDefined !== true) {
    validationErrors.push('designIntent.colorTruth.rolesMustBeAgentDefined must equal true.');
  }
  return validationErrors;
}

export function validateCrossViewportAdaptation(designIntentContract, validationErrors) {
  if (!designIntentContract.crossViewportAdaptation || typeof designIntentContract.crossViewportAdaptation !== 'object') {
    validationErrors.push('designIntent.crossViewportAdaptation must exist.');
    return validationErrors;
  }
  const mutationRules = designIntentContract.crossViewportAdaptation.mutationRules;
  if (!mutationRules || typeof mutationRules !== 'object') {
    validationErrors.push('designIntent.crossViewportAdaptation.mutationRules must exist.');
    return validationErrors;
  }
  for (const viewportKey of ['mobile', 'tablet', 'desktop']) {
    if (!String(mutationRules[viewportKey] || '').trim()) {
      validationErrors.push(`designIntent.crossViewportAdaptation.mutationRules.${viewportKey} must be a non-empty string.`);
    }
  }
  return validationErrors;
}

export function validateMotionSystem(designIntentContract, validationErrors) {
  if (!designIntentContract.motionSystem || typeof designIntentContract.motionSystem !== 'object') {
    validationErrors.push('designIntent.motionSystem must exist.');
    return validationErrors;
  }
  if (designIntentContract.motionSystem.allowMeaningfulMotion !== true) {
    validationErrors.push('designIntent.motionSystem.allowMeaningfulMotion must equal true.');
  }
  if (!String(designIntentContract.motionSystem.purpose || '').trim()) {
    validationErrors.push('designIntent.motionSystem.purpose must be a non-empty string.');
  }
  if (designIntentContract.motionSystem.respectReducedMotion !== true) {
    validationErrors.push('designIntent.motionSystem.respectReducedMotion must equal true.');
  }
  return validationErrors;
}

export function validateComponentMorphology(designIntentContract, validationErrors) {
  if (!designIntentContract.componentMorphology || typeof designIntentContract.componentMorphology !== 'object') {
    validationErrors.push('designIntent.componentMorphology must exist.');
    return validationErrors;
  }
  const componentMorphology = designIntentContract.componentMorphology;
  if (componentMorphology.requireStateBehaviorMatrix !== true) {
    validationErrors.push('designIntent.componentMorphology.requireStateBehaviorMatrix must equal true.');
  }
  if (!Array.isArray(componentMorphology.stateKeys) || componentMorphology.stateKeys.length < 4) {
    validationErrors.push('designIntent.componentMorphology.stateKeys must contain multiple interaction states.');
  }
  const viewportBehavior = componentMorphology.viewportBehavior;
  if (!viewportBehavior || typeof viewportBehavior !== 'object') {
    validationErrors.push('designIntent.componentMorphology.viewportBehavior must exist.');
    return validationErrors;
  }
  for (const viewportKey of ['mobile', 'tablet', 'desktop']) {
    if (!String(viewportBehavior[viewportKey] || '').trim()) {
      validationErrors.push(`designIntent.componentMorphology.viewportBehavior.${viewportKey} must be a non-empty string.`);
    }
  }
  return validationErrors;
}

export function validateAccessibilityPolicy(designIntentContract, validationErrors) {
  if (!designIntentContract.accessibilityPolicy || typeof designIntentContract.accessibilityPolicy !== 'object') {
    validationErrors.push('designIntent.accessibilityPolicy must exist.');
    return validationErrors;
  }
  const accessibilityPolicy = designIntentContract.accessibilityPolicy;
  if (accessibilityPolicy.hardComplianceFloor !== 'WCAG-2.2-AA') {
    validationErrors.push('designIntent.accessibilityPolicy.hardComplianceFloor must equal "WCAG-2.2-AA".');
  }
  if (accessibilityPolicy.advisoryContrastModel !== 'APCA') {
    validationErrors.push('designIntent.accessibilityPolicy.advisoryContrastModel must equal "APCA".');
  }
  if (accessibilityPolicy.failOnHardViolations !== true) {
    validationErrors.push('designIntent.accessibilityPolicy.failOnHardViolations must equal true.');
  }
  if (accessibilityPolicy.advisoryFindingsDoNotBlockByDefault !== true) {
    validationErrors.push('designIntent.accessibilityPolicy.advisoryFindingsDoNotBlockByDefault must equal true.');
  }
  const hardRequirements = accessibilityPolicy.hardRequirements;
  if (!hardRequirements || typeof hardRequirements !== 'object') {
    validationErrors.push('designIntent.accessibilityPolicy.hardRequirements must exist.');
  } else {
    for (const requirementKey of [
      'textContrastMinimum',
      'nonTextContrast',
      'useOfColorOnlyProhibited',
      'focusVisible',
      'focusAppearance',
      'targetSizeMinimum',
      'keyboardAccess',
      'reflowRequired',
      'accessibleAuthenticationMinimum',
      'statusMessagesAndDynamicStateAccess',
    ]) {
      if (hardRequirements[requirementKey] !== true) {
        validationErrors.push(`designIntent.accessibilityPolicy.hardRequirements.${requirementKey} must equal true.`);
      }
    }
  }
  const advisoryChecks = accessibilityPolicy.advisoryChecks;
  if (!advisoryChecks || typeof advisoryChecks !== 'object') {
    validationErrors.push('designIntent.accessibilityPolicy.advisoryChecks must exist.');
    return validationErrors;
  }
  for (const advisoryKey of [
    'perceptualContrastReview',
    'darkModeContrastTuning',
    'typographyReadabilityTuning',
  ]) {
    if (advisoryChecks[advisoryKey] !== true) {
      validationErrors.push(`designIntent.accessibilityPolicy.advisoryChecks.${advisoryKey} must equal true.`);
    }
  }
  return validationErrors;
}

export function validateContextHygiene(designIntentContract, validationErrors) {
  if (!designIntentContract.contextHygiene || typeof designIntentContract.contextHygiene !== 'object') {
    validationErrors.push('designIntent.contextHygiene must exist.');
    return validationErrors;
  }
  const contextHygiene = designIntentContract.contextHygiene;
  if (contextHygiene.continuityMode !== 'opt-in-only') {
    validationErrors.push('designIntent.contextHygiene.continuityMode must equal "opt-in-only".');
  }
  if (contextHygiene.repoEvidenceOverridesMemory !== true) {
    validationErrors.push('designIntent.contextHygiene.repoEvidenceOverridesMemory must equal true.');
  }
  if (contextHygiene.requireExplicitContinuityApproval !== true) {
    validationErrors.push('designIntent.contextHygiene.requireExplicitContinuityApproval must equal true.');
  }
  if (contextHygiene.forbidCarryoverWhenUnapproved !== true) {
    validationErrors.push('designIntent.contextHygiene.forbidCarryoverWhenUnapproved must equal true.');
  }
  if (!Array.isArray(contextHygiene.allowedSources) || contextHygiene.allowedSources.length < 4) {
    validationErrors.push('designIntent.contextHygiene.allowedSources must list the approved design evidence sources.');
  }
  if (!Array.isArray(contextHygiene.taintedSources) || contextHygiene.taintedSources.length < 3) {
    validationErrors.push('designIntent.contextHygiene.taintedSources must list tainted carryover sources.');
  }
  if (!String(contextHygiene.approvedExternalConstraintUsage || '').trim()) {
    validationErrors.push('designIntent.contextHygiene.approvedExternalConstraintUsage must be a non-empty string.');
  }
  return validationErrors;
}
