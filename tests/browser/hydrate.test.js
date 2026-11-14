/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Adoption suite: hand-written HTML becomes a live board, in a real browser.
 *
 * The core's unit tests prove the scan against happy-dom - which runs no layout,
 * no compositor and no input. Everything that makes adoption a *feature* rather
 * than a graph edit is therefore only answerable here:
 *
 *   - the authored nodes are still on screen, with a box, after the board has
 *     laid hands on them (a re-created heading reads identically in a DOM
 *     assertion; a deleted one does not have a bounding box),
 *   - an adopted element drags under a real pointer, which needs the drag add-on
 *     on the element and the transform its port writes,
 *   - a real click reaches an adopted blit's traits and focuses it,
 *   - a data write never touches authored markup, and `retype` replaces it
 *     with a widget in place, and
 *   - the root's scan turns DOM nesting into blit nesting, with the child laid out
 *     in the parent's scope well and both halves still draggable.
 *
 * The fixture (`fixtures/hydrate.html`) creates no content in JavaScript.
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

/** The adoption fixture, as the static server addresses it. */
const HYDRATE_FIXTURE = '/tests/browser/fixtures/hydrate.html';

/** How far a drag travels, and the tolerance a real pointer path earns. */
const DRAG = { dx: 60, dy: 40, tolerance: 4 };

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser adoption suite', { skip: 'playwright is not installed' }, () => {});
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

  registerAdopt(ctx);
  registerHydrate(ctx);
}

/**
 * A fresh fixture page with a settled first frame, and its error log.
 *
 * Every check takes its own page: a drag moves a blit and a click moves the
 * camera, and neither should be visible to the next claim.
 */
async function freshPage(ctx) {
  const opened = await openFixturePage(ctx.browser, ctx.server.url, HYDRATE_FIXTURE);
  await frames(opened.page, 300);
  return opened;
}

/** A blit's local placement and size in force, by id. */
function placementOf(page, id) {
  return page.evaluate((blitId) => {
    const found = window.cloudcanvas.find(blitId);
    return { x: found.x, y: found.y, width: found.size.w, height: found.size.h };
  }, id);
}

/** Press, travel, release - a real pointer stream, not a synthesized event. */
async function dragBy(page, selector, { dx, dy }) {
  const box = await page.locator(selector).boundingBox();
  assert.ok(box, `${selector} has no box to grab`);

  await page.mouse.move(box.x + box.width / 2, box.y + 8);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + dx, box.y + 8 + dy, { steps: 8 });
  await page.mouse.up();
  await frames(page, 150);
}

/** Assert a blit moved by exactly the pointer's travel. */
function assertMovedBy(before, after, id) {
  assert.ok(Math.abs((after.x - before.x) - DRAG.dx) < DRAG.tolerance, `${id} moved ${after.x - before.x} in x, expected ${DRAG.dx}`);
  assert.ok(Math.abs((after.y - before.y) - DRAG.dy) < DRAG.tolerance, `${id} moved ${after.y - before.y} in y, expected ${DRAG.dy}`);
}

/* ------------------ ADOPT ------------------ */

