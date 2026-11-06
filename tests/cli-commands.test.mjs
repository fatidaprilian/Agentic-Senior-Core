import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import {
  prepareSpawnInvocation,
  escapeCmdArg,
  buildAugmentedEnvironment,
} from '../lib/cli/ascx/windows-spawn.mjs';
import { scanCodeClones } from '../lib/cli/commands/dedup.mjs';
import { runBootstrapCommand } from '../lib/cli/commands/bootstrap.mjs';
import { detectInstalledGlobalTargets } from '../lib/cli/commands/global.mjs';

const execFileAsync = promisify(execFile);
const currentFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(currentFilePath), '..');

describe('Cross-Platform Spawn & Windows Shim Resolution (windows-spawn.mjs)', () => {
  it('routes asc and ascx directly to process.execPath without shell overhead', () => {
    const ascInvoke = prepareSpawnInvocation({
      executable: 'asc',
      args: ['dedup', '--json'],
      environment: {},
    });
    assert.equal(ascInvoke.command, process.execPath);
    assert.ok(ascInvoke.args[0].endsWith('agentic-senior-core.js'));
    assert.deepEqual(ascInvoke.args.slice(1), ['dedup', '--json']);
    assert.equal(ascInvoke.options.shell, false);

    const ascxInvoke = prepareSpawnInvocation({
      executable: 'ascx',
      args: ['git', 'status'],
      environment: {},
    });
    assert.equal(ascxInvoke.command, process.execPath);
    assert.ok(ascxInvoke.args[0].endsWith('ascx.js'));
    assert.equal(ascxInvoke.options.shell, false);
  });

  it('omits args array when shell: true is requested to avoid Node DEP0190 warning', () => {
    const shellInvoke = prepareSpawnInvocation(
      { executable: 'git', args: ['log', '-n', '5'], environment: {} },
      { shell: true },
    );
    assert.equal(shellInvoke.options.shell, true);
    assert.equal(shellInvoke.args, undefined);
    assert.equal(shellInvoke.command, 'git log -n 5');
  });

  it('escapes batch metacharacters and % expansion in escapeCmdArg', () => {
    assert.equal(escapeCmdArg('plain-arg'), 'plain-arg');
    assert.equal(escapeCmdArg(''), '""');
    assert.equal(escapeCmdArg('%TEMP%\\payload'), '%%TEMP%%\\payload');
    assert.equal(escapeCmdArg('a & calc.exe'), '"a & calc.exe"');
  });

  it('prepends local node_modules/.bin without duplicating Windows Path key', async () => {
    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'asc-env-test-'));
    try {
      const binDir = path.join(tmpRoot, 'node_modules', '.bin');
      await fs.mkdir(binDir, { recursive: true });

      const baseEnv = { Path: `C:\\Windows\\System32` };
      const augmented = buildAugmentedEnvironment(baseEnv, { FOO: 'bar' }, tmpRoot);
      const pathKeys = Object.keys(augmented).filter(k => k.toLowerCase() === 'path');

      assert.equal(pathKeys.length, 1, 'Must preserve single case-insensitive Path key');
      assert.ok(augmented[pathKeys[0]].startsWith(binDir));
      assert.equal(augmented.FOO, 'bar');
    } finally {
      await fs.rm(tmpRoot, { recursive: true, force: true });
    }
  });

  it('executes asc --version through bin/ascx.js with zero stderr warnings', async () => {
    const ascxBin = path.join(repositoryRoot, 'bin', 'ascx.js');
    const { stdout, stderr } = await execFileAsync(process.execPath, [ascxBin, 'asc', '--version'], {
      cwd: repositoryRoot,
    });
    assert.match(stdout.trim(), /^\d+\.\d+\.\d+/);
    assert.equal(stderr, '', 'Must emit zero DEP0190 or spawn warnings');
  });
});

