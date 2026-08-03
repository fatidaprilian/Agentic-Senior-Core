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
});
