/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Icons and tooltips on the kit's items. A menu item and a nav bar item may carry an `icon` - a name from the
 * kit's own small set (`createIcon`, `ICON_NAMES`) or an element of the host's - and a `title`: the tooltip, and the
 * description a reader gives after the item's name. The icon is decoration: the label is still the name.
 *
 * Red by construction before the icons existed, on the suite as it loaded:
 *
 *   SyntaxError: The requested module '../../.plugin/ui/index.js' does not provide an export named 'ICON_NAMES'
 *
 * and, with the two icon exports stubbed in a scratch copy so that the menu and the nav bar as they were could be
 * asked (all 6 failed):
 *
 *   ✖ menu items: an icon by kit name or by element, before the label, hidden from readers, and an item with none draws no gap
 *     TypeError [Error]: Cannot read properties of null (reading 'hidden')
 *   ✖ menu items: a title is the tooltip, and goes with the item to a submenu and away when it is dropped
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
 *   ✖ nav items: an icon before the label and a title on the button, the label still the name
 *     TypeError [Error]: Cannot read properties of null (reading 'getAttribute')
 *   ✖ icons: drawn at the size of the text beside them, in its colour, through tokens, and nothing moves
 *     AssertionError [ERR_ASSERTION]: the sheet declares no flex for .cloudcanvas-ui-icon
 *
 * The test document's case (`ui-testing-mounts.test.js`) failed the same way on the menu as it was:
 * `TypeError [Error]: Cannot read properties of null (reading 'getAttribute')`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { ICON_NAMES, UI_CSS, createIcon, createMenu, createNavBar } from '../../ui/index.js';
import { assertSame, mount } from '../helpers/ui.js';
import { RULES, assertTokensOnly, coloursOf, declared } from './ui-sheet.js';

const ICON = '.cloudcanvas-ui-icon';
const itemOf = (id) => document.querySelector(`[role="menuitem"][data-ui-id="${id}"]`);
const linkOf = (host, id) => host.querySelector(`.cloudcanvas-ui-navbar-link[data-ui-id="${id}"]`);
const slotOf = (node) => node.querySelector('[aria-hidden="true"]:not(svg)');
const MENU = (items) => ({ open: true, label: 'Actions', at: { x: 10, y: 10 }, items });

test('icons: each name is a small drawing in the current colour that no reader meets, and a name the kit has not is refused', (t) => {
  const doc = mount(t).ownerDocument;
  assert.ok(ICON_NAMES.length >= 12 && Object.isFrozen(ICON_NAMES));
  for (const name of ICON_NAMES) {
    const icon = createIcon(doc, name);
    assert.deepEqual([icon.localName, icon.getAttribute('aria-hidden'), icon.getAttribute('focusable'), icon.getAttribute('stroke'), icon.getAttribute('data-icon')], ['svg', 'true', 'false', 'currentColor', name]);
    assert.ok(icon.querySelectorAll('path').length >= 1 && [...icon.querySelectorAll('path')].every((path) => /^[Mm]/.test(path.getAttribute('d'))), `${name} has a path to draw`);
    assert.ok(icon.classList.contains('cloudcanvas-ui-icon'));
  }
  for (const needed of ['empty', 'error', 'locked', 'loading']) assert.ok(ICON_NAMES.includes(needed), `${needed} is there for an empty state`);
  assert.throws(() => createIcon(doc, 'teapot'), /teapot/);
});

test('menu items: an icon by kit name or by element, before the label, hidden from readers, and an item with none draws no gap', (t) => {
  const host = mount(t), menu = createMenu(host);
  const mine = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  menu.update(MENU([{ id: 'add', label: 'Add', icon: 'plus' }, { id: 'mine', label: 'Mine', icon: mine }, { id: 'plain', label: 'Plain' }]));
  const add = itemOf('add'), slot = slotOf(add);
  assert.deepEqual([slot.hidden, slot.querySelector('svg').getAttribute('data-icon'), add.firstElementChild === slot, add.textContent], [false, 'plus', true, 'Add'], 'the name is still the label');
  assertSame(slotOf(itemOf('mine')).firstChild, mine, 'the host\'s own element, as given');
  assert.equal(slotOf(itemOf('plain')).hidden, true);
  menu.destroy();
});

