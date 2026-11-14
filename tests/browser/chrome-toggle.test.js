/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Chromeless grab-handle acceptance: the claims only a real browser settles.
 *
 * `tests/unit/addons-drag.test.js` proves the model under happy-dom - when the
 * grip exists and when the drag chunk shows it. Three things cannot be proven there at
 * all, because happy-dom runs no layout engine and no real pointer, and they are
 * exactly what this suite is for:
 *
 *   - **that the handle is hit-testable where it is drawn.** It is positioned by
 *     CSS at a corner with a `translate`; a rule that put it somewhere else, or a
 *     stacking context that buried it under the control, is invisible to a
 *     DOM-only assertion.
 *   - **that a drag of the handle actually moves the blit.** The handle is not
 *     `data-cc-control`, so the drag add-on must take the press and move the
 *     blit - end to end, through real pointer events, not by calling a hook.
 *   - **that the click still reaches the button.** The whole point of the handle
 *     is that the control keeps its own gesture: a press on the button must fire
 *     its click, and a drag of the handle must never become one.
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
  boundsOf,
  startStaticServer
} from './harness.js';

/** A page of one chromeless button blit (`fixtures/chrome-toggle.html`). */
const CHROME_FIXTURE = '/tests/browser/fixtures/chrome-toggle.html';

/** The blit every check in this file drives. */
const PROBE_ID = 'button_chrome_probe';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser chrome-toggle suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

function registerSuite(launcher) {
  const ctx = { server: null, browser: null, page: null, errors: [] };

  before(async () => {
    ctx.server = await startStaticServer();
    ctx.browser = await launcher.launch();

    const opened = await openFixturePage(ctx.browser, ctx.server.url, CHROME_FIXTURE);
    ctx.page = opened.page;
    ctx.errors = opened.errors;

    // The blit is built at module scope; give the rAF loop the frames it needs to
    // mount, measure and paint it - and its grab handle - before anything is read.
    await ctx.page.waitForSelector(`#${PROBE_ID} > .cloudcanvas-grab-handle`, { timeout: 5000 });
    await frames(ctx.page, 400);
  });

  after(async () => {
    if (ctx.browser) await ctx.browser.close();
    if (ctx.server) await ctx.server.close();
  });

  registerVisibility(ctx);
  registerExistence(ctx);
  registerDragAndClick(ctx);

  test('no page errors were reported for the whole chrome-toggle page', () => {
    assert.deepEqual(ctx.errors, []);
  });
}

/* ------------------ PROBES ------------------ */

/** The probe's grab handles, and how many are actually painted. */
const READ_PROBE = (id) => {
  const element = document.getElementById(id);
  const handles = Array.from(element.querySelectorAll(':scope > .cloudcanvas-grab-handle'));
  return {
    handles: handles.length,
    visibleHandles: handles.filter((handle) => getComputedStyle(handle).display !== 'none').length
  };
};

/** Where the grab handle actually is on screen, and whether a pointer hits it. */
const READ_HANDLE = (id) => {
  const handle = document.querySelector(`#${id} > .cloudcanvas-grab-handle`);
  if (!handle) return null;

  const box = handle.getBoundingClientRect();
  const centre = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  const hit = document.elementFromPoint(centre.x, centre.y);

  return {
    ...centre,
    cursor: getComputedStyle(handle).cursor,
    // The claim a DOM assertion cannot make: a real pointer at that point lands on
    // the handle, not on the control it overlays.
    hittable: hit === handle
  };
};

/** Where the real control is, and whether a pointer at its centre hits it. */
const READ_CONTROL = (id) => {
  const control = document.querySelector(`#${id} .cloudcanvas-lib-button`);
  if (!control) return null;

  const box = control.getBoundingClientRect();
  const centre = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  const hit = document.elementFromPoint(centre.x, centre.y);

  return { ...centre, hittable: hit === control || control.contains(hit) };
};

const probe = (page) => page.evaluate(READ_PROBE, PROBE_ID);
const handleAt = (page) => page.evaluate(READ_HANDLE, PROBE_ID);
const controlAt = (page) => page.evaluate(READ_CONTROL, PROBE_ID);
const pressesOn = (page) => page.evaluate(() => window.__presses);
const setSelected = (page, value) =>
  page.evaluate(({ id, v }) => { window.fixture.setSelected(window.cloudcanvas.find(id), v); }, { id: PROBE_ID, v: value });

/** Write `chrome` alone: the drag trait keeps running, and the drag chunk decides whether the grip shows. */
const setChrome = (page, value) =>
  page.evaluate(({ id, v }) => { window.cloudcanvas.find(id).set({ chrome: v ? null : false }); }, { id: PROBE_ID, v: value });

/* ------------------ VISIBILITY ------------------ */

