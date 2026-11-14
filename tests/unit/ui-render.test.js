/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The UI kit's in-place render helpers: a value write that never takes a
 * control out of the user's hands, a name and a visibility written only when
 * they moved, children placed without rebuilding them, a row cache whose rows
 * keep their node wherever they are placed, and focus returned to a control a
 * reorder moved.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { keepFocus, placeChildren, rowCache, setLabel, setValue, show } from '../../ui/index.js';
import { assertSame, mount } from '../helpers/ui.js';

/** A `<tag id="id">`, for a list whose order is read back by id. */
function node(id, tag = 'p') {
  const made = document.createElement(tag);
  made.id = id;
  return made;
}

const ids = (container) => [...container.childNodes].map((child) => child.id);

test('setValue writes a value that moved, never the control the user is in, and nothing when it is unchanged', (t) => {
  const host = mount(t);
  const field = node('field', 'input');
  host.append(field);
  assert.equal(setValue(field, 'a'), true);
  assert.equal(field.value, 'a');
  field.focus();
  assert.equal(setValue(field, 'b'), false);
  assert.equal(field.value, 'a', 'the focused control keeps what the user has');
  field.blur();
  setValue(field, 'b');
  assert.equal(field.value, 'b', 'once focus has left, the model is read again');
  setValue(field, null);
  assert.equal(field.value, '', 'no value is the empty string, never the word "null"');
  setValue(field, 7);
  assert.equal(field.value, '7');

  let writes = 0;
  const steady = { ownerDocument: document, get value() { return 'same'; }, set value(next) { writes += 1; } };
  assert.equal(setValue(steady, 'same'), false);
  assert.equal(writes, 0, 'an unchanged value is not written');
});

test('setLabel names a control for the ear and the pointer, and writes neither name when it has not moved', (t) => {
  const host = mount(t);
  const control = node('control', 'button');
  host.append(control);
  assert.equal(setLabel(control, 'Open note'), true);
  assert.equal(control.getAttribute('aria-label'), 'Open note');
  assert.equal(control.getAttribute('title'), 'Open note');
  const writes = [];
  const setAttribute = control.setAttribute.bind(control);
  control.setAttribute = (name, value) => { writes.push(name); return setAttribute(name, value); };
  assert.equal(setLabel(control, 'Open note'), false);
  assert.deepEqual(writes, [], 'an unchanged label touches nothing');
  control.setAttribute('title', 'stale');
  writes.length = 0;
  assert.equal(setLabel(control, 'Open note'), true);
  assert.deepEqual(writes, ['title'], 'only the attribute that drifted is written');
  setLabel(control, 'Close note');
  assert.equal(control.getAttribute('aria-label'), 'Close note');
  assert.equal(control.getAttribute('title'), 'Close note');
  setLabel(control, null);
  assert.equal(control.getAttribute('aria-label'), '', 'no label is the empty string, never the word "null"');
  assert.equal(control.getAttribute('title'), '');
});

test('show reveals and hides through `hidden`, and writes nothing when the state has not moved', (t) => {
  const host = mount(t);
  const panel = node('panel', 'div');
  host.append(panel);
  assert.equal(show(panel, false), true);
  assert.equal(panel.hidden, true);
  assert.equal(panel.hasAttribute('hidden'), true);
  assert.equal(show(panel, true), true);
  assert.equal(panel.hidden, false);
  assert.equal(show(panel, 1), false, 'any truthy value is visible, and already was');
  assert.equal(show(panel, 0), true);
  assert.equal(panel.hidden, true);

  let writes = 0;
  const steady = { get hidden() { return true; }, set hidden(next) { writes += 1; } };
  assert.equal(show(steady, false), false);
  assert.equal(writes, 0, 'an unchanged state is not written');
});

test('placeChildren orders a container to exactly the nodes given, moving only what is out of place', (t) => {
  const host = mount(t);
  const [a, b, c] = ['a', 'b', 'c'].map((id) => node(id));
  host.append(a, b, c);
  const moved = [];
  const insertBefore = host.insertBefore.bind(host);
  host.insertBefore = (child, before) => { moved.push(child.id); return insertBefore(child, before); };
  placeChildren(host, [a, b, c]);
  assert.deepEqual(moved, [], 'nodes already in place are not touched');
  placeChildren(host, [c, a]);
  assert.deepEqual(ids(host), ['c', 'a']);
  assert.deepEqual(moved, ['c'], 'one move puts three nodes in the new order');
  assert.equal(b.isConnected, false, 'a node not listed is removed');
  const d = node('d');
  placeChildren(host, [c, d, a]);
  assert.deepEqual(ids(host), ['c', 'd', 'a'], 'a node from outside is adopted in its place');
  placeChildren(host, []);
  assert.equal(host.childNodes.length, 0);
});

