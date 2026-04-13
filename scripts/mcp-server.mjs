#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_FILE_PATH), '..');
const PACKAGE_VERSION = JSON.parse(
  readFileSync(resolve(REPOSITORY_ROOT, 'package.json'), 'utf8')
).version;
const DEFAULT_PROTOCOL_VERSION = '2024-11-05';

const TEST_SUITE_ARGS = {
  full: ['--test', './tests/cli-smoke.test.mjs', './tests/llm-judge.test.mjs', './tests/enterprise-ops.test.mjs', './tests/skill-tier-gate.test.mjs'],
  cli: ['--test', './tests/cli-smoke.test.mjs'],
  enterprise: ['--test', './tests/enterprise-ops.test.mjs'],
  'llm-judge': ['--test', './tests/llm-judge.test.mjs'],
  'skill-tier': ['--test', './tests/skill-tier-gate.test.mjs'],
};

const TOOL_DEFINITIONS = [
  {
    name: 'validate',
    description: 'Run repository validation checks.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'test',
    description: 'Run test suites (full or targeted).',
    inputSchema: {
      type: 'object',
      properties: {
        suite: {
          type: 'string',
          enum: ['full', 'cli', 'enterprise', 'llm-judge', 'skill-tier'],
          description: 'Target test suite. Defaults to full.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'release_gate',
    description: 'Run release gate checks.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'forbidden_content_check',
    description: 'Run forbidden content scan used by publish gate.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
];

let incomingBuffer = Buffer.alloc(0);

function writeMessage(payload) {
  const serializedPayload = JSON.stringify(payload);
  const payloadLength = Buffer.byteLength(serializedPayload, 'utf8');
  process.stdout.write(`Content-Length: ${payloadLength}\r\n\r\n${serializedPayload}`);
}

function sendResponse(id, result) {
  writeMessage({
    jsonrpc: '2.0',
    id,
    result,
  });
}

function sendError(id, code, message, data) {
  writeMessage({
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
      data,
    },
  });
}

function normalizeToolName(rawToolName) {
  return typeof rawToolName === 'string' ? rawToolName.trim() : '';
}

function buildCommandOutput(commandLabel, commandArguments, exitCode, stdoutContent, stderrContent) {
  const outputSections = [
    `Command: node ${commandArguments.join(' ')}`,
    `Exit code: ${exitCode}`,
  ];

  if (stdoutContent.trim().length > 0) {
    outputSections.push(`STDOUT:\n${stdoutContent.trimEnd()}`);
  }

  if (stderrContent.trim().length > 0) {
    outputSections.push(`STDERR:\n${stderrContent.trimEnd()}`);
  }

  return [
    `[${commandLabel}]`,
    outputSections.join('\n\n'),
  ].join('\n\n');
}

function runNodeCommand(commandLabel, commandArguments) {
  return new Promise((resolveResult) => {
    const childProcess = spawn(process.execPath, commandArguments, {
      cwd: REPOSITORY_ROOT,
      env: process.env,
    });

    let stdoutContent = '';
    let stderrContent = '';

    childProcess.stdout.on('data', (chunk) => {
      stdoutContent += chunk.toString('utf8');
    });

    childProcess.stderr.on('data', (chunk) => {
      stderrContent += chunk.toString('utf8');
    });

    childProcess.on('error', (error) => {
      resolveResult({
        content: [
          {
            type: 'text',
            text: `[${commandLabel}] Failed to start command: ${error.message}`,
          },
        ],
        isError: true,
      });
    });

    childProcess.on('close', (exitCode) => {
      const normalizedExitCode = typeof exitCode === 'number' ? exitCode : 1;
      resolveResult({
        content: [
          {
            type: 'text',
            text: buildCommandOutput(
              commandLabel,
              commandArguments,
              normalizedExitCode,
              stdoutContent,
              stderrContent
            ),
          },
        ],
        isError: normalizedExitCode !== 0,
      });
    });
  });
}

async function executeToolCall(toolName, toolArguments = {}) {
  if (toolName === 'validate') {
    return runNodeCommand('validate', ['./scripts/validate.mjs']);
  }

  if (toolName === 'test') {
    const requestedSuite = typeof toolArguments.suite === 'string'
      ? toolArguments.suite
      : 'full';

    const selectedSuite = TEST_SUITE_ARGS[requestedSuite] ? requestedSuite : 'full';
    return runNodeCommand(`test:${selectedSuite}`, TEST_SUITE_ARGS[selectedSuite]);
  }

  if (toolName === 'release_gate') {
    return runNodeCommand('release_gate', ['./scripts/release-gate.mjs']);
  }

  if (toolName === 'forbidden_content_check') {
    return runNodeCommand('forbidden_content_check', ['./scripts/forbidden-content-check.mjs']);
  }

  return {
    content: [
      {
        type: 'text',
        text: `Unknown tool: ${toolName}`,
      },
    ],
    isError: true,
  };
}

async function handleRequest(requestMessage) {
  const requestId = requestMessage.id;
  const requestMethod = requestMessage.method;
  const requestParams = requestMessage.params || {};

  if (typeof requestMethod !== 'string') {
    if (typeof requestId !== 'undefined') {
      sendError(requestId, -32600, 'Invalid Request');
    }
    return;
  }

  if (requestMethod === 'initialize') {
    const negotiatedProtocolVersion = typeof requestParams.protocolVersion === 'string'
      ? requestParams.protocolVersion
      : DEFAULT_PROTOCOL_VERSION;

    sendResponse(requestId, {
      protocolVersion: negotiatedProtocolVersion,
      capabilities: {
        tools: {
          listChanged: false,
        },
      },
      serverInfo: {
        name: 'agentic-senior-core',
        version: PACKAGE_VERSION,
      },
    });
    return;
  }

  if (requestMethod === 'notifications/initialized') {
    return;
  }

  if (requestMethod === 'ping') {
    if (typeof requestId !== 'undefined') {
      sendResponse(requestId, {});
    }
    return;
  }

  if (requestMethod === 'tools/list') {
    sendResponse(requestId, {
      tools: TOOL_DEFINITIONS,
    });
    return;
  }

  if (requestMethod === 'tools/call') {
    const requestedToolName = normalizeToolName(requestParams.name);

    if (!requestedToolName) {
      sendError(requestId, -32602, 'Invalid params: tool name is required');
      return;
    }

    const toolResult = await executeToolCall(requestedToolName, requestParams.arguments || {});
    sendResponse(requestId, toolResult);
    return;
  }

  if (typeof requestId !== 'undefined') {
    sendError(requestId, -32601, `Method not found: ${requestMethod}`);
  }
}

function readNextFramedMessage() {
  const headerEndIndex = incomingBuffer.indexOf('\r\n\r\n');
  if (headerEndIndex === -1) {
    return null;
  }

  const rawHeader = incomingBuffer.slice(0, headerEndIndex).toString('utf8');
  const headerLines = rawHeader.split('\r\n');
  let contentLength = null;

  for (const headerLine of headerLines) {
    const separatorIndex = headerLine.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const headerName = headerLine.slice(0, separatorIndex).trim().toLowerCase();
    const headerValue = headerLine.slice(separatorIndex + 1).trim();

    if (headerName === 'content-length') {
      contentLength = Number.parseInt(headerValue, 10);
      break;
    }
  }

  if (!Number.isFinite(contentLength) || contentLength < 0) {
    incomingBuffer = Buffer.alloc(0);
    return null;
  }

  const bodyStartIndex = headerEndIndex + 4;
  const frameEndIndex = bodyStartIndex + contentLength;

  if (incomingBuffer.length < frameEndIndex) {
    return null;
  }

  const rawMessage = incomingBuffer.slice(bodyStartIndex, frameEndIndex).toString('utf8');
  incomingBuffer = incomingBuffer.slice(frameEndIndex);
  return rawMessage;
}

function processIncomingBuffer() {
  while (true) {
    const framedMessage = readNextFramedMessage();
    if (framedMessage === null) {
      return;
    }

    let parsedRequest;
    try {
      parsedRequest = JSON.parse(framedMessage);
    } catch {
      continue;
    }

    Promise.resolve(handleRequest(parsedRequest)).catch((error) => {
      if (typeof parsedRequest?.id !== 'undefined') {
        sendError(parsedRequest.id, -32603, 'Internal error', String(error?.message || error));
      }
    });
  }
}

process.stdin.on('data', (chunk) => {
  incomingBuffer = Buffer.concat([incomingBuffer, chunk]);
  processIncomingBuffer();
});

process.stdin.on('end', () => {
  process.exit(0);
});

process.on('SIGINT', () => {
  process.exit(0);
});
