/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The 10k-sprite benchmark as a guard (`scripts/bench-gpu.js` prints the full table): with ten thousand gpu
 * blits, a camera pan and a single move cost next to nothing - the GPU redraws, nothing is walked - and moving all
 * of them costs a bounded multiple of the same move on the DOM port (each gpu blit is also its DOM proxy).
 * Bounds are loose on purpose: they catch an O(n) walk slipping into a frame, not a slow machine.
 *
 * Run with `npm run test:browser`; skipped whole when Playwright is absent.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { GPU_ARGS, PLAYWRIGHT_MISSING, loadChromium, startStaticServer } from './harness.js';
import { benchmark } from '../../scripts/bench-gpu.js';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser gpu benchmark suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
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

  test('gpu bench - 10k sprites: a pan and one move stay under 3 ms; moving all stays within 6x the DOM port', async () => {
    const gpu = await benchmark(ctx.browser, ctx.server.url, 'backend=webgl2&count=10000');
    const dom = await benchmark(ctx.browser, ctx.server.url, 'port=dom&count=10000');
    assert.equal(gpu.error, undefined, gpu.error);
    assert.equal(gpu.kind, 'webgl2');
    assert.ok(gpu.pan < 3, `a pan took ${gpu.pan} ms`);
    assert.ok(gpu.one < 3, `one move took ${gpu.one} ms`);
    assert.ok(gpu.all < Math.max(6 * dom.all, 30), `moving all took ${gpu.all} ms (DOM port ${dom.all} ms)`);
  });
}
