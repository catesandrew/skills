---
"@catesworks/skill-scroll-video-site": patch
---

Document that iOS Safari needs `video.load()` after setting a scrub video's `src` (it ignores `preload="auto"` and the first seek never lands), add an iOS Simulator test recipe, and call `load()` in the reference React engine.
