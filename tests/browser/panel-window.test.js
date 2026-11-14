/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The panel's window place in a real browser (`fixtures/panel.html`): chosen from the place menu, the frame - bar
 * included - opens in a popup with the page's stylesheets and no scripts; a control pressed in the popup works;
 * closing the popup, or its close control, brings the frame back; a blocked popup is refused and the panel stays;
 * and reloading the opener leaves no orphan popup.
 *
 * Run with `npm run test:browser`; skipped whole when Playwright is absent.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { PLAYWRIGHT_MISSING, frames, loadChromium, openFixturePage, startStaticServer } from './harness.js';

const PANEL_FIXTURE = '/tests/browser/fixtures/panel.html';
const chromium = await loadChromium();

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('browser panel window suite', { skip: 'playwright is not installed' }, () => {});
} else {
  registerSuite(chromium);
}

/* ------------------ PROBES ------------------ */

async function settle(page) {
  await frames(page, 120);
  await page.waitForFunction(() => document.getAnimations().every((each) => each.playState !== 'running'), null, { timeout: 10000 });
}

const options = (page, id) => page.evaluate((key) => window.fixture.panelOf(window.cloudcanvas.find(key)), id);
const signals = (page, type) => page.evaluate((kind) => window.fixture.signals.filter((each) => each.type === kind), type);
const inOpener = (page, id) => page.evaluate((key) => Boolean(document.getElementById(key)), id);

/** A real click in the popup whose own effect is to close it: the click may outlive its page. */
async function clickClosing(popup, selector) {
  await popup.locator(selector).click().catch((error) => { if (!popup.isClosed()) throw error; });
}

/** Choose "Own window" in the tools panel's place menu, a real gesture, and the popup it opened. */
async function toWindow(page) {
  await page.locator('#tools .cloudcanvas-panel-control[data-cc-key="place"]').click();
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 15000 }),
    page.locator('#tools [data-cc-panel-place="window"]').click()
  ]);
  await popup.waitForSelector('#tools .cloudcanvas-panel-bar', { timeout: 15000 });
  return popup;
}

/** What the popup holds: its title, its sheets and scripts, and the frame as the browser lays it out. */
const READ_POPUP = () => {
  const frame = document.getElementById('tools');
  const bar = frame.querySelector('.cloudcanvas-panel-bar');
  const controls = Array.from(frame.querySelectorAll('.cloudcanvas-panel-control'));
  return {
    title: document.title,
    sheets: document.querySelectorAll('style, link[rel~="stylesheet"]').length,
    panelSheet: Boolean(document.getElementById('blit-css-panel')),
    scripts: document.scripts.length,
    barHeight: getComputedStyle(bar).height,
    fills: Math.round(frame.getBoundingClientRect().width) === window.innerWidth,
    controls: controls.filter((button) => getComputedStyle(button).display !== 'none').map((button) => button.getAttribute('data-cc-key')),
    body: Boolean(frame.querySelector('#tool-name'))
  };
};

/* ------------------ THE SUITE ------------------ */

function registerSuite(launcher) {
  const ctx = { server: null, browser: null, page: null, errors: [] };

  before(async () => {
    ctx.server = await startStaticServer();
    ctx.browser = await launcher.launch();
    const opened = await openFixturePage(ctx.browser, ctx.server.url, PANEL_FIXTURE);
    ctx.page = opened.page;
    ctx.errors = opened.errors;
    await ctx.page.waitForSelector('#tools .cloudcanvas-panel-bar', { timeout: 10000 });
    await settle(ctx.page);
  });

  after(async () => {
    if (ctx.browser) await ctx.browser.close();
    if (ctx.server) await ctx.server.close();
  });

  registerOpen(ctx);
  registerReturns(ctx);
  registerRefusalAndReload(ctx);

  test('no page errors were reported for the whole panel window page', () => {
    assert.deepEqual(ctx.errors, []);
  });
}

