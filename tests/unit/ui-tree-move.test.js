/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Tree: a row dropped on another row asks for a new parent (`onMove(id,
 * parentId)`), the row under the pointer lighting up as the target; and a
 * `query` dims the rows whose label does not hold it. Reported, never done:
 * the rows, what is open and what is selected stay the model's.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTree } from '../../ui/index.js';
import { declared } from './ui-sheet.js';
import { mount, pointer, stubHitTest } from '../helpers/ui.js';

const ITEMS = Object.freeze([
  { id: 'work', label: 'Work' },
  { id: 'plan', parentId: 'work', label: 'Plan' },
  { id: 'ship', parentId: 'work', label: 'Ship it' },
  { id: 'home', label: 'Home' }
]);
const row = (host, id) => host.querySelector(`[data-ui-id="${id}"]`);
const marked = (host, mark) => [...host.querySelectorAll(`.${mark}`)].map((node) => node.getAttribute('data-ui-id'));

/*
 * Written first and seen to fail on a tree that knew no drag:
 *
 *   ✖ tree: a row dropped on another reports onMove(id, parentId), the target lit while over it; dropped on nothing it reports nothing
 *     AssertionError [ERR_ASSERTION]: the row is in hand
 *       actual: false,
 */
test('tree: a row dropped on another reports onMove(id, parentId), the target lit while over it; dropped on nothing it reports nothing', (t) => {
  const host = mount(t);
  const moved = [];
  const activated = [];
  const tree = createTree(host, { onMove: (id, parentId) => moved.push([id, parentId]), onActivate: (id) => activated.push(id) });
  tree.update({ label: 'Notebooks', items: ITEMS, expanded: ['work'], selectedId: 'plan' });
  const root = host.querySelector('[role="tree"]');
  let under = root;
  stubHitTest(t, () => under);
  pointer(row(host, 'ship'), 'pointerdown', { clientX: 10, clientY: 40 });
  under = row(host, 'home').querySelector('.cloudcanvas-ui-tree-label');
  pointer(root, 'pointermove', { clientX: 10, clientY: 90 });
  assert.ok(row(host, 'ship').classList.contains('is-dragging'), 'the row is in hand');
  assert.deepEqual(marked(host, 'is-drop-target'), ['home']);
  pointer(root, 'pointerup', { clientX: 10, clientY: 90 });
  assert.deepEqual(moved, [['ship', 'home']]);
  assert.deepEqual([marked(host, 'is-drop-target'), marked(host, 'is-dragging')], [[], []]);
  assert.deepEqual([row(host, 'ship').getAttribute('aria-level'), activated], ['2', []], 'nothing moved until the model says so, and nothing opened');
  pointer(row(host, 'plan'), 'pointerdown', { clientX: 10, clientY: 20 });
  under = row(host, 'plan');
  pointer(root, 'pointermove', { clientX: 10, clientY: 60 });
  assert.deepEqual(marked(host, 'is-drop-target'), [], 'a row is not its own target');
  under = root;
  pointer(root, 'pointerup', { clientX: 10, clientY: 60 });
  assert.equal(moved.length, 1, 'let go on no row, nothing is asked');
  assert.equal(root.hasAttribute('data-movable'), true, 'the sheet gives its rows the grab cursor');
  tree.destroy();
});

/*
 * A guard, so it passed on a tree that knew no drag. Seen to fail with the drag bound whether or not the host
 * gave `onMove`:
 *
 *   ✖ tree: without onMove a row is not picked up
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
 *     +   [ 'ship' ], true, true
 *     -   [], false, false
 */
test('tree: without onMove a row is not picked up', (t) => {
  const host = mount(t);
  const tree = createTree(host);
  tree.update({ items: ITEMS, expanded: ['work'] });
  const root = host.querySelector('[role="tree"]');
  pointer(row(host, 'ship'), 'pointerdown', { clientX: 10, clientY: 40 });
  pointer(root, 'pointermove', { clientX: 10, clientY: 90 });
  assert.deepEqual([marked(host, 'is-dragging'), root.classList.contains('is-drag-active'), root.hasAttribute('data-movable')], [[], false, false]);
  tree.destroy();
});

/*
 * Written first and seen to fail on a tree that had no query:
 *
 *   ✖ tree: a query dims the rows whose label does not hold it, case aside; an empty one dims nothing
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
 *     + []
 *     - [ 'work', 'plan', 'home' ]
 */
test('tree: a query dims the rows whose label does not hold it, case aside; an empty one dims nothing', (t) => {
  const host = mount(t);
  const tree = createTree(host);
  tree.update({ items: ITEMS, expanded: ['work'], query: 'SHIP' });
  assert.deepEqual(marked(host, 'is-unmatched'), ['work', 'plan', 'home']);
  tree.update({ items: ITEMS, expanded: ['work'], query: '  ' });
  assert.deepEqual(marked(host, 'is-unmatched'), []);
  assert.equal(declared('.cloudcanvas-ui-tree-row.is-unmatched', 'opacity'), '0.45');
  assert.match(declared('.cloudcanvas-ui-tree-row.is-drop-target', 'outline'), /dashed var\(--cc-ui-drop/);
  tree.destroy();
});
