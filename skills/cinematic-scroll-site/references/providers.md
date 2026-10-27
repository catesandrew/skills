# Generation providers

The pipeline needs two capabilities from a generation provider: **image
generation** (the starting frame and supporting stills) and **image-to-video**
(animate the approved frame). Everything else in this skill is provider
neutral. Ask the user which provider to use, or detect it from the tools
already connected, and record the choice in the design package (Producer
section).

Prices, model names, and limits change often. Treat every number below as a
planning shape and read live prices from the provider before spending.

## Choosing

| | Higgsfield | Kling (official connector) | Kling (API key) |
|---|---|---|---|
| How it connects | Custom MCP connector (URL from the Higgsfield MCP page), sign in with the account | Custom MCP connector at `https://kling.ai/mcp`, sign in with the Kling account | A community MCP server or direct API calls with an access key and secret key from the developer console |
| Billing | Account credits | The user's existing Kling credits (per the official guide) | Separate prepaid API packs, billed apart from the web plan |
| Image generation | Yes (several image models) | Yes (text to image, image to image) | Yes (Kolors), depends on the server |
| Image to video | Yes (several video models, wide price spread) | Yes | Yes |
| Free cost preview | Yes (`get_cost: true`) | Unverified: check the connector's tool schema | Not applicable: compute from the price sheet |
| First and last frame | Model dependent | Kling models support a first/last frame pair in the API (`image` plus `image_tail`, or `first_frame` plus `last_frame` on newer endpoints); whether the connector exposes it is unverified | Yes on the API for supporting models |
| Cheaper per clip | Compare live | Compare live | Compare live |

Do not assume either side is cheaper. A subscription's included credits, a
prepaid API pack, and a per-second API price are different units: convert
each to a cost per planned clip (frame plus video plus stills) and show the
user that number side by side.

If the user already has both, offer the cheaper path per clip and let them
decide. If neither is connected, give exact connect steps for the one they
pick, then verify the tools appear before continuing.

## Capability checklist (run before Phase 6, whichever provider)

Read the connector's tool list and schemas, not this file, for the truth:

1. Which tool generates an image? Which accepts a start image for video?
2. How is an input image supplied: a prior job or media ID, an upload tool, a
   public URL, or base64? This decides the chaining "upload bridge".
3. Is there a cost preview, or must you compute from a price sheet?
4. What durations, resolutions, and aspect ratios are allowed? Scroll sites
   want 16:9, 1080p, 5 to 8 seconds.
5. Is audio optional? Turn it off; the hero is muted.
6. Is a negative prompt or an end frame supported?
7. Does the video model have a "std" or "pro" mode, and does the cheaper one
   hold the locked-world and steady-motion laws?

Write the answers into the design package so later phases do not re-ask.

## Higgsfield notes

- Connect: copy the connector URL from the provider's MCP page, add it as a
  custom connector, sign in.
- Cost: preflight with `get_cost: true` (free) before every generation.
- A prior image job ID can be passed straight in as the start image, so a
  just-generated frame needs no re-upload.
- Planning shape seen in practice: the 2k starting frame costs a couple of
  credits and the video costs roughly 10 to 55 credits depending on the model.
- Models are chosen by ID in the tool call; list the connector's model
  catalog and preflight the top two or three for the same shot.
- Render failures: a job can end `failed` or be flagged by moderation, and
  abstract prompts (dissolving figures, floating pills) are the usual false
  positives. Reword toward product or scene context and retry once; if it is
  still flagged, try a more lenient model from the catalog, usually at a lower
  resolution. Check the credit balance afterward instead of assuming a refund,
  tell the user about every retry, and never report a clip as rendered when it
  was not. If the connector suggests a style preset, decline it with the
  `declined_preset_id` it names, because presets break palette and chaining
  consistency.

## Kling notes

- Official connector: add `https://kling.ai/mcp` as a custom connector and
  sign in with the Kling account. Per the official guide it covers text to
  image, image to image, text to video, and image to video, billed to the
  account's credits. The exact tool names and parameters were not verified
  here; read them from the connector.
- Kling also recommends its CLI over MCP for some agent harnesses. If the
  connector will not load, ask the user whether to use the CLI or an
  API-key server instead of improvising.
- API key route: community servers (for example `mcp-kling`) call the API
  with `KLING_ACCESS_KEY` and `KLING_SECRET_KEY`. Keep keys in a secret
  store, never in chat, never in the repo; never print them.
- Image to video parameters on the API: `model_name`, `prompt`, `mode`
  (`std` or `pro`), `duration`, `image` (start frame as URL or base64), and
  for supporting models `image_tail` (end frame). Newer endpoints use a
  `contents` array with `first_frame` and `last_frame` entries. Some fast
  models accept a start frame only. Check the model before relying on an end
  frame.
- Kling hands back a task that you poll; renders take minutes like any
  provider. A task that reports progress is fine.

## First and last frame chaining (Kling advantage, when available)

When the provider accepts both a start and an end frame, chaining gets
sturdier: generate each segment between two approved frames, so the next
segment's start frame is exactly the previous segment's end frame by
construction, and you control where each segment lands. Approve all frames
first (cheap), then generate the videos. If only a start frame is supported,
use the last-frame extraction recipe in `prompt-laws.md`.

## Mixing providers

Image and video do not have to come from the same provider. A common split
is: generate and approve stills with whichever image tool is cheaper or
better for the brand, then animate with the cheaper video model. Hand images
between providers as files or URLs; keep every approved frame in the review
folder so a provider swap never loses work. Re-run the video gate whenever
the video provider changes, since motion style differs.

## Adding another provider

Fill the capability checklist above, add a column to the table, and add a
short notes section. Nothing else in the skill should name a provider.
