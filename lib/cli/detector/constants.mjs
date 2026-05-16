/**
 * Static configuration sets and known-marker tables for the project context
 * detector. Centralized so workspace traversal, UI signal analysis, and stack
 * detection share one source of truth.
 */

import { FRONTEND_SCAN_IGNORE_DIRECTORY_NAMES } from './design-evidence.mjs';

export const WORKSPACE_SCAN_MAX_DEPTH = 3;
export const WORKSPACE_SCAN_MAX_DIRECTORIES = 120;

export const WORKSPACE_SCAN_IGNORE_DIRECTORY_NAMES = new Set([
  ...FRONTEND_SCAN_IGNORE_DIRECTORY_NAMES,
  '.agent-context',
  '.agents',
  '.cursor',
  '.gemini',
  '.github',
  '.idea',
  '.vscode',
  '.windsurf',
  '.zed',
]);

export const WORKSPACE_CONTAINER_DIRECTORY_NAMES = new Set([
  'admin', 'admins',
  'api', 'apis',
  'app', 'apps',
  'backend', 'backends',
  'client', 'clients',
  'dashboard', 'dashboards',
  'frontend', 'frontends',
  'mobile', 'mobiles',
  'package', 'packages', 'pkg',
  'server', 'servers',
  'service', 'services',
  'site', 'sites',
  'ui', 'web',
  'worker', 'workers',
]);

export const WORKSPACE_ROOT_MARKER_FILE_NAMES = new Set([
  'lerna.json',
  'nx.json',
  'pnpm-workspace.yaml',
  'turbo.json',
]);

export const DIRECT_UI_MARKER_NAMES = [
  'src',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'tailwind.config.js',
  'tailwind.config.mjs',
  'tailwind.config.ts',
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.ts',
  'react-native.config.js',
  'app',
  'pages',
  'components',
  'public',
  'styles',
  'android',
  'ios',
  'index.html',
];

export const PROJECT_MARKER_FILE_NAMES = new Set([
  'Cargo.toml',
  'Gemfile',
  'build.gradle',
  'build.gradle.kts',
  'composer.json',
  'go.mod',
  'package.json',
  'pom.xml',
  'pubspec.yaml',
  'pyproject.toml',
  'react-native.config.js',
  'requirements.txt',
  'tsconfig.json',
  ...DIRECT_UI_MARKER_NAMES,
]);

export const INTERNAL_GOVERNANCE_SURFACE_NAMES = new Set([
  '.agent-context',
  '.agent-instructions.md',
  '.agentic-backup',
  '.agents',
  '.clauderc',
  '.cursorrules',
  '.cursor',
  '.gemini',
  '.github',
  '.instructions.md',
  '.vscode',
  '.windsurf',
  '.windsurfrules',
  '.zed',
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  'mcp.json',
]);

const WORKSPACE_KEYWORD_FRAGMENTS = [
  'admin', 'api', 'app', 'backend', 'client', 'dashboard',
  'frontend', 'mobile', 'package', 'server', 'service',
  'site', 'ui', 'web', 'worker',
];

export function looksLikeWorkspaceSearchCandidate(directoryName) {
  const normalizedDirectoryName = String(directoryName || '').trim().toLowerCase();

  if (!normalizedDirectoryName) {
    return false;
  }

  if (WORKSPACE_CONTAINER_DIRECTORY_NAMES.has(normalizedDirectoryName)) {
    return true;
  }

  return WORKSPACE_KEYWORD_FRAGMENTS.some((keyword) => normalizedDirectoryName.includes(keyword));
}

export function hasProjectMarkers(markerNames) {
  return Array.from(markerNames).some((markerName) => (
    PROJECT_MARKER_FILE_NAMES.has(markerName)
    || markerName.endsWith('.csproj')
    || markerName.endsWith('.sln')
  ));
}
