/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The menu add-on on a core root, no bridge: items by value or in a registry
 * the caller owns, each root its own; a right-click resolves the blit under it
 * (`{target, x, y}`), opens only when something applies, runs a command with
 * the root's handle, nests submenus, closes on Escape and gives the keyboard
 * back; a right-click the pan add-on cancelled opens nothing. The registry,
 * overlay and nested-flyout cases ported from `context-menu.test.js`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import {
  MENU_CLASS, MENU_FLYOUT_CLASS, MENU_GROUP_CLASS, MENU_ITEM_ATTR, MENU_ITEM_CLASS, MENU_ITEM_SUBMENU_CLASS, MenuRegistry, menu
} from '../../plugins/menu.js';
import { pan } from '../../plugins/pan.js';
import { coreScene, move, press } from '../helpers/core-scene.js';

function rightClick(target, x = 30, y = 40) {
  const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: x, clientY: y });
  target.dispatchEvent(event);
  return event;
}

const labels = (root) => Array.from(root.querySelectorAll(`.${MENU_ITEM_CLASS}`)).map((each) => each.textContent);

test('menu - items by value: a right-click on a blit resolves it, a command runs with the root', (t) => {
  const { app, root } = coreScene(t);
  const card = app.blit({ x: 0, y: 0, w: 50, h: 50 });
  const ran = [];
  t.after(menu(app, {
    items: [
      { id: 'rename', label: 'Rename', when: (subject, { target }) => Boolean(target), action: (subject, ctx) => ran.push([subject, ctx.target]) },
      { id: 'fit', label: 'Fit all', action: (subject) => ran.push([subject, null]) }
    ]
  }));

  assert.equal(rightClick(card.el).defaultPrevented, true);
  assert.deepEqual(labels(root.overlay), ['Rename', 'Fit all']);
  root.overlay.querySelector(`.${MENU_ITEM_CLASS}`).click();
  assert.deepEqual(ran, [[app, card]]);
  assert.equal(root.overlay.querySelector(`.${MENU_CLASS}`).hidden, true, 'the menu stayed up');

  rightClick(app.el);
  assert.deepEqual(labels(root.overlay), ['Fit all'], 'bare canvas offered a blit command');
});

test('menu - nothing applies: the platform menu is left alone', (t) => {
  const { app } = coreScene(t);
  t.after(menu(app, { items: [{ id: 'x', label: 'Only on blits', when: (s, { target }) => Boolean(target), action() {} }] }));

  assert.equal(rightClick(app.el).defaultPrevented, false);
});

test('menu - a registry the caller owns is read live, and is that root\'s alone', (t) => {
  const { app, root } = coreScene(t);
  const otherHost = document.createElement('div');
  otherHost.id = 'other';
  document.body.appendChild(otherHost);
  const other = blit('#other');
  const registry = new MenuRegistry();
  t.after(menu(app, { registry }));
  t.after(menu(other, { items: [{ id: 'mine', label: 'Mine', action() {} }] }));
  assert.equal(rightClick(app.el).defaultPrevented, false);

  registry.register({ id: 'late', label: 'Late', action() {} });
  assert.equal(rightClick(app.el).defaultPrevented, true);
  assert.deepEqual(labels(root.overlay), ['Late']);
  rightClick(other.el);
  assert.deepEqual(labels(otherHost), ['Mine'], 'one root read the other\'s commands');
});

test('menu - a trigger opens a flyout; Escape steps out, then closes and returns focus', (t) => {
  const { app, host, root } = coreScene(t);
  host.tabIndex = 0;
  t.after(menu(app, {
    items: [
      { id: 'new', label: 'New' },
      { id: 'card', label: 'Card', parent: 'new', action() {} }
    ]
  }));

  rightClick(app.el);
  root.overlay.querySelector(`.${MENU_ITEM_CLASS}`).click();
  const flyout = root.overlay.querySelector(`.${MENU_FLYOUT_CLASS}`);
  assert.ok(flyout, 'the trigger opened no flyout');
  assert.deepEqual(labels(flyout), ['Card']);
  assert.equal(document.activeElement.textContent, 'Card');

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(root.overlay.querySelector(`.${MENU_FLYOUT_CLASS}`), null);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(root.overlay.querySelector(`.${MENU_CLASS}`).hidden, true);
  assert.equal(document.activeElement, host, 'the keyboard went to the body');
});

