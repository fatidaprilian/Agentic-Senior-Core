/**
 * Validators for the AI-safe UI audit (with nested AI color and motion-spatial
 * courage audits) and the production content policy. These are the gates that
 * keep template-flavored UI from shipping by default.
 */

function validateAiColorAudit(aiSafeUiAudit, validationErrors) {
  const aiColorAudit = aiSafeUiAudit.aiColorAudit;
  if (!aiColorAudit || typeof aiColorAudit !== 'object') {
    validationErrors.push('designIntent.aiSafeUiAudit.aiColorAudit must exist.');
    return;
  }
  if (aiColorAudit.status !== 'agent-must-complete-before-ui-implementation') {
    validationErrors.push('designIntent.aiSafeUiAudit.aiColorAudit.status must require completion before UI implementation.');
  }
  if (!String(aiColorAudit.failureDefinition || '').includes('AI color')) {
    validationErrors.push('designIntent.aiSafeUiAudit.aiColorAudit.failureDefinition must define AI color drift.');
  }
  if (!Array.isArray(aiColorAudit.autopilotRisks) || aiColorAudit.autopilotRisks.length < 4) {
    validationErrors.push('designIntent.aiSafeUiAudit.aiColorAudit.autopilotRisks must list common autopilot palettes.');
  }
  if (!Array.isArray(aiColorAudit.requiredEvidence) || aiColorAudit.requiredEvidence.length < 3) {
    validationErrors.push('designIntent.aiSafeUiAudit.aiColorAudit.requiredEvidence must list color evidence requirements.');
  }
  if (!String(aiColorAudit.reviewQuestion || '').trim()) {
    validationErrors.push('designIntent.aiSafeUiAudit.aiColorAudit.reviewQuestion must be a non-empty string.');
  }
}

function validateMotionSpatialCourageAudit(aiSafeUiAudit, validationErrors) {
  const motionSpatialCourageAudit = aiSafeUiAudit.motionSpatialCourageAudit;
  if (!motionSpatialCourageAudit || typeof motionSpatialCourageAudit !== 'object') {
    validationErrors.push('designIntent.aiSafeUiAudit.motionSpatialCourageAudit must exist.');
    return;
  }
  if (motionSpatialCourageAudit.status !== 'agent-must-complete-before-ui-implementation') {
    validationErrors.push('designIntent.aiSafeUiAudit.motionSpatialCourageAudit.status must require completion before UI implementation.');
  }
  if (!String(motionSpatialCourageAudit.defaultStance || '').includes('first-class options')) {
    validationErrors.push('designIntent.aiSafeUiAudit.motionSpatialCourageAudit.defaultStance must treat motion and spatial UI as first-class options.');
  }
  if (!Array.isArray(motionSpatialCourageAudit.requiredDecisionFields) || motionSpatialCourageAudit.requiredDecisionFields.length < 3) {
    validationErrors.push('designIntent.aiSafeUiAudit.motionSpatialCourageAudit.requiredDecisionFields must list required motion/spatial decisions.');
  }
  if (!String(motionSpatialCourageAudit.rejectionRule || '').includes('product reason')) {
    validationErrors.push('designIntent.aiSafeUiAudit.motionSpatialCourageAudit.rejectionRule must require a product reason before omitting spatial UI.');
  }
  if (!String(motionSpatialCourageAudit.reviewQuestion || '').trim()) {
    validationErrors.push('designIntent.aiSafeUiAudit.motionSpatialCourageAudit.reviewQuestion must be a non-empty string.');
  }
}

export function validateAiSafeUiAudit(designIntentContract, validationErrors) {
  if (!designIntentContract.aiSafeUiAudit || typeof designIntentContract.aiSafeUiAudit !== 'object') {
    validationErrors.push('designIntent.aiSafeUiAudit must exist.');
    return validationErrors;
  }

  const aiSafeUiAudit = designIntentContract.aiSafeUiAudit;
  if (aiSafeUiAudit.status !== 'agent-must-complete-before-ui-implementation') {
    validationErrors.push('designIntent.aiSafeUiAudit.status must require completion before UI implementation.');
  }
  if (!String(aiSafeUiAudit.failureDefinition || '').includes('AI-safe')) {
    validationErrors.push('designIntent.aiSafeUiAudit.failureDefinition must define AI-safe UI drift.');
  }
  if (!String(aiSafeUiAudit.failureDefinition || '').includes('placeholder copy')) {
    validationErrors.push('designIntent.aiSafeUiAudit.failureDefinition must reject test/demo/placeholder UI copy.');
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

  validateAiColorAudit(aiSafeUiAudit, validationErrors);
  validateMotionSpatialCourageAudit(aiSafeUiAudit, validationErrors);

  if (!String(aiSafeUiAudit.reviewQuestion || '').trim()) {
    validationErrors.push('designIntent.aiSafeUiAudit.reviewQuestion must be a non-empty string.');
  }
  if (aiSafeUiAudit.blockingByDefault !== true) {
    validationErrors.push('designIntent.aiSafeUiAudit.blockingByDefault must equal true.');
  }
  return validationErrors;
}

export function validateProductionContentPolicy(designIntentContract, validationErrors) {
  if (!designIntentContract.productionContentPolicy || typeof designIntentContract.productionContentPolicy !== 'object') {
    validationErrors.push('designIntent.productionContentPolicy must exist.');
    return validationErrors;
  }

  const productionContentPolicy = designIntentContract.productionContentPolicy;
  if (productionContentPolicy.status !== 'agent-must-complete-before-ui-implementation') {
    validationErrors.push('designIntent.productionContentPolicy.status must require completion before UI implementation.');
  }
  if (!String(productionContentPolicy.userFacingCopyRule || '').includes('testing')) {
    validationErrors.push('designIntent.productionContentPolicy.userFacingCopyRule must reject testing/demo/placeholder UI copy.');
  }
  if (!String(productionContentPolicy.terminalDependencyRule || '').includes('Terminal commands')) {
    validationErrors.push('designIntent.productionContentPolicy.terminalDependencyRule must keep terminal commands out of core UI flows.');
  }
  if (!Array.isArray(productionContentPolicy.allowedExceptions) || productionContentPolicy.allowedExceptions.length < 3) {
    validationErrors.push('designIntent.productionContentPolicy.allowedExceptions must list limited exceptions.');
  }
  if (productionContentPolicy.blockingByDefault !== true) {
    validationErrors.push('designIntent.productionContentPolicy.blockingByDefault must equal true.');
  }
  return validationErrors;
}
