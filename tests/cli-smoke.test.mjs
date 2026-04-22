import test from 'node:test';
import { registerCliSmokeFoundationTests } from './cli-smoke/foundation.mjs';
import { registerCliSmokeDesignAndDetectionTests } from './cli-smoke/design-and-detection.mjs';
import { registerCliSmokeAuditsAndOpsTests } from './cli-smoke/audits-and-ops.mjs';

test('CLI Smoke Tests', async (t) => {
  await registerCliSmokeFoundationTests(t);
  await registerCliSmokeDesignAndDetectionTests(t);
  await registerCliSmokeAuditsAndOpsTests(t);
});
