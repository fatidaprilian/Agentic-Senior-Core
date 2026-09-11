import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runAscx } from '../lib/cli/ascx/runtime.mjs';

const capture = {
    stdout: 'On branch main\nnothing to commit, working tree clean\n',
    stderr: '',
    exitCode: 0,
};

function fakeExecuteCommand() {
    return Promise.resolve({ ...capture });
}

describe('ASC_CACHE_SAFE mode', () => {
    it('emits raw output with the cache-safe footer when ASC_CACHE_SAFE=1', async () => {
        process.env.ASC_CACHE_SAFE = '1';
        try {
            const result = await runAscx(['git', 'status'], { executeCommand: fakeExecuteCommand });

            assert.equal(result.exitCode, 0);
            assert.equal(result.compressed, false);
            assert.ok(result.stdout.startsWith(capture.stdout), 'raw stdout must pass through unchanged');
            assert.ok(
                result.stdout.includes('classification: compressible (cache-safe passthrough)'),
                'footer must mark cache-safe passthrough',
            );
            assert.ok(result.stdout.includes('filter: none (cache-safe)'));
        } finally {
            delete process.env.ASC_CACHE_SAFE;
        }
    });

    it('keeps normal passthrough behavior when ASC_CACHE_SAFE is unset', async () => {
        delete process.env.ASC_CACHE_SAFE;
        const result = await runAscx(['NODE_ENV=test', 'git', 'status'], {
            executeCommand: fakeExecuteCommand,
        });

        assert.equal(result.stdout, capture.stdout);
        assert.equal(result.compressed, false);
        assert.ok(!result.stdout.includes('[ascx]'), 'no footer may be appended when the mode is off');
    });
});
