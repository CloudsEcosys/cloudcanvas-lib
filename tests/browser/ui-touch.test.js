/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Every control of the graph, the timeline, the calendar and the tree, under a
 * finger (`(pointer: coarse)`, 390px), in real Chromium: what a pointer finds is
 * measured, not read from the sheet. A control's HIT AREA is every point where
 * the browser hands the press to it (or to something inside it), padding and
 * pseudo-elements included; it must be 44x44px or more, and the middle and the
 * edges of what is drawn must be its own - which is where a neighbour's reach,
 * grown over it, would show.
 *
 * Where a control cannot have 44px without taking its neighbour's, the limit
 * is the neighbour's and it is asserted as such, by name: a bar's end handles
 * (a third of the bar), the two events that share the hours of a day (half the
 * column each), the chips stacked in one day (their own height and the room to
 * the next).
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadChromium, PLAYWRIGHT_MISSING, startStaticServer } from './harness.js';

const chromium = await loadChromium();
const FIXTURE = '/tests/browser/fixtures/ui-touch.html';
const FINGER = 44;

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('ui touch browser', { skip: 'playwright is not installed' }, () => {});
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

  /** A phone on the fixture; any page error or console error fails the test. */
  async function open(query = '') {
    const page = await scope.browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${scope.server.url}${FIXTURE}${query}`);
    await page.waitForFunction(() => window.ready === true);
    assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), true);
    return { page, errors };
  }

  /**
   * What a finger finds on the control `selector` (the `at`th match): its drawn box, the box of every point the browser
   * hands to it - from a window 50px wider each way than what is drawn, a pixel at a time - and whether the middle and
   * the middle of each edge of what is drawn are its own.
   */
  const measure = (page, [selector, at = 0]) => page.evaluate(([css, index]) => {
    const node = document.querySelectorAll(css)[index];
    if (!node) return { missing: true };
    node.scrollIntoView({ block: 'center', inline: 'center' });
    // What stands on a timeline's track is looked at with its bar clear of the titles' column, which stays over the track as the sheet
    // scrolls: a row's title, or a heading's cell, which is at least as wide.
    const sheet = node.closest('.cloudcanvas-ui-timeline-sheet');
    const track = node.closest('.cloudcanvas-ui-timeline-track');
    if (sheet && track) {
      const titles = track.parentElement.querySelector('.cloudcanvas-ui-timeline-group-cell') ?? sheet.querySelector('.cloudcanvas-ui-timeline-corner');
      const drawn = track.querySelector('.cloudcanvas-ui-timeline-bar') ?? node;
      sheet.scrollLeft += drawn.getBoundingClientRect().left - (titles.getBoundingClientRect().right + 20);
    }
    const box = node.getBoundingClientRect();
    const own = (x, y) => { const found = document.elementFromPoint(x, y); return Boolean(found) && (found === node || node.contains(found)); };
    const [cx, cy] = [box.left + box.width / 2, box.top + box.height / 2];
    const mine = [[cx, cy], [box.left + 2, cy], [box.right - 2, cy], [cx, box.top + 2], [cx, box.bottom - 2]].every(([x, y]) => own(x, y));
    let [left, right, top, bottom] = [Infinity, -Infinity, Infinity, -Infinity];
    for (let y = Math.floor(box.top) - 50; y <= box.bottom + 50; y += 1) {
      for (let x = Math.floor(box.left) - 50; x <= box.right + 50; x += 1) {
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight || !own(x + 0.5, y + 0.5)) continue;
        [left, right, top, bottom] = [Math.min(left, x), Math.max(right, x + 1), Math.min(top, y), Math.max(bottom, y + 1)];
      }
    }
    const round = (value) => Math.round(value * 10) / 10;
    return { drawn: [round(box.width), round(box.height)], hit: right < left ? [0, 0] : [right - left, bottom - top], mine };
  }, [selector, at]);

  /** Measure each control `[name, selector, at?, limit?]` and say, for each that falls short, what it measured. `limit` is what a neighbour leaves it: `(drawn) => [width, height]`, 44px each way unless it says less. */
  async function audit(page, controls) {
    const short = [];
    for (const [name, selector, at = 0, limit = () => [FINGER, FINGER]] of controls) {
      const found = await measure(page, [selector, at]);
      if (found.missing) { short.push(`${name}: not drawn (${selector})`); continue; }
      const need = limit(found.drawn).map((side) => Math.min(side, FINGER));
      const small = found.hit[0] < need[0] || found.hit[1] < need[1];
      if (small || !found.mine) short.push(`${name}: drawn ${found.drawn.join('x')}, hit area ${found.hit.join('x')} (needs ${need.join('x')}), middle and edges ${found.mine ? 'its own' : 'taken by a neighbour'}`);
    }
    return short;
  }

  const toolbar = (view, parts) => parts.map((part) => [`${view} ${part}`, `.cloudcanvas-ui-${view}-${part}`]);

  /** The size of what a day's button paints - its fill, today - which is its box less any border the fill does not reach. */
  const painted = (page, selector) => page.evaluate((css) => {
    const style = getComputedStyle(document.querySelector(css));
    const box = document.querySelector(css).getBoundingClientRect();
    const [bx, by] = style.backgroundClip === 'padding-box' ? [parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth), parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)] : [0, 0];
    return [Math.round(box.width - bx), Math.round(box.height - by)];
  }, selector);

  /** The graph, the timeline and the tree, on a page where the graph is larger than its window (so its minimap is drawn). */
  const GRAPH_TIMELINE_TREE = [
    ...toolbar('graph', ['zoom-out', 'zoom-in', 'fit', 'search']),
    ['graph minimap', '.cloudcanvas-ui-graph-minimap'],
    ['graph node', '#graph-host [data-ui-id="plan"]'],
    ['graph fold pill', '#graph-host [data-ui-id="plan"] .cloudcanvas-ui-graph-toggle'],
    ['graph link handle (selected)', '#graph-host [data-ui-id="plan"] .cloudcanvas-ui-graph-handle'],
    ...toolbar('timeline', ['today']),
    ['timeline scale (days)', '.cloudcanvas-ui-timeline-scale', 0],
    ['timeline scale (months)', '.cloudcanvas-ui-timeline-scale', 2],
    ['timeline gutter handle', '.cloudcanvas-ui-timeline-gutter-handle'],
    ['timeline group toggle', '.cloudcanvas-ui-timeline-group-toggle'],
    ['timeline group heading', '.cloudcanvas-ui-timeline-group-label'],
    ['timeline row label', '.cloudcanvas-ui-timeline-label[data-ui-for="long"]'],
    ['timeline bar (ten days)', '#timeline-host .cloudcanvas-ui-timeline-bar[data-ui-id="long"]'],
    ['timeline bar (a day)', '#timeline-host .cloudcanvas-ui-timeline-bar[data-ui-id="day"]'],
    ['timeline bar (half an hour)', '#timeline-host .cloudcanvas-ui-timeline-bar[data-ui-id="quick"]'],
    ['timeline milestone', '#timeline-host .cloudcanvas-ui-timeline-bar[data-ui-id="ship"]'],
    ['timeline title beside a short bar', '#timeline-host .cloudcanvas-ui-timeline-outside[data-ui-for="quick"]'],
    ['timeline link handle (wide bar)', '#timeline-host [data-link-from="long"]'],
    ['timeline end handle (ten days)', '#timeline-host [data-ui-id="long"] .cloudcanvas-ui-timeline-handle'],
    ['timeline start handle (ten days)', '#timeline-host [data-ui-id="long"] .cloudcanvas-ui-timeline-handle-start'],
    // A bar's ends reach inward a third of the bar at most, so its body keeps a third: four days at 20px a day.
    ['timeline end handle (four days: a third)', '#timeline-host [data-ui-id="draft"] .cloudcanvas-ui-timeline-handle', 0, () => [Math.floor(80 / 3), FINGER]],
    ['timeline summary of a folded group (a day)', '#timeline-host .cloudcanvas-ui-timeline-summary'],
    ['tree row', '#tree-host .cloudcanvas-ui-tree-row', 1]
  ];
  const CALENDAR = [...toolbar('calendar', ['prev', 'next', 'today']), ['calendar view buttons', '.cloudcanvas-ui-calendar-view', 1]];
  const MONTH = [
    ...CALENDAR,
    ['calendar day number', '.cloudcanvas-ui-calendar-day', 10],
    ['calendar "more" link', '.cloudcanvas-ui-calendar-more'],
    ['calendar chip alone in its day', '#calendar-host [data-ui-id="trip"]']
  ];
  const WEEK = [
    ...CALENDAR,
    ['calendar day heading', '.cloudcanvas-ui-calendar-day-head', 2],
    ['calendar timed event (an hour)', '#calendar-host .cloudcanvas-ui-calendar-timed[data-ui-id="call"]'],
    ['calendar timed event (a quarter hour)', '#calendar-host .cloudcanvas-ui-calendar-timed[data-ui-id="sync"]'],
    ['calendar all-day chip', '#calendar-host .cloudcanvas-ui-calendar-allday [data-ui-id="trip"]'],
    ['calendar resize handle (an hour)', '#calendar-host [data-ui-id="call"] .cloudcanvas-ui-calendar-event-handle'],
    // Two events share the hours of a day: half of a 47px column each, and there is no more room than that.
    ['calendar timed event (a lane of two: half the column)', '#calendar-host .cloudcanvas-ui-calendar-timed[data-ui-id="one"]', 0, () => [20, FINGER]]
  ];

  /*
   * Seen to fail on the kit of `2b81a34` (the controls it draws on a phone, `(pointer: coarse)`, 390px):
   *
   *   ✖ touch: every control of the graph, timeline, calendar and tree is a 44px target of its own
   *     AssertionError [ERR_ASSERTION]: every control is a 44px target of its own
   *       + 'graph zoom-out: drawn 33.6x44, hit area 35x45 (needs 44x44), middle and edges its own',
   *       + 'graph zoom-in: drawn 33.6x44, hit area 35x45 (needs 44x44), middle and edges its own',
   *       + 'graph fit: drawn 40.5x44, hit area 41x45 (needs 44x44), middle and edges its own',
   *       + 'timeline gutter handle: drawn 44x28, hit area 45x29 (needs 44x44), middle and edges its own',
   *       + 'timeline row label: drawn 112x14, hit area 113x15 (needs 44x44), middle and edges its own',
   *       + 'timeline title beside a short bar: drawn 71.5x12, hit area 72x13 (needs 44x44), middle and edges its own',
   *       + 'calendar prev: drawn 30.3x44, hit area 31x45 (needs 44x44), middle and edges its own',
   *       + 'calendar next: drawn 30.3x44, hit area 31x45 (needs 44x44), middle and edges its own',
   *       + 'calendar day number: drawn 28x36, hit area 29x37 (needs 44x44), middle and edges its own',
   *       + 'calendar "more" link: drawn 44.1x14, hit area 46x15 (needs 44x44), middle and edges its own',
   *       + 'calendar prev: ...' 'calendar next: ...' (the week view's, as above)
   *       + 'calendar day heading: drawn 47.4x36, hit area 47x37 (needs 44x44), middle and edges its own',
   *       + 'calendar resize handle (an hour): drawn 41.4x14, hit area 42x15 (needs 44x44), middle and edges its own'
   *
   * (The timeline's rows, 37px tall, were found and fixed with the link handle: see `ui-timeline.test.js`.)
   *
   * K7a added a folded group's summary bar; on the kit of `f28f269`, which drew none, its row read
   *
   *       + 'timeline summary of a folded group (a day): not drawn (#timeline-host .cloudcanvas-ui-timeline-summary)'
   *
   * and, drawn, measured clear of the corner only:
   *
   *       + 'timeline summary of a folded group (a day): drawn 21x44, hit area 17x45 (needs 44x44), middle and edges taken by a neighbour'
   *
   * the heading's cell, 132px wide on a phone where the titles' column is 96px, stood over it: the cell is now the column's,
   * at least as wide and on its surface, and what stands on a heading's track is looked at clear of the cell.
   */
  test('touch: every control of the graph, timeline, calendar and tree is a 44px target of its own', async () => {
    const short = [];
    for (const [query, controls] of [['', GRAPH_TIMELINE_TREE], ['?calendar=month', MONTH], ['?calendar=week', WEEK]]) {
      const { page, errors } = await open(query);
      if (query === '') await page.evaluate(() => window.zoomGraph(1.4)); // larger than the window: the minimap is drawn
      short.push(...await audit(page, controls));
      assert.deepEqual(errors, []);
      await page.close();
    }
    assert.deepEqual(short, [], 'every control is a 44px target of its own');
  });

  /** The drawn box of `selector`'s first match, in whole-and-tenth pixels, as `[width, height]`. */
  const sizeOf = (page, selector) => page.evaluate((css) => {
    const box = document.querySelector(css).getBoundingClientRect();
    return [Math.round(box.width * 10) / 10, Math.round(box.height * 10) / 10];
  }, selector);

  /*
   * Seen to fail on the kit of `bdc16db`, in a host that sets `box-sizing: border-box` on everything (as Momentum's sheet does; the fixture has no such rule,
   * where the same axis is a pixel taller, so the case above passed):
   *
   *   ✖ touch: the timeline's separator is 44px tall in a host that sizes by the border box, as in one that does not
   *     AssertionError [ERR_ASSERTION]: border-box host: the separator is 44px each way: 44,43
   *       actual: false, expected: true
   *
   * The axis is a target tall "for the separator on its corner" - 44px, in a box that held its 1px rule inside. The kit now says which box it means.
   */
  test('touch: the timeline\'s separator is 44px tall in a host that sizes by the border box, as in one that does not', async () => {
    for (const [name, rule] of [['content-box host', ''], ['border-box host', '*, *::before, *::after { box-sizing: border-box; }']]) {
      const { page, errors } = await open();
      if (rule) await page.addStyleTag({ content: rule });
      const [width, height] = await sizeOf(page, '.cloudcanvas-ui-timeline-gutter-handle');
      assert.ok(width >= FINGER && height >= FINGER, `${name}: the separator is 44px each way: ${width},${height}`);
      assert.deepEqual(errors, []);
      await page.close();
    }
  });

  /*
   * Seen to fail with the transparent border that gives a day's number its 44px, its fill painted over the whole of it (the
   * fill's rule, of more weight, set `background-clip` back to the border box):
   *
   *   ✖ touch: a day's button is 44px to the finger and keeps the size of what it paints
   *     AssertionError [ERR_ASSERTION]: the circle round today's number is 28px
   *       + actual - expected    [ + 44, + 44, - 28, - 28 ]
   */
  test('touch: a day\'s button is 44px to the finger and keeps the size of what it paints', async () => {
    const month = await open();
    assert.deepEqual(await painted(month.page, '.cloudcanvas-ui-calendar-cell.is-today .cloudcanvas-ui-calendar-day'), [28, 28], 'the circle round today\'s number is 28px');
    await month.page.close();
    const week = await open('?calendar=week');
    assert.equal((await painted(week.page, '.cloudcanvas-ui-calendar-day-head.is-today'))[1], 36, 'the fill behind today\'s heading is 36px tall, as it was');
    await week.page.close();
  });
}
