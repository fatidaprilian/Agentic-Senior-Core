// @ts-check

/**
 * Color parsing and distance utilities for the typography/palette
 * anti-repeat audit. OKLCH math is contained here so the main audit module
 * stays focused on file scanning and ledger cross-check.
 */

export const HEX_COLOR_PATTERN = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
export const OKLCH_PATTERN = /oklch\(\s*([^)]+)\s*\)/gi;

export function expandShortHexColor(rawHexColor) {
  if (rawHexColor.length !== 4) {
    return rawHexColor;
  }
  const expandedChars = [];
  for (let charIndex = 1; charIndex < rawHexColor.length; charIndex += 1) {
    expandedChars.push(rawHexColor[charIndex], rawHexColor[charIndex]);
  }
  return `#${expandedChars.join('')}`.toLowerCase();
}

export function normalizeHexColor(rawHexColor) {
  if (typeof rawHexColor !== 'string' || rawHexColor.length === 0) {
    return null;
  }
  const trimmedHex = rawHexColor.trim().toLowerCase();
  if (!trimmedHex.startsWith('#')) {
    return null;
  }
  if (trimmedHex.length === 4) {
    return expandShortHexColor(trimmedHex);
  }
  if (trimmedHex.length === 7 || trimmedHex.length === 9) {
    return trimmedHex.slice(0, 7);
  }
  return null;
}

function parseOklchNumber(rawNumber, percentScale) {
  const numberString = String(rawNumber || '').trim();
  if (numberString.endsWith('%')) {
    const percentValue = parseFloat(numberString.slice(0, -1));
    if (!Number.isFinite(percentValue)) {
      return Number.NaN;
    }
    return (percentValue / 100) * percentScale;
  }
  return parseFloat(numberString);
}

export function parseOklchTriple(oklchExpression) {
  const componentTokens = String(oklchExpression || '')
    .replace(/\//g, ' ')
    .split(/[\s,]+/)
    .filter((componentToken) => componentToken.length > 0);
  if (componentTokens.length < 3) {
    return null;
  }
  const lightness = parseOklchNumber(componentTokens[0], 1);
  const chroma = parseFloat(componentTokens[1]);
  const hueDegrees = parseOklchNumber(componentTokens[2], 360);
  if (!Number.isFinite(lightness) || !Number.isFinite(chroma) || !Number.isFinite(hueDegrees)) {
    return null;
  }
  return { lightness, chroma, hueDegrees };
}

/**
 * L*C*H-style perceptual distance proxy. OKLCH is perceptually uniform,
 * so a Cartesian-like delta over (L, C, C * Δhue_radians) tracks visible
 * difference well enough for an anti-repeat heuristic.
 */
export function oklchPerceptualDistance(leftColor, rightColor) {
  const lightnessDelta = leftColor.lightness - rightColor.lightness;
  const chromaDelta = leftColor.chroma - rightColor.chroma;
  const hueDelta = ((leftColor.hueDegrees - rightColor.hueDegrees + 540) % 360) - 180;
  const hueArcRadians = (hueDelta * Math.PI) / 180;
  const hueChromaDelta = leftColor.chroma * hueArcRadians;
  return Math.sqrt(
    lightnessDelta * lightnessDelta
    + chromaDelta * chromaDelta
    + hueChromaDelta * hueChromaDelta,
  );
}

export function extractColorOccurrencesFromText(sourceText) {
  /** @type {{ kind: 'hex' | 'oklch', raw: string, normalized: string | null, oklch: { lightness: number, chroma: number, hueDegrees: number } | null, index: number }[]} */
  const colorOccurrences = [];

  HEX_COLOR_PATTERN.lastIndex = 0;
  let hexMatch;
  // eslint-disable-next-line no-cond-assign
  while ((hexMatch = HEX_COLOR_PATTERN.exec(sourceText)) !== null) {
    colorOccurrences.push({
      kind: 'hex',
      raw: hexMatch[0],
      normalized: normalizeHexColor(hexMatch[0]),
      oklch: null,
      index: hexMatch.index,
    });
  }

  OKLCH_PATTERN.lastIndex = 0;
  let oklchMatch;
  // eslint-disable-next-line no-cond-assign
  while ((oklchMatch = OKLCH_PATTERN.exec(sourceText)) !== null) {
    colorOccurrences.push({
      kind: 'oklch',
      raw: oklchMatch[0],
      normalized: oklchMatch[0].toLowerCase(),
      oklch: parseOklchTriple(oklchMatch[1]),
      index: oklchMatch.index,
    });
  }

  return colorOccurrences;
}

export function extractLedgerColors(antiRepeatLedger) {
  const previousPalettes = Array.isArray(antiRepeatLedger?.previousPalettes)
    ? antiRepeatLedger.previousPalettes
    : [];

  /** @type {{ kind: 'hex' | 'oklch', normalized: string | null, oklch: { lightness: number, chroma: number, hueDegrees: number } | null, sourceEntry: any }[]} */
  const ledgerColors = [];
  for (const ledgerEntry of previousPalettes) {
    const summaryString = String(ledgerEntry?.summary || '');
    if (!summaryString) {
      continue;
    }
    HEX_COLOR_PATTERN.lastIndex = 0;
    let hexMatch;
    // eslint-disable-next-line no-cond-assign
    while ((hexMatch = HEX_COLOR_PATTERN.exec(summaryString)) !== null) {
      ledgerColors.push({
        kind: 'hex',
        normalized: normalizeHexColor(hexMatch[0]),
        oklch: null,
        sourceEntry: ledgerEntry,
      });
    }
    OKLCH_PATTERN.lastIndex = 0;
    let oklchMatch;
    // eslint-disable-next-line no-cond-assign
    while ((oklchMatch = OKLCH_PATTERN.exec(summaryString)) !== null) {
      ledgerColors.push({
        kind: 'oklch',
        normalized: oklchMatch[0].toLowerCase(),
        oklch: parseOklchTriple(oklchMatch[1]),
        sourceEntry: ledgerEntry,
      });
    }
  }
  return ledgerColors;
}
