// @ts-check

/**
 * Roundtrip substance validator.
 *
 * After rendering the new format, we extract the substantial-word set from
 * both the original v3 file and the rendered v4 file, then compute set overlap.
 * Drop in overlap below the threshold means the migration almost certainly
 * lost real content; the helper surfaces the lost words so the human migrator
 * can decide whether the loss is intentional (renamed terms) or a bug.
 */

const STOPWORD_SET = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'are', 'was',
  'were', 'has', 'have', 'had', 'not', 'but', 'can', 'will', 'must', 'use',
  'used', 'using', 'when', 'then', 'than', 'they', 'their', 'them', 'who',
  'what', 'why', 'how', 'all', 'any', 'one', 'two', 'three', 'four', 'five',
  'six', 'seven', 'eight', 'nine', 'ten', 'each', 'such', 'some', 'most',
  'more', 'less', 'only', 'also', 'just', 'over', 'under', 'between', 'across',
  'before', 'after', 'because', 'while', 'until', 'unless', 'within',
  'without', 'inside', 'outside', 'about', 'around', 'against', 'through',
  'throughout', 'during', 'including', 'include', 'includes', 'see', 'note',
  'rule', 'rules', 'agent', 'agents', 'project', 'repo', 'code', 'file',
  'files', 'item', 'items', 'list', 'lists', 'thing', 'things', 'value',
  'values', 'should', 'shall', 'may', 'might', 'could', 'would', 'does',
  'doing', 'done', 'make', 'makes', 'making', 'made', 'set', 'sets',
]);

function tokenize(text) {
  const lowered = text.toLowerCase();
  // Strip fenced code blocks first (multi-line ``` ... ``` spans).
  const noFenced = lowered.replace(/```[\s\S]*?```/g, ' ');
  // Strip inline code spans, but only within a single line so that an
  // unmatched backtick on a code-heavy line cannot eat the rest of the file.
  const noInline = noFenced.replace(/`[^`\n]+`/g, ' ');
  const words = noInline.match(/[a-z][a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];
  return words.filter((word) => word.length >= 4 && !STOPWORD_SET.has(word));
}

/**
 * @param {string} originalSourceText
 * @param {string} renderedSourceText
 * @param {{ minimumOverlapPercent?: number }} [options]
 * @returns {{
 *   passed: boolean,
 *   originalSubstantialWordCount: number,
 *   renderedSubstantialWordCount: number,
 *   overlapPercent: number,
 *   lostWords: string[],
 *   newWords: string[],
 *   minimumRequired: number,
 * }}
 */
export function roundtripSubstanceCheck(originalSourceText, renderedSourceText, options = {}) {
  const minimumOverlapPercent = options.minimumOverlapPercent ?? 95;
  const originalWordCounts = new Map();
  for (const word of tokenize(originalSourceText)) {
    originalWordCounts.set(word, (originalWordCounts.get(word) || 0) + 1);
  }
  const renderedWordSet = new Set(tokenize(renderedSourceText));

  const lostWords = [];
  let preservedDistinctWordCount = 0;
  for (const [word, count] of originalWordCounts.entries()) {
    if (renderedWordSet.has(word)) {
      preservedDistinctWordCount += 1;
    } else {
      lostWords.push(`${word} (x${count})`);
    }
  }

  const originalDistinctCount = originalWordCounts.size;
  const overlapPercent = originalDistinctCount > 0
    ? (preservedDistinctWordCount / originalDistinctCount) * 100
    : 100;

  const originalWordSet = new Set(originalWordCounts.keys());
  const newWords = [...renderedWordSet].filter((word) => !originalWordSet.has(word));

  return {
    passed: overlapPercent >= minimumOverlapPercent,
    originalSubstantialWordCount: originalDistinctCount,
    renderedSubstantialWordCount: renderedWordSet.size,
    overlapPercent: Math.round(overlapPercent * 100) / 100,
    lostWords: lostWords.sort().slice(0, 50),
    newWords: newWords.sort().slice(0, 50),
    minimumRequired: minimumOverlapPercent,
  };
}