function registerAdopt(ctx) {
  test('adopt - the authored nodes are the blit\'s content, still on screen', async () => {
    const { page, errors } = await freshPage(ctx);

    const state = await page.evaluate(() => {
      const element = document.querySelector('[data-blit][id="adopted_card"]');
      const heading = document.getElementById('adopt-heading');
      return {
        blitId: window.__adopted,
        isBlit: element.matches('[data-blit]:not([data-blit-root])'),
        authoredClassKept: element.classList.contains('authored'),
        // The board paints no card surface over an untyped element: the author's own background stands.
        background: getComputedStyle(element).backgroundColor,
        headingOwner: heading.parentElement === element,
        onPlane: element.parentElement.hasAttribute('data-blit-plane'),
        headingText: heading.textContent,
        bodyText: document.getElementById('adopt-body').textContent,
        transform: element.style.transform,
        visible: window.getComputedStyle(heading).display !== 'none'
      };
    });

    assert.equal(state.blitId, 'adopted_card');
    assert.equal(state.isBlit, true, 'the adopted element never became a blit');
    assert.equal(state.authoredClassKept, true, "the caller's own class was taken away");
    assert.equal(state.background, 'rgb(30, 41, 59)', 'the board painted over the author\'s surface');
    assert.equal(state.headingOwner, true, 'the authored heading is no longer the blit\'s own child');
    assert.equal(state.onPlane, true, 'the adopted element never reached the plane');
    assert.equal(state.headingText, 'Adopted By Hand');
    assert.equal(state.bodyText, 'One call, one element, no markup re-created.');
    assert.match(state.transform, /translate3d\(520px, 80px/);
    assert.equal(state.visible, true);

    // A node deleted and re-made would still read the same above; a laid-out
    // box is the claim that cannot be faked by a copy.
    const headingBox = await page.locator('#adopt-heading').boundingBox();
    assert.ok(headingBox.width > 0 && headingBox.height > 0, 'the authored heading has no box');

    assert.deepEqual(errors, []);
    await page.close();
  });

  test('adopt - a real drag moves the adopted blit by the pointer delta', async () => {
    const { page, errors } = await freshPage(ctx);

    const before = await placementOf(page, 'adopted_card');
    await dragBy(page, '[data-blit][id="adopted_card"]', DRAG);
    const after = await placementOf(page, 'adopted_card');

    assertMovedBy(before, after, 'adopted_card');
    // The markup travelled with it rather than being re-rendered at the new spot.
    assert.equal(await page.locator('#adopt-heading').textContent(), 'Adopted By Hand');
    assert.deepEqual(errors, []);
    await page.close();
  });

  test('adopt - a press reaches the adopted blit\'s traits and a click focuses it', async () => {
    const { page, errors } = await freshPage(ctx);
    const box = await page.locator('[data-blit][id="adopted_card"]').boundingBox();

    await page.mouse.move(box.x + box.width / 2, box.y + 8);
    await page.mouse.down();
    const pressed = await page.evaluate(() => document.getElementById('adopted_card').classList.contains('is-dragging'));
    await page.mouse.up();
    await frames(page, 400);

    assert.equal(pressed, true, 'the drag add-on never saw the press');

    const settled = await page.evaluate(() => ({
      focused: document.querySelector('[data-blit].is-focused')?.id ?? null,
      reticle: document.querySelectorAll('[data-blit-overlay] g[data-cursor="cursor-focus"] *').length,
      selected: document.getElementById('adopted_card').classList.contains('is-selected'),
      zoomed: window.fixture.camera.scale > 1
    }));
    assert.equal(settled.focused, 'adopted_card', 'a click on adopted markup did not focus its blit');
    assert.ok(settled.reticle > 0, 'the focus cursor never drew around the adopted blit');
    assert.equal(settled.zoomed, true, 'the focus did not frame the adopted blit');
    assert.equal(settled.selected, false, 'selection is not a side effect of a click');

    // Selection is a trait of its own, and it lands on the adopted element like any other.
    const marked = await page.evaluate(() => {
      window.cloudcanvas.find('adopted_card').set({ select: { selected: true } });
      return document.getElementById('adopted_card').classList.contains('is-selected');
    });
    assert.equal(marked, true);

    assert.deepEqual(errors, []);
    await page.close();
  });

  test('adopt - a data write never touches authored markup, and retype replaces it in place', async () => {
    const { page, errors } = await freshPage(ctx);

    await page.evaluate(() => { window.cloudcanvas.find('adopted_card').set({ title: 'Overwritten', note: 'data only' }); });
    await frames(page, 300);

    const preserved = await page.evaluate(() => ({
      heading: document.getElementById('adopt-heading')?.textContent ?? null,
      body: document.getElementById('adopt-body')?.textContent ?? null,
      title: window.cloudcanvas.find('adopted_card').spec.title
    }));
    assert.deepEqual(preserved, {
      heading: 'Adopted By Hand',
      body: 'One call, one element, no markup re-created.',
      title: 'Overwritten'
    }, 'a data write reached the authored markup');

    // Giving the element up is deliberate: `retype` rebuilds the blit as a widget,
    // same id and place, and the widget renders its own contents.
    await page.evaluate(() => {
      window.fixture.retype(window.cloudcanvas.find('adopted_card'), 'card', { title: 'Now a card' });
    });
    await frames(page, 300);

    const replaced = await page.evaluate(() => {
      const card = window.cloudcanvas.find('adopted_card');
      return {
        headingGone: document.getElementById('adopt-heading') === null,
        type: card.el.getAttribute('data-type'),
        placed: [card.x, card.y],
        title: card.spec.card?.title ?? null,
        rendered: card.el.textContent.includes('Now a card')
      };
    });
    assert.deepEqual(replaced, { headingGone: true, type: 'card', placed: [520, 80], title: 'Now a card', rendered: true });

    assert.deepEqual(errors, []);
    await page.close();
  });
}

/* ------------------ HYDRATE ------------------ */

function registerHydrate(ctx) {
  test('hydrate - the marked HTML became a nested, correctly placed blit tree', async () => {
    const { page, errors } = await freshPage(ctx);

    const tree = await page.evaluate(() => {
      const app = window.cloudcanvas;
      const scope = app.find('scope_card');
      const child = app.find('child_card');
      const well = scope.el.querySelector(':scope > [data-scope]');
      return {
        hydrated: window.__hydrated,
        childOfScope: child.parent === scope,
        scopeIsTop: scope.parent === app,
        scopeXY: [scope.x, scope.y],
        childXY: [child.x, child.y],
        declaredWidths: [scope.size.w, child.size.w],
        scopeOnPlane: scope.el.parentElement.hasAttribute('data-blit-plane'),
        childInWell: child.el.parentElement === well,
        wellPopulated: well.classList.contains('cc-populated'),
        strayLeftBehind: document.querySelector('#canvas-host > #not-a-blit') !== null,
        strayIsBlit: document.getElementById('not-a-blit').matches('[data-blit]')
      };
    });

    assert.deepEqual(tree.hydrated, ['scope_card', 'child_card']);
    assert.equal(tree.childOfScope, true, 'DOM nesting did not become blit nesting');
    assert.equal(tree.scopeIsTop, true);
    // Strings out of attributes, numbers on the blit.
    assert.deepEqual(tree.scopeXY, [60, 80]);
    assert.deepEqual(tree.childXY, [24, 28]);
    assert.deepEqual(tree.declaredWidths, [320, 240]);
    assert.equal(tree.scopeOnPlane, true);
    assert.equal(tree.childInWell, true, 'the child is not laid out in the scope well');
    assert.equal(tree.wellPopulated, true, 'the scope well never learned it was occupied');
    assert.equal(tree.strayLeftBehind, true, 'unmarked markup was moved onto the plane');
    assert.equal(tree.strayIsBlit, false);

    assert.deepEqual(errors, []);
    await page.close();
  });

  test('hydrate - every authored node is still rendered, at a real size', async () => {
    const { page, errors } = await freshPage(ctx);

    const texts = await page.evaluate(() => ({
      scopeHeading: document.querySelector('[data-blit][id="scope_card"] > #scope-heading').textContent,
      scopeBody: document.getElementById('scope-body').textContent,
      childHeading: document.querySelector('[data-blit][id="child_card"] > #child-heading').textContent,
      childBody: document.getElementById('child-body').textContent
    }));

    assert.equal(texts.scopeHeading, 'Quarterly Review');
    assert.equal(texts.scopeBody, 'Written in HTML before CloudCanvas ever loaded.');
    assert.equal(texts.childHeading, 'Line Item');
    assert.equal(texts.childBody, 'Nested markup, nested blit.');

    for (const selector of ['#scope-heading', '#scope-body', '#child-heading', '#child-body']) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(box && box.width > 0 && box.height > 0, `${selector} is not laid out`);
    }

    assert.deepEqual(errors, []);
    await page.close();
  });

  test('hydrate - both hydrated blits drag under a real pointer', async () => {
    const { page, errors } = await freshPage(ctx);

    const childBefore = await placementOf(page, 'child_card');
    await dragBy(page, '[data-blit][id="child_card"]', DRAG);
    const childAfter = await placementOf(page, 'child_card');
    assertMovedBy(childBefore, childAfter, 'child_card');

    // The parent is grabbed by its own heading, which is outside the scope well.
    const parentBefore = await placementOf(page, 'scope_card');
    await dragBy(page, '#scope-heading', DRAG);
    const parentAfter = await placementOf(page, 'scope_card');
    assertMovedBy(parentBefore, parentAfter, 'scope_card');

    // A parent drag is not a child drag: the child's own coordinates are local.
    const childUnmoved = await placementOf(page, 'child_card');
    assert.equal(childUnmoved.x, childAfter.x);
    assert.equal(childUnmoved.y, childAfter.y);

    assert.deepEqual(errors, []);
    await page.close();
  });
}
