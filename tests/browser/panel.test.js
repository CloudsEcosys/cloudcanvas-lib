/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The panel add-on in a real browser (`fixtures/panel.html`): what only layout, hit-testing and a real pointer
 * can settle. The layer covers its host and lets presses through to the board under it; pinned panels make the
 * room the board reads from the inset variables; the bar drags and snaps to each edge and away; every place
 * sizes through the resize add-on's grips; collapse, pin, full and back; a modal's focus, Escape and the presses
 * it takes; tabs; a host resize; the board's camera never moving a panel; reduced motion; and an idle
 * page asking for no frame.
 *
 * Run with `npm run test:browser`; skipped whole when Playwright is absent.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { PLAYWRIGHT_MISSING, frames, loadChromium, openFixturePage, startStaticServer } from './harness.js';

const PANEL_FIXTURE = '/tests/browser/fixtures/panel.html';
const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser panel suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

/* ------------------ PROBES ------------------ */

/** Frames enough for a write to land, then until no transition is running. */
async function settle(page) {
  await frames(page, 120);
  await page.waitForFunction(() => document.getAnimations().every((each) => each.playState !== 'running'), null, { timeout: 10000 });
}

const rectOf = (page, id) => page.evaluate((key) => {
  const el = document.getElementById(key);
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), hidden: el.hidden };
}, id);

/** A point on the bar clear of its buttons and tabs: just before the buttons. */
const barPoint = (page, id) => page.evaluate((key) => {
  const bar = document.getElementById(key).querySelector('.cloudcanvas-panel-bar');
  const r = bar.getBoundingClientRect();
  const buttons = bar.querySelector('.cloudcanvas-panel-controls').getBoundingClientRect();
  return { x: (buttons.width > 0 ? buttons.x : r.right) - 12, y: r.y + Math.min(14, r.height / 2) };
}, id);

const gripPoint = (page, id, side) => page.evaluate(({ key, direction }) => {
  const grip = document.getElementById(key).querySelector(`:scope > [data-cc-resize-handle="${direction}"]`);
  if (!grip) return null;
  const r = grip.getBoundingClientRect();
  const point = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  return { ...point, hittable: document.elementFromPoint(point.x, point.y) === grip };
}, { key: id, direction: side });

const options = (page, id) => page.evaluate((key) => window.fixture.panelOf(window.cloudcanvas.find(key)), id);
const write = (page, id, patch) => page.evaluate(({ key, value }) => { window.fixture.setPanel(window.cloudcanvas.find(key), value); }, { key: id, value: patch });
const control = (page, id, name) => page.locator(`#${id} .cloudcanvas-panel-control[data-cc-key="${name}"]`);
const previewShown = (page) => page.evaluate(() => {
  const preview = document.querySelector('.cloudcanvas-panel-preview');
  return Boolean(preview) && !preview.hidden;
});

async function drag(page, from, to) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();
  await settle(page);
}

/* ------------------ THE SUITE ------------------ */

function registerSuite(launcher) {
  const ctx = { server: null, browser: null, page: null, errors: [], initial: null };

  before(async () => {
    ctx.server = await startStaticServer();
    ctx.browser = await launcher.launch();
    const opened = await openFixturePage(ctx.browser, ctx.server.url, PANEL_FIXTURE);
    ctx.page = opened.page;
    ctx.errors = opened.errors;
    await ctx.page.waitForSelector('#sheet .cloudcanvas-panel-bar', { timeout: 10000 });
    await settle(ctx.page);
    ctx.initial = await ctx.page.evaluate(() => window.fixture.layer.snapshot());
  });

  after(async () => {
    if (ctx.browser) await ctx.browser.close();
    if (ctx.server) await ctx.server.close();
  });

  /** Every panel back to where the page began. */
  ctx.reset = async () => {
    await ctx.page.mouse.up();
    await ctx.page.evaluate((initial) => window.fixture.layer.apply(initial), ctx.initial);
    await settle(ctx.page);
  };
  /** A check that leaves the page as it began, passed or failed. */
  ctx.test = (name, body) => test(name, async () => {
    try {
      await body();
    } finally {
      await ctx.reset();
    }
  });

  registerLayer(ctx);
  registerDragAndSnap(ctx);
  registerResize(ctx);
  registerControls(ctx);
  registerDrawer(ctx);
  registerFull(ctx);
  registerModal(ctx);
  registerTabs(ctx);
  registerManyTabs(ctx);
  registerSelection(ctx);
  registerHost(ctx);

  test('no page errors were reported for the whole panel page', () => {
    assert.deepEqual(ctx.errors, []);
  });
}

