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
  '.agent-context/rules/frontend-architecture.md',
  '.agent-context/review-checklists/pr-checklist.md',
  '.agent-context/review-checklists/architecture-review.md',
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
  'UI Consistency Guardrails (Mandatory)',
  'Content language must stay consistent per screen and flow unless user requests multilingual output.',
  'Text color must remain contrast-safe against its background; no color collisions.',
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
  const prChecklistPath = '.agent-context/review-checklists/pr-checklist.md';
  const architectureChecklistPath = '.agent-context/review-checklists/architecture-review.md';

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

  const reportPayload = {
    generatedAt: new Date().toISOString(),
    auditName: 'frontend-usability-audit',
    passed: failures.length === 0,
    failureCount: failures.length,
    failures,
  };

  console.log(JSON.stringify(reportPayload, null, 2));
  process.exit(reportPayload.passed ? 0 : 1);
}

runAudit();
