/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The graph on a phone, in real Chromium: a finger on the fold pill folds, a
 * finger on the link handle - outside the node, there for the node that is
 * selected - links.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadChromium, PLAYWRIGHT_MISSING, startStaticServer } from './harness.js';

const chromium = await loadChromium();
const FIXTURE = '/tests/browser/fixtures/ui-graph.html';
const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('ui graph phone browser', { skip: 'playwright is not installed' }, () => {});
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

  /** A fresh page on the fixture (`query` picks its map); any page error or console error fails the test. */
  async function open(query = '', device = PHONE) {
    const page = await scope.browser.newPage(device);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${scope.server.url}${FIXTURE}${query}`);
    await page.waitForFunction(() => window.ready === true);
    return { page, errors };
  }

  const onPage = (body, query, device) => () => open(query, device).then(({ page, errors }) => body(page).then(() => assert.deepEqual(errors, [])).finally(() => page.close()));
  const log = (page) => page.evaluate(() => window.log);

  /**
   * What a finger finds on node `id`: its box, what is under the middle of its fold pill, and the box the link handle's
   * reach covers along the node's middle line and down the line through the middle of that reach (null: none).
   */
  const fingerOn = (page, id) => page.evaluate((nodeId) => {
    const node = document.querySelector(`.cloudcanvas-ui-graph-node[data-ui-id="${nodeId}"]`);
    const box = node.getBoundingClientRect();
    const pill = node.querySelector('.cloudcanvas-ui-graph-toggle').getBoundingClientRect();
    const [cx, cy] = [pill.left + pill.width / 2, pill.top + pill.height / 2];
    const found = document.elementFromPoint(cx, cy);
    const own = [[cx, cy], [pill.left + 3, cy], [pill.right - 3, cy], [cx, pill.top + 3], [cx, pill.bottom - 3]]
      .every(([x, y]) => document.elementFromPoint(x, y)?.closest('.cloudcanvas-ui-graph-toggle'));
    const isHandle = (x, y) => Boolean(document.elementFromPoint(x, y)?.closest('.cloudcanvas-ui-graph-handle'));
    const span = (from, to, test) => {
      let first = null;
      let last = null;
      for (let at = from; at <= to; at += 0.5) if (test(at)) { first ??= at; last = at; }
      return first === null ? null : [first, last];
    };
    const y = box.top + box.height / 2;
    const across = span(box.right - 40, box.right + 80, (x) => isHandle(x, y));
    const down = across && span(y - 40, y + 40, (py) => isHandle((across[0] + across[1]) / 2, py));
    return { node: [box.left, box.right, box.top, box.bottom], pill: [pill.left + pill.width / 2, pill.top + pill.height / 2],
      middle: found?.closest('.cloudcanvas-ui-graph-toggle') && own ? 'the pill' : found?.className ?? null, handle: across && { left: across[0], right: across[1], height: down[1] - down[0] } };
  }, id);

  /** Put a finger down at `from`, hold it until it may drag, carry it to `to` and lift it. */
  async function touchDrag(page, from, to) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
    await page.waitForTimeout(450);
    for (let step = 1; step <= 10; step += 1) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from.x + ((to.x - from.x) * step) / 10, y: from.y + ((to.y - from.y) * step) / 10 }] });
      await page.waitForTimeout(30);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }

  /*
   * Seen to fail on the graph of `fc5c778` (390px wide, a finger, `onToggle` and `onConnect` given; scale 1, `plan` with its pill):
   *
   *   ✖ fold pill: under a finger the pill is the node's own - a tap on its middle folds - and the link handle's reach lies outside the node, for the node that is selected
   *     AssertionError [ERR_ASSERTION]: 1: a finger on the middle of the fold pill finds the pill: 'cloudcanvas-ui-graph-handle'
   *       + actual - expected
   *       + 'cloudcanvas-ui-graph-handle'
   *       - 'the pill'
   *
   * The handle's 44px reach was centred on its dot, which is centred on the node's right edge: 22px of it lay over the node and
   * covered the pill, a tap on whose middle folded nothing.
   */
  test('fold pill: under a finger the pill is the node\'s own - a tap on its middle folds - and the link handle\'s reach lies outside the node, for the node that is selected', onPage(async (page) => {
    assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), true);
    for (const scale of [1, 0.6]) {
      await page.mouse.move(1, 1); // the last tap leaves its node hovered
      await page.evaluate((k) => window.zoomGraph(k), scale);
      const rest = await fingerOn(page, 'plan');
      assert.equal(rest.middle, 'the pill', `${scale}: a finger on the middle of the fold pill, and on its edges, finds the pill: '${rest.middle}'`);
      if (scale === 1) assert.equal(rest.handle, null, `${scale}: a node nothing points at, selects or focuses has no link handle to find: ${JSON.stringify(rest.handle)}`);
      await page.touchscreen.tap(rest.pill[0], rest.pill[1]);
      assert.deepEqual((await log(page)).at(-1), ['toggle', 'plan', true], `${scale}: a tap on the middle of the pill folds the node`);
      await page.touchscreen.tap(rest.node[0] + 40, rest.node[2] + 14);
      assert.deepEqual((await log(page)).at(-1), ['open', 'plan'], `${scale}: a tap on a node's title selects it`);
      const selected = await fingerOn(page, 'plan');
      assert.equal(selected.middle, 'the pill', `${scale}: selected, the pill is still its own`);
      assert.ok(selected.handle && selected.handle.left >= selected.node[1] - 8, `${scale}: selected, the handle's reach starts at the node's right edge or past it (its dot is drawn over the edge, 6px of it in, 8 allowed): ${JSON.stringify(selected)}`);
      assert.ok(selected.handle.right - selected.handle.left >= 43.5 && selected.handle.height >= 43.5, `${scale}: and is a 44px target: ${JSON.stringify(selected.handle)}`);
    }
    const plan = await fingerOn(page, 'plan');
    const test0 = await fingerOn(page, 'test');
    await touchDrag(page, { x: plan.node[1], y: (plan.node[2] + plan.node[3]) / 2 }, { x: (test0.node[0] + test0.node[1]) / 2, y: (test0.node[2] + test0.node[3]) / 2 });
    assert.deepEqual((await log(page)).at(-1), ['link', 'plan', 'test'], 'dragged from the dot on the right edge to another node, it asks for the link');
  }, '?map=plan'));

  /** The view as drawn: the scale, the world's offset, and each node's margins (px) inside the viewport - left, right, top, bottom; negative where it is cut off. */
  const framed = (page) => page.evaluate(() => {
    const port = document.querySelector('.cloudcanvas-ui-graph-viewport').getBoundingClientRect();
    const world = document.querySelector('.cloudcanvas-ui-graph-world');
    const margins = (node) => { const box = node.getBoundingClientRect(); return [box.left - port.left, port.right - box.right, box.top - port.top, port.bottom - box.bottom].map(Math.round); };
    return { k: Number(world.style.getPropertyValue('--graph-k')), transform: world.style.transform,
      nodes: Object.fromEntries([...document.querySelectorAll('.cloudcanvas-ui-graph-node')].map((node) => [node.getAttribute('data-ui-id'), margins(node)])) };
  });
  const cut = (view, ids = Object.keys(view.nodes)) => ids.filter((id) => view.nodes[id].some((margin) => margin < 0));

  /*
   * Seen to fail on the graph of `f5756b2` (390px wide, the viewport 372px, no `viewport` in the model):
   *
   *   ✖ first view: the whole map fits the window down to 0.5; below that the first root stands at the left with the first level beside it
   *     AssertionError [ERR_ASSERTION]: wide: the whole tree is in the window at 0.65 or so, not cut off: scale 0.75, cut off: build,test,ship,docs
   *
   * A tree of two columns is 496px wide: it fits at 0.65; the first view took 0.75, so its right edge stood past the window's.
   *
   * It was a floor of 0.5, and the case below was written on the kit of `bdc16db`, where that tree opened at 0.66 (a title 8.5px) and a tree of four
   * columns at 0.5 (6.5px):
   *
   *   ✖ first view: readable - 0.8 or more, a title 10px - the whole map where it fits, else the first root at the left with the first level beside it
   *     AssertionError [ERR_ASSERTION]: wide: a title is 10px or more: scale 0.657258064516129
   */
  test('first view: readable - 0.8 or more, a title 10px - the whole map where it fits, else the first root at the left with the first level beside it', async () => {
    const fits = await open('?map=wide', { viewport: { width: 1200, height: 800 } });
    assert.ok((await framed(fits.page)).k >= 0.8 && cut(await framed(fits.page)).length === 0, 'a window the tree fits whole at 0.8: it is shown whole');
    await fits.page.close();
    const { page, errors } = await open('?map=wide');
    const wide = await framed(page);
    assert.ok(wide.k >= 0.8, `wide: a title is 10px or more: scale ${wide.k}`);
    assert.ok(wide.nodes.plan[0] >= 0 && wide.nodes.plan[0] <= 40 && wide.nodes.plan[2] >= 0 && wide.nodes.plan[1] >= 0, `wide: the first root stands at the left of the window, whole: ${wide.nodes.plan}`);
    assert.ok(wide.nodes.build[0] > 0 && wide.nodes.build[1] > -166, `wide: and the first level begins in the window: ${wide.nodes.build}`);
    await page.click('.cloudcanvas-ui-graph-fit');
    const all = await framed(page);
    assert.ok(all.k < wide.k && cut(all).length === 0, `Fit shows the whole tree, smaller: scale ${all.k}, cut off: ${cut(all)}`);
    await page.close();
    const deep = await open('?map=deep');
    const four = await framed(deep.page);
    assert.ok(four.k >= 0.8, `deep: four columns would need 0.3, the first view is readable: ${four.k}`);
    assert.ok(four.nodes.plan[0] >= 0 && four.nodes.plan[0] <= 40 && four.nodes.plan[2] >= 0, `the first root stands at the left of the window: ${four.nodes.plan}`);
    assert.ok(four.nodes.build[0] > 0 && four.nodes.build[0] < 372, `with the first level beside it, as far as the window goes: ${JSON.stringify(four.nodes)}`);
    await deep.page.close();
    assert.deepEqual([...errors, ...deep.errors, ...fits.errors], []);
  });

  /** What a window of the first view shows of the twenty-seven-node map: the scale, a title's size on the screen, the minimap and what it frames, and the pills' sizes. */
  const bigView = (page) => page.evaluate(() => {
    const port = document.querySelector('.cloudcanvas-ui-graph-viewport').getBoundingClientRect();
    const world = document.querySelector('.cloudcanvas-ui-graph-world');
    const k = Number(world.style.getPropertyValue('--graph-k'));
    const title = document.querySelector('.cloudcanvas-ui-graph-node-label');
    const minimap = document.querySelector('.cloudcanvas-ui-graph-minimap');
    const frame = minimap.querySelector('.cloudcanvas-ui-graph-minimap-view').getBoundingClientRect();
    const mini = minimap.getBoundingClientRect();
    const root = document.querySelector('.cloudcanvas-ui-graph-node[data-ui-id="root"]').getBoundingClientRect();
    const pill = document.querySelector('.cloudcanvas-ui-graph-node[data-ui-id="root"] .cloudcanvas-ui-graph-toggle').getBoundingClientRect();
    const outside = [...document.querySelectorAll('.cloudcanvas-ui-graph-node')].filter((node) => {
      const box = node.getBoundingClientRect();
      return box.left < port.left || box.right > port.right || box.top < port.top || box.bottom > port.bottom;
    }).length;
    return { k, title: parseFloat(getComputedStyle(title).fontSize) * k, minimap: !minimap.hidden, frameInMinimap: frame.left >= mini.left - 1 && frame.right <= mini.right + 1 && frame.width > 0,
      root: [root.left - port.left, port.right - root.right, root.top - port.top, port.bottom - root.bottom].map(Math.round), pill: [pill.width, pill.height].map((side) => Math.round(side * 10) / 10),
      outside, port: [port.width, port.height].map(Math.round) };
  });

  /*
   * Seen to fail on the graph of `bdc16db` (twenty-seven nodes, four levels, no `viewport` in the model; the whole map would need 0.4 at 1440 and 0.3 at 390):
   *
   *   ✖ first view of a big map: readable at 1440 and at 390 - a title 10px, anchored on the root, the minimap says where the view is, Fit shows all
   *     AssertionError [ERR_ASSERTION]: 1440: a title is 10px or more: {"k":0.5,"title":6.5,"minimap":true,"frameInMinimap":true,"root":[25,1295,177,175],"pill":[12,8.1],"outside":11,"port":[1424,386]}
   *
   * (The map at 0.5: the titles 6.5px, the fold pill 12x8, and 11 of the 27 nodes outside the box.)
   */
  test('first view of a big map: readable at 1440 and at 390 - a title 10px, anchored on the root, the minimap says where the view is, Fit shows all', async () => {
    for (const [name, device] of [['1440', { viewport: { width: 1440, height: 900 } }], ['390', PHONE]]) {
      const { page, errors } = await open('?map=big', device);
      const first = await bigView(page);
      assert.ok(first.title >= 10 && first.k >= 0.8, `${name}: a title is 10px or more: ${JSON.stringify(first)}`);
      assert.ok(first.root[0] >= 0 && first.root[0] <= 40 && first.root[1] >= 0 && first.root[2] >= 0 && first.root[3] >= 0, `${name}: the root stands at the left of the window, whole: ${first.root}`);
      assert.ok(first.pill[0] >= 18 && first.pill[1] >= 12, `${name}: the fold pill is drawn at four fifths of its size, not half: ${first.pill}`);
      assert.ok(first.outside > 0 && first.minimap && first.frameInMinimap, `${name}: the rest is a pan away (${first.outside} nodes out of the window) and the minimap frames the part in view`);
      await page.click('.cloudcanvas-ui-graph-fit');
      const all = await bigView(page);
      assert.ok(all.k < first.k && all.outside === 0 && !all.minimap, `${name}: Fit shows every node, smaller: ${JSON.stringify(all)}`);
      assert.deepEqual(errors, []);
      await page.close();
    }
  });

  /*
   * Seen to fail on the graph of `f5756b2`, once the reader had panned the tree out of the window and the model's nodes were replaced by a tree with none in common:
   *
   *   ✖ first view: taken once - not again for the same nodes, nor a Fit-less redraw; again for a model that replaces them; never over a viewport the model gives
   *     AssertionError [ERR_ASSERTION]: other nodes: the new tree is fitted into the window, wherever the reader had panned
   *       + actual - expected    [ - [],  [ 'x-root', 'x-one', 'x-two' ] + [ 'x-root', 'x-one', 'x-two' ]   (all three nodes cut off, none expected)
   *
   * (The second tree, of two columns, is 496px wide: taken to its first view it is at 0.8, readable, where it was fitted at 0.66, so its first level is cut
   * at 390px and the case asks for the root, at the left; on `bdc16db` that asks "at the left, readable: 0.657258064516129, 25,212,172,170".)
   */
  test('first view: taken once - not again for the same nodes, nor a Fit-less redraw; again for a model that replaces them; never over a viewport the model gives', onPage(async (page) => {
    const first = await framed(page);
    await page.locator('.cloudcanvas-ui-graph-viewport').hover();
    await page.mouse.wheel(60, 30);
    const panned = await framed(page);
    assert.notEqual(panned.transform, first.transform, 'the reader panned');
    await page.evaluate(() => window.drawGraph());
    assert.equal((await framed(page)).transform, panned.transform, 'the same nodes drawn again: the view is the reader\'s');
    await page.click('.cloudcanvas-ui-graph-fit');
    const fitted = await framed(page);
    assert.notEqual(fitted.transform, panned.transform, 'the host asks for Fit: it fits');
    await page.locator('.cloudcanvas-ui-graph-viewport').hover();
    for (let at = 0; at < 4; at += 1) await page.mouse.wheel(120, 60);
    assert.ok(cut(await framed(page)).length > 0, 'the reader has panned the tree out of the window');
    await page.evaluate(() => window.drawGraph({ nodes: window.MAPS.other.nodes, edges: window.MAPS.other.edges }));
    const replaced = await framed(page);
    assert.deepEqual([cut(replaced, ['x-root']), Object.keys(replaced.nodes)], [[], ['x-root', 'x-one', 'x-two']], 'other nodes: the new tree is taken to its first view, wherever the reader had panned: its root whole');
    assert.ok(replaced.k >= 0.8 && replaced.nodes['x-root'][0] <= 40, `at the left, readable: ${replaced.k}, ${replaced.nodes['x-root']}`);
    await page.locator('.cloudcanvas-ui-graph-viewport').hover();
    for (let at = 0; at < 4; at += 1) await page.mouse.wheel(120, 60);
    const before = await framed(page);
    await page.evaluate(() => window.drawGraph({ viewport: { x: 7, y: 9, scale: 1 }, nodes: window.MAPS.plan.nodes, edges: window.MAPS.plan.edges }));
    assert.equal((await framed(page)).transform, 'translate(7px, 9px) scale(1)', `a viewport the model gives wins over the first view, replaced nodes or not (the view was ${before.transform})`);
  }, '?map=wide'));

  /** Every edge label's box, in the order drawn, with the words it carries and how far its middle is from the curve of the edge of its kind. */
  const labelsOf = (page) => page.evaluate(() => {
    const curves = { related: document.querySelector('.cloudcanvas-ui-graph-edge.is-related'), 'depends on': document.querySelector('.cloudcanvas-ui-graph-edge.is-depends-on') };
    const nearest = (curve, [x, y]) => {
      const box = document.querySelector('.cloudcanvas-ui-graph-world').getBoundingClientRect();
      const k = Number(document.querySelector('.cloudcanvas-ui-graph-world').style.getPropertyValue('--graph-k'));
      let best = Infinity;
      for (let at = 0; at <= curve.getTotalLength(); at += 1) { const p = curve.getPointAtLength(at); best = Math.min(best, Math.hypot(box.left + p.x * k - x, box.top + p.y * k - y)); }
      return Math.round(best);
    };
    const port = document.querySelector('.cloudcanvas-ui-graph-viewport').getBoundingClientRect();
    return [...document.querySelectorAll('.cloudcanvas-ui-graph-edge-label')].map((label) => {
      const box = label.getBoundingClientRect();
      return { words: label.textContent, box: [box.left, box.top, box.right, box.bottom], inside: box.left >= port.left && box.right <= port.right && box.top >= port.top && box.bottom <= port.bottom,
        off: nearest(curves[label.textContent], [box.left + box.width / 2, box.top + box.height / 2]) };
    });
  });
  const touching = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

  /*
   * Seen to fail on the graph of `f5756b2` (390px wide; the first and the last of four siblings linked 'related', the middle two 'depends on'):
   *
   *   ✖ edge labels: each stands on its own edge and no two touch, where the edges run side by side
   *     AssertionError [ERR_ASSERTION]: 'related' and 'depends on' are apart: [[450,276,476,285],[418,276,461,285]]
   *       true !== false
   *
   * Both curves run out to the right of the column and their middles stand at one height: one label was printed over the other.
   */
  test('edge labels: each stands on its own edge and no two touch, where the edges run side by side', onPage(async (page) => {
    const labels = await labelsOf(page);
    assert.deepEqual(labels.map(({ words }) => words), ['related', 'depends on']);
    const [first, second] = labels;
    assert.equal(touching(first.box, second.box), false, `'related' and 'depends on' are apart: ${JSON.stringify(labels.map(({ box }) => box.map(Math.round)))}`);
    assert.ok(labels.every(({ off }) => off <= 3), `and each is still on its own edge (px from the curve to the middle of the label): ${labels.map(({ off }) => off)}`);
    await page.click('.cloudcanvas-ui-graph-fit');
    assert.deepEqual((await labelsOf(page)).filter(({ inside }) => !inside).map(({ words }) => words), [], 'and Fit has room for both, whole (the first view is readable, so it need not hold them)');
  }, '?map=labels'));

  /*
   * Seen to fail on the graph of `b954700`, which dropped a selection it could not draw and, told it again, took it for nothing new:
   *
   *   ✖ a selection named before its node is drawn is drawn, lit and the rest dim, when a model draws the node
   *     AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
   *       actual: [ [ 'plan', null, '1' ], [ 'build', null, '1' ], [ 'docs', null, '1' ], [ 'test', null, '1' ], [ 'ship', null, '1' ] ],
   *       expected: [ [ 'plan', 'false', '1' ], [ 'build', 'false', '1' ], [ 'docs', 'true', '1' ], [ 'test', 'false', '0.4' ], [ 'ship', 'false', '0.4' ] ],
   */
  test('a selection named before its node is drawn is drawn, lit and the rest dim, when a model draws the node', onPage(async (page) => {
    await page.evaluate(() => {
      const { plan } = window.MAPS, folded = { nodes: plan.nodes.filter((node) => node.id !== 'docs'), edges: plan.edges.filter((edge) => edge.to !== 'docs') };
      window.graph.update({ label: 'Plan', ...folded, selectedId: 'docs' });
      window.graph.update({ label: 'Plan', ...plan, selectedId: 'docs' });
    });
    const drawn = await page.evaluate(() => [...document.querySelectorAll('.cloudcanvas-ui-graph-node')].map((node) => [node.getAttribute('data-ui-id'),
      node.getAttribute('aria-selected'), getComputedStyle(node).opacity]));
    assert.deepEqual(drawn, [['plan', 'false', '1'], ['build', 'false', '1'], ['docs', 'true', '1'], ['test', 'false', '0.4'], ['ship', 'false', '0.4']]);
  }));
}
