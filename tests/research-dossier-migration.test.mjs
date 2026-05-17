// Verifies Scenario D and E migration logic for upgrading existing
// docs/design-intent.json files with researchDossier.metadata.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  buildResearchDossierMetadata,
  migrateExistingDesignIntentToResearchDossierSchema,
} from '../lib/cli/project-scaffolder/design-contract/research-dossier-migration.mjs';

test('Research Dossier Migration', async (t) => {
  await t.test('buildResearchDossierMetadata returns a fresh seed metadata block when no contract is provided', () => {
    const metadata = buildResearchDossierMetadata();
    assert.equal(metadata.researchVerifiedAt, null);
    assert.equal(metadata.freshnessWindowDays, 90);
    assert.equal(metadata.userExplicitRedesignBypassesFreshness, true);
    assert.equal(metadata.statusAwareValidation.seedSkipsDossierShape, true);
    assert.equal(metadata.antiRepeatLedger.blocklistFromHistory, true);
    assert.equal(metadata.antiRepeatLedger.ledgerScope, 'signature-level-descriptors-only');
    assert.equal(metadata.antiRepeatLedger.ledgerMaxEntriesPerCategory, 3);
    assert.deepEqual(metadata.antiRepeatLedger.previousAnchors, []);
    assert.deepEqual(metadata.antiRepeatLedger.previousPalettes, []);
    assert.deepEqual(metadata.antiRepeatLedger.previousMotionSignatures, []);
  });

  await t.test('buildResearchDossierMetadata extracts signature-level descriptors from existing contract', () => {
    const designIntentContract = {
      conceptualAnchor: {
        anchorReference: 'archival ledger',
        specificReferencePoint: 'paper records bound by date',
      },
      colorTruth: {
        intent: 'desaturated neutrals with single chroma accent',
      },
      derivedTokenLogic: {
        colorDerivationSource: 'archival neutrals derived from anchor',
        motionBudget: 'micro 80ms entrance / 200ms layout / no parallax',
      },
      motionPaletteDecision: {
        signatureMotion: 'page-flip in stacks on record open',
      },
    };

    const metadata = buildResearchDossierMetadata({
      designIntentContract,
      populateLedgerFromExistingContract: true,
    });

    assert.equal(metadata.antiRepeatLedger.previousAnchors.length, 1);
    assert.match(metadata.antiRepeatLedger.previousAnchors[0].summary, /archival ledger/);
    assert.match(metadata.antiRepeatLedger.previousAnchors[0].summary, /paper records bound by date/);
    assert.equal(metadata.antiRepeatLedger.previousAnchors[0].source, 'migrated-from-existing-design-intent');

    assert.equal(metadata.antiRepeatLedger.previousPalettes.length, 1);
    assert.match(metadata.antiRepeatLedger.previousPalettes[0].summary, /neutrals|chroma accent/);

    assert.equal(metadata.antiRepeatLedger.previousMotionSignatures.length, 1);
    assert.match(metadata.antiRepeatLedger.previousMotionSignatures[0].summary, /page-flip/);
  });

  await t.test('buildResearchDossierMetadata skips placeholder anchors and missing fields', () => {
    const designIntentContract = {
      conceptualAnchor: { anchorReference: 'agent-defined-anchor-reference' },
      colorTruth: {},
      derivedTokenLogic: {},
      motionPaletteDecision: {},
      motionSystem: {},
    };
    const metadata = buildResearchDossierMetadata({
      designIntentContract,
      populateLedgerFromExistingContract: true,
    });
    assert.deepEqual(metadata.antiRepeatLedger.previousAnchors, []);
    assert.deepEqual(metadata.antiRepeatLedger.previousPalettes, []);
    assert.deepEqual(metadata.antiRepeatLedger.previousMotionSignatures, []);
  });

  await t.test('migrateExistingDesignIntentToResearchDossierSchema injects metadata when absent', async () => {
    const tempDirectoryPath = mkdtempSync(join(tmpdir(), 'research-dossier-migration-injects-'));
    try {
      const existingContract = {
        mode: 'dynamic',
        status: 'active',
        conceptualAnchor: {
          anchorReference: 'archival ledger',
          specificReferencePoint: 'paper records bound by date',
        },
        colorTruth: { intent: 'desaturated neutrals with single chroma accent' },
        derivedTokenLogic: { motionBudget: 'micro 80ms entrance' },
        motionPaletteDecision: { signatureMotion: 'page-flip in stacks' },
      };
      const designIntentPath = join(tempDirectoryPath, 'design-intent.json');
      writeFileSync(designIntentPath, JSON.stringify(existingContract, null, 2), 'utf8');

      const firstMigration = await migrateExistingDesignIntentToResearchDossierSchema(designIntentPath);
      assert.equal(firstMigration.migrated, true);
      assert.equal(firstMigration.reason, 'research-dossier-metadata-injected');

      const migrated = JSON.parse(readFileSync(designIntentPath, 'utf8'));
      assert.equal(migrated.researchDossier.metadata.researchVerifiedAt, null);
      assert.equal(migrated.researchDossier.metadata.antiRepeatLedger.previousAnchors.length, 1);
      assert.match(migrated.researchDossier.metadata.antiRepeatLedger.previousAnchors[0].summary, /archival ledger/);
      assert.equal(migrated.conceptualAnchor.anchorReference, 'archival ledger');

      const secondMigration = await migrateExistingDesignIntentToResearchDossierSchema(designIntentPath);
      assert.equal(secondMigration.migrated, false);
      assert.equal(secondMigration.reason, 'research-dossier-metadata-already-present');
    } finally {
      rmSync(tempDirectoryPath, { recursive: true, force: true });
    }
  });

  await t.test('migrateExistingDesignIntentToResearchDossierSchema is idempotent and additive', async () => {
    const tempDirectoryPath = mkdtempSync(join(tmpdir(), 'research-dossier-migration-idempotent-'));
    try {
      const designIntentPath = join(tempDirectoryPath, 'design-intent.json');
      const existingContract = {
        mode: 'dynamic',
        status: 'active',
        researchDossier: {
          customField: 'preserved',
          metadata: { researchVerifiedAt: '2026-01-15', freshnessWindowDays: 90 },
        },
        conceptualAnchor: { anchorReference: 'something' },
      };
      writeFileSync(designIntentPath, JSON.stringify(existingContract, null, 2), 'utf8');

      const result = await migrateExistingDesignIntentToResearchDossierSchema(designIntentPath);
      assert.equal(result.migrated, false);
      assert.equal(result.reason, 'research-dossier-metadata-already-present');

      const persisted = JSON.parse(readFileSync(designIntentPath, 'utf8'));
      assert.equal(persisted.researchDossier.customField, 'preserved');
      assert.equal(persisted.researchDossier.metadata.researchVerifiedAt, '2026-01-15');
    } finally {
      rmSync(tempDirectoryPath, { recursive: true, force: true });
    }
  });

  await t.test('migrateExistingDesignIntentToResearchDossierSchema handles missing or invalid files', async () => {
    const tempDirectoryPath = mkdtempSync(join(tmpdir(), 'research-dossier-migration-edge-'));
    try {
      const missingResult = await migrateExistingDesignIntentToResearchDossierSchema(
        join(tempDirectoryPath, 'absent.json')
      );
      assert.equal(missingResult.migrated, false);
      assert.equal(missingResult.reason, 'design-intent-file-absent');

      const invalidPath = join(tempDirectoryPath, 'invalid.json');
      mkdirSync(tempDirectoryPath, { recursive: true });
      writeFileSync(invalidPath, '{ this is not valid json', 'utf8');
      const invalidResult = await migrateExistingDesignIntentToResearchDossierSchema(invalidPath);
      assert.equal(invalidResult.migrated, false);
      assert.equal(invalidResult.reason, 'design-intent-file-not-valid-json');
    } finally {
      rmSync(tempDirectoryPath, { recursive: true, force: true });
    }
  });
});

