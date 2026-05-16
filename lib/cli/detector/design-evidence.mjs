/**
 * Aggregator re-export for the design evidence scan. Implementation lives in
 * lib/cli/detector/design-evidence/* split per concern. Importers continue to
 * import the same public surface (collectFrontendDesignEvidence and
 * FRONTEND_SCAN_IGNORE_DIRECTORY_NAMES) from this module.
 *
 * Public schema produced by collectFrontendDesignEvidence (kept here so static
 * tooling can confirm the expected shape without crawling sub-files):
 *
 *   designEvidenceSummary.summaryVersion: 'v1'
 *   designEvidenceSummary.source: 'lightweight-static-scan'
 *   designEvidenceSummary.cssVariables.{ definitionCount, referenceCount, sampleNames, categoryCounts }
 *   designEvidenceSummary.componentInventory.{ componentFileCount, pageFileCount, layoutFileCount, surfaceFileSamples }
 *   designEvidenceSummary.structuredInspection.{ classAttributeCount, inlineStyleObjectCount, ... }
 *   designEvidenceSummary.tokenBypassSignals.{ hardcodedColorCount, rawSpacingCount, rawRadiusCount, rawShadowCount, ... }
 *   designEvidenceSummary.tailwind.{ breakpointUsageCount, arbitraryBreakpointCount, utilityFamilyCounts, ... }
 *
 *   frontendEvidenceMetrics.{ scannedFileCount, hardcodedColorCount, propDrillingCandidateCount,
 *     mediaQueryCount, tailwindBreakpointUsageCount, arbitraryBreakpointCount,
 *     uniqueMediaWidthCount, structuredClassAttributeCount, boundClassExpressionCount,
 *     inlineStyleObjectCount, inlineStyleBindingCount, inlineStyleTokenBypassCount }
 */

export { FRONTEND_SCAN_IGNORE_DIRECTORY_NAMES } from './design-evidence/constants.mjs';
export { collectFrontendDesignEvidence } from './design-evidence/collector.mjs';
