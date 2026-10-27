# Adapting the prompts to any product or service

The reference site's prompts (matcha) are one instance of a fixed arc. Keep the
arc, the suffix and the rules; replace the subject. The agent writes the
creative parts into a `subject.json`; `scripts/assemble-prompts.mjs` applies the
shared suffix and lints the pack.

## 1. The arc: roles, not matcha

Each act has a job. Pick a concrete scene for the subject that does that job.

| Act | Role | Matcha (reference) | Light and colour |
|---|---|---|---|
| 1 | Where it begins: the raw setting | rows of tea under shade cloth | darkest, coldest |
| 2 | The human touch: hands, care, selection | hands picking the youngest leaves | dark, warm hint |
| 3 | **The turn**: the transformation, the one saturated moment | stone mill, bright green powder | peak saturation |
| 4 | The tool or method, and the name appears | whisk in the bowl, wordmark | opening up |
| 5 | The product or result in use | matcha poured over ice and milk | bright |
| 6 | The payoff in daylight, the call to action | the finished cup on concrete | lightest, calm |

Rules for choosing scenes:
- Acts 1 to 3 never show the finished product. The reveal is act 5.
- Act 3 must be something that genuinely looks different from the other five (colour, texture or motion). It sets the saturated palette stop.
- Acts 4 to 6 are image-to-video from one **reference image** so the product is identical in all three. Acts 1 to 3 are text-to-video and may skip the product entirely.
- Generate the act most likely to fail first (usually act 3) and write a fallback prompt for it.

### Products (physical goods, food, devices)

Origin material, craft or making, the transformation, the tool, the product in
use, the product in its home. Reference image: the hero product on a neutral
surface in the same light as acts 4 to 6.

### Services and software

There is no object to film, so film **the effect on a person or a place**, and
use one recurring physical stand-in as the reference image (a desk, a front
door, a workspace, a key). Map the arc to before and after:

| Act | Service version |
|---|---|
| 1 | the problem's setting, dim and cluttered |
| 2 | a person doing the manual work |
| 3 | the turn: the moment it clicks (a light switching on, a cluttered surface clearing) |
| 4 | the method at work, name appears |
| 5 | the same place, now working smoothly |
| 6 | the same place in full daylight, calm |

Keep scenes literal and filmable. Never ask a clip for screens with legible text, logos or UI; image models garble them. Put any such detail in the page, not the footage.

## 2. Derive the world line and the palette from the subject

One sentence reused on every clip: lens, light direction and quality, grain, grade.
Reference: `Shot on a 35mm lens, soft natural daylight from the left, cool ambient fill, fine film grain, clean high-key grade.`

Palette, from the subject:
- First stop: the darkest tone of act 1's setting (not black), second and third darkened versions of it.
- Saturated stop: the subject's signature colour at its most vivid, placed where act 3 lands (progress about 0.48).
- Last stop: the page background for Part 2, a near-white tinted toward the brand colour.
- `text.light` is the last stop or near it; `text.dark` is the first stop darkened. Then run `scripts/sweep-contrast.mjs`.
- If the brand is dark-themed, reverse the direction (light to dark) and swap the text colours; keep the saturated stop at act 3.

## 3. subject.json

```json
{
  "brand": "BRAND",
  "world": "Shot on a 35mm lens, soft natural daylight from the left, cool ambient fill, fine film grain, clean high-key grade.",
  "seconds": 5,
  "resolution": "1080p",
  "referenceImage": "<hero product or stand-in, neutral surface, same light as acts 4-6, brand wordmark if any>",
  "acts": [
    { "file": "origin",   "mode": "text-to-video",  "prompt": "<act 1 scene>" },
    { "file": "hands",    "mode": "text-to-video",  "prompt": "<act 2 scene>" },
    { "file": "turn",     "mode": "text-to-video",  "risky": true, "prompt": "<act 3 scene>" },
    { "file": "method",   "mode": "image-to-video", "prompt": "<act 4 scene>" },
    { "file": "use",      "mode": "image-to-video", "prompt": "<act 5 scene>" },
    { "file": "daylight", "mode": "image-to-video", "prompt": "<act 6 scene>" }
  ],
  "fallback": { "file": "turn", "prompt": "<simpler act 3 scene>" }
}
```

