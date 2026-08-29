# Screenshot harness — reference implementation

A minimal Puppeteer harness for the render step of the critique loop. Small
on purpose — its only jobs are: load the real page, wait for it to settle,
capture a screenshot at a given viewport/scroll position, and report console
errors plus document height in the same call so the critique step has
everything it needs without a second round trip.

```js
// shot.js — usage: node shot.js <url> <outFile> <WxH> [waitMs] [scrollY]
import puppeteer from 'puppeteer';

const [, , url, outFile, viewport = '1440x900', waitMs = '2000', scrollY = '0'] =
  process.argv;
const [width, height] = viewport.split('x').map(Number);

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width, height });

const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(String(err)));

await page.goto(url, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, Number(waitMs)));

if (Number(scrollY) > 0) {
  await page.evaluate((y) => window.scrollTo(0, y), Number(scrollY));
  await new Promise((r) => setTimeout(r, 300)); // let scroll-triggered animation settle
}

const docHeight = await page.evaluate(() => document.body.scrollHeight);
await page.screenshot({ path: outFile });
await browser.close();

console.log(JSON.stringify({ out: outFile, docHeight, errors }));
```

Call it once per (viewport, scroll depth) combination you care about — for a
typical single-page critique pass that's desktop+mobile crossed with
top/mid/bottom, i.e. up to six screenshots, though a short page only needs
top. Feed the resulting image files to the agent's vision input alongside
the `docHeight`/`errors` JSON for the critique step.

**Headless mode stability under parallel load:** when running many of these
concurrently (one per parallel builder), pin `headless: 'new'` (or whichever
mode is confirmed stable in your Puppeteer/Chrome version) explicitly rather
than leaving it to a default that may differ between local dev and CI, or
between builder processes started at slightly different times. A
non-deterministic headless mode has been observed to hang machine-wide when
many instances launch concurrently — cheap to avoid by pinning it once in a
shared harness every builder calls into, expensive to debug after the fact.
