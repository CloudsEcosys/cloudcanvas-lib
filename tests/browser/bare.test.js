/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The bare page (`fixtures/bare.html`): a board on a page with no CSS of its
 * own, the way an exported site ships. Every computed value read here came from
 * a chunk the board and its add-ons put in the document; a gesture on it is
 * judged by what a real chromium does with real input.
 *
 *   - the card is designed, not user-agent: font, colours, padding, radius, the
 *     sections laid out, a badge pill, a styled action button, a clipped well;
 *   - a real drag moves a card and selects no page text, so the next press is
 *     a gesture again rather than a native drag of the selection; with the
 *     board's chunks switched off the same drags reproduce the defect - text
 *     selected, the next drag cut short by its `pointercancel` - so the check has teeth.
 *
 * Run with `npm run test:browser`; skipped whole when Playwright is absent.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  BARE_FIXTURE,
  PLAYWRIGHT_MISSING,
  boundsOf,
  frames,
  loadChromium,
  openFixturePage,
  startStaticServer
} from './harness.js';

/** The system stack the board's `--cc-font` falls back to, as Chromium reports it. */
const SYSTEM_FONT = /system|Segoe|Roboto|Helvetica|Arial|sans-serif/;

const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser bare-page suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

function registerSuite(launcher) {
  const ctx = { server: null, browser: null, page: null, errors: [] };

  before(async () => {
    ctx.server = await startStaticServer();
    ctx.browser = await launcher.launch();
    const opened = await openFixturePage(ctx.browser, ctx.server.url, BARE_FIXTURE);
    ctx.page = opened.page;
    ctx.errors = opened.errors;
    await ctx.page.waitForSelector('#bare_card');
    await frames(ctx.page, 400);
  });

  after(async () => {
    if (ctx.browser) await ctx.browser.close();
    if (ctx.server) await ctx.server.close();
  });

  registerDesign(ctx);
  registerWell(ctx);
  registerGestures(ctx);

  test('no page errors were reported for the whole bare page', () => {
    assert.deepEqual(ctx.errors, []);
  });
}

/* ------------------ DESIGN ------------------ */

/** Computed styles off the bare page, grouped by what they belong to. */
const READ_BARE = () => {
  const { CLS } = window.fixture;
  const pick = (element, names) => {
    const computed = getComputedStyle(element);
    return Object.fromEntries(names.map((name) => [name, computed[name]]));
  };

  const host = window.cloudcanvas.el;
  const card = document.getElementById('bare_card');
  const scope = document.getElementById('bare_scope');
  const media = document.querySelector(`#bare_media .${CLS.MEDIA}`);
  const well = scope.querySelector(':scope > [data-scope]');
  const emptyWell = card.querySelector(':scope > [data-scope]');
  return {
    sheets: Array.from(document.querySelectorAll('style'), (sheet) => sheet.id).sort(),
    host: pick(host, ['backgroundColor', 'color', 'fontFamily', 'userSelect']),
    card: pick(card, ['padding', 'borderRadius', 'backgroundColor', 'boxShadow', 'borderTopWidth', 'fontFamily']),
    title: pick(card.querySelector(`.${CLS.TITLE}`), ['fontSize', 'fontWeight', 'color']),
    body: pick(card.querySelector(`.${CLS.BODY}`), ['fontSize', 'color', 'lineHeight']),
    button: pick(card.querySelector(`.${CLS.ACTION_BTN}`), ['minHeight', 'borderRadius', 'backgroundColor', 'color', 'fontSize', 'cursor']),
    badge: pick(card.querySelector('.cloudcanvas-primitive-badge'), ['display', 'borderRadius', 'padding', 'fontSize', 'borderTopWidth', 'backgroundColor']),
    display: {
      header: getComputedStyle(card.querySelector(`.${CLS.HEADER}`)).display,
      footer: getComputedStyle(card.querySelector(`.${CLS.FOOTER}`)).display,
      emptyFooter: getComputedStyle(scope.querySelector(`.${CLS.FOOTER}`)).display,
      gauge: getComputedStyle(document.querySelector(`#bare_vector .${CLS.GAUGE_ROW}`)).display,
      media: getComputedStyle(media).display
    },
    mediaRadius: getComputedStyle(media).borderRadius,
    mediaSrc: media.getAttribute('src').slice(0, 11),
    mediaWidth: media.getBoundingClientRect().width,
    well: { ...pick(well, ['display', 'overflow', 'outlineStyle']), populated: well.classList.contains('cc-populated') },
    emptyWell: { display: getComputedStyle(emptyWell).display, height: emptyWell.getBoundingClientRect().height },
    // Generated graphics (the badge) draw into slots; the template's own elements carry no inline style.
    inlineStyles: card.querySelectorAll('[style]:not([class*="slot"] *)').length
  };
};

