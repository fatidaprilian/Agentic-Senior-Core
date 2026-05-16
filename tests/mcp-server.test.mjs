import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildToolDefinitions } from '../scripts/mcp-server/tool-registry.mjs';
import { executeToolCall } from '../scripts/mcp-server/tools.mjs';

const serverScriptPath = join(process.cwd(), 'scripts', 'mcp-server.mjs');

function requestInitializeWithDelimiter(headerDelimiter, resolvedServerScriptPath = serverScriptPath) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(process.execPath, [resolvedServerScriptPath], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let settled = false;
    let stdoutText = '';
    let stderrText = '';

    function fail(errorMessage) {
      if (settled) {
        return;
      }

      settled = true;
      childProcess.kill();
      reject(new Error(`${errorMessage}\nSTDOUT: ${stdoutText}\nSTDERR: ${stderrText}`));
    }

    function succeed(responseText) {
      if (settled) {
        return;
      }

      settled = true;
      childProcess.kill();
      resolve(responseText);
    }

    const timeoutHandle = setTimeout(() => {
      fail('Timed out waiting for initialize response from MCP server.');
    }, 3000);

    childProcess.stdout.on('data', (chunk) => {
      stdoutText += chunk.toString('utf8');
      if (stdoutText.includes('"id":1') && stdoutText.includes('"result"')) {
        clearTimeout(timeoutHandle);
        succeed(stdoutText);
      }
    });

    childProcess.stderr.on('data', (chunk) => {
      stderrText += chunk.toString('utf8');
    });

    childProcess.on('error', (error) => {
      clearTimeout(timeoutHandle);
      fail(`Failed to start MCP server process: ${error.message}`);
    });

    childProcess.on('exit', (exitCode) => {
      if (settled) {
        return;
      }

      clearTimeout(timeoutHandle);
      fail(`MCP server exited before replying to initialize (exit code: ${exitCode}).`);
    });

    const initializePayload = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
      },
    });

    const framedMessage = `Content-Length: ${Buffer.byteLength(initializePayload, 'utf8')}${headerDelimiter}${initializePayload}`;
    childProcess.stdin.write(framedMessage);
  });
}

test('mcp-server responds to initialize using CRLF headers', async () => {
  const responseText = await requestInitializeWithDelimiter('\r\n\r\n');
  assert.match(responseText, /"id":1/);
  assert.match(responseText, /"serverInfo"/);
});

test('mcp-server responds to initialize using LF headers', async () => {
  const responseText = await requestInitializeWithDelimiter('\n\n');
  assert.match(responseText, /"id":1/);
  assert.match(responseText, /"serverInfo"/);
});

test('mcp-server initializes even when the workspace has no root package.json', async () => {
  const temporaryWorkspaceRoot = join(tmpdir(), `agentic-senior-core-mcp-no-package-${Date.now()}`);
  const temporaryScriptPath = join(temporaryWorkspaceRoot, 'scripts', 'mcp-server.mjs');

  mkdirSync(join(temporaryWorkspaceRoot, 'scripts'), { recursive: true });
  mkdirSync(join(temporaryWorkspaceRoot, '.agent-context', 'state'), { recursive: true });
  writeFileSync(temporaryScriptPath, readFileSync(serverScriptPath, 'utf8'));
  cpSync(join(process.cwd(), 'scripts', 'mcp-server'), join(temporaryWorkspaceRoot, 'scripts', 'mcp-server'), { recursive: true });

  try {
    const responseText = await requestInitializeWithDelimiter('\n\n', temporaryScriptPath);
    assert.match(responseText, /"id":1/);
    assert.match(responseText, /"version":"0.0.0-local"/);
  } finally {
    rmSync(temporaryWorkspaceRoot, { recursive: true, force: true });
  }
});

function parseToolJsonResult(result) {
  assert.equal(result.content?.[0]?.type, 'text');
  return JSON.parse(result.content[0].text);
}

test('MCP registry exposes rule lookup and compliance tools', () => {
  const toolNames = buildToolDefinitions().map((toolDefinition) => toolDefinition.name);

  assert.ok(toolNames.includes('lookup_rule'));
  assert.ok(toolNames.includes('validate_against_rules'));
  assert.ok(toolNames.includes('audit_compliance'));
});

test('lookup_rule returns a canonical rule section by ID', async () => {
  const result = await executeToolCall('lookup_rule', { ruleId: 'ARCH-003' });
  const payload = parseToolJsonResult(result);

  assert.equal(result.isError, false);
  assert.equal(payload.found, true);
  assert.equal(payload.ruleId, 'ARCH-003');
  assert.match(payload.path, /\.agent-context\/rules\/architecture\.md$/);
  assert.match(payload.content, /## ARCH-003:/);
});

test('validate_against_rules rejects unknown rule IDs clearly', async () => {
  const result = await executeToolCall('validate_against_rules', { ruleIds: ['ARCH-003', 'NOPE-999'] });
  const payload = parseToolJsonResult(result);

  assert.equal(result.isError, true);
  assert.equal(payload.passed, false);
  assert.deepEqual(payload.unknownRuleIds, ['NOPE-999']);
});

test('audit_compliance returns machine-readable JSON', async () => {
  const result = await executeToolCall('audit_compliance', { ruleIds: ['ARCH-003'], scope: 'architecture' });
  const payload = parseToolJsonResult(result);

  assert.equal(result.isError, false);
  assert.equal(payload.auditName, 'mcp-audit-compliance');
  assert.equal(payload.passed, true);
  assert.equal(payload.ruleValidation.resolvedRules[0].ruleId, 'ARCH-003');
});
