/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Browser smoke suite, paint: what the dashboard board (`fixtures/dashboard.html`)
 * draws - the theme through tokens alone, scope wells sized to their children
 * and clipping them, connectors anchored edge to edge at every zoom, and badge
 * contrast where each badge is actually painted.
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
  cameraOf,
  frames,
  loadChromium,
  openHarness,
  openPage,
  setCamera,
  startStaticServer
} from './harness.js';
import { BADGE_SELECTOR, READ_CONTRAST, assertContrast } from './probes.js';

/** The plane-space `<svg>` the connect add-on draws into. */
const CONNECTOR_PATH = 'svg[data-blit-svg] g[data-trait="connectable"] path';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser paint suite', { skip: 'playwright is not installed' }, () => {});
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

  registerTheme(ctx);
  registerScopeWells(ctx);
  registerConnectorGeometry(ctx);
  registerBadgeContrast(ctx);

  test('no page errors were reported for the whole paint suite', () => {
    assert.deepEqual(ctx.errors, []);
  });
}

/* ------------------ THEMING ------------------ */

/** The computed values a theme must be able to move from outside the library. */
const READ_THEME = () => {
  const host = window.cloudcanvas.el;
  const card = document.getElementById('card_focused_child');
  return {
    hostBackground: getComputedStyle(host).backgroundColor,
    cardBackground: getComputedStyle(card).backgroundColor,
    titleColor: getComputedStyle(card.querySelector(`.${window.fixture.CLS.TITLE}`)).color,
    label: document.getElementById('btn-toggle-theme').textContent
  };
};

function registerTheme(ctx) {
  test('the theme toggle repaints the host and the card surface through tokens alone', async () => {
    const dark = await ctx.page.evaluate(READ_THEME);
    assert.equal(dark.label, 'Theme: Dark');

    await ctx.page.click('#btn-toggle-theme');
    await frames(ctx.page, 200);

    const light = await ctx.page.evaluate(READ_THEME);
    assert.equal(light.label, 'Theme: Light');
    assert.equal(light.hostBackground, 'rgb(244, 245, 247)', 'the host kept its dark background');
    assert.notEqual(light.cardBackground, dark.cardBackground, 'the card surface ignored the theme');
    assert.equal(light.titleColor, 'rgb(30, 41, 59)', 'card content ignored the theme');

    // Clearing the tokens is the same operation as returning to the default.
    await ctx.page.click('#btn-toggle-theme');
    await frames(ctx.page, 200);

    const restored = await ctx.page.evaluate(READ_THEME);
    assert.equal(restored.hostBackground, dark.hostBackground);
    assert.equal(restored.cardBackground, dark.cardBackground);
    assert.equal(restored.titleColor, dark.titleColor);
  });
}

/* ------------------ SCOPE WELLS ------------------ */

/**
 * The board's wells: the parent scope holds three children, the focused child
 * holds none. Only real layout can answer either question.
 */
const READ_WELLS = () => {
  const { CLS } = window.fixture;
  const wellOf = (id) => document.querySelector(`#${id} > [data-scope]`);
  const parentWell = wellOf('card_parent_scope');
  const childWell = wellOf('card_focused_child');
  const parentBox = parentWell.getBoundingClientRect();

  // Furthest bottom edge across the live children, in the well's own space.
  let extent = 0;
  for (const child of parentWell.querySelectorAll(':scope > [data-blit]')) {
    extent = Math.max(extent, child.getBoundingClientRect().bottom - parentBox.top);
  }

  const action = document.querySelector(`#card_focused_child .${CLS.ACTION_BTN}`);
  const actionBox = action.getBoundingClientRect();

  return {
    parentPopulated: parentWell.classList.contains('cc-populated'),
    parentHeight: parentBox.height,
    parentDisplay: getComputedStyle(parentWell).display,
    parentOverflow: getComputedStyle(parentWell).overflow,
    childPopulated: childWell.classList.contains('cc-populated'),
    childHeight: childWell.getBoundingClientRect().height,
    childDisplay: getComputedStyle(childWell).display,
    extent,
    actionText: action.textContent,
    // The button is the last thing in the card: if it clears the well's bottom
    // edge, the card is not escaping the frame it sits in.
    actionInsideWell: actionBox.bottom <= parentBox.bottom + 0.5 && actionBox.height > 0
  };
};

