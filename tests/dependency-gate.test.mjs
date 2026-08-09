import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(currentFilePath), '..');

describe('Polyglot Dependency Gate', () => {
  const gateScript = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'hooks', 'pre-tool-dependency-gate.js');

  it('hard-blocks npm install lodash command', () => {
    const payload = {
      tool_name: 'run_command',
      tool_input: { command: 'npm install lodash' }
    };
    const res = spawnSync('node', [gateScript], {
      input: JSON.stringify(payload),
      encoding: 'utf8'
    });
    assert.equal(res.status, 2, 'Should exit code 2 on hard block');
    assert.ok(res.stdout.includes('[ASC Hard-Block]'), 'Output must contain ASC Hard-Block message');
  });

  it('allows safe terminal commands', () => {
    const payload = {
      tool_name: 'run_command',
      tool_input: { command: 'ascx node --version' }
    };
    const res = spawnSync('node', [gateScript], {
      input: JSON.stringify(payload),
      encoding: 'utf8'
    });
    assert.equal(res.status, 0, 'Should exit code 0 on safe commands');
  });

  it('hard-blocks standard git commit and push commands', () => {
    const commands = ['git commit -m "feat"', 'git push origin main', 'git push --force'];
    for (const command of commands) {
      const payload = {
        tool_name: 'run_command',
        tool_input: { command }
      };
      const res = spawnSync('node', [gateScript], {
        input: JSON.stringify(payload),
        encoding: 'utf8'
      });
      assert.equal(res.status, 2, `Should exit code 2 on hard block for "${command}"`);
      assert.ok(res.stdout.includes('[ASC Hard-Block] git commit/push detected'));
    }
  });

  it('hard-blocks git commit/push with flags before subcommand (git -C, git --git-dir, git -c)', () => {
    const commands = [
      'git -C /tmp commit -m "bypass attempt"',
      'git --git-dir=.git push origin main',
      'git -c user.name=foo commit -m "msg"',
      'git --no-pager commit -m "msg"'
    ];
    for (const command of commands) {
      const payload = {
        tool_name: 'run_command',
        tool_input: { command }
      };
      const res = spawnSync('node', [gateScript], {
        input: JSON.stringify(payload),
        encoding: 'utf8'
      });
      assert.equal(res.status, 2, `Should exit code 2 on hard block for "${command}"`);
      assert.ok(res.stdout.includes('[ASC Hard-Block] git commit/push detected'));
    }
  });
});