test('Research Dossier Migration — Typography Ledger', async (t) => {
  await t.test('migrateExistingDesignIntentToResearchDossierSchema captures typography tokens from a legacy fixture', async () => {
    const tempDirectoryPath = mkdtempSync(join(tmpdir(), 'research-dossier-migration-typography-'));
    try {
      // Pre-research-dossier fixture: a legacy design-intent.json with no
      // researchDossier block but populated typographyTokens, simulating an
      // existing project upgrading to the schema for the first time.
      const legacyDesignIntentContract = {
        mode: 'dynamic',
        status: 'active',
        conceptualAnchor: {
          anchorReference: 'archival ledger',
          specificReferencePoint: 'paper records bound by date',
        },
        colorTruth: { intent: 'muted neutrals' },
        derivedTokenLogic: { motionBudget: 'micro 80ms entrance' },
        motionPaletteDecision: { signatureMotion: 'page-flip in stacks' },
        tokenSystem: {
          typographyTokens: {
            display: 'Display-Family-A',
            body: 'Body-Family-B',
            mono: 'Mono-Family-C',
          },
        },
      };
      const designIntentPath = join(tempDirectoryPath, 'design-intent.json');
      writeFileSync(designIntentPath, JSON.stringify(legacyDesignIntentContract, null, 2), 'utf8');

      const result = await migrateExistingDesignIntentToResearchDossierSchema(designIntentPath);
      assert.equal(result.migrated, true);

      const migrated = JSON.parse(readFileSync(designIntentPath, 'utf8'));
      const typographyLedger = migrated.researchDossier.metadata.antiRepeatLedger.previousTypographyChoices;
      assert.equal(typographyLedger.length, 1);
      assert.match(typographyLedger[0].summary, /display: Display-Family-A/);
      assert.match(typographyLedger[0].summary, /body: Body-Family-B/);
      assert.match(typographyLedger[0].summary, /mono: Mono-Family-C/);
      assert.equal(typographyLedger[0].source, 'migrated-from-existing-design-intent');
      assert.equal(typographyLedger[0].blockedBecause, 'previously-shipped-typography-trio');
    } finally {
      rmSync(tempDirectoryPath, { recursive: true, force: true });
    }
  });

  await t.test('buildResearchDossierMetadata returns empty typography entry when tokenSystem.typographyTokens is absent', () => {
    const metadata = buildResearchDossierMetadata({
      designIntentContract: { conceptualAnchor: { anchorReference: 'whatever' }, tokenSystem: {} },
      populateLedgerFromExistingContract: true,
    });
    assert.deepEqual(metadata.antiRepeatLedger.previousTypographyChoices, []);
  });
});
