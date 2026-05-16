/**
 * Validators for the design execution policy, the structured execution
 * handoff, the review rubric, the required design sections list, and the
 * forbidden patterns list. These collectively gate the structured handoff
 * payload that downstream UI judges and review tooling consume.
 */

import { hasNonEmptyString } from './helpers.mjs';
import { DESIGN_REQUIRED_SECTIONS } from '../../constants.mjs';

export function validateDesignExecutionPolicy(designIntentContract, validationErrors) {
  if (!designIntentContract.designExecutionPolicy || typeof designIntentContract.designExecutionPolicy !== 'object') {
    validationErrors.push('designIntent.designExecutionPolicy must exist.');
    return validationErrors;
  }
  const designExecutionPolicy = designIntentContract.designExecutionPolicy;
  if (designExecutionPolicy.representationStrategy !== 'surface-plan-v1') {
    validationErrors.push('designIntent.designExecutionPolicy.representationStrategy must equal "surface-plan-v1".');
  }
  for (const requiredFlagName of [
    'requireSurfacePlan',
    'requireComponentGraph',
    'requireViewportMutationPlan',
    'requireInteractionStateMatrix',
    'requireContentPriorityMap',
    'requireTaskFlowNarrative',
    'requireSignatureMoveRationale',
    'requireCreativeCommitmentGate',
    'requireStructuredHandoff',
    'requireRepoEvidenceAlignment',
    'forbidScreenshotDependency',
    'separateRequiredOutcomesFromCandidateMoves',
    'forbidCandidateMovesAsLockedRequirements',
    'forbidLibraryThemeAsVisualAuthority',
    'forbidLiteralAnchorChromeWithoutProductFunction',
    'requirePerSurfaceMutationOps',
    'forbidUniformSiblingSurfaceTreatment',
    'zeroBasedRedesignResetsPriorVisualsWhenRequested',
  ]) {
    if (designExecutionPolicy[requiredFlagName] !== true) {
      validationErrors.push(`designIntent.designExecutionPolicy.${requiredFlagName} must equal true.`);
    }
  }
  if (designExecutionPolicy.handoffFormatVersion !== 'ui-handoff-v1') {
    validationErrors.push('designIntent.designExecutionPolicy.handoffFormatVersion must equal "ui-handoff-v1".');
  }
  if (
    !Array.isArray(designExecutionPolicy.semanticReviewFocus)
    || designExecutionPolicy.semanticReviewFocus.length < 4
  ) {
    validationErrors.push('designIntent.designExecutionPolicy.semanticReviewFocus must list the required review dimensions.');
  }
  return validationErrors;
}

function validateHandoffComponentGraph(designExecutionHandoff, validationErrors) {
  const componentGraph = designExecutionHandoff.componentGraph;
  if (!componentGraph || typeof componentGraph !== 'object') {
    validationErrors.push('designIntent.designExecutionHandoff.componentGraph must exist.');
    return;
  }
  if (!Array.isArray(componentGraph.nodes) || componentGraph.nodes.length < 2) {
    validationErrors.push('designIntent.designExecutionHandoff.componentGraph.nodes must list the primary execution nodes.');
  }
  if (!Array.isArray(componentGraph.edges) || componentGraph.edges.length < 1) {
    validationErrors.push('designIntent.designExecutionHandoff.componentGraph.edges must define relationships between UI nodes.');
  }
}

function validateHandoffContentPriorityMap(designExecutionHandoff, validationErrors) {
  const contentPriorityMap = designExecutionHandoff.contentPriorityMap;
  if (!contentPriorityMap || typeof contentPriorityMap !== 'object') {
    validationErrors.push('designIntent.designExecutionHandoff.contentPriorityMap must exist.');
    return;
  }
  for (const priorityBucket of ['primary', 'secondary', 'deferred']) {
    if (!Array.isArray(contentPriorityMap[priorityBucket]) || contentPriorityMap[priorityBucket].length < 1) {
      validationErrors.push(`designIntent.designExecutionHandoff.contentPriorityMap.${priorityBucket} must contain at least one item.`);
    }
  }
}

