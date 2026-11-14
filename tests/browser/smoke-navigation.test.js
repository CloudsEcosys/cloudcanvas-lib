/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Browser smoke suite, navigation: the dashboard board (`fixtures/dashboard.html`)
 * framed, promoted and driven - focus and Back, Fit Overview, promotion and the
 * breadcrumb, the cursors (reskin and visibility), the lazy provider, the
 * keyboard alone, and what an assistive technology reads.
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
  setCamera,
  startStaticServer
} from './harness.js';

/** The token read the built-in focus reticle interpolates into its stroke. */
const FOCUS_STROKE = 'var(--cc-cursor-focus, var(--cc-focus, #833446))';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser navigation suite', { skip: 'playwright is not installed' }, () => {});
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

  registerNavigation(ctx);
  registerCursorSkin(ctx);
  registerProvider(ctx);
  registerCursorGating(ctx);
  registerKeyboard(ctx);
  registerAria(ctx);

  test('no page errors were reported for the whole navigation suite', () => {
    assert.deepEqual(ctx.errors, []);
  });
}

/* ------------------ NAVIGATION ------------------ */

function registerNavigation(ctx) {
  test('focus frames the child, draws the reticle, and Back releases it', async () => {
    await ctx.page.click('#btn-focus-child');
    await frames(ctx.page, 800);

    const focused = await ctx.page.evaluate(() => ({
      id: document.querySelector('[data-blit].is-focused')?.id ?? null,
      scale: window.fixture.camera.scale,
      reticleNodes: document.querySelectorAll('[data-blit-overlay] g[data-cursor="cursor-focus"] *').length
    }));

    assert.equal(focused.id, 'card_focused_child');
    assert.ok(focused.scale > 1, `expected a zoom-in, scale is ${focused.scale}`);
    assert.ok(focused.reticleNodes > 0, 'the focus reticle was never drawn');

    await ctx.page.click('#btn-unfocus');
    await frames(ctx.page, 700);

    const released = await ctx.page.evaluate(() => ({
      id: document.querySelector('[data-blit].is-focused')?.id ?? null,
      reticle: document.querySelector('[data-blit-overlay] g[data-cursor="cursor-focus"]')?.getAttribute('display') ?? 'none',
      scale: window.fixture.camera.scale
    }));
    assert.equal(released.id, null);
    assert.equal(released.reticle, 'none', 'the reticle outlived the focus');
    assert.equal(released.scale, 1, 'Back left the camera zoomed in');
  });

  test('the Fit Overview button frames every top-level window, and throws nothing', async () => {
    const original = await cameraOf(ctx.page);

    // A camera nothing is visible from, so "reframed" means something.
    await setCamera(ctx.page, { scale: 2.4, x: -3000, y: -2000 });
    await frames(ctx.page, 200);

    const before = await cameraOf(ctx.page);
    const errorsBefore = ctx.errors.length;

    // The HUD's own handler, driven as a user drives it: the wrong call shape
    // here is a TypeError inside a click listener, which nothing else catches.
    await ctx.page.click('#btn-reset');
    await frames(ctx.page, 1200);

    const after = await cameraOf(ctx.page);
    assert.equal(ctx.errors.length, errorsBefore, `Fit Overview raised ${ctx.errors.slice(errorsBefore)}`);
    assert.ok(Number.isFinite(after.x) && Number.isFinite(after.y), 'the camera left the plane');
    assert.notDeepEqual(after, before, 'the button reframed nothing');

    // Every top-level window inside the host box is the claim the button makes.
    const offscreen = await ctx.page.evaluate(() => {
      const { app, camera: view } = window.fixture;
      const host = app.el.getBoundingClientRect();
      const missed = [];
      for (const b of app.blits) {
        const { x, y, w, h } = b.bounds;
        const topLeft = view.canvasToScreen(x, y, host);
        const bottomRight = view.canvasToScreen(x + w, y + h, host);
        const inside = topLeft.x >= host.left - 0.5 && topLeft.y >= host.top - 0.5
          && bottomRight.x <= host.right + 0.5 && bottomRight.y <= host.bottom + 0.5;
        if (!inside) missed.push(b.el.id);
      }
      return missed;
    });
    assert.deepEqual(offscreen, [], 'a top-level window was left outside the frame');

    await setCamera(ctx.page, original);
    await frames(ctx.page, 200);
  });

  test('promoting a blit hides the other branches, exposes a breadcrumb, and Back restores', async () => {
    await ctx.page.evaluate(() => window.fixture.go(window.cloudcanvas, 'card_focused_child', { immediate: true }));
    await frames(ctx.page, 300);

    const promoted = await ctx.page.evaluate(() => ({
      root: window.cloudcanvas.root.el.id,
      breadcrumb: window.fixture.breadcrumb(window.cloudcanvas).map((b) => b.el.id),
      hidden: ['card_active_child', 'card_vector', 'window_chat', 'card_parent_scope']
        .filter((id) => document.getElementById(id).hidden)
    }));

    assert.equal(promoted.root, 'card_focused_child');
    assert.deepEqual(promoted.breadcrumb, ['card_parent_scope', 'card_focused_child']);
    // The chain above the promoted blit stays; every branch off it is hidden.
    assert.deepEqual(promoted.hidden, ['card_active_child', 'card_vector', 'window_chat']);

    await ctx.page.evaluate(() => window.fixture.back(window.cloudcanvas, { immediate: true }));
    await frames(ctx.page, 300);

    const restored = await ctx.page.evaluate(() => ({
      root: window.cloudcanvas.root === window.cloudcanvas,
      breadcrumb: window.fixture.breadcrumb(window.cloudcanvas).length,
      hidden: document.querySelectorAll('#canvas-container [data-blit][hidden]').length
    }));
    assert.deepEqual(restored, { root: true, breadcrumb: 0, hidden: 0 });
  });
}