test('menu - a right-click that cancels a pan opens nothing', (t) => {
  const { app, host } = coreScene(t);
  t.after(pan(app));
  t.after(menu(app, { items: [{ id: 'x', label: 'Anything', action() {} }] }));

  press(host, 10, 10);
  move(30, 10);
  assert.equal(rightClick(host).defaultPrevented, true);
  assert.equal(host.querySelector(`.${MENU_CLASS}`).hidden, true, 'a menu opened over a live pan');
});

test('menu - off takes the element away; blit.use attaches it by name too', (t) => {
  const { app, root } = coreScene(t);
  const off = menu(app);
  assert.equal(root.overlay.querySelectorAll(`.${MENU_CLASS}`).length, 1);
  off();
  assert.equal(root.overlay.querySelector(`.${MENU_CLASS}`), null);

  blit.use({ menu });
  app.set({ menu: true });
  assert.equal(root.overlay.querySelectorAll(`.${MENU_CLASS}`).length, 1);
  app.set({ menu: false });
  assert.equal(root.overlay.querySelector(`.${MENU_CLASS}`), null);
});

/* ------------------ REGISTRY, OVERLAY, FLYOUTS ------------------ */

/** A root with a menu over a registry the test fills. */
function menuScene(t) {
  const scene = coreScene(t);
  const registry = new MenuRegistry();
  t.after(menu(scene.app, { registry }));
  const top = () => scene.root.overlay.querySelector(`.${MENU_CLASS}:not(.${MENU_FLYOUT_CLASS})`);
  return { ...scene, registry, top };
}

const itemById = (root, id) => root.overlay.querySelector(`[${MENU_ITEM_ATTR}="${id}"]`);
const flyouts = (root) => Array.from(root.overlay.querySelectorAll(`.${MENU_FLYOUT_CLASS}`));
const idsIn = (panel) => Array.from(panel.querySelectorAll(`.${MENU_ITEM_CLASS}`)).map((each) => each.getAttribute(MENU_ITEM_ATTR));
const keyDown = (key) => document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

function clickId(root, id) {
  const button = itemById(root, id);
  assert.ok(button, `no menu item "${id}" on screen`);
  button.click();
  return button;
}

test('menu - the registry: ids unique at every level, a label required, an action a function; a parent exists first and has no action', () => {
  const registry = new MenuRegistry();
  registry.register({ id: 'leaf', label: 'Leaf', action() {} });
  assert.throws(() => registry.register({ id: 'leaf', label: 'Again', action() {} }), /already registered/);
  assert.throws(() => registry.register({ id: '', label: 'x', action() {} }), /non-empty string/);
  assert.throws(() => registry.register({ id: 'no-label', action() {} }), /requires a label/);
  assert.throws(() => registry.register({ id: 'bad', label: 'x', action: 'nope' }), /must be a function/);
  assert.throws(() => registry.register({ id: 'orphan', label: 'x', parent: 'ghost', action() {} }), /which is not registered/);
  assert.throws(() => registry.register({ id: 'under', label: 'y', parent: 'leaf', action() {} }), /cannot be both a submenu trigger and an action/);
  registry.register({ id: 'trigger', label: 'T' });
  registry.register({ id: 'child', label: 'C', parent: 'trigger', action() {} });
  assert.throws(() => registry.register({ id: 'child', label: 'Dup', parent: 'trigger', action() {} }), /already registered/);
});

test('menu - clear() empties a registry and replays its default providers', () => {
  const registry = new MenuRegistry();
  registry.registerDefaults((each) => each.register({ id: 'built-in', label: 'Built in', action() {} }));
  registry.register({ id: 'temp', label: 'Temp', action() {} });
  registry.clear();
  assert.deepEqual(registry.list().map((item) => item.id), ['built-in']);
});

