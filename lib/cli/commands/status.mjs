import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

const HOME = os.homedir();
const IS_WIN = process.platform === 'win32';
const IS_MAC = process.platform === 'darwin';

function commandExists(name) {
  try {
    execSync(IS_WIN ? `where ${name}` : `which ${name}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const IDE_CHECKS = [
  {
    name: 'Claude Code',
    type: 'plugin',
    checkPaths: [path.join(HOME, '.claude')],
    installHint: 'claude plugin add fatidaprilian/Agentic-Senior-Core',
  },
  {
    name: 'Codex CLI',
    type: 'plugin',
    checkPaths: [path.join(HOME, '.codex')],
    installHint: 'codex plugins install agentic-senior-core',
  },
  {
    name: 'Gemini CLI',
    type: 'plugin',
    checkPaths: [path.join(HOME, '.gemini')],
    installHint: 'Auto-detected via gemini-extension.json',
  },
  {
    name: 'Antigravity',
    type: 'plugin',
    checkPaths: [path.join(HOME, '.gemini')],
    checkCommands: ['agy'],
    installHint: 'agy plugin install https://github.com/fatidaprilian/Agentic-Senior-Core.git',
  },
  {
    name: 'Cursor',
    type: 'adapter',
    checkPaths: [
      path.join(HOME, '.cursor'),
      ...(IS_WIN ? [path.join(HOME, 'AppData', 'Roaming', 'Cursor')] : []),
      ...(!IS_WIN ? [path.join(HOME, '.config', 'Cursor')] : []),
    ],
    installHint: 'asc adapter --cursor',
  },
  {
    name: 'Devin Desktop',
    type: 'adapter',
    checkPaths: [
      path.join(HOME, '.devin'),
      path.join(HOME, '.codeium'),
      ...(IS_WIN ? [path.join(HOME, 'AppData', 'Roaming', 'Windsurf')] : []),
    ],
    installHint: 'asc adapter --devin',
  },
  {
    name: 'Cline',
    type: 'adapter',
    checkPaths: [
      path.join(HOME, '.cline'),
      ...(IS_WIN ? [path.join(HOME, 'Documents', 'Cline')] : []),
    ],
    installHint: 'asc adapter --cline',
  },
  {
    name: 'GitHub Copilot',
    type: 'adapter',
    checkPaths: [
      path.join(HOME, '.config', 'github-copilot'),
      ...(IS_WIN ? [path.join(HOME, 'AppData', 'Local', 'GitHub Copilot')] : []),
    ],
    installHint: 'asc adapter --copilot',
  },
  {
    name: 'Kiro',
    type: 'adapter',
    checkPaths: [path.join(HOME, '.kiro')],
    installHint: 'asc adapter --kiro',
  },
  {
    name: 'Continue',
    type: 'adapter',
    checkPaths: [path.join(HOME, '.continue')],
    installHint: 'asc adapter --continue',
  },
  {
    name: 'Zed',
    type: 'adapter',
    checkPaths: [
      path.join(HOME, '.config', 'zed'),
      ...(IS_MAC ? [path.join(HOME, 'Library', 'Application Support', 'Zed')] : []),
    ],
    installHint: 'asc adapter --zed',
  },
  {
    name: 'Aider',
    type: 'adapter',
    checkPaths: [],
    checkCommands: ['aider'],
    installHint: 'asc adapter --aider',
  },
  {
    name: 'Kilo Code',
    type: 'adapter',
    checkPaths: [path.join(HOME, '.kilocode')],
    installHint: 'asc adapter --kilocode',
  },
  {
    name: 'Roo Code',
    type: 'adapter',
    checkPaths: [path.join(HOME, '.roo')],
    installHint: 'asc adapter --roo',
  },
  {
    name: 'OpenHands',
    type: 'adapter',
    checkPaths: [path.join(HOME, '.openhands')],
    installHint: 'asc adapter --openhands',
  },
];

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function runStatusCommand() {
  console.log('Agentic Senior Core -- Host Status\n');

  for (const ide of IDE_CHECKS) {
    let detected = false;

    for (const checkPath of ide.checkPaths) {
      if (await pathExists(checkPath)) {
        detected = true;
        break;
      }
    }

    if (!detected && ide.checkCommands) {
      for (const cmd of ide.checkCommands) {
        if (commandExists(cmd)) {
          detected = true;
          break;
        }
      }
    }

    const icon = detected ? '[x]' : '[ ]';
    const support = ide.type === 'plugin' ? '(plugin)' : '(adapter)';
    console.log(`  ${icon} ${ide.name.padEnd(18)} ${support.padEnd(10)} ${detected ? 'detected' : 'not found'}`);

    if (detected) {
      console.log(`      Install: ${ide.installHint}`);
    }
  }

  console.log('\nPlugin hosts get always-on rules via SessionStart hook.');
  console.log('Adapter hosts need one file per project via "asc adapter".');
  console.log('\nTip: run "asc adapter --all" to generate adapters for all supported hosts.');
}
