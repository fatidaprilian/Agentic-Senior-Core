import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
