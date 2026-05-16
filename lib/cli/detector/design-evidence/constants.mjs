/**
 * Static configuration and regex patterns for the lightweight static design
 * evidence scan. Kept in one place so the scanner internals stay pattern-driven
 * and reviewable.
 */

export const FRONTEND_SCAN_DIRECTORY_NAMES = ['src', 'app', 'pages', 'components', 'styles'];
export const FRONTEND_SCAN_FILE_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.vue', '.css', '.scss', '.sass',
]);
export const FRONTEND_SCAN_IGNORE_DIRECTORY_NAMES = new Set([
  '.git', 'node_modules', '.next', 'dist', 'build', 'coverage',
]);
export const FRONTEND_FILE_SCAN_LIMIT = 200;
export const FRONTEND_FILE_SIZE_LIMIT_BYTES = 200_000;
export const DESIGN_EVIDENCE_SAMPLE_LIMIT = 12;

export const COLOR_PATTERN = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\)|oklch\([^)]+\)/g;
export const PROP_DRILLING_PATTERN = /<[A-Z][A-Za-z0-9_.:-]*(?:\s+[A-Za-z0-9_:-]+=\{[^}]+\}){5,}/g;
export const MEDIA_QUERY_PATTERN = /@media\b/g;
export const TAILWIND_BREAKPOINT_PATTERN = /\b(?:sm|md|lg|xl|2xl):/g;
export const ARBITRARY_BREAKPOINT_PATTERN = /\b(?:min|max)-\[[^\]]+\]:/g;
export const CSS_VARIABLE_DEFINITION_PATTERN = /--([a-zA-Z0-9-_]+)\s*:/g;
export const CSS_VARIABLE_REFERENCE_PATTERN = /var\(--([a-zA-Z0-9-_]+)\)/g;
export const RAW_SPACING_PATTERN = /\b(?:margin|padding|gap|column-gap|row-gap|min-width|max-width|min-height|max-height|width|height|top|right|bottom|left|inset|spaceBetween|paddingInline|paddingBlock|marginInline|marginBlock|gapX|gapY|spaceX|spaceY)\b[^;\n:]*[:=]\s*['"`{(]*(-?[0-9.]+(?:px|rem|em|vh|vw))/gi;
export const RAW_RADIUS_PATTERN = /\b(?:border-radius|borderRadius)\b[^;\n:]*[:=]\s*['"`{(]*([0-9.]+(?:px|rem|em)|9999px)/gi;
export const RAW_SHADOW_PATTERN = /\b(?:box-shadow|boxShadow)\b[^;\n:]*[:=]\s*['"`{(]*([^;\n}]+)/gi;
export const FONT_FAMILY_PATTERN = /\b(?:font-family|fontFamily)\b[^;\n:]*[:=]\s*['"`{(]*([^;\n}]+)/gi;
export const FONT_SIZE_PATTERN = /\b(?:font-size|fontSize)\b[^;\n:]*[:=]\s*['"`{(]*([0-9.]+(?:px|rem|em))/gi;
export const LINE_HEIGHT_PATTERN = /\b(?:line-height|lineHeight)\b[^;\n:]*[:=]\s*['"`{(]*([0-9.]+(?:px|rem|em)?)/gi;
export const LETTER_SPACING_PATTERN = /\b(?:letter-spacing|letterSpacing)\b[^;\n:]*[:=]\s*['"`{(]*([0-9.-]+(?:px|rem|em))/gi;
export const TRANSITION_PATTERN = /\btransition(?:-[a-z]+)?\b/g;
export const ANIMATION_PATTERN = /\banimation(?:-[a-z]+)?\b/g;
export const DURATION_PATTERN = /\b\d+(?:\.\d+)?m?s\b/g;
export const MEDIA_WIDTH_PATTERN = /\((?:min|max)-width:\s*([0-9.]+(?:px|rem|em))\)/g;
export const STRING_CLASS_ATTRIBUTE_PATTERN = /\b(?:className|class)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{"([^"]*)"\}|\{'([^']*)'\})/g;
export const EXPRESSION_CLASS_ATTRIBUTE_PATTERN = /\b(?:className|class|:class)\s*=\s*\{([^}\n]+)\}/g;
export const JSX_INLINE_STYLE_PATTERN = /\bstyle\s*=\s*\{\{([\s\S]*?)\}\}/g;
export const VUE_INLINE_STYLE_PATTERN = /\b:style\s*=\s*["']\{([^"']*)\}["']/g;
