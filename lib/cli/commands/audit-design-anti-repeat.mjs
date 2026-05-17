// @ts-check

/**
 * `agentic-senior-core audit:design-anti-repeat`
 *
 * User-facing CLI subcommand that runs the typography/palette anti-repeat
 * audit against a user project's working directory. The default scan root is
 * `process.cwd()` so `npx @ryuenn3123/agentic-senior-core audit:design-anti-repeat`
 * inside a user project scans that project (not the package install).
 *
 * Skip behavior is friendly: missing design-intent.json or missing ledger
 * print actionable next steps and exit 0. Typography violations and palette
 * findings (when palette is blocking, which is the default) exit 1.
 */

import { resolve } from 'node:path';

import { runTypographyPaletteAntiRepeatAudit } from '../audits/typography-palette-anti-repeat-audit.mjs';

const HELP_TEXT_LINES = [
  'agentic-senior-core audit:design-anti-repeat',
  '',
  'Scan CSS, SCSS, SASS, LESS, and Tailwind/theme/design-token config files in',
  'the current project for typography or palette values that match the',
  'anti-repeat ledger in docs/design-intent.json. Catches redesigns that leak',
  "the previous direction's font trio or palette through CSS implementation",
  'even when the JSON design contract claims a fresh anchor.',
  '',
  'Usage:',
  '  agentic-senior-core audit:design-anti-repeat',
  '  agentic-senior-core audit:design-anti-repeat [target-directory]',
  '  agentic-senior-core audit:design-anti-repeat --json',
  '  agentic-senior-core audit:design-anti-repeat --palette-advisory',
  '  agentic-senior-core audit:design-anti-repeat --threshold 0.05',
  '',
  'Defaults:',
  '  Target directory:    current working directory',
  '  Typography matches:  blocking (BOUNDARY_TYPOGRAPHY_LEDGER_VIOLATION)',
  '  Palette matches:     blocking (BOUNDARY_PALETTE_LEDGER_VIOLATION)',
  '  OKLCH distance:      0.04 in L*C*H space',
  '',
  'Options:',
  '  --json               Print the full report as JSON only (no human summary).',
  '  --palette-advisory   Opt out of blocking palette severity. Findings still',
  '                       print but do not fail the run. Typography stays blocking.',
  '  --threshold <num>    Override the OKLCH perceptual distance threshold.',
  '                       Higher values are more permissive.',
  '  --help               Show this help.',
  '',
  'Skip behavior (exit 0):',
  '  - docs/design-intent.json absent. Run `npx @ryuenn3123/agentic-senior-core init`',
  '    in a fresh project, or `... upgrade` in an existing project to seed the',
  '    design contract.',
  '  - docs/design-intent.json present but researchDossier metadata absent.',
  "    Run `... upgrade` to migrate the contract, then run `.agent-context/prompts/research-design.md`",
  '    so the dossier and anti-repeat ledger get populated before the next UI work.',
  '',
  'Exit codes:',
  '  0 = no blocking violations (or audit skipped with a friendly note).',
  '  1 = at least one BOUNDARY_TYPOGRAPHY_LEDGER_VIOLATION or, in default mode,',
  '      BOUNDARY_PALETTE_LEDGER_VIOLATION.',
];

function buildHelpText() {
  return HELP_TEXT_LINES.join('\n');
}

function readNumericFlag(commandLineArgs, flagName) {
  const flagIndex = commandLineArgs.indexOf(flagName);
  if (flagIndex === -1) {
    return null;
  }
  const flagValue = commandLineArgs[flagIndex + 1];
  if (typeof flagValue !== 'string' || flagValue.length === 0) {
    return null;
  }
  const numericValue = Number(flagValue);
  return Number.isFinite(numericValue) ? numericValue : null;
}

const VALUE_FLAGS = new Set(['--threshold']);

function extractTargetDirectoryArgument(commandLineArgs) {
  for (let argumentIndex = 0; argumentIndex < commandLineArgs.length; argumentIndex += 1) {
    const candidateArgument = commandLineArgs[argumentIndex];
    if (VALUE_FLAGS.has(candidateArgument)) {
      argumentIndex += 1;
      continue;
    }
    if (!candidateArgument.startsWith('--')) {
      return candidateArgument;
    }
  }
  return null;
}

