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

const LARGE_DIFF_NOISE = Array.from({ length: 24 }, (_, index) => {
  const settingNumber = String(index + 1).padStart(2, '0');
  return [
    `-  featureFlag${settingNumber}: false,`,
    `+  featureFlag${settingNumber}: true,`,
  ].join('\n');
}).join('\n');

const GENERATED_LOCKFILE_DIFF = Array.from({ length: 36 }, (_, index) => {
  const packageNumber = String(index + 1).padStart(2, '0');
  return [
    `-    "node_modules/example-${packageNumber}": { "version": "1.0.${packageNumber}" },`,
    `+    "node_modules/example-${packageNumber}": { "version": "1.1.${packageNumber}" },`,
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
    continuationChecks: [
      {
        id: 'clean-status-needs-no-followup',
        action: 'Decide that no repo-state follow-up is needed.',
        requiredSubstrings: [
          'git status: working tree clean',
          'raw_output: none',
        ],
        expectTee: false,
      },
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
    continuationChecks: [
      {
        id: 'large-status-preserves-first-file-and-tee',
        action: 'Identify the changed area and know raw status is available for hidden entries.',
        requiredSubstrings: [
          'unstaged: 45',
          'src/modules/orders/file-01.ts',
          '... truncated 30 more unstaged entries',
          'raw_output:',
        ],
        expectTee: true,
      },
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
    continuationChecks: [
      {
        id: 'mixed-status-preserves-buckets',
        action: 'Separate staged, unstaged, and untracked work before choosing the next command.',
        requiredSubstrings: [
          'staged: 1',
          'unstaged: 1',
          'untracked: 1',
          'lib/cli/ascx/runtime.mjs',
          'tests/ascx-runtime-token-saver.test.mjs',
          'benchmarks/runtime-token-saver/fixtures.mjs',
        ],
        expectTee: false,
      },
    ],
  },
  {
    id: 'git-diff-small',
    commandArguments: ['git', 'diff'],
    capture: {
      exitCode: 0,
      stdout: [
        'diff --git a/src/auth/session.ts b/src/auth/session.ts',
        'index 1111111..2222222 100644',
        '--- a/src/auth/session.ts',
        '+++ b/src/auth/session.ts',
        '@@ -12,7 +12,8 @@ export function validateSession(token) {',
        '-  return token.expiresAt > Date.now();',
        '+  const hasValidExpiry = token.expiresAt >= Date.now();',
        '+  return hasValidExpiry;',
        ' }',
      ].join('\n'),
      stderr: '',
    },
    expectCompressed: true,
    expectTee: false,
    requiredSubstrings: [
      'git diff summary:',
      'files: 1',
      'src/auth/session.ts (+2 -1)',
      '@@ -12,7 +12,8 @@ export function validateSession(token) {',
      '-  return token.expiresAt > Date.now();',
      '+  const hasValidExpiry = token.expiresAt >= Date.now();',
      'filter: git-diff-summary',
    ],
    continuationChecks: [
      {
        id: 'small-diff-supports-direct-review',
        action: 'Identify the changed file, hunk anchor, and changed condition without opening raw output.',
        requiredSubstrings: [
          'src/auth/session.ts (+2 -1)',
          '@@ -12,7 +12,8 @@ export function validateSession(token) {',
          '-  return token.expiresAt > Date.now();',
          '+  const hasValidExpiry = token.expiresAt >= Date.now();',
          'raw_output: none',
        ],
        expectTee: false,
      },
    ],
  },
  {
    id: 'git-diff-large-hunk',
    commandArguments: ['git', 'diff'],
    capture: {
      exitCode: 0,
      stdout: [
        'diff --git a/src/config/feature-flags.ts b/src/config/feature-flags.ts',
        'index 3333333..4444444 100644',
        '--- a/src/config/feature-flags.ts',
        '+++ b/src/config/feature-flags.ts',
        '@@ -1,30 +1,30 @@ export const featureFlags = {',
        LARGE_DIFF_NOISE,
        ' };',
      ].join('\n'),
      stderr: '',
    },
    expectCompressed: true,
    expectTee: true,
    requiredSubstrings: [
      'src/config/feature-flags.ts (+24 -24)',
      '@@ -1,30 +1,30 @@ export const featureFlags = {',
      '... truncated 42 more changed lines in hunk',
      'truncation: raw diff available in tee output',
      'raw_output:',
    ],
    continuationChecks: [
      {
        id: 'large-diff-tells-agent-to-open-tee',
        action: 'Identify the changed file and decide raw tee is needed before editing hidden lines.',
        requiredSubstrings: [
          'src/config/feature-flags.ts (+24 -24)',
          '@@ -1,30 +1,30 @@ export const featureFlags = {',
          '... truncated 42 more changed lines in hunk',
          'truncation: raw diff available in tee output',
          'raw_output:',
        ],
        expectTee: true,
      },
    ],
  },
  {
    id: 'git-diff-generated-lockfile',
    commandArguments: ['git', 'diff'],
    capture: {
      exitCode: 0,
      stdout: [
        'diff --git a/package-lock.json b/package-lock.json',
        'index 5555555..6666666 100644',
        '--- a/package-lock.json',
        '+++ b/package-lock.json',
        '@@ -100,72 +100,72 @@',
        GENERATED_LOCKFILE_DIFF,
      ].join('\n'),
      stderr: '',
    },
    expectCompressed: true,
    expectTee: true,
    requiredSubstrings: [
      'package-lock.json (+36 -36) [generated/noisy path]',
      'detail: omitted generated/noisy diff; raw tee required for exact lines',
      'truncation: raw diff available in tee output',
      'raw_output:',
    ],
    forbiddenSubstrings: [
      'node_modules/example-36',
    ],
    continuationChecks: [
      {
        id: 'generated-diff-does-not-hide-raw-need',
        action: 'Recognize generated lockfile noise and defer exact-line inspection to the raw tee.',
        requiredSubstrings: [
          'package-lock.json (+36 -36) [generated/noisy path]',
          'detail: omitted generated/noisy diff; raw tee required for exact lines',
          'raw_output:',
        ],
        forbiddenSubstrings: [
          'node_modules/example-36',
        ],
        expectTee: true,
      },
    ],
  },
  {
    id: 'git-diff-binary-file',
    commandArguments: ['git', 'diff'],
    capture: {
      exitCode: 0,
      stdout: [
        'diff --git a/public/logo.png b/public/logo.png',
        'index 7777777..8888888 100644',
        'Binary files a/public/logo.png and b/public/logo.png differ',
      ].join('\n'),
      stderr: '',
    },
    expectCompressed: true,
    expectTee: false,
    requiredSubstrings: [
      'public/logo.png (+0 -0) [binary file changed]',
      'exit: 0',
    ],
    continuationChecks: [
      {
        id: 'binary-diff-keeps-non-text-signal',
        action: 'Identify that the diff cannot be reviewed as text because the changed file is binary.',
        requiredSubstrings: [
          'public/logo.png (+0 -0) [binary file changed]',
          'raw_output: none',
        ],
        expectTee: false,
      },
    ],
  },
  {
    id: 'git-diff-deleted-file',
    commandArguments: ['git', 'diff'],
    capture: {
      exitCode: 0,
      stdout: [
        'diff --git a/src/legacy.ts b/src/legacy.ts',
        'deleted file mode 100644',
        'index 9999999..0000000',
        '--- a/src/legacy.ts',
        '+++ /dev/null',
        '@@ -1,3 +0,0 @@',
        '-export const legacy = true;',
        '-export function useLegacy() {}',
      ].join('\n'),
      stderr: '',
    },
    expectCompressed: true,
    expectTee: false,
    requiredSubstrings: [
      'src/legacy.ts (+0 -2) [deleted file]',
      '@@ -1,3 +0,0 @@',
      '-export const legacy = true;',
      '-export function useLegacy() {}',
    ],
    continuationChecks: [
      {
        id: 'deleted-file-keeps-removal-evidence',
        action: 'Identify the deleted file and removed exports before accepting the change.',
        requiredSubstrings: [
          'src/legacy.ts (+0 -2) [deleted file]',
          '@@ -1,3 +0,0 @@',
          '-export const legacy = true;',
          '-export function useLegacy() {}',
        ],
        expectTee: false,
      },
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
    continuationChecks: [
      {
        id: 'passing-tests-avoid-failure-hunt',
        action: 'Decide that no failing-test triage is needed while raw output remains available for audit.',
        requiredSubstrings: [
          '# tests 1',
          '# pass 1',
          '# fail 0',
          'exit: 0',
          'raw_output:',
        ],
        forbiddenSubstrings: [
          'passing fixture 01',
        ],
        expectTee: true,
      },
    ],
  },
  {
    id: 'npm-test-pass-with-expected-error-log',
    commandArguments: ['npm', 'test'],
    capture: {
      exitCode: 0,
      stdout: [
        'TAP version 13',
        '# Subtest: preflight checks abort installation on conflict',
        'ok 1 - preflight checks abort installation on conflict',
        '# [FATAL] Preflight checks failed. Initializing here would cause errors or data loss:',
        '# CLI failed: Error: Preflight checks failed.',
        '# Subtest: transactional install performs automatic rollback on failure',
        'ok 2 - transactional install performs automatic rollback on failure',
        '# tests 2',
        '# pass 2',
        '# fail 0',
      ].join('\n'),
      stderr: '',
    },
    expectCompressed: true,
    expectTee: true,
    requiredSubstrings: [
      'npm test summary:',
      '# tests 2',
      '# pass 2',
      '# fail 0',
      'exit: 0',
      'raw_output:',
    ],
    forbiddenSubstrings: [
      'failures:',
      '[FATAL]',
      'CLI failed: Error',
    ],
    continuationChecks: [
      {
        id: 'passing-tests-ignore-expected-error-logs',
        action: 'Trust the TAP summary over expected error text emitted by passing tests.',
        requiredSubstrings: [
          '# tests 2',
          '# pass 2',
          '# fail 0',
          'raw_output:',
        ],
        forbiddenSubstrings: [
          'failures:',
          '[FATAL]',
        ],
        expectTee: true,
      },
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
    continuationChecks: [
      {
        id: 'single-test-failure-preserves-next-target',
        action: 'Identify the failing test, assertion class, file line, and raw tee for deeper inspection.',
        requiredSubstrings: [
          '# Subtest: calculates order total',
          'AssertionError [ERR_ASSERTION]',
          'order-total.test.mjs:18:10',
          '# fail 1',
          'raw_output:',
        ],
        expectTee: true,
      },
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
    continuationChecks: [
      {
        id: 'multiple-test-failures-preserve-all-targets',
        action: 'Identify each failing test target before picking the first fix.',
        requiredSubstrings: [
          '# Subtest: validates login token',
          'auth.test.mjs:33:5',
          '# Subtest: rejects duplicate order',
          'orders.test.mjs:77:7',
          '# fail 2',
          'raw_output:',
        ],
        expectTee: true,
      },
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
    continuationChecks: [
      {
        id: 'test-crash-preserves-root-error',
        action: 'Distinguish a test runner crash from an assertion failure and open the broken file.',
        requiredSubstrings: [
          'SyntaxError: Unexpected token )',
          'crash.test.mjs:4:1',
          'exit: 1',
          'raw_output:',
        ],
        expectTee: true,
      },
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
    continuationChecks: [
      {
        id: 'pipe-passthrough-keeps-raw-output',
        action: 'Avoid trusting compression when shell control flow makes the command unsafe to summarize.',
        requiredSubstrings: [
          'raw pipe output',
          'raw pipe error',
        ],
        expectTee: false,
      },
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
    continuationChecks: [
      {
        id: 'redirect-passthrough-keeps-raw-output',
        action: 'Avoid compression when output redirection changes command semantics.',
        requiredSubstrings: [
          'raw redirected status',
        ],
        expectTee: false,
      },
    ],
  },
];
