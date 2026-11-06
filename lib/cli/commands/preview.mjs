/**
 * Zero-dependency Multi-Browser Preview & Headless Snapshot Engine.
 * Detects installed browsers (Brave, Edge, Chrome, Firefox, Vivaldi, Arc)
 * and captures a headless snapshot or opens in the OS default browser.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

function openInDefaultBrowser(targetPath) {
  if (process.platform === 'win32') {
    execSync(`cmd.exe /d /s /c "start "" "${targetPath}""`, { stdio: 'ignore' });
  } else if (process.platform === 'darwin') {
    execSync(`open "${targetPath}"`, { stdio: 'ignore' });
  } else {
    execSync(`xdg-open "${targetPath}"`, { stdio: 'ignore' });
  }
}

export function getBrowserCandidates() {
  const platform = process.platform;
  const candidates = [];

  if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || '';
    const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    candidates.push(
      {
        name: 'Brave Browser',
        family: 'chromium',
        paths: [
          path.join(programFiles, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
          path.join(programFilesX86, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
          path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
        ]
      },
      {
        name: 'Microsoft Edge',
        family: 'chromium',
        paths: [
          path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
          path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
          path.join(localAppData, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        ]
      },
      {
        name: 'Google Chrome',
        family: 'chromium',
        paths: [
          path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        ]
      },
      {
        name: 'Mozilla Firefox',
        family: 'firefox',
        paths: [
          path.join(programFiles, 'Mozilla Firefox', 'firefox.exe'),
          path.join(programFilesX86, 'Mozilla Firefox', 'firefox.exe'),
        ]
      },
      {
        name: 'Vivaldi',
        family: 'chromium',
        paths: [
          path.join(localAppData, 'Vivaldi', 'Application', 'vivaldi.exe'),
          path.join(programFiles, 'Vivaldi', 'Application', 'vivaldi.exe'),
        ]
      },
      {
        name: 'Arc',
        family: 'chromium',
        paths: [
          path.join(localAppData, 'Arc', 'Arc.exe'),
        ]
      }
    );
  } else if (platform === 'darwin') {
    candidates.push(
      {
        name: 'Google Chrome',
        family: 'chromium',
        paths: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      },
      {
        name: 'Brave Browser',
        family: 'chromium',
        paths: ['/Applications/Brave Browser.app/Contents/MacOS/Brave Browser']
      },
      {
        name: 'Microsoft Edge',
        family: 'chromium',
        paths: ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
      },
      {
        name: 'Mozilla Firefox',
        family: 'firefox',
        paths: ['/Applications/Firefox.app/Contents/MacOS/firefox']
      },
      {
        name: 'Arc',
        family: 'chromium',
        paths: ['/Applications/Arc.app/Contents/MacOS/Arc']
      }
    );
  } else {
    // Linux
    candidates.push(
      { name: 'google-chrome', family: 'chromium', commands: ['google-chrome', 'google-chrome-stable'] },
      { name: 'chromium', family: 'chromium', commands: ['chromium', 'chromium-browser'] },
      { name: 'brave', family: 'chromium', commands: ['brave-browser', 'brave'] },
      { name: 'microsoft-edge', family: 'chromium', commands: ['microsoft-edge', 'microsoft-edge-stable', 'msedge'] },
      { name: 'firefox', family: 'firefox', commands: ['firefox'] }
    );
  }

  return candidates;
}

export function findBrowserExecutable() {
  const candidates = getBrowserCandidates();

  for (const candidate of candidates) {
    if (candidate.paths) {
      for (const p of candidate.paths) {
        if (fs.existsSync(p)) {
          return { name: candidate.name, family: candidate.family, path: p };
        }
      }
    } else if (candidate.commands) {
      for (const cmd of candidate.commands) {
        try {
          const resolved = execSync(`which ${cmd} 2>/dev/null`, { encoding: 'utf8' }).trim();
          if (resolved) {
            return { name: candidate.name, family: candidate.family, path: resolved };
          }
        } catch {
          // ignore
        }
      }
    }
  }

  return null;
}

export async function runPreviewCommand(args = []) {
  const targetFile = args.find(a => !a.startsWith('-'));
  const shouldOpen = args.includes('--open');
  const width = 1280;
  const height = 800;

  if (!targetFile) {
    console.error('Usage: asc preview <html-file> [--open]');
    process.exit(1);
  }

  const resolvedHtmlPath = path.resolve(process.cwd(), targetFile);
  if (!fs.existsSync(resolvedHtmlPath)) {
    console.error(`File not found: ${resolvedHtmlPath}`);
    process.exit(1);
  }

  // Single fixed reusable slot in OS temp directory
  const tempDir = os.tmpdir();
  const outputPng = path.join(tempDir, 'asc-preview-active.png');

  // Open in default OS browser if requested
  if (shouldOpen) {
    try {
      openInDefaultBrowser(resolvedHtmlPath);
      console.log(`[asc preview] Opened in default browser: ${resolvedHtmlPath}`);
      return;
    } catch (err) {
      console.error(`Failed to open default browser: ${err.message}`);
    }
  }

  // Headless snapshot mode
  const browser = findBrowserExecutable();
  if (!browser) {
    console.warn('[asc preview] No supported headless browser detected (Brave, Edge, Chrome, Firefox). Falling back to OS opener.');
    openInDefaultBrowser(resolvedHtmlPath);
    return;
  }

  try {
    const fileUrl = pathToFileURL(resolvedHtmlPath).href;
    let command;
    if (browser.family === 'chromium') {
      command = `"${browser.path}" --headless=new --disable-gpu --screenshot="${outputPng}" --window-size=${width},${height} "${fileUrl}"`;
    } else if (browser.family === 'firefox') {
      command = `"${browser.path}" -headless -screenshot "${outputPng}" -window-size ${width},${height} "${fileUrl}"`;
    }

    execSync(command, { stdio: 'pipe', timeout: 15000 });

    if (fs.existsSync(outputPng)) {
      const stat = fs.statSync(outputPng);
      console.log(`[asc preview] Captured via ${browser.name} (${width}x${height}, ${stat.size} bytes)`);
      console.log(`Output: ${outputPng}`);
    } else {
      throw new Error('Screenshot file was not generated');
    }
  } catch (err) {
    console.warn(`[asc preview] Headless snapshot failed: ${err.message}. Falling back to OS opener.`);
    openInDefaultBrowser(resolvedHtmlPath);
  }
}

