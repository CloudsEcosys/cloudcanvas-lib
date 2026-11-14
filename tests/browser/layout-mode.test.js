/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Flow-layout acceptance: the claims only a real browser settles, because every
 * one of them turns on live flex/grid layout - which happy-dom has none of, so
 * the layout add-on's unit tests can only prove the class toggles, the transform
 * suppression, and the ordering primitive.
 *
 * What is proven here, with real layout and a real mouse:
 *
 *   - a `row` container lays its children out left-to-right at their *rendered*
 *     positions, in document order, not at their (now irrelevant) x/y - the
 *     fixture scrambles the declared order precisely so a pass can only be
 *     flow doing the work,
 *   - flipping a container from `free` to `row` re-flows its existing children
 *     with no leftover transform: a stale one would shift a `position: relative`
 *     child right, so the children are checked contiguous from the well's left,
 *   - dragging one flow child past a sibling reorders them (`insertionBefore`
 *     and `reorder` on the drop), verified by the rendered order after it,
 *   - a `grid` container lays four children into two distinct columns and rows, and
 *   - a flow container places its children and never sizes them: children with no
 *     size of their own keep their natural box, and the well is sized by the flow
 *     rather than by the extent of positions the children no longer render at.
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

const LAYOUT_FIXTURE = '/tests/browser/fixtures/layout-mode.html';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser layout suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

function registerSuite(launcher) {
  const ctx = { server: null, browser: null, page: null, errors: [] };

  before(async () => {
    ctx.server = await startStaticServer();
    ctx.browser = await launcher.launch();

    const opened = await openFixturePage(ctx.browser, ctx.server.url, LAYOUT_FIXTURE);
    ctx.page = opened.page;
    ctx.errors = opened.errors;

    await ctx.page.waitForSelector('[data-blit][id="row_container"]', { timeout: 5000 });
    await ctx.page.waitForSelector('[data-blit][id="grid_container"]', { timeout: 5000 });
    await ctx.page.waitForSelector('[data-blit][id="size_container"]', { timeout: 5000 });
    await frames(ctx.page, 400);
  });

  after(async () => {
    if (ctx.browser) await ctx.browser.close();
    if (ctx.server) await ctx.server.close();
  });

  registerRow(ctx);
  registerSwitch(ctx);
  registerReorder(ctx);
  registerGrid(ctx);
  registerNaturalSize(ctx);

  test('no page errors were reported for the whole layout page', () => {
    assert.deepEqual(ctx.errors, []);
  });
}

/* ------------------ PROBES ------------------ */

/**
 * A container's flow, read off the live page: the DOM order of its children, the
 * root's `blits` order, the scope well box, and each child's rendered rect and
 * computed transform - everything the claims are measured against.
 */
const READ_LAYOUT = (id) => {
  const container = window.cloudcanvas.find(id);
  const scope = container.el.querySelector(':scope > [data-scope]');

  const domIds = Array.from(scope.children)
    .filter((el) => el.matches('[data-blit]:not([data-blit-root])'))
    .map((el) => el.getAttribute('id'));
  const modelIds = container.blits.map((child) => child.el.id);

  const wellBox = scope.getBoundingClientRect();
  const rects = {};
  for (const cid of domIds) {
    const el = scope.querySelector(`[data-blit][id="${cid}"]`);
    const b = el.getBoundingClientRect();
    rects[cid] = {
      left: b.left, top: b.top, right: b.right, bottom: b.bottom,
      width: b.width, height: b.height,
      cx: b.left + b.width / 2, cy: b.top + b.height / 2,
      transform: getComputedStyle(el).transform,
      flowChild: el.classList.contains('is-flow-child')
    };
  }

  return {
    domIds,
    modelIds,
    well: {
      left: wellBox.left,
      top: wellBox.top,
      width: wellBox.width,
      height: wellBox.height,
      // What the scope-well pass wrote, as distinct from what the box came out at.
      minHeight: scope.style.minHeight,
      alignItems: getComputedStyle(scope).alignItems
    },
    rects
  };
};