function registerLayer(ctx) {
  test('the layer covers its host and lets presses through to the board; a panel takes its own', async () => {
    const { page } = ctx;
    const hits = await page.evaluate(() => {
      const card = document.getElementById('card-0').getBoundingClientRect();
      const at = (x, y) => document.elementFromPoint(x, y);
      return {
        card: at(card.x + 20, card.y + 20)?.id,
        sheet: at(1280 - 150, 400)?.closest('[data-panel]')?.id,
        layer: getComputedStyle(document.querySelector('[data-cc-panels]')).pointerEvents
      };
    });
    assert.equal(hits.card, 'card-0', 'a press over bare layer did not reach the board');
    assert.equal(hits.sheet, 'sheet');
    assert.equal(hits.layer, 'none');
    assert.deepEqual(await rectOf(page, 'sheet'), { x: 980, y: 0, w: 300, h: 800, hidden: false });
    assert.deepEqual(await rectOf(page, 'notes'), { x: 0, y: 0, w: 240, h: 800, hidden: false });
  });

  test('pinned panels make room: the board\'s box reads the inset variables', async () => {
    const board = await rectOf(ctx.page, 'board');
    assert.deepEqual([board.x, board.w], [240, 1280 - 240 - 300]);
  });

  test('a press in the body belongs to the content: typing and pressing there never moves the panel', async () => {
    const { page } = ctx;
    const before = await rectOf(page, 'tools');
    const input = await page.locator('#tool-name').boundingBox();
    await drag(page, { x: input.x + 10, y: input.y + 5 }, { x: input.x + 200, y: input.y + 150 });
    assert.deepEqual(await rectOf(page, 'tools'), before);
  });
}

function registerDragAndSnap(ctx) {
  ctx.test('dragging the bar moves a floating panel; drag:start and drag:end are announced and the box is kept', async () => {
    const { page } = ctx;
    const from = await barPoint(page, 'tools');
    await page.evaluate(() => { window.fixture.signals.length = 0; });
    await drag(page, from, { x: from.x + 100, y: from.y + 60 });
    const rect = await rectOf(page, 'tools');
    assert.deepEqual([rect.x, rect.y], [440, 320]);
    const types = await page.evaluate(() => window.fixture.signals.filter((each) => each.id === 'tools').map((each) => each.type));
    assert.deepEqual(types.filter((type) => type.startsWith('drag:')), ['drag:start', 'drag:end']);
    assert.deepEqual((await options(page, 'tools')).box, { x: 440, y: 320, w: 320, h: 220 });
  });

  for (const [edge, target] of [['left', { x: 6, y: 400 }], ['right', { x: 1274, y: 400 }], ['top', { x: 640, y: 6 }], ['bottom', { x: 640, y: 794 }]]) {
    ctx.test(`snap - near the ${edge} edge the preview shows the strip, releasing attaches, and a drag takes it away`, async () => {
      const { page } = ctx;
      const from = await barPoint(page, 'tools');
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(target.x, target.y, { steps: 12 });
      await frames(page, 100);
      assert.equal(await previewShown(page), true, 'no preview near the edge');
      const moving = await page.evaluate(() => getComputedStyle(document.getElementById('tools')).transitionDuration);
      assert.ok(moving.split(',').every((each) => parseFloat(each) === 0), `a transition runs under the gesture: ${moving}`);
      await page.mouse.up();
      await settle(page);
      assert.equal(await previewShown(page), false);
      const attached = await options(page, 'tools');
      assert.deepEqual([attached.at, attached.pinned, attached.active], [edge, true, true]);
      const away = await barPoint(page, 'tools');
      await drag(page, away, { x: 640, y: 380 });
      assert.equal((await options(page, 'tools')).at, 'float', `the drag did not take it off the ${edge} edge`);
    });
  }
}

