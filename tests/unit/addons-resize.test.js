/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The resize add-on on core blits, no bridge: eight control handles that show
 * with the selection, a native press on one resizing the box (clamped, far
 * edge held), the signals, drag standing down on a handle, and no residue. The
 * handle, arithmetic, clamp and signal cases ported from `resize.test.js`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { runFrame } from 'cloudcanvas/testing';
import { drag } from '../../plugins/drag.js';
import {
  MIN_RESIZE,
  RESIZE_DIRECTIONS,
  RESIZE_HANDLE_ATTR,
  RESIZE_HANDLE_CLASS,
  resize
} from '../../plugins/resize.js';
import { select, setSelected } from '../../plugins/select.js';
import { coreScene, move, press, release, signals } from '../helpers/core-scene.js';

blit.use({ drag, resize, select });

const handleOf = (b, direction) => b.el.querySelector(`[${RESIZE_HANDLE_ATTR}="${direction}"]`);

test('resize - eight control handles, hidden until the blit is selected', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ w: 200, h: 100, select: true, resize: true });
  const handles = card.el.querySelectorAll(`.${RESIZE_HANDLE_CLASS}`);

  assert.equal(handles.length, RESIZE_DIRECTIONS.length);
  for (const handle of handles) {
    assert.equal(handle.getAttribute('data-cc-control'), 'resize');
    assert.equal(handle.getAttribute('aria-hidden'), 'true');
    assert.equal(handle.hidden, true);
  }
  setSelected(card, true);
  assert.equal(handleOf(card, 'se').hidden, false, 'the handles did not follow the select signal');
});

test('resize - a press on the south-east handle grows the box; drag stands down', (t) => {
  const { app, root } = coreScene(t);
  const card = app.blit({ x: 100, y: 100, w: 200, h: 100, drag: true, resize: { alwaysVisibleHandles: true } });
  const starts = signals(card, 'resize:start');
  const ends = signals(card, 'resize:end');

  press(handleOf(card, 'se'), 300, 200);
  assert.ok(card.el.classList.contains('is-resizing'));
  move(350, 230);
  assert.deepEqual([card.x, card.y], [100, 100], 'the drag moved the box too');
  assert.deepEqual(starts, [{ type: 'resize:start', payload: { width: 200, height: 100, direction: 'se' } }]);

  release(350, 230);
  runFrame(root, 1);
  assert.equal(card.el.style.width, '250px');
  assert.equal(card.el.style.height, '130px');
  assert.deepEqual(ends, [{ type: 'resize:end', payload: { width: 250, height: 130, cancelled: false } }]);
  assert.equal(card.el.classList.contains('is-resizing'), false);
});

test('resize - a near edge moves the origin and holds the far edge, clamped at the floor', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ x: 100, y: 100, w: 200, h: 100, resize: { alwaysVisibleHandles: true, minWidth: 80 } });

  press(handleOf(card, 'w'), 100, 150);
  move(400, 150);
  release(400, 150);
  assert.equal(card.x, 220, 'the far edge moved');
  assert.equal(card.size.w, 80);
});

test('resize - directions limit the handles, and a typo throws', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ resize: { directions: ['e', 's'] } });
  assert.equal(card.el.querySelectorAll(`.${RESIZE_HANDLE_CLASS}`).length, 2);
  assert.throws(() => app.blit({ resize: { directions: ['up'] } }), /unknown resize direction "up"/);
});

test('resize - stopping the trait takes every handle away', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ resize: true });
  card.set({ resize: false });
  assert.equal(card.el.querySelectorAll(`.${RESIZE_HANDLE_CLASS}`).length, 0);
});

const handlesOf = (b) => Array.from(b.el.querySelectorAll(`.${RESIZE_HANDLE_CLASS}`));

/** A 200x100 blit at (300, 150) with `resize: options` and its handles always shown. */
function sizable(t, options = {}) {
  const scene = coreScene(t);
  const card = scene.app.blit({ x: 300, y: 150, w: 200, h: 100, resize: { alwaysVisibleHandles: true, ...options } });
  return { ...scene, card };
}

/** One whole gesture on a handle; the first move a 1px wobble the threshold must absorb. */
function dragHandle(handle, from, to) {
  press(handle, from[0], from[1]);
  move(from[0] + 1, from[1]);
  move(to[0], to[1]);
  release(to[0], to[1]);
}

const box = (b) => [b.x, b.y, b.size.w, b.size.h];

test('resize - one handle per direction, direct children of the blit; duplicates collapse, an empty or non-array list throws', (t) => {
  const { app, card } = sizable(t);
  assert.deepEqual(handlesOf(card).map((handle) => handle.getAttribute(RESIZE_HANDLE_ATTR)).sort(), [...RESIZE_DIRECTIONS].sort());
  assert.ok(handlesOf(card).every((handle) => handle.parentElement === card.el));
  const narrow = app.blit({ resize: { directions: ['se', 'se', 'e'] } });
  assert.deepEqual(handlesOf(narrow).map((handle) => handle.getAttribute(RESIZE_HANDLE_ATTR)), ['se', 'e']);
  assert.throws(() => app.blit({ resize: { directions: [] } }), /cannot be empty/);
  assert.throws(() => app.blit({ resize: { directions: 'se' } }), TypeError);
});