function registerDesign(ctx) {
  test('a page with zero consumer CSS still renders a designed card', async () => {
    const styles = await ctx.page.evaluate(READ_BARE);

    // No stylesheet the page wrote: only the core's and the add-ons' own chunks.
    assert.ok(styles.sheets.every((id) => id.startsWith('blit-css')), `a foreign sheet is on the page: ${styles.sheets}`);
    assert.ok(styles.sheets.includes('blit-css-board'), 'the board never injected its chunk');

    // The root is the canvas: its surface, its type, and no text selection.
    assert.equal(styles.host.backgroundColor, 'rgb(15, 17, 23)', 'the host is transparent');
    assert.equal(styles.host.color, 'rgb(226, 232, 240)');
    assert.match(styles.host.fontFamily, SYSTEM_FONT, 'the root never took the font stack');
    assert.equal(styles.host.userSelect, 'none', 'a gesture on the root can select page text');

    assert.deepEqual(styles.card, {
      padding: '12px 16px',
      borderRadius: '10px',
      backgroundColor: 'rgba(30, 41, 59, 0.85)',
      boxShadow: styles.card.boxShadow,
      borderTopWidth: '1px',
      fontFamily: styles.card.fontFamily
    });
    assert.notEqual(styles.card.boxShadow, 'none', 'the card has no elevation');
    assert.match(styles.card.fontFamily, SYSTEM_FONT, 'the card is in the user agent\'s serif');

    assert.deepEqual(styles.title, { fontSize: '15px', fontWeight: '600', color: 'rgb(226, 232, 240)' });
    assert.deepEqual(styles.body, { fontSize: '13px', color: 'rgb(148, 163, 184)', lineHeight: '18.85px' });

    // A user-agent button is 13.33px buttonface with no radius; none of this is that.
    assert.deepEqual(styles.button, {
      minHeight: '28px',
      borderRadius: '6px',
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      color: 'rgb(125, 211, 252)',
      fontSize: '11px',
      cursor: 'pointer'
    });

    // The badge is a pill: its geometry is the chunk's, its tint the generator's inline tokens. It is a
    // flex item of its slot, so its `inline-flex` computes blockified.
    const { backgroundColor: badgeFill, ...pill } = styles.badge;
    assert.deepEqual(pill, { display: 'flex', borderRadius: '9999px', padding: '4px 8px', fontSize: '12px', borderTopWidth: '1px' });
    assert.notEqual(badgeFill, 'rgba(0, 0, 0, 0)', 'the badge has no fill');

    assert.deepEqual(styles.display, { header: 'flex', footer: 'flex', emptyFooter: 'none', gauge: 'flex', media: 'block' });
    assert.equal(styles.mediaRadius, '6px');
    assert.equal(styles.mediaSrc, 'data:image/', 'a media card with no src shows no placeholder');
    assert.ok(styles.mediaWidth > 0, 'the placeholder image has no box');
    assert.equal(styles.inlineStyles, 0, 'a template element carries an inline style');
  });
}

/* ------------------ WELL ------------------ */

