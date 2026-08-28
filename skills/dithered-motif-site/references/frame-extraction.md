# Frame extraction (ffmpeg)

Extract at ~11fps, not 24. The dither is a coarse grid, so extra frames buy
nothing visible and cost load time.

```
ffmpeg -i input.mp4 -vf "fps=11,scale=1400:-2" %03d.png
```

## Crop a baked-in border first

If the source has a border or frame baked into it (AI image models often add
a painted parchment edge even when told not to), crop it off before scaling,
or it will dither into a hard rectangle sitting in the middle of the page:

```
ffmpeg -i input.mp4 -vf "fps=11,crop=iw*0.84:ih*0.84:iw*0.08:ih*0.08,scale=1400:-2" %03d.png
```

Adjust the `0.84`/`0.08` crop fractions to match how much border the
generation actually produced.

## Flatten background noise

If the background carries noise or grain, snap it flat: walk every pixel and
force anything within a threshold of the background tone to exactly that
tone. Otherwise codec noise renders as a haze of stray dots across the whole
panel. Skip this if the background is already clean.

## Still images

A still image works too — feed the same frame repeatedly through the dither
engine and skip the crossfade-wrap step entirely (there's no sequence to
loop).
