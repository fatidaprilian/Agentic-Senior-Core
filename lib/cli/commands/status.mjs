import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const HOME = os.homedir();

const IDE_CHECKS = [
  {
    name: 'Claude Code',
    type: 'plugin',
    checkPaths: [
      path.join(HOME, '.claude'),
    ],
    installHint: '/plugin marketplace add fatidaprilian/Agentic-Senior-Core',
  },
  {
    name: 'Codex CLI',
    type: 'plugin',
    checkPaths: [
      path.join(HOME, '.codex'),
    ],
    installHint: 'codex plugins install agentic-senior-core',
  },
  {
    name: 'Gemini CLI',
    type: 'plugin',
    checkPaths: [
      path.join(HOME, '.gemini'),
    ],
    installHint: 'Auto-detected via gemini-extension.json',
  },
  {
    name: 'Cursor',
    type: 'adapter',
    checkPaths: [
      path.join(HOME, '.cursor'),
      path.join(HOME, 'AppData', 'Roaming', 'Cursor'),
      path.join(HOME, '.config', 'Cursor'),
    ],
    installHint: 'asc adapter --cursor',
  },
  {
    name: 'Windsurf',
    type: 'adapter',
    checkPaths: [
      path.join(HOME, '.codeium'),
      path.join(HOME, '.windsurf'),
    ],
    installHint: 'asc adapter --windsurf',
  },
  {
    name: 'Cline',
    type: 'adapter',
    checkPaths: [
      path.join(HOME, 'Documents', 'Cline'),
      path.join(HOME, '.cline'),
    ],
    installHint: 'asc adapter --cline',
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
  console.log('Agentic Senior Core -- IDE Status\n');

  for (const ide of IDE_CHECKS) {
    let detected = false;
    for (const checkPath of ide.checkPaths) {
      if (await pathExists(checkPath)) {
        detected = true;
        break;
      }
    }

    const icon = detected ? '[x]' : '[ ]';
    const support = ide.type === 'plugin' ? '(plugin)' : '(adapter)';
    console.log(`  ${icon} ${ide.name.padEnd(15)} ${support.padEnd(10)} ${detected ? 'detected' : 'not found'}`);

    if (detected) {
      console.log(`      Install: ${ide.installHint}`);
    }
  }

  console.log('\nPlugin hosts get always-on rules via SessionStart hook.');
  console.log('Adapter hosts need one file per project via "asc adapter".');
}
