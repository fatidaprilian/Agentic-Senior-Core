#!/usr/bin/env node

/**
 * sync-thin-adapters.mjs
 *
 * Regenerates minimal native-tool import bridges from canonical AGENTS.md.
 *
 * Usage:
 * - node scripts/sync-thin-adapters.mjs
 * - node scripts/sync-thin-adapters.mjs --check
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const ROOT_DIR = resolve(dirname(SCRIPT_FILE_PATH), '..');
const IS_CHECK_MODE = process.argv.includes('--check');

const ADAPTERS = [
  {
    relativePath: 'CLAUDE.md',
    content: '@AGENTS.md\n',
  },
  {
    relativePath: 'GEMINI.md',
    content: '@AGENTS.md\n',
  },
];

function normalizeLineEndings(content) {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

async function main() {
  await readFile(join(ROOT_DIR, 'AGENTS.md'), 'utf8');

  let hasDrift = false;

  for (const adapter of ADAPTERS) {
    const adapterAbsolutePath = join(ROOT_DIR, adapter.relativePath);

    if (IS_CHECK_MODE) {
      const existingContent = normalizeLineEndings(await readFile(adapterAbsolutePath, 'utf8'));
      if (existingContent !== adapter.content) {
        hasDrift = true;
        console.error(`[DRIFT] ${adapter.relativePath} does not match canonical adapter output.`);
      } else {
        console.log(`[OK] ${adapter.relativePath} is synchronized.`);
      }
      continue;
    }

    await writeFile(adapterAbsolutePath, adapter.content, 'utf8');
    console.log(`[SYNC] ${adapter.relativePath}`);
  }

  if (IS_CHECK_MODE) {
    if (hasDrift) {
      process.exitCode = 1;
      return;
    }

    console.log('[OK] All native import bridges match canonical source output.');
  }
}

main().catch((error) => {
  console.error(`[FATAL] Failed to synchronize thin adapters: ${error.message}`);
  process.exitCode = 1;
});
