#!/usr/bin/env bun
/**
 * validate.ts — Repository Integrity Validator
 *
 * Validates the Agentic-Senior-Core repository:
 * - All files referenced in AGENTS.md exist
 * - All Markdown files are non-empty
 * - Cross-references between rule files resolve
 * - No broken internal links
 *
 * Usage: bun scripts/validate.ts
 */

import { readdir, stat } from "node:fs/promises";
import { join, resolve, relative } from "node:path";

const ROOT_DIR = resolve(import.meta.dir, "..");
const AGENT_CONTEXT_DIR = join(ROOT_DIR, ".agent-context");

interface ValidationResult {
  passed: number;
  failed: number;
  errors: string[];
  warnings: string[];
}

const result: ValidationResult = {
  passed: 0,
  failed: 0,
  errors: [],
  warnings: [],
};

// ── Helpers ───────────────────────────────────────────────

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readFileContent(filePath: string): Promise<string> {
  const file = Bun.file(filePath);
  return file.text();
}

async function getMarkdownFiles(directory: string): Promise<string[]> {
  const markdownFiles: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip dependency and VCS directories
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        await walk(fullPath);
      } else if (entry.name.endsWith(".md")) {
        markdownFiles.push(fullPath);
      }
    }
  }

  await walk(directory);
  return markdownFiles;
}

function pass(message: string): void {
  result.passed++;
  console.log(`  ✅ ${message}`);
}

function fail(message: string): void {
  result.failed++;
  result.errors.push(message);
  console.log(`  ❌ ${message}`);
}

function warn(message: string): void {
  result.warnings.push(message);
  console.log(`  ⚠️  ${message}`);
}

// ── Validators ────────────────────────────────────────────

async function validateRequiredFiles(): Promise<void> {
  console.log("\n📂 Checking required files...");

  const requiredFiles = [
    ".cursorrules",
    ".windsurfrules",
    "AGENTS.md",
    ".github/copilot-instructions.md",
    "README.md",
    "LICENSE",
    ".gitignore",
  ];

  for (const file of requiredFiles) {
    const filePath = join(ROOT_DIR, file);
    if (await fileExists(filePath)) {
      pass(file);
    } else {
      fail(`Missing required file: ${file}`);
    }
  }
}

async function validateRuleFiles(): Promise<void> {
  console.log("\n📜 Checking rule files...");

  const expectedRules = [
    "naming-conv.md",
    "architecture.md",
    "security.md",
    "performance.md",
    "error-handling.md",
    "testing.md",
    "git-workflow.md",
    "efficiency-vs-hype.md",
    "api-docs.md",
  ];

  for (const rule of expectedRules) {
    const filePath = join(AGENT_CONTEXT_DIR, "rules", rule);
    if (await fileExists(filePath)) {
      const content = await readFileContent(filePath);
      if (content.trim().length > 100) {
        pass(`rules/${rule} (${content.length} chars)`);
      } else {
        fail(`rules/${rule} is suspiciously short (${content.length} chars)`);
      }
    } else {
      fail(`Missing rule file: rules/${rule}`);
    }
  }
}

async function validateStackFiles(): Promise<void> {
  console.log("\n🔧 Checking stack profiles...");

  const expectedStacks = ["typescript.md"];

  for (const stack of expectedStacks) {
    const filePath = join(AGENT_CONTEXT_DIR, "stacks", stack);
    if (await fileExists(filePath)) {
      const content = await readFileContent(filePath);
      pass(`stacks/${stack} (${content.length} chars)`);
    } else {
      fail(`Missing stack profile: stacks/${stack}`);
    }
  }
}

async function validateBlueprintFiles(): Promise<void> {
  console.log("\n🏗️  Checking blueprints...");

  const expectedBlueprints = ["api-nextjs.md", "nestjs-logic.md"];

  for (const blueprint of expectedBlueprints) {
    const filePath = join(AGENT_CONTEXT_DIR, "blueprints", blueprint);
    if (await fileExists(filePath)) {
      const content = await readFileContent(filePath);
      pass(`blueprints/${blueprint} (${content.length} chars)`);
    } else {
      fail(`Missing blueprint: blueprints/${blueprint}`);
    }
  }
}

