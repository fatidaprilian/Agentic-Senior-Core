// Verifies the CSS-level anti-repeat audit catches typography violations
// (blocking) and palette near-matches (advisory) by cross-checking
// CSS files against researchDossier.metadata.antiRepeatLedger.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runTypographyPaletteAntiRepeatAudit } from '../lib/cli/audits/typography-palette-anti-repeat-audit.mjs';

function buildDesignIntentWithLedger({ typographySummary = '', paletteSummary = '' } = {}) {
  return {
    mode: 'dynamic',
    status: 'active',
    researchDossier: {
      metadata: {
        researchVerifiedAt: '2026-05-01',
        freshnessWindowDays: 90,
        antiRepeatLedger: {
          blocklistFromHistory: true,
          ledgerScope: 'signature-level-descriptors-only',
          ledgerMaxEntriesPerCategory: 3,
          previousAnchors: [],
          previousPalettes: paletteSummary ? [{ summary: paletteSummary, source: 'migrated', blockedBecause: 'previously-shipped-palette' }] : [],
          previousMotionSignatures: [],
          previousTypographyChoices: typographySummary ? [{ summary: typographySummary, source: 'migrated', blockedBecause: 'previously-shipped-typography-trio' }] : [],
        },
      },
    },
  };
}

function setUpTemporaryProject({ designIntentContract, files = {} }) {
  const projectRoot = mkdtempSync(join(tmpdir(), 'typography-palette-anti-repeat-audit-'));
  const docsDirectory = join(projectRoot, 'docs');
  mkdirSync(docsDirectory, { recursive: true });
  if (designIntentContract !== null) {
    writeFileSync(join(docsDirectory, 'design-intent.json'), JSON.stringify(designIntentContract, null, 2), 'utf8');
  }
  for (const [relativeFilePath, fileContent] of Object.entries(files)) {
    const absoluteFilePath = join(projectRoot, relativeFilePath);
    mkdirSync(join(absoluteFilePath, '..'), { recursive: true });
    writeFileSync(absoluteFilePath, fileContent, 'utf8');
  }
  return projectRoot;
}

