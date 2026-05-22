#!/usr/bin/env node
import { exit, stderr, stdout } from 'node:process';

import { runAscx } from '../lib/cli/ascx/runtime.mjs';

async function main() {
  const result = await runAscx(process.argv.slice(2));

  if (result.stdout) {
    stdout.write(result.stdout);
  }

  if (result.stderr) {
    stderr.write(result.stderr);
  }

  exit(result.exitCode);
}

main().catch((error) => {
  stderr.write(`ascx failed: ${error.message}\n`);
  exit(1);
});
