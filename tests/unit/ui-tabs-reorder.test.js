/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Reordering a tab strip: a pointer drag shows where the tab would land and a
 * drop reports `onReorder(id, beforeId | null)`; Alt+ArrowLeft and
 * Alt+ArrowRight report the neighbouring place from the keyboard; a pinned tab
 * does not move and nothing lands before one; the kit moves nothing itself;
 * and a strip given no `onReorder` is the strip it always was.
 *
 * happy-dom lays nothing out, so each row is given the box it would have: the
 * rows stand side by side from `LEFT`, each `WIDTH` wide.
 *
 * Written first, and seen to fail on tabs that could not be moved:
 *
 *   ✖ tabs: a drag shows where the tab would land, and a drop reports onReorder(id, beforeId) - null for the end
 *     AssertionError [ERR_ASSERTION]: a strip whose tabs can be moved says so
 *     null !== 'true'
 *   ✖ tabs: Alt+ArrowLeft and Alt+ArrowRight report the neighbouring place, select nothing, and leave focus on the tab
 *     AssertionError [ERR_ASSERTION]: one place to the left: before the tab that stood there
 *     actual: []   expected: [ [ 'b', 'a' ] ]
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTabs } from '../../ui/index.js';
import { assertSame, key, mount, pointer, stubBox } from '../helpers/ui.js';

const LEFT = 20;
const WIDTH = 100;
const Y = 14;

const tabOf = (host, id) => host.querySelector(`[role="tab"][data-ui-id="${id}"]`);
const rowOf = (host, id) => tabOf(host, id).parentElement;
const stripOf = (host) => host.querySelector('.cloudcanvas-ui-tabs');
const order = (host) => [...host.querySelectorAll('[role="tab"]')].map((node) => node.getAttribute('data-ui-id'));
/** Where the strip says a dragged tab would land: `[tab id, 'before' | 'after']` for each row that is marked. */
const marks = (host) => [...host.querySelectorAll('[data-drop]')].map((row) => [row.querySelector('[role="tab"]').getAttribute('data-ui-id'), row.getAttribute('data-drop')]);
const lifted = (host) => [...host.querySelectorAll('.is-dragging')].map((row) => row.querySelector('[role="tab"]').getAttribute('data-ui-id'));
/** The middle of the place `index` rows along, and a point `offset` pixels from it. */
const at = (index, offset = 0) => LEFT + index * WIDTH + WIDTH / 2 + offset;

/** A strip of `items`, each row given its box, and every report it makes. */
function strip(t, items, { reorder = true, model = {} } = {}) {
  const host = mount(t);
  const seen = { moved: [], chosen: [] };
  const callbacks = { onSelect: (id) => seen.chosen.push(id), ...(reorder ? { onReorder: (id, beforeId) => seen.moved.push([id, beforeId]) } : {}) };
  const tabs = createTabs(host, callbacks);
  const draw = (next = items) => {
    tabs.update({ label: 'Scopes', activeId: next[0].id, activation: 'manual', ...model, items: next });
    next.forEach((item, index) => stubBox(rowOf(host, item.id), { left: LEFT + index * WIDTH, top: 0, width: WIDTH, height: 28 }));
  };
  draw();
  t.after(() => tabs.destroy());
  return { host, tabs, draw, ...seen };
}

/** Let go at client `x`, and send the click a release ends in: the one a real drag swallows. */
function release(host, id, x) {
  pointer(stripOf(host), 'pointerup', { clientX: x, clientY: Y });
  tabOf(host, id).click();
}

/** Press on the tab `id` and carry it to client `x`; `drop` lets go there. */
function carry(host, id, x, { drop = false } = {}) {
  const from = rowOf(host, id).getBoundingClientRect();
  pointer(tabOf(host, id), 'pointerdown', { clientX: from.left + WIDTH / 2, clientY: Y });
  pointer(stripOf(host), 'pointermove', { clientX: x, clientY: Y });
  if (drop) release(host, id, x);
}

const PLAIN = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }, { id: 'd', label: 'D' }];

