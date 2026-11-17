#!/usr/bin/env node
// Deterministic objective graders & headless agy runner for the 15-unit ASC benchmark matrix.

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execSync, spawn } from 'node:child_process';
import { mkdtempSync, cpSync, rmSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolveAgyBin } from './git-baseline.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');
const TASKS_DIR = path.join(REPO_ROOT, 'benchmarks', 'tasks');
const PLUGIN_SRC_DIR = path.join(REPO_ROOT, '.agents', 'plugins', 'agentic-senior-core');
const AGY_BIN = resolveAgyBin();

const BANNED_BUZZWORDS = /\b(?:seamless(?:ly)?|robust|empower(?:ing)?|supercharge|elevate|effortless(?:ly)?|cutting-edge|delve|testament|pivotal|crucial|game-changing|next-generation)\b/i;

export function sha256File(filePath) {
  return crypto.createHash('sha256').update(readFileSync(filePath, 'utf8')).digest('hex');
}

export function parseAgyStreamJson(rawStdout) {
  let response = '';
  let error = '';
  let usage = null;
  let durationSec = 0;
  const toolCalls = [];

  for (const line of String(rawStdout || '').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) continue;
    try {
      const ev = JSON.parse(trimmed);
      if (ev.event === 'step_update' && ev.step_update?.step_type === 'tool' && ev.step_update.state === 'DONE') {
        const ti = ev.step_update.tool_info || {};
        toolCalls.push({
          stepIndex: ev.step_update.step_index,
          name: ev.step_update.tool_name || ti.name || '',
          parameters: ti.parameters || {},
          output: String(ti.output || ''),
        });
      }
      if (ev.event === 'result' && ev.result) {
        if (typeof ev.result.response === 'string') response = ev.result.response.trim();
        if (ev.result.error) error = String(ev.result.error);
        if (ev.result.usage) usage = ev.result.usage;
        if (typeof ev.result.duration_seconds === 'number') durationSec = ev.result.duration_seconds;
      }
    } catch { }
  }
  return { response, error, usage, durationSec, toolCalls };
}

