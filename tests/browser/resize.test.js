/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Resize and border-toggle acceptance: the claims only a real browser settles.
 *
 * `tests/unit/resize.test.js` proves the model - the arithmetic, the clamping,
 * the signals, the handle lifecycle - under happy-dom, which runs no layout
 * engine. Three things therefore cannot be proven there at all, and are exactly
 * what this suite is for:
 *
 *   - **that a resize reaches the screen.** The read phase *measures*
 *     `offsetWidth/offsetHeight` back into the blit's size, so a trait that only
 *     wrote the model would look perfect there and change nothing visible - and
 *     would then be overwritten on the next frame. Only a live
 *     `getBoundingClientRect()` can tell the two apart.
 *   - **that the handles are hit-testable where they are drawn.** A handle is
 *     positioned by CSS and pressed by a real pointer; a `translate` that put it
 *     somewhere else, or a stacking context that buried it, is invisible to a
 *     DOM-only assertion.
 *   - **that the border toggle is a paint and not a reflow.** The whole reason
 *     it is `border-color: transparent` rather than `border: none` is that the
 *     box must not move, and "the box did not move" is a computed-style and
 *     layout claim.
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

/** A page of one card, so every measured box is the one the test just moved. */
const RESIZE_FIXTURE = '/tests/browser/fixtures/resize.html';

/** The card the resize checks drive (`fixtures/resize.html`). */
const PROBE_ID = 'card_resize_probe';

/** The plain `chrome: true` blit the border toggle checks drive. */
const BORDER_ID = 'blit_border_probe';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser resize suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

function registerSuite(launcher) {
  const ctx = { server: null, browser: null, page: null, errors: [] };

  before(async () => {
    ctx.server = await startStaticServer();
    ctx.browser = await launcher.launch();

    const opened = await openFixturePage(ctx.browser, ctx.server.url, RESIZE_FIXTURE);
    ctx.page = opened.page;
    ctx.errors = opened.errors;

    // The fixture's card is built at module scope; give the rAF loop the frames
    // it needs to mount, measure and paint it before anything is read.
    await ctx.page.waitForSelector(`#${PROBE_ID} > [data-cc-resize-handle="se"]`, { timeout: 5000 });
    await frames(ctx.page, 400);
  });

  after(async () => {
    if (ctx.browser) await ctx.browser.close();
    if (ctx.server) await ctx.server.close();
  });

  registerHandleVisibility(ctx);
  registerRenderedResize(ctx);
  registerClamping(ctx);
  registerBorderToggle(ctx);
  registerDetach(ctx);

  test('no page errors were reported for the whole resize page', () => {
    assert.deepEqual(ctx.errors, []);
  });
}

/* ------------------ PROBES ------------------ */

/** The probe's rendered box, its handles, and the two computed values in play. */
const READ_PROBE = (id) => {
  const element = document.getElementById(id);
  const box = element.getBoundingClientRect();
  const computed = getComputedStyle(element);
  const handles = Array.from(element.querySelectorAll(':scope > .cloudcanvas-resize-handle'));

  return {
    width: box.width,
    height: box.height,
    left: box.left,
    top: box.top,
    borderStyle: computed.borderTopStyle,
    borderColor: computed.borderTopColor,
    borderWidth: computed.borderTopWidth,
    borderless: element.getAttribute('data-bordered') === 'false',
    handles: handles.length,
    visibleHandles: handles.filter((handle) => getComputedStyle(handle).display !== 'none').length
  };
};

/** Where a named handle actually is on screen, in page coordinates. */
const READ_HANDLE = (args) => {
  const handle = document.querySelector(
    `#${args.id} > [data-cc-resize-handle="${args.direction}"]`
  );
  if (!handle) return null;

  const box = handle.getBoundingClientRect();
  const centre = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  const hit = document.elementFromPoint(centre.x, centre.y);

  return {
    ...centre,
    cursor: getComputedStyle(handle).cursor,
    // The claim a DOM assertion cannot make: the handle is the thing a real
    // pointer at that point would land on.
    hittable: hit === handle
  };
};