test('Typography Palette Anti-Repeat Audit', async (t) => {
  await t.test('flags exact font-family matches as blocking typography violations', () => {
    const projectRoot = setUpTemporaryProject({
      designIntentContract: buildDesignIntentWithLedger({
        typographySummary: 'display: Display-Family-A; body: Body-Family-B; mono: Mono-Family-C',
      }),
      files: {
        'src/styles/globals.css': [
          ':root {',
          "  --font-display: 'Display-Family-A', sans-serif;",
          '}',
          'body {',
          "  font-family: 'Body-Family-B', system-ui, sans-serif;",
          '}',
        ].join('\n'),
      },
    });
    try {
      const auditReport = runTypographyPaletteAntiRepeatAudit({ repositoryRootPath: projectRoot });
      assert.equal(auditReport.skipped, false);
      assert.equal(auditReport.passed, false);
      assert.equal(auditReport.typographyViolationCount, 1);
      const violation = auditReport.typographyViolations[0];
      assert.equal(violation.diagnosticCode, 'BOUNDARY_TYPOGRAPHY_LEDGER_VIOLATION');
      assert.equal(violation.severity, 'blocking');
      assert.match(violation.detail, /body-family-b/i);
      assert.match(violation.file, /globals\.css$/);
    } finally {
      rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  await t.test('passes when CSS uses fonts not in the ledger', () => {
    const projectRoot = setUpTemporaryProject({
      designIntentContract: buildDesignIntentWithLedger({
        typographySummary: 'display: Old-Family-X; body: Old-Family-Y',
      }),
      files: {
        'src/styles/theme.css': "body { font-family: 'Fresh-Family-Z', sans-serif; }",
      },
    });
    try {
      const auditReport = runTypographyPaletteAntiRepeatAudit({ repositoryRootPath: projectRoot });
      assert.equal(auditReport.skipped, false);
      assert.equal(auditReport.passed, true);
      assert.equal(auditReport.typographyViolationCount, 0);
    } finally {
      rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  await t.test('reports OKLCH near-matches as blocking palette violations by default', () => {
    const projectRoot = setUpTemporaryProject({
      designIntentContract: buildDesignIntentWithLedger({
        paletteSummary: 'surface: oklch(0.95 0.02 240); accent: oklch(0.65 0.18 30)',
      }),
      files: {
        // First color is within the default 0.04 distance of the ledger surface;
        // second is far enough away to be treated as fresh.
        'src/styles/tokens.css': [
          ':root {',
          '  --surface: oklch(0.951 0.022 241);',
          '  --accent-fresh: oklch(0.40 0.05 120);',
          '}',
        ].join('\n'),
      },
    });
    try {
      const auditReport = runTypographyPaletteAntiRepeatAudit({ repositoryRootPath: projectRoot });
      assert.equal(auditReport.skipped, false);
      assert.equal(auditReport.paletteSeverity, 'blocking');
      assert.equal(auditReport.paletteDiagnosticCode, 'BOUNDARY_PALETTE_LEDGER_VIOLATION');
      assert.equal(auditReport.passed, false);
      assert.equal(auditReport.typographyViolationCount, 0);
      assert.equal(auditReport.paletteFindingCount >= 1, true);
      const finding = auditReport.paletteFindings[0];
      assert.equal(finding.severity, 'blocking');
      assert.equal(finding.diagnosticCode, 'BOUNDARY_PALETTE_LEDGER_VIOLATION');
      assert.match(finding.detail, /OKLCH/);
    } finally {
      rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  await t.test('reports hex matches as blocking palette violations by default', () => {
    const projectRoot = setUpTemporaryProject({
      designIntentContract: buildDesignIntentWithLedger({
        paletteSummary: 'brand: #336699',
      }),
      files: {
        'tailwind.config.js': "module.exports = { theme: { colors: { brand: '#336699' } } };",
      },
    });
    try {
      const auditReport = runTypographyPaletteAntiRepeatAudit({ repositoryRootPath: projectRoot });
      assert.equal(auditReport.skipped, false);
      assert.equal(auditReport.passed, false);
      assert.equal(auditReport.paletteFindingCount >= 1, true);
      assert.equal(auditReport.paletteSeverity, 'blocking');
      assert.equal(auditReport.paletteDiagnosticCode, 'BOUNDARY_PALETTE_LEDGER_VIOLATION');
    } finally {
      rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  await t.test('treatPaletteAsAdvisory opt-out keeps palette findings non-blocking', () => {
    const projectRoot = setUpTemporaryProject({
      designIntentContract: buildDesignIntentWithLedger({
        paletteSummary: 'brand: #336699',
      }),
      files: {
        'tailwind.config.js': "module.exports = { theme: { colors: { brand: '#336699' } } };",
      },
    });
    try {
      const auditReport = runTypographyPaletteAntiRepeatAudit({
        repositoryRootPath: projectRoot,
        treatPaletteAsAdvisory: true,
      });
      assert.equal(auditReport.skipped, false);
      assert.equal(auditReport.passed, true);
      assert.equal(auditReport.paletteFindingCount >= 1, true);
      assert.equal(auditReport.paletteSeverity, 'advisory');
      assert.equal(auditReport.paletteDiagnosticCode, 'BOUNDARY_PALETTE_LEDGER_ADVISORY');
      const finding = auditReport.paletteFindings[0];
      assert.equal(finding.severity, 'advisory');
      assert.equal(finding.diagnosticCode, 'BOUNDARY_PALETTE_LEDGER_ADVISORY');
    } finally {
      rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  await t.test('skips cleanly when docs/design-intent.json is missing', () => {
    const projectRoot = setUpTemporaryProject({ designIntentContract: null });
    try {
      const auditReport = runTypographyPaletteAntiRepeatAudit({ repositoryRootPath: projectRoot });
      assert.equal(auditReport.skipped, true);
      assert.equal(auditReport.passed, true);
      assert.equal(auditReport.reason, 'design-intent-file-absent');
    } finally {
      rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  await t.test('skips cleanly when researchDossier ledger is absent', () => {
    const projectRoot = setUpTemporaryProject({
      designIntentContract: { mode: 'dynamic', status: 'active' },
    });
    try {
      const auditReport = runTypographyPaletteAntiRepeatAudit({ repositoryRootPath: projectRoot });
      assert.equal(auditReport.skipped, true);
      assert.equal(auditReport.reason, 'anti-repeat-ledger-absent');
    } finally {
      rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
