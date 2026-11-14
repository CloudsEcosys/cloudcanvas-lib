/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * `snapToGrid` on a resize: a finished resize snaps the whole box as well as a
 * finished drag snapping the position, and both are governed by one `enabled`
 * option.
 *
 * Driven the two ways the trait can be reached - the `resize:end` / `drag:end`
 * signals it actually listens for (as `lib-components-comms.test.js` drives the
 * drag), and end to end through a real press on the resize add-on's corner
 * handle, so the claim is the whole gesture and not just the handler. What a
 * rendered box actually measures back to is happy-dom's blind spot and stays a
 * browser concern.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { runFrame } from 'cloudcanvas/testing';
import { RESIZE_HANDLE_ATTR, resize } from '../../plugins/resize.js';
import { snapBox, snapToGrid } from '../../components/index.js';
import { coreScene, move, press, release } from '../helpers/core-scene.js';

blit.use({ resize, snapToGrid });

/** A declared card at (47, 95), 130x100, snapping to the given grid. */
function snapCard(app, id, options = {}) {
  return app.blit({ id, x: 47, y: 95, w: 130, h: 100, snapToGrid: { gridSize: 20, ...options } });
}

const box = (b) => ({ x: b.x, y: b.y, width: b.size.w, height: b.size.h });

/* ================== SIGNAL-DRIVEN ================== */

test('snapBox - a finished resize rounds the whole box to the grid', (t) => {
  const { app } = coreScene(t);
  const card = snapCard(app, 'snap_resize');

  card.emit('resize:end', { width: 130, height: 100, cancelled: false });
  // 130 -> 140 and 100 -> 100 (size), 47 -> 40 and 95 -> 100 (origin), all on 20.
  assert.deepEqual(box(card), { x: 40, y: 100, width: 140, height: 100 });
});

test('snapBox - the box the resize came to rest at wins over a stale size', (t) => {
  const { app } = coreScene(t);
  const card = snapCard(app, 'snap_rest');

  // The payload is the box the gesture applied; the blit's size in force can be a frame behind.
  card.emit('resize:end', { width: 171, height: 49, cancelled: false });
  assert.deepEqual(box(card), { x: 40, y: 100, width: 180, height: 40 });
  assert.deepEqual(snapBox(card, 20), { x: 40, y: 100, width: 180, height: 40 });
});

test('snapBox - never rounds a box away to nothing', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ id: 'snap_floor', x: 0, y: 0, w: 8, h: 6, snapToGrid: { gridSize: 20 } });

  card.emit('resize:end', { width: 8, height: 6, cancelled: false });
  // 8 and 6 both round to 0 on a 20 grid; the floor holds them at one cell.
  assert.equal(card.size.w, 20);
  assert.equal(card.size.h, 20);
});

test('snapBox - a cancelled resize is left exactly where it was', (t) => {
  const { app } = coreScene(t);
  const card = snapCard(app, 'snap_resize_cancel');

  card.emit('resize:end', { width: 130, height: 100, cancelled: true });
  assert.deepEqual(box(card), { x: 47, y: 95, width: 130, height: 100 });
});

/* ================== THE TOGGLE ================== */

test('enabled - off leaves both a resize and a drag free-form; rewriting the key turns it on', (t) => {
  const { app } = coreScene(t);
  const card = snapCard(app, 'snap_off', { enabled: false });
  assert.deepEqual(card.spec.snapToGrid, { gridSize: 20, enabled: false });

  card.emit('resize:end', { width: 130, height: 100, cancelled: false });
  card.emit('drag:end', { x: 47, y: 95, cancelled: false });
  assert.deepEqual(box(card), { x: 47, y: 95, width: 130, height: 100 }, 'a disabled trait snapped');

  card.set({ snapToGrid: { gridSize: 20, enabled: true } });
  card.emit('drag:end', { x: 47, y: 95, cancelled: false });
  assert.deepEqual([card.x, card.y], [40, 100]);
});

test('enabled - defaults on, at a 24px grid when none is given', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ id: 'snap_default', x: 47, y: 95, snapToGrid: true });

  card.emit('drag:end', { x: 47, y: 95, cancelled: false });
  assert.deepEqual([card.x, card.y], [48, 96]);
});

/* ================== GESTURE-DRIVEN ================== */

test('snapBox - a real corner drag through the resize add-on lands on the grid', (t) => {
  const { app, root } = coreScene(t);
  const card = app.blit({ id: 'snap_gesture', x: 40, y: 40, w: 100, h: 100, resize: { alwaysVisibleHandles: true }, snapToGrid: { gridSize: 20 } });
  runFrame(root, 1);
  const handle = card.el.querySelector(`[${RESIZE_HANDLE_ATTR}="se"]`);

  // Grow the SE corner by 33x27: an off-grid box the snap must pull back onto 20.
  press(handle, 140, 140);
  move(141, 140);
  move(173, 167);
  release(173, 167);
  runFrame(root, 1);

  // 133 -> 140, 127 -> 120; origin already on the grid.
  assert.deepEqual(box(card), { x: 40, y: 40, width: 140, height: 120 });
  assert.equal(card.el.style.width, '140px');
  assert.equal(card.el.style.height, '120px');
});
