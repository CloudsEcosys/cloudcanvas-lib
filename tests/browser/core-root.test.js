/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The root add-ons on a core `blit('#app')` in a real browser, no bridge: a
 * real drag on bare canvas pans what Chromium draws, a real wheel notch zooms,
 * Tab / Enter / arrows rove the cards and Enter emits `action`, and a real
 * right-click opens the root's own menu on a card, whose command runs. On a
 * tilted board a real drag and wheel keep the grabbed point under the cursor
 * and a resized host re-centres the tilt; a flat one keeps the author's own
 * host perspective.
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

const FIXTURE = '/tests/browser/fixtures/core-root.html';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser core root suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

/** Where Chromium draws a card. */
function boxOf(page, id) {
  return page.evaluate((cardId) => {
    const rect = document.getElementById(cardId).getBoundingClientRect();
    return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
  }, id);
}

/** Where Chromium draws card `first`, the box around its four projected corners, and what a hit at its middle finds. */
function tiltedCard(page) {
  return page.evaluate(() => {
    const { project } = window.__root;
    const rect = document.getElementById('first').getBoundingClientRect();
    const corners = [[100, 100], [300, 100], [100, 200], [300, 200]].map(([x, y]) => project(x, y));
    const xs = corners.map((c) => c.x);
    const ys = corners.map((c) => c.y);
    const middle = project(200, 150);
    return {
      drawn: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
      expected: { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) },
      hit: document.elementFromPoint(middle.x, middle.y)?.id
    };
  });
}

/** Every side of the drawn box within a pixel of the projected one. */
function assertDrawnWhereProjected({ drawn, expected }) {
  for (const side of Object.keys(expected)) {
    assert.ok(Math.abs(drawn[side] - expected[side]) < 1, `${side}: drawn ${drawn[side]}, projected ${expected[side]}`);
  }
}

/** A real drag with the main button, in steps. */
async function drag(page, from, to) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 6 });
  await page.mouse.up();
}

