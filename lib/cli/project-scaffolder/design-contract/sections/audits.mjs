/**
 * Audit policy sections of the design intent contract: AI-safe UI audit,
 * production content policy, motion-palette decision contract, and the
 * accessibility policy. These are the gates that fire before UI implementation.
 */

export function buildMotionPaletteDecisionSection() {
  return {
    productCategorySignal: 'agent-inferred-starting-heuristic',
    densityDecisionSource: 'Choose motion density from task, content, brand, device, performance, and accessibility. Categories are heuristics.',
    requiredInteractionStates: ['default', 'hover', 'focus-visible', 'active', 'disabled', 'loading', 'empty', 'error', 'success', 'transition'],
    paletteAutopilotRisks: ['dark-slate-default', 'cream-beige-default', 'purple-blue-gradient-default', 'monochrome-template-default', 'uniform-card-surface-default', 'generic-grid-wallpaper-default', 'generic-line-wallpaper-default', 'calibration-mark-wallpaper-default', 'soft-glow-ai-template-default', 'cyber-neon-terminal-default'],
    spatialDecision: 'State 3D/canvas/WebGL fit. If omitted, name product-fit reason and replacement interaction quality.',
  };
}

export function buildAiSafeUiAuditSection({ projectName }) {
  return {
    status: 'agent-must-complete-before-ui-implementation',
    failureDefinition: 'AI-safe UI uses template cards, generic marks, decorative grid or line wallpaper, calibration-mark wallpaper, test/demo/placeholder copy, terminal-only user paths, safe palettes, glow backgrounds, or copied scaffold composition.',
    interchangeabilityTest: `If this UI can be renamed from ${projectName} to another product category without changing composition, palette, iconography, and motion, revise it.`,
    requiredProductSpecificSignals: [
      'agent-defined-product-specific-data-treatment',
      'agent-defined-product-specific-motion-or-state-behavior',
      'agent-defined-product-specific-morphology-iconography-or-spatial-structure',
    ],
    paletteExplorationRule: 'Use a visually exploratory product-derived palette with WCAG contrast and status clarity.',
    backgroundPatternRule: 'Lines, grids, scanlines, noise, glows, blobs, logos, calibration marks, and geometry must serve a named product function; never use grid, line, or calibration-mark backgrounds as first-output filler. Measurement and inspection marks belong to task overlays or controls, not page wallpaper.',
    aiColorAudit: {
      status: 'agent-must-complete-before-ui-implementation',
      failureDefinition: 'AI color drift uses safe defaults before deriving roles from the product anchor.',
      autopilotRisks: ['cream-editorial-default', 'dark-slate-dashboard-default', 'purple-blue-gradient-default', 'monochrome-minimal-default', 'cyber-neon-terminal-default', 'soft-glow-atmosphere-default'],
      requiredEvidence: [
        'anchor-derived-color-logic',
        'semantic-role-contrast-beyond-surface-decoration',
        'product-specific-color-behavior-that-would-not-transfer',
      ],
      reviewQuestion: 'Why does this palette belong to this product?',
    },
    motionSpatialCourageAudit: {
      status: 'agent-must-complete-before-ui-implementation',
      defaultStance: 'Treat motion, scroll choreography, canvas, WebGL, and 3D as first-class options.',
      requiredDecisionFields: [
        'signature-motion-or-interaction',
        'spatial-or-3d-fit',
        'performance-and-reduced-motion-fallback',
      ],
      rejectionRule: 'State a product reason and replacement interaction quality before omitting 3D/canvas. Package count or vague performance fear is not enough.',
      reviewQuestion: 'Is the interaction as expressive as the product can responsibly support?',
    },
    reviewQuestion: 'What visible evidence proves this is product-specific?',
    blockingByDefault: true,
  };
}

export function buildProductionContentPolicySection() {
  return {
    status: 'agent-must-complete-before-ui-implementation',
    userFacingCopyRule: 'Visible UI copy must be product-ready and task-specific. Do not ship testing, demo, sample, placeholder, lorem, TODO, coming soon, or scaffold labels unless they are real product states.',
    terminalDependencyRule: 'User-facing workflows must be operable through the UI unless the product is explicitly a CLI, developer tool, or operational runbook. Terminal commands belong in setup and deployment docs, not as the only path for core user tasks.',
    allowedExceptions: [
      'test-harness-only',
      'documented-empty-state',
      'admin-or-devtool-diagnostic-surface',
      'explicit-user-requested-prototype',
    ],
    reviewQuestion: 'Can this UI be shipped to real users without removing test/demo copy or terminal-only workflow dependencies?',
    blockingByDefault: true,
  };
}

export function buildAccessibilityPolicySection() {
  return {
    hardComplianceFloor: 'WCAG-2.2-AA',
    advisoryContrastModel: 'APCA',
    failOnHardViolations: true,
    advisoryFindingsDoNotBlockByDefault: true,
    hardRequirements: {
      textContrastMinimum: true,
      nonTextContrast: true,
      useOfColorOnlyProhibited: true,
      focusVisible: true,
      focusAppearance: true,
      targetSizeMinimum: true,
      keyboardAccess: true,
      reflowRequired: true,
      accessibleAuthenticationMinimum: true,
      statusMessagesAndDynamicStateAccess: true,
    },
    advisoryChecks: {
      perceptualContrastReview: true,
      darkModeContrastTuning: true,
      typographyReadabilityTuning: true,
    },
  };
}
