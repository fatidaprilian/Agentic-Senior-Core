#!/usr/bin/env node
/**
 * Uninstall cleanup script.
 * Run this BEFORE removing the plugin from the host, since the host
 * removal deletes the plugin directory (including this script).
 *
 * Cleans up:
 * - Optional config at ~/.config/agentic-senior-core/
 * - StatusLine entries in ~/.claude/settings.json (if any were added)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const HOME = os.homedir();

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const configDir = path.join(HOME, '.config', 'agentic-senior-core');
  if (await pathExists(configDir)) {
    await fs.rm(configDir, { recursive: true, force: true });
    console.log(`Removed config directory: ${configDir}`);
  }

  console.log('Cleanup complete. You can now remove the plugin from your IDE.');
}

main().catch((error) => {
  console.error('Uninstall cleanup failed:', error.message);
});
