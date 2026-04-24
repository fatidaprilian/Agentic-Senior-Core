/**
 * Launch Command — Numbered interactive launcher.
 * Depends on: constants, utils, init command
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import { CLI_VERSION, INIT_PRESETS } from '../constants.mjs';
import { askChoice, normalizeChoiceInput } from '../utils.mjs';
import { runInitCommand } from './init.mjs';
import { runOptimizeCommand } from './optimize.mjs';

export async function runLaunchCommand() {
  const userInterface = createInterface({ input: stdin, output: stdout });

  try {
    console.log(`\nAgentic-Senior-Core CLI v${CLI_VERSION}`);
    console.log('Start with a numbered choice. You can still use commands later if you want direct control.');

    const launchChoice = await askChoice(
      'How do you want to start?',
      [
        'npm / npx path',
        'Scope hint preset',
        'Interactive init wizard',
        'Enable token optimization',
        'Exit',
      ],
      userInterface
    );

    if (launchChoice === 'npm / npx path') {
      console.log('\nChoose one of these package paths:');
      console.log('npm exec --yes @ryuenn3123/agentic-senior-core init');
      console.log('npx @ryuenn3123/agentic-senior-core init');
      console.log('npm install -g @ryuenn3123/agentic-senior-core && agentic-senior-core init');
      return;
    }

    if (launchChoice === 'Scope hint preset') {
      const presetNames = Object.keys(INIT_PRESETS);
      const selectedPresetName = await askChoice(
        'Choose a scope hint preset:',
        presetNames.map((presetName) => `${presetName} - ${INIT_PRESETS[presetName].description}`),
        userInterface
      );

      await runInitCommand('.', { preset: normalizeChoiceInput(selectedPresetName.split(' - ')[0]) });
      return;
    }

    if (launchChoice === 'Interactive init wizard') {
      await runInitCommand('.', {});
      return;
    }

    if (launchChoice === 'Enable token optimization') {
      const selectedAgent = await askChoice(
        'Choose your primary agent integration:',
        ['copilot', 'claude', 'cursor', 'windsurf', 'gemini', 'codex', 'cline'],
        userInterface
      );

      await runOptimizeCommand('.', {
        targetDirectory: '.',
        agent: selectedAgent,
        enabled: true,
      });
      return;
    }

    console.log('Exit selected.');
  } finally {
    userInterface.close();
  }
}
