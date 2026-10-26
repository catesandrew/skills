#!/usr/bin/env bash
# First-run setup: checks tools, installs Remotion + faster-whisper, creates .env. Never asks for secrets.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ok=1
for t in node npm ffmpeg ffprobe python3; do command -v "$t" >/dev/null || { echo "MISSING: $t"; ok=0; }; done
[ "$ok" = 1 ] || { echo "Install the missing tools (macOS: brew install node ffmpeg python), then re-run."; exit 1; }
node -e 'process.exit(+process.versions.node.split(".")[0] >= 18 ? 0 : 1)' || { echo "Node 18+ required"; exit 1; }

(cd "$ROOT/remotion" && npm install --no-audit --no-fund)
if [ "${SKIP_WHISPER:-0}" != 1 ]; then
  python3 -m venv "$ROOT/.venv"
  "$ROOT/.venv/bin/pip" install -q faster-whisper
fi
if [ ! -f "$ROOT/.env" ]; then cp "$ROOT/.env.tpl" "$ROOT/.env"; fi

# Secrets live in 1Password; .env only holds op:// references.
if ! command -v op >/dev/null; then
  echo "1Password CLI missing: brew install 1password-cli"
elif ! op whoami >/dev/null 2>&1; then
  echo "op is installed but not signed in. Either enable the 1Password desktop app integration"
  echo "(Settings > Developer > Integrate with 1Password CLI) and unlock the app, or for headless use"
  echo "export OP_SERVICE_ACCOUNT_TOKEN (service account with read access to the vault)."
else
  echo "1Password: signed in."
fi
cat <<MSG

Setup done. Secrets default to op://app-secrets/HEYGEN_API_KEY/credential (and FISH_API_KEY, only for
--engine fish). Override with OP_VAULT / OP_FIELD or a full op:// reference in $ROOT/.env (see .env.tpl).
Check the field name without printing values:
  op item get HEYGEN_API_KEY --vault app-secrets --format json | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).fields.filter(f=>f.value).map(f=>f.id)))'
Set HEYGEN_AVATAR_NAME in .env, then verify: node $ROOT/scripts/heygen.mjs avatars
Never paste keys into chat.
MSG
