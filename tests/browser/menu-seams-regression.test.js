/** Written by Richard Christopher, Copyright 2026 NeoTec, LLC */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadChromium, PLAYWRIGHT_MISSING, startStaticServer } from './harness.js';

const chromium = await loadChromium();
const fixture = '/tests/browser/fixtures/menu-seams-regression.html';
const rootMenu = '.cloudcanvas-context-menu:not(.cloudcanvas-context-menu-flyout)';
const flyout = '.cloudcanvas-context-menu-flyout';

if (!chromium) {
  console.warn(PLAYWRIGHT_MISSING);
  test('menu seams browser', { skip: 'playwright is not installed' }, () => {});
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

  async function pageForTest() {
    const page = await scope.browser.newPage({ viewport: { width: 900, height: 650 } });
    await page.goto(`${scope.server.url}${fixture}`);
    await page.waitForFunction(() => window.ready === true);
    return page;
  }

  test('nonzero host origin and insets bound a pointer menu; replaced leaf clicks', async () => {
    const page = await pageForTest();
    try {
      await page.mouse.click(122, 82, { button: 'right' });
      const near = await page.locator(rootMenu).boundingBox();
      assert.equal(near.x, 148);
      assert.equal(near.y, 104);
      await page.locator('[data-menu-item="leaf"]').click();
      assert.deepEqual(await page.evaluate(() => window.runs), ['leaf']);

      await page.mouse.click(590, 430, { button: 'right' });
      const far = await page.locator(rootMenu).boundingBox();
      assert.ok(far.x + far.width <= 565, 'right inset was crossed');
      assert.ok(far.y + far.height <= 410, `bottom inset was crossed: ${JSON.stringify(far)}`);
      assert.ok(far.y < 430, 'bottom menu did not open upward');
    } finally {
      await page.close();
    }
  });

  test('replaced trigger supports focus, arrows, flyout flip and Enter activation', async () => {
    const page = await pageForTest();
    try {
      await page.mouse.click(590, 170, { button: 'right' });
      const trigger = page.locator('[data-menu-item="more"]');
      assert.equal(await trigger.getAttribute('role'), 'menuitem');
      assert.equal(await trigger.getAttribute('aria-haspopup'), 'menu');
      assert.equal(await trigger.getAttribute('aria-label'), 'More');
      await trigger.focus();
      await page.keyboard.press('ArrowRight');
      const triggerBox = await trigger.boundingBox();
      const inner = await page.locator(flyout).boundingBox();
      assert.ok(inner.x + inner.width <= triggerBox.x + 1,
        `flyout did not flip left: trigger=${JSON.stringify(triggerBox)} child=${JSON.stringify(inner)}`);
      assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
      await page.keyboard.press('Enter');
      assert.deepEqual(await page.evaluate(() => window.runs), ['child']);
      assert.equal(await page.locator(rootMenu).isVisible(), false);

      await page.mouse.click(200, 180, { button: 'right' });
      await page.locator('[data-menu-item="native"]').focus();
      await page.keyboard.press('Enter');
      assert.deepEqual(await page.evaluate(() => window.runs), ['child', 'native'],
        'native button action ran more than once');
    } finally {
      await page.close();
    }
  });

  test('Space runs a native and a replaced command exactly once', async () => {
    const page = await pageForTest();
    try {
      for (const id of ['native', 'leaf']) {
        await page.mouse.click(200, 180, { button: 'right' });
        await page.locator(`[data-menu-item="${id}"]`).focus();
        await page.keyboard.press('Space');
        assert.equal(await page.locator(rootMenu).isVisible(), false, `${id}: menu stayed open`);
      }
      assert.deepEqual(await page.evaluate(() => window.runs), ['native', 'leaf']);
    } finally {
      await page.close();
    }
  });
}
