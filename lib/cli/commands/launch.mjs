/**
 * Launch Command — Numbered interactive launcher.
 * Depends on: constants, utils, init command, skill-selector
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import { CLI_VERSION, INIT_PRESETS } from '../constants.mjs';
import { askChoice, normalizeChoiceInput } from '../utils.mjs';
import { runInitCommand } from './init.mjs';
import { runSkillCommand } from '../skill-selector.mjs';
import { runOptimizeCommand } from './optimize.mjs';

export async function runLaunchCommand() {
  const userInterface = createInterface({ input: stdin, output: stdout });

  try {
    console.log(`\nAgentic-Senior-Core CLI v${CLI_VERSION}`);
    console.log('Start with a numbered choice. You can still use commands later if you want direct control.');

    const launchChoice = await askChoice(
      'How do you want to start?',
      [
        'GitHub template (zero install)',
        'npm / npx path',
        'Bootstrap scripts',
        'Preset starter',
        'Interactive init wizard',
        'Enable token optimization',
        'Skill selector',
        'Exit',
      ],
      userInterface
    );

    if (launchChoice === 'GitHub template (zero install)') {
      console.log('\nOpen the GitHub template here:');
      console.log('https://github.com/fatidaprilian/Agentic-Senior-Core/generate');
      return;
    }

    if (launchChoice === 'npm / npx path') {
      console.log('\nChoose one of these package paths:');
      console.log('npm exec --yes @ryuenn3123/agentic-senior-core init');
      console.log('npx @ryuenn3123/agentic-senior-core init');
      console.log('npm install -g @ryuenn3123/agentic-senior-core && agentic-senior-core init');
      return;
    }

    if (launchChoice === 'Bootstrap scripts') {
      console.log('\nUse the repository bootstrap scripts:');
      console.log('Windows: powershell -ExecutionPolicy Bypass -File .\\scripts\\init-project.ps1 -TargetDirectory .');
      console.log('Linux/macOS: bash ./scripts/init-project.sh .');
      return;
    }

    if (launchChoice === 'Preset starter') {
      const presetNames = Object.keys(INIT_PRESETS);
      const selectedPresetName = await askChoice(
        'Choose a starter preset:',
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

    if (launchChoice === 'Skill selector') {
      await runSkillCommand([]);
      return;
    }

    console.log('Exit selected.');
  } finally {
    userInterface.close();
  }
}