Write each act `prompt` as the scene only: subject, one camera move, one
direction of motion ("The camera pushes slowly forward", "The camera holds
close"), lighting cue. No lens, grain, duration or "locked camera": the script appends those.
`resolution` must be what the chosen model can output (for example 720p on the
"mini" tier of some models); do not write 4K if it cannot deliver it.

```sh
node scripts/assemble-prompts.mjs subject.json prompts.md
```

It fails on: fewer than three acts, duplicate file names, image-to-video with no
reference image, no text-to-video opener, a prompt that already carries the suffix, a missing world line.

## 4. Beat copy

Do not invent claims. Use the user's real facts, one short line per beat, for
acts 1, 2, 3, 5 and the call to action. Act 4's beat is the wordmark. Reference lines each state one concrete fact
("Grown in shade for twenty days.", "Stone-ground. One hour for thirty grams."). If the user gives no figures, write
the beat without numbers rather than make some up. The Part 2 copy follows the same rule: no invented stockists, counts or awards. Run `copy-gate.mjs` on it.

## 5. Worked example: a bicycle shop

```json
{
  "brand": "SPOKE & CO",
  "world": "Shot on a 35mm lens, low morning sun from the right, warm ambient fill, fine film grain, muted high-key grade.",
  "referenceImage": "A matte olive-green steel-frame city bicycle with tan leather saddle and grips, standing on pale concrete, studio product photography, 100mm macro lens, f/8, soft morning light from the right, soft shadow falling left. Clean, modern. 4K.",
  "acts": [
    { "file": "forge",    "mode": "text-to-video",  "prompt": "A dark workshop, steel tubes racked on a wall, dust drifting in a single shaft of light. The camera drifts slowly forward along the rack." },
    { "file": "hands",    "mode": "text-to-video",  "prompt": "Extreme macro. A mechanic's hands true a spoked wheel on a stand, tightening one spoke at a time, the rest of the frame falling away into shadow. The camera pushes slowly forward." },
    { "file": "weld",     "mode": "text-to-video",  "risky": true, "prompt": "Extreme macro. A welding torch joins two steel tubes, a bright vivid orange glow and a fine fall of sparks against the dark. This is the only intensely saturated moment in the sequence." },
    { "file": "build",    "mode": "image-to-video", "prompt": "Extreme macro from above. The frame of the bicycle on a workstand as a chain is threaded over the rear cog. The camera pushes slowly down." },
    { "file": "ride",     "mode": "image-to-video", "prompt": "Slow motion. The bicycle rolls along a quiet city street, the front wheel and tan grips close in frame. The camera holds low beside the wheel." },
    { "file": "daylight", "mode": "image-to-video", "prompt": "The olive-green bicycle leans against a pale wall in bright daylight, a soft shadow stretching left. The camera pulls back slowly and continuously as the light opens up. High key, clean, calm." }
  ],
  "fallback": { "file": "weld", "prompt": "Extreme macro. A grinding wheel throws a fine fan of bright orange sparks across a steel tube against the dark. Continuous motion." }
}
```

Its palette: `1A1612, 2A2018, 4A3320, C8521E, E8A25C, F0D9B8, FBF5EC` (workshop dark to
warm daylight), saturated stop = the weld orange at act 3, text flipped dark
`1A1612`. Beats must come from the shop's real facts, never from this example.

## 6. Hand-off prompt for another agent

If the user would rather paste one prompt into a chat agent than use the
template, give it: the subject, `prompts.md`, the file names, `story.json`, and this
instruction: "Build a static site with the skill's `template/`; keep six pinned
acts, one video per act scrubbed by scroll, the page colour ramp and text flip from `story.json`,
no store features unless asked, no invented facts."

The reference run used GPT-6 Astra at medium reasoning (its default is low). Use the strongest model available at medium or higher, and keep the instructions this precise; vague prompts make the model decide for itself.
