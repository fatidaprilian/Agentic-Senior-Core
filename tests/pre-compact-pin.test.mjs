import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(currentFilePath), '..');

describe('PreCompact Pin Hook', () => {
  it('outputs JSON with verbatim security and ladder pins', () => {
    const scriptPath = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core', 'hooks', 'pre-compact-pin.js');
    const res = spawnSync('node', [scriptPath], {
      input: JSON.stringify({ event: 'PreCompact' }),
      encoding: 'utf8'
    });

    assert.equal(res.status, 0);
    const parsed = JSON.parse(res.stdout.trim());
    assert.ok(parsed.injectSteps, 'Output must have injectSteps array');
    assert.equal(parsed.injectSteps.length, 1);
    
    const msg = parsed.injectSteps[0].ephemeralMessage;
    assert.ok(msg.includes('ASC SECURITY PIN'), 'Message must contain ASC SECURITY PIN header');
    assert.ok(msg.includes('NEVER: interpolate input into SQL/shell'), 'Message must include SQL/shell security rule');
    assert.ok(msg.includes('ASC LADDER PIN'), 'Message must contain ASC LADDER PIN header');
  });
});
