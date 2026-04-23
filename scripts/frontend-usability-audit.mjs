#!/usr/bin/env node

/**
 * frontend-usability-audit.mjs
 *
 * Governance-level audit for V1.7 frontend execution assets.
 * This repository does not host a frontend runtime app, so the audit validates
 * required execution artifacts and quality gates documentation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPOSITORY_ROOT = resolve(__dirname, '..');

const REQUIRED_FILES = [
  'docs/roadmap.md',
  'docs/v1.7-issue-breakdown.md',
  'docs/v1.7-execution-playbook.md',
  '.instructions.md',
  '.agent-context/prompts/bootstrap-design.md',
  'scripts/ui-design-judge.mjs',
  '.agent-context/rules/frontend-architecture.md',
  '.agent-context/review-checklists/pr-checklist.md',
  '.agent-context/review-checklists/architecture-review.md',
  'lib/cli/detector/design-evidence.mjs',
];

const REQUIRED_ROADMAP_SNIPPETS = [
  'V1.7',
  'Frontend Product Experience',
  'Release status: Completed',
  'Delivered Scope',
];

const REQUIRED_PR_CHECKLIST_SNIPPETS = [
  '### 2. Architecture (→ rules/architecture.md)',
  '### 10. Documentation',
  '### 15. Universal SOP Consolidation',
];

const REQUIRED_ARCHITECTURE_CHECKLIST_SNIPPETS = [
  '## Backend Universal Principles',
  'No clever hacks in backend and shared core modules',
  'No premature abstraction',
  'Readability over brevity',
];

const REQUIRED_FRONTEND_RULE_SNIPPETS = [
  'Frontend Designer Mode (Auto Activation)',
  'UI scope trigger signals',
  'visual intent, interaction quality, and conversion clarity',
  'template-only repetitive outputs',
  'Context Hygiene and Reference Boundaries (Mandatory)',
  'Accessibility Split (Mandatory)',
  'Design continuity is opt-in.',
  'repo evidence wins',
  'WCAG 2.2 AA as the hard compliance floor',
  'APCA as an advisory readability model',
  'Structured Design Execution Boundaries (Mandatory)',
  'UI review must stay representation-first.',
  'UI Consistency Guardrails (Mandatory)',
  'Content language must stay consistent per screen and flow unless user requests multilingual output.',
  'Text color must remain contrast-safe against its background; no color collisions.',
  'Responsive quality requires layout mutation and task reprioritization across breakpoints. Shrinking the desktop layout is not enough.',
];

const REQUIRED_BOOTSTRAP_DESIGN_SNIPPETS = [
  'UI Design Mode is context-isolated by default:',
  'Responsive Strategy and Cross-Viewport Adaptation Matrix',
  'Token Architecture and Alias Strategy',
  'tokenSystem',
  'colorTruth.format',
  'crossViewportAdaptation.mutationRules.mobile/tablet/desktop',
  'motionSystem',
  'componentMorphology',
  'accessibilityPolicy',
  'designExecutionPolicy',
  'designExecutionHandoff',
  'reviewRubric',
  'contextHygiene',
  'Design continuity is opt-in.',
  'WCAG 2.2 AA as the blocking baseline',
  'APCA only as advisory perceptual tuning',
  'Structured design execution must stay representation-first',
  'structured handoff',
];

const REQUIRED_UI_DESIGN_JUDGE_SNIPPETS = [
  'Advisory-first UI design contract judge.',
  'Repo-internal workflow audit; no user-facing runtime modes.',
  'Runs only in advisory mode for this repository workflow.',
  'Do not reward generic SaaS defaults or popular template patterns.',
  'UI design judge only evaluates changed UI surfaces.',
  'Structured design execution summary was supplied to semantic review.',
  'designExecutionSignalCount',
  'designExecutionPolicy',
  'designExecutionHandoff',
  'reviewRubric',
  'genericityStatus',
  'handoffReady',
];

const REQUIRED_INSTRUCTIONS_SNIPPETS = [
  'UI Design Mode',
  'bootstrap-design.md',
  'frontend-architecture.md',
  'do not eagerly load unrelated backend-only rules',
  'valid style context',
  'explicitly approved reference systems',
  'WCAG 2.2 AA as the hard compliance floor',
  'APCA as advisory perceptual tuning only',
  'Do not require screenshot capture as a baseline dependency',
];

const REQUIRED_DESIGN_EVIDENCE_SNIPPETS = [
  'summaryVersion',
  "source: 'lightweight-static-scan'",
  'cssVariables',
  'componentInventory',
  'tokenBypassSignals',
];

const REQUIRED_COMPILER_UI_EVIDENCE_SNIPPETS = [
  'frontendEvidenceMetrics',
  'designEvidenceSummary',
];

function assertFileExists(relativeFilePath, failures) {
  const absoluteFilePath = resolve(REPOSITORY_ROOT, relativeFilePath);
  if (!existsSync(absoluteFilePath)) {
    failures.push(`Missing required file: ${relativeFilePath}`);
  }
}

function assertContains(contentLabel, filePath, fileContent, snippets, failures) {
  for (const snippetText of snippets) {
    if (!fileContent.includes(snippetText)) {
      failures.push(`${contentLabel} missing snippet "${snippetText}" in ${filePath}`);
    }
  }
}

function runAudit() {
  const failures = [];

  for (const requiredFilePath of REQUIRED_FILES) {
    assertFileExists(requiredFilePath, failures);
  }

  const roadmapPath = 'docs/roadmap.md';
  const frontendRulePath = '.agent-context/rules/frontend-architecture.md';
  const bootstrapDesignPromptPath = '.agent-context/prompts/bootstrap-design.md';
  const instructionsPath = '.instructions.md';
  const prChecklistPath = '.agent-context/review-checklists/pr-checklist.md';
  const architectureChecklistPath = '.agent-context/review-checklists/architecture-review.md';
  const designEvidenceExtractorPath = 'lib/cli/detector/design-evidence.mjs';
  const compilerPath = 'lib/cli/compiler.mjs';

  if (existsSync(resolve(REPOSITORY_ROOT, roadmapPath))) {
    const roadmapContent = readFileSync(resolve(REPOSITORY_ROOT, roadmapPath), 'utf8');
    assertContains('Roadmap', roadmapPath, roadmapContent, REQUIRED_ROADMAP_SNIPPETS, failures);
  }

  if (existsSync(resolve(REPOSITORY_ROOT, prChecklistPath))) {
    const checklistContent = readFileSync(resolve(REPOSITORY_ROOT, prChecklistPath), 'utf8');
    assertContains('PR checklist', prChecklistPath, checklistContent, REQUIRED_PR_CHECKLIST_SNIPPETS, failures);
  }

  if (existsSync(resolve(REPOSITORY_ROOT, frontendRulePath))) {
    const frontendRuleContent = readFileSync(resolve(REPOSITORY_ROOT, frontendRulePath), 'utf8');
    assertContains('Frontend rule', frontendRulePath, frontendRuleContent, REQUIRED_FRONTEND_RULE_SNIPPETS, failures);
  }

  if (existsSync(resolve(REPOSITORY_ROOT, bootstrapDesignPromptPath))) {
    const bootstrapDesignPromptContent = readFileSync(resolve(REPOSITORY_ROOT, bootstrapDesignPromptPath), 'utf8');
    assertContains(
      'Bootstrap design prompt',
      bootstrapDesignPromptPath,
      bootstrapDesignPromptContent,
      REQUIRED_BOOTSTRAP_DESIGN_SNIPPETS,
      failures
    );
  }

  if (existsSync(resolve(REPOSITORY_ROOT, 'scripts/ui-design-judge.mjs'))) {
    const uiDesignJudgeContent = readFileSync(resolve(REPOSITORY_ROOT, 'scripts/ui-design-judge.mjs'), 'utf8');
    assertContains(
      'UI design judge',
      'scripts/ui-design-judge.mjs',
      uiDesignJudgeContent,
      REQUIRED_UI_DESIGN_JUDGE_SNIPPETS,
      failures
    );
  }

  if (existsSync(resolve(REPOSITORY_ROOT, instructionsPath))) {
    const instructionsContent = readFileSync(resolve(REPOSITORY_ROOT, instructionsPath), 'utf8');
    assertContains('Instructions', instructionsPath, instructionsContent, REQUIRED_INSTRUCTIONS_SNIPPETS, failures);
  }

  if (existsSync(resolve(REPOSITORY_ROOT, architectureChecklistPath))) {
    const excellenceRubricContent = readFileSync(resolve(REPOSITORY_ROOT, architectureChecklistPath), 'utf8');
    assertContains(
      'Architecture checklist',
      architectureChecklistPath,
      excellenceRubricContent,
      REQUIRED_ARCHITECTURE_CHECKLIST_SNIPPETS,
      failures
    );
  }

  let designEvidenceExtractorContent = '';
  let compilerContent = '';

  if (existsSync(resolve(REPOSITORY_ROOT, designEvidenceExtractorPath))) {
    designEvidenceExtractorContent = readFileSync(resolve(REPOSITORY_ROOT, designEvidenceExtractorPath), 'utf8');
    assertContains(
      'Design evidence extractor',
      designEvidenceExtractorPath,
      designEvidenceExtractorContent,
      REQUIRED_DESIGN_EVIDENCE_SNIPPETS,
      failures
    );
  }

  if (existsSync(resolve(REPOSITORY_ROOT, compilerPath))) {
    compilerContent = readFileSync(resolve(REPOSITORY_ROOT, compilerPath), 'utf8');
    assertContains(
      'Compiler UI evidence projection',
      compilerPath,
      compilerContent,
      REQUIRED_COMPILER_UI_EVIDENCE_SNIPPETS,
      failures
    );
  }

  const reportPayload = {
    generatedAt: new Date().toISOString(),
    auditName: 'frontend-usability-audit',
    passed: failures.length === 0,
    failureCount: failures.length,
    failures,
    phase2DesignEvidenceCoverage: {
      extractorFilePath: designEvidenceExtractorPath,
      compilerFilePath: compilerPath,
      extractorIncludesSummaryVersion: designEvidenceExtractorContent.includes('summaryVersion'),
      extractorIncludesCssVariables: designEvidenceExtractorContent.includes('cssVariables'),
      extractorIncludesComponentInventory: designEvidenceExtractorContent.includes('componentInventory'),
      extractorIncludesTokenBypassSignals: designEvidenceExtractorContent.includes('tokenBypassSignals'),
      compilerProjectsFrontendEvidenceMetrics: compilerContent.includes('frontendEvidenceMetrics'),
      compilerProjectsDesignEvidenceSummary: compilerContent.includes('designEvidenceSummary'),
    },
  };

  console.log(JSON.stringify(reportPayload, null, 2));
  process.exit(reportPayload.passed ? 0 : 1);
}

runAudit();
