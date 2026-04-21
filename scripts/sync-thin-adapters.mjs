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

import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const ROOT_DIR = resolve(dirname(SCRIPT_FILE_PATH), '..');
const CANONICAL_SOURCE_PATH = '.instructions.md';
const CANONICAL_SOURCE_ABSOLUTE_PATH = join(ROOT_DIR, CANONICAL_SOURCE_PATH);
const IS_CHECK_MODE = process.argv.includes('--check');

function normalizeLineEndings(content) {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function buildAgentsAdapter(canonicalHash) {
  return `# AGENTS.md - Thin Adapter

Adapter Mode: thin
Adapter Source: .instructions.md
Canonical Snapshot SHA256: ${canonicalHash}

This file is an adapter entrypoint for agent discovery.
The canonical policy source is [.instructions.md](.instructions.md).

## Mandatory Bootstrap Chain

1. Load [.instructions.md](.instructions.md) first as the canonical baseline.
2. If \`.agent-instructions.md\` exists, read it next as the compiled project-specific snapshot.
3. Read baseline governance from [.agent-context/rules/](.agent-context/rules).
4. Apply request templates from [.agent-context/prompts/](.agent-context/prompts).
5. Enforce review contracts from [.agent-context/review-checklists/](.agent-context/review-checklists).
6. Read change-risk maps and continuity state from [.agent-context/state/](.agent-context/state).
7. Enforce policy thresholds from [.agent-context/policies/](.agent-context/policies).
8. Use dynamic stack and architecture reasoning from project context docs and live research signals.

## Trigger Rules

- New project or module requests: propose architecture first and wait for approval.
- Refactor or fix requests: propose plan first, then execute safely.
- Completion: run [.agent-context/review-checklists/pr-checklist.md](.agent-context/review-checklists/pr-checklist.md) before declaring done.

If this adapter drifts from canonical behavior, refresh from [.instructions.md](.instructions.md) and update the hash metadata.
`;
}

function buildCopilotAdapter(canonicalHash) {
  return `# GitHub Copilot Instructions - Thin Adapter

Adapter Mode: thin
Adapter Source: .instructions.md
Canonical Snapshot SHA256: ${canonicalHash}

The canonical policy source for this repository is [.instructions.md](../.instructions.md).

## Required Load Order

1. Read [.instructions.md](../.instructions.md) first as the canonical baseline.
2. If \`.agent-instructions.md\` exists, read it next as the compiled project-specific snapshot.
3. Read baseline rules in [.agent-context/rules/](../.agent-context/rules).
4. Load request templates from [.agent-context/prompts/](../.agent-context/prompts).
5. Apply review contracts from [.agent-context/review-checklists/](../.agent-context/review-checklists).
6. Apply state awareness from [.agent-context/state/](../.agent-context/state) and thresholds from [.agent-context/policies/](../.agent-context/policies).
7. Resolve stack and architecture choices dynamically from project context docs plus live evidence.

## Completion Gate

Run [.agent-context/review-checklists/pr-checklist.md](../.agent-context/review-checklists/pr-checklist.md) before declaring work complete.
`;
}

function buildGeminiAdapter(canonicalHash) {
  return `# Gemini Instructions - Thin Adapter

Adapter Mode: thin
Adapter Source: .instructions.md
Canonical Snapshot SHA256: ${canonicalHash}

Canonical policy source: [.instructions.md](../.instructions.md).

## Bootstrap Sequence

1. Load [.instructions.md](../.instructions.md) first as the canonical baseline.
2. If \`.agent-instructions.md\` exists, read it next as the compiled project-specific snapshot.
3. Apply baseline rules from [.agent-context/rules/](../.agent-context/rules).
4. Load request templates from [.agent-context/prompts/](../.agent-context/prompts).
5. Apply review contracts from [.agent-context/review-checklists/](../.agent-context/review-checklists).
6. Apply state awareness from [.agent-context/state/](../.agent-context/state) and policy thresholds from [.agent-context/policies/](../.agent-context/policies).
7. Resolve stack and architecture choices dynamically from project context docs plus live evidence.

## Completion Gate

Run [.agent-context/review-checklists/pr-checklist.md](../.agent-context/review-checklists/pr-checklist.md) before declaring completion.
`;
}

const ADAPTERS = [
  {
    relativePath: 'AGENTS.md',
    buildContent: buildAgentsAdapter,
  },
  {
    relativePath: '.github/copilot-instructions.md',
    buildContent: buildCopilotAdapter,
  },
  {
    relativePath: '.gemini/instructions.md',
    buildContent: buildGeminiAdapter,
  },
];

async function main() {
  const canonicalContent = normalizeLineEndings(await readFile(CANONICAL_SOURCE_ABSOLUTE_PATH, 'utf8'));
  const canonicalHash = createHash('sha256').update(canonicalContent).digest('hex');

  let hasDrift = false;

  for (const adapter of ADAPTERS) {
    const adapterAbsolutePath = join(ROOT_DIR, adapter.relativePath);
    const expectedContent = adapter.buildContent(canonicalHash);

    if (IS_CHECK_MODE) {
      const existingContent = normalizeLineEndings(await readFile(adapterAbsolutePath, 'utf8'));
      const expectedNormalized = normalizeLineEndings(expectedContent);
      if (existingContent !== expectedNormalized) {
        hasDrift = true;
        console.error(`[DRIFT] ${adapter.relativePath} does not match canonical adapter output.`);
      } else {
        console.log(`[OK] ${adapter.relativePath} is synchronized.`);
      }
      continue;
    }

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