test('menu items: an icon that is the same stays put on the next update, and one that changes or goes is replaced or removed', (t) => {
  const host = mount(t), menu = createMenu(host);
  const mine = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  menu.update(MENU([{ id: 'a', label: 'A', icon: mine }, { id: 'b', label: 'B', icon: 'check' }]));
  const drawn = slotOf(itemOf('b')).firstChild;
  menu.update(MENU([{ id: 'a', label: 'A', icon: mine }, { id: 'b', label: 'B', icon: 'check' }]));
  assertSame(slotOf(itemOf('a')).firstChild, mine);
  assertSame(slotOf(itemOf('b')).firstChild, drawn, 'not redrawn for nothing');
  menu.update(MENU([{ id: 'a', label: 'A' }, { id: 'b', label: 'B', icon: 'close' }]));
  assert.deepEqual([slotOf(itemOf('a')).hidden, slotOf(itemOf('a')).childNodes.length, slotOf(itemOf('b')).firstChild.getAttribute('data-icon')], [true, 0, 'close']);
  assert.throws(() => menu.update(MENU([{ id: 'a', label: 'A', icon: 'teapot' }])), /teapot/);
  menu.destroy();
});

test('menu items: a title is the tooltip, and goes with the item to a submenu and away when it is dropped', (t) => {
  const host = mount(t), menu = createMenu(host);
  const items = [{ id: 'move', label: 'Move to', title: 'Move this note to another folder', items: [{ id: 'left', label: 'Left', title: 'The folder on the left' }] }, { id: 'open', label: 'Open' }];
  menu.update(MENU(items));
  assert.deepEqual([itemOf('move').getAttribute('title'), itemOf('open').hasAttribute('title')], ['Move this note to another folder', false]);
  itemOf('move').click();
  assert.equal(itemOf('left').getAttribute('title'), 'The folder on the left');
  menu.update(MENU([{ id: 'move', label: 'Move to', items: [{ id: 'left', label: 'Left' }] }, { id: 'open', label: 'Open' }]));
  assert.equal(itemOf('move').hasAttribute('title'), false);
  menu.destroy();
});

test('nav items: an icon before the label and a title on the button, the label still the name', (t) => {
  const host = mount(t), nav = createNavBar(host);
  nav.update({ label: 'Views', activeId: 'today', items: [{ id: 'today', label: 'Today', icon: 'info', title: 'What is due today' }, { id: 'plan', label: 'Plan' }] });
  const today = linkOf(host, 'today'), plan = linkOf(host, 'plan');
  assert.deepEqual([slotOf(today).querySelector('svg').getAttribute('data-icon'), today.firstElementChild === slotOf(today), today.getAttribute('title'), today.querySelector('.cloudcanvas-ui-navbar-label').textContent],
    ['info', true, 'What is due today', 'Today']);
  assert.deepEqual([slotOf(plan).hidden, plan.hasAttribute('title')], [true, false]);
  nav.update({ label: 'Views', items: [{ id: 'today', label: 'Today' }, { id: 'plan', label: 'Plan', icon: 'open' }] });
  assert.deepEqual([slotOf(today).hidden, today.hasAttribute('title'), slotOf(plan).querySelector('svg').getAttribute('data-icon')], [true, false, 'open']);
  assert.throws(() => nav.update({ items: [{ id: 'x', label: 'X', icon: 'teapot' }] }), /teapot/);
  nav.destroy();
});

test('icons: drawn at the size of the text beside them, in its colour, through tokens, and nothing moves', () => {
  assert.equal(declared(ICON, 'flex'), 'none');
  assert.deepEqual([declared('.cloudcanvas-ui-menu-icon', 'display'), declared('.cloudcanvas-ui-navbar-icon', 'display')], ['inline-flex', 'inline-flex']);
  assert.equal(declared('.cloudcanvas-ui-menu-label', 'flex'), '1 1 auto', 'the label takes the row, so a submenu\'s arrow stays at the end beside an icon');
  assertTokensOnly(coloursOf([ICON, '-icon']));
  assert.deepEqual(RULES.filter((rule) => rule.selector.includes('-icon') && Object.keys(rule.declarations).some((property) => /^(transition|animation)/.test(property))), []);
  assert.ok(UI_CSS.includes('.cloudcanvas-ui-icon'));
});
