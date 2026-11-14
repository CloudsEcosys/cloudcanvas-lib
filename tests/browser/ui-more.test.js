/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The item menu's "more" button, the hint lines, the words of a search that
 * found nothing, the reach of what is drawn small, and the graph that follows
 * its host's width - on the graph, the timeline, the calendar and the tree, in
 * real Chromium, where what a pointer finds is measured, not read from the sheet.
 *
 * A reach (the hit area of a control) is every point where the browser hands a
 * press to it or to something inside it, padding and pseudo-elements included.
 * The middle of what a reach lies beside must stay that thing's own.
 *
 * Every case was written before the code and run on the kit as it stood at `d242ea4`; what each read there:
 *
 *   ✖ map: the selected node has a "more" button clear of its title, its handle and its toggle; Tab reaches it; it asks for the menu
 *     TypeError [Error]: Cannot read properties of null (reading '0')
 *   ✖ map: nothing in hand, nothing in the way - the button is out of a drag, and a search that finds nothing says so and fades nothing
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: 0 !== 1
 *   ✖ map: a mouse reaches 24px of the fold toggle and the link handle, and the node keeps its middle
 *     AssertionError [ERR_ASSERTION]: toggle 25,17 (drawn 200,216,224,232)
 *   ✖ map: the width follows the host while the view is the graph's own, and a view the reader made stays
 *     AssertionError [ERR_ASSERTION]: the root is still in view when the width falls to 300
 *   ✖ timeline: the selected bar has a "more" button clear of the bar, the link handle and the title; a mouse reaches 24px of what is small
 *     TypeError [Error]: Cannot read properties of null (reading '2')
 *   ✖ calendar (month) and calendar (week): the selected event has a "more" button at its end, clear of its title, which asks for the menu
 *     AssertionError [ERR_ASSERTION]: call: drawn
 *   ✖ tree: a search nothing matches says so in a status beside the tree and fades nothing
 *     locator.textContent: Timeout 30000ms exceeded. (waiting for locator('.cloudcanvas-ui-tree-status'))
 *   ✖ a finger: the timeline's button is 44px, the map's reaches 44px, the calendar's reaches 44px of its row
 *     TypeError [Error]: Cannot read properties of null (reading '2')
 *
 * and, after a look in the demo (the timeline's button stood 950px left of the sheet - it had no geometry of its own - and the first form of the
 * case, which asked only that it overlap nothing, passed): with the button given none, the case reads
 *
 *   ✖ timeline: the selected bar has a "more" button clear of the bar, the link handle and the title; a mouse reaches 24px of what is small
 *     AssertionError [ERR_ASSERTION]: long: straight beyond the link handle (675,678,687,690), where the bar ends - not wherever it fell: -951,672,-927,696
 *
 * and, found in the demo at 390px (a tap on a chip opened the capture of a day: the button stood under the finger before the click), with the
 * button drawn at once:
 *
 *   ✖ calendar: a press at the end of a chip, where the button will stand, is the chip's click
 *     AssertionError [ERR_ASSERTION]: opened, and no day was picked
 *     actual: [ [ 'pick', null ] ], expected: [ [ 'open', 'call' ] ]
 *
 * (The toggle read 25 by 17 there: its drawn size, border and all; the assertions after the first one that fails were not reached.)
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadChromium, PLAYWRIGHT_MISSING, startStaticServer } from './harness.js';