const layoutOf = (page, id) => page.evaluate(READ_LAYOUT, id);
const setLayoutMode = (page, id, mode) =>
  page.evaluate((args) => { window.cloudcanvas.find(args.id).set({ layout: args.mode }); }, { id, mode });

/** Left edges of consecutive children are strictly increasing and non-overlapping. */
function strictlyLeftToRight(order, rects) {
  for (let i = 1; i < order.length; i += 1) {
    const prev = rects[order[i - 1]];
    const curr = rects[order[i]];
    if (!(curr.left >= prev.right - 1)) return false;
  }
  return true;
}

/* ------------------ ROW ------------------ */

function registerRow(ctx) {
  test('a row container lays its children left-to-right in document order', async () => {
    const layout = await layoutOf(ctx.page, 'row_container');

    // Document order is the order they were added: a, b, c - never the reversed
    // x order the fixture placed them at.
    assert.deepEqual(layout.domIds, ['row_a', 'row_b', 'row_c'], 'the DOM order is not the add order');
    assert.deepEqual(layout.modelIds, ['row_a', 'row_b', 'row_c'], 'the blits order is not the add order');

    // Every child is a flow child, and none carries a transform - flex places them.
    for (const id of layout.domIds) {
      assert.equal(layout.rects[id].flowChild, true, `${id} is not a flow child`);
      assert.equal(layout.rects[id].transform, 'none', `${id} kept a transform under flow`);
    }

    // Rendered left-to-right in that order, contiguous, no overlap - the whole
    // point: getBoundingClientRect order matches document order, not declared x/y.
    assert.ok(
      strictlyLeftToRight(layout.domIds, layout.rects),
      'the row children did not render left-to-right without overlap'
    );
    // ...and stacked on one baseline, as a row does.
    assert.ok(
      Math.abs(layout.rects.row_a.top - layout.rects.row_c.top) <= 1,
      'the row children are not on a single baseline'
    );
  });
}

/* ------------------ FREE -> ROW ------------------ */

function registerSwitch(ctx) {
  test('switching a container from free to row re-flows its children with no leftover transform', async () => {
    // Before: free layout, children placed by their transforms (staggered right).
    const before = await layoutOf(ctx.page, 'switch_container');
    assert.equal(before.rects.switch_a.flowChild, false, 'a free child was already a flow child');
    assert.notEqual(before.rects.switch_a.transform, 'none', 'a free child carried no transform');

    await setLayoutMode(ctx.page, 'switch_container', 'row');
    await frames(ctx.page, 200);

    const after = await layoutOf(ctx.page, 'switch_container');

    // Every child is now a flow child with its transform cleared - a lingering one
    // would push a `position: relative` child right of where flex puts it.
    for (const id of after.domIds) {
      assert.equal(after.rects[id].flowChild, true, `${id} did not become a flow child`);
      assert.equal(after.rects[id].transform, 'none', `${id} kept a stale transform after the switch`);
    }

    // Laid out left-to-right, contiguous, no overlap.
    assert.ok(
      strictlyLeftToRight(after.domIds, after.rects),
      'the switched children overlap or are out of order'
    );

    // The first child sits at the well's left edge, not shifted right by the ~220px
    // transform it carried as a free child - the direct proof the stale one is gone.
    assert.ok(
      after.rects.switch_a.left - after.well.left < 40,
      `the first child landed ${after.rects.switch_a.left - after.well.left}px from the well's left`
    );
  });
}

/* ------------------ DRAG-TO-REORDER ------------------ */

