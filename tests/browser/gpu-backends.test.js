/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The two GPU backends against the shared fixture scene (`fixtures/gpu-backend.html`): each draws known colours
 * where the contract in `.plugin/addons/gpu-scene.js` says - blending, textures, uv, rotation, tint - and the two
 * agree pixel for pixel. Chromium runs with `--enable-unsafe-webgpu` (swiftshader here); without an adapter the
 * WebGPU cases say so and skip.
 *
 * Run with `npm run test:browser`; skipped whole when Playwright is absent.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { GPU_ARGS, PLAYWRIGHT_MISSING, loadChromium, startStaticServer } from './harness.js';

const FIXTURE = '/tests/browser/fixtures/gpu-backend.html';

/** Allowed difference per channel, in 0..255. */
const TOLERANCE = 3;

/** `[x, y, [r, g, b, a]]`: premultiplied pixels the fixture scene must produce. */
const EXPECTED = [
  [15, 15, [255, 0, 0, 255]],       // red alone
  [55, 40, [128, 0, 127, 255]],     // half blue over red
  [90, 60, [0, 0, 128, 128]],       // half blue over nothing
  [125, 15, [255, 0, 0, 255]],      // texture corners, where the filter clamps to one texel: top-left
  [180, 15, [0, 255, 0, 255]],      // top-right
  [125, 70, [0, 0, 255, 255]],      // bottom-left
  [180, 70, [255, 255, 0, 255]],    // bottom-right
  [50, 75, [0, 255, 0, 255]],       // the turned quad now stands upright: 40..60 x 70..130
  [50, 125, [0, 255, 0, 255]],
  [25, 100, [0, 0, 0, 0]],          // where it lay before turning
  [130, 95, [128, 0, 0, 128]],      // the top-left texel alone, at half alpha
  [195, 145, [0, 0, 0, 0]],         // nothing drawn
  [232, 40, [204, 0, 0, 255]],      // the box's -x face, turned toward the light: shade 0.80
  [262, 40, [156, 0, 0, 255]],      // its front face, turned away: shade 0.61
  [270, 48, [255, 255, 255, 255]],  // a quad after the box draws over it, depth or not
  [308, 32, [0, 255, 0, 255]],      // the nearer plane wins though drawn first
  [312, 50, [0, 0, 255, 255]],      // the farther one where it is alone
  [25, 40, [0, 0, 0, 0]],           // an erasing quad cleared the red under it
  [65, 60, [0, 0, 64, 64]]          // a half-alpha one halved the half blue
];

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser gpu backend suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

/** The fixture scene's pixels from one backend, or `{error}`. */
async function draw(browser, url, backend) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(`${url}${FIXTURE}?backend=${backend}`);
  const result = await page.evaluate(() => window.__result);
  await page.close();
  return { ...result, errors };
}

function pixelAt(result, x, y) {
  const at = (y * result.width + x) * 4;
  return result.data.slice(at, at + 4);
}

function assertScene(result) {
  assert.equal(result.error, undefined, result.error);
  assert.deepEqual(result.errors, []);
  assert.deepEqual([result.width, result.height], [320, 150]);
  for (const [x, y, expected] of EXPECTED) {
    const actual = pixelAt(result, x, y);
    const off = actual.some((value, i) => Math.abs(value - expected[i]) > TOLERANCE);
    assert.ok(!off, `(${x}, ${y}): ${result.kind} drew [${actual}], expected [${expected}]`);
  }
}

function registerSuite(launcher) {
  const ctx = { server: null, browser: null, drawn: {} };

  before(async () => {
    ctx.server = await startStaticServer();
    ctx.browser = await launcher.launch({ args: [...GPU_ARGS] });
    ctx.webgpu = await (async () => {
      const page = await ctx.browser.newPage();
      await page.goto(`${ctx.server.url}${FIXTURE}?backend=none`);
      const available = await page.evaluate(async () => Boolean(navigator.gpu && await navigator.gpu.requestAdapter()));
      await page.close();
      return available;
    })();
  });

  after(async () => {
    if (ctx.browser) await ctx.browser.close();
    if (ctx.server) await ctx.server.close();
  });

  test('gpu backends - WebGL2 draws the fixture scene to the contract', async () => {
    ctx.drawn.webgl2 = await draw(ctx.browser, ctx.server.url, 'webgl2');
    assert.equal(ctx.drawn.webgl2.kind, 'webgl2');
    assertScene(ctx.drawn.webgl2);
  });

  test('gpu backends - WebGPU draws the fixture scene to the contract', async (t) => {
    if (!ctx.webgpu) return t.skip('no WebGPU adapter in this Chromium');
    ctx.drawn.webgpu = await draw(ctx.browser, ctx.server.url, 'webgpu');
    assert.equal(ctx.drawn.webgpu.kind, 'webgpu');
    assertScene(ctx.drawn.webgpu);
  });

  test('gpu backends - the two agree pixel for pixel', (t) => {
    const { webgl2, webgpu } = ctx.drawn;
    if (!webgl2?.data || !webgpu?.data) return t.skip('needs both backends drawn');
    let differing = 0;
    for (let i = 0; i < webgl2.data.length; i += 4) {
      const off = [0, 1, 2, 3].some((c) => Math.abs(webgl2.data[i + c] - webgpu.data[i + c]) > TOLERANCE);
      if (off) differing += 1;
    }
    // Edge pixels may round differently; anything more is a different scene.
    assert.ok(differing <= 0.005 * webgl2.width * webgl2.height, `${differing} pixels differ`);
  });
}
