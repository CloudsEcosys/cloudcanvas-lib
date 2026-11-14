/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Menu: a labelled `role="menu"` that takes focus when it opens and gives it
 * back when it closes. The keys move, choose, open one level of submenu and
 * close; every way of closing says which it was; a choice is reported once.
 * Where it opens, and how it is held inside the visual viewport, is in
 * `ui-menu-place.test.js`.
 *
 * Written first, and seen to fail on a kit that had no menu:
 *
 *   SyntaxError: The requested module '../../.plugin/ui/index.js' does not provide an export named 'createMenu'
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { UI_CSS, createMenu } from '../../ui/index.js';
import { assertSame, key, mount, pointer } from '../helpers/ui.js';

const ITEMS = [
  { id: 'open', label: 'Open' },
  { id: 'rename', label: 'Rename', disabled: true },
  { id: 'move', label: 'Move to', separatorBefore: true,
    items: [{ id: 'left', label: 'Left' }, { id: 'right', label: 'Right', disabled: true }, { id: 'end', label: 'The end' }] },
  { id: 'close', label: 'Close tab', danger: true, separatorBefore: true }
];
const MODEL = Object.freeze({ open: true, label: 'Tab actions', items: ITEMS });

const WRAP = '.cloudcanvas-ui-menu';
const panels = (host) => [...host.querySelectorAll('[role="menu"]')];
const itemOf = (host, id) => host.querySelector(`[role="menuitem"][data-ui-id="${id}"]`);
const labels = (panel) => [...panel.querySelectorAll('[role="menuitem"]')].map((node) => node.textContent);
const rolesIn = (panel) => [...panel.children].map((node) => node.getAttribute('role'));
const focused = () => document.activeElement?.getAttribute?.('data-ui-id') ?? null;

/** A button of the page's own, in a host that is removed after the test. */
function buttonIn(t) {
  const node = document.createElement('button');
  node.type = 'button';
  mount(t).append(node);
  return node;
}

/** A menu in `host`, and everything it reports: `['select', id]` and `['close', reason]`. */
function menuIn(host) {
  const calls = [];
  const menu = createMenu(host, { onSelect: (id) => calls.push(['select', id]), onClose: (reason) => calls.push(['close', reason]) });
  return { menu, calls, wrap: host.querySelector(WRAP) };
}

test('menu: closed until a model opens it; then a labelled menu of menuitems, with its separators, what is disabled and what is dangerous', (t) => {
  const host = mount(t);
  const { menu, calls, wrap } = menuIn(host);
  assert.equal(wrap.hidden, true, 'no model yet: nothing to show');
  menu.update({ ...MODEL, open: false });
  assert.equal(wrap.hidden, true);
  menu.update(MODEL);
  assert.equal(wrap.hidden, false);
  const [panel, flyout] = panels(host);
  assert.equal(panel.getAttribute('aria-label'), 'Tab actions');
  assert.equal(flyout.hidden, true, 'a submenu is closed until it is asked for');
  assert.deepEqual(labels(panel), ['Open', 'Rename', 'Move to', 'Close tab']);
  for (const node of panel.querySelectorAll('[role="menuitem"]')) {
    assert.deepEqual([node.localName, node.type, node.getAttribute('tabindex')], ['button', 'button', '-1'], 'a real button the keys move to, and Tab does not');
  }
  assert.deepEqual(ITEMS.map((item) => itemOf(host, item.id).disabled), [false, true, false, false]);
  assert.deepEqual(ITEMS.map((item) => itemOf(host, item.id).getAttribute('data-tone')), [null, null, null, 'danger']);
  assert.deepEqual(rolesIn(panel), ['menuitem', 'menuitem', 'separator', 'menuitem', 'separator', 'menuitem']);
  assert.deepEqual(ITEMS.map((item) => itemOf(host, item.id).getAttribute('aria-haspopup')), [null, null, 'menu', null]);
  assert.equal(itemOf(host, 'move').getAttribute('aria-expanded'), 'false');
  menu.update({ open: true, items: [{ id: 'only', label: 'Only', separatorBefore: true }] });
  assert.equal(panel.getAttribute('aria-label'), 'Menu', 'the default name');
  assert.deepEqual(rolesIn(panel), ['menuitem'], 'the first item has nothing to be separated from');
  assert.ok(UI_CSS.includes('.cloudcanvas-ui-menu-panel'), 'the kit sheet draws it');
  assert.deepEqual(calls, []);
  menu.destroy();
});

