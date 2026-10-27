# Prompt laws for scroll-scrub hero video

A scrub video is not a film. The visitor drags time forward and backward with
their scroll wheel, so every frame must be a good frame and the motion must
read at any speed. These laws exist to keep generations scrubbable. Read
before writing any generation prompt.

## The twelve laws

1. **One continuous camera move.** A single push-in, pull-back, orbit, rise,
   or track. No cuts, no scene changes, no whip pans.
2. **One direction.** Scrubbing backward must look as intentional as forward.
   Avoid motion that only makes sense one way (pouring, falling debris,
   anything with an obvious cause then effect) unless that is the point.
3. **A designed first frame and final frame.** Frame one is the hero's resting
   state (and the phone poster). The final frame is the resting state at the
   page bottom and must hold a CTA comfortably.
4. **Steady speed.** Slow, even motion beats dramatic acceleration. Ease at
   the ends only; mid-clip velocity should be near constant so scroll feels
   linear.
5. **No text, no logos, no UI, no watermarks.** Type is added in HTML. Image
   models invent real trademarks: say "no text, no logos" and inspect anyway.
6. **Leave negative space for copy.** Compose so each band of text has quiet
   area (sky, wall, blur, dark floor) at the time it appears.
7. **Lock the world.** One lighting setup, one palette, one time of day for
   the whole clip. Name the light source and the color temperature.
8. **Few moving subjects.** One hero subject plus ambient motion (dust, steam,
   water, fabric). Crowds and complex physics smear when scrubbed.
9. **Concrete over adjectival.** Describe what the camera sees ("low angle,
   35mm, a ceramic cup on a walnut counter, steam rising"), not mood words
   ("epic, stunning, cinematic").
10. **Stable geometry.** Avoid anything that morphs: hands, text on signs,
    reflections that must stay consistent, symmetric faces.
11. **Short and plain.** 5 to 8 seconds per segment at 1080p. Longer clips
    drift; chain segments instead.
12. **Brand-world consistent.** Every frame should look like it belongs to the
    palette and type chosen in the design package.

## Prompt templates

Starting frame (image):

```
{shot type and lens} of {subject} {position in frame}, {environment},
{light source and color temperature}, {palette notes from the design package},
composed as the first frame of a slow {move}, negative space on the {side}
for headline copy. 16:9, high detail. No text, no logos, no watermarks.
```

Video (image-to-video from the approved frame):

```
Slow, steady {push-in | pull-back | orbit | rise} from the starting frame.
{one sentence of subject motion, if any}. Ambient: {dust | steam | mist | light shifts}.
Lighting and palette stay constant. Single continuous shot, no cuts.
Ends on {description of final resting frame}. No text, no logos.
```

Keep negative prompts short and literal: cuts, text, logos, morphing,
camera shake, flicker.

## Chaining recipe (Tier 2 and 3)

Each segment is generated separately, then joined.

1. Generate and approve segment 1 (video gate).
2. Extract its final frame as a lossless PNG
   (`ffmpeg-recipes.md`, "Extract last frame for chaining").
3. **Upload bridge:** the extracted PNG must be registered with the
   generation connector as an input image (upload, or provide a URL, as the
   connector requires), then used as the start image of segment 2. Do not
   regenerate the frame from a prompt; the pixel-exact handoff is what makes
   the join seamless.
4. Write segment 2's prompt to continue the same move and world, not restart.
5. Repeat. Each segment gets its own video gate and its own cheap re-roll.
6. Concat (re-encode once, see recipes) so the scrub is one continuous file.

Trim a frame or two from the head of each later segment if a visible
duplicate frame appears at the seam.

## Presets and styles

Generation connectors often apply a style preset or auto-enhance by default.
Decline presets: pass plain prompts, no style, no auto-enhance. A preset
restyles frames unpredictably and breaks palette and chaining consistency. If
a preset is required by the tool, pick the most neutral one and tell the user.

## Cost preflighting

Always preflight before spending when the provider offers a free cost
preview; otherwise compute from its price sheet. Prices vary by provider and
change over time; read them live rather than trusting numbers from memory.
Rough planning shape: the starting frame is the cheap step, the video is the
big one and varies widely by model, and supporting stills are cheap each. See
`providers.md` for per-provider notes and how to compare credits, packs, and
per-second prices as cost per planned clip.

Present the model tradeoff honestly: a premium model usually buys better
motion coherence and fewer re-rolls; a cheaper model costs a fraction but may
need more attempts and shows more morphing. Price the same planned shot
on the top two or three models, show real prices and the user's remaining
balance, recommend one, and let the user decide with the numbers in hand.
Chained journeys confirm the already-chosen model instead of re-asking.

Where the provider accepts both a start and an end frame, an alternative to
last-frame extraction is to generate each segment between two approved
frames (see `providers.md`).
