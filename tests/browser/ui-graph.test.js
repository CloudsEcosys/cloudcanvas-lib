/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The graph in real Chromium, as the mind map phase 28 made it: a tree laid out
 * left to right, so no node has a place of its own to be dragged to. A node
 * dragged by its body follows the pointer over any zoom, lights the node under
 * it, and is a request: let go on another node and `onDropOn` is asked, let go
 * anywhere else and it springs back to where the layout puts it.
 *
 * Before phase 28 a node dragged to a point of its own (`onMove(id, {x, y})`),
 * which the kit applied; that is gone, and so is the test that asserted it.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadChromium, PLAYWRIGHT_MISSING, startStaticServer } from './harness.js';

const chromium = await loadChromium();
const FIXTURE = '/tests/browser/fixtures/ui-kit.html';

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('ui graph browser', { skip: 'playwright is not installed' }, () => {});
} else {
  const scope = { server: null, browser: null };
  before(async () => {
    scope.server = await startStaticServer();
    scope.browser = await chromium.launch();
  });
  after(async () => {
    await scope.browser?.close();
    await scope.server?.close();
  });

  /** A fresh page on the fixture; any page error or console error fails the test. */
  async function open(viewport = { width: 1100, height: 900 }, device = {}) {
    const page = await scope.browser.newPage({ viewport, ...device });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${scope.server.url}${FIXTURE}`);
    await page.waitForFunction(() => window.ready === true);
    return { page, errors };
  }

  const onPage = (body, ...device) => () => open(...device).then(({ page, errors }) => body(page).then(() => assert.deepEqual(errors, [])).finally(() => page.close()));
  const log = (page) => page.evaluate(() => window.log);
  const centre = (box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
  const nodeBox = (page, id) => page.locator(`.cloudcanvas-ui-graph-node[data-ui-id="${id}"]`).boundingBox();
  const near = (a, b) => Math.abs(a - b) <= 1;

  /*
   * Seen to fail on the graph of `ba0f72d` (the test as it was: a drag by 60,30 expected `['move-node', 'build', x, y]`):
   *
   *   ✖ timeline and graph: a bar drags by whole days; a node drags by the pointer over the zoom
   *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
   *       'draft' !== 'build'
   *
   * The last thing the page logged was the timeline's own move: the node dragged, asked nothing and sprang back.
   */
  test('a node dragged by the pointer follows it over the zoom and springs back; dropped on another node it asks for the drop', onPage(async (page) => {
    await page.evaluate(() => document.getElementById('graph-host').scrollIntoView({ block: 'start' }));
    await page.evaluate(() => window.zoomGraph(0.6));
    const scale = await page.evaluate(() => Number(document.querySelector('.cloudcanvas-ui-graph-world').style.getPropertyValue('--graph-k')));
    assert.equal(scale, 0.6, 'the graph is drawn zoomed out');
    const [test0, build0] = [await nodeBox(page, 'test'), await nodeBox(page, 'build')];
    await page.mouse.move(centre(test0).x, centre(test0).y);
    await page.mouse.down();
    await page.mouse.move(centre(test0).x + 60, centre(test0).y + 30, { steps: 6 });
    const held = await nodeBox(page, 'test');
    assert.ok(near(held.x, test0.x + 60) && near(held.y, test0.y + 30), `it follows the pointer by what the pointer travelled at scale ${scale}: ${JSON.stringify([test0, held])}`);
    assert.equal(await page.locator('.cloudcanvas-ui-graph-node.is-drop-target').count(), 0, 'over empty ground nothing is lit as a target');
    await page.mouse.up();
    const sprung = await nodeBox(page, 'test');
    assert.ok(near(sprung.x, test0.x) && near(sprung.y, test0.y), `let go anywhere else it is drawn where the layout puts it: ${JSON.stringify([test0, sprung])}`);
    assert.deepEqual((await log(page)).filter((entry) => entry[0] === 'drop-on'), [], 'and nothing was asked');
    await page.mouse.move(centre(test0).x, centre(test0).y);
    await page.mouse.down();
    await page.mouse.move(centre(build0).x, centre(build0).y, { steps: 6 });
    assert.equal(await page.locator('.cloudcanvas-ui-graph-node.is-drop-target').getAttribute('data-ui-id'), 'build', 'the node under the pointer is lit as the target');
    await page.mouse.up();
    assert.deepEqual((await log(page)).filter((entry) => entry[0] === 'drop-on'), [['drop-on', 'test', 'build']], 'let go on it, the drop is asked for, node and target');
    const back = await nodeBox(page, 'test');
    assert.ok(near(back.x, test0.x) && near(back.y, test0.y), 'the kit applied nothing: it is still where the layout puts it, until the next model says otherwise');
  }));

  /*
   * Seen to fail with the dimming of `ba0f72d` (zoom 0.2, a finger, `Build` selected so `Test` is dimmed):
   *
   *   AssertionError [ERR_ASSERTION]: each is found at its own middle: [{"drawn":[42,14],"middle":false,"around":[false,false,true,false],"below":1}, ...]
   *
   * Dimming is `opacity`, which makes the node a stacking context: its `::after` reach cannot go under the node drawn before it.
   */
  test('under a finger a node dimmed by a selection reaches no further than it is drawn, so it never covers the node drawn before it', onPage(async (page) => {
    await page.evaluate(() => window.zoomGraph(0.2));
    await page.locator('.cloudcanvas-ui-graph-node[data-ui-id="build"]').click({ force: true });
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('.cloudcanvas-ui-graph-node')].map((node) => node.className.includes('is-dim'))), [false, false, true], 'Test is dimmed');
    const reach = (id) => page.evaluate((one) => window.reachOf(one), `#graph-host [data-ui-id="${id}"]`);
    const [build, dimmed] = [await reach('build'), await reach('test')];
    assert.ok(build.middle && dimmed.middle, `each is found at its own middle: ${JSON.stringify([build, dimmed])}`);
  }, { width: 390, height: 844 }, { hasTouch: true, isMobile: true }));
}
