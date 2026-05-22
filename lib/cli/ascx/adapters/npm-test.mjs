const FAILURE_LINE_PATTERN = /(?:^not ok\b|AssertionError|Error:|TypeError:|ReferenceError|SyntaxError|Expected|Received|actual:|expected:|operator:|ERR!|failed|failure|FAIL\b|✖|×)/iu;
const FILE_LINE_PATTERN = /(?:[A-Za-z]:)?[^:\s]+?\.(?:cjs|mjs|js|jsx|ts|tsx):\d+(?::\d+)?/u;
const SUMMARY_LINE_PATTERN = /^#\s+(?:tests|suites|pass|fail|cancelled|skipped|todo|duration_ms)\b/u;

function pushUniqueLine(lines, nextLine) {
  const normalizedLine = String(nextLine || '').trimEnd();
  if (normalizedLine && !lines.includes(normalizedLine)) {
    lines.push(normalizedLine);
  }
}

function extractTapSummary(lines) {
  return lines.filter((line) => SUMMARY_LINE_PATTERN.test(line.trim()));
}

function extractFailureLines(lines) {
  const keptLines = [];
  let lastSubtestLine = '';

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('# Subtest:')) {
      lastSubtestLine = trimmedLine;
      continue;
    }

    if (SUMMARY_LINE_PATTERN.test(trimmedLine)) {
      continue;
    }

    const isFailureLine = FAILURE_LINE_PATTERN.test(trimmedLine) || FILE_LINE_PATTERN.test(trimmedLine);
    if (!isFailureLine) {
      continue;
    }

    if (lastSubtestLine) {
      pushUniqueLine(keptLines, lastSubtestLine);
    }
    pushUniqueLine(keptLines, line);
  }

  return keptLines;
}

function hasTestSummary(summaryLines) {
  return summaryLines.some((line) => /^#\s+tests\b/u.test(line.trim()));
}

function getTapSummaryCount(summaryLines, summaryKey) {
  const summaryLine = summaryLines.find((line) => {
    return line.trim().startsWith(`# ${summaryKey} `);
  });
  const countMatch = summaryLine?.trim().match(/^#\s+\w+\s+(\d+)$/u);

  return countMatch ? Number.parseInt(countMatch[1], 10) : null;
}

export function compressNpmTestOutput({ stdout, stderr, exitCode }) {
  const rawOutput = [stdout, stderr].filter(Boolean).join('\n');
  const lines = rawOutput.split(/\r?\n/u);
  const summaryLines = extractTapSummary(lines);
  const failCount = getTapSummaryCount(summaryLines, 'fail');
  const shouldPreserveFailureEvidence = exitCode !== 0 || (typeof failCount === 'number' && failCount > 0);
  const failureLines = shouldPreserveFailureEvidence ? extractFailureLines(lines) : [];
  const outputLines = ['npm test summary:'];

  if (summaryLines.length > 0) {
    outputLines.push(...summaryLines);
  }

  if (failureLines.length > 0) {
    outputLines.push('failures:');
    outputLines.push(...failureLines.slice(0, 80));
  }

  const truncated = failureLines.length > 80;
  if (truncated) {
    outputLines.push(`... truncated ${failureLines.length - 80} more failure evidence lines`);
  }

  if (exitCode === 0 && failureLines.length === 0) {
    if (!hasTestSummary(summaryLines)) {
      outputLines.push('result: passed');
    }

    return {
      filterName: 'npm-test-summary',
      confident: true,
      truncated: false,
      output: outputLines.join('\n'),
      preservedFields: {
        exitCode: true,
      },
    };
  }

  if (failureLines.length === 0 && summaryLines.length === 0) {
    return {
      filterName: 'npm-test-raw-parse-uncertain',
      confident: false,
      truncated: false,
      output: rawOutput,
      preservedFields: {},
    };
  }

  return {
    filterName: 'npm-test-summary',
    confident: true,
    truncated,
    output: outputLines.join('\n'),
    preservedFields: {
      rootError: failureLines.length > 0,
      filePath: failureLines.some((line) => FILE_LINE_PATTERN.test(line)),
      failingTestName: failureLines.some((line) => line.trim().startsWith('# Subtest:')),
      assertionMessage: failureLines.some((line) => /AssertionError|Expected|Received|actual:|expected:/iu.test(line)),
    },
  };
}
