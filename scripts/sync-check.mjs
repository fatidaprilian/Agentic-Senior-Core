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

const FULL_VERSION_FILES = [
  'AGENTS.md',
  '.agents/rules/agentic-senior-core.md',
  '.agents/plugins/agentic-senior-core/rules/agentic-senior-core.md',
];

const CONDENSED_ADAPTER_FILES = [
  '.cursor/rules/agentic-senior-core.mdc',
  '.windsurf/rules/agentic-senior-core.md',
  '.devin/rules/agentic-senior-core.md',
  '.clinerules/agentic-senior-core.md',
  '.github/copilot-instructions.md',
  '.kiro/steering/agentic-senior-core.md',
  '.continue/rules/agentic-senior-core.md',
  '.zed/rules/agentic-senior-core.md',
  'CONVENTIONS.md',
  '.kilocode/rules/agentic-senior-core.md',
  '.roo/rules/agentic-senior-core.md',
  '.openhands/microagents/agentic-senior-core.md',
];

const SKILL_COPIES = [
  { base: 'skills/asc-reference/SKILL.md', copies: [
    '.agents/plugins/agentic-senior-core/skills/asc-reference/SKILL.md',
    '.openclaw/skills/asc-reference/SKILL.md',
  ]},
  { base: 'skills/asc/SKILL.md', copies: [
    '.agents/plugins/agentic-senior-core/skills/asc/SKILL.md',
    '.openclaw/skills/asc/SKILL.md',
  ]},
  { base: 'skills/asc-review/SKILL.md', copies: [
    '.agents/plugins/agentic-senior-core/skills/asc-review/SKILL.md',
    '.openclaw/skills/asc-review/SKILL.md',
  ]},
  { base: 'skills/asc-audit/SKILL.md', copies: [
    '.agents/plugins/agentic-senior-core/skills/asc-audit/SKILL.md',
    '.openclaw/skills/asc-audit/SKILL.md',
  ]},
  { base: 'skills/asc-refactor/SKILL.md', copies: [
    '.agents/plugins/agentic-senior-core/skills/asc-refactor/SKILL.md',
  ]},
  { base: 'skills/asc-debt/SKILL.md', copies: [
    '.agents/plugins/agentic-senior-core/skills/asc-debt/SKILL.md',
  ]},
];

const REQUIRED_MARKERS = [
  { label: 'behavioral anchor', pattern: 'stdlib one-liner' },
  { label: 'decision ladder step 1', pattern: 'Does this need to be built' },
  { label: 'security carveout', pattern: 'never skip' },
  { label: 'response style', pattern: 'Response Style' },
];

const CONDENSED_MARKERS = [
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

  // 2. Check condensed adapters have required markers
  console.log('\n--- Condensed adapter files ---');
  for (const filePath of CONDENSED_ADAPTER_FILES) {
    const raw = await readFile(filePath);
    if (!raw) {
      issues.push(`MISSING: ${filePath}`);
      continue;
    }
    const missing = CONDENSED_MARKERS.filter((m) => !raw.includes(m.pattern));
    if (missing.length > 0) {
      issues.push(`MARKER: ${filePath} missing: ${missing.map((m) => m.label).join(', ')}`);
    } else {
      console.log(`  OK  ${filePath}`);
    }
  }

  // 3. Check condensed adapters are consistent with each other
  console.log('\n--- Condensed adapter consistency ---');
  const condensedBodies = [];
  for (const filePath of CONDENSED_ADAPTER_FILES) {
    const raw = await readFile(filePath);
    if (raw) condensedBodies.push({ path: filePath, body: stripFrontmatter(raw) });
  }
  if (condensedBodies.length > 1) {
    const reference = condensedBodies[0].body;
    for (const entry of condensedBodies.slice(1)) {
      if (entry.body !== reference) {
        issues.push(`DRIFT: ${entry.path} differs from ${condensedBodies[0].path} (ignoring frontmatter)`);
      }
    }
    if (condensedBodies.slice(1).every((e) => e.body === reference)) {
      console.log(`  OK  All ${condensedBodies.length} condensed adapters are identical`);
    }
  }

  // 4. Check skill copies match their base
  console.log('\n--- Skill copies ---');
  for (const group of SKILL_COPIES) {
    const baseRaw = await readFile(group.base);
    if (!baseRaw) {
      issues.push(`MISSING: ${group.base}`);
      continue;
    }
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

  // 5. Check version consistency
  console.log('\n--- Version consistency ---');
  const versionFiles = [
    'package.json',
    '.claude-plugin/plugin.json',
    '.codex-plugin/plugin.json',
    '.devin-plugin/plugin.json',
    '.github/plugin/plugin.json',
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
      console.log(`  ✗ ${issue}`);
    }
  }

  process.exit(exitCode);
}

run();
