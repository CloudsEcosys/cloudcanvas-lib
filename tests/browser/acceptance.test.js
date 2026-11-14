/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Acceptance suite: the UI-review probes, made permanent.
 *
 * The smoke suites are the running board end to end - boot, gestures, cursors,
 * wells, connectors, keyboard, ARIA - and `bare.test.js` the page with no CSS of
 * its own. This file is the rest of the original review's findings, each one a
 * check that can only be answered by a real browser *and* needs a page of its
 * own to answer:
 *
 *   - a two-finger pinch, synthesized through CDP (no page can fake a touch),
 *   - reduced motion, which is a browser emulation setting, for the camera and the CSS,
 *   - the focus frustum reaching from the parent card, not the viewport,
 *   - nine spawned cards that never land on each other (`place` add-on's `spot`),
 *   - real text selection inside a card carrying `selectableText`,
 *   - badge contrast under the light theme, swept across twelve tints, and
 *   - the focus reticle's caption, in both themes, over the dashboard and over
 *     the bare page, where the board's own chunk paints the canvas behind it.
 *
 * Run with `npm run test:browser`; fails without Playwright unless CLOUDCANVAS_BROWSER_OPTIONAL=1 (then skipped whole).
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  BARE_FIXTURE,
  PLAYWRIGHT_MISSING,
  cameraOf,
  frames,
  loadChromium,
  openFixturePage,
  openPage,
  startStaticServer
} from './harness.js';
import {
  BADGE_SELECTOR,
  READ_CONTRAST,
  RETICLE_LABEL_SELECTOR,
  assertContrast
} from './probes.js';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser acceptance suite', { skip: 'playwright is not installed' }, () => {});
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

  registerPinch(ctx);
  registerReducedMotion(ctx);
  registerFrustum(ctx);
  registerPlacement(ctx);
  registerSelectableText(ctx);
  registerLightThemeContrast(ctx);
  registerReticleContrast(ctx);
  registerBareReticleContrast(ctx);
}

/**
 * A fresh dashboard page with a settled camera, and its error log.
 *
 * Every check here takes its own page deliberately: they emulate touch or
 * reduced motion, spawn cards, or repaint the whole board in another theme, and
 * none of that should be visible to the next one.
 */
async function freshPage(ctx, pageOptions = {}) {
  const opened = await openPage(ctx.browser, ctx.server.url, pageOptions);
  await frames(opened.page, 600);
  await opened.page.evaluate(() => {
    window.fixture.camera.setZoom(1);
    window.fixture.camera.panTo(0, 0);
  });
  await frames(opened.page, 200);
  return opened;
}

/* ------------------ PINCH ------------------ */

