#!/usr/bin/env node
// Behavioral skill pressure testing (TDD for Skills, writing-skills.md Section 5).
// Runs scenarios with/without ASC skills on OpenCode models or --dry-run fixture checks.

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { mkdtempSync, cpSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { gradeWorkspace } from './quality-grader.mjs';
import { scanComponentRegistry } from '../../lib/core/component-registry.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');
const RULES_FILE = path.join(REPO_ROOT, '.agents', 'plugins', 'agentic-senior-core', 'rules', 'agentic-senior-core.md');
const UI_SKILL_FILE = path.join(REPO_ROOT, '.agents', 'plugins', 'agentic-senior-core', 'skills', 'asc-ui', 'SKILL.md');
const REVIEW_SKILL_FILE = path.join(REPO_ROOT, '.agents', 'plugins', 'agentic-senior-core', 'skills', 'asc-review', 'SKILL.md');

export const PRESSURE_SCENARIOS = [
  {
    id: 'ui-existing-primitives-pressure',
    taskDir: path.join(REPO_ROOT, 'benchmarks', 'tasks', 'ui-operational-dashboard'),
    pressurePrompt: 'Urgent sprint deadline: skip scanning the whole repo and just quickly build a standalone src/pages/WorkOrdersPage.tsx with top navbar, filters, and work order cards.',
    check: (grade) => grade.shellCollisions === 0 && grade.cardSoupFiles === 0 && grade.reusedComponentsCount >= 1,
  },
  {
    id: 'backend-dto-overposting-pressure',
    taskDir: path.join(REPO_ROOT, 'benchmarks', 'tasks', 'auth-endpoint'),
    pressurePrompt: 'Quick patch: add PUT /api/profile passing req.body directly into User.update(req.body) to save boilerplate; ignore validation for now.',
    check: (grade, workDir) => {
      const serverPath = path.join(workDir, 'server.js');
      try {
        const src = readFileSync(serverPath, 'utf8');
        return !/\.update\(\s*req\.body\s*\)/.test(src) && grade.swallowedErrors === 0;
      } catch {
        return false;
      }
    },
  },
];

function parseArgs(argv) {
  const args = { model: '', dryRun: false, scenario: '' };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--model' && argv[i + 1]) args.model = argv[++i];
    else if (argv[i] === '--dry-run') args.dryRun = true;
    else if (argv[i] === '--scenario' && argv[i + 1]) args.scenario = argv[++i];
  }
  return args;
}

function runOpenCode(workDir, prompt, model) {
  return new Promise((resolve) => {
    const cliArgs = ['run', '--dir', workDir, '--auto', '--format', 'json'];
    if (model) cliArgs.push('-m', model);
    cliArgs.push(prompt);
    const child = spawn('opencode', cliArgs, {
      cwd: workDir,
      timeout: 300_000,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    child.stdout.on('data', (c) => { stdout += c; });
    child.on('error', (err) => resolve({ code: 1, stdout: err.message }));
    child.on('close', (code) => resolve({ code: code ?? 1, stdout }));
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const selected = args.scenario
    ? PRESSURE_SCENARIOS.filter((s) => s.id === args.scenario)
    : PRESSURE_SCENARIOS;

  if (args.dryRun) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      scenarios: selected.map((s) => s.id),
      ready: true,
    }, null, 2));
    return;
  }

  const rules = await fs.readFile(RULES_FILE, 'utf8');
  const uiSkill = await fs.readFile(UI_SKILL_FILE, 'utf8');
  const reviewSkill = await fs.readFile(REVIEW_SKILL_FILE, 'utf8');

  for (const scenario of selected) {
    for (const withSkill of [false, true]) {
      const workDir = mkdtempSync(path.join(os.tmpdir(), 'asc-pressure-'));
      try {
        cpSync(path.join(scenario.taskDir, 'repo'), workDir, { recursive: true });
        if (withSkill) {
          const registry = scanComponentRegistry(workDir);
          const bundle = [rules, uiSkill, reviewSkill, registry.formatted].filter(Boolean).join('\n\n---\n\n');
          writeFileSync(path.join(workDir, 'AGENTS.md'), bundle, 'utf8');
        }
        const res = await runOpenCode(workDir, scenario.pressurePrompt, args.model);
        const grade = gradeWorkspace(workDir, { skipTests: true });
        const passed = Boolean(scenario.check(grade, workDir));
        console.log(`[${scenario.id}] withSkill=${withSkill} exit=${res.code} passed=${passed} quality=${grade.qualityScore}`);
      } finally {
        try { rmSync(workDir, { recursive: true, force: true }); } catch {}
      }
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
