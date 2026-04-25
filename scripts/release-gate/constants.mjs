// @ts-check

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const REPOSITORY_ROOT = resolve(__dirname, '..', '..');
export const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
export const FRONTEND_AUDIT_SCRIPT_PATH = 'scripts/frontend-usability-audit.mjs';
export const UI_DESIGN_JUDGE_SCRIPT_PATH = 'scripts/ui-design-judge.mjs';
export const DOCUMENTATION_BOUNDARY_AUDIT_SCRIPT_PATH = 'scripts/documentation-boundary-audit.mjs';
export const CONTEXT_TRIGGERED_AUDIT_SCRIPT_PATH = 'scripts/context-triggered-audit.mjs';
export const RULES_GUARDIAN_AUDIT_SCRIPT_PATH = 'scripts/rules-guardian-audit.mjs';
export const EXPLAIN_ON_DEMAND_AUDIT_SCRIPT_PATH = 'scripts/explain-on-demand-audit.mjs';
export const SINGLE_SOURCE_LAZY_LOADING_AUDIT_SCRIPT_PATH = 'scripts/single-source-lazy-loading-audit.mjs';
export const BENCHMARK_GATE_SCRIPT_PATH = 'scripts/benchmark-gate.mjs';
export const BACKEND_ARCHITECTURE_RULE_PATH = '.agent-context/rules/architecture.md';
export const BACKEND_REVIEW_CHECKLIST_PATH = '.agent-context/review-checklists/pr-checklist.md';
export const ARCHITECTURE_REVIEW_CHECKLIST_PATH = '.agent-context/review-checklists/architecture-review.md';
export const REFACTOR_PROMPT_PATH = '.agent-context/prompts/refactor.md';
export const AUTO_DOCS_SYNC_SCOPE_PHASE = 'phase-1';
export const AUTO_DOCS_SYNC_SCOPE_BOUNDARIES = [
  'public-surface',
  'api-contract',
  'database-structure',
];

export const REQUIRED_BACKEND_ARCHITECTURE_RULE_SNIPPETS = [
  'No clever hacks.',
  'No premature abstraction.',
  'Readability over brevity.',
  'backend and shared core modules',
  'Do not create or load stack-specific governance adapters as the baseline.',
];

export const REQUIRED_BACKEND_REVIEW_CHECKLIST_SNIPPETS = [
  'No clever hacks in backend and shared core modules',
  'No premature abstraction (base classes/util layers created only after repeated stable patterns)',
  'Readability over brevity for maintainability',
  'Controllers, route handlers, and transport adapters do not contain business policy',
  'Sensitive mutations include idempotency or duplicate-submit coverage',
  'Backend/API governance was applied through global domain rules',
];

export const REQUIRED_REFACTOR_PROMPT_SNIPPETS = [
  'Enforce backend universal principles: no clever hacks, no premature abstraction, readability over brevity.',
  'Prioritize maintainability over compressed one-liners.',
  'zero-trust input validation',
  'idempotency for sensitive mutations',
  'Backend/API governance is global and stack-agnostic.',
];

export const REQUIRED_ARCHITECTURE_REVIEW_CHECKLIST_SNIPPETS = [
  '## Backend Universal Principles',
  'No clever hacks in backend and shared core modules',
  'No premature abstraction',
  'Readability over brevity',
  'Service or use-case code owns orchestration',
  'Relational reads avoid N+1 patterns',
  'Global backend/API governance is used directly',
  'Dual-write database plus message flows use an outbox',
];