function validateHandoffViewportMutationPlan(designExecutionHandoff, validationErrors) {
  const viewportMutationPlan = designExecutionHandoff.viewportMutationPlan;
  if (!viewportMutationPlan || typeof viewportMutationPlan !== 'object') {
    validationErrors.push('designIntent.designExecutionHandoff.viewportMutationPlan must exist.');
    return;
  }
  for (const viewportKey of ['mobile', 'tablet', 'desktop']) {
    const viewportPlan = viewportMutationPlan[viewportKey];
    if (!viewportPlan || typeof viewportPlan !== 'object') {
      validationErrors.push(`designIntent.designExecutionHandoff.viewportMutationPlan.${viewportKey} must be an object.`);
      continue;
    }
    if (!String(viewportPlan.primaryOperation || '').trim()) {
      validationErrors.push(`designIntent.designExecutionHandoff.viewportMutationPlan.${viewportKey}.primaryOperation must be a non-empty string.`);
    }
    if (!Array.isArray(viewportPlan.requiredSurfaceActions) || viewportPlan.requiredSurfaceActions.length < 2) {
      validationErrors.push(`designIntent.designExecutionHandoff.viewportMutationPlan.${viewportKey}.requiredSurfaceActions must contain at least two actions.`);
    }
    if (!Array.isArray(viewportPlan.forbiddenPatterns) || viewportPlan.forbiddenPatterns.length < 1) {
      validationErrors.push(`designIntent.designExecutionHandoff.viewportMutationPlan.${viewportKey}.forbiddenPatterns must contain at least one anti-pattern.`);
    }
    if (!String(viewportPlan.rationale || '').trim()) {
      validationErrors.push(`designIntent.designExecutionHandoff.viewportMutationPlan.${viewportKey}.rationale must be a non-empty string.`);
    }
  }
}

function validateHandoffExpressionFlexibility(designExecutionHandoff, validationErrors) {
  const expressionFlexibility = designExecutionHandoff.expressionFlexibility;
  if (!expressionFlexibility || typeof expressionFlexibility !== 'object') {
    validationErrors.push('designIntent.designExecutionHandoff.expressionFlexibility must exist.');
    return;
  }
  if (!Array.isArray(expressionFlexibility.lockedOutcomes) || expressionFlexibility.lockedOutcomes.length < 3) {
    validationErrors.push('designIntent.designExecutionHandoff.expressionFlexibility.lockedOutcomes must list locked outcomes.');
  }
  if (!Array.isArray(expressionFlexibility.candidateSignatureMoves) || expressionFlexibility.candidateSignatureMoves.length < 1) {
    validationErrors.push('designIntent.designExecutionHandoff.expressionFlexibility.candidateSignatureMoves must include at least one candidate move placeholder.');
  }
  if (!Array.isArray(expressionFlexibility.flexibleAxes) || expressionFlexibility.flexibleAxes.length < 4) {
    validationErrors.push('designIntent.designExecutionHandoff.expressionFlexibility.flexibleAxes must list flexible implementation axes.');
  }
  if (!String(expressionFlexibility.lockingRule || '').includes('candidate')) {
    validationErrors.push('designIntent.designExecutionHandoff.expressionFlexibility.lockingRule must explain when candidate moves become required.');
  }
}

function validateHandoffCreativeCommitment(designExecutionHandoff, validationErrors) {
  const creativeCommitment = designExecutionHandoff.creativeCommitment;
  if (!creativeCommitment || typeof creativeCommitment !== 'object') {
    validationErrors.push('designIntent.designExecutionHandoff.creativeCommitment must exist.');
    return;
  }
  if (creativeCommitment.status !== 'agent-must-complete-before-ui-implementation') {
    validationErrors.push('designIntent.designExecutionHandoff.creativeCommitment.status must equal "agent-must-complete-before-ui-implementation".');
  }
  if (
    !Array.isArray(creativeCommitment.requiredFields)
    || !creativeCommitment.requiredFields.includes('specificReferencePoint')
    || !creativeCommitment.requiredFields.includes('signatureMotion')
    || !creativeCommitment.requiredFields.includes('typographicDecision')
  ) {
    validationErrors.push('designIntent.designExecutionHandoff.creativeCommitment.requiredFields must include specificReferencePoint, signatureMotion, and typographicDecision.');
  }
  if (!hasNonEmptyString(creativeCommitment.failureMode)) {
    validationErrors.push('designIntent.designExecutionHandoff.creativeCommitment.failureMode must be a non-empty string.');
  }
}

