#!/usr/bin/env node
// @ts-check

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runRuleIdUniquenessAudit } from './audit-rule-id-uniqueness.mjs';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_FILE_PATH), '..');
const ARGS = new Set(process.argv.slice(2));
const JSON_ONLY = ARGS.has('--json');
const RULE_ID_PATTERN = /\b[A-Z]+-\d{3,4}(?:-[A-Z])?\b/g;

const REQUIRED_REFLECTION_SURFACES = [
  {
    path: 'AGENTS.md',
    requiredSnippets: [
      '## Bounded Reflection',
      'REFLECTION',
      'Rules:',
      'Risk:',
      'Action:',
      'valid rule IDs',
      'hidden chain-of-thought',
    ],
  },
  {
    path: '.agent-context/review-checklists/pr-checklist.md',
    requiredSnippets: [
      'Bounded Reflection',
      'valid rule IDs',
      'hidden chain-of-thought',
    ],
  },
];

function readSource(rootDir, relativePath, sourceOverrides) {
  if (sourceOverrides && Object.prototype.hasOwnProperty.call(sourceOverrides, relativePath)) {
    return String(sourceOverrides[relativePath]);
  }

  const absolutePath = join(rootDir, relativePath);
  if (!existsSync(absolutePath)) {
    return null;
  }

  return readFileSync(absolutePath, 'utf8');
}

function collectKnownRuleIds() {
  const ruleIdAudit = runRuleIdUniquenessAudit();
  const knownRuleIds = new Set();

  for (const fileEntry of ruleIdAudit.perFile || []) {
    for (const ruleId of fileEntry.knownSectionIdsInFile || []) {
      knownRuleIds.add(ruleId);
    }
  }

  return {
    ruleIdAudit,
    knownRuleIds,
  };
}

function collectRuleIdsFromSource(sourceText) {
  return Array.from(new Set(sourceText.match(RULE_ID_PATTERN) || [])).sort();
}

export function runReflectionCitationAudit(options = {}) {
  const rootDir = options.rootDir ? resolve(String(options.rootDir)) : REPOSITORY_ROOT;
  const sourceOverrides = options.sourceOverrides || null;
  const { ruleIdAudit, knownRuleIds } = collectKnownRuleIds();
  const violations = [];
  const surfaceReports = [];

  for (const surface of REQUIRED_REFLECTION_SURFACES) {
    const sourceText = readSource(rootDir, surface.path, sourceOverrides);
    if (sourceText === null) {
      violations.push({
        file: surface.path,
        kind: 'surface.missing',
        detail: 'Required reflection citation surface is missing.',
      });
      continue;
    }

    const missingSnippets = surface.requiredSnippets.filter((snippet) => !sourceText.includes(snippet));
    for (const missingSnippet of missingSnippets) {
      violations.push({
        file: surface.path,
        kind: 'reflection.snippet-missing',
        detail: `Missing required reflection snippet: ${missingSnippet}`,
      });
    }

    const citedRuleIds = collectRuleIdsFromSource(sourceText);
    const unknownRuleIds = citedRuleIds.filter((ruleId) => !knownRuleIds.has(ruleId));
    for (const unknownRuleId of unknownRuleIds) {
      violations.push({
        file: surface.path,
        kind: 'rule-id.unknown',
        detail: `Rule ID ${unknownRuleId} does not resolve to any canonical rule section.`,
      });
    }

    surfaceReports.push({
      path: surface.path,
      missingSnippetCount: missingSnippets.length,
      citedRuleIds,
      unknownRuleIds,
    });
  }

  return {
    auditName: 'audit-reflection-citations',
    reportVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    surfaceCount: REQUIRED_REFLECTION_SURFACES.length,
    knownRuleIdCount: knownRuleIds.size,
    ruleIdAuditPassed: ruleIdAudit.passed,
    violationCount: violations.length,
    passed: violations.length === 0,
    surfaces: surfaceReports,
    violations,
  };
}

function main() {
  const report = runReflectionCitationAudit();

  if (JSON_ONLY) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exit(report.passed ? 0 : 1);
  }

  console.log('===============================================');
  console.log('  audit:reflection-citations');
  console.log('===============================================');
  console.log(`  Reflection surfaces: ${report.surfaceCount}`);
  console.log(`  Known rule IDs:      ${report.knownRuleIdCount}`);
  console.log('');

  if (report.passed) {
    console.log('  Reflection citation surfaces are present and all cited rule IDs resolve.');
    process.stderr.write(`AUDIT_REFLECTION_CITATIONS_REPORT: ${JSON.stringify({ passed: true, surfaceCount: report.surfaceCount, knownRuleIdCount: report.knownRuleIdCount })}\n`);
    process.exit(0);
  }

  console.log('  Violations:');
  for (const violation of report.violations) {
    console.log(`    [${violation.kind}] ${violation.file}: ${violation.detail}`);
  }
  console.log('');
  console.log(`  ${report.violationCount} violation(s) found.`);
  process.stderr.write(`AUDIT_REFLECTION_CITATIONS_REPORT: ${JSON.stringify({ passed: false, violationCount: report.violationCount, kinds: [...new Set(report.violations.map((violation) => violation.kind))] })}\n`);
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('audit-reflection-citations.mjs')) {
  main();
}
