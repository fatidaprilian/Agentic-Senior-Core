// @ts-check

/**
 * Renders a parsed legacy rule file plus a prefix-table entry into the v4
 * canonical format defined in `docs/plan/format-spec.md`.
 *
 * Section IDs auto-assign sequentially starting at 001. The renderer never
 * skips integers; humans introduce gaps manually during review by editing
 * the produced file (e.g. when expecting later splits).
 *
 * Each parsed bullet-list becomes one numbered item if it has 1-2 items, or a
 * single numbered item with sub-bullets when the list is enumerative (3+
 * items that share the same shape).
 */

import { stringify as stringifyYaml } from 'yaml';

function pickKeywords(parsedRuleFile, prefixEntry) {
  // Hand-picked first: the file's id_prefix lowercased and the domain itself
  // are always relevant. Additional keywords are drawn from the highest-signal
  // kebab-case tokens in the H1 + section titles, capped at 6 total. The
  // validate gate snippet checks accept either body presence or this array, so
  // we prioritize tokens that appear in section titles (more likely to be
  // queried) over tokens buried in paragraphs.
  const handPicked = new Set([prefixEntry.domain, prefixEntry.prefix.toLowerCase()]);
  const titleSignal = parsedRuleFile.h1Title + ' ' + parsedRuleFile.sections.map((section) => section.title).join(' ');
  for (const word of titleSignal.toLowerCase().match(/[a-z][a-z0-9]+(?:-[a-z0-9]+)*/g) ?? []) {
    if (word.length >= 4 && word.length <= 32 && handPicked.size < 6) {
      handPicked.add(word);
    }
  }
  return [...handPicked];
}

function renderFrontmatter(prefixEntry, parsedRuleFile) {
  // Trimmed v4 frontmatter (per phase-1-format.md GATE B revision):
  //   - drop `version` for first-time-v1 files (only meaningful when bumped)
  //   - drop `last_migrated` (git history is the audit trail)
  //   - cap `keywords` at 6 hand-picked entries instead of 12 auto-extracted
  const frontmatterObject = {
    id_prefix: prefixEntry.prefix,
    domain: prefixEntry.domain,
    priority: prefixEntry.priority,
    scope: prefixEntry.scope,
    applies_to: [...prefixEntry.appliesTo],
    keywords: pickKeywords(parsedRuleFile, prefixEntry),
  };
  const yamlBody = stringifyYaml(frontmatterObject, { lineWidth: 0 }).trimEnd();
  return `---\n${yamlBody}\n---\n`;
}

function renderIntroParagraph(parsedRuleFile) {
  if (!parsedRuleFile.introParagraph) return '';
  return `${parsedRuleFile.introParagraph}\n\n`;
}

// Common abbreviations that end with a period but are not sentence endings.
// Mid-sentence occurrences like "etc. The next..." would otherwise be split
// at the abbreviation. Pre-masking is the cheapest fix and is easy to extend.
const NON_SENTENCE_ENDING_ABBREVIATIONS = Object.freeze(['e.g', 'i.e', 'etc', 'vs', 'cf', 'Mr', 'Dr', 'Mrs', 'Inc', 'Ltd']);
const ABBREVIATION_MASK_TOKEN = '\u0001';

function maskAbbreviationPeriods(paragraphText) {
  let masked = paragraphText;
  for (const abbreviation of NON_SENTENCE_ENDING_ABBREVIATIONS) {
    const escaped = abbreviation.replace(/\./g, '\\.');
    masked = masked.replace(new RegExp(`\\b${escaped}\\.`, 'g'), `${abbreviation}${ABBREVIATION_MASK_TOKEN}`);
  }
  return masked;
}

function unmaskAbbreviationPeriods(text) {
  return text.replace(new RegExp(ABBREVIATION_MASK_TOKEN, 'g'), '.');
}

