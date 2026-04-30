import { DESIGN_REQUIRED_SECTIONS } from '../constants.mjs';

function hasNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

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

export function validateDesignIntentContract(designIntentContract) {
  const validationErrors = [];

  if (!designIntentContract || typeof designIntentContract !== 'object') {
    return ['Design intent contract must be an object.'];
  }

  validationErrors.push(...validateDesignContractCompleteness(designIntentContract));

  if (designIntentContract.mode !== 'dynamic') {
    validationErrors.push('designIntent.mode must equal "dynamic".');
  }

  if (!designIntentContract.project || typeof designIntentContract.project !== 'object') {
    validationErrors.push('designIntent.project must exist.');
  }

  if (!designIntentContract.designPhilosophy || typeof designIntentContract.designPhilosophy !== 'string') {
    validationErrors.push('designIntent.designPhilosophy must be a non-empty string.');
  }

  if (!designIntentContract.externalResearchIntake || typeof designIntentContract.externalResearchIntake !== 'object') {
    validationErrors.push('designIntent.externalResearchIntake must exist.');
  } else {
    if (designIntentContract.externalResearchIntake.userSuppliedResearchPolicy !== 'read-as-candidate-evidence-not-final-prescription') {
      validationErrors.push('designIntent.externalResearchIntake.userSuppliedResearchPolicy must preserve user research as candidate evidence.');
    }
    if (designIntentContract.externalResearchIntake.requireOfficialDocsVerificationForTechnologyClaims !== true) {
      validationErrors.push('designIntent.externalResearchIntake.requireOfficialDocsVerificationForTechnologyClaims must equal true.');
    }
    if (
      !Array.isArray(designIntentContract.externalResearchIntake.candidateDomains)
      || !designIntentContract.externalResearchIntake.candidateDomains.includes('motion-and-scroll')
    ) {
      validationErrors.push('designIntent.externalResearchIntake.candidateDomains must include motion-and-scroll.');
    }
  }

  if (!designIntentContract.conceptualAnchor || typeof designIntentContract.conceptualAnchor !== 'object') {
    validationErrors.push('designIntent.conceptualAnchor must exist.');
  } else {
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
    const userResearchAbsencePolicy = conceptualAnchor.userResearchAbsencePolicy;
    if (!userResearchAbsencePolicy || typeof userResearchAbsencePolicy !== 'object') {
      validationErrors.push('designIntent.conceptualAnchor.userResearchAbsencePolicy must exist.');
    } else {
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
    const candidateSelectionPolicy = conceptualAnchor.candidateSelectionPolicy;
    if (!candidateSelectionPolicy || typeof candidateSelectionPolicy !== 'object') {
      validationErrors.push('designIntent.conceptualAnchor.candidateSelectionPolicy must exist.');
    } else {
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
    const creativeCommitmentPolicy = conceptualAnchor.creativeCommitmentPolicy;
    if (!creativeCommitmentPolicy || typeof creativeCommitmentPolicy !== 'object') {
      validationErrors.push('designIntent.conceptualAnchor.creativeCommitmentPolicy must exist.');
    } else {
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
      || !conceptualAnchor.sourceDomains.includes('cinematic-spatial-interface')
      || !conceptualAnchor.sourceDomains.includes('premium-interactive-web-experiences')
    ) {
      validationErrors.push('designIntent.conceptualAnchor.sourceDomains must list broad non-template anchor domains.');
    }
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
    } else {
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
  }

  if (!designIntentContract.mathSystems || typeof designIntentContract.mathSystems !== 'object') {
    validationErrors.push('designIntent.mathSystems must exist.');
  } else {
    if (!String(designIntentContract.mathSystems.typographyScaleRatio || '').trim()) {
      validationErrors.push('designIntent.mathSystems.typographyScaleRatio must describe the chosen or pending type scale decision.');
    }
    if (!String(designIntentContract.mathSystems.baseGridUnit || '').trim()) {
      validationErrors.push('designIntent.mathSystems.baseGridUnit must describe the chosen or pending spacing grid decision.');
    }
  }

  if (!designIntentContract.aiSafeUiAudit || typeof designIntentContract.aiSafeUiAudit !== 'object') {
    validationErrors.push('designIntent.aiSafeUiAudit must exist.');
  } else {
    const aiSafeUiAudit = designIntentContract.aiSafeUiAudit;
    if (aiSafeUiAudit.status !== 'agent-must-complete-before-ui-implementation') {
      validationErrors.push('designIntent.aiSafeUiAudit.status must require completion before UI implementation.');
    }
    if (!String(aiSafeUiAudit.failureDefinition || '').includes('AI-safe')) {
      validationErrors.push('designIntent.aiSafeUiAudit.failureDefinition must define AI-safe UI drift.');
    }
    if (!String(aiSafeUiAudit.interchangeabilityTest || '').includes('renamed')) {
      validationErrors.push('designIntent.aiSafeUiAudit.interchangeabilityTest must include the rename/interchangeability test.');
    }
    if (!Array.isArray(aiSafeUiAudit.requiredProductSpecificSignals) || aiSafeUiAudit.requiredProductSpecificSignals.length < 3) {
      validationErrors.push('designIntent.aiSafeUiAudit.requiredProductSpecificSignals must list at least three product-specific signals.');
    }
    if (!String(aiSafeUiAudit.paletteExplorationRule || '').trim()) {
      validationErrors.push('designIntent.aiSafeUiAudit.paletteExplorationRule must be a non-empty string.');
    }
    if (!String(aiSafeUiAudit.backgroundPatternRule || '').trim()) {
      validationErrors.push('designIntent.aiSafeUiAudit.backgroundPatternRule must be a non-empty string.');
    }
    if (!aiSafeUiAudit.aiColorAudit || typeof aiSafeUiAudit.aiColorAudit !== 'object') {
      validationErrors.push('designIntent.aiSafeUiAudit.aiColorAudit must exist.');
    } else {
      if (aiSafeUiAudit.aiColorAudit.status !== 'agent-must-complete-before-ui-implementation') {
        validationErrors.push('designIntent.aiSafeUiAudit.aiColorAudit.status must require completion before UI implementation.');
      }
      if (!String(aiSafeUiAudit.aiColorAudit.failureDefinition || '').includes('AI color')) {
        validationErrors.push('designIntent.aiSafeUiAudit.aiColorAudit.failureDefinition must define AI color drift.');
      }
      if (!Array.isArray(aiSafeUiAudit.aiColorAudit.autopilotRisks) || aiSafeUiAudit.aiColorAudit.autopilotRisks.length < 4) {
        validationErrors.push('designIntent.aiSafeUiAudit.aiColorAudit.autopilotRisks must list common autopilot palettes.');
      }
      if (!Array.isArray(aiSafeUiAudit.aiColorAudit.requiredEvidence) || aiSafeUiAudit.aiColorAudit.requiredEvidence.length < 3) {
        validationErrors.push('designIntent.aiSafeUiAudit.aiColorAudit.requiredEvidence must list color evidence requirements.');
      }
      if (!String(aiSafeUiAudit.aiColorAudit.reviewQuestion || '').trim()) {
        validationErrors.push('designIntent.aiSafeUiAudit.aiColorAudit.reviewQuestion must be a non-empty string.');
      }
    }
    if (!aiSafeUiAudit.motionSpatialCourageAudit || typeof aiSafeUiAudit.motionSpatialCourageAudit !== 'object') {
      validationErrors.push('designIntent.aiSafeUiAudit.motionSpatialCourageAudit must exist.');
    } else {
      if (aiSafeUiAudit.motionSpatialCourageAudit.status !== 'agent-must-complete-before-ui-implementation') {
        validationErrors.push('designIntent.aiSafeUiAudit.motionSpatialCourageAudit.status must require completion before UI implementation.');
      }
      if (!String(aiSafeUiAudit.motionSpatialCourageAudit.defaultStance || '').includes('first-class options')) {
        validationErrors.push('designIntent.aiSafeUiAudit.motionSpatialCourageAudit.defaultStance must treat motion and spatial UI as first-class options.');
      }
      if (!Array.isArray(aiSafeUiAudit.motionSpatialCourageAudit.requiredDecisionFields) || aiSafeUiAudit.motionSpatialCourageAudit.requiredDecisionFields.length < 3) {
        validationErrors.push('designIntent.aiSafeUiAudit.motionSpatialCourageAudit.requiredDecisionFields must list required motion/spatial decisions.');
      }
      if (!String(aiSafeUiAudit.motionSpatialCourageAudit.rejectionRule || '').includes('product reason')) {
        validationErrors.push('designIntent.aiSafeUiAudit.motionSpatialCourageAudit.rejectionRule must require a product reason before omitting spatial UI.');
      }
      if (!String(aiSafeUiAudit.motionSpatialCourageAudit.reviewQuestion || '').trim()) {
        validationErrors.push('designIntent.aiSafeUiAudit.motionSpatialCourageAudit.reviewQuestion must be a non-empty string.');
      }
    }
    if (!String(aiSafeUiAudit.reviewQuestion || '').trim()) {
      validationErrors.push('designIntent.aiSafeUiAudit.reviewQuestion must be a non-empty string.');
    }
    if (aiSafeUiAudit.blockingByDefault !== true) {
      validationErrors.push('designIntent.aiSafeUiAudit.blockingByDefault must equal true.');
    }
  }

  if (!designIntentContract.tokenSystem || typeof designIntentContract.tokenSystem !== 'object') {
    validationErrors.push('designIntent.tokenSystem must exist.');
  } else {
    const taxonomyOrder = designIntentContract.tokenSystem.taxonomyOrder;
    if (!Array.isArray(taxonomyOrder) || taxonomyOrder.join('|') !== 'primitive|semantic|component') {
      validationErrors.push('designIntent.tokenSystem.taxonomyOrder must equal ["primitive","semantic","component"].');
    }
    if (designIntentContract.tokenSystem.primitiveColorSpace !== 'OKLCH') {
      validationErrors.push('designIntent.tokenSystem.primitiveColorSpace must equal "OKLCH".');
    }
    if (designIntentContract.tokenSystem.requireSemanticAliases !== true) {
      validationErrors.push('designIntent.tokenSystem.requireSemanticAliases must equal true.');
    }
    if (designIntentContract.tokenSystem.semanticAliasesMutableWithoutComponentRewrite !== true) {
      validationErrors.push('designIntent.tokenSystem.semanticAliasesMutableWithoutComponentRewrite must equal true.');
    }
    if (designIntentContract.tokenSystem.componentTokensConsumeSemantic !== true) {
      validationErrors.push('designIntent.tokenSystem.componentTokensConsumeSemantic must equal true.');
    }
    const fallbackPolicy = designIntentContract.tokenSystem.fallbackPolicy;
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
    const namingConstraints = designIntentContract.tokenSystem.namingConstraints;
    if (!namingConstraints || typeof namingConstraints !== 'object') {
      validationErrors.push('designIntent.tokenSystem.namingConstraints must exist.');
    } else {
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
  }

  if (!designIntentContract.colorTruth || typeof designIntentContract.colorTruth !== 'object') {
    validationErrors.push('designIntent.colorTruth must exist.');
  } else {
    if (designIntentContract.colorTruth.format !== 'OKLCH') {
      validationErrors.push('designIntent.colorTruth.format must equal "OKLCH".');
    }
    if (designIntentContract.colorTruth.allowHexDerivatives !== true) {
      validationErrors.push('designIntent.colorTruth.allowHexDerivatives must equal true.');
    }
    if (!String(designIntentContract.colorTruth.intent || '').trim()) {
      validationErrors.push('designIntent.colorTruth.intent must be a non-empty string.');
    }
    const paletteRoles = designIntentContract.colorTruth.paletteRoles;
    if (!Array.isArray(paletteRoles) || paletteRoles.length < 1) {
      validationErrors.push('designIntent.colorTruth.paletteRoles must define or request agent-defined semantic palette roles.');
    }
    if (designIntentContract.colorTruth.rolesMustBeAgentDefined !== true) {
      validationErrors.push('designIntent.colorTruth.rolesMustBeAgentDefined must equal true.');
    }
  }

  if (!designIntentContract.crossViewportAdaptation || typeof designIntentContract.crossViewportAdaptation !== 'object') {
    validationErrors.push('designIntent.crossViewportAdaptation must exist.');
  } else {
    const mutationRules = designIntentContract.crossViewportAdaptation.mutationRules;
    if (!mutationRules || typeof mutationRules !== 'object') {
      validationErrors.push('designIntent.crossViewportAdaptation.mutationRules must exist.');
    } else {
      for (const viewportKey of ['mobile', 'tablet', 'desktop']) {
        if (!String(mutationRules[viewportKey] || '').trim()) {
          validationErrors.push(`designIntent.crossViewportAdaptation.mutationRules.${viewportKey} must be a non-empty string.`);
        }
      }
    }
  }

  if (!designIntentContract.motionSystem || typeof designIntentContract.motionSystem !== 'object') {
    validationErrors.push('designIntent.motionSystem must exist.');
  } else {
    if (designIntentContract.motionSystem.allowMeaningfulMotion !== true) {
      validationErrors.push('designIntent.motionSystem.allowMeaningfulMotion must equal true.');
    }
    if (!String(designIntentContract.motionSystem.purpose || '').trim()) {
      validationErrors.push('designIntent.motionSystem.purpose must be a non-empty string.');
    }
    if (designIntentContract.motionSystem.respectReducedMotion !== true) {
      validationErrors.push('designIntent.motionSystem.respectReducedMotion must equal true.');
    }
  }

  if (!designIntentContract.componentMorphology || typeof designIntentContract.componentMorphology !== 'object') {
    validationErrors.push('designIntent.componentMorphology must exist.');
  } else {
    if (designIntentContract.componentMorphology.requireStateBehaviorMatrix !== true) {
      validationErrors.push('designIntent.componentMorphology.requireStateBehaviorMatrix must equal true.');
    }
    if (!Array.isArray(designIntentContract.componentMorphology.stateKeys) || designIntentContract.componentMorphology.stateKeys.length < 4) {
      validationErrors.push('designIntent.componentMorphology.stateKeys must contain multiple interaction states.');
    }
    const viewportBehavior = designIntentContract.componentMorphology.viewportBehavior;
    if (!viewportBehavior || typeof viewportBehavior !== 'object') {
      validationErrors.push('designIntent.componentMorphology.viewportBehavior must exist.');
    } else {
      for (const viewportKey of ['mobile', 'tablet', 'desktop']) {
        if (!String(viewportBehavior[viewportKey] || '').trim()) {
          validationErrors.push(`designIntent.componentMorphology.viewportBehavior.${viewportKey} must be a non-empty string.`);
        }
      }
    }
  }

  if (!designIntentContract.accessibilityPolicy || typeof designIntentContract.accessibilityPolicy !== 'object') {
    validationErrors.push('designIntent.accessibilityPolicy must exist.');
  } else {
    if (designIntentContract.accessibilityPolicy.hardComplianceFloor !== 'WCAG-2.2-AA') {
      validationErrors.push('designIntent.accessibilityPolicy.hardComplianceFloor must equal "WCAG-2.2-AA".');
    }
    if (designIntentContract.accessibilityPolicy.advisoryContrastModel !== 'APCA') {
      validationErrors.push('designIntent.accessibilityPolicy.advisoryContrastModel must equal "APCA".');
    }
    if (designIntentContract.accessibilityPolicy.failOnHardViolations !== true) {
      validationErrors.push('designIntent.accessibilityPolicy.failOnHardViolations must equal true.');
    }
    if (designIntentContract.accessibilityPolicy.advisoryFindingsDoNotBlockByDefault !== true) {
      validationErrors.push('designIntent.accessibilityPolicy.advisoryFindingsDoNotBlockByDefault must equal true.');
    }
    const hardRequirements = designIntentContract.accessibilityPolicy.hardRequirements;
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
    const advisoryChecks = designIntentContract.accessibilityPolicy.advisoryChecks;
    if (!advisoryChecks || typeof advisoryChecks !== 'object') {
      validationErrors.push('designIntent.accessibilityPolicy.advisoryChecks must exist.');
    } else {
      for (const advisoryKey of [
        'perceptualContrastReview',
        'darkModeContrastTuning',
        'typographyReadabilityTuning',
      ]) {
        if (advisoryChecks[advisoryKey] !== true) {
          validationErrors.push(`designIntent.accessibilityPolicy.advisoryChecks.${advisoryKey} must equal true.`);
        }
      }
    }
  }

  if (!designIntentContract.contextHygiene || typeof designIntentContract.contextHygiene !== 'object') {
    validationErrors.push('designIntent.contextHygiene must exist.');
  } else {
    if (designIntentContract.contextHygiene.continuityMode !== 'opt-in-only') {
      validationErrors.push('designIntent.contextHygiene.continuityMode must equal "opt-in-only".');
    }
    if (designIntentContract.contextHygiene.repoEvidenceOverridesMemory !== true) {
      validationErrors.push('designIntent.contextHygiene.repoEvidenceOverridesMemory must equal true.');
    }
    if (designIntentContract.contextHygiene.requireExplicitContinuityApproval !== true) {
      validationErrors.push('designIntent.contextHygiene.requireExplicitContinuityApproval must equal true.');
    }
    if (designIntentContract.contextHygiene.forbidCarryoverWhenUnapproved !== true) {
      validationErrors.push('designIntent.contextHygiene.forbidCarryoverWhenUnapproved must equal true.');
    }
    if (!Array.isArray(designIntentContract.contextHygiene.allowedSources) || designIntentContract.contextHygiene.allowedSources.length < 4) {
      validationErrors.push('designIntent.contextHygiene.allowedSources must list the approved design evidence sources.');
    }
    if (!Array.isArray(designIntentContract.contextHygiene.taintedSources) || designIntentContract.contextHygiene.taintedSources.length < 3) {
      validationErrors.push('designIntent.contextHygiene.taintedSources must list tainted carryover sources.');
    }
    if (!String(designIntentContract.contextHygiene.approvedExternalConstraintUsage || '').trim()) {
      validationErrors.push('designIntent.contextHygiene.approvedExternalConstraintUsage must be a non-empty string.');
    }
  }

  if (!designIntentContract.designExecutionPolicy || typeof designIntentContract.designExecutionPolicy !== 'object') {
    validationErrors.push('designIntent.designExecutionPolicy must exist.');
  } else {
    if (designIntentContract.designExecutionPolicy.representationStrategy !== 'surface-plan-v1') {
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
      'requirePerSurfaceMutationOps',
      'forbidUniformSiblingSurfaceTreatment',
      'zeroBasedRedesignResetsPriorVisualsWhenRequested',
    ]) {
      if (designIntentContract.designExecutionPolicy[requiredFlagName] !== true) {
        validationErrors.push(`designIntent.designExecutionPolicy.${requiredFlagName} must equal true.`);
      }
    }
    if (designIntentContract.designExecutionPolicy.handoffFormatVersion !== 'ui-handoff-v1') {
      validationErrors.push('designIntent.designExecutionPolicy.handoffFormatVersion must equal "ui-handoff-v1".');
    }
    if (
      !Array.isArray(designIntentContract.designExecutionPolicy.semanticReviewFocus)
      || designIntentContract.designExecutionPolicy.semanticReviewFocus.length < 4
    ) {
      validationErrors.push('designIntent.designExecutionPolicy.semanticReviewFocus must list the required review dimensions.');
    }
  }

  if (!designIntentContract.designExecutionHandoff || typeof designIntentContract.designExecutionHandoff !== 'object') {
    validationErrors.push('designIntent.designExecutionHandoff must exist.');
  } else {
    if (designIntentContract.designExecutionHandoff.version !== 'ui-handoff-v1') {
      validationErrors.push('designIntent.designExecutionHandoff.version must equal "ui-handoff-v1".');
    }
    if (designIntentContract.designExecutionHandoff.seedMode !== 'structure-first-scaffold') {
      validationErrors.push('designIntent.designExecutionHandoff.seedMode must equal "structure-first-scaffold".');
    }
    if (designIntentContract.designExecutionHandoff.requiresTaskSpecificRefinement !== true) {
      validationErrors.push('designIntent.designExecutionHandoff.requiresTaskSpecificRefinement must equal true.');
    }
    if (!String(designIntentContract.designExecutionHandoff.primaryExperienceGoal || '').trim()) {
      validationErrors.push('designIntent.designExecutionHandoff.primaryExperienceGoal must be a non-empty string.');
    }
    if (!Array.isArray(designIntentContract.designExecutionHandoff.surfacePlan) || designIntentContract.designExecutionHandoff.surfacePlan.length < 1) {
      validationErrors.push('designIntent.designExecutionHandoff.surfacePlan must define at least one planned surface.');
    }
    const componentGraph = designIntentContract.designExecutionHandoff.componentGraph;
    if (!componentGraph || typeof componentGraph !== 'object') {
      validationErrors.push('designIntent.designExecutionHandoff.componentGraph must exist.');
    } else {
      if (!Array.isArray(componentGraph.nodes) || componentGraph.nodes.length < 2) {
        validationErrors.push('designIntent.designExecutionHandoff.componentGraph.nodes must list the primary execution nodes.');
      }
      if (!Array.isArray(componentGraph.edges) || componentGraph.edges.length < 1) {
        validationErrors.push('designIntent.designExecutionHandoff.componentGraph.edges must define relationships between UI nodes.');
      }
    }
    const contentPriorityMap = designIntentContract.designExecutionHandoff.contentPriorityMap;
    if (!contentPriorityMap || typeof contentPriorityMap !== 'object') {
      validationErrors.push('designIntent.designExecutionHandoff.contentPriorityMap must exist.');
    } else {
      for (const priorityBucket of ['primary', 'secondary', 'deferred']) {
        if (!Array.isArray(contentPriorityMap[priorityBucket]) || contentPriorityMap[priorityBucket].length < 1) {
          validationErrors.push(`designIntent.designExecutionHandoff.contentPriorityMap.${priorityBucket} must contain at least one item.`);
        }
      }
    }
    const viewportMutationPlan = designIntentContract.designExecutionHandoff.viewportMutationPlan;
    if (!viewportMutationPlan || typeof viewportMutationPlan !== 'object') {
      validationErrors.push('designIntent.designExecutionHandoff.viewportMutationPlan must exist.');
    } else {
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
    if (!Array.isArray(designIntentContract.designExecutionHandoff.interactionStateMatrix) || designIntentContract.designExecutionHandoff.interactionStateMatrix.length < 1) {
      validationErrors.push('designIntent.designExecutionHandoff.interactionStateMatrix must list key component state expectations.');
    }
    if (!Array.isArray(designIntentContract.designExecutionHandoff.taskFlowNarrative) || designIntentContract.designExecutionHandoff.taskFlowNarrative.length < 2) {
      validationErrors.push('designIntent.designExecutionHandoff.taskFlowNarrative must describe the key UI task flow in sequence.');
    }
    if (!String(designIntentContract.designExecutionHandoff.signatureMoveRationale || '').trim()) {
      validationErrors.push('designIntent.designExecutionHandoff.signatureMoveRationale must explain the chosen authored move.');
    }
    const creativeCommitment = designIntentContract.designExecutionHandoff.creativeCommitment;
    if (!creativeCommitment || typeof creativeCommitment !== 'object') {
      validationErrors.push('designIntent.designExecutionHandoff.creativeCommitment must exist.');
    } else {
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
    const implementationGuardrails = designIntentContract.designExecutionHandoff.implementationGuardrails;
    if (!implementationGuardrails || typeof implementationGuardrails !== 'object') {
      validationErrors.push('designIntent.designExecutionHandoff.implementationGuardrails must exist.');
    } else {
      for (const requiredFlagName of [
        'requireBuildFromHandoff',
        'requireGapNotesBeforeFallback',
        'forbidGenericLayoutFallbackWithoutReason',
      ]) {
        if (implementationGuardrails[requiredFlagName] !== true) {
          validationErrors.push(`designIntent.designExecutionHandoff.implementationGuardrails.${requiredFlagName} must equal true.`);
        }
      }
    }
  }

  if (!designIntentContract.reviewRubric || typeof designIntentContract.reviewRubric !== 'object') {
    validationErrors.push('designIntent.reviewRubric must exist.');
  } else {
    if (designIntentContract.reviewRubric.version !== 'ui-rubric-v1') {
      validationErrors.push('designIntent.reviewRubric.version must equal "ui-rubric-v1".');
    }
    if (designIntentContract.reviewRubric.genericityAutoFail !== true) {
      validationErrors.push('designIntent.reviewRubric.genericityAutoFail must equal true.');
    }
    if (!Array.isArray(designIntentContract.reviewRubric.dimensions) || designIntentContract.reviewRubric.dimensions.length < 5) {
      validationErrors.push('designIntent.reviewRubric.dimensions must define the required rubric dimensions.');
    } else {
      for (const requiredRubricKey of [
        'distinctiveness',
        'contractFidelity',
        'visualConsistency',
        'heuristicUxQuality',
        'motionDiscipline',
      ]) {
        if (!designIntentContract.reviewRubric.dimensions.some((dimension) => dimension?.key === requiredRubricKey)) {
          validationErrors.push(`designIntent.reviewRubric.dimensions is missing "${requiredRubricKey}".`);
        }
      }
    }
    if (!Array.isArray(designIntentContract.reviewRubric.genericitySignals) || designIntentContract.reviewRubric.genericitySignals.length < 3) {
      validationErrors.push('designIntent.reviewRubric.genericitySignals must list common genericity drift signals.');
    } else {
      for (const requiredSignal of [
        'ai-safe-ui-template-look',
        'ai-color-default-palette-without-product-role-behavior',
        'interchangeable-product-renaming-test-fails',
        'decorative-grid-or-glow-wallpaper-without-product-function',
        'motion-or-3d-omitted-from-fear-without-fit-analysis',
      ]) {
        if (!designIntentContract.reviewRubric.genericitySignals.includes(requiredSignal)) {
          validationErrors.push(`designIntent.reviewRubric.genericitySignals must include "${requiredSignal}".`);
        }
      }
    }
    if (!Array.isArray(designIntentContract.reviewRubric.validBoldSignals) || designIntentContract.reviewRubric.validBoldSignals.length < 3) {
      validationErrors.push('designIntent.reviewRubric.validBoldSignals must list legitimate authored signals.');
    } else {
      for (const requiredSignal of [
        'three-at-a-glance-product-specific-signals',
        'visually-exploratory-accessible-palette-derived-from-product',
        'audacious-accessible-palette-with-product-role-behavior',
        'motion-or-spatial-experience-derived-from-anchor',
      ]) {
        if (!designIntentContract.reviewRubric.validBoldSignals.includes(requiredSignal)) {
          validationErrors.push(`designIntent.reviewRubric.validBoldSignals must include "${requiredSignal}".`);
        }
      }
    }
    if (!designIntentContract.reviewRubric.reportingRules || typeof designIntentContract.reviewRubric.reportingRules !== 'object') {
      validationErrors.push('designIntent.reviewRubric.reportingRules must exist.');
    } else {
      for (const requiredFlagName of [
        'mustExplainGenericity',
        'mustSeparateTasteFromFailure',
        'contractFidelityOverridesPersonalTaste',
      ]) {
        if (designIntentContract.reviewRubric.reportingRules[requiredFlagName] !== true) {
          validationErrors.push(`designIntent.reviewRubric.reportingRules.${requiredFlagName} must equal true.`);
        }
      }
    }
  }

  if (!Array.isArray(designIntentContract.requiredDesignSections) || designIntentContract.requiredDesignSections.length !== DESIGN_REQUIRED_SECTIONS.length) {
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
  } else {
    for (const requiredPattern of [
      'ai-safe-ui-template-look',
      'ai-color-default-palette-without-product-role-behavior',
      'interchangeable-product-renaming-test-fails',
      'decorative-grid-or-glow-wallpaper-without-product-function',
      'motion-or-3d-omitted-from-fear-without-fit-analysis',
    ]) {
      if (!designIntentContract.forbiddenPatterns.includes(requiredPattern)) {
        validationErrors.push(`designIntent.forbiddenPatterns must include "${requiredPattern}".`);
      }
    }
  }

  return validationErrors;
}
