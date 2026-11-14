/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The context menu's flyouts, in a real browser: a submenu opens beside its
 * trigger, is clamped inside the host exactly like the top level (verified by
 * the same clickability-via-`elementFromPoint` assertion the edge-clamp lock
 * established), keeps every ancestor trigger reachable however deep the chain,
 * is driven in and back out by the keyboard, and closes the whole chain when a
 * leaf runs. The menu itself and its commands are `context-menu.test.js`.
 *
 * Run with `npm run test:browser`; skipped whole when Playwright is absent.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { PLAYWRIGHT_MISSING, frames, loadChromium, startStaticServer } from './harness.js';
import { FLYOUT, MENU_ITEM, ROOT_MENU, blitPoint, freshPage, rightClickAt } from './context-menu-helpers.js';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser context-menu submenu suite', { skip: 'playwright is not installed' }, () => {});
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

  registerFlyoutClamp(ctx);
  registerAncestorReachability(ctx);
  registerFlyoutKeyboard(ctx);
  registerFlyoutLeafRun(ctx);
}

/**
 * A two-level insert menu built from the public surface: one top-level trigger
 * with three leaf children. `when: () => true` throughout, so it applies to any
 * right-click, and each leaf records its own run - the fixture the nested-menu
 * tests drive, independent of the Sandbox's real insert items.
 */
async function registerNestedFixture(page) {
  await page.evaluate(() => {
    const { registry } = window.fixture;
    window.__nestRuns = [];
    registry.register({ id: 'nest-new', label: 'Insert', group: 'insert', when: () => true });
    for (const [id, label] of [['nest-rect', 'Rectangle'], ['nest-circle', 'Circle'], ['nest-line', 'Line']]) {
      registry.register({ id, label, parent: 'nest-new', action: () => window.__nestRuns.push(id) });
    }
  });
}

/** The host box, as client-space edges. */
async function hostBox(page) {
  return page.evaluate(() => {
    const rect = window.cloudcanvas.el.getBoundingClientRect();
    return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width };
  });
}

/**
 * A three-level insert menu: `Insert > Shapes > Polygons > {Triangle, Square,
 * Pentagon}`, every intermediate level a real submenu trigger, `when: () => true`
 * throughout so it applies to any right-click. Deeper than `registerNestedFixture`
 * on purpose: a single flyout can only ever cover the root, but a chain this deep
 * is where a level clamped on top of its parents covers more than one ancestor at
 * once - the exact shape of the bug these locks exist for.
 */
async function registerDeepFixture(page) {
  await page.evaluate(() => {
    const { registry } = window.fixture;
    window.__deepRuns = [];
    registry.register({ id: 'deep-new', label: 'Insert', group: 'insert', when: () => true });
    registry.register({ id: 'deep-shapes', label: 'Shapes', parent: 'deep-new' });
    registry.register({ id: 'deep-poly', label: 'Polygons', parent: 'deep-shapes' });
    for (const [id, label] of [['deep-tri', 'Triangle'], ['deep-square', 'Square'], ['deep-penta', 'Pentagon']]) {
      registry.register({ id, label, parent: 'deep-poly', action: () => window.__deepRuns.push(id) });
    }
  });
}

/** The deep fixture's ancestor triggers, outermost first. */
const DEEP_TRIGGERS = ['deep-new', 'deep-shapes', 'deep-poly'];

/**
 * Open the whole `Insert > Shapes > Polygons` chain from a menu already up.
 *
 * The triggers are clicked programmatically (`button.click()`, not the pointer),
 * so the chain opens even from the buggy overlap these locks exist to catch: a
 * trigger physically covered by another panel is unreachable to a real click, but
 * still dispatches its own synthetic one, which is enough to open its flyout and
 * let the measurement below see that it was covered in the first place.
 */
async function openDeepChain(page) {
  for (const id of DEEP_TRIGGERS) {
    await page.evaluate((menuId) => {
      const button = document.querySelector(`[data-menu-item="${menuId}"]`);
      if (button) button.click();
    }, id);
    await frames(page, 120);
  }
}

