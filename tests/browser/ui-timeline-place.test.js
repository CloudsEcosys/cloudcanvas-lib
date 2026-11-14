/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Where the reader is on the timeline, in real Chromium: a host hidden and
 * shown again (another tab in front) finds the sheet on the days it showed,
 * though it was updated meanwhile and its axis starts elsewhere; and a host
 * that keeps the place by date puts it back with `scrollToDate` and reads it
 * with `visibleStart`.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadChromium, PLAYWRIGHT_MISSING, startStaticServer } from './harness.js';

const chromium = await loadChromium();
const FIXTURE = '/tests/browser/fixtures/ui-timeline.html';

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('ui timeline place browser', { skip: 'playwright is not installed' }, () => {});
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
  async function open(viewport = { width: 1440, height: 700 }) {
    const page = await scope.browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${scope.server.url}${FIXTURE}`);
    await page.waitForFunction(() => window.ready === true);
    return { page, errors };
  }

  const onPage = (body, ...args) => () => open(...args).then(({ page, errors }) => body(page).then(() => assert.deepEqual(errors, [])).finally(() => page.close()));
  /** The moment at the track's left edge (`visibleStart`), as a time. */
  const leftEdge = (page) => page.evaluate(() => window.timeline.visibleStart().date.getTime());
  const PIXEL_MS = 72 * 60000;
  /** The days the toolbar says the sheet shows, after a frame for the browser to lay it out. */
  const range = (page) => page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() =>
    done(document.querySelector('.cloudcanvas-ui-timeline-range').textContent)))));

  /*
   * Seen to fail on the timeline of `b954700`, which drew the update while hidden at the scroll a hidden sheet reads (0). As first
   * written, with the place compared as the toolbar's range:
   *
   *   ✖ hidden: an update while the host is hidden waits; shown again, the sheet is on the days it showed
   *     AssertionError [ERR_ASSERTION]: nothing is drawn while the host is hidden
   *       actual: 1,
   *       expected: 0,
   *
   * and as it stands, the place read as a moment (`visibleStart`), which that timeline did not have:
   *     page.evaluate: TypeError: window.timeline.visibleStart is not a function
   * (The range compares days: the axis then starts before the clocks went forward, the day is not a whole pixel from its start,
   * and the browser's whole pixel shows a sliver of the day before: 'Oct 25 – Dec 28' for 'Oct 26 – Dec 28'.)
   */
  test('hidden: an update while the host is hidden waits; shown again, the sheet is on the days it showed', onPage(async (page) => {
    await page.evaluate(() => { document.querySelector('.cloudcanvas-ui-timeline-sheet').scrollLeft += 700; });
    await range(page);
    const shown = await leftEdge(page);
    await page.evaluate(() => {
      document.getElementById('timeline-host').style.display = 'none';
      const early = { id: 'early', title: 'Early', start: new Date('2026-05-04T00:00'), end: new Date('2026-05-06T00:00') };
      window.timeline.update({ ...window.model, items: [...window.model.items, early] });
    });
    assert.equal(await page.locator('.cloudcanvas-ui-timeline-bar[data-ui-id="early"]').count(), 0, 'nothing is drawn while the host is hidden');
    await page.evaluate(() => { document.getElementById('timeline-host').style.display = ''; });
    await page.waitForSelector('.cloudcanvas-ui-timeline-bar[data-ui-id="early"]', { state: 'attached' });
    await range(page);
    const back = await leftEdge(page);
    // A pixel of the week scale is 72 minutes; the axis now starts in February, before the clocks went forward, so the day is
    // not a whole number of pixels from its start and the browser's whole pixel is the nearest it can stand.
    assert.ok(Math.abs(back - shown) <= PIXEL_MS, `the sheet is on the moment it showed, to the pixel: ${new Date(back).toISOString()} for ${new Date(shown).toISOString()}`);
  }));

  /*
   * Seen to fail on the timeline of `b954700`, which had neither:
   *
   *   ✖ place: scrollToDate puts a day at the track's left edge, however far; visibleStart reads it back
   *     page.evaluate: TypeError: window.timeline.scrollToDate is not a function
   */
  test('place: scrollToDate puts a day at the track\'s left edge, however far; visibleStart reads it back', onPage(async (page) => {
    await page.evaluate(() => window.timeline.scrollToDate('2027-03-01'));
    assert.match(await range(page), /^Mar 1 – /, 'the day asked for is the first the sheet shows');
    const read = await page.evaluate(() => window.ui.dayKey(window.timeline.visibleStart().date));
    assert.equal(read, '2027-03-01');
  }));
}
