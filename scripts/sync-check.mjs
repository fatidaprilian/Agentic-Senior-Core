#!/usr/bin/env node
// ASC Sync Checker — validates consistency across rule copies.
// Checks that the behavioral anchor, decision ladder, and section structure
// are consistent between AGENTS.md (source of truth) and all adapter copies.
//
// Usage: node scripts/sync-check.mjs [--fix]

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Full-version rule files that must be identical (ignoring frontmatter)
const FULL_VERSION_FILES = [
  'AGENTS.md',
  '.agents/rules/agentic-senior-core.md',
  '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
];

// Condensed adapter files are generated on-demand by `asc adapter` into user
// projects — they do NOT ship in the ASC repo itself. Removed from checks.

// Skill copies within the plugin directory
const SKILL_COPIES = [
  { base: '.agents/plugins/agentic-senior-core/skills/asc/SKILL.md', copies: [] },
  { base: '.agents/plugins/agentic-senior-core/skills/asc-reference/SKILL.md', copies: [] },
  { base: '.agents/plugins/agentic-senior-core/skills/asc-review/SKILL.md', copies: [] },
  { base: '.agents/plugins/agentic-senior-core/skills/asc-audit/SKILL.md', copies: [] },
  { base: '.agents/plugins/agentic-senior-core/skills/asc-refactor/SKILL.md', copies: [] },
  { base: '.agents/plugins/agentic-senior-core/skills/asc-debt/SKILL.md', copies: [] },
  { base: '.agents/plugins/agentic-senior-core/skills/asc-add-feature/SKILL.md', copies: [] },
  { base: '.agents/plugins/agentic-senior-core/skills/asc-new-project/SKILL.md', copies: [] },
  { base: '.agents/plugins/agentic-senior-core/skills/asc-adapter/SKILL.md', copies: [] },
];

const REQUIRED_MARKERS = [
  { label: 'behavioral anchor', pattern: 'stdlib one-liner' },
  { label: 'decision ladder step 1', pattern: 'Does this need to be built' },
  { label: 'security carveout', pattern: 'never skip' },
  { label: 'response style', pattern: 'Response Style' },
];

function stripFrontmatter(content) {
  if (content.startsWith('---')) {
    const endIndex = content.indexOf('---', 3);
    if (endIndex !== -1) {
      return content.slice(endIndex + 3).trim();
    }
  }
  return content.trim();
}

async function readFile(relativePath) {
  try {
    return await fs.readFile(path.join(ROOT, relativePath), 'utf8');
  } catch {
    return null;
  }
}

async function run() {
  let exitCode = 0;
  const issues = [];

  console.log('ASC Sync Checker\n');

  // 1. Check full-version files are identical (ignoring frontmatter)
  console.log('--- Full-version rule files ---');
  const sourceContent = stripFrontmatter(await readFile(FULL_VERSION_FILES[0]) || '');

  for (const filePath of FULL_VERSION_FILES.slice(1)) {
    const raw = await readFile(filePath);
    if (!raw) {
      issues.push(`MISSING: ${filePath}`);
      continue;
    }
    const stripped = stripFrontmatter(raw);
    if (stripped !== sourceContent) {
      issues.push(`DRIFT: ${filePath} differs from AGENTS.md (ignoring frontmatter)`);
    } else {
      console.log(`  OK  ${filePath}`);
    }
  }

  // 2. Check skill base files exist
  console.log('\n--- Skill files ---');
  for (const group of SKILL_COPIES) {
    const baseRaw = await readFile(group.base);
    if (!baseRaw) {
      issues.push(`MISSING: ${group.base}`);
      continue;
    }
    console.log(`  OK  ${group.base}`);
    const baseBody = stripFrontmatter(baseRaw);
    for (const copyPath of group.copies) {
      const copyRaw = await readFile(copyPath);
      if (!copyRaw) {
        issues.push(`MISSING: ${copyPath}`);
        continue;
      }
      const copyBody = stripFrontmatter(copyRaw);
      if (copyBody !== baseBody) {
        issues.push(`DRIFT: ${copyPath} differs from ${group.base} (ignoring frontmatter)`);
      } else {
        console.log(`  OK  ${copyPath}`);
      }
    }
  }

  // 3. Check version consistency
  console.log('\n--- Version consistency ---');
  const versionFiles = [
    'package.json',
    '.agents/plugins/agentic-senior-core/plugin.json',
    'gemini-extension.json',
    'plugin.yaml',
  ];
  const pkgRaw = await readFile('package.json');
  if (pkgRaw) {
    const pkgVersion = JSON.parse(pkgRaw).version;
    for (const vf of versionFiles.slice(1)) {
      const raw = await readFile(vf);
      if (!raw) { issues.push(`MISSING: ${vf}`); continue; }
      let version;
      if (vf.endsWith('.yaml')) {
        const match = raw.match(/^version:\s*(.+)$/m);
        version = match ? match[1].trim() : null;
      } else {
        version = JSON.parse(raw).version;
      }
      if (version !== pkgVersion) {
        issues.push(`VERSION: ${vf} has ${version}, expected ${pkgVersion}`);
      } else {
        console.log(`  OK  ${vf} (${version})`);
      }
    }
  }

  // Report
  console.log('\n' + '='.repeat(50));
  if (issues.length === 0) {
    console.log('All checks passed.');
  } else {
    exitCode = 1;
    console.log(`${issues.length} issue(s) found:\n`);
    for (const issue of issues) {
      console.log(`  x ${issue}`);
    }
  }

  process.exit(exitCode);
}

run();
