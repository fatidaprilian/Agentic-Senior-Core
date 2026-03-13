#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
# init-project.sh — Copy Agentic-Senior-Core into a new project
#
# Usage: ./scripts/init-project.sh /path/to/your/project
# ──────────────────────────────────────────────────────────

# Detect if we are being run locally or piped
# We check this BEFORE 'set -u' to avoid "unbound variable" noise on BASH_SOURCE
IS_PIPED=false
if [ -z "${BASH_SOURCE[0]:-}" ]; then
  IS_PIPED=true
fi

if [ "$IS_PIPED" = "true" ]; then
  REPO_DIR=$(mktemp -d)
  echo "Downloading Agentic-Senior-Core repository..."
  curl -sSL https://github.com/fatidaprilian/Agentic-Senior-Core/archive/refs/heads/main.tar.gz | tar -xz -C "$REPO_DIR" --strip-components=1
else
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  REPO_DIR="$(dirname "$SCRIPT_DIR")"
fi

set -euo pipefail

# Cleanup on exit if we created a temp dir
cleanup() {
  if [ "$IS_PIPED" = "true" ] && [ -d "${REPO_DIR:-}" ]; then
    rm -rf "$REPO_DIR"
  fi
}
trap cleanup EXIT

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

usage() {
  echo "Usage: $0 <target-directory>"
  echo ""
  echo "Copies .agent-context/ and agent configuration files"
  echo "into the specified project directory."
  echo ""
  echo "Files copied:"
  echo "  .agent-context/    — Engineering rules, stacks, blueprints, checklists"
  echo "  .cursorrules       — Cursor AI configuration"
  echo "  .windsurfrules     — Windsurf configuration"
  echo "  AGENTS.md          — Universal agent discovery"
  echo "  .github/copilot-instructions.md — GitHub Copilot config"
  exit 1
}

# Validate arguments
if [ $# -ne 1 ]; then
  usage
fi

TARGET_DIR="$1"

# Check target exists
if [ ! -d "$TARGET_DIR" ]; then
  echo -e "${RED}Error: Target directory does not exist: $TARGET_DIR${NC}"
  echo "Create it first: mkdir -p $TARGET_DIR"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Agentic-Senior-Core — Project Initializer"
echo "═══════════════════════════════════════════════════"
echo ""
echo -e "Source: ${GREEN}$REPO_DIR${NC}"
echo -e "Target: ${GREEN}$TARGET_DIR${NC}"
echo ""

# Copy .agent-context/
if [ -d "$TARGET_DIR/.agent-context" ]; then
  echo -e "${YELLOW}⚠  .agent-context/ already exists in target. Overwriting...${NC}"
fi
cp -r "$REPO_DIR/.agent-context" "$TARGET_DIR/.agent-context"
echo -e "${GREEN}✅ Copied .agent-context/${NC}"

# Copy entry point files
for file in ".cursorrules" ".windsurfrules" "AGENTS.md"; do
  cp "$REPO_DIR/$file" "$TARGET_DIR/$file"
  echo -e "${GREEN}✅ Copied $file${NC}"
done

# Copy GitHub Copilot instructions
mkdir -p "$TARGET_DIR/.github"
cp "$REPO_DIR/.github/copilot-instructions.md" "$TARGET_DIR/.github/copilot-instructions.md"
echo -e "${GREEN}✅ Copied .github/copilot-instructions.md${NC}"

# Copy Gemini & Antigravity instructions
if [ -d "$REPO_DIR/.gemini" ]; then
  cp -r "$REPO_DIR/.gemini" "$TARGET_DIR/.gemini"
  echo -e "${GREEN}✅ Copied .gemini/instructions.md${NC}"
fi

if [ -d "$REPO_DIR/.agents" ]; then
  cp -r "$REPO_DIR/.agents" "$TARGET_DIR/.agents"
  echo -e "${GREEN}✅ Copied .agents/workflows/${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo -e "  ${GREEN}DONE!${NC} Your project now has Staff-level AI standards."
echo "═══════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Open $TARGET_DIR in your AI IDE (Cursor/Windsurf)"
echo "  2. Paste the init prompt from .agent-context/prompts/init-project.md"
echo "  3. Watch the agent build your project like a pro 🚀"
echo ""
