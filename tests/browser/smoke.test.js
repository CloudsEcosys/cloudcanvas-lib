/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Browser smoke suite, input: the dashboard board (`fixtures/dashboard.html`)
 * driven through a real chromium - boot, an idle frame that touches nothing,
 * zoom, escaping, pointer gestures, the wheel, and blit ids. What it proves that
 * happy-dom cannot: real layout, a real rAF loop, real pointer input.
 *
 * Its siblings take the same page: `smoke-navigation.test.js` (focus, promotion,
 * cursors, keyboard, ARIA) and `smoke-paint.test.js` (theme, wells, connectors,
 * contrast); `bare.test.js` is the page with no CSS of its own.
 *
 * NOT part of `npm test` - the unit and integration suites run headless under
 * happy-dom and must stay dependency-free. This one needs Playwright and a
 * browser build, and is run on its own (`npm run test:browser`); without
 * Playwright installed it reports a single skip with the install command.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLAYWRIGHT_MISSING,
  assertUniqueBlitIds,
  boundsOf,
  cameraOf,
  duplicateBlitIds,
  frames,
  loadChromium,
  openHarness,
  setCamera,
  startStaticServer
} from './harness.js';

/** Markup probes that must arrive as inert text / a rejected color. */
const TITLE_PROBE = '<img src=x onerror="window.__xssTitle = true">';
const COLOR_PROBE = '#fff;"><img src=x onerror="window.__xssColor = true">';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser smoke suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

/** Shared page state, populated by the `before` hook. */
function registerSuite(launcher) {
  const ctx = { server: null, browser: null, page: null, errors: [] };

  before(async () => {
    ctx.server = await startStaticServer();
    const harness = await openHarness(launcher, ctx.server.url);
    ctx.browser = harness.browser;
    ctx.page = harness.page;
    ctx.errors = harness.errors;
  });

  after(async () => {
    if (ctx.browser) await ctx.browser.close();
    if (ctx.server) await ctx.server.close();
  });

  registerBoot(ctx);
  registerIdle(ctx);
  registerZoom(ctx);
  registerEscaping(ctx);
  registerPointer(ctx);
  registerWheel(ctx);
  registerDuplicateIds(ctx);

  test('no page errors were reported for the whole input suite', () => {
    assert.deepEqual(ctx.errors, []);
  });
}

/* ------------------ BOOT ------------------ */

function registerBoot(ctx) {
  test('the harness boots a mounted board with no errors', async () => {
    const state = await ctx.page.evaluate(() => ({
      blits: document.querySelectorAll('#canvas-container [data-blit]').length,
      rootMarked: window.cloudcanvas.el.hasAttribute('data-blit-root'),
      layers: [
        Boolean(document.querySelector('#canvas-container > [data-blit-plane]')),
        Boolean(document.querySelector('#canvas-container > [data-blit-overlay]')),
        Boolean(document.querySelector('[data-blit-plane] > svg[data-blit-svg]'))
      ]
    }));

    assert.equal(state.rootMarked, true);
    assert.ok(state.blits >= 7, `expected the demo board, saw ${state.blits} blits`);
    assert.deepEqual(state.layers, [true, true, true]);
    assert.deepEqual(ctx.errors, []);
  });

  test('nested blits are still connected after three seconds of frames', async () => {
    await frames(ctx.page, 3000);

    const state = await ctx.page.evaluate(() => {
      const connected = (id) => Boolean(document.getElementById(id)?.isConnected);
      return {
        scopeChildren: window.cloudcanvas.find('card_parent_scope').blits.map((b) => b.el.id),
        focusedChild: connected('card_focused_child'),
        activeChild: connected('card_active_child'),
        // A lazy scope holds no children until they are required.
        providerChildren: window.cloudcanvas.find('card_provider_scope').blits.length
      };
    });

    assert.equal(state.focusedChild, true);
    assert.equal(state.activeChild, true);
    assert.equal(state.providerChildren, 0);
    assert.deepEqual(state.scopeChildren, ['card_focused_child', 'card_active_child', 'card_third_child']);
  });
}

/* ------------------ IDLE ------------------ */

function registerIdle(ctx) {
  test('an idle second mutates neither the connector layer, the overlay, nor card content', async () => {
    await ctx.page.evaluate(() => {
      window.__mutations = [];
      window.__observer = new MutationObserver((records) => {
        for (const record of records) window.__mutations.push(`${record.type}:${record.target.nodeName}`);
      });

      const options = { subtree: true, childList: true, attributes: true, characterData: true };
      for (const selector of ['svg[data-blit-svg]', '[data-blit-overlay]', '#card_focused_child']) {
        window.__observer.observe(document.querySelector(selector), options);
      }
    });

    await frames(ctx.page, 1000);

    const mutations = await ctx.page.evaluate(() => {
      window.__observer.disconnect();
      return window.__mutations;
    });

    assert.deepEqual(mutations, []);
  });
}

/* ------------------ ZOOM ------------------ */

