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
  BLUEPRINT_RECOMMENDATIONS,
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
import {
  readMemoryContinuityState,
  buildMemoryContinuityGuidanceBlock,
} from './memory-continuity.mjs';

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
  selectedAdditionalStackFileNames = [],
  selectedBlueprintFileName,
  selectedAdditionalBlueprintFileNames = [],
  includeCiGuardrails,
  setupDurationMs,
  projectDetection,
  selectedSkillDomains = [],
  compatibilityWarnings = [],
  runtimeEnvironment = null,
  operationMode = 'init',
  tokenOptimization = undefined,
  memoryContinuity = undefined,
  architectRecommendation = null,
  detectionTransparency = null,
}) {
  const onboardingReportPath = path.join(targetDirectoryPath, '.agent-context', 'state', 'onboarding-report.json');
  const resolvedTokenOptimization = typeof tokenOptimization === 'undefined'
    ? await readTokenOptimizationState(targetDirectoryPath)
    : tokenOptimization;
  const resolvedMemoryContinuity = typeof memoryContinuity === 'undefined'
    ? await readMemoryContinuityState(targetDirectoryPath)
    : memoryContinuity;
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
    selectedAdditionalStacks: selectedAdditionalStackFileNames,
    selectedBlueprint: selectedBlueprintFileName,
    selectedAdditionalBlueprints: selectedAdditionalBlueprintFileNames,
    ruleLoadingPolicy: {
      canonicalSource: '.instructions.md',
      stackLoadingMode: 'lazy',
      loadedOnDemand: true,
      primaryStack: selectedStackFileName,
      additionalStacks: selectedAdditionalStackFileNames,
    },
    ciGuardrailsEnabled: includeCiGuardrails,
    setupDurationMs,
    selectedSkillDomains,
    compatibilityWarnings,
    runtimeEnvironment,
    tokenOptimization: resolvedTokenOptimization,
    memoryContinuity: resolvedMemoryContinuity,
    architectRecommendation,
    autoDetection: {
      recommendedStack: projectDetection.recommendedStackFileName,
      recommendedAdditionalStacks: projectDetection.secondaryStackFileNames || [],
      recommendedBlueprint: projectDetection.recommendedBlueprintFileName,
      recommendedAdditionalBlueprints: Array.isArray(projectDetection.secondaryStackFileNames)
        ? projectDetection.secondaryStackFileNames
          .map((secondaryStackFileName) => BLUEPRINT_RECOMMENDATIONS[secondaryStackFileName] || null)
          .filter(Boolean)
        : [],
      confidenceLabel: projectDetection.confidenceLabel,
      confidenceScore: projectDetection.confidenceScore,
      confidenceGap: projectDetection.confidenceGap,
      detectionReasoning: projectDetection.detectionReasoning,
      rankedCandidates: projectDetection.rankedCandidates,
      evidence: projectDetection.evidence,
      detectionTransparency: detectionTransparency || null,
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
  selectedAdditionalStackFileNames = [],
  selectedBlueprintFileName,
  selectedAdditionalBlueprintFileNames = [],
  includeCiGuardrails,
}) {
  const resolvedTargetDirectoryPath = path.resolve(targetDirectoryPath);
  const selectedRulesDirectoryPath = path.join(resolvedTargetDirectoryPath, '.agent-context', 'rules');
  const selectedStacksDirectoryPath = path.join(resolvedTargetDirectoryPath, '.agent-context', 'stacks');
  const selectedBlueprintsDirectoryPath = path.join(resolvedTargetDirectoryPath, '.agent-context', 'blueprints');
  const skillPlatformIndex = JSON.parse(await fs.readFile(SKILL_PLATFORM_INDEX_PATH, 'utf8'));
  const normalizedAdditionalStackFileNames = Array.isArray(selectedAdditionalStackFileNames)
    ? Array.from(new Set(selectedAdditionalStackFileNames.filter((stackFileName) => stackFileName && stackFileName !== selectedStackFileName)))
    : [];
  const normalizedAdditionalBlueprintFileNames = Array.isArray(selectedAdditionalBlueprintFileNames)
    ? Array.from(new Set(selectedAdditionalBlueprintFileNames.filter(
      (blueprintFileName) => blueprintFileName && blueprintFileName !== selectedBlueprintFileName
    )))
    : [];
  const selectedSkillDomainNames = inferSkillDomainNamesFromSelection(
    selectedStackFileName,
    selectedBlueprintFileName,
    normalizedAdditionalStackFileNames,
    normalizedAdditionalBlueprintFileNames
  );

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
      '2. .agent-context/stacks/ (lazy by task scope)',
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

  if (normalizedAdditionalStackFileNames.length > 0) {
    contextBlocks.push(
      [
        '## LAYER 2B: ADDITIONAL STACK PROFILES',
        'This project uses multiple stacks. Load all additional stack profiles below:',
        ...normalizedAdditionalStackFileNames.map((stackFileName, stackIndex) => `${stackIndex + 1}. .agent-context/stacks/${stackFileName}`),
      ].join('\n')
    );
  }

  contextBlocks.push(
    [
      '## LAYER 2 POLICY: LAZY RULE LOADING',
      `Primary stack profile is always loaded for this project: .agent-context/stacks/${selectedStackFileName}`,
      normalizedAdditionalStackFileNames.length > 0
        ? `Additional stack profiles load on demand: ${normalizedAdditionalStackFileNames.map((stackFileName) => `.agent-context/stacks/${stackFileName}`).join(', ')}`
        : 'Additional stack profiles load only when explicitly selected or detected.',
      'Load stack guidance only when task scope touches that stack.',
      'Avoid eager loading unrelated stack profiles to prevent instruction conflicts.',
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

  if (normalizedAdditionalBlueprintFileNames.length > 0) {
    contextBlocks.push(
      [
        '## LAYER 3A: ADDITIONAL BLUEPRINT PROFILES',
        'This project uses multiple architecture blueprints. Load all additional blueprint profiles below:',
        ...normalizedAdditionalBlueprintFileNames.map(
          (blueprintFileName, blueprintIndex) => `${blueprintIndex + 1}. .agent-context/blueprints/${blueprintFileName}`
        ),
      ].join('\n')
    );
  }

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

  const memoryContinuityState = await readMemoryContinuityState(resolvedTargetDirectoryPath);
  if (memoryContinuityState?.enabled) {
    contextBlocks.push(
      `## MEMORY CONTINUITY PROFILE\nSource: .agent-context/state/memory-continuity.json\n\n${buildMemoryContinuityGuidanceBlock(memoryContinuityState).trim()}`
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

  const projectBriefPath = path.join(resolvedTargetDirectoryPath, 'docs', 'project-brief.md');
  if (await pathExists(projectBriefPath)) {
    const projectDocsEntries = ['project-brief.md'];
    const candidateDocFileNames = [
      'architecture-decision-record.md',
      'database-schema.md',
      'api-contract.md',
      'flow-overview.md',
    ];

    for (const candidateFileName of candidateDocFileNames) {
      const candidateFilePath = path.join(resolvedTargetDirectoryPath, 'docs', candidateFileName);
      if (await pathExists(candidateFilePath)) {
        projectDocsEntries.push(candidateFileName);
      }
    }

    contextBlocks.push(
      [
        '## LAYER 9: PROJECT CONTEXT (MANDATORY)',
        'These documents describe the specific project being built.',
        'Read them before writing any application code:',
        ...projectDocsEntries.map((docFileName, docIndex) => `${docIndex + 1}. docs/${docFileName}`),
        '',
        'These docs were generated during project initialization and reflect the architecture,',
        'database design, API contracts, and application flows chosen for this project.',
        'Latest user prompt defines current feature scope and product direction.',
        'Treat requested features as dynamic, but keep stack/database/auth constraints consistent',
        'with project docs unless the user explicitly asks for a migration.',
        'When scope changes, implement the new request and update docs/* in the same change',
        'so generated context stays aligned with the codebase.',
        'Update them as the project evolves. They are living references, not frozen specs.',
      ].join('\n')
    );
  }

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
  selectedAdditionalStackFileNames = [],
  selectedBlueprintFileName,
  selectedAdditionalBlueprintFileNames = [],
  includeCiGuardrails,
}) {
  const resolvedTargetDirectoryPath = path.resolve(targetDirectoryPath);
  const compiledRules = await buildCompiledRulesContent({
    targetDirectoryPath: resolvedTargetDirectoryPath,
    selectedProfileName,
    selectedStackFileName,
    selectedAdditionalStackFileNames,
    selectedBlueprintFileName,
    selectedAdditionalBlueprintFileNames,
    includeCiGuardrails,
  });

  await fs.writeFile(path.join(resolvedTargetDirectoryPath, '.cursorrules'), compiledRules, 'utf8');
  await fs.writeFile(path.join(resolvedTargetDirectoryPath, '.windsurfrules'), compiledRules, 'utf8');
  
  // Gemini (Antigravity Editor) instructions
  const geminiDir = path.join(resolvedTargetDirectoryPath, '.gemini');
  if (!(await pathExists(geminiDir))) {
    await fs.mkdir(geminiDir, { recursive: true });
  }
  await fs.writeFile(path.join(geminiDir, 'instructions.md'), compiledRules, 'utf8');

  // Copilot instructions (also used by some generic IDE extensions)
  const githubDir = path.join(resolvedTargetDirectoryPath, '.github');
  if (!(await pathExists(githubDir))) {
    await fs.mkdir(githubDir, { recursive: true });
  }
  await fs.writeFile(path.join(githubDir, 'copilot-instructions.md'), compiledRules, 'utf8');
}
