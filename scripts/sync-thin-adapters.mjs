#!/usr/bin/env node

/**
 * sync-thin-adapters.mjs
 *
 * Regenerates thin instruction adapters from the canonical policy source
 * and keeps canonical hash metadata synchronized.
 *
 * Usage:
 * - node scripts/sync-thin-adapters.mjs
 * - node scripts/sync-thin-adapters.mjs --check
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const ROOT_DIR = resolve(dirname(SCRIPT_FILE_PATH), '..');
const CANONICAL_SOURCE_PATH = '.instructions.md';
const CANONICAL_SOURCE_ABSOLUTE_PATH = join(ROOT_DIR, CANONICAL_SOURCE_PATH);
const IS_CHECK_MODE = process.argv.includes('--check');

function normalizeLineEndings(content) {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function buildAdapterLink(adapterRelativePath, targetRelativePath) {
  const adapterDirectoryPath = posix.dirname(adapterRelativePath);
  const relativePath = posix.relative(adapterDirectoryPath === '.' ? '' : adapterDirectoryPath, targetRelativePath);
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

function buildThinAdapter({
  relativePath,
  title,
  canonicalHash,
  frontmatter = '',
}) {
  const canonicalLink = buildAdapterLink(relativePath, '.instructions.md');
  const rulesLink = buildAdapterLink(relativePath, '.agent-context/rules');
  const promptsLink = buildAdapterLink(relativePath, '.agent-context/prompts');
  const designPromptLink = buildAdapterLink(relativePath, '.agent-context/prompts/bootstrap-design.md');
  const frontendRuleLink = buildAdapterLink(relativePath, '.agent-context/rules/frontend-architecture.md');
  const checklistLink = buildAdapterLink(relativePath, '.agent-context/review-checklists/pr-checklist.md');
  const stateLink = buildAdapterLink(relativePath, '.agent-context/state');
  const policiesLink = buildAdapterLink(relativePath, '.agent-context/policies');
  const adapterHeader = frontmatter.trim() ? [frontmatter.trim(), ''] : [];

  return [
    ...adapterHeader,
    `# ${title}`,
    '',
    'Adapter Mode: thin',
    'Adapter Source: .instructions.md',
    `Canonical Snapshot SHA256: ${canonicalHash}`,
    '',
    'This repository is governed by a strict instruction contract.',
    `Use [${CANONICAL_SOURCE_PATH}](${canonicalLink}) as the canonical policy source.`,
    'Use .agent-context/ for technical rules, prompts, checklists, policies, and state.',
    'Treat README.md as overview/install/user context only when governance files conflict.',
    '',
    '## Critical Bootstrap Floor',
    '',
    '- If your host stops at this file, continue the chain manually before coding.',
    '- Read `.agent-instructions.md` next when it exists.',
    '- Memory continuity does not replace bootstrap loading.',
    `- For UI, UX, layout, screen, tailwind, frontend, or redesign requests, load [bootstrap-design.md](${designPromptLink}) and [frontend-architecture.md](${frontendRuleLink}) before code edits.`,
    '- For UI scope, include a one-line Motion/Palette Decision in the Bootstrap Receipt; product categories are heuristics, not style presets.',
    '- For UI scope, create or refine `docs/DESIGN.md` and `docs/design-intent.json` before UI implementation.',
    '- For documentation-first requests, create or refine required project docs in English by default and do not write application, firmware, or UI code until the user asks or approves.',
    `- For backend, API, data, auth, error, event, queue, worker, or distributed-system requests, load only relevant global rules from .agent-context/rules/ ([link](${rulesLink})).`,
    '- For ecosystem, framework, dependency, or Docker claims, perform live web research.',
    '- Resolve runtime choices from project evidence and live official documentation; resolve structural planning from constraints and architecture boundaries.',
    '',
    '## Mandatory Bootstrap Chain',
    '',
    `1. Load [${CANONICAL_SOURCE_PATH}](${canonicalLink}).`,
    '2. Load `.agent-instructions.md` when present.',
    `3. Load only relevant files from .agent-context/rules/ ([link](${rulesLink})).`,
    `4. Apply matching prompts from .agent-context/prompts/ ([link](${promptsLink})).`,
    `5. Enforce .agent-context/review-checklists/ ([link](${checklistLink})).`,
    `6. Use .agent-context/state/ ([link](${stateLink})) and .agent-context/policies/ ([link](${policiesLink})) only when relevant.`,
    '7. Use project docs and live evidence for runtime, dependency, and architecture claims.',
    '',
    '## Bootstrap Receipt',
    '',
    'For non-trivial coding, review, planning, or governance work, produce a short Bootstrap Receipt before implementation output: `loaded_files`, `selected_rules`, `skipped_rules`, `unreachable_files`, and `validation_plan`.',
    '',
    '## Completion Gate',
    '',
    `Run [pr-checklist.md](${checklistLink}) before declaring work complete.`,
    '',
    `If this adapter drifts from canonical behavior, refresh from [${CANONICAL_SOURCE_PATH}](${canonicalLink}) and update the hash metadata.`,
  ].join('\n');
}

const ADAPTERS = [
  {
    relativePath: 'AGENTS.md',
    title: 'AGENTS.md - Thin Adapter',
  },
  {
    relativePath: 'CLAUDE.md',
    title: 'CLAUDE.md - Thin Adapter',
  },
  {
    relativePath: 'GEMINI.md',
    title: 'GEMINI.md - Thin Adapter',
  },
  {
    relativePath: '.github/copilot-instructions.md',
    title: 'GitHub Copilot Instructions - Thin Adapter',
  },
  {
    relativePath: '.github/instructions/agentic-senior-core.instructions.md',
    title: 'GitHub Copilot Path Instructions - Thin Adapter',
    frontmatter: '---\napplyTo: "**"\n---',
  },
  {
    relativePath: '.gemini/instructions.md',
    title: 'Gemini Instructions - Thin Adapter',
  },
  {
    relativePath: '.cursor/rules/agentic-senior-core.mdc',
    title: 'Cursor Rule - Thin Adapter',
    frontmatter: '---\ndescription: Agentic Senior Core bootstrap adapter\nalwaysApply: true\n---',
  },
  {
    relativePath: '.windsurf/rules/agentic-senior-core.md',
    title: 'Windsurf Rule - Thin Adapter',
  },
];

async function main() {
  const canonicalContent = normalizeLineEndings(await readFile(CANONICAL_SOURCE_ABSOLUTE_PATH, 'utf8'));
  const canonicalHash = createHash('sha256').update(canonicalContent).digest('hex');

  let hasDrift = false;

  for (const adapter of ADAPTERS) {
    const adapterAbsolutePath = join(ROOT_DIR, adapter.relativePath);
    const expectedContent = buildThinAdapter({
      ...adapter,
      canonicalHash,
    });

    if (IS_CHECK_MODE) {
      const existingContent = normalizeLineEndings(await readFile(adapterAbsolutePath, 'utf8'));
      const expectedNormalized = normalizeLineEndings(`${expectedContent.trimEnd()}\n`);
      if (existingContent !== expectedNormalized) {
        hasDrift = true;
        console.error(`[DRIFT] ${adapter.relativePath} does not match canonical adapter output.`);
      } else {
        console.log(`[OK] ${adapter.relativePath} is synchronized.`);
      }
      continue;
    }

    await mkdir(dirname(adapterAbsolutePath), { recursive: true });
    await writeFile(adapterAbsolutePath, `${expectedContent.trimEnd()}\n`, 'utf8');
    console.log(`[SYNC] ${adapter.relativePath}`);
  }

  if (IS_CHECK_MODE) {
    if (hasDrift) {
      process.exitCode = 1;
      return;
    }

    console.log('[OK] All thin adapters match canonical source output.');
  }
}

main().catch((error) => {
  console.error(`[FATAL] Failed to synchronize thin adapters: ${error.message}`);
  process.exitCode = 1;
});