const probe = (page) => page.evaluate(READ_PROBE, PROBE_ID);
const handleAt = (page, direction) => page.evaluate(READ_HANDLE, { id: PROBE_ID, direction });

/** Write spec keys on the border probe, as an editor or a load would. */
const setBorder = (page, patch) => page.evaluate((args) => { window.cloudcanvas.find(args.id).set(args.patch); }, { id: BORDER_ID, patch });
const borderProbe = (page) => page.evaluate(READ_PROBE, BORDER_ID);

/** Select or deselect the probe through the select add-on's call form. */
const selectProbe = (page, value) => page.evaluate((args) => {
  window.fixture.setSelected(window.cloudcanvas.find(args.id), args.value);
}, { id: PROBE_ID, value });

/** Drag a handle by (dx, dy) real screen pixels, in steps, and settle. */
async function dragHandleBy(page, direction, dx, dy) {
  const handle = await handleAt(page, direction);
  assert.ok(handle, `no "${direction}" handle to drag`);
  assert.equal(handle.hittable, true, `the "${direction}" handle is not under its own centre`);

  await page.mouse.move(handle.x, handle.y);
  await page.mouse.down();
  await page.mouse.move(handle.x + dx, handle.y + dy, { steps: 8 });
  await page.mouse.up();
  await frames(page, 250);
}

/* ------------------ HANDLE VISIBILITY ------------------ */

function registerHandleVisibility(ctx) {
  test('handles are painted on the selected card and gone when it is deselected', async () => {
    const selected = await probe(ctx.page);
    assert.equal(selected.handles, 8, `the probe carries ${selected.handles} handles`);
    assert.equal(selected.visibleHandles, 8, 'a selected card is not showing its handles');

    await selectProbe(ctx.page, false);
    await frames(ctx.page, 150);

    const deselected = await probe(ctx.page);
    assert.equal(deselected.handles, 8, 'deselecting removed the handle elements');
    assert.equal(deselected.visibleHandles, 0, 'the handles outlived the selection');

    await selectProbe(ctx.page, true);
    await frames(ctx.page, 150);
    assert.equal((await probe(ctx.page)).visibleHandles, 8, 'the handles never came back');
  });

  test('each handle sits on its own edge, with the cursor that names the gesture', async () => {
    const box = await probe(ctx.page);
    const [se, nw, n, e] = await Promise.all([
      handleAt(ctx.page, 'se'),
      handleAt(ctx.page, 'nw'),
      handleAt(ctx.page, 'n'),
      handleAt(ctx.page, 'e')
    ]);

    assert.equal(se.cursor, 'nwse-resize');
    assert.equal(nw.cursor, 'nwse-resize');
    assert.equal(n.cursor, 'ns-resize');
    assert.equal(e.cursor, 'ew-resize');

    // Centred *on* the edge, not inside it, within a pixel of rounding.
    assert.ok(Math.abs(nw.x - box.left) < 1.5, `nw is ${nw.x - box.left}px off the left edge`);
    assert.ok(Math.abs(nw.y - box.top) < 1.5, `nw is ${nw.y - box.top}px off the top edge`);
    assert.ok(Math.abs(se.x - (box.left + box.width)) < 1.5, 'se is off the right edge');
    assert.ok(Math.abs(se.y - (box.top + box.height)) < 1.5, 'se is off the bottom edge');
    assert.ok(Math.abs(n.x - (box.left + box.width / 2)) < 1.5, 'n is not centred horizontally');
  });
}

/* ------------------ THE END-TO-END PROOF ------------------ */

