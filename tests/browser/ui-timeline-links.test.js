/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The timeline's dependency connectors in real Chromium: a picture. A bar a
 * connector's line runs over is still the bar's at every point of it - a
 * press on it opens it - and no point of the sheet hands a press to a
 * connector, with a mouse or a finger; none is a button to assistive
 * technology.
 *
 * Seen to fail on the kit of `bdc16db` (the connector said `role="button"`, "Ship depends on Brief", and its hit stroke, 12px wide, stood over the bars):
 *
 *   ✖ connectors: a bar the line runs over is still the bar's at every point, and a press on it opens it
 *     AssertionError [ERR_ASSERTION]: draft: the press at 457,161 (on the line) is the bar's, not a connector's: 'cloudcanvas-ui-timeline-connector-hit'
 *   ✖ connectors: no point of the sheet hands a press to a connector, with a mouse or a finger
 *     AssertionError [ERR_ASSERTION]: a mouse: a connector is handed no points
 *       actual: 873, expected: 0
 *   ✖ connectors: none is a button to assistive technology
 *     AssertionError [ERR_ASSERTION]: no button is named for a dependency
 *       actual: 1, expected: 0
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadChromium, PLAYWRIGHT_MISSING, startStaticServer } from './harness.js';

const chromium = await loadChromium();
const FIXTURE = '/tests/browser/fixtures/ui-timeline-links.html';
const DESKTOP = { viewport: { width: 1440, height: 700 } };
const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('ui timeline links browser', { skip: 'playwright is not installed' }, () => {});
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
  async function open(device = DESKTOP) {
    const page = await scope.browser.newPage(device);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${scope.server.url}${FIXTURE}`);
    await page.waitForFunction(() => window.ready === true && document.querySelector('.cloudcanvas-ui-timeline-connector'));
    return { page, errors };
  }

  const onPage = (body, device) => () => open(device).then(({ page, errors }) => body(page).then(() => assert.deepEqual(errors, [])).finally(() => page.close()));
  const log = (page) => page.evaluate(() => window.log);

  /** Points along the connector's line, in the page: every few pixels, with the bar (by id) each lies inside, and what is under it. */
  const alongTheLine = (page) => page.evaluate(() => {
    const line = document.querySelector('.cloudcanvas-ui-timeline-connector-line');
    line.closest('.cloudcanvas-ui-timeline-sheet').scrollIntoView({ block: 'start' });
    const matrix = line.getScreenCTM();
    const bars = [...document.querySelectorAll('.cloudcanvas-ui-timeline-bar')].map((bar) => [bar.getAttribute('data-ui-id'), bar.getBoundingClientRect()]);
    const points = [];
    for (let at = 0; at <= line.getTotalLength(); at += 3) {
      const point = line.getPointAtLength(at);
      const [x, y] = [matrix.a * point.x + matrix.e, matrix.d * point.y + matrix.f];
      const inside = bars.find(([, box]) => x > box.left + 1 && x < box.right - 1 && y > box.top + 1 && y < box.bottom - 1);
      const found = document.elementFromPoint(x, y);
      points.push({ x: Math.round(x), y: Math.round(y), bar: inside?.[0] ?? null, under: found?.closest('.cloudcanvas-ui-timeline-connector') ? found.getAttribute('class') : found?.closest('[data-ui-id]')?.getAttribute('data-ui-id') ?? null });
    }
    return points;
  });

  test('connectors: a bar the line runs over is still the bar\'s at every point, and a press on it opens it', onPage(async (page) => {
    const points = await alongTheLine(page);
    const over = points.filter((point) => point.bar !== null && point.bar !== 'brief' && point.bar !== 'ship');
    assert.ok(over.length >= 10, `the line runs over "Draft" and "Proof" (${over.length} points), or this proves nothing`);
    for (const point of over) assert.equal(point.under, point.bar, `${point.bar}: the press at ${point.x},${point.y} (on the line) is the bar's, not a connector's: '${point.under}'`);
    for (const id of ['draft', 'proof']) {
      const point = over.find((one) => one.bar === id);
      await page.mouse.click(point.x, point.y);
      assert.deepEqual((await log(page)).at(-1), ['open', id], `a click where the line crosses ${id} opens ${id}`);
    }
  }));

  /** Every point of the sheet, a few pixels apart, that the browser hands to a connector. */
  const handedToConnectors = (page) => page.evaluate(() => {
    const box = document.querySelector('.cloudcanvas-ui-timeline-sheet').getBoundingClientRect();
    let found = 0;
    for (let y = Math.max(0, box.top); y < Math.min(innerHeight, box.bottom); y += 2) {
      for (let x = Math.max(0, box.left); x < Math.min(innerWidth, box.right); x += 2) {
        if (document.elementFromPoint(x, y)?.closest('.cloudcanvas-ui-timeline-connector')) found += 1;
      }
    }
    return found;
  });

  test('connectors: no point of the sheet hands a press to a connector, with a mouse or a finger', async () => {
    for (const [name, device] of [['a mouse', DESKTOP], ['a finger', PHONE]]) {
      const { page, errors } = await open(device);
      assert.equal(await page.locator('.cloudcanvas-ui-timeline-connector').count(), 1, `${name}: the connector is drawn`);
      assert.equal(await handedToConnectors(page), 0, `${name}: a connector is handed no points`);
      assert.deepEqual(errors, []);
      await page.close();
    }
  });

  test('connectors: none is a button to assistive technology', onPage(async (page) => {
    assert.equal(await page.getByRole('button', { name: /^Ship depends on Brief$/ }).count(), 0, 'no button is named for a dependency');
    assert.equal(await page.evaluate(() => document.querySelector('.cloudcanvas-ui-timeline-connector').closest('[aria-hidden="true"]') !== null), true, 'the layer is hidden from it');
    assert.equal(await page.locator('[data-ui-id="ship"][role="treeitem"], .cloudcanvas-ui-timeline-bar[data-ui-id="ship"]').first().getAttribute('aria-label'), 'Ship, Oct 9, depends on Brief', 'the bar says what it depends on');
  }));
}
