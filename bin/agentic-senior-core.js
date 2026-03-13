#!/usr/bin/env node
/**
 * Agentic-Senior-Core CLI (V1.4)
 *
 * Interactive delivery engine for bootstrapping dynamic governance files.
 */

const fs = require("node:fs/promises");
const path = require("node:path");
const readline = require("node:readline/promises");
const { stdin: input, stdout: output, exit } = require("node:process");

const CLI_VERSION = "1.4.0";
const REPO_ROOT = path.resolve(__dirname, "..");
const AGENT_CONTEXT_DIR = path.join(REPO_ROOT, ".agent-context");

const entryPointFiles = [
  ".cursorrules",
  ".windsurfrules",
  "AGENTS.md",
  ".agent-override.md",
  "mcp.json",
];

const directoryCopies = [".agent-context", ".github", ".gemini", ".agents"];

function printUsage() {
  console.log("Agentic-Senior-Core CLI");
  console.log("");
  console.log("Usage:");
  console.log("  bunx @fatidaprilian/agentic-senior-core init [target-directory] [--stack <name>] [--blueprint <name>] [--ci <true|false>]");
  console.log("  npx @fatidaprilian/agentic-senior-core init [target-directory] [--stack <name>] [--blueprint <name>] [--ci <true|false>]");
  console.log("  agentic-senior-core init [target-directory] [--stack <name>] [--blueprint <name>] [--ci <true|false>]");
  console.log("");
  console.log("Options:");
  console.log("  --help      Show help");
  console.log("  --version   Show CLI version");
}

async function pathExists(targetPath) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true });
}

async function copyDirectory(sourceDirectoryPath, targetDirectoryPath) {
  await ensureDirectory(targetDirectoryPath);
  const entries = await fs.readdir(sourceDirectoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const sourceEntryPath = path.join(sourceDirectoryPath, entry.name);
    const targetEntryPath = path.join(targetDirectoryPath, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourceEntryPath, targetEntryPath);
      continue;
    }

    await fs.copyFile(sourceEntryPath, targetEntryPath);
  }
}

async function askChoice(promptMessage, options, userInterface) {
  console.log(`\n${promptMessage}`);
  options.forEach((choiceLabel, choiceIndex) => {
    console.log(`  ${choiceIndex + 1}. ${choiceLabel}`);
  });

  while (true) {
    const selectedRawInput = await userInterface.question("Choose a number: ");
    const selectedIndex = Number.parseInt(selectedRawInput.trim(), 10) - 1;

    if (Number.isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= options.length) {
      console.log("Invalid choice. Please select a valid number.");
      continue;
    }

    return options[selectedIndex];
  }
}

async function askYesNo(promptMessage, userInterface) {
  while (true) {
    const answer = await userInterface.question(`\n${promptMessage} (y/n): `);
    const normalizedAnswer = answer.trim().toLowerCase();

    if (normalizedAnswer === "y" || normalizedAnswer === "yes") return true;
    if (normalizedAnswer === "n" || normalizedAnswer === "no") return false;

    console.log("Please answer with 'y' or 'n'.");
  }
}

function toTitleCase(fileName) {
  return fileName
    .replace(/\.md$/i, "")
    .split(/[-_]/g)
    .map((wordPart) => wordPart.charAt(0).toUpperCase() + wordPart.slice(1))
    .join(" ");
}

function normalizeChoiceInput(rawInput) {
  return rawInput.trim().toLowerCase().replace(/\s+/g, "-");
}

function matchFileNameFromInput(rawInput, fileNames) {
  const normalizedInput = normalizeChoiceInput(rawInput);

  return fileNames.find((fileName) => {
    const normalizedFileName = normalizeChoiceInput(fileName.replace(/\.md$/i, ""));
    const normalizedTitle = normalizeChoiceInput(toTitleCase(fileName));
    return normalizedInput === normalizedFileName || normalizedInput === normalizedTitle;
  });
}

