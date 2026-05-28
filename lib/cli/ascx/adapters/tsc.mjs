const ERROR_LINE_PATTERN = /(?:error TS\d+:|Error:)/iu;
const FILE_LINE_PATTERN = /(?:[A-Za-z]:)?[^:\s]+?\.(?:ts|tsx|js|jsx):\d+,\d+/u;

function pushUniqueLine(lines, nextLine) {
  const normalizedLine = String(nextLine || '').trimEnd();
  if (normalizedLine && !lines.includes(normalizedLine)) {
    lines.push(normalizedLine);
  }
}

export function compressTscOutput({ stdout, stderr, exitCode }) {
  const rawOutput = [stdout, stderr].filter(Boolean).join('\n');
  const lines = rawOutput.split(/\r?\n/u);
  
  if (exitCode === 0) {
    return {
      filterName: 'tsc-summary',
      confident: true,
      truncated: false,
      output: 'tsc summary:\nresult: passed',
      preservedFields: {
        exitCode: true,
      },
    };
  }

  const keptLines = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    if (ERROR_LINE_PATTERN.test(trimmedLine) || FILE_LINE_PATTERN.test(trimmedLine)) {
      pushUniqueLine(keptLines, line);
    }
  }

  const outputLines = ['tsc summary:'];

  if (keptLines.length > 0) {
    outputLines.push('failures:');
    outputLines.push(...keptLines.slice(0, 50));
  }

  const truncated = keptLines.length > 50;
  if (truncated) {
    outputLines.push(`... truncated ${keptLines.length - 50} more failure evidence lines`);
  }

  if (keptLines.length === 0) {
    return {
      filterName: 'tsc-raw-parse-uncertain',
      confident: false,
      truncated: false,
      output: rawOutput,
      preservedFields: {},
    };
  }

  return {
    filterName: 'tsc-summary',
    confident: true,
    truncated,
    output: outputLines.join('\n'),
    preservedFields: {
      rootError: keptLines.length > 0,
      exitCode: true,
    },
  };
}
