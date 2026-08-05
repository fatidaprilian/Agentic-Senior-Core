import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';

import { getDefaultTeeDirectory } from '../lib/cli/ascx/tee-writer.mjs';

describe('Tee Writer Defaults', () => {
  it('always resolves to global user home directory (~/.asc/state/token-saver/tee)', () => {
    const defaultDir = getDefaultTeeDirectory();
    const expectedDir = path.join(os.homedir(), '.asc', 'state', 'token-saver', 'tee');
    assert.equal(defaultDir, expectedDir);
  });
});
