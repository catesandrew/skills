#!/usr/bin/env bash
# Phase 1 scan: reports a ✓/✗ line per build tool. Installs nothing; the agent asks once, then installs.
# Usage: scripts/setup.sh   (exit 1 if anything is missing)
missing=0
check() { # label, command
  if command -v "$2" >/dev/null 2>&1; then echo "✓ $1"; else echo "✗ $1 (missing: $2)"; missing=1; fi
}
check "ffmpeg" ffmpeg
check "ffprobe" ffprobe
check "Node.js (local preview server)" node
if command -v node >/dev/null 2>&1; then
  node -e 'process.exit(+process.versions.node.split(".")[0] >= 18 ? 0 : 1)' || { echo "✗ Node 18+ required"; missing=1; }
fi
if [ "$missing" = 1 ]; then
  echo "Install: macOS 'brew install ffmpeg node'; Windows 'winget install ffmpeg' and 'winget install OpenJS.NodeJS'."
fi
echo "Not checkable here: image/video generation connector (Higgsfield or Kling connector) and ffmpeg-skill. Check the agent's tool list and skills."
exit "$missing"
