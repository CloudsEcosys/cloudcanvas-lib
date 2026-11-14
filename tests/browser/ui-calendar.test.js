/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The calendar in real Chromium: a range drawn by keyboard alone - down the
 * hours of a day, and across the days of the month - where its slots and days
 * are, kept in view as the cursor moves, reported as a drag reports it, and
 * no Space or Enter on a day that picks the day as well.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadChromium, PLAYWRIGHT_MISSING, startStaticServer } from './harness.js';

const chromium = await loadChromium();
const FIXTURE = '/tests/browser/fixtures/ui-calendar.html';

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('ui calendar browser', { skip: 'playwright is not installed' }, () => {});
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
  async function open(query = '') {
    const page = await scope.browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${scope.server.url}${FIXTURE}${query}`);
    await page.waitForFunction(() => window.ready === true);
    return { page, errors };
  }

  const onPage = (body, query) => () => open(query).then(({ page, errors }) => body(page).then(() => assert.deepEqual(errors, [])).finally(() => page.close()));
  const log = (page) => page.evaluate(() => window.log);
  const press = async (page, ...keys) => { for (const key of keys) await page.keyboard.press(key); };
  const BAND = '.cloudcanvas-ui-calendar-draft';

  /** The band's box, the column's, the hour grid's visible box and its height for one hour. */
  const geometry = (page) => page.evaluate((band) => {
    const node = document.querySelector(band);
    const rect = (element) => { const box = element.getBoundingClientRect(); return { top: box.top, bottom: box.bottom, left: box.left, right: box.right }; };
    const grid = document.querySelector('.cloudcanvas-ui-calendar-time-grid');
    return { band: node && rect(node), column: node && rect(node.closest('.cloudcanvas-ui-calendar-column')), shown: rect(document.querySelector('.cloudcanvas-ui-calendar-scroller')),
      gridTop: grid.getBoundingClientRect().top, hour: grid.getBoundingClientRect().height / 24, day: node?.closest('[data-date]')?.getAttribute('data-date') };
  }, BAND);

  /*
   * Seen to fail on the calendar of `f28f269`, where N did nothing:
   *
   *   ✖ draw: down the hours by keyboard alone - the band stands on its slots, stays in view, and Enter reports it
   *     AssertionError [ERR_ASSERTION]: a band in the day's column
   *       actual: null,
   *       expected: true,
   */
  test('draw: down the hours by keyboard alone - the band stands on its slots, stays in view, and Enter reports it', onPage(async (page) => {
    await page.focus('.cloudcanvas-ui-calendar-day-head[data-date="2026-09-29"]');
    await press(page, 'n');
    const first = await geometry(page);
    assert.ok(first.band, 'a band in the day\'s column');
    assert.equal(first.day, '2026-09-29');
    assert.ok(Math.abs(first.band.top - (first.gridTop + 8 * first.hour)) <= 1, `at 8:00, the first hour the grid shows: ${JSON.stringify(first)}`);
    assert.ok(first.band.left >= first.column.left && first.band.right <= first.column.right, 'within its column');
    await press(page, ...Array(32).fill('ArrowUp'));
    const top = await geometry(page);
    assert.ok(Math.abs(top.band.top - top.gridTop) <= 1, 'at midnight, eight hours up');
    assert.ok(top.band.top >= top.shown.top - 1 && top.band.bottom <= top.shown.bottom + 1, `and the grid has scrolled to show it: ${JSON.stringify(top)}`);
    await press(page, ...Array(34).fill('ArrowDown'), 'Space', 'ArrowDown', 'ArrowDown', 'ArrowDown');
    assert.equal(await page.textContent(BAND), '8:30 AM – 9:30 AM');
    await press(page, 'Enter');
    assert.deepEqual(await log(page), [['pick', '2026-09-29', '2026-09-29@08:30', '2026-09-29@09:30', null]], 'one pick, the range: neither the Space nor the Enter picked the day');
    assert.equal(await page.locator(BAND).count(), 0);
  }));

  /*
   * Seen to fail on the calendar of `f28f269`:
   *
   *   ✖ draw: across the days of the month by keyboard alone - the days are lit and Enter reports them all day
   *     AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
   *     + []
   *     - [
   *     -   '2026-09-30'
   *     - ]
   */
  test('draw: across the days of the month by keyboard alone - the days are lit and Enter reports them all day', onPage(async (page) => {
    await page.focus('.cloudcanvas-ui-calendar-day[data-date="2026-09-29"]');
    await press(page, 'n', 'ArrowRight');
    const lit = () => page.evaluate(() => [...document.querySelectorAll('.cloudcanvas-ui-calendar-cell.is-range')].map((cell) => cell.getAttribute('data-date')));
    assert.deepEqual(await lit(), ['2026-09-30']);
    const fill = await page.evaluate(() => getComputedStyle(document.querySelector('.cloudcanvas-ui-calendar-cell.is-range')).outlineStyle);
    assert.equal(fill, 'dashed', 'lit as a drag lights it');
    await press(page, 'Space', 'ArrowDown');
    assert.equal((await lit()).length, 8, 'a week on: the days between');
    await press(page, 'Enter');
    assert.deepEqual(await log(page), [['pick', '2026-09-30', '2026-09-30@00:00', '2026-10-08@00:00', true]]);
    assert.deepEqual(await lit(), []);
  }, '?view=month'));

  /*
   * Seen to fail on the calendar of `b954700`, which had no way to be told a day:
   *
   *   ✖ focusDay: Escape drops a range; the host gives the focus back to the day it began on, and a redraw keeps it there
   *     page.evaluate: TypeError: window.calendar.focusDay is not a function
   */
  test('focusDay: Escape drops a range; the host gives the focus back to the day it began on, and a redraw keeps it there', onPage(async (page) => {
    await page.focus('.cloudcanvas-ui-calendar-day[data-date="2026-09-29"]');
    await press(page, 'n', 'ArrowRight', 'ArrowRight', 'Escape');
    const focused = () => page.evaluate(() => document.activeElement?.getAttribute('data-date') ?? null);
    assert.equal(await focused(), '2026-10-01', 'the kit leaves the focus where the arrows took it');
    await page.evaluate(() => window.calendar.focusDay('2026-09-29'));
    assert.equal(await focused(), '2026-09-29');
    await page.evaluate(() => window.calendar.update(window.model));
    assert.equal(await focused(), '2026-09-29', 'the host draws again: the focus stays on the day it was given');
    await press(page, 'ArrowRight');
    assert.equal(await focused(), '2026-09-30', 'and the arrows go on from it');
  }, '?view=month'));
}
