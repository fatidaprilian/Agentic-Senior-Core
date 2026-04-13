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
export const SKILL_PLATFORM_DIRECTORY = join(AGENT_CONTEXT_DIR, 'skills');
export const SKILL_PLATFORM_INDEX_PATH = join(SKILL_PLATFORM_DIRECTORY, 'index.json');
export const POLICY_FILE_NAME = 'llm-judge-threshold.json';
export const PROFILE_PACKS_DIRECTORY_NAME = 'profiles';

export const PROFILE_PACK_REQUIRED_FIELDS = [
  'slug',
  'displayName',
  'description',
  'defaultProfile',
  'defaultStack',
  'defaultBlueprint',
  'ciGuardrails',
  'lockCi',
  'blockingSeverities',
];

export const ALLOWED_SEVERITY_LEVELS = new Set(['critical', 'high', 'medium', 'low']);

export const BLUEPRINT_RECOMMENDATIONS = {
  'typescript.md': 'api-nextjs.md',
  'python.md': 'fastapi-service.md',
  'java.md': 'spring-boot-api.md',
  'php.md': 'laravel-api.md',
  'go.md': 'go-service.md',
  'csharp.md': 'aspnet-api.md',
  'react-native.md': 'mobile-app.md',
  'flutter.md': 'mobile-app.md',
};

export const INIT_PRESETS = {
  'frontend-web': {
    profile: 'balanced',
    stack: 'typescript.md',
    blueprint: 'api-nextjs.md',
    ci: true,
    description: 'Frontend-first web app starter',
  },
  'backend-api': {
    profile: 'balanced',
    stack: 'python.md',
    blueprint: 'fastapi-service.md',
    ci: true,
    description: 'Backend API starter with safe defaults',
  },
  'fullstack-product': {
    profile: 'balanced',
    stack: 'typescript.md',
    blueprint: 'api-nextjs.md',
    ci: true,
    description: 'Product delivery starter with fullstack governance',
  },
  'platform-governance': {
    profile: 'strict',
    stack: 'go.md',
    blueprint: 'go-service.md',
    ci: true,
    description: 'Strict release and platform governance starter',
  },
  'mobile-react-native': {
    profile: 'balanced',
    stack: 'react-native.md',
    blueprint: 'mobile-app.md',
    ci: true,
    description: 'Mobile app starter for React Native',
  },
  'mobile-flutter': {
    profile: 'balanced',
    stack: 'flutter.md',
    blueprint: 'mobile-app.md',
    ci: true,
    description: 'Mobile app starter for Flutter',
  },
  'observability-platform': {
    profile: 'strict',
    stack: 'go.md',
    blueprint: 'observability.md',
    ci: true,
    description: 'Observability and platform starter',
  },
  'typescript-nestjs-service': {
    profile: 'balanced',
    stack: 'typescript.md',
    blueprint: 'nestjs-logic.md',
    ci: true,
    description: 'TypeScript service starter with NestJS module blueprint',
  },
  'java-enterprise-api': {
    profile: 'strict',
    stack: 'java.md',
    blueprint: 'spring-boot-api.md',
    ci: true,
    description: 'Enterprise API starter for JVM teams',
  },
  'dotnet-enterprise-api': {
    profile: 'strict',
    stack: 'csharp.md',
    blueprint: 'aspnet-api.md',
    ci: true,
    description: '.NET API starter with strict governance defaults',
  },
  'php-laravel-api': {
    profile: 'balanced',
    stack: 'php.md',
    blueprint: 'laravel-api.md',
    ci: true,
    description: 'Laravel API starter with balanced guardrails',
  },
  'kubernetes-platform': {
    profile: 'strict',
    stack: 'go.md',
    blueprint: 'kubernetes-manifests.md',
    ci: true,
    description: 'Platform starter focused on Kubernetes delivery assets',
  },
};

export const PROFILE_PRESETS = {
  beginner: {
    displayName: 'Beginner',
    description: 'Safest path. Minimal decisions, TypeScript defaults, and CI enabled.',
    defaultStackFileName: 'typescript.md',
    defaultBlueprintFileName: 'api-nextjs.md',
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

export const entryPointFiles = [
  '.cursorrules',
  '.windsurfrules',
  'AGENTS.md',
  '.github/copilot-instructions.md',
  '.agent-override.md',
];

export const directoryCopies = ['.agent-context', '.gemini', '.agents'];
