/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The kit's own test document (`cloudcanvas/ui/testing`): the minimal DOM an app's `node` tests mount kit
 * controls on, shipped so no app keeps a copy it must teach each new DOM call the kit starts making.
 *
 * Red by construction before the module existed (the import could not resolve):
 *
 *   Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../.plugin/ui/testing/index.js'
 *
 * `prepend` (the kit's tab icon calls it) was not on a node, and the three cases for it each read, observed:
 *
 *   TypeError [Error]: host.prepend is not a function
 *
 * The other calls the kit's controls make to put a node somewhere (`append`, `after`, `replaceWith`, `replaceChildren`,
 * `remove`, and `closest` and `contains` to ask where one is) were already there; the kit calls neither `before` nor
 * `insertAdjacentElement`, so a node has neither.
 *
 * `after` is the kit combobox's, which places its list right behind the field it is given. Its case first lived in
 * Momentum (`tests/unified-shared-work-comments.test.js`, where the comment box of Shared work mounted the combobox) and
 * is here, with the other calls that put a node somewhere. Red there before the test document had `after`, observed:
 *
 *   TypeError: first.after is not a function
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDocument, makeNode } from '../../ui/testing/index.js';
import { createCalendar, createGraph, createMenu, createTabs, createTimeline } from '../../ui/index.js';

test('installs a document that a kit control mounts in, updates and destroys on', () => {
  const doc = installDocument(), host = makeNode('div');
  doc.body.appendChild(host);
  const tabs = createTabs(host, { onSelect() {} });
  tabs.update({ label: 'Pages', activeId: 'a', items: [{ id: 'a', label: 'One' }, { id: 'b', label: 'Two' }] });
  assert.ok(host.querySelectorAll('[role="tab"]').length >= 2, 'both tabs are drawn');
  const menu = createMenu(host, { onSelect() {}, onClose() {} });
  menu.update({ open: true, label: 'Actions', items: [{ id: 'x', label: 'Open' }], at: { x: 1, y: 1 } });
  assert.ok(host.ownerDocument === doc || doc.body.querySelector('[role="menu"]'), 'the menu is drawn in the document');
  menu.destroy(); tabs.destroy();
  assert.doesNotThrow(() => { menu.update({ open: false }); }, 'update after destroy is a no-op');
});

test('answers only what is in the document, as the real one does', () => {
  const doc = installDocument(), stray = makeNode('div');
  stray.id = 'stray';
  assert.equal(doc.getElementById('stray'), null);
  doc.body.appendChild(stray);
  assert.equal(doc.getElementById('stray'), stray);
});

const order = (node) => node.childNodes.map((kid) => kid.tagName ? kid.getAttribute('id') : kid.data);
const made = (doc, ...ids) => ids.map((id) => { const node = doc.createElement('span'); node.id = id; return node; });

test('prepend puts nodes before the first child in the order given, a string as a text node', () => {
  const doc = installDocument(), host = makeNode('div');
  const [one, two, a, b] = made(doc, 'one', 'two', 'a', 'b');
  host.append(one, two);
  host.prepend(a, 'text', b);
  assert.deepEqual(order(host), ['a', 'text', 'b', 'one', 'two']);
  assert.deepEqual([a.parentNode === host, host.firstChild === a, host.childNodes[1].parentNode === host], [true, true, true]);
  const empty = makeNode('div');
  empty.prepend(one);
  assert.deepEqual([order(empty), one.parentNode === empty, order(host)], [['one'], true, ['a', 'text', 'b', 'two']]);
  assert.doesNotThrow(() => { host.prepend(); });
  assert.deepEqual(order(host), ['a', 'text', 'b', 'two'], 'nothing given, nothing moved');
});

test('prepend moves what is already in a tree, and leaves a node that is already first where it is', () => {
  const doc = installDocument(), host = makeNode('div'), other = makeNode('div');
  const [one, two, three] = made(doc, 'one', 'two', 'three');
  host.append(one, two, three);
  host.prepend(one);
  assert.deepEqual(order(host), ['one', 'two', 'three'], 'the first child prepended is still the first');
  host.prepend(three, one);
  assert.deepEqual(order(host), ['three', 'one', 'two'], 'in the order given, each moved from where it stood');
  other.append(two);
  host.prepend(two);
  assert.deepEqual([order(host), order(other), two.parentNode === host], [['two', 'three', 'one'], [], true], 'and from another parent');
});