async function collectFileNames(folderPath) {
  const fileNames = await fs.readdir(folderPath, { withFileTypes: true });
  return fileNames
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort((leftName, rightName) => leftName.localeCompare(rightName));
}

async function compileDynamicContext({
  targetDirectoryPath,
  selectedStackFileName,
  selectedBlueprintFileName,
  includeCiGuardrails,
}) {
  const resolvedTargetDirectoryPath = path.resolve(targetDirectoryPath);

  const selectedRulesDirectoryPath = path.join(resolvedTargetDirectoryPath, ".agent-context", "rules");
  const selectedStacksDirectoryPath = path.join(resolvedTargetDirectoryPath, ".agent-context", "stacks");
  const selectedBlueprintsDirectoryPath = path.join(resolvedTargetDirectoryPath, ".agent-context", "blueprints");
  const selectedStateDirectoryPath = path.join(resolvedTargetDirectoryPath, ".agent-context", "state");
  const selectedReviewDirectoryPath = path.join(resolvedTargetDirectoryPath, ".agent-context", "review-checklists");

  const universalRuleFileNames = await collectFileNames(selectedRulesDirectoryPath);
  const contextBlocks = [];

  for (const universalRuleFileName of universalRuleFileNames) {
    const universalRuleFilePath = path.join(selectedRulesDirectoryPath, universalRuleFileName);
    const universalRuleContent = await fs.readFile(universalRuleFilePath, "utf8");

    contextBlocks.push(
      `## UNIVERSAL RULE: ${universalRuleFileName}\nSource: .agent-context/rules/${universalRuleFileName}\n\n${universalRuleContent.trim()}`
    );
  }

  const stackFilePath = path.join(selectedStacksDirectoryPath, selectedStackFileName);
  const stackContent = await fs.readFile(stackFilePath, "utf8");
  contextBlocks.push(
    `## STACK PROFILE: ${selectedStackFileName}\nSource: .agent-context/stacks/${selectedStackFileName}\n\n${stackContent.trim()}`
  );

  const blueprintFilePath = path.join(selectedBlueprintsDirectoryPath, selectedBlueprintFileName);
  const blueprintContent = await fs.readFile(blueprintFilePath, "utf8");
  contextBlocks.push(
    `## BLUEPRINT PROFILE: ${selectedBlueprintFileName}\nSource: .agent-context/blueprints/${selectedBlueprintFileName}\n\n${blueprintContent.trim()}`
  );

  if (includeCiGuardrails) {
    const githubCiBlueprintPath = path.join(selectedBlueprintsDirectoryPath, "ci-github-actions.md");
    const gitlabCiBlueprintPath = path.join(selectedBlueprintsDirectoryPath, "ci-gitlab.md");
    const githubCiBlueprintContent = await fs.readFile(githubCiBlueprintPath, "utf8");
    const gitlabCiBlueprintContent = await fs.readFile(gitlabCiBlueprintPath, "utf8");

    contextBlocks.push(
      `## CI/CD GUARDRAILS: ci-github-actions.md\nSource: .agent-context/blueprints/ci-github-actions.md\n\n${githubCiBlueprintContent.trim()}`
    );
    contextBlocks.push(
      `## CI/CD GUARDRAILS: ci-gitlab.md\nSource: .agent-context/blueprints/ci-gitlab.md\n\n${gitlabCiBlueprintContent.trim()}`
    );
  }

  const architectureMapPath = path.join(selectedStateDirectoryPath, "architecture-map.md");
  const dependencyMapPath = path.join(selectedStateDirectoryPath, "dependency-map.md");
  const architectureMapContent = await fs.readFile(architectureMapPath, "utf8");
  const dependencyMapContent = await fs.readFile(dependencyMapPath, "utf8");

  contextBlocks.push(
    `## STATE MAP: architecture-map.md\nSource: .agent-context/state/architecture-map.md\n\n${architectureMapContent.trim()}`
  );
  contextBlocks.push(
    `## STATE MAP: dependency-map.md\nSource: .agent-context/state/dependency-map.md\n\n${dependencyMapContent.trim()}`
  );

  const prChecklistPath = path.join(selectedReviewDirectoryPath, "pr-checklist.md");
  const prChecklistContent = await fs.readFile(prChecklistPath, "utf8");
  contextBlocks.push(
    `## REVIEW CHECKLIST: pr-checklist.md\nSource: .agent-context/review-checklists/pr-checklist.md\n\n${prChecklistContent.trim()}`
  );

  const compiledRules = [
    "# AGENTIC-SENIOR-CORE DYNAMIC GOVERNANCE RULESET",
    "",
    `Generated by Agentic-Senior-Core CLI v${CLI_VERSION}`,
    `Timestamp: ${new Date().toISOString()}`,
    "",
    "## GOVERNANCE PRECEDENCE",
    "1. Follow this compiled rulebook as the primary source.",
    "2. Resolve exceptions from .agent-override.md only when explicitly defined.",
    "3. Use architecture-map.md and dependency-map.md as change safety boundaries.",
    "4. Enforce pr-checklist.md before declaring completion.",
    "",
    "## OVERRIDE PROTOCOL",
    "- Default: strict compliance with this file.",
    "- Exception path: .agent-override.md may explicitly allow narrow deviations.",
    "- Scope policy: every override must include module scope, rationale, and expiry date.",
    "",
    ...contextBlocks,
    "",
  ].join("\n");

  await fs.writeFile(path.join(resolvedTargetDirectoryPath, ".cursorrules"), compiledRules, "utf8");
  await fs.writeFile(path.join(resolvedTargetDirectoryPath, ".windsurfrules"), compiledRules, "utf8");
}

