/**
 * CLI Constants — All configuration values extracted from the monolith.
 * Zero dependencies on other lib modules.
 */
import { readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = dirname(currentFilePath);

export const REPO_ROOT = resolve(currentDirectoryPath, '..', '..');
export const PACKAGE_JSON_PATH = join(REPO_ROOT, 'package.json');
export const CLI_VERSION = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')).version;
export const AGENT_CONTEXT_DIR = join(REPO_ROOT, '.agent-context');
export const POLICY_FILE_NAME = 'llm-judge-threshold.json';

export const ALLOWED_SEVERITY_LEVELS = new Set(['critical', 'high', 'medium', 'low']);

export const AGENT_DECISION_STACK_FILE_NAME = 'agent-decision-runtime.md';
export const AGENT_DECISION_BLUEPRINT_FILE_NAME = 'agent-decision-architecture.md';

export const INIT_PRESETS = {
  'frontend-ui': {
    stack: null,
    blueprint: null,
    ci: true,
    description: 'Frontend/UI scope hint; agent recommends runtime and architecture before coding',
  },
  'backend-service': {
    stack: null,
    blueprint: null,
    ci: true,
    description: 'Backend/API scope hint; agent recommends runtime and architecture before coding',
  },
  'fullstack-product': {
    stack: null,
    blueprint: null,
    ci: true,
    description: 'Fullstack product scope hint; agent recommends runtime and architecture before coding',
  },
  'mobile-app': {
    stack: null,
    blueprint: null,
    ci: true,
    description: 'Mobile app scope hint; agent recommends native strategy before coding',
  },
  'platform-ops': {
    stack: null,
    blueprint: null,
    ci: true,
    description: 'Platform operations scope hint; agent recommends runtime and architecture before coding',
  },
  observability: {
    stack: null,
    blueprint: null,
    ci: true,
    description: 'Observability scope hint; agent recommends runtime and architecture before coding',
  },
};

export const PROFILE_PRESETS = {
  beginner: {
    displayName: 'Beginner',
    description: 'Safest path. Minimal decisions, agent-led stack decision, and CI enabled.',
    defaultStackFileName: null,
    defaultBlueprintFileName: null,
    defaultCi: true,
    lockCi: true,
    blockingSeverities: ['critical'],
  },
  balanced: {
    displayName: 'Balanced',
    description: 'Recommended for most teams. Guided choices with strong default guardrails.',
    defaultStackFileName: null,
    defaultBlueprintFileName: null,
    defaultCi: true,
    lockCi: false,
    blockingSeverities: ['critical', 'high'],
  },
  strict: {
    displayName: 'Strict',
    description: 'Tighter governance. CI stays on and medium-risk findings can block merges.',
    defaultStackFileName: null,
    defaultBlueprintFileName: null,
    defaultCi: true,
    lockCi: true,
    blockingSeverities: ['critical', 'high', 'medium'],
  },
};

export const GOLDEN_STANDARD_PROFILE_NAME = 'balanced';

export const PROJECT_SCOPE_CHOICES = [
  {
    key: 'frontend-only',
    label: 'Frontend only',
  },
  {
    key: 'backend-only',
    label: 'Backend only',
  },
  {
    key: 'both',
    label: 'Both (frontend + backend)',
  },
];

export const RUNTIME_ENVIRONMENT_CHOICES = [
  {
    key: 'linux-wsl',
    label: 'Linux / WSL',
  },
  {
    key: 'windows',
    label: 'Windows',
  },
  {
    key: 'linux',
    label: 'Linux',
  },
  {
    key: 'macos',
    label: 'macOS',
  },
];

export const entryPointFiles = [
  '.instructions.md',
  '.cursorrules',
  '.windsurfrules',
  'AGENTS.md',
  'CLAUDE.md',
  'GEMINI.md',
  '.cursor/rules/agentic-senior-core.mdc',
  '.github/copilot-instructions.md',
  '.github/instructions/agentic-senior-core.instructions.md',
  '.windsurf/rules/agentic-senior-core.md',
  '.agent-override.md',
];

export const directoryCopies = ['.agent-context', '.gemini', '.agents'];