function registerResize(ctx) {
  const cases = [
    ['tools', 'float', 'se', { x: 60, y: 40 }, (a, b) => [b.w - a.w, b.h - a.h], [60, 40]],
    ['sheet', 'right', 'w', { x: -60, y: 0 }, (a, b) => [b.w - a.w, b.x - a.x], [60, -60]],
    ['notes', 'left', 'e', { x: 40, y: 0 }, (a, b) => [b.w - a.w, b.x - a.x], [40, 0]],
    ['tools', 'top', 's', { x: 0, y: 50 }, (a, b) => [b.h - a.h, b.y - a.y], [50, 0]],
    ['tools', 'bottom', 'n', { x: 0, y: -50 }, (a, b) => [b.h - a.h, b.y - a.y], [50, -50]]
  ];
  for (const [id, at, side, by, measure, expected] of cases) {
    ctx.test(`resize - ${at}: the ${side} grip sizes it and resize:end stores it`, async () => {
      const { page } = ctx;
      if ((await options(page, id)).at !== at) await write(page, id, { at });
      await settle(page);
      const grip = await gripPoint(page, id, side);
      assert.ok(grip?.hittable, `the ${side} grip is not under the pointer where it is drawn`);
      const before = await rectOf(page, id);
      await drag(page, grip, { x: grip.x + by.x, y: grip.y + by.y });
      assert.deepEqual(measure(before, await rectOf(page, id)), expected);
    });
  }

  ctx.test('resize - only the inner side sizes an edge; collapsed, modal and full have no grips', async () => {
    const { page } = ctx;
    const sides = (key) => page.evaluate((id) => Array.from(document.getElementById(id).querySelectorAll(':scope > [data-cc-resize-handle]'), (h) => h.getAttribute('data-cc-resize-handle')), key);
    assert.deepEqual(await sides('sheet'), ['w']);
    for (const patch of [{ collapsed: true }, { at: 'modal', collapsed: false }, { at: 'full' }]) {
      await write(page, 'sheet', patch);
      assert.deepEqual(await sides('sheet'), [], JSON.stringify(patch));
    }
  });
}

function registerControls(ctx) {
  test('collapse folds an edge to its tab; pressing the tab unfolds it', async () => {
    const { page } = ctx;
    await control(page, 'sheet', 'collapse').click();
    await settle(page);
    assert.deepEqual(await rectOf(page, 'sheet'), { x: 1252, y: 0, w: 28, h: 800, hidden: false });
    assert.equal((await rectOf(page, 'board')).w, 1280 - 240 - 28);
    await page.mouse.click(1266, 400);
    await settle(page);
    assert.equal((await rectOf(page, 'sheet')).w, 300);
  });

  test('pin: unpinned, the edge is a drawer over the board; pinned again it takes its room back', async () => {
    const { page } = ctx;
    await control(page, 'sheet', 'pin').click();
    await settle(page);
    assert.equal((await rectOf(page, 'board')).w, 1280 - 240, 'a drawer took room');
    assert.equal((await rectOf(page, 'sheet')).x, 980, 'the drawer moved');
    await control(page, 'sheet', 'pin').click();
    await settle(page);
    assert.equal((await rectOf(page, 'board')).w, 1280 - 240 - 300);
  });

}

function registerDrawer(ctx) {
  ctx.test('a right drawer lies over the content only: a panel pinned to the bottom keeps its controls', async () => {
    const { page } = ctx;
    await write(page, 'tools', { at: 'bottom', size: 200 });
    await write(page, 'sheet', { pinned: false });
    await settle(page);
    const reachable = await page.evaluate(() => {
      const button = document.querySelector('#tools .cloudcanvas-panel-control[data-cc-key="collapse"]');
      const r = button.getBoundingClientRect();
      return button.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    });
    assert.equal(reachable, true, 'the drawer covers the bottom panel\'s controls');
    await control(page, 'tools', 'collapse').click({ timeout: 10000 });
    assert.equal((await options(page, 'tools')).collapsed, true);
    const drawer = await rectOf(page, 'sheet');
    assert.deepEqual([drawer.x, drawer.y, drawer.h], [980, 0, 600]);
  });
}

function registerFull(ctx) {
  test('full and back: the control, then a double press on the bar', async () => {
    const { page } = ctx;
    await control(page, 'sheet', 'full').click();
    await settle(page);
    assert.deepEqual(await rectOf(page, 'sheet'), { x: 0, y: 0, w: 1280, h: 800, hidden: false });
    await control(page, 'sheet', 'full').click();
    await settle(page);
    assert.equal((await rectOf(page, 'sheet')).x, 980);
    const bar = await barPoint(page, 'sheet');
    await page.mouse.dblclick(bar.x, bar.y);
    await settle(page);
    assert.equal((await options(page, 'sheet')).at, 'full');
    await page.mouse.dblclick(bar.x, 14);
    await settle(page);
    assert.equal((await options(page, 'sheet')).at, 'right');
  });
}