function registerZoom(ctx) {
  test('zooming to 2x leaves measured blit sizes unchanged', async () => {
    const before = await boundsOf(ctx.page, 'card_focused_child');

    await ctx.page.evaluate(() => { window.fixture.camera.setZoom(2); });
    await frames(ctx.page, 200);
    // A data write queues a fresh read phase, so the assertion is about measurement, not caching.
    await ctx.page.evaluate(() => { window.cloudcanvas.find('card_focused_child').set({ measured: 'at-2x' }); });
    await frames(ctx.page, 200);

    const scale = (await cameraOf(ctx.page)).scale;
    const after = await boundsOf(ctx.page, 'card_focused_child');

    assert.equal(scale, 2);
    assert.ok(before.w > 0 && before.h > 0, 'the card was never measured');
    assert.equal(after.w, before.w);
    assert.equal(after.h, before.h);

    await ctx.page.evaluate(() => { window.fixture.camera.setZoom(1); });
    await frames(ctx.page, 150);
  });
}

/* ------------------ ESCAPING ------------------ */

function registerEscaping(ctx) {
  test('a markup title and a badge-color exploit are both inert', async () => {
    await ctx.page.evaluate(([title, color]) => {
      window.cloudcanvas.blit({
        id: 'card_xss_probe', type: 'card', x: 880, y: 620, w: 220, h: 120,
        card: { title, body: 'probe', badge: { text: 'probe', color } }
      });
    }, [TITLE_PROBE, COLOR_PROBE]);

    await frames(ctx.page, 300);

    const result = await ctx.page.evaluate(() => {
      const { CLS } = window.fixture;
      const element = document.getElementById('card_xss_probe');
      const badge = element.querySelector('.cloudcanvas-primitive-badge');
      return {
        images: element.querySelectorAll('img').length,
        title: element.querySelector(`.${CLS.TITLE}`).textContent,
        badgeStyle: badge ? badge.getAttribute('style') : '',
        firedFromTitle: window.__xssTitle === true,
        firedFromColor: window.__xssColor === true
      };
    });

    assert.equal(result.images, 0);
    assert.equal(result.title, TITLE_PROBE);
    assert.equal(result.firedFromTitle, false);
    assert.equal(result.firedFromColor, false);
    assert.ok(!result.badgeStyle.includes('onerror'), `badge style leaked markup: ${result.badgeStyle}`);

    await ctx.page.evaluate(() => window.cloudcanvas.find('card_xss_probe').remove());
    await frames(ctx.page, 100);
  });
}

/* ------------------ POINTER ------------------ */

function registerPointer(ctx) {
  test('dragging a card moves it by the pointer delta', async () => {
    const box = await ctx.page.locator('#card_focused_child').boundingBox();
    const before = await boundsOf(ctx.page, 'card_focused_child');

    await ctx.page.mouse.move(box.x + box.width / 2, box.y + 8);
    await ctx.page.mouse.down();
    await ctx.page.mouse.move(box.x + box.width / 2 + 60, box.y + 48, { steps: 8 });
    await ctx.page.mouse.up();
    await frames(ctx.page, 150);

    const after = await boundsOf(ctx.page, 'card_focused_child');
    assert.ok(Math.abs((after.x - before.x) - 60) < 4, `x moved ${after.x - before.x}`);
    assert.ok(Math.abs((after.y - before.y) - 40) < 4, `y moved ${after.y - before.y}`);

    await ctx.page.evaluate((to) => window.cloudcanvas.find('card_focused_child').set(to), { x: 20, y: 100 });
    await frames(ctx.page, 150);
  });

  test('a real dblclick lands on the card, not on the host', async () => {
    // `click` and `dblclick` are computed by the platform from the press and the
    // release; a pointer capture taken at the press would retarget both to the host.
    const box = await ctx.page.locator('#card_floating').boundingBox();
    await ctx.page.evaluate(() => {
      const element = document.getElementById('card_floating');
      window.__presses = { click: 0, dblclick: 0, target: null };
      element.addEventListener('click', (event) => {
        window.__presses.click += 1;
        window.__presses.target = event.target.closest('[data-blit]:not([data-blit-root])').id;
      });
      element.addEventListener('dblclick', () => { window.__presses.dblclick += 1; });
    });

    await ctx.page.mouse.dblclick(box.x + box.width / 2, box.y + 10);
    await frames(ctx.page, 150);

    const presses = await ctx.page.evaluate(() => window.__presses);
    assert.equal(presses.dblclick, 1, 'the card never received a dblclick');
    assert.equal(presses.click, 2, `the card received ${presses.click} clicks`);
    assert.equal(presses.target, 'card_floating');
  });

  test('a card keeps following a drag that leaves the window', async () => {
    const box = await ctx.page.locator('#card_floating').boundingBox();
    const before = await boundsOf(ctx.page, 'card_floating');

    await ctx.page.mouse.move(box.x + box.width / 2, box.y + 10);
    await ctx.page.mouse.down();
    await ctx.page.mouse.move(box.x + box.width / 2 + 70, box.y + 50, { steps: 6 });
    await ctx.page.mouse.move(1400, 900, { steps: 4 });
    await frames(ctx.page, 120);
    const outside = await boundsOf(ctx.page, 'card_floating');
    await ctx.page.mouse.up();
    await frames(ctx.page, 120);

    const travelled = Math.hypot(outside.x - before.x, outside.y - before.y);
    assert.ok(travelled > 200, `the card stopped following at ${travelled}px of travel`);

    await ctx.page.evaluate((to) => window.cloudcanvas.find('card_floating').set(to), { x: before.x, y: before.y });
    await frames(ctx.page, 150);
  });

  test('a canvas pan takes the pointer stream at the drag threshold, not at the press', async () => {
    const captured = () => ctx.page.evaluate(() => window.cloudcanvas.el.hasPointerCapture(1));
    const start = await cameraOf(ctx.page);

    await ctx.page.mouse.move(1240, 770);
    await ctx.page.mouse.down();
    assert.equal(await captured(), false, 'the press took the pointer stream');

    // A click's worth of wobble is still a click.
    await ctx.page.mouse.move(1242, 770);
    assert.equal(await captured(), false, '2px of travel took the stream');

    // Past the threshold the host takes it, and gives it back on release.
    await ctx.page.mouse.move(1180, 730, { steps: 6 });
    assert.equal(await captured(), true, 'a real pan never captured the stream');
    await ctx.page.mouse.up();
    await frames(ctx.page, 120);
    assert.equal(await captured(), false, 'the host kept the stream after the pan');

    await setCamera(ctx.page, start);
    await frames(ctx.page, 120);
  });

  test('dragging empty canvas pans the camera', async () => {
    const before = await cameraOf(ctx.page);

    await ctx.page.mouse.move(1240, 770);
    await ctx.page.mouse.down();
    await ctx.page.mouse.move(1180, 730, { steps: 6 });
    await ctx.page.mouse.up();
    await frames(ctx.page, 150);

    const after = await cameraOf(ctx.page);
    assert.ok(Math.abs((after.x - before.x) + 60) < 4, `camera x moved ${after.x - before.x}`);
    assert.ok(Math.abs((after.y - before.y) + 40) < 4, `camera y moved ${after.y - before.y}`);

    await setCamera(ctx.page, before);
    await frames(ctx.page, 120);
  });
}

