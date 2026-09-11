#!/usr/bin/env node
// ASC Benchmark Runner — OpenCode edition.
// Spawns `opencode run` (a whitelisted AgentRouter client) per session and
// parses its JSON event stream for per-step token usage, including the
// cache read/write split. ASC condition is toggled by writing AGENTS.md
// (OpenCode's native rules file) into the sandbox work directory.
//
// Usage:
//   set AGENTROUTER_API_KEY=...
//   node benchmarks/harness/opencode-run.mjs --task benchmarks/tasks/greenfield-api --runs 5
//   node benchmarks/harness/opencode-run.mjs --task <dir> --condition with-asc --runs 1
//
// Results: benchmarks/.cache/opencode-<task>-<condition>-<timestamp>.json

import { execSync, spawn } from 'node:child_process';
import { cpSync, rmSync, mkdtempSync, writeFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { computeBilledCost } from './agent-loop.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const CACHE_DIR = path.join(REPO_ROOT, 'benchmarks', '.cache');
const RULES_FILE = path.join(REPO_ROOT, '.agents', 'plugins', 'agentic-senior-core', 'rules', 'agentic-senior-core.md');

// AgentRouter glm-5.3 rate card (user console log, 2026-09-11):
// input $5/1M, output $25/1M, cache read $2.5/1M, group ratio 1.
const RATES = {
    inputPerMTokens: 5,
    outputPerMTokens: 25,
    cacheReadPerMTokens: 2.5,
    groupRatio: 1,
};

function buildOpenCodeConfig(apiKey) {
    return {
        $schema: 'https://opencode.ai/config.json',
        provider: {
            agentrouter: {
                npm: '@ai-sdk/openai-compatible',
                name: 'AgentRouter (OpenAI Compatible)',
                options: { baseURL: 'https://agentrouter.org/v1', apiKey },
                models: { 'glm-5.3': { name: 'glm-5.3' } },
            },
        },
        model: 'agentrouter/glm-5.3',
    };
}

let SESSION_TIMEOUT_MS = 600_000; // 10 min per session (override with --timeout)

function parseArgs(argv) {
    const args = { task: null, runs: 1, condition: 'both', model: 'glm-5.3' };
    for (let i = 2; i < argv.length; i++) {
        if (argv[i] === '--task' && argv[i + 1]) args.task = argv[++i];
        else if (argv[i] === '--runs' && argv[i + 1]) args.runs = Math.max(1, parseInt(argv[++i], 10) || 1);
        else if (argv[i] === '--condition' && argv[i + 1]) args.condition = argv[++i];
        else if (argv[i] === '--model' && argv[i + 1]) args.model = argv[++i];
        else if (argv[i] === '--timeout' && argv[i + 1]) SESSION_TIMEOUT_MS = Math.max(30_000, parseInt(argv[++i], 10) * 1000);
    }
    return args;
}

// Parse OpenCode's --format json event stream. Each line is a JSON object;
// step_finish parts carry { tokens: { total, input, output, reasoning, cache: { write, read } } }.
function parseUsageFromEvents(rawOutput) {
    const usage = {
        calls: 0,
        promptTokens: 0,
        completionTokens: 0,
        cachedTokens: 0,
        cacheWriteTokens: 0,
        reasoningTokens: 0,
        turns: 0,
    };
    let finished = false;
    let lastText = '';

    for (const line of rawOutput.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('{')) continue;
        let event;
        try {
            event = JSON.parse(trimmed);
        } catch {
            continue;
        }
        if (event.type === 'step_finish' && event.part?.tokens) {
            const t = event.part.tokens;
            usage.calls += 1;
            usage.turns += 1;
            // OpenCode's tokens.input EXCLUDES cached tokens (total = input +
            // cache.read + output), so recombine into full prompt tokens.
            usage.promptTokens += (t.input || 0) + (t.cache?.read || 0);
            usage.completionTokens += t.output || 0;
            usage.reasoningTokens += t.reasoning || 0;
            usage.cachedTokens += t.cache?.read || 0;
            usage.cacheWriteTokens += t.cache?.write || 0;
            finished = true;
        }
        if (event.type === 'text' && event.part?.text) {
            lastText = event.part.text;
        }
    }
    return { usage, finished, lastText };
}

function ensureBaselineCommit(dir) {
    try {
        execSync('git rev-parse --git-dir', { cwd: dir, stdio: 'pipe' });
    } catch {
        execSync('git init', { cwd: dir, stdio: 'pipe' });
    }
    execSync('git add -A', { cwd: dir, stdio: 'pipe' });
    try {
        execSync('git commit -m "benchmark-baseline" --allow-empty', { cwd: dir, stdio: 'pipe' });
    } catch {
        // already clean
    }
    return execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf8', stdio: 'pipe' }).trim();
}