function buildSkipMessage(reason) {
  if (reason === 'design-intent-file-absent') {
    return [
      'Audit skipped: docs/design-intent.json is missing.',
      'Next step:',
      '  - Fresh project: run `npx @ryuenn3123/agentic-senior-core init` to seed the design contract.',
      '  - Existing project: run `npx @ryuenn3123/agentic-senior-core upgrade` to seed it without touching app code.',
      'Then re-run this audit.',
    ];
  }
  if (reason === 'anti-repeat-ledger-absent') {
    return [
      'Audit skipped: docs/design-intent.json is present but researchDossier metadata is absent.',
      'Next step:',
      '  - Run `npx @ryuenn3123/agentic-senior-core upgrade` to migrate the contract; the upgrade injects',
      '    `researchDossier.metadata` and seeds the anti-repeat ledger from existing anchor, palette,',
      '    motion, and typography fields without overwriting them.',
      "  - Then run the design-research dossier prompt at `.agent-context/prompts/research-design.md`",
      '    so the ledger and `researchVerifiedAt` get populated before the next UI work.',
      'After that, re-run this audit to enforce the ledger against your CSS.',
    ];
  }
  if (typeof reason === 'string' && reason.startsWith('design-intent-file-not-valid-json')) {
    return [
      'Audit skipped: docs/design-intent.json is present but cannot be parsed as JSON.',
      `  ${reason}`,
      'Next step: fix the JSON syntax, then re-run this audit.',
    ];
  }
  return [`Audit skipped: ${reason || 'unknown reason'}`];
}

function printHumanReport(auditReport) {
  console.log('===============================================');
  console.log('  audit:design-anti-repeat');
  console.log('===============================================');
  console.log(`  Target directory:            ${auditReport.targetDirectoryPath}`);
  console.log(`  Files scanned:               ${auditReport.filesScanned}`);
  console.log(`  Typography violations:       ${auditReport.typographyViolationCount} (blocking)`);
  console.log(`  Palette findings:            ${auditReport.paletteFindingCount} (${auditReport.paletteSeverity})`);
  console.log(`  OKLCH distance threshold:    ${auditReport.oklchDistanceThreshold}`);
  console.log('');

  if (auditReport.skipped) {
    for (const skipLine of buildSkipMessage(auditReport.reason)) {
      console.log(`  ${skipLine}`);
    }
    return;
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
    return;
  }

  const blockingPaletteCount = auditReport.paletteSeverity === 'blocking' ? auditReport.paletteFindingCount : 0;
  console.log(`  ${auditReport.typographyViolationCount} typography violation(s) and ${blockingPaletteCount} palette violation(s) found; release blocked.`);
}

export async function runDesignAntiRepeatAuditCommand(commandLineArgs = []) {
  if (commandLineArgs.includes('--help') || commandLineArgs.includes('-h')) {
    console.log(buildHelpText());
    return 0;
  }

  const shouldOutputJsonOnly = commandLineArgs.includes('--json');
  const shouldTreatPaletteAsAdvisory = commandLineArgs.includes('--palette-advisory');
  const oklchDistanceThreshold = readNumericFlag(commandLineArgs, '--threshold');
  const targetDirectoryArgument = extractTargetDirectoryArgument(commandLineArgs);
  const targetDirectoryPath = resolve(targetDirectoryArgument || process.cwd());

  const auditReport = runTypographyPaletteAntiRepeatAudit({
    repositoryRootPath: targetDirectoryPath,
    treatPaletteAsAdvisory: shouldTreatPaletteAsAdvisory,
    ...(typeof oklchDistanceThreshold === 'number' ? { oklchDistanceThreshold } : {}),
  });
  const auditReportWithRoot = { ...auditReport, targetDirectoryPath };

  if (shouldOutputJsonOnly) {
    process.stdout.write(`${JSON.stringify(auditReportWithRoot, null, 2)}\n`);
    return auditReportWithRoot.passed ? 0 : 1;
  }

  printHumanReport(auditReportWithRoot);
  return auditReportWithRoot.passed ? 0 : 1;
}