/** How far a canvas point lands from a page point, through the camera and the host's live box. */
async function missBy(page, point, target) {
  const at = await page.evaluate(([x, y]) => window.__root.project(x, y), [point.x, point.y]);
  return Math.hypot(at.x - target.x, at.y - target.y);
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

  test('core root - a real drag on bare canvas pans what Chromium draws; a wheel notch zooms', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, FIXTURE);
    await frames(page, 100);

    await page.mouse.move(900, 600);
    await page.mouse.down();
    await page.mouse.move(960, 640, { steps: 6 });
    await page.mouse.up();
    await frames(page, 100);
    assert.deepEqual(await page.evaluate(() => window.__root.camera()), { x: 60, y: 40, scale: 1 });
    assert.deepEqual(await boxOf(page, 'first'), { x: 160, y: 140, w: 200, h: 100 });

    await page.mouse.move(900, 600);
    await page.mouse.wheel(0, -120);
    await frames(page, 100);
    const zoomed = await page.evaluate(() => window.__root.camera());
    assert.ok(zoomed.scale > 1.1, `a wheel notch did not zoom in (scale ${zoomed.scale})`);
    assert.deepEqual(errors, []);
    await page.close();
  });

  test('core root - a tilted camera draws a card where camera.project says, and hit-testing finds it there', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, FIXTURE);
    await frames(page, 100);
    await page.evaluate(() => window.__root.tilt({ perspective: 900, rotateX: 25, rotateY: -30 }));
    await frames(page, 100);

    const card = await tiltedCard(page);
    assertDrawnWhereProjected(card);
    assert.equal(card.hit, 'first');
    assert.match(await page.evaluate(() => document.querySelector('[data-blit-plane]').style.transform), /^matrix3d\(/);
    assert.deepEqual(errors, []);
    await page.close();
  });

  test('core root - a resized host re-centres a tilted board: the card is drawn and hit where the live box projects it', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, FIXTURE);
    await frames(page, 100);
    await page.evaluate(() => window.__root.tilt({ perspective: 900, rotateX: 35, rotateY: -20 }));
    await frames(page, 100);
    await page.evaluate(() => window.__root.resize(600, 500));
    await frames(page, 150);

    const card = await tiltedCard(page);
    assertDrawnWhereProjected(card);
    assert.equal(card.hit, 'first');
    assert.equal(await page.evaluate(() => window.__root.root.hostRect.width), 600, 'the root kept the old host box');
    assert.deepEqual(errors, []);
    await page.close();
  });

  test('core root - on a tilted board a real drag and a real wheel notch keep the grabbed point under the cursor', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, FIXTURE);
    await frames(page, 100);
    await page.evaluate(() => window.__root.tilt({ perspective: 900, rotateX: 40, rotateY: -20 }));
    await frames(page, 100);

    const [from, to] = [{ x: 640, y: 560 }, { x: 700, y: 620 }];
    assert.equal(await page.evaluate(([x, y]) => Boolean(document.elementFromPoint(x, y).closest('.card')), [from.x, from.y]), false);
    const grabbed = await page.evaluate(([x, y]) => window.__root.unproject(x, y), [from.x, from.y]);
    await drag(page, from, to);
    await frames(page, 100);
    assert.ok(await missBy(page, grabbed, to) < 1, 'the grabbed point left the cursor');
    assertDrawnWhereProjected(await tiltedCard(page));

    const cursor = { x: 900, y: 400 };
    const under = await page.evaluate(([x, y]) => window.__root.unproject(x, y), [cursor.x, cursor.y]);
    await page.mouse.move(cursor.x, cursor.y);
    await page.mouse.wheel(0, -120);
    await frames(page, 100);
    assert.ok((await page.evaluate(() => window.__root.camera().scale)) > 1.1, 'the notch did not zoom');
    assert.ok(await missBy(page, under, cursor) < 1, 'the zoom drifted off the cursor');
    assertDrawnWhereProjected(await tiltedCard(page));
    assert.deepEqual(errors, []);
    await page.close();
  });

  test('core root - a flat root keeps the author\'s own host perspective through a real pan', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, FIXTURE);
    await frames(page, 100);
    await page.evaluate(() => { document.getElementById('app').style.perspective = '800px'; });
    await drag(page, { x: 900, y: 600 }, { x: 960, y: 640 });
    await frames(page, 100);
    assert.deepEqual(await page.evaluate(() => window.__root.camera()), { x: 60, y: 40, scale: 1 });
    assert.equal(await page.evaluate(() => document.getElementById('app').style.perspective), '800px');
    assert.deepEqual(errors, []);
    await page.close();
  });

  test('core root - Tab, Enter and arrows rove the cards; Enter on a card emits action', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, FIXTURE);
    await frames(page, 100);

    await page.keyboard.press('Tab');
    const host = await page.evaluate(() => ({
      focused: document.activeElement.id,
      role: document.activeElement.getAttribute('role'),
      label: document.activeElement.getAttribute('aria-label')
    }));
    assert.deepEqual(host, { focused: 'app', role: 'application', label: 'Fixture board' });

    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'first');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'second');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'app');
    assert.deepEqual(await page.evaluate(() => window.__root.actions), ['second:Enter']);
    assert.deepEqual(errors, []);
    await page.close();
  });

  test('core root - a real right-click on a card opens the root menu; its command runs', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, FIXTURE);
    await frames(page, 100);

    await page.mouse.click(200, 150, { button: 'right' });
    const items = await page.evaluate(() => Array.from(
      document.querySelectorAll('.cloudcanvas-context-menu:not([hidden]) .cloudcanvas-context-menu-item'),
      (each) => each.textContent
    ));
    assert.deepEqual(items, ['Rename', 'Home']);

    await page.click('text=Rename');
    await frames(page, 50);
    assert.deepEqual(await page.evaluate(() => window.__root.ran), ['rename:first']);
    assert.equal(await page.evaluate(() => document.querySelector('.cloudcanvas-context-menu').hidden), true);
    assert.deepEqual(await page.evaluate(() => window.__root.camera()), { x: 0, y: 0, scale: 1 }, 'the right-click panned');
    assert.deepEqual(errors, []);
    await page.close();
  });
}
