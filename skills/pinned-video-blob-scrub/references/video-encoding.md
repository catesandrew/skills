# Encoding video for scrubbing

Scrubbing seeks constantly, and a seek decodes from the nearest keyframe
forward. So optimize for decode-per-seek, not for playback size. Probe first,
never overwrite the source, write outputs into `assets/`.

`ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames,duration -of default=nw=1 in.mp4`

The pipeline-level hero encode, poster, last-frame and concat recipes live in
`skills/cinematic-scroll-site/references/ffmpeg-recipes.md`; this file adds the
Blob-preload size budget, mobile/WebM variants, and the exact commands used for
the bundled test clip.

## GOP choice

| `-g` | Behaviour | Use when |
|---|---|---|
| 1 (all-intra) | every frame a keyframe: instant seeks, 5-10x bigger | short clip, heavy scrubbing, size is affordable |
| 2-6 | seek decodes at most g-1 frames | default; good size/seek balance (`-g 6` is the pipeline default, the bundled clip uses `-g 2`) |
| 48+ (normal web video) | seek can decode up to 2 s of frames | do not use for scrubbing |

Always pair with `-keyint_min` equal to `-g` and `-sc_threshold 0` so the
encoder does not insert extra keyframes or break the cadence.

## Desktop master

```sh
ffmpeg -i in.mp4 -an -vf "scale=1280:-2" -c:v libx264 -preset slow -crf 22 \
  -g 4 -keyint_min 4 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart assets/clip.mp4
```

- `-an`: scrub clips have no audio; it is wasted bytes in a Blob.
- `-pix_fmt yuv420p`: required for Safari/iOS playback.
- `+faststart`: moov atom first; with a Blob it matters less (whole file is
  local) but it keeps `data-preload="direct"` working and costs nothing.
- Blob budget: the whole file is downloaded before the first scrubbed frame.
  Observed: 14 MB for 8.4 s (about 13 Mbit/s). Rule of thumb [ours]: desktop
  8-15 MB, mobile 3-6 MB; at 10 Mbit/s a 12 MB file needs about 10 s, so set
  `data-ready-timeout` accordingly and keep stills as the fallback. Size
  formula: `MB = bitrate_mbps * seconds / 8`. If over budget, lower resolution
  before raising CRF; scrubbed frames are mostly viewed in motion.

## Mobile variant

```sh
ffmpeg -i in.mp4 -an -vf "scale=720:-2" -c:v libx264 -preset slow -crf 26 \
  -g 4 -keyint_min 4 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart assets/clip-mobile.mp4
```

Referenced from `data-mobile-src`; selected at init when `(max-width: 767px)`.
Phones decode fewer pixels per seek, which also cuts jank.

## WebM sibling

```sh
ffmpeg -i in.mp4 -an -vf "scale=1280:-2" -c:v libvpx-vp9 -crf 34 -b:v 0 -g 4 \
  -pix_fmt yuv420p assets/clip.webm
```

List both in the candidate attribute: `data-desktop-src="assets/clip.mp4 assets/clip.webm"`.
`chooseSource` takes the first one `canPlayType` accepts. MP4 first because
H.264 has hardware decode nearly everywhere; WebM is the safety net for
browser builds without H.264 (open-source Chromium, some Linux and test
runners). VP9 seeks are usually slower than all-intra H.264; do not treat WebM
as a quality upgrade.

## Poster and stills

```sh
ffmpeg -i assets/clip.mp4 -frames:v 1 -q:v 4 assets/still-1.jpg                 # first frame (poster + fallback start)
ffmpeg -sseof -0.1 -i assets/clip.mp4 -frames:v 1 -q:v 4 assets/still-2.jpg     # last frame (fallback end)
```

Extract from the encoded file so colors match exactly when the fallback swaps.
Use `-q:v 2` to `4` for real images; `-vf scale=1280:-2` if the source is huge.

## Bundled test clip (exact commands)

Generated with ffmpeg 8.1. `drawtext` was not available in that build, so the
`testsrc` source is used: it renders a running timecode and a moving pattern
in-frame, which is enough to eyeball scrub position.

```sh
cd template/assets
ffmpeg -y -f lavfi -i "testsrc=size=640x360:rate=24:duration=6" -an -c:v libx264 -preset slow -crf 28 \
  -g 2 -keyint_min 2 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart clip.mp4
ffmpeg -y -f lavfi -i "testsrc=size=320x180:rate=24:duration=6" -an -c:v libx264 -preset slow -crf 30 \
  -g 2 -keyint_min 2 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart clip-mobile.mp4
ffmpeg -y -f lavfi -i "testsrc=size=640x360:rate=24:duration=6" -an -c:v libvpx-vp9 -crf 38 -b:v 0 -g 2 \
  -pix_fmt yuv420p clip.webm
ffmpeg -y -i clip.mp4 -frames:v 1 -q:v 4 still-1.jpg
ffmpeg -y -sseof -0.1 -i clip.mp4 -frames:v 1 -q:v 4 still-2.jpg
```

Result: clip.mp4 6.0 s, 144 frames, about 250 KB; clip-mobile.mp4 about 130 KB;
clip.webm about 290 KB; stills about 10 KB each. Total under 1 MB.
