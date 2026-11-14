/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * What the two context-menu suites share (`context-menu.test.js`, the menu and
 * its commands; `context-menu-submenu.test.js`, the flyouts): the menu's
 * selectors, a settled dashboard page, and a right-click that lands where a
 * real pointer would.
 */
import assert from 'node:assert/strict';
import { frames, openPage } from './harness.js';

export const MENU = '.cloudcanvas-context-menu';
export const MENU_ITEM = '.cloudcanvas-context-menu-item';
export const FLYOUT = '.cloudcanvas-context-menu-flyout';
// The top-level menu only - `.cloudcanvas-context-menu` matches a flyout too,
// since a flyout wears both classes to inherit the menu's look.
export const ROOT_MENU = '.cloudcanvas-context-menu:not(.cloudcanvas-context-menu-flyout)';

/** A fresh dashboard fixture page with a settled camera at the whole canvas. */
export async function freshPage(ctx) {
  const opened = await openPage(ctx.browser, ctx.server.url);
  await frames(opened.page, 600);
  await opened.page.evaluate(() => {
    window.fixture.camera.setZoom(1);
    window.fixture.camera.panTo(0, 0);
  });
  await frames(opened.page, 200);
  return opened;
}

/**
 * A point on a blit that the pointer would actually reach.
 *
 * The dashboard fixture floats its own HUD over the canvas, so the centre of a
 * blit's box is not necessarily the blit - `elementFromPoint` is the only thing
 * that knows what a right-click at a coordinate would really land on.
 */
export async function blitPoint(page, blitId) {
  const point = await page.evaluate((id) => {
    const element = document.querySelector(`[data-blit][id="${id}"]`);
    if (!element) return null;

    const box = element.getBoundingClientRect();
    for (let ty = 0.15; ty <= 0.9; ty += 0.1) {
      for (let tx = 0.15; tx <= 0.9; tx += 0.1) {
        const x = Math.round(box.left + box.width * tx);
        const y = Math.round(box.top + box.height * ty);
        const hit = document.elementFromPoint(x, y);
        if (hit && hit.closest(`[data-blit][id="${id}"]`)) return { x, y };
      }
    }
    return null;
  }, blitId);

  assert.ok(point, `blit "${blitId}" has no point a pointer can reach`);
  return point;
}

/** The first of `blitIds` a pointer can actually reach. */
export async function firstReachableBlit(page, blitIds) {
  for (const id of blitIds) {
    const point = await page.evaluate((candidate) => {
      const element = document.querySelector(`[data-blit][id="${candidate}"]`);
      if (!element) return false;
      const box = element.getBoundingClientRect();
      const hit = document.elementFromPoint(
        Math.round(box.left + box.width * 0.5),
        Math.round(box.top + box.height * 0.5)
      );
      return Boolean(hit && hit.closest(`[data-blit][id="${candidate}"]`));
    }, id);
    if (point) return id;
  }

  assert.fail(`none of ${blitIds.join(', ')} is reachable by the pointer`);
  return null;
}

/** Right-click at a point and let the menu settle. */
export async function rightClickAt(page, point) {
  await page.mouse.click(point.x, point.y, { button: 'right' });
  await frames(page, 120);
}

/** The labels currently on the menu. */
export function menuLabels(page) {
  return page.$$eval(MENU_ITEM, (buttons) => buttons.map((button) => button.textContent));
}
