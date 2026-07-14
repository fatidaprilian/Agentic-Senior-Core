// @ts-check

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
export const REPOSITORY_ROOT = resolve(dirname(SCRIPT_FILE_PATH), '..', '..');
export const STATE_DIRECTORY = resolve(REPOSITORY_ROOT, '.agent-context', 'state');
export const DEFAULT_PROTOCOL_VERSION = '2024-11-05';
export const DEFAULT_FETCH_TIMEOUT_MS = 15000;
export const DEFAULT_FETCH_MAX_CHARS = 6000;
export const MAX_FETCH_MAX_CHARS = 20000;
export const DEFAULT_TREND_WINDOW_DAYS = 90;
export const MAX_TREND_PACKAGES = 10;
export const FALLBACK_PACKAGE_VERSION = '0.0.0-local';

// IMPORTANT: This version extraction logic is intentionally duplicated from lib/cli/constants.mjs.
// The MCP server is designed to be copied directly into target user workspaces where
// the original package.json may not exist in the parent tree. This try/catch fallback
// ensures the server can still run standalone without crashing if package.json is missing.
function resolvePackageVersion() {
  try {
    const parsedPackageManifest = JSON.parse(
      readFileSync(resolve(REPOSITORY_ROOT, 'package.json'), 'utf8')
    );
    const rawVersion = typeof parsedPackageManifest?.version === 'string'
      ? parsedPackageManifest.version.trim()
      : '';

    return rawVersion || FALLBACK_PACKAGE_VERSION;
  } catch {
    return FALLBACK_PACKAGE_VERSION;
  }
}

export const PACKAGE_VERSION = resolvePackageVersion();

export const TEST_SUITE_ARGS = {
  adapter: ['--test', './tests/adapter.test.mjs'],
};

export const INTERNAL_SCRIPT_PATHS = {};

function getAvailableTestSuites() {
  return Object.entries(TEST_SUITE_ARGS)
    .filter(([, commandArguments]) => (
      Array.isArray(commandArguments)
      && commandArguments.length > 1
      && commandArguments
        .slice(1)
        .every((relativeTestPath) => existsSync(resolve(REPOSITORY_ROOT, relativeTestPath)))
    ))
    .map(([suiteName]) => suiteName);
}

export const AVAILABLE_TEST_SUITES = getAvailableTestSuites();
