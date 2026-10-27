---
title: Avatar Reel
description: Turns a script with [bracket] editor cues into a finished 9:16 avatar reel, covering HeyGen generation by avatar name, dead-air trimming, local word-level transcription, cue-to-timestamp mapping with an approval gate, Remotion kinetic captions, and FFmpeg mixing and export.
---

# avatar-reel

## Why It Exists

Short talking-head reels with kinetic captions, title cards, stat callouts, zooms, and sound effects are repetitive to produce by hand, and the usual shortcuts either hide the pipeline in a paywalled course or keep re-running a paid avatar generation every time a caption needs nudging. `avatar-reel` makes the whole path repeatable from one scripted workflow: write the script once with inline editor cues, generate the avatar clip once, and re-run everything downstream for free.

It was authored directly in this repo in commit `1078cbb` ("feat(skills): add avatar reel production workflow"). It rebuilds, from scratch, the workflow that a paywalled third-party reel course demonstrates; no material from that course is included. The commit also added the supporting package under `packages/skill-avatar-reel/`, the Remotion project, the scripts with their tests, three templates, and first-run setup automation.

## What It Does

The pipeline is: script, HeyGen avatar video, dead-air trim, word timestamps, cue layout (you approve), Remotion render, FFmpeg mix and export. Every artifact lives in a work directory (default `work/`), so any step can be re-run on its own.

**Script format.** The script is plain text where `[brackets]` are editor cues that are not spoken. A cue applies at the next spoken word, and a cue at the very end lands at the end of the clip.

| Cue | Effect |
|---|---|
| `[title: Text]` | title card at the top |
| `[stat: 33K \| GitHub stars]` | big number plus label |
| `[lower: Name \| Role]` | lower-third |
| `[emphasis]` | next few words highlighted and enlarged in captions |
| `[sfx: whoosh]` | sound effect (`pop`, `ding`, `whoosh` are synthesized; custom `.wav` or `.mp3` from `--sfx-dir`) |
| `[zoom]` | 12% punch-in on the avatar |
| `[music: ...]` | informational only; the bed is set with `--music` |

Options after `|` include `dur=3`, `words=N`, and `at=12.5` for an absolute time. Unrecognized brackets become `note` rows in the preview and are not rendered.

**Stages.**
1. `generate` (paid) sends the spoken text to HeyGen using an avatar looked up by name, with the avatar's own cloned voice unless a voice ID is set. The background color is taken from the chosen template so the avatar blends in.
2. `prepare` trims silences longer than 0.6 s, transcribes locally with faster-whisper (Fish Audio is the optional alternative), maps every cue to a timestamp, and writes `cues.json` and a human-readable `preview.md`.
3. The agent shows the preview plus the planned template and framing, reports the alignment percentage, and waits.
4. `render` runs Remotion for the silent video, then `mix.mjs` mixes voice, SFX at cue times, and music ducked under speech, normalizes to -14 LUFS, and muxes the result.

**Templates and framing.** `dark` (default), `light`, and `punch` templates set background, colors, caption size, position, weight, and casing; a new template is a copy of one with a different path passed to `--template`. Framing is tuned with `--face-zoom`, `--face-x`, and `--face-y` rather than by covering the face with captions.

**Secrets.** Keys are resolved only through 1Password: an environment variable already set, else `op read` of a reference, else a setup message. `.env` holds only references and non-secret settings, and resolved values are never printed or written.

## How To Use It

Triggers on: "avatar reel", "HeyGen reel", "make a reel from this script", "talking-head short with captions", "script to vertical video", "[bracket] editor cues", or "Remotion kinetic captions".

```sh
skills add -g catesandrew/skills --skill skills/avatar-reel
```

```sh
npm install @catesworks/skill-avatar-reel
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 60 skills as a single bundled plugin named `cw`; there is no standalone per-skill plugin.

First run: `bash scripts/setup.sh` checks Node 18+, ffmpeg, and python3, installs Remotion and faster-whisper, copies `.env.tpl` to `.env`, and checks that the 1Password CLI is signed in. Then `node scripts/heygen.mjs avatars` lists avatar names and confirms the key without printing it. Self-checks: `node --test scripts/*.test.mjs` runs the cue parser and secret-resolver tests with a fake `op`, needing no network or credentials.

## Gotchas & Invariants

- Never render the final video before the user says "approve"; `--draft` half-size renders are fine any time.
- HeyGen generation costs money. Fix layout, captions, and framing by re-running `prepare` or `render`, never `generate`.
- The spoken script is capped at 5,000 characters (HeyGen's limit); bracketed cues do not count.
- A cue fires at the next spoken word, not the previous one, and not mid-word.
- An alignment percentage below roughly 70% means the avatar said something different from the script. Check the transcript, and spell numbers and acronyms the way they should be spoken.
- Never ask for, print, or commit an API key. If a user pastes one in chat, tell them to rotate it and store it in 1Password.
- Fish Audio returns segment timing only, so word times are interpolated and cue placement is less precise than with local Whisper.
- "Face too small" is fixed with `--face-zoom` and nudging, with captions moved lower, not by covering the face.
- Remotion downloads a headless Chrome on first render; behind a proxy or corporate CA, set `REMOTION_USE_SYSTEM_CHROME=1` or `CHROME_PATH`.
- Remotion is free for individuals and companies up to three people; larger for-profit teams need a paid licence, so check before commercial team use.
- HeyGen's v2 endpoints are isolated in `scripts/heygen.mjs`; if the API changes, only that file needs updating.

## Related Skills

- [cinematic-scroll-site](/docs/skills/cinematic-scroll-site): another media-production pipeline with cost-gated generation and an approval step before money moves.
- [scroll-video-site](/docs/skills/scroll-video-site): the scroll-scrubbed video page engine, a different use of produced video.
- [session-wrap](/docs/skills/session-wrap): wraps up working sessions into durable write-ups.

---

_Sourced from: skills/avatar-reel/SKILL.md, skills/avatar-reel/metadata.json, skills/avatar-reel/scripts/, skills/avatar-reel/templates/, public-repo commit `1078cbb`_