function registerReorder(ctx) {
  test('dragging one flow child past another reorders them', async () => {
    const before = await layoutOf(ctx.page, 'row_container');
    assert.deepEqual(before.domIds, ['row_a', 'row_b', 'row_c'], 'the reorder test expects the a,b,c order');

    const a = before.rects.row_a;
    const b = before.rects.row_b;

    // Press on row_a, drag it past row_b's midpoint (into b's right half, still over
    // b), and release: row_a should land after row_b -> b, a, c.
    const dropX = b.left + b.width * 0.75;
    const dropY = b.cy;
    await ctx.page.mouse.move(a.cx, a.cy);
    await ctx.page.mouse.down();
    await ctx.page.mouse.move((a.cx + dropX) / 2, dropY, { steps: 6 });
    await ctx.page.mouse.move(dropX, dropY, { steps: 6 });
    await ctx.page.mouse.up();
    await frames(ctx.page, 300);

    const after = await layoutOf(ctx.page, 'row_container');
    assert.deepEqual(after.domIds, ['row_b', 'row_a', 'row_c'], 'the drag did not reorder the DOM');
    assert.deepEqual(after.modelIds, ['row_b', 'row_a', 'row_c'], 'the drag did not reorder the blits');

    // ...and the new order is what actually renders, left-to-right.
    assert.ok(
      strictlyLeftToRight(after.domIds, after.rects),
      'the reordered row does not render in its new order'
    );
    assert.ok(
      after.rects.row_b.left < after.rects.row_a.left,
      'row_b did not render left of row_a after the reorder'
    );
  });
}

/* ------------------ GRID ------------------ */

function registerGrid(ctx) {
  test('a grid container lays four children into distinct rows and columns', async () => {
    const layout = await layoutOf(ctx.page, 'grid_container');
    assert.equal(layout.domIds.length, 4, 'the grid does not hold four children');

    const round = (n) => Math.round(n / 4) * 4;
    const lefts = new Set(layout.domIds.map((id) => round(layout.rects[id].left)));
    const tops = new Set(layout.domIds.map((id) => round(layout.rects[id].top)));

    // A real 2D grid: more than one column and more than one row. A template-less
    // grid would be a single column (one distinct left), which this rejects.
    assert.ok(lefts.size >= 2, `the grid has only ${lefts.size} distinct column(s)`);
    assert.ok(tops.size >= 2, `the grid has only ${tops.size} distinct row(s)`);

    // Four children across two columns and two rows are four distinct cells.
    const cells = new Set(
      layout.domIds.map((id) => `${round(layout.rects[id].left)},${round(layout.rects[id].top)}`)
    );
    assert.equal(cells.size, 4, 'the grid children are not in four distinct cells');
  });
}

/* ------------------ SIZE: PLACED, NEVER SIZED ------------------ */

/**
 * A flow container decides where its children sit and nothing else.
 *
 * Two separate defaults conspire against that, which is why this is checked on
 * children given no width or height at all - every other container in the fixture
 * states both, and a stated size hides them completely:
 *
 *   - the scope well is sized from its children's extent, and a flow child's
 *     declared y is where it was *before* the flow took it over - so the well
 *     would be written a min-height measured from a position nothing renders
 *     at (in the builder: a drop point far down the container), and
 *   - flex and grid stretch on the cross axis by default, so every child would
 *     then grow to fill that inflated well - and the read phase would measure
 *     the imposed height straight back into the blit, so the next child added
 *     inflates the extent further. A ratchet, not a one-off overshoot.
 */
function registerNaturalSize(ctx) {
  test('a flow container places its children and never sizes them', async () => {
    const layout = await layoutOf(ctx.page, 'size_container');
    assert.deepEqual(layout.domIds, ['size_a', 'size_b', 'size_c']);

    // The well is left to the flow: no extent-measured min-height is written on it.
    assert.equal(layout.well.minHeight, '',
      `a flow well was written min-height ${layout.well.minHeight} from its children's stale extent`);
    assert.equal(layout.well.alignItems, 'flex-start', 'the row well did not hold its children to the start edge');

    // Each child kept the natural height of one line of card, nowhere near the
    // ~200px+ the declared extent would have inflated the well to.
    const heights = layout.domIds.map((id) => layout.rects[id].height);
    for (const [index, height] of heights.entries()) {
      assert.ok(height > 0 && height < 120,
        `${layout.domIds[index]} rendered ${height.toFixed(1)}px tall - it was stretched, not placed`);
    }
    assert.ok(Math.max(...heights) - Math.min(...heights) <= 1,
      'the children of one row came out different heights');

    // ...and the well is that tall, plus its own padding - sized by the flow.
    assert.ok(layout.well.height <= Math.max(...heights) + 24,
      `the well is ${layout.well.height.toFixed(1)}px around ${Math.max(...heights).toFixed(1)}px children`);
  });
}