function registerScopeWells(ctx) {
  test('empty wells take no space, occupied ones grow to hold their children', async () => {
    await frames(ctx.page, 400);
    const wells = await ctx.page.evaluate(READ_WELLS);

    // A childless card still owns a scope container; it must cost nothing.
    assert.equal(wells.childPopulated, false, 'a childless well was marked populated');
    assert.equal(wells.childDisplay, 'none', 'a childless well was granted a box');
    assert.equal(wells.childHeight, 0, 'an empty well still takes up space');

    // The parent's well is a real frame, sized to its furthest child.
    assert.equal(wells.parentPopulated, true);
    assert.equal(wells.parentDisplay, 'block');
    assert.equal(wells.parentOverflow, 'hidden', 'the well does not clip its children');
    assert.ok(wells.parentHeight > 100, `the well collapsed to ${wells.parentHeight}px`);
    assert.ok(
      Math.abs(wells.parentHeight - wells.extent) <= 1.5,
      `the well is ${wells.parentHeight}px but its children reach ${wells.extent}px`
    );

    assert.equal(wells.actionText, 'Focus Me');
    assert.equal(wells.actionInsideWell, true, '"Focus Me" is escaping the scope well');
  });

  test('the focused child\'s action button is the thing under the pointer', async () => {
    // Siblings in a well are absolutely positioned and freely overlapping, so an
    // authored row that no longer clears the card above it paints straight over
    // its action button: visible, and completely unclickable.
    const selector = await ctx.page.evaluate(() => `#card_focused_child .${window.fixture.CLS.ACTION_BTN}`);
    const hit = await ctx.page.evaluate((query) => {
      const button = document.querySelector(query);
      const box = button.getBoundingClientRect();
      const point = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return {
        isButton: point === button,
        topmost: point ? (point.closest('[data-blit]:not([data-blit-root])') || {}).id || point.className : null
      };
    }, selector);
    assert.equal(hit.isButton, true, `"Focus Me" is occluded by ${hit.topmost}`);

    // ...and the click it can receive does what the page says it does.
    await ctx.page.click(selector);
    await frames(ctx.page, 900);

    const focused = await ctx.page.evaluate(() => ({
      id: document.querySelector('[data-blit].is-focused')?.id ?? null,
      scale: window.fixture.camera.scale
    }));
    assert.equal(focused.id, 'card_focused_child', 'clicking "Focus Me" focused nothing');
    assert.ok(focused.scale > 1, `the camera never zoomed in: ${focused.scale}`);

    await ctx.page.click('#btn-unfocus');
    await frames(ctx.page, 800);
  });

  test('a child that runs past the well is clipped by it', async () => {
    const clipped = await ctx.page.evaluate(async () => {
      const settle = () => new Promise((resolve) => setTimeout(resolve, 400));
      const parent = window.cloudcanvas.find('card_parent_scope');
      const well = document.querySelector('#card_parent_scope > [data-scope]');
      const before = well.getBoundingClientRect().height;

      // A child parked far below everything else: the well grows to hold it...
      const probe = parent.blit({ id: 'card_well_probe', type: 'card', x: 20, y: 2000, w: 120, h: 60, card: { title: 'Probe' } });
      await settle();
      const grown = well.getBoundingClientRect().height;

      // ...and one straddling its right edge is cut off by it there.
      probe.set({ x: well.getBoundingClientRect().width - 40, y: 20 });
      await settle();
      const box = well.getBoundingClientRect();
      const own = probe.el.getBoundingClientRect();
      const paintedAt = (x) => probe.el.contains(document.elementFromPoint(x, own.top + 10));
      const result = {
        before, grown,
        escapes: own.right > box.right + 1,
        overflow: getComputedStyle(well).overflow,
        paintedInside: paintedAt(box.right - 10),
        paintedOutside: paintedAt(box.right + 10)
      };
      probe.remove();
      return result;
    });

    assert.ok(clipped.grown > clipped.before + 1000, `the well did not grow: ${clipped.grown}`);
    // The child's *box* is still out there - clipping is paint, not layout - but
    // the well is what decides whether any of it is drawn.
    assert.equal(clipped.escapes, true);
    assert.equal(clipped.overflow, 'hidden', 'the escaping child is not clipped');
    assert.equal(clipped.paintedInside, true, 'the probe is not where it was put');
    assert.equal(clipped.paintedOutside, false, 'the escaping child is painted outside its well');
    await frames(ctx.page, 400);
  });
}