async function validateChecklistFiles(): Promise<void> {
  console.log("\n✅ Checking review checklists...");

  const expectedChecklists = ["pr-checklist.md", "security-audit.md"];

  for (const checklist of expectedChecklists) {
    const filePath = join(AGENT_CONTEXT_DIR, "review-checklists", checklist);
    if (await fileExists(filePath)) {
      pass(`review-checklists/${checklist}`);
    } else {
      fail(`Missing checklist: review-checklists/${checklist}`);
    }
  }
}

async function validateCrossReferences(): Promise<void> {
  console.log("\n🔗 Checking cross-references...");

  const markdownFiles = await getMarkdownFiles(ROOT_DIR);
  let totalLinks = 0;
  let brokenLinks = 0;

  for (const filePath of markdownFiles) {
    const content = await readFileContent(filePath);
    const relPath = relative(ROOT_DIR, filePath);

    // Find all relative markdown links: [text](path.md) or [text](./path)
    const linkPattern = /\[([^\]]*)\]\((?!https?:\/\/|#)([^)]+)\)/g;
    let match: RegExpExecArray | null;

    while ((match = linkPattern.exec(content)) !== null) {
      const linkTarget = match[2].split("#")[0]; // Remove anchors
      if (!linkTarget) continue;

      totalLinks++;
      const resolvedPath = resolve(join(ROOT_DIR, linkTarget));

      if (!(await fileExists(resolvedPath))) {
        brokenLinks++;
        fail(`Broken link in ${relPath}: "${match[2]}"`);
      }
    }
  }

  if (brokenLinks === 0 && totalLinks > 0) {
    pass(`All ${totalLinks} internal links resolve correctly`);
  } else if (totalLinks === 0) {
    warn("No internal cross-references found");
  }
}

async function validateAgentsMdManifest(): Promise<void> {
  console.log("\n📋 Checking AGENTS.md manifest...");

  const agentsMdPath = join(ROOT_DIR, "AGENTS.md");
  if (!(await fileExists(agentsMdPath))) {
    fail("AGENTS.md not found — cannot validate manifest");
    return;
  }

  const content = await readFileContent(agentsMdPath);

  // Extract all file references from AGENTS.md
  const fileRefPattern = /\[`?([^`\]]+)`?\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  let checkedCount = 0;

  while ((match = fileRefPattern.exec(content)) !== null) {
    const linkPath = match[2];
    if (linkPath.startsWith("http")) continue;

    const resolvedPath = resolve(ROOT_DIR, linkPath);
    checkedCount++;

    if (await fileExists(resolvedPath)) {
      pass(`AGENTS.md → ${linkPath}`);
    } else {
      fail(`AGENTS.md references missing file: ${linkPath}`);
    }
  }

  if (checkedCount === 0) {
    warn("No file references found in AGENTS.md");
  }
}

// ── Main ──────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════════");
  console.log("  Agentic-Senior-Core — Repository Validator");
  console.log("═══════════════════════════════════════════════════");

  await validateRequiredFiles();
  await validateRuleFiles();
  await validateStackFiles();
  await validateBlueprintFiles();
  await validateChecklistFiles();
  await validateAgentsMdManifest();
  await validateCrossReferences();

  // Summary
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  RESULTS");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  ✅ Passed: ${result.passed}`);
  console.log(`  ❌ Failed: ${result.failed}`);
  console.log(`  ⚠️  Warnings: ${result.warnings.length}`);
  console.log("═══════════════════════════════════════════════════");

  if (result.failed > 0) {
    console.log("\n🔴 VALIDATION FAILED\n");
    process.exit(1);
  } else {
    console.log("\n🟢 ALL CHECKS PASSED\n");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Validator crashed:", error);
  process.exit(1);
});
