const MAX_VISIBLE_FILES = 12;
const MAX_VISIBLE_HUNKS_PER_FILE = 3;
const MAX_VISIBLE_CHANGE_LINES_PER_HUNK = 6;

function normalizeDiffPath(rawPath) {
  return String(rawPath || '')
    .replace(/^a\//u, '')
    .replace(/^b\//u, '')
    .trim();
}

function pushUnique(lines, nextLine) {
  const normalizedLine = String(nextLine || '').trimEnd();
  if (normalizedLine && !lines.includes(normalizedLine)) {
    lines.push(normalizedLine);
  }
}

function createDiffFile(rawHeaderLine) {
  const headerMatch = rawHeaderLine.match(/^diff --git\s+(.+?)\s+(.+)$/u);
  const oldPath = normalizeDiffPath(headerMatch?.[1] || '');
  const newPath = normalizeDiffPath(headerMatch?.[2] || oldPath);

  return {
    path: newPath || oldPath || 'unknown',
    oldPath,
    additions: 0,
    deletions: 0,
    hunks: [],
    markers: [],
    isGeneratedLike: false,
  };
}

function isGeneratedLikePath(filePath) {
  return /(?:package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb|dist\/|build\/|coverage\/|\.min\.(?:js|css)|\.snap$|generated)/iu.test(filePath);
}

function currentHunk(diffFile) {
  return diffFile.hunks[diffFile.hunks.length - 1] || null;
}

function parseDiffFiles(lines) {
  const diffFiles = [];
  let activeFile = null;

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      activeFile = createDiffFile(line);
      activeFile.isGeneratedLike = isGeneratedLikePath(activeFile.path);
      diffFiles.push(activeFile);
      continue;
    }

    if (!activeFile) {
      continue;
    }

    if (line.startsWith('new file mode')) {
      pushUnique(activeFile.markers, 'new file');
      continue;
    }

    if (line.startsWith('deleted file mode')) {
      pushUnique(activeFile.markers, 'deleted file');
      continue;
    }

    if (line.startsWith('rename from ')) {
      pushUnique(activeFile.markers, `rename from ${line.slice('rename from '.length).trim()}`);
      continue;
    }

    if (line.startsWith('rename to ')) {
      const renamedPath = line.slice('rename to '.length).trim();
      activeFile.path = renamedPath || activeFile.path;
      activeFile.isGeneratedLike = isGeneratedLikePath(activeFile.path);
      pushUnique(activeFile.markers, `rename to ${renamedPath}`);
      continue;
    }

    if (line.startsWith('Binary files ') || line.startsWith('GIT binary patch')) {
      pushUnique(activeFile.markers, 'binary file changed');
      continue;
    }

    if (line.startsWith('@@ ')) {
      activeFile.hunks.push({
        header: line.trim(),
        changeLines: [],
      });
      continue;
    }

    if (line.startsWith('+++ ') || line.startsWith('--- ')) {
      continue;
    }

    if (line.startsWith('+')) {
      activeFile.additions += 1;
      const hunk = currentHunk(activeFile);
      if (hunk && !activeFile.isGeneratedLike) {
        pushUnique(hunk.changeLines, line);
      }
      continue;
    }

    if (line.startsWith('-')) {
      activeFile.deletions += 1;
      const hunk = currentHunk(activeFile);
      if (hunk && !activeFile.isGeneratedLike) {
        pushUnique(hunk.changeLines, line);
      }
    }
  }

  return diffFiles;
}

function formatDiffFile(diffFile) {
  const outputLines = [];
  let truncated = false;
  const markers = diffFile.markers.length > 0
    ? ` [${diffFile.markers.join(', ')}]`
    : '';
  const generatedMarker = diffFile.isGeneratedLike ? ' [generated/noisy path]' : '';

  outputLines.push(`- ${diffFile.path} (+${diffFile.additions} -${diffFile.deletions})${markers}${generatedMarker}`);

  if (diffFile.isGeneratedLike) {
    outputLines.push('  detail: omitted generated/noisy diff; raw tee required for exact lines');
    return { outputLines, truncated: true };
  }

  const visibleHunks = diffFile.hunks.slice(0, MAX_VISIBLE_HUNKS_PER_FILE);
  for (const hunk of visibleHunks) {
    outputLines.push(`  ${hunk.header}`);
    const visibleChangeLines = hunk.changeLines.slice(0, MAX_VISIBLE_CHANGE_LINES_PER_HUNK);
    for (const changeLine of visibleChangeLines) {
      outputLines.push(`  ${changeLine}`);
    }

    if (hunk.changeLines.length > visibleChangeLines.length) {
      truncated = true;
      outputLines.push(`  ... truncated ${hunk.changeLines.length - visibleChangeLines.length} more changed lines in hunk`);
    }
  }

  if (diffFile.hunks.length > visibleHunks.length) {
    truncated = true;
    outputLines.push(`  ... truncated ${diffFile.hunks.length - visibleHunks.length} more hunks`);
  }

  if (diffFile.hunks.length === 0 && diffFile.markers.length === 0) {
    outputLines.push('  detail: no parseable hunks; raw tee required for exact diff');
    truncated = true;
  }

  return { outputLines, truncated };
}

export function compressGitDiffOutput({ stdout, stderr, exitCode }) {
  const rawOutput = [stdout, stderr].filter(Boolean).join('\n');

  if (exitCode === 0 && rawOutput.trim() === '') {
    return {
      filterName: 'git-diff-summary',
      confident: true,
      truncated: false,
      output: 'git diff: no changes',
      preservedFields: {
        changedFileList: true,
      },
    };
  }

  const lines = rawOutput.split(/\r?\n/u);
  const diffFiles = parseDiffFiles(lines);

  if (diffFiles.length === 0) {
    return {
      filterName: 'git-diff-raw-parse-uncertain',
      confident: false,
      truncated: false,
      output: rawOutput,
      preservedFields: {},
    };
  }

  const outputLines = [
    'git diff summary:',
    `files: ${diffFiles.length}`,
  ];
  let truncated = false;
  const visibleFiles = diffFiles.slice(0, MAX_VISIBLE_FILES);

  for (const diffFile of visibleFiles) {
    const formattedFile = formatDiffFile(diffFile);
    outputLines.push(...formattedFile.outputLines);
    truncated = truncated || formattedFile.truncated;
  }

  if (diffFiles.length > visibleFiles.length) {
    truncated = true;
    outputLines.push(`... truncated ${diffFiles.length - visibleFiles.length} more files`);
  }

  if (truncated) {
    outputLines.push('truncation: raw diff available in tee output');
  }

  return {
    filterName: 'git-diff-summary',
    confident: true,
    truncated,
    output: outputLines.join('\n'),
    preservedFields: {
      changedFileList: true,
      hunkHeaders: diffFiles.some((diffFile) => diffFile.hunks.length > 0),
      binaryMarker: diffFiles.some((diffFile) => diffFile.markers.includes('binary file changed')),
    },
  };
}