function registerModal(ctx) {
  ctx.test('modal: the focus moves in, Tab stays inside, Escape closes it and the focus returns', async () => {
    const { page } = ctx;
    await page.focus('#notes .cloudcanvas-panel-bar');
    await write(page, 'tools', { at: 'modal' });
    await settle(page);
    assert.equal(await page.evaluate(() => document.activeElement.closest('[data-panel]')?.id), 'tools');
    for (let step = 0; step < 9; step += 1) {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.closest('[data-panel]')?.id), 'tools', `Tab ${step} left the modal`);
    }
    await page.keyboard.press('Escape');
    await settle(page);
    assert.equal((await options(page, 'tools')).open, false);
    assert.equal(await page.evaluate(() => document.activeElement.closest('[data-panel]')?.id), 'notes');
  });

  ctx.test('modal: the layer takes every press outside it; the content beneath works again once it closes', async () => {
    const { page } = ctx;
    const hitAt = (point) => page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id ?? '', point);
    await write(page, 'tools', { at: 'modal' });
    await settle(page);
    const card = await rectOf(page, 'card-0');
    const point = { x: card.x + 30, y: card.y + 30 };
    assert.notEqual(await hitAt(point), 'card-0', 'the content beneath still takes presses');
    await drag(page, point, { x: point.x + 80, y: point.y + 40 });
    assert.deepEqual(await rectOf(page, 'card-0'), card, 'a drag on the content beneath moved it');
    assert.equal(await page.evaluate(() => document.activeElement.closest('[data-panel]')?.id), 'tools', 'a press outside took the focus');
    assert.equal((await options(page, 'tools')).open, true, 'a press outside closed the modal');
    await page.keyboard.press('Escape');
    await settle(page);
    assert.equal(await hitAt(point), 'card-0');
    await drag(page, point, { x: point.x + 20, y: point.y });
    assert.equal((await rectOf(page, 'card-0')).x, card.x + 20, 'the content beneath did not take presses back');
  });

}

function registerTabs(ctx) {
  ctx.test('tabs: a panel joining an edge shares its frame; pressing a tab switches', async () => {
    const { page } = ctx;
    await write(page, 'tools', { at: 'right' });
    await settle(page);
    const tabs = page.locator('#tools [role="tab"]');
    assert.deepEqual(await tabs.allTextContents(), ['Sheet', 'Tools']);
    assert.equal((await rectOf(page, 'sheet')).hidden, true);
    assert.equal((await rectOf(page, 'tools')).w, 300, 'the joining tab did not take the slot\'s size');
    await tabs.first().click();
    await settle(page);
    assert.equal((await rectOf(page, 'sheet')).hidden, false);
    assert.equal((await rectOf(page, 'tools')).hidden, true);
    await page.keyboard.press('ArrowRight');
    await settle(page);
    assert.equal((await rectOf(page, 'tools')).hidden, false, 'Right did not select the next tab');
  });
}

function registerManyTabs(ctx) {
  ctx.test('tabs: more than fit scroll sideways, the selected one stays in view, none narrower than eight characters', async () => {
    const { page } = ctx;
    const READ_STRIP = (id) => {
      const strip = document.querySelector(`#${id} [role="tablist"]`);
      const tabs = Array.from(strip.children);
      const box = strip.getBoundingClientRect();
      const selected = strip.querySelector('[aria-selected="true"]').getBoundingClientRect();
      const probe = document.createElement('span');
      probe.style.cssText = `position: absolute; visibility: hidden; white-space: nowrap; font: ${getComputedStyle(tabs[0]).font}`;
      document.body.appendChild(probe);
      const narrow = tabs.filter((tab) => {
        probe.textContent = tab.textContent.slice(0, 8);
        return tab.getBoundingClientRect().width < probe.getBoundingClientRect().width;
      }).length;
      probe.remove();
      return { count: tabs.length, scrolls: strip.scrollWidth > strip.clientWidth, left: strip.scrollLeft, inView: selected.left >= box.left - 1 && selected.right <= box.right + 1, narrow };
    };
    await page.evaluate(() => {
      for (let i = 0; i < 30; i += 1) window.fixture.layer.add(null, { id: `many-${i}`, at: 'right', title: `Panel number ${i}` });
    });
    try {
      await settle(page);
      const last = await page.evaluate(READ_STRIP, 'many-29');
      assert.equal(last.count, 31);
      assert.equal(last.scrolls, true, 'the strip does not scroll');
      assert.equal(last.inView, true, 'the selected tab is out of view');
      assert.ok(last.left > 0);
      assert.equal(last.narrow, 0, 'a tab is narrower than its first eight characters');
      await page.focus('#many-29 [role="tab"][aria-selected="true"]');
      await page.keyboard.press('ArrowRight');
      await settle(page);
      const first = await page.evaluate(READ_STRIP, 'sheet');
      assert.deepEqual([first.inView, first.left], [true, 0], 'wrapping to the first tab did not bring it into view');
    } finally {
      await page.evaluate(() => { for (let i = 0; i < 30; i += 1) window.cloudcanvas.find(`many-${i}`)?.remove(); });
    }
  });
}

