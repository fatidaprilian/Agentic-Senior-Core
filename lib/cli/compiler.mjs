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
  buildSkillPackSection,
} from './skill-selector.mjs';

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
  const selectedStateDirectoryPath = path.join(resolvedTargetDirectoryPath, '.agent-context', 'state');
  const selectedReviewDirectoryPath = path.join(resolvedTargetDirectoryPath, '.agent-context', 'review-checklists');
  const skillPlatformIndex = JSON.parse(await fs.readFile(SKILL_PLATFORM_INDEX_PATH, 'utf8'));
  const selectedSkillDomainNames = inferSkillDomainNamesFromSelection(selectedStackFileName, selectedBlueprintFileName);

  const universalRuleFileNames = await collectFileNames(selectedRulesDirectoryPath);
  const contextBlocks = [];

  for (const universalRuleFileName of universalRuleFileNames) {
    const universalRuleFilePath = path.join(selectedRulesDirectoryPath, universalRuleFileName);
    const universalRuleContent = await fs.readFile(universalRuleFilePath, 'utf8');

    contextBlocks.push(
      `## UNIVERSAL RULE: ${universalRuleFileName}\nSource: .agent-context/rules/${universalRuleFileName}\n\n${universalRuleContent.trim()}`
    );
  }

  const stackFilePath = path.join(selectedStacksDirectoryPath, selectedStackFileName);
  const stackContent = await fs.readFile(stackFilePath, 'utf8');
  contextBlocks.push(
    `## STACK PROFILE: ${selectedStackFileName}\nSource: .agent-context/stacks/${selectedStackFileName}\n\n${stackContent.trim()}`
  );

  const blueprintFilePath = path.join(selectedBlueprintsDirectoryPath, selectedBlueprintFileName);
  const blueprintContent = await fs.readFile(blueprintFilePath, 'utf8');
  contextBlocks.push(
    `## BLUEPRINT PROFILE: ${selectedBlueprintFileName}\nSource: .agent-context/blueprints/${selectedBlueprintFileName}\n\n${blueprintContent.trim()}`
  );

  if (includeCiGuardrails) {
    const githubCiBlueprintContent = await fs.readFile(path.join(selectedBlueprintsDirectoryPath, 'ci-github-actions.md'), 'utf8');
    const gitlabCiBlueprintContent = await fs.readFile(path.join(selectedBlueprintsDirectoryPath, 'ci-gitlab.md'), 'utf8');

    contextBlocks.push(
      `## CI/CD GUARDRAILS: ci-github-actions.md\nSource: .agent-context/blueprints/ci-github-actions.md\n\n${githubCiBlueprintContent.trim()}`
    );
    contextBlocks.push(
      `## CI/CD GUARDRAILS: ci-gitlab.md\nSource: .agent-context/blueprints/ci-gitlab.md\n\n${gitlabCiBlueprintContent.trim()}`
    );
  }

  for (const selectedSkillDomainName of selectedSkillDomainNames) {
    const skillDomainEntry = skillPlatformIndex.domains?.[selectedSkillDomainName];
    if (!skillDomainEntry) {
      continue;
    }

    contextBlocks.push(await buildSkillPackSection(skillDomainEntry, skillPlatformIndex.defaultTier || 'advance'));
  }

  const architectureMapContent = await fs.readFile(path.join(selectedStateDirectoryPath, 'architecture-map.md'), 'utf8');
  const dependencyMapContent = await fs.readFile(path.join(selectedStateDirectoryPath, 'dependency-map.md'), 'utf8');
  const prChecklistContent = await fs.readFile(path.join(selectedReviewDirectoryPath, 'pr-checklist.md'), 'utf8');

  contextBlocks.push(
    `## STATE MAP: architecture-map.md\nSource: .agent-context/state/architecture-map.md\n\n${architectureMapContent.trim()}`
  );
  contextBlocks.push(
    `## STATE MAP: dependency-map.md\nSource: .agent-context/state/dependency-map.md\n\n${dependencyMapContent.trim()}`
  );
  contextBlocks.push(
    `## REVIEW CHECKLIST: pr-checklist.md\nSource: .agent-context/review-checklists/pr-checklist.md\n\n${prChecklistContent.trim()}`
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
