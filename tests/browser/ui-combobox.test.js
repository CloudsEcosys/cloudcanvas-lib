/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The combobox in real Chromium, with forty options so its list is taller than
 * its popup: what axe says of it open (light and dark, a desktop and a phone),
 * and that its keys are the keys they were - focus stays in the field, the
 * arrows move the active option and bring it into view inside the list, Enter
 * picks, Escape lets go, typing narrows, Tab goes on past it.
 *
 * Seen to fail on the kit of `bdc16db` (the popup, a `<div>` with no role, was the scroller; the listbox the field controls was inside it):
 *
 *   ✖ combobox: open with a list taller than its popup, it passes axe - light and dark, desktop and phone
 *     AssertionError [ERR_ASSERTION]: desktop dark: axe has nothing to say of the open combobox
 *       + 'scrollable-region-focusable (serious): .cloudcanvas-ui-combobox'
 *       - (nothing)
 *     (the same line in the three other cases: desktop light, phone dark, phone light)
 *
 * The keys case is a regression check, not a repair: it held on that kit and holds after.
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { axeViolations } from './axe.js';
import { loadChromium, PLAYWRIGHT_MISSING, startStaticServer } from './harness.js';

const chromium = await loadChromium();
const FIXTURE = '/tests/browser/fixtures/ui-combobox.html';
const LIST = '.cloudcanvas-ui-combobox [role="listbox"]';
const DESKTOP = { viewport: { width: 1440, height: 900 } };
const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('ui combobox browser', { skip: 'playwright is not installed' }, () => {});
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

  /** A page on the fixture, its list open; any page error or console error fails the test. */
  async function open(device = DESKTOP, query = '') {
    const page = await scope.browser.newPage(device);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${scope.server.url}${FIXTURE}${query}`);
    await page.waitForFunction(() => window.ready === true);
    return { page, errors };
  }

  const onPage = (body, device, query) => () => open(device, query).then(({ page, errors }) => body(page).then(() => assert.deepEqual(errors, [])).finally(() => page.close()));
  const active = (page) => page.locator('#field').getAttribute('aria-activedescendant');

  /** Whether the popup really overflows (so the case is about the list it was written for), and what scrolls. */
  const scrolling = (page) => page.evaluate(() => {
    const scrolls = (node) => node.scrollHeight > node.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(node).overflowY);
    const list = document.querySelector('.cloudcanvas-ui-combobox [role="listbox"]');
    return { popup: scrolls(document.querySelector('.cloudcanvas-ui-combobox')), list: scrolls(list) };
  });

  test('combobox: open with a list taller than its popup, it passes axe - light and dark, desktop and phone', async () => {
    for (const [name, device] of [['desktop', DESKTOP], ['phone', PHONE]]) {
      for (const theme of ['dark', 'light']) {
        const { page, errors } = await open(device, theme === 'light' ? '?theme=light' : '');
        assert.equal(await page.locator('.cloudcanvas-ui-combobox').isVisible(), true, `${name} ${theme}: the list is open`);
        const found = await scrolling(page);
        assert.equal(found.popup || found.list, true, `${name} ${theme}: forty options are taller than the popup, so something in it scrolls`);
        assert.deepEqual(await axeViolations(page), [], `${name} ${theme}: axe has nothing to say of the open combobox`);
        assert.deepEqual(errors, []);
        await page.close();
      }
    }
  });

  test('combobox: the list is the scroller, the field controls it, and the popup around it clips and scrolls nothing', onPage(async (page) => {
    const found = await scrolling(page);
    assert.deepEqual(found, { popup: false, list: true }, 'the listbox the field controls is what scrolls');
    const controls = await page.locator('#field').getAttribute('aria-controls');
    assert.equal(await page.locator(LIST).getAttribute('id'), controls);
  }));

  test('combobox: the keys are the keys they were - arrows bring the active option into the list\'s view, Enter picks, Escape lets go, typing narrows, Tab goes on', onPage(async (page) => {
    await page.focus('#field');
    for (let at = 0; at < 30; at += 1) await page.keyboard.press('ArrowDown');
    assert.equal(await active(page), (await page.locator('[aria-selected="true"]').getAttribute('id')), 'the active option is the selected one');
    const inView = await page.evaluate(() => {
      const popup = document.querySelector('.cloudcanvas-ui-combobox');
      const list = popup.querySelector('[role="listbox"]');
      const scroller = list.scrollHeight > list.clientHeight + 1 ? list : popup;
      const option = document.getElementById(document.getElementById('field').getAttribute('aria-activedescendant'));
      const [within, box] = [scroller.getBoundingClientRect(), option.getBoundingClientRect()];
      return { text: option.textContent, inside: box.top >= within.top - 1 && box.bottom <= within.bottom + 1, scrolled: scroller.scrollTop };
    });
    assert.equal(inView.text, 'Item number 30');
    assert.ok(inView.scrolled > 0 && inView.inside, `the thirtieth option is scrolled into the list's view: ${JSON.stringify(inView)}`);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'field', 'focus never left the field');
    await page.keyboard.press('Enter');
    assert.deepEqual(await page.evaluate(() => window.picked), ['item-30']);
    await page.keyboard.press('Escape');
    assert.equal(await active(page), null, 'Escape lets go of the active option');
    await page.keyboard.type('number 4');
    assert.equal(await page.locator('.cloudcanvas-ui-combobox [role="option"]').count(), 2, 'typing narrows the list: of forty, "Item number 4" and "Item number 40" hold "number 4"');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'after', 'Tab goes on past the combobox: neither the list nor an option takes a tab stop');
  }));
}