test('menu: opening puts focus on the first enabled item; Arrow Up and Down, Home and End move among the enabled ones, and wrap', (t) => {
  const host = mount(t);
  const { menu } = menuIn(host);
  menu.update({ ...MODEL, items: [{ id: 'first', label: 'First', disabled: true }, ...ITEMS] });
  assert.equal(focused(), 'open', 'a disabled item is not where the keys start');
  const moves = [['ArrowDown', 'move'], ['ArrowDown', 'close'], ['ArrowDown', 'open'], ['ArrowUp', 'close'], ['Home', 'open'], ['End', 'close'], ['ArrowUp', 'move']];
  for (const [name, to] of moves) {
    const event = key(document.activeElement, name);
    assert.equal(focused(), to, `${name} moves to ${to}`);
    assert.equal(event.defaultPrevented, true, `${name} is the menu's: the page does not scroll`);
  }
  assert.equal(key(document.activeElement, 'x').defaultPrevented, false, 'a key that is not the menu\'s is left alone');
  assert.equal(key(document.activeElement, 'ArrowLeft').defaultPrevented, false, 'nor is Arrow Left outside a submenu');
  assert.equal(key(itemOf(host, 'open'), 'ArrowRight').defaultPrevented, false, 'nor Arrow Right on an item with no submenu');
  menu.destroy();
});

test('menu: Enter and Space choose - the menu closes, gives focus back and says so, and then onSelect hears the id, once', (t) => {
  const host = mount(t);
  const anchor = buttonIn(t);
  const seen = [];
  const wrap = () => host.querySelector(WRAP);
  const menu = createMenu(host, {
    onSelect: (id) => seen.push(['select', id, wrap().hidden, document.activeElement === anchor]),
    onClose: (reason) => seen.push(['close', reason, wrap().hidden, document.activeElement === anchor])
  });
  for (const name of ['Enter', ' ']) {
    menu.update({ ...MODEL, anchor });
    key(document.activeElement, 'End');
    assert.equal(key(document.activeElement, name).defaultPrevented, true, 'the key is the menu\'s: the button is not pressed a second time');
    assert.deepEqual(seen.splice(0), [['close', 'select', true, true], ['select', 'close', true, true]],
      `${JSON.stringify(name)}: by the time the choice is reported the menu is gone, focus is back and the host has been told`);
  }
  menu.update({ ...MODEL, anchor });
  itemOf(host, 'open').click();
  assert.deepEqual(seen.splice(0).map(([what, value]) => [what, value]), [['close', 'select'], ['select', 'open']], 'a press on an item is the same choice');
  menu.update({ ...MODEL, anchor });
  itemOf(host, 'rename').click();
  key(itemOf(host, 'rename'), 'Enter');
  assert.deepEqual(seen, [], 'a disabled item cannot be chosen');
  assert.equal(wrap().hidden, false);
  menu.destroy();
});

test('menu: Escape, Tab, a press outside and a model that says closed each close it and say which; a press inside does not', (t) => {
  const host = mount(t);
  const outside = buttonIn(t);
  const { menu, calls, wrap } = menuIn(host);
  const closes = {
    escape: () => key(document.activeElement, 'Escape'),
    tab: () => key(document.activeElement, 'Tab'),
    outside: () => pointer(outside, 'pointerdown'),
    update: () => menu.update({ ...MODEL, open: false })
  };
  for (const [reason, close] of Object.entries(closes)) {
    menu.update(MODEL);
    assert.equal(wrap.hidden, false);
    const event = close();
    assert.equal(wrap.hidden, true, reason);
    assert.deepEqual(calls.splice(0), [['close', reason]]);
    if (reason === 'escape' || reason === 'tab') assert.equal(event.defaultPrevented, true, `${reason} goes no further`);
  }
  menu.update(MODEL);
  key(document.activeElement, 'Tab', { shiftKey: true });
  assert.deepEqual(calls.splice(0), [['close', 'tab']], 'Shift+Tab is Tab');
  menu.update(MODEL);
  pointer(itemOf(host, 'open'), 'pointerdown');
  pointer(panels(host)[0], 'pointerdown');
  assert.equal(wrap.hidden, false, 'a press inside the menu is not a press outside');
  menu.update({ ...MODEL, open: false });
  menu.update({ ...MODEL, open: false });
  pointer(outside, 'pointerdown');
  key(itemOf(host, 'open'), 'Escape');
  assert.deepEqual(calls, [['close', 'update']], 'a closed menu hears nothing and reports nothing');
  menu.destroy();
});

