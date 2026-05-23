const SHELL_OPERATOR_TOKENS = new Set([
  '|',
  '||',
  '&',
  '&&',
  ';',
  '>',
  '>>',
  '<',
  '2>',
  '2>>',
]);

function isEnvironmentAssignment(argumentValue) {
  return /^[A-Za-z_][A-Za-z0-9_]*=.+$/u.test(argumentValue);
}

function hasCommandSubstitution(argumentValue) {
  return argumentValue.includes('$(') || argumentValue.includes('`');
}

function hasRedirectToken(argumentValue) {
  return /^(?:[12]?>|[12]?>>|<)/u.test(argumentValue);
}

export function parseAscxCommand(commandArguments = []) {
  const rawArguments = commandArguments.map((argumentValue) => String(argumentValue));
  const unsafeTokens = rawArguments.filter((argumentValue) => {
    return SHELL_OPERATOR_TOKENS.has(argumentValue)
      || hasCommandSubstitution(argumentValue)
      || hasRedirectToken(argumentValue);
  });
  const environment = [];
  let executableIndex = 0;

  while (
    executableIndex < rawArguments.length
    && isEnvironmentAssignment(rawArguments[executableIndex])
  ) {
    environment.push(rawArguments[executableIndex]);
    executableIndex += 1;
  }

  const executable = rawArguments[executableIndex] || '';
  const args = executable ? rawArguments.slice(executableIndex + 1) : [];

  return {
    rawArguments,
    commandText: rawArguments.join(' '),
    environment,
    executable,
    args,
    unsafeTokens,
    hasShellSyntax: unsafeTokens.length > 0,
    hasEnvironmentPrefix: environment.length > 0,
  };
}

export function classifyAscxInvocation(parsedCommand) {
  if (!parsedCommand.executable) {
    return {
      kind: 'passthrough',
      adapterName: null,
      reason: 'missing executable',
    };
  }

  if (parsedCommand.hasShellSyntax) {
    return {
      kind: 'unsafe-for-compression',
      adapterName: null,
      reason: `shell syntax detected: ${parsedCommand.unsafeTokens.join(', ')}`,
    };
  }

  if (parsedCommand.hasEnvironmentPrefix) {
    return {
      kind: 'passthrough',
      adapterName: null,
      reason: 'environment prefix detected',
    };
  }

  if (parsedCommand.executable === 'git' && parsedCommand.args[0] === 'status') {
    return {
      kind: 'compressible',
      adapterName: 'git-status',
      reason: 'supported git status adapter',
    };
  }

  if (parsedCommand.executable === 'git' && parsedCommand.args[0] === 'diff') {
    return {
      kind: 'compressible',
      adapterName: 'git-diff',
      reason: 'supported git diff adapter',
    };
  }

  if (parsedCommand.executable === 'npm' && parsedCommand.args[0] === 'test') {
    return {
      kind: 'compressible',
      adapterName: 'npm-test',
      reason: 'supported npm test adapter',
    };
  }

  if (parsedCommand.executable === 'npm' && parsedCommand.args[0] === 'run' && parsedCommand.args[1] === 'build') {
    return {
      kind: 'compressible',
      adapterName: 'npm-run-build',
      reason: 'supported npm run build adapter',
    };
  }

  if (parsedCommand.executable === 'rg') {
    return {
      kind: 'compressible',
      adapterName: 'rg',
      reason: 'supported rg (ripgrep) adapter',
    };
  }

  return {
    kind: 'passthrough',
    adapterName: null,
    reason: 'unsupported command',
  };
}
