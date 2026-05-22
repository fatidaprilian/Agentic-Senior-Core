const MANY_MODIFIED_FILES = Array.from({ length: 45 }, (_, index) => {
  const fileNumber = String(index + 1).padStart(2, '0');
  return `\tmodified:   src/modules/orders/file-${fileNumber}.ts`;
}).join('\n');

const PASSED_TEST_NOISE = Array.from({ length: 60 }, (_, index) => {
  const testNumber = String(index + 1).padStart(2, '0');
  return [
    `# Subtest: passing fixture ${testNumber}`,
    `ok ${index + 1} - passing fixture ${testNumber}`,
  ].join('\n');
}).join('\n');

export const ASCX_RUNTIME_TOKEN_SAVER_FIXTURES = [
  {
    id: 'git-status-clean',
    commandArguments: ['git', 'status'],
    capture: {
      exitCode: 0,
      stdout: 'On branch main\nnothing to commit, working tree clean\n',
      stderr: '',
    },
    expectCompressed: true,
    expectTee: false,
    requiredSubstrings: [
      'git status: working tree clean',
      'exit: 0',
      'filter: git-status-summary',
    ],
  },
  {
    id: 'git-status-many-modified',
    commandArguments: ['git', 'status'],
    capture: {
      exitCode: 0,
      stdout: [
        'On branch main',
        '  (use "git restore <file>..." to discard changes in working directory)',
        '  (use "git add <file>..." to update what will be committed)',
        'Changes not staged for commit:',
        MANY_MODIFIED_FILES,
        '',
      ].join('\n'),
      stderr: '',
    },
    expectCompressed: true,
    expectTee: true,
    requiredSubstrings: [
      'unstaged: 45',
      'src/modules/orders/file-01.ts',
      '... truncated 30 more unstaged entries',
      'raw_output:',
    ],
  },
  {
    id: 'git-status-staged-and-unstaged',
    commandArguments: ['git', 'status'],
    capture: {
      exitCode: 0,
      stdout: [
        'On branch main',
        'Changes to be committed:',
        '\tmodified:   lib/cli/ascx/runtime.mjs',
        'Changes not staged for commit:',
        '\tmodified:   tests/ascx-runtime-token-saver.test.mjs',
        'Untracked files:',
        '\tbenchmarks/runtime-token-saver/fixtures.mjs',
        '',
      ].join('\n'),
      stderr: '',
    },
    expectCompressed: true,
    expectTee: false,
    requiredSubstrings: [
      'staged: 1',
      'lib/cli/ascx/runtime.mjs',
      'unstaged: 1',
      'tests/ascx-runtime-token-saver.test.mjs',
      'untracked: 1',
      'benchmarks/runtime-token-saver/fixtures.mjs',
    ],
  },
  {
    id: 'npm-test-pass',
    commandArguments: ['npm', 'test'],
    capture: {
      exitCode: 0,
      stdout: [
        'TAP version 13',
        PASSED_TEST_NOISE,
        '# Subtest: adds totals',
        'ok 61 - adds totals',
        '# tests 1',
        '# suites 0',
        '# pass 1',
        '# fail 0',
        '# duration_ms 12.3',
      ].join('\n'),
      stderr: '',
    },
    expectCompressed: true,
    expectTee: true,
    requiredSubstrings: [
      'npm test summary:',
      '# tests 1',
      '# pass 1',
      '# fail 0',
      'exit: 0',
      'raw_output:',
    ],
    forbiddenSubstrings: [
      'passing fixture 01',
    ],
  },
  {
    id: 'npm-test-one-failure',
    commandArguments: ['npm', 'test'],
    capture: {
      exitCode: 1,
      stdout: [
        'TAP version 13',
        PASSED_TEST_NOISE,
        '# Subtest: calculates order total',
        'not ok 1 - calculates order total',
        '  ---',
        '  error: |',
        '    AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:',
        '    41 !== 42',
        '      at file:///E:/Project/app/tests/order-total.test.mjs:18:10',
        '  ...',
        '# tests 1',
        '# pass 0',
        '# fail 1',
      ].join('\n'),
      stderr: '',
    },
    expectCompressed: true,
    expectTee: true,
    requiredSubstrings: [
      '# Subtest: calculates order total',
      'not ok 1 - calculates order total',
      'AssertionError [ERR_ASSERTION]',
      'order-total.test.mjs:18:10',
      '# fail 1',
      'exit: 1',
      'raw_output:',
    ],
  },
  {
    id: 'npm-test-multiple-failures',
    commandArguments: ['npm', 'test'],
    capture: {
      exitCode: 1,
      stdout: [
        'TAP version 13',
        PASSED_TEST_NOISE,
        '# Subtest: validates login token',
        'not ok 1 - validates login token',
        '    Error: token expired',
        '      at file:///E:/Project/app/tests/auth.test.mjs:33:5',
        '# Subtest: rejects duplicate order',
        'not ok 2 - rejects duplicate order',
        '    AssertionError [ERR_ASSERTION]: Expected duplicate submit to be rejected',
        '      at file:///E:/Project/app/tests/orders.test.mjs:77:7',
        '# tests 2',
        '# pass 0',
        '# fail 2',
      ].join('\n'),
      stderr: '',
    },
    expectCompressed: true,
    expectTee: true,
    requiredSubstrings: [
      '# Subtest: validates login token',
      'auth.test.mjs:33:5',
      '# Subtest: rejects duplicate order',
      'orders.test.mjs:77:7',
      '# fail 2',
    ],
  },
  {
    id: 'npm-test-crash-before-run',
    commandArguments: ['npm', 'test'],
    capture: {
      exitCode: 1,
      stdout: '',
      stderr: [
        'SyntaxError: Unexpected token )',
        '    at compileSourceTextModule (node:internal/modules/esm/utils:346:16)',
        '    at file:///E:/Project/app/tests/crash.test.mjs:4:1',
      ].join('\n'),
    },
    expectCompressed: true,
    expectTee: true,
    requiredSubstrings: [
      'SyntaxError: Unexpected token )',
      'crash.test.mjs:4:1',
      'exit: 1',
      'raw_output:',
    ],
  },
  {
    id: 'unsafe-pipe-passthrough',
    commandArguments: ['npm', 'test', '|', 'tee', 'test.log'],
    capture: {
      exitCode: 1,
      stdout: 'raw pipe output\n',
      stderr: 'raw pipe error\n',
    },
    expectCompressed: false,
    expectTee: false,
    requiredSubstrings: [
      'raw pipe output',
      'raw pipe error',
    ],
  },
  {
    id: 'unsafe-redirect-passthrough',
    commandArguments: ['git', 'status', '>', 'status.txt'],
    capture: {
      exitCode: 0,
      stdout: 'raw redirected status\n',
      stderr: '',
    },
    expectCompressed: false,
    expectTee: false,
    requiredSubstrings: [
      'raw redirected status',
    ],
  },
];
