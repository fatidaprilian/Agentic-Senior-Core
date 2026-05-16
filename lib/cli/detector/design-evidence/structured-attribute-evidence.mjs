/**
 * Structured attribute-aware inspection: counts class attributes, bound class
 * expressions, JSX/Vue inline styles, and Tailwind utility families seen in the
 * source. These metrics complement the raw regex pass with a structurally
 * aware view that better matches modern frontend authorship patterns.
 */

import {
  COLOR_PATTERN,
  CSS_VARIABLE_REFERENCE_PATTERN,
  EXPRESSION_CLASS_ATTRIBUTE_PATTERN,
  JSX_INLINE_STYLE_PATTERN,
  RAW_RADIUS_PATTERN,
  RAW_SHADOW_PATTERN,
  RAW_SPACING_PATTERN,
  STRING_CLASS_ATTRIBUTE_PATTERN,
  VUE_INLINE_STYLE_PATTERN,
} from './constants.mjs';
import {
  countPatternMatches,
  getFirstDefinedCapture,
  incrementCountMap,
  inferUtilityFamily,
  normalizeEvidenceSample,
  pushSampleValue,
} from './utility-helpers.mjs';

function collectTailwindUtilityFamilies(classValue, utilityFamilyCounts, utilityFamilySamples, utilityFamilySampleSet) {
  for (const utilityToken of String(classValue || '').split(/\s+/g)) {
    const utilityFamily = inferUtilityFamily(utilityToken);
    if (!utilityFamily) {
      continue;
    }

    incrementCountMap(utilityFamilyCounts, utilityFamily);
    pushSampleValue(utilityFamilySamples, utilityFamily, utilityFamilySampleSet);
  }
}

function applyInlineStyleInspection(styleSourceText, summary, styleSampleSet) {
  const normalizedStyleSource = normalizeEvidenceSample(styleSourceText);
  pushSampleValue(summary.structuredInspection.inlineStyleSamples, normalizedStyleSource, styleSampleSet);

  const hardcodedColorCount = countPatternMatches(styleSourceText, COLOR_PATTERN);
  const rawSpacingCount = countPatternMatches(styleSourceText, RAW_SPACING_PATTERN);
  const rawRadiusCount = countPatternMatches(styleSourceText, RAW_RADIUS_PATTERN);
  const rawShadowCount = countPatternMatches(styleSourceText, RAW_SHADOW_PATTERN);
  const cssVariableReferenceCount = countPatternMatches(styleSourceText, CSS_VARIABLE_REFERENCE_PATTERN);

  summary.structuredInspection.inlineTokenBypassSignals.hardcodedColorCount += hardcodedColorCount;
  summary.structuredInspection.inlineTokenBypassSignals.rawSpacingCount += rawSpacingCount;
  summary.structuredInspection.inlineTokenBypassSignals.rawRadiusCount += rawRadiusCount;
  summary.structuredInspection.inlineTokenBypassSignals.rawShadowCount += rawShadowCount;
  summary.structuredInspection.inlineTokenBypassSignals.cssVariableReferenceCount += cssVariableReferenceCount;
}

export function collectStructuredAttributeEvidence(
  sourceText,
  summary,
  classSampleSet,
  styleSampleSet,
  utilityFamilySampleSet,
) {
  for (const classAttributeMatch of sourceText.matchAll(STRING_CLASS_ATTRIBUTE_PATTERN)) {
    const classValue = getFirstDefinedCapture(classAttributeMatch.slice(1));
    if (!classValue) {
      continue;
    }

    summary.structuredInspection.classAttributeCount += 1;
    pushSampleValue(
      summary.structuredInspection.classAttributeSamples,
      normalizeEvidenceSample(classValue),
      classSampleSet,
    );
    collectTailwindUtilityFamilies(
      classValue,
      summary.structuredInspection.utilityFamilyCounts,
      summary.structuredInspection.utilityFamilySamples,
      utilityFamilySampleSet,
    );
  }

  for (const expressionClassAttributeMatch of sourceText.matchAll(EXPRESSION_CLASS_ATTRIBUTE_PATTERN)) {
    const expressionValue = getFirstDefinedCapture(expressionClassAttributeMatch.slice(1));
    if (!expressionValue) {
      continue;
    }

    summary.structuredInspection.boundClassExpressionCount += 1;
    pushSampleValue(
      summary.structuredInspection.classAttributeSamples,
      normalizeEvidenceSample(expressionValue),
      classSampleSet,
    );
  }

  for (const inlineStyleMatch of sourceText.matchAll(JSX_INLINE_STYLE_PATTERN)) {
    const inlineStyleSource = getFirstDefinedCapture(inlineStyleMatch.slice(1));
    if (!inlineStyleSource) {
      continue;
    }

    summary.structuredInspection.inlineStyleObjectCount += 1;
    applyInlineStyleInspection(inlineStyleSource, summary, styleSampleSet);
  }

  for (const vueInlineStyleMatch of sourceText.matchAll(VUE_INLINE_STYLE_PATTERN)) {
    const inlineStyleSource = getFirstDefinedCapture(vueInlineStyleMatch.slice(1));
    if (!inlineStyleSource) {
      continue;
    }

    summary.structuredInspection.inlineStyleBindingCount += 1;
    applyInlineStyleInspection(inlineStyleSource, summary, styleSampleSet);
  }
}
