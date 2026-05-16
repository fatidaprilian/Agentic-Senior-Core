/**
 * Vocabulary lists for genericity / forbidden / valid-bold drift signals used
 * across the design contract. Kept in one file so additions and removals stay
 * traceable.
 */

export const GENERICITY_DRIFT_SIGNALS = [
  'offline-prescribed-style-used-as-final-direction',
  'unresearched-library-or-framework-choice',
  'missing-conceptual-anchor-without-external-research',
  'visual-decisions-not-derived-from-conceptual-anchor',
  'ai-safe-ui-template-look',
  'ai-color-default-palette-without-product-role-behavior',
  'brandless-clean-template-look',
  'interchangeable-product-renaming-test-fails',
  'decorative-grid-or-glow-wallpaper-without-product-function',
  'decorative-line-or-calibration-wallpaper-without-product-function',
  'measurement-or-calibration-marks-used-as-page-background',
  'testing-demo-or-placeholder-copy-shipped-to-ui',
  'terminal-only-user-flow-without-product-reason',
  'safe-cream-slate-or-monochrome-palette-used-as-readability-excuse',
  'generic-abstract-logo-or-iconography',
  'timid-anchor-that-renames-dashboard-or-admin-shell',
  'motion-suppressed-without-accessibility-or-performance-reason',
  'motion-or-3d-omitted-from-fear-without-fit-analysis',
  'modern-library-rejected-from-dependency-fear-without-tradeoff-analysis',
  'component-library-selected-by-habit-without-product-fit',
  'scale-only-responsive-layout',
  'zero-based-redesign-kept-prior-visual-dna',
  'restyle-instead-of-recomposition',
  'literal-anchor-artifacts-used-as-required-ui-chrome',
  'candidate-signature-move-treated-as-locked-implementation',
  'library-theme-tokens-drive-visual-language',
  'spatial-room-anchor-used-by-habit',
  'place-metaphor-used-as-layout-model-without-product-function',
  'external-website-reference-copied-as-style',
  'tailwind-only-or-component-kit-used-as-neutrality-claim',
  'framework-selected-by-familiarity-instead-of-evidence',
  'manual-framework-scaffold-used-when-official-setup-fits',
];

export const FORBIDDEN_PATTERN_SIGNALS = [
  ...GENERICITY_DRIFT_SIGNALS.filter((signal) => signal !== 'unresearched-library-or-framework-choice'),
  'single-safe-typographic-family-without-role-contrast-or-rationale',
];

export const VALID_BOLD_SIGNALS = [
  'single-cohesive-conceptual-anchor',
  'high-variance-candidate-selection',
  'context-derived-visual-direction',
  'three-at-a-glance-product-specific-signals',
  'visually-exploratory-accessible-palette-derived-from-product',
  'audacious-accessible-palette-with-product-role-behavior',
  'background-or-geometry-serves-product-function',
  'motion-or-spatial-experience-derived-from-anchor',
  'explicit-3d-canvas-fit-or-nonfit-decision',
  'official-docs-backed-modern-library-choice',
  'headless-or-component-primitive-restyled-to-product-language',
  'responsive-recomposition-by-task-priority',
  'purposeful-motion-with-reduced-motion-path',
  'non-spatial-product-anchor-or-workflow-mechanism',
  'official-scaffolder-used-for-supported-project-shape',
  'framework-choice-compared-against-plausible-alternative',
];
