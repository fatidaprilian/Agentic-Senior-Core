/**
 * Small pure helpers shared across the static design evidence scan modules.
 * Kept side-effect free so each can be tested in isolation.
 */

import { DESIGN_EVIDENCE_SAMPLE_LIMIT } from './constants.mjs';

export function countPatternMatches(sourceText, pattern) {
  return Array.from(sourceText.matchAll(pattern)).length;
}

export function pushSampleValue(targetSamples, value, targetSet) {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue || targetSet.has(normalizedValue)) {
    return;
  }

  targetSet.add(normalizedValue);
  if (targetSamples.length < DESIGN_EVIDENCE_SAMPLE_LIMIT) {
    targetSamples.push(normalizedValue);
  }
}

export function incrementCountMap(countMap, key) {
  countMap[key] = (countMap[key] || 0) + 1;
}

export function getFirstDefinedCapture(matchGroups) {
  for (const capturedValue of matchGroups) {
    if (typeof capturedValue === 'string' && capturedValue.trim().length > 0) {
      return capturedValue;
    }
  }

  return '';
}

export function normalizeEvidenceSample(rawValue) {
  return String(rawValue || '').replace(/\s+/g, ' ').trim();
}

export function categorizeCssVariable(variableName) {
  const normalizedVariableName = String(variableName || '').trim().toLowerCase();

  if (/(color|surface|accent|bg|text|border|fill|stroke|ink|tone)/.test(normalizedVariableName)) {
    return 'color';
  }

  if (/(space|gap|padding|margin|size|width|height|inset)/.test(normalizedVariableName)) {
    return 'spacing';
  }

  if (/(radius|rounded|corner)/.test(normalizedVariableName)) {
    return 'radius';
  }

  if (/(shadow|elevation)/.test(normalizedVariableName)) {
    return 'shadow';
  }

  if (/(font|type|line|letter|tracking|leading)/.test(normalizedVariableName)) {
    return 'typography';
  }

  if (/(motion|duration|easing|ease|animation|transition)/.test(normalizedVariableName)) {
    return 'motion';
  }

  return 'other';
}

export function inferColorKind(colorValue) {
  if (/^#/i.test(colorValue)) {
    return 'hex';
  }

  if (/^rgba?\(/i.test(colorValue)) {
    return 'rgb';
  }

  if (/^hsla?\(/i.test(colorValue)) {
    return 'hsl';
  }

  if (/^oklch\(/i.test(colorValue)) {
    return 'oklch';
  }

  return 'other';
}

export function inferUtilityFamily(rawUtilityToken) {
  const normalizedUtilityToken = String(rawUtilityToken || '')
    .trim()
    .split(':')
    .pop()
    ?.replace(/^!/, '')
    ?.replace(/\/.+$/, '')
    ?.trim();

  if (!normalizedUtilityToken) {
    return '';
  }

  if (/^grid(?:-|$)/.test(normalizedUtilityToken)) {
    return 'grid';
  }

  if (/^flex(?:-|$)/.test(normalizedUtilityToken)) {
    return 'flex';
  }

  if (/^(?:block|inline|hidden|contents)$/.test(normalizedUtilityToken)) {
    return normalizedUtilityToken;
  }

  if (/^(?:min|max)-\[/.test(normalizedUtilityToken)) {
    return 'arbitrary-breakpoint';
  }

  return normalizedUtilityToken.split('-')[0];
}