function registerSelection(ctx) {
  test('a text selection over a panel never turns a press on a handle or the bar into the browser\'s own drag', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, PANEL_FIXTURE);
    const selectOver = (id) => page.evaluate((key) => {
      const range = document.createRange();
      range.selectNodeContents(document.getElementById(key));
      getSelection().removeAllRanges();
      getSelection().addRange(range);
    }, id);
    try {
      await page.waitForSelector('#tools .cloudcanvas-panel-bar', { timeout: 10000 });
      // A page without the board chunk, whose no-selection the layer would inherit: the panels' text selects.
      await page.addStyleTag({ content: '[data-blit-root][data-cc-panels] { user-select: auto; -webkit-user-select: auto; }' });
      await settle(page);
      await selectOver('tools');
      const corner = await gripPoint(page, 'tools', 'se');
      const box = await rectOf(page, 'tools');
      await drag(page, corner, { x: corner.x + 60, y: corner.y + 30 });
      const sized = await rectOf(page, 'tools');
      assert.deepEqual([sized.w - box.w, sized.h - box.h], [60, 30], 'a corner stopped after its first move');
      await selectOver('sheet');
      const side = await gripPoint(page, 'sheet', 'w');
      const strip = await rectOf(page, 'sheet');
      await drag(page, side, { x: side.x - 60, y: side.y });
      assert.equal((await rectOf(page, 'sheet')).w - strip.w, 60, 'an edge stopped after its first move');
      await selectOver('tools');
      const bar = await barPoint(page, 'tools');
      await drag(page, bar, { x: bar.x - 50, y: bar.y + 40 });
      const moved = await rectOf(page, 'tools');
      assert.deepEqual([moved.x - sized.x, moved.y - sized.y], [-50, 40], 'the bar stopped after its first move');
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

function registerHost(ctx) {
  test('the board\'s camera never moves a panel', async () => {
    const { page } = ctx;
    const before = await Promise.all(['sheet', 'tools'].map((id) => rectOf(page, id)));
    await page.evaluate(() => window.fixture.board.view(window.fixture.board.find('card-2')));
    await settle(page);
    assert.deepEqual(await Promise.all(['sheet', 'tools'].map((id) => rectOf(page, id))), before);
  });

  test('a host resize re-places every panel and rewrites the insets', async () => {
    const { page } = ctx;
    await page.setViewportSize({ width: 1000, height: 700 });
    await settle(page);
    assert.deepEqual(await rectOf(page, 'sheet'), { x: 700, y: 0, w: 300, h: 700, hidden: false });
    assert.equal((await rectOf(page, 'board')).w, 1000 - 540);
    await page.setViewportSize({ width: 1280, height: 800 });
    await settle(page);
    assert.equal((await rectOf(page, 'sheet')).x, 980);
  });

  test('movement between places is a transition, and an idle page asks for no frame', async () => {
    const { page } = ctx;
    const style = await page.evaluate(() => getComputedStyle(document.getElementById('sheet')).transitionProperty);
    assert.match(style, /transform/);
    const asked = await page.evaluate(() => new Promise((resolve) => {
      let count = 0;
      const real = window.requestAnimationFrame;
      window.requestAnimationFrame = (fn) => { count += 1; return real(fn); };
      setTimeout(() => { window.requestAnimationFrame = real; resolve(count); }, 600);
    }));
    assert.equal(asked, 0, 'an idle panel layer asked for frames');
  });

  test('reduced motion: no transition between places', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, PANEL_FIXTURE, { reducedMotion: 'reduce' });
    try {
      await page.waitForSelector('#sheet .cloudcanvas-panel-bar', { timeout: 10000 });
      const durations = await page.evaluate(() => getComputedStyle(document.getElementById('sheet')).transitionDuration);
      assert.ok(durations.split(',').every((each) => parseFloat(each) === 0), `transitions run under reduced motion: ${durations}`);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}
