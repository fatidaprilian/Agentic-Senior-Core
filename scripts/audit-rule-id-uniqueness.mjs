#!/usr/bin/env node
// @ts-check

/**
 * audit-rule-id-uniqueness.mjs
 *
 * Phase 1 GATE B citability gate. Checks every migrated rule file under
 * `.agent-context/rules/` for:
 *
 *   1. YAML frontmatter parses and contains required keys (id_prefix, domain,
 *      priority, scope, applies_to, keywords).
 *   2. Section IDs match the file's locked id_prefix and are unique within
 *      the file.
 *   3. Every `[REF:<PREFIX>-NNN]` mention across the rules pack, prompts/,
 *      and review-checklists/ resolves to a real section ID.
 *   4. Every `related:` entry in any rule's frontmatter resolves to a real
 *      section ID.
 *   5. No ambiguous prose references (`see above`, `as noted earlier`,
 *      `the next section`, etc.) survive in any rule body.
 *
 * Files that have not been migrated yet (no YAML frontmatter) are skipped
 * with a notice. The audit only enforces shape on migrated files.
 *
 * Usage:
 *   node scripts/audit-rule-id-uniqueness.mjs            (human + report line)
 *   node scripts/audit-rule-id-uniqueness.mjs --json     (JSON only)
 *
 * Exit codes:
 *   0 — clean
 *   1 — at least one violation
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_FILE_PATH), '..');
const RULES_DIRECTORY = join(REPOSITORY_ROOT, '.agent-context', 'rules');
const PROMPTS_DIRECTORY = join(REPOSITORY_ROOT, '.agent-context', 'prompts');
const REVIEW_CHECKLISTS_DIRECTORY = join(REPOSITORY_ROOT, '.agent-context', 'review-checklists');

const ARGS = new Set(process.argv.slice(2));
const JSON_ONLY = ARGS.has('--json');

const RULE_ID_PATTERN = /\b([A-Z]+)-(\d{3,4})(?:-([A-Z]))?\b/;
const REF_PATTERN = /\[REF:([A-Z]+-\d{3,4}(?:-[A-Z])?)\]/g;
const SECTION_HEADING_PATTERN = /^##\s+([A-Z]+-\d{3,4}(?:-[A-Z])?):\s+(.+)$/;
const REQUIRED_FRONTMATTER_KEYS = ['id_prefix', 'domain', 'priority', 'scope', 'applies_to', 'keywords'];
const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n/;

const AMBIGUOUS_PROSE_REFERENCE_PATTERNS = [
  /\bsee above\b/i,
  /\bsee below\b/i,
  /\bas noted earlier\b/i,
  /\bas noted above\b/i,
  /\bas mentioned earlier\b/i,
  /\bas mentioned above\b/i,
  /\bin the previous section\b/i,
  /\bin the next section\b/i,
  /\bthe next section\b/i,
  /\bthe previous section\b/i,
  /\bsee earlier\b/i,
  /\bsee later\b/i,
];

function listRuleFiles() {
  return readdirSync(RULES_DIRECTORY)
    .filter((filename) => filename.endsWith('.md') && !filename.endsWith('.candidate.md'))
    .sort()
    .map((filename) => ({ filename, absolutePath: join(RULES_DIRECTORY, filename) }));
}

function parseFrontmatter(sourceText) {
  const match = sourceText.match(FRONTMATTER_PATTERN);
  if (!match) return null;
  try {
    return parseYaml(match[1]);
  } catch {
    return null;
  }
}

function extractSectionIds(sourceText) {
  const sectionIds = [];
  for (const line of sourceText.split(/\r?\n/)) {
    const match = line.match(SECTION_HEADING_PATTERN);
    if (match) {
      sectionIds.push({ id: match[1], title: match[2].trim() });
    }
  }
  return sectionIds;
}

function findAmbiguousProseReferences(sourceText) {
  const findings = [];
  const lines = sourceText.split(/\r?\n/);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    for (const pattern of AMBIGUOUS_PROSE_REFERENCE_PATTERNS) {
      if (pattern.test(lines[lineIndex])) {
        findings.push({ lineNumber: lineIndex + 1, snippet: lines[lineIndex].trim() });
        break;
      }
    }
  }
  return findings;
}

function listMarkdownFilesIn(absoluteDirectoryPath) {
  if (!existsSync(absoluteDirectoryPath)) return [];
  return readdirSync(absoluteDirectoryPath)
    .filter((filename) => filename.endsWith('.md'))
    .map((filename) => join(absoluteDirectoryPath, filename));
}

function collectAllRefMentions() {
  const mentions = [];
  const candidatePaths = [
    ...listRuleFiles().map((entry) => entry.absolutePath),
    ...listMarkdownFilesIn(PROMPTS_DIRECTORY),
    ...listMarkdownFilesIn(REVIEW_CHECKLISTS_DIRECTORY),
  ];
  for (const filePath of candidatePaths) {
    const sourceText = readFileSync(filePath, 'utf8');
    for (const match of sourceText.matchAll(REF_PATTERN)) {
      mentions.push({ filePath, refId: match[1] });
    }
  }
  return mentions;
}

export function runRuleIdUniquenessAudit() {
  const violations = [];
  const ruleFiles = listRuleFiles();
  const allKnownSectionIds = new Set();
  const migratedFileCount = { migrated: 0, skipped: 0 };
  const perFile = [];

  for (const { filename, absolutePath } of ruleFiles) {
    const sourceText = readFileSync(absolutePath, 'utf8');
    const frontmatter = parseFrontmatter(sourceText);
    if (!frontmatter) {
      migratedFileCount.skipped += 1;
      perFile.push({ filename, status: 'skipped', reason: 'no-yaml-frontmatter' });
      continue;
    }

    migratedFileCount.migrated += 1;

    for (const requiredKey of REQUIRED_FRONTMATTER_KEYS) {
      if (!(requiredKey in frontmatter)) {
        violations.push({
          file: filename,
          kind: 'frontmatter.missing-key',
          detail: `frontmatter is missing required key: ${requiredKey}`,
        });
      }
    }

    const idPrefix = frontmatter.id_prefix;
    if (typeof idPrefix !== 'string' || idPrefix.length === 0) {
      violations.push({ file: filename, kind: 'frontmatter.invalid-id-prefix', detail: 'id_prefix must be a non-empty string' });
      perFile.push({ filename, status: 'failed', reason: 'invalid-id-prefix' });
      continue;
    }

    const sections = extractSectionIds(sourceText);
    const seenIdsInFile = new Set();
    for (const section of sections) {
      const idMatch = section.id.match(RULE_ID_PATTERN);
      if (!idMatch || idMatch[1] !== idPrefix) {
        violations.push({
          file: filename,
          kind: 'id.prefix-mismatch',
          detail: `section id '${section.id}' does not match the file's id_prefix '${idPrefix}'`,
        });
        continue;
      }
      if (seenIdsInFile.has(section.id)) {
        violations.push({
          file: filename,
          kind: 'id.duplicate',
          detail: `section id '${section.id}' is reused within the same file`,
        });
      }
      seenIdsInFile.add(section.id);
      allKnownSectionIds.add(section.id);
    }

    const ambiguousProse = findAmbiguousProseReferences(sourceText);
    for (const finding of ambiguousProse) {
      violations.push({
        file: filename,
        kind: 'prose.ambiguous-reference',
        detail: `line ${finding.lineNumber}: ${finding.snippet}`,
      });
    }

    perFile.push({
      filename,
      status: 'audited',
      idPrefix,
      sectionCount: sections.length,
      ambiguousProseCount: ambiguousProse.length,
      knownSectionIdsInFile: sections.map((section) => section.id),
      relatedRefs: (frontmatter.related && typeof frontmatter.related === 'object' && !Array.isArray(frontmatter.related))
        ? frontmatter.related
        : null,
    });
  }

  for (const fileEntry of perFile) {
    if (fileEntry.status !== 'audited') continue;
    if (!fileEntry.relatedRefs) continue;
    for (const [parentId, relatedList] of Object.entries(fileEntry.relatedRefs)) {
      if (!fileEntry.knownSectionIdsInFile.includes(parentId)) {
        violations.push({
          file: fileEntry.filename,
          kind: 'related.parent-missing',
          detail: `related map key '${parentId}' is not a section in this file`,
        });
      }
      if (!Array.isArray(relatedList)) {
        violations.push({
          file: fileEntry.filename,
          kind: 'related.malformed',
          detail: `related[${parentId}] must be an array of <PREFIX>-NNN ids`,
        });
        continue;
      }
      for (const relatedId of relatedList) {
        if (typeof relatedId !== 'string' || !RULE_ID_PATTERN.test(relatedId)) {
          violations.push({
            file: fileEntry.filename,
            kind: 'related.malformed',
            detail: `related[${parentId}] entry '${relatedId}' is not a valid <PREFIX>-NNN id`,
          });
          continue;
        }
        if (!allKnownSectionIds.has(relatedId)) {
          violations.push({
            file: fileEntry.filename,
            kind: 'related.unresolved',
            detail: `related[${parentId}] entry '${relatedId}' does not resolve to any section in the rules pack`,
          });
        }
      }
    }
  }

  const refMentions = collectAllRefMentions();
  for (const mention of refMentions) {
    if (!allKnownSectionIds.has(mention.refId)) {
      violations.push({
        file: mention.filePath.replace(REPOSITORY_ROOT, '').replace(/^[\\/]+/, ''),
        kind: 'ref.unresolved',
        detail: `[REF:${mention.refId}] does not resolve to any section in the rules pack`,
      });
    }
  }

  return {
    auditName: 'audit-rule-id-uniqueness',
    reportVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    migratedFileCount: migratedFileCount.migrated,
    skippedFileCount: migratedFileCount.skipped,
    knownSectionIdCount: allKnownSectionIds.size,
    refMentionCount: refMentions.length,
    perFile,
    violationCount: violations.length,
    violations,
    passed: violations.length === 0,
  };
}

function main() {
  const report = runRuleIdUniquenessAudit();

  if (JSON_ONLY) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exit(report.passed ? 0 : 1);
  }

  console.log('===============================================');
  console.log('  audit:rule-id-uniqueness');
  console.log('===============================================');
  console.log(`  Migrated rule files: ${report.migratedFileCount} of ${report.migratedFileCount + report.skippedFileCount} scanned`);
  console.log(`  Pre-migration files: ${report.skippedFileCount} (no YAML frontmatter, skipped)`);
  console.log(`  Known section IDs:   ${report.knownSectionIdCount}`);
  console.log(`  [REF:...] mentions:  ${report.refMentionCount}`);
  console.log('');

  if (report.violationCount === 0) {
    console.log('  All migrated files clean. No prefix mismatches, duplicates, ambiguous prose references, or unresolved [REF:] / related: links.');
    process.stderr.write(`AUDIT_RULE_ID_REPORT: ${JSON.stringify({ passed: true, ...{ migratedFileCount: report.migratedFileCount, knownSectionIdCount: report.knownSectionIdCount, refMentionCount: report.refMentionCount } })}\n`);
    process.exit(0);
  }

  console.log('  Violations:');
  for (const violation of report.violations) {
    console.log(`    [${violation.kind}] ${violation.file}: ${violation.detail}`);
  }
  console.log('');
  console.log(`  ${report.violationCount} violation(s) found. Phase 1 GATE B requires zero.`);
  process.stderr.write(`AUDIT_RULE_ID_REPORT: ${JSON.stringify({ passed: false, violationCount: report.violationCount, kinds: [...new Set(report.violations.map((v) => v.kind))] })}\n`);
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('audit-rule-id-uniqueness.mjs')) {
  main();
}
