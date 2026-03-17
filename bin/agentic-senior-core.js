#!/usr/bin/env node
/**
 * Agentic-Senior-Core CLI (V1.5)
 *
 * Newbie-first delivery engine for bootstrapping governance files with
 * profile selection, stack auto-detection, and plain-language summaries.
 */

const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const path = require("node:path");
const readline = require("node:readline/promises");
const { stdin: input, stdout: output, exit } = require("node:process");

const REPO_ROOT = path.resolve(__dirname, "..");
const PACKAGE_JSON_PATH = path.join(REPO_ROOT, "package.json");
const CLI_VERSION = JSON.parse(fsSync.readFileSync(PACKAGE_JSON_PATH, "utf8")).version;
const AGENT_CONTEXT_DIR = path.join(REPO_ROOT, ".agent-context");
const POLICY_FILE_NAME = "llm-judge-threshold.json";
const BLUEPRINT_RECOMMENDATIONS = {
  "typescript.md": "api-nextjs.md",
  "python.md": "fastapi-service.md",
  "java.md": "spring-boot-api.md",
  "php.md": "laravel-api.md",
  "go.md": "go-service.md",
  "csharp.md": "aspnet-api.md",
};
const PROFILE_PRESETS = {
  beginner: {
    displayName: "Beginner",
    description: "Safest path. Minimal decisions, TypeScript defaults, and CI enabled.",
    defaultStackFileName: "typescript.md",
    defaultBlueprintFileName: "api-nextjs.md",
    defaultCi: true,
    lockCi: true,
    blockingSeverities: ["critical"],
  },
  balanced: {
    displayName: "Balanced",
    description: "Recommended for most teams. Guided choices with strong default guardrails.",
    defaultStackFileName: null,
    defaultBlueprintFileName: null,
    defaultCi: true,
    lockCi: false,
    blockingSeverities: ["critical", "high"],
  },
  strict: {
    displayName: "Strict",
    description: "Tighter governance. CI stays on and medium-risk findings can block merges.",
    defaultStackFileName: null,
    defaultBlueprintFileName: null,
    defaultCi: true,
    lockCi: true,
    blockingSeverities: ["critical", "high", "medium"],
  },
};

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
  console.log("Local runtime:");
  console.log("  npx @fatidaprilian/agentic-senior-core init");
  console.log("  bunx @fatidaprilian/agentic-senior-core init   # optional Bun path");
  console.log("");
  console.log("Usage:");
  console.log("  agentic-senior-core init [target-directory] [--profile <beginner|balanced|strict>] [--stack <name>] [--blueprint <name>] [--ci <true|false>] [--newbie]");
  console.log("  agentic-senior-core --version");
  console.log("");
  console.log("Options:");
  console.log("  --help       Show help");
  console.log("  --version    Show CLI version");
  console.log("  --profile    Choose beginner, balanced, or strict");
  console.log("  --newbie     Alias for --profile beginner");
  console.log("  --stack      Override stack selection");
  console.log("  --blueprint  Override blueprint selection");
  console.log("  --ci         Override CI/CD guardrails (true|false)");
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
  if (path.resolve(sourceDirectoryPath) === path.resolve(targetDirectoryPath)) {
    return;
  }

  await ensureDirectory(targetDirectoryPath);
  const directoryEntries = await fs.readdir(sourceDirectoryPath, { withFileTypes: true });

  for (const directoryEntry of directoryEntries) {
    const sourceEntryPath = path.join(sourceDirectoryPath, directoryEntry.name);
    const targetEntryPath = path.join(targetDirectoryPath, directoryEntry.name);

    if (directoryEntry.isDirectory()) {
      await copyDirectory(sourceEntryPath, targetEntryPath);
      continue;
    }

    if (path.resolve(sourceEntryPath) === path.resolve(targetEntryPath)) {
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

async function askYesNo(promptMessage, userInterface, defaultValue) {
  const suffix = typeof defaultValue === "boolean"
    ? defaultValue ? " (Y/n): " : " (y/N): "
    : " (y/n): ";

  while (true) {
    const answer = await userInterface.question(`\n${promptMessage}${suffix}`);
    const normalizedAnswer = answer.trim().toLowerCase();

    if (!normalizedAnswer && typeof defaultValue === "boolean") {
      return defaultValue;
    }

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

function matchProfileNameFromInput(rawInput) {
  const normalizedInput = normalizeChoiceInput(rawInput);
  return Object.keys(PROFILE_PRESETS).find((profileName) => profileName === normalizedInput) || null;
}

async function collectFileNames(folderPath) {
  const fileNames = await fs.readdir(folderPath, { withFileTypes: true });
  return fileNames
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort((leftName, rightName) => leftName.localeCompare(rightName));
}

async function collectProjectMarkers(targetDirectoryPath) {
  const markerNames = new Set();
  const directoryEntries = await fs.readdir(targetDirectoryPath, { withFileTypes: true });

  for (const directoryEntry of directoryEntries) {
    if (directoryEntry.name === ".git" || directoryEntry.name === "node_modules") {
      continue;
    }

    markerNames.add(directoryEntry.name);
  }

  return markerNames;
}

async function detectProjectContext(targetDirectoryPath) {
  const markerNames = await collectProjectMarkers(targetDirectoryPath);
  const detectionCandidates = [];
  const hasExistingProjectFiles = markerNames.size > 0;

  if (markerNames.has("package.json") || markerNames.has("tsconfig.json") || markerNames.has("next.config.js") || markerNames.has("next.config.mjs")) {
    const evidence = [];
    let confidenceScore = 0.7;

    if (markerNames.has("package.json")) {
      evidence.push("package.json");
      confidenceScore += 0.12;
    }

    if (markerNames.has("tsconfig.json")) {
      evidence.push("tsconfig.json");
      confidenceScore += 0.12;
    }

    if (markerNames.has("next.config.js") || markerNames.has("next.config.mjs")) {
      evidence.push("Next.js config");
      confidenceScore += 0.05;
    }

    detectionCandidates.push({
      stackFileName: "typescript.md",
      confidenceScore: Math.min(confidenceScore, 0.97),
      evidence,
    });
  }

  if (markerNames.has("pyproject.toml") || markerNames.has("requirements.txt")) {
    detectionCandidates.push({
      stackFileName: "python.md",
      confidenceScore: markerNames.has("pyproject.toml") ? 0.96 : 0.78,
      evidence: markerNames.has("pyproject.toml") ? ["pyproject.toml"] : ["requirements.txt"],
    });
  }

  if (markerNames.has("pom.xml") || markerNames.has("build.gradle") || markerNames.has("build.gradle.kts")) {
    const evidence = [];
    if (markerNames.has("pom.xml")) evidence.push("pom.xml");
    if (markerNames.has("build.gradle") || markerNames.has("build.gradle.kts")) evidence.push("Gradle build file");
    detectionCandidates.push({
      stackFileName: "java.md",
      confidenceScore: markerNames.has("pom.xml") ? 0.95 : 0.84,
      evidence,
    });
  }

  if (markerNames.has("composer.json")) {
    detectionCandidates.push({
      stackFileName: "php.md",
      confidenceScore: 0.95,
      evidence: ["composer.json"],
    });
  }

  if (markerNames.has("go.mod")) {
    detectionCandidates.push({
      stackFileName: "go.md",
      confidenceScore: 0.96,
      evidence: ["go.mod"],
    });
  }

  if (markerNames.has("Cargo.toml")) {
    detectionCandidates.push({
      stackFileName: "rust.md",
      confidenceScore: 0.96,
      evidence: ["Cargo.toml"],
    });
  }

  if (markerNames.has("Gemfile")) {
    detectionCandidates.push({
      stackFileName: "ruby.md",
      confidenceScore: 0.95,
      evidence: ["Gemfile"],
    });
  }

  const hasDotNetMarker = Array.from(markerNames).some((markerName) => markerName.endsWith(".sln") || markerName.endsWith(".csproj"));
  if (hasDotNetMarker) {
    detectionCandidates.push({
      stackFileName: "csharp.md",
      confidenceScore: 0.95,
      evidence: [".sln or .csproj file"],
    });
  }

  if (detectionCandidates.length === 0) {
    return {
      hasExistingProjectFiles,
      recommendedStackFileName: null,
      recommendedBlueprintFileName: null,
      confidenceLabel: null,
      confidenceScore: 0,
      evidence: [],
    };
  }

  detectionCandidates.sort((leftCandidate, rightCandidate) => rightCandidate.confidenceScore - leftCandidate.confidenceScore);
  const strongestCandidate = detectionCandidates[0];
  const secondStrongestCandidate = detectionCandidates[1];
  const isAmbiguous = secondStrongestCandidate
    && strongestCandidate.confidenceScore - secondStrongestCandidate.confidenceScore < 0.08;
  const confidenceLabel = strongestCandidate.confidenceScore >= 0.9
    ? "high"
    : strongestCandidate.confidenceScore >= 0.78
      ? "medium"
      : "low";
  const evidence = isAmbiguous
    ? [...strongestCandidate.evidence, `multiple stack signals detected`]
    : strongestCandidate.evidence;

  return {
    hasExistingProjectFiles,
    recommendedStackFileName: strongestCandidate.stackFileName,
    recommendedBlueprintFileName: BLUEPRINT_RECOMMENDATIONS[strongestCandidate.stackFileName] || null,
    confidenceLabel,
    confidenceScore: strongestCandidate.confidenceScore,
    evidence,
  };
}

function formatBlockingSeverities(blockingSeverities) {
  return blockingSeverities.join(", ");
}

function formatDuration(durationMs) {
  const durationInSeconds = (durationMs / 1000).toFixed(1);
  return `${durationInSeconds}s`;
}

function buildDetectionSummary(projectDetection) {
  if (!projectDetection.recommendedStackFileName) {
    return "I did not find enough stack markers to auto-detect this project confidently.";
  }

  const readableEvidence = projectDetection.evidence.length > 0
    ? projectDetection.evidence.join(", ")
    : "basic project markers";

  return `This folder looks like ${toTitleCase(projectDetection.recommendedStackFileName)} with ${projectDetection.confidenceLabel} confidence based on ${readableEvidence}.`;
}

async function writeSelectedPolicy(targetDirectoryPath, selectedProfileName) {
  const policyFilePath = path.join(targetDirectoryPath, ".agent-context", "policies", POLICY_FILE_NAME);
  const parsedPolicy = JSON.parse(await fs.readFile(policyFilePath, "utf8"));
  parsedPolicy.selectedProfile = selectedProfileName;
  await fs.writeFile(policyFilePath, JSON.stringify(parsedPolicy, null, 2) + "\n", "utf8");
}

async function writeOnboardingReport({
  targetDirectoryPath,
  selectedProfileName,
  selectedStackFileName,
  selectedBlueprintFileName,
  includeCiGuardrails,
  setupDurationMs,
  projectDetection,
}) {
  const onboardingReportPath = path.join(targetDirectoryPath, ".agent-context", "state", "onboarding-report.json");
  const onboardingReport = {
    cliVersion: CLI_VERSION,
    generatedAt: new Date().toISOString(),
    selectedProfile: selectedProfileName,
    selectedStack: selectedStackFileName,
    selectedBlueprint: selectedBlueprintFileName,
    ciGuardrailsEnabled: includeCiGuardrails,
    setupDurationMs,
    autoDetection: {
      recommendedStack: projectDetection.recommendedStackFileName,
      recommendedBlueprint: projectDetection.recommendedBlueprintFileName,
      confidenceLabel: projectDetection.confidenceLabel,
      evidence: projectDetection.evidence,
    },
  };

  await fs.writeFile(onboardingReportPath, JSON.stringify(onboardingReport, null, 2) + "\n", "utf8");
}

async function compileDynamicContext({
  targetDirectoryPath,
  selectedProfileName,
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
    const githubCiBlueprintContent = await fs.readFile(path.join(selectedBlueprintsDirectoryPath, "ci-github-actions.md"), "utf8");
    const gitlabCiBlueprintContent = await fs.readFile(path.join(selectedBlueprintsDirectoryPath, "ci-gitlab.md"), "utf8");

    contextBlocks.push(
      `## CI/CD GUARDRAILS: ci-github-actions.md\nSource: .agent-context/blueprints/ci-github-actions.md\n\n${githubCiBlueprintContent.trim()}`
    );
    contextBlocks.push(
      `## CI/CD GUARDRAILS: ci-gitlab.md\nSource: .agent-context/blueprints/ci-gitlab.md\n\n${gitlabCiBlueprintContent.trim()}`
    );
  }

  const architectureMapContent = await fs.readFile(path.join(selectedStateDirectoryPath, "architecture-map.md"), "utf8");
  const dependencyMapContent = await fs.readFile(path.join(selectedStateDirectoryPath, "dependency-map.md"), "utf8");
  const prChecklistContent = await fs.readFile(path.join(selectedReviewDirectoryPath, "pr-checklist.md"), "utf8");

  contextBlocks.push(
    `## STATE MAP: architecture-map.md\nSource: .agent-context/state/architecture-map.md\n\n${architectureMapContent.trim()}`
  );
  contextBlocks.push(
    `## STATE MAP: dependency-map.md\nSource: .agent-context/state/dependency-map.md\n\n${dependencyMapContent.trim()}`
  );
  contextBlocks.push(
    `## REVIEW CHECKLIST: pr-checklist.md\nSource: .agent-context/review-checklists/pr-checklist.md\n\n${prChecklistContent.trim()}`
  );

  const compiledRules = [
    "# AGENTIC-SENIOR-CORE DYNAMIC GOVERNANCE RULESET",
    "",
    `Generated by Agentic-Senior-Core CLI v${CLI_VERSION}`,
    `Timestamp: ${new Date().toISOString()}`,
    `Selected profile: ${selectedProfileName}`,
    `Selected policy file: .agent-context/policies/${POLICY_FILE_NAME}`,
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
  const setupStartedAt = Date.now();
  await ensureDirectory(resolvedTargetDirectoryPath);

  const userInterface = readline.createInterface({ input, output });

  try {
    const stackFileNames = await collectFileNames(path.join(AGENT_CONTEXT_DIR, "stacks"));
    const blueprintFileNames = await collectFileNames(path.join(AGENT_CONTEXT_DIR, "blueprints"));

    const selectedStackFileNameFromOption = initOptions.stack
      ? matchFileNameFromInput(initOptions.stack, stackFileNames)
      : null;
    const selectedBlueprintFileNameFromOption = initOptions.blueprint
      ? matchFileNameFromInput(initOptions.blueprint, blueprintFileNames)
      : null;

    if (initOptions.stack && !selectedStackFileNameFromOption) {
      throw new Error(`Unknown stack: ${initOptions.stack}`);
    }

    if (initOptions.blueprint && !selectedBlueprintFileNameFromOption) {
      throw new Error(`Unknown blueprint: ${initOptions.blueprint}`);
    }

    console.log(`\nAgentic-Senior-Core CLI v${CLI_VERSION}`);
    console.log("I will copy governance files into your target folder and compile a single rulebook for your AI tools.");

    const projectDetection = await detectProjectContext(resolvedTargetDirectoryPath);
    if (projectDetection.hasExistingProjectFiles) {
      console.log("I found files in the target directory, so I checked whether this already looks like an existing project.");
      console.log(buildDetectionSummary(projectDetection));
    } else {
      console.log("The target directory is empty, so I will guide you through a fresh setup.");
    }

    const selectedProfileName = initOptions.profile
      ? initOptions.profile
      : initOptions.newbie
        ? "beginner"
        : normalizeChoiceInput(await askChoice(
          "How much guidance do you want?",
          Object.values(PROFILE_PRESETS).map((profilePreset) => `${profilePreset.displayName} — ${profilePreset.description}`),
          userInterface
        )).split("-")[0];

    const selectedProfile = PROFILE_PRESETS[selectedProfileName];
    if (!selectedProfile) {
      throw new Error(`Unknown profile: ${selectedProfileName}`);
    }

    console.log(`\nSelected profile: ${selectedProfile.displayName}`);
    console.log(`This profile will block these review severities in CI: ${formatBlockingSeverities(selectedProfile.blockingSeverities)}.`);

    const shouldApplyDetectedStack = projectDetection.recommendedStackFileName && !selectedStackFileNameFromOption
      ? await askYesNo(
        `Use the detected stack recommendation (${toTitleCase(projectDetection.recommendedStackFileName)})?`,
        userInterface,
        projectDetection.confidenceLabel === "high"
      )
      : false;

    const stackDisplayChoices = stackFileNames.map((stackFileName) => toTitleCase(stackFileName));
    const blueprintDisplayChoices = blueprintFileNames.map((blueprintFileName) => toTitleCase(blueprintFileName));

    const selectedResolvedStackFileName = selectedStackFileNameFromOption
      || (shouldApplyDetectedStack ? projectDetection.recommendedStackFileName : null)
      || selectedProfile.defaultStackFileName
      || stackFileNames[
        stackDisplayChoices.indexOf(
          await askChoice("Which stack should this governance pack target?", stackDisplayChoices, userInterface)
        )
      ];

    const recommendedBlueprintFileName = shouldApplyDetectedStack
      ? projectDetection.recommendedBlueprintFileName
      : BLUEPRINT_RECOMMENDATIONS[selectedResolvedStackFileName] || null;

    if (!recommendedBlueprintFileName && !selectedBlueprintFileNameFromOption && !selectedProfile.defaultBlueprintFileName) {
      console.log("\nI could not map that stack to a first-party blueprint automatically, so I will ask you to choose one.");
    }

    const selectedResolvedBlueprintFileName = selectedBlueprintFileNameFromOption
      || recommendedBlueprintFileName
      || selectedProfile.defaultBlueprintFileName
      || blueprintFileNames[
        blueprintDisplayChoices.indexOf(
          await askChoice("Which blueprint should I scaffold into the compiled rulebook?", blueprintDisplayChoices, userInterface)
        )
      ];

    const includeCiGuardrails = typeof initOptions.ci === "boolean"
      ? initOptions.ci
      : selectedProfile.lockCi
        ? selectedProfile.defaultCi
        : await askYesNo("Enable CI/CD guardrails and the LLM Judge policy?", userInterface, selectedProfile.defaultCi);

    for (const sourceDirectoryName of directoryCopies) {
      const sourceDirectoryPath = path.join(REPO_ROOT, sourceDirectoryName);
      if (!(await pathExists(sourceDirectoryPath))) {
        continue;
      }

      await copyDirectory(sourceDirectoryPath, path.join(resolvedTargetDirectoryPath, sourceDirectoryName));
    }

    for (const entryPointFileName of entryPointFiles) {
      const sourceFilePath = path.join(REPO_ROOT, entryPointFileName);
      const targetFilePath = path.join(resolvedTargetDirectoryPath, entryPointFileName);

      if (!(await pathExists(sourceFilePath))) {
        continue;
      }

      if (path.resolve(sourceFilePath) === path.resolve(targetFilePath)) {
        continue;
      }

      await ensureDirectory(path.dirname(targetFilePath));
      await fs.copyFile(sourceFilePath, targetFilePath);
    }

    await compileDynamicContext({
      targetDirectoryPath: resolvedTargetDirectoryPath,
      selectedProfileName,
      selectedStackFileName: selectedResolvedStackFileName,
      selectedBlueprintFileName: selectedResolvedBlueprintFileName,
      includeCiGuardrails,
    });

    await writeSelectedPolicy(resolvedTargetDirectoryPath, selectedProfileName);

    const setupDurationMs = Date.now() - setupStartedAt;
    await writeOnboardingReport({
      targetDirectoryPath: resolvedTargetDirectoryPath,
      selectedProfileName,
      selectedStackFileName: selectedResolvedStackFileName,
      selectedBlueprintFileName: selectedResolvedBlueprintFileName,
      includeCiGuardrails,
      setupDurationMs,
      projectDetection,
    });

    console.log("\nInitialization complete.");
    console.log(`- Target directory: ${resolvedTargetDirectoryPath}`);
    console.log(`- Profile: ${selectedProfile.displayName}`);
    console.log(`- Stack: ${toTitleCase(selectedResolvedStackFileName)}`);
    console.log(`- Blueprint: ${toTitleCase(selectedResolvedBlueprintFileName)}`);
    console.log(`- CI/CD guardrails: ${includeCiGuardrails ? "enabled" : "disabled"}`);
    console.log(`- Blocking severities: ${formatBlockingSeverities(selectedProfile.blockingSeverities)}`);
    console.log(`- Setup time: ${formatDuration(setupDurationMs)}`);
    console.log("- Generated files: .cursorrules, .windsurfrules, and .agent-context/state/onboarding-report.json");
    console.log("\nPlain-language summary:");
    console.log(`I prepared a ${selectedProfile.displayName.toLowerCase()} governance pack for a ${toTitleCase(selectedResolvedStackFileName)} project using the ${toTitleCase(selectedResolvedBlueprintFileName)} blueprint.`);
    console.log("Your AI tools will now receive one compiled rulebook plus the original source rules, and your review threshold is stored in .agent-context/policies/llm-judge-threshold.json.");
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
    profile: undefined,
    stack: undefined,
    blueprint: undefined,
    ci: undefined,
    newbie: false,
  };

  for (let argumentIndex = 0; argumentIndex < initArguments.length; argumentIndex++) {
    const currentArgument = initArguments[argumentIndex];

    if (!currentArgument.startsWith("--")) {
      parsedInitOptions.targetDirectory = currentArgument;
      continue;
    }

    if (currentArgument === "--profile") {
      parsedInitOptions.profile = matchProfileNameFromInput(initArguments[argumentIndex + 1] || "");
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith("--profile=")) {
      parsedInitOptions.profile = matchProfileNameFromInput(currentArgument.split("=")[1]);
      continue;
    }

    if (currentArgument === "--stack") {
      parsedInitOptions.stack = initArguments[argumentIndex + 1];
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith("--stack=")) {
      parsedInitOptions.stack = currentArgument.split("=")[1];
      continue;
    }

    if (currentArgument === "--blueprint") {
      parsedInitOptions.blueprint = initArguments[argumentIndex + 1];
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith("--blueprint=")) {
      parsedInitOptions.blueprint = currentArgument.split("=")[1];
      continue;
    }

    if (currentArgument === "--ci") {
      const ciRawValue = initArguments[argumentIndex + 1];
      parsedInitOptions.ci = ciRawValue?.toLowerCase() === "true";
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith("--ci=")) {
      parsedInitOptions.ci = currentArgument.split("=")[1]?.toLowerCase() === "true";
      continue;
    }

    if (currentArgument === "--newbie") {
      parsedInitOptions.newbie = true;
      continue;
    }

    throw new Error(`Unknown option: ${currentArgument}`);
  }

  if (parsedInitOptions.newbie && parsedInitOptions.profile && parsedInitOptions.profile !== "beginner") {
    throw new Error("--newbie can only be combined with --profile beginner");
  }

  await runInitCommand(parsedInitOptions.targetDirectory, {
    profile: parsedInitOptions.profile,
    stack: parsedInitOptions.stack,
    blueprint: parsedInitOptions.blueprint,
    ci: parsedInitOptions.ci,
    newbie: parsedInitOptions.newbie,
  });
}

main().catch((error) => {
  console.error("CLI failed:", error);
  exit(1);
});
