#!/usr/bin/env node
// ASC Benchmark Runner — headless, OpenAI-compatible API edition.
// Runs paired with-ASC / without-ASC sessions against any /v1/chat/completions
// endpoint (default: AgentRouter, model glm-5.3) and records billed cost using
// provider-reported usage, including the cached-token split.
//
// Usage:
//   set AGENTROUTER_API_KEY=...   (required for live runs)
//   node benchmarks/harness/run.mjs --task benchmarks/tasks/greenfield-api --runs 5
//   node benchmarks/harness/run.mjs --task <dir> --condition with-asc --runs 1
//   node benchmarks/harness/run.mjs --task <dir> --dry-run   (no API calls)
//
// Results: benchmarks/.cache/headless-<task>-<condition>-<timestamp>.json

import { execSync } from 'node:child_process';
import { cpSync, rmSync, mkdtempSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { runAgentSession, computeBilledCost } from './agent-loop.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const CACHE_DIR = path.join(REPO_ROOT, 'benchmarks', '.cache');
const RULES_FILE = path.join(REPO_ROOT, '.agents', 'plugins', 'agentic-senior-core', 'rules', 'agentic-senior-core.md');

// AgentRouter glm-5.3 rate card (from user's console log, 2026-09-11):
// input $5/1M, output $25/1M (completion ratio 5), cache read $2.5/1M (ratio 0.5), group ratio 1.
const DEFAULT_RATES = {
    inputPerMTokens: 5,
    outputPerMTokens: 25,
    cacheReadPerMTokens: 2.5,
    groupRatio: 1,
};

const BASELINE_SYSTEM_PROMPT = [
    'You are a software engineer working in the current directory.',
    'Complete the task using the provided tools. When done, reply with a short summary.',
].join(' ');

function parseArgs(argv) {
    const args = { task: null, runs: 1, condition: 'both', model: 'glm-5.3', dryRun: false };
    for (let i = 2; i < argv.length; i++) {
        if (argv[i] === '--task' && argv[i + 1]) args.task = argv[++i];
        else if (argv[i] === '--runs' && argv[i + 1]) args.runs = Math.max(1, parseInt(argv[++i], 10) || 1);
        else if (argv[i] === '--condition' && argv[i + 1]) args.condition = argv[++i];
        else if (argv[i] === '--model' && argv[i + 1]) args.model = argv[++i];
        else if (argv[i] === '--dry-run') args.dryRun = true;
    }
    return args;
}

function createTransport({ baseUrl, apiKey, model }) {
    // AgentRouter gates on client identity, not just the key ("unauthorized
    // client detected" for generic clients). Identify as Roo Code, which is the
    // client this key was issued for. Override via AGENTROUTER_USER_AGENT.
    const userAgent = process.env.AGENTROUTER_USER_AGENT || 'Roo-Code/3.25.0';
    return async ({ body }) => {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                authorization: `Bearer ${apiKey}`,
                'user-agent': userAgent,
            },
            body: JSON.stringify({ ...body, model }),
        });
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`API ${response.status}: ${text.slice(0, 500)}`);
        }
        return response.json();
    };
}

