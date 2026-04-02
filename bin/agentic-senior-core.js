#!/usr/bin/env node
/**
 * Agentic-Senior-Core CLI (V1.7)
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
const SKILL_PLATFORM_DIRECTORY = path.join(AGENT_CONTEXT_DIR, "skills");
const SKILL_PLATFORM_INDEX_PATH = path.join(SKILL_PLATFORM_DIRECTORY, "index.json");
const POLICY_FILE_NAME = "llm-judge-threshold.json";
const PROFILE_PACKS_DIRECTORY_NAME = "profiles";
const PROFILE_PACK_REQUIRED_FIELDS = [
  "slug",
  "displayName",
  "description",
  "defaultProfile",
  "defaultStack",
  "defaultBlueprint",
  "ciGuardrails",
  "lockCi",
  "blockingSeverities",
];
const ALLOWED_SEVERITY_LEVELS = new Set(["critical", "high", "medium", "low"]);
const BLUEPRINT_RECOMMENDATIONS = {
  "typescript.md": "api-nextjs.md",
  "python.md": "fastapi-service.md",
  "java.md": "spring-boot-api.md",
  "php.md": "laravel-api.md",
  "go.md": "go-service.md",
  "csharp.md": "aspnet-api.md",
  "react-native.md": "mobile-app.md",
  "flutter.md": "mobile-app.md",
};
const INIT_PRESETS = {
  "frontend-web": {
    profile: "balanced",
    stack: "typescript.md",
    blueprint: "api-nextjs.md",
    ci: true,
    description: "Frontend-first web app starter",
  },
  "backend-api": {
    profile: "balanced",
    stack: "python.md",
    blueprint: "fastapi-service.md",
    ci: true,
    description: "Backend API starter with safe defaults",
  },
  "fullstack-product": {
    profile: "balanced",
    stack: "typescript.md",
    blueprint: "api-nextjs.md",
    ci: true,
    description: "Product delivery starter with fullstack governance",
  },
  "platform-governance": {
    profile: "strict",
    stack: "go.md",
    blueprint: "go-service.md",
    ci: true,
    description: "Strict release and platform governance starter",
  },
  "mobile-react-native": {
    profile: "balanced",
    stack: "react-native.md",
    blueprint: "mobile-app.md",
    ci: true,
    description: "Mobile app starter for React Native",
  },
  "mobile-flutter": {
    profile: "balanced",
    stack: "flutter.md",
    blueprint: "mobile-app.md",
    ci: true,
    description: "Mobile app starter for Flutter",
  },
  "observability-platform": {
    profile: "strict",
    stack: "go.md",
    blueprint: "observability.md",
    ci: true,
    description: "Observability and platform starter",
  },
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
  console.log("  npm exec --yes @ryuenn3123/agentic-senior-core init");
  console.log("  npx @ryuenn3123/agentic-senior-core init");
  console.log("  npm install -g @ryuenn3123/agentic-senior-core && agentic-senior-core init");
  console.log("  bunx @ryuenn3123/agentic-senior-core init   # optional Bun path");
  console.log("  open GitHub template: https://github.com/fatidaprilian/Agentic-Senior-Core/generate");
  console.log("");
  console.log("Usage:");
  console.log("  agentic-senior-core launch");
  console.log("  agentic-senior-core init [target-directory] [--preset <name>] [--profile <beginner|balanced|strict>] [--profile-pack <name>] [--stack <name>] [--blueprint <name>] [--ci <true|false>] [--newbie]");
  console.log("  agentic-senior-core upgrade [target-directory] [--dry-run] [--yes]");
  console.log("  agentic-senior-core skill [domain] [--tier <standard|advance|expert|above>] [--json]");
  console.log("  agentic-senior-core --version");
  console.log("");
  console.log("Options:");
  console.log("  --help       Show help");
  console.log("  --version    Show CLI version");
  console.log("  --profile    Choose beginner, balanced, or strict");
  console.log("  --preset     Use a plug-and-play starter preset (frontend-web, backend-api, fullstack-product, platform-governance, mobile-react-native, mobile-flutter, observability-platform)");
  console.log("  --profile-pack  Apply a team profile pack (startup, regulated, platform)");
  console.log("  --newbie     Alias for --profile beginner");
  console.log("  --stack      Override stack selection");
  console.log("  --blueprint  Override blueprint selection");
  console.log("  --ci         Override CI/CD guardrails (true|false)");
  console.log("  --dry-run    Preview upgrade without writing files");
  console.log("  --yes        Skip confirmation prompts for upgrade");
  console.log("  --tier       Choose a skill tier for the skill selector");
  console.log("  --json       Emit machine-readable skill selection output");
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

async function copyGovernanceAssetsToTarget(resolvedTargetDirectoryPath) {
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

async function runLaunchCommand() {
  const userInterface = readline.createInterface({ input, output });

  try {
    console.log(`\nAgentic-Senior-Core CLI v${CLI_VERSION}`);
    console.log("Start with a numbered choice. You can still use commands later if you want direct control.");

    const launchChoice = await askChoice(
      "How do you want to start?",
      [
        "GitHub template (zero install)",
        "npm / npx path",
        "Bootstrap scripts",
        "Preset starter",
        "Interactive init wizard",
        "Skill selector",
        "Exit",
      ],
      userInterface
    );

    if (launchChoice === "GitHub template (zero install)") {
      console.log("\nOpen the GitHub template here:");
      console.log("https://github.com/fatidaprilian/Agentic-Senior-Core/generate");
      return;
    }

    if (launchChoice === "npm / npx path") {
      console.log("\nChoose one of these package paths:");
      console.log("npm exec --yes @ryuenn3123/agentic-senior-core init");
      console.log("npx @ryuenn3123/agentic-senior-core init");
      console.log("npm install -g @ryuenn3123/agentic-senior-core && agentic-senior-core init");
      return;
    }

    if (launchChoice === "Bootstrap scripts") {
      console.log("\nUse the repository bootstrap scripts:");
      console.log("Windows: powershell -ExecutionPolicy Bypass -File .\\scripts\\init-project.ps1 -TargetDirectory .");
      console.log("Linux/macOS: bash ./scripts/init-project.sh .");
      return;
    }

    if (launchChoice === "Preset starter") {
      const presetNames = Object.keys(INIT_PRESETS);
      const selectedPresetName = await askChoice(
        "Choose a starter preset:",
        presetNames.map((presetName) => `${presetName} - ${INIT_PRESETS[presetName].description}`),
        userInterface
      );

      await runInitCommand(".", { preset: normalizeChoiceInput(selectedPresetName.split(" - ")[0]) });
      return;
    }

    if (launchChoice === "Interactive init wizard") {
      await runInitCommand(".", {});
      return;
    }

    if (launchChoice === "Skill selector") {
      await runSkillCommand([]);
      return;
    }

    console.log("Exit selected.");
  } finally {
    userInterface.close();
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

function parseBooleanSetting(rawBooleanValue, contextLabel) {
  const normalizedValue = normalizeChoiceInput(rawBooleanValue);

  if (normalizedValue === "true") {
    return true;
  }

  if (normalizedValue === "false") {
    return false;
  }

  throw new Error(`Invalid boolean value for ${contextLabel}: ${rawBooleanValue}`);
}

function parseBlockingSeverities(rawSeverityValues, fileName) {
  const parsedSeverities = rawSeverityValues
    .split(",")
    .map((severityValue) => normalizeChoiceInput(severityValue))
    .filter(Boolean);

  if (parsedSeverities.length === 0) {
    throw new Error(`Profile pack ${fileName} must define at least one blocking severity.`);
  }

  const invalidSeverity = parsedSeverities.find((severityValue) => !ALLOWED_SEVERITY_LEVELS.has(severityValue));
  if (invalidSeverity) {
    throw new Error(`Profile pack ${fileName} uses unsupported severity: ${invalidSeverity}`);
  }

  return parsedSeverities;
}

function parseProfilePackContent(fileName, profilePackContent) {
  const parsedFields = {};
  const profilePackLines = profilePackContent.split(/\r?\n/);

  for (const profilePackLine of profilePackLines) {
    const lineMatch = profilePackLine.match(/^([A-Za-z][A-Za-z0-9 ]+):\s*(.+)$/);
    if (!lineMatch) {
      continue;
    }

    const fieldName = lineMatch[1].trim();
    const fieldValue = lineMatch[2].trim();
    parsedFields[fieldName] = fieldValue;
  }

  for (const requiredFieldName of PROFILE_PACK_REQUIRED_FIELDS) {
    if (!parsedFields[requiredFieldName]) {
      throw new Error(`Profile pack ${fileName} is missing required field: ${requiredFieldName}`);
    }
  }

  const defaultProfileName = matchProfileNameFromInput(parsedFields.defaultProfile);
  if (!defaultProfileName) {
    throw new Error(`Profile pack ${fileName} has invalid defaultProfile: ${parsedFields.defaultProfile}`);
  }

  return {
    fileName,
    slug: normalizeChoiceInput(parsedFields.slug),
    displayName: parsedFields.displayName,
    description: parsedFields.description,
    defaultProfileName,
    defaultStackFileName: parsedFields.defaultStack.trim(),
    defaultBlueprintFileName: parsedFields.defaultBlueprint.trim(),
    defaultCi: parseBooleanSetting(parsedFields.ciGuardrails, `${fileName} ciGuardrails`),
    lockCi: parseBooleanSetting(parsedFields.lockCi, `${fileName} lockCi`),
    blockingSeverities: parseBlockingSeverities(parsedFields.blockingSeverities, fileName),
    owner: parsedFields.owner || null,
    lastUpdated: parsedFields.lastUpdated || null,
  };
}

async function collectProfilePacks(targetDirectoryPath) {
  const profilePackDirectoryPath = path.join(targetDirectoryPath, ".agent-context", PROFILE_PACKS_DIRECTORY_NAME);
  if (!(await pathExists(profilePackDirectoryPath))) {
    return [];
  }

  const profilePackFileNames = await collectFileNames(profilePackDirectoryPath);
  const profilePackDefinitions = [];

  for (const profilePackFileName of profilePackFileNames) {
    const profilePackFilePath = path.join(profilePackDirectoryPath, profilePackFileName);
    const profilePackContent = await fs.readFile(profilePackFilePath, "utf8");
    profilePackDefinitions.push(parseProfilePackContent(profilePackFileName, profilePackContent));
  }

  return profilePackDefinitions;
}

function findProfilePackByInput(profilePackInput, profilePackDefinitions) {
  const normalizedProfilePackInput = normalizeChoiceInput(profilePackInput);

  return profilePackDefinitions.find((profilePackDefinition) => {
    const normalizedFileName = normalizeChoiceInput(profilePackDefinition.fileName.replace(/\.md$/i, ""));
    const normalizedSlug = normalizeChoiceInput(profilePackDefinition.slug);
    const normalizedDisplayName = normalizeChoiceInput(profilePackDefinition.displayName);

    return normalizedProfilePackInput === normalizedFileName
      || normalizedProfilePackInput === normalizedSlug
      || normalizedProfilePackInput === normalizedDisplayName;
  }) || null;
}

async function loadSkillPlatformIndex() {
  const skillPlatformIndexContent = await fs.readFile(SKILL_PLATFORM_INDEX_PATH, "utf8");
  return JSON.parse(skillPlatformIndexContent);
}

function normalizeSkillTierInput(rawTierInput) {
  const normalizedTierInput = normalizeChoiceInput(rawTierInput);
  const allowedTierNames = new Set(["standard", "advance", "expert", "above"]);

  if (!allowedTierNames.has(normalizedTierInput)) {
    return null;
  }

  return normalizedTierInput;
}

function findSkillDomainByInput(skillDomainInput, skillDomainEntries) {
  const normalizedSkillDomainInput = normalizeChoiceInput(skillDomainInput);

  return skillDomainEntries.find((skillDomainEntry) => {
    const normalizedDomainName = normalizeChoiceInput(skillDomainEntry.name);
    const normalizedDisplayName = normalizeChoiceInput(skillDomainEntry.displayName);

    return normalizedSkillDomainInput === normalizedDomainName || normalizedSkillDomainInput === normalizedDisplayName;
  }) || null;
}

function formatSkillTierList(skillPlatformIndex) {
  return skillPlatformIndex.tiers.map((tierDefinition) => `${tierDefinition.name} (${tierDefinition.description})`).join("\n");
}

function inferSkillDomainNamesFromSelection(selectedStackFileName, selectedBlueprintFileName) {
  const inferredDomainNames = new Set();

  if (selectedBlueprintFileName === "api-nextjs.md" || selectedBlueprintFileName === "fastapi-service.md") {
    inferredDomainNames.add("frontend");
    inferredDomainNames.add("fullstack");
    inferredDomainNames.add("cli");
  }

  if (selectedBlueprintFileName === "go-service.md"
    || selectedBlueprintFileName === "spring-boot-api.md"
    || selectedBlueprintFileName === "laravel-api.md"
    || selectedBlueprintFileName === "aspnet-api.md") {
    inferredDomainNames.add("backend");
    inferredDomainNames.add("fullstack");
    inferredDomainNames.add("cli");
  }

  if (selectedStackFileName === "typescript.md") {
    inferredDomainNames.add("frontend");
    inferredDomainNames.add("cli");
  }

  if (selectedStackFileName === "go.md"
    || selectedStackFileName === "java.md"
    || selectedStackFileName === "php.md"
    || selectedStackFileName === "csharp.md"
    || selectedStackFileName === "python.md"
    || selectedStackFileName === "ruby.md"
    || selectedStackFileName === "rust.md") {
    inferredDomainNames.add("backend");
  }

  if (selectedStackFileName === "react-native.md" || selectedStackFileName === "flutter.md") {
    inferredDomainNames.add("frontend");
    inferredDomainNames.add("fullstack");
    inferredDomainNames.add("cli");
  }

  if (selectedBlueprintFileName === "mobile-app.md") {
    inferredDomainNames.add("frontend");
    inferredDomainNames.add("fullstack");
    inferredDomainNames.add("cli");
  }

  if (selectedBlueprintFileName === "observability.md") {
    inferredDomainNames.add("backend");
    inferredDomainNames.add("fullstack");
    inferredDomainNames.add("cli");
  }

  if (inferredDomainNames.size === 0) {
    inferredDomainNames.add("fullstack");
    inferredDomainNames.add("cli");
  }

  return Array.from(inferredDomainNames);
}

async function buildSkillPackSection(skillDomainEntry, selectedTierName) {
  const resolvedPackFileName = skillDomainEntry.tierToPackFileNames?.[selectedTierName]
    || skillDomainEntry.tierToPackFileNames?.[skillDomainEntry.defaultTier]
    || skillDomainEntry.defaultPackFileName;
  const skillPackFilePath = path.join(SKILL_PLATFORM_DIRECTORY, resolvedPackFileName);
  const skillPackContent = await fs.readFile(skillPackFilePath, "utf8");

  return [
    `## SKILL PACK: ${skillDomainEntry.displayName}`,
    `Source: .agent-context/skills/${resolvedPackFileName}`,
    `Default tier: ${skillDomainEntry.defaultTier}`,
    `Selected tier: ${selectedTierName}`,
    `Evidence: ${skillDomainEntry.evidence}`,
    "",
    skillPackContent.trim(),
    "",
  ].join("\n");
}

async function runSkillCommand(commandArguments) {
  const parsedSkillOptions = {
    domain: null,
    tier: null,
    tierProvided: false,
    json: false,
  };

  for (let argumentIndex = 0; argumentIndex < commandArguments.length; argumentIndex++) {
    const currentArgument = commandArguments[argumentIndex];

    if (!currentArgument.startsWith("--")) {
      parsedSkillOptions.domain = currentArgument;
      continue;
    }

    if (currentArgument === "--tier") {
      parsedSkillOptions.tier = normalizeSkillTierInput(commandArguments[argumentIndex + 1] || "");
      parsedSkillOptions.tierProvided = true;
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith("--tier=")) {
      parsedSkillOptions.tier = normalizeSkillTierInput(currentArgument.split("=")[1]);
      parsedSkillOptions.tierProvided = true;
      continue;
    }

    if (currentArgument === "--json") {
      parsedSkillOptions.json = true;
      continue;
    }

    throw new Error(`Unknown option: ${currentArgument}`);
  }

  const skillPlatformIndex = await loadSkillPlatformIndex();
  const skillDomainEntries = Object.values(skillPlatformIndex.domains || {});
  const selectedSkillDomain = parsedSkillOptions.domain
    ? findSkillDomainByInput(parsedSkillOptions.domain, skillDomainEntries)
    : null;

  if (parsedSkillOptions.domain && !selectedSkillDomain) {
    throw new Error(`Unknown skill domain: ${parsedSkillOptions.domain}`);
  }

  if (parsedSkillOptions.tierProvided && !parsedSkillOptions.tier) {
    throw new Error(`Unknown skill tier: ${commandArguments.join(" ")}`);
  }

  const selectedTierName = parsedSkillOptions.tier || skillPlatformIndex.defaultTier || "advance";
  const recommendedPackFileName = selectedSkillDomain
    ? selectedSkillDomain.tierToPackFileNames?.[selectedTierName]
      || selectedSkillDomain.tierToPackFileNames?.[selectedSkillDomain.defaultTier]
      || selectedSkillDomain.defaultPackFileName
      || null
    : null;

  if (parsedSkillOptions.json) {
    console.log(JSON.stringify({
      defaultTier: skillPlatformIndex.defaultTier,
      selectedTier: selectedTierName,
      selectedDomain: selectedSkillDomain,
      recommendedPackFileName,
    }, null, 2));
    return;
  }

  console.log("Skill platform selector");
  console.log(`Default tier: ${skillPlatformIndex.defaultTier}`);
  console.log(`Available tiers:\n${formatSkillTierList(skillPlatformIndex)}`);

  if (!selectedSkillDomain) {
    console.log("\nAvailable domains:");
    for (const skillDomainEntry of skillDomainEntries) {
      console.log(`- ${skillDomainEntry.name}: ${skillDomainEntry.description}`);
    }
    return;
  }

  console.log(`\nSelected domain: ${selectedSkillDomain.displayName}`);
  console.log(`Selected tier: ${selectedTierName}`);
  console.log(`Recommended pack: ${recommendedPackFileName}`);
  console.log(`Purpose: ${selectedSkillDomain.description}`);
  console.log(`Evidence: ${selectedSkillDomain.evidence}`);
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

  if (markerNames.has("package.json") && (markerNames.has("android") || markerNames.has("ios") || markerNames.has("react-native.config.js"))) {
    detectionCandidates.push({
      stackFileName: "react-native.md",
      confidenceScore: 0.9,
      evidence: ["package.json", "mobile runtime markers"],
    });
  }

  if (markerNames.has("pubspec.yaml")) {
    detectionCandidates.push({
      stackFileName: "flutter.md",
      confidenceScore: 0.94,
      evidence: ["pubspec.yaml"],
    });
  }

  if (detectionCandidates.length === 0) {
    return {
      hasExistingProjectFiles,
      recommendedStackFileName: null,
      recommendedBlueprintFileName: null,
      confidenceLabel: null,
      confidenceScore: 0,
      confidenceGap: 0,
      detectionReasoning: "No known project markers were detected.",
      rankedCandidates: [],
      evidence: [],
    };
  }

  detectionCandidates.sort((leftCandidate, rightCandidate) => rightCandidate.confidenceScore - leftCandidate.confidenceScore);
  const strongestCandidate = detectionCandidates[0];
  const secondStrongestCandidate = detectionCandidates[1];
  const confidenceGap = secondStrongestCandidate
    ? Number((strongestCandidate.confidenceScore - secondStrongestCandidate.confidenceScore).toFixed(2))
    : Number(strongestCandidate.confidenceScore.toFixed(2));
  const isAmbiguous = secondStrongestCandidate
    && confidenceGap < 0.08;
  const confidenceLabel = strongestCandidate.confidenceScore >= 0.9
    ? "high"
    : strongestCandidate.confidenceScore >= 0.78
      ? "medium"
      : "low";
  const evidence = isAmbiguous
    ? [...strongestCandidate.evidence, `multiple stack signals detected`]
    : strongestCandidate.evidence;
  const rankedCandidates = detectionCandidates.slice(0, 3).map((detectionCandidate) => ({
    stackFileName: detectionCandidate.stackFileName,
    confidenceScore: Number(detectionCandidate.confidenceScore.toFixed(2)),
    evidence: detectionCandidate.evidence,
  }));
  const detectionReasoning = isAmbiguous
    ? `Top signal ${toTitleCase(strongestCandidate.stackFileName)} is close to ${toTitleCase(secondStrongestCandidate.stackFileName)} (confidence gap ${confidenceGap}).`
    : `Top signal ${toTitleCase(strongestCandidate.stackFileName)} won with confidence ${strongestCandidate.confidenceScore.toFixed(2)} from markers: ${strongestCandidate.evidence.join(", ") || "none"}.`;

  return {
    hasExistingProjectFiles,
    recommendedStackFileName: strongestCandidate.stackFileName,
    recommendedBlueprintFileName: BLUEPRINT_RECOMMENDATIONS[strongestCandidate.stackFileName] || null,
    confidenceLabel,
    confidenceScore: strongestCandidate.confidenceScore,
    confidenceGap,
    detectionReasoning,
    rankedCandidates,
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

  const confidenceGapSummary = typeof projectDetection.confidenceGap === "number"
    ? ` Confidence gap: ${projectDetection.confidenceGap}.`
    : "";

  return `This folder looks like ${toTitleCase(projectDetection.recommendedStackFileName)} with ${projectDetection.confidenceLabel} confidence based on ${readableEvidence}.${confidenceGapSummary}`;
}

function formatDetectionCandidates(rankedCandidates) {
  if (!rankedCandidates?.length) {
    return "No ranked candidates available.";
  }

  return rankedCandidates
    .map((candidate, candidateIndex) => {
      const evidenceSummary = candidate.evidence?.length ? candidate.evidence.join(", ") : "no direct markers";
      return `${candidateIndex + 1}. ${toTitleCase(candidate.stackFileName)} (score ${candidate.confidenceScore}) via ${evidenceSummary}`;
    })
    .join("\n");
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
  selectedProfilePack,
  selectedPreset,
  selectedStackFileName,
  selectedBlueprintFileName,
  includeCiGuardrails,
  setupDurationMs,
  projectDetection,
  selectedSkillDomains = [],
  operationMode = "init",
}) {
  const onboardingReportPath = path.join(targetDirectoryPath, ".agent-context", "state", "onboarding-report.json");
  const onboardingReport = {
    cliVersion: CLI_VERSION,
    generatedAt: new Date().toISOString(),
    operationMode,
    selectedProfile: selectedProfileName,
    selectedProfilePack: selectedProfilePack
      ? {
        name: selectedProfilePack.slug,
        sourceFile: selectedProfilePack.fileName,
      }
      : null,
    selectedPreset,
    selectedStack: selectedStackFileName,
    selectedBlueprint: selectedBlueprintFileName,
    ciGuardrailsEnabled: includeCiGuardrails,
    setupDurationMs,
    selectedSkillDomains,
    autoDetection: {
      recommendedStack: projectDetection.recommendedStackFileName,
      recommendedBlueprint: projectDetection.recommendedBlueprintFileName,
      confidenceLabel: projectDetection.confidenceLabel,
      confidenceScore: projectDetection.confidenceScore,
      confidenceGap: projectDetection.confidenceGap,
      detectionReasoning: projectDetection.detectionReasoning,
      rankedCandidates: projectDetection.rankedCandidates,
      evidence: projectDetection.evidence,
    },
  };

  await fs.writeFile(onboardingReportPath, JSON.stringify(onboardingReport, null, 2) + "\n", "utf8");
}

async function loadOnboardingReportIfExists(targetDirectoryPath) {
  const onboardingReportPath = path.join(targetDirectoryPath, ".agent-context", "state", "onboarding-report.json");
  if (!(await pathExists(onboardingReportPath))) {
    return null;
  }

  const onboardingReportContent = await fs.readFile(onboardingReportPath, "utf8");
  return JSON.parse(onboardingReportContent);
}

async function buildCompiledRulesContent({
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
  const skillPlatformIndex = JSON.parse(await fs.readFile(SKILL_PLATFORM_INDEX_PATH, "utf8"));
  const selectedSkillDomainNames = inferSkillDomainNamesFromSelection(selectedStackFileName, selectedBlueprintFileName);

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

  for (const selectedSkillDomainName of selectedSkillDomainNames) {
    const skillDomainEntry = skillPlatformIndex.domains?.[selectedSkillDomainName];
    if (!skillDomainEntry) {
      continue;
    }

    contextBlocks.push(await buildSkillPackSection(skillDomainEntry, skillPlatformIndex.defaultTier || "advance"));
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

  return [
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
}

async function compileDynamicContext({
  targetDirectoryPath,
  selectedProfileName,
  selectedStackFileName,
  selectedBlueprintFileName,
  includeCiGuardrails,
}) {
  const resolvedTargetDirectoryPath = path.resolve(targetDirectoryPath);
  const compiledRules = await buildCompiledRulesContent({
    targetDirectoryPath: resolvedTargetDirectoryPath,
    selectedProfileName,
    selectedStackFileName,
    selectedBlueprintFileName,
    includeCiGuardrails,
  });

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
    const profilePackDefinitions = await collectProfilePacks(REPO_ROOT);
    const selectedPreset = initOptions.preset ? INIT_PRESETS[initOptions.preset] || null : null;

    const selectedStackFileNameFromOption = initOptions.stack
      ? matchFileNameFromInput(initOptions.stack, stackFileNames)
      : null;
    const selectedBlueprintFileNameFromOption = initOptions.blueprint
      ? matchFileNameFromInput(initOptions.blueprint, blueprintFileNames)
      : null;
    const selectedProfilePack = initOptions.profilePack
      ? findProfilePackByInput(initOptions.profilePack, profilePackDefinitions)
      : null;

    if (initOptions.stack && !selectedStackFileNameFromOption) {
      throw new Error(`Unknown stack: ${initOptions.stack}`);
    }

    if (initOptions.blueprint && !selectedBlueprintFileNameFromOption) {
      throw new Error(`Unknown blueprint: ${initOptions.blueprint}`);
    }

    if (initOptions.profilePack && !selectedProfilePack) {
      throw new Error(`Unknown profile pack: ${initOptions.profilePack}`);
    }

    if (initOptions.preset && !selectedPreset) {
      throw new Error(`Unknown preset: ${initOptions.preset}`);
    }

    if (selectedProfilePack && !stackFileNames.includes(selectedProfilePack.defaultStackFileName)) {
      throw new Error(
        `Profile pack ${selectedProfilePack.fileName} references unknown stack file: ${selectedProfilePack.defaultStackFileName}`
      );
    }

    if (selectedProfilePack && !blueprintFileNames.includes(selectedProfilePack.defaultBlueprintFileName)) {
      throw new Error(
        `Profile pack ${selectedProfilePack.fileName} references unknown blueprint file: ${selectedProfilePack.defaultBlueprintFileName}`
      );
    }

    console.log(`\nAgentic-Senior-Core CLI v${CLI_VERSION}`);
    console.log("I will copy governance files into your target folder and compile a single rulebook for your AI tools.");

    if (selectedPreset) {
      console.log(`Using preset: ${initOptions.preset} (${selectedPreset.description}).`);
    }

    const projectDetection = await detectProjectContext(resolvedTargetDirectoryPath);
    if (projectDetection.hasExistingProjectFiles) {
      console.log("I found files in the target directory, so I checked whether this already looks like an existing project.");
      console.log(buildDetectionSummary(projectDetection));
      console.log("Detection reasoning:");
      console.log(projectDetection.detectionReasoning);
      console.log("Top candidates:");
      console.log(formatDetectionCandidates(projectDetection.rankedCandidates));
    } else {
      console.log("The target directory is empty, so I will guide you through a fresh setup.");
    }

    const selectedProfileName = initOptions.profile
      ? initOptions.profile
      : selectedPreset?.profile
        ? selectedPreset.profile
      : initOptions.newbie
        ? "beginner"
        : selectedProfilePack?.defaultProfileName
          ? selectedProfilePack.defaultProfileName
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

    if (selectedProfilePack) {
      console.log(`Applying team profile pack: ${selectedProfilePack.displayName}.`);
      console.log(`Pack defaults: stack ${toTitleCase(selectedProfilePack.defaultStackFileName)}, blueprint ${toTitleCase(selectedProfilePack.defaultBlueprintFileName)}.`);
    }

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
      || selectedPreset?.stack
      || (shouldApplyDetectedStack ? projectDetection.recommendedStackFileName : null)
      || selectedProfilePack?.defaultStackFileName
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
      || selectedPreset?.blueprint
      || recommendedBlueprintFileName
      || selectedProfilePack?.defaultBlueprintFileName
      || selectedProfile.defaultBlueprintFileName
      || blueprintFileNames[
        blueprintDisplayChoices.indexOf(
          await askChoice("Which blueprint should I scaffold into the compiled rulebook?", blueprintDisplayChoices, userInterface)
        )
      ];

    const includeCiGuardrails = typeof initOptions.ci === "boolean"
      ? initOptions.ci
      : typeof selectedPreset?.ci === "boolean"
        ? selectedPreset.ci
      : selectedProfilePack?.lockCi
        ? selectedProfilePack.defaultCi
        : typeof selectedProfilePack?.defaultCi === "boolean"
          ? selectedProfilePack.defaultCi
      : selectedProfile.lockCi
        ? selectedProfile.defaultCi
        : await askYesNo("Enable CI/CD guardrails and the LLM Judge policy?", userInterface, selectedProfile.defaultCi);

    await copyGovernanceAssetsToTarget(resolvedTargetDirectoryPath);

    await compileDynamicContext({
      targetDirectoryPath: resolvedTargetDirectoryPath,
      selectedProfileName,
      selectedProfilePack,
      selectedStackFileName: selectedResolvedStackFileName,
      selectedBlueprintFileName: selectedResolvedBlueprintFileName,
      includeCiGuardrails,
    });

    await writeSelectedPolicy(resolvedTargetDirectoryPath, selectedProfileName);

    const setupDurationMs = Date.now() - setupStartedAt;
    await writeOnboardingReport({
      targetDirectoryPath: resolvedTargetDirectoryPath,
      selectedProfileName,
      selectedProfilePack,
      selectedPreset: initOptions.preset || null,
      selectedStackFileName: selectedResolvedStackFileName,
      selectedBlueprintFileName: selectedResolvedBlueprintFileName,
      includeCiGuardrails,
      setupDurationMs,
      projectDetection,
      selectedSkillDomains: inferSkillDomainNamesFromSelection(selectedResolvedStackFileName, selectedResolvedBlueprintFileName),
      operationMode: "init",
    });

    console.log("\nInitialization complete.");
    console.log(`- Target directory: ${resolvedTargetDirectoryPath}`);
    console.log(`- Profile: ${selectedProfile.displayName}`);
    if (initOptions.preset) {
      console.log(`- Preset: ${initOptions.preset}`);
    }
    if (selectedProfilePack) {
      console.log(`- Team profile pack: ${selectedProfilePack.displayName}`);
    }
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

async function runUpgradeCommand(targetDirectoryArgument, upgradeOptions = {}) {
  const resolvedTargetDirectoryPath = path.resolve(targetDirectoryArgument || ".");
  const setupStartedAt = Date.now();
  await ensureDirectory(resolvedTargetDirectoryPath);

  const userInterface = readline.createInterface({ input, output });

  try {
    console.log(`\nAgentic-Senior-Core CLI v${CLI_VERSION}`);
    console.log("Running upgrade assistant for an existing repository.");

    await copyGovernanceAssetsToTarget(resolvedTargetDirectoryPath);

    const stackFileNames = await collectFileNames(path.join(AGENT_CONTEXT_DIR, "stacks"));
    const blueprintFileNames = await collectFileNames(path.join(AGENT_CONTEXT_DIR, "blueprints"));
    const existingOnboardingReport = await loadOnboardingReportIfExists(resolvedTargetDirectoryPath);
    const projectDetection = await detectProjectContext(resolvedTargetDirectoryPath);

    const selectedProfileName = PROFILE_PRESETS[existingOnboardingReport?.selectedProfile]
      ? existingOnboardingReport.selectedProfile
      : "balanced";

    const selectedStackFileName = stackFileNames.includes(existingOnboardingReport?.selectedStack)
      ? existingOnboardingReport.selectedStack
      : projectDetection.recommendedStackFileName || "typescript.md";

    const selectedBlueprintFileName = blueprintFileNames.includes(existingOnboardingReport?.selectedBlueprint)
      ? existingOnboardingReport.selectedBlueprint
      : BLUEPRINT_RECOMMENDATIONS[selectedStackFileName] || "api-nextjs.md";

    const includeCiGuardrails = typeof existingOnboardingReport?.ciGuardrailsEnabled === "boolean"
      ? existingOnboardingReport.ciGuardrailsEnabled
      : true;

    const currentRulesPath = path.join(resolvedTargetDirectoryPath, ".cursorrules");
    const currentRulesContent = await pathExists(currentRulesPath)
      ? await fs.readFile(currentRulesPath, "utf8")
      : "";

    const plannedRulesContent = await buildCompiledRulesContent({
      targetDirectoryPath: resolvedTargetDirectoryPath,
      selectedProfileName,
      selectedStackFileName,
      selectedBlueprintFileName,
      includeCiGuardrails,
    });

    const isRulesContentChanged = currentRulesContent !== plannedRulesContent;
    const currentRuleLineCount = currentRulesContent ? currentRulesContent.split(/\r?\n/).length : 0;
    const plannedRuleLineCount = plannedRulesContent.split(/\r?\n/).length;

    console.log("\nUpgrade preview:");
    console.log(`- Target directory: ${resolvedTargetDirectoryPath}`);
    console.log(`- Profile: ${toTitleCase(selectedProfileName)}`);
    console.log(`- Stack: ${toTitleCase(selectedStackFileName)}`);
    console.log(`- Blueprint: ${toTitleCase(selectedBlueprintFileName)}`);
    console.log(`- CI/CD guardrails: ${includeCiGuardrails ? "enabled" : "disabled"}`);
    console.log(`- Existing rules lines: ${currentRuleLineCount}`);
    console.log(`- Planned rules lines: ${plannedRuleLineCount}`);
    console.log(`- Rules changed: ${isRulesContentChanged ? "yes" : "no"}`);

    if (upgradeOptions.dryRun) {
      console.log("\nDry run enabled. No files were modified.");
      return;
    }

    const shouldApplyUpgrade = upgradeOptions.skipConfirmation
      ? true
      : await askYesNo("Apply upgrade and write migrated files?", userInterface, true);

    if (!shouldApplyUpgrade) {
      console.log("Upgrade cancelled by user.");
      return;
    }

    await fs.writeFile(currentRulesPath, plannedRulesContent, "utf8");
    await fs.writeFile(path.join(resolvedTargetDirectoryPath, ".windsurfrules"), plannedRulesContent, "utf8");
    await writeSelectedPolicy(resolvedTargetDirectoryPath, selectedProfileName);

    const setupDurationMs = Date.now() - setupStartedAt;
    await writeOnboardingReport({
      targetDirectoryPath: resolvedTargetDirectoryPath,
      selectedProfileName,
      selectedProfilePack: existingOnboardingReport?.selectedProfilePack || null,
      selectedStackFileName,
      selectedBlueprintFileName,
      includeCiGuardrails,
      setupDurationMs,
      projectDetection,
      operationMode: "upgrade",
    });

    console.log("\nUpgrade complete.");
    console.log(`- Rules rewritten: ${isRulesContentChanged ? "yes" : "no (metadata refreshed)"}`);
    console.log(`- Setup time: ${formatDuration(setupDurationMs)}`);
    console.log("- Updated files: .cursorrules, .windsurfrules, .agent-context/state/onboarding-report.json");
  } finally {
    userInterface.close();
  }
}

async function main() {
  const commandArgument = process.argv[2];
  const commandArguments = process.argv.slice(3);

  if (!commandArgument) {
    await runLaunchCommand();
    return;
  }

  if (commandArgument === "--help" || commandArgument === "-h") {
    printUsage();
    return;
  }

  if (commandArgument === "--version" || commandArgument === "-v") {
    console.log(CLI_VERSION);
    return;
  }

  if (commandArgument !== "init" && commandArgument !== "upgrade" && commandArgument !== "skill" && commandArgument !== "launch") {
    console.error(`Unknown command: ${commandArgument}`);
    printUsage();
    exit(1);
  }

  if (commandArgument === "launch") {
    await runLaunchCommand();
    return;
  }

  if (commandArgument === "skill") {
    await runSkillCommand(commandArguments);
    return;
  }

  if (commandArgument === "upgrade") {
    const parsedUpgradeOptions = {
      targetDirectory: ".",
      dryRun: false,
      skipConfirmation: false,
    };

    for (let argumentIndex = 0; argumentIndex < commandArguments.length; argumentIndex++) {
      const currentArgument = commandArguments[argumentIndex];

      if (!currentArgument.startsWith("--")) {
        parsedUpgradeOptions.targetDirectory = currentArgument;
        continue;
      }

      if (currentArgument === "--dry-run") {
        parsedUpgradeOptions.dryRun = true;
        continue;
      }

      if (currentArgument === "--yes") {
        parsedUpgradeOptions.skipConfirmation = true;
        continue;
      }

      throw new Error(`Unknown option: ${currentArgument}`);
    }

    await runUpgradeCommand(parsedUpgradeOptions.targetDirectory, parsedUpgradeOptions);
    return;
  }

  const parsedInitOptions = {
    targetDirectory: ".",
    preset: undefined,
    profile: undefined,
    profilePack: undefined,
    stack: undefined,
    blueprint: undefined,
    ci: undefined,
    newbie: false,
  };

  for (let argumentIndex = 0; argumentIndex < commandArguments.length; argumentIndex++) {
    const currentArgument = commandArguments[argumentIndex];

    if (!currentArgument.startsWith("--")) {
      parsedInitOptions.targetDirectory = currentArgument;
      continue;
    }

    if (currentArgument === "--profile") {
      parsedInitOptions.profile = matchProfileNameFromInput(commandArguments[argumentIndex + 1] || "");
      argumentIndex += 1;
      continue;
    }

    if (currentArgument === "--preset") {
      parsedInitOptions.preset = normalizeChoiceInput(commandArguments[argumentIndex + 1] || "");
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith("--preset=")) {
      parsedInitOptions.preset = normalizeChoiceInput(currentArgument.split("=")[1]);
      continue;
    }

    if (currentArgument.startsWith("--profile=")) {
      parsedInitOptions.profile = matchProfileNameFromInput(currentArgument.split("=")[1]);
      continue;
    }

    if (currentArgument === "--profile-pack") {
      parsedInitOptions.profilePack = commandArguments[argumentIndex + 1];
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith("--profile-pack=")) {
      parsedInitOptions.profilePack = currentArgument.split("=")[1];
      continue;
    }

    if (currentArgument === "--stack") {
      parsedInitOptions.stack = commandArguments[argumentIndex + 1];
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith("--stack=")) {
      parsedInitOptions.stack = currentArgument.split("=")[1];
      continue;
    }

    if (currentArgument === "--blueprint") {
      parsedInitOptions.blueprint = commandArguments[argumentIndex + 1];
      argumentIndex += 1;
      continue;
    }

    if (currentArgument.startsWith("--blueprint=")) {
      parsedInitOptions.blueprint = currentArgument.split("=")[1];
      continue;
    }

    if (currentArgument === "--ci") {
      const ciRawValue = commandArguments[argumentIndex + 1];
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
    preset: parsedInitOptions.preset,
    profile: parsedInitOptions.profile,
    profilePack: parsedInitOptions.profilePack,
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
