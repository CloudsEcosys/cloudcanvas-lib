/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Tree: a labelled `role="tree"` of the rows that are open, one tab stop that
 * roves with the arrows, expand and collapse reported and never done, and a
 * list that survives the data it is given.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createNavBar, createTree } from '../../ui/index.js';
import { assertSame, key, mount } from '../helpers/ui.js';

const ITEMS = Object.freeze([
  { id: 'work', label: 'Work', count: 12, tone: '2' },
  { id: 'plan', parentId: 'work', label: 'Plan' },
  { id: 'q4', parentId: 'plan', label: 'Q4' },
  { id: 'ship', parentId: 'work', label: 'Ship', count: 0 },
  { id: 'home', label: 'Home' }
]);

const rowsOf = (host) => [...host.querySelectorAll('[role="treeitem"]')];
const idsOf = (host) => rowsOf(host).map((row) => row.getAttribute('data-ui-id'));
const row = (host, id) => host.querySelector(`[data-ui-id="${id}"]`);
const attrs = (node, names) => names.map((name) => node.getAttribute(`aria-${name}`));
const stops = (host) => rowsOf(host).filter((node) => node.getAttribute('tabindex') === '0').map((node) => node.getAttribute('data-ui-id'));

test('tree: a labelled tree of the open rows, each with its level, its place and what it holds', (t) => {
  const host = mount(t);
  const tree = createTree(host);
  tree.update({ label: 'Notebooks', items: ITEMS, expanded: ['work'], selectedId: 'plan' });
  const root = host.querySelector('[role="tree"]');
  assert.equal(root.getAttribute('aria-label'), 'Notebooks');
  assert.deepEqual(idsOf(host), ['work', 'plan', 'ship', 'home'], 'a closed row keeps its children out of the document');
  assert.ok(rowsOf(host).every((node) => node.localName === 'button' && node.type === 'button'));
  assert.deepEqual(attrs(row(host, 'work'), ['level', 'posinset', 'setsize', 'expanded', 'selected']), ['1', '1', '2', 'true', 'false']);
  assert.deepEqual(attrs(row(host, 'plan'), ['level', 'posinset', 'setsize', 'expanded', 'selected']), ['2', '1', '2', 'false', 'true']);
  assert.deepEqual(attrs(row(host, 'ship'), ['level', 'posinset', 'setsize', 'expanded']), ['2', '2', '2', null], 'a leaf neither opens nor closes');
  assert.deepEqual(attrs(row(host, 'home'), ['level', 'posinset', 'setsize', 'expanded']), ['1', '2', '2', null]);
  assert.equal(row(host, 'work').querySelector('.cloudcanvas-ui-tree-label').textContent, 'Work');
  const counts = Object.fromEntries(rowsOf(host).map((node) => {
    const count = node.querySelector('.cloudcanvas-ui-tree-count');
    return [node.getAttribute('data-ui-id'), count.hidden ? null : count.textContent];
  }));
  assert.deepEqual(counts, { work: '12', plan: null, ship: '0', home: null }, 'zero is a count; none is not');
  assert.equal(row(host, 'work').getAttribute('data-tone'), '2');
  assert.equal(row(host, 'plan').hasAttribute('data-tone'), false);
  assert.deepEqual(stops(host), ['plan'], 'one tab stop, on the selected row');
  tree.update({ items: [{ id: 'a' }] });
  assert.equal(root.getAttribute('aria-label'), 'Tree', 'the default name');
  assert.equal(row(host, 'a').querySelector('.cloudcanvas-ui-tree-label').textContent, 'a', 'a row with no label shows its id');
  assert.equal(row(host, 'a').hasAttribute('aria-selected'), false, 'a tree with no selection does not call every row "not selected"');
  tree.destroy();
});

test('tree: arrows rove without wrapping, Home and End jump, and exactly one row is the tab stop', (t) => {
  const host = mount(t);
  const tree = createTree(host);
  tree.update({ items: ITEMS, expanded: ['work'], selectedId: 'plan' });
  row(host, 'plan').focus();
  const press = (name) => key(document.activeElement, name);
  const focused = () => document.activeElement.getAttribute('data-ui-id');
  assert.equal(press('ArrowDown').defaultPrevented, true);
  assert.equal(focused(), 'ship');
  press('ArrowDown');
  press('ArrowDown');
  assert.equal(focused(), 'home', 'the last row is the end, not a wrap');
  assert.deepEqual(stops(host), ['home']);
  press('Home');
  assert.equal(focused(), 'work');
  press('End');
  assert.equal(focused(), 'home');
  press('ArrowUp');
  assert.equal(focused(), 'ship');
  assert.equal(press('x').defaultPrevented, false, 'a key that is not the tree\'s is left alone');
  tree.destroy();
});

