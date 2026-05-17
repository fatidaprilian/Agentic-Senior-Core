// @ts-check

/**
 * Typography and palette anti-repeat audit.
 *
 * Scans CSS-like files for font-family declarations and color values, then
 * cross-checks them against
 * `docs/design-intent.json`'s
 * `researchDossier.metadata.antiRepeatLedger.previousTypographyChoices` and
 * `previousPalettes` so a redesign cannot leak the previous direction's
 * exact font trio or perceptually-identical palette colors through CSS
 * implementation files alone.
 *
 * Severity model:
 *   - Typography matches are EXACT family-name matches and are always
 *     blocking (kind: typography.previously-shipped-family,
 *     diagnosticCode: BOUNDARY_TYPOGRAPHY_LEDGER_VIOLATION).
 *   - Palette matches are HEURISTIC. OKLCH-to-OKLCH distance is perceptually
 *     uniform (deltaE < threshold => match). Hex-to-hex matches are exact
 *     normalized equality. Cross-type matches (hex declared in CSS vs OKLCH
 *     in the ledger, or vice versa) are NOT performed; reporting cross-type
 *     would require a color-space conversion that is its own correctness
 *     surface (tracked in docs/deep-analysis-and-roadmap-backlog.md).
 *   - Palette findings BLOCK by default with kind:
 *     palette.previously-shipped-color and diagnosticCode:
 *     BOUNDARY_PALETTE_LEDGER_VIOLATION. Pass
 *     `treatPaletteAsAdvisory: true` (or `--palette-advisory` on the CLI)
 *     to opt a project into advisory-only palette reporting; severity drops
 *     to "advisory" and the diagnostic code becomes
 *     BOUNDARY_PALETTE_LEDGER_ADVISORY. Use the advisory mode only when a
 *     project knowingly accepts the false-positive risk of OKLCH distance
 *     matching at its chosen threshold.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import {
  collectScannableFilePaths,
  lineNumberFromIndex,
} from './typography-palette-anti-repeat/file-scanner.mjs';
import {
  extractFontFamiliesFromText,
  extractLedgerTypographyFamilies,
} from './typography-palette-anti-repeat/typography-utils.mjs';
import {
  extractColorOccurrencesFromText,
  extractLedgerColors,
  oklchPerceptualDistance,
} from './typography-palette-anti-repeat/color-utils.mjs';

const DEFAULT_OKLCH_DISTANCE_THRESHOLD = 0.04;

function findTypographyViolationsForFile({ relativeFilePath, sourceText, ledgerFamilies }) {
  const violations = [];
  const fontFamilyOccurrences = extractFontFamiliesFromText(sourceText);
  for (const familyOccurrence of fontFamilyOccurrences) {
    const ledgerEntry = ledgerFamilies.get(familyOccurrence.family);
    if (!ledgerEntry) {
      continue;
    }
    violations.push({
      file: relativeFilePath,
      line: lineNumberFromIndex(sourceText, familyOccurrence.index),
      kind: 'typography.previously-shipped-family',
      severity: 'blocking',
      diagnosticCode: 'BOUNDARY_TYPOGRAPHY_LEDGER_VIOLATION',
      detail: `CSS declares font-family "${familyOccurrence.family}" which appears in researchDossier.metadata.antiRepeatLedger.previousTypographyChoices ("${ledgerEntry.summary}"). Either escape the previously-shipped trio, or set derivedTokenLogic.tokenContinuityClassification.typography to continuity-retained with explicit rationale.`,
    });
  }
  return violations;
}

function buildHexAdvisory({ relativeFilePath, sourceText, colorOccurrence, ledgerColor, paletteSeverity, paletteDiagnosticCode }) {
  return {
    file: relativeFilePath,
    line: lineNumberFromIndex(sourceText, colorOccurrence.index),
    kind: 'palette.previously-shipped-color',
    severity: paletteSeverity,
    diagnosticCode: paletteDiagnosticCode,
    detail: `CSS hex "${colorOccurrence.raw}" matches a hex color in researchDossier.metadata.antiRepeatLedger.previousPalettes ("${ledgerColor.sourceEntry.summary}"). Either escape the previously-shipped palette or set derivedTokenLogic.tokenContinuityClassification.palette to continuity-retained with explicit rationale.`,
  };
}

function buildOklchAdvisory({ relativeFilePath, sourceText, colorOccurrence, ledgerColor, perceptualDistance, oklchDistanceThreshold, paletteSeverity, paletteDiagnosticCode }) {
  return {
    file: relativeFilePath,
    line: lineNumberFromIndex(sourceText, colorOccurrence.index),
    kind: 'palette.previously-shipped-color',
    severity: paletteSeverity,
    diagnosticCode: paletteDiagnosticCode,
    detail: `CSS OKLCH "${colorOccurrence.raw}" is within ${perceptualDistance.toFixed(4)} of an OKLCH color in researchDossier.metadata.antiRepeatLedger.previousPalettes ("${ledgerColor.sourceEntry.summary}") (threshold ${oklchDistanceThreshold}). Heuristic match on perceptually-uniform OKLCH distance; either escape the previously-shipped palette, raise the threshold via --threshold, or set derivedTokenLogic.tokenContinuityClassification.palette to continuity-retained with explicit rationale.`,
  };
}

function findPaletteFindingsForFile({ relativeFilePath, sourceText, ledgerColors, oklchDistanceThreshold, paletteSeverity, paletteDiagnosticCode }) {
  const findings = [];
  const colorOccurrences = extractColorOccurrencesFromText(sourceText);
  for (const colorOccurrence of colorOccurrences) {
    for (const ledgerColor of ledgerColors) {
      if (colorOccurrence.kind === 'hex' && ledgerColor.kind === 'hex') {
        if (
          colorOccurrence.normalized
          && ledgerColor.normalized
          && colorOccurrence.normalized === ledgerColor.normalized
        ) {
          findings.push(buildHexAdvisory({
            relativeFilePath, sourceText, colorOccurrence, ledgerColor,
            paletteSeverity, paletteDiagnosticCode,
          }));
        }
        continue;
      }
      if (colorOccurrence.kind === 'oklch' && ledgerColor.kind === 'oklch' && colorOccurrence.oklch && ledgerColor.oklch) {
        const perceptualDistance = oklchPerceptualDistance(colorOccurrence.oklch, ledgerColor.oklch);
        if (perceptualDistance <= oklchDistanceThreshold) {
          findings.push(buildOklchAdvisory({
            relativeFilePath, sourceText, colorOccurrence, ledgerColor, perceptualDistance, oklchDistanceThreshold,
            paletteSeverity, paletteDiagnosticCode,
          }));
        }
      }
      // Cross-type (hex declared vs OKLCH ledger or vice versa) is intentionally
      // skipped here; reporting cross-type would require a color-space conversion
      // pass that is its own correctness surface. Tracked in
      // docs/deep-analysis-and-roadmap-backlog.md.
    }
  }
  return findings;
}

function loadDesignIntentContract(repositoryRootPath, designIntentRelativePath) {
  const designIntentAbsolutePath = join(repositoryRootPath, designIntentRelativePath);
  if (!existsSync(designIntentAbsolutePath)) {
    return { contract: null, reason: 'design-intent-file-absent' };
  }
  let contract;
  try {
    contract = JSON.parse(readFileSync(designIntentAbsolutePath, 'utf8'));
  } catch (parseError) {
    const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
    return { contract: null, reason: `design-intent-file-not-valid-json: ${errorMessage}` };
  }
  return { contract, reason: 'ok' };
}

function buildSkippedReport(reportShell, reason) {
  return {
    ...reportShell,
    passed: true,
    skipped: true,
    reason,
    filesScanned: 0,
    typographyViolationCount: 0,
    paletteFindingCount: 0,
    typographyViolations: [],
    paletteFindings: [],
  };
}

/**
 * Runs the typography and palette anti-repeat audit.
 *
 * @param {object} [auditOptions]
 * @param {string} [auditOptions.repositoryRootPath]
 * @param {string[]} [auditOptions.scanRoots]
 * @param {string} [auditOptions.designIntentRelativePath]
 * @param {number} [auditOptions.oklchDistanceThreshold]
 * @param {boolean} [auditOptions.treatPaletteAsAdvisory]
 */