async function runInitCommand(targetDirectoryArgument, initOptions = {}) {
  const resolvedTargetDirectoryPath = path.resolve(targetDirectoryArgument || ".");
  await ensureDirectory(resolvedTargetDirectoryPath);

  const userInterface = readline.createInterface({ input, output });

  try {
    const stackFileNames = await collectFileNames(path.join(AGENT_CONTEXT_DIR, "stacks"));
    const blueprintFileNames = await collectFileNames(path.join(AGENT_CONTEXT_DIR, "blueprints"));

    const selectedStackFileNameFromOption = initOptions.stack
      ? matchFileNameFromInput(initOptions.stack, stackFileNames)
      : null;

    if (initOptions.stack && !selectedStackFileNameFromOption) {
      throw new Error(`Unknown stack: ${initOptions.stack}`);
    }

    const selectedBlueprintFileNameFromOption = initOptions.blueprint
      ? matchFileNameFromInput(initOptions.blueprint, blueprintFileNames)
      : null;

    if (initOptions.blueprint && !selectedBlueprintFileNameFromOption) {
      throw new Error(`Unknown blueprint: ${initOptions.blueprint}`);
    }

    const stackDisplayChoices = stackFileNames.map((stackFileName) => toTitleCase(stackFileName));
    const blueprintDisplayChoices = blueprintFileNames.map((blueprintFileName) => toTitleCase(blueprintFileName));

    const selectedResolvedStackFileName = selectedStackFileNameFromOption
      || stackFileNames[
        stackDisplayChoices.indexOf(
          await askChoice("What is your core stack?", stackDisplayChoices, userInterface)
        )
      ];

    const selectedResolvedBlueprintFileName = selectedBlueprintFileNameFromOption
      || blueprintFileNames[
        blueprintDisplayChoices.indexOf(
          await askChoice("Which blueprint do you want to scaffold?", blueprintDisplayChoices, userInterface)
        )
      ];

    const includeCiGuardrails = typeof initOptions.ci === "boolean"
      ? initOptions.ci
      : await askYesNo("Include CI/CD guardrails?", userInterface);

    for (const sourceDirectoryName of directoryCopies) {
      const sourceDirectoryPath = path.join(REPO_ROOT, sourceDirectoryName);
      if (!(await pathExists(sourceDirectoryPath))) continue;
      const targetDirectoryPath = path.join(resolvedTargetDirectoryPath, sourceDirectoryName);
      await copyDirectory(sourceDirectoryPath, targetDirectoryPath);
    }

    for (const entryPointFileName of entryPointFiles) {
      const sourceFilePath = path.join(REPO_ROOT, entryPointFileName);
      if (!(await pathExists(sourceFilePath))) continue;
      const targetFilePath = path.join(resolvedTargetDirectoryPath, entryPointFileName);
      const targetParentDirectoryPath = path.dirname(targetFilePath);
      await ensureDirectory(targetParentDirectoryPath);
      await fs.copyFile(sourceFilePath, targetFilePath);
    }

    await compileDynamicContext({
      targetDirectoryPath: resolvedTargetDirectoryPath,
      selectedStackFileName: selectedResolvedStackFileName,
      selectedBlueprintFileName: selectedResolvedBlueprintFileName,
      includeCiGuardrails,
    });

    console.log("\nInitialization complete.");
    console.log(`- Target directory: ${resolvedTargetDirectoryPath}`);
    console.log(`- Selected stack: ${selectedResolvedStackFileName}`);
    console.log(`- Selected blueprint: ${selectedResolvedBlueprintFileName}`);
    console.log(`- CI/CD guardrails: ${includeCiGuardrails ? "enabled" : "disabled"}`);
    console.log("- Compiled governance: .cursorrules + .windsurfrules generated");
  } finally {
    userInterface.close();
  }
}

