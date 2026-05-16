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

const TODAY_ISO = new Date().toISOString().slice(0, 10);

function extractKeywordsFromLegacyTitleAndContent(parsedRuleFile) {
  const candidateTokens = new Set();
  const collectCandidatesFromText = (text) => {
    for (const word of text.toLowerCase().match(/[a-z][a-z0-9]+(?:-[a-z0-9]+)*/g) ?? []) {
      if (word.includes('-') && word.length >= 4 && word.length <= 60) {
        candidateTokens.add(word);
      }
    }
  };

  collectCandidatesFromText(parsedRuleFile.h1Title);
  if (parsedRuleFile.introParagraph) collectCandidatesFromText(parsedRuleFile.introParagraph);
  for (const section of parsedRuleFile.sections) {
    collectCandidatesFromText(section.title);
  }

  return [...candidateTokens].sort().slice(0, 12);
}

function renderFrontmatter(prefixEntry, parsedRuleFile) {
  const frontmatterObject = {
    id_prefix: prefixEntry.prefix,
    domain: prefixEntry.domain,
    version: 1,
    priority: prefixEntry.priority,
    scope: prefixEntry.scope,
    applies_to: [...prefixEntry.appliesTo],
    keywords: extractKeywordsFromLegacyTitleAndContent(parsedRuleFile),
    last_migrated: TODAY_ISO,
  };
  const yamlBody = stringifyYaml(frontmatterObject, { lineWidth: 0 }).trimEnd();
  return `---\n${yamlBody}\n---\n`;
}

function renderIntroParagraph(parsedRuleFile) {
  if (!parsedRuleFile.introParagraph) return '';
  return `${parsedRuleFile.introParagraph}\n\n`;
}

function paragraphSplitsIntoDirectives(paragraphText) {
  // Sentence boundary heuristic: end of sentence is `.`, `!`, or `?` followed
  // by whitespace and an uppercase letter, OR end of string. Avoids splitting
  // on intra-token periods like `docs/DESIGN.md` or template literals like
  // `{} .json`. The trailing punctuation stays attached to the prior sentence.
  const sentences = paragraphText.match(/[^.!?]+(?:[.!?](?=\s+[A-Z`]|$|\s*$))?/g) ?? [paragraphText];
  return sentences
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
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
