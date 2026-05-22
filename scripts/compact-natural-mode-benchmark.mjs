#!/usr/bin/env node

import { COMPACT_NATURAL_MODE_FIXTURES } from '../benchmarks/compact-natural-mode/fixtures.mjs';
import { evaluateCompactNaturalFixtures } from '../benchmarks/compact-natural-mode/scorer.mjs';

const report = evaluateCompactNaturalFixtures(COMPACT_NATURAL_MODE_FIXTURES);

console.log(JSON.stringify(report, null, 2));
process.exit(report.passed ? 0 : 1);
