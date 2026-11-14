/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Compositing DOM and GPU on both tiers: a punch clears an `over` canvas where its DOM card is, so the card shows
 * and takes the pointer; a DOM blit and a gpu blit raised to the same `z` land where `camera.project` puts that z
 * under perspective (the CSS 3D plane and the GPU share one camera); and, with HTML-in-Canvas enabled, a card's
 * HTML is drawn by the GPU while its input stays in the DOM - without the flag, `htmlCanvas` changes nothing.
 *
 * Run with `npm run test:browser`; skipped whole when Playwright is absent.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { GPU_ARGS, PLAYWRIGHT_MISSING, frames, loadChromium, startStaticServer } from './harness.js';

const FIXTURE = '/tests/browser/fixtures/gpu-compositing.html';
const HTML_IN_CANVAS = '--enable-blink-features=CanvasDrawElement';
const TOLERANCE = 3;

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser gpu compositing suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

function assertPixel(actual, expected, label) {
  const off = actual.some((value, i) => Math.abs(value - expected[i]) > TOLERANCE);
  assert.ok(!off, `${label}: drew [${actual}], expected [${expected}]`);
}

async function open(browser, url, query) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(`${url}${FIXTURE}?${query}`);
  const kind = await page.evaluate(() => window.__compositing.ready);
  assert.match(kind, /^webgl2|webgpu$/);
  await frames(page, 150);
  return { page, errors };
}

function registerSuite(launcher) {
  const ctx = { server: null, browser: null, flagged: null };

  before(async () => {
    ctx.server = await startStaticServer();
    ctx.browser = await launcher.launch({ args: [...GPU_ARGS] });
    ctx.flagged = await launcher.launch({ args: [...GPU_ARGS, HTML_IN_CANVAS] });
  });

  after(async () => {
    for (const browser of [ctx.browser, ctx.flagged]) if (browser) await browser.close();
    if (ctx.server) await ctx.server.close();
  });

  for (const tier of ['webgl2', 'auto']) {
    test(`compositing (${tier}) - a punch opens an over canvas for its card; one z lands in one place, DOM or GPU`, async () => {
      const { page, errors } = await open(ctx.browser, ctx.server.url, `backend=${tier}&layer=over`);
      const [hole, floor] = await page.evaluate(() => window.__compositing.pixels([[90, 70], [200, 70]]));
      assertPixel(hole, [0, 0, 0, 0], 'the punched box is clear');
      assertPixel(floor, [255, 0, 0, 255], 'the floor elsewhere');
      assert.equal(await page.evaluate(() => document.elementFromPoint(90, 70)?.id), 'card', 'the card takes the pointer');

      await page.evaluate(() => window.__compositing.tilt({ perspective: 800, rotateY: -20 }));
      await frames(page, 150);
      const placed = await page.evaluate(async () => {
        const { project, pixels } = window.__compositing;
        const dom = document.getElementById('raised-dom').getBoundingClientRect();
        const corners = [[300, 100], [340, 100], [300, 140], [340, 140]].map(([x, y]) => project(x, y, 120));
        const centre = project(380, 120, 120);
        const [gpuCentre] = await pixels([[centre.x, centre.y]]);
        return { dom: [dom.left, dom.top, dom.right, dom.bottom], corners, gpuCentre };
      });
      const xs = placed.corners.map((c) => c.x);
      const ys = placed.corners.map((c) => c.y);
      const expected = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
      placed.dom.forEach((side, i) => assert.ok(Math.abs(side - expected[i]) < 1.5, `DOM side ${i}: ${side} vs ${expected[i]}`));
      assertPixel(placed.gpuCentre, [255, 255, 0, 255], 'the raised gpu blit is where its z projects');
      assert.deepEqual(errors, []);
      await page.close();
    });
  }

  test('compositing - HTML-in-Canvas: the GPU draws a card of HTML, its input stays live in the DOM', async () => {
    const { page, errors } = await open(ctx.flagged, ctx.server.url, 'backend=webgl2&layer=under');
    assert.equal(await page.evaluate(() => window.__compositing.htmlDrawn), true);
    const [cyan] = await page.evaluate(() => window.__compositing.pixels([[120, 250]]));
    assertPixel(cyan, [0, 255, 255, 255], 'the HTML drawn by the GPU');
    const trip = await page.evaluate(() => window.__compositing.roundTrip());
    assert.deepEqual(trip.now, trip.was, 'off() puts the content back among the child blits as it was');
    await page.focus('#field');
    await page.keyboard.press('End');
    await page.keyboard.type('!');
    assert.equal(await page.evaluate(() => [document.activeElement.id, document.getElementById('field').value].join()), 'field,typed!');
    assert.deepEqual(errors, []);
    await page.close();
  });

  test('compositing - without HTML-in-Canvas, htmlCanvas changes nothing', async () => {
    const { page } = await open(ctx.browser, ctx.server.url, 'backend=webgl2&layer=under');
    assert.equal(await page.evaluate(() => window.__compositing.htmlDrawn), false);
    assert.equal(await page.evaluate(() => document.querySelector('[data-blit-html-canvas]')), null);
    await page.close();
  });
}
