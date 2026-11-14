/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Chips: a labelled group of toggles that report and never flip themselves, a
 * named Remove beside the ones that can go, and focus that stays in the group
 * when a chip leaves it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createChips } from '../../ui/index.js';
import { assertSame, mount } from '../helpers/ui.js';

const ITEMS = Object.freeze([
  { id: 'work', label: 'Work', tone: '3', pressed: true },
  { id: 'home', label: 'Home', removable: true },
  { id: 'later', label: 'Later <b>' }
]);

const chipsOf = (host) => [...host.querySelectorAll('.cloudcanvas-ui-chips-chip')];
const toggle = (host, id) => host.querySelector(`[data-ui-id="${id}"]`);
const remove = (host, id) => host.querySelector(`[data-ui-remove="${id}"]`);

test('chips: a labelled group of toggle buttons, each saying whether it is pressed', (t) => {
  const host = mount(t);
  const chips = createChips(host, { onToggle() {}, onRemove() {} });
  chips.update({ label: 'Categories', items: ITEMS });
  const group = host.querySelector('[role="group"]');
  assert.equal(group.getAttribute('aria-label'), 'Categories');
  assert.deepEqual(chipsOf(host).map((chip) => chip.textContent.replace('×', '')), ['Work', 'Home', 'Later <b>'], 'labels are text, never markup');
  assert.deepEqual(ITEMS.map((item) => toggle(host, item.id).getAttribute('aria-pressed')), ['true', 'false', 'false']);
  assert.ok(ITEMS.every((item) => toggle(host, item.id).localName === 'button' && toggle(host, item.id).type === 'button'));
  assert.deepEqual(chipsOf(host).map((chip) => chip.getAttribute('data-tone')), ['3', null, null]);
  chips.update({ items: ITEMS });
  assert.equal(group.getAttribute('aria-label'), 'Chips', 'the default name');
  chips.destroy();
});

test('chips: a press reports the state asked for and changes nothing until the model says so', (t) => {
  const host = mount(t);
  const toggled = [];
  const chips = createChips(host, { onToggle: (id, pressed) => toggled.push([id, pressed]) });
  chips.update({ items: ITEMS });
  toggle(host, 'work').click();
  toggle(host, 'home').click();
  assert.deepEqual(toggled, [['work', false], ['home', true]]);
  assert.equal(toggle(host, 'home').getAttribute('aria-pressed'), 'false', 'the chip shows what the next model says, not what was asked');
  chips.update({ items: ITEMS.map((item) => (item.id === 'home' ? { ...item, pressed: true } : item)) });
  assert.equal(toggle(host, 'home').getAttribute('aria-pressed'), 'true');
  chips.destroy();
});

test('chips: only a removable chip has a Remove, named for the chip in the host\'s words; it reports and leaves the chip', (t) => {
  const host = mount(t);
  const removed = [];
  const toggled = [];
  const chips = createChips(host, { onToggle: (id) => toggled.push(id), onRemove: (id) => removed.push(id) });
  chips.update({ items: ITEMS });
  assert.equal(remove(host, 'home').hidden, false);
  assert.equal(remove(host, 'home').getAttribute('aria-label'), 'Remove Home');
  assert.equal(remove(host, 'home').type, 'button');
  assert.equal(remove(host, 'work').hidden, true, 'a chip that cannot go offers no way to send it');
  remove(host, 'home').click();
  assert.deepEqual(removed, ['home']);
  assert.deepEqual(toggled, [], 'removing is not pressing');
  assert.equal(chipsOf(host).length, 3, 'the chip stays until the model drops it');
  chips.update({ items: ITEMS, removeLabel: 'Drop' });
  assert.equal(remove(host, 'home').getAttribute('aria-label'), 'Drop Home');
  chips.destroy();
});

test('chips: without onToggle a chip is text, and without onRemove nothing offers to remove', (t) => {
  const host = mount(t);
  const chips = createChips(host);
  chips.update({ items: ITEMS });
  assert.equal(host.querySelectorAll('button').length, 0, 'a button that does nothing is not drawn');
  assert.deepEqual(chipsOf(host).map((chip) => chip.textContent), ['Work', 'Home', 'Later <b>']);
  assertSame(host.querySelector('[aria-pressed]'), null);
  chips.destroy();
});

test('chips: a redraw keeps the chip the user is on; when that chip is removed, focus moves to its neighbour', (t) => {
  const host = mount(t);
  const chips = createChips(host, { onToggle() {}, onRemove() {} });
  chips.update({ items: ITEMS.map((item) => ({ ...item, removable: true })) });
  const home = toggle(host, 'home');
  home.focus();
  chips.update({ items: ITEMS.map((item) => ({ ...item, removable: true, label: `${item.label}!` })) });
  assertSame(toggle(host, 'home'), home, 'the same element, not a rebuilt one');
  assertSame(document.activeElement, home);
  assert.equal(home.textContent, 'Home!');
  remove(host, 'home').focus();
  chips.update({ items: [ITEMS[0], ITEMS[2]] });
  assertSame(document.activeElement, toggle(host, 'later'), 'the chip that took its place');
  toggle(host, 'later').focus();
  chips.update({ items: [ITEMS[0]] });
  assertSame(document.activeElement, toggle(host, 'work'), 'or the last one left');
  chips.update({ items: [] });
  assert.equal(chipsOf(host).length, 0);
  assert.throws(() => chips.update({ items: [{ id: 'a', label: 'A' }, { id: 'a', label: 'B' }] }), /duplicate chip id/);
  chips.destroy();
});

test('chips: destroy removes the group, ends its listeners, and is safe to repeat', (t) => {
  const host = mount(t);
  const calls = [];
  const chips = createChips(host, { onToggle: (id) => calls.push(id), onRemove: (id) => calls.push(id) });
  chips.update({ items: ITEMS });
  const press = toggle(host, 'work');
  const drop = remove(host, 'home');
  chips.destroy();
  chips.destroy();
  press.click();
  drop.click();
  assert.deepEqual(calls, []);
  assert.equal(host.children.length, 0);
  assert.doesNotThrow(() => chips.update({ items: ITEMS }));
  assert.equal(host.children.length, 0);
});
