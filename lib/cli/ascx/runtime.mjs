import { spawn } from 'node:child_process';

import { compressGitStatusOutput } from './adapters/git-status.mjs';
import { compressNpmTestOutput } from './adapters/npm-test.mjs';
import { buildAscxFooter, shouldWriteSafetyTee } from './formatter.mjs';
import { classifyAscxInvocation, parseAscxCommand } from './lexer.mjs';
import { writeRawTeeFile } from './tee-writer.mjs';

const ADAPTERS = {
  'git-status': compressGitStatusOutput,
  'npm-test': compressNpmTestOutput,
};

function buildCommandEnvironment(baseEnvironment, parsedCommand) {
  const commandEnvironment = { ...baseEnvironment };

  for (const assignment of parsedCommand.environment) {
    const separatorIndex = assignment.indexOf('=');
    const variableName = assignment.slice(0, separatorIndex);
    const variableValue = assignment.slice(separatorIndex + 1);

    commandEnvironment[variableName] = variableValue;
  }

  return commandEnvironment;
}

function runSpawnedCommand(parsedCommand, options = {}) {
  const {
    cwd = process.cwd(),
    env = process.env,
    shell = false,
  } = options;

  return new Promise((resolve) => {
    const useWindowsNpmShell = process.platform === 'win32'
      && parsedCommand.executable === 'npm'
      && shell === false;
    const executable = shell
      ? parsedCommand.commandText
      : parsedCommand.executable;
    const args = shell ? [] : parsedCommand.args;
    const childProcess = spawn(executable, args, {
      cwd,
      env: buildCommandEnvironment(env, parsedCommand),
      shell: shell || useWindowsNpmShell,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';

    childProcess.stdout?.setEncoding('utf8');
    childProcess.stderr?.setEncoding('utf8');
    childProcess.stdout?.on('data', (chunk) => {
      stdout += chunk;
    });
    childProcess.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });
    childProcess.on('error', (error) => {
      stderr += `${error.name}: ${error.message}\n`;
    });
    childProcess.on('close', (exitCode) => {
      resolve({
        stdout,
        stderr,
        exitCode: typeof exitCode === 'number' ? exitCode : 1,
      });
    });
  });
}

function combineOutput(stdout, stderr) {
  return [stdout, stderr].filter(Boolean).join('\n');
}

async function formatCompressedResult({
  adapterResult,
  capture,
  classification,
  commandText,
  cwd,
  teeDirectoryPath,
}) {
  const rawOutput = combineOutput(capture.stdout, capture.stderr);
  const preliminaryFooter = buildAscxFooter({
    classification: classification.kind,
    commandText,
    compactOutput: adapterResult.output,
    exitCode: capture.exitCode,
    filterName: adapterResult.filterName,
    rawOutput,
    rawTeePath: null,
  });
  const rawTeePath = shouldWriteSafetyTee({
    adapterResult,
    exitCode: capture.exitCode,
    reductionPercent: preliminaryFooter.reductionPercent,
  })
    ? await writeRawTeeFile({
      commandText,
      cwd,
      exitCode: capture.exitCode,
      rawOutput,
      teeDirectoryPath,
    })
    : null;
  const footer = buildAscxFooter({
    classification: classification.kind,
    commandText,
    compactOutput: adapterResult.output,
    exitCode: capture.exitCode,
    filterName: adapterResult.filterName,
    rawOutput,
    rawTeePath,
  });

  return {
    stdout: `${adapterResult.output}\n\n${footer.text}\n`,
    stderr: '',
    exitCode: capture.exitCode,
    compressed: adapterResult.confident === true,
    rawTeePath,
    footer,
    adapterResult,
  };
}

export async function runAscx(commandArguments, options = {}) {
  const {
    cwd = process.cwd(),
    executeCommand = runSpawnedCommand,
    teeDirectoryPath,
  } = options;
  const parsedCommand = parseAscxCommand(commandArguments);
  const classification = classifyAscxInvocation(parsedCommand);

  if (!parsedCommand.executable) {
    return {
      stdout: '',
      stderr: 'ascx: command is required\n',
      exitCode: 1,
      parsedCommand,
      classification,
      compressed: false,
      rawTeePath: null,
    };
  }

  const capture = await executeCommand(parsedCommand, {
    cwd,
    shell: classification.kind === 'unsafe-for-compression',
  });

  if (classification.kind !== 'compressible') {
    return {
      stdout: capture.stdout,
      stderr: capture.stderr,
      exitCode: capture.exitCode,
      parsedCommand,
      classification,
      compressed: false,
      rawTeePath: null,
    };
  }

  const adapter = ADAPTERS[classification.adapterName];
  const adapterResult = adapter({
    stdout: capture.stdout,
    stderr: capture.stderr,
    exitCode: capture.exitCode,
  });

  return {
    ...await formatCompressedResult({
      adapterResult,
      capture,
      classification,
      commandText: parsedCommand.commandText,
      cwd,
      teeDirectoryPath,
    }),
    parsedCommand,
    classification,
  };
}
