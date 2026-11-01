# Troubleshooting

Symptom, cause, fix. Check here first when something breaks.

## Render wait vs. real stall
**Cause:** video generation takes minutes; a job still reporting status or progress is healthy.
**Fix:** keep waiting and build scaffolding meanwhile. Treat it as a stall only if the call hangs with no status, no error, nothing, well past a normal render.

## Generated frame shows a real logo or trademark
**Cause:** image models sneak in recognizable logos or packaging on product-shaped objects.
**Fix:** catch it at the frame inspection step, before video credits move. Re-roll with an explicit "no logos, no text, no brand marks" clause. Never ship a visible trademark.

## Hero looks broken when double-clicking `index.html`
**Cause:** browsers block `fetch()` on `file://`, so the Blob loader fails by design.
**Fix:** the static poster should show instead. Tell the user plainly. For the real preview run `npx http-server` or `python -m http.server` and open localhost.

## Scrub stutters or skips frames on fast scroll
**Cause:** overlapping `currentTime` seeks (a new seek before the last `seeked`), or a long keyframe interval in the source.
**Fix:** confirm seeks are serialized. Then confirm the video was re-encoded with `-g 1 -keyint_min 1` (`ffmpeg-recipes.md`). A long GOP stutters no matter how good the JS is.

## Hero shows only stills on an iPhone and never scrubs
**Cause:** iOS Safari ignores `preload="auto"` and stops at the metadata, so after `video.src = ...` the first seek never fires `seeked` unless `video.load()` is called. A reveal gated on that seek times out and the page falls back to its stills, which look like the first frame until the visitor scrolls. Desktop WebKit and Playwright's iPhone profile do not reproduce it.
**Fix:** call `video.load()` right after assigning `src` (the Blob path and the direct path). Verify on the iOS Simulator or a device: `video.readyState` should reach 4 and `currentTime` should follow the scroll.

## Captions unreadable over a bright or busy frame
**Cause:** the scrim was checked against an average frame, not the band's worst-contrast frame.
**Fix:** re-check at the brightest or busiest frame inside that caption's scroll range. Strengthen the scrim for that band only, not the whole video.

## Credits run out mid-chain (chained journeys)
**Cause:** total cost is segments x video price, and re-rolls at the video gate add to it.
**Fix:** stop before the next segment. Tell the user the exact balance and the exact next cost. Let them add credits, switch to a cheaper video model, or shorten the chain.

## Catalog prices differ from an earlier quote
**Cause:** model catalogs and pricing change between sessions.
**Fix:** re-run the provider's free cost preflight immediately before presenting the model choice, every time.

## `vercel --prod` succeeds but the live URL 404s
**Cause:** stale or wrong project link in `.vercel/`, or `index.html` is not at the root of the deployed folder.
**Fix:** confirm `index.html` sits directly in the folder passed to `vercel --prod`. Run `npx vercel ls` to see where it landed. Re-link with `npx vercel link` if wrong.

## Custom domain shows "not found" or a certificate warning
**Cause:** DNS propagation.
**Fix:** confirm records match what `vercel domains add` printed exactly, then wait. The dashboard Domains tab shows a live validity check.

## Fine on desktop, wrong on the user's real phone
**Cause:** a resized desktop window does not reproduce safe-area insets, touch targets, real network speed or in-app webviews.
**Fix:** reproduce with a real device viewport in dev tools, fix, and re-verify on the live URL.
