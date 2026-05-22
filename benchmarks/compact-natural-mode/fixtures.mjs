export const COMPACT_NATURAL_MODE_FIXTURES = [
  {
    id: 'implementation-summary-ascx-diff',
    taskType: 'implementation-summary',
    minimumReductionPercent: 35,
    baseline: [
      'Sure, I finished the ASCX git diff work. I added the new adapter in lib/cli/ascx/adapters/git-diff.mjs and wired the runtime so that ascx git diff can now summarize supported unified diffs.',
      'The important thing is that it keeps changed files and hunk anchors visible while moving hidden details to the raw tee when truncation happens.',
      'I also ran npm run benchmark:ascx and it passed, so the next thing is to keep the adapter whitelist frozen until a new command has fixtures and continuation checks.',
    ].join('\n'),
    candidate: [
      'Changed: `lib/cli/ascx/adapters/git-diff.mjs`; runtime now supports `ascx git diff`.',
      'Reason: Diff output compact; changed files, hunk anchors, and raw tee safety stay visible.',
      'Validation: `npm run benchmark:ascx` passed.',
      'Next: Keep adapter whitelist frozen until the next command has fixtures and continuation checks.',
    ].join('\n'),
    evidenceAtoms: [
      { id: 'adapter-path', text: 'lib/cli/ascx/adapters/git-diff.mjs' },
      { id: 'command', text: 'ascx git diff' },
      { id: 'validation-command', text: 'npm run benchmark:ascx' },
    ],
    requiredClaims: [
      { id: 'diff-output-compact', all: ['Diff output', 'compact'] },
      { id: 'hunk-anchors-preserved', all: ['hunk anchors', 'visible'] },
      { id: 'raw-tee-safety', all: ['raw tee', 'safety'] },
    ],
    requiredActions: [
      { id: 'freeze-whitelist', all: ['Keep', 'adapter whitelist', 'frozen'] },
    ],
    calibrationRequirements: [
      { id: 'validation-status', all: ['Validation', 'passed'] },
    ],
    negativeControls: [
      {
        id: 'drops-validation',
        text: [
          'Changed: Added the diff adapter and wired it into ASCX.',
          'Next: Use it for all diff output now.',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'debug-root-cause-session-id',
    taskType: 'debug-root-cause',
    minimumReductionPercent: 30,
    baseline: [
      'The most likely root cause is that the auth callback assumes user is always defined, but in this failing path it is undefined.',
      'The exact error is TypeError: Cannot read properties of undefined (reading "id"), and the stack points at src/auth/callback.ts:42:17.',
      'The fix is to guard user before reading user.id, for example by returning early when user is missing, then rerun npm test -- auth.test.mjs to verify the callback path.',
    ].join('\n'),
    candidate: [
      'Root Cause: The auth callback reads `user.id` before proving `user` exists.',
      'Evidence: `TypeError: Cannot read properties of undefined (reading "id")` at `src/auth/callback.ts:42:17`.',
      'Fix: Add an early guard before `user.id`.',
      'Next: Run `npm test -- auth.test.mjs`.',
    ].join('\n'),
    evidenceAtoms: [
      { id: 'error-message', text: 'TypeError: Cannot read properties of undefined (reading "id")' },
      { id: 'file-line', text: 'src/auth/callback.ts:42:17' },
      { id: 'identifier', text: 'user.id' },
      { id: 'verify-command', text: 'npm test -- auth.test.mjs' },
    ],
    requiredClaims: [
      { id: 'root-cause', all: ['callback', 'user.id'] },
      { id: 'fix-direction', all: ['guard', 'user.id'] },
    ],
    requiredActions: [
      { id: 'run-target-test', text: 'npm test -- auth.test.mjs' },
    ],
    calibrationRequirements: [
      { id: 'evidence-labelled', text: 'Evidence:' },
    ],
    negativeControls: [
      {
        id: 'paraphrases-error-and-path',
        text: 'Root Cause: The auth code has a missing null check. Fix it and rerun the auth tests.',
      },
    ],
  },
  {
    id: 'test-failure-order-total',
    taskType: 'test-failure',
    minimumReductionPercent: 30,
    baseline: [
      'The failing test is calculates order total. It expected the order total calculation to return 42, but the actual value was 41.',
      'The exact assertion is AssertionError [ERR_ASSERTION]: 41 !== 42 at tests/order-total.test.mjs:18:10.',
      'The fix direction is to inspect the discount or rounding branch used by calculateTotalPrice and then rerun npm test -- order-total.test.mjs.',
    ].join('\n'),
    candidate: [
      'Failed: `calculates order total`',
      'Expected/Got: `42` / `41`',
      'At: `tests/order-total.test.mjs:18:10`',
      'Evidence: `AssertionError [ERR_ASSERTION]: 41 !== 42`.',
      'Fix direction: Inspect `calculateTotalPrice` discount/rounding; run `npm test -- order-total.test.mjs`.',
    ].join('\n'),
    evidenceAtoms: [
      { id: 'test-name', text: 'calculates order total' },
      { id: 'expected', text: '42' },
      { id: 'actual', text: '41' },
      { id: 'file-line', text: 'tests/order-total.test.mjs:18:10' },
      { id: 'assertion', text: 'AssertionError [ERR_ASSERTION]: 41 !== 42' },
      { id: 'identifier', text: 'calculateTotalPrice' },
      { id: 'verify-command', text: 'npm test -- order-total.test.mjs' },
    ],
    requiredClaims: [
      { id: 'mismatch-explained', all: ['Expected', 'Got'] },
      { id: 'fix-target', text: 'calculateTotalPrice' },
    ],
    requiredActions: [
      { id: 'rerun-test', text: 'npm test -- order-total.test.mjs' },
    ],
    calibrationRequirements: [
      { id: 'evidence-preserved', text: 'Evidence:' },
    ],
    negativeControls: [
      {
        id: 'hides-assertion',
        text: [
          'Failed: order total test.',
          'Fix direction: Check the total calculation and rerun the test.',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'code-review-auth-guard',
    taskType: 'code-review',
    minimumReductionPercent: 40,
    baseline: [
      'I would flag this as a warning in src/auth/middleware.ts:58 because req.user is read before the middleware verifies that the auth guard actually attached a user.',
      'That means unauthenticated requests can throw a runtime error instead of returning the documented 401 response.',
      'Please add an early 401 return when req.user is missing and add a regression test for that path.',
    ].join('\n'),
    candidate: '[warn] `src/auth/middleware.ts:58` - `req.user` is read before the guard proves it exists. Return 401 when `req.user` is missing and add a regression test for the unauthenticated path.',
    evidenceAtoms: [
      { id: 'severity', text: '[warn]' },
      { id: 'file-line', text: 'src/auth/middleware.ts:58' },
      { id: 'identifier', text: 'req.user' },
      { id: 'status-code', text: '401' },
    ],
    requiredClaims: [
      { id: 'concern', all: ['read before', 'exists'] },
      { id: 'impact', text: 'unauthenticated' },
    ],
    requiredActions: [
      { id: 'return-401', all: ['Return 401', 'missing'] },
      { id: 'add-test', text: 'regression test' },
    ],
    calibrationRequirements: [
      { id: 'severity-visible', text: '[warn]' },
    ],
    negativeControls: [
      {
        id: 'assertion-without-evidence',
        text: '[warn] Auth middleware is fragile. Please clean it up.',
      },
    ],
  },
  {
    id: 'refactor-summary-behavior-not-verified',
    taskType: 'refactor-summary',
    minimumReductionPercent: 35,
    baseline: [
      'I refactored src/orders/price.ts by splitting the discount calculation out of calculateOrderTotal into calculateDiscountAmount.',
      'The intended behavior is unchanged, but I did not run tests in this environment, so that claim is not verified yet.',
      'The risk is around rounding for percentage discounts. The next step is to run npm test -- order-total.test.mjs.',
    ].join('\n'),
    candidate: [
      'Changed: `src/orders/price.ts`: split `calculateOrderTotal` into `calculateDiscountAmount`.',
      'Behavior: intended no, but not verified; tests not run.',
      'Risk: percentage-discount rounding.',
      'Next: `npm test -- order-total.test.mjs`.',
    ].join('\n'),
    evidenceAtoms: [
      { id: 'file-path', text: 'src/orders/price.ts' },
      { id: 'old-function', text: 'calculateOrderTotal' },
      { id: 'new-function', text: 'calculateDiscountAmount' },
      { id: 'validation-gap', text: 'tests not run' },
      { id: 'next-command', text: 'npm test -- order-total.test.mjs' },
    ],
    requiredClaims: [
      { id: 'behavior-claim-qualified', all: ['intended no', 'not verified'] },
      { id: 'risk-visible', text: 'percentage-discount rounding' },
    ],
    requiredActions: [
      { id: 'run-tests', text: 'npm test -- order-total.test.mjs' },
    ],
    calibrationRequirements: [
      { id: 'not-verified', all: ['not verified', 'tests not run'] },
    ],
    forbiddenOverconfidence: [
      'behavior is unchanged and verified',
      'fully verified',
    ],
    negativeControls: [
      {
        id: 'overstates-verification',
        text: 'Changed: Refactored order pricing. Behavior is unchanged and verified. Next: merge it.',
      },
    ],
  },
  {
    id: 'security-finding-idor',
    taskType: 'security-finding',
    minimumReductionPercent: 10,
    minimumCqs: 0.9,
    baseline: [
      'This is a high severity IDOR issue in src/api/users/[id]/route.ts:27. The route loads a user by params.id but does not check whether the authenticated user is allowed to read that record.',
      'The impact is that one authenticated user can read another user profile by changing the id in the URL.',
      'The remediation is to compare params.id with session.user.id or enforce an admin permission before returning the profile, then add an authorization regression test.',
    ].join('\n'),
    candidate: [
      'Severity: high',
      'Class: IDOR',
      'Location: `src/api/users/[id]/route.ts:27`',
      'Impact: An authenticated user can read another user profile by changing `params.id`',
      'Evidence: The route loads by `params.id` without checking `session.user.id` or admin permission',
      'Remediation: Require owner match or admin permission before returning the profile',
      'Validation: Add an authorization regression test',
    ].join('\n'),
    evidenceAtoms: [
      { id: 'severity', text: 'high' },
      { id: 'class', text: 'IDOR' },
      { id: 'location', text: 'src/api/users/[id]/route.ts:27' },
      { id: 'param', text: 'params.id' },
      { id: 'session', text: 'session.user.id' },
      { id: 'validation', text: 'authorization regression test' },
    ],
    requiredClaims: [
      { id: 'impact', all: ['authenticated user', 'another user profile'] },
      { id: 'remediation', all: ['owner match', 'admin permission'] },
    ],
    requiredActions: [
      { id: 'add-security-test', text: 'authorization regression test' },
    ],
    calibrationRequirements: [
      { id: 'severity-visible', text: 'Severity: high' },
    ],
    negativeControls: [
      {
        id: 'compresses-away-impact',
        text: 'Security: user route needs a permission check. Fix the auth check.',
      },
    ],
  },
  {
    id: 'destructive-command-warning',
    taskType: 'destructive-command',
    minimumReductionPercent: 20,
    baseline: [
      'This command is destructive: rm -rf .agent-context/state/token-saver/tee removes all saved raw ASCX tee logs.',
      'It is not reversible unless those files are backed up elsewhere, so only run it after confirming you no longer need raw command evidence for failed or truncated outputs.',
    ].join('\n'),
    candidate: [
      'WARNING: This deletes all saved ASCX raw tee logs and is not reversible unless backed up.',
      'Command: `rm -rf .agent-context/state/token-saver/tee`',
      'Precondition: Confirm no failed or truncated command evidence is still needed.',
    ].join('\n'),
    evidenceAtoms: [
      { id: 'warning', text: 'WARNING:' },
      { id: 'command', text: 'rm -rf .agent-context/state/token-saver/tee' },
      { id: 'irreversible', text: 'not reversible' },
      { id: 'evidence', text: 'failed or truncated command evidence' },
    ],
    requiredClaims: [
      { id: 'destructive-impact', all: ['deletes', 'raw tee logs'] },
    ],
    requiredActions: [
      { id: 'precondition', regex: 'Precondition:.*confirm' },
    ],
    calibrationRequirements: [
      { id: 'warning-visible', text: 'WARNING:' },
    ],
    negativeControls: [
      {
        id: 'drops-warning',
        text: 'Run `rm -rf .agent-context/state/token-saver/tee` to clean local output logs.',
      },
    ],
  },
  {
    id: 'planning-architecture-compact-mode',
    taskType: 'planning',
    minimumReductionPercent: 20,
    baseline: [
      'The decision I recommend is to keep Compact Natural Mode instruction-only first rather than adding a runtime command or a proxy.',
      'The reason is that this mode changes user-facing response shape, not tool output, so the safest first layer is a benchmarked instruction contract.',
      'The main alternative is a second-pass self-compression command, but that adds latency and can delete evidence unless it has a strong preservation gate.',
      'The tradeoff is that instruction-only behavior is less enforceable, so the open question is whether the benchmark should later become a validation command.',
    ].join('\n'),
    candidate: [
      'Decision: Start Compact Natural Mode as an instruction-only contract.',
      'Rationale: It shapes user-facing replies, not command output; it must be benchmarked before entering `AGENTS.md`.',
      'Alternative: A second-pass compression command can enforce shape, but adds latency and can delete evidence without a preservation gate.',
      'Tradeoff: Lighter, less enforceable.',
      'Open question: Should this become `asc optimize compact benchmark`?',
    ].join('\n'),
    evidenceAtoms: [
      { id: 'decision', text: 'instruction-only contract' },
      { id: 'surface', text: 'AGENTS.md' },
      { id: 'alternative', text: 'second-pass compression command' },
      { id: 'open-question', text: 'asc optimize compact benchmark' },
    ],
    requiredClaims: [
      { id: 'not-command-output', all: ['user-facing replies', 'not command output'] },
      { id: 'latency-risk', all: ['latency', 'delete evidence'] },
      { id: 'tradeoff', all: ['lighter', 'less enforceable'] },
    ],
    requiredActions: [
      { id: 'benchmark-first', all: ['benchmarked', 'before entering'] },
    ],
    calibrationRequirements: [
      { id: 'open-question-visible', text: 'Open question:' },
    ],
    negativeControls: [
      {
        id: 'too-short-to-plan',
        text: 'Decision: Add Compact Natural Mode to AGENTS.md now. It is simple and saves tokens.',
      },
    ],
  },
  {
    id: 'assumption-challenge-framework-version',
    taskType: 'assumption-challenge',
    minimumReductionPercent: 30,
    baseline: [
      'I am assuming this project is on Next.js 15 because package.json lists next at ^15.2.0. If that assumption is wrong, the routing and server-action guidance may not apply.',
      'The next step is to confirm the installed version with npm ls next before changing the route handler behavior.',
    ].join('\n'),
    candidate: [
      'Assumption: Next.js 15; `package.json` lists `next` as `^15.2.0`.',
      'Consequence if wrong: Route-handler/server-action guidance may not apply.',
      'Next: `npm ls next` before changing route behavior.',
    ].join('\n'),
    evidenceAtoms: [
      { id: 'assumption', text: 'Assumption:' },
      { id: 'package-file', text: 'package.json' },
      { id: 'version', text: '^15.2.0' },
      { id: 'command', text: 'npm ls next' },
    ],
    requiredClaims: [
      { id: 'consequence', all: ['Consequence if wrong', 'may not apply'] },
    ],
    requiredActions: [
      { id: 'verify-version', text: 'npm ls next' },
    ],
    calibrationRequirements: [
      { id: 'assumption-labelled', text: 'Assumption:' },
      { id: 'consequence-labelled', text: 'Consequence if wrong:' },
    ],
    negativeControls: [
      {
        id: 'assumption-as-fact',
        text: 'This project uses Next.js 15. Update the route handler and server actions, then run tests.',
      },
    ],
  },
];
