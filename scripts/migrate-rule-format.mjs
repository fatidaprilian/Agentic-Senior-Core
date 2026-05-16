#!/usr/bin/env node
// @ts-check

/**
 * scripts/migrate-rule-format.mjs
 *
 * Phase 1 Task 1.2 migration helper. Converts a legacy v3 rule file into the
 * canonical v4 format defined in docs/plan/format-spec.md. Output is written
 * to a `.candidate.md` sibling so the human migrator can review the diff
 * before replacing the original.
 *
 * Usage:
 *   node scripts/migrate-rule-format.mjs <path-to-rule-file>
 *   node scripts/migrate-rule-format.mjs <path> --json
 *   node scripts/migrate-rule-format.mjs <path> --apply
 *
 * Flags:
 *   --json    Print the structured report to stdout (JSON only, no human prose).
 *   --apply   Overwrite the source file with the rendered v4 content. Default
 *             behavior writes a .candidate.md file and leaves the source alone.
 *
 * The helper does not commit, does not stage, and does not call any network.
 *
 * Exit codes:
 *   0 — rendered cleanly + roundtrip overlap >= 95%
 *   1 — roundtrip overlap below threshold OR parser warnings present
 *   2 — input path missing or filename not in the locked prefix table
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { countTokens } from '../benchmarks/token-usage/lib/token-counter.mjs';
import { getPrefixEntry } from './migrate-rule-format/id-prefix-table.mjs';
import { parseLegacyRuleFile } from './migrate-rule-format/parse-legacy.mjs';
import { renderNewFormat } from './migrate-rule-format/render-new.mjs';
import { roundtripSubstanceCheck } from './migrate-rule-format/roundtrip-validate.mjs';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_FILE_PATH), '..');

/**
 * @param {string} ruleFileAbsolutePath
 * @returns {Promise<{
 *   sourcePath: string,
 *   filename: string,
 *   prefix: string,
 *   sectionAssignments: Array<{ sectionTitle: string, sectionId: string, itemCount: number }>,
 *   warnings: string[],
 *   roundtrip: ReturnType<typeof roundtripSubstanceCheck>,
 *   tokenSavings: { original: number, rendered: number, deltaPercent: number },
 *   candidatePath: string,
 *   rendered: string,
 * }>}
 */
export async function migrateOneRuleFile(ruleFileAbsolutePath) {
  const filename = basename(ruleFileAbsolutePath);
  const prefixEntry = getPrefixEntry(filename);
  const originalSource = readFileSync(ruleFileAbsolutePath, 'utf8');
  const parsed = parseLegacyRuleFile(originalSource);
  const { rendered, sectionAssignments, warnings } = renderNewFormat(prefixEntry, parsed);
  const roundtrip = roundtripSubstanceCheck(originalSource, rendered);

  const originalTokenCount = await countTokens(originalSource, 'openai', 'gpt-4o-2024-08-06');
  const renderedTokenCount = await countTokens(rendered, 'openai', 'gpt-4o-2024-08-06');
  const tokenSavings = {
    original: originalTokenCount.token_count,
    rendered: renderedTokenCount.token_count,
    deltaPercent: Math.round(
      ((renderedTokenCount.token_count - originalTokenCount.token_count) / originalTokenCount.token_count) * 10000,
    ) / 100,
  };

  const candidatePath = ruleFileAbsolutePath.replace(/\.md$/, '.candidate.md');

  return {
    sourcePath: ruleFileAbsolutePath,
    filename,
    prefix: prefixEntry.prefix,
    sectionAssignments,
    warnings,
    roundtrip,
    tokenSavings,
    candidatePath,
    rendered,
  };
}

function formatHumanReport(report) {
  const lines = [];
  lines.push('=================================================');
  lines.push(`  migrate-rule-format: ${report.filename}`);
  lines.push('=================================================');
  lines.push(`  Prefix         : ${report.prefix}`);
  lines.push(`  Section count  : ${report.sectionAssignments.length}`);
  lines.push(`  Token (orig)   : ${report.tokenSavings.original}`);
  lines.push(`  Token (new)    : ${report.tokenSavings.rendered}`);
  const sign = report.tokenSavings.deltaPercent <= 0 ? '' : '+';
  lines.push(`  Token delta    : ${sign}${report.tokenSavings.deltaPercent}%`);
  lines.push(`  Roundtrip      : ${report.roundtrip.passed ? 'PASS' : 'FAIL'} (${report.roundtrip.overlapPercent}% overlap, min ${report.roundtrip.minimumRequired}%)`);
  lines.push('');

  lines.push('  Sections assigned:');
  for (const assignment of report.sectionAssignments) {
    lines.push(`    ${assignment.sectionId.padEnd(12)} ${assignment.itemCount} items   ${assignment.sectionTitle}`);
  }
  lines.push('');

  if (report.warnings.length > 0) {
    lines.push('  Warnings:');
    for (const warning of report.warnings) {
      lines.push(`    ! ${warning}`);
    }
    lines.push('');
  }

  if (report.roundtrip.lostWords.length > 0) {
    lines.push(`  Substantial words present in original, missing in rendered (${report.roundtrip.lostWords.length} of distinct):`);
    for (const word of report.roundtrip.lostWords.slice(0, 30)) {
      lines.push(`    - ${word}`);
    }
    if (report.roundtrip.lostWords.length > 30) {
      lines.push(`    ... ${report.roundtrip.lostWords.length - 30} more (see JSON report)`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

async function runCli() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    console.error('usage: node scripts/migrate-rule-format.mjs <path-to-rule-file> [--json] [--apply]');
    process.exit(2);
  }

  const inputPath = argv[0];
  const jsonMode = argv.includes('--json');
  const applyMode = argv.includes('--apply');
  const ruleFileAbsolutePath = resolve(REPOSITORY_ROOT, inputPath);

  let report;
  try {
    report = await migrateOneRuleFile(ruleFileAbsolutePath);
  } catch (migrationError) {
    if (jsonMode) {
      process.stdout.write(`${JSON.stringify({ passed: false, error: migrationError.message }, null, 2)}\n`);
    } else {
      console.error(`migrate-rule-format failed: ${migrationError.message}`);
    }
    process.exit(2);
  }

  if (applyMode) {
    writeFileSync(ruleFileAbsolutePath, report.rendered, 'utf8');
  } else {
    writeFileSync(report.candidatePath, report.rendered, 'utf8');
  }

  const exitCode = report.roundtrip.passed && report.warnings.length === 0 ? 0 : 1;

  if (jsonMode) {
    process.stdout.write(`${JSON.stringify({
      passed: report.roundtrip.passed,
      filename: report.filename,
      prefix: report.prefix,
      sectionCount: report.sectionAssignments.length,
      sectionAssignments: report.sectionAssignments,
      warnings: report.warnings,
      roundtrip: report.roundtrip,
      tokenSavings: report.tokenSavings,
      candidatePath: applyMode ? report.sourcePath : report.candidatePath,
      mode: applyMode ? 'apply' : 'candidate',
    }, null, 2)}\n`);
    process.exit(exitCode);
  }

  console.log(formatHumanReport(report));
  if (applyMode) {
    console.log(`  APPLIED in place: ${report.sourcePath}`);
  } else {
    console.log(`  Candidate written: ${report.candidatePath}`);
    console.log('  Review the diff, then re-run with --apply when satisfied.');
  }
  process.exit(exitCode);
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('migrate-rule-format.mjs')) {
  runCli();
}