function validateHandoffImplementationGuardrails(designExecutionHandoff, validationErrors) {
  const implementationGuardrails = designExecutionHandoff.implementationGuardrails;
  if (!implementationGuardrails || typeof implementationGuardrails !== 'object') {
    validationErrors.push('designIntent.designExecutionHandoff.implementationGuardrails must exist.');
    return;
  }
  for (const requiredFlagName of [
    'requireBuildFromHandoff',
    'requireGapNotesBeforeFallback',
    'forbidGenericLayoutFallbackWithoutReason',
    'requireLockedVsFlexibleDecisionReview',
    'forbidCandidateMoveHardcoding',
    'forbidTestingDemoCopyInUi',
    'forbidTerminalOnlyUserFlows',
  ]) {
    if (implementationGuardrails[requiredFlagName] !== true) {
      validationErrors.push(`designIntent.designExecutionHandoff.implementationGuardrails.${requiredFlagName} must equal true.`);
    }
  }
}

export function validateDesignExecutionHandoff(designIntentContract, validationErrors) {
  if (!designIntentContract.designExecutionHandoff || typeof designIntentContract.designExecutionHandoff !== 'object') {
    validationErrors.push('designIntent.designExecutionHandoff must exist.');
    return validationErrors;
  }

  const designExecutionHandoff = designIntentContract.designExecutionHandoff;
  if (designExecutionHandoff.version !== 'ui-handoff-v1') {
    validationErrors.push('designIntent.designExecutionHandoff.version must equal "ui-handoff-v1".');
  }
  if (designExecutionHandoff.seedMode !== 'structure-first-scaffold') {
    validationErrors.push('designIntent.designExecutionHandoff.seedMode must equal "structure-first-scaffold".');
  }
  if (designExecutionHandoff.requiresTaskSpecificRefinement !== true) {
    validationErrors.push('designIntent.designExecutionHandoff.requiresTaskSpecificRefinement must equal true.');
  }
  if (!String(designExecutionHandoff.primaryExperienceGoal || '').trim()) {
    validationErrors.push('designIntent.designExecutionHandoff.primaryExperienceGoal must be a non-empty string.');
  }
  if (!Array.isArray(designExecutionHandoff.surfacePlan) || designExecutionHandoff.surfacePlan.length < 1) {
    validationErrors.push('designIntent.designExecutionHandoff.surfacePlan must define at least one planned surface.');
  }

  validateHandoffComponentGraph(designExecutionHandoff, validationErrors);
  validateHandoffContentPriorityMap(designExecutionHandoff, validationErrors);
  validateHandoffViewportMutationPlan(designExecutionHandoff, validationErrors);

  if (!Array.isArray(designExecutionHandoff.interactionStateMatrix) || designExecutionHandoff.interactionStateMatrix.length < 1) {
    validationErrors.push('designIntent.designExecutionHandoff.interactionStateMatrix must list key component state expectations.');
  }

  validateHandoffExpressionFlexibility(designExecutionHandoff, validationErrors);

  if (!Array.isArray(designExecutionHandoff.taskFlowNarrative) || designExecutionHandoff.taskFlowNarrative.length < 2) {
    validationErrors.push('designIntent.designExecutionHandoff.taskFlowNarrative must describe the key UI task flow in sequence.');
  }
  if (!String(designExecutionHandoff.signatureMoveRationale || '').trim()) {
    validationErrors.push('designIntent.designExecutionHandoff.signatureMoveRationale must explain the chosen authored move.');
  }

  validateHandoffCreativeCommitment(designExecutionHandoff, validationErrors);
  validateHandoffImplementationGuardrails(designExecutionHandoff, validationErrors);
  return validationErrors;
}

