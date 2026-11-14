/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The observe add-on in a real browser: markup written with `innerHTML` into
 * an observed root is drawn where its `data-x/y` place it, a real press selects
 * it through its named trait, and taking it out releases it from the index.
 *
 * Run with `npm run test:browser`; fails without Playwright unless CLOUDCANVAS_BROWSER_OPTIONAL=1 (then skipped whole).
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLAYWRIGHT_MISSING,
  frames,
  loadChromium,
  openFixturePage,
  startStaticServer
} from './harness.js';

const FIXTURE = '/tests/browser/fixtures/observe.html';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser observe suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

function registerSuite(launcher) {
  const ctx = { server: null, browser: null };

  before(async () => {
    ctx.server = await startStaticServer();
    ctx.browser = await launcher.launch();
  });

  after(async () => {
    if (ctx.browser) await ctx.browser.close();
    if (ctx.server) await ctx.server.close();
  });

  test('observe - innerHTML markup joins the root, draws in place, selects, and leaves the index', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, FIXTURE);
    await page.evaluate(() => {
      const holder = window.cloudcanvas.blit({});
      holder.el.innerHTML = '<div data-blit data-select id="late" class="card" data-x="200" data-y="150"></div>';
    });
    await frames(page, 100);

    const joined = await page.evaluate(() => {
      const found = window.cloudcanvas.find('late');
      const rect = found.el.getBoundingClientRect();
      return { found: Boolean(found), box: { x: rect.x, y: rect.y, w: rect.width, h: rect.height } };
    });
    assert.deepEqual(joined, { found: true, box: { x: 200, y: 150, w: 120, h: 80 } });

    await page.mouse.click(250, 180);
    await frames(page, 50);
    const selected = await page.evaluate(() => document.getElementById('late').classList.contains('is-selected'));
    assert.equal(selected, true, 'the named select trait did not attach');

    const released = await page.evaluate(async () => {
      document.getElementById('late').remove();
      await new Promise((resolve) => setTimeout(resolve, 0));
      return window.cloudcanvas.find('late');
    });
    assert.equal(released, null);
    assert.deepEqual(errors, []);
    await page.close();
  });
}
