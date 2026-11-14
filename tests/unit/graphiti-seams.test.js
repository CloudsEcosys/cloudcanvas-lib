/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The consumer seams Graphiti landed on origin/main, on the add-ons: the
 * keyboard's `tabStop`, pan's `press`, focus's `frame`, and the menu's
 * renderItem/closeOnRun/openOnHover/insets and open-upward. (A blit drag never
 * reparents, so `reparentOnDrop: false` is simply the default.)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { focus, focusBlit } from '../../plugins/focus.js';
import { keyboard } from '../../plugins/keyboard.js';
import { pan } from '../../plugins/pan.js';
import { MENU_CLASS, MENU_FLYOUT_CLASS, MENU_HOVER_OPEN_MS, MENU_ITEM_CLASS, menu } from '../../plugins/menu.js';
import { placeInHost } from '../../plugins/menu-place.js';
import { coreScene, move, press, release } from '../helpers/core-scene.js';

blit.use({ keyboard, pan, focus });

function rightClick(target, x = 30, y = 40) {
  const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: x, clientY: y });
  target.dispatchEvent(event);
  return event;
}

test('keyboard {tabStop: false} keeps the host out of the tab order; the default is the single tab stop', (t) => {
  const off = coreScene(t);
  off.app.set({ keyboard: { label: 'Board', tabStop: false } });
  assert.equal(off.host.hasAttribute('tabindex'), false);
  off.host.remove();
  const on = coreScene(t);
  on.app.set({ keyboard: { label: 'Board' } });
  assert.equal(on.host.getAttribute('tabindex'), '0');
});

test('pan {press: false} leaves a background press alone; the default starts a pan', (t) => {
  const still = coreScene(t);
  still.app.set({ pan: { press: false } });
  press(still.host, 10, 10);
  move(60, 60);
  release(60, 60);
  assert.equal(still.root.camera.x, 0);
  still.host.remove();
  const moving = coreScene(t);
  moving.app.set({ pan: true });
  press(moving.host, 10, 10);
  move(60, 60);
  release(60, 60);
  assert.notEqual(moving.root.camera.x, 0);
});

test('focus {frame: false} moves the focus without moving the camera', (t) => {
  const { app, root } = coreScene(t);
  const far = app.blit({ id: 'far', x: 5000, y: 5000, w: 100, h: 60, focus: { frame: false } });
  focusBlit({ frame: false }, far, root);
  assert.ok(far.el.classList.contains('is-focused'));
  assert.deepEqual([root.camera.x, root.camera.y, root.camera.scale], [0, 0, 1], 'the camera moved');
});

test('menu renderItem decorates the built button or replaces it', (t) => {
  const { app, root } = coreScene(t);
  t.after(menu(app, { items: [
    { id: 'a', label: 'A', action() {}, renderItem: (button) => { button.dataset.hint = 'ctrl+a'; } },
    { id: 'b', label: 'B', action() {}, renderItem: () => Object.assign(document.createElement('div'), { textContent: 'custom' }) }
  ] }));
  rightClick(app.el);
  const panel = root.overlay.querySelector(`.${MENU_CLASS}`);
  assert.equal(panel.querySelector('[data-menu-item="a"]').dataset.hint, 'ctrl+a');
  assert.ok([...panel.querySelectorAll('div')].some((each) => each.textContent === 'custom'));
});

test('menu closeOnRun: false keeps the menu open after a toggle runs', (t) => {
  const { app, root } = coreScene(t);
  let runs = 0;
  t.after(menu(app, { items: [{ id: 't', label: 'Toggle', closeOnRun: false, action: () => { runs += 1; } }] }));
  rightClick(app.el);
  root.overlay.querySelector(`.${MENU_ITEM_CLASS}`).click();
  assert.equal(runs, 1);
  assert.equal(root.overlay.querySelector(`.${MENU_CLASS}`).hidden, false);
});

test('menu openOnHover opens a trigger\'s flyout after the rest delay', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { app, root } = coreScene(t);
  t.after(menu(app, { items: [
    { id: 'more', label: 'More', openOnHover: true },
    { id: 'inner', label: 'Inner', parent: 'more', action() {} }
  ] }));
  rightClick(app.el);
  const trigger = root.overlay.querySelector('[data-menu-item="more"]');
  trigger.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
  assert.equal(root.overlay.querySelector(`.${MENU_FLYOUT_CLASS}`), null);
  t.mock.timers.tick(MENU_HOVER_OPEN_MS);
  assert.ok(root.overlay.querySelector(`.${MENU_FLYOUT_CLASS}`), 'the flyout did not open');
});

test('menu placement honours insets and opens upward when there is no room below', () => {
  const element = document.createElement('div');
  element.getBoundingClientRect = () => {
    const top = parseFloat(element.style.top) || 0;
    return { top, bottom: top + 100, left: 0, right: 80, width: 80, height: 100 };
  };
  const m = { root: { hostRect: { left: 0, top: 0, width: 400, height: 300 } }, insets: () => ({ bottom: 40 }) };
  placeInHost(m, element, { mode: 'point', x: 10, y: 220 });
  assert.equal(element.style.top, '120px', 'a panel with no room below opens upward from the point');
});
