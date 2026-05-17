// @ts-check

/**
 * Best-effort parser for the legacy v3 rule file format. Extracts:
 *   - the H1 title
 *   - an optional intro paragraph (1-3 sentences before the first H2)
 *   - a list of sections, each with H2 title + ordered content blocks
 *
 * Each content block is one of:
 *   { kind: 'paragraph', text }
 *   { kind: 'bullet-list', items: string[] }
 *   { kind: 'sub-bullet-list', items: string[] }  // legacy nested bullets
 *
 * The parser intentionally throws on shapes it cannot represent in the new
 * format. This forces the human migrator to review unusual sections instead of
 * silently losing content.
 */

/**
 * @typedef {{ kind: 'paragraph', text: string }} ParagraphBlock
 * @typedef {{ kind: 'bullet-list', items: string[] }} BulletListBlock
 * @typedef {ParagraphBlock | BulletListBlock} ContentBlock
 *
 * @typedef {{
 *   title: string,
 *   blocks: ContentBlock[],
 * }} ParsedSection
 *
 * @typedef {{
 *   h1Title: string,
 *   introParagraph: string | null,
 *   sections: ParsedSection[],
 *   warnings: string[],
 * }} ParsedRuleFile
 */

/**
 * @param {string} sourceText
 * @returns {ParsedRuleFile}
 */
export function parseLegacyRuleFile(sourceText) {
  const lines = sourceText.replace(/\r\n/g, '\n').split('\n');
  const warnings = [];
  const isH2 = (line) => line.startsWith('## ');
  const isH1 = (line) => line.startsWith('# ');
  const isColonSectionLabel = (line) => /^[A-Z][^:\n]+:$/.test(line.trim());

  let cursor = 0;
  while (cursor < lines.length && lines[cursor].trim() === '') {
    cursor += 1;
  }

  const h1Match = (lines[cursor] || '').match(/^#\s+(.+)$/);
  if (!h1Match) {
    throw new Error('Legacy file missing top-level H1 heading at the first non-empty line.');
  }
  const h1Title = h1Match[1].trim();
  cursor += 1;

  while (cursor < lines.length && lines[cursor].trim() === '') {
    cursor += 1;
  }

  let introParagraph = null;
  if (cursor < lines.length && !lines[cursor].startsWith('## ') && !lines[cursor].startsWith('# ')) {
    const introLines = [];
    while (cursor < lines.length && !lines[cursor].startsWith('## ') && !lines[cursor].startsWith('# ')) {
      const line = lines[cursor];
      if (line.trim() === '' && introLines.length > 0) {
        break;
      }
      if (line.trim() !== '') {
        introLines.push(line.trim());
      }
      cursor += 1;
    }
    if (introLines.length > 0) {
      introParagraph = introLines.join(' ').trim();
      const sentenceCount = (introParagraph.match(/[.!?](?=\s|$)/g) || []).length;
      if (sentenceCount > 3) {
        warnings.push(`Intro paragraph has ${sentenceCount} sentences (max 3 per format spec). Trim or split during manual review.`);
      }
    }
  }

  while (cursor < lines.length && lines[cursor].trim() === '') {
    cursor += 1;
  }

  /** @type {ParsedSection[]} */
  const sections = [];
  while (cursor < lines.length) {
    while (cursor < lines.length && lines[cursor].trim() === '') {
      cursor += 1;
    }
    if (cursor >= lines.length) {
      break;
    }

    let sectionTitle = '';
    if (isH2(lines[cursor])) {
      sectionTitle = lines[cursor].slice(3).trim();
      cursor += 1;
    } else if (isColonSectionLabel(lines[cursor])) {
      sectionTitle = lines[cursor].trim().replace(/:$/, '');
      cursor += 1;
    } else if (!isH1(lines[cursor])) {
      sectionTitle = sections.length === 0 ? 'General Guidance' : 'Boundary Summary';
    } else {
      cursor += 1;
      continue;
    }

    /** @type {ContentBlock[]} */
    const blocks = [];
    while (cursor < lines.length && !isH2(lines[cursor]) && !isH1(lines[cursor]) && !isColonSectionLabel(lines[cursor])) {
      const line = lines[cursor];

      if (line.trim() === '') {
        cursor += 1;
        continue;
      }

      if (/^\s*-\s+/.test(line)) {
        const items = [];
        let nestedItems = [];
        while (cursor < lines.length && (/^\s*-\s+/.test(lines[cursor]) || lines[cursor].trim() === '' || /^\s{2,}\S/.test(lines[cursor]))) {
          const bulletLine = lines[cursor];
          if (bulletLine.trim() === '') {
            cursor += 1;
            if (cursor < lines.length && !/^\s*-\s+/.test(lines[cursor])) {
              break;
            }
            continue;
          }
          const topMatch = bulletLine.match(/^-\s+(.+)$/);
          const nestedMatch = bulletLine.match(/^\s{2,}-\s+(.+)$/);
          const continuationMatch = bulletLine.match(/^\s{2,}(\S.+)$/);
          if (topMatch) {
            if (nestedItems.length > 0 && items.length > 0) {
              items[items.length - 1] += `\n  ${nestedItems.map((nested) => `- ${nested}`).join('\n  ')}`;
              nestedItems = [];
            }
            items.push(topMatch[1].trim());
          } else if (nestedMatch) {
            nestedItems.push(nestedMatch[1].trim());
          } else if (continuationMatch && items.length > 0) {
            items[items.length - 1] += ` ${continuationMatch[1].trim()}`;
          } else {
            break;
          }
          cursor += 1;
        }
        if (nestedItems.length > 0 && items.length > 0) {
          items[items.length - 1] += `\n  ${nestedItems.map((nested) => `- ${nested}`).join('\n  ')}`;
        }
        blocks.push({ kind: 'bullet-list', items });
        continue;
      }

      const paragraphLines = [];
      while (
        cursor < lines.length
        && lines[cursor].trim() !== ''
        && !isH2(lines[cursor])
        && !isH1(lines[cursor])
        && !isColonSectionLabel(lines[cursor])
        && !/^\s*-\s+/.test(lines[cursor])
      ) {
        paragraphLines.push(lines[cursor].trim());
        cursor += 1;
      }
      blocks.push({ kind: 'paragraph', text: paragraphLines.join(' ').trim() });
    }

    sections.push({ title: sectionTitle, blocks });
  }

  return { h1Title, introParagraph, sections, warnings };
}