async function main() {
  const commandArgument = process.argv[2];
  const initArguments = process.argv.slice(3);

  if (!commandArgument || commandArgument === "--help" || commandArgument === "-h") {
    printUsage();
    return;
  }

  if (commandArgument === "--version" || commandArgument === "-v") {
    console.log(CLI_VERSION);
    return;
  }

  if (commandArgument !== "init") {
    console.error(`Unknown command: ${commandArgument}`);
    printUsage();
    exit(1);
  }

  const parsedInitOptions = {
    targetDirectory: ".",
    stack: undefined,
    blueprint: undefined,
    ci: undefined,
  };

  for (let argumentIndex = 0; argumentIndex < initArguments.length; argumentIndex++) {
    const currentArgument = initArguments[argumentIndex];

    if (!currentArgument.startsWith("--")) {
      parsedInitOptions.targetDirectory = currentArgument;
      continue;
    }

    if (currentArgument === "--stack") {
      parsedInitOptions.stack = initArguments[argumentIndex + 1];
      argumentIndex++;
      continue;
    }

    if (currentArgument.startsWith("--stack=")) {
      parsedInitOptions.stack = currentArgument.split("=")[1];
      continue;
    }

    if (currentArgument === "--blueprint") {
      parsedInitOptions.blueprint = initArguments[argumentIndex + 1];
      argumentIndex++;
      continue;
    }

    if (currentArgument.startsWith("--blueprint=")) {
      parsedInitOptions.blueprint = currentArgument.split("=")[1];
      continue;
    }

    if (currentArgument === "--ci") {
      const ciRawValue = initArguments[argumentIndex + 1];
      parsedInitOptions.ci = ciRawValue?.toLowerCase() === "true";
      argumentIndex++;
      continue;
    }

    if (currentArgument.startsWith("--ci=")) {
      parsedInitOptions.ci = currentArgument.split("=")[1]?.toLowerCase() === "true";
      continue;
    }

    throw new Error(`Unknown option: ${currentArgument}`);
  }

  await runInitCommand(parsedInitOptions.targetDirectory, {
    stack: parsedInitOptions.stack,
    blueprint: parsedInitOptions.blueprint,
    ci: parsedInitOptions.ci,
  });
}

main().catch((error) => {
  console.error("CLI failed:", error);
  exit(1);
});