export function validateReviewRubric(designIntentContract, validationErrors) {
  if (!designIntentContract.reviewRubric || typeof designIntentContract.reviewRubric !== 'object') {
    validationErrors.push('designIntent.reviewRubric must exist.');
    return validationErrors;
  }
  const reviewRubric = designIntentContract.reviewRubric;
  if (reviewRubric.version !== 'ui-rubric-v1') {
    validationErrors.push('designIntent.reviewRubric.version must equal "ui-rubric-v1".');
  }
  if (reviewRubric.genericityAutoFail !== true) {
    validationErrors.push('designIntent.reviewRubric.genericityAutoFail must equal true.');
  }
  if (!Array.isArray(reviewRubric.dimensions) || reviewRubric.dimensions.length < 5) {
    validationErrors.push('designIntent.reviewRubric.dimensions must define the required rubric dimensions.');
  } else {
    for (const requiredRubricKey of [
      'distinctiveness',
      'contractFidelity',
      'visualConsistency',
      'heuristicUxQuality',
      'motionDiscipline',
    ]) {
      if (!reviewRubric.dimensions.some((dimension) => dimension?.key === requiredRubricKey)) {
        validationErrors.push(`designIntent.reviewRubric.dimensions is missing "${requiredRubricKey}".`);
      }
    }
  }
  if (!Array.isArray(reviewRubric.genericitySignals) || reviewRubric.genericitySignals.length < 3) {
    validationErrors.push('designIntent.reviewRubric.genericitySignals must list common genericity drift signals.');
  } else {
    for (const requiredSignal of [
      'ai-safe-ui-template-look',
      'ai-color-default-palette-without-product-role-behavior',
      'interchangeable-product-renaming-test-fails',
      'decorative-grid-or-glow-wallpaper-without-product-function',
      'decorative-line-or-calibration-wallpaper-without-product-function',
      'measurement-or-calibration-marks-used-as-page-background',
      'testing-demo-or-placeholder-copy-shipped-to-ui',
      'terminal-only-user-flow-without-product-reason',
      'motion-or-3d-omitted-from-fear-without-fit-analysis',
    ]) {
      if (!reviewRubric.genericitySignals.includes(requiredSignal)) {
        validationErrors.push(`designIntent.reviewRubric.genericitySignals must include "${requiredSignal}".`);
      }
    }
  }
  if (!Array.isArray(reviewRubric.validBoldSignals) || reviewRubric.validBoldSignals.length < 3) {
    validationErrors.push('designIntent.reviewRubric.validBoldSignals must list legitimate authored signals.');
  } else {
    for (const requiredSignal of [
      'three-at-a-glance-product-specific-signals',
      'visually-exploratory-accessible-palette-derived-from-product',
      'audacious-accessible-palette-with-product-role-behavior',
      'motion-or-spatial-experience-derived-from-anchor',
    ]) {
      if (!reviewRubric.validBoldSignals.includes(requiredSignal)) {
        validationErrors.push(`designIntent.reviewRubric.validBoldSignals must include "${requiredSignal}".`);
      }
    }
  }
  if (!reviewRubric.reportingRules || typeof reviewRubric.reportingRules !== 'object') {
    validationErrors.push('designIntent.reviewRubric.reportingRules must exist.');
    return validationErrors;
  }
  for (const requiredFlagName of [
    'mustExplainGenericity',
    'mustSeparateTasteFromFailure',
    'contractFidelityOverridesPersonalTaste',
  ]) {
    if (reviewRubric.reportingRules[requiredFlagName] !== true) {
      validationErrors.push(`designIntent.reviewRubric.reportingRules.${requiredFlagName} must equal true.`);
    }
  }
  return validationErrors;
}

export function validateRequiredSectionsAndForbiddenPatterns(designIntentContract, validationErrors) {
  if (
    !Array.isArray(designIntentContract.requiredDesignSections)
    || designIntentContract.requiredDesignSections.length !== DESIGN_REQUIRED_SECTIONS.length
  ) {
    validationErrors.push('designIntent.requiredDesignSections must match the required design contract sections.');
  } else {
    for (const requiredSectionName of DESIGN_REQUIRED_SECTIONS) {
      if (!designIntentContract.requiredDesignSections.includes(requiredSectionName)) {
        validationErrors.push(`designIntent.requiredDesignSections is missing "${requiredSectionName}".`);
      }
    }
  }

  if (!Array.isArray(designIntentContract.forbiddenPatterns) || designIntentContract.forbiddenPatterns.length < 4) {
    validationErrors.push('designIntent.forbiddenPatterns must list concrete anti-generic patterns.');
    return validationErrors;
  }
  for (const requiredPattern of [
    'ai-safe-ui-template-look',
    'ai-color-default-palette-without-product-role-behavior',
    'interchangeable-product-renaming-test-fails',
    'decorative-grid-or-glow-wallpaper-without-product-function',
    'decorative-line-or-calibration-wallpaper-without-product-function',
    'measurement-or-calibration-marks-used-as-page-background',
    'testing-demo-or-placeholder-copy-shipped-to-ui',
    'terminal-only-user-flow-without-product-reason',
    'motion-or-3d-omitted-from-fear-without-fit-analysis',
  ]) {
    if (!designIntentContract.forbiddenPatterns.includes(requiredPattern)) {
      validationErrors.push(`designIntent.forbiddenPatterns must include "${requiredPattern}".`);
    }
  }
  return validationErrors;
}
