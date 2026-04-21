/**
 * Context Compiler — Rulebook compilation and state persistence.
 * Depends on: constants.mjs, utils.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  CLI_VERSION,
  POLICY_FILE_NAME,
  BLUEPRINT_RECOMMENDATIONS,
} from './constants.mjs';

import {
  pathExists,
  collectFileNames,
} from './utils.mjs';

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
  projectScope = null,
  selectedStackFileName,
  selectedAdditionalStackFileNames = [],
  selectedBlueprintFileName,
  selectedAdditionalBlueprintFileNames = [],
  includeCiGuardrails,
  setupDurationMs,
  projectDetection,
  runtimeEnvironment = null,
  operationMode = 'init',
  tokenOptimization = undefined,
  memoryContinuity = undefined,
  architectRecommendation = null,
  detectionTransparency = null,
  uiScopeSignals = null,
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
    projectScope,
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
      uiScope: uiScopeSignals
        ? {
          isUiScopeLikely: uiScopeSignals.isUiScopeLikely === true,
          signalReasons: uiScopeSignals.signalReasons || [],
          workspaceUiEntries: uiScopeSignals.workspaceUiEntries || [],
          frontendEvidenceMetrics: uiScopeSignals.frontendEvidenceMetrics || null,
        }
        : null,
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
  const normalizedAdditionalStackFileNames = Array.isArray(selectedAdditionalStackFileNames)
    ? Array.from(new Set(selectedAdditionalStackFileNames.filter((stackFileName) => stackFileName && stackFileName !== selectedStackFileName)))
    : [];
  const normalizedAdditionalBlueprintFileNames = Array.isArray(selectedAdditionalBlueprintFileNames)
    ? Array.from(new Set(selectedAdditionalBlueprintFileNames.filter(
      (blueprintFileName) => blueprintFileName && blueprintFileName !== selectedBlueprintFileName
    )))
    : [];

  const universalRuleFileNames = await collectFileNames(selectedRulesDirectoryPath);
  const availableStackProfileFileNames = new Set(await collectFileNames(selectedStacksDirectoryPath));
  const availableBlueprintProfileFileNames = new Set(await collectFileNames(selectedBlueprintsDirectoryPath));
  const contextBlocks = [];

  function firstMarkdownHeading(content, fallbackLabel) {
    const headingLine = content
      .split(/\r?\n/)
      .find((line) => line.trim().startsWith('#'));

    if (!headingLine) {
      return fallbackLabel;
    }

    return headingLine.replace(/^#+\s*/, '').trim();
  }

  function humanizeProfileName(fileName) {
    return String(fileName || '')
      .replace(/\.md$/i, '')
      .replace(/[-_]/g, ' ')
      .trim();
  }

  contextBlocks.push(
    [
      '## BOOTSTRAP CHAIN (MANDATORY)',
      'Load every layer before responding. Do not skip steps:',
      '1. .agent-context/rules/',
      '2. Resolve architecture and stack signals from project context and live evidence.',
      '3. .agent-context/prompts/',
      '4. Dynamic architecture and stack signals (from project context + research evidence)',
      '5. .agent-context/state/',
      `6. .agent-context/policies/${POLICY_FILE_NAME}`,
      '7. docs/ project context (or bootstrap prompts when docs are not materialized)',
      '',
      'Primary entrypoint: .agent-instructions.md',
      'Adapter entrypoints: .cursorrules, .windsurfrules, .clauderc, .gemini/instructions.md, .github/copilot-instructions.md',
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
  const hasStackProfileFile = availableStackProfileFileNames.has(selectedStackFileName);
  const stackSummary = hasStackProfileFile
    ? firstMarkdownHeading(await fs.readFile(stackFilePath, 'utf8'), selectedStackFileName)
    : `Dynamic stack strategy signal for ${humanizeProfileName(selectedStackFileName)}.`;
  contextBlocks.push(
    [
      `## LAYER 2: STACK PROFILE (${selectedStackFileName})`,
      hasStackProfileFile
        ? `Source: stack-profile:${selectedStackFileName}`
        : 'Source: dynamic-research-signal (static stack profile file not required)',
      `Summary: ${stackSummary}`,
      'Load this stack profile to enforce language-specific conventions.',
    ].join('\n')
  );

  if (normalizedAdditionalStackFileNames.length > 0) {
    contextBlocks.push(
      [
        '## LAYER 2B: ADDITIONAL STACK PROFILES',
        'This project uses multiple stacks. Load all additional stack profiles below:',
        ...normalizedAdditionalStackFileNames.map((stackFileName, stackIndex) => {
          if (availableStackProfileFileNames.has(stackFileName)) {
            return `${stackIndex + 1}. stack-profile:${stackFileName}`;
          }

          return `${stackIndex + 1}. ${stackFileName} (dynamic stack signal)`;
        }),
      ].join('\n')
    );
  }

  contextBlocks.push(
    [
      '## LAYER 2 POLICY: LAZY RULE LOADING',
      hasStackProfileFile
        ? `Primary stack profile is always loaded for this project: stack-profile:${selectedStackFileName}`
        : `Primary stack strategy is always loaded for this project: ${selectedStackFileName} (dynamic mode)`,
      normalizedAdditionalStackFileNames.length > 0
        ? `Additional stack profiles load on demand: ${normalizedAdditionalStackFileNames.map((stackFileName) => {
          if (availableStackProfileFileNames.has(stackFileName)) {
            return `stack-profile:${stackFileName}`;
          }

          return `${stackFileName} (dynamic signal)`;
        }).join(', ')}`
        : 'Additional stack profiles load only when explicitly selected or detected.',
      'Load stack guidance only when task scope touches that stack.',
      'Avoid eager loading unrelated stack profiles to prevent instruction conflicts.',
    ].join('\n')
  );

  contextBlocks.push(
    [
      '## LAYER 5: EXECUTION PROMPTS AND UI TRIGGERS',
      'Load these prompt contracts only when their trigger matches the user request:',
      '1. .agent-context/prompts/init-project.md -> create, build, new project, scaffold',
      '2. .agent-context/prompts/refactor.md -> refactor, improve, clean up, fix',
      '3. .agent-context/prompts/review-code.md -> review, audit, check, analyze',
      '4. .agent-context/prompts/bootstrap-design.md -> ui, ux, layout, screen, tailwind, frontend, redesign',
      'UI trigger policy:',
      '- Load .agent-context/prompts/bootstrap-design.md and .agent-context/rules/frontend-architecture.md first.',
      '- Keep UI-only requests context-isolated and do not eagerly load backend-only rules such as database-design.md, docker-runtime.md, or microservices.md unless the task explicitly crosses those boundaries.',
      '- For UI scope, materialize docs/DESIGN.md and docs/design-intent.json before implementing UI surfaces.',
    ].join('\n')
  );

  const blueprintFilePath = path.join(selectedBlueprintsDirectoryPath, selectedBlueprintFileName);
  const hasBlueprintProfileFile = availableBlueprintProfileFileNames.has(selectedBlueprintFileName);
  const blueprintSummary = hasBlueprintProfileFile
    ? firstMarkdownHeading(await fs.readFile(blueprintFilePath, 'utf8'), selectedBlueprintFileName)
    : `Dynamic architecture strategy signal for ${humanizeProfileName(selectedBlueprintFileName)}.`;
  contextBlocks.push(
    [
      `## LAYER 3: BLUEPRINT PROFILE (${selectedBlueprintFileName})`,
      hasBlueprintProfileFile
        ? `Source: architecture-profile:${selectedBlueprintFileName}`
        : 'Source: dynamic-research-signal (static blueprint profile file not required)',
      `Summary: ${blueprintSummary}`,
      'Load this blueprint when scaffolding or changing architecture boundaries.',
    ].join('\n')
  );

  if (normalizedAdditionalBlueprintFileNames.length > 0) {
    contextBlocks.push(
      [
        '## LAYER 3A: ADDITIONAL BLUEPRINT PROFILES',
        'This project uses multiple architecture blueprints. Load all additional blueprint profiles below:',
        ...normalizedAdditionalBlueprintFileNames.map((blueprintFileName, blueprintIndex) => {
          if (availableBlueprintProfileFileNames.has(blueprintFileName)) {
            return `${blueprintIndex + 1}. architecture-profile:${blueprintFileName}`;
          }

          return `${blueprintIndex + 1}. ${blueprintFileName} (dynamic architecture signal)`;
        }),
      ].join('\n')
    );
  }

  if (includeCiGuardrails) {
    const ciBlueprintEntries = ['ci-github-actions.md', 'ci-gitlab.md'].map((ciBlueprintFileName, ciBlueprintIndex) => {
      if (availableBlueprintProfileFileNames.has(ciBlueprintFileName)) {
        return `${ciBlueprintIndex + 1}. architecture-profile:${ciBlueprintFileName}`;
      }

      return `${ciBlueprintIndex + 1}. ${ciBlueprintFileName} (dynamic CI policy signal)`;
    });

    contextBlocks.push(
      [
        '## LAYER 3B: CI/CD GUARDRAILS',
        'Load these CI blueprints when pipeline or release logic is touched:',
        ...ciBlueprintEntries,
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
      '2. .agent-context/review-checklists/architecture-review.md',
      'Security and performance checks are consolidated inside these two checklist files.',
      'Do not claim done before checklist pass.',
    ].join('\n')
  );

  const projectBriefPath = path.join(resolvedTargetDirectoryPath, 'docs', 'project-brief.md');
  const bootstrapProjectContextPromptPath = path.join(
    resolvedTargetDirectoryPath,
    '.agent-context',
    'prompts',
    'bootstrap-project-context.md'
  );
  const bootstrapDesignPromptPath = path.join(
    resolvedTargetDirectoryPath,
    '.agent-context',
    'prompts',
    'bootstrap-design.md'
  );
  const hasBootstrapProjectContextPrompt = await pathExists(bootstrapProjectContextPromptPath);
  const hasBootstrapDesignPrompt = await pathExists(bootstrapDesignPromptPath);

  if (await pathExists(projectBriefPath)) {
    const projectDocsEntries = ['project-brief.md'];
    const candidateDocFileNames = [
      'architecture-decision-record.md',
      'database-schema.md',
      'api-contract.md',
      'flow-overview.md',
      'DESIGN.md',
      'design-intent.json',
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
        'Universal SOP hard block policy:',
        '- Stop implementation if docs/architecture-decision-record.md (alias: docs/Architecture-Decision-Record.md) is missing.',
        '- For UI scope, stop implementation if docs/DESIGN.md or docs/design-intent.json is missing.',
        '- Materialize missing docs first, then continue coding.',
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
  } else if (hasBootstrapProjectContextPrompt) {
    const bootstrapPromptEntries = [
      '.agent-context/prompts/bootstrap-project-context.md',
    ];

    if (hasBootstrapDesignPrompt) {
      bootstrapPromptEntries.push('.agent-context/prompts/bootstrap-design.md');
    }

    contextBlocks.push(
      [
        '## LAYER 9: PROJECT CONTEXT (MANDATORY)',
        'Project docs are not materialized yet. Bootstrap them before writing application code.',
        'Execute these prompts in your IDE assistant first:',
        ...bootstrapPromptEntries.map((promptFilePath, promptIndex) => `${promptIndex + 1}. ${promptFilePath}`),
        '',
        'Bootstrap policy:',
        '- Hard block: do not write application code until docs/project-brief.md and docs/architecture-decision-record.md exist.',
        '- If docs/project-brief.md is missing, execute bootstrap-project-context prompt immediately.',
        hasBootstrapDesignPrompt
          ? '- For UI scope: if docs/DESIGN.md or docs/design-intent.json is missing, execute bootstrap-design prompt before implementing UI surfaces.'
          : '- For UI scope: add a design bootstrap prompt before implementing UI surfaces.',
        '- Save generated docs under docs/ and keep them updated when feature scope changes.',
        'Latest user prompt defines current feature scope and product direction.',
        'Treat synthesized docs as living references, then continue implementation with those docs as source of truth.',
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

  await fs.writeFile(path.join(resolvedTargetDirectoryPath, '.agent-instructions.md'), compiledRules, 'utf8');
  await fs.writeFile(path.join(resolvedTargetDirectoryPath, '.cursorrules'), compiledRules, 'utf8');
  await fs.writeFile(path.join(resolvedTargetDirectoryPath, '.windsurfrules'), compiledRules, 'utf8');
  await fs.writeFile(path.join(resolvedTargetDirectoryPath, '.clauderc'), compiledRules, 'utf8');
  
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