function measureGitDiff(repoDir, baselineRef) {
    try {
        execSync('git add -A', { cwd: repoDir, stdio: 'pipe' });
        const stat = execSync(`git diff --stat ${baselineRef}`, { cwd: repoDir, encoding: 'utf8', stdio: 'pipe' });
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

// Resolve the opencode native binary directly (npm global install). Spawning
// the .exe with an args array avoids cmd.exe quote-mangling of prompts that
// contain double quotes — a shell round-trip left opencode waiting on stdin.
function resolveOpenCodeBin() {
    if (process.env.OPENCODE_BIN) return process.env.OPENCODE_BIN;
    try {
        const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
        const exe = path.join(npmRoot, 'opencode-ai', 'bin', 'opencode.exe');
        execSync(`"${exe}" --version`, { stdio: 'pipe' });
        return exe;
    } catch {
        return 'opencode'; // fallback: PATH resolution (requires a shell-free .exe path)
    }
}

const OPENCODE_BIN = resolveOpenCodeBin();

function runOpenCodeSession(workDir, prompt) {
    return new Promise((resolve) => {
        const child = spawn(OPENCODE_BIN, [
            'run',
            '--dir', workDir,
            '-m', 'agentrouter/glm-5.3',
            '--auto',
            '--format', 'json',
            prompt,
        ], {
            cwd: workDir,
            timeout: SESSION_TIMEOUT_MS,
            env: { ...process.env },
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe'], // stdin closed: never block on it
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk) => { stdout += chunk; });
        child.stderr.on('data', (chunk) => { stderr += chunk; });
        child.on('error', (err) => resolve({ code: err.code || 1, stdout, stderr: `${stderr}${err.message}` }));
        child.on('close', (code, signal) => {
            resolve({ code: signal ? `SIGNAL:${signal}` : (code ?? 1), stdout, stderr });
        });
    });
}

async function runSingleSession({ taskDir, prompt, withAsc, rulesContent, apiKey }) {
    const workDir = mkdtempSync(path.join(os.tmpdir(), 'asc-opencode-'));
    try {
        cpSync(path.join(taskDir, 'repo'), workDir, { recursive: true });
        writeFileSync(path.join(workDir, 'opencode.json'), JSON.stringify(buildOpenCodeConfig(apiKey), null, 2), 'utf8');

        // ASC condition: OpenCode reads AGENTS.md from the project root as its
        // rules file. with-asc gets the full ASC ruleset; without-asc gets none.
        if (withAsc) {
            writeFileSync(path.join(workDir, 'AGENTS.md'), rulesContent, 'utf8');
        }

        const baselineRef = ensureBaselineCommit(workDir);
        const startTime = Date.now();
        const session = await runOpenCodeSession(workDir, prompt);
        const durationMs = Date.now() - startTime;

        const { usage, finished, lastText } = parseUsageFromEvents(session.stdout);
        const diff = measureGitDiff(workDir, baselineRef);

        return {
            durationMs,
            diff,
            usage,
            finished,
            lastText: lastText.slice(0, 500),
            exitCode: session.code,
            stderrTail: session.stderr.slice(-500),
        };
    } finally {
        try { rmSync(workDir, { recursive: true, force: true }); } catch { /* best effort */ }
    }
}

async function main() {
    const args = parseArgs(process.argv);

    if (!args.task) {
        console.log('Usage: node benchmarks/harness/opencode-run.mjs --task <task-dir> [--runs n] [--condition with-asc|without-asc|both]');
        process.exit(0);
    }

    if (!process.env.AGENTROUTER_API_KEY) {
        console.error('Missing AGENTROUTER_API_KEY environment variable.');
        process.exit(1);
    }

    const taskDir = path.resolve(args.task);
    const promptPath = path.join(taskDir, 'prompt.md');
    try {
        await fs.access(promptPath);
    } catch {
        console.error(`Task prompt not found: ${promptPath}`);
        process.exit(1);
    }
    const prompt = (await fs.readFile(promptPath, 'utf8')).trim();

    const rulesContent = await fs.readFile(RULES_FILE, 'utf8');
    const conditions = args.condition === 'both' ? ['with-asc', 'without-asc'] : [args.condition];

    await fs.mkdir(CACHE_DIR, { recursive: true });

    console.log('ASC OpenCode Benchmark (AgentRouter glm-5.3)');
    console.log(`  Task:    ${path.basename(taskDir)}`);
    console.log(`  Runs:    ${args.runs} x conditions: ${conditions.join(', ')}`);
    console.log(`  Rates:   input $${RATES.inputPerMTokens}/M, output $${RATES.outputPerMTokens}/M, cache read $${RATES.cacheReadPerMTokens}/M\n`);

    for (const condition of conditions) {
        const withAsc = condition === 'with-asc';

        for (let run = 1; run <= args.runs; run++) {
            process.stdout.write(`  [${condition}] run ${run}/${args.runs}... `);
            const result = await runSingleSession({ taskDir, prompt, withAsc, rulesContent, apiKey: process.env.AGENTROUTER_API_KEY });
            const billedCost = computeBilledCost(result.usage, RATES);

            const record = {
                harness: 'opencode-agentrouter',
                task: path.basename(taskDir),
                condition,
                model: 'glm-5.3',
                run,
                timestamp: new Date().toISOString(),
                durationMs: result.durationMs,
                finished: result.finished,
                exitCode: result.exitCode,
                usage: result.usage,
                billedCostUSD: billedCost,
                diff: result.diff,
                lastText: result.lastText,
                stderrTail: result.stderrTail,
            };
            const outFile = path.join(CACHE_DIR, `opencode-${path.basename(taskDir)}-${condition}-${Date.now()}.json`);
            await fs.writeFile(outFile, JSON.stringify(record, null, 2), 'utf8');

            console.log(
                `${result.finished ? 'completed' : `INCOMPLETE(exit ${result.exitCode})`} | turns ${result.usage.turns} | prompt ${result.usage.promptTokens} (cached ${result.usage.cachedTokens}) | output ${result.usage.completionTokens} | $${billedCost.toFixed(4)}`,
            );
        }
    }

    console.log(`\nResults written to ${CACHE_DIR}. Summarize with: node benchmarks/harness/report.mjs`);
}

main().catch((error) => {
    console.error(`Harness failed: ${error.message}`);
    process.exit(1);
});
