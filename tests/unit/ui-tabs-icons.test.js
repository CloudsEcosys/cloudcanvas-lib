/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Tabs with icons: an item's `icon` - a kit icon name or a host's own element, as the nav bar and the menu take it -
 * stands before the tab's label, decorative, so the tab's name is still its label (and its badge) and nothing else.
 * A tab with no icon is the tab it always was: no slot, the label first.
 *
 * Red by construction before the strip drew an icon (Momentum's Board views put theirs in by hand), seen on the
 * four cases that say it:
 *
 *   ✖ tabs: an icon stands before the label, hidden from readers, and the tab's name, title and close control are still the label's
 *     AssertionError [ERR_ASSERTION]: before the label: expected null, got <span.cloudcanvas-ui-tabs-label>
 *   ✖ tabs: a host's own element is the icon as it is, kept across a redraw, replaced by another and gone when the item names none
 *     TypeError [Error]: Cannot read properties of null (reading 'firstChild')
 *   ✖ tabs: an icon the kit does not draw is refused before anything is redrawn
 *     AssertionError [ERR_ASSERTION]: Missing expected exception (TypeError).
 *   ✖ tabs: the icon is a mark in a row with the label and the badge, and the sheet draws it through nothing but its own box
 *     AssertionError [ERR_ASSERTION]: the sheet declares no display for .cloudcanvas-ui-tabs-icon
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createIcon, createTabs } from '../../ui/index.js';
import { assertSame, mount } from '../helpers/ui.js';
import { RULES, declared } from './ui-sheet.js';

const SLOT = '.cloudcanvas-ui-tabs-icon';
const tabOf = (host, id) => host.querySelector(`[role="tab"][data-ui-id="${id}"]`);

test('tabs: an icon stands before the label, hidden from readers, and the tab\'s name, title and close control are still the label\'s', (t) => {
  const host = mount(t), tabs = createTabs(host);
  tabs.update({ activeId: 'plain', items: [{ id: 'icon', label: 'Alerts', icon: 'info', closable: true, badge: 3 }, { id: 'plain', label: 'Notes' }] });
  const tab = tabOf(host, 'icon'), slot = tab.querySelector(SLOT);
  assertSame(tab.firstChild, slot, 'before the label');
  assertSame(slot.nextSibling, tab.querySelector('.cloudcanvas-ui-tabs-label'));
  assert.deepEqual([slot.getAttribute('aria-hidden'), slot.hidden, slot.firstChild.getAttribute('data-icon'), slot.firstChild.getAttribute('aria-hidden')], ['true', false, 'info', 'true'], 'a kit icon, decoration');
  assert.equal(tab.querySelector('.cloudcanvas-ui-tabs-label').textContent, 'Alerts');
  assert.deepEqual([tab.hasAttribute('aria-label'), tab.hasAttribute('aria-labelledby')], [false, false], 'the name is what the tab holds, and the icon holds no words');
  assert.equal(tab.nextElementSibling.getAttribute('aria-label'), 'Close Alerts', 'the close control is named for the label');
  assertSame(tab.lastChild, tab.querySelector('.cloudcanvas-ui-badge'), 'and the badge still ends the tab');
  const plain = tabOf(host, 'plain');
  assert.deepEqual([plain.querySelector(SLOT), plain.firstChild.className, plain.textContent], [null, 'cloudcanvas-ui-tabs-label', 'Notes'], 'a tab with no icon has no slot for one');
  tabs.destroy();
});

test('tabs: a host\'s own element is the icon as it is, kept across a redraw, replaced by another and gone when the item names none', (t) => {
  const host = mount(t), tabs = createTabs(host);
  const mine = createIcon(document, 'plus'), other = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const model = (icon) => ({ activeId: 'a', items: [{ id: 'a', label: 'Board', icon }] });
  tabs.update(model(mine));
  const tab = tabOf(host, 'a');
  assertSame(tab.querySelector(SLOT).firstChild, mine, 'the element is in the tab, before the label');
  tabs.update(model(mine));
  assertSame(tab.querySelector(SLOT).firstChild, mine, 'drawn once: the same element after another update');
  tabs.update(model(other));
  assertSame(tab.querySelector(SLOT).firstChild, other);
  assert.equal(mine.isConnected, false);
  tabs.update(model(undefined));
  assert.deepEqual([tab.querySelector(SLOT), tab.firstChild.className, tab.textContent], [null, 'cloudcanvas-ui-tabs-label', 'Board'], 'no icon: no slot, and the label is first again');
  tabs.update(model('close'));
  assert.equal(tab.querySelector(SLOT).firstChild.getAttribute('data-icon'), 'close', 'and it can come back');
  assert.equal(tab.firstChild, tab.querySelector(SLOT));
  tabs.destroy();
});

test('tabs: an icon the kit does not draw is refused before anything is redrawn', (t) => {
  const host = mount(t), tabs = createTabs(host);
  tabs.update({ activeId: 'a', items: [{ id: 'a', label: 'Board' }] });
  assert.throws(() => tabs.update({ activeId: 'b', items: [{ id: 'a', label: 'Board', icon: 'nope' }, { id: 'b', label: 'Map' }] }), { name: 'TypeError', message: /no icon named nope/ });
  assert.throws(() => tabs.update({ activeId: 'a', items: [{ id: 'a', label: 'Board', icon: 4 }] }), TypeError);
  assert.deepEqual([...host.querySelectorAll('[role="tab"]')].map((tab) => tab.textContent), ['Board'], 'the strip is as it was');
  tabs.destroy();
});

test('tabs: the icon is a mark in a row with the label and the badge, and the sheet draws it through nothing but its own box', () => {
  assert.deepEqual([declared(SLOT, 'display'), declared(SLOT, 'flex')], ['inline-flex', 'none'], 'it never shrinks: the label is what gives way');
  assert.deepEqual([declared(`${SLOT} > .cloudcanvas-ui-icon`, 'width'), declared(`${SLOT} > .cloudcanvas-ui-icon`, 'height')], ['1em', '1em'], 'a kit icon is as large as the label\'s text, so a tab with one is no taller than a tab without (seen in Chromium: 30px against 28 at 1.25em)');
  const colours = RULES.filter((rule) => rule.selector.includes(SLOT)).flatMap((rule) => Object.keys(rule.declarations).filter((name) => /^(color|background|border|outline|transition|animation)/.test(name)));
  assert.deepEqual(colours, [], 'it is drawn in the tab\'s own ink, so what recolours the label recolours it, and nothing moves');
});