test('tabs: a drag shows where the tab would land, and a drop reports onReorder(id, beforeId) - null for the end', (t) => {
  const { host, moved, chosen } = strip(t, PLAIN);
  assert.equal(stripOf(host).getAttribute('data-reorder'), 'true', 'a strip whose tabs can be moved says so');
  carry(host, 'a', at(2, 10));
  assert.deepEqual([lifted(host), marks(host)], [['a'], [['d', 'before']]], 'past the middle of C: it would land before D, and the strip shows it there');
  pointer(stripOf(host), 'pointermove', { clientX: at(2, -10), clientY: Y });
  assert.deepEqual(marks(host), [['c', 'before']], 'the mark follows the pointer: short of the middle of C, before C');
  pointer(stripOf(host), 'pointermove', { clientX: at(5), clientY: Y });
  assert.deepEqual(marks(host), [['d', 'after']], 'past the last tab is the end, marked after it');
  assert.deepEqual(moved, [], 'nothing is reported until the tab is let go');
  release(host, 'a', at(5));
  assert.deepEqual(moved, [['a', null]], 'the end is null');
  assert.deepEqual([lifted(host), marks(host), order(host)], [[], [], ['a', 'b', 'c', 'd']], 'the marks are gone, and the kit moved nothing: the order is the caller\'s to answer with');
  carry(host, 'd', at(1, -10), { drop: true });
  assert.deepEqual(moved.at(-1), ['d', 'b']);
  assert.deepEqual(chosen, [], 'a drag selects nothing: the click it ends in is not a press on the tab');
  tabOf(host, 'd').click();
  assert.deepEqual(chosen, ['d'], 'the press after that is a press again');
});

test('tabs: a tab let go where it stands, a short press, and a drag given up with Escape report nothing', (t) => {
  const { host, moved, chosen } = strip(t, PLAIN);
  for (const [x, where] of [[at(1, -10), 'before itself'], [at(1, 10), 'before the tab after it']]) {
    carry(host, 'b', x);
    assert.deepEqual([lifted(host), marks(host)], [['b'], []], `${where} is no move: nothing is marked`);
    release(host, 'b', x);
  }
  carry(host, 'd', at(4), { drop: true });
  assert.deepEqual([moved, chosen], [[], []], 'nor is the end, for the last tab');
  pointer(tabOf(host, 'c'), 'pointerdown', { clientX: at(2), clientY: Y });
  pointer(stripOf(host), 'pointermove', { clientX: at(2, 2), clientY: Y });
  assert.deepEqual(lifted(host), [], 'a press that barely travels lifts nothing');
  release(host, 'c', at(2, 2));
  assert.deepEqual([moved, chosen], [[], ['c']], 'and is the click it always was');
  carry(host, 'a', at(3, -10));
  assert.deepEqual(marks(host), [['d', 'before']]);
  key(document, 'Escape');
  assert.deepEqual([lifted(host), marks(host), moved], [[], [], []], 'Escape puts it back');
});

test('tabs: a pinned tab cannot be dragged, and nothing lands before one', (t) => {
  const front = strip(t, [{ id: 'home', label: 'Home', pinned: true }, { id: 'a', label: 'A' }, { id: 'b', label: 'B' }]);
  carry(front.host, 'home', at(2, 10));
  assert.deepEqual([lifted(front.host), marks(front.host)], [[], []], 'a pinned tab is not picked up');
  release(front.host, 'home', at(2, 10));
  tabOf(front.host, 'a').click();
  assert.deepEqual([front.moved, front.chosen], [[], ['a']], 'it stays where the model put it, and its press was no drag to swallow a click for');
  carry(front.host, 'b', at(0, -10));
  assert.deepEqual(marks(front.host), [['a', 'before']], 'before the pinned tab is no place: the nearest one is right after it');
  release(front.host, 'b', at(0, -10));
  assert.deepEqual(front.moved, [['b', 'a']]);
  carry(front.host, 'a', at(0, -10));
  assert.deepEqual(marks(front.host), [], 'and for the tab that already stands there, that is no move');
  release(front.host, 'a', at(0, -10));
  assert.equal(front.moved.length, 1);

  const middle = strip(t, [{ id: 'a', label: 'A' }, { id: 'home', label: 'Home', pinned: true }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]);
  carry(middle.host, 'c', at(1, -10), { drop: true });
  assert.deepEqual(middle.moved, [['c', 'b']], 'wherever the pinned tab stands: a drop before it lands after it');
  carry(middle.host, 'b', at(1, -10), { drop: true });
  assert.equal(middle.moved.length, 1, 'which for the tab already after it is where it stands');
  carry(middle.host, 'b', at(0, -10), { drop: true });
  assert.deepEqual(middle.moved.at(-1), ['b', 'a'], 'a tab may still pass a pinned one');
});

