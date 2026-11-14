/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Offload acceptance: the claims only a real browser settles.
 *
 * The offload add-on's unit tests prove the policy - the visible-box maths, the
 * margin boundary, the parking identity checks - under happy-dom, which runs no
 * layout engine and so has no real viewport geometry at all. Four things
 * therefore cannot be proven there, and are exactly what this suite is for:
 *
 *   - **that an out-of-range blit's element is genuinely removed from the DOM**,
 *     not merely hidden. `document.getElementById` returning null is a claim about
 *     a real document tree, and the whole point of offload over `display:none`.
 *   - **that panning back puts it back, positioned correctly**, against a real
 *     camera transform on a real plane.
 *   - **that a resized card's size survives an offload / return cycle**, which
 *     needs a real `offsetWidth` read on the returned element to settle.
 *   - **that the selection ring withdraws with its offloaded card** and comes
 *     back with it, drawn by the cursors add-on over a real layout.
 *   - **that a tilted camera returns a card it shows**: range is what the host
 *     shows through the tilt, so a card drawn on screen is never left parked.
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

const OFFLOAD_FIXTURE = '/tests/browser/fixtures/offload.html';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser offload suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

/** Whether an id is present in the live document (removed => false). */
const inDocument = (page, id) =>
  page.evaluate((blitId) => Boolean(document.getElementById(blitId)), id);

/** Offload state straight off the live root, for a model-vs-DOM comparison. */
const offloadState = (page, id) =>
  page.evaluate((blitId) => {
    const found = window.cloudcanvas.find(blitId);
    return found ? { exists: true, offloaded: window.fixture.isOffloaded(found) } : { exists: false };
  }, id);

/** Pan the camera to a canvas offset and let the rAF loop settle the sweep. */
async function panTo(page, x, y) {
  await page.evaluate(([px, py]) => { window.fixture.camera.panTo(px, py); }, [x, y]);
  await frames(page, 300);
}

