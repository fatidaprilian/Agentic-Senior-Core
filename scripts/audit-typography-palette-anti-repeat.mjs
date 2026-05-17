#!/usr/bin/env node
// @ts-check

/**
 * audit-typography-palette-anti-repeat.mjs
 *
 * Thin CLI wrapper around lib/cli/audits/typography-palette-anti-repeat-audit.mjs.
 * The wrapper defaults to scanning the current working directory so it works
 * for both repo-internal `npm run audit:typography-palette-anti-repeat` (npm
 * sets cwd to the repo root) and direct invocation from a user project. The
 * user-facing entry point is the `audit:design-anti-repeat` subcommand on
 * the published bin (see lib/cli/commands/audit-design-anti-repeat.mjs).
 *
 * Usage:
 *   node scripts/audit-typography-palette-anti-repeat.mjs
 *   node scripts/audit-typography-palette-anti-repeat.mjs --json
 *   node scripts/audit-typography-palette-anti-repeat.mjs --palette-advisory
 *   node scripts/audit-typography-palette-anti-repeat.mjs --threshold 0.05
 *   node scripts/audit-typography-palette-anti-repeat.mjs --root /path/to/project
 *
 * Default severity:
 *   - Typography matches always block.
 *   - Palette matches block by default. Pass --palette-advisory to opt a
 *     project into advisory-only palette reporting (release stays unblocked
 *     by palette findings; typography still blocks).
 *
 * Exit codes:
 *   0 = no blocking violations
 *   1 = at least one BOUNDARY_TYPOGRAPHY_LEDGER_VIOLATION or, in default
 *       mode, BOUNDARY_PALETTE_LEDGER_VIOLATION
 */

import { resolve } from 'node:path';

import { runTypographyPaletteAntiRepeatAudit } from '../lib/cli/audits/typography-palette-anti-repeat-audit.mjs';

const COMMAND_LINE_ARGS = process.argv.slice(2);
const SHOULD_OUTPUT_JSON_ONLY = COMMAND_LINE_ARGS.includes('--json');
const SHOULD_TREAT_PALETTE_AS_ADVISORY = COMMAND_LINE_ARGS.includes('--palette-advisory');

function readStringFlag(flagName) {
  const flagIndex = COMMAND_LINE_ARGS.indexOf(flagName);
  if (flagIndex === -1) {
    return null;
  }
  const flagValue = COMMAND_LINE_ARGS[flagIndex + 1];
  if (typeof flagValue !== 'string' || flagValue.length === 0 || flagValue.startsWith('--')) {
    return null;
  }
  return flagValue;
}

function readNumericFlag(flagName) {
  const stringValue = readStringFlag(flagName);
  if (stringValue === null) {
    return null;
  }
  const numericValue = Number(stringValue);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function main() {
  const oklchDistanceThreshold = readNumericFlag('--threshold');
  const explicitRootPath = readStringFlag('--root');
  const repositoryRootPath = resolve(explicitRootPath || process.cwd());

  const auditReport = runTypographyPaletteAntiRepeatAudit({
    repositoryRootPath,
    treatPaletteAsAdvisory: SHOULD_TREAT_PALETTE_AS_ADVISORY,
    ...(typeof oklchDistanceThreshold === 'number' ? { oklchDistanceThreshold } : {}),
  });

  if (SHOULD_OUTPUT_JSON_ONLY) {
    process.stdout.write(`${JSON.stringify({ ...auditReport, repositoryRootPath }, null, 2)}\n`);
    process.exit(auditReport.passed ? 0 : 1);
  }

  console.log('===============================================');
  console.log('  audit:typography-palette-anti-repeat');
  console.log('===============================================');
  console.log(`  Target directory:            ${repositoryRootPath}`);
  console.log(`  Files scanned:               ${auditReport.filesScanned}`);
  console.log(`  Typography violations:       ${auditReport.typographyViolationCount} (blocking)`);
  console.log(`  Palette findings:            ${auditReport.paletteFindingCount} (${auditReport.paletteSeverity})`);
  console.log(`  OKLCH distance threshold:    ${auditReport.oklchDistanceThreshold}`);
  console.log('');

  if (auditReport.skipped) {
    console.log(`  Audit skipped: ${auditReport.reason}`);
    process.exit(0);
  }

  if (auditReport.typographyViolations.length > 0) {
    console.log('  Typography violations (blocking):');
    for (const violation of auditReport.typographyViolations) {
      console.log(`    [${violation.kind}] ${violation.file}:${violation.line} ${violation.detail}`);
    }
    console.log('');
  }

  if (auditReport.paletteFindings.length > 0) {
    console.log(`  Palette findings (${auditReport.paletteSeverity}):`);
    for (const finding of auditReport.paletteFindings) {
      console.log(`    [${finding.kind}] ${finding.file}:${finding.line} ${finding.detail}`);
    }
    console.log('');
  }

  if (auditReport.passed) {
    console.log('  No blocking violations against the anti-repeat ledger.');
    process.exit(0);
  }
  const blockingPaletteCount = auditReport.paletteSeverity === 'blocking' ? auditReport.paletteFindingCount : 0;
  console.log(`  ${auditReport.typographyViolationCount} typography violation(s) and ${blockingPaletteCount} palette violation(s) found; release blocked.`);
  process.exit(1);
}

if (process.argv[1] && (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('audit-typography-palette-anti-repeat.mjs'))) {
  main();
}