test('prepend puts a fragment\'s children in its place, and the fragment is left empty', () => {
  const doc = installDocument(), host = makeNode('div'), fragment = doc.createDocumentFragment();
  const [one, a, b] = made(doc, 'one', 'a', 'b');
  host.append(one);
  fragment.append(a, b);
  host.prepend(fragment);
  assert.deepEqual([order(host), fragment.childNodes.length, a.parentNode === host], [['a', 'b', 'one'], 0, true]);
});

test('after puts nodes behind a node in the order given, moving each, and nowhere when the node has no parent', () => {
  const doc = installDocument(), parent = makeNode('div');
  const [first, second, third, loose, orphan] = made(doc, 'first', 'second', 'third', 'loose', 'orphan');
  parent.append(first, second, third);
  first.after(third, loose);
  assert.deepEqual([order(parent), loose.parentNode === parent], [['first', 'third', 'loose', 'second'], true]);
  second.after(second, first);   // the node may be among those placed: they go before the next sibling that is not one of them
  assert.deepEqual(order(parent), ['third', 'loose', 'second', 'first']);
  // Mutation-proved: with the first sibling that follows taken, placed or not, this read
  //   actual: [ 'third', 'second', 'first', 'loose' ], expected: [ 'third', 'loose', 'first', 'second' ]
  third.after(loose, first);
  assert.deepEqual(order(parent), ['third', 'loose', 'first', 'second']);
  orphan.after(first);
  assert.equal(first.parentNode, parent, 'a node with no parent has no place to give');
});

/*
 * K11: the timeline's and the calendar's "more" button stands where its item does by the geometry the item carries - read back with
 * `style.getPropertyValue`, cleared with `style.removeProperty` - and the test document's style could only be written to. The views
 * mounted on it with a selection and a menu, which Momentum's suites do, each read, observed on the document of `d242ea4` + the buttons:
 *
 *   ✖ a node's style reads back the custom properties it was given and lets one go
 *     TypeError [Error]: style.getPropertyValue is not a function
 *   ✖ the timeline, the calendar and the graph draw their "more" button on a selection, on this document
 *     TypeError [Error]: bar.style.getPropertyValue is not a function
 */
test('a node\'s style reads back the custom properties it was given and lets one go', () => {
  const { style } = makeNode('div');
  style.setProperty('--timeline-x', '12px');
  assert.equal(style.getPropertyValue('--timeline-x'), '12px');
  assert.equal(style.getPropertyValue('--never-set'), '', 'a property it was not given is the empty string, as in a browser');
  assert.equal(style.removeProperty('--timeline-x'), '12px', 'and what it let go is what it held');
  assert.equal(style.getPropertyValue('--timeline-x'), '');
});

test('the timeline, the calendar and the graph draw their "more" button on a selection, on this document', () => {
  const doc = installDocument(), host = makeNode('div');
  doc.body.appendChild(host);
  const menu = () => {};
  const timeline = createTimeline(host, { onMenu: menu });
  timeline.update({ now: '2026-09-29T12:00', items: [{ id: 'a', title: 'Draft', start: '2026-09-28', end: '2026-10-02' }], selectedId: 'a' });
  const calendar = createCalendar(host, { onMenu: menu });
  calendar.update({ view: 'week', date: '2026-09-29', events: [{ id: 'e', title: 'Call', start: '2026-09-29T09:00', end: '2026-09-29T10:00' }, { id: 'f', title: 'Trip', start: '2026-09-30', allDay: true }], selectedId: 'e' });
  calendar.update({ view: 'week', date: '2026-09-29', events: [{ id: 'e', title: 'Call', start: '2026-09-29T09:00', end: '2026-09-29T10:00' }, { id: 'f', title: 'Trip', start: '2026-09-30', allDay: true }], selectedId: 'f' });
  const graph = createGraph(host, { onMenu: menu });
  graph.update({ nodes: [{ id: 'g', label: 'Goal' }], edges: [], selectedId: 'g' });
  assert.deepEqual([...host.querySelectorAll('.cloudcanvas-ui-item-more')].map((node) => node.getAttribute('aria-label')),
    ['More actions for Draft', 'More actions for Trip', 'More actions for Goal']);
  for (const control of [timeline, calendar, graph]) control.destroy();
});
