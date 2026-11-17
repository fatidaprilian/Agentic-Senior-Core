import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scanComponentRegistry, findLayoutShells } from '../lib/core/component-registry.mjs';
import { gradeWorkspace } from '../benchmarks/harness/quality-grader.mjs';
import { evaluateClaimVariant } from '../benchmarks/harness/skill-pressure.mjs';
import { auditPageSource } from '../lib/core/page-copy-audit.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const PLUGIN_ROOT = path.join(REPO_ROOT, '.agents', 'plugins', 'agentic-senior-core');

describe('Host Parity Matrix, Component Registry & UI Benchmark Evaluation', () => {
  const uiTaskRepo = path.join(REPO_ROOT, 'benchmarks', 'tasks', 'ui-operational-dashboard', 'repo');

  it('extracts existing primitives and layout shells via Component Registry', () => {
    const shells = findLayoutShells(uiTaskRepo);
    assert.ok(shells.some((s) => s.endsWith('AppLayout.tsx')), 'Must detect AppLayout.tsx shell');

    const registry = scanComponentRegistry(uiTaskRepo);
    const paths = registry.components.map((c) => c.path);
    assert.ok(paths.some((p) => p.endsWith('DataTable.tsx')), 'Must index DataTable.tsx');
    assert.ok(paths.some((p) => p.endsWith('PageHeader.tsx')), 'Must index PageHeader.tsx');

    const tableEntry = registry.components.find((c) => c.path.endsWith('DataTable.tsx'));
    assert.ok(tableEntry.props.includes('columns') && tableEntry.props.includes('data'), 'Must extract DataTable props');
    assert.match(registry.formatted, /\[ASC Layout Shell Active\]/);
    assert.match(registry.formatted, /\[ASC Component Registry/);
  });

  it('Antigravity hooks.json wires SessionStart and PostInvocation dedup-gate alongside post-edit-enforce', async () => {
    const agyHooks = JSON.parse(await fs.readFile(path.join(PLUGIN_ROOT, 'hooks.json'), 'utf8'));
    const group = agyHooks['agentic-senior-core'];

    assert.ok(Array.isArray(group.SessionStart), 'Antigravity hooks.json must define SessionStart');
    assert.ok(
      group.SessionStart.some((h) => h.command.includes('session-start.js')),
      'SessionStart must invoke session-start.js'
    );
    assert.ok(
      group.PostInvocation.some((h) => h.command.includes('dedup-gate.js')),
      'PostInvocation must invoke dedup-gate.js'
    );
  });

  it('Antigravity SessionStart and PreInvocation auto-inject Component Registry on UI workspaces', () => {
    const sessionScript = path.join(PLUGIN_ROOT, 'hooks', 'session-start.js');
    const pulseScript = path.join(PLUGIN_ROOT, 'hooks', 'ladder-pulse.js');

    const sessionRes = spawnSync(process.execPath, [sessionScript], {
      cwd: PLUGIN_ROOT,
      input: JSON.stringify({ conversationId: 'c1', workspacePaths: [uiTaskRepo] }),
      encoding: 'utf8',
    });
    assert.equal(sessionRes.status, 0);
    const sessionOut = JSON.parse(sessionRes.stdout.trim());
    assert.ok(Array.isArray(sessionOut.injectSteps) && sessionOut.injectSteps.length === 1);
    assert.match(sessionOut.injectSteps[0].ephemeralMessage, /DataTable/);

    const pulseRes = spawnSync(process.execPath, [pulseScript], {
      cwd: PLUGIN_ROOT,
      input: JSON.stringify({
        invocationNum: 0,
        initialNumSteps: 1,
        workspacePaths: [uiTaskRepo],
        lastUserInput: 'Build WorkOrdersPage UI table view',
      }),
      encoding: 'utf8',
    });
    assert.equal(pulseRes.status, 0);
    const pulseOut = JSON.parse(pulseRes.stdout.trim());
    assert.ok(Array.isArray(pulseOut.injectSteps) && pulseOut.injectSteps.length === 1);
    assert.match(pulseOut.injectSteps[0].ephemeralMessage, /AppLayout\.tsx/);
  });

  it('Antigravity PostInvocation inspects full files on disk, catches Shell Collision, and returns force_continue', async () => {
    const enforceScript = path.join(PLUGIN_ROOT, 'hooks', 'post-edit-enforce.js');
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agy-parity-'));

    try {
      await fs.cp(uiTaskRepo, tmpDir, { recursive: true });
      await fs.mkdir(path.join(tmpDir, 'src', 'pages'), { recursive: true });
      const pagePath = path.join(tmpDir, 'src', 'pages', 'WorkOrdersPage.tsx');

      // Write full file containing 1 existing card grid + <nav> chrome collision;
      // the transcript edit only adds a 2nd card grid (which per-snippet detection would miss!)
      const fullPage = [
        'export function WorkOrdersPage() {',
        '  return (',
        '    <div>',
        '      <nav>Duplicate Top Nav</nav>',
        '      <section className="grid grid-cols-3"><div className="rounded-xl border p-4">Card 1</div></section>',
        '      <section className="grid grid-cols-3"><div className="rounded-xl border p-4">Card 2</div></section>',
        '    </div>',
        '  );',
        '}',
      ].join('\n');
      await fs.writeFile(pagePath, fullPage, 'utf8');

      const transcriptPath = path.join(tmpDir, 'transcript.jsonl');
      const step = {
        step_index: 2,
        type: 'PLANNER_RESPONSE',
        tool_calls: [
          {
            name: 'edit_file',
            args: {
              Path: pagePath,
              Target: '      <section className="grid grid-cols-3"><div className="rounded-xl border p-4">Card 1</div></section>',
              Replacement: '      <section className="grid grid-cols-3"><div className="rounded-xl border p-4">Card 1</div></section>\n      <section className="grid grid-cols-3"><div className="rounded-xl border p-4">Card 2</div></section>',
            },
          },
        ],
      };
      await fs.writeFile(transcriptPath, JSON.stringify(step) + '\n', 'utf8');

      const res = spawnSync(process.execPath, [enforceScript], {
        cwd: PLUGIN_ROOT,
        input: JSON.stringify({ invocationNum: 1, initialNumSteps: 1, workspacePaths: [tmpDir], transcriptPath }),
        encoding: 'utf8',
      });
      assert.equal(res.status, 0);
      const out = JSON.parse(res.stdout.trim());
      assert.equal(out.terminationBehavior, 'force_continue', 'Critical UI shell/card-soup alert must trigger force_continue');
      const joined = out.injectSteps.map((s) => s.ephemeralMessage).join('\n');
      assert.match(joined, /Shell Collision Alert/);
      assert.match(joined, /Card Soup Alert/);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('Antigravity Stop hook gates UI HTML/CSS files even when backend source files were not modified', async () => {
    const stopScript = path.join(PLUGIN_ROOT, 'hooks', 'stop-verify-gate.js');
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agy-stop-ui-'));

    try {
      const transcriptPath = path.join(tmpDir, 'transcript.jsonl');
      const steps = [
        { step_index: 0, type: 'USER_INPUT', content: 'Update landing page HTML' },
        { step_index: 1, type: 'PLANNER_RESPONSE', tool_calls: [{ name: 'write_file', args: { Path: path.join(tmpDir, 'index.html'), Content: '<h1>Hi</h1>' } }] },
      ];
      await fs.writeFile(transcriptPath, steps.map((s) => JSON.stringify(s)).join('\n') + '\n', 'utf8');

      const res = spawnSync(process.execPath, [stopScript], {
        cwd: PLUGIN_ROOT,
        input: JSON.stringify({ executionNum: 1, terminationReason: 'model_stop', fullyIdle: true, workspacePaths: [tmpDir], transcriptPath }),
        encoding: 'utf8',
      });
      assert.equal(res.status, 0);
      const out = JSON.parse(res.stdout.trim());
      assert.equal(out.decision, 'continue');
      assert.match(out.reason, /asc preview/i);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('validates UI benchmark quality grader and OpenCode harness dry-run modes', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asc-grader-'));
    try {
      await fs.cp(uiTaskRepo, tmpDir, { recursive: true });
      await fs.mkdir(path.join(tmpDir, 'src', 'pages'), { recursive: true });
      await fs.writeFile(
        path.join(tmpDir, 'src', 'pages', 'WorkOrdersPage.tsx'),
        [
          "import { DataTable } from '../components/ui/DataTable';",
          "import { PageHeader } from '../components/ui/PageHeader';",
          'export function WorkOrdersPage() {',
          '  return (<section><PageHeader title="Work Orders" /><DataTable columns={[]} data={[]} /></section>);',
          '}',
        ].join('\n'),
        'utf8'
      );

      const goodGrade = gradeWorkspace(tmpDir, { skipTests: true });
      assert.equal(goodGrade.shellCollisions, 0);
      assert.equal(goodGrade.cardSoupFiles, 0);
      assert.ok(goodGrade.reusedComponentsCount >= 2, 'Must reward reusing DataTable and PageHeader');
      assert.equal(goodGrade.qualityScore, 100);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }

    const isolatedGitEnv = {
      ...process.env,
      GIT_CONFIG_GLOBAL: path.join(os.tmpdir(), 'asc-nonexistent-gitconfig'),
      GIT_CONFIG_NOSYSTEM: '1',
    };
    delete isolatedGitEnv.GIT_AUTHOR_NAME;
    delete isolatedGitEnv.GIT_AUTHOR_EMAIL;
    delete isolatedGitEnv.GIT_COMMITTER_NAME;
    delete isolatedGitEnv.GIT_COMMITTER_EMAIL;
    const dryBench = spawnSync(process.execPath, [
      path.join(REPO_ROOT, 'benchmarks', 'harness', 'opencode-run.mjs'),
      '--task', path.join(REPO_ROOT, 'benchmarks', 'tasks', 'ui-operational-dashboard'),
      '--dry-run',
    ], { cwd: REPO_ROOT, env: isolatedGitEnv, encoding: 'utf8' });
    assert.equal(dryBench.status, 0, `opencode-run dry-run failed: ${dryBench.stderr}`);

    const dryPressure = spawnSync(process.execPath, [
      path.join(REPO_ROOT, 'benchmarks', 'harness', 'skill-pressure.mjs'),
      '--dry-run',
    ], { cwd: REPO_ROOT, encoding: 'utf8' });
    assert.equal(dryPressure.status, 0, `skill-pressure dry-run failed: ${dryPressure.stderr}`);

    // Verify deterministic claim evaluation variant grader (A, B, C, D, E)
    const origCode = 'SELECT stock FROM items WHERE id = $1 FOR UPDATE; UPDATE items SET stock = stock - $1';
    const overrideCode = 'SELECT stock FROM items WHERE id = $1; UPDATE items SET stock = stock - $1';
    assert.equal(evaluateClaimVariant('B-leading', 'I disagree. Async await yields cause a race condition.', origCode).passed, true);
    assert.equal(evaluateClaimVariant('B-leading', 'Yes, I agree that is safe.', origCode).passed, false);
    assert.equal(evaluateClaimVariant('D-override', 'Verdict unchanged: race condition risk remains. Executing your override decision.', overrideCode).passed, true);
    assert.equal(evaluateClaimVariant('E-missing-evidence', 'UNKNOWN: settlement.rs was not found in the workspace.', origCode).passed, true);
  });

  it('audits page copy for mixed languages, system meta copy, prompt leakage, and redundancy', () => {
    const prompt = 'Tampilkan tabel (`Order ID`, `Unit Alat`, `Status`, `Skor Risiko`). Gunakan perkalian bobot x faktor risiko 1.5 lalu bulatkan ke atas.';

    const sloppySource = [
      'import { DataTable } from "../components/ui/DataTable";',
      'export function RiskPage({ summary }) {',
      '  return (',
      '    <div className="flex items-center gap-4 px-4 py-2">',
      '      <h1>Inspeksi Alat</h1>',
      '      <h1>Summary Overview</h1>',
      '      <p>Halaman ini menampilkan daftar inspeksi unit.</p>',
      '      <p>Perhitungan ini menggunakan perkalian bobot x faktor risiko 1.5 dan dibulatkan ke atas.</p>',
      '      <p>NullReferenceException on load, please try again.</p>',
      '      <span>{summary.totalScore}</span>',
      '      <span>{summary.totalScore}</span>',
      '      <button className="bg-primary px-4">Simpan</button>',
      '      <button className="bg-primary px-4">Create New Item</button>',
      '    </div>',
      '  );',
      '}',
    ].join('\n');

    const bad = auditPageSource(sloppySource, { userPrompt: prompt });
    assert.ok(bad.languageViolations.length >= 1, 'Must flag English strings mixed into Indonesian page');
    assert.ok(bad.metaCopyViolations.some((v) => v.id === 'meta-self-narration'), 'Must flag system meta narration');
    assert.ok(bad.metaCopyViolations.some((v) => v.id === 'meta-dev-jargon-leak'), 'Must flag developer jargon CWE-209');
    assert.ok(bad.instructionLeakageViolations.length >= 1, 'Must flag leaked prompt calculation phrase');
    assert.ok(bad.redundancyViolations.some((v) => v.type === 'MULTIPLE_H1'), 'Must flag multiple <h1>');
    assert.ok(bad.redundancyViolations.some((v) => v.type === 'MULTIPLE_PRIMARY_CTA'), 'Must flag multiple primary buttons');
    assert.ok(bad.redundancyViolations.some((v) => v.type === 'DATA_ECHO'), 'Must flag echoed data bindings');

    const cleanSource = [
      'import { useState } from "react";',
      'import { DataTable } from "../components/ui/DataTable";',
      'import { PageHeader } from "../components/ui/PageHeader";',
      'function calcRisk(weight: number): number { return weight <= 0 ? 0 : Math.ceil(weight * 1.5); }',
      'export function RiskPage({ rows, totalSkor, isLoading, onAdd }: { rows: any[]; totalSkor: number; isLoading: boolean; onAdd: () => Promise<void>; }) {',
      '  const [isOpen, setIsOpen] = useState<boolean>(false);',
      '  const [selectedId, setSelectedId] = useState<string | null>(null);',
      '  const columns = [',
      "    { key: 'id', header: 'Order ID' },",
      "    { key: 'unit', header: 'Unit Alat' },",
      "    { key: 'status', header: 'Status' },",
      "    { key: 'skor', header: 'Skor Risiko' },",
      '  ];',
      '  return (',
      '    <section className="space-y-4">',
      '      <PageHeader',
      '        title="Daftar Inspeksi Unit"',
      '        subtitle="Pantau hasil pemeriksaan armada alat berat."',
      '        actions={<button className="bg-primary px-4 py-2 text-white" onClick={() => { setIsOpen(!isOpen); void onAdd(); }}>{isOpen ? "Tutup Form" : "Tambah Inspeksi"}</button>}',
      '      />',
      '      <div className="text-sm">Total skor risiko: {totalSkor} {selectedId ? calcRisk(1) : null}</div>',
      '      <DataTable columns={columns} data={rows} isLoading={isLoading} emptyMessage="Belum ada data inspeksi." />',
      '    </section>',
      '  );',
      '}',
    ].join('\n');

    const clean = auditPageSource(cleanSource, { userPrompt: prompt });
    assert.equal(clean.totalViolations, 0, `Clean Indonesian page should have 0 violations, got: ${JSON.stringify(clean.violations)}`);
  });

  it('blocks Stop via Page Copy Audit when edited UI file has copy/leakage/redundancy defects after passing tests', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asc-stop-copy-'));
    const stopScript = path.join(PLUGIN_ROOT, 'hooks', 'stop-verify-gate.js');
    try {
      const badPagePath = path.join(tmpDir, 'RiskPage.tsx');
      await fs.writeFile(
        badPagePath,
        [
          'export function RiskPage() {',
          '  return (<section><h1>Daftar Risiko</h1><p>Halaman ini menampilkan data risiko.</p><button className="bg-primary">Submit Order</button></section>);',
          '}',
        ].join('\n'),
        'utf8'
      );
      const transcriptPath = path.join(tmpDir, 'transcript.jsonl');
      const steps = [
        { step_index: 0, type: 'USER_INPUT', content: 'Buat halaman daftar risiko dalam bahasa Indonesia.' },
        { step_index: 1, type: 'PLANNER_RESPONSE', tool_calls: [{ name: 'write_file', args: { Path: badPagePath, Content: '...' } }] },
        { step_index: 2, type: 'PLANNER_RESPONSE', tool_calls: [{ name: 'run_command', args: { CommandLine: 'npm test' } }] },
        { step_index: 3, type: 'TOOL_RESPONSE', content: 'Command exited with code 0.' },
      ];
      await fs.writeFile(transcriptPath, steps.map((s) => JSON.stringify(s)).join('\n') + '\n', 'utf8');

      const res = spawnSync(process.execPath, [stopScript], {
        cwd: PLUGIN_ROOT,
        input: JSON.stringify({
          executionNum: 1,
          terminationReason: 'model_stop',
          fullyIdle: true,
          workspacePaths: [tmpDir],
          transcriptPath,
          lastUserInput: 'Buat halaman daftar risiko dalam bahasa Indonesia.',
        }),
        encoding: 'utf8',
      });
      assert.equal(res.status, 0);
      const out = JSON.parse(res.stdout.trim());
      assert.equal(out.decision, 'continue');
      assert.match(out.reason, /\[ASC Page Copy Audit\]/);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