const chromium = await loadChromium();
const FIXTURE = '/tests/browser/fixtures/ui-more.html';
const GRAPH = '.cloudcanvas-ui-graph';
const MORE = '.cloudcanvas-ui-item-more';
/** The button of one view: the page holds all three, each with a selection. */
const moreOf = (view) => `.cloudcanvas-ui-${view} ${MORE}`;
const PHRASE = 'Shift+F10 or right-click for more';

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('ui more browser', { skip: 'playwright is not installed' }, () => {});
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

  /** A page on the fixture; any page error or console error fails the test. A phone is `{ phone: true }`. */
  async function open(query = '', { phone = false } = {}) {
    const device = phone ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: 1200, height: 900 } };
    const page = await scope.browser.newPage(device);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${scope.server.url}${FIXTURE}${query}`);
    await page.waitForFunction(() => window.ready === true);
    return { page, errors };
  }

  const onPage = (body, query = '', options = {}) => () => open(query, options).then(({ page, errors }) => body(page).then(() => assert.deepEqual(errors, [])).finally(() => page.close()));

  /** The boxes of `selector`'s first match as `[left, top, right, bottom]`, rounded to a tenth; null when it is not drawn. */
  const box = (page, selector) => page.evaluate((css) => {
    const node = document.querySelector(css);
    if (!node) return null;
    const { left, top, right, bottom } = node.getBoundingClientRect();
    return [left, top, right, bottom].map((value) => Math.round(value * 10) / 10);
  }, selector);

  /** Whether two `[l, t, r, b]` boxes share an area. */
  const meet = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

  /** The rectangles the text of `selector` is drawn in: where its ink can be under something. */
  const inkOf = (page, selector) => page.evaluate((css) => {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector(css));
    return [...range.getClientRects()].filter((rect) => rect.width > 0).map((rect) => [rect.left, rect.top, rect.right, rect.bottom]);
  }, selector);

  const logOf = (page) => page.evaluate(() => window.log);

  /**
   * What a pointer finds on the control `selector` (its first match): its drawn box, the box of every point where the browser hands
   * the press to it or to something inside it - a pixel at a time, 40px beyond what is drawn - and the drawn box's own middle.
   */
  const reachOf = (page, selector) => page.evaluate((css) => {
    const node = document.querySelector(css);
    node.scrollIntoView({ block: 'center', inline: 'center' });
    const drawn = node.getBoundingClientRect();
    const own = (x, y) => { const found = document.elementFromPoint(x, y); return Boolean(found) && (found === node || node.contains(found)); };
    let [left, right, top, bottom] = [Infinity, -Infinity, Infinity, -Infinity];
    for (let y = Math.floor(drawn.top) - 40; y <= drawn.bottom + 40; y += 1) {
      for (let x = Math.floor(drawn.left) - 40; x <= drawn.right + 40; x += 1) {
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight || !own(x + 0.5, y + 0.5)) continue;
        [left, right, top, bottom] = [Math.min(left, x), Math.max(right, x + 1), Math.min(top, y), Math.max(bottom, y + 1)];
      }
    }
    return { drawn: [drawn.left, drawn.top, drawn.right, drawn.bottom], reach: right < left ? null : [left, top, right, bottom] };
  }, selector);

  const sides = (found) => [found.reach[2] - found.reach[0], found.reach[3] - found.reach[1]];
  const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

  /*
   * MAP. The selected node wears the button at its corner; it covers neither the title's ink, the link handle nor the fold toggle;
   * Tab from the node reaches it, and its Enter asks for the menu once and opens nothing.
   */
  test('map: the selected node has a "more" button clear of its title, its handle and its toggle; Tab reaches it; it asks for the menu', onPage(async (page) => {
    const node = await box(page, `${GRAPH}-node[data-ui-id="plan"]`);
    const more = await box(page, moreOf('graph'));
    assert.ok(more[0] >= node[0] && more[2] <= node[2] && more[1] >= node[1] - 1 && more[3] <= node[3], `inside its node: ${more} in ${node}`);
    assert.ok(more[2] - more[0] >= 22 && more[3] - more[1] >= 22, 'a whole target at the graph\'s own zoom');
    for (const ink of await inkOf(page, `${GRAPH}-node[data-ui-id="plan"] ${GRAPH}-node-label`)) assert.ok(!meet(ink, more), `the title\'s ink ${ink} is clear of ${more}`);
    for (const part of [`${GRAPH}-node[data-ui-id="plan"] ${GRAPH}-toggle`, `${GRAPH}-node[data-ui-id="plan"] ${GRAPH}-handle`]) assert.ok(!meet(await box(page, part), more), `${part} is clear`);
    assert.equal(await page.locator(moreOf('graph')).getAttribute('aria-label'), 'More actions for Plan the launch of the spring campaign with every channel ready');
    assert.ok((await page.locator(`${GRAPH}-hint`).textContent()).endsWith(PHRASE), 'the hint says where the rest is');
    await page.locator(`${GRAPH}-node[data-ui-id="plan"]`).focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.matches('.cloudcanvas-ui-item-more')), true, 'Tab from the node lands on the button');
    await page.keyboard.press('Enter');
    assert.deepEqual((await logOf(page)).filter(([name]) => name === 'menu' || name === 'open').map(([name, id]) => [name, id]), [['menu', 'plan']], 'one menu, nothing opened');
    await page.locator(moreOf('graph')).click();
    const [, , x, y] = (await logOf(page)).filter(([name]) => name === 'menu').at(-1);
    assert.ok(Math.abs(x - more[0]) <= 1 && Math.abs(y - more[3]) <= 1, `under the button: ${x},${y} for ${more}`);
    assert.equal(await noSideways(page), true);
  }));

  test('map: nothing in hand, nothing in the way - the button is out of a drag, and a search that finds nothing says so and fades nothing', onPage(async (page) => {
    const node = await box(page, `${GRAPH}-node[data-ui-id="build"]`);
    await page.evaluate(() => window.drawGraph({ selectedId: 'build' }));
    await page.mouse.move((node[0] + node[2]) / 2, node[1] + 12);
    await page.mouse.down();
    await page.mouse.move((node[0] + node[2]) / 2 + 40, node[1] + 40, { steps: 4 });
    assert.equal(await page.locator(`${moreOf('graph')}:visible`).count(), 0, 'not drawn while the node is dragged');
    await page.mouse.up();
    assert.equal(await page.locator(`${moreOf('graph')}:visible`).count(), 1);
    await page.locator(`${GRAPH}-search`).fill('zzz');
    assert.equal(await page.locator(`${GRAPH}-hint`).textContent(), 'Nothing matches “zzz”');
    const faded = await page.evaluate(() => [...document.querySelectorAll('.cloudcanvas-ui-graph-node')].map((one) => getComputedStyle(one).opacity));
    assert.ok(faded.every((opacity) => opacity === '1' || Number(opacity) >= 1) || faded.some((opacity) => opacity !== '0.4'), `no node is at the fade of a search: ${faded}`);
    assert.equal(await page.locator(`${GRAPH}-node.is-unmatched`).count(), 0);
    await page.locator(`${GRAPH}-search`).fill('Test');
    assert.equal(await page.locator(`${GRAPH}-node.is-unmatched`).count(), 4, 'a search that finds one fades the rest');
  }));

  /*
   * MAP, A MOUSE'S REACH of what is drawn small (24px on the screen at the graph's own zoom, the view being 1 here): the toggle (24x16)
   * and the link handle (12). The handle's reach runs out from the node; the middle of the node stays the node's.
   */
  test('map: a mouse reaches 24px of the fold toggle and the link handle, and the node keeps its middle', onPage(async (page) => {
    const toggle = await reachOf(page, `${GRAPH}-node[data-ui-id="plan"] ${GRAPH}-toggle`);
    assert.ok(sides(toggle)[0] >= 24 && sides(toggle)[1] >= 24, `toggle ${sides(toggle)} (drawn ${toggle.drawn.map(Math.round)})`);
    const handle = await reachOf(page, `${GRAPH}-node[data-ui-id="plan"] ${GRAPH}-handle`);
    assert.ok(sides(handle)[0] >= 24 && sides(handle)[1] >= 24, `handle ${sides(handle)} (drawn ${handle.drawn.map(Math.round)})`);
    const node = await box(page, `${GRAPH}-node[data-ui-id="plan"]`);
    assert.ok(handle.reach[0] >= handle.drawn[0] - 1, `the handle's reach starts at its own edge, and goes out from the node: ${handle.reach[0]} against the dot's ${handle.drawn[0]} (the node's edge is ${node[2]})`);
    assert.ok(handle.reach[2] - node[2] >= 17, 'out of the node by 18px, the 24px of the handle less the half of it the node holds');
    const middle = await page.evaluate(([x, y]) => document.elementFromPoint(x, y).closest('.cloudcanvas-ui-graph-node')?.getAttribute('data-ui-id'), [(node[0] + node[2]) / 2, node[1] + 20]);
    assert.equal(middle, 'plan', 'the node\'s middle is the node\'s');
  }));

  /*
   * MAP, A MOUSE'S REACH AT THE FIRST VIEW'S LEAST SCALE. A map too big for its window opens at 0.8 (a title is 10px), where the toggle (24x16 world units)
   * is drawn 19x13 and the link handle (12) 10px: the reach is what gives a mouse 24px, as it does at 1, and it is 30 world units at 0.8.
   *
   * Seen to fail on the sheet of `bdc16db`, whose reach was kept to 24 world units tall for the toggle and 28 for the handle (19 and 22px at 0.8):
   *
   *   ✖ map: at the first view's least scale, 0.8, a mouse still reaches 24px of the fold toggle and the link handle
   *     AssertionError [ERR_ASSERTION]: 0.8: toggle 25,21 (drawn 165,189.6,184.2,202.6)
   */
  test('map: at the first view\'s least scale, 0.8, a mouse still reaches 24px of the fold toggle and the link handle', onPage(async (page) => {
    await page.evaluate(() => window.drawGraph({ viewport: { x: 16, y: 20, scale: 0.8 } }));
    const toggle = await reachOf(page, `${GRAPH}-node[data-ui-id="plan"] ${GRAPH}-toggle`);
    assert.ok(sides(toggle)[0] >= 24 && sides(toggle)[1] >= 24, `0.8: toggle ${sides(toggle)} (drawn ${toggle.drawn.map((value) => Math.round(value * 10) / 10)})`);
    const handle = await reachOf(page, `${GRAPH}-node[data-ui-id="plan"] ${GRAPH}-handle`);
    assert.ok(sides(handle)[0] >= 24 && sides(handle)[1] >= 24, `0.8: handle ${sides(handle)}`);
    const node = await box(page, `${GRAPH}-node[data-ui-id="plan"]`);
    const middle = await page.evaluate(([x, y]) => document.elementFromPoint(x, y).closest('.cloudcanvas-ui-graph-node')?.getAttribute('data-ui-id'), [(node[0] + node[2]) / 2, node[1] + 16]);
    assert.equal(middle, 'plan', 'and the node\'s middle is the node\'s');
  }));

  /*
   * MAP, THE WIDTH. A host that opens a pane beside the graph halves its width: while the view is the graph's own it is fitted
   * again and the root stays in view; a view the reader made is left.
   */
  test('map: the width follows the host while the view is the graph\'s own, and a view the reader made stays', onPage(async (page) => {
    const rootIn = () => page.evaluate(() => {
      const root = document.querySelector('.cloudcanvas-ui-graph-node[data-ui-id="plan"]').getBoundingClientRect();
      const view = document.querySelector('.cloudcanvas-ui-graph-viewport').getBoundingClientRect();
      return root.left >= view.left && root.right <= view.right && root.top >= view.top && root.bottom <= view.bottom;
    });
    assert.equal(await rootIn(), true);
    await page.evaluate(() => { document.getElementById('graph-box').style.maxWidth = '300px'; });
    await page.waitForFunction(() => document.querySelector('.cloudcanvas-ui-graph-viewport').getBoundingClientRect().width < 320);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await rootIn(), true, 'the root is still in view when the width falls to 300');
    await page.evaluate(() => { document.getElementById('graph-box').style.maxWidth = '1100px'; });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const wide = await page.evaluate(() => document.querySelector('.cloudcanvas-ui-graph-world').style.transform);
    await page.mouse.move(300, 300);
    await page.mouse.wheel(40, 0);
    const panned = await page.evaluate(() => document.querySelector('.cloudcanvas-ui-graph-world').style.transform);
    assert.notEqual(panned, wide, 'the wheel pans');
    await page.evaluate(() => { document.getElementById('graph-box').style.maxWidth = '300px'; });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.evaluate(() => document.querySelector('.cloudcanvas-ui-graph-world').style.transform), panned, 'a pan is the reader\'s: it is left as they left it');
  }, '?view=auto'));

  /*
   * TIMELINE. The button stands beyond the bar and its link handle; the title of a short bar beside it moves past it; a mouse reaches
   * 24px of the separator, the link handle and the ends of a bar.
   */
  test('timeline: the selected bar has a "more" button clear of the bar, the link handle and the title; a mouse reaches 24px of what is small', onPage(async (page) => {
    // 'quick', a half hour drawn 20px wide, has no button: the bar is too narrow to give it a third (`a third at most`, below).
    for (const id of ['long', 'ship']) {
      await page.evaluate((selectedId) => window.drawTimeline(selectedId), id);
      const more = await box(page, moreOf('timeline'));
      const bar = await box(page, `.cloudcanvas-ui-timeline-bar[data-ui-id="${id}"]`);
      const link = await box(page, `[data-link-from="${id}"]`);
      assert.ok(!meet(bar, more) && !meet(link, more), `${id}: clear of the bar ${bar} and its handle ${link}: ${more}`);
      assert.ok(more[0] >= link[2] && more[0] - link[2] <= 24, `${id}: straight beyond the link handle (${link}), where the bar ends - not wherever it fell: ${more}`);
      assert.ok(Math.abs((more[1] + more[3]) / 2 - (bar[1] + bar[3]) / 2) <= 2, `${id}: on the bar's own line`);
      const outside = await box(page, `.cloudcanvas-ui-timeline-outside[data-ui-for="${id}"]`);
      if (outside) assert.ok(!meet(outside, more), `${id}: the title beside it is clear of the button: ${outside} ${more}`);
      assert.equal(await page.locator(moreOf('timeline')).getAttribute('aria-label'), `More actions for ${await page.locator(`.cloudcanvas-ui-timeline-bar[data-ui-id="${id}"]`).evaluate((node) => node.getAttribute('aria-label').split(', ')[0])}`);
    }
    await page.evaluate(() => window.drawTimeline('long'));
    await page.locator(`.cloudcanvas-ui-timeline-bar[data-ui-id="long"]`).focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.matches('.cloudcanvas-ui-item-more')), true, 'Tab from the bar lands on the button');
    await page.keyboard.press('Space');
    assert.deepEqual((await logOf(page)).filter(([name]) => name === 'menu').map(([, id]) => id), ['long']);
    const text = await page.locator('.cloudcanvas-ui-timeline-hint').textContent();
    assert.ok(text.includes(PHRASE), text);
    const gutter = await reachOf(page, '.cloudcanvas-ui-timeline-gutter-handle');
    assert.ok(sides(gutter)[0] >= 24, `separator ${sides(gutter)}`);
    const BAR = '.cloudcanvas-ui-timeline-bar[data-ui-id="long"]';
    // A reach is measured with its control scrolled to the middle of the page: the bar's box is read straight after, in the same place.
    const link = await reachOf(page, '[data-link-from="long"]');
    let bar = await box(page, BAR);
    assert.ok(sides(link)[0] >= 24 && sides(link)[1] >= 24, `link handle ${sides(link)}`);
    assert.ok(link.reach[0] >= bar[2] - 0.5, `the link handle's reach does not enter the bar: it starts at ${link.reach[0]}, the bar ends at ${bar[2]}`);
    const end = await reachOf(page, `${BAR} .cloudcanvas-ui-timeline-handle`);
    bar = await box(page, BAR);
    assert.ok(sides(end)[0] >= 24 && sides(end)[1] >= 24, `end grip ${sides(end)}`);
    assert.ok(end.reach[2] <= bar[2] + 0.5, 'the end grip reaches inward, never past the bar\'s own edge');
    const start = await reachOf(page, `${BAR} .cloudcanvas-ui-timeline-handle-start`);
    bar = await box(page, BAR);
    assert.ok(sides(start)[0] >= 24 && sides(start)[1] >= 24, `start grip ${sides(start)}`);
    assert.ok(start.reach[0] >= bar[0] - 0.5, 'the start grip reaches inward, never past the bar\'s own edge');
    bar = await box(page, BAR);
    const middle = await page.evaluate(([x, y]) => document.elementFromPoint(x, y).className, [(bar[0] + bar[2]) / 2, (bar[1] + bar[3]) / 2]);
    assert.doesNotMatch(middle, /handle/, 'the middle of the bar is the bar\'s');
    // A bar of half an hour is drawn 20px wide: the reach of its ends leaves its body its middle.
    await page.evaluate(() => window.drawTimeline('quick'));
    const quick = await box(page, '.cloudcanvas-ui-timeline-bar[data-ui-id="quick"]');
    const under = await page.evaluate(([x, y]) => document.elementFromPoint(x, y).className, [(quick[0] + quick[2]) / 2, (quick[1] + quick[3]) / 2]);
    assert.doesNotMatch(under, /handle/, 'the middle of the shortest bar is its body');
    assert.equal(await noSideways(page), true);
  }));

  /*
   * CALENDAR. The button stands at its chip's end - in the month's list, in the hour grid's column, in the all-day strip - and
   * the chip keeps the room: the title's ink is clear of it.
   */
  for (const [name, query, ids] of [['month', '', ['call', 'trip']], ['week', '?calendar=week', ['call', 'lunch', 'trip']]]) {
    test(`calendar (${name}): the selected event has a "more" button at its end, clear of its title, which asks for the menu`, onPage(async (page) => {
      for (const id of ids) {
        await page.evaluate((selectedId) => window.drawCalendar(selectedId), id);
        const chipSelector = `.cloudcanvas-ui-calendar-event[data-ui-id="${id}"]`;
        const more = await box(page, moreOf('calendar'));
        const chip = await box(page, chipSelector);
        assert.ok(more, `${id}: drawn`);
        assert.ok(more[0] >= chip[0] && more[2] <= chip[2] + 1, `${id}: at the chip's end, ${more} in ${chip}`);
        assert.ok(more[1] >= chip[1] - 6 && more[3] <= chip[3] + 6, `${id}: on the chip's row`);
        for (const ink of await inkOf(page, chipSelector)) assert.ok(!meet(ink, more), `${id}: the chip's ink ${ink} is clear of ${more}`);
        await page.locator(moreOf('calendar')).click();
        const [, menuId] = (await logOf(page)).filter(([entry]) => entry === 'menu').at(-1);
        assert.equal(menuId, id, 'the menu of the event it stands by');
      }
      assert.ok((await page.locator('.cloudcanvas-ui-calendar-hint').textContent()).endsWith(PHRASE));
      assert.equal(await noSideways(page), true);
    }, query));
  }

  /*
   * A PRESS AT A CHIP'S END, where the button will stand: the press selects the chip, the button waits for the press to end, and the click is
   * the chip's - not the day's list's, which opens the capture of a day.
   */
  test('calendar: a press at the end of a chip, where the button will stand, is the chip\'s click', onPage(async (page) => {
    await page.evaluate(() => window.drawCalendar(null));
    await page.locator('.cloudcanvas-ui-calendar-event[data-ui-id="call"]').scrollIntoViewIfNeeded();
    const chip = await box(page, '.cloudcanvas-ui-calendar-event[data-ui-id="call"]');
    await page.mouse.move(chip[2] - 8, (chip[1] + chip[3]) / 2);
    await page.mouse.down();
    await page.mouse.up();
    assert.deepEqual((await logOf(page)).map(([name, id]) => [name, id]), [['open', 'call']], 'opened, and no day was picked');
    assert.equal(await page.locator(moreOf('calendar')).count(), 1, 'and the button stands by it now');
  }, '?calendar=month'));

  /*
   * TREE. A search nothing matches is said in words beside the tree, and no row is faded for it.
   */
  test('tree: a search nothing matches says so in a status beside the tree and fades nothing', onPage(async (page) => {
    await page.evaluate(() => window.tree.update({ label: 'Notebooks', expanded: ['work'], query: 'zzz', items: [{ id: 'work', label: 'Work' }, { id: 'plan', parentId: 'work', label: 'Planning' }, { id: 'home', label: 'Home' }] }));
    assert.equal(await page.locator('.cloudcanvas-ui-tree-status').textContent(), 'Nothing matches “zzz”');
    assert.equal(await page.locator('.cloudcanvas-ui-tree-status').isVisible(), true);
    const opacities = await page.evaluate(() => [...document.querySelectorAll('.cloudcanvas-ui-tree-row')].map((row) => getComputedStyle(row).opacity));
    assert.deepEqual(opacities, ['1', '1', '1']);
    await page.evaluate(() => window.tree.update({ label: 'Notebooks', expanded: ['work'], query: '', items: [{ id: 'work', label: 'Work' }] }));
    assert.equal(await page.locator('.cloudcanvas-ui-tree-status').evaluate((node) => node.getBoundingClientRect().height), 0, 'and with nothing to say it takes no room');
  }));

  /*
   * A CUT LABEL IS SAID WHOLE. The tree is one column as wide as the tree, so a label it has no room for ends in the sheet's ellipsis; the
   * row carries the whole label as its title only where it is cut, and follows the tree as it is made narrower and wider, with nothing
   * drawn again. Seen to fail on the kit of `64a2e1b`, whose tree widened to its longest label and said nothing of any:
   *
   *   ✖ tree: a row whose label is cut says it whole in its title, a row that fits says nothing, and the tree's width changes which
   *     AssertionError [ERR_ASSERTION]: the cut one says it whole; the one that fits says nothing
   *     actual: [ null, null ],
   *     expected: [ 'A notebook whose name runs well past the three hundred and twenty pixels this tree is given in a page', null ],
   */
  test('tree: a row whose label is cut says it whole in its title, a row that fits says nothing, and the tree\'s width changes which', onPage(async (page) => {
    const LONG = 'A notebook whose name runs well past the three hundred and twenty pixels this tree is given in a page';
    const titles = () => page.evaluate(() => [...document.querySelectorAll('.cloudcanvas-ui-tree-row')].map((row) => row.getAttribute('title')));
    const frame = () => page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
    await page.evaluate((label) => window.tree.update({ label: 'Notebooks', items: [{ id: 'long', label }, { id: 'home', label: 'Home' }] }), LONG);
    assert.deepEqual(await titles(), [LONG, null], 'the cut one says it whole; the one that fits says nothing');
    await page.evaluate(() => { document.getElementById('tree-host').style.maxWidth = '40px'; });
    await frame();
    assert.deepEqual(await titles(), [LONG, 'Home'], 'narrowed, the short label is cut too');
    await page.evaluate(() => { document.getElementById('tree-host').style.maxWidth = '2000px'; });
    await frame();
    assert.deepEqual(await titles(), [null, null], 'widened, nothing is cut and nothing is said');
  }));

  /*
   * A FINGER. 390px, coarse: the button is a whole target where it stands in a row of its own (the bar's row, the all-day strip), and
   * the graph's, drawn at 24px, reaches 44px; nothing runs the page sideways.
   */
  test('a finger: the timeline\'s button is 44px, the map\'s reaches 44px, the calendar\'s reaches 44px of its row', onPage(async (page) => {
    const finger = 44;
    await page.evaluate(() => window.drawTimeline('long'));
    const more = await box(page, moreOf('timeline'));
    assert.ok(more[2] - more[0] >= finger - 0.5 && more[3] - more[1] >= finger - 0.5, `timeline button ${more}`);
    await page.evaluate(() => window.drawGraph());
    const graph = await reachOf(page, moreOf('graph'));
    assert.ok(sides(graph)[0] >= finger - 0.5 && sides(graph)[1] >= finger - 0.5, `map button reach ${sides(graph)} (drawn ${graph.drawn.map(Math.round)})`);
    await page.evaluate(() => window.drawCalendar('trip'));
    const strip = await box(page, moreOf('calendar'));
    assert.ok(strip[3] - strip[1] >= finger - 0.5, `calendar button ${strip}`);
    assert.equal(await noSideways(page), true);
  }, '?calendar=day&date=2026-10-02', { phone: true }));

  /*
   * A THIRD AT MOST. At 390px a week's all-day chip is a few dozen pixels wide, and a finger's 44px button left its title none. The chip
   * is given no button and keeps no room for one; the hint says the other ways to the menu; a tap on the chip still selects it. A bar of
   * the timeline too short for a third-sized button has none either, and a milestone, which is no bar, keeps its own beside the diamond.
   * Seen to fail on the kit of `64a2e1b`, which drew the button on a chip of any width:
   *
   *   ✖ a third at most: at 390px a week's all-day chip and a short bar have no button, say how the menu is reached, and a tap selects the chip
   *     AssertionError [ERR_ASSERTION]: and it has no button
   *     actual: 1,
   *     expected: 0,
   *
   * (The cases of the button as a finger and a pointer find it were given a chip and a bar with room for it: the month's all-day chip
   * of the phone, and the timeline's half-hour bar, have none now. The 1200px case below passed there and is held.)
   */
  test('a third at most: at 390px a week\'s all-day chip and a short bar have no button, say how the menu is reached, and a tap selects the chip', onPage(async (page) => {
    await page.evaluate(() => window.drawCalendar('call'));
    const chip = `.cloudcanvas-ui-calendar-event[data-ui-id="trip"]`;
    const width = await page.locator(chip).evaluate((node) => node.getBoundingClientRect().width);
    assert.ok(width < 132, `the chip is narrower than three fingers: ${width}`);
    await page.locator(chip).tap();
    assert.equal(await page.locator(chip).getAttribute('aria-current'), 'true', 'a tap selects the chip');
    assert.equal(await page.locator(moreOf('calendar')).count(), 0, 'and it has no button');
    assert.equal(await page.locator(`${chip}.is-holding-more`).count(), 0, 'nor room held for one');
    assert.match(await page.locator('.cloudcanvas-ui-calendar-hint').textContent(), /Touch and hold, Shift\+F10 or right-click for more$/);
    await page.evaluate(() => window.drawTimeline('quick'));
    assert.equal(await page.locator(moreOf('timeline')).count(), 0, 'a half hour of the week is no room for a finger\'s button');
    assert.match(await page.locator('.cloudcanvas-ui-timeline-hint').textContent(), /Touch and hold, Shift\+F10 or right-click for more/);
    await page.evaluate(() => window.drawTimeline('ship'));
    assert.equal(await page.locator(moreOf('timeline')).count(), 1, 'a milestone is no bar: its button stands beside the diamond');
    assert.equal(await noSideways(page), true);
  }, '?calendar=week', { phone: true }));

  /*
   * A chip with room keeps the button. At 1200px the week's chip is wide enough for a pointer's 24px one, and the hint is the usual.
   */
  test('a third at most: at 1200px a week\'s chip has its button, and the hint is the usual', onPage(async (page) => {
    await page.evaluate(() => window.drawCalendar('trip'));
    assert.equal(await page.locator(moreOf('calendar')).count(), 1);
    assert.match(await page.locator('.cloudcanvas-ui-calendar-hint').textContent(), / · Shift\+F10 or right-click for more$/);
  }, '?calendar=week'));
}