test('menu - a registered command renders, runs with the root and the click, and once unregistered is gone', (t) => {
  const { app, root, registry } = menuScene(t);
  const card = app.blit({ w: 50, h: 50 });
  const calls = [];
  registry.register({ id: 'dup', label: 'Duplicate', group: 'edit', when: (s, { target }) => Boolean(target), action: (s, ctx) => calls.push([s, ctx.target]) });
  assert.equal(rightClick(card.el).defaultPrevented, true);
  clickId(root, 'dup');
  assert.deepEqual(calls, [[app, card]]);
  assert.equal(registry.unregister('dup'), true);
  assert.equal(rightClick(card.el).defaultPrevented, false, 'an unregistered command still opened the menu');
});

test('menu - it opens in the overlay at the click, grouped, focused; an outside press or a run closes it', (t) => {
  const { app, host, root, registry, top } = menuScene(t);
  host.tabIndex = 0;
  registry.register({ id: 'back', label: 'Back', group: 'nav', action() {} });
  registry.register({ id: 'front', label: 'Bring to front', group: 'order', action() {} });
  registry.register({ id: 'send', label: 'Send to back', group: 'order', action() {} });

  rightClick(app.el, 120, 64);
  assert.equal(top().parentNode, root.overlay);
  assert.deepEqual([top().hidden, top().style.left, top().style.top], [false, '120px', '64px']);
  assert.deepEqual(labels(top()), ['Back', 'Bring to front', 'Send to back']);
  assert.equal(top().querySelectorAll(`.${MENU_GROUP_CLASS}`).length, 2, 'the groups did not split');
  assert.equal(document.activeElement, top().querySelector(`.${MENU_ITEM_CLASS}`));

  document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  assert.equal(top().hidden, true, 'an outside press left the menu up');
  rightClick(app.el);
  clickId(root, 'back');
  assert.equal(top().hidden, true, 'a run left the menu up');
});

test('menu - every item is a real button with menu roles', (t) => {
  const { app, registry, top } = menuScene(t);
  registry.register({ id: 'a', label: 'A', action() {} });
  registry.register({ id: 'b', label: 'B', action() {} });
  rightClick(app.el);
  assert.equal(top().getAttribute('role'), 'menu');
  for (const button of top().querySelectorAll(`.${MENU_ITEM_CLASS}`)) {
    assert.deepEqual([button.tagName, button.getAttribute('type'), button.getAttribute('role')], ['BUTTON', 'button', 'menuitem']);
  }
});

test('menu - a command named as a parent is a trigger: it opens its flyout rather than acting', (t) => {
  const { app, root, registry, top } = menuScene(t);
  const ran = [];
  registry.register({ id: 'ins', label: 'New', group: 'insert' });
  registry.register({ id: 'ins-rect', label: 'Rectangle', parent: 'ins', action: () => ran.push('rect') });
  registry.register({ id: 'ins-circle', label: 'Circle', parent: 'ins', action: () => ran.push('circle') });

  rightClick(app.el);
  const trigger = itemById(root, 'ins');
  assert.ok(trigger.classList.contains(MENU_ITEM_SUBMENU_CLASS));
  assert.deepEqual([trigger.getAttribute('aria-haspopup'), trigger.getAttribute('aria-expanded')], ['menu', 'false']);
  assert.equal(itemById(root, 'ins-rect'), null, 'a child rendered before its flyout opened');

  clickId(root, 'ins');
  assert.deepEqual(ran, []);
  assert.equal(top().hidden, false, 'opening a flyout closed the menu');
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  assert.deepEqual(flyouts(root).map(idsIn), [['ins-rect', 'ins-circle']]);
  clickId(root, 'ins-rect');
  assert.deepEqual(ran, ['rect']);
  assert.deepEqual([top().hidden, flyouts(root).length], [true, 0]);
});