test('tree: Right expands or enters, Left collapses or goes to the parent; both are reported, never done', (t) => {
  const host = mount(t);
  const toggled = [];
  const tree = createTree(host, { onToggle: (id, expanded) => toggled.push([id, expanded]) });
  const model = { items: ITEMS, expanded: ['work'], selectedId: 'plan' };
  tree.update(model);
  const press = (id, name) => key(row(host, id), name);
  const focused = () => document.activeElement.getAttribute('data-ui-id');
  row(host, 'plan').focus();
  press('plan', 'ArrowRight');
  assert.deepEqual(toggled, [['plan', true]]);
  assert.deepEqual(idsOf(host), ['work', 'plan', 'ship', 'home'], 'the tree shows what the next model says, not what was asked');
  assert.equal(focused(), 'plan');
  tree.update({ ...model, expanded: ['work', 'plan'] });
  assert.deepEqual(idsOf(host), ['work', 'plan', 'q4', 'ship', 'home']);
  press('plan', 'ArrowRight');
  assert.equal(focused(), 'q4', 'an open row is entered');
  assert.equal(press('q4', 'ArrowRight').defaultPrevented, false, 'a leaf has nowhere to go');
  assert.equal(focused(), 'q4');
  press('q4', 'ArrowLeft');
  assert.equal(focused(), 'plan', 'a leaf goes to its parent');
  press('plan', 'ArrowLeft');
  assert.deepEqual(toggled.at(-1), ['plan', false]);
  tree.update(model);
  press('plan', 'ArrowLeft');
  assert.equal(focused(), 'work', 'a closed row goes to its parent');
  press('work', 'ArrowLeft');
  assert.deepEqual(toggled.at(-1), ['work', false]);
  row(host, 'home').focus();
  assert.equal(press('home', 'ArrowLeft').defaultPrevented, false, 'a closed root row has nowhere to go');
  assert.equal(toggled.length, 3);
  tree.destroy();
});

test('tree: Enter or a click activates a row; a click on the twisty of a parent toggles it instead', (t) => {
  const host = mount(t);
  const activated = [];
  const toggled = [];
  const tree = createTree(host, { onActivate: (id) => activated.push(id), onToggle: (id, expanded) => toggled.push([id, expanded]) });
  tree.update({ items: ITEMS, expanded: ['work'], selectedId: 'plan' });
  assert.equal(key(row(host, 'ship'), 'Enter').defaultPrevented, true, 'Enter is ours, so the platform does not click as well');
  row(host, 'home').click();
  assert.deepEqual(activated, ['ship', 'home']);
  assert.deepEqual(stops(host), ['home'], 'the tab stop follows the pointer');
  row(host, 'work').querySelector('.cloudcanvas-ui-tree-twisty').click();
  row(host, 'plan').querySelector('.cloudcanvas-ui-tree-twisty').click();
  assert.deepEqual(toggled, [['work', false], ['plan', true]]);
  row(host, 'ship').querySelector('.cloudcanvas-ui-tree-twisty').click();
  assert.deepEqual(activated, ['ship', 'home', 'ship'], 'a leaf has nothing to toggle: its twisty is part of the row');
  assert.deepEqual(toggled.length, 2);
  assert.equal(row(host, 'plan').getAttribute('aria-selected'), 'true', 'selection is the model\'s, not the click\'s');
  tree.destroy();
});

test('tree: an item whose parent is missing shows at the root; a loop of parents shows every item once; a repeated id is refused', (t) => {
  const host = mount(t);
  const tree = createTree(host);
  assert.doesNotThrow(() => tree.update({ items: [{ id: 'orphan', parentId: 'gone', label: 'Orphan' }, { id: 'self', parentId: 'self', label: 'Self' }] }));
  assert.deepEqual(idsOf(host), ['orphan', 'self']);
  assert.deepEqual(rowsOf(host).map((node) => node.getAttribute('aria-level')), ['1', '1']);
  tree.update({ items: [{ id: 'a', parentId: 'b', label: 'A' }, { id: 'b', parentId: 'a', label: 'B' }, { id: 'c', label: 'C' }], expanded: ['a', 'b'] });
  assert.deepEqual(idsOf(host), ['c', 'a', 'b'], 'the loop is cut at its first item, which becomes a root');
  assert.deepEqual(rowsOf(host).map((node) => node.getAttribute('aria-level')), ['1', '1', '2']);
  assert.throws(() => tree.update({ items: [{ id: 'a' }, { id: 'a' }] }), /duplicate tree id/);
  assert.doesNotThrow(() => tree.update({}));
  assert.deepEqual(idsOf(host), []);
  tree.destroy();
});

test('tree: a redraw keeps the row the user is in; closing an ancestor moves focus up to it; an idle tree takes no focus', (t) => {
  const host = mount(t);
  const outside = document.createElement('button');
  host.append(outside);
  const tree = createTree(host);
  const model = { items: ITEMS, expanded: ['work', 'plan'], selectedId: null };
  tree.update(model);
  const q4 = row(host, 'q4');
  q4.focus();
  tree.update({ ...model, items: ITEMS.map((item) => (item.id === 'q4' ? { ...item, label: 'Quarter four' } : item)) });
  assertSame(row(host, 'q4'), q4, 'the same element, not a rebuilt one');
  assertSame(document.activeElement, q4);
  assert.equal(q4.querySelector('.cloudcanvas-ui-tree-label').textContent, 'Quarter four');
  tree.update({ ...model, expanded: [] });
  assert.deepEqual(idsOf(host), ['work', 'home']);
  assertSame(document.activeElement, row(host, 'work'), 'focus rises to the nearest row still shown');
  assert.deepEqual(stops(host), ['work']);
  outside.focus();
  tree.update(model);
  assertSame(document.activeElement, outside, 'a redraw never takes focus from elsewhere');
  tree.destroy();
});

