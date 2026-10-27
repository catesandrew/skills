# Frame budget

A frame sequence trades decoder seeks for bytes. Decide the budget before
extracting, because every frame is downloaded before the page unlocks.

## Rough sizing

Total frames = clips x frames per clip. Weight scales with frames and with
pixel count, so halving the width roughly quarters the per-frame cost. Sizes
depend on the footage (smooth gradients and dark voids compress far better than
detailed texture), so treat any estimate as a guess and measure with the number
`extract-frames.mjs` prints.

| Step | Do this first |
|---|---|
| Over budget | Lower the width to 1280, then lower frames per clip to 100, then switch the format to WebP. |
| Still over | Fewer chapters, or move the weakest clip to a looped video, or use `scroll-video-site` for the whole page. |

Pick a total budget in MB with the user up front and write it into the design
package next to the credit total.

## Frame count versus scroll length

A chapter's scroll length (`.chapter { height: 400vh }`, minus one screen of
pin) divided by its frame count is the scroll distance per frame. The lerp in
`scrub.js` hides small steps, but if one frame spans a large scroll distance the
film looks stepped. Add frames or shorten the chapter, and judge it with the
flick test rather than a fixed number.

## Extraction

```sh
node scripts/extract-frames.mjs clips/orbit.mp4 _work/frames/orbit --frames 150 --width 1600
node scripts/extract-frames.mjs clips/orbit.mp4 _work/frames/orbit-web --frames 100 --width 1280 --format webp --quality 80
```

The script reads the clip duration with `ffprobe`, sets `fps=frames/duration`,
caps the output at `-frames:v frames`, never upscales, strips audio, refuses a
non-empty output folder and prints `N frames, X MB`.

The equivalent raw command, if the script is unavailable:

```sh
ffmpeg -i in.mp4 -an -vf "fps=150/10,scale='min(1600,iw)':-2" -frames:v 150 -q:v 3 frames/orbit/frame_%04d.jpg
```

Replace `10` with the clip length in seconds (`ffprobe` shows it). Check that
the file count matches before writing any site code.

## Poster and looped video

The poster is the designed first frame (also the reduced-motion image). The
looped MP4 for narrow screens is the original clip re-encoded small; use
`cinematic-scroll-site/scripts/encode.mjs hero` and scale to 1280 wide first.
