/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The board: rendering from plain data, roving focus, the keyboard pick-up /
 * move / drop, refusals, pointer drops, and a controlled model.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createKanban } from '../../ui/index.js';
import { assertSame, key, mount, pointer, stubBox, stubHitTest } from '../helpers/ui.js';

const MODEL = Object.freeze({
  label: 'Plan',
  columns: [
    { id: 'todo', label: 'To do', cards: [{ id: 'a', title: 'Call', detail: 'Dentist' }, { id: 'b', title: 'Buy' }] },
    { id: 'doing', label: 'Doing', cards: [{ id: 'c', title: 'Write', tone: 'warning' }] },
    { id: 'done', label: 'Done', cards: [] }
  ]
});

function board(t, callbacks = {}) {
  const host = mount(t);
  const moves = [];
  const kanban = createKanban(host, { onMove: (...args) => moves.push(args), ...callbacks });
  kanban.update(MODEL);
  const card = (id) => host.querySelector(`.cloudcanvas-ui-kanban-card[data-ui-id="${id}"]`);
  return { host, kanban, moves, card };
}

test('renders labelled columns with counts and cards; ids must be unique across the board', (t) => {
  const { host, card, kanban } = board(t);
  assert.equal(host.querySelector('.cloudcanvas-ui-kanban').getAttribute('aria-label'), 'Plan');
  const sections = [...host.querySelectorAll('.cloudcanvas-ui-kanban-column')];
  assert.deepEqual(sections.map((section) => document.getElementById(section.getAttribute('aria-labelledby')).textContent), ['To do2', 'Doing1', 'Done0']);
  assert.equal(card('a').querySelector('.cloudcanvas-ui-kanban-detail').textContent, 'Dentist');
  assert.equal(card('b').querySelector('.cloudcanvas-ui-kanban-detail').hidden, true);
  assert.equal(card('c').getAttribute('data-tone'), 'warning');
  assert.deepEqual([...host.querySelectorAll('.cloudcanvas-ui-kanban-card')].map((node) => node.getAttribute('tabindex')), ['0', '-1', '-1']);
  assert.throws(() => kanban.update({ columns: [{ id: 'x', cards: [{ id: 'a' }] }, { id: 'y', cards: [{ id: 'a' }] }] }), /duplicate card id/);
  assert.equal(MODEL.columns[2].cards.length, 0, 'the caller\'s model is never written');
});

test('click and Enter open a card; arrows rove within and across columns', (t) => {
  const opened = [];
  const { card } = board(t, { onActivate: (id) => opened.push(id) });
  card('a').click();
  assert.deepEqual(opened, ['a']);
  card('a').focus();
  key(card('a'), 'ArrowDown');
  assertSame(document.activeElement, card('b'));
  key(card('b'), 'ArrowRight');
  assertSame(document.activeElement, card('c'), 'the row index clamps to the next column');
  key(card('c'), 'ArrowRight');
  assertSame(document.activeElement, card('c'), 'an empty column is skipped, nothing past it');
  key(card('c'), 'ArrowLeft');
  key(document.activeElement, 'End');
  assertSame(document.activeElement, card('b'));
});

test('keyboard move: Space picks up, arrows move, Space drops through onMove; the board stays controlled', (t) => {
  const { card, moves, host } = board(t);
  card('a').focus();
  const pick = key(card('a'), ' ');
  assert.equal(pick.defaultPrevented, true);
  assert.equal(key(card('a'), ' ', { type: 'keyup' }).defaultPrevented, true, 'no keyup click after a pick-up');
  assert.ok(card('a').parentElement.classList.contains('is-grabbed'));
  key(document.activeElement, 'ArrowRight');
  key(document.activeElement, 'ArrowDown');
  assert.equal(card('a').closest('.cloudcanvas-ui-kanban-column').getAttribute('data-column-id'), 'doing', 'previewed in place');
  key(document.activeElement, ' ');
  assert.deepEqual(moves, [['a', 'doing', 1]]);
  assert.equal(card('a').closest('.cloudcanvas-ui-kanban-column').getAttribute('data-column-id'), 'todo', 'without an update it stays put');
  assertSame(document.activeElement, card('a'));
  assert.match(host.querySelector('.cloudcanvas-live-region').textContent, /Dropped Call/);
});

test('keyboard move: Escape puts it back; a refusal is announced and nothing is reported', (t) => {
  const { card, moves, host } = board(t, { canMove: (id, from, to) => to !== 'done' || 'Finish it first' });
  card('c').focus();
  key(card('c'), ' ');
  key(document.activeElement, 'ArrowLeft');
  key(document.activeElement, 'Escape');
  assert.equal(card('c').closest('.cloudcanvas-ui-kanban-column').getAttribute('data-column-id'), 'doing');
  assert.match(host.querySelector('.cloudcanvas-live-region').textContent, /cancelled/);
  key(card('c'), ' ');
  key(document.activeElement, 'ArrowRight');
  assert.match(host.querySelector('.cloudcanvas-live-region').textContent, /Finish it first/);
  assert.ok(host.querySelector('[data-column-id="done"]').classList.contains('is-refused'));
  key(document.activeElement, 'Enter');
  assert.deepEqual(moves, []);
  assert.match(host.querySelector('.cloudcanvas-live-region').textContent, /Finish it first/);
});

test('pointer drag: past the threshold, a drop over another column reports the index there', (t) => {
  const { card, moves, host, kanban } = board(t);
  const done = host.querySelector('[data-column-id="done"]');
  const doing = host.querySelector('[data-column-id="doing"]');
  stubBox(card('c'), { left: 300, top: 50, width: 200, height: 40 });
  stubBox(host.querySelector('.cloudcanvas-ui-kanban-lane'), { left: 0, top: 0, width: 900, height: 400 });
  stubHitTest(t, (x) => (x > 600 ? done : doing));
  const lane = host.querySelector('.cloudcanvas-ui-kanban-lane');
  pointer(card('a'), 'pointerdown', { clientX: 10, clientY: 10 });
  pointer(lane, 'pointermove', { clientX: 12, clientY: 11 });
  assert.ok(!card('a').parentElement.classList.contains('is-dragging'), 'under the threshold it is still a click');
  pointer(lane, 'pointermove', { clientX: 350, clientY: 20 });
  assert.ok(card('a').parentElement.classList.contains('is-dragging'));
  assert.ok(doing.classList.contains('is-drop-target'));
  pointer(lane, 'pointerup', { clientX: 350, clientY: 20 });
  assert.deepEqual(moves, [['a', 'doing', 0]], 'above the middle of Write: index 0');
  pointer(card('b'), 'pointerdown', { clientX: 10, clientY: 10 });
  pointer(lane, 'pointermove', { clientX: 700, clientY: 20 });
  pointer(lane, 'pointerup', { clientX: 700, clientY: 20 });
  assert.deepEqual(moves[1], ['b', 'done', 0]);
  pointer(card('b'), 'pointerdown', { clientX: 10, clientY: 10 });
  pointer(lane, 'pointermove', { clientX: 700, clientY: 20 });
  key(document, 'Escape');
  pointer(lane, 'pointerup', { clientX: 700, clientY: 20 });
  assert.equal(moves.length, 2, 'Escape cancels the drag');
  kanban.destroy();
  assertSame(host.querySelector('.cloudcanvas-ui-kanban'), null);
});
