# Cinematic vocabulary: plain text to shot prompt

Video models were trained on captions written in film grammar, so short,
concrete camera language works better than adjectives. You do not need the
user to know any of it: you translate. About fifteen terms cover almost every
scroll-story shot.

## The vocabulary

| Slot | Choose one |
|---|---|
| **Camera move** (exactly one) | static / locked-off, slow push-in (dolly in), pull-back (dolly out), orbit left/right, pan left/right, tilt up/down, rise (crane up), drift forward |
| **Speed** | slow, steady, imperceptible (never "fast" or "dramatic") |
| **Framing** | extreme wide, wide, medium, close-up, macro, overhead (top-down), low angle |
| **Lens feel** | 24mm (wide, spatial), 35mm (natural), 85mm (compressed, portrait), macro (tiny detail, shallow focus) |
| **Light** | name the source and temperature: "warm low sun, golden hour", "soft overcast daylight", "cool studio key light with dark falloff" |
| **Ambient motion** | dust motes, mist, steam, water ripples, fabric, light shifts |

## Guardrail phrases and what each prevents

| Phrase | Prevents |
|---|---|
| "single continuous shot, no cuts" | scene changes mid clip |
| "locked direction" / "the camera never reverses" | wandering or back-and-forth moves (matters because the clip is scrubbed both ways) |
| "steady constant speed" | acceleration that makes scroll feel uneven |
| "lighting and palette stay constant" | flicker and color drift |
| "no text, no logos, no watermarks" | invented trademarks and garbled type |
| "no camera shake, no morphing" | wobble and melting geometry |
| "ends on {final frame}" | clips that finish mid-motion with no resting frame |

## The conversion template

```
{WORLD LINE}. {framing and lens} of {subject} {position in frame}.
{Camera move}, {speed}, locked direction. {one sentence of subject motion, if any}.
Ambient: {ambient motion}. Single continuous shot, no cuts, no camera shake.
Ends on {resting frame}. No text, no logos.
```

`{WORLD LINE}` is written once and pasted into all five prompts unchanged:
`{setting}, {light source and temperature}, {palette}, {lens}`.

## Worked conversions

World line: *"A misty greenhouse at dawn, soft cool daylight through glass, deep greens and warm amber, 35mm."*

| User's words | Cinematic prompt |
|---|---|
| "a plant growing" | World line. Medium shot of a single fern in a clay pot, centered. Slow push-in, steady constant speed, locked direction. A few fronds sway slightly. Ambient: drifting mist. Single continuous shot, no cuts, no camera shake. Ends on a close-up of one unfurled frond. No text, no logos. |
| "zoom into a leaf" | World line. Close-up of a frond surface, veins crossing frame. Slow push-in toward the center vein, locked direction. Macro detail resolves as the camera advances. Ambient: faint light shifts. Single continuous shot, no cuts. Ends on macro of leaf cells glowing amber. No text, no logos. |
| "the extract being made" | World line. Overhead shot of glass droplets forming on a copper still. Static, locked-off, slow. A drop swells and falls into a beaker. Ambient: gentle steam. Single continuous shot, no cuts. Ends on the beaker holding golden liquid. No text, no logos. |

## Rules when rewriting

1. One camera move per clip. If the user describes two ("zoom in then pan"), pick the primary one and say why.
2. Prefer moves that read fine in reverse (push-in, pull-back, orbit, rise). Avoid cause-and-effect physics like pouring unless it is the point.
3. Concrete nouns over mood words. Replace "epic", "stunning", "beautiful" with what the camera sees.
4. Keep one hero subject plus ambient motion; no crowds, hands, or readable text.
5. End each clip on a resting frame that can hold a caption (leave negative space).
6. If the user's description cannot be a single shot (a whole timeline), propose the single most iconic frame instead.
7. Show the user the table (their words, your prompt, one-line why) so they learn the pattern and can edit.

## Learning loop

Keep the prompts that worked next to their output. When a clip fails, name the
failure ("camera wandered", "light changed") and add the matching guardrail
phrase to the world line or template; do not rewrite from scratch.
