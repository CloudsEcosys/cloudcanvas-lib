/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Flow-child anchor: the claim only a real browser settles - that a blit's
 * `bounds`, and the connector drawn from them, track where flex actually renders
 * a flow child rather than the child's now-irrelevant declared x/y, both at rest
 * and after a sibling reflows it.
 *
 * happy-dom runs no layout, so the layout add-on's unit tests can only prove the
 * coordinate substitution against declared offsets. What is proven here, with
 * real flex layout and a live connector:
 *
 *   - a flow child's `bounds` centre coincides with its rendered box, and the
 *     connector anchored to it starts on that same live box - not ~500px low
 *     where its deliberately-wrong declared y would put it,
 *   - growing an earlier sibling pushes the flow child down, and both its bounds
 *     and its connector follow the move, while its declared y never changes (the
 *     direct proof the bounds read live layout, not the declared position), and
 *   - the connector's own source endpoint stays welded to the reported centre
 *     across the reflow.
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

const FIXTURE = '/tests/browser/fixtures/flow-anchor.html';

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser flow-anchor suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

/* ------------------ PROBES ------------------ */

/**
 * Everything a flow child's anchor claim is measured against, read off the live
 * page: its rendered box centre, the centre its `bounds` report, its declared y,
 * and the connector's source endpoint.
 */
const READ = (id) => {
  const found = window.cloudcanvas.find(id);
  const rect = found.el.getBoundingClientRect();
  const host = window.cloudcanvas.el.getBoundingClientRect();
  const { x, y, w, h } = found.bounds;

  const path = document.querySelector(`svg[data-blit-svg] g[data-trait="connectable"] path[data-cc-key="${id}->anchor"]`);
  let source = null;
  if (path) {
    const match = /^M\s+([-\d.]+)[ ,]+([-\d.]+)/.exec(path.getAttribute('d') || '');
    if (match) source = { x: parseFloat(match[1]), y: parseFloat(match[2]) };
  }

  return {
    rectCenter: { x: rect.left - host.left + rect.width / 2, y: rect.top - host.top + rect.height / 2 },
    globalCenter: { x: x + w / 2, y: y + h / 2 },
    globalBox: { minX: x, maxX: x + w, minY: y, maxY: y + h },
    declaredY: found.y,
    connectorSource: source
  };
};

const readOf = (page, id) => page.evaluate(READ, id);
const growTop = (page, height) => page.evaluate((h) => { window.cloudcanvas.find('col_top').set({ h }); }, height);

function registerSuite(launcher) {
  const ctx = { server: null, browser: null, page: null, errors: [] };

  before(async () => {
    ctx.server = await startStaticServer();
    ctx.browser = await launcher.launch();

    const opened = await openFixturePage(ctx.browser, ctx.server.url, FIXTURE);
    ctx.page = opened.page;
    ctx.errors = opened.errors;

    await ctx.page.waitForSelector('[data-blit][id="col_bottom"]', { timeout: 5000 });
    await ctx.page.waitForSelector('[data-blit][id="anchor"]', { timeout: 5000 });
    await frames(ctx.page, 400);
  });

  after(async () => {
    if (ctx.browser) await ctx.browser.close();
    if (ctx.server) await ctx.server.close();
  });

  registerAtRest(ctx);
  registerReflow(ctx);

  test('no page errors were reported for the whole flow-anchor page', () => {
    assert.deepEqual(ctx.errors, []);
  });
}

/* ------------------ AT REST ------------------ */

function registerAtRest(ctx) {
  test('a flow child reports the bounds it actually renders at, and its connector starts there', async () => {
    const bottom = await readOf(ctx.page, 'col_bottom');

    // The reported global centre coincides with the rendered box (a constant host
    // offset aside, captured and re-checked in the reflow test).
    assert.ok(
      Math.abs(bottom.globalCenter.y - bottom.rectCenter.y) <= 2,
      `global centre y ${bottom.globalCenter.y} did not match rendered ${bottom.rectCenter.y}`
    );
    assert.ok(
      Math.abs(bottom.globalCenter.x - bottom.rectCenter.x) <= 2,
      `global centre x ${bottom.globalCenter.x} did not match rendered ${bottom.rectCenter.x}`
    );

    // ...which is nothing like the declared y (500) it was given: a bound summed
    // from declared positions would put this child's centre well past 500, flex
    // puts it near the top.
    assert.equal(bottom.declaredY, 500, 'the fixture\'s declared y was expected to stay a misleading 500');
    assert.ok(
      bottom.globalCenter.y < 400,
      `the flow child bounds still tracked its declared y (centre y ${bottom.globalCenter.y})`
    );

    // The connector's source endpoint is welded to that reported box: on a face, level with its centre.
    assert.ok(bottom.connectorSource, 'no connector path was drawn from the flow child');
    const { connectorSource: at, globalBox: box, globalCenter: centre } = bottom;
    const onVerticalFace = (Math.abs(at.x - box.minX) <= 1 || Math.abs(at.x - box.maxX) <= 1) && Math.abs(at.y - centre.y) <= 1;
    const onHorizontalFace = (Math.abs(at.y - box.minY) <= 1 || Math.abs(at.y - box.maxY) <= 1) && Math.abs(at.x - centre.x) <= 1;
    assert.ok(
      onVerticalFace || onHorizontalFace,
      `the connector started at ${JSON.stringify(at)}, not on a face of the reported box ${JSON.stringify(box)}`
    );
  });
}

/* ------------------ AFTER A SIBLING REFLOW ------------------ */

function registerReflow(ctx) {
  test('growing an earlier sibling moves the flow child, and its bounds and connector follow', async () => {
    const before = await readOf(ctx.page, 'col_bottom');
    // The constant offset between canvas-reported bounds and the on-screen box.
    const offsetY = before.globalCenter.y - before.rectCenter.y;

    // Grow the top child by 80px: a column re-lays the bottom child that much lower.
    await growTop(ctx.page, 140);
    await frames(ctx.page, 400);

    const after = await readOf(ctx.page, 'col_bottom');

    // The child genuinely moved down on screen...
    assert.ok(
      after.rectCenter.y - before.rectCenter.y > 60,
      `the bottom child did not move down (delta ${after.rectCenter.y - before.rectCenter.y}px)`
    );
    // ...and its declared y never changed - so the tracking is the bounds reading
    // live layout, not the declared position being updated behind the scenes.
    assert.equal(after.declaredY, 500, 'the declared y moved; the test no longer isolates the flow origin');

    // The reported global bounds tracked the live move (same constant offset).
    assert.ok(
      Math.abs((after.globalCenter.y - after.rectCenter.y) - offsetY) <= 2,
      `global bounds drifted from the rendered box after reflow `
        + `(was ${offsetY}, now ${after.globalCenter.y - after.rectCenter.y})`
    );

    // ...and the connector followed to the new source point.
    assert.ok(after.connectorSource, 'the connector vanished after the reflow');
    assert.ok(
      Math.abs(after.connectorSource.y - after.globalCenter.y) <= 1,
      `the connector source y ${after.connectorSource.y} lagged the flow child `
        + `centre ${after.globalCenter.y} after reflow`
    );
    assert.ok(
      after.connectorSource.y - before.connectorSource.y > 60,
      `the connector did not move with the flow child `
        + `(delta ${after.connectorSource.y - before.connectorSource.y}px)`
    );
  });
}
