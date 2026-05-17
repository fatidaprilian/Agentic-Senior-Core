/**
 * Research dossier validators. Enforces the `researchDossier.metadata` block
 * shape that powers the freshness gate, status-aware skip, and anti-repeat
 * ledger consumed by `.agent-context/prompts/research-design.md`.
 */

import { hasNonEmptyString } from './helpers.mjs';

const REQUIRED_FRESHNESS_WINDOW_DAYS = 90;
const REQUIRED_SEED_STATUSES = [
  'seed-needs-design-synthesis',
  'seed-generated-during-init',
  'seed-generated-during-upgrade',
];
const ANTI_REPEAT_LEDGER_CATEGORIES = ['previousAnchors', 'previousPalettes', 'previousMotionSignatures'];

function validateMetadataBaseShape(metadata, validationErrors) {
  if (
    metadata.researchVerifiedAt !== null
    && (typeof metadata.researchVerifiedAt !== 'string' || metadata.researchVerifiedAt.trim().length === 0)
  ) {
    validationErrors.push('designIntent.researchDossier.metadata.researchVerifiedAt must be null or an ISO date string.');
  }
  if (!Number.isInteger(metadata.freshnessWindowDays) || metadata.freshnessWindowDays < 1) {
    validationErrors.push(`designIntent.researchDossier.metadata.freshnessWindowDays must be a positive integer (recommended ${REQUIRED_FRESHNESS_WINDOW_DAYS}).`);
  }
  if (!hasNonEmptyString(metadata.freshnessRule)) {
    validationErrors.push('designIntent.researchDossier.metadata.freshnessRule must be a non-empty string explaining staleness.');
  }
  if (metadata.userExplicitRedesignBypassesFreshness !== true) {
    validationErrors.push('designIntent.researchDossier.metadata.userExplicitRedesignBypassesFreshness must equal true so explicit redesign requests force fresh research.');
  }
}

function validateStatusAwareValidation(metadata, validationErrors) {
  const statusAwareValidation = metadata.statusAwareValidation;
  if (!statusAwareValidation || typeof statusAwareValidation !== 'object') {
    validationErrors.push('designIntent.researchDossier.metadata.statusAwareValidation must exist.');
    return;
  }
  const seedStatuses = statusAwareValidation.seedStatuses;
  const hasAllRequiredSeedStatuses = Array.isArray(seedStatuses)
    && REQUIRED_SEED_STATUSES.every((requiredSeedStatusName) => seedStatuses.includes(requiredSeedStatusName));
  if (!hasAllRequiredSeedStatuses) {
    validationErrors.push('designIntent.researchDossier.metadata.statusAwareValidation.seedStatuses must include seed-needs-design-synthesis, seed-generated-during-init, and seed-generated-during-upgrade.');
  }
  if (statusAwareValidation.seedSkipsDossierShape !== true) {
    validationErrors.push('designIntent.researchDossier.metadata.statusAwareValidation.seedSkipsDossierShape must equal true.');
  }
  if (statusAwareValidation.activeRequiresFreshOrExplicitRedesign !== true) {
    validationErrors.push('designIntent.researchDossier.metadata.statusAwareValidation.activeRequiresFreshOrExplicitRedesign must equal true.');
  }
}

function validateAntiRepeatLedger(metadata, validationErrors) {
  const antiRepeatLedger = metadata.antiRepeatLedger;
  if (!antiRepeatLedger || typeof antiRepeatLedger !== 'object') {
    validationErrors.push('designIntent.researchDossier.metadata.antiRepeatLedger must exist.');
    return;
  }
  if (antiRepeatLedger.blocklistFromHistory !== true) {
    validationErrors.push('designIntent.researchDossier.metadata.antiRepeatLedger.blocklistFromHistory must equal true so previously shipped direction is blocked from repetition.');
  }
  if (antiRepeatLedger.ledgerScope !== 'signature-level-descriptors-only') {
    validationErrors.push('designIntent.researchDossier.metadata.antiRepeatLedger.ledgerScope must equal "signature-level-descriptors-only" so the ledger does not become a raw token dump.');
  }
  if (
    !Number.isInteger(antiRepeatLedger.ledgerMaxEntriesPerCategory)
    || antiRepeatLedger.ledgerMaxEntriesPerCategory < 1
    || antiRepeatLedger.ledgerMaxEntriesPerCategory > 5
  ) {
    validationErrors.push('designIntent.researchDossier.metadata.antiRepeatLedger.ledgerMaxEntriesPerCategory must be an integer between 1 and 5 to keep the ledger signature-level.');
  }
  for (const ledgerCategoryName of ANTI_REPEAT_LEDGER_CATEGORIES) {
    const ledgerEntries = antiRepeatLedger[ledgerCategoryName];
    if (!Array.isArray(ledgerEntries)) {
      validationErrors.push(`designIntent.researchDossier.metadata.antiRepeatLedger.${ledgerCategoryName} must be an array (may be empty in fresh seeds).`);
      continue;
    }
    if (
      Number.isInteger(antiRepeatLedger.ledgerMaxEntriesPerCategory)
      && ledgerEntries.length > antiRepeatLedger.ledgerMaxEntriesPerCategory
    ) {
      validationErrors.push(`designIntent.researchDossier.metadata.antiRepeatLedger.${ledgerCategoryName} exceeds ledgerMaxEntriesPerCategory; trim to signature-level descriptors.`);
    }
  }
}

export function validateResearchDossier(designIntentContract, validationErrors) {
  const researchDossier = designIntentContract?.researchDossier;
  if (!researchDossier || typeof researchDossier !== 'object') {
    validationErrors.push('designIntent.researchDossier must exist (Section 3-5 metadata block from research-design.md).');
    return validationErrors;
  }
  const metadata = researchDossier.metadata;
  if (!metadata || typeof metadata !== 'object') {
    validationErrors.push('designIntent.researchDossier.metadata must exist with researchVerifiedAt, freshnessWindowDays, and antiRepeatLedger.');
    return validationErrors;
  }
  validateMetadataBaseShape(metadata, validationErrors);
  validateStatusAwareValidation(metadata, validationErrors);
  validateAntiRepeatLedger(metadata, validationErrors);
  return validationErrors;
}
