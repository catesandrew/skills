# Copy to .env (gitignored) only if you need to override defaults. Secrets are NEVER stored here.
# Defaults: op://app-secrets/HEYGEN_API_KEY/credential and op://app-secrets/FISH_API_KEY/credential
# Override the vault/field for all secrets:
# OP_VAULT=app-secrets
# OP_FIELD=credential
# Or override one secret with a full reference:
# HEYGEN_API_KEY=op://<vault>/<item>/<field>
# FISH_API_KEY=op://<vault>/<item>/<field>
# Non-secret settings:
# HEYGEN_AVATAR_NAME=My Avatar
# HEYGEN_VOICE_ID=            # defaults to the avatar's own (cloned) voice
# TRANSCRIBER=faster-whisper
