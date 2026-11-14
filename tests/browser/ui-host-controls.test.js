/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The four things a host asked of the kit's controls, in real Chromium, where layout is real: a popover opened from the (i)
 * of a top bar stands past the tab strip under the bar and not over it, and gives focus back to the button; a select's
 * status line takes no room until it has words and is a live region from the start; a tab with an icon is as tall as one
 * without and is still named by its label; and a question the host closes is gone, a no, with focus back where it was.
 *
 * The tabs case was seen to fail in Chromium before the kit icon was sized to the label's text (1.25em made a tab 2px taller):
 *
 *   ✖ tabs: an icon stands left of the label, the tab is no taller, and its name is the label alone
 *     AssertionError [ERR_ASSERTION]: no taller    actual: [ 30, 30 ]    expected: [ 28, 28 ]
 */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadChromium, PLAYWRIGHT_MISSING, startStaticServer } from './harness.js';

const chromium = await loadChromium();
const FIXTURE = '/tests/browser/fixtures/ui-host-controls.html';

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('ui host controls browser', { skip: 'playwright is not installed' }, () => {});
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
  async function open(viewport) {
    const page = await scope.browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${scope.server.url}${FIXTURE}`);
    await page.waitForFunction(() => window.ready === true);
    return { page, errors };
  }
  const onPage = (viewport, body) => () => open(viewport).then(({ page, errors }) => body(page).then(() => assert.deepEqual(errors, [])).finally(() => page.close()));
  const box = (locator) => locator.evaluate((node) => { const { left, top, right, bottom, width, height } = node.getBoundingClientRect(); return { left, top, right, bottom, width, height }; });

  test('popover: from the (i) of a top bar it stands past the tab strip under the bar, inside the screen, and Escape gives the button its focus', onPage({ width: 320, height: 568 }, async (page) => {
    await page.locator('#info').click();
    const popover = page.getByRole('dialog', { name: 'Save status' });
    const [strip, dialog, trigger] = [await box(page.locator('#strip')), await box(popover), await box(page.locator('#info'))];
    assert.ok(dialog.top >= strip.bottom, `the popover begins at ${dialog.top}, the strip ends at ${strip.bottom}`);
    assert.ok(dialog.left >= 0 && dialog.right <= 320, `inside the screen: ${dialog.left} to ${dialog.right}`);
    assert.ok(dialog.right >= trigger.right - 1 || dialog.left <= trigger.left + 1, 'it stands by the button, not somewhere of its own');
    assert.equal(await page.evaluate(() => document.activeElement.closest('.cloudcanvas-ui-popover') !== null), true, 'focus moved into it');
    await page.keyboard.press('Escape');
    assert.equal(await popover.count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'info', 'the button the host pressed has its focus back');
    assert.deepEqual(await page.evaluate(() => window.reasons), ['escape']);
  }));

  test('select: its status line takes no room until it has words, is a live region from the start, and sits under the control when it has them', onPage({ width: 390, height: 700 }, async (page) => {
    const row = page.locator('#noted-select .cloudcanvas-ui-select'), plain = page.locator('#plain-select .cloudcanvas-ui-select');
    const status = row.locator('.cloudcanvas-ui-select-status');
    assert.equal(await status.getAttribute('role'), 'status');
    assert.equal(await status.evaluate((node) => node.getBoundingClientRect().height <= 1 && getComputedStyle(node).display !== 'none'), true, 'there, and no taller than a pixel');
    assert.equal((await box(row)).height, (await box(plain)).height, 'a row with an empty status is the row it was');
    await page.evaluate(() => window.drawPicker({ text: 'Saved', tone: 'success' }));
    const [control, line, grown] = [await box(row.locator('select')), await box(status), await box(row)];
    assert.ok(line.top >= control.bottom, `under the control: ${line.top} against ${control.bottom}`);
    assert.ok(line.height > 8 && grown.height > (await box(plain)).height, 'with words it is a line of the row');
    assert.equal(await status.textContent(), 'Saved');
    assert.equal(await row.locator('select').getAttribute('aria-describedby'), await status.getAttribute('id'));
    await page.evaluate(() => window.drawPicker(undefined));
    assert.equal((await box(row)).height, (await box(plain)).height, 'and it gives the room back');
  }));

  test('tabs: an icon stands left of the label, the tab is no taller, and its name is the label alone', onPage({ width: 600, height: 700 }, async (page) => {
    const [plain, iconed] = [page.locator('#plain-tabs [role="tab"]'), page.locator('#icon-tabs [role="tab"]')];
    for (const name of ['Kanban', 'Mind Map']) assert.equal(await page.locator('#icon-tabs').getByRole('tab', { name, exact: true }).count(), 1, `named "${name}": the icon adds nothing to it`);
    assert.deepEqual(await iconed.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height)), await plain.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height)), 'no taller');
    const [mark, label] = [await box(iconed.first().locator('.cloudcanvas-ui-tabs-icon')), await box(iconed.first().locator('.cloudcanvas-ui-tabs-label'))];
    assert.ok(mark.right <= label.left + 1 && mark.width > 8, `the icon (${mark.left} to ${mark.right}) is before the label (${label.left})`);
  }));

  test('confirmDialog: the host closes the question it asked: gone from the page, a no, and focus is back on what had it', onPage({ width: 600, height: 700 }, async (page) => {
    await page.locator('#info').focus();
    const answer = page.evaluate(() => window.ask({ title: 'Decline this invitation?', confirmLabel: 'Decline', danger: true }));
    await page.getByRole('dialog', { name: 'Decline this invitation?' }).waitFor();
    await page.evaluate(() => window.asking.close());
    assert.equal(await answer, false);
    assert.equal(await page.locator('dialog.cloudcanvas-ui-dialog').count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'info');
  }));
}
