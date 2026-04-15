/**
 * Context Compiler — Rulebook compilation and state persistence.
 * Depends on: constants.mjs, utils.mjs, skill-selector.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  CLI_VERSION,
  POLICY_FILE_NAME,
  SKILL_PLATFORM_INDEX_PATH,
} from './constants.mjs';

import {
  pathExists,
  collectFileNames,
} from './utils.mjs';

import {
  inferSkillDomainNamesFromSelection,
} from './skill-selector.mjs';

import {
  readTokenOptimizationState,
  buildTokenOptimizationGuidanceBlock,
} from './token-optimization.mjs';

export async function writeSelectedPolicy(targetDirectoryPath, selectedProfileName) {
  const policyFilePath = path.join(targetDirectoryPath, '.agent-context', 'policies', POLICY_FILE_NAME);
  const parsedPolicy = JSON.parse(await fs.readFile(policyFilePath, 'utf8'));
  parsedPolicy.selectedProfile = selectedProfileName;
  await fs.writeFile(policyFilePath, JSON.stringify(parsedPolicy, null, 2) + '\n', 'utf8');
}

export async function writeOnboardingReport({
  targetDirectoryPath,
  selectedProfileName,
  selectedProfilePack,
  selectedPreset,
  selectedStackFileName,
  selectedBlueprintFileName,
  includeCiGuardrails,
  setupDurationMs,
  projectDetection,
  selectedSkillDomains = [],
  compatibilityWarnings = [],
  operationMode = 'init',
}) {
  const onboardingReportPath = path.join(targetDirectoryPath, '.agent-context', 'state', 'onboarding-report.json');
  const onboardingReport = {
    cliVersion: CLI_VERSION,
    generatedAt: new Date().toISOString(),
    operationMode,
    selectedProfile: selectedProfileName,
    selectedProfilePack: selectedProfilePack
      ? {
        name: selectedProfilePack.slug,
        sourceFile: selectedProfilePack.fileName,
      }
      : null,
    selectedPreset,
    selectedStack: selectedStackFileName,
    selectedBlueprint: selectedBlueprintFileName,
    ciGuardrailsEnabled: includeCiGuardrails,
    setupDurationMs,
    selectedSkillDomains,
    compatibilityWarnings,
    autoDetection: {
      recommendedStack: projectDetection.recommendedStackFileName,
      recommendedBlueprint: projectDetection.recommendedBlueprintFileName,
      confidenceLabel: projectDetection.confidenceLabel,
      confidenceScore: projectDetection.confidenceScore,
      confidenceGap: projectDetection.confidenceGap,
      detectionReasoning: projectDetection.detectionReasoning,
      rankedCandidates: projectDetection.rankedCandidates,
      evidence: projectDetection.evidence,
    },
  };

  await fs.writeFile(onboardingReportPath, JSON.stringify(onboardingReport, null, 2) + '\n', 'utf8');
}

export async function loadOnboardingReportIfExists(targetDirectoryPath) {
  const onboardingReportPath = path.join(targetDirectoryPath, '.agent-context', 'state', 'onboarding-report.json');
  if (!(await pathExists(onboardingReportPath))) {
    return null;
  }

  const onboardingReportContent = await fs.readFile(onboardingReportPath, 'utf8');
  return JSON.parse(onboardingReportContent);
}

export async function buildCompiledRulesContent({
  targetDirectoryPath,
  selectedProfileName,
  selectedStackFileName,
  selectedBlueprintFileName,
  includeCiGuardrails,
}) {
  const resolvedTargetDirectoryPath = path.resolve(targetDirectoryPath);
  const selectedRulesDirectoryPath = path.join(resolvedTargetDirectoryPath, '.agent-context', 'rules');
  const selectedStacksDirectoryPath = path.join(resolvedTargetDirectoryPath, '.agent-context', 'stacks');
  const selectedBlueprintsDirectoryPath = path.join(resolvedTargetDirectoryPath, '.agent-context', 'blueprints');
  const skillPlatformIndex = JSON.parse(await fs.readFile(SKILL_PLATFORM_INDEX_PATH, 'utf8'));
  const selectedSkillDomainNames = inferSkillDomainNamesFromSelection(selectedStackFileName, selectedBlueprintFileName);

  const universalRuleFileNames = await collectFileNames(selectedRulesDirectoryPath);
  const contextBlocks = [];

  function resolveSkillPackFileName(skillDomainEntry, selectedTierName) {
    return skillDomainEntry.tierToPackFileNames?.[selectedTierName]
      || skillDomainEntry.tierToPackFileNames?.[skillDomainEntry.defaultTier]
      || skillDomainEntry.defaultPackFileName;
  }

  function firstMarkdownHeading(content, fallbackLabel) {
    const headingLine = content
      .split(/\r?\n/)
      .find((line) => line.trim().startsWith('#'));

    if (!headingLine) {
      return fallbackLabel;
    }

    return headingLine.replace(/^#+\s*/, '').trim();
  }

  contextBlocks.push(
    [
      '## BOOTSTRAP CHAIN (MANDATORY)',
      'Load every layer before responding. Do not skip steps:',
      '1. .agent-context/rules/',
      '2. .agent-context/stacks/',
      '3. .agent-context/blueprints/',
      '4. .agent-context/skills/',
      '5. .agent-context/prompts/',
      '6. .agent-context/profiles/',
      '7. .agent-context/state/',
      `8. .agent-context/policies/${POLICY_FILE_NAME}`,
      '',
      'Primary entrypoint: .cursorrules',
      'Mirror entrypoint: .windsurfrules',
      'Canonical baseline: .instructions.md',
    ].join('\n')
  );

  contextBlocks.push(
    [
      '## LAYER 1: UNIVERSAL RULES (MANDATORY)',
      'Read every file under .agent-context/rules/ before implementation:',
      ...universalRuleFileNames.map((universalRuleFileName, index) => `${index + 1}. .agent-context/rules/${universalRuleFileName}`),
      '',
      'Conflict resolution: prioritize data safety and API contract integrity first, then writing polish.',
    ].join('\n')
  );

  const stackFilePath = path.join(selectedStacksDirectoryPath, selectedStackFileName);
  const stackContent = await fs.readFile(stackFilePath, 'utf8');
  const stackSummary = firstMarkdownHeading(stackContent, selectedStackFileName);
  contextBlocks.push(
    [
      `## LAYER 2: STACK PROFILE (${selectedStackFileName})`,
      `Source: .agent-context/stacks/${selectedStackFileName}`,
      `Summary: ${stackSummary}`,
      'Load this stack profile to enforce language-specific conventions.',
    ].join('\n')
  );

  const blueprintFilePath = path.join(selectedBlueprintsDirectoryPath, selectedBlueprintFileName);
  const blueprintContent = await fs.readFile(blueprintFilePath, 'utf8');
  const blueprintSummary = firstMarkdownHeading(blueprintContent, selectedBlueprintFileName);
  contextBlocks.push(
    [
      `## LAYER 3: BLUEPRINT PROFILE (${selectedBlueprintFileName})`,
      `Source: .agent-context/blueprints/${selectedBlueprintFileName}`,
      `Summary: ${blueprintSummary}`,
      'Load this blueprint when scaffolding or changing architecture boundaries.',
    ].join('\n')
  );

  if (includeCiGuardrails) {
    contextBlocks.push(
      [
        '## LAYER 3B: CI/CD GUARDRAILS',
        'Load these CI blueprints when pipeline or release logic is touched:',
        '1. .agent-context/blueprints/ci-github-actions.md',
        '2. .agent-context/blueprints/ci-gitlab.md',
      ].join('\n')
    );
  }

  for (const selectedSkillDomainName of selectedSkillDomainNames) {
    const skillDomainEntry = skillPlatformIndex.domains?.[selectedSkillDomainName];
    if (!skillDomainEntry) {
      continue;
    }

    const selectedTierName = skillPlatformIndex.defaultTier || 'advance';
    const resolvedPackFileName = resolveSkillPackFileName(skillDomainEntry, selectedTierName);

    contextBlocks.push(
      [
        `## SKILL PACK: ${skillDomainEntry.displayName}`,
        `Source: .agent-context/skills/${resolvedPackFileName}`,
        `Default tier: ${skillDomainEntry.defaultTier}`,
        `Selected tier: ${selectedTierName}`,
        `Evidence: ${skillDomainEntry.evidence}`,
        `Purpose: ${skillDomainEntry.description}`,
        'Load this skill pack and apply every Must-Have Check.',
      ].join('\n')
    );
  }

  const tokenOptimizationState = await readTokenOptimizationState(resolvedTargetDirectoryPath);
  if (tokenOptimizationState?.enabled) {
    contextBlocks.push(
      `## TOKEN OPTIMIZATION PROFILE\nSource: .agent-context/state/token-optimization.json\n\n${buildTokenOptimizationGuidanceBlock(tokenOptimizationState).trim()}`
    );
  }
  contextBlocks.push(
    [
      '## LAYER 7: STATE AWARENESS (MANDATORY)',
      'Load these files before touching critical paths:',
      '1. .agent-context/state/architecture-map.md',
      '2. .agent-context/state/dependency-map.md',
      'Use these maps to prevent unsafe cross-module changes.',
    ].join('\n')
  );
  contextBlocks.push(
    [
      '## REVIEW CHECKLISTS (MANDATORY)',
      '1. .agent-context/review-checklists/pr-checklist.md',
      '2. .agent-context/review-checklists/security-audit.md (when security-sensitive)',
      '3. .agent-context/review-checklists/performance-audit.md (when perf-critical)',
      'Do not claim done before checklist pass.',
    ].join('\n')
  );

  return [
    '# AGENTIC-SENIOR-CORE DYNAMIC GOVERNANCE RULESET',
    '',
    `Generated by Agentic-Senior-Core CLI v${CLI_VERSION}`,
    `Timestamp: ${new Date().toISOString()}`,
    `Selected profile: ${selectedProfileName}`,
    `Selected policy file: .agent-context/policies/${POLICY_FILE_NAME}`,
    '',
    '## GOVERNANCE PRECEDENCE',
    '1. Follow this compiled rulebook as the primary source.',
    '2. Resolve exceptions from .agent-override.md only when explicitly defined.',
    '3. Use architecture-map.md and dependency-map.md as change safety boundaries.',
    '4. Enforce pr-checklist.md before declaring completion.',
    '',
    '## OVERRIDE PROTOCOL',
    '- Default: strict compliance with this file.',
    '- Exception path: .agent-override.md may explicitly allow narrow deviations.',
    '- Scope policy: every override must include module scope, rationale, and expiry date.',
    '',
    ...contextBlocks,
    '',
  ].join('\n');
}

export async function compileDynamicContext({
  targetDirectoryPath,
  selectedProfileName,
  selectedStackFileName,
  selectedBlueprintFileName,
  includeCiGuardrails,
}) {
  const resolvedTargetDirectoryPath = path.resolve(targetDirectoryPath);
  const compiledRules = await buildCompiledRulesContent({
    targetDirectoryPath: resolvedTargetDirectoryPath,
    selectedProfileName,
    selectedStackFileName,
    selectedBlueprintFileName,
    includeCiGuardrails,
  });

  await fs.writeFile(path.join(resolvedTargetDirectoryPath, '.cursorrules'), compiledRules, 'utf8');
  await fs.writeFile(path.join(resolvedTargetDirectoryPath, '.windsurfrules'), compiledRules, 'utf8');
}
