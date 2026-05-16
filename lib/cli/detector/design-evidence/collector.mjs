/**
 * Top-level orchestrator for the design evidence scan. Resolves which roots to
 * scan, walks the filesystem, and aggregates results from the inspection
 * passes into a single summary plus a flat metrics object that downstream
 * consumers (detector + UI rubric calibration) read.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import {
  ANIMATION_PATTERN,
  ARBITRARY_BREAKPOINT_PATTERN,
  COLOR_PATTERN,
  CSS_VARIABLE_DEFINITION_PATTERN,
  CSS_VARIABLE_REFERENCE_PATTERN,
  DURATION_PATTERN,
  FONT_FAMILY_PATTERN,
  FONT_SIZE_PATTERN,
  FRONTEND_FILE_SCAN_LIMIT,
  FRONTEND_FILE_SIZE_LIMIT_BYTES,
  FRONTEND_SCAN_DIRECTORY_NAMES,
  LETTER_SPACING_PATTERN,
  LINE_HEIGHT_PATTERN,
  MEDIA_QUERY_PATTERN,
  MEDIA_WIDTH_PATTERN,
  PROP_DRILLING_PATTERN,
  RAW_RADIUS_PATTERN,
  RAW_SHADOW_PATTERN,
  RAW_SPACING_PATTERN,
  TAILWIND_BREAKPOINT_PATTERN,
  TRANSITION_PATTERN,
} from './constants.mjs';
import { collectFrontendSourceFilePaths, registerSurfaceFile } from './file-traversal.mjs';
import { collectStructuredAttributeEvidence } from './structured-attribute-evidence.mjs';
import { createDesignEvidenceSummary } from './summary.mjs';
import {
  categorizeCssVariable,
  countPatternMatches,
  incrementCountMap,
  inferColorKind,
  pushSampleValue,
} from './utility-helpers.mjs';

function resolveCandidateDirectoryPaths(targetDirectoryPath, markerNames, scanRootDirectoryPaths) {
  const candidateDirectoryPaths = FRONTEND_SCAN_DIRECTORY_NAMES
    .filter((directoryName) => markerNames.has(directoryName))
    .map((directoryName) => path.join(targetDirectoryPath, directoryName));
  const explicitScanRootDirectoryPaths = Array.isArray(scanRootDirectoryPaths)
    ? scanRootDirectoryPaths.filter(
      (scanRootDirectoryPath) => typeof scanRootDirectoryPath === 'string' && scanRootDirectoryPath.trim().length > 0,
    )
    : [];
  if (explicitScanRootDirectoryPaths.length > 0) {
    return Array.from(new Set(explicitScanRootDirectoryPaths));
  }
  if (candidateDirectoryPaths.length > 0) {
    return candidateDirectoryPaths;
  }
  return [targetDirectoryPath];
}

export async function collectFrontendDesignEvidence({
  targetDirectoryPath,
  markerNames,
  scanRootDirectoryPaths = [],
}) {
  const resolvedCandidateDirectoryPaths = resolveCandidateDirectoryPaths(
    targetDirectoryPath,
    markerNames,
    scanRootDirectoryPaths,
  );
  const scannedFilePaths = [];
  const scanRootRelativePaths = resolvedCandidateDirectoryPaths
    .map((candidateDirectoryPath) => (
      path.relative(targetDirectoryPath, candidateDirectoryPath).replace(/\\/g, '/') || '.'
    ));
  const designEvidenceSummary = createDesignEvidenceSummary(scanRootRelativePaths);
  const cssVariableSamples = new Set();
  const colorSamples = new Set();
  const spacingSamples = new Set();
  const radiusSamples = new Set();
  const shadowSamples = new Set();
  const fontFamilySamples = new Set();
  const fontSizeSamples = new Set();
  const lineHeightSamples = new Set();
  const letterSpacingSamples = new Set();
  const durationSamples = new Set();
  const structuredClassAttributeSamples = new Set();
  const structuredInlineStyleSamples = new Set();
  const structuredUtilityFamilySamples = new Set();
  const seenSurfaceFiles = new Set();
  let hardcodedColorCount = 0;
  let propDrillingCandidateCount = 0;
  let mediaQueryCount = 0;
  let tailwindBreakpointUsageCount = 0;
  let arbitraryBreakpointCount = 0;
  const uniqueMediaWidths = new Set();

  for (const candidateDirectoryPath of resolvedCandidateDirectoryPaths) {
    await collectFrontendSourceFilePaths(candidateDirectoryPath, scannedFilePaths);
    if (scannedFilePaths.length >= FRONTEND_FILE_SCAN_LIMIT) {
      break;
    }
  }

  designEvidenceSummary.scannedFileCount = scannedFilePaths.length;

  for (const scannedFilePath of scannedFilePaths) {
    let sourceText;

    try {
      const fileStat = await fs.stat(scannedFilePath);
      if (fileStat.size > FRONTEND_FILE_SIZE_LIMIT_BYTES) {
        continue;
      }

      sourceText = await fs.readFile(scannedFilePath, 'utf8');
    } catch {
      continue;
    }

    registerSurfaceFile(designEvidenceSummary, targetDirectoryPath, scannedFilePath, seenSurfaceFiles);
    collectStructuredAttributeEvidence(
      sourceText,
      designEvidenceSummary,
      structuredClassAttributeSamples,
      structuredInlineStyleSamples,
      structuredUtilityFamilySamples,
    );

    for (const cssVariableMatch of sourceText.matchAll(CSS_VARIABLE_DEFINITION_PATTERN)) {
      designEvidenceSummary.cssVariables.definitionCount += 1;
      const variableName = cssVariableMatch[1];
      const categoryKey = categorizeCssVariable(variableName);
      incrementCountMap(designEvidenceSummary.cssVariables.categoryCounts, categoryKey);
      pushSampleValue(designEvidenceSummary.cssVariables.sampleNames, variableName, cssVariableSamples);
    }

    for (const cssVariableReferenceMatch of sourceText.matchAll(CSS_VARIABLE_REFERENCE_PATTERN)) {
      designEvidenceSummary.cssVariables.referenceCount += 1;
      pushSampleValue(
        designEvidenceSummary.cssVariables.sampleNames,
        cssVariableReferenceMatch[1],
        cssVariableSamples,
      );
    }

    for (const colorMatch of sourceText.matchAll(COLOR_PATTERN)) {
      const colorValue = colorMatch[0];
      hardcodedColorCount += 1;
      designEvidenceSummary.colors.hardcodedCount += 1;
      incrementCountMap(designEvidenceSummary.colors.kindCounts, inferColorKind(colorValue));
      pushSampleValue(designEvidenceSummary.colors.sampleValues, colorValue, colorSamples);
    }

    propDrillingCandidateCount += countPatternMatches(sourceText, PROP_DRILLING_PATTERN);
    mediaQueryCount += countPatternMatches(sourceText, MEDIA_QUERY_PATTERN);
    tailwindBreakpointUsageCount += countPatternMatches(sourceText, TAILWIND_BREAKPOINT_PATTERN);
    arbitraryBreakpointCount += countPatternMatches(sourceText, ARBITRARY_BREAKPOINT_PATTERN);
    designEvidenceSummary.tailwind.breakpointUsageCount += countPatternMatches(sourceText, TAILWIND_BREAKPOINT_PATTERN);
    designEvidenceSummary.tailwind.arbitraryBreakpointCount += countPatternMatches(sourceText, ARBITRARY_BREAKPOINT_PATTERN);

    for (const rawSpacingMatch of sourceText.matchAll(RAW_SPACING_PATTERN)) {
      designEvidenceSummary.spacing.rawValueCount += 1;
      pushSampleValue(designEvidenceSummary.spacing.sampleValues, rawSpacingMatch[1], spacingSamples);
    }

    for (const rawRadiusMatch of sourceText.matchAll(RAW_RADIUS_PATTERN)) {
      designEvidenceSummary.radius.rawValueCount += 1;
      pushSampleValue(designEvidenceSummary.radius.sampleValues, rawRadiusMatch[1], radiusSamples);
    }

    for (const rawShadowMatch of sourceText.matchAll(RAW_SHADOW_PATTERN)) {
      designEvidenceSummary.shadow.rawValueCount += 1;
      pushSampleValue(designEvidenceSummary.shadow.sampleValues, rawShadowMatch[1], shadowSamples);
    }

    for (const fontFamilyMatch of sourceText.matchAll(FONT_FAMILY_PATTERN)) {
      designEvidenceSummary.typography.fontFamilyCount += 1;
      pushSampleValue(designEvidenceSummary.typography.fontFamilySamples, fontFamilyMatch[1], fontFamilySamples);
    }

    for (const fontSizeMatch of sourceText.matchAll(FONT_SIZE_PATTERN)) {
      designEvidenceSummary.typography.fontSizeCount += 1;
      pushSampleValue(designEvidenceSummary.typography.fontSizeSamples, fontSizeMatch[1], fontSizeSamples);
    }

    for (const lineHeightMatch of sourceText.matchAll(LINE_HEIGHT_PATTERN)) {
      designEvidenceSummary.typography.lineHeightCount += 1;
      pushSampleValue(designEvidenceSummary.typography.lineHeightSamples, lineHeightMatch[1], lineHeightSamples);
    }

    for (const letterSpacingMatch of sourceText.matchAll(LETTER_SPACING_PATTERN)) {
      designEvidenceSummary.typography.letterSpacingCount += 1;
      pushSampleValue(
        designEvidenceSummary.typography.letterSpacingSamples,
        letterSpacingMatch[1],
        letterSpacingSamples,
      );
    }

    designEvidenceSummary.motion.transitionCount += countPatternMatches(sourceText, TRANSITION_PATTERN);
    designEvidenceSummary.motion.animationCount += countPatternMatches(sourceText, ANIMATION_PATTERN);

    for (const durationMatch of sourceText.matchAll(DURATION_PATTERN)) {
      designEvidenceSummary.motion.durationCount += 1;
      pushSampleValue(designEvidenceSummary.motion.durationSamples, durationMatch[0], durationSamples);
    }

    for (const mediaWidthMatch of sourceText.matchAll(MEDIA_WIDTH_PATTERN)) {
      uniqueMediaWidths.add(mediaWidthMatch[1]);
    }
  }

  designEvidenceSummary.tailwind.utilityFamilyCounts = {
    ...designEvidenceSummary.structuredInspection.utilityFamilyCounts,
  };
  designEvidenceSummary.tailwind.utilityFamilySamples = [
    ...designEvidenceSummary.structuredInspection.utilityFamilySamples,
  ];

  designEvidenceSummary.tokenBypassSignals = {
    hardcodedColorCount: designEvidenceSummary.colors.hardcodedCount,
    rawSpacingCount: designEvidenceSummary.spacing.rawValueCount,
    rawRadiusCount: designEvidenceSummary.radius.rawValueCount,
    rawShadowCount: designEvidenceSummary.shadow.rawValueCount,
    inlineHardcodedColorCount: designEvidenceSummary.structuredInspection.inlineTokenBypassSignals.hardcodedColorCount,
    inlineRawSpacingCount: designEvidenceSummary.structuredInspection.inlineTokenBypassSignals.rawSpacingCount,
    inlineRawRadiusCount: designEvidenceSummary.structuredInspection.inlineTokenBypassSignals.rawRadiusCount,
    inlineRawShadowCount: designEvidenceSummary.structuredInspection.inlineTokenBypassSignals.rawShadowCount,
    inlineCssVariableReferenceCount: designEvidenceSummary.structuredInspection.inlineTokenBypassSignals.cssVariableReferenceCount,
  };

  return {
    frontendEvidenceMetrics: {
      scannedFileCount: scannedFilePaths.length,
      hardcodedColorCount,
      propDrillingCandidateCount,
      mediaQueryCount,
      tailwindBreakpointUsageCount,
      arbitraryBreakpointCount,
      uniqueMediaWidthCount: uniqueMediaWidths.size,
      structuredClassAttributeCount: designEvidenceSummary.structuredInspection.classAttributeCount,
      boundClassExpressionCount: designEvidenceSummary.structuredInspection.boundClassExpressionCount,
      inlineStyleObjectCount: designEvidenceSummary.structuredInspection.inlineStyleObjectCount,
      inlineStyleBindingCount: designEvidenceSummary.structuredInspection.inlineStyleBindingCount,
      inlineStyleTokenBypassCount:
        designEvidenceSummary.structuredInspection.inlineTokenBypassSignals.hardcodedColorCount
        + designEvidenceSummary.structuredInspection.inlineTokenBypassSignals.rawSpacingCount
        + designEvidenceSummary.structuredInspection.inlineTokenBypassSignals.rawRadiusCount
        + designEvidenceSummary.structuredInspection.inlineTokenBypassSignals.rawShadowCount,
    },
    designEvidenceSummary,
  };
}
