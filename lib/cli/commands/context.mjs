import { stdin } from 'node:process';

import { buildSelectedContextManifest } from '../adaptive-context.mjs';

export function parseContextArguments(commandArguments) {
  const parsedOptions = {
    requestId: 'adhoc-request',
    requestText: '',
    contextFiles: [],
    json: false,
    readStdin: false,
  };
  const requestParts = [];

  for (let argumentIndex = 0; argumentIndex < commandArguments.length; argumentIndex++) {
    const currentArgument = commandArguments[argumentIndex];

    if (currentArgument === '--json') {
      parsedOptions.json = true;
      continue;
    }

    if (currentArgument === '--stdin') {
      parsedOptions.readStdin = true;
      continue;
    }

    if (currentArgument === '--file') {
      const contextFilePath = commandArguments[argumentIndex + 1];
      if (!contextFilePath || contextFilePath.startsWith('--')) {
        throw new Error('Missing value for --file');
      }

      parsedOptions.contextFiles.push(contextFilePath);
      argumentIndex++;
      continue;
    }

    if (currentArgument === '--files') {
      const contextFileList = commandArguments[argumentIndex + 1];
      if (!contextFileList || contextFileList.startsWith('--')) {
        throw new Error('Missing value for --files');
      }

      parsedOptions.contextFiles.push(
        ...contextFileList
          .split(',')
          .map((contextFilePath) => contextFilePath.trim())
          .filter(Boolean)
      );
      argumentIndex++;
      continue;
    }

    if (currentArgument === '--request-id') {
      const requestId = commandArguments[argumentIndex + 1];
      if (!requestId || requestId.startsWith('--')) {
        throw new Error('Missing value for --request-id');
      }

      parsedOptions.requestId = requestId;
      argumentIndex++;
      continue;
    }

    if (currentArgument.startsWith('--')) {
      throw new Error(`Unknown option: ${currentArgument}`);
    }

    requestParts.push(currentArgument);
  }

  parsedOptions.requestText = requestParts.join(' ').trim();
  return parsedOptions;
}

function readRequestFromStdin() {
  return new Promise((resolve, reject) => {
    let requestText = '';

    stdin.setEncoding('utf8');
    stdin.on('data', (chunk) => {
      requestText += chunk;
    });
    stdin.on('error', reject);
    stdin.on('end', () => {
      resolve(requestText.trim());
    });
  });
}

function formatList(label, values) {
  if (values.length === 0) {
    return [`${label}: none`];
  }

  return [
    `${label}:`,
    ...values.map((value) => `- ${value}`),
  ];
}

function formatManifestText(manifest) {
  return [
    'Adaptive Context',
    `requestId: ${manifest.requestId}`,
    `labels: ${manifest.labels.length > 0 ? manifest.labels.join(', ') : 'none'}`,
    `uncertainty: ${manifest.uncertainty}`,
    `budget: ${manifest.budget.status} (${manifest.budget.selectedRuleCount}/${manifest.budget.maxRecommendedRuleCount} recommended rules)`,
    `fallbackRequired: ${manifest.fallbackRequired}`,
    ...formatList('contextFiles', manifest.contextFiles),
    ...formatList('selectedRules', manifest.selectedRules),
    ...formatList('selectedPrompts', manifest.selectedPrompts),
    ...formatList('selectedDocs', manifest.selectedDocs),
  ].join('\n');
}

export async function runContextCommand(commandArguments) {
  const contextOptions = parseContextArguments(commandArguments);
  const requestText = contextOptions.readStdin
    ? await readRequestFromStdin()
    : contextOptions.requestText;

  if (!requestText) {
    throw new Error('Context request text is required. Pass text as arguments or use --stdin.');
  }

  const manifest = buildSelectedContextManifest({
    contextFiles: contextOptions.contextFiles,
    requestId: contextOptions.requestId,
    requestText,
  });

  if (contextOptions.json) {
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }

  console.log(formatManifestText(manifest));
}
