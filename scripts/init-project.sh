#!/usr/bin/env bash
# Legacy compatibility wrapper for V1.4 CLI.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
TARGET_DIR="${1:-.}"

echo "[DEPRECATED] scripts/init-project.sh"
echo "Use: bunx @fatidaprilian/agentic-senior-core init ${TARGET_DIR}"
echo "Launching interactive CLI..."

node "$REPO_DIR/bin/agentic-senior-core.js" init "$TARGET_DIR"
