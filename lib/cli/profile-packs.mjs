/**
 * Profile Pack Parser — Team profile pack loading and matching.
 * Depends on: constants.mjs, utils.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  PROFILE_PACK_REQUIRED_FIELDS,
  PROFILE_PACKS_DIRECTORY_NAME,
} from './constants.mjs';

import {
  pathExists,
  collectFileNames,
  normalizeChoiceInput,
  matchProfileNameFromInput,
  parseBooleanSetting,
  parseBlockingSeverities,
} from './utils.mjs';

export function parseProfilePackContent(fileName, profilePackContent) {
  const parsedFields = {};
  const profilePackLines = profilePackContent.split(/\r?\n/);

  for (const profilePackLine of profilePackLines) {
    const lineMatch = profilePackLine.match(/^([A-Za-z][A-Za-z0-9 ]+):\s*(.+)$/);
    if (!lineMatch) {
      continue;
    }

    const fieldName = lineMatch[1].trim();
    const fieldValue = lineMatch[2].trim();
    parsedFields[fieldName] = fieldValue;
  }

  for (const requiredFieldName of PROFILE_PACK_REQUIRED_FIELDS) {
    if (!parsedFields[requiredFieldName]) {
      throw new Error(`Profile pack ${fileName} is missing required field: ${requiredFieldName}`);
    }
  }

  const defaultProfileName = matchProfileNameFromInput(parsedFields.defaultProfile);
  if (!defaultProfileName) {
    throw new Error(`Profile pack ${fileName} has invalid defaultProfile: ${parsedFields.defaultProfile}`);
  }

  return {
    fileName,
    slug: normalizeChoiceInput(parsedFields.slug),
    displayName: parsedFields.displayName,
    description: parsedFields.description,
    defaultProfileName,
    defaultStackFileName: parsedFields.defaultStack.trim(),
    defaultBlueprintFileName: parsedFields.defaultBlueprint.trim(),
    defaultCi: parseBooleanSetting(parsedFields.ciGuardrails, `${fileName} ciGuardrails`),
    lockCi: parseBooleanSetting(parsedFields.lockCi, `${fileName} lockCi`),
    blockingSeverities: parseBlockingSeverities(parsedFields.blockingSeverities, fileName),
    owner: parsedFields.owner || null,
    lastUpdated: parsedFields.lastUpdated || null,
  };
}

export async function collectProfilePacks(targetDirectoryPath) {
  const profilePackDirectoryPath = path.join(targetDirectoryPath, '.agent-context', PROFILE_PACKS_DIRECTORY_NAME);
  if (!(await pathExists(profilePackDirectoryPath))) {
    return [];
  }

  const profilePackFileNames = await collectFileNames(profilePackDirectoryPath);
  const profilePackDefinitions = [];

  for (const profilePackFileName of profilePackFileNames) {
    const profilePackFilePath = path.join(profilePackDirectoryPath, profilePackFileName);
    const profilePackContent = await fs.readFile(profilePackFilePath, 'utf8');
    profilePackDefinitions.push(parseProfilePackContent(profilePackFileName, profilePackContent));
  }

  return profilePackDefinitions;
}

export function findProfilePackByInput(profilePackInput, profilePackDefinitions) {
  const normalizedProfilePackInput = normalizeChoiceInput(profilePackInput);

  return profilePackDefinitions.find((profilePackDefinition) => {
    const normalizedFileName = normalizeChoiceInput(profilePackDefinition.fileName.replace(/\.md$/i, ''));
    const normalizedSlug = normalizeChoiceInput(profilePackDefinition.slug);
    const normalizedDisplayName = normalizeChoiceInput(profilePackDefinition.displayName);

    return normalizedProfilePackInput === normalizedFileName
      || normalizedProfilePackInput === normalizedSlug
      || normalizedProfilePackInput === normalizedDisplayName;
  }) || null;
}