test('rowCache keeps one entry per key across syncs, updates it in place, and forgets keys no longer listed', () => {
  const made = [];
  const rows = rowCache({
    create: (item) => {
      made.push(item.id);
      const row = document.createElement('li');
      return { node: row, title: row.appendChild(document.createTextNode('')) };
    },
    update: (entry, item) => { entry.title.data = item.title; }
  });
  const first = rows.sync([{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }]);
  assert.deepEqual(first.map((row) => row.textContent), ['A', 'B']);
  const again = rows.sync([{ id: 'b', title: 'Bee' }, { id: 'a', title: 'A' }]);
  assertSame(again[0], first[1], 'the row for b is the node it always was');
  assert.equal(again[0].textContent, 'Bee');
  assert.deepEqual(made, ['a', 'b'], 'a second sync builds nothing');
  assertSame(rows.get('a').node, first[0]);
  rows.sync([{ id: 'b', title: 'B' }]);
  assert.equal(rows.get('a'), null, 'a key no longer listed is forgotten');
  rows.sync([{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }]);
  assert.deepEqual(made, ['a', 'b', 'a'], 'and built afresh if it returns');
});

test('rowCache: a caller key, an update-free cache, and the mistakes that would corrupt a list', () => {
  const rows = rowCache({ key: (item) => `${item.kind}:${item.id}`, create: () => ({ node: document.createElement('li') }) });
  rows.sync([{ kind: 'note', id: '1' }, { kind: 'task', id: '1' }]);
  assert.ok(rows.get('note:1') && rows.get('task:1'), 'two kinds may share an id');
  assert.equal(rows.get('1'), null);
  assert.throws(() => rows.sync([{ kind: 'note', id: '1' }, { kind: 'note', id: '1' }]), /Duplicate row key: note:1/);
  assert.throws(() => rowCache({}), /create must be a function/);
  assert.throws(() => rowCache(), /create must be a function/);
  assert.throws(() => rowCache({ create: () => ({}) }).sync([{ id: 'x' }]), /returned no node for key "x"/);
});

test('a row placed in another container is the same node, and keepFocus returns the focus the move took', (t) => {
  const host = mount(t);
  const lanes = [node('todo', 'ul'), node('done', 'ul')];
  host.append(...lanes);
  const rows = rowCache({
    create: (item) => {
      const row = node(item.id, 'li');
      return { node: row, field: row.appendChild(node(`field-${item.id}`, 'input')) };
    }
  });
  const [one, two] = rows.sync([{ id: 'one' }, { id: 'two' }]);
  placeChildren(lanes[0], [one, two]);
  const field = rows.get('two').field;
  field.focus();
  const active = document.activeElement;
  rows.sync([{ id: 'one' }, { id: 'two' }]);
  placeChildren(lanes[0], [one]);
  placeChildren(lanes[1], [rows.get('two').node]);
  field.blur();
  keepFocus(host, active);
  assertSame(lanes[1].firstChild, two, 'the row changed lanes without being rebuilt');
  assertSame(document.activeElement, field, 'and the user is still in its field');
});

test('keepFocus leaves focus alone outside its scope, and when nothing was focused', (t) => {
  const host = mount(t);
  const scope = node('scope', 'div');
  const inside = node('inside', 'input');
  const outside = node('outside', 'input');
  scope.append(inside);
  host.append(scope, outside);
  outside.focus();
  outside.blur();
  assert.equal(keepFocus(scope, outside), false);
  assert.notEqual(document.activeElement?.id, 'outside', 'a control outside the scope is not this render\'s to refocus');
  assert.equal(keepFocus(scope, null), false);
  inside.focus();
  assert.equal(keepFocus(scope, inside), false, 'a control that kept its focus is not focused again');
  inside.blur();
  assert.equal(keepFocus(scope, inside), true);
  assertSame(document.activeElement, inside);
});