/* ------------------ CURSOR RESKIN ------------------ */

/** What the focus reticle currently looks like in the overlay. */
const READ_RETICLE = () => {
  const groups = document.querySelectorAll('[data-blit-overlay] g[data-cursor="cursor-focus"]');
  const group = groups[0] ?? null;
  const path = group ? group.querySelector('.cloudcanvas-focus-cursor path') : null;
  return {
    groups: groups.length,
    stroke: path ? path.getAttribute('stroke') : null,
    label: group ? (group.querySelector('text')?.textContent || '') : '',
    frustum: Boolean(group && group.querySelector('.cloudcanvas-frustum-projection')),
    hidden: group ? group.getAttribute('display') === 'none' : true
  };
};

function registerCursorSkin(ctx) {
  test('the HUD cursor toggle reskins the focus reticle and back', async () => {
    await ctx.page.click('#btn-focus-child');
    await frames(ctx.page, 800);

    const builtIn = await ctx.page.evaluate(READ_RETICLE);
    assert.equal(builtIn.groups, 1);
    assert.equal(builtIn.stroke, FOCUS_STROKE);
    assert.equal(builtIn.frustum, true);
    assert.equal(builtIn.hidden, false);

    // The skin is the cursors trait's options; the restarted trait draws the next focus in it.
    await ctx.page.click('#btn-unfocus');
    await ctx.page.click('#btn-toggle-cursor');
    await ctx.page.click('#btn-focus-child');
    await frames(ctx.page, 800);

    const custom = await ctx.page.evaluate(READ_RETICLE);
    assert.equal(await ctx.page.textContent('#btn-toggle-cursor'), 'Cursor: Custom');
    assert.equal(custom.groups, 1, 'the replaced cursor left its group behind');
    assert.equal(custom.stroke, '#f59e0b', 'the custom skin never drew');
    assert.equal(custom.frustum, false, 'the skin turned the frustum off');
    assert.equal(custom.hidden, false);
    assert.match(custom.label, /custom cursor-focus skin/);

    // ...and back to the built-in definition.
    await ctx.page.click('#btn-unfocus');
    await ctx.page.click('#btn-toggle-cursor');
    await ctx.page.click('#btn-focus-child');
    await frames(ctx.page, 800);

    const restored = await ctx.page.evaluate(READ_RETICLE);
    assert.equal(restored.groups, 1);
    assert.equal(restored.stroke, FOCUS_STROKE);
    assert.equal(restored.frustum, true);

    await ctx.page.click('#btn-unfocus');
    await frames(ctx.page, 700);
  });
}

/* ------------------ LAZY PROVIDER ------------------ */

