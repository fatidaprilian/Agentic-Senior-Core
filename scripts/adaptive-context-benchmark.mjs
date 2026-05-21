#!/usr/bin/env node

import { evaluateAdaptiveContextFixtures } from '../lib/cli/adaptive-context.mjs';
import { ADAPTIVE_CONTEXT_FIXTURES } from './adaptive-context/fixtures.mjs';

const report = evaluateAdaptiveContextFixtures(ADAPTIVE_CONTEXT_FIXTURES);

console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