export function runTypographyPaletteAntiRepeatAudit(auditOptions = {}) {
  const repositoryRootPath = auditOptions.repositoryRootPath || process.cwd();
  const scanRoots = Array.isArray(auditOptions.scanRoots) && auditOptions.scanRoots.length > 0
    ? auditOptions.scanRoots
    : ['.'];
  const designIntentRelativePath = auditOptions.designIntentRelativePath || 'docs/design-intent.json';
  const oklchDistanceThreshold = typeof auditOptions.oklchDistanceThreshold === 'number'
    ? auditOptions.oklchDistanceThreshold
    : DEFAULT_OKLCH_DISTANCE_THRESHOLD;
  const treatPaletteAsAdvisory = auditOptions.treatPaletteAsAdvisory === true;
  const paletteSeverity = treatPaletteAsAdvisory ? 'advisory' : 'blocking';
  const paletteDiagnosticCode = treatPaletteAsAdvisory
    ? 'BOUNDARY_PALETTE_LEDGER_ADVISORY'
    : 'BOUNDARY_PALETTE_LEDGER_VIOLATION';

  const reportShell = {
    auditName: 'audit-typography-palette-anti-repeat',
    reportVersion: '2.0.0',
    generatedAt: new Date().toISOString(),
    designIntentRelativePath,
    paletteSeverity,
    paletteDiagnosticCode,
    oklchDistanceThreshold,
    scope: {
      typographyMatching: 'exact-family-name-after-normalization',
      paletteHexMatching: 'exact-hex-after-7-digit-normalization',
      paletteOklchMatching: 'l*c*h-distance-under-threshold',
      paletteCrossTypeMatching: 'not-supported-color-conversion-out-of-scope',
      paletteCrossTypeMatchingTrackedIn: 'docs/deep-analysis-and-roadmap-backlog.md',
    },
  };

  const designIntentLoad = loadDesignIntentContract(repositoryRootPath, designIntentRelativePath);
  if (!designIntentLoad.contract) {
    return buildSkippedReport(reportShell, designIntentLoad.reason);
  }

  const antiRepeatLedger = designIntentLoad.contract?.researchDossier?.metadata?.antiRepeatLedger;
  if (!antiRepeatLedger || typeof antiRepeatLedger !== 'object') {
    return buildSkippedReport(reportShell, 'anti-repeat-ledger-absent');
  }

  const ledgerFamilies = extractLedgerTypographyFamilies(antiRepeatLedger);
  const ledgerColors = extractLedgerColors(antiRepeatLedger);
  const scannableFilePaths = collectScannableFilePaths(repositoryRootPath, scanRoots);

  /** @type {any[]} */
  const typographyViolations = [];
  /** @type {any[]} */
  const paletteFindings = [];

  for (const absoluteFilePath of scannableFilePaths) {
    const relativeFilePath = relative(repositoryRootPath, absoluteFilePath).replace(/\\/g, '/');
    let sourceText;
    try {
      sourceText = readFileSync(absoluteFilePath, 'utf8');
    } catch {
      continue;
    }
    if (ledgerFamilies.size > 0) {
      typographyViolations.push(...findTypographyViolationsForFile({
        relativeFilePath, sourceText, ledgerFamilies,
      }));
    }
    if (ledgerColors.length > 0) {
      paletteFindings.push(...findPaletteFindingsForFile({
        relativeFilePath, sourceText, ledgerColors, oklchDistanceThreshold,
        paletteSeverity, paletteDiagnosticCode,
      }));
    }
  }

  const blockingViolationCount = typographyViolations.length + (treatPaletteAsAdvisory ? 0 : paletteFindings.length);

  return {
    ...reportShell,
    passed: blockingViolationCount === 0,
    skipped: false,
    filesScanned: scannableFilePaths.length,
    typographyViolationCount: typographyViolations.length,
    paletteFindingCount: paletteFindings.length,
    typographyViolations,
    paletteFindings,
  };
}