/** The selection ring's group, as the cursors add-on draws it. */
const READ_RING = () => {
  const group = document.querySelector('[data-blit-overlay] g[data-cursor="cursor-selected"]');
  return { drawn: Boolean(group), hidden: group ? group.getAttribute('display') === 'none' : true };
};

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

  test('an out-of-range card is removed from the DOM while its blit survives', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, OFFLOAD_FIXTURE);
    try {
      await page.waitForSelector('#card_home', { timeout: 5000 });
      await frames(page, 400);

      assert.equal(await inDocument(page, 'card_home'), true, 'the in-view control was not mounted');
      assert.equal(await inDocument(page, 'card_far_right'), false, 'an off-screen offload card was left in the document');
      // A plain off-screen card that never opted in stays mounted.
      assert.equal(await inDocument(page, 'card_no_offload'), true, 'a card without offload was offloaded');

      // The element is gone from the DOM, but the root still finds the blit.
      assert.deepEqual(await offloadState(page, 'card_far_right'), { exists: true, offloaded: true });

      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  test('panning an offloaded card back into range returns it, positioned correctly', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, OFFLOAD_FIXTURE);
    try {
      await page.waitForSelector('#card_home', { timeout: 5000 });
      await frames(page, 400);
      assert.equal(await inDocument(page, 'card_far_right'), false);

      // Slide the visible window right so [3000,3200] falls inside it plus margin.
      await panTo(page, -1700, 0);

      assert.equal(await inDocument(page, 'card_far_right'), true, 'the card never came back into the document');
      assert.deepEqual(await offloadState(page, 'card_far_right'), { exists: true, offloaded: false }, 'the card is still reported offloaded');

      // Its rendered box sits where its canvas coordinates say it should: screen-x
      // = canvas-x + camera-x = 3000 + (-1700) = 1300, within the host.
      const box = await page.evaluate(() => {
        const rect = document.getElementById('card_far_right').getBoundingClientRect();
        return { left: rect.left, width: rect.width };
      });
      assert.ok(Math.abs(box.left - 1300) < 4, `the returned card landed at x=${box.left}, expected ~1300`);
      assert.ok(box.width > 0, 'the returned card has no rendered box');

      // Panning away again offloads it again: the cycle is repeatable, not one-shot.
      await panTo(page, 0, 0);
      assert.equal(await inDocument(page, 'card_far_right'), false);

      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  test('a resized card keeps its size across an offload / return cycle', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, OFFLOAD_FIXTURE);
    try {
      await page.waitForSelector('#card_resizable > [data-cc-resize-handle="se"]', { timeout: 5000 });
      await frames(page, 400);

      // Drag the south-east handle to grow the card by a real pointer delta.
      const handle = await page.evaluate(() => {
        const el = document.querySelector('#card_resizable > [data-cc-resize-handle="se"]');
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
      await page.mouse.move(handle.x, handle.y);
      await page.mouse.down();
      await page.mouse.move(handle.x + 70, handle.y + 50, { steps: 8 });
      await page.mouse.up();
      await frames(page, 250);

      const resized = await boundsOf(page, 'card_resizable');
      assert.ok(resized.w > 240, `the resize did not grow the card (width ${resized.w})`);

      // Pan down until the card clears the bottom edge plus margin: it is offloaded.
      await panTo(page, 0, -2000);
      assert.equal(await inDocument(page, 'card_resizable'), false, 'the resized card was not offloaded');

      // Pan back: it returns, and the resized dimensions are intact - not reset to
      // the fixture's declared size, and not lost to the detached 0x0 box.
      await panTo(page, 0, 0);
      assert.equal(await inDocument(page, 'card_resizable'), true, 'the resized card never came back');

      const restored = await boundsOf(page, 'card_resizable');
      assert.ok(Math.abs(restored.w - resized.w) < 2, `width drifted across offload: ${resized.w} -> ${restored.w}`);
      assert.ok(Math.abs(restored.h - resized.h) < 2, `height drifted across offload: ${resized.h} -> ${restored.h}`);

      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  test('a selection ring withdraws while its card is offloaded, and returns with it', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, OFFLOAD_FIXTURE);
    try {
      await page.waitForSelector('#card_resizable', { timeout: 5000 });
      await frames(page, 400);

      const selected = await page.evaluate(READ_RING);
      assert.deepEqual(selected, { drawn: true, hidden: false }, 'the ring never drew on the selected card');

      await panTo(page, 0, -2000);
      assert.equal(await inDocument(page, 'card_resizable'), false);
      assert.equal((await page.evaluate(READ_RING)).hidden, true, 'the ring outlived the card it was on');
      // Offloading is not deselection: the card still carries its selection.
      assert.equal(await page.evaluate(() => window.cloudcanvas.find('card_resizable').el.classList.contains('is-selected')), true);

      await panTo(page, 0, 0);
      assert.equal((await page.evaluate(READ_RING)).hidden, false, 'the ring never came back with its card');
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  test('a tilted camera returns a parked card it shows, drawn and hit where the camera projects it', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, OFFLOAD_FIXTURE);
    try {
      await page.waitForSelector('#card_home', { timeout: 5000 });
      await frames(page, 400);
      assert.equal(await inDocument(page, 'card_far_right'), false);

      // The right side recedes: canvas x 3000 comes into the 1280px host, well inside it.
      await page.evaluate(() => window.fixture.tilt({ perspective: 1200, rotateY: 60 }));
      await frames(page, 300);
      const centre = await page.evaluate(() => window.fixture.project(3100, 160));
      assert.ok(centre.x > 0 && centre.x < 1280 && centre.y > 0 && centre.y < 800, `projected off screen: ${JSON.stringify(centre)}`);
      assert.equal(await inDocument(page, 'card_far_right'), true, 'a card on screen through the tilt stayed parked');
      const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('[id^="card_"]')?.id, [centre.x, centre.y]);
      assert.equal(hit, 'card_far_right');
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  test('three seconds of frames leaves in-view cards connected and off-view cards offloaded', async () => {
    const { page, errors } = await openFixturePage(ctx.browser, ctx.server.url, OFFLOAD_FIXTURE);
    try {
      await page.waitForSelector('#card_home', { timeout: 5000 });
      await frames(page, 3000);

      // The steady state is stable: the sweep does not thrash a still camera.
      assert.equal(await inDocument(page, 'card_home'), true, 'the in-view control dropped out over time');
      assert.equal(await inDocument(page, 'card_resizable'), true, 'an in-view offload card was offloaded while still');
      assert.equal(await inDocument(page, 'card_far_right'), false, 'an off-view card drifted back into the document');

      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}
