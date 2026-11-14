/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The content add-ons on a real GPU, on both tiers, the board loaded from XML: a sprite frame, a lit box, GPU
 * text and a hand-drawn canvas each land their pixels where their blits are, and the sprite's element carries
 * the same frame as its CSS background for a page without a GPU.
 *
 * Run with `npm run test:browser`; skipped whole when Playwright is absent.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { GPU_ARGS, PLAYWRIGHT_MISSING, frames, loadChromium, startStaticServer } from './harness.js';

const FIXTURE = '/tests/browser/fixtures/gpu-content.html';
const TOLERANCE = 3;

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser gpu content suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

function assertPixel(actual, expected, label) {
  const off = actual.some((value, i) => Math.abs(value - expected[i]) > TOLERANCE);
  assert.ok(!off, `${label}: drew [${actual}], expected [${expected}]`);
}

function registerSuite(launcher) {
  const ctx = { server: null, browser: null };

  before(async () => {
    ctx.server = await startStaticServer();
    ctx.browser = await launcher.launch({ args: [...GPU_ARGS] });
  });

  after(async () => {
    if (ctx.browser) await ctx.browser.close();
    if (ctx.server) await ctx.server.close();
  });

  for (const tier of ['webgl2', 'auto']) {
    test(`gpu content (${tier}) - sprite, lit box, text, a drawn canvas and an SVG path, loaded from XML`, async () => {
      const page = await ctx.browser.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(String(error)));
      await page.goto(`${ctx.server.url}${FIXTURE}?backend=${tier}`);
      const kind = await page.evaluate(() => window.__content.ready);
      assert.match(kind, /^webgl2|webgpu$/);
      await frames(page, 150);

      const text = [];
      for (let x = 204; x < 280; x += 2) for (let y = 24; y < 56; y += 2) text.push([x, y]);
      // The shape: a 24-unit square with an 8-unit hole, on 80 px - 10/3 px per unit; a 2-unit stroke on its edges.
      const [dot, box, drawn, empty, fill, hole, edge, ...label] = await page.evaluate(
        (points) => window.__content.pixels(points),
        [[40, 40], [130, 50], [40, 120], [400, 300], [110, 110], [140, 140], [100 + 40, 101], ...text]
      );
      assertPixel(dot, [0, 0, 255, 255], 'the sprite shows its blue frame');
      assertPixel(box, [205, 0, 0, 255], 'the box front face, lit');
      assertPixel(drawn, [255, 255, 0, 255], 'the hand-drawn canvas');
      assertPixel(empty, [0, 0, 0, 0], 'nothing');
      assertPixel(fill, [255, 0, 255, 255], 'the path fill');
      assertPixel(hole, [0, 0, 0, 0], 'its hole, wound opposite, stays open');
      assertPixel(edge, [0, 255, 255, 255], 'the stroke over the fill, on the top edge');
      assert.ok(label.some(([r, g, b, a]) => g > 200 && a > 200 && r < 60 && b < 60), 'the text drew green glyphs');
      assert.ok(label.some(([, , , a]) => a === 0), 'and left the gaps between them clear');

      const dom = await page.evaluate(() => {
        const dot = document.getElementById('dot');
        return { image: dot.style.backgroundImage.slice(0, 20), label: document.getElementById('label').textContent };
      });
      assert.deepEqual(dom, { image: 'url("data:image/png;', label: 'Hi' });
      assert.deepEqual(errors, []);
      await page.close();
    });
  }
}