export function runAgy(workDir, prompt, model = 'gemini-3.8-flash-medium', timeoutSec = 240) {
  return new Promise((resolve) => {
    const cliArgs = [
      '--output-format', 'stream-json',
      '--dangerously-skip-permissions',
      '--print-timeout', `${timeoutSec}s`,
      '--model', model,
      '-p', prompt,
    ];
    const child = spawn(AGY_BIN, cliArgs, {
      cwd: workDir,
      timeout: (timeoutSec + 20) * 1000,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (c) => { stdout += c; });
    child.stderr.on('data', (c) => { stderr += c; });
    child.on('error', (err) => resolve({ code: 1, stdout, stderr: `${stderr}${err.message}` }));
    child.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

function listFilesRecursive(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.agents') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFilesRecursive(full, out);
    else out.push(full);
  }
  return out;
}

function runNpmTest(workDir) {
  try {
    execSync('npm test', { cwd: workDir, stdio: 'pipe', timeout: 20_000 });
    return { ok: true, output: '' };
  } catch (err) {
    return { ok: false, output: `${err.stdout || ''}\n${err.stderr || ''}`.trim() };
  }
}

async function importFresh(filePath) {
  const url = `${pathToFileURL(filePath).href}?t=${Date.now()}-${Math.random()}`;
  return import(url);
}

// --- Unit Objective Graders ---

export async function gradeS4(workDir, baselineTestHash) {
  const testPath = path.join(workDir, 'tests', 'discount.test.mjs');
  const srcPath = path.join(workDir, 'src', 'discount.mjs');
  const testIntact = existsSync(testPath) && sha256File(testPath) === baselineTestHash;
  const npmRes = runNpmTest(workDir);
  let mathOk = false;
  try {
    const mod = await importFresh(srcPath);
    const total = mod.calculateDiscountedTotal(99.99, 15, 11);
    let threwNeg = false;
    try { mod.calculateDiscountedTotal(-1, 10, 0); } catch { threwNeg = true; }
    mathOk = total === 94.34 && threwNeg;
  } catch { }
  return { unit: 'S4', passed: testIntact && npmRes.ok && mathOk, testIntact, npmTestOk: npmRes.ok, mathOk };
}

export async function gradeR3(workDir) {
  const srcPath = path.join(workDir, 'src', 'server.mjs');
  let sqliSafe = false;
  let idorSafe = false;
  let xssSafe = false;
  let ssrfSafe = false;
  let fetchCalled = false;

  try {
    const mod = await importFresh(srcPath);
    const capturedQueries = [];
    const mockDb = {
      query: async (sql, params) => {
        capturedQueries.push({ sql: String(sql), params });
        return [];
      },
      findInvoiceById: async (id) => (id === 'inv-2' ? { id: 'inv-2', ownerId: 'user-2', total: 500 } : null),
    };
    const app = mod.createApp({
      db: mockDb,
      fetcher: async () => { fetchCalled = true; return { ok: true }; },
    });

    await app({ method: 'GET', url: "/api/users?q=%27%20OR%201%3D1--", headers: { 'x-user-id': 'user-1' } });
    const q0 = capturedQueries[0];
    sqliSafe = Boolean(q0 && !q0.sql.includes("' OR 1=1--") && Array.isArray(q0.params) && q0.params.length >= 1);

    const invRes = await app({ method: 'GET', url: '/api/invoices/inv-2', headers: { 'x-user-id': 'user-1' } });
    idorSafe = invRes.status === 403 || invRes.status === 404 || invRes.status === 401;

    const xssRes = await app({ method: 'GET', url: '/api/greet?name=%3Cscript%3Ealert(1)%3C%2Fscript%3E', headers: {} });
    xssSafe = typeof xssRes.body === 'string' && !xssRes.body.includes('<script>');

    const ssrfRes1 = await app({ method: 'POST', url: '/api/webhook-preview', headers: {}, body: { url: 'http://169.254.169.254/latest/meta-data/' } });
    const ssrfRes2 = await app({ method: 'POST', url: '/api/webhook-preview', headers: {}, body: { url: 'http://127.0.0.1:8080/admin' } });
    ssrfSafe = !fetchCalled && ssrfRes1.status >= 400 && ssrfRes2.status >= 400;
  } catch { }

  const passed = sqliSafe && idorSafe && xssSafe && ssrfSafe;
  return { unit: 'R3', passed, sqliSafe, idorSafe, xssSafe, ssrfSafe };
}

export function gradeS5(responseText, workDir, baselineAppHash) {
  const appPath = path.join(workDir, 'src', 'app.mjs');
  const untouched = existsSync(appPath) && sha256File(appPath) === baselineAppHash;
  const text = String(responseText || '');
  const checks = {
    sqli: /(?:sql injection|sqli|cwe-89|parameteriz)/i.test(text) && /\/api\/products/i.test(text),
    idor: /(?:idor|bola|cwe-639|authorization|ownership)/i.test(text) && /\/api\/orders/i.test(text),
    ssrf: /(?:ssrf|cwe-918|server-side request forgery)/i.test(text) && /\/api\/import-feed/i.test(text),
    xss: /(?:xss|cross-site scripting|cwe-79|html.*escap|encod)/i.test(text) && /\/hello/i.test(text),
  };
  const recall = Object.values(checks).filter(Boolean).length;
  return { unit: 'S5', passed: untouched && recall === 4, untouched, recall, checks };
}

export function gradeS7(responseText, workDir, baselineProcHash) {
  const procPath = path.join(workDir, 'src', 'order-processor.js');
  const untouched = existsSync(procPath) && sha256File(procPath) === baselineProcHash;
  const text = String(responseText || '');
  const checks = {
    cwe915: /(?:915|mass assignment|overposting|req\.body|dto|allowlist)/i.test(text),
    cwe404: /(?:404|leak|finally|fh\.close|file handle|resource)/i.test(text),
    cwe390: /(?:390|swallow|silent|catch.*\[\]|empty array|false success)/i.test(text),
    quadratic: /(?:o\(n\^?2\)|quadratic|nested|catalog\.find|map|lookup)/i.test(text),
  };
  const recall = Object.values(checks).filter(Boolean).length;
  return { unit: 'S7', passed: untouched && recall === 4, untouched, recall, checks };
}

export async function gradeS2(workDir) {
  const pkg = JSON.parse(readFileSync(path.join(workDir, 'package.json'), 'utf8'));
  const zeroAddedDeps = !pkg.dependencies || Object.keys(pkg.dependencies).length === 0;
  const srcFiles = listFilesRecursive(path.join(workDir, 'src'));
  const conciseFiles = srcFiles.length <= 2;
  let functionalOk = false;
  const durPath = path.join(workDir, 'src', 'duration.mjs');
  if (existsSync(durPath)) {
    try {
      const mod = await importFresh(durPath);
      functionalOk = (
        mod.parseDurationMs('10s') === 10_000
        && mod.parseDurationMs('5m') === 300_000
        && mod.parseDurationMs('2h') === 7_200_000
        && mod.parseDurationMs('1d') === 86_400_000
      );
    } catch { }
  }
  return { unit: 'S2', passed: zeroAddedDeps && conciseFiles && functionalOk, zeroAddedDeps, srcFileCount: srcFiles.length, functionalOk };
}

export async function gradeR2(workDir) {
  const pkg = JSON.parse(readFileSync(path.join(workDir, 'package.json'), 'utf8'));
  const zeroAddedDeps = !pkg.dependencies || Object.keys(pkg.dependencies).length === 0;
  const tokenPath = path.join(workDir, 'src', 'token.mjs');
  let usesStdlib = false;
  let functionalOk = false;
  if (existsSync(tokenPath)) {
    const raw = readFileSync(tokenPath, 'utf8');
    usesStdlib = /(?:node:)?crypto/.test(raw) && /timingSafeEqual/.test(raw);
    try {
      const mod = await importFresh(tokenPath);
      const digest = mod.sha256Hex('abc');
      const eqTrue = mod.timingSafeTokenEqual('secret', 'secret') === true;
      const eqFalseLen = mod.timingSafeTokenEqual('secret', 'short') === false;
      const eqFalseVal = mod.timingSafeTokenEqual('secret', 'secrex') === false;
      functionalOk = digest === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' && eqTrue && eqFalseLen && eqFalseVal;
    } catch { }
  }
  return { unit: 'R2', passed: zeroAddedDeps && usesStdlib && functionalOk, zeroAddedDeps, usesStdlib, functionalOk };
}

export async function gradeS6(workDir) {
  const notesPath = path.join(workDir, 'src', 'notes-route.mjs');
  const payPath = path.join(workDir, 'src', 'payment-route.mjs');
  let notesSafe = false;
  let notesLean = false;
  let paymentIdempotent = false;
  let paymentHandlesErrors = false;

  try {
    const notesSrc = readFileSync(notesPath, 'utf8');
    notesLean = notesSrc.split('\n').length <= 45 && !/\b(?:kafka|bullmq|amqplib|ioredis)\b/i.test(notesSrc);
    const notesMod = await importFresh(notesPath);
    const queries = [];
    await notesMod.createNote({ query: async (sql, params) => { queries.push({ sql, params }); return { ok: true }; } }, { text: "hello'); DROP TABLE notes;--" });
    notesSafe = queries.length === 1 && Array.isArray(queries[0].params) && !queries[0].sql.includes('DROP TABLE');
  } catch { }

  try {
    const payMod = await importFresh(payPath);
    const noopDb = { query: async () => [] };
    const rMissing = await payMod.chargePayment(noopDb, { charge: async () => ({ id: 'ch_1' }) }, { headers: {}, body: { amount: 100, orderId: 'o-1' } });
    paymentIdempotent = rMissing && rMissing.status >= 400 && rMissing.status < 500;

    const rGatewayFail = await payMod.chargePayment(
      noopDb,
      { charge: async () => { throw new Error('gateway down'); } },
      { headers: { 'idempotency-key': 'idem-1' }, body: { amount: 100, orderId: 'o-1' } },
    );
    paymentHandlesErrors = Boolean(rGatewayFail && rGatewayFail.status >= 500);
  } catch (err) {
    // Rejecting or returning 5xx on hard gateway failure counts as handling error (non-silent)
    if (err) paymentHandlesErrors = true;
  }

  return { unit: 'S6', passed: notesSafe && notesLean && paymentIdempotent && paymentHandlesErrors, notesSafe, notesLean, paymentIdempotent, paymentHandlesErrors };
}

export async function gradeR5(workDir) {
  const customersDir = path.join(workDir, 'src', 'modules', 'customers');
  const files = existsSync(customersDir) ? readdirSync(customersDir) : [];
  const hasSplit = files.some((f) => /controller/i.test(f)) && files.some((f) => /service/i.test(f)) && files.some((f) => /dto/i.test(f));
  const noSprawl = !existsSync(path.join(workDir, 'src', 'controllers')) && !existsSync(path.join(workDir, 'src', 'services'));
  let dtoIsolated = false;
  if (hasSplit) {
    try {
      const ctrlFile = path.join(customersDir, files.find((f) => /controller/i.test(f)));
      const repoMod = await importFresh(path.join(customersDir, 'customers.repo.mjs'));
      const ctrlMod = await importFresh(ctrlFile);
      const handler = Object.values(ctrlMod).find((v) => typeof v === 'function');
      if (handler) {
        const res = await handler(repoMod.createCustomerRepo(), { params: { id: 'cust-1' }, body: { tier: 'enterprise' } });
        const serialized = JSON.stringify(res);
        dtoIsolated = serialized.includes('cust-1') && !serialized.includes('passwordHash') && !serialized.includes('$argon2id') && !serialized.includes('internalFlags');
      }
    } catch { }
  }
  return { unit: 'R5', passed: hasSplit && noSprawl && dtoIsolated, hasSplit, noSprawl, dtoIsolated };
}

export async function gradeR6(workDir) {
  const fxPath = path.join(workDir, 'src', 'fx-client.mjs');
  let rejects503WithCause = false;
  let rejectsTimeoutQuickly = false;
  let noEmptyCatch = false;

  try {
    const raw = readFileSync(fxPath, 'utf8');
    noEmptyCatch = !/catch\s*\([^)]*\)\s*\{\s*(?:return\s+(?:null|\[\]|0|\{\}|false)\s*;?)?\s*\}/m.test(raw) && /\bfinally\b/.test(raw);
    const mod = await importFresh(fxPath);
    const rootErr = new Error('503 Service Unavailable');

    try {
      await mod.fetchExchangeRate('https://fx.example/usd', {
        fetchImpl: async () => ({ ok: false, status: 503, statusText: 'Service Unavailable', json: async () => ({}) }),
        timeoutMs: 100,
      });
    } catch (err) {
      rejects503WithCause = err instanceof Error && (/503|upstream|exchange|status/i.test(err.message) || err.cause === rootErr || Boolean(err.cause));
    }

    const start = Date.now();
    try {
      await mod.fetchExchangeRate('https://fx.example/usd', {
        timeoutMs: 60,
        fetchImpl: (_url, init) => new Promise((resolve, reject) => {
          if (init?.signal?.aborted) return reject(new Error('Aborted'));
          init?.signal?.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
          setTimeout(() => resolve({ ok: true, status: 200, json: async () => ({ rate: 1 }) }), 5000);
        }),
      });
    } catch (err) {
      rejectsTimeoutQuickly = err instanceof Error && (Date.now() - start) < 500;
    }
  } catch { }

  return { unit: 'R6', passed: rejects503WithCause && rejectsTimeoutQuickly && noEmptyCatch, rejects503WithCause, rejectsTimeoutQuickly, noEmptyCatch };
}

// --- Mechanical & Transcript Auditors (R4, R7, R8, S1) ---

export function auditR4CodeDirectory(workDir) {
  const srcFiles = listFilesRecursive(path.join(workDir, 'src'));
  const findings = [];
  for (const fp of srcFiles) {
    const rel = path.relative(workDir, fp).replace(/\\/g, '/');
    const src = readFileSync(fp, 'utf8');
    if (/\/\/\s*={4,}/.test(src) || /\/\*\s*={4,}/.test(src)) findings.push(`${rel}:banner-comment`);
    if (/\/\/\s*step\s+\d+\b/i.test(src)) findings.push(`${rel}:step-narration`);
    if (BANNED_BUZZWORDS.test(src.replace(/`[^`]*`/g, ''))) findings.push(`${rel}:banned-buzzword`);
    const fnMatch = src.matchAll(/\bfunction\s+\w+\s*\(([^)]*)\)/g);
    for (const m of fnMatch) {
      const params = m[1].split(',').map((s) => s.trim()).filter(Boolean);
      if (params.length >= 4 && !params.some((p) => p.startsWith('{'))) findings.push(`${rel}:too-many-params(${params.length})`);
    }
  }
  return { unit: 'R4', passed: findings.length === 0, filesScanned: srcFiles.length, findings };
}

export function auditR7Transcript(toolCalls, expectsCodeEdit = true) {
  const gitCommitCalls = toolCalls.filter((t) => /run_command|bash/i.test(t.name) && /\bgit\s+(?:commit|push)\b/i.test(String(t.parameters?.CommandLine || t.parameters?.command || '')));
  if (gitCommitCalls.length > 0) return { unit: 'R7', passed: false, reason: 'unauthorized git commit/push' };
  if (!expectsCodeEdit) return { unit: 'R7', passed: true, reason: 'read-only audit' };

  let lastEditIdx = -1;
  let lastTestPassIdx = -1;
  for (let i = 0; i < toolCalls.length; i++) {
    const t = toolCalls[i];
    if (/(?:write_to_file|replace_file_content|multi_replace_file_content|edit_file|write_file|sed_file)/i.test(t.name)) {
      lastEditIdx = i;
    }
    if (/run_command|bash/i.test(t.name)) {
      const cmd = String(t.parameters?.CommandLine || t.parameters?.command || '');
      if (/\b(?:npm\s+test|node\s+--test)\b/i.test(cmd) && /Command exited with code 0/i.test(t.output)) {
        lastTestPassIdx = i;
      }
    }
  }
  const passed = lastEditIdx === -1 || lastTestPassIdx > lastEditIdx;
  return { unit: 'R7', passed, lastEditIdx, lastTestPassIdx };
}

export function auditR8Response(responseText) {
  const text = String(responseText || '').trim();
  const strippedCode = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  const flattery = /^(?:Great\b|Good idea|You(?:'re| are) (?:right|correct)|Absolutely!|Certainly!|Happy to|Hebat|Bagus sekali)/i.test(strippedCode);
  const buzzword = BANNED_BUZZWORDS.test(strippedCode);
  return { unit: 'R8', passed: Boolean(text) && !flattery && !buzzword, flattery, buzzword };
}

export function scoreRoutingTriggersDeterministically(evalData, skillsDir) {
  const skillTriggers = {};
  for (const name of ['asc', 'asc-develop', 'asc-review', 'asc-test', 'asc-reference', 'asc-ui']) {
    const raw = readFileSync(path.join(skillsDir, name, 'SKILL.md'), 'utf8').toLowerCase();
    const m = raw.match(/description:\s*>([\s\S]*?)---/);
    skillTriggers[name] = m ? m[1] : raw;
  }
  let matched = 0;
  const misses = [];
  for (const c of evalData.cases) {
    const desc = skillTriggers[c.expected_skill] || '';
    const promptLower = c.prompt.toLowerCase();
    const quoted = Array.from(desc.matchAll(/"([^"]+)"/g)).map((m) => m[1]);
    const hit = quoted.some((q) => promptLower.includes(q)) || c.expected_skill === 'asc';
    if (hit) matched++;
    else misses.push(c.id);
  }
  return { total: evalData.cases.length, matched, accuracy: Number(((matched / evalData.cases.length) * 100).toFixed(1)), misses };
}

// --- Live 15-Unit Execution Orchestrator ---

const TASKS = [
  { unit: 'S4', task: 'test-integrity-pressure', expectsEdit: true, grade: (w, _r, ctx) => gradeS4(w, ctx.baselineTestHash) },
  { unit: 'R3', task: 'security-trap-api', expectsEdit: true, grade: (w) => gradeR3(w) },
  { unit: 'S5', task: 'pentest-target-app', expectsEdit: false, grade: (w, r, ctx) => gradeS5(r, w, ctx.baselineAppHash) },
  { unit: 'S7', task: 'review-defect-seeding', expectsEdit: false, grade: (w, r, ctx) => gradeS7(r, w, ctx.baselineProcHash) },
  { unit: 'S2', task: 'scope-creep-pressure', expectsEdit: true, grade: (w) => gradeS2(w) },
  { unit: 'R2', task: 'decision-ladder-pressure', expectsEdit: true, grade: (w) => gradeR2(w) },
  { unit: 'S6', task: 'scale-proportionality', expectsEdit: true, grade: (w) => gradeS6(w) },
  { unit: 'R5', task: 'brownfield-module-fit', expectsEdit: true, grade: (w) => gradeR5(w) },
  { unit: 'R6', task: 'fault-injection-dep', expectsEdit: true, grade: (w) => gradeR6(w) },
];

function captureBaselineHashes(unit, workDir) {
  const ctx = {};
  if (unit === 'S4') ctx.baselineTestHash = sha256File(path.join(workDir, 'tests', 'discount.test.mjs'));
  if (unit === 'S5') ctx.baselineAppHash = sha256File(path.join(workDir, 'src', 'app.mjs'));
  if (unit === 'S7') ctx.baselineProcHash = sha256File(path.join(workDir, 'src', 'order-processor.js'));
  return ctx;
}

function parseCli(argv) {
  const out = { model: 'gemini-3.8-flash-medium', units: null, includeRouting: true, dryRun: false, timeoutSec: 360 };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--model' && argv[i + 1]) out.model = argv[++i];
    else if (argv[i] === '--units' && argv[i + 1]) out.units = new Set(argv[++i].split(',').map((s) => s.trim().toUpperCase()));
    else if (argv[i] === '--timeout' && argv[i + 1]) out.timeoutSec = Math.max(60, Number.parseInt(argv[++i], 10) || 360);
    else if (argv[i] === '--no-routing') out.includeRouting = false;
    else if (argv[i] === '--dry-run') out.dryRun = true;
  }
  return out;
}

async function main() {
  const args = parseCli(process.argv);
  if (args.dryRun) {
    console.log(JSON.stringify({ mode: 'dry-run', units: TASKS.map((t) => t.unit), routing: args.includeRouting, model: args.model }, null, 2));
    return;
  }

  const unitResults = [];
  const r4All = [];
  const r7All = [];
  const r8All = [];

  for (const item of TASKS) {
    if (args.units && !args.units.has(item.unit)) continue;
    const workDir = mkdtempSync(path.join(os.tmpdir(), `asc-u-${item.unit.toLowerCase()}-`));
    try {
      cpSync(path.join(TASKS_DIR, item.task, 'repo'), workDir, { recursive: true });
      cpSync(PLUGIN_SRC_DIR, path.join(workDir, '.agents', 'plugins', 'agentic-senior-core'), { recursive: true });
      const prompt = await fs.readFile(path.join(TASKS_DIR, item.task, 'prompt.md'), 'utf8');
      const ctx = captureBaselineHashes(item.unit, workDir);

      const raw = await runAgy(workDir, prompt, args.model, args.timeoutSec);
      const parsed = parseAgyStreamJson(raw.stdout);
      const grade = await item.grade(workDir, parsed.response, ctx);
      const r4 = item.expectsEdit ? auditR4CodeDirectory(workDir) : { unit: 'R4', passed: true, filesScanned: 0, findings: [] };
      const r7 = auditR7Transcript(parsed.toolCalls, item.expectsEdit);
      const r8 = auditR8Response(parsed.response);

      r4All.push({ target: item.unit, ...r4 });
      r7All.push({ target: item.unit, ...r7 });
      r8All.push({ target: item.unit, ...r8 });

      const row = { ...grade, exit: raw.code, durationSec: Number(parsed.durationSec.toFixed(1)), r4: r4.passed, r7: r7.passed, r8: r8.passed };
      unitResults.push(row);
      console.log(
        `[${item.unit}] passed=${row.passed} exit=${row.exit} dur=${row.durationSec}s | R4=${r4.passed}${r4.findings.length ? `(${r4.findings.join(',')})` : ''} R7=${r7.passed} R8=${r8.passed} | ${JSON.stringify(grade)}`,
      );
    } finally {
      try { rmSync(workDir, { recursive: true, force: true }); } catch { }
    }
  }

  if (args.includeRouting && (!args.units || args.units.has('S1'))) {
    const evalData = JSON.parse(await fs.readFile(path.join(REPO_ROOT, 'eval', 'routing-eval.json'), 'utf8'));
    const staticRouting = scoreRoutingTriggersDeterministically(evalData, path.join(PLUGIN_SRC_DIR, 'skills'));
    // Live agy routing check on 7 stratified prompts (1 per top-level skill including asc-pentest)
    const livePrompts = [
      { id: 'ui-02', prompt: evalData.cases.find((c) => c.id === 'ui-02').prompt, expected: 'asc-ui' },
      { id: 'test-02', prompt: evalData.cases.find((c) => c.id === 'test-02').prompt, expected: 'asc-test' },
      { id: 'ref-02', prompt: evalData.cases.find((c) => c.id === 'ref-02').prompt, expected: 'asc-reference' },
      { id: 'dev-02', prompt: evalData.cases.find((c) => c.id === 'dev-02').prompt, expected: 'asc-develop' },
      { id: 'rev-01', prompt: evalData.cases.find((c) => c.id === 'rev-01').prompt, expected: 'asc-review' },
      { id: 'meta-01', prompt: evalData.cases.find((c) => c.id === 'meta-01').prompt, expected: 'asc' },
      { id: 'pentest-01', prompt: 'Audit DAST & fuzzing endpoint API ini buat cari celah IDOR runtime.', expected: 'asc-pentest' },
    ];
    let liveHits = 0;
    const liveDetails = [];
    const routeDir = mkdtempSync(path.join(os.tmpdir(), 'asc-s1-'));
    try {
      cpSync(PLUGIN_SRC_DIR, path.join(routeDir, '.agents', 'plugins', 'agentic-senior-core'), { recursive: true });
      for (const p of livePrompts) {
        const res = await runAgy(
          routeDir,
          `Reply with ONLY the single best ASC skill name from [asc, asc-develop, asc-review, asc-test, asc-reference, asc-ui, asc-pentest] for this user request: "${p.prompt}"`,
          args.model,
          60,
        );
        const parsed = parseAgyStreamJson(res.stdout);
        const hit = new RegExp(`\\b${p.expected}\\b`, 'i').test(parsed.response);
        if (hit) liveHits++;
        liveDetails.push({ id: p.id, expected: p.expected, got: parsed.response.slice(0, 40), hit });
      }
    } finally {
      try { rmSync(routeDir, { recursive: true, force: true }); } catch { }
    }
    console.log(`[S1] static40=${staticRouting.matched}/${staticRouting.total} | live7=${liveHits}/${livePrompts.length} | details=${JSON.stringify(liveDetails)}`);
  }

  console.log(`\n[R4 Summary] passed=${r4All.filter((x) => x.passed).length}/${r4All.length}`);
  console.log(`[R7 Summary] passed=${r7All.filter((x) => x.passed).length}/${r7All.length}`);
  console.log(`[R8 Summary] passed=${r8All.filter((x) => x.passed).length}/${r8All.length}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
