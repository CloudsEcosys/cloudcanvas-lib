/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A root drawing on the GPU in a real browser, on both tiers: forced WebGL2 (G11) and `auto`, which is WebGPU
 * wherever this Chromium has an adapter (G10). Gpu blits draw their tints where their boxes are, blend in `z`
 * order, leave the DOM card to the DOM, and keep their elements as transparent hit proxies; under a tilted,
 * perspective camera the GPU pixels and the proxies still land where `camera.project` says.
 *
 * Run with `npm run test:browser`; skipped whole when Playwright is absent.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { GPU_ARGS, PLAYWRIGHT_MISSING, frames, loadChromium, startStaticServer } from './harness.js';

const FIXTURE = '/tests/browser/fixtures/gpu.html';
const TOLERANCE = 3;

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser gpu suite', { skip: 'playwright is not installed' }, () => {});
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
    test(`gpu (${tier}) - gpu blits draw their tints in z order, as transparent proxies, flat and tilted`, async () => {
      const page = await ctx.browser.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(String(error)));
      await page.goto(`${ctx.server.url}${FIXTURE}?backend=${tier}`);
      const kind = await page.evaluate(() => window.__gpu.ready);
      const adapter = await page.evaluate(async () => Boolean(navigator.gpu && await navigator.gpu.requestAdapter()));
      assert.equal(kind, tier === 'webgl2' || !adapter ? 'webgl2' : 'webgpu');
      await frames(page, 100);

      const flat = await page.evaluate(() => window.__gpu.pixels([[320, 120], [400, 190], [100, 100], [600, 300]]));
      assertPixel(flat[0], [255, 0, 0, 255], 'red alone');
      assertPixel(flat[1], [128, 128, 0, 255], 'half green over red');
      assertPixel(flat[2], [0, 0, 0, 0], 'the DOM card is not the GPU\'s');
      assertPixel(flat[3], [0, 0, 0, 0], 'nothing');
      const proxy = await page.evaluate(() => {
        const red = document.getElementById('red');
        return { hit: document.elementFromPoint(320, 120)?.id, opacity: red.style.opacity, card: document.elementFromPoint(100, 100)?.id };
      });
      assert.deepEqual(proxy, { hit: 'red', opacity: '0', card: 'card' });

      await page.evaluate(() => window.__gpu.tilt({ perspective: 900, rotateX: 20, rotateY: -25 }));
      await frames(page, 100);
      const tilted = await page.evaluate(async () => {
        const { project, pixels } = window.__gpu;
        const inside = project(320, 120);
        const outside = project(290, 150);
        const [a, b] = await pixels([[inside.x, inside.y], [outside.x, outside.y]]);
        return { inside: a, outside: b, hit: document.elementFromPoint(inside.x, inside.y)?.id };
      });
      assertPixel(tilted.inside, [255, 0, 0, 255], 'tilted: red where project puts it');
      assertPixel(tilted.outside, [0, 0, 0, 0], 'tilted: nothing left of it');
      assert.equal(tilted.hit, 'red', 'tilted: the proxy is under the same pixel');
      assert.deepEqual(errors, []);
      await page.close();
    });
  }

  test('gpu (webgl2) - when the browser takes the context away, another backend draws the same pixels on a new canvas', async () => {
    const page = await ctx.browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto(`${ctx.server.url}${FIXTURE}?backend=webgl2`);
    assert.equal(await page.evaluate(() => window.__gpu.ready), 'webgl2');
    await frames(page, 100);
    const points = [[320, 120], [400, 190], [600, 300]];
    const before = await page.evaluate((at) => window.__gpu.pixels(at), points);
    assertPixel(before[0], [255, 0, 0, 255], 'red alone');

    for (const round of [1, 2]) {
      assert.equal(await page.evaluate(() => window.__gpu.lose()), true, `loss ${round}: a new canvas replaced the lost one`);
      await frames(page, 100);
      const after = await page.evaluate((at) => window.__gpu.pixels(at), points);
      after.forEach((pixel, k) => assertPixel(pixel, before[k], `loss ${round}: point ${k} as before`));
      assert.equal(await page.evaluate(() => document.getElementById('red').style.opacity), '0', `loss ${round}: still a proxy`);
    }
    assert.equal(await page.evaluate(() => window.__gpu.kind()), 'webgl2');
    assert.deepEqual(errors, []);
    await page.close();
  });
}