test('menu: on close focus returns to the anchor when there is one, else to what had it before the menu opened', (t) => {
  const host = mount(t);
  const [before, anchor, other] = [buttonIn(t), buttonIn(t), buttonIn(t)];
  const { menu } = menuIn(host);
  before.focus();
  menu.update(MODEL);
  assert.equal(focused(), 'open');
  key(document.activeElement, 'Escape');
  assertSame(document.activeElement, before, 'no anchor: back where focus was');
  menu.update({ ...MODEL, anchor });
  key(document.activeElement, 'Escape');
  assertSame(document.activeElement, anchor, 'an anchor takes it, whatever had it before');
  before.focus();
  menu.update({ ...MODEL, anchor });
  anchor.remove();
  key(document.activeElement, 'Tab');
  assertSame(document.activeElement, before, 'an anchor that left the page cannot: what had focus before does');
  menu.update(MODEL);
  pointer(other, 'pointerdown');
  assertSame(document.activeElement, before, 'a press outside gives it back too, before the press lands');
  menu.update(MODEL);
  other.focus();
  menu.update({ ...MODEL, open: false });
  assertSame(document.activeElement, other, 'focus the menu no longer holds is not its to move');
  menu.destroy();
});

test('menu: one level of submenu - Arrow Right, Enter or Space opens it, Arrow Left or Escape closes it back to its item', (t) => {
  const host = mount(t);
  const { menu, calls, wrap } = menuIn(host);
  menu.update(MODEL);
  const flyout = panels(host)[1];
  const parent = itemOf(host, 'move');
  for (const [open, close] of [['ArrowRight', 'ArrowLeft'], ['Enter', 'Escape'], [' ', 'ArrowLeft']]) {
    parent.focus();
    assert.equal(key(parent, open).defaultPrevented, true);
    assert.equal(flyout.hidden, false, `${JSON.stringify(open)} opens it`);
    assert.deepEqual([parent.getAttribute('aria-expanded'), parent.getAttribute('aria-controls')], ['true', flyout.id]);
    assert.equal(flyout.getAttribute('aria-label'), 'Move to', 'named for the item it hangs from');
    assert.deepEqual(labels(flyout), ['Left', 'Right', 'The end']);
    assert.equal(focused(), 'left', 'focus goes to its first enabled item');
    key(document.activeElement, 'ArrowDown');
    assert.equal(focused(), 'end', 'the keys move inside it, past what is disabled');
    key(document.activeElement, 'ArrowDown');
    assert.equal(focused(), 'left', 'and wrap inside it, never out into the menu behind');
    assert.equal(key(document.activeElement, close).defaultPrevented, true);
    assert.equal(flyout.hidden, true, `${close} closes it`);
    assert.equal(parent.getAttribute('aria-expanded'), 'false');
    assertSame(document.activeElement, parent, 'and focus is back on its item');
    assert.equal(wrap.hidden, false, 'the menu itself stays');
  }
  assert.deepEqual(calls, [], 'opening and closing a submenu is no choice and no close');
  menu.destroy();
});

test('menu: a submenu item is chosen like any other; a press on its parent opens and shuts it; Tab and a press outside close the whole menu', (t) => {
  const host = mount(t);
  const outside = buttonIn(t);
  const { menu, calls, wrap } = menuIn(host);
  menu.update(MODEL);
  const flyout = panels(host)[1];
  const parent = itemOf(host, 'move');
  parent.click();
  assert.equal(flyout.hidden, false, 'a press on the parent opens its submenu');
  assert.equal(focused(), 'left');
  parent.click();
  assert.equal(flyout.hidden, true, 'and a second press shuts it');
  assertSame(document.activeElement, parent);
  assert.deepEqual(calls, [], 'an item with a submenu is never the choice');
  parent.click();
  key(document.activeElement, 'End');
  key(document.activeElement, 'Enter');
  assert.deepEqual(calls.splice(0), [['close', 'select'], ['select', 'end']]);
  assert.deepEqual([wrap.hidden, flyout.hidden], [true, true]);
  menu.update(MODEL);
  assert.equal(flyout.hidden, true, 'a menu opens with its submenu shut');
  itemOf(host, 'move').click();
  pointer(itemOf(host, 'left'), 'pointerdown');
  assert.equal(wrap.hidden, false, 'a press inside the submenu is inside the menu');
  key(document.activeElement, 'Tab');
  assert.deepEqual(calls.splice(0), [['close', 'tab']], 'Tab closes all of it, from wherever focus is');
  menu.update(MODEL);
  itemOf(host, 'move').click();
  pointer(outside, 'pointerdown');
  assert.deepEqual(calls.splice(0), [['close', 'outside']]);
  assert.deepEqual([wrap.hidden, flyout.hidden], [true, true]);
  menu.destroy();
});

