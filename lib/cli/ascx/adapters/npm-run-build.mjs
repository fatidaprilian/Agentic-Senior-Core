const FAILURE_LINE_PATTERN = /(?:^Error:|^TypeError:|^SyntaxError|^ReferenceError|^TS\d+:\s|^Failed to compile|Module not found|ERR!|error\b|ERROR\b|×|✖|failure|FAIL\b)/iu;
const FILE_LINE_PATTERN = /(?:[A-Za-z]:)?[^:\s]+?\.(?:cjs|mjs|js|jsx|ts|tsx|vue|svelte|css|scss|html|json):\d+(?::\d+)?/u;

function pushUniqueLine(lines, nextLine) {
  const normalizedLine = String(nextLine || '').trimEnd();
  if (normalizedLine && !lines.includes(normalizedLine)) {
    lines.push(normalizedLine);
  }
}

function extractFailureLines(lines) {
  const keptLines = [];
  let contextBuffer = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Preserve empty lines in context buffer to maintain readability if we decide to flush it
    if (!trimmedLine) {
      if (contextBuffer.length > 0) {
        contextBuffer.push(line);
      }
      continue;
    }

    const isFailureLine = FAILURE_LINE_PATTERN.test(trimmedLine) || FILE_LINE_PATTERN.test(trimmedLine);
    
    if (isFailureLine) {
      // If we found a failure, flush the preceding short context (e.g., file paths that didn't match the regex but preceded an error)
      for (const ctxLine of contextBuffer) {
        pushUniqueLine(keptLines, ctxLine);
      }
      contextBuffer = [];
      pushUniqueLine(keptLines, line);
    } else {
      // Keep a small rolling buffer of context lines (max 2) before an error
      contextBuffer.push(line);
      if (contextBuffer.length > 2) {
        contextBuffer.shift();
      }
    }
  }

  return keptLines;
}

export function compressNpmRunBuildOutput({ stdout, stderr, exitCode }) {
  const rawOutput = [stdout, stderr].filter(Boolean).join('\n');
  const lines = rawOutput.split(/\r?\n/u);
  
  // If exit code is 0, build probably succeeded, just return a short success message.
  if (exitCode === 0) {
    return {
      filterName: 'npm-run-build-summary',
      confident: true,
      truncated: false,
      output: 'npm run build summary:\nresult: passed',
      preservedFields: {
        exitCode: true,
      },
    };
  }

  const failureLines = extractFailureLines(lines);
  const outputLines = ['npm run build summary:'];

  if (failureLines.length > 0) {
    outputLines.push('failures:');
    outputLines.push(...failureLines.slice(0, 100));
  }

  const truncated = failureLines.length > 100;
  if (truncated) {
    outputLines.push(`... truncated ${failureLines.length - 100} more failure evidence lines`);
  }

  if (failureLines.length === 0) {
    // We couldn't parse the errors clearly, fallback to raw
    return {
      filterName: 'npm-run-build-raw-parse-uncertain',
      confident: false,
      truncated: false,
      output: rawOutput,
      preservedFields: {},
    };
  }

  return {
    filterName: 'npm-run-build-summary',
    confident: true,
    truncated,
    output: outputLines.join('\n'),
    preservedFields: {
      rootError: failureLines.length > 0,
      filePath: failureLines.some((line) => FILE_LINE_PATTERN.test(line)),
      exitCode: true,
    },
  };
}