export function paragraphSplitsIntoDirectives(paragraphText) {
  // A `.` `!` or `?` ends a sentence only when it is followed by whitespace
  // and an uppercase letter, a backtick (next clause starts with `code`), or
  // an opening parenthesis. This rule recognizes:
  //   - file paths     "docs/DESIGN.md"        period + lowercase, no whitespace -> not a boundary
  //   - dotted versions "v1.5", "2.0.0"        period + digit -> not a boundary
  //   - domain literals "example.com"          period + lowercase -> not a boundary
  //   - abbreviations  "e.g.", "i.e.", "etc."  pre-masked so their internal periods do not split
  // Everything else is treated as sentence-final.
  const masked = maskAbbreviationPeriods(paragraphText);
  const SENTENCE_BOUNDARY = /([.!?])\s+(?=[A-Z`(])/g;
  const sentences = [];
  let cursor = 0;
  for (const match of masked.matchAll(SENTENCE_BOUNDARY)) {
    const sentenceEnd = match.index + match[1].length;
    sentences.push(unmaskAbbreviationPeriods(masked.slice(cursor, sentenceEnd)).trim());
    cursor = match.index + match[0].length;
  }
  const tail = unmaskAbbreviationPeriods(masked.slice(cursor)).trim();
  if (tail.length > 0) {
    sentences.push(tail);
  }
  return sentences.filter((sentence) => sentence.length > 0);
}

function renderBlockAsNumberedItem(block) {
  if (block.kind === 'paragraph') {
    return paragraphSplitsIntoDirectives(block.text);
  }

  // Each bullet becomes its own numbered directive. The format spec allows
  // sub-bullets only as supporting detail under one parent directive, never
  // as a way to compress an enumerative list into a single item. Keeping them
  // as numbered items preserves citability (each becomes a sub-ID candidate
  // during manual review) and matches the worked example in section 6.2.
  return [...block.items];
}

function buildSectionBody(blocks) {
  const numberedDirectives = [];
  for (const block of blocks) {
    const directives = renderBlockAsNumberedItem(block);
    for (const directive of directives) {
      numberedDirectives.push(directive);
    }
  }
  return numberedDirectives;
}

/**
 * @param {{ prefix: string, domain: string, priority: string, scope: string, appliesTo: string[] }} prefixEntry
 * @param {ReturnType<typeof import('./parse-legacy.mjs').parseLegacyRuleFile>} parsedRuleFile
 * @returns {{ rendered: string, sectionAssignments: Array<{ sectionTitle: string, sectionId: string, itemCount: number }>, warnings: string[] }}
 */
export function renderNewFormat(prefixEntry, parsedRuleFile) {
  const warnings = [...parsedRuleFile.warnings];
  const renderedParts = [];
  renderedParts.push(renderFrontmatter(prefixEntry, parsedRuleFile));
  renderedParts.push('\n');
  renderedParts.push(`# ${parsedRuleFile.h1Title}\n\n`);
  renderedParts.push(renderIntroParagraph(parsedRuleFile));

  const sectionAssignments = [];
  parsedRuleFile.sections.forEach((section, sectionIndex) => {
    const sectionId = `${prefixEntry.prefix}-${String(sectionIndex + 1).padStart(3, '0')}`;
    const numberedItems = buildSectionBody(section.blocks);
    if (numberedItems.length > 12) {
      warnings.push(
        `Section "${section.title}" has ${numberedItems.length} numbered items. Format spec caps at 12; split into two sections during manual review.`,
      );
    }
    if (numberedItems.length === 0) {
      warnings.push(`Section "${section.title}" produced no numbered items. Manual review required.`);
    }

    renderedParts.push(`## ${sectionId}: ${section.title}\n\n`);
    numberedItems.forEach((directive, itemIndex) => {
      renderedParts.push(`${itemIndex + 1}. ${directive}\n`);
    });
    renderedParts.push('\n');

    sectionAssignments.push({
      sectionTitle: section.title,
      sectionId,
      itemCount: numberedItems.length,
    });
  });

  return {
    rendered: renderedParts.join('').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n',
    sectionAssignments,
    warnings,
  };
}
