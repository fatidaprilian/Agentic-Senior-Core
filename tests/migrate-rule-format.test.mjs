// @ts-check

/**
 * Tests for the Phase 1 migration helper. All tests run offline; the
 * helper itself uses the offline OpenAI tiktoken counter for token math
 * so no API key is required during CI.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ID_PREFIX_TABLE, getPrefixEntry } from '../scripts/migrate-rule-format/id-prefix-table.mjs';
import { parseLegacyRuleFile } from '../scripts/migrate-rule-format/parse-legacy.mjs';
import { paragraphSplitsIntoDirectives, renderNewFormat } from '../scripts/migrate-rule-format/render-new.mjs';
import { roundtripSubstanceCheck } from '../scripts/migrate-rule-format/roundtrip-validate.mjs';
import { migrateOneRuleFile } from '../scripts/migrate-rule-format.mjs';

test('ID_PREFIX_TABLE covers all 15 rule files', () => {
  const expectedFilenames = [
    'api-docs.md',
    'architecture.md',
    'database-design.md',
    'docker-runtime.md',
    'efficiency-vs-hype.md',
    'error-handling.md',
    'event-driven.md',
    'frontend-architecture.md',
    'git-workflow.md',
    'microservices.md',
    'naming-conv.md',
    'performance.md',
    'realtime.md',
    'security.md',
    'testing.md',
  ];
  const actualFilenames = Object.keys(ID_PREFIX_TABLE).sort();
  assert.deepEqual(actualFilenames, expectedFilenames.sort());
});

test('every prefix is unique across the table', () => {
  const prefixes = Object.values(ID_PREFIX_TABLE).map((entry) => entry.prefix);
  const uniquePrefixes = new Set(prefixes);
  assert.equal(uniquePrefixes.size, prefixes.length, 'all prefix values must be distinct');
});

test('getPrefixEntry returns the locked entry for a known filename', () => {
  const entry = getPrefixEntry('frontend-architecture.md');
  assert.equal(entry.prefix, 'FE');
  assert.equal(entry.domain, 'frontend-architecture');
});

test('getPrefixEntry throws for an unknown filename', () => {
  assert.throws(() => getPrefixEntry('does-not-exist.md'), /Unknown rule file/);
});

test('parseLegacyRuleFile extracts H1, intro, and sections', () => {
  const sample = `# Sample Rule\n\nIntro paragraph one. Intro paragraph two.\n\n## First Section\n\nA single paragraph here.\n\n- bullet one\n- bullet two\n\n## Second Section\n\nAnother paragraph.\n`;
  const parsed = parseLegacyRuleFile(sample);
  assert.equal(parsed.h1Title, 'Sample Rule');
  assert.equal(parsed.introParagraph, 'Intro paragraph one. Intro paragraph two.');
  assert.equal(parsed.sections.length, 2);
  assert.equal(parsed.sections[0].title, 'First Section');
  assert.equal(parsed.sections[0].blocks.length, 2);
  assert.equal(parsed.sections[0].blocks[0].kind, 'paragraph');
  assert.equal(parsed.sections[0].blocks[1].kind, 'bullet-list');
  assert.deepEqual(parsed.sections[0].blocks[1].items, ['bullet one', 'bullet two']);
});

test('parseLegacyRuleFile throws when the file has no H1', () => {
  assert.throws(() => parseLegacyRuleFile('## Bad start\n\nNo H1 here.\n'), /missing top-level H1/);
});

test('renderNewFormat assigns sequential IDs with the locked prefix', () => {
  const parsed = parseLegacyRuleFile(
    `# Demo Rule\n\nIntro line.\n\n## Section A\n\n- item a\n- item b\n\n## Section B\n\nA paragraph.\n`,
  );
  const prefixEntry = getPrefixEntry('frontend-architecture.md');
  const { rendered, sectionAssignments, warnings } = renderNewFormat(prefixEntry, parsed);

  assert.equal(sectionAssignments.length, 2);
  assert.equal(sectionAssignments[0].sectionId, 'FE-001');
  assert.equal(sectionAssignments[1].sectionId, 'FE-002');
  assert.match(rendered, /^---\nid_prefix: FE\n/);
  assert.match(rendered, /## FE-001: Section A/);
  assert.match(rendered, /## FE-002: Section B/);
  assert.equal(warnings.length, 0);
});

test('renderNewFormat warns when a section produces more than 12 items', () => {
  const fifteenSentenceParagraph = Array.from({ length: 15 }, (_, i) => `Directive ${i + 1} ends here.`).join(' ');
  const parsed = parseLegacyRuleFile(`# Big Rule\n\n## Big Section\n\n${fifteenSentenceParagraph}\n`);
  const prefixEntry = getPrefixEntry('testing.md');
  const { warnings } = renderNewFormat(prefixEntry, parsed);
  assert.ok(warnings.some((warning) => warning.includes('caps at 12')), 'expected a >12 item warning');
});

test('roundtripSubstanceCheck passes when most substantial words survive', () => {
  const original = 'Validate every input. Authentication is mandatory. Forbid raw SQL strings. Reject silent type coercion.';
  const rendered = '1. Validate every input.\n2. Authentication is mandatory.\n3. Forbid raw SQL strings.\n4. Reject silent type coercion.\n';
  const result = roundtripSubstanceCheck(original, rendered);
  assert.equal(result.passed, true);
  assert.ok(result.overlapPercent >= 95);
});

test('roundtripSubstanceCheck fails when substance drops below threshold', () => {
  const original = 'Authentication boundary contract. Reject legacy tokens. Pin algorithm signing keys. Rotate refresh tokens.';
  const rendered = '1. Some new sentence.\n2. Different topic entirely.\n';
  const result = roundtripSubstanceCheck(original, rendered);
  assert.equal(result.passed, false);
  assert.ok(result.overlapPercent < 95);
  assert.ok(result.lostWords.length > 0);
});

test('migrateOneRuleFile produces a candidate with sequential FE IDs (integration)', async () => {
  const tempDirectoryPath = mkdtempSync(join(tmpdir(), 'phase-1-migrate-'));
  const ruleFilePath = join(tempDirectoryPath, 'frontend-architecture.md');
  const fixtureSource = `# Frontend Demo\n\nLoad this rule for UI work.\n\n## Activation\n\nUse this rule for UI, UX, layout, and component work.\n\n## Authority\n\n- Use repo evidence as style context.\n- Treat .agent-context/ as design governance authority.\n- Do not choose final palette offline.\n`;
  writeFileSync(ruleFilePath, fixtureSource, 'utf8');

  try {
    const report = await migrateOneRuleFile(ruleFilePath);
    assert.equal(report.prefix, 'FE');
    assert.equal(report.sectionAssignments.length, 2);
    assert.equal(report.sectionAssignments[0].sectionId, 'FE-001');
    assert.equal(report.sectionAssignments[1].sectionId, 'FE-002');
    assert.equal(report.roundtrip.passed, true);
    assert.ok(report.tokenSavings.original > 0);
    assert.ok(report.tokenSavings.rendered > 0);
    assert.match(report.rendered, /^---\nid_prefix: FE\n/);
    assert.match(report.rendered, /## FE-001: Activation/);
  } finally {
    rmSync(tempDirectoryPath, { recursive: true, force: true });
  }
});

test('migrateOneRuleFile rejects unknown filenames', async () => {
  const tempDirectoryPath = mkdtempSync(join(tmpdir(), 'phase-1-migrate-'));
  const unknownPath = join(tempDirectoryPath, 'mystery.md');
  writeFileSync(unknownPath, '# Unknown\n\nbody\n', 'utf8');

  try {
    await assert.rejects(() => migrateOneRuleFile(unknownPath), /Unknown rule file/);
  } finally {
    rmSync(tempDirectoryPath, { recursive: true, force: true });
  }
});

test('paragraphSplitsIntoDirectives keeps file paths intact', () => {
  const sentences = paragraphSplitsIntoDirectives('Before UI code, create or refine docs/DESIGN.md and docs/design-intent.json. The contract must record motionPaletteDecision.');
  assert.equal(sentences.length, 2);
  assert.match(sentences[0], /docs\/DESIGN\.md and docs\/design-intent\.json\.$/);
  assert.match(sentences[1], /^The contract must record motionPaletteDecision\.$/);
});

test('paragraphSplitsIntoDirectives keeps package and module paths intact', () => {
  const sentences = paragraphSplitsIntoDirectives('Update package.json before commit. Run scripts under src/index.ts.');
  assert.equal(sentences.length, 2);
  assert.match(sentences[0], /^Update package\.json before commit\.$/);
  assert.match(sentences[1], /^Run scripts under src\/index\.ts\.$/);
});

test('paragraphSplitsIntoDirectives keeps dotted versions intact', () => {
  const sentences = paragraphSplitsIntoDirectives('Use v1.5 for the helper. Bump to 2.0.0 only after acceptance.');
  assert.equal(sentences.length, 2);
  assert.match(sentences[0], /^Use v1\.5 for the helper\.$/);
  assert.match(sentences[1], /^Bump to 2\.0\.0 only after acceptance\.$/);
});

test('paragraphSplitsIntoDirectives keeps domain names intact', () => {
  const sentences = paragraphSplitsIntoDirectives('Reference example.com when external. Cite github.io for static demos.');
  assert.equal(sentences.length, 2);
  assert.match(sentences[0], /^Reference example\.com when external\.$/);
  assert.match(sentences[1], /^Cite github\.io for static demos\.$/);
});

test('paragraphSplitsIntoDirectives does not split on internal abbreviation periods', () => {
  // e.g. and i.e. are mid-sentence abbreviations. Splitting at their internal
  // period would break "e.g." away from the rest of the clause. The trailing
  // period after "e.g." followed by a lowercase continuation must not split.
  const sentencesEg = paragraphSplitsIntoDirectives('Validate inputs e.g. user ids and request bodies. Reject silent coercion.');
  assert.equal(sentencesEg.length, 2, 'e.g. internal periods must not split mid-clause');
  assert.match(sentencesEg[0], /e\.g\. user ids and request bodies\.$/);
  assert.match(sentencesEg[1], /^Reject silent coercion\.$/);

  const sentencesIe = paragraphSplitsIntoDirectives('Pin the algorithm i.e. RS256 or ES256. Reject alg none.');
  assert.equal(sentencesIe.length, 2, 'i.e. internal periods must not split mid-clause');
  assert.match(sentencesIe[0], /i\.e\. RS256 or ES256\.$/);

  // "etc." followed by a capital letter is intentionally a real sentence
  // boundary in English. The splitter is allowed to split there; we only
  // promise that the period inside "etc." itself is not used as a boundary.
  const sentencesEtcLowercase = paragraphSplitsIntoDirectives('Cover request validation, auth, error shapes, etc. and pagination defaults.');
  assert.equal(sentencesEtcLowercase.length, 1, 'etc. followed by lowercase continuation must not split');
});

test('paragraphSplitsIntoDirectives still splits on real sentence boundaries', () => {
  const sentences = paragraphSplitsIntoDirectives('First directive. Second directive. Third directive.');
  assert.equal(sentences.length, 3);
  assert.match(sentences[0], /^First directive\.$/);
  assert.match(sentences[1], /^Second directive\.$/);
  assert.match(sentences[2], /^Third directive\.$/);
});

test('paragraphSplitsIntoDirectives handles trailing fragment without final punctuation', () => {
  const sentences = paragraphSplitsIntoDirectives('First directive. Tail without punctuation');
  assert.equal(sentences.length, 2);
  assert.match(sentences[1], /^Tail without punctuation$/);
});
