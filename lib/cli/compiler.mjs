// @file-size-exception: Multiple compilation passes (rule + state + adapter); planned for split in Phase 1 compiler refactor.
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

/**
 * ## LAYER 2 POLICY: LAZY RULE LOADING
 * Load global domain rules only when task scope touches that domain.
 * Avoid eager loading unrelated runtime or domain guidance to prevent instruction conflicts.
 */

function toSingleLine(value, fallbackValue) {
  const normalizedValue = String(value || '').replace(/\s+/g, ' ').trim();
  return normalizedValue || fallbackValue;
}

function buildAnchorCommitmentHeader(designIntent) {
  return null;
}

function buildContainerizationStrategySnapshot(dockerStrategy) {
  const selectedDockerStrategy = String(dockerStrategy || '').trim();
  const normalizedDockerStrategy = selectedDockerStrategy.toLowerCase();
  const dockerSelected = Boolean(selectedDockerStrategy) && !normalizedDockerStrategy.startsWith('no docker');
  const developmentRequired = dockerSelected
    && (normalizedDockerStrategy.includes('development') || normalizedDockerStrategy.includes('both'));
  const productionRequired = dockerSelected
    && (normalizedDockerStrategy.includes('production') || normalizedDockerStrategy.includes('both'));

  return {
    selected: selectedDockerStrategy || null,
    developmentRequired,
    productionRequired,
    materializationRequired: dockerSelected,
    requiredRuleFile: dockerSelected ? '.agent-context/rules/docker-runtime.md' : null,
    commandExecutionPolicy: dockerSelected
      ? 'author-files-first-run-docker-commands-only-when-requested-or-approved'
      : null,
  };
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
  localOnly = false,
  setupDurationMs,
  projectDetection,
  runtimeEnvironment = null,
  dockerStrategy = null,
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
      canonicalSource: 'AGENTS.md',
      stackLoadingMode: 'lazy',
      domainRuleLoadingMode: 'lazy',
      loadedOnDemand: true,
      primaryStack: hasExplicitRuntimeDecision ? selectedStackFileName : null,
      additionalStacks: hasExplicitRuntimeDecision ? selectedAdditionalStackFileNames : [],
      agentDecisionRequired: !hasExplicitRuntimeDecision,
    },
    ciGuardrailsEnabled: includeCiGuardrails,
    localOnly,
    setupDurationMs,
    runtimeEnvironment,
    containerizationStrategy: buildContainerizationStrategySnapshot(dockerStrategy),
    tokenOptimization: resolvedTokenOptimization,
    memoryContinuity: resolvedMemoryContinuity,
    responseCompression: {
      enabled: true,
      mode: 'compact-natural-mode',
      defaultOn: true,
      promptFile: '.agent-context/prompts/compact-natural-mode.md',
      appliesTo: 'agent-final-responses',
      commandOutputBoundary: 'ASCX handles command-output compression separately',
    },
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