function registerWell(ctx) {
  test('a populated well is a clipped, dashed frame; an empty one costs nothing', async () => {
    const { well, emptyWell } = await ctx.page.evaluate(READ_BARE);
    assert.deepEqual(well, { display: 'block', overflow: 'hidden', outlineStyle: 'dashed', populated: true });
    assert.deepEqual(emptyWell, { display: 'none', height: 0 }, 'a childless scope still takes up space');

    // A child moved past the well's right edge is painted inside it and cut off outside it.
    const clipped = await ctx.page.evaluate(async () => {
      const card = window.cloudcanvas.find('bare_card');
      const start = { x: card.x, y: card.y };
      const box = document.querySelector('#bare_scope > [data-scope]').getBoundingClientRect();
      card.set({ x: box.width - 60 });
      await new Promise((resolve) => setTimeout(resolve, 300));
      const own = card.el.getBoundingClientRect();
      const paintedAt = (x) => card.el.contains(document.elementFromPoint(x, own.top + 10));
      const result = { escapes: own.right > box.right + 1, inside: paintedAt(box.right - 10), outside: paintedAt(box.right + 10) };
      card.set(start);
      return result;
    });
    assert.deepEqual(clipped, { escapes: true, inside: true, outside: false }, 'the well does not clip what runs past it');
    await frames(ctx.page, 300);
  });
}

/* ------------------ GESTURES ------------------ */

/** The selected page text, as a string. */
const selectedText = (page) => page.evaluate(() => String(window.getSelection()));

/** A real drag from `from` by `delta`, in client pixels. */
async function drag(page, from, delta) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + delta.x, from.y + delta.y, { steps: 10 });
  await page.mouse.up();
  await frames(page, 200);
}

/** The centre of a card's body text, in client pixels. */
async function bodyText(page, id) {
  const box = await page.locator(`#${id} .${await page.evaluate(() => window.fixture.CLS.CAPTION)}`).boundingBox();
  return { x: box.x + 4, y: box.y + box.height / 2 };
}

function registerGestures(ctx) {
  test('a real drag across card text moves the card, selects nothing, and the next drag is whole', async () => {
    const before = await boundsOf(ctx.page, 'bare_media');
    await drag(ctx.page, await bodyText(ctx.page, 'bare_media'), { x: 90, y: 30 });
    assert.equal(await selectedText(ctx.page), '', 'the drag selected page text');
    const moved = await boundsOf(ctx.page, 'bare_media');
    assert.ok(Math.abs((moved.x - before.x) - 90) < 4, `the card moved ${moved.x - before.x}px for a 90px drag`);

    // With a selection left behind the next press would start a native drag, whose pointercancel cuts it short.
    await drag(ctx.page, await bodyText(ctx.page, 'bare_media'), { x: -90, y: -30 });
    const back = await boundsOf(ctx.page, 'bare_media');
    assert.ok(Math.abs(back.x - before.x) < 4 && Math.abs(back.y - before.y) < 4, `the second drag stopped at ${back.x - before.x}px`);
    assert.equal(await selectedText(ctx.page), '');
  });

  test('a pan that sweeps across the cards selects nothing', async () => {
    const scope = await ctx.page.locator('#bare_scope').boundingBox();
    await drag(ctx.page, { x: scope.x + scope.width + 20, y: scope.y + 10 }, { x: -300, y: 60 });
    assert.equal(await selectedText(ctx.page), '', 'the pan selected page text');
    await ctx.page.evaluate(() => { window.cloudcanvas.view(); });
    await frames(ctx.page, 300);
  });

  test('the check has teeth: with the board\'s chunks switched off the same drags select text and cut the next short', async () => {
    const chunks = (disabled) => ctx.page.evaluate((off) => {
      for (const id of ['blit-css-board', 'blit-css-pan']) document.getElementById(id).disabled = off;
    }, disabled);
    const before = await boundsOf(ctx.page, 'bare_media');
    await chunks(true);
    try {
      await drag(ctx.page, await bodyText(ctx.page, 'bare_media'), { x: 90, y: 30 });
      assert.notEqual(await selectedText(ctx.page), '', 'the drag selected nothing even with no user-select rule');
      const first = await boundsOf(ctx.page, 'bare_media');
      await drag(ctx.page, await bodyText(ctx.page, 'bare_media'), { x: 90, y: 30 });
      const second = await boundsOf(ctx.page, 'bare_media');
      assert.ok(second.x - first.x < 60, `the second drag went the whole ${second.x - first.x}px: the defect did not reproduce`);
    } finally {
      await ctx.page.evaluate(() => window.getSelection().removeAllRanges());
      await chunks(false);
      await ctx.page.evaluate((to) => window.cloudcanvas.find('bare_media').set(to), { x: before.x, y: before.y });
      await frames(ctx.page, 200);
    }
  });
}