function registerProvider(ctx) {
  test('the lazy provider scope resolves and adds its children once', async () => {
    await ctx.page.click('#btn-load-provider');
    await ctx.page.waitForSelector('#card_provided_alpha', { timeout: 5000 });
    await ctx.page.waitForSelector('#card_provided_beta', { timeout: 5000 });
    await frames(ctx.page, 200);

    const state = await ctx.page.evaluate(() => {
      const scope = window.cloudcanvas.find('card_provider_scope');
      return {
        children: scope.blits.map((b) => b.el.id),
        inWell: scope.el.querySelectorAll(':scope [data-scope] > [data-blit]').length,
        status: document.getElementById('stat-provider').textContent
      };
    });

    assert.deepEqual(state.children, ['card_provided_alpha', 'card_provided_beta']);
    assert.equal(state.inWell, 2);
    assert.match(state.status, /2 children loaded/);

    // A second load is the first one's result, not a second set of children.
    await ctx.page.click('#btn-load-provider');
    await frames(ctx.page, 500);
    assert.equal(await ctx.page.evaluate(() => window.cloudcanvas.find('card_provider_scope').blits.length), 2);
  });
}

/* ------------------ CURSOR VISIBILITY GATING ------------------ */

/** Read one cursor group's visibility and its drawing. */
const READ_CURSOR = (name) => {
  const group = document.querySelector(`[data-blit-overlay] g[data-cursor="${name}"]`);
  const shape = group ? group.querySelector('path, rect') : null;
  return {
    hidden: group ? group.getAttribute('display') === 'none' : true,
    drawing: shape ? (shape.getAttribute('d') || shape.getAttribute('x')) : null
  };
};

function registerCursorGating(ctx) {
  const read = (name) => ctx.page.evaluate(READ_CURSOR, name);

  test('the activation brackets come down on deactivate, and stay down through a pan', async () => {
    await ctx.page.click('#btn-toggle-active');
    await frames(ctx.page, 400);

    const awake = await read('cursor-activated');
    assert.equal(awake.hidden, false, 'the brackets never drew on the activated card');
    assert.ok(awake.drawing, 'the brackets drew no path');

    await ctx.page.click('#btn-toggle-active');
    await frames(ctx.page, 400);

    const released = await read('cursor-activated');
    assert.equal(released.hidden, true, 'the brackets stayed up after deactivate');

    // A hidden cursor must not keep re-projecting on every pan.
    await ctx.page.evaluate(() => { window.fixture.camera.panBy(140, 100); });
    await frames(ctx.page, 400);

    const panned = await read('cursor-activated');
    assert.equal(panned.hidden, true);
    assert.equal(panned.drawing, released.drawing, 'a hidden cursor followed the camera');

    await ctx.page.evaluate(() => { window.fixture.camera.panBy(-140, -100); });
    await frames(ctx.page, 300);
  });
}

/* ------------------ KEYBOARD ------------------ */

/** Everything a keyboard step can change, read in one round trip. */
const READ_KEYBOARD = () => {
  const active = document.activeElement;
  const { x, y, scale } = window.fixture.camera;
  return {
    x,
    y,
    scale,
    activeId: active ? active.id : null,
    activeIsBlit: Boolean(active && active.matches('[data-blit]:not([data-blit-root])')),
    activeIsHost: active === window.cloudcanvas.el,
    focused: document.querySelector('[data-blit].is-focused')?.id ?? null
  };
};