/* ------------------ CONNECTOR GEOMETRY ------------------ */

/**
 * Where the connector actually is on screen, against where the two blits it
 * joins actually are. Only a real browser can answer this: it needs the SVG CTM,
 * the plane's camera transform, and both measured boxes at once.
 *
 * *Both* ends are read: the target is a scope card whose well grows to hold its
 * children a frame or two after the first paint, so a stale far endpoint would
 * hide behind a check of the start alone.
 */
const READ_CONNECTOR = (selector) => {
  const path = document.querySelector(selector);
  if (!path) return null;

  const ctm = path.getScreenCTM();
  const start = path.getPointAtLength(0).matrixTransform(ctm);
  const end = path.getPointAtLength(path.getTotalLength()).matrixTransform(ctm);

  // Connectors route edge to edge: an endpoint belongs on its box's border.
  const offBy = (point, id) => {
    const box = document.getElementById(id).getBoundingClientRect();
    const inside = point.x >= box.left && point.x <= box.right && point.y >= box.top && point.y <= box.bottom;
    if (inside) return Math.min(point.x - box.left, box.right - point.x, point.y - box.top, box.bottom - point.y);
    return Math.hypot(Math.max(box.left - point.x, 0, point.x - box.right), Math.max(box.top - point.y, 0, point.y - box.bottom));
  };

  return {
    startOff: offBy(start, 'card_vector'),
    endOff: offBy(end, 'card_parent_scope'),
    vectorEffect: path.getAttribute('vector-effect')
  };
};

/** Assert both endpoints sit on the borders of the boxes they claim to join. */
function assertConnectorAnchored(connector, where) {
  assert.notEqual(connector, null, 'the connector was never drawn');
  assert.ok(connector.startOff <= 2, `${where}: the connector starts ${connector.startOff.toFixed(2)}px off its source border`);
  assert.ok(connector.endOff <= 2, `${where}: the connector ends ${connector.endOff.toFixed(2)}px off its target border`);
  assert.equal(connector.vectorEffect, 'non-scaling-stroke');
}

/** The vector card's connector, by the key the connect add-on reconciles it under. */
const VECTOR_CONNECTOR = `${CONNECTOR_PATH}[data-cc-key="card_vector->card_parent_scope"]`;

function registerConnectorGeometry(ctx) {
  test('a connector is anchored at both ends on first paint, with no camera move', async () => {
    // A page of its own: the shared one has been zoomed, panned and focused by
    // now, and any of those would have redrawn the layer for a different reason.
    const fresh = await openPage(ctx.browser, ctx.server.url);
    try {
      await frames(fresh.page, 1500);
      assert.deepEqual(await cameraOf(fresh.page), { x: 0, y: 0, scale: 1 }, 'the camera moved before the check');

      assertConnectorAnchored(await fresh.page.evaluate(READ_CONNECTOR, VECTOR_CONNECTOR), 'on first paint');

      // And it *stays* anchored once the camera does move.
      await fresh.page.evaluate(() => {
        window.fixture.camera.setZoom(1.6);
        window.fixture.camera.panBy(-90, 40);
      });
      await frames(fresh.page, 500);
      assertConnectorAnchored(await fresh.page.evaluate(READ_CONNECTOR, VECTOR_CONNECTOR), 'after zoom + pan');

      assert.deepEqual(fresh.errors, []);
    } finally {
      await fresh.page.close();
    }
  });

  test('a connector endpoint stays on its box border at 2x and after a pan', async () => {
    for (const view of [{ scale: 1, x: 0, y: 0 }, { scale: 2, x: -140, y: 90 }]) {
      await setCamera(ctx.page, view);
      await frames(ctx.page, 400);
      assertConnectorAnchored(await ctx.page.evaluate(READ_CONNECTOR, VECTOR_CONNECTOR), `at ${view.scale}x`);
    }

    await setCamera(ctx.page, { scale: 1, x: 0, y: 0 });
    await frames(ctx.page, 300);
  });
}

/* ------------------ BADGE CONTRAST ------------------ */

function registerBadgeContrast(ctx) {
  test('every badge on the page clears 4.5:1 where it is actually painted', async () => {
    assertContrast(await ctx.page.evaluate(READ_CONTRAST, BADGE_SELECTOR), 'the dark board');
  });
}