function registerVisibility(ctx) {
  test('the handle is painted on the selected blit and hidden when it is deselected', async () => {
    const selected = await probe(ctx.page);
    assert.equal(selected.handles, 1, `the probe carries ${selected.handles} grab handles`);
    assert.equal(selected.visibleHandles, 1, 'a selected chromeless control is not showing its handle');

    await setSelected(ctx.page, false);
    await frames(ctx.page, 150);

    const deselected = await probe(ctx.page);
    assert.equal(deselected.handles, 1, 'deselecting removed the handle element instead of hiding it');
    assert.equal(deselected.visibleHandles, 0, 'the handle outlived the selection');

    await setSelected(ctx.page, true);
    await frames(ctx.page, 150);
    assert.equal((await probe(ctx.page)).visibleHandles, 1, 'the handle never came back');
  });

  test('the handle sits at the corner with a grab cursor, hit-testable there', async () => {
    const handle = await handleAt(ctx.page);
    assert.ok(handle, 'no grab handle to locate');
    assert.equal(handle.cursor, 'grab');
    assert.equal(handle.hittable, true, 'the handle is buried under the control it overlays');

    const box = await ctx.page.evaluate(
      (id) => document.getElementById(id).getBoundingClientRect(),
      PROBE_ID
    );
    // Centred on the blit's top-left corner, within a pixel of rounding.
    assert.ok(Math.abs(handle.x - box.left) < 1.5, `the handle is ${handle.x - box.left}px off the left edge`);
    assert.ok(Math.abs(handle.y - box.top) < 1.5, `the handle is ${handle.y - box.top}px off the top edge`);
  });
}

/* ------------------ EXISTENCE ------------------ */

function registerExistence(ctx) {
  test('chrome coming back hides the handle and chrome off shows it again, with no drag restart', async () => {
    await setSelected(ctx.page, true);
    await frames(ctx.page, 120);
    // Mark the element, so a rebuilt handle would be told apart from the one that was there.
    await ctx.page.evaluate((id) => { document.querySelector(`#${id} > .cloudcanvas-grab-handle`).__kept = true; }, PROBE_ID);
    assert.equal((await probe(ctx.page)).visibleHandles, 1, 'the selected chromeless probe is not showing its handle');

    await setChrome(ctx.page, true);
    await frames(ctx.page, 200);
    const chromed = await probe(ctx.page);
    assert.equal(chromed.handles, 1, 'the chrome write rebuilt or removed the handle');
    assert.equal(chromed.visibleHandles, 0, 'chrome came back but the handle still shows');

    await setChrome(ctx.page, false);
    await frames(ctx.page, 200);
    const restored = await probe(ctx.page);
    assert.equal(restored.visibleHandles, 1, 'the handle stayed hidden when chrome went away again');
    assert.equal(await ctx.page.evaluate(
      (id) => document.querySelector(`#${id} > .cloudcanvas-grab-handle`).__kept === true, PROBE_ID
    ), true, 'the handle element was replaced: the drag trait restarted');
  });
}

/* ------------------ DRAG AND CLICK ------------------ */

function registerDragAndClick(ctx) {
  test('a real drag of the handle moves the blit, and never becomes a click', async () => {
    await setSelected(ctx.page, true);
    await frames(ctx.page, 120);

    const handle = await handleAt(ctx.page);
    assert.equal(handle.hittable, true, 'the handle is not under its own centre');
    const before = await boundsOf(ctx.page, PROBE_ID);
    const pressesBefore = await pressesOn(ctx.page);

    await ctx.page.mouse.move(handle.x, handle.y);
    await ctx.page.mouse.down();
    await ctx.page.mouse.move(handle.x + 70, handle.y + 45, { steps: 8 });
    await ctx.page.mouse.up();
    await frames(ctx.page, 200);

    const after = await boundsOf(ctx.page, PROBE_ID);
    assert.ok(Math.abs((after.x - before.x) - 70) < 5, `the blit moved ${after.x - before.x}px for a 70px drag`);
    assert.ok(Math.abs((after.y - before.y) - 45) < 5, `the blit moved ${after.y - before.y}px for a 45px drag`);

    // The control's gesture was never touched: dragging the handle is not a press.
    assert.equal(await pressesOn(ctx.page), pressesBefore, 'a drag of the handle fired the button');
  });

  test('a click on the button still reaches it, and never moves the blit', async () => {
    const control = await controlAt(ctx.page);
    assert.ok(control, 'no control to click');
    assert.equal(control.hittable, true, 'the control is not under its own centre');

    const before = await boundsOf(ctx.page, PROBE_ID);
    const pressesBefore = await pressesOn(ctx.page);

    await ctx.page.mouse.move(control.x, control.y);
    await ctx.page.mouse.down();
    await ctx.page.mouse.up();
    await frames(ctx.page, 150);

    assert.equal(await pressesOn(ctx.page), pressesBefore + 1, 'the click never reached the button');

    const after = await boundsOf(ctx.page, PROBE_ID);
    assert.ok(Math.abs(after.x - before.x) < 1.5, 'clicking the button moved the blit');
    assert.ok(Math.abs(after.y - before.y) < 1.5, 'clicking the button moved the blit');
  });
}
