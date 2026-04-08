/**
 * Skill Selector — Skill platform interaction and domain inference.
 * Depends on: constants.mjs, utils.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  SKILL_PLATFORM_DIRECTORY,
  SKILL_PLATFORM_INDEX_PATH,
} from './constants.mjs';

import { normalizeChoiceInput } from './utils.mjs';

export async function loadSkillPlatformIndex() {
  const skillPlatformIndexContent = await fs.readFile(SKILL_PLATFORM_INDEX_PATH, 'utf8');
  return JSON.parse(skillPlatformIndexContent);
}

export function normalizeSkillTierInput(rawTierInput) {
  const normalizedTierInput = normalizeChoiceInput(rawTierInput);
  const allowedTierNames = new Set(['standard', 'advance', 'expert', 'above']);

  if (!allowedTierNames.has(normalizedTierInput)) {
    return null;
  }

  return normalizedTierInput;
}

export function findSkillDomainByInput(skillDomainInput, skillDomainEntries) {
  const normalizedSkillDomainInput = normalizeChoiceInput(skillDomainInput);

  return skillDomainEntries.find((skillDomainEntry) => {
    const normalizedDomainName = normalizeChoiceInput(skillDomainEntry.name);
    const normalizedDisplayName = normalizeChoiceInput(skillDomainEntry.displayName);

    return normalizedSkillDomainInput === normalizedDomainName || normalizedSkillDomainInput === normalizedDisplayName;
  }) || null;
}

export function formatSkillTierList(skillPlatformIndex) {
  return skillPlatformIndex.tiers.map((tierDefinition) => `${tierDefinition.name} (${tierDefinition.description})`).join('\n');
}

export function inferSkillDomainNamesFromSelection(selectedStackFileName, selectedBlueprintFileName) {
  const inferredDomainNames = new Set();

  if (selectedBlueprintFileName === 'api-nextjs.md' || selectedBlueprintFileName === 'fastapi-service.md') {
    inferredDomainNames.add('frontend');
    inferredDomainNames.add('fullstack');
    inferredDomainNames.add('cli');
  }

  if (selectedBlueprintFileName === 'go-service.md'
    || selectedBlueprintFileName === 'spring-boot-api.md'
    || selectedBlueprintFileName === 'laravel-api.md'
    || selectedBlueprintFileName === 'aspnet-api.md') {
    inferredDomainNames.add('backend');
    inferredDomainNames.add('fullstack');
    inferredDomainNames.add('cli');
  }

  if (selectedStackFileName === 'typescript.md') {
    inferredDomainNames.add('frontend');
    inferredDomainNames.add('cli');
  }

  if (selectedStackFileName === 'go.md'
    || selectedStackFileName === 'java.md'
    || selectedStackFileName === 'php.md'
    || selectedStackFileName === 'csharp.md'
    || selectedStackFileName === 'python.md'
    || selectedStackFileName === 'ruby.md'
    || selectedStackFileName === 'rust.md') {
    inferredDomainNames.add('backend');
  }

  if (selectedStackFileName === 'react-native.md' || selectedStackFileName === 'flutter.md') {
    inferredDomainNames.add('frontend');
    inferredDomainNames.add('fullstack');
    inferredDomainNames.add('cli');
  }

  if (selectedBlueprintFileName === 'mobile-app.md') {
    inferredDomainNames.add('frontend');
    inferredDomainNames.add('fullstack');
    inferredDomainNames.add('cli');
  }

  if (selectedBlueprintFileName === 'observability.md') {
    inferredDomainNames.add('backend');
    inferredDomainNames.add('fullstack');
    inferredDomainNames.add('cli');
  }

  if (inferredDomainNames.size === 0) {
    inferredDomainNames.add('fullstack');
    inferredDomainNames.add('cli');
  }

  return Array.from(inferredDomainNames);
}

export async function buildSkillPackSection(skillDomainEntry, selectedTierName) {
  const resolvedPackFileName = skillDomainEntry.tierToPackFileNames?.[selectedTierName]
    || skillDomainEntry.tierToPackFileNames?.[skillDomainEntry.defaultTier]
    || skillDomainEntry.defaultPackFileName;
  const skillPackFilePath = path.join(SKILL_PLATFORM_DIRECTORY, resolvedPackFileName);
  const skillPackContent = await fs.readFile(skillPackFilePath, 'utf8');

  return [
    `## SKILL PACK: ${skillDomainEntry.displayName}`,
    `Source: .agent-context/skills/${resolvedPackFileName}`,
    `Default tier: ${skillDomainEntry.defaultTier}`,
    `Selected tier: ${selectedTierName}`,
    `Evidence: ${skillDomainEntry.evidence}`,
    '',
    skillPackContent.trim(),
    '',
  ].join('\n');
}

export async function runSkillCommand(commandArguments) {
  const parsedSkillOptions = {
    domain: null,
    tier: null,
    tierProvided: false,
    json: false,
  };

  for (let argumentIndex = 0; argumentIndex < commandArguments.length; argumentIndex++) {
    const currentArgument = commandArguments[argumentIndex];

    if (!currentArgument.startsWith('--')) {
      parsedSkillOptions.domain = currentArgument;
      continue;
    }

    if (currentArgument === '--tier') {
      parsedSkillOptions.tier = normalizeSkillTierInput(commandArguments[argumentIndex + 1] || '');
      parsedSkillOptions.tierProvided = true;
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith('--tier=')) {
      parsedSkillOptions.tier = normalizeSkillTierInput(currentArgument.split('=')[1]);
      parsedSkillOptions.tierProvided = true;
      continue;
    }

    if (currentArgument === '--json') {
      parsedSkillOptions.json = true;
      continue;
    }

    throw new Error(`Unknown option: ${currentArgument}`);
  }

  const skillPlatformIndex = await loadSkillPlatformIndex();
  const skillDomainEntries = Object.values(skillPlatformIndex.domains || {});
  const selectedSkillDomain = parsedSkillOptions.domain
    ? findSkillDomainByInput(parsedSkillOptions.domain, skillDomainEntries)
    : null;

  if (parsedSkillOptions.domain && !selectedSkillDomain) {
    throw new Error(`Unknown skill domain: ${parsedSkillOptions.domain}`);
  }

  if (parsedSkillOptions.tierProvided && !parsedSkillOptions.tier) {
    throw new Error(`Unknown skill tier: ${commandArguments.join(' ')}`);
  }

  const selectedTierName = parsedSkillOptions.tier || skillPlatformIndex.defaultTier || 'advance';
  const recommendedPackFileName = selectedSkillDomain
    ? selectedSkillDomain.tierToPackFileNames?.[selectedTierName]
      || selectedSkillDomain.tierToPackFileNames?.[selectedSkillDomain.defaultTier]
      || selectedSkillDomain.defaultPackFileName
      || null
    : null;

  if (parsedSkillOptions.json) {
    console.log(JSON.stringify({
      defaultTier: skillPlatformIndex.defaultTier,
      selectedTier: selectedTierName,
      selectedDomain: selectedSkillDomain,
      recommendedPackFileName,
    }, null, 2));
    return;
  }

  console.log('Skill platform selector');
  console.log(`Default tier: ${skillPlatformIndex.defaultTier}`);
  console.log(`Available tiers:\n${formatSkillTierList(skillPlatformIndex)}`);

  if (!selectedSkillDomain) {
    console.log('\nAvailable domains:');
    for (const skillDomainEntry of skillDomainEntries) {
      console.log(`- ${skillDomainEntry.name}: ${skillDomainEntry.description}`);
    }
    return;
  }

  console.log(`\nSelected domain: ${selectedSkillDomain.displayName}`);
  console.log(`Selected tier: ${selectedTierName}`);
  console.log(`Recommended pack: ${recommendedPackFileName}`);
  console.log(`Purpose: ${selectedSkillDomain.description}`);
  console.log(`Evidence: ${selectedSkillDomain.evidence}`);
}