/* ------------------ WHEEL ------------------ */

/** Empty canvas, clear of every demo card and of the HUD. */
const EMPTY_CANVAS = { x: 1240, y: 770 };

function registerWheel(ctx) {
  test('a trackpad scroll burst pans and leaves the scale inside [0.9, 1.0]', async () => {
    await ctx.page.evaluate(() => { window.fixture.camera.setZoom(1); });
    await ctx.page.mouse.move(EMPTY_CANVAS.x, EMPTY_CANVAS.y);
    const before = await cameraOf(ctx.page);

    // Twelve small pixel-mode deltas: what a two-finger scroll actually emits.
    for (let i = 0; i < 12; i += 1) {
      await ctx.page.mouse.wheel(0, 4);
    }
    await frames(ctx.page, 200);

    const after = await cameraOf(ctx.page);
    assert.ok(after.scale >= 0.9 && after.scale <= 1.0, `a scroll burst drove the scale to ${after.scale}`);
    assert.ok(after.y < before.y, `the burst did not pan: y ${before.y} -> ${after.y}`);

    await setCamera(ctx.page, before);
  });

  test('a horizontal swipe pans the camera and never touches the scale', async () => {
    await ctx.page.mouse.move(EMPTY_CANVAS.x, EMPTY_CANVAS.y);
    const before = await cameraOf(ctx.page);

    await ctx.page.mouse.wheel(60, 0);
    await frames(ctx.page, 200);

    const after = await cameraOf(ctx.page);
    const moved = before.x - after.x;

    assert.equal(after.scale, before.scale, 'a horizontal swipe zoomed');
    assert.equal(after.y, before.y, 'a horizontal swipe moved the camera vertically');
    // Content follows the gesture, bounded by the per-event clamp.
    assert.ok(moved > 0 && moved <= 160, `horizontal pan of ${moved}px`);

    await setCamera(ctx.page, before);
  });
}

/* ------------------ DUPLICATE IDS ------------------ */

function registerDuplicateIds(ctx) {
  test('the duplicate-id assertion catches a blit id another element holds', async () => {
    assert.deepEqual(await duplicateBlitIds(ctx.page), []);

    await ctx.page.evaluate(() => {
      const chrome = document.createElement('nav');
      chrome.id = 'card_floating';
      document.body.appendChild(chrome);
    });
    assert.deepEqual(await duplicateBlitIds(ctx.page), ['card_floating']);
    await assert.rejects(assertUniqueBlitIds(ctx.page), /blit ids shared with other elements: card_floating/);

    await ctx.page.evaluate(() => document.querySelector('nav[id="card_floating"]').remove());
    await assertUniqueBlitIds(ctx.page);
  });
}
