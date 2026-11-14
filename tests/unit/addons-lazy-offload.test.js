/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * lazy (children on demand: single-flight, run-once, failure re-arms, removal
 * drops late specs) and offload (top-level blits parked out of range and back,
 * camera-gated, state kept, cleanly released; under a tilt, range is what the
 * host shows through the camera, up to the horizon). The re-mount case ported from
 * `offload.test.js`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { runFrame } from 'cloudcanvas/testing';
import { stateOf } from 'cloudcanvas/kernel';
import { CHILDREN_ERROR_EVENT, isLoaded, lazyChildren, load, unload } from '../../plugins/lazy.js';
import {
  DEFAULT_OFFLOAD_MARGIN, HORIZON_REACH, isOffloaded, isOutside, offload, visibleRect
} from '../../plugins/offload.js';
import { Camera } from 'cloudcanvas/kernel';
import { history, go } from '../../plugins/history.js';
import { coreScene, signals } from '../helpers/core-scene.js';
import { setElementSize } from '../helpers/dom.js';

let calls = 0;
let answer = () => [{ id: 'kid', x: 5 }];
blit.use({ lazy: lazyChildren((b) => { calls += 1; return answer(b); }), offload, history });

function scene(t) {
  calls = 0;
  answer = () => [{ id: 'kid', x: 5 }];
  const s = coreScene(t);
  setElementSize(s.host, 1000, 800);
  s.root.hostRect = s.host.getBoundingClientRect();
  return s;
}

test('lazy - one provider call for concurrent loads; loaded children come back after', async (t) => {
  const { app } = scene(t);
  const folder = app.blit({ id: 'folder', lazy: true });
  const seen = signals(folder, 'children:load');
  const [first, second] = await Promise.all([load(folder), load(folder)]);
  assert.equal(calls, 1);
  assert.equal(first, second);
  assert.deepEqual(folder.blits.map((b) => b.el.id), ['kid']);
  assert.equal(app.find('kid').x, 5);
  assert.equal(seen.length, 1);
  assert.equal(isLoaded(folder), true);
  assert.deepEqual(await load(folder), folder.blits);
  assert.equal(calls, 1, 'a loaded blit never re-runs its provider');

  unload(folder);
  assert.deepEqual(folder.blits, []);
  await load(folder);
  assert.equal(calls, 2, 'unload re-arms it');
});

test('lazy - promotion to the view root triggers the load', async (t) => {
  const { app } = scene(t);
  app.set({ history: true });
  const folder = app.blit({ id: 'folder', lazy: true });
  go(app, folder);
  await load(folder);
  assert.equal(calls, 1);
});

test('lazy - a rejection emits children:error and re-arms; a removed blit drops late specs', async (t) => {
  const { app } = scene(t);
  const folder = app.blit({ id: 'folder', lazy: true });
  const errors = signals(folder, CHILDREN_ERROR_EVENT);
  answer = () => Promise.reject(new Error('offline'));
  assert.deepEqual(await load(folder), []);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].payload.error.message, 'offline');
  assert.equal(isLoaded(folder), false);

  answer = () => [{ id: 'late' }];
  const flight = load(folder);
  folder.remove();
  assert.deepEqual(await flight, []);
  assert.equal(app.find('late'), null);
});

test('offload - geometry: the visible rect through the camera, and outside means wholly clear of the margin', () => {
  assert.deepEqual(visibleRect({ x: -100, y: 50, scale: 2 }, { width: 1000, height: 800 }), { minX: 50, minY: -25, maxX: 550, maxY: 375 });
  const rect = { minX: 0, minY: 0, maxX: 1000, maxY: 800 };
  assert.equal(isOutside({ x: 1100, y: 0, w: 50, h: 50 }, rect, 100), false, 'touching the grown edge keeps it');
  assert.equal(isOutside({ x: 1101, y: 0, w: 50, h: 50 }, rect, 100), true);
  assert.equal(DEFAULT_OFFLOAD_MARGIN, 400);
});

test('offload - geometry under a tilt: the box around the unprojected host corners; a horizon on screen opens that way', () => {
  const host = { width: 1000, height: 700 };
  const tilted = new Camera({ perspective: 1200, rotateX: 60 });
  const rect = visibleRect(tilted, host);
  const corners = [[0, 0], [1000, 0], [1000, 700], [0, 700]].map(([x, y]) => tilted.unproject(x, y, host));
  const near = (a, b) => Math.abs(a - b) < 1e-6;
  assert.ok(near(rect.minY, Math.min(...corners.map((c) => c.y))) && near(rect.maxX, Math.max(...corners.map((c) => c.x))));
  assert.equal(isOutside({ x: 400, y: -500, w: 200, h: 100 }, rect, 0), false, 'a box drawn on screen is out of range');

  // Horizon at host y = 350 - 800 / tan 75° ≈ 136: the far side reaches HORIZON_REACH host lengths, the near side not.
  const steep = new Camera({ perspective: 800, rotateX: 75 });
  const centre = steep.unproject(500, 350, host);
  const open = visibleRect(steep, host);
  assert.ok(near(open.minY, centre.y - HORIZON_REACH * 1000), `the far side stops at ${open.minY}`);
  assert.ok(near(open.minX, centre.x - HORIZON_REACH * 1000) && near(open.maxX, centre.x + HORIZON_REACH * 1000));
  assert.ok(near(open.maxY, steep.unproject(0, 700, host).y), 'the near side is the bottom edge');
  assert.equal(isOutside({ x: 400, y: -20000, w: 200, h: 100 }, open, 0), false);

  const edgeOn = visibleRect(new Camera({ perspective: 800, rotateX: 90 }), host);
  assert.equal(isOutside({ x: 400, y: 300, w: 10, h: 10 }, edgeOn, 400), true, 'an edge-on board shows nothing');
});

