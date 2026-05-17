// @ts-check

/**
 * Font-family parsing for the typography/palette anti-repeat audit. CSS
 * `font-family:` declarations and `@font-face` blocks are the inputs;
 * normalized lowercase family tokens are the outputs.
 */

export const FONT_FAMILY_DECLARATION_PATTERN = /font-family\s*:\s*([^;}]+)[;}]/gi;
export const FONT_FACE_FAMILY_PATTERN = /@font-face\s*\{[^}]*font-family\s*:\s*([^;]+);/gi;

export function normalizeFontFamilyToken(rawFamilyToken) {
  return String(rawFamilyToken || '')
    .replace(/^["']|["']$/g, '')
    .trim()
    .toLowerCase();
}

export function splitFontFamilyDeclaration(declarationValue) {
  return String(declarationValue || '')
    .split(',')
    .map((familyEntry) => normalizeFontFamilyToken(familyEntry))
    .filter((familyEntry) => familyEntry.length > 0 && !familyEntry.startsWith('var('));
}

export function extractFontFamiliesFromText(sourceText) {
  /** @type {{ family: string, index: number }[]} */
  const familyOccurrences = [];

  for (const matchPattern of [FONT_FAMILY_DECLARATION_PATTERN, FONT_FACE_FAMILY_PATTERN]) {
    matchPattern.lastIndex = 0;
    let regexMatch;
    // eslint-disable-next-line no-cond-assign
    while ((regexMatch = matchPattern.exec(sourceText)) !== null) {
      const declarationValue = regexMatch[1];
      const declarationStartIndex = regexMatch.index;
      for (const familyEntry of splitFontFamilyDeclaration(declarationValue)) {
        familyOccurrences.push({ family: familyEntry, index: declarationStartIndex });
      }
    }
  }

  return familyOccurrences;
}

export function extractLedgerTypographyFamilies(antiRepeatLedger) {
  const previousTypographyChoices = Array.isArray(antiRepeatLedger?.previousTypographyChoices)
    ? antiRepeatLedger.previousTypographyChoices
    : [];

  const ledgerFamilies = new Map();
  for (const ledgerEntry of previousTypographyChoices) {
    const summaryString = String(ledgerEntry?.summary || '');
    if (!summaryString) {
      continue;
    }
    // Summaries are emitted as "role: value; role: value". Each value is a
    // font family that the previous design shipped.
    for (const summaryPart of summaryString.split(';')) {
      const colonSplitIndex = summaryPart.indexOf(':');
      const familyValue = colonSplitIndex >= 0 ? summaryPart.slice(colonSplitIndex + 1) : summaryPart;
      const normalizedFamilyValue = normalizeFontFamilyToken(familyValue);
      if (normalizedFamilyValue.length === 0) {
        continue;
      }
      ledgerFamilies.set(normalizedFamilyValue, ledgerEntry);
    }
  }
  return ledgerFamilies;
}