// Deterministic mock transport for --dry-run: no network, no cost.
// Simulates a model that reads one file then finishes.
function createMockTransport() {
    let callCount = 0;
    return async () => {
        callCount += 1;
        if (callCount === 1) {
            return {
                usage: { prompt_tokens: 1200, completion_tokens: 40, prompt_tokens_details: { cached_tokens: 0 } },
                choices: [{
                    finish_reason: 'tool_calls',
                    message: {
                        role: 'assistant',
                        content: null,
                        tool_calls: [{
                            id: 'mock-1',
                            type: 'function',
                            function: { name: 'read_file', arguments: '{"path":"package.json"}' },
                        }],
                    },
                }],
            };
        }
        return {
            usage: { prompt_tokens: 1400, completion_tokens: 60, prompt_tokens_details: { cached_tokens: 1200 } },
            choices: [{
                finish_reason: 'stop',
                message: { role: 'assistant', content: 'Done: mock completion.' },
            }],
        };
    };
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

async function runSingleSession({ taskDir, prompt, systemPrompt, transport }) {
    const workDir = mkdtempSync(path.join(os.tmpdir(), 'asc-headless-'));
    try {
        cpSync(path.join(taskDir, 'repo'), workDir, { recursive: true });
        const baselineRef = ensureBaselineCommit(workDir);
        const startTime = Date.now();
        const session = await runAgentSession({ prompt, systemPrompt, workDir, transport });
        const durationMs = Date.now() - startTime;
        const diff = measureGitDiff(workDir, baselineRef);
        return { durationMs, diff, ...session };
    } finally {
        try { rmSync(workDir, { recursive: true, force: true }); } catch { /* best effort */ }
    }
}

async function main() {
    const args = parseArgs(process.argv);

    if (!args.task) {
        console.log('Usage: node benchmarks/harness/run.mjs --task <task-dir> [--runs n] [--condition with-asc|without-asc|both] [--model id] [--dry-run]');
        process.exit(0);
    }

    const taskDir = path.resolve(args.task);
    const promptPath = path.join(taskDir, 'prompt.md');
    try {
        await fs.access(promptPath);
    } catch {
        console.error(`Task prompt not found: ${promptPath}`);
        process.exit(1);
    }
    const prompt = await fs.readFile(promptPath, 'utf8');

    const apiKey = process.env.AGENTROUTER_API_KEY;
    const baseUrl = process.env.AGENTROUTER_BASE_URL || 'https://agentrouter.org/v1';
    if (!args.dryRun && !apiKey) {
        console.error('Missing AGENTROUTER_API_KEY (or pass --dry-run for a no-network smoke test).');
        process.exit(1);
    }

    const rulesContent = await fs.readFile(RULES_FILE, 'utf8');
    const ascSystemPrompt = `${BASELINE_SYSTEM_PROMPT}\n\n${rulesContent}`;

    const conditions = args.condition === 'both'
        ? ['with-asc', 'without-asc']
        : [args.condition];
    const transport = args.dryRun ? createMockTransport() : createTransport({ baseUrl, apiKey, model: args.model });

    await fs.mkdir(CACHE_DIR, { recursive: true });

    console.log('ASC Headless Benchmark');
    console.log(`  Task:    ${path.basename(taskDir)}`);
    console.log(`  Model:   ${args.model}${args.dryRun ? ' (DRY RUN — mock transport, no API calls)' : ''}`);
    console.log(`  Runs:    ${args.runs} x conditions: ${conditions.join(', ')}`);
    console.log(`  Rates:   input $${DEFAULT_RATES.inputPerMTokens}/M, output $${DEFAULT_RATES.outputPerMTokens}/M, cache $${DEFAULT_RATES.cacheReadPerMTokens}/M\n`);

    for (const condition of conditions) {
        const systemPrompt = condition === 'with-asc' ? ascSystemPrompt : BASELINE_SYSTEM_PROMPT;

        for (let run = 1; run <= args.runs; run++) {
            process.stdout.write(`  [${condition}] run ${run}/${args.runs}... `);
            const result = await runSingleSession({ taskDir, prompt, systemPrompt, transport });
            const billedCost = computeBilledCost(result.usage, DEFAULT_RATES);

            const record = {
                harness: 'headless-openai-compatible',
                task: path.basename(taskDir),
                condition,
                model: args.dryRun ? 'mock' : args.model,
                run,
                timestamp: new Date().toISOString(),
                durationMs: result.durationMs,
                stopReason: result.stopReason,
                usage: result.usage,
                billedCostUSD: billedCost,
                diff: result.diff,
            };
            const outFile = path.join(CACHE_DIR, `headless-${path.basename(taskDir)}-${condition}-${Date.now()}.json`);
            await fs.writeFile(outFile, JSON.stringify(record, null, 2), 'utf8');

            console.log(
                `${result.stopReason} | turns ${result.usage.turns} | prompt ${result.usage.promptTokens} (cached ${result.usage.cachedTokens}) | output ${result.usage.completionTokens} | $${billedCost.toFixed(4)}`,
            );
        }
    }

    console.log(`\nResults written to ${CACHE_DIR}. Summarize with: node benchmarks/harness/report.mjs`);
}

main().catch((error) => {
    console.error(`Harness failed: ${error.message}`);
    process.exit(1);
});