test('tabs: Alt+ArrowLeft and Alt+ArrowRight report the neighbouring place, select nothing, and leave focus on the tab', (t) => {
  const { host, draw, moved, chosen } = strip(t, PLAIN.slice(0, 3), { model: { activation: 'auto' } });
  const alt = (id, name) => key(tabOf(host, id), name, { altKey: true });
  tabOf(host, 'b').focus();
  assert.equal(alt('b', 'ArrowLeft').defaultPrevented, true);
  assert.deepEqual(moved, [['b', 'a']], 'one place to the left: before the tab that stood there');
  alt('b', 'ArrowRight');
  assert.deepEqual(moved.at(-1), ['b', null], 'one place to the right: after the last tab is the end');
  alt('a', 'ArrowRight');
  assert.deepEqual(moved.at(-1), ['a', 'c'], 'after the tab that stood to its right is before the one after that');
  assert.deepEqual([chosen, order(host)], [[], ['a', 'b', 'c']], 'the keys select nothing and the kit moves nothing');
  assertSame(document.activeElement, tabOf(host, 'b'), 'focus has not roved: Alt+arrow is not the arrow');
  assert.deepEqual([alt('a', 'ArrowLeft').defaultPrevented, alt('c', 'ArrowRight').defaultPrevented, moved.length], [true, true, 3],
    'at either end there is no place to go: nothing is reported, and the key is still taken, so Alt+ArrowLeft does not take the page back');
  assert.deepEqual([alt('b', 'ArrowDown').defaultPrevented, alt('b', 'ArrowUp').defaultPrevented, moved.length], [false, false, 3], 'only the two arrows are a move');
  draw([PLAIN[1], PLAIN[0], PLAIN[2]]);
  assert.deepEqual(order(host), ['b', 'a', 'c']);
  assertSame(document.activeElement, tabOf(host, 'b'), 'the caller answers with the new order, and focus is still on the tab that moved');
  key(tabOf(host, 'b'), 'ArrowRight');
  assert.deepEqual(chosen, ['a'], 'the plain arrows rove and select as they did');
});

test('tabs: the keys keep the pinned rules - a pinned tab does not move, and a tab passes one or stops at it', (t) => {
  const front = strip(t, [{ id: 'home', label: 'Home', pinned: true }, { id: 'a', label: 'A' }, { id: 'b', label: 'B' }]);
  const alt = ({ host }, id, name) => key(tabOf(host, id), name, { altKey: true });
  assert.deepEqual([alt(front, 'home', 'ArrowRight').defaultPrevented, alt(front, 'home', 'ArrowLeft').defaultPrevented, front.moved], [true, true, []], 'a pinned tab stays put');
  alt(front, 'a', 'ArrowLeft');
  assert.deepEqual(front.moved, [], 'the only place to its left is before the pinned tab, which is no place');
  alt(front, 'b', 'ArrowLeft');
  assert.deepEqual(front.moved, [['b', 'a']]);

  const middle = strip(t, [{ id: 'a', label: 'A' }, { id: 'home', label: 'Home', pinned: true }, { id: 'b', label: 'B' }]);
  alt(middle, 'b', 'ArrowLeft');
  assert.deepEqual(middle.moved, [['b', 'a']], 'to the left it passes the pinned tab: the nearest place is beyond it');
  alt(middle, 'a', 'ArrowRight');
  assert.deepEqual(middle.moved.at(-1), ['a', 'b'], 'and to the right it lands after the pinned tab, never before it');
});

test('tabs: without onReorder nothing is draggable, and Alt+arrow is the arrow it always was', (t) => {
  const { host, chosen } = strip(t, PLAIN, { reorder: false, model: { activation: 'auto' } });
  assert.equal(stripOf(host).hasAttribute('data-reorder'), false);
  carry(host, 'b', at(3));
  assert.deepEqual([lifted(host), marks(host), stripOf(host).classList.contains('is-drag-active')], [[], [], false], 'a press that travels is no drag');
  release(host, 'b', at(3));
  assert.deepEqual(chosen, ['b'], 'and the click it ends in is not swallowed');
  tabOf(host, 'b').focus();
  key(tabOf(host, 'b'), 'ArrowRight', { altKey: true });
  assert.deepEqual(chosen, ['b', 'c'], 'the strip roves as it did before the kit could reorder');
});

test('tabs: a strip destroyed in the middle of a drag reports nothing, and update after destroy is a no-op', (t) => {
  const { host, tabs, moved } = strip(t, PLAIN);
  carry(host, 'a', at(3));
  const strip0 = stripOf(host);
  tabs.destroy();
  tabs.destroy();
  pointer(strip0, 'pointerup', { clientX: at(3), clientY: Y });
  assert.deepEqual(moved, []);
  assert.equal(host.children.length, 0);
  assert.doesNotThrow(() => tabs.update({ items: PLAIN }));
  assert.equal(host.children.length, 0);
});
