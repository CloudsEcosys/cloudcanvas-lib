/** Written by Richard Christopher, Copyright 2026 NeoTec, LLC */
import test from 'node:test';
import assert from 'node:assert/strict';
import { menu, MENU_CLASS, MENU_FLYOUT_CLASS } from '../../plugins/menu.js';
import { placeInHost } from '../../plugins/menu-place.js';
import { coreScene } from '../helpers/core-scene.js';

function box(element, host, width, height) {
  element.getBoundingClientRect = () => {
    const left = host.left + (parseFloat(element.style.left) || 0);
    const top = host.top + (parseFloat(element.style.top) || 0);
    return { left, top, right: left + width, bottom: top + height, width, height };
  };
  return element;
}

test('placement uses raw host origin and all inset bounds for point, upward and flyout', () => {
  const host = { left: 100, top: 60, width: 400, height: 300 };
  const m = { root: { hostRect: host }, insets: { top: 20, right: 40, bottom: 30, left: 25 } };
  const element = box(document.createElement('div'), host, 90, 80);
  placeInHost(m, element, { mode: 'point', x: 110, y: 65 });
  assert.equal(element.style.left, '25px');
  assert.equal(element.style.top, '20px');

  placeInHost(m, element, { mode: 'point', x: 450, y: 300 });
  assert.equal(element.style.left, '270px');
  assert.equal(element.style.top, '160px', 'upward opens relative to raw host origin');

  const side = placeInHost(m, element, {
    mode: 'box', rect: { left: 435, right: 455, top: 115 }, preferSide: 'right', allowFlip: true
  });
  assert.equal(side, 'left');
  assert.equal(element.style.left, '245px');
  assert.equal(element.style.top, '55px');
});

test('root menu forwards insets; replacement leaves mandatory behavior and ARIA intact', (t) => {
  const { app, root } = coreScene(t);
  root.hostRect = { left: 100, top: 60, width: 400, height: 300 };
  let runs = 0;
  t.after(menu(app, { insets: { top: 20, right: 40, bottom: 30, left: 25 }, items: [
    { id: 'more', label: 'More', renderItem: () => document.createElement('div') },
    { id: 'child', label: 'Child', parent: 'more', action: () => { runs += 1; },
      renderItem: () => document.createElement('div') },
    { id: 'leaf', label: 'Leaf', action: () => { runs += 10; },
      renderItem: () => document.createElement('div') }
  ] }));
  app.el.dispatchEvent(new MouseEvent('contextmenu', {
    bubbles: true, cancelable: true, clientX: 110, clientY: 65
  }));
  const panel = root.overlay.querySelector(`.${MENU_CLASS}`);
  assert.equal(panel.style.left, '25px');
  assert.equal(panel.style.top, '20px');
  const trigger = panel.querySelector('[data-menu-item="more"]');
  assert.ok(trigger.classList.contains('cloudcanvas-context-menu-item'));
  assert.equal(trigger.getAttribute('role'), 'menuitem');
  assert.equal(trigger.tabIndex >= 0, true);
  assert.equal(trigger.getAttribute('aria-haspopup'), 'menu');
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(trigger.getAttribute('aria-label'), 'More');
  trigger.focus();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.ok(root.overlay.querySelector(`.${MENU_FLYOUT_CLASS}`));
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  root.overlay.querySelector('[data-menu-item="child"]').click();
  assert.equal(runs, 1);
  assert.equal(panel.hidden, true);
});

/** Open the root menu on `app` and focus the command `id`; returns the menu panel. */
function openAndFocus(app, root, id) {
  app.el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 110, clientY: 65 }));
  const panel = root.overlay.querySelector(`.${MENU_CLASS}`);
  panel.querySelector(`[data-menu-item="${id}"]`).focus();
  return panel;
}

function key(type, value) {
  const event = new KeyboardEvent(type, { key: value, bubbles: true, cancelable: true });
  document.dispatchEvent(event);
  return event;
}

test('Space runs a native or replaced command once, on release, and claims both key events', (t) => {
  const { app, root } = coreScene(t);
  const runs = [];
  t.after(menu(app, { items: [
    { id: 'native', label: 'Native', action: () => runs.push('native') },
    { id: 'replaced', label: 'Replaced', action: () => runs.push('replaced'),
      renderItem: () => document.createElement('div') }
  ] }));
  for (const id of ['native', 'replaced']) {
    const panel = openAndFocus(app, root, id);
    const down = key('keydown', ' ');
    assert.equal(down.defaultPrevented, true, `${id}: the press is claimed`);
    assert.deepEqual(runs.filter((name) => name === id), [], `${id}: nothing runs on the press`);
    const up = key('keyup', ' ');
    assert.equal(up.defaultPrevented, true, `${id}: the release is claimed, so no keyup click follows`);
    assert.deepEqual(runs.filter((name) => name === id), [id]);
    assert.equal(panel.hidden, true);
    key('keyup', ' ');
    assert.deepEqual(runs.filter((name) => name === id), [id], `${id}: a stray release runs nothing`);
  }
});

test('Space released after focus moved runs nothing; Enter still runs on press', (t) => {
  const { app, root } = coreScene(t);
  const runs = [];
  t.after(menu(app, { items: [
    { id: 'a', label: 'A', action: () => runs.push('a') },
    { id: 'b', label: 'B', action: () => runs.push('b') }
  ] }));
  openAndFocus(app, root, 'a');
  key('keydown', ' ');
  key('keydown', 'ArrowDown');
  key('keyup', ' ');
  assert.deepEqual(runs, []);
  key('keydown', 'Enter');
  assert.deepEqual(runs, ['b']);
});
