/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Real pointer and keyboard on gpu blits, both tiers (E3): a mouse drag on what the GPU drew moves the blit - the
 * GPU redraws it where it went - flat and under a tilt, where the grabbed point stays under the cursor; a click
 * selects it; Tab and arrows rove to it and Enter acts. The transparent proxy is what the input reaches.
 *
 * Run with `npm run test:browser`; skipped whole when Playwright is absent.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { GPU_ARGS, PLAYWRIGHT_MISSING, frames, loadChromium, startStaticServer } from './harness.js';

const FIXTURE = '/tests/browser/fixtures/gpu-input.html';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser gpu input suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

async function drag(page, from, to) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await page.mouse.up();
  await frames(page, 100);
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
    test(`gpu input (${tier}) - drag moves what the GPU drew, flat and tilted; click selects; the keyboard roves and acts`, async () => {
      const page = await ctx.browser.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(String(error)));
      await page.goto(`${ctx.server.url}${FIXTURE}?backend=${tier}`);
      assert.match(await page.evaluate(() => window.__input.ready), /^webgl2|webgpu$/);
      await frames(page, 100);

      await drag(page, { x: 160, y: 140 }, { x: 220, y: 170 });
      assert.deepEqual(await page.evaluate(() => window.__input.at()), { x: 160, y: 130 });
      const [moved, left] = await page.evaluate(async () => [await window.__input.pixel(270, 200), await window.__input.pixel(130, 110)]);
      assert.deepEqual([moved, left], [[255, 0, 0, 255], [0, 0, 0, 0]], 'the GPU drew it where it went');

      await page.mouse.click(460, 140);
      await frames(page, 50);
      assert.ok((await page.evaluate(() => window.__input.selected)).includes('second'), 'a click on a proxy selects');

      await page.evaluate(() => window.__input.tilt({ perspective: 900, rotateX: 20, rotateY: -15 }));
      await frames(page, 100);
      const grab = await page.evaluate(() => window.__input.project(220, 170));
      await drag(page, grab, { x: grab.x + 50, y: grab.y + 30 });
      const after = await page.evaluate(() => ({ at: window.__input.at(), grabbed: window.__input.project(220 + (window.__input.at().x - 160), 170 + (window.__input.at().y - 130)) }));
      assert.ok(Math.abs(after.grabbed.x - (grab.x + 50)) < 2 && Math.abs(after.grabbed.y - (grab.y + 30)) < 2,
        `the grabbed point follows the cursor under tilt: ${JSON.stringify(after.grabbed)} vs ${grab.x + 50},${grab.y + 30}`);

      await page.evaluate(() => window.__input.tilt({ perspective: null, rotateX: 0, rotateY: 0 }));
      await frames(page, 50);
      // From a clean focus: the clicks above left it on a card.
      await page.evaluate(() => document.activeElement?.blur());
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'app', 'Tab lands on the board');
      await page.keyboard.press('Enter');
      const focused = await page.evaluate(() => document.activeElement.id);
      assert.ok(['first', 'second'].includes(focused), `the keyboard reaches a gpu blit (${focused})`);
      await page.keyboard.press('Enter');
      assert.deepEqual(await page.evaluate(() => window.__input.actions), [focused]);
      assert.deepEqual(errors, []);
      await page.close();
    });
  }
}
