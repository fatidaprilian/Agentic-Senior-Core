import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const cliPath = join(process.cwd(), 'bin', 'agentic-senior-core.js');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export {
  assert,
  cliPath,
  createHash,
  execSync,
  existsSync,
  join,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readJson,
  rmSync,
  tmpdir,
  writeFileSync,
};
