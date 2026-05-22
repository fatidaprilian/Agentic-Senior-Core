const MAX_VISIBLE_STATUS_ENTRIES_PER_SECTION = 15;

function cleanStatusLine(line) {
  return line.trim().replace(/\s+/g, ' ');
}

function createSection(title) {
  return {
    title,
    entries: [],
  };
}

function pushSectionEntry(section, line) {
  const cleanedLine = cleanStatusLine(line);
  if (cleanedLine && !section.entries.includes(cleanedLine)) {
    section.entries.push(cleanedLine);
  }
}

function parseLongStatus(lines) {
  const sections = [];
  let activeSection = null;
  let isClean = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.includes('nothing to commit, working tree clean')) {
      isClean = true;
    }

    if (trimmedLine === 'Changes to be committed:') {
      activeSection = createSection('staged');
      sections.push(activeSection);
      continue;
    }

    if (trimmedLine === 'Changes not staged for commit:') {
      activeSection = createSection('unstaged');
      sections.push(activeSection);
      continue;
    }

    if (trimmedLine === 'Untracked files:') {
      activeSection = createSection('untracked');
      sections.push(activeSection);
      continue;
    }

    if (!activeSection || !line.startsWith('\t')) {
      continue;
    }

    pushSectionEntry(activeSection, line);
  }

  return { sections, isClean };
}

function parseShortStatus(lines) {
  const shortEntries = lines
    .map((line) => line.trimEnd())
    .filter((line) => /^[ MADRCU?!]{1,2}\s+.+/u.test(line));

  if (shortEntries.length === 0) {
    return [];
  }

  return [
    {
      title: 'short-status',
      entries: shortEntries,
    },
  ];
}

function formatSections(sections) {
  const outputLines = [];
  let truncated = false;

  for (const section of sections) {
    outputLines.push(`${section.title}: ${section.entries.length}`);
    const visibleEntries = section.entries.slice(0, MAX_VISIBLE_STATUS_ENTRIES_PER_SECTION);

    for (const entry of visibleEntries) {
      outputLines.push(`- ${entry}`);
    }

    if (section.entries.length > visibleEntries.length) {
      truncated = true;
      outputLines.push(`... truncated ${section.entries.length - visibleEntries.length} more ${section.title} entries`);
    }
  }

  return {
    outputLines,
    truncated,
  };
}

export function compressGitStatusOutput({ stdout, stderr, exitCode }) {
  const rawOutput = [stdout, stderr].filter(Boolean).join('\n');
  const lines = rawOutput.split(/\r?\n/u);
  const longStatus = parseLongStatus(lines);
  const shortStatusSections = parseShortStatus(lines);
  const sections = longStatus.sections.length > 0 ? longStatus.sections : shortStatusSections;

  if (exitCode === 0 && longStatus.isClean) {
    return {
      filterName: 'git-status-summary',
      confident: true,
      truncated: false,
      output: 'git status: working tree clean',
      preservedFields: {
        changedFileList: true,
      },
    };
  }

  if (sections.length === 0) {
    return {
      filterName: 'git-status-raw-parse-uncertain',
      confident: false,
      truncated: false,
      output: rawOutput,
      preservedFields: {},
    };
  }

  const formattedSections = formatSections(sections);

  return {
    filterName: 'git-status-summary',
    confident: true,
    truncated: formattedSections.truncated,
    output: [
      'git status summary:',
      ...formattedSections.outputLines,
    ].join('\n'),
    preservedFields: {
      changedFileList: true,
    },
  };
}