test('resize - handles follow the selection both ways; a selected blit shows them at once; alwaysVisibleHandles ignores it', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ select: true, resize: true });
  const hidden = () => handlesOf(card).map((handle) => handle.hidden);
  setSelected(card, true);
  assert.deepEqual(hidden(), Array(8).fill(false));
  setSelected(card, false);
  assert.deepEqual(hidden(), Array(8).fill(true));

  const late = app.blit({ select: true });
  setSelected(late, true);
  late.set({ resize: { directions: ['se'] } });
  assert.equal(handleOf(late, 'se').hidden, false, 'the handle ignored the selection it arrived into');

  const always = app.blit({ select: true, resize: { alwaysVisibleHandles: true } });
  setSelected(always, true);
  setSelected(always, false);
  assert.ok(handlesOf(always).every((handle) => !handle.hidden));
});

test('resize - an edge drag changes one dimension; a near corner moves the origin and holds the far corner', (t) => {
  const { card } = sizable(t);
  dragHandle(handleOf(card, 'e'), [500, 200], [575, 340]);
  assert.deepEqual(box(card), [300, 150, 275, 100]);

  card.set({ w: 200, h: 100 });
  dragHandle(handleOf(card, 'nw'), [300, 150], [260, 110]);
  assert.deepEqual(box(card), [260, 110, 240, 140]);
  assert.deepEqual([card.x + card.size.w, card.y + card.size.h], [500, 250], 'the far corner moved');
});

test('resize - the delta is in canvas units, so a zoomed camera resizes correctly', (t) => {
  const { card, root } = sizable(t);
  root.camera.setZoom(2);
  dragHandle(handleOf(card, 'se'), [500, 250], [620, 250]);
  assert.deepEqual(box(card).slice(2), [260, 100], 'the resize was computed in screen pixels');
});

test('resize - clamping holds exactly at the ceiling and the floor, in both axes', (t) => {
  const { card } = sizable(t, { minWidth: 80, minHeight: 60, maxWidth: 300, maxHeight: 150 });
  dragHandle(handleOf(card, 'se'), [500, 250], [1400, 1400]);
  assert.deepEqual(box(card).slice(2), [300, 150]);
  dragHandle(handleOf(card, 'se'), [600, 300], [100, 100]);
  assert.deepEqual(box(card).slice(2), [80, 60]);
});

test('resize - the default floor is MIN_RESIZE, and a max below the floor is lifted to it', (t) => {
  const { card } = sizable(t, { maxWidth: 10 });
  dragHandle(handleOf(card, 'se'), [500, 250], [100, 100]);
  assert.deepEqual(box(card).slice(2), [MIN_RESIZE.width, MIN_RESIZE.height]);
  dragHandle(handleOf(card, 'se'), [500, 250], [900, 900]);
  assert.equal(card.size.w, MIN_RESIZE.width, 'a max below the min was taken at face value');
  assert.equal(card.size.h, MIN_RESIZE.height + 650, 'the height has no ceiling by default');
});

test('resize - start fires once past the threshold with the box it leaves; a click on a handle announces nothing', (t) => {
  const { card } = sizable(t);
  const starts = signals(card, 'resize:start');
  const ends = signals(card, 'resize:end');

  press(handleOf(card, 'se'), 500, 250);
  move(501, 251);
  move(502, 252);
  release(502, 252);
  assert.deepEqual([starts, ends, box(card)], [[], [], [300, 150, 200, 100]], 'a click on a handle resized');

  press(handleOf(card, 'se'), 500, 250);
  move(540, 280);
  move(560, 300);
  release(560, 300);
  assert.deepEqual(starts.map((each) => each.payload), [{ width: 200, height: 100, direction: 'se' }]);
  assert.deepEqual(ends.map((each) => each.payload), [{ width: 260, height: 150, cancelled: false }]);
});

test('resize - stopping the trait mid-gesture ends it cancelled; set again, it rebuilds a working gesture', (t) => {
  const { card } = sizable(t);
  const ends = signals(card, 'resize:end');
  press(handleOf(card, 'se'), 500, 250);
  move(560, 290);
  card.set({ resize: false });
  assert.deepEqual(ends.map((each) => each.payload), [{ width: 260, height: 140, cancelled: true }]);
  assert.equal(card.el.classList.contains('is-resizing'), false);
  assert.deepEqual(handlesOf(card), []);

  card.set({ resize: { directions: ['se'], alwaysVisibleHandles: true } });
  dragHandle(handleOf(card, 'se'), [500, 250], [530, 250]);
  assert.equal(card.size.w, 290);
});

test('resize - a nested blit\'s handle resizes that blit, never the parent it sits in', (t) => {
  const { card } = sizable(t);
  const child = card.blit({ x: 10, y: 10, w: 80, h: 40, resize: { directions: ['se'], alwaysVisibleHandles: true } });
  dragHandle(handleOf(child, 'se'), [400, 220], [450, 250]);
  assert.deepEqual(box(child).slice(2), [130, 70]);
  assert.deepEqual(box(card).slice(2), [200, 100], 'the parent resized from its child\'s handle');
});