test('menu: ids are unique across the menu and its submenus, a submenu has no submenu, and a refused model changes nothing', (t) => {
  const host = mount(t);
  const { menu, calls, wrap } = menuIn(host);
  const twice = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B', items: [{ id: 'a', label: 'A again' }] }];
  const deep = [{ id: 'a', label: 'A', items: [{ id: 'b', label: 'B', items: [{ id: 'c', label: 'C' }] }] }];
  assert.throws(() => menu.update({ open: true, items: twice }), /duplicate menu id: a/);
  assert.throws(() => menu.update({ open: true, items: deep }), /one level of submenu/);
  assert.throws(() => menu.update({ open: true, items: 'no' }), TypeError);
  assert.throws(() => menu.update({ open: true, items: [{ label: 'No id' }] }), TypeError);
  assert.equal(wrap.hidden, true);
  menu.update(MODEL);
  assert.throws(() => menu.update({ ...MODEL, items: twice }), TypeError);
  assert.deepEqual(labels(panels(host)[0]), ['Open', 'Rename', 'Move to', 'Close tab'], 'the menu that was open is the menu that is open');
  assert.deepEqual(calls, []);
  menu.destroy();
});

test('menu: a redraw while open keeps focus on its item, moves it to the first enabled one when that item goes, and steals none', (t) => {
  const host = mount(t);
  const outside = buttonIn(t);
  const { menu, calls } = menuIn(host);
  menu.update(MODEL);
  key(document.activeElement, 'End');
  const close = itemOf(host, 'close');
  menu.update({ ...MODEL, label: 'Renamed', items: ITEMS.map((item) => ({ ...item })) });
  assertSame(itemOf(host, 'close'), close, 'the same item, not a rebuilt one');
  assertSame(document.activeElement, close);
  assert.equal(panels(host)[0].getAttribute('aria-label'), 'Renamed');
  menu.update({ ...MODEL, items: [...ITEMS].reverse() });
  assert.deepEqual(labels(panels(host)[0]), ['Close tab', 'Move to', 'Rename', 'Open']);
  assertSame(document.activeElement, close, 'a reorder hands focus back');
  menu.update({ ...MODEL, items: ITEMS.slice(0, 3) });
  assert.equal(focused(), 'open', 'its item went: the first enabled one takes focus');
  menu.update({ ...MODEL, items: [{ ...ITEMS[0], disabled: true }, ...ITEMS.slice(1)] });
  assert.equal(focused(), 'move', 'so does one that can no longer be chosen');
  outside.focus();
  menu.update(MODEL);
  assertSame(document.activeElement, outside, 'focus that is not in the menu is not the menu\'s to move');
  assert.deepEqual(calls, []);
  menu.destroy();
});

test('menu: a redraw redraws an open submenu in place, and closes it when its parent goes or has none', (t) => {
  const host = mount(t);
  const { menu, calls } = menuIn(host);
  menu.update(MODEL);
  const flyout = panels(host)[1];
  itemOf(host, 'move').click();
  key(document.activeElement, 'End');
  const more = ITEMS.map((item) => (item.id === 'move' ? { ...item, label: 'Send to', items: [...item.items, { id: 'new', label: 'New window' }] } : item));
  menu.update({ ...MODEL, items: more });
  assert.deepEqual([flyout.hidden, flyout.getAttribute('aria-label')], [false, 'Send to']);
  assert.deepEqual(labels(flyout), ['Left', 'Right', 'The end', 'New window']);
  assert.equal(focused(), 'end', 'focus stays on its item');
  menu.update({ ...MODEL, items: ITEMS.map((item) => (item.id === 'move' ? { id: 'move', label: 'Move' } : item)) });
  assert.equal(flyout.hidden, true, 'its parent has no submenu any more');
  assert.equal(focused(), 'move', 'focus goes back to the item it hung from');
  assert.equal(itemOf(host, 'move').hasAttribute('aria-haspopup') || itemOf(host, 'move').hasAttribute('aria-expanded'), false);
  menu.update(MODEL);
  itemOf(host, 'move').click();
  menu.update({ ...MODEL, items: ITEMS.filter((item) => item.id !== 'move') });
  assert.equal(flyout.hidden, true, 'its parent went');
  assert.equal(focused(), 'open', 'with nothing to go back to, the first enabled item takes focus');
  assert.deepEqual(calls, []);
  menu.destroy();
});

