/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The gap add-ons on a core `blit('#app')` in a real browser, no bridge: a row
 * container lays its children out by flex with no transform and their bounds
 * follow the flex, a free container's
 * well grows to its children's extent, a style map reaches the computed style, a
 * real click into an editor opens the edit lock, and history promotes a blit and
 * brings the whole root back.
 *
 * Run with `npm run test:browser`; fails without Playwright unless CLOUDCANVAS_BROWSER_OPTIONAL=1 (then every test skips).
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

const FIXTURE = '/tests/browser/fixtures/core-addons.html';

const chromium = await loadChromium();
const ctx = { server: null, browser: null };

/** Every test skips when Playwright is absent and CLOUDCANVAS_BROWSER_OPTIONAL=1 (otherwise loadChromium throws). */
const SUITE = chromium ? {} : { skip: 'playwright is not installed' };

if (!chromium) console.warn(PLAYWRIGHT_MISSING);

before(async () => {
  if (!chromium) return;
  ctx.server = await startStaticServer();
  ctx.browser = await chromium.launch();
});

after(async () => {
  if (ctx.browser) await ctx.browser.close();
  if (ctx.server) await ctx.server.close();
});

async function open() {
  const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, FIXTURE);
  await frames(page, 100);
  return { page, errors };
}

test('core add-ons - a row lays its chips out by flex, with the gap and no transform', SUITE, async () => {
  const { page, errors } = await open();
  const chips = await page.evaluate(() => window.__addons.chips.map((chip) => {
    const rect = chip.el.getBoundingClientRect();
    return { x: rect.x, y: rect.y, w: rect.width, transform: chip.el.style.transform };
  }));
  assert.deepEqual(chips, [
    { x: 100, y: 100, w: 80, transform: '' },
    { x: 190, y: 100, w: 80, transform: '' },
    { x: 280, y: 100, w: 80, transform: '' }
  ]);
  // bounds report where flex put each chip (host-relative), while the author's x/y stay in the spec.
  const placed = await page.evaluate(() => {
    const host = window.__addons.app.el.getBoundingClientRect();
    return window.__addons.chips.map((chip) => {
      const rect = chip.el.getBoundingClientRect();
      return { dx: chip.bounds.x - (rect.x - host.x), dy: chip.bounds.y - (rect.y - host.y), specX: chip.spec.x };
    });
  });
  assert.deepEqual(placed, [0, 1, 2].map((index) => ({ dx: 0, dy: 0, specX: 300 + index })));
  assert.deepEqual(errors, []);
  await page.close();
});

test('core add-ons - a free container grows to its children\'s extent', SUITE, async () => {
  const { page } = await open();
  const box = await page.evaluate(() => {
    const { free } = window.__addons;
    const scope = free.el.querySelector('[data-scope]');
    return { minHeight: scope.style.minHeight, height: free.el.getBoundingClientRect().height, populated: scope.classList.contains('cc-populated') };
  });
  assert.deepEqual(box, { minHeight: '140px', height: 140, populated: true });
  await page.close();
});

test('core add-ons - a style map reaches the computed style, and leaves with the trait', SUITE, async () => {
  const { page } = await open();
  const styled = await page.evaluate(() => {
    const { card } = window.__addons;
    const read = () => getComputedStyle(card.el).borderTopLeftRadius;
    const before = read();
    card.set({ style: false });
    return { before, after: read() };
  });
  assert.deepEqual(styled, { before: '14px', after: '0px' });
  await page.close();
});

test('core add-ons - a real click into the editor opens the lock; clicking away closes it', SUITE, async () => {
  const { page } = await open();
  const editing = () => page.evaluate(() => window.__addons.card.el.hasAttribute('data-editing'));
  await page.click('#editor');
  assert.equal(await editing(), true);
  await page.mouse.click(20, 580);
  assert.equal(await editing(), false);
  await page.close();
});

test('core add-ons - history promotes the row, hides the rest, and Back brings the root back', SUITE, async () => {
  const { page } = await open();
  const view = () => page.evaluate(() => {
    const { app, free, card } = window.__addons;
    return {
      root: app.root === app ? 'app' : 'row',
      hidden: [free, card].map((b) => getComputedStyle(b.el).display === 'none'),
      scale: Number(app.el.querySelector('[data-blit-plane]').style.transform.match(/scale\(([\d.]+)\)/)?.[1] ?? 1)
    };
  });
  await page.evaluate(() => window.__addons.go(window.__addons.app, window.__addons.row));
  await frames(page, 100);
  const promoted = await view();
  assert.equal(promoted.root, 'row');
  assert.deepEqual(promoted.hidden, [true, true]);
  assert.ok(promoted.scale > 1, 'the camera did not frame the row');

  await page.evaluate(() => window.__addons.back(window.__addons.app));
  await frames(page, 100);
  assert.deepEqual(await view(), { root: 'app', hidden: [false, false], scale: 1 });
  assert.deepEqual(await page.evaluate(() => window.__addons.views), ['row', 'app']);
  await page.close();
});
