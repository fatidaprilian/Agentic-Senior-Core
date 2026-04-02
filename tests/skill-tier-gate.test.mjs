import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { validateSkillTopicContent } from '../scripts/skill-tier-policy.mjs';

function collectSkillTopicPaths() {
  const skillRootDirectory = join(process.cwd(), '.agent-context', 'skills');
  const topicFilePaths = [];

  function walkSkillDirectory(currentDirectoryPath) {
    const directoryEntries = readdirSync(currentDirectoryPath, { withFileTypes: true });

    for (const directoryEntry of directoryEntries) {
      const entryPath = join(currentDirectoryPath, directoryEntry.name);

      if (directoryEntry.isDirectory()) {
        walkSkillDirectory(entryPath);
        continue;
      }

      if (directoryEntry.isFile() && directoryEntry.name.endsWith('.md') && directoryEntry.name !== 'README.md') {
        topicFilePaths.push(entryPath);
      }
    }
  }

  const topLevelEntries = readdirSync(skillRootDirectory, { withFileTypes: true });
  for (const topLevelEntry of topLevelEntries) {
    if (topLevelEntry.isDirectory()) {
      walkSkillDirectory(join(skillRootDirectory, topLevelEntry.name));
    }
  }

  return topicFilePaths;
}

test('skill topic files satisfy tier gate thresholds', () => {
  const skillTopicPaths = collectSkillTopicPaths();

  assert.ok(skillTopicPaths.length >= 20);

  for (const skillTopicPath of skillTopicPaths) {
    const skillTopicContent = readFileSync(skillTopicPath, 'utf8');
    const validationResult = validateSkillTopicContent(skillTopicContent);

    assert.equal(
      validationResult.isValid,
      true,
      `${skillTopicPath} failed tier gate: ${validationResult.reason}`
    );
  }
});