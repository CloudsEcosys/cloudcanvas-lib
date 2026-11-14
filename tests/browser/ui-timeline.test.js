/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The timeline in real Chromium: a span dragged across the empty part of a row
 * wherever it is - past the last item, across a group's heading, folded or not
 * - and the bars that are drawn short.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadChromium, PLAYWRIGHT_MISSING, startStaticServer } from './harness.js';

const chromium = await loadChromium();
const FIXTURE = '/tests/browser/fixtures/ui-timeline.html';

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('ui timeline browser', { skip: 'playwright is not installed' }, () => {});
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
  async function open(viewport = { width: 1440, height: 700 }, query = '', device = {}) {
    const page = await scope.browser.newPage({ viewport, ...device });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${scope.server.url}${FIXTURE}${query}`);
    await page.waitForFunction(() => window.ready === true);
    return { page, errors };
  }

  const onPage = (body, ...args) => () => open(...args).then(({ page, errors }) => body(page).then(() => assert.deepEqual(errors, [])).finally(() => page.close()));
  const log = (page) => page.evaluate(() => window.log);
  const centre = (box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

  /** Drag from `from` to `to`; the band's words while the button is down, and what the page logged after. */
  async function drag(page, from, to) {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 6 });
    const band = await page.evaluate(() => document.querySelector('.cloudcanvas-ui-timeline-draft')?.textContent ?? null);
    await page.mouse.up();
    return { band, log: await log(page) };
  }

  /** The row of the item, or the heading named, as a box: its y is the middle of the row. */
  const rowBox = (page, selector, name) => page.locator(selector, name ? { hasText: name } : {}).first().boundingBox();

  /*
   * Seen to fail on the timeline of `ba0f72d`:
   *
   *   ✖ create: a span is dragged across the empty part of a row wherever it is - past the last item, across a heading, folded or not
   *     AssertionError [ERR_ASSERTION]: a band follows the pointer at the right of the sheet, far from any bar
   *       actual: null,
   *       expected: true,
   */
  test('create: a span is dragged across the empty part of a row wherever it is - past the last item, across a heading, folded or not', onPage(async (page) => {
    const sheet = await page.locator('.cloudcanvas-ui-timeline-sheet').boundingBox();
    const right = sheet.x + sheet.width - 120;
    const row = await rowBox(page, '.cloudcanvas-ui-timeline-row[data-row-id="draft"]');
    const far = await drag(page, { x: right - 100, y: centre(row).y }, { x: right, y: centre(row).y });
    assert.ok(far.band, 'a band follows the pointer at the right of the sheet, far from any bar');
    assert.equal(far.log.at(-1)[0], 'create');
    assert.equal(far.log.at(-1)[1], 'book');
    const heading = await rowBox(page, '.cloudcanvas-ui-timeline-group', 'Writing');
    const across = await drag(page, { x: right - 300, y: centre(heading).y }, { x: right - 200, y: centre(heading).y });
    assert.ok(across.band, 'and across a group\'s heading');
    assert.equal(across.log.at(-1)[1], 'book');
    const folded = await rowBox(page, '.cloudcanvas-ui-timeline-group', 'Folded parent');
    const over = await drag(page, { x: right - 300, y: centre(folded).y }, { x: right - 200, y: centre(folded).y });
    assert.ok(over.band, 'and across a folded group\'s');
    assert.equal(over.log.at(-1)[1], 'folded');
    assert.equal((await log(page)).filter(([name]) => name === 'open').length, 0, 'no drag opened an item');
  }));

  /** The half-hour bar's drawn box, and what is under a point `dx` px from its left edge, at its middle height. */
  const shortBar = (page) => page.evaluate(() => {
    const bar = document.querySelector('.cloudcanvas-ui-timeline-bar[data-ui-id="quick"]');
    const box = bar.getBoundingClientRect();
    const at = (dx) => document.elementFromPoint(box.left + dx, box.top + box.height / 2);
    const under = (dx) => at(dx)?.closest('.cloudcanvas-ui-timeline-bar')?.getAttribute('data-ui-id') ?? null;
    const grabs = (dx) => (at(dx)?.closest('.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start') ? 'an end' : 'the body');
    return { x: box.x, y: box.y, width: box.width, height: box.height, centre: under(box.width / 2), grabs: grabs(box.width / 2),
      before: under(-10), after: under(box.width + 10), far: under(-30) };
  });

  /*
   * Seen to fail on the timeline of `30033e5`:
   *
   *   ✖ short: a half-hour bar is drawn 1.25rem wide at every scale and moves by its body, its dates the item's own
   *     AssertionError [ERR_ASSERTION]: day: the half-hour bar is at least 20px wide: 5
   *       actual: false,
   *       expected: true,
   */
  test('short: a half-hour bar is drawn 1.25rem wide at every scale and moves by its body, its dates the item\'s own', async () => {
    for (const scale of ['day', 'week', 'month']) {
      const { page, errors } = await open({ width: 1440, height: 700 }, `?scale=${scale}`);
      const box = await shortBar(page);
      assert.ok(box.width >= 20, `${scale}: the half-hour bar is at least 20px wide: ${box.width}`);
      await drag(page, { x: box.x + box.width / 2, y: box.y + box.height / 2 }, { x: box.x + box.width / 2 + (scale === 'day' ? 70 : scale === 'week' ? 45 : 22), y: box.y + box.height / 2 });
      const [, id, start, end] = (await log(page)).findLast(([name]) => name === 'change');
      assert.equal(id, 'quick');
      assert.equal(new Date(end) - new Date(start), 30 * 60 * 1000, `${scale}: it moved whole: its length is still half an hour, not the drawn width`);
      assert.notEqual(start, new Date('2026-10-02T09:00').toISOString(), `${scale}: and it moved`);
      assert.deepEqual(errors, []);
      await page.close();
    }
  });

  /*
   * Seen to fail on the timeline of `30033e5`, under a coarse pointer (a touch screen):
   *
   *   ✖ short: under a finger the half-hour bar has a 44px grab area of padding round it, and its body is its own
   *     AssertionError [ERR_ASSERTION]: a press on its centre is on its body, not on one of its ends
   *       actual: 'an end',
   *       expected: 'the body',
   */
  test('short: under a finger the half-hour bar has a 44px grab area of padding round it, and its body is its own', async () => {
    const { page, errors } = await open({ width: 600, height: 700 }, '?scale=week', { hasTouch: true, isMobile: true });
    assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), true);
    const box = await shortBar(page);
    assert.equal(box.grabs, 'the body', 'a press on its centre is on its body, not on one of its ends');
    assert.equal(box.centre, 'quick');
    assert.deepEqual([box.before, box.after, box.far], ['quick', 'quick', null], '10px either side is the bar\'s padding; 30px is not');
    assert.ok(box.width < 44, `the drawn bar stays ${box.width}px wide, not padded to a target`);
    await drag(page, { x: box.x + box.width / 2, y: box.y + box.height / 2 }, { x: box.x + box.width / 2 + 45, y: box.y + box.height / 2 });
    const [, , start, end] = (await log(page)).findLast(([name]) => name === 'change');
    assert.equal(new Date(end) - new Date(start), 30 * 60 * 1000, 'a drag from its centre moves it whole');
    assert.deepEqual(errors, []);
    await page.close();
  });

  /**
   * What a finger finds on bar `id` and beside it: the bar's box, whose bar is under its middle, and the box the link
   * handle's reach covers along the bar's middle line and down the line through the middle of that reach (null: none).
   */
  const fingerOn = (page, id) => page.evaluate((barId) => {
    const bar = document.querySelector(`.cloudcanvas-ui-timeline-bar[data-ui-id="${barId}"]`);
    bar.scrollIntoView({ block: 'center', inline: 'center' });
    const box = bar.getBoundingClientRect();
    const [x, y] = [box.left + box.width / 2, box.top + box.height / 2];
    const found = document.elementFromPoint(x, y);
    const isLink = (px, py) => Boolean(document.elementFromPoint(px, py)?.closest('.cloudcanvas-ui-timeline-link'));
    const span = (from, to, test) => {
      let first = null;
      let last = null;
      for (let at = from; at <= to; at += 0.5) if (test(at)) { first ??= at; last = at; }
      return first === null ? null : [first, last];
    };
    const across = span(box.right - 40, box.right + 100, (px) => isLink(px, y));
    const down = across && span(y - 40, y + 40, (py) => isLink((across[0] + across[1]) / 2, py));
    return { bar: [box.left, box.right, box.top, box.bottom], middle: found?.closest('.cloudcanvas-ui-timeline-bar')?.getAttribute('data-ui-id') ?? found?.className ?? null,
      link: across && { left: across[0], right: across[1], height: down[1] - down[0] } };
  }, id);

  /** Hold a finger at `point` for `ms`, without moving it: a long press. */
  async function longPress(page, point, ms = 600) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await page.waitForTimeout(ms);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }

  /*
   * Seen to fail on the timeline of `fc5c778` (390px wide, a finger, `onLink` given; the half-hour bar is drawn 20px wide):
   *
   *   ✖ short: under a finger the half-hour bar has a 44px grab area of padding round it, and its body is its own
   *     AssertionError [ERR_ASSERTION]: null !== 'quick'            (a press on the bar's middle found the link handle: `box.centre`)
   *   ✖ link handle: under a finger the middle of a bar is the bar's - a tap opens it, a finger held on it is held on the item - and the link handle's reach lies past its right end
   *     AssertionError [ERR_ASSERTION]: day, quick: a finger on the middle of 'quick' finds the bar, not the link handle: 'cloudcanvas-ui-timeline-link'
   *
   * With the bars' middles given back, and the handle's reach not yet gone from a bar that is unselected:
   *
   *     AssertionError [ERR_ASSERTION]: day, day: a bar narrower than two targets has no link handle to find until it is selected: {"left":216.5,"right":260.5,"height":40.5}
   *
   * The handle's 44px reach was centred on its 12px dot, 6px past the bar: it covered the bar's last 10px and, on a bar 20px
   * wide, its middle - the tap opened nothing and a finger held there was held on the handle, not on the item. Its height
   * was 40.5px, not 44: a row was 36px tall, the sheet's own rule coming after the coarse one. And on a milestone:
   *
   *     AssertionError [ERR_ASSERTION]: day, ship: selected, the handle's reach starts at the bar's right edge or past it: {"bar":[182.98,207.02,385.98,410.02],"middle":"ship","link":{"left":205.02,"right":253.52,"height":44}}
   *
   * (the dot, drawn 14px from the milestone's middle, stood 2px over its right corner).
   */
  test('link handle: under a finger the middle of a bar is the bar\'s - a tap opens it, a finger held on it is held on the item - and the link handle\'s reach lies past its right end', async () => {
    for (const scale of ['day', 'week']) {
      const { page, errors } = await open({ width: 390, height: 844 }, `?scale=${scale}`, { hasTouch: true, isMobile: true });
      assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), true);
      for (const id of ['quick', 'five', 'day', 'ship']) {
        const where = `${scale}, ${id}`;
        const rest = await fingerOn(page, id);
        assert.equal(rest.middle, id, `${where}: a finger on the middle of '${id}' finds the bar, not the link handle: '${rest.middle}'`);
        assert.equal(rest.link, null, `${where}: a bar narrower than two targets has no link handle to find until it is selected: ${JSON.stringify(rest.link)}`);
        const [x, y] = [(rest.bar[0] + rest.bar[1]) / 2, (rest.bar[2] + rest.bar[3]) / 2];
        await page.touchscreen.tap(x, y);
        assert.deepEqual((await log(page)).at(-1), ['open', id], `${where}: a tap on its middle opens it`);
        const selected = await fingerOn(page, id);
        assert.equal(selected.middle, id, `${where}: selected, the middle is still the bar's`);
        assert.ok(selected.link && selected.link.left >= selected.bar[1] - 0.5, `${where}: selected, the handle's reach starts at the bar's right edge or past it: ${JSON.stringify(selected)}`);
        assert.ok(selected.link.right - selected.link.left >= 43.5 && selected.link.height >= 43.5, `${where}: and is a 44px target: ${JSON.stringify(selected.link)}`);
        await longPress(page, { x, y });
        assert.equal(await page.evaluate(() => window.pressed.at(-1)), id, `${where}: a finger held on its middle is held on the item: a host's long-press menu opens for it`);
      }
      // 'Draft' lasts four days: 256px at the day scale, two targets or more; 80px at the week scale, less.
      const draft = await fingerOn(page, 'draft');
      assert.equal(draft.middle, 'draft', `${scale}: the middle of the bar of four days is the bar's`);
      if (scale === 'day') assert.ok(draft.link && draft.link.left >= draft.bar[1] - 0.5, `${scale}: a bar of two targets or more has its handle's reach past its right end all the time: ${JSON.stringify(draft)}`);
      else assert.equal(draft.link, null, `${scale}: a bar of 80px is narrow: no reach until it is selected`);
      assert.deepEqual(errors, []);
      await page.close();
    }
  });

  /*
   * Seen to fail on the timeline of `2b81a34`, on a page that resets no box sizes (the touch audit found a bar's reach cut by the title column):
   *
   *   ✖ gutter: a row's title column is as wide as the axis' corner, so a bar stands under its date
   *     AssertionError [ERR_ASSERTION]: the titles stand 160px wide at the axis and 176px wide in a row: the tracks start 16px past the ticks
   *
   * The title column's padding (8px each side) was added to its width: content-box, as a page that resets nothing draws it.
   */
  test('gutter: a row\'s title column is as wide as the axis\' corner, so a bar stands under its date', onPage(async (page) => {
    const [corner, label, ticks, track] = await page.evaluate(() => ['.cloudcanvas-ui-timeline-corner', '.cloudcanvas-ui-timeline-row .cloudcanvas-ui-timeline-label',
      '.cloudcanvas-ui-timeline-ticks', '.cloudcanvas-ui-timeline-row .cloudcanvas-ui-timeline-track'].map((selector) => document.querySelector(selector).getBoundingClientRect()).map((box) => [box.left, box.width]));
    assert.equal(label[1], corner[1], `the titles stand ${corner[1]}px wide at the axis and ${label[1]}px wide in a row: the tracks start ${track[0] - ticks[0]}px past the ticks`);
    assert.equal(track[0], ticks[0], 'a row\'s track starts where the axis\' ticks do');
  }));

  const windows = (page) => page.evaluate(() => window.windows);

  /*
   * Seen to fail on the timeline of `df07671`:
   *
   *   ✖ window: the days on screen are reported when the sheet is drawn and again, once, after it is scrolled or zoomed
   *     page.waitForFunction: Timeout 30000ms exceeded.
   *       (waiting for the first report, `window.windows.length > 0`: the timeline told the page nothing)
   */
  test('window: the days on screen are reported when the sheet is drawn and again, once, after it is scrolled or zoomed', onPage(async (page) => {
    await page.waitForFunction(() => window.windows.length > 0);
    const first = await windows(page);
    assert.equal(first.length, 1, 'reported once the sheet is drawn');
    assert.ok(first[0][0] <= '2026-09-28' && first[0][1] >= '2026-10-06', `the bars of the 28th and the 6th are on screen: ${first[0]}`);
    const sheet = page.locator('.cloudcanvas-ui-timeline-sheet');
    await sheet.evaluate((node) => { node.scrollLeft += 200; node.scrollLeft += 20; });
    await page.waitForFunction(() => window.windows.length > 1);
    const [, scrolled] = await windows(page);
    assert.equal((await windows(page)).length, 2, 'one report for the scroll, not one a step');
    const days = (key) => Date.UTC(...key.split('-').map((part, at) => Number(part) - (at === 1 ? 1 : 0))) / 86400000;
    assert.equal(days(scrolled[0]) - days(first[0][0]), 11, 'eleven days further on: 220px at 20px a day');
    await page.click('.cloudcanvas-ui-timeline-scale[data-scale="month"]');
    await page.waitForFunction(() => window.windows.length > 2);
    const [, , zoomed] = await windows(page);
    assert.ok(days(zoomed[1]) - days(zoomed[0]) > days(scrolled[1]) - days(scrolled[0]), 'at the month scale more days are on screen');
  }));

  const days = (key) => Date.UTC(...key.split('-').map((part, at) => Number(part) - (at === 1 ? 1 : 0))) / 86400000;
  const scrollOf = (page) => page.evaluate(() => document.querySelector('.cloudcanvas-ui-timeline-sheet').scrollLeft);
  const BAR_OF = (id) => `.cloudcanvas-ui-timeline-bar[data-ui-id="${id}"]`;
  /** The track the sheet shows, in page px: where it starts (right of the gutter), where it ends and its middle. */
  const trackOf = (page) => page.evaluate(() => {
    const node = document.querySelector('.cloudcanvas-ui-timeline-sheet');
    const gutter = document.querySelector('.cloudcanvas-ui-timeline-corner').getBoundingClientRect().width;
    const [left, right] = [node.getBoundingClientRect().left + node.clientLeft + gutter, node.getBoundingClientRect().left + node.clientLeft + node.clientWidth];
    return { left, right, middle: (left + right) / 2 };
  });

  /*
   * Found in Momentum, where a bar pressed opens an item view that narrows the sheet and the shell puts back the pixel offset it
   * read before. Seen to fail on the timeline of `98d52d1`, narrowing the sheet from 1440 to 600px and putting the offset back:
   *
   *   ✖ narrow: a sheet that narrows keeps its dates where the host puts back the pixel offset it read before the layout changed
   *     AssertionError [ERR_ASSERTION]: the same first day is at the left: 2026-11-13 was 2026-10-03
   *       (the margin was a sheet's width of days, so it shrank with the sheet and the axis' start moved on)
   */
  test('narrow: a sheet that narrows keeps its dates where the host puts back the pixel offset it read before the layout changed', onPage(async (page) => {
    await page.waitForFunction(() => window.windows.length > 0);
    await page.locator('.cloudcanvas-ui-timeline-sheet').evaluate((node) => { node.scrollLeft += 240; });
    await page.waitForFunction(() => window.windows.length > 1);
    const first = (await windows(page)).at(-1);
    const read = await scrollOf(page);
    await page.setViewportSize({ width: 600, height: 700 });
    // Two frames on, the kit has seen its sheet narrow: now the host, which kept a pane's place, puts back what it read.
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
    await page.evaluate((left) => { document.querySelector('.cloudcanvas-ui-timeline-sheet').scrollLeft = left; }, read);
    await page.waitForTimeout(400);
    const after = (await windows(page)).at(-1);
    assert.equal(after[0], first[0], `the same first day is at the left: ${after[0]} was ${first[0]}`);
    assert.ok(days(after[1]) < days(first[1]), 'and fewer days are on screen');
  }));

  /*
   * Seen to fail on the timeline of `98d52d1`:
   *
   *   ✖ link handle: after a link is dragged from a bar's handle the bar holds the focus, so the sheet's keys are heard
   *     AssertionError [ERR_ASSERTION]: the bar it was dragged from holds the focus: BODY
   *       (the press on the handle, which cannot hold focus, took it from where it was)
   */
  test('link handle: after a link is dragged from a bar\'s handle the bar holds the focus, so the sheet\'s keys are heard', onPage(async (page) => {
    await page.locator(BAR_OF('draft')).hover();
    const scrolledBefore = await scrollOf(page);
    const handle = centre(await page.locator('.cloudcanvas-ui-timeline-link[data-link-from="draft"]').boundingBox());
    const target = centre(await page.locator(BAR_OF('day')).boundingBox());
    await page.mouse.move(handle.x, handle.y);
    await page.mouse.down();
    await page.mouse.move(target.x, target.y, { steps: 8 });
    await page.mouse.up();
    assert.deepEqual((await log(page)).at(-1), ['link', 'draft', 'day']);
    const held = await page.evaluate(() => document.activeElement.getAttribute('data-ui-id') ?? document.activeElement.tagName);
    assert.equal(held, 'draft', `the bar it was dragged from holds the focus: ${held}`);
    assert.equal(await scrollOf(page), scrolledBefore, 'and the sheet was not scrolled to it');
  }));

  const FAR = { id: 'far', title: 'Far', start: new Date('2026-12-14T00:00'), end: new Date('2026-12-17T00:00'), group: { id: 'book', label: 'Writing' } };
  /** The far bar's box against the track the sheet shows: how far its middle is from the track's, and whether it is wholly inside it. */
  const farAgainstTrack = async (page) => {
    const track = await trackOf(page);
    const bar = await page.locator(BAR_OF('far')).boundingBox();
    return { offset: Math.round(bar.x + bar.width / 2 - track.middle), edge: Math.round(track.right - bar.x - bar.width), inside: bar.x >= track.left && bar.x + bar.width <= track.right };
  };

  /*
   * Seen to fail on the timeline of `98d52d1`, where a `focusId` given with an update that did not yet draw its item was forgotten, so
   * the update that drew it scrolled nothing and the browser's own focus() left the bar flush against the sheet's edge:
   *
   *   ✖ focus: an item whose update comes after the focusId is brought to the middle, and a bar flush against an edge of the sheet is too
   *     AssertionError [ERR_ASSERTION]: the far bar is in the middle of the track, not at its edge: 1080px from it
   *
   * The second half (a bar the reader has scrolled flush against the edge) was mutation-proved: with the room a bar keeps from the
   * edges taken out (`clearOf` answering 0), observed:
   *
   *     AssertionError [ERR_ASSERTION]: and brought to the middle: 601px from it
   */
  test('focus: an item whose update comes after the focusId is brought to the middle, and a bar flush against an edge of the sheet is too', onPage(async (page) => {
    await page.evaluate((far) => { window.timeline.update({ ...window.model, focusId: 'far' }); window.timeline.update({ ...window.model, items: [...window.model.items, far], focusId: 'far' }); }, FAR);
    await page.waitForTimeout(100);
    const kept = await farAgainstTrack(page);
    assert.ok(kept.inside && Math.abs(kept.offset) <= 2, `the far bar is in the middle of the track, not at its edge: ${kept.offset}px from it`);
    // The reader scrolls it flush against the right edge: the sheet's own focus() would leave it so; asked for again, it is brought to the middle.
    await page.evaluate((far) => {
      const sheet = document.querySelector('.cloudcanvas-ui-timeline-sheet');
      const bar = document.querySelector('.cloudcanvas-ui-timeline-bar[data-ui-id="far"]').getBoundingClientRect();
      sheet.scrollLeft += bar.right - (sheet.getBoundingClientRect().left + sheet.clientLeft + sheet.clientWidth);
      window.timeline.update({ ...window.model, items: [...window.model.items, far], focusId: null });
    }, FAR);
    await page.waitForTimeout(50);
    const flush = await farAgainstTrack(page);
    assert.ok(flush.inside && flush.offset > 200 && flush.edge <= 1, `the reader has it flush right: ${flush.offset}px right of the middle, ${flush.edge}px from the edge`);
    await page.evaluate((far) => window.timeline.update({ ...window.model, items: [...window.model.items, far], focusId: 'far' }), FAR);
    await page.waitForTimeout(50);
    const centred = await farAgainstTrack(page);
    assert.ok(centred.inside && Math.abs(centred.offset) <= 2, `and brought to the middle: ${centred.offset}px from it`);
  }));

  /*
   * Seen to fail on the timeline of `98d52d1`, where the scale buttons kept the pixel offset (Weeks, Oct 25 to Dec 13, became Months,
   * Dec 1 to Jun 15 in Momentum):
   *
   *   ✖ scale: the buttons keep the day at the middle of the window where it was, and Ctrl and the wheel keep the day under the pointer
   *     AssertionError [ERR_ASSERTION]: week to day: the middle of the window moved 42 days: 2026-11-26 to 2026-10-15
   */
  test('scale: the buttons keep the day at the middle of the window where it was, and Ctrl and the wheel keep the day under the pointer', onPage(async (page) => {
    await page.waitForFunction(() => window.windows.length > 0);
    await page.locator('.cloudcanvas-ui-timeline-sheet').evaluate((node) => { node.scrollLeft += 700; });
    let seen = (await (async () => { await page.waitForFunction(() => window.windows.length > 1); return windows(page); })()).length;
    let scale = 'week';
    let was = (days((await windows(page)).at(-1)[0]) + days((await windows(page)).at(-1)[1])) / 2;
    for (const next of ['day', 'week', 'month', 'week']) {
      await page.click(`.cloudcanvas-ui-timeline-scale[data-scale="${next}"]`);
      await page.waitForFunction((count) => window.windows.length > count, seen);
      const [from, to] = (await windows(page)).at(-1);
      const now = (days(from) + days(to)) / 2;
      seen = (await windows(page)).length;
      assert.ok(Math.abs(now - was) <= 1.5, `${scale} to ${next}: the middle of the window moved ${Math.abs(now - was)} days: ${new Date(was * 86400000).toISOString().slice(0, 10)} to ${new Date(now * 86400000).toISOString().slice(0, 10)}`);
      scale = next;
      was = now;
    }
    const track = await trackOf(page);
    const pointer = { x: track.left + (track.right - track.left) * 0.75, y: 200 };
    // The day under a point: the draft bar starts on the 28th of September, and a day is `perDay` px wide at the scale drawn.
    const dayUnder = (perDay) => page.evaluate(({ x, per }) => (x - document.querySelector('.cloudcanvas-ui-timeline-bar[data-ui-id="draft"]').getBoundingClientRect().left) / per,
      { x: pointer.x, per: perDay });
    const before = await dayUnder(20);
    await page.mouse.move(pointer.x, pointer.y);
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -120);
    await page.keyboard.up('Control');
    await page.waitForFunction(() => document.querySelector('.cloudcanvas-ui-timeline-scale[data-scale="day"]').getAttribute('aria-pressed') === 'true');
    const after = await dayUnder(64);
    assert.ok(Math.abs(after - before) < 0.5, `the day under the pointer stays under it: ${before} days from the 28th, then ${after}`);
  }));
}