describe('Structural Clone Scanner (asc dedup)', () => {
  const sampleBlock = [
    'export function computeWeightedDomainTotal(rows, factor) {',
    '  let weightedTotal = 0;',
    '  let verifiedCount = 0;',
    '  for (let i = 0; i < rows.length; i++) {',
    '    const item = rows[i];',
    '    if (!item || typeof item.score !== "number") continue;',
    '    const adjusted = Math.round(item.score * item.weight * factor);',
    '    weightedTotal += adjusted;',
    '    if (item.status === "verified") {',
    '      verifiedCount += 1;',
    '    }',
    '  }',
    '  return { weightedTotal, verifiedCount };',
    '}',
  ].join('\n');

  it('flags 3x identical blocks as Rule-of-Three violations and 2x blocks as advisory', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asc-dedup-test-'));
    try {
      await fs.writeFile(path.join(tmpDir, 'alpha.js'), sampleBlock, 'utf8');
      await fs.writeFile(path.join(tmpDir, 'beta.js'), sampleBlock, 'utf8');

      const twoCopyReport = scanCodeClones(tmpDir, { cwd: tmpDir, minLines: 10, minTokens: 30 });
      assert.equal(twoCopyReport.clusters.length, 1);
      assert.equal(twoCopyReport.clusters[0].instances, 2);
      assert.equal(twoCopyReport.clusters[0].ruleOfThreeViolation, false);

      await fs.writeFile(path.join(tmpDir, 'gamma.js'), sampleBlock, 'utf8');
      const threeCopyReport = scanCodeClones(tmpDir, { cwd: tmpDir, minLines: 10, minTokens: 30 });
      assert.equal(threeCopyReport.clusters.length, 1);
      assert.equal(threeCopyReport.clusters[0].instances, 3);
      assert.equal(threeCopyReport.clusters[0].ruleOfThreeViolation, true);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('honors asc-dedup:ignore directives and framework-conventional route filenames', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asc-dedup-exempt-'));
    try {
      const routeA = path.join(tmpDir, 'app', 'billing');
      const routeB = path.join(tmpDir, 'app', 'settings');
      await fs.mkdir(routeA, { recursive: true });
      await fs.mkdir(routeB, { recursive: true });

      await fs.writeFile(path.join(routeA, 'page.tsx'), sampleBlock, 'utf8');
      await fs.writeFile(path.join(routeB, 'page.tsx'), sampleBlock, 'utf8');
      await fs.writeFile(
        path.join(tmpDir, 'ignored.js'),
        `// asc-dedup:ignore -- intentional protocol adapter copy\n${sampleBlock}`,
        'utf8',
      );

      const report = scanCodeClones(tmpDir, { cwd: tmpDir, minLines: 10, minTokens: 30 });
      assert.equal(report.clusters.length, 0, 'Conventional page.tsx pairs and ignored files must not trigger clones');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('CLI Subcommands (bootstrap & global auto-detect)', () => {
  it('seeds recommended anti-slop preferences via runBootstrapCommand', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'asc-bootstrap-test-'));
    const originalCwd = process.cwd();
    try {
      process.chdir(tmpDir);
      await runBootstrapCommand(['--recommended']);
      const prefPath = path.join(tmpDir, '.agents', 'adaptive_preferences.json');
      const raw = await fs.readFile(prefPath, 'utf8');
      const parsed = JSON.parse(raw);
      const rules = Array.isArray(parsed) ? parsed : parsed.rules;
      assert.ok(Array.isArray(rules) && rules.length >= 10, 'Must seed recommended anti-slop rules');
    } finally {
      process.chdir(originalCwd);
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('returns an array of valid target keys from detectInstalledGlobalTargets', async () => {
    const detected = await detectInstalledGlobalTargets();
    assert.ok(Array.isArray(detected));
    for (const key of detected) {
      assert.equal(typeof key, 'string');
      assert.ok(key.length > 0);
    }
  });
});

