import fs from 'node:fs/promises';
import path from 'node:path';

const FRONTEND_SCAN_DIRECTORY_NAMES = ['src', 'app', 'pages', 'components', 'styles'];
const FRONTEND_SCAN_FILE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue', '.css', '.scss', '.sass']);
export const FRONTEND_SCAN_IGNORE_DIRECTORY_NAMES = new Set(['.git', 'node_modules', '.next', 'dist', 'build', 'coverage']);
const FRONTEND_FILE_SCAN_LIMIT = 200;
const FRONTEND_FILE_SIZE_LIMIT_BYTES = 200_000;
const DESIGN_EVIDENCE_SAMPLE_LIMIT = 12;
const COLOR_PATTERN = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)|oklch\([^)]+\)/g;
const PROP_DRILLING_PATTERN = /<[A-Z][A-Za-z0-9_.:-]*(?:\s+[A-Za-z0-9_:-]+=\{[^}]+\}){5,}/g;
const MEDIA_QUERY_PATTERN = /@media\b/g;
const TAILWIND_BREAKPOINT_PATTERN = /\b(?:sm|md|lg|xl|2xl):/g;
const ARBITRARY_BREAKPOINT_PATTERN = /\b(?:min|max)-\[[^\]]+\]:/g;
const CSS_VARIABLE_DEFINITION_PATTERN = /--([a-zA-Z0-9-_]+)\s*:/g;
const CSS_VARIABLE_REFERENCE_PATTERN = /var\(--([a-zA-Z0-9-_]+)\)/g;
const RAW_SPACING_PATTERN = /\b(?:margin|padding|gap|column-gap|row-gap|min-width|max-width|min-height|max-height|width|height|top|right|bottom|left|inset|spaceBetween|paddingInline|paddingBlock|marginInline|marginBlock|gapX|gapY|spaceX|spaceY)\b[^;\n:]*[:=]\s*['"`{(]*(-?[0-9.]+(?:px|rem|em|vh|vw))/gi;
const RAW_RADIUS_PATTERN = /\b(?:border-radius|borderRadius)\b[^;\n:]*[:=]\s*['"`{(]*([0-9.]+(?:px|rem|em)|9999px)/gi;
const RAW_SHADOW_PATTERN = /\b(?:box-shadow|boxShadow)\b[^;\n:]*[:=]\s*['"`{(]*([^;\n}]+)/gi;
const FONT_FAMILY_PATTERN = /\b(?:font-family|fontFamily)\b[^;\n:]*[:=]\s*['"`{(]*([^;\n}]+)/gi;
const FONT_SIZE_PATTERN = /\b(?:font-size|fontSize)\b[^;\n:]*[:=]\s*['"`{(]*([0-9.]+(?:px|rem|em))/gi;
const LINE_HEIGHT_PATTERN = /\b(?:line-height|lineHeight)\b[^;\n:]*[:=]\s*['"`{(]*([0-9.]+(?:px|rem|em)?)/gi;
const LETTER_SPACING_PATTERN = /\b(?:letter-spacing|letterSpacing)\b[^;\n:]*[:=]\s*['"`{(]*([0-9.-]+(?:px|rem|em))/gi;
const TRANSITION_PATTERN = /\btransition(?:-[a-z]+)?\b/g;
const ANIMATION_PATTERN = /\banimation(?:-[a-z]+)?\b/g;
const DURATION_PATTERN = /\b\d+(?:\.\d+)?m?s\b/g;
const MEDIA_WIDTH_PATTERN = /\((?:min|max)-width:\s*([0-9.]+(?:px|rem|em))\)/g;
const STRING_CLASS_ATTRIBUTE_PATTERN = /\b(?:className|class)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{"([^"]*)"\}|\{'([^']*)'\})/g;
const EXPRESSION_CLASS_ATTRIBUTE_PATTERN = /\b(?:className|class|:class)\s*=\s*\{([^}\n]+)\}/g;
const JSX_INLINE_STYLE_PATTERN = /\bstyle\s*=\s*\{\{([\s\S]*?)\}\}/g;
const VUE_INLINE_STYLE_PATTERN = /\b:style\s*=\s*["']\{([^"']*)\}["']/g;

async function collectFrontendSourceFilePaths(directoryPath, collectedFilePaths = []) {
  if (collectedFilePaths.length >= FRONTEND_FILE_SCAN_LIMIT) {
    return collectedFilePaths;
  }

  let directoryEntries;
  try {
    directoryEntries = await fs.readdir(directoryPath, { withFileTypes: true });
  } catch {
    return collectedFilePaths;
  }

  for (const directoryEntry of directoryEntries) {
    if (collectedFilePaths.length >= FRONTEND_FILE_SCAN_LIMIT) {
      break;
    }

    if (directoryEntry.isDirectory()) {
      if (FRONTEND_SCAN_IGNORE_DIRECTORY_NAMES.has(directoryEntry.name)) {
        continue;
      }

      await collectFrontendSourceFilePaths(path.join(directoryPath, directoryEntry.name), collectedFilePaths);
      continue;
    }

    const fileExtension = path.extname(directoryEntry.name).toLowerCase();
    if (FRONTEND_SCAN_FILE_EXTENSIONS.has(fileExtension)) {
      collectedFilePaths.push(path.join(directoryPath, directoryEntry.name));
    }
  }

  return collectedFilePaths;
}

function countPatternMatches(sourceText, pattern) {
  return Array.from(sourceText.matchAll(pattern)).length;
}

function pushSampleValue(targetSamples, value, targetSet) {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue || targetSet.has(normalizedValue)) {
    return;
  }

  targetSet.add(normalizedValue);
  if (targetSamples.length < DESIGN_EVIDENCE_SAMPLE_LIMIT) {
    targetSamples.push(normalizedValue);
  }
}

function categorizeCssVariable(variableName) {
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

function inferColorKind(colorValue) {
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

function incrementCountMap(countMap, key) {
  countMap[key] = (countMap[key] || 0) + 1;
}

function getFirstDefinedCapture(matchGroups) {
  for (const capturedValue of matchGroups) {
    if (typeof capturedValue === 'string' && capturedValue.trim().length > 0) {
      return capturedValue;
    }
  }

  return '';
}

function normalizeEvidenceSample(rawValue) {
  return String(rawValue || '').replace(/\s+/g, ' ').trim();
}

function inferUtilityFamily(rawUtilityToken) {
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

function collectStructuredAttributeEvidence(sourceText, summary, classSampleSet, styleSampleSet, utilityFamilySampleSet) {
  for (const classAttributeMatch of sourceText.matchAll(STRING_CLASS_ATTRIBUTE_PATTERN)) {
    const classValue = getFirstDefinedCapture(classAttributeMatch.slice(1));
    if (!classValue) {
      continue;
    }

    summary.structuredInspection.classAttributeCount += 1;
    pushSampleValue(
      summary.structuredInspection.classAttributeSamples,
      normalizeEvidenceSample(classValue),
      classSampleSet
    );
    collectTailwindUtilityFamilies(
      classValue,
      summary.structuredInspection.utilityFamilyCounts,
      summary.structuredInspection.utilityFamilySamples,
      utilityFamilySampleSet
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
      classSampleSet
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

function createDesignEvidenceSummary(scanRootRelativePaths) {
  return {
    summaryVersion: 'v1',
    source: 'lightweight-static-scan',
    scanRootRelativePaths,
    scannedFileCount: 0,
    cssVariables: {
      definitionCount: 0,
      referenceCount: 0,
      sampleNames: [],
      categoryCounts: {
        color: 0,
        spacing: 0,
        radius: 0,
        shadow: 0,
        typography: 0,
        motion: 0,
        other: 0,
      },
    },
    colors: {
      hardcodedCount: 0,
      kindCounts: {
        hex: 0,
        rgb: 0,
        hsl: 0,
        oklch: 0,
        other: 0,
      },
      sampleValues: [],
    },
    spacing: {
      rawValueCount: 0,
      sampleValues: [],
    },
    radius: {
      rawValueCount: 0,
      sampleValues: [],
    },
    shadow: {
      rawValueCount: 0,
      sampleValues: [],
    },
    typography: {
      fontFamilyCount: 0,
      fontSizeCount: 0,
      lineHeightCount: 0,
      letterSpacingCount: 0,
      fontFamilySamples: [],
      fontSizeSamples: [],
      lineHeightSamples: [],
      letterSpacingSamples: [],
    },
    motion: {
      transitionCount: 0,
      animationCount: 0,
      durationCount: 0,
      durationSamples: [],
    },
    tailwind: {
      breakpointUsageCount: 0,
      arbitraryBreakpointCount: 0,
      utilityFamilyCounts: {},
      utilityFamilySamples: [],
    },
    componentInventory: {
      componentFileCount: 0,
      pageFileCount: 0,
      layoutFileCount: 0,
      surfaceFileSamples: [],
    },
    structuredInspection: {
      mode: 'attribute-aware-static-scan',
      classAttributeCount: 0,
      boundClassExpressionCount: 0,
      inlineStyleObjectCount: 0,
      inlineStyleBindingCount: 0,
      classAttributeSamples: [],
      inlineStyleSamples: [],
      utilityFamilyCounts: {},
      utilityFamilySamples: [],
      inlineTokenBypassSignals: {
        hardcodedColorCount: 0,
        rawSpacingCount: 0,
        rawRadiusCount: 0,
        rawShadowCount: 0,
        cssVariableReferenceCount: 0,
      },
    },
    tokenBypassSignals: {
      hardcodedColorCount: 0,
      rawSpacingCount: 0,
      rawRadiusCount: 0,
      rawShadowCount: 0,
      inlineHardcodedColorCount: 0,
      inlineRawSpacingCount: 0,
      inlineRawRadiusCount: 0,
      inlineRawShadowCount: 0,
      inlineCssVariableReferenceCount: 0,
    },
  };
}

function registerSurfaceFile(summary, targetDirectoryPath, scannedFilePath, seenSurfaceFiles) {
  const relativeFilePath = path.relative(targetDirectoryPath, scannedFilePath).replace(/\\/g, '/');
  const normalizedBaseName = path.basename(scannedFilePath, path.extname(scannedFilePath)).toLowerCase();
  const looksLikeComponent = /[A-Z]/.test(path.basename(scannedFilePath, path.extname(scannedFilePath)))
    || relativeFilePath.includes('/components/')
    || relativeFilePath.startsWith('components/');
  const looksLikePage = normalizedBaseName === 'page'
    || normalizedBaseName === 'index'
    || relativeFilePath.includes('/pages/')
    || relativeFilePath.startsWith('pages/')
    || relativeFilePath.includes('/app/');
  const looksLikeLayout = normalizedBaseName === 'layout' || relativeFilePath.includes('/layouts/');

  if (looksLikeComponent) {
    summary.componentInventory.componentFileCount += 1;
  }

  if (looksLikePage) {
    summary.componentInventory.pageFileCount += 1;
  }

  if (looksLikeLayout) {
    summary.componentInventory.layoutFileCount += 1;
  }

  if ((looksLikeComponent || looksLikePage || looksLikeLayout) && !seenSurfaceFiles.has(relativeFilePath)) {
    seenSurfaceFiles.add(relativeFilePath);
    if (summary.componentInventory.surfaceFileSamples.length < DESIGN_EVIDENCE_SAMPLE_LIMIT) {
      summary.componentInventory.surfaceFileSamples.push(relativeFilePath);
    }
  }
}

function collectSampleMatches(sourceText, pattern, targetSamples, targetSet, transform = (match) => match[1] || match[0]) {
  for (const match of sourceText.matchAll(pattern)) {
    pushSampleValue(targetSamples, transform(match), targetSet);
  }
}

export async function collectFrontendDesignEvidence({
  targetDirectoryPath,
  markerNames,
  scanRootDirectoryPaths = [],
}) {
  const candidateDirectoryPaths = FRONTEND_SCAN_DIRECTORY_NAMES
    .filter((directoryName) => markerNames.has(directoryName))
    .map((directoryName) => path.join(targetDirectoryPath, directoryName));
  const explicitScanRootDirectoryPaths = Array.isArray(scanRootDirectoryPaths)
    ? scanRootDirectoryPaths.filter((scanRootDirectoryPath) => typeof scanRootDirectoryPath === 'string' && scanRootDirectoryPath.trim().length > 0)
    : [];
  const resolvedCandidateDirectoryPaths = explicitScanRootDirectoryPaths.length > 0
    ? Array.from(new Set(explicitScanRootDirectoryPaths))
    : candidateDirectoryPaths.length > 0
      ? candidateDirectoryPaths
      : [targetDirectoryPath];
  const scannedFilePaths = [];
  const scanRootRelativePaths = resolvedCandidateDirectoryPaths
    .map((candidateDirectoryPath) => path.relative(targetDirectoryPath, candidateDirectoryPath).replace(/\\/g, '/') || '.');
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
  const utilityFamilySamples = new Set();
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
      structuredUtilityFamilySamples
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
        cssVariableSamples
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
        letterSpacingSamples
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
