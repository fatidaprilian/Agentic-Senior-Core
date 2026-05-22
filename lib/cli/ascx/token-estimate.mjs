export const ASCX_TOKEN_ESTIMATE_METHOD = 'chars-div-4-local-estimate';

export function estimateOutputTokens(outputText) {
  const textLength = String(outputText || '').length;
  return Math.max(0, Math.ceil(textLength / 4));
}

export function calculateReductionPercent(rawTokens, compactTokens) {
  if (rawTokens <= 0) {
    return 0;
  }

  const reducedTokens = Math.max(0, rawTokens - compactTokens);
  return Number(((reducedTokens / rawTokens) * 100).toFixed(2));
}
