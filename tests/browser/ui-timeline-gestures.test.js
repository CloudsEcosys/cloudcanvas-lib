/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The timeline in real Chromium, for what a test DOM cannot show: a span drawn
 * by keyboard alone (the band where its days are, what is said, and a Space
 * that is no press of the face it was on), a drag held at an edge of the sheet
 * that scrolls it - smoothly, or by whole days for a reader who asked for less
 * motion - and a folded group's summary bar, where its days are on the axis.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadChromium, PLAYWRIGHT_MISSING, startStaticServer } from './harness.js';

const chromium = await loadChromium();
const FIXTURE = '/tests/browser/fixtures/ui-timeline.html';
const DAY_PX = 20;

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('ui timeline gestures browser', { skip: 'playwright is not installed' }, () => {});
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

  /** A fresh page on the fixture at the week scale; any page error or console error fails the test. */
  async function open({ reducedMotion = 'no-preference' } = {}) {
    const page = await scope.browser.newPage({ viewport: { width: 1440, height: 700 }, reducedMotion });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${scope.server.url}${FIXTURE}`);
    await page.waitForFunction(() => window.ready === true);
    return { page, errors };
  }

  const onPage = (body, options) => () => open(options).then(({ page, errors }) => body(page).then(() => assert.deepEqual(errors, [])).finally(() => page.close()));
  const log = (page) => page.evaluate(() => window.log);
  /** The box of the first `selector`, or null when none is drawn: read at once, never waited for. */
  const box = (page, selector) => page.evaluate((css) => {
    const found = document.querySelector(css)?.getBoundingClientRect();
    return found ? { x: found.x, y: found.y, width: found.width, height: found.height } : null;
  }, selector);
  const BAR = (id) => `.cloudcanvas-ui-timeline-bar[data-ui-id="${id}"]`;
  const BAND = '.cloudcanvas-ui-timeline-draft';
  const scrollOf = (page) => page.evaluate(() => document.querySelector('.cloudcanvas-ui-timeline-sheet').scrollLeft);
  const said = (page) => page.evaluate(() => document.querySelector('.cloudcanvas-ui-timeline [role="status"]').textContent.trim());

  /*
   * Seen to fail on the timeline of `f28f269`, where N did nothing:
   *
   *   ✖ draw: a span drawn by keyboard alone - N, the arrows, Space, Enter - stands where its days are and is reported
   *     AssertionError [ERR_ASSERTION]: a band on the bar's row, on the day after it
   *       actual: null,
   *       expected: true,
   *
   * With the keys in, it then read
   *
   *     AssertionError [ERR_ASSERTION]: a day wide where the bar begins: [{"x":309,"y":132,"width":40,"height":24},{"x":309,"y":132,"width":80,"height":24}]
   *       (the cursor then started on the bar's first day; it starts on the day after the bar now)
   *
   * the band - a drag's too - was drawn content-box: its padding and border made it 20px wider than its days.
   */
  test('draw: a span drawn by keyboard alone - N, the arrows, Space, Enter - stands where its days are and is reported', onPage(async (page) => {
    const draft = await box(page, BAR('draft'));
    await page.focus(BAR('draft'));
    await page.keyboard.press('n');
    const cursor = await box(page, BAND);
    assert.ok(cursor, 'a band on the bar\'s row, on the day after it');
    assert.ok(Math.abs(cursor.x - (draft.x + draft.width)) <= 1 && Math.abs(cursor.width - DAY_PX) <= 1, `a day wide where the bar ends: ${JSON.stringify([cursor, draft])}`);
    assert.ok(cursor.y >= draft.y - 8 && cursor.y + cursor.height <= draft.y + draft.height + 8, 'on the bar\'s row');
    for (const key of ['ArrowRight', 'Space', 'ArrowRight', 'ArrowRight']) await page.keyboard.press(key);
    const span = await box(page, BAND);
    assert.ok(Math.abs(span.x - (draft.x + draft.width + DAY_PX)) <= 1 && Math.abs(span.width - 3 * DAY_PX) <= 1, `three days from the 3rd: ${JSON.stringify(span)}`);
    assert.equal(await page.textContent(BAND), 'Oct 3 – Oct 5');
    assert.equal(await said(page), 'Oct 3 to Oct 5, 3 days');
    await page.keyboard.press('Enter');
    assert.deepEqual((await log(page)).at(-1), ['create', 'book', '2026-10-03', '2026-10-06']);
    assert.equal(await page.locator(BAND).count(), 0, 'the band goes with it');
    assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-ui-id')), 'draft', 'the focus is where it was');
    assert.equal((await log(page)).filter(([name]) => name === 'open').length, 0, 'Enter opened nothing');
  }));

  /*
   * Seen to fail on the timeline of `f28f269`:
   *
   *   ✖ draw: from a heading the cursor reaches the heading's own empty row; the Space that anchors it opens nothing
   *     AssertionError [ERR_ASSERTION]: today, on the Writing heading's row
   *       actual: undefined,
   *       expected: [ 'create', 'book', '2026-09-29', '2026-09-30' ],
   */
  test('draw: from a heading the cursor reaches the heading\'s own empty row; the Space that anchors it opens nothing', onPage(async (page) => {
    const heading = page.locator('.cloudcanvas-ui-timeline-group-label', { hasText: 'Writing' });
    await heading.focus();
    for (const key of ['n', 'Space', 'Space']) await page.keyboard.press(key);
    assert.deepEqual((await log(page)).at(-1), ['create', 'book', '2026-09-29', '2026-09-30'], 'today, on the Writing heading\'s row');
    assert.equal((await log(page)).filter(([name]) => name === 'open').length, 0, 'the Space that anchored, and the one that added, opened nothing');
    await page.focus(BAR('ship'));
    for (const key of ['n', 'ArrowUp']) await page.keyboard.press(key);
    const row = await page.evaluate((band) => document.querySelector(band).closest('.cloudcanvas-ui-timeline-group')?.querySelector('.cloudcanvas-ui-timeline-group-cell').textContent, BAND);
    assert.equal(row, 'Release', 'Up from a bar is its heading\'s row, a heading that is a name alone too');
    await page.keyboard.press('Escape');
    assert.equal(await said(page), 'No span drawn.');
  }));

  /** The box of what the band says: its tag when it has one, else the band's own text (a range over its contents). */
  const wordsOf = (page) => page.evaluate((css) => {
    const band = document.querySelector(css);
    const range = document.createRange();
    range.selectNodeContents(band.querySelector('.cloudcanvas-ui-timeline-draft-words') ?? band);
    const { x, y, width, height } = band.querySelector('.cloudcanvas-ui-timeline-draft-words')?.getBoundingClientRect() ?? range.getBoundingClientRect();
    return { x, y, width, height };
  }, BAND);
  const overlap = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

  /*
   * K8, written before the code and run on the timeline of `8f8720e`: the cursor's dates ran on past a one-day band, over the title the
   * short bar and the milestone draw beside themselves, on the same line.
   *
   *   ✖ draw: the dates a band says stand clear of the title a short bar or a milestone draws beside itself, on every day the cursor reaches
   *     AssertionError [ERR_ASSERTION]: line height normal, quick, day 1: the dates {"x":439,"y":175,"width":26.296875,"height":12} are written over the title {"x":446.5,"y":175,"width":71.546875,"height":12}
   *
   * The line heights are there because the first tag, a fixed 2px above the band's foot, cleared the title at a normal line height and
   * not at the 1.5 Momentum hands its titles (found in its demo: a title's box 16.5px tall, the dates 2px into it); with that tag in the sheet:
   *
   *   ✖ draw: the dates a band says stand clear of the title a short bar or a milestone draws beside itself, on every day the cursor reaches
   *     AssertionError [ERR_ASSERTION]: line height 1.5, quick, day 1: the dates {"x":429,"y":195,"width":34.296875,"height":11} are written over the title {"x":446.5,"y":178.75,"width":71.546875,"height":16.5}
   *
   * and with a tag that overlaps nothing but the grid keeping no room under its last row (the folded heading's, with nothing below it):
   *
   *   ✖ draw: the dates a band says stand clear of the title a short bar or a milestone draws beside itself, on every day the cursor reaches
   *     AssertionError [ERR_ASSERTION]: the tag below it adds nothing to scroll
   *       4 !== 0
   *
   * and, for the drag (the case below it), on the same page:
   *
   *   ✖ draw: a dragged band keeps its dates clear of the title it is dragged across
   *     AssertionError [ERR_ASSERTION]: the dates {"x":439,"y":175,"width":64.8125,"height":12} are written over the title {"x":446.5,"y":175,"width":71.546875,"height":12}
   */
  test('draw: the dates a band says stand clear of the title a short bar or a milestone draws beside itself, on every day the cursor reaches', onPage(async (page) => {
    const sheet = await box(page, '.cloudcanvas-ui-timeline-sheet');
    // The kit's titles take the line height the page hands down: normal, and the 1.5 a host such as Momentum sets on its body (a title's box 16.5px tall).
    for (const lineHeight of ['normal', '1.5']) {
      await page.evaluate((value) => { document.body.style.lineHeight = value; }, lineHeight);
      for (const id of ['quick', 'ship']) {
        const title = await box(page, `[data-row-id="${id}"] .cloudcanvas-ui-timeline-outside`);
        assert.ok(title, `${id}: a title beside the bar`);
        await page.focus(BAR(id));
        await page.keyboard.press('n');
        for (let day = 0; day < 6; day += 1) {
          const words = await wordsOf(page);
          assert.ok(words.width > 0 && words.x >= sheet.x && words.x + words.width <= sheet.x + sheet.width, `line height ${lineHeight}, ${id}, day ${day}: the dates are drawn on the sheet: ${JSON.stringify(words)}`);
          assert.ok(!overlap(words, title), `line height ${lineHeight}, ${id}, day ${day}: the dates ${JSON.stringify(words)} are written over the title ${JSON.stringify(title)}`);
          await page.keyboard.press('ArrowRight');
        }
        await page.keyboard.press('Escape');
      }
    }
    // The last row has no row under it to hold its tag: the grid keeps the room, so drawing there makes the sheet no taller to scroll.
    const scrollRange = () => page.evaluate(() => { const node = document.querySelector('.cloudcanvas-ui-timeline-sheet'); return node.scrollHeight - node.clientHeight; });
    const resting = await scrollRange();
    await page.locator('.cloudcanvas-ui-timeline-group-label', { hasText: 'Folded parent' }).focus();
    await page.keyboard.press('n');
    assert.ok(await page.locator(BAND).count() === 1, 'a band on the last row, the folded group\'s heading');
    assert.equal(await scrollRange(), resting, 'the tag below it adds nothing to scroll');
  }));

  test('draw: a dragged band keeps its dates clear of the title it is dragged across', onPage(async (page) => {
    const title = await box(page, '[data-row-id="quick"] .cloudcanvas-ui-timeline-outside');
    const row = await box(page, '[data-row-id="quick"]');
    const y = row.y + row.height / 2;
    await page.mouse.move(title.x + title.width + 30, y);
    await page.mouse.down();
    await page.mouse.move(title.x - 6, y, { steps: 8 });
    const words = await wordsOf(page);
    await page.mouse.up();
    assert.ok(words.width > 0, 'the band says its days');
    assert.ok(!overlap(words, title), `the dates ${JSON.stringify(words)} are written over the title ${JSON.stringify(title)}`);
    assert.equal((await log(page)).at(-1)[0], 'create', 'and the drag made its span');
  }));

  /** Press at `from`, travel to `to` and hold there for `ms`, sampling the sheet's scroll every 50ms; then let go. */
  async function hold(page, from, to, ms) {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 8 });
    const samples = [await scrollOf(page)];
    for (let waited = 0; waited < ms; waited += 50) {
      await page.waitForTimeout(50);
      samples.push(await scrollOf(page));
    }
    const band = await box(page, BAND);
    await page.mouse.up();
    return { samples, band };
  }

  /*
   * Seen to fail on the timeline of `f28f269`, which never scrolled a drag:
   *
   *   ✖ edge: a span held at the right edge of the sheet scrolls it on, the band reaching the pointer, and stops when let go
   *     AssertionError [ERR_ASSERTION]: held at the edge, the sheet scrolls on: 1360,1360,1360,1360,1360,1360,1360,1360,1360,1360,1360,1360,1360
   *       actual: false,
   *       expected: true,
   */
  test('edge: a span held at the right edge of the sheet scrolls it on, the band reaching the pointer, and stops when let go', onPage(async (page) => {
    const sheet = await box(page, '.cloudcanvas-ui-timeline-sheet');
    const row = await box(page, '[data-row-id="draft"]');
    const y = row.y + row.height / 2;
    const { samples, band } = await hold(page, { x: sheet.x + 700, y }, { x: sheet.x + sheet.width - 30, y }, 600);
    assert.ok(samples.at(-1) - samples[0] > 100, `held at the edge, the sheet scrolls on: ${samples}`);
    assert.ok(band && Math.abs(band.x + band.width - (sheet.x + sheet.width - 30)) <= DAY_PX + 1, `the band reaches the day under the pointer: ${JSON.stringify(band)}`);
    const [, group, start, end] = (await log(page)).at(-1);
    const shownAtPress = (sheet.width - 30 - 700) / DAY_PX;
    const days = (Date.parse(end) - Date.parse(start)) / 86400000;
    assert.equal(group, 'book');
    assert.ok(days > shownAtPress + 5, `the span runs past what the sheet showed when the drag began: ${days} days`);
    const stopped = await scrollOf(page);
    await page.waitForTimeout(300);
    assert.equal(await scrollOf(page), stopped, 'let go, it stops');
  }));

  /*
   * Seen to fail on the timeline of `f28f269`:
   *
   *   ✖ edge: a bar held at the left edge scrolls the sheet back and is moved by the days that passed under it
   *     AssertionError [ERR_ASSERTION]: held at the left edge, the sheet scrolls back: 1360,1360,1360,1360,1360,1360,1360,1360,1360,1360,1360
   *       actual: false,
   *       expected: true,
   */
  test('edge: a bar held at the left edge scrolls the sheet back and is moved by the days that passed under it', onPage(async (page) => {
    const sheet = await box(page, '.cloudcanvas-ui-timeline-sheet');
    const bar = await box(page, BAR('day'));
    const from = { x: bar.x + bar.width / 2, y: bar.y + bar.height / 2 };
    const to = { x: sheet.x + 160 + 10, y: from.y };
    const { samples } = await hold(page, from, to, 500);
    const back = samples[0] - samples.at(-1);
    assert.ok(back > 100, `held at the left edge, the sheet scrolls back: ${samples}`);
    const [name, id, start] = (await log(page)).at(-1);
    const moved = Math.round((Date.parse(start) - new Date('2026-10-04T00:00').getTime()) / 86400000);
    const travel = Math.round((to.x - from.x) / DAY_PX);
    assert.deepEqual([name, id], ['change', 'day']);
    assert.ok(moved < travel - 3, `moved ${moved} days: the pointer's ${travel} and the days scrolled past it`);
  }));

  /*
   * Seen to fail on the timeline of `f28f269`:
   *
   *   ✖ edge: for a reader who asked for less motion the sheet jumps by whole days at a steady pace, never gliding
   *     AssertionError [ERR_ASSERTION]: it steps: 1360,1360,1360,1360,1360,1360,1360,1360,1360,1360,1360,1360,1360,1360,1360,1360,1360,1360,1360,1360,1360,1360,1360
   *       actual: false,
   *       expected: true,
   */
  test('edge: for a reader who asked for less motion the sheet jumps by whole days at a steady pace, never gliding', onPage(async (page) => {
    assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
    const sheet = await box(page, '.cloudcanvas-ui-timeline-sheet');
    const row = await box(page, '[data-row-id="draft"]');
    const y = row.y + row.height / 2;
    const { samples } = await hold(page, { x: sheet.x + 700, y }, { x: sheet.x + sheet.width - 5, y }, 1100);
    const steps = samples.slice(1).map((value, at) => value - samples[at]).filter((delta) => delta !== 0);
    assert.ok(steps.length >= 3, `it steps: ${samples}`);
    assert.ok(steps.every((delta) => delta === 3 * DAY_PX), `each step is the same whole days: ${steps}`);
    assert.ok(steps.length <= 1100 / 250 + 1, `a step a quarter of a second at most: ${steps.length} in 1.1s`);
  }, { reducedMotion: 'reduce' }));

  /*
   * Seen to fail on the timeline of `f28f269`, whose folded heading drew nothing on its row:
   *
   *   ✖ summary: a folded group's summary stands over its items' days, says its name and count, opens the group and makes no span
   *     AssertionError [ERR_ASSERTION]: drawn
   *       actual: null,
   *       expected: true,
   */
  test('summary: a folded group\'s summary stands over its items\' days, says its name and count, opens the group and makes no span', onPage(async (page) => {
    const summary = await box(page, '.cloudcanvas-ui-timeline-summary');
    assert.ok(summary, 'drawn');
    const draft = await box(page, BAR('draft'));
    // The hidden child runs from Oct 3 to Oct 5: five days after the draft's 28th, two days long.
    assert.ok(Math.abs(summary.x - (draft.x + 5 * DAY_PX)) <= 1 && Math.abs(summary.width - 2 * DAY_PX) <= 1, `over Oct 3 and 4: ${JSON.stringify([summary, draft])}`);
    const heading = await box(page, '.cloudcanvas-ui-timeline-group:has(.cloudcanvas-ui-timeline-summary)');
    assert.ok(summary.y >= heading.y && summary.y + summary.height <= heading.y + heading.height, 'on the folded heading\'s row');
    assert.equal(await page.textContent('.cloudcanvas-ui-timeline-summary'), 'Folded parent, 1 item');
    const middle = { x: summary.x + summary.width / 2, y: summary.y + summary.height / 2 };
    await page.mouse.move(middle.x, middle.y);
    await page.mouse.down();
    await page.mouse.move(middle.x + 120, middle.y, { steps: 6 });
    assert.equal(await page.locator(BAND).count(), 0, 'a drag from it draws no band');
    await page.mouse.up();
    assert.equal((await log(page)).filter(([name]) => name === 'create').length, 0, 'and makes nothing');
    await page.mouse.click(middle.x, middle.y);
    assert.deepEqual((await log(page)).at(-1), ['open', 'folded', { summary: true }], 'a press says it is the summary\'s');
  }));

  /*
   * K8, written before the code and run on the timeline of `8f8720e`, which said `open folded` for the summary bar and for the group's
   * own heading alike, and `menu folded` for the right-click on either:
   *
   *   ✖ summary: a press or a right-click on it says it is the summary's, and on the same group's own heading it does not
   *     AssertionError [ERR_ASSERTION]: the same id four times: the summary's two say so, and the heading's two are as they were
   *       actual: [ [ 'menu', 'folded' ], [ 'menu', 'folded' ], [ 'open', 'folded' ], [ 'open', 'folded' ] ],
   *       expected: [ [ 'menu', 'folded', [Object] ], [ 'menu', 'folded' ], [ 'open', 'folded', [Object] ], [ 'open', 'folded' ] ],
   *
   * and the case above it, which had expected `open folded` of the press, read
   *
   *   ✖ summary: a folded group's summary stands over its items' days, says its name and count, opens the group and makes no span
   *     AssertionError [ERR_ASSERTION]: a press says it is the summary's
   *       actual: [ 'open', 'folded' ],
   *       expected: [ 'open', 'folded', { summary: true } ],
   */
  test('summary: a press or a right-click on it says it is the summary\'s, and on the same group\'s own heading it does not', onPage(async (page) => {
    const at = async (selector) => { const found = await box(page, selector); return { x: found.x + found.width / 2, y: found.y + found.height / 2 }; };
    const [summary, heading] = [await at('.cloudcanvas-ui-timeline-summary'), await at('.cloudcanvas-ui-timeline-group-label[data-ui-id="folded"]')];
    await page.mouse.click(summary.x, summary.y, { button: 'right' });
    await page.mouse.click(heading.x, heading.y, { button: 'right' });
    await page.mouse.click(summary.x, summary.y);
    await page.mouse.click(heading.x, heading.y);
    assert.deepEqual((await log(page)).filter(([name]) => name === 'menu' || name === 'open'),
      [['menu', 'folded', { summary: true }], ['menu', 'folded'], ['open', 'folded', { summary: true }], ['open', 'folded']],
      'the same id four times: the summary\'s two say so, and the heading\'s two are as they were');
  }));
}
