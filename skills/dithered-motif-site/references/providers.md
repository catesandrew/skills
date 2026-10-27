# Generation providers for the source image and video

The worked prompts in `image-prompts.md` and `video-prompts.md` were proven on
Higgsfield (`nano_banana_pro` for images, `seedance_2_0` for image-to-video).
The prompt *content* is provider neutral; only the call parameters differ.
Ask the user which provider they use, or detect the connected tools.

## What carries over unchanged

- The subject rule: many small discrete elements, never one solid object.
- The locked-off, static-camera language in every video prompt. Without it the
  subject travels across the frame on any model. If a clip drifts, regenerate.
- Image first, approve it, then animate it. The image is the cheap step.
- Frame extraction, crop, and background flattening (`frame-extraction.md`).

## What changes per provider

| Setting | Higgsfield (as written) | Kling |
|---|---|---|
| Connect | custom MCP connector | official connector at `https://kling.ai/mcp`, or an API-key MCP server or CLI |
| Image model | `nano_banana_pro` | Kling's image tools (text to image, image to image; Kolors on the API) |
| Video model | `seedance_2_0`, image-to-video, 5 s, 1080p, `std`, audio off | a Kling image-to-video model, `std` or `pro` mode, 5 s, audio off |
| Passing the frame in | a prior image job ID | URL or base64 on the API; check what the connector accepts |
| Cost | free preview, then credits | account credits (connector) or prepaid pack (API) |

Read the connector's tool schemas for exact parameter names; do not copy the
Higgsfield parameter block into another provider's call. Costs differ and
change: price one clip on each candidate model and compare live. The shared
capability checklist and provider notes live in the `cinematic-scroll-site`
skill's `references/providers.md`.

## Prompt adjustments to expect

- Keep the camera and subject constraints verbatim; reword only the style
  tokens that name a specific model.
- Prefer a negative prompt where the provider offers one (for example: camera
  movement, zoom, pan, people, text) to reinforce the locked-off rule.
- Re-judge the loop on the first clip from a new provider. Motion character
  differs, and crossfade-the-wrap tolerates it better than a scored seam.