function registerKeyboard(ctx) {
  const read = () => ctx.page.evaluate(READ_KEYBOARD);

  test('the whole canvas is drivable from the keyboard alone', async () => {
    await ctx.page.evaluate(() => { window.fixture.clearFocus(); });
    await setCamera(ctx.page, { scale: 1, x: 0, y: 0 });
    await frames(ctx.page, 200);

    // Tab reaches the canvas itself, and stops there: one tab stop, no blits.
    await ctx.page.evaluate(() => document.body.focus());
    await ctx.page.focus('#canvas-container');
    const focused = await read();
    assert.equal(focused.activeIsHost, true, 'the host is not focusable');

    // Arrows drive the camera, and the content follows the arrow.
    await ctx.page.keyboard.press('ArrowRight');
    await frames(ctx.page, 120);
    const panned = await read();
    assert.equal(panned.x - focused.x, 40, `ArrowRight panned ${panned.x - focused.x}px`);

    await ctx.page.keyboard.down('Shift');
    await ctx.page.keyboard.press('ArrowDown');
    await ctx.page.keyboard.up('Shift');
    await frames(ctx.page, 120);
    const shifted = await read();
    assert.equal(shifted.y - panned.y, 160, 'Shift did not multiply the step');

    // `+` zooms about the middle of the host.
    await ctx.page.keyboard.press('+');
    await frames(ctx.page, 120);
    const zoomed = await read();
    assert.ok(Math.abs(zoomed.scale - 1.2) < 1e-6, `+ produced scale ${zoomed.scale}`);

    // Enter drops into the blits; the first one in reading order takes focus.
    await ctx.page.keyboard.press('Enter');
    await frames(ctx.page, 250);
    const entered = await read();
    assert.equal(entered.activeIsBlit, true, 'Enter did not move focus onto a blit');

    // Arrows now rove instead of panning.
    await ctx.page.keyboard.press('ArrowDown');
    await frames(ctx.page, 250);
    const roved = await read();
    assert.equal(roved.activeIsBlit, true);
    assert.notEqual(roved.activeId, entered.activeId, 'the roving order never advanced');

    // Enter is the blit's action; this board's action frames the blit under the roving focus.
    await ctx.page.keyboard.press('Enter');
    await frames(ctx.page, 700);
    assert.equal((await read()).focused, roved.activeId);

    // Escape is two-stage: out of the blits, then the root steps out to the whole canvas.
    await ctx.page.keyboard.press('Escape');
    await frames(ctx.page, 200);
    assert.equal((await read()).activeIsHost, true, 'Escape did not return focus to the host');

    await ctx.page.keyboard.press('Escape');
    await frames(ctx.page, 700);
    const out = await read();
    assert.deepEqual({ x: out.x, y: out.y, scale: out.scale }, { x: 0, y: 0, scale: 1 }, 'the second Escape kept the view');

    await ctx.page.evaluate(() => { window.fixture.clearFocus(); });
    await frames(ctx.page, 200);
  });
}

/* ------------------ ARIA ------------------ */

/** The attributes an assistive technology actually reads, straight off the DOM. */
const READ_ARIA = () => {
  const host = window.cloudcanvas.el;
  const region = host.querySelector('.cloudcanvas-live-region');
  return {
    host: {
      role: host.getAttribute('role'),
      roleDescription: host.getAttribute('aria-roledescription'),
      label: host.getAttribute('aria-label'),
      tabindex: host.getAttribute('tabindex')
    },
    connectorsHidden: document.querySelector('svg[data-blit-svg]').getAttribute('aria-hidden'),
    region: region && { role: region.getAttribute('role'), live: region.getAttribute('aria-live') },
    // No blit may be a tab stop of its own; the host is the only one.
    tabbableBlits: host.querySelectorAll('[data-blit]:not([data-blit-root])[tabindex]:not([tabindex="-1"])').length
  };
};

function registerAria(ctx) {
  test('the canvas names itself, hides its drawings, and carries a polite live region', async () => {
    const aria = await ctx.page.evaluate(READ_ARIA);

    assert.deepEqual(aria.host, {
      role: 'application',
      roleDescription: 'canvas',
      label: 'Dashboard canvas',
      tabindex: '0'
    });
    assert.equal(aria.connectorsHidden, 'true');
    assert.equal(aria.tabbableBlits, 0);
    assert.deepEqual(aria.region, { role: 'status', live: 'polite' });
  });

  test('focusing announces the focused blit, and clearing the focus says so', async () => {
    const regionText = () => ctx.page.evaluate(() => window.cloudcanvas.el.querySelector('.cloudcanvas-live-region').textContent);

    await ctx.page.click('#btn-focus-child');
    await frames(ctx.page, 700);
    // A blit is named by its title (`titleOf`: the widget's own), not its id.
    assert.match(await regionText(), /^Focused Focused Child Card/);

    await ctx.page.click('#btn-unfocus');
    await frames(ctx.page, 700);
    assert.match(await regionText(), /^Focus cleared/);

    // A promotion is said too: the region names the view the root now renders.
    await ctx.page.evaluate(() => window.fixture.go(window.cloudcanvas, 'window_chat', { immediate: true }));
    await frames(ctx.page, 300);
    assert.match(await regionText(), /^Viewing 💬 #engineering-lounge \(Messenger\)/);

    await ctx.page.evaluate(() => window.fixture.back(window.cloudcanvas, { immediate: true }));
    await frames(ctx.page, 300);
    assert.match(await regionText(), /^Viewing the whole canvas/);
  });
}
