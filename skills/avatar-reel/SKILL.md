---
name: avatar-reel
description: >-
  Use when turning a script into a finished vertical (9:16, 1080x1920) avatar
  reel — a HeyGen avatar (looked up by name, cloned voice) speaks the script,
  word-level timestamps drive kinetic captions, title cards, stat callouts and
  zooms placed from [bracket] editor cues, and FFmpeg trims dead air, mixes
  SFX/music and exports. Proposes an animation layout and waits for approval
  before the final render. Triggers on "avatar reel", "HeyGen reel", "make a
  reel from this script", "talking-head short with captions", "script to
  vertical video", "[bracket] editor cues", "Remotion kinetic captions", or
  rebuilding the paywalled albert-reel-dark workflow.
---

# avatar-reel

Script → HeyGen avatar video → trimmed → word timestamps → cue layout (you approve) → Remotion render → FFmpeg mix/export.
Everything lives in `${input:workDir:work}/` so any step can be re-run. Scripts are in `scripts/` next to this file; call them with node/python3 by absolute path.

## Hard rules

- **Secrets come only from 1Password** (`op`). Defaults: `op://app-secrets/HEYGEN_API_KEY/credential` and `op://app-secrets/FISH_API_KEY/credential` (field name confirmed as `credential`). Override with `OP_VAULT`/`OP_FIELD`, a full `op://` value for the key in `.env`, or `<NAME>_OP_REF`. `.env` is optional and holds only references and non-secret settings (`HEYGEN_AVATAR_NAME`, `HEYGEN_VOICE_ID`). Resolution: env var already set → `op read` of the reference → fail with a setup message. Never ask for a key in chat, never print or write resolved values, never commit `.env`. If a user pastes a key, tell them to rotate it and store it in 1Password.
- **Never render the final video before the user says "approve".** Drafts (`--draft`) are fine any time.
- Script limit: 5,000 spoken characters (HeyGen cap). Bracketed cues don't count.
- HeyGen generation costs money. Don't re-run `generate` to fix layout/caption/framing issues; those only need `prepare`/`render`.

## First run

Run `bash scripts/setup.sh` (checks node 18+, ffmpeg, python3; installs Remotion and faster-whisper; copies `.env.tpl` to `.env`; checks `op` is installed and signed in via `op whoami`). Auth: 1Password desktop-app CLI integration, or `OP_SERVICE_ACCOUNT_TOKEN` for headless machines. Items must exist in the configured vault (default `app-secrets`); the setup script prints a label-only command to check the field name. Then verify with `node scripts/heygen.mjs avatars` (lists avatar names; confirms the key without printing it). The avatar is chosen by name (`--avatar` or `HEYGEN_AVATAR_NAME`); the avatar's own cloned voice is used unless `HEYGEN_VOICE_ID` is set.

## Script format

Plain text; `[brackets]` are editor cues, not spoken. A cue applies at the **next spoken word** (a cue at the very end lands at the end).

| Cue | Effect |
|---|---|
| `[title: Text]` | title card at top |
| `[stat: 33K \| GitHub stars]` | big number + label |
| `[lower: Name \| Role]` | lower-third |
| `[emphasis]` / `[emphasis: \| words=2]` | next N words (default 3) highlighted/enlarged in captions |
| `[sfx: whoosh]` | sound effect (built-in: `pop`, `ding`, `whoosh`; or `<name>.wav\|mp3` in `--sfx-dir`) |
| `[zoom]` | 12% punch-in on the avatar |
| `[music: ...]` | informational; the bed is set with `--music` |

Options after `|`: `dur=3` (seconds), `words=N`, `at=12.5` (absolute time override). Unrecognized brackets become `note` rows in the preview and are **not rendered** — ask the user what they meant.

## Workflow

1. **Generate** (paid): `node scripts/reel.mjs generate script.txt --avatar "Name" --work work` → `work/avatar.raw.mp4`. Background colour is taken from the chosen template so the avatar blends in.
2. **Prepare**: `node scripts/reel.mjs prepare script.txt --work work` trims dead air (silences > 0.6s), transcribes (default local faster-whisper; `--engine fish` for Fish Audio), maps cues to timestamps, writes `work/cues.json` and `work/preview.md`. `--video f.mp4` skips HeyGen with an existing clip.
3. **Propose**: show the user `work/preview.md` (time / cue / content / anchor words) plus the template and framing you plan to use. Mention alignment % — below ~70% means the avatar said something different from the script; check the transcript. Optionally render a `--draft` (half-size) first. Then **wait**. "approve" → step 4; otherwise edit the script cues (or `cues.json` times) and re-run `prepare`.
4. **Render**: `node scripts/reel.mjs render --work work --template dark --out reel.mp4 [--face-zoom 1.3 --face-y -6] [--music bed.mp3] [--sfx-dir sfx/]`. Remotion renders the silent video; `mix.mjs` mixes voice + SFX at cue times + music ducked under speech, normalises to -14 LUFS and muxes.
5. Report the output path, duration, and what was cut. Offer adjustments (all free to redo).

## Templates and framing

`templates/dark.json` (default), `light.json`, `punch.json`. Add a template by copying one (`bg, fg, accent, muted, cardBg, font, captionSize, captionY, captionWeight, uppercase`) and passing its path to `--template`. Fonts are system fonts; add webfonts in `remotion/src` if needed.

"Face too small" is the usual complaint: use `--face-zoom 1.3` (scales around the upper-centre), nudge with `--face-y` / `--face-x` (percent of frame, negative y moves up). Captions sit at `captionY`% from the top; raise zoom and move captions lower rather than covering the face.

## Self-check

`node --test scripts/*.test.mjs` runs `cues.test.mjs` (parsing, cue-to-timestamp mapping, emphasis spans, length cap) and `env.test.mjs` (secret resolver against a fake `op`: precedence, masking, failure messages). No network or credentials needed.

## Notes

- **Remotion licence**: free for individuals and companies up to 3 people; larger for-profit teams need a paid Remotion licence (see remotion.pro). Check before commercial team use.
- Remotion downloads a headless Chrome on first render. Behind a proxy/corporate CA where that fails, set `REMOTION_USE_SYSTEM_CHROME=1` (uses installed Chrome) or `CHROME_PATH`.
- Transcriber is swappable: `transcribe.py` has an `ENGINES` map (`faster-whisper`, `fish`); set `TRANSCRIBER` in `.env` or pass `--engine`. Fish returns segment timing only, so word times are interpolated and cues are less precise.
- HeyGen endpoints are the v2 API (`/v2/avatars`, `/v2/video/generate`, `/v1/video_status.get`); if HeyGen changes them, only `scripts/heygen.mjs` needs updating.

## Common Mistakes

- Re-generating the avatar (costs credit) to change layout, captions or zoom — just re-run `prepare`/`render`.
- Putting a cue mid-word or expecting it to fire at the *previous* word; it fires at the next spoken word.
- Skipping the approval step because the preview "looks fine".
- Pasting an API key into chat instead of `.env`.
- Script text that HeyGen speaks differently (numbers, acronyms) → low alignment %; spell it out as it should be spoken.
