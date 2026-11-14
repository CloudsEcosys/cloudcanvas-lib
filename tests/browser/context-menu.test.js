/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The right-click menu add-on and the commands it drives, in a real browser.
 *
 * Everything here needs a browser that actually has a native context menu to
 * suppress, a real secondary button to press, and real paint order to reorder.
 * The dashboard board installs `menu(app, {registry})` over a registry of its
 * own (`window.fixture.registry`): Back / Forward from the history add-on, and
 * bring-to-front / send-to-back from the layout add-on's `reorder`.
 *
 *   - a right-click opens the menu at the click point, with Back absent until
 *     there is history to go back to, and clamped inside the host at a corner,
 *   - clicking Back really steps the view back, and leaves Forward behind,
 *   - a third-party command registered on the registry renders and fires,
 *   - bring-to-front / send-to-back visibly reorder the DOM siblings, and
 *   - on the feature-showcase board (`fixtures/showcase.html`), stepping into a
 *     card with the keyboard and pressing Enter promotes it, and Back out
 *     restores the board.
 *
 * The flyouts - nested submenus - are `context-menu-submenu.test.js`.
 *
 * Run with `npm run test:browser`; fails without Playwright unless CLOUDCANVAS_BROWSER_OPTIONAL=1 (then skipped whole).
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { PLAYWRIGHT_MISSING, frames, loadChromium, openBootedPage, startStaticServer } from './harness.js';
import { MENU, MENU_ITEM, blitPoint, firstReachableBlit, freshPage, menuLabels, rightClickAt } from './context-menu-helpers.js';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser context-menu suite', { skip: 'playwright is not installed' }, () => {});
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

  registerMenuOpening(ctx);
  registerEdgeClamping(ctx);
  registerBackCommand(ctx);
  registerThirdPartyCommand(ctx);
  registerZOrder(ctx);
  registerShowcasePromotion(ctx);
}

/* ------------------ OPENING ------------------ */