test('offload - a tilted camera returns a parked blit it shows, and parks one it does not', (t) => {
  const { app, root } = scene(t);
  const shown = app.blit({ id: 'shown', x: 400, y: -500, w: 200, h: 100, offload: { margin: 0 } });
  const behind = app.blit({ id: 'behind', x: 400, y: 3000, w: 200, h: 100, offload: { margin: 0 } });
  runFrame(root, 1);
  assert.deepEqual([shown.el.isConnected, behind.el.isConnected], [false, false]);

  Object.assign(root.camera, { perspective: 1200, rotateX: 60 });
  runFrame(root, 1);
  assert.equal(shown.el.isConnected, true, 'a blit on screen through the tilt stayed parked');
  assert.equal(behind.el.isConnected, false, 'a blit below the view came back');
});

test('offload - a far blit is parked with its state, and returns when the camera brings it back', (t) => {
  const { app, root } = scene(t);
  const far = app.blit({ id: 'far', x: 3000, y: 0, w: 100, h: 100, offload: true });
  const near = app.blit({ id: 'near', x: 10, y: 10, w: 100, h: 100, offload: { margin: 0 } });
  const child = far.blit({ id: 'inside', x: 4 });
  runFrame(root, 1);
  assert.equal(isOffloaded(far), true);
  assert.equal(far.el.isConnected, false);
  assert.equal(isOffloaded(near), false);
  assert.equal(app.find('inside'), child, 'a parked subtree is still indexed');
  assert.equal(child.parent, far);

  root.camera.panTo(-2600, 0);
  runFrame(root, 1);
  assert.equal(far.el.isConnected, true);
  assert.equal(isOffloaded(far), false);
  assert.equal(far.x, 3000);
  assert.equal(near.el.isConnected, false, 'margin 0: parked the moment it clears the edge');
});

test('offload - a still camera sweeps nothing; a nested blit is never a member', (t) => {
  const { app, root } = scene(t);
  const far = app.blit({ id: 'far', x: 3000, w: 10, h: 10, offload: true });
  runFrame(root, 1);
  assert.equal(far.el.isConnected, false);
  far.set({ x: 20 });
  runFrame(root, 1);
  assert.equal(far.el.isConnected, false, 'no camera move, no sweep');

  const parent = app.blit({ id: 'p', w: 10, h: 10 });
  const nested = parent.blit({ id: 'n', x: 9000, offload: true });
  runFrame(root, 1);
  assert.equal(nested.el.isConnected, true);
});

test('offload - turning it off, or removing the blit, releases a parked one cleanly', (t) => {
  const { app, root } = scene(t);
  const far = app.blit({ id: 'far', x: 3000, w: 10, h: 10, offload: true });
  runFrame(root, 1);
  far.set({ offload: false });
  assert.equal(far.el.isConnected, true);
  assert.equal(stateOf(far.el).anchor, null);

  far.set({ offload: true });
  runFrame(root, 1);
  assert.equal(far.el.isConnected, false);
  far.remove();
  assert.equal(far.el.isConnected, false);
  assert.equal(app.find('far'), null);
  assert.equal(root.host.innerHTML.includes('<!--'), false, 'no anchor left behind');
});

test('offload - a blit moved while parked returns where it was moved to, and is re-measured', (t) => {
  const { app, root } = scene(t);
  const far = app.blit({ id: 'far', x: 3000, y: 0, w: 100, h: 100, offload: true });
  runFrame(root, 1);
  assert.equal(far.el.isConnected, false);
  far.set({ x: 3100 });
  runFrame(root, 1);

  let reads = 0;
  Object.defineProperty(far.el, 'offsetWidth', { configurable: true, get: () => { reads += 1; return 100; } });
  root.camera.panTo(-2700, 0);
  runFrame(root, 1);
  assert.equal(far.el.isConnected, true);
  assert.match(far.el.style.transform, /translate3d\(3100\.00px/, 'the move made while parked was lost');
  assert.ok(reads > 0, 'a returned blit was not re-measured');
});
