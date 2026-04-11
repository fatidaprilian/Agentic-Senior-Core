import fs from 'node:fs/promises';
import path from 'node:path';
import { platform, version } from 'node:process';

import { pathExists } from './utils.mjs';

export const SKILL_COMPATIBILITY_MANIFEST_FILE_NAME = 'compatibility-manifest.json';

export function getCurrentPlatformLabel() {
  if (platform === 'win32') {
    return 'windows';
  }

  if (platform === 'darwin') {
    return 'macos';
  }

  return 'linux';
}

export function parseNodeMajorVersion(rawVersionString = version) {
  const normalizedVersionString = String(rawVersionString || '').trim();
  const numericVersion = normalizedVersionString.startsWith('v')
    ? normalizedVersionString.slice(1)
    : normalizedVersionString;

  const majorSegment = numericVersion.split('.')[0];
  const parsedMajorVersion = Number.parseInt(majorSegment, 10);
  return Number.isNaN(parsedMajorVersion) ? null : parsedMajorVersion;
}

export function parseNodeMinimumMajor(rawNodeMinimum) {
  const normalizedNodeMinimum = String(rawNodeMinimum || '').trim();
  if (!normalizedNodeMinimum) {
    return null;
  }

  const majorSegment = normalizedNodeMinimum.split('.')[0];
  const parsedMajorVersion = Number.parseInt(majorSegment, 10);
  return Number.isNaN(parsedMajorVersion) ? null : parsedMajorVersion;
}

export async function readSkillDomainCompatibilityManifest(targetDirectoryPath, skillDomainName) {
  const compatibilityManifestPath = path.join(
    targetDirectoryPath,
    '.agent-context',
    'skills',
    skillDomainName,
    SKILL_COMPATIBILITY_MANIFEST_FILE_NAME
  );

  if (!(await pathExists(compatibilityManifestPath))) {
    return {
      exists: false,
      compatibilityManifestPath,
      parsedManifest: null,
    };
  }

  try {
    const compatibilityManifestContent = await fs.readFile(compatibilityManifestPath, 'utf8');
    return {
      exists: true,
      compatibilityManifestPath,
      parsedManifest: JSON.parse(compatibilityManifestContent),
    };
  } catch (error) {
    return {
      exists: true,
      compatibilityManifestPath,
      parsedManifest: null,
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function evaluateSkillDomainCompatibility(targetDirectoryPath, skillDomainNames) {
  const uniqueSkillDomainNames = Array.from(new Set(skillDomainNames || []));
  const compatibilityWarnings = [];

  const currentPlatformLabel = getCurrentPlatformLabel();
  const currentNodeMajorVersion = parseNodeMajorVersion(version);

  for (const skillDomainName of uniqueSkillDomainNames) {
    const manifestResult = await readSkillDomainCompatibilityManifest(targetDirectoryPath, skillDomainName);

    if (!manifestResult.exists) {
      compatibilityWarnings.push(
        `Domain ${skillDomainName} has no ${SKILL_COMPATIBILITY_MANIFEST_FILE_NAME}; compatibility cannot be verified.`
      );
      continue;
    }

    if (!manifestResult.parsedManifest) {
      compatibilityWarnings.push(
        `Domain ${skillDomainName} has invalid ${SKILL_COMPATIBILITY_MANIFEST_FILE_NAME}: ${manifestResult.parseError || 'Unknown parse error'}.`
      );
      continue;
    }

    const manifestPlatforms = Array.isArray(manifestResult.parsedManifest.platforms)
      ? manifestResult.parsedManifest.platforms
      : [];

    if (manifestPlatforms.length > 0 && !manifestPlatforms.includes(currentPlatformLabel)) {
      compatibilityWarnings.push(
        `Domain ${skillDomainName} does not list platform ${currentPlatformLabel} in ${SKILL_COMPATIBILITY_MANIFEST_FILE_NAME}.`
      );
    }

    const minimumNodeMajorVersion = parseNodeMinimumMajor(manifestResult.parsedManifest.nodeMin);
    if (
      typeof minimumNodeMajorVersion === 'number'
      && typeof currentNodeMajorVersion === 'number'
      && currentNodeMajorVersion < minimumNodeMajorVersion
    ) {
      compatibilityWarnings.push(
        `Domain ${skillDomainName} requires Node.js >= ${minimumNodeMajorVersion}, current major version is ${currentNodeMajorVersion}.`
      );
    }
  }

  return compatibilityWarnings;
}
