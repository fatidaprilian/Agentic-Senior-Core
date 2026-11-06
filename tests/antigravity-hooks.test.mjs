import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(currentFilePath), '..');
const pluginRoot = path.join(repositoryRoot, '.agents', 'plugins', 'agentic-senior-core');

const VALID_AGY_EVENTS = new Set([
  'enabled',
  'SessionStart',
  'PreToolUse',
  'PostToolUse',
  'PreInvocation',
  'PostInvocation',
  'Stop',
]);
const FLAT_AGY_EVENTS = new Set(['SessionStart', 'PreInvocation', 'PostInvocation', 'Stop']);
const GROUPED_AGY_EVENTS = new Set(['PreToolUse', 'PostToolUse']);
const VALID_HANDLER_KEYS = new Set(['type', 'command', 'timeout']);

describe('Antigravity Hooks Schema & Runtime Contracts', () => {
  it('enforces strict Antigravity protojson schema in plugin hooks.json and resolves scripts from plugin cwd', async () => {
    const raw = await fs.readFile(path.join(pluginRoot, 'hooks.json'), 'utf8');
    const parsed = JSON.parse(raw);

    assert.ok(!('hooks' in parsed), 'Top-level key must be hook group name, not Claude "hooks" wrapper');
    const groupNames = Object.keys(parsed);
    assert.ok(groupNames.length > 0, 'Must declare at least one hook group');

    for (const groupName of groupNames) {
      const spec = parsed[groupName];
      for (const [eventKey, eventVal] of Object.entries(spec)) {
        assert.ok(VALID_AGY_EVENTS.has(eventKey), `Unsupported Antigravity hook field: ${eventKey}`);
        assert.notEqual(eventVal, null, `Hook field ${eventKey} must not be null`);

        if (FLAT_AGY_EVENTS.has(eventKey)) {
          assert.ok(Array.isArray(eventVal), `${eventKey} must be a flat array of handlers`);
          for (const handler of eventVal) {
            assert.ok(!('matcher' in handler) && !('hooks' in handler), `${eventKey} must not wrap handlers in matcher/hooks`);
            for (const hKey of Object.keys(handler)) {
              assert.ok(VALID_HANDLER_KEYS.has(hKey), `Invalid handler key "${hKey}" in ${eventKey}`);
            }
            const scriptRel = handler.command.replace(/^node\s+/, '').trim();
            await fs.access(path.join(pluginRoot, scriptRel));
          }
        }

        if (GROUPED_AGY_EVENTS.has(eventKey)) {
          assert.ok(Array.isArray(eventVal), `${eventKey} must be an array of matcher groups`);
          for (const group of eventVal) {
            assert.equal(typeof group.matcher, 'string', `${eventKey} group must define string matcher`);
            assert.ok(Array.isArray(group.hooks), `${eventKey} group must define hooks array`);
            for (const handler of group.hooks) {
              for (const hKey of Object.keys(handler)) {
                assert.ok(VALID_HANDLER_KEYS.has(hKey), `Invalid handler key "${hKey}" in ${eventKey}`);
              }
              const scriptRel = handler.command.replace(/^node\s+/, '').trim();
              await fs.access(path.join(pluginRoot, scriptRel));
            }
          }
        }
      }
    }
  });

  it('PreToolUse returns {"decision":"allow"} with exit 0 on safe commands from plugin cwd', () => {
    const gateScript = path.join(pluginRoot, 'hooks', 'pre-tool-dependency-gate.js');
    const payload = {
      toolCall: {
        name: 'run_command',
        args: { CommandLine: 'ascx npm test', Cwd: repositoryRoot, WaitMsBeforeAsync: 5000 },
      },
      stepIdx: 3,
      conversationId: 'test-conv',
      workspacePaths: [repositoryRoot],
      transcriptPath: path.join(os.tmpdir(), 'nonexistent-transcript.jsonl'),
      modelName: 'gemini-3-pro',
    };

    const res = spawnSync(process.execPath, [gateScript], {
      cwd: pluginRoot,
      input: JSON.stringify(payload),
      encoding: 'utf8',
    });

    assert.equal(res.status, 0);
    const out = JSON.parse(res.stdout.trim());
    assert.equal(out.decision, 'allow');
  });

  it('PreToolUse returns {"decision":"deny"} with exit 0 on redundant deps & honors workspacePaths[0] allowlist', async () => {
    const gateScript = path.join(pluginRoot, 'hooks', 'pre-tool-dependency-gate.js');
    const tmpWorkspace = await fs.mkdtemp(path.join(os.tmpdir(), 'agy-ws-allowlist-'));

    try {
      // 1. Without allowlist -> deny on edit_file to package.json
      const denyPayload = {
        toolCall: {
          name: 'edit_file',
          args: {
            Path: path.join(tmpWorkspace, 'package.json'),
            Target: '"dependencies": {}',
            Replacement: '"dependencies": { "left-pad": "^1.3.0" }',
          },
        },
        stepIdx: 4,
        workspacePaths: [tmpWorkspace],
        transcriptPath: path.join(tmpWorkspace, 'transcript.jsonl'),
      };

      const denyRes = spawnSync(process.execPath, [gateScript], {
        cwd: pluginRoot,
        input: JSON.stringify(denyPayload),
        encoding: 'utf8',
      });
      assert.equal(denyRes.status, 0, 'Antigravity hook must exit 0 even when denying');
      const denyOut = JSON.parse(denyRes.stdout.trim());
      assert.equal(denyOut.decision, 'deny');
      assert.match(denyOut.reason, /left-pad/);

      // 2. With allowlist inside workspacePaths[0]/.asc/dependency-allowlist.json -> allow
      await fs.mkdir(path.join(tmpWorkspace, '.asc'), { recursive: true });
      await fs.writeFile(
        path.join(tmpWorkspace, '.asc', 'dependency-allowlist.json'),
        JSON.stringify({ allowedDependencies: ['left-pad'] }),
        'utf8'
      );

      const allowRes = spawnSync(process.execPath, [gateScript], {
        cwd: pluginRoot,
        input: JSON.stringify(denyPayload),
        encoding: 'utf8',
      });
      assert.equal(allowRes.status, 0);
      const allowOut = JSON.parse(allowRes.stdout.trim());
      assert.equal(allowOut.decision, 'allow');
    } finally {
      await fs.rm(tmpWorkspace, { recursive: true, force: true });
    }
  });

  it('PreToolUse returns {"decision":"force_ask"} with exit 0 on git commit/push in Antigravity', () => {
    const gateScript = path.join(pluginRoot, 'hooks', 'pre-tool-dependency-gate.js');
    const payload = {
      toolCall: {
        name: 'run_command',
        args: { CommandLine: 'ascx git commit -m "chore: test"' },
      },
      stepIdx: 5,
      workspacePaths: [repositoryRoot],
      transcriptPath: path.join(os.tmpdir(), 'transcript.jsonl'),
    };

    const res = spawnSync(process.execPath, [gateScript], {
      cwd: pluginRoot,
      input: JSON.stringify(payload),
      encoding: 'utf8',
    });
    assert.equal(res.status, 0);
    const out = JSON.parse(res.stdout.trim());
    assert.equal(out.decision, 'force_ask');
    assert.match(out.reason, /git commit\/push/);
  });

  it('PreInvocation ladder-pulse emits {} at invocation 0 and injectSteps at pulse interval', () => {
    const pulseScript = path.join(pluginRoot, 'hooks', 'ladder-pulse.js');

    const res0 = spawnSync(process.execPath, [pulseScript], {
      cwd: pluginRoot,
      input: JSON.stringify({ invocationNum: 0, initialNumSteps: 1, workspacePaths: [repositoryRoot] }),
      encoding: 'utf8',
    });
    assert.equal(res0.status, 0);
    assert.deepEqual(JSON.parse(res0.stdout.trim()), {});

    const res3 = spawnSync(process.execPath, [pulseScript], {
      cwd: pluginRoot,
      input: JSON.stringify({ invocationNum: 3, initialNumSteps: 12, workspacePaths: [repositoryRoot] }),
      encoding: 'utf8',
    });
    assert.equal(res3.status, 0);
    const out3 = JSON.parse(res3.stdout.trim());
    assert.ok(Array.isArray(out3.injectSteps) && out3.injectSteps.length === 1);
    assert.match(out3.injectSteps[0].ephemeralMessage, /ASC LADDER PULSE/);
  });

  it('PostInvocation post-edit-enforce inspects edit_file & write_file in transcript and emits injectSteps', async () => {
    const enforceScript = path.join(pluginRoot, 'hooks', 'post-edit-enforce.js');
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agy-post-inv-'));

    try {
      const transcriptPath = path.join(tmpDir, 'transcript.jsonl');
      const stepEntry = {
        step_index: 4,
        type: 'PLANNER_RESPONSE',
        tool_calls: [
          {
            name: 'edit_file',
            args: {
              Path: path.join(tmpDir, 'Card.tsx'),
              Target: '<div className="border p-4">Hello</div>',
              Replacement: '<div className="transition-all from-purple-500 to-blue-500 p-4">Hello</div>',
            },
          },
        ],
      };
      await fs.writeFile(transcriptPath, JSON.stringify(stepEntry) + '\n', 'utf8');

      const res = spawnSync(process.execPath, [enforceScript], {
        cwd: pluginRoot,
        input: JSON.stringify({
          invocationNum: 1,
          initialNumSteps: 2,
          workspacePaths: [tmpDir],
          transcriptPath,
        }),
        encoding: 'utf8',
      });

      assert.equal(res.status, 0);
      const out = JSON.parse(res.stdout.trim());
      assert.ok(Array.isArray(out.injectSteps) && out.injectSteps.length > 0, 'Must inject UI slop findings');
      assert.match(out.injectSteps[0].ephemeralMessage, /ASC UI Note/);

      // Also verify PostToolUse contract returns strictly {}
      const postToolRes = spawnSync(process.execPath, [enforceScript], {
        cwd: pluginRoot,
        input: JSON.stringify({
          toolCall: { name: 'edit_file', args: { Path: 'Card.tsx' } },
          stepIdx: 4,
          workspacePaths: [tmpDir],
          transcriptPath,
        }),
        encoding: 'utf8',
      });
      assert.equal(postToolRes.status, 0);
      assert.deepEqual(JSON.parse(postToolRes.stdout.trim()), {});
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('PostInvocation detects structural Card Soup (>= 3 card grid sections) and blind bug edits without repro', async () => {
    const enforceScript = path.join(pluginRoot, 'hooks', 'post-edit-enforce.js');
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agy-cardsoup-'));

    try {
      const transcriptPath = path.join(tmpDir, 'transcript.jsonl');
      const cardSoupPage = [
        '<main>',
        '  <section className="grid grid-cols-4 gap-4"><div className="rounded-xl border p-6">A</div></section>',
        '  <section className="grid grid-cols-3 gap-6"><div className="rounded-2xl border p-5">B</div></section>',
        '  <section className="grid grid-cols-3 gap-6"><div className="rounded-xl border p-6">C</div></section>',
        '</main>',
      ].join('\n');

      const steps = [
        {
          step_index: 1,
          type: 'PLANNER_RESPONSE',
          tool_calls: [
            { name: 'write_file', args: { Path: path.join(tmpDir, 'LandingPage.tsx'), Content: cardSoupPage } },
            { name: 'edit_file', args: { Path: path.join(tmpDir, 'service.ts'), Target: 'a', Replacement: 'b' } },
          ],
        },
      ];
      await fs.writeFile(transcriptPath, steps.map(s => JSON.stringify(s)).join('\n') + '\n', 'utf8');

      const res = spawnSync(process.execPath, [enforceScript], {
        cwd: pluginRoot,
        input: JSON.stringify({
          invocationNum: 1,
          initialNumSteps: 0,
          workspacePaths: [tmpDir],
          transcriptPath,
          lastUserInput: 'Fix this bug where login throws 500 error',
        }),
        encoding: 'utf8',
      });

      assert.equal(res.status, 0);
      const out = JSON.parse(res.stdout.trim());
      assert.ok(Array.isArray(out.injectSteps) && out.injectSteps.length > 0);
      const combined = out.injectSteps.map(s => s.ephemeralMessage).join('\n');
      assert.match(combined, /Card Soup/i);
      assert.match(combined, /Systematic Debugging/i);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('Antigravity Stop hook enforces verification after source edits while respecting fullyIdle and executionNum', async () => {
    const stopScript = path.join(pluginRoot, 'hooks', 'stop-verify-gate.js');
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agy-stop-'));

    try {
      const transcriptPath = path.join(tmpDir, 'transcript.jsonl');

      // 1. Source file edited after USER_INPUT with NO run_command afterward -> continue
      const unverifiedTranscript = [
        { step_index: 0, type: 'USER_INPUT', content: 'Implement feature X' },
        {
          step_index: 1,
          type: 'PLANNER_RESPONSE',
          tool_calls: [
            { name: 'edit_file', args: { Path: path.join(tmpDir, 'index.ts'), Target: 'old', Replacement: 'new' } },
          ],
        },
      ];
      await fs.writeFile(transcriptPath, unverifiedTranscript.map(s => JSON.stringify(s)).join('\n') + '\n', 'utf8');

      const blockRes = spawnSync(process.execPath, [stopScript], {
        cwd: pluginRoot,
        input: JSON.stringify({
          executionNum: 1,
          terminationReason: 'model_stop',
          error: '',
          fullyIdle: true,
          workspacePaths: [tmpDir],
          transcriptPath,
        }),
        encoding: 'utf8',
      });
      assert.equal(blockRes.status, 0);
      const blockOut = JSON.parse(blockRes.stdout.trim());
      assert.equal(blockOut.decision, 'continue');
      assert.match(blockOut.reason, /Verification Gate/i);

      // 2. When fullyIdle is false (waiting on async background task), MUST allow stop
      const asyncRes = spawnSync(process.execPath, [stopScript], {
        cwd: pluginRoot,
        input: JSON.stringify({
          executionNum: 1,
          terminationReason: 'model_stop',
          error: '',
          fullyIdle: false,
          workspacePaths: [tmpDir],
          transcriptPath,
        }),
        encoding: 'utf8',
      });
      assert.equal(JSON.parse(asyncRes.stdout.trim()).decision, 'allow');

      // 3. When executionNum >= 2 (prevent infinite loop), MUST allow stop
      const loopGuardRes = spawnSync(process.execPath, [stopScript], {
        cwd: pluginRoot,
        input: JSON.stringify({
          executionNum: 2,
          terminationReason: 'model_stop',
          error: '',
          fullyIdle: true,
          workspacePaths: [tmpDir],
          transcriptPath,
        }),
        encoding: 'utf8',
      });
      assert.equal(JSON.parse(loopGuardRes.stdout.trim()).decision, 'allow');

      // 4. Source file edited AND followed by run_command -> allow stop
      const verifiedTranscript = [
        ...unverifiedTranscript,
        {
          step_index: 2,
          type: 'PLANNER_RESPONSE',
          tool_calls: [
            { name: 'run_command', args: { CommandLine: 'ascx npm test' } },
          ],
        },
      ];
      await fs.writeFile(transcriptPath, verifiedTranscript.map(s => JSON.stringify(s)).join('\n') + '\n', 'utf8');

      const allowRes = spawnSync(process.execPath, [stopScript], {
        cwd: pluginRoot,
        input: JSON.stringify({
          executionNum: 1,
          terminationReason: 'model_stop',
          error: '',
          fullyIdle: true,
          workspacePaths: [tmpDir],
          transcriptPath,
        }),
        encoding: 'utf8',
      });
      assert.equal(JSON.parse(allowRes.stdout.trim()).decision, 'allow');
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});

