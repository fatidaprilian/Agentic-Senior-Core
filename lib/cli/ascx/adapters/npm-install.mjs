const FAILURE_LINE_PATTERN = /(?:^npm error|^npm ERR!|^error\b|^ERESOLVE\b|^Failed to)/iu;
const SUMMARY_LINE_PATTERN = /(?:added \d+ packages|up to date in|Done in \d+|Packages: \+\d+)/iu;

function pushUniqueLine(lines, nextLine) {
  const normalizedLine = String(nextLine || '').trimEnd();
  if (normalizedLine && !lines.includes(normalizedLine)) {
    lines.push(normalizedLine);
  }
}

export function compressNpmInstallOutput({ stdout, stderr, exitCode }) {
  const rawOutput = [stdout, stderr].filter(Boolean).join('\n');
  const lines = rawOutput.split(/\r?\n/u);
  
  if (exitCode === 0) {
    let summaryLine = 'result: passed';
    for (const line of lines) {
      if (SUMMARY_LINE_PATTERN.test(line)) {
        summaryLine = line.trim();
        break;
      }
    }

    return {
      filterName: 'npm-install-summary',
      confident: true,
      truncated: false,
      output: `npm install summary:\n${summaryLine}`,
      preservedFields: {
        exitCode: true,
      },
    };
  }

  const keptLines = [];
  let contextBuffer = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      if (contextBuffer.length > 0) {
        contextBuffer.push(line);
      }
      continue;
    }

    if (FAILURE_LINE_PATTERN.test(trimmedLine)) {
      for (const ctxLine of contextBuffer) {
        pushUniqueLine(keptLines, ctxLine);
      }
      contextBuffer = [];
      pushUniqueLine(keptLines, line);
    } else {
      contextBuffer.push(line);
      if (contextBuffer.length > 2) {
        contextBuffer.shift();
      }
    }
  }

  const outputLines = ['npm install summary:'];

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
      filterName: 'npm-install-raw-parse-uncertain',
      confident: false,
      truncated: false,
      output: rawOutput,
      preservedFields: {},
    };
  }

  return {
    filterName: 'npm-install-summary',
    confident: true,
    truncated,
    output: outputLines.join('\n'),
    preservedFields: {
      rootError: keptLines.length > 0,
      exitCode: true,
    },
  };
}
