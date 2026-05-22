#!/usr/bin/env node

import { evaluateAscxFixtures } from '../lib/cli/ascx/fixture-evaluator.mjs';
import { ASCX_RUNTIME_TOKEN_SAVER_FIXTURES } from '../benchmarks/runtime-token-saver/fixtures.mjs';

const report = await evaluateAscxFixtures(ASCX_RUNTIME_TOKEN_SAVER_FIXTURES);

console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