test('menu - when() gates every depth, and a category with nothing to show never renders', (t) => {
  const { app, root, registry } = menuScene(t);
  registry.register({ id: 'ins', label: 'New' });
  registry.register({ id: 'cat-open', label: 'Open', parent: 'ins' });
  registry.register({ id: 'cat-empty', label: 'Empty', parent: 'ins' });
  registry.register({ id: 'leaf-in', label: 'Shown', parent: 'cat-open', action() {} });
  registry.register({ id: 'leaf-out', label: 'Gated', parent: 'cat-open', when: () => false, action() {} });
  registry.register({ id: 'buried', label: 'Buried', parent: 'cat-empty', when: () => false, action() {} });

  rightClick(app.el);
  clickId(root, 'ins');
  assert.deepEqual(idsIn(flyouts(root)[0]), ['cat-open'], 'an empty category still rendered');
  clickId(root, 'cat-open');
  assert.deepEqual(idsIn(flyouts(root).at(-1)), ['leaf-in'], 'a gated leaf still rendered');
});

test('menu - three levels open from one mechanism, a deep leaf closes the chain, Escape steps back one at a time', (t) => {
  const { app, root, registry, top } = menuScene(t);
  let ran = 0;
  registry.register({ id: 'l0', label: 'L0' });
  registry.register({ id: 'l1', label: 'L1', parent: 'l0' });
  registry.register({ id: 'l2', label: 'L2', parent: 'l1' });
  registry.register({ id: 'l3', label: 'L3', parent: 'l2', action: () => { ran += 1; } });

  rightClick(app.el);
  for (const id of ['l0', 'l1', 'l2']) clickId(root, id);
  assert.deepEqual(flyouts(root).map(idsIn), [['l1'], ['l2'], ['l3']]);
  clickId(root, 'l3');
  assert.deepEqual([ran, top().hidden, flyouts(root).length], [1, true, 0]);

  rightClick(app.el);
  for (const id of ['l0', 'l1']) clickId(root, id);
  keyDown('Escape');
  assert.deepEqual(flyouts(root).map(idsIn), [['l1']], 'Escape closed more than the innermost flyout');
  keyDown('Escape');
  assert.deepEqual([flyouts(root).length, top().hidden], [0, false], 'the second Escape closed the root too soon');
  keyDown('Escape');
  assert.equal(top().hidden, true);
});

test('menu - opening a sibling closes the sibling branch but not the ancestor', (t) => {
  const { app, root, registry } = menuScene(t);
  registry.register({ id: 'top', label: 'Top' });
  registry.register({ id: 'a', label: 'A', parent: 'top' });
  registry.register({ id: 'b', label: 'B', parent: 'top' });
  registry.register({ id: 'a1', label: 'A1', parent: 'a', action() {} });
  registry.register({ id: 'b1', label: 'B1', parent: 'b', action() {} });

  rightClick(app.el);
  clickId(root, 'top');
  clickId(root, 'a');
  assert.equal(flyouts(root).length, 2);
  clickId(root, 'b');
  assert.deepEqual(flyouts(root).map(idsIn), [['a', 'b'], ['b1']], 'the swap left the wrong chain open');
});

test('menu - the keyboard opens a flyout right, roves it down, and closes it left', (t) => {
  const { app, root, registry } = menuScene(t);
  registry.register({ id: 'k0', label: 'K0' });
  registry.register({ id: 'k1', label: 'K1', parent: 'k0', action() {} });
  registry.register({ id: 'k2', label: 'K2', parent: 'k0', action() {} });
  const focused = () => document.activeElement?.getAttribute?.(MENU_ITEM_ATTR) ?? '';

  rightClick(app.el);
  itemById(root, 'k0').focus();
  keyDown('ArrowRight');
  assert.deepEqual([flyouts(root).length, focused()], [1, 'k1']);
  keyDown('ArrowDown');
  assert.equal(focused(), 'k2');
  keyDown('ArrowLeft');
  assert.deepEqual([flyouts(root).length, focused()], [0, 'k0']);
});
