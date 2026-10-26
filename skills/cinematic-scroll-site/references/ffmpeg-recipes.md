# ffmpeg recipes for the scrub pipeline

Prefer the installed `ffmpeg-skill` for probing, joining, frame inspection
(`look.py`), and delivery checks (`check.py`); its scripts support
`--dry-run` and verify their output. The commands below are the
pipeline-specific encodes. Never overwrite the source; write encodes into
`assets/` and keep raw and review files in a separate folder outside the
deploy folder.

Probe first:
`ffprobe -v error -show_entries stream=width,height,r_frame_rate,duration,codec_name -of default=nw=1 in.mp4`

## Scrub re-encode (the hero)

Scrubbing seeks constantly, so every frame must be cheap to decode: short
keyframe interval, no audio, fast start.

```sh
ffmpeg -i in.mp4 -an -c:v libx264 -preset slow -crf 20 \
  -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p \
  -movflags +faststart assets/hero.mp4
```

`-g 6` trades file size for seek speed; use `-g 1` (all-intra, much larger)
only if scrubbing still stutters. Aim for a Tier 1 hero of roughly 15-25 MB;
if it is larger, scale to 1280 wide before raising CRF.

## Poster and ending frame

```sh
ffmpeg -i in.mp4 -frames:v 1 -q:v 2 assets/poster.jpg
ffmpeg -sseof -0.1 -i in.mp4 -frames:v 1 -q:v 2 assets/ending.jpg
```

The poster is also the mobile hero image.

## Extract last frame for chaining (lossless)

```sh
ffmpeg -sseof -0.1 -i seg1.mp4 -frames:v 1 seg1_last.png
```

Upload that PNG as the next segment's start image (see `prompt-laws.md`).

## Concat chained segments

Re-encode once so seams are clean and the GOP is uniform.

```sh
printf "file 'seg1.mp4'\nfile 'seg2.mp4'\nfile 'seg3.mp4'\n" > list.txt
ffmpeg -f concat -safe 0 -i list.txt -an -c:v libx264 -preset slow -crf 20 \
  -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p \
  -movflags +faststart assets/hero.mp4
```

If a duplicate frame shows at a seam, trim the head of the later segment
with `-ss 0.04` on its input.

## Web-sized stills

One compression pass, no repeated re-saves.

```sh
ffmpeg -i still.png -vf "scale='min(1920,iw)':-2" -q:v 3 assets/still-01.jpg
ffmpeg -i still.png -vf "scale='min(1920,iw)':-2" -c:v libwebp -quality 80 assets/still-01.webp
```

## Inspect the result

`ffmpeg-skill`'s `look.py assets/hero.mp4 --tiles 3x2`, then view the PNG:
confirm no seam artifacts, the first and last frames are as designed, and
the quiet zones for copy are intact.

## Keep out of the deploy folder

Raw generations, review clips, extracted PNGs, `list.txt`, and the design
package live in a sibling `_work/` folder. The deploy folder is `index.html`
and `assets/` only.
