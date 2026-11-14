/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * THE TREE SAYS A CUT LABEL WHOLE. A tree row is one line and ends a label that does not fit in an ellipsis, and the
 * row carried nothing that said the rest: a host drew the tooltip itself, reading the kit's class name from outside.
 * Now a row whose label is actually cut carries the whole label as its `title`, a row whose label fits carries none,
 * and the title follows both a label that changes and a tree that is made wider or narrower, with nothing for the host to call.
 *
 * What is held here is what the test document can hold: it lays nothing out, so a case says what is measured (a label
 * `scrollWidth` of ten pixels a letter against a `clientWidth` the case names) and fires the size observer by hand.
 * The same, with a browser's own layout, is `tests/browser/ui-more.test.js`.
 *
 * Every case was written before the code and run on the tree as it stood at `64a2e1b`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTree } from '../../ui/index.js';
import { mount } from '../helpers/ui.js';

const LABEL = 'cloudcanvas-ui-tree-label';
const WORKED = 'A very long label that goes on and on and on';
const ITEMS = Object.freeze([{ id: 'a', label: WORKED }, { id: 'b', label: 'Short' }]);
const titles = (host) => [...host.querySelectorAll('[role="treeitem"]')].map((row) => row.getAttribute('title'));

/**
 * The layout the test document has none of: a label is `10px` a letter wide, in a tree whose labels have `room` pixels (changed with
 * `set`). Both are properties the browser gives an element, so they are put where the browser has them, for the rest of the test.
 */
function layout(t, room) {
  const now = { room };
  const was = ['scrollWidth', 'clientWidth'].map((name) => [name, Object.getOwnPropertyDescriptor(HTMLElement.prototype, name)]);
  const reading = (name, value) => Object.defineProperty(HTMLElement.prototype, name, { configurable: true, get() { return this.classList.contains(LABEL) ? value(this) : 0; } });
  reading('scrollWidth', (node) => node.textContent.length * 10);
  reading('clientWidth', () => now.room);
  t.after(() => { for (const [name, before] of was) { if (before) Object.defineProperty(HTMLElement.prototype, name, before); else delete HTMLElement.prototype[name]; } });
  return { set: (next) => { now.room = next; } };
}

/** A ResizeObserver the test fires by hand: every one made is kept, with what it watches and whether it was let go. */
function observers(t) {
  const view = document.defaultView, original = view.ResizeObserver, made = [];
  view.ResizeObserver = class {
    constructor(callback) { this.callback = callback; this.watching = []; this.gone = false; made.push(this); }
    observe(node) { this.watching.push(node); }
    unobserve() {}
    disconnect() { this.gone = true; }
  };
  t.after(() => { view.ResizeObserver = original; });
  return { made, fire: () => made.filter((one) => !one.gone).forEach((one) => one.callback([], one)) };
}

/*
 * Seen to fail on the tree of `64a2e1b`, whose rows carried no title:
 *
 *   ✖ tree title: a row whose label is cut says it whole, and a row whose label fits says nothing
 *     AssertionError [ERR_ASSERTION]: the cut label is the row's title, the one that fits has none
 *     actual: [ null, null ],
 *     expected: [ 'A very long label that goes on and on and on', null ],
 */
test('tree title: a row whose label is cut says it whole, and a row whose label fits says nothing', (t) => {
  layout(t, 200);
  const host = mount(t), tree = createTree(host);
  tree.update({ items: ITEMS });
  assert.deepEqual(titles(host), [WORKED, null], 'the cut label is the row\'s title, the one that fits has none');
  tree.destroy();
});

/*
 * Seen to fail on the tree of `64a2e1b` (the rename to a label that fits passed there, as no row had a title to lose):
 *
 *   ✖ tree title: the title follows a label that changes: it goes when the label fits, and comes when it is cut
 *     AssertionError [ERR_ASSERTION]: lengthened past the room, it says the whole of it
 *     actual: [ null, null ],
 *     expected: [ null, 'A different label that is long enough to be cut by a narrow tree' ],
 */
test('tree title: the title follows a label that changes: it goes when the label fits, and comes when it is cut', (t) => {
  layout(t, 200);
  const host = mount(t), tree = createTree(host);
  tree.update({ items: ITEMS });
  tree.update({ items: [{ id: 'a', label: 'Renamed' }, { id: 'b', label: 'Short' }] });
  assert.deepEqual(titles(host), [null, null], 'renamed to fit, the row says nothing');
  const LONGER = 'A different label that is long enough to be cut by a narrow tree';
  tree.update({ items: [{ id: 'a', label: 'Renamed' }, { id: 'b', label: LONGER }] });
  assert.deepEqual(titles(host), [null, LONGER], 'lengthened past the room, it says the whole of it');
  tree.destroy();
});

/*
 * Seen to fail on the tree of `64a2e1b` (nothing is cut at 600px, so that half passed):
 *
 *   ✖ tree title: a tree made narrower or wider says the labels it now cuts, with nothing redrawn
 *     AssertionError [ERR_ASSERTION]: at 200px the long label is cut
 *     actual: [ null, null ],
 *     expected: [ 'A very long label that goes on and on and on', null ],
 */
test('tree title: a tree made narrower or wider says the labels it now cuts, with nothing redrawn', (t) => {
  const { made, fire } = observers(t), room = layout(t, 600);
  const host = mount(t), tree = createTree(host);
  tree.update({ items: ITEMS });
  assert.deepEqual(titles(host), [null, null], 'at 600px nothing is cut');
  room.set(200);
  fire();
  assert.deepEqual(titles(host), [WORKED, null], 'at 200px the long label is cut');
  room.set(30);
  fire();
  assert.deepEqual(titles(host), [WORKED, 'Short'], 'at 30px both are');
  room.set(600);
  fire();
  assert.deepEqual(titles(host), [null, null], 'and wide again, neither');
  assert.equal(made.length, 1, 'one watch, on the tree');
  assert.equal(made[0].watching[0].getAttribute('role'), 'tree');
  tree.destroy();
  assert.equal(made[0].gone, true, 'it is let go with the tree');
});

/*
 * Seen to fail on the tree of `64a2e1b`; held so the watch is never a thing the tree needs in order to title what it draws (a document with
 * no size observer is titled as it is drawn and as its labels change):
 *
 *   ✖ tree title: with no size observer the tree still titles what it draws
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
 *     actual: [ null, null ],
 *     expected: [ 'A very long label that goes on and on and on', null ],
 */
test('tree title: with no size observer the tree still titles what it draws', (t) => {
  const view = document.defaultView, original = view.ResizeObserver;
  view.ResizeObserver = undefined;
  t.after(() => { view.ResizeObserver = original; });
  layout(t, 200);
  const host = mount(t), tree = createTree(host);
  tree.update({ items: ITEMS });
  assert.deepEqual(titles(host), [WORKED, null]);
  tree.destroy();
});
