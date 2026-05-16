/**
 * Default-shaped design evidence summary. Constructed once per scan and then
 * mutated in place by the collector and inspection passes. Keeping the default
 * shape in one place makes downstream consumers diff-stable when adding new
 * counters: add the field here once, and every scan starts with it.
 */

export function createDesignEvidenceSummary(scanRootRelativePaths) {
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
