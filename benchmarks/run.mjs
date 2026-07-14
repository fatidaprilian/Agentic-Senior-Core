#!/usr/bin/env node
// ASC Benchmark Runner
// Measures LOC delta and token usage for tasks run with/without ASC rules.
//
// Usage:
//   node benchmarks/run.mjs --task <task-dir> --with-asc --model <model-id>
//   node benchmarks/run.mjs --task <task-dir> --without-asc --model <model-id>
//   node benchmarks/run.mjs --task <task-dir> --with-asc --runs 3
//
// Tasks live in benchmarks/tasks/<name>/ with:
//   - prompt.md     — the task prompt
//   - repo/         — a git repo snapshot to work in
//
// Results are written to benchmarks/.cache/result-<timestamp>.json

import { spawn, execSync } from 'node:child_process';
import { cpSync, rmSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(SCRIPT_DIR, '.cache');
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const SESSION_TIMEOUT_MS = 300_000;
const MAX_TURNS = 10;

function parseArgs(argv) {
  const args = { task: null, withAsc: false, model: 'claude-sonnet-4-6', runs: 1 };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--task' && argv[i + 1]) args.task = argv[++i];
    else if (argv[i] === '--with-asc') args.withAsc = true;
    else if (argv[i] === '--without-asc') args.withAsc = false;
    else if (argv[i] === '--model' && argv[i + 1]) args.model = argv[++i];
    else if (argv[i] === '--runs' && argv[i + 1]) args.runs = Math.max(1, parseInt(argv[++i], 10) || 1);
  }
  return args;
}

function spawnAsync(cmd, cmdArgs, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, options);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

function measureGitDiff(repoDir) {
  try {
    const stat = execSync('git diff --stat HEAD', { cwd: repoDir, encoding: 'utf8', stdio: 'pipe' });
    const lines = stat.trim().split('\n');
    const summary = lines[lines.length - 1] || '';
    const insertions = parseInt((summary.match(/(\d+) insertion/) || ['', '0'])[1], 10);
    const deletions = parseInt((summary.match(/(\d+) deletion/) || ['', '0'])[1], 10);
    return {
      linesAdded: insertions,
      linesRemoved: deletions,
      netDelta: insertions - deletions,
      filesChanged: Math.max(0, lines.length - 1),
    };
  } catch {
    return { linesAdded: 0, linesRemoved: 0, netDelta: 0, filesChanged: 0 };
  }
}

function parseSessionOutput(stdout) {
  try {
    const parsed = JSON.parse(stdout);
    return {
      tokens: {
        input: parsed.usage?.input_tokens || 0,
        output: parsed.usage?.output_tokens || 0,
        total: (parsed.usage?.input_tokens || 0) + (parsed.usage?.output_tokens || 0),
      },
      cost: parsed.cost_usd || parsed.total_cost_usd || 0,
      turns: parsed.num_turns || 0,
      isError: parsed.is_error || false,
    };
  } catch {
    return { tokens: { input: 0, output: 0, total: 0 }, cost: 0, turns: 0, isError: true };
  }
}

function ensureBaselineCommit(dir) {
  try {
    execSync('git rev-parse --git-dir', { cwd: dir, stdio: 'pipe' });
  } catch {
    execSync('git init', { cwd: dir, stdio: 'pipe' });
  }
  try {
    execSync('git add -A', { cwd: dir, stdio: 'pipe' });
    execSync('git commit -m "benchmark-baseline" --allow-empty', { cwd: dir, stdio: 'pipe' });
  } catch {
    // already clean
  }
}

async function runSingleBenchmark(taskDir, prompt, model, withAsc) {
  const workDir = path.join(CACHE_DIR, `workdir-${Date.now()}`);
  const taskRepo = path.join(taskDir, 'repo');

  try {
    cpSync(taskRepo, workDir, { recursive: true });

    if (withAsc) {
      const agentsMd = await fs.readFile(path.join(REPO_ROOT, 'AGENTS.md'), 'utf8');
      await fs.writeFile(path.join(workDir, 'AGENTS.md'), agentsMd);
    }

    ensureBaselineCommit(workDir);

    const claudeCmd = process.env.CLAUDE_CMD || 'claude';
    const claudeArgs = ['-p', prompt, '--model', model, '--output-format', 'json', '--max-turns', String(MAX_TURNS)];

    const startTime = Date.now();
    const session = await spawnAsync(claudeCmd, claudeArgs, {
      cwd: workDir,
      timeout: SESSION_TIMEOUT_MS,
    });
    const endTime = Date.now();

    const sessionData = parseSessionOutput(session.stdout);
    const diff = measureGitDiff(workDir);

    return { durationMs: endTime - startTime, diff, ...sessionData };
  } finally {
    try { rmSync(workDir, { recursive: true, force: true }); } catch {}
  }
}

async function run() {
  const args = parseArgs(process.argv);

  if (!args.task) {
    console.log('Usage: node benchmarks/run.mjs --task <task-dir> [--with-asc|--without-asc] [--model <id>] [--runs <n>]');
    console.log('\nSee benchmarks/METHODOLOGY.md for the full protocol.');
    process.exit(0);
  }

  const taskDir = path.resolve(args.task);
  const promptPath = path.join(taskDir, 'prompt.md');
  const repoDir = path.join(taskDir, 'repo');

  try { await fs.access(promptPath); } catch {
    console.error(`Task prompt not found: ${promptPath}`);
    process.exit(1);
  }
  try { await fs.access(repoDir); } catch {
    console.error(`Task repo not found: ${repoDir}`);
    process.exit(1);
  }

  const prompt = await fs.readFile(promptPath, 'utf8');
  const mode = args.withAsc ? 'with-asc' : 'without-asc';

  console.log(`\nASC Benchmark Runner`);
  console.log(`  Task:    ${path.basename(taskDir)}`);
  console.log(`  Mode:    ${mode}`);
  console.log(`  Model:   ${args.model}`);
  console.log(`  Runs:    ${args.runs}`);

  await fs.mkdir(CACHE_DIR, { recursive: true });
  const results = [];

  for (let i = 0; i < args.runs; i++) {
    console.log(`\n  Run ${i + 1}/${args.runs}...`);
    const data = await runSingleBenchmark(taskDir, prompt, args.model, args.withAsc);

    const result = {
      task: path.basename(taskDir),
      withAsc: args.withAsc,
      model: args.model,
      run: i + 1,
      timestamp: new Date().toISOString(),
      durationMs: data.durationMs,
      prompt: prompt.split('\n')[0],
      diff: data.diff,
      tokens: data.tokens,
      cost: data.cost,
      turns: data.turns,
      isError: data.isError,
    };

    results.push(result);
    console.log(`    LOC: +${result.diff.linesAdded}/-${result.diff.linesRemoved} (net ${result.diff.netDelta})`);
    console.log(`    Tokens: ${result.tokens.total} (in: ${result.tokens.input}, out: ${result.tokens.output})`);
    console.log(`    Duration: ${(result.durationMs / 1000).toFixed(1)}s`);
    if (result.cost > 0) console.log(`    Cost: $${result.cost.toFixed(4)}`);
  }

  const outFile = path.join(CACHE_DIR, `result-${Date.now()}.json`);
  await fs.writeFile(outFile, JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
  console.log(`\nResults written to: ${outFile}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