/** What assistive technology is given of `node`: its text, without what is hidden from it. */
function heard(node) {
  if (node.nodeType === 3) return node.data;
  if (node.getAttribute('aria-hidden') === 'true') return '';
  return [...node.childNodes].map(heard).filter(Boolean).join(' ');
}

/*
 * Written first and seen to fail on a tree whose rows took a count and nothing else:
 *
 *   ✖ tree: an item takes the kit badge - a flag too - beside its count, kept across redraws and heard once
 *     AssertionError [ERR_ASSERTION]: work carries its badge inside its row
 */
test('tree: an item takes the kit badge - a flag too - beside its count, kept across redraws and heard once', (t) => {
  const host = mount(t);
  const navHost = mount(t);
  const badges = { work: { count: 120, label: '{count} unread', tone: 'danger', shape: 'flag' }, home: 3 };
  const items = ITEMS.map((item) => ({ ...item, badge: badges[item.id] }));
  const tree = createTree(host);
  const nav = createNavBar(navHost);
  const badgeOf = (id) => row(host, id).querySelector('.cloudcanvas-ui-badge');
  const drawn = (badge) => badge.outerHTML.replace(/cloudcanvas-ui-badge-flag-\d+/g, 'cloudcanvas-ui-badge-flag-n');
  tree.update({ label: 'Notebooks', items, expanded: ['work'] });
  nav.update({ items: items.filter((item) => badges[item.id] !== undefined) });
  for (const id of ['work', 'home']) {
    assert.ok(badgeOf(id), `${id} carries its badge inside its row`);
    assert.equal(drawn(badgeOf(id)), drawn(navHost.querySelector(`[data-ui-id="${id}"] .cloudcanvas-ui-badge`)), `${id}: the badge a tab and the nav bar draw from the same model`);
  }
  assert.deepEqual([badgeOf('work').getAttribute('data-shape'), badgeOf('work').getAttribute('data-tone')], ['flag', 'danger']);
  assert.deepEqual([...row(host, 'work').children].slice(2).map((node) => node.className), ['cloudcanvas-ui-tree-label', 'cloudcanvas-ui-badge', 'cloudcanvas-ui-tree-count'],
    'after the label and before the count, which keeps its place at the end of the row');
  assert.equal(heard(row(host, 'work')), 'Work 120 unread 12', 'the ear gets the label, what the badge says - once, the capped figure and the flag hidden from it - and the count');
  assert.equal(heard(row(host, 'home')), 'Home 3', 'a bare number is the count');
  assertSame(badgeOf('plan'), null, 'an item that names none has none');
  assert.equal(row(host, 'ship').querySelector('.cloudcanvas-ui-tree-count').textContent, '0', 'and its count is as it was');
  const kept = badgeOf('work');
  tree.update({ label: 'Notebooks', expanded: ['work'], items: items.map((item) => (item.id === 'work' ? { ...item, badge: { ...badges.work, count: 2 } } : { ...item, badge: undefined })) });
  assertSame(badgeOf('work'), kept, 'the same badge, redrawn');
  assert.equal(heard(row(host, 'work')), 'Work 2 unread 12');
  assertSame(badgeOf('home'), null, 'a badge the model no longer names is gone');
  tree.update({ label: 'Notebooks', items, expanded: [] });
  assert.deepEqual(idsOf(host), ['work', 'home'], 'a row that closes takes its badge with it');
  // Seen to fail while a badge was ended for any row "off the page": `AssertionError: a tree drawn before its host is on the page keeps its badges across a redraw`.
  const loose = document.createElement('div');
  const early = createTree(loose);
  early.update({ items });
  early.update({ items });
  assert.ok(loose.querySelector('[data-ui-id="work"] .cloudcanvas-ui-badge'), 'a tree drawn before its host is on the page keeps its badges across a redraw');
  early.destroy();
  const row0 = row(host, 'work');
  tree.destroy();
  nav.destroy();
  assertSame(row0.querySelector('.cloudcanvas-ui-badge'), null, 'destroy ends every badge');
  assert.equal(host.children.length, 0);
});

test('tree: destroy removes it, ends its listeners, and is safe to repeat', (t) => {
  const host = mount(t);
  const activated = [];
  const tree = createTree(host, { onActivate: (id) => activated.push(id) });
  tree.update({ items: ITEMS });
  const first = row(host, 'work');
  tree.destroy();
  tree.destroy();
  first.click();
  key(first, 'Enter');
  assert.deepEqual(activated, []);
  assert.equal(host.children.length, 0);
  assert.doesNotThrow(() => tree.update({ items: ITEMS }));
  assert.equal(host.children.length, 0);
});
