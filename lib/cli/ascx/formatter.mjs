import {
  calculateReductionPercent,
  estimateOutputTokens,
  ASCX_TOKEN_ESTIMATE_METHOD,
} from './token-estimate.mjs';

export const HIGH_RISK_REDUCTION_PERCENT = 80;

export function buildAscxFooter({
  classification,
  commandText,
  compactOutput,
  exitCode,
  filterName,
  rawOutput,
  rawTeePath,
}) {
  const rawTokens = estimateOutputTokens(rawOutput);
  const outputTokens = estimateOutputTokens(compactOutput);
  const reductionPercent = calculateReductionPercent(rawTokens, outputTokens);

  return {
    rawTokens,
    outputTokens,
    reductionPercent,
    text: [
      '[ascx]',
      `command: ${commandText}`,
      `exit: ${exitCode}`,
      `classification: ${classification}`,
      `filter: ${filterName}`,
      `token_method: ${ASCX_TOKEN_ESTIMATE_METHOD}`,
      `raw_tokens: ${rawTokens}`,
      `output_tokens: ${outputTokens}`,
      `reduction: ${reductionPercent}%`,
      `raw_output: ${rawTeePath || 'none'}`,
    ].join('\n'),
  };
}

export function shouldWriteSafetyTee({ adapterResult, exitCode, reductionPercent }) {
  if (exitCode !== 0) return true;
  if (adapterResult.truncated === true) return true;
  if (adapterResult.confident === false) return true;
  if (adapterResult.confident !== true && reductionPercent >= HIGH_RISK_REDUCTION_PERCENT) return true;
  return false;
}