function registerMenuOpening(ctx) {
  test('a right-click opens the canvas menu at the click, without Back at the root', async () => {
    const { page, errors } = await freshPage(ctx);
    try {
      const point = await blitPoint(page, 'card_vector');
      await rightClickAt(page, point);

      const menu = page.locator(MENU);
      assert.equal(await menu.isVisible(), true, 'no menu opened on a right-click');

      const box = await menu.boundingBox();
      assert.ok(Math.abs(box.x - point.x) <= 2, `the menu opened at x=${box.x}, clicked at ${point.x}`);
      assert.ok(Math.abs(box.y - point.y) <= 2, `the menu opened at y=${box.y}, clicked at ${point.y}`);

      // No history yet, so Back is not offered at all - the z-order pair is.
      assert.deepEqual(await menuLabels(page), ['Bring to front', 'Send to back']);

      await page.keyboard.press('Escape');
      await frames(page, 120);
      assert.equal(await menu.isVisible(), false, 'Escape left the menu up');
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

/* ------------------ EDGE CLAMPING ------------------ */

/**
 * The regression lock for the host-box clamp. A tall menu opened a few pixels
 * inside the bottom-right corner would, unclamped, run its far side off the host
 * and out of the viewport - and this asserts the outcome that matters, that
 * *every* item is a point a pointer can actually reach (`elementFromPoint`), not
 * merely that the element exists.
 *
 * The `#canvas-container` host fills the whole 1280x800 viewport; the bottom-right
 * event drawer that floats there is `pointer-events: none`, so it is invisible to
 * hit-testing and the corner is a clean place to open against.
 */
function registerEdgeClamping(ctx) {
  const PROBE_COUNT = 12;

  test('a menu against the bottom-right corner is clamped inside the host, every item clickable', async () => {
    const { page, errors } = await freshPage(ctx);
    try {
      // A block of always-applicable commands, so a right-click on empty canvas
      // in the far corner opens a menu tall and wide enough to overflow the host.
      await page.evaluate((count) => {
        for (let i = 0; i < count; i += 1) {
          window.fixture.registry.register({
            id: `edge-probe-${i}`,
            label: `Edge probe ${i}`,
            group: 'edge',
            when: () => true,
            action: () => {}
          });
        }
      }, PROBE_COUNT);

      const host = await page.evaluate(() => {
        const rect = window.cloudcanvas.el.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      });
      const point = { x: Math.round(host.right - 6), y: Math.round(host.bottom - 6) };

      await rightClickAt(page, point);
      const menu = page.locator(MENU);
      assert.equal(await menu.isVisible(), true, 'no menu opened in the corner');

      // The whole menu box sits inside the host box (1px tolerance for borders).
      const box = await menu.boundingBox();
      assert.ok(box.y + box.height <= host.bottom + 1, `menu runs ${box.y + box.height} past host bottom ${host.bottom}`);
      assert.ok(box.x + box.width <= host.right + 1, `menu runs ${box.x + box.width} past host right ${host.right}`);
      assert.ok(box.y >= host.top - 1, 'the clamp pulled the menu above the host');
      assert.ok(box.x >= host.left - 1, 'the clamp pulled the menu left of the host');

      // The claim that counts: the centre of every item resolves to that item, so
      // a pointer clicking there really lands on the command, not off-screen.
      const reach = await page.evaluate((selector) => {
        const buttons = Array.from(document.querySelectorAll(selector));
        const unreachable = [];
        for (const button of buttons) {
          const rect = button.getBoundingClientRect();
          const hit = document.elementFromPoint(
            Math.round(rect.left + rect.width / 2),
            Math.round(rect.top + rect.height / 2)
          );
          if (!hit || (hit !== button && !button.contains(hit))) {
            unreachable.push(button.textContent);
          }
        }
        return { total: buttons.length, unreachable };
      }, MENU_ITEM);

      assert.ok(reach.total >= PROBE_COUNT, `only ${reach.total} items rendered, expected the menu to overflow`);
      assert.deepEqual(reach.unreachable, [], `items a pointer cannot reach: ${reach.unreachable.join(', ')}`);

      await page.keyboard.press('Escape');
      await frames(page, 120);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

/* ------------------ BACK ------------------ */

function registerBackCommand(ctx) {
  test('Back appears once there is history, and clicking it steps the view back', async () => {
    const { page, errors } = await freshPage(ctx);
    try {
      await page.evaluate(() => window.fixture.go(window.cloudcanvas, 'card_parent_scope', { immediate: true }));
      await frames(page, 300);
      assert.equal(
        await page.evaluate(() => window.cloudcanvas.root.el.id),
        'card_parent_scope',
        'the history add-on did not promote the card'
      );

      await rightClickAt(page, await blitPoint(page, 'card_parent_scope'));
      assert.equal((await menuLabels(page))[0], 'Back', 'Back was not offered with history to step back to');

      await page.locator(MENU_ITEM, { hasText: 'Back' }).first().click();
      await frames(page, 500);

      assert.equal(
        await page.evaluate(() => window.cloudcanvas.root === window.cloudcanvas),
        true,
        'the Back command did not step the view back'
      );
      assert.equal(await page.locator(MENU).isVisible(), false, 'the menu stayed up after Back');

      // ...and Forward is now on the menu, because Back left somewhere to go.
      await rightClickAt(page, await blitPoint(page, 'card_vector'));
      assert.ok((await menuLabels(page)).includes('Forward'), 'Back left no Forward behind it');
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

/* ------------------ A THIRD-PARTY COMMAND ------------------ */

function registerThirdPartyCommand(ctx) {
  test('a command registered by the page renders and runs on the blit it was opened over', async () => {
    const { page, errors } = await freshPage(ctx);
    try {
      await page.evaluate(() => {
        window.__menuRuns = [];
        window.fixture.registry.register({
          id: 'browser-rename',
          label: 'Rename',
          group: 'edit',
          when: (app, context) => Boolean(context.target),
          action: (app, context) => {
            window.__menuRuns.push(context.target.el.id);
            window.fixture.setContent(context.target, 'title', 'Renamed by the menu');
          }
        });
      });

      await rightClickAt(page, await blitPoint(page, 'card_vector'));
      assert.ok((await menuLabels(page)).includes('Rename'), 'the registered command never rendered');

      await page.locator(MENU_ITEM, { hasText: 'Rename' }).first().click();
      await frames(page, 200);

      assert.deepEqual(await page.evaluate(() => window.__menuRuns), ['card_vector']);
      assert.match(await page.locator('[data-blit][id="card_vector"]').first().innerText(), /Renamed by the menu/);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

/* ------------------ Z-ORDER ------------------ */

function registerZOrder(ctx) {
  test('bring to front and send to back reorder the real DOM siblings', async () => {
    const { page, errors } = await freshPage(ctx);
    try {
      const order = () => page.$$eval(
        '#canvas-container > [data-blit-plane] > [data-blit]',
        (elements) => elements.map((element) => element.getAttribute('id'))
      );

      const before = await order();
      assert.ok(before.length > 2, `only ${before.length} top-level blits to reorder`);

      // The first top-level blit the page's own chrome is not sitting on top of.
      const first = await firstReachableBlit(page, before);

      await rightClickAt(page, await blitPoint(page, first));
      await page.locator(MENU_ITEM, { hasText: 'Bring to front' }).first().click();
      await frames(page, 200);

      const raised = await order();
      assert.equal(raised[raised.length - 1], first, 'bring-to-front did not move the element last');

      await rightClickAt(page, await blitPoint(page, first));
      await page.locator(MENU_ITEM, { hasText: 'Send to back' }).first().click();
      await frames(page, 200);

      const lowered = await order();
      assert.equal(lowered[0], first, 'send-to-back did not move the element first');
      assert.deepEqual(lowered.slice().sort(), before.slice().sort(), 'a blit was lost in the reorder');
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

/* ------------------ PROMOTION ON THE SHOWCASE BOARD ------------------ */

/**
 * The feature-showcase board (`fixtures/showcase.js`): capability cards and a
 * card that holds blits, on a board built from the public surface only.
 *
 * Keyboard is the route deliberately: Enter on a roved-to blit is the keyboard
 * add-on's `action`, and the showcase answers it the way the builder does -
 * promote the blit with the history add-on's `go`.
 */
function registerShowcasePromotion(ctx) {
  test('on the showcase board, Enter on a card promotes it, and Back out restores the board', async () => {
    const { page, errors } = await openBootedPage(ctx.browser, {
      pageOptions: { viewport: { width: 1280, height: 800 } },
      boot: async (fresh) => {
        await fresh.goto(`${ctx.server.url}/tests/browser/fixtures/showcase.html`, { waitUntil: 'load' });
        await fresh.waitForSelector('#hero-canvas [data-blit]');
      }
    });

    try {
      await frames(page, 800);

      const visibleIds = () => page.$$eval(
        '#hero-canvas [data-blit]',
        (elements) => elements.filter((element) => !element.closest('[hidden]')).map((element) => element.getAttribute('id'))
      );
      const before = await visibleIds();
      assert.ok(before.length >= 8, `the showcase only built ${before.length} blits`);

      // Into the canvas, then into the blits, then Enter on the first one itself.
      await page.locator('#hero-canvas').focus();
      await page.keyboard.press('Enter');
      await frames(page, 200);
      const roved = await page.evaluate(() => document.activeElement.getAttribute('id'));
      assert.ok(roved, 'Enter never reached the roving order');

      await page.keyboard.press('Enter');
      await frames(page, 700);

      // Promotion is observable on the page: every branch off the promoted
      // blit's chain is hidden.
      const after = await visibleIds();
      assert.equal(await page.evaluate(() => window.cloudcanvas.root.el.id), roved, 'Enter did not promote the card');
      assert.ok(after.length < before.length, `Enter left all ${before.length} blits showing - nothing was promoted`);
      assert.ok(after.includes(roved), 'the card that was promoted left the canvas');

      // The way out restores the board. Membership, not sibling order.
      await page.locator('#hero-back').click();
      await frames(page, 800);
      assert.deepEqual((await visibleIds()).slice().sort(), before.slice().sort(), 'backing out did not restore the board');
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}