/**
 * Every menu item on screen whose own centre does NOT resolve to itself under
 * `elementFromPoint` - one that a pointer clicking its centre would miss because
 * another panel sits on top of it. Across ALL open panels, ancestors included:
 * the innermost-only check this replaced never saw an ancestor go dark.
 */
async function unreachableItems(page) {
  return page.evaluate((selector) => {
    const buttons = Array.from(document.querySelectorAll(selector));
    const unreachable = [];
    for (const button of buttons) {
      const rect = button.getBoundingClientRect();
      const hit = document.elementFromPoint(
        Math.round(rect.left + rect.width / 2),
        Math.round(rect.top + rect.height / 2)
      );
      if (!hit || (hit !== button && !button.contains(hit))) {
        unreachable.push(button.getAttribute('data-menu-item') || button.textContent);
      }
    }
    return { total: buttons.length, unreachable };
  }, MENU_ITEM);
}

function registerFlyoutClamp(ctx) {
  test('a deep submenu chain in the corner stays inside the host, every level clickable', async () => {
    const { page, errors } = await freshPage(ctx);
    try {
      await registerDeepFixture(page);
      const host = await hostBox(page);

      // The bottom-right corner is bare (the event drawer there is inert). A chain
      // anchored to the right of its triggers cannot fit rightward here, so the
      // whole cascade flips to the left of the root rather than clamping every
      // level onto the same slot on top of its ancestors - the fix under test.
      await rightClickAt(page, { x: Math.round(host.right - 6), y: Math.round(host.bottom - 6) });
      assert.equal(await page.locator(ROOT_MENU).isVisible(), true, 'the root menu did not open in the corner');

      await openDeepChain(page);
      assert.equal(await page.locator(FLYOUT).count(), 3, 'the three-level chain did not fully open');

      // The innermost flyout sits wholly inside the host (1px tolerance for borders).
      const box = await page.locator(FLYOUT).last().boundingBox();
      assert.ok(box.x + box.width <= host.right + 1, `flyout runs ${box.x + box.width} past host right ${host.right}`);
      assert.ok(box.y + box.height <= host.bottom + 1, `flyout runs ${box.y + box.height} past host bottom ${host.bottom}`);
      assert.ok(box.x >= host.left - 1, 'the fit pushed the flyout left of the host');
      assert.ok(box.y >= host.top - 1, 'the fit pushed the flyout above the host');

      // The claim that counts, now made at EVERY open level and not just the
      // innermost: each item resolves to itself at its own centre, so no descendant
      // panel is sitting on top of an ancestor trigger. Six items across the chain -
      // the three ancestor triggers and the three leaves.
      const reach = await unreachableItems(page);
      assert.equal(reach.total, 6, `expected 6 items across the open chain, saw ${reach.total}`);
      assert.deepEqual(reach.unreachable, [], `items a pointer cannot reach: ${reach.unreachable.join(', ')}`);

      await page.keyboard.press('Escape');
      await frames(page, 120);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

/**
 * The horizontal-flip lock proper: a right-click near the LEFT, CENTRE and RIGHT
 * of the host each opens the same three-level chain, and at every one of them every
 * ancestor trigger must stay reachable at its own centre. Near the right edge the
 * chain flips left; at the centre it cascades right and the innermost level clamps
 * in-direction; near the left it cascades right with room to spare - and none of
 * those may leave a descendant panel covering the trigger a level above it.
 */
function registerAncestorReachability(ctx) {
  test('a deep chain keeps every ancestor trigger clickable at the left, centre and right', async () => {
    const { page, errors } = await freshPage(ctx);
    try {
      await registerDeepFixture(page);
      const host = await hostBox(page);
      const y = Math.round(host.top + 160);
      const positions = [
        ['near-left', Math.round(host.left + 6)],
        ['centre', Math.round(host.left + host.width / 2)],
        ['near-right', Math.round(host.right - 6)]
      ];

      for (const [label, x] of positions) {
        await rightClickAt(page, { x, y });
        assert.equal(await page.locator(ROOT_MENU).isVisible(), true, `no root menu at the ${label} position`);

        await openDeepChain(page);
        assert.equal(await page.locator(FLYOUT).count(), 3, `the chain did not fully open at the ${label} position`);

        const triggers = await page.evaluate((ids) => ids.map((id) => {
          const el = document.querySelector(`[data-menu-item="${id}"]`);
          if (!el) return { id, present: false, reachable: false };
          const r = el.getBoundingClientRect();
          const hit = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
          const item = hit && hit.closest ? hit.closest('[data-menu-item]') : null;
          return { id, present: true, reachable: Boolean(item && item.getAttribute('data-menu-item') === id) };
        }), DEEP_TRIGGERS);
        for (const t of triggers) {
          assert.ok(t.present, `at ${label}, the "${t.id}" trigger was not in the DOM`);
          assert.ok(t.reachable, `at ${label}, the ancestor trigger "${t.id}" was covered by another panel`);
        }

        // ...and nothing else on screen is covered either, ancestors or leaves.
        const reach = await unreachableItems(page);
        assert.deepEqual(reach.unreachable, [], `at ${label}, items a pointer cannot reach: ${reach.unreachable.join(', ')}`);

        // Fully collapse the chain (three flyouts, then the root) before the next.
        for (let i = 0; i < 4; i += 1) await page.keyboard.press('Escape');
        await frames(page, 120);
        assert.equal(await page.locator(ROOT_MENU).isVisible(), false, `the ${label} menu did not close`);
      }
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

function registerFlyoutKeyboard(ctx) {
  test('the keyboard opens a submenu with ArrowRight, roves it, and closes it with ArrowLeft', async () => {
    const { page, errors } = await freshPage(ctx);
    try {
      await registerNestedFixture(page);
      await rightClickAt(page, await blitPoint(page, 'card_vector'));
      assert.equal(await page.locator(ROOT_MENU).isVisible(), true, 'the root menu did not open');

      // Focus the trigger explicitly - the root also carries the blit's own z-order
      // commands, so the trigger is not necessarily the first item focus lands on.
      await page.evaluate(() => document.querySelector('[data-menu-item="nest-new"]').focus());
      await page.keyboard.press('ArrowRight');
      await frames(page, 120);

      assert.equal(await page.locator(FLYOUT).isVisible(), true, 'ArrowRight did not open the submenu');
      assert.equal(
        await page.evaluate(() => document.activeElement.getAttribute('data-menu-item')),
        'nest-rect',
        'focus did not step onto the first submenu item'
      );

      await page.keyboard.press('ArrowDown');
      assert.equal(
        await page.evaluate(() => document.activeElement.getAttribute('data-menu-item')),
        'nest-circle',
        'ArrowDown did not rove within the submenu'
      );

      await page.keyboard.press('ArrowLeft');
      await frames(page, 120);
      assert.equal(await page.locator(FLYOUT).count(), 0, 'ArrowLeft did not close the submenu');
      assert.equal(
        await page.evaluate(() => document.activeElement.getAttribute('data-menu-item')),
        'nest-new',
        'focus did not return to the trigger'
      );

      await page.keyboard.press('Escape');
      await frames(page, 120);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}

function registerFlyoutLeafRun(ctx) {
  test('clicking a submenu leaf runs its action and closes the whole chain', async () => {
    const { page, errors } = await freshPage(ctx);
    try {
      await registerNestedFixture(page);
      await rightClickAt(page, await blitPoint(page, 'card_vector'));

      await page.locator('[data-menu-item="nest-new"]').click();
      await frames(page, 120);
      assert.equal(await page.locator(FLYOUT).isVisible(), true, 'the submenu never opened');

      await page.locator('[data-menu-item="nest-circle"]').click();
      await frames(page, 150);

      assert.deepEqual(
        await page.evaluate(() => window.__nestRuns),
        ['nest-circle'],
        'the leaf action did not fire exactly once'
      );
      assert.equal(await page.locator(FLYOUT).count(), 0, 'the submenu survived the leaf action');
      assert.equal(await page.locator(ROOT_MENU).isVisible(), false, 'the root menu survived the leaf action');
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}