function registerRenderedResize(ctx) {
  test('a real corner drag changes the card\'s rendered box, not just its model', async () => {
    const before = await probe(ctx.page);
    const modelBefore = await boundsOf(ctx.page, PROBE_ID);

    await dragHandleBy(ctx.page, 'se', 60, 40);

    const after = await probe(ctx.page);
    const modelAfter = await boundsOf(ctx.page, PROBE_ID);

    // The claim: the *rendered* box grew by the pointer delta. A trait that had
    // only written the model would leave this assertion at zero.
    assert.ok(
      Math.abs((after.width - before.width) - 60) < 3,
      `the rendered width moved ${after.width - before.width}px for a 60px drag`
    );
    assert.ok(
      Math.abs((after.height - before.height) - 40) < 3,
      `the rendered height moved ${after.height - before.height}px for a 40px drag`
    );

    // ...and the model agrees with it, which is the other half: the read phase
    // measured the element back into the blit rather than fighting it.
    assert.ok(Math.abs(modelAfter.w - after.width) < 1.5, 'the blit\'s size drifted from the DOM');
    assert.ok(Math.abs(modelAfter.h - after.height) < 1.5, 'the blit\'s size drifted from the DOM');
    assert.ok(modelAfter.w > modelBefore.w);

    // A south-east drag moves the far edges only.
    assert.ok(Math.abs(after.left - before.left) < 1.5, 'the origin moved on a se drag');
    assert.ok(Math.abs(after.top - before.top) < 1.5, 'the origin moved on a se drag');
  });

  test('a near-edge drag moves the origin and holds the far edge exactly still', async () => {
    const before = await probe(ctx.page);

    await dragHandleBy(ctx.page, 'nw', -50, -30);

    const after = await probe(ctx.page);
    assert.ok(
      Math.abs((after.width - before.width) - 50) < 3,
      `the box grew ${after.width - before.width}px against a 50px leftward drag`
    );
    assert.ok(Math.abs((after.left - before.left) + 50) < 3, 'the west edge did not follow the pointer');
    assert.ok(
      Math.abs((after.left + after.width) - (before.left + before.width)) < 2,
      'the east edge moved during a north-west drag'
    );
    assert.ok(
      Math.abs((after.top + after.height) - (before.top + before.height)) < 2,
      'the south edge moved during a north-west drag'
    );
  });

  test('an edge drag changes one dimension and leaves the other untouched', async () => {
    const before = await probe(ctx.page);

    await dragHandleBy(ctx.page, 'e', 40, 70);

    const after = await probe(ctx.page);
    assert.ok(Math.abs((after.width - before.width) - 40) < 3, 'the east edge did not follow');
    assert.ok(Math.abs(after.height - before.height) < 1.5, `an east drag changed the height by ${after.height - before.height}px`);
  });

  test('the card still drags by its chrome after being resized', async () => {
    // The exemption cuts both ways: a handle must not drag the card, and marking
    // eight of them as controls must not have made the card undraggable.
    const box = await probe(ctx.page);
    const before = await boundsOf(ctx.page, PROBE_ID);

    await ctx.page.mouse.move(box.left + box.width / 2, box.top + 8);
    await ctx.page.mouse.down();
    await ctx.page.mouse.move(box.left + box.width / 2 + 40, box.top + 38, { steps: 6 });
    await ctx.page.mouse.up();
    await frames(ctx.page, 200);

    const after = await boundsOf(ctx.page, PROBE_ID);
    assert.ok(Math.abs((after.x - before.x) - 40) < 4, `the resized card moved ${after.x - before.x}px`);
    assert.ok(Math.abs(after.w - before.w) < 1.5, 'dragging the card resized it');
  });
}

/* ------------------ CLAMPING ------------------ */

function registerClamping(ctx) {
  test('the rendered box stops dead at the trait\'s min and max', async () => {
    // Far past the ceiling in both axes.
    await dragHandleBy(ctx.page, 'se', 600, 600);
    const grown = await probe(ctx.page);
    assert.ok(Math.abs(grown.width - 420) < 1.5, `the width ran to ${grown.width} past a 420 ceiling`);
    assert.ok(Math.abs(grown.height - 300) < 1.5, `the height ran to ${grown.height} past a 300 ceiling`);

    // ...and far past the floor.
    await dragHandleBy(ctx.page, 'se', -600, -600);
    const shrunk = await probe(ctx.page);
    assert.ok(Math.abs(shrunk.width - 120) < 1.5, `the width fell to ${shrunk.width} under a 120 floor`);
    assert.ok(Math.abs(shrunk.height - 80) < 1.5, `the height fell to ${shrunk.height} under an 80 floor`);
  });
}

