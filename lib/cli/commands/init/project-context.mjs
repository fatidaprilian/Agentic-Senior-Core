import fs from 'node:fs/promises';
import path from 'node:path';


function normalizeContextLine(rawText) {
  return String(rawText || '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function readTextIfExists(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}

function extractMarkdownContext(rawMarkdown) {
  return String(rawMarkdown || '')
    .split(/\r?\n/)
    .map((line) => normalizeContextLine(line.replace(/^#+\s*/, '')))
    .filter((line) => line && !line.startsWith('---') && !line.startsWith('```'))
    .slice(0, 3)
    .join(' ');
}

export async function inferExistingProjectDescriptionHint(targetDirectoryPath) {
  const evidence = [];
  const packageJsonContent = await readTextIfExists(path.join(targetDirectoryPath, 'package.json'));

  if (packageJsonContent) {
    try {
      const packageManifest = JSON.parse(packageJsonContent);
      const packageSummary = [
        normalizeContextLine(packageManifest.name),
        normalizeContextLine(packageManifest.description),
      ].filter(Boolean).join(': ');

      if (packageSummary) {
        evidence.push(`package.json: ${packageSummary}`);
      }
    } catch {
      // Invalid package metadata should not block init; other files can still provide context.
    }
  }

  for (const relativeDocPath of ['docs/project-brief.md', 'docs/README.md', 'README.md']) {
    const docContext = extractMarkdownContext(
      await readTextIfExists(path.join(targetDirectoryPath, relativeDocPath))
    );

    if (docContext) {
      evidence.push(`${relativeDocPath}: ${docContext}`);
    }
  }

  return evidence.slice(0, 3).join(' | ');
}

