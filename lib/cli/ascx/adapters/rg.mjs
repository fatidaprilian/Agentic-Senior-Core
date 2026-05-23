export function compressRgOutput({ stdout, stderr, exitCode }) {
  const rawOutput = [stdout, stderr].filter(Boolean).join('\n');
  const lines = rawOutput.split(/\r?\n/u);
  
  // If exit code is non-zero and no output, rg found nothing or errored
  if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
    return {
      filterName: 'rg-summary',
      confident: true,
      truncated: false,
      output: exitCode === 0 ? 'No matches found.' : `ripgrep exited with code ${exitCode}`,
      preservedFields: {
        exitCode: true,
      },
    };
  }

  const outputLines = ['ripgrep results:'];
  const maxLines = 80;

  if (lines.length > maxLines) {
    outputLines.push(...lines.slice(0, maxLines));
    outputLines.push(`... truncated ${lines.length - maxLines} more lines of matches`);
    outputLines.push(`truncation: full search results available in the raw tee output`);
  } else {
    outputLines.push(...lines);
  }

  return {
    filterName: 'rg-summary',
    confident: true,
    truncated: lines.length > maxLines,
    output: outputLines.join('\n'),
    preservedFields: {
      exitCode: true,
      filePath: true, // We assume rg output contains file paths
    },
  };
}
