/**
 * Research-dossier migration helper.
 *
 * Adds the `researchDossier.metadata` block to existing `docs/design-intent.json`
 * files when it is absent, populating `antiRepeatLedger` from the existing
 * conceptual anchor, palette, and motion fields so future UI work cannot
 * unknowingly repeat shipped direction.
 *
 * Idempotent: if the metadata block already exists, the file is left untouched.
 * Additive: never overwrites existing fields.
 */

import fs from 'node:fs/promises';

import { pathExists } from '../../utils.mjs';

const FRESHNESS_WINDOW_DAYS = 90;
const FRESHNESS_RULE = 'Research dossier is stale when researchVerifiedAt is null or older than freshnessWindowDays. Stale dossiers must run research-design.md before UI implementation. User-explicit redesign requests bypass freshness and force fresh research regardless of age.';

function takeFirstNonEmpty(...candidateValues) {
  for (const candidateValue of candidateValues) {
    if (typeof candidateValue === 'string' && candidateValue.trim().length > 0) {
      return candidateValue.trim();
    }
  }
  return null;
}

function buildPreviousAnchorEntry(designIntentContract) {
  const conceptualAnchor = designIntentContract?.conceptualAnchor;
  if (!conceptualAnchor || typeof conceptualAnchor !== 'object') {
    return [];
  }
  const anchorReference = takeFirstNonEmpty(conceptualAnchor.anchorReference);
  if (!anchorReference || anchorReference === 'agent-defined-anchor-reference') {
    return [];
  }
  const specificReferencePoint = takeFirstNonEmpty(conceptualAnchor.specificReferencePoint);
  const summary = specificReferencePoint
    ? `${anchorReference} (${specificReferencePoint})`
    : anchorReference;
  return [{
    summary,
    source: 'migrated-from-existing-design-intent',
    blockedBecause: 'previously-shipped-direction',
  }];
}

function buildPreviousPaletteEntry(designIntentContract) {
  const derivedTokenLogic = designIntentContract?.derivedTokenLogic;
  const colorTruth = designIntentContract?.colorTruth;
  const colorDerivationSummary = takeFirstNonEmpty(derivedTokenLogic?.colorDerivationSource);
  const colorIntent = takeFirstNonEmpty(colorTruth?.intent);
  const summary = takeFirstNonEmpty(colorIntent, colorDerivationSummary);
  if (!summary) {
    return [];
  }
  return [{
    summary,
    source: 'migrated-from-existing-design-intent',
    blockedBecause: 'previously-shipped-palette-behavior',
  }];
}

function buildPreviousMotionEntry(designIntentContract) {
  const motionPaletteDecision = designIntentContract?.motionPaletteDecision;
  const motionSystem = designIntentContract?.motionSystem;
  const derivedTokenLogic = designIntentContract?.derivedTokenLogic;

  const motionSignature = takeFirstNonEmpty(
    motionPaletteDecision?.signatureMotion,
    motionPaletteDecision?.motion,
    motionSystem?.signature,
    motionSystem?.purpose,
    derivedTokenLogic?.motionBudget,
  );
  if (!motionSignature) {
    return [];
  }
  return [{
    summary: motionSignature,
    source: 'migrated-from-existing-design-intent',
    blockedBecause: 'previously-shipped-motion-signature',
  }];
}

function buildPreviousTypographyEntry(designIntentContract) {
  if (!designIntentContract || typeof designIntentContract !== 'object') {
    return [];
  }
  const tokenSystem = designIntentContract?.tokenSystem;
  const typographyTokens = tokenSystem && typeof tokenSystem === 'object' ? tokenSystem.typographyTokens : null;
  if (!typographyTokens || typeof typographyTokens !== 'object') {
    return [];
  }
  const tokenEntries = Object.entries(typographyTokens)
    .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
    .map(([role, value]) => `${role}: ${value.trim()}`);
  if (tokenEntries.length === 0) {
    return [];
  }
  return [{
    summary: tokenEntries.join('; '),
    source: 'migrated-from-existing-design-intent',
    blockedBecause: 'previously-shipped-typography-trio',
  }];
}

export function buildResearchDossierMetadata({
  designIntentContract = null,
  populateLedgerFromExistingContract = false,
} = {}) {
  const metadata = {
    researchVerifiedAt: null,
    freshnessWindowDays: FRESHNESS_WINDOW_DAYS,
    freshnessRule: FRESHNESS_RULE,
    antiRepeatLedger: {
      blocklistFromHistory: true,
      ledgerScope: 'signature-level-descriptors-only',
      ledgerMaxEntriesPerCategory: 3,
      previousAnchors: [],
      previousPalettes: [],
      previousMotionSignatures: [],
      previousTypographyChoices: [],
    },
    userExplicitRedesignBypassesFreshness: true,
    statusAwareValidation: {
      seedStatuses: [
        'seed-needs-design-synthesis',
        'seed-generated-during-init',
        'seed-generated-during-upgrade',
      ],
      seedSkipsDossierShape: true,
      activeRequiresFreshOrExplicitRedesign: true,
    },
  };

  if (populateLedgerFromExistingContract && designIntentContract && typeof designIntentContract === 'object') {
    metadata.antiRepeatLedger.previousAnchors = buildPreviousAnchorEntry(designIntentContract).slice(0, metadata.antiRepeatLedger.ledgerMaxEntriesPerCategory);
    metadata.antiRepeatLedger.previousPalettes = buildPreviousPaletteEntry(designIntentContract).slice(0, metadata.antiRepeatLedger.ledgerMaxEntriesPerCategory);
    metadata.antiRepeatLedger.previousMotionSignatures = buildPreviousMotionEntry(designIntentContract).slice(0, metadata.antiRepeatLedger.ledgerMaxEntriesPerCategory);
    metadata.antiRepeatLedger.previousTypographyChoices = buildPreviousTypographyEntry(designIntentContract).slice(0, metadata.antiRepeatLedger.ledgerMaxEntriesPerCategory);
  }

  return metadata;
}

/**
 * Migrates an existing design-intent.json file in place by adding
 * `researchDossier.metadata` when absent. Idempotent.
 *
 * @param {string} designIntentFilePath
 * @returns {Promise<{ migrated: boolean, reason: string }>}
 */
export async function migrateExistingDesignIntentToResearchDossierSchema(designIntentFilePath) {
  if (!(await pathExists(designIntentFilePath))) {
    return { migrated: false, reason: 'design-intent-file-absent' };
  }

  const fileContent = await fs.readFile(designIntentFilePath, 'utf8');
  let designIntentContract;
  try {
    designIntentContract = JSON.parse(fileContent);
  } catch {
    return { migrated: false, reason: 'design-intent-file-not-valid-json' };
  }

  if (!designIntentContract || typeof designIntentContract !== 'object') {
    return { migrated: false, reason: 'design-intent-file-not-an-object' };
  }

  const existingResearchDossier = designIntentContract.researchDossier;
  if (existingResearchDossier && typeof existingResearchDossier === 'object' && existingResearchDossier.metadata) {
    return { migrated: false, reason: 'research-dossier-metadata-already-present' };
  }

  const populatedMetadata = buildResearchDossierMetadata({
    designIntentContract,
    populateLedgerFromExistingContract: true,
  });

  designIntentContract.researchDossier = {
    ...(existingResearchDossier && typeof existingResearchDossier === 'object' ? existingResearchDossier : {}),
    metadata: populatedMetadata,
  };

  await fs.writeFile(designIntentFilePath, `${JSON.stringify(designIntentContract, null, 2)}\n`, 'utf8');
  return { migrated: true, reason: 'research-dossier-metadata-injected' };
}