test('menu: the pointer over an enabled item gives it focus, so the pointer and the keys agree on one item', (t) => {
  const host = mount(t);
  const { menu } = menuIn(host);
  menu.update(MODEL);
  pointer(itemOf(host, 'close'), 'pointerover');
  assert.equal(focused(), 'close');
  pointer(itemOf(host, 'rename'), 'pointerover');
  assert.equal(focused(), 'close', 'a disabled item takes nothing');
  key(document.activeElement, 'ArrowUp');
  assert.equal(focused(), 'move', 'the keys go on from where the pointer was');
  itemOf(host, 'move').click();
  pointer(itemOf(host, 'open'), 'pointerover');
  assert.equal(focused(), 'left', 'passing over the menu behind an open submenu does not pull focus out of it');
  pointer(itemOf(host, 'end'), 'pointerover');
  assert.equal(focused(), 'end');
  menu.destroy();
});

test('menu: with nothing to offer it does not open; one left with nothing closes as an update; one with nothing enabled still hears the keys', (t) => {
  const host = mount(t);
  const before = buttonIn(t);
  const { menu, calls, wrap } = menuIn(host);
  before.focus();
  menu.update({ open: true, label: 'Tab actions', items: [] });
  menu.update({ open: true, label: 'Tab actions' });
  assert.equal(wrap.hidden, true);
  assertSame(document.activeElement, before);
  assert.deepEqual(calls, []);
  menu.update(MODEL);
  menu.update({ ...MODEL, items: [] });
  assert.equal(wrap.hidden, true);
  assert.deepEqual(calls.splice(0), [['close', 'update']]);
  assertSame(document.activeElement, before);
  menu.update({ ...MODEL, items: [{ id: 'a', label: 'A', disabled: true }] });
  assertSame(document.activeElement, panels(host)[0], 'the menu itself takes focus');
  assert.equal(key(document.activeElement, 'ArrowDown').defaultPrevented, false, 'there is nowhere to move');
  key(document.activeElement, 'Escape');
  assert.deepEqual(calls, [['close', 'escape']]);
  menu.destroy();
});

test('menu: destroy while open takes it off the page, gives focus back, ends its listeners and reports nothing; again, or an update after, does nothing', (t) => {
  const host = mount(t);
  const anchor = buttonIn(t);
  const { menu, calls } = menuIn(host);
  menu.update({ ...MODEL, anchor });
  const item = itemOf(host, 'move');
  item.click();
  assert.equal(focused(), 'left');
  menu.destroy();
  assert.equal(host.children.length, 0);
  assertSame(document.activeElement, anchor, 'focus it held goes back');
  assert.doesNotThrow(() => menu.destroy());
  pointer(document.body, 'pointerdown');
  item.click();
  key(item, 'Enter');
  menu.update(MODEL);
  assert.equal(host.children.length, 0, 'update after destroy is a no-op');
  assert.deepEqual(calls, [], 'destroy is not a close the host has to answer, and a destroyed menu says nothing');
  const closed = createMenu(host);
  closed.destroy();
  assert.doesNotThrow(() => closed.update(MODEL));
  assert.equal(host.children.length, 0);
});

test('menu: a host that destroys the menu as it closes still hears the choice; one that gives no callbacks is not called', (t) => {
  const host = mount(t);
  const seen = [];
  const menu = createMenu(host, { onClose: (reason) => { seen.push(reason); menu.destroy(); }, onSelect: (id) => seen.push(id) });
  menu.update(MODEL);
  key(document.activeElement, 'Enter');
  assert.deepEqual(seen, ['select', 'open']);
  assert.equal(host.children.length, 0);
  const quiet = createMenu(host);
  quiet.update(MODEL);
  assert.doesNotThrow(() => key(document.activeElement, 'Enter'));
  quiet.update(MODEL);
  assert.doesNotThrow(() => key(document.activeElement, 'Escape'));
  quiet.destroy();
});
