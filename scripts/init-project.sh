#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
# init-project.sh — Copy Agentic-Senior-Core into a new project
#
# Usage: ./scripts/init-project.sh /path/to/your/project
# ──────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

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