/* ------------------ BORDER TOGGLE ------------------ */

function registerBorderToggle(ctx) {
  test('the border toggle is a repaint, and moves nothing', async () => {
    const bordered = await borderProbe(ctx.page);
    assert.equal(bordered.borderless, false);
    assert.equal(bordered.borderStyle, 'solid');
    assert.equal(bordered.borderWidth, '1px');
    assert.equal(bordered.borderColor, 'rgba(255, 255, 255, 0.1)', 'the surface is not painting the --cc-card-border token');

    await setBorder(ctx.page, { bordered: false });
    await frames(ctx.page, 200);

    const borderless = await borderProbe(ctx.page);
    assert.equal(borderless.borderless, true);
    assert.equal(borderless.borderColor, 'rgba(0, 0, 0, 0)', 'the border is still painted with `bordered: false`');
    // The whole reason for `border-color: transparent`: the box does not move,
    // in either axis, by even a subpixel.
    assert.equal(borderless.width, bordered.width, 'withholding the border reflowed the blit');
    assert.equal(borderless.height, bordered.height, 'withholding the border reflowed the blit');
    assert.equal(borderless.borderWidth, '1px', 'the border was removed rather than hidden');

    // The rest of the surface is untouched - this is not `chrome: false`.
    const chrome = await ctx.page.evaluate((id) => {
      const computed = getComputedStyle(document.getElementById(id));
      return { padding: computed.padding, background: computed.backgroundColor, shadow: computed.boxShadow };
    }, BORDER_ID);
    assert.equal(chrome.padding, '12px 16px');
    assert.equal(chrome.background, 'rgba(30, 41, 59, 0.85)');
    assert.notEqual(chrome.shadow, 'none');

    await setBorder(ctx.page, { bordered: null });
    await frames(ctx.page, 200);

    const restored = await borderProbe(ctx.page);
    assert.equal(restored.borderColor, bordered.borderColor, 'the border never came back');
    assert.equal(restored.width, bordered.width);
  });

  test('a hovered borderless blit stays borderless', async () => {
    // A hover rule that sets a border colour would win on source order at equal
    // specificity; the toggle has to outrank it or the border reappears under the pointer.
    await setBorder(ctx.page, { bordered: false });
    const box = await borderProbe(ctx.page);
    await ctx.page.mouse.move(box.left + box.width / 2, box.top + box.height / 2);
    await frames(ctx.page, 200);

    const hovered = await borderProbe(ctx.page);
    assert.equal(hovered.borderColor, 'rgba(0, 0, 0, 0)', 'hover repainted the withheld border');

    await ctx.page.mouse.move(20, 20);
    await setBorder(ctx.page, { bordered: null });
    await frames(ctx.page, 150);
  });
}

/* ------------------ DETACH ------------------ */

function registerDetach(ctx) {
  test('switching the resize trait off takes the handles out of a live document', async () => {
    const removed = await ctx.page.evaluate(async (id) => {
      const card = window.cloudcanvas.find(id);
      const before = document.querySelectorAll(`#${id} > .cloudcanvas-resize-handle`).length;
      card.set({ resize: false });
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        before,
        after: document.querySelectorAll(`#${id} > .cloudcanvas-resize-handle`).length,
        declared: 'resize' in card.spec
      };
    }, PROBE_ID);

    assert.equal(removed.before, 8);
    assert.equal(removed.after, 0, 'the handles survived their trait');
    assert.equal(removed.declared, false, 'the spec still declares the trait');

    await ctx.page.evaluate((id) => { window.cloudcanvas.find(id).remove(); }, PROBE_ID);
    await frames(ctx.page, 200);
  });
}