function registerOpen(ctx) {
  test('the frame, bar included, opens in a window of its own with the page\'s stylesheets and no scripts', async () => {
    const { page } = ctx;
    await page.evaluate(() => { window.fixture.signals.length = 0; });
    const popup = await toWindow(page);
    const read = await popup.evaluate(READ_POPUP);
    assert.equal(read.title, 'Tools');
    assert.ok(read.sheets > 0 && read.panelSheet, 'the stylesheets were not copied');
    assert.equal(read.scripts, 0);
    assert.equal(read.barHeight, '28px', 'the panel chunk does not style the frame there');
    assert.equal(read.fills, true, 'the frame does not fill its window');
    assert.deepEqual(read.controls, ['place', 'close']);
    assert.equal(read.body, true, 'the content did not come along');
    assert.equal(await inOpener(page, 'tools'), false);
    assert.equal((await options(page, 'tools')).at, 'window');
    const change = (await signals(page, 'panel:change')).filter((each) => each.id === 'tools').at(-1);
    assert.deepEqual([change.payload.at, change.payload.window], ['window', true]);
    ctx.popup = popup;
  });

  test('a control pressed in the window works: its place menu brings the panel back and the window closes', async () => {
    const { page, popup } = ctx;
    const closed = popup.waitForEvent('close', { timeout: 15000 });
    await popup.locator('#tools .cloudcanvas-panel-control[data-cc-key="place"]').click();
    await clickClosing(popup, '#tools [data-cc-panel-place="float"]');
    await closed;
    await settle(page);
    assert.equal(await inOpener(page, 'tools'), true);
    assert.equal((await options(page, 'tools')).at, 'float');
    const rect = await page.evaluate(() => document.getElementById('tools').getBoundingClientRect().toJSON());
    assert.deepEqual([Math.round(rect.x), Math.round(rect.y), Math.round(rect.width)], [340, 260, 320]);
    const change = (await signals(page, 'panel:change')).filter((each) => each.id === 'tools').at(-1);
    assert.deepEqual([change.payload.at, change.payload.window], ['float', false]);
  });
}

function registerReturns(ctx) {
  test('closing the window brings the frame back to the place it came from; its close control closes the panel', async () => {
    const { page } = ctx;
    await page.evaluate(() => window.fixture.setPanel(window.cloudcanvas.find('tools'), { at: 'left' }));
    await settle(page);
    let popup = await toWindow(page);
    await popup.evaluate(() => window.close());
    await settle(page);
    assert.equal(await inOpener(page, 'tools'), true);
    assert.equal((await options(page, 'tools')).at, 'left');
    popup = await toWindow(page);
    const closed = popup.waitForEvent('close', { timeout: 15000 });
    await clickClosing(popup, '#tools .cloudcanvas-panel-control[data-cc-key="close"]');
    await closed;
    await settle(page);
    const after = await options(page, 'tools');
    assert.deepEqual([after.open, after.at], [false, 'left']);
    assert.equal(await inOpener(page, 'tools'), true);
    await page.evaluate(() => window.fixture.setPanel(window.cloudcanvas.find('tools'), { open: true, at: 'float' }));
    await settle(page);
  });

}

function registerRefusalAndReload(ctx) {
  test('a blocked window is refused: the place does not change and panel:refused says why', async () => {
    const { page } = ctx;
    await page.evaluate(() => {
      window.fixture.signals.length = 0;
      window.realOpen = window.open;
      window.open = () => null;
    });
    await page.locator('#tools .cloudcanvas-panel-control[data-cc-key="place"]').click();
    await page.locator('#tools [data-cc-panel-place="window"]').click();
    await frames(page, 100);
    await page.evaluate(() => { window.open = window.realOpen; });
    assert.equal((await options(page, 'tools')).at, 'float');
    const refused = await signals(page, 'panel:refused');
    assert.equal(refused.length, 1);
    assert.equal(refused[0].payload.at, 'window');
    assert.match(refused[0].payload.reason, /window/);
  });

  test('reloading the opener closes the window: no orphan is left open', async () => {
    const { page } = ctx;
    const popup = await toWindow(page);
    const closed = popup.waitForEvent('close', { timeout: 15000 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await closed;
    assert.equal(popup.isClosed(), true);
    await page.waitForFunction(() => Boolean(window.cloudcanvas), null, { timeout: 15000 });
    assert.equal(await inOpener(page, 'tools'), true);
  });
}
