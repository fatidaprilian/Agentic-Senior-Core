/**
 * Context Compiler — Rulebook compilation and state persistence.
 * Depends on: constants.mjs, utils.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  CLI_VERSION,
  POLICY_FILE_NAME,
  AGENT_DECISION_STACK_FILE_NAME,
  AGENT_DECISION_BLUEPRINT_FILE_NAME,
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

function toSingleLine(value, fallbackValue) {
  const normalizedValue = String(value || '').replace(/\s+/g, ' ').trim();
  return normalizedValue || fallbackValue;
}

async function readDesignIntentIfExists(targetDirectoryPath) {
  const designIntentPath = path.join(targetDirectoryPath, 'docs', 'design-intent.json');
  if (!(await pathExists(designIntentPath))) {
    return null;
  }

  try {
    return JSON.parse(await fs.readFile(designIntentPath, 'utf8'));
  } catch {
    return {
      parseError: true,
    };
  }
}

function buildAnchorCommitmentHeader(designIntent) {
  if (!designIntent || typeof designIntent !== 'object') {
    return null;
  }

  if (designIntent.parseError) {
    return [
      '## [UI TASK ANCHOR - READ FIRST]',
      'Source: docs/design-intent.json',
      'Status: design-intent.json could not be parsed.',
      'Required action: fix docs/design-intent.json before UI implementation so the creative commitment can be loaded.',
    ].join('\n');
  }

  const conceptualAnchor = designIntent.conceptualAnchor || {};
  const derivedTokenLogic = designIntent.derivedTokenLogic || {};
  const creativeCommitment = designIntent.designExecutionHandoff?.creativeCommitment || {};
  const anchorReference = conceptualAnchor.anchorReference || derivedTokenLogic.anchorReference;
  const conceptualAnchorName = conceptualAnchor.name || anchorReference;
  const signatureMove = conceptualAnchor.signatureMove
    || designIntent.designExecutionHandoff?.signatureMoveRationale;
  const signatureMotion = conceptualAnchor.signatureMotion
    || creativeCommitment.signatureMotion
    || derivedTokenLogic.motionDerivationSource;
  const typographicDecision = conceptualAnchor.typographicDecision
    || creativeCommitment.typographicDecision
    || derivedTokenLogic.typographyDerivationSource;

  if (!conceptualAnchorName && !anchorReference) {
    return [
      '## [UI TASK ANCHOR - READ FIRST]',
      'Source: docs/design-intent.json',
      'Status: Creative commitment is missing.',
      'Required action: define conceptualAnchor.anchorReference, a concrete real-world anchor, signature motion, typographic decision, derivedTokenLogic, and libraryDecisions before UI implementation.',
    ].join('\n');
  }

  return [
    '## [UI TASK ANCHOR - READ FIRST]',
    'Source: docs/design-intent.json',
    `Conceptual Anchor: ${toSingleLine(conceptualAnchorName, 'MISSING - complete Creative Commitment Gate before UI implementation')}`,
    `Anchor Reference: ${toSingleLine(anchorReference, 'MISSING - required for deterministic token validation')}`,
    `Signature Move: ${toSingleLine(signatureMove, 'MISSING - define one concrete authored move before UI implementation')}`,
    `Motion Signature: ${toSingleLine(signatureMotion, 'MISSING - define timing/easing/choreography before UI implementation')}`,
    `Typographic Decision: ${toSingleLine(typographicDecision, 'MISSING - define role contrast before UI implementation')}`,
    'If the UI output does not reflect these lines, stop and revise the design contract before continuing.',
  ].join('\n');
}

export async function writeSelectedPolicy(targetDirectoryPath, selectedProfileName) {
  const policyFilePath = path.join(targetDirectoryPath, '.agent-context', 'policies', POLICY_FILE_NAME);
  const parsedPolicy = JSON.parse(await fs.readFile(policyFilePath, 'utf8'));
  parsedPolicy.selectedProfile = selectedProfileName;
  await fs.writeFile(policyFilePath, JSON.stringify(parsedPolicy, null, 2) + '\n', 'utf8');
}

export async function writeOnboardingReport({
  targetDirectoryPath,
  selectedProfileName,
  selectedPreset,
  projectScope = null,
  projectTopology = null,
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
  detectionTransparency = null,
  uiScopeSignals = null,
}) {
  const hasExplicitRuntimeDecision = selectedStackFileName && selectedStackFileName !== AGENT_DECISION_STACK_FILE_NAME;
  const hasExplicitArchitectureDecision = selectedBlueprintFileName && selectedBlueprintFileName !== AGENT_DECISION_BLUEPRINT_FILE_NAME;
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
    selectedPreset,
    projectScope,
    projectTopology,
    runtimeDecision: {
      mode: hasExplicitRuntimeDecision ? 'explicit-constraint' : 'agent-decision-required',
      explicitStack: hasExplicitRuntimeDecision ? selectedStackFileName : null,
      detectedStackEvidence: projectDetection.detectedStackFileName || null,
      detectedAdditionalStackEvidence: projectDetection.secondaryStackFileNames || [],
    },
    architectureDecision: {
      mode: hasExplicitArchitectureDecision ? 'explicit-constraint' : 'agent-decision-required',
      explicitBlueprint: hasExplicitArchitectureDecision ? selectedBlueprintFileName : null,
      detectedBlueprintEvidence: projectDetection.detectedBlueprintFileName || null,
    },
    selectedStack: hasExplicitRuntimeDecision ? selectedStackFileName : null,
    selectedAdditionalStacks: hasExplicitRuntimeDecision ? selectedAdditionalStackFileNames : [],
    selectedBlueprint: hasExplicitArchitectureDecision ? selectedBlueprintFileName : null,
    selectedAdditionalBlueprints: hasExplicitArchitectureDecision ? selectedAdditionalBlueprintFileNames : [],
    ruleLoadingPolicy: {
      canonicalSource: '.instructions.md',
      stackLoadingMode: 'lazy',
      domainRuleLoadingMode: 'lazy',
      loadedOnDemand: true,
      primaryStack: hasExplicitRuntimeDecision ? selectedStackFileName : null,
      additionalStacks: hasExplicitRuntimeDecision ? selectedAdditionalStackFileNames : [],
      agentDecisionRequired: !hasExplicitRuntimeDecision,
    },
    ciGuardrailsEnabled: includeCiGuardrails,
    setupDurationMs,
    runtimeEnvironment,
    tokenOptimization: resolvedTokenOptimization,
    memoryContinuity: resolvedMemoryContinuity,
    autoDetection: {
      detectedStack: projectDetection.detectedStackFileName,
      detectedAdditionalStacks: projectDetection.secondaryStackFileNames || [],
      detectedBlueprint: projectDetection.detectedBlueprintFileName,
      detectedAdditionalBlueprints: [],
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
          designEvidenceSummary: uiScopeSignals.designEvidenceSummary || null,
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
  const hasExplicitRuntimeDecision = selectedStackFileName && selectedStackFileName !== AGENT_DECISION_STACK_FILE_NAME;
  const hasExplicitArchitectureDecision = selectedBlueprintFileName && selectedBlueprintFileName !== AGENT_DECISION_BLUEPRINT_FILE_NAME;

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
      'Resolve the smallest relevant layer set before responding. Do not eagerly load unrelated layers:',
      '1. .agent-context/rules/',
      '2. Resolve runtime and architecture signals from project context, repo evidence, and live research.',
      '3. .agent-context/prompts/',
      '4. Dynamic runtime and architecture decision signals (from project context + research evidence)',
      '5. .agent-context/state/',
      `6. .agent-context/policies/${POLICY_FILE_NAME}`,
      '7. docs/ project context (or bootstrap prompts when docs are not materialized)',
      '',
      'Project-specific compiled snapshot: .agent-instructions.md',
      'Compiled adapter entrypoints: .cursorrules, .windsurfrules, .clauderc, .gemini/instructions.md, .github/copilot-instructions.md',
      'Canonical baseline: .instructions.md',
    ].join('\n')
  );

  contextBlocks.push(
    [
      '## LAYER 1: RULES (SCOPE-RESOLVED)',
      'Available rule files under .agent-context/rules/:',
      ...universalRuleFileNames.map((universalRuleFileName, index) => `${index + 1}. .agent-context/rules/${universalRuleFileName}`),
      '',
      'Resolution policy: load only the rule files relevant to the current task and prioritize data safety and API contract integrity first, then writing polish.',
    ].join('\n')
  );

  if (hasExplicitRuntimeDecision) {
    const stackFilePath = path.join(selectedStacksDirectoryPath, selectedStackFileName);
    const hasStackProfileFile = availableStackProfileFileNames.has(selectedStackFileName);
    const stackSummary = hasStackProfileFile
      ? firstMarkdownHeading(await fs.readFile(stackFilePath, 'utf8'), selectedStackFileName)
      : `Explicit runtime constraint for ${humanizeProfileName(selectedStackFileName)}.`;
    contextBlocks.push(
      [
        `## LAYER 2: RUNTIME CONSTRAINT (${selectedStackFileName})`,
        hasStackProfileFile
          ? `Source: stack-profile:${selectedStackFileName}`
          : 'Source: explicit user constraint',
        `Summary: ${stackSummary}`,
        'Use this only as a constraint when the task touches that runtime. Do not treat it as design direction.',
      ].join('\n')
    );
  } else {
    contextBlocks.push(
      [
        '## LAYER 2: RUNTIME DECISION REQUIRED',
        'No runtime stack was selected by the user.',
        'For a fresh project, the first implementation step is to ask the AI agent to recommend a runtime/framework from the brief, constraints, and live official documentation.',
        'For an existing project, inspect repo markers and current files directly before editing. Detection evidence is not a migration instruction.',
        'Do not silently choose a stack from offline defaults.',
      ].join('\n')
    );
  }

  if (hasExplicitRuntimeDecision && normalizedAdditionalStackFileNames.length > 0) {
    contextBlocks.push(
      [
        '## LAYER 2B: ADDITIONAL RUNTIME EVIDENCE',
        'This project has multiple runtime constraints. Load additional runtime evidence below only when the task touches that runtime:',
        ...normalizedAdditionalStackFileNames.map((stackFileName, stackIndex) => {
          if (availableStackProfileFileNames.has(stackFileName)) {
            return `${stackIndex + 1}. stack-profile:${stackFileName}`;
          }

          return `${stackIndex + 1}. ${stackFileName} (runtime evidence signal)`;
        }),
      ].join('\n')
    );
  }

  contextBlocks.push(
    [
      '## LAYER 2 POLICY: LAZY RULE LOADING',
      hasExplicitRuntimeDecision
        ? `Primary runtime constraint: ${selectedStackFileName}`
        : 'Primary runtime constraint: unresolved until agent recommendation is approved',
      normalizedAdditionalStackFileNames.length > 0
        ? `Additional runtime evidence loads on demand: ${normalizedAdditionalStackFileNames.map((stackFileName) => {
          if (availableStackProfileFileNames.has(stackFileName)) {
            return `stack-profile:${stackFileName}`;
          }

          return `${stackFileName} (runtime evidence signal)`;
        }).join(', ')}`
        : 'No stack-specific governance adapter is loaded by default.',
      'Load global domain rules only when task scope touches that domain.',
      'Avoid eager loading unrelated runtime or domain guidance to prevent instruction conflicts.',
    ].join('\n')
  );

  contextBlocks.push(
    [
      '## LAYER 5: EXECUTION PROMPTS AND UI TRIGGERS',
      'Load these prompt contracts only when their trigger matches the user request:',
      '0. Documentation-first mode -> docs, documentation, dokumen, docs/*, architecture docs, flow docs, API docs, lengkapkan docs',
      '1. .agent-context/prompts/init-project.md -> create, build, new project, scaffold',
      '2. .agent-context/prompts/refactor.md -> refactor, improve, clean up, fix',
      '3. .agent-context/prompts/review-code.md -> review, audit, check, analyze',
      '4. .agent-context/prompts/bootstrap-design.md -> ui, ux, layout, screen, tailwind, frontend, redesign',
      'Documentation-first policy:',
      '- Create or refine required project docs before implementation: docs/project-brief.md, docs/architecture-decision-record.md, docs/flow-overview.md, docs/api-contract.md when APIs, firmware endpoints, CLI commands, or web application flows exist, docs/database-schema.md when persistent data exists, and docs/DESIGN.md plus docs/design-intent.json for UI scope.',
      '- Write formal project docs in English by default unless the user explicitly asks for another documentation language.',
      '- For docs-only/docs-first requests, do not write application, firmware, or UI code until the user asks or approves an implementation plan.',
      'UI trigger policy:',
      '- Load .agent-context/prompts/bootstrap-design.md and .agent-context/rules/frontend-architecture.md first.',
      '- Keep UI-only requests context-isolated and do not eagerly load backend-only rules such as database-design.md, docker-runtime.md, microservices.md, git-workflow.md, or general implementation-theory rules unless the task explicitly crosses those boundaries.',
      '- For UI scope, materialize docs/DESIGN.md and docs/design-intent.json before implementing UI surfaces.',
    ].join('\n')
  );

  if (hasExplicitArchitectureDecision) {
    const blueprintFilePath = path.join(selectedBlueprintsDirectoryPath, selectedBlueprintFileName);
    const hasBlueprintProfileFile = availableBlueprintProfileFileNames.has(selectedBlueprintFileName);
    const blueprintSummary = hasBlueprintProfileFile
      ? firstMarkdownHeading(await fs.readFile(blueprintFilePath, 'utf8'), selectedBlueprintFileName)
      : `Explicit architecture constraint for ${humanizeProfileName(selectedBlueprintFileName)}.`;
    contextBlocks.push(
      [
        `## LAYER 3: ARCHITECTURE CONSTRAINT (${selectedBlueprintFileName})`,
        hasBlueprintProfileFile
          ? `Source: architecture-profile:${selectedBlueprintFileName}`
          : 'Source: explicit user constraint',
        `Summary: ${blueprintSummary}`,
        'Use this only as an explicit constraint when scaffolding or changing architecture boundaries.',
      ].join('\n')
    );
  } else {
    contextBlocks.push(
      [
        '## LAYER 3: ARCHITECTURE DECISION REQUIRED',
        'No architecture blueprint was selected by the user.',
        'The AI agent must propose the architecture from the product brief, repo evidence, required docs, and live research before implementation.',
        'Do not map detected runtime markers into a blueprint automatically.',
      ].join('\n')
    );
  }

  if (hasExplicitArchitectureDecision && normalizedAdditionalBlueprintFileNames.length > 0) {
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
        '- Stop implementation if docs/project-brief.md is missing.',
        '- Stop implementation if docs/architecture-decision-record.md (alias: docs/Architecture-Decision-Record.md) is missing.',
        '- Stop implementation if docs/flow-overview.md is missing.',
        '- If the product uses persistent data, docs/database-schema.md must exist before coding continues.',
        '- If the product exposes API or web application flows, docs/api-contract.md must exist before coding continues.',
        '- For UI scope, stop implementation if docs/DESIGN.md or docs/design-intent.json is missing.',
        '- Materialize missing docs first, then continue coding.',
        '- Bootstrap missing docs from real repo evidence and the latest user request. Do not write generic placeholder templates.',
        '- Separate confirmed facts from assumptions and end each major explanation with the next validation action.',
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
        '- docs/flow-overview.md must also exist before coding continues.',
        '- Add docs/database-schema.md when persistent data is involved.',
        '- Add docs/api-contract.md when API or web application flows are involved.',
        '- For docs-only/docs-first requests, stop after docs unless the user asks for implementation or approves an implementation plan.',
        '- If docs/project-brief.md is missing, execute bootstrap-project-context prompt immediately.',
        hasBootstrapDesignPrompt
          ? '- For UI scope: if docs/DESIGN.md or docs/design-intent.json is missing, execute bootstrap-design prompt before implementing UI surfaces.'
          : '- For UI scope: add a design bootstrap prompt before implementing UI surfaces.',
        '- Bootstrap docs from repo evidence and the latest user request. Do not use generic placeholder templates.',
        '- Separate confirmed facts from assumptions, include an Assumptions to Validate section when context is incomplete, and end with the next validation action.',
        '- Save generated docs under docs/ and keep them updated when feature scope changes.',
        'Latest user prompt defines current feature scope and product direction.',
        'Treat synthesized docs as living references, then continue implementation with those docs as source of truth.',
      ].join('\n')
    );
  }

  const designIntent = await readDesignIntentIfExists(resolvedTargetDirectoryPath);
  const anchorCommitmentHeader = buildAnchorCommitmentHeader(designIntent);
  if (anchorCommitmentHeader) {
    contextBlocks.unshift(anchorCommitmentHeader);
  }

  return [
    '# AGENTIC-SENIOR-CORE DYNAMIC GOVERNANCE RULESET',
    '',
    `Generated by Agentic-Senior-Core CLI v${CLI_VERSION}`,
    `Timestamp: ${new Date().toISOString()}`,
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
  selectedStackFileName,
  selectedAdditionalStackFileNames = [],
  selectedBlueprintFileName,
  selectedAdditionalBlueprintFileNames = [],
  includeCiGuardrails,
}) {
  const resolvedTargetDirectoryPath = path.resolve(targetDirectoryPath);
  const compiledRules = await buildCompiledRulesContent({
    targetDirectoryPath: resolvedTargetDirectoryPath,
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