function registerPinch(ctx) {
  test('a two-finger pinch zooms the camera', async () => {
    const { page, errors } = await freshPage(ctx, { hasTouch: true });
    try {
      const before = await cameraOf(page);

      // Only the browser can produce a real two-finger gesture; CDP is the one
      // way to ask for one. Everything downstream - the second finger being
      // non-primary, the pinch state, the midpoint anchoring - is exercised for
      // real, which no synthetic pointer event in a unit test can claim.
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.synthesizePinchGesture', { x: 640, y: 400, scaleFactor: 2, relativeSpeed: 800 });
      await frames(page, 400);

      const after = await cameraOf(page);
      assert.ok(after.scale > before.scale * 1.2, `a pinch-out left the scale at ${after.scale} (from ${before.scale})`);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  test('ctrl+wheel is a trackpad pinch, and it zooms about the pointer', async () => {
    const { page, errors } = await freshPage(ctx);
    try {
      // The point under the pointer is the fixed point of the zoom: whatever
      // canvas coordinate was there before is still there afterwards.
      const point = { x: 900, y: 300 };
      await page.mouse.move(point.x, point.y);
      const readAt = (at) => page.evaluate((client) => {
        const { app, camera: view } = window.fixture;
        return { scale: view.scale, canvas: view.screenToCanvas(client.x, client.y, app.el.getBoundingClientRect()) };
      }, at);
      const before = await readAt(point);

      await page.keyboard.down('Control');
      await page.mouse.wheel(0, -30);
      await page.keyboard.up('Control');
      await frames(page, 300);

      const after = await readAt(point);
      assert.ok(after.scale > before.scale, `ctrl+wheel did not zoom in: ${after.scale}`);
      assert.ok(
        Math.hypot(after.canvas.x - before.canvas.x, after.canvas.y - before.canvas.y) < 1,
        'the point under the pointer drifted during the zoom'
      );
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

/* ------------------ REDUCED MOTION ------------------ */

function registerReducedMotion(ctx) {
  test('prefers-reduced-motion turns a camera flight into a jump and stands the CSS transitions down', async () => {
    const { page, errors } = await freshPage(ctx, { reducedMotion: 'reduce' });
    try {
      // A 600ms flight, sampled after 80ms. Animated, it would be a fraction of
      // the way there; honoured, it is already finished.
      const state = await page.evaluate(async () => {
        const view = window.fixture.camera;
        let completed = false;
        view.animateTo(400, 250, 2, { duration: 600, onComplete: () => { completed = true; } });
        await new Promise((resolve) => setTimeout(resolve, 80));
        return {
          x: view.x, y: view.y, scale: view.scale, completed, animating: view.isAnimating,
          // The CSS half of the same promise, from the board's and the display widgets' media blocks.
          blitTransition: getComputedStyle(document.getElementById('card_focused_child')).transitionDuration,
          buttonTransition: getComputedStyle(document.querySelector('#card_focused_child button')).transitionDuration
        };
      });

      assert.deepEqual({ x: state.x, y: state.y, scale: state.scale }, { x: 400, y: 250, scale: 2 }, 'the camera animated instead of jumping');
      assert.equal(state.completed, true, 'onComplete never fired for the jump');
      assert.equal(state.animating, false);
      assert.equal(state.blitTransition, '0s', 'a blit still transitions');
      assert.equal(state.buttonTransition, '0s', 'the action button still transitions');

      // The history add-on's traversal and the keyboard's reveal go through the same choke point.
      const promoted = await page.evaluate(async () => {
        window.fixture.go(window.cloudcanvas, 'window_chat', { duration: 600 });
        await new Promise((resolve) => setTimeout(resolve, 80));
        return window.fixture.camera.isAnimating;
      });
      assert.equal(promoted, false, 'a promotion still flew under reduced motion');
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

/* ------------------ FRUSTUM ------------------ */

/**
 * The four frustum spikes, as the points they start from, in host-box pixels.
 *
 * The cursor layer is untransformed, so its user units are pixels from the
 * host's top-left corner - the same space the two `getBoundingClientRect`
 * readings below are converted into.
 */
const READ_FRUSTUM = () => {
  const group = document.querySelector(
    '[data-blit-overlay] g[data-cursor="cursor-focus"] .cloudcanvas-frustum-projection path'
  );
  if (!group) return null;

  const host = window.cloudcanvas.el.getBoundingClientRect();
  const corners = (element) => {
    const box = element.getBoundingClientRect();
    return [
      [box.left - host.left, box.top - host.top],
      [box.right - host.left, box.top - host.top],
      [box.right - host.left, box.bottom - host.top],
      [box.left - host.left, box.bottom - host.top]
    ];
  };

  // Each spike is `M base L tip L base Z`; the two bases straddle the corner by
  // half the stroke width, so their midpoint is the corner itself.
  const bases = [];
  for (const spike of (group.getAttribute('d') || '').split('Z')) {
    const numbers = spike.match(/-?\d+(?:\.\d+)?/g);
    if (!numbers || numbers.length < 6) continue;
    const point = numbers.map(Number);
    bases.push([(point[0] + point[4]) / 2, (point[1] + point[5]) / 2]);
  }

  return {
    bases,
    parent: corners(document.getElementById('card_parent_scope')),
    host: [[0, 0], [host.width, 0], [host.width, host.height], [0, host.height]]
  };
};

function registerFrustum(ctx) {
  test('the focus frustum reaches from the parent card, not from the viewport', async () => {
    const { page, errors } = await freshPage(ctx);
    try {
      await page.click('#btn-focus-child');
      await frames(page, 1000);

      const frustum = await page.evaluate(READ_FRUSTUM);
      assert.notEqual(frustum, null, 'the frustum was never drawn');
      assert.equal(frustum.bases.length, 4, `expected four spikes, saw ${frustum.bases.length}`);

      const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
      for (let index = 0; index < 4; index += 1) {
        const fromParent = distance(frustum.bases[index], frustum.parent[index]);
        const fromHost = distance(frustum.bases[index], frustum.host[index]);
        assert.ok(fromParent <= 4, `spike ${index} starts ${fromParent.toFixed(1)}px from its parent-card corner`);
        assert.ok(fromHost > fromParent, `spike ${index} is anchored to the viewport corner, the defect this replaced`);
      }
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

/* ------------------ PLACEMENT ------------------ */

function registerPlacement(ctx) {
  test('nine spawned cards never land on each other', async () => {
    const { page, errors } = await freshPage(ctx);
    try {
      for (let index = 0; index < 9; index += 1) {
        await page.click('#btn-add-card');
        await frames(page, 120);
      }
      await frames(page, 400);

      const overlaps = await page.evaluate(() => {
        const spawned = Array.from(document.querySelectorAll('[data-blit][id^="card_spawned_"]'), (element) => {
          const { x, y, w, h } = window.cloudcanvas.find(element.id).bounds;
          return { id: element.id, box: { minX: x, minY: y, maxX: x + w, maxY: y + h } };
        });

        const hits = [];
        for (let i = 0; i < spawned.length; i += 1) {
          for (let j = i + 1; j < spawned.length; j += 1) {
            const a = spawned[i].box;
            const b = spawned[j].box;
            const apart = a.maxX <= b.minX || b.maxX <= a.minX || a.maxY <= b.minY || b.maxY <= a.minY;
            if (!apart) hits.push(`${spawned[i].id} over ${spawned[j].id}`);
          }
        }
        return { count: spawned.length, hits };
      });

      assert.equal(overlaps.count, 9, `expected nine new cards, saw ${overlaps.count}`);
      assert.deepEqual(overlaps.hits, [], 'spot() put two cards on the same spot');
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

/* ------------------ SELECTABLE TEXT ------------------ */

function registerSelectableText(ctx) {
  test('a card carrying selectableText selects its text instead of moving', async () => {
    const { page, errors } = await freshPage(ctx);
    try {
      const { BODY, HEADER } = await page.evaluate(() => window.fixture.CLS);
      const position = () => page.evaluate(() => {
        const found = window.cloudcanvas.find('card_selectable_text');
        return { x: found.x, y: found.y };
      });
      const body = await page.locator(`#card_selectable_text .${BODY}`).boundingBox();
      const before = await position();

      // Press in the paragraph and sweep along its first line: a caret and a selection, not a drag. (Along a
      // line, not the box's middle: an even line count puts the middle on a boundary that is neither line.)
      const line = body.y + 10;
      await page.mouse.move(body.x + 8, line);
      await page.mouse.down();
      await page.mouse.move(body.x + body.width - 8, line, { steps: 10 });
      const dragging = await page.evaluate(() => document.getElementById('card_selectable_text').classList.contains('is-dragging'));
      await page.mouse.up();
      await frames(page, 200);

      const selected = await page.evaluate(() => String(window.getSelection()));
      assert.ok(selected.length > 0, 'no text was selected inside the card');
      assert.equal(dragging, false, 'a press in the text armed a drag');
      assert.deepEqual(await position(), before, 'the card moved while its text was selected');

      // ...and the header is still the handle it always was.
      const header = await page.locator(`#card_selectable_text .${HEADER}`).boundingBox();
      await page.mouse.move(header.x + header.width / 2, header.y + header.height / 2);
      await page.mouse.down();
      await page.mouse.move(header.x + header.width / 2 + 70, header.y + header.height / 2 + 40, { steps: 8 });
      await page.mouse.up();
      await frames(page, 200);

      const dragged = await position();
      assert.ok(Math.abs((dragged.x - before.x) - 70) < 4, `x moved ${dragged.x - before.x}`);
      assert.ok(Math.abs((dragged.y - before.y) - 40) < 4, `y moved ${dragged.y - before.y}`);

      // A card that never opted in still drags from its body.
      const plain = await page.locator(`#card_floating .${BODY}`).boundingBox();
      const floatBefore = await page.evaluate(() => window.cloudcanvas.find('card_floating').x);
      await page.mouse.move(plain.x + plain.width / 2, plain.y + plain.height / 2);
      await page.mouse.down();
      await page.mouse.move(plain.x + plain.width / 2 + 50, plain.y + plain.height / 2, { steps: 6 });
      await page.mouse.up();
      await frames(page, 200);

      const floatAfter = await page.evaluate(() => window.cloudcanvas.find('card_floating').x);
      assert.ok(Math.abs((floatAfter - floatBefore) - 50) < 4, 'an ordinary card stopped dragging');
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

/* ------------------ LIGHT-THEME CONTRAST ------------------ */

/** A tint sweep: the demo palette, the extremes, and the mid-luminance band. */
const CONTRAST_TINTS = [
  '#38bdf8', '#a855f7', '#f43f5e', '#eab308', '#22d3ee', '#34d399',
  '#ec4899', '#10b981', '#f59e0b', '#000000', '#ffffff', '#808080'
];

/** One card of probe badges on the board, on the real card surface. */
const ADD_BADGE_PROBES = async (tints) => {
  const { createBadgeSVG } = await import('cloudcanvas/primitives');
  window.cloudcanvas.blit({
    id: 'badge_probe_card', type: 'card', x: 40, y: 40, w: 520,
    card: { html: tints.map((tint) => createBadgeSVG(tint, tint)).join('') }
  });
  return document.querySelectorAll('#badge_probe_card .cloudcanvas-primitive-badge').length;
};

function registerLightThemeContrast(ctx) {
  test('every badge clears 4.5:1 under the light theme as well as the dark one', async () => {
    const { page, errors } = await freshPage(ctx);
    try {
      const probes = await page.evaluate(ADD_BADGE_PROBES, CONTRAST_TINTS);
      assert.equal(probes, CONTRAST_TINTS.length, 'the probe badges never rendered');
      await frames(page, 200);

      // The dark default first, so the sweep is known good before the theme
      // moves the surface out from under it.
      assertContrast(await page.evaluate(READ_CONTRAST, BADGE_SELECTOR), 'the dark theme', 12);

      await page.click('#btn-toggle-theme');
      await frames(page, 300);
      assert.equal(await page.textContent('#btn-toggle-theme'), 'Theme: Light');

      // The generator writes a colour computed for a *dark* card inline, where a
      // host-level token cannot reach it unless the override token is honoured.
      assertContrast(await page.evaluate(READ_CONTRAST, BADGE_SELECTOR), 'the light theme', 12);

      await page.click('#btn-toggle-theme');
      await frames(page, 200);
      assertContrast(await page.evaluate(READ_CONTRAST, BADGE_SELECTOR), 'back on the dark theme', 12);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

/* ------------------ RETICLE CAPTION CONTRAST ------------------ */

/** A reticle caption to measure: the cursors trait's `cursor-focus` label option. */
const CAPTIONED = Object.freeze({ 'cursor-focus': { label: 'Parent Scope Frame', showFrustum: false } });

function registerReticleContrast(ctx) {
  test('the focus reticle caption clears 4.5:1 over the board in both themes', async () => {
    const { page, errors } = await freshPage(ctx);
    try {
      await page.evaluate((cursors) => {
        window.cloudcanvas.set({ cursors });
        window.fixture.focus('card_parent_scope');
      }, CAPTIONED);
      await frames(page, 800);

      const caption = page.locator(RETICLE_LABEL_SELECTOR).first();
      assert.equal(await caption.count(), 1, 'the reticle drew no caption to measure');
      assert.equal((await caption.textContent()).trim(), 'Parent Scope Frame');

      // The caption must not inherit the reticle stroke: #833446 on the dark
      // canvas measured 2.29:1, a fail at every text size.
      assertContrast(await page.evaluate(READ_CONTRAST, RETICLE_LABEL_SELECTOR), 'the reticle caption on the dark board', 1);

      await page.click('#btn-toggle-theme');
      await frames(page, 300);
      assertContrast(await page.evaluate(READ_CONTRAST, RETICLE_LABEL_SELECTOR), 'the reticle caption on the light board', 1);

      // Clearing the tokens is the same operation as returning to the default.
      await page.click('#btn-toggle-theme');
      await frames(page, 300);
      assertContrast(await page.evaluate(READ_CONTRAST, RETICLE_LABEL_SELECTOR), 'the reticle caption back on the dark board', 1);

      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

/**
 * The same caption on the bare page, which has no CSS of its own: what it is
 * measured against is the canvas the board's chunk paints, and nothing a
 * consumer stylesheet contributed. A root blit draws no frustum, so the caption
 * sits over that canvas alone.
 */
function registerBareReticleContrast(ctx) {
  test('the focus reticle caption clears 4.5:1 on the bare page in both themes', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, BARE_FIXTURE);
    try {
      await page.waitForSelector('#bare_card');
      await frames(page, 300);
      await page.evaluate(() => window.fixture.focus('bare_scope'));
      await frames(page, 400);

      const caption = page.locator(RETICLE_LABEL_SELECTOR).first();
      assert.equal(await caption.count(), 1, 'the reticle drew no caption to measure');
      assert.equal((await caption.textContent()).trim(), 'Bare Scope');
      assertContrast(await page.evaluate(READ_CONTRAST, RETICLE_LABEL_SELECTOR), 'the reticle caption on the dark bare page', 1);

      await page.evaluate(() => window.fixture.theme(true));
      await frames(page, 300);
      assertContrast(await page.evaluate(READ_CONTRAST, RETICLE_LABEL_SELECTOR), 'the reticle caption on the light bare page', 1);

      // Clearing the tokens is the same operation as returning to the default.
      await page.evaluate(() => window.fixture.theme(false));
      await frames(page, 300);
      assertContrast(await page.evaluate(READ_CONTRAST, RETICLE_LABEL_SELECTOR), 'the reticle caption back on the dark bare page', 1);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}
