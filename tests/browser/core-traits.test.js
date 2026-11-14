/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Native add-on traits on a core `blit('#app')` in a real browser, no bridge:
 * a real mouse drags a card to where Chromium then draws it, a press selects
 * it (and deselects the other), and a press on its south-east handle resizes
 * the rendered box by the pointer's travel.
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

const FIXTURE = '/tests/browser/fixtures/core-traits.html';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser core traits suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

/** The rendered box of a card, and what its handle says. */
function cardState(page, id) {
  return page.evaluate((cardId) => {
    const card = window.__traits[cardId];
    const rect = card.el.getBoundingClientRect();
    return {
      box: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
      at: { x: card.x, y: card.y },
      selected: card.el.classList.contains('is-selected'),
      handleShown: !card.el.querySelector('[data-cc-resize-handle="se"]').hidden
    };
  }, id);
}

/** Press at a point, travel in steps, release. */
async function gesture(page, from, to) {
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
    ctx.browser = await launcher.launch();
  });

  after(async () => {
    if (ctx.browser) await ctx.browser.close();
    if (ctx.server) await ctx.server.close();
  });

  test('core traits - a real drag moves the card where Chromium draws it, and selects it', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, FIXTURE);
    await frames(page, 100);

    await gesture(page, { x: 200, y: 150 }, { x: 260, y: 190 });
    const state = await cardState(page, 'first');
    assert.deepEqual(state.at, { x: 160, y: 140 });
    assert.deepEqual(state.box, { x: 160, y: 140, w: 200, h: 100 });
    assert.equal(state.selected, true);
    assert.equal(state.handleShown, true, 'the handles did not show with the selection');

    const types = await page.evaluate(() => window.__traits.signals.map((each) => `${each.type}:${each.id}`));
    assert.deepEqual(types, ['select:first', 'drag:start:first', 'drag:end:first']);
    assert.deepEqual(errors, []);
    await page.close();
  });

  test('core traits - a press on another card moves the selection', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, FIXTURE);
    await frames(page, 100);

    await gesture(page, { x: 200, y: 150 }, { x: 201, y: 150 });
    await gesture(page, { x: 600, y: 150 }, { x: 600, y: 151 });
    const [first, second] = [await cardState(page, 'first'), await cardState(page, 'second')];
    assert.equal(first.selected, false);
    assert.equal(first.handleShown, false);
    assert.equal(second.selected, true);
    assert.deepEqual(second.at, { x: 500, y: 100 }, 'a click moved the card');
    assert.deepEqual(errors, []);
    await page.close();
  });

  test('core traits - the south-east handle resizes the rendered box by the pointer travel', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, FIXTURE);
    await frames(page, 100);

    await gesture(page, { x: 200, y: 150 }, { x: 200, y: 150 });
    await gesture(page, { x: 300, y: 200 }, { x: 350, y: 230 });
    const state = await cardState(page, 'first');
    assert.deepEqual(state.box, { x: 100, y: 100, w: 250, h: 130 });
    assert.deepEqual(state.at, { x: 100, y: 100 }, 'the drag moved the card from the handle');

    const ends = await page.evaluate(() => window.__traits.signals.filter((each) => each.type === 'resize:end'));
    assert.deepEqual(ends.map((each) => each.payload), [{ width: 250, height: 130, cancelled: false }]);
    assert.deepEqual(errors, []);
    await page.close();
  });
}
