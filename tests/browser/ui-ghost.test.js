/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The band a span is drawn as while it is dragged out - the calendar's
 * range down a column, the timeline's across a row - in real Chromium: the
 * words in it are read against the band, in a light and a dark theme. So are
 * the words on a folded group's summary bar.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadChromium, PLAYWRIGHT_MISSING, startStaticServer } from './harness.js';

const chromium = await loadChromium();
const FIXTURE = '/tests/browser/fixtures/ui-ghost.html';
/** WCAG 2.1 AA for text this size. */
const READABLE = 4.5;

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('ui ghost browser', { skip: 'playwright is not installed' }, () => {});
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

  /** WCAG relative luminance of an opaque `[r, g, b]`, and the contrast ratio of two. */
  const luminance = (rgb) => rgb.map((channel) => channel / 255).map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
    .reduce((sum, value, at) => sum + value * [0.2126, 0.7152, 0.0722][at], 0);
  const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
  /** `[r, g, b, alpha]` from a computed `rgb()` or `rgba()`. */
  const parse = (text) => { const [r, g, b, alpha = 1] = text.match(/[\d.]+/g).map(Number); return [r, g, b, alpha]; };
  /** The colours `layers` (a band's own background, then each ancestor's, nearest first) lay down, as the one opaque colour seen. */
  const seen = (layers) => layers.map(parse).reduceRight((under, [r, g, b, alpha]) => [r, g, b].map((channel, at) => channel * alpha + under[at] * (1 - alpha)), [255, 255, 255]);

  /** Drag out a span on `view` and read the band while the button is down: its words, their colour, and the backgrounds under them. */
  async function bandOf(view, theme) {
    const page = await scope.browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${scope.server.url}${FIXTURE}?view=${view}&theme=${theme}`);
    await page.waitForFunction(() => window.ready === true);
    const ground = await page.evaluate((name) => {
      if (name === 'calendar') {
        const column = document.querySelectorAll('.cloudcanvas-ui-calendar-column')[3].getBoundingClientRect();
        return { x: column.left + column.width / 2, y: column.top + 60, dx: 0, dy: 100 };
      }
      // The sheet starts scrolled to where the items begin: the empty part of the row is to the right of its bar.
      const [sheet, row] = [document.querySelector('.cloudcanvas-ui-timeline-sheet'), document.querySelector('.cloudcanvas-ui-timeline-row .cloudcanvas-ui-timeline-track')];
      return { x: sheet.getBoundingClientRect().left + 700, y: row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2, dx: 120, dy: 0 };
    }, view);
    await page.mouse.move(ground.x, ground.y);
    await page.mouse.down();
    await page.mouse.move(ground.x + ground.dx, ground.y + ground.dy, { steps: 8 });
    const band = await page.evaluate(() => {
      const node = document.querySelector('.cloudcanvas-ui-calendar-draft, .cloudcanvas-ui-timeline-draft');
      // The timeline's dates are a tag of their own below its band (K8); the calendar's are the band's text.
      const words = node?.querySelector('.cloudcanvas-ui-timeline-draft-words') ?? node;
      const layers = [];
      for (let up = words; up; up = up.parentElement) layers.push(getComputedStyle(up).backgroundColor);
      return node && { words: words.textContent, color: getComputedStyle(words).color, layers, tagged: words !== node };
    });
    await page.mouse.up();
    await page.close();
    assert.deepEqual(errors, []);
    return band;
  }

  /*
   * Seen to fail on the kit of `2617e8f`, for a host whose bars are its accent with its inverse text on them
   * (`--cc-ui-bar` and `--cc-ui-bar-text`): the band's words took the bar's text colour, on a wash of the accent.
   *
   *   ✖ ghost: the words on the band a span is dragged out as read against it, 4.5:1 or more, in a light and a dark theme
   *     AssertionError [ERR_ASSERTION]: every band is read at 4.5:1 or more
   *       + [
   *       +   "calendar, light: '9:15 AM – 11:30 AM' is 1.3:1 against its band (rgb(255, 255, 255) on rgb(228, 228, 244))",
   *       +   "calendar, dark: '9:15 AM – 11:30 AM' is 1.2:1 against its band (rgb(11, 15, 20) on rgb(25, 30, 47))",
   *       +   "timeline, light: 'Oct 17 – Oct 23' is 1.3:1 against its band (rgb(255, 255, 255) on rgb(228, 228, 244))",
   *       +   "timeline, dark: 'Oct 17 – Oct 23' is 1.2:1 against its band (rgb(11, 15, 20) on rgb(25, 30, 47))"
   *       + ]
   *
   * K8: the timeline's dates became a tag of their own below its band, read here against the tag's own ground. Run on the kit of `8f8720e`:
   *
   *   ✖ ghost: the words on the band a span is dragged out as read against it, 4.5:1 or more, in a light and a dark theme
   *     AssertionError [ERR_ASSERTION]: timeline, light: the timeline's dates are a tag of their own, the calendar's the band's text
   *       actual: false,
   *       expected: true,
   */
  test('ghost: the words on the band a span is dragged out as read against it, 4.5:1 or more, in a light and a dark theme', async () => {
    const unread = [];
    for (const view of ['calendar', 'timeline']) {
      for (const theme of ['light', 'dark']) {
        const band = await bandOf(view, theme);
        assert.ok(band?.words, `${view}, ${theme}: a band with words in it follows the pointer`);
        assert.equal(band.tagged, view === 'timeline', `${view}, ${theme}: the timeline's dates are a tag of their own, the calendar's the band's text`);
        const [color, back] = [parse(band.color).slice(0, 3), seen(band.layers)];
        if (ratio(color, back) < READABLE) unread.push(`${view}, ${theme}: '${band.words}' is ${ratio(color, back).toFixed(1)}:1 against its band (${band.color} on rgb(${back.map(Math.round).join(', ')}))`);
      }
    }
    assert.deepEqual(unread, [], 'every band is read at 4.5:1 or more');
  });

  /** A folded group's summary in `theme`: its words, their colour, and the backgrounds under them. */
  async function summaryOf(theme) {
    const page = await scope.browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${scope.server.url}${FIXTURE}?view=summary&theme=${theme}`);
    await page.waitForFunction(() => window.ready === true);
    const found = await page.evaluate(() => {
      const node = document.querySelector('.cloudcanvas-ui-timeline-summary-title');
      const layers = [];
      for (let up = node; up; up = up.parentElement) layers.push(getComputedStyle(up).backgroundColor);
      return node && { words: node.textContent, color: getComputedStyle(node).color, layers };
    });
    await page.close();
    return found;
  }

  /*
   * Seen to fail on the kit of `f28f269`, which drew no summary:
   *
   *   ✖ ghost: the words on a folded group's summary are read against it, 4.5:1 or more, in a light and a dark theme
   *     AssertionError [ERR_ASSERTION]: light: a summary with words in it
   *       actual: undefined,
   *       expected: true,
   */
  test('ghost: the words on a folded group\'s summary are read against it, 4.5:1 or more, in a light and a dark theme', async () => {
    const unread = [];
    for (const theme of ['light', 'dark']) {
      const summary = await summaryOf(theme);
      assert.ok(summary?.words, `${theme}: a summary with words in it`);
      const [color, back] = [parse(summary.color).slice(0, 3), seen(summary.layers)];
      if (ratio(color, back) < READABLE) unread.push(`${theme}: '${summary.words}' is ${ratio(color, back).toFixed(1)}:1 (${summary.color} on rgb(${back.map(Math.round).join(', ')}))`);
    }
    assert.deepEqual(unread, [], 'the summary is read at 4.5:1 or more');
  });
}
