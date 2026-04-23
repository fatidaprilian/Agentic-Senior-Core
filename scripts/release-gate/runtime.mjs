// @ts-check

import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { REPOSITORY_ROOT } from './constants.mjs';

export function readText(relativeFilePath) {
  const absolutePath = resolve(REPOSITORY_ROOT, relativeFilePath);
  if (!existsSync(absolutePath)) {
    return '';
  }

  return readFileSync(absolutePath, 'utf8');
}

export function pushResult(results, isPassed, checkName, details) {
  results.push({
    checkName,
    passed: isPassed,
    details,
  });
}

function parseMachineReadableReport(rawOutput) {
  if (typeof rawOutput !== 'string' || rawOutput.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(rawOutput);
  } catch {
    return null;
  }
}

export function runMachineReadableScript(scriptRelativePath, scriptArguments = []) {
  try {
    const rawOutput = execFileSync('node', [scriptRelativePath, ...scriptArguments], {
      cwd: REPOSITORY_ROOT,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    });

    return {
      report: parseMachineReadableReport(rawOutput),
      executionErrorMessage: null,
    };
  } catch (scriptExecutionError) {
    const rawOutput = scriptExecutionError && typeof scriptExecutionError === 'object' && 'stdout' in scriptExecutionError
      ? String(scriptExecutionError.stdout ?? '')
      : '';
    const parsedReport = parseMachineReadableReport(rawOutput);
    const executionErrorMessage = scriptExecutionError instanceof Error
      ? scriptExecutionError.message
      : 'Unknown execution error';

    return {
      report: parsedReport,
      executionErrorMessage,
    };
  }
}
