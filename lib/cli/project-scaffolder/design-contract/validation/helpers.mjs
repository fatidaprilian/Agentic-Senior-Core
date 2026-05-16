/**
 * Tiny validator helpers shared across the design contract validation
 * sub-modules. Pure, side-effect free.
 */

export function hasNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
