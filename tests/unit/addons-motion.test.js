/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The motion add-on: eased moves over the core camera (log-space zoom, the
 * easing table, exact landing), the animated fit and its box shapes and
 * clamps, the projection, the reduced-motion rule and its live query, and
 * `motion(b)` turning a root's snapping `view()` into a flight the frame loop
 * carries to the end. The camera maths ported from `viewport.test.js` (ledger:
 * tests/fixtures/test-ledger.json).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_EASING, EASINGS, MotionCamera, motion, prefersReducedMotion, _resetReducedMotionForTests
} from '../../plugins/motion.js';
import { Camera } from 'cloudcanvas/kernel';
import { blit } from 'cloudcanvas';
import { stateOf } from 'cloudcanvas/kernel';
import { formatTransform3D } from 'cloudcanvas/kernel';
import { resetDocument } from '../helpers/dom.js';

const HOST = { width: 800, height: 600 };
const BOX = { x: 0, y: 0, width: 100, height: 100 };

test('MotionCamera - eases in log space, lands exactly, and a direct move cancels', () => {
  const camera = new MotionCamera();
  let done = 0;
  camera.animateTo(100, 0, 4, { duration: 100, easing: 'linear', onComplete: () => { done += 1; } });

  camera.update(50);
  assert.equal(camera.x, 50);
  assert.equal(camera.scale, 2, 'halfway from 1 to 4 is 2, not 2.5');
  camera.update(50);
  assert.deepEqual([camera.x, camera.scale, camera.isAnimating, done], [100, 4, false, 1]);

  camera.animateTo(0, 0, 1, { easing: 'no-such-curve' });
  assert.equal(camera.isAnimating, true, 'an unknown easing falls back rather than throwing');
  camera.panBy(1, 1);
  assert.equal(camera.isAnimating, false, 'a direct move cancels the eased one');
});

test('MotionCamera - fit flies unless immediate; the projection round-trips', () => {
  const camera = new MotionCamera();
  const target = camera.fit(BOX, HOST, { duration: 100 });
  assert.deepEqual(target, new Camera().fitTarget(BOX, HOST));
  assert.equal(camera.scale, 1, 'nothing moved yet');
  camera.update(100);
  assert.deepEqual({ x: camera.x, y: camera.y, scale: camera.scale }, target);

  camera.animateTo(0, 0, 1);
  assert.deepEqual(camera.fit(BOX, HOST, { immediate: true }), target);
  assert.equal(camera.isAnimating, false);
  assert.equal(camera.x, target.x);

  const offset = { left: 5, top: 7 };
  const screen = camera.canvasToScreen(10, 20, offset);
  assert.deepEqual(screen, { x: 10 * target.scale + target.x + 5, y: 20 * target.scale + target.y + 7 });
  assert.deepEqual(camera.screenToCanvas(screen.x, screen.y, offset), { x: 10, y: 20 });
});

test('prefersReducedMotion - a reduce preference turns every eased move into a jump', (t) => {
  const original = globalThis.matchMedia;
  globalThis.matchMedia = () => ({ matches: true });
  _resetReducedMotionForTests();
  t.after(() => { globalThis.matchMedia = original; _resetReducedMotionForTests(); });

  assert.equal(prefersReducedMotion(), true);
  const camera = new MotionCamera();
  camera.fit(BOX, HOST);
  assert.equal(camera.isAnimating, false);
  assert.deepEqual({ x: camera.x, y: camera.y, scale: camera.scale }, camera.fitTarget(BOX, HOST));
});

test('motion - a root\'s view() flies, frame by frame, and the loop idles once it lands', (t) => {
  const requests = [];
  const realRaf = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = (fn) => { requests.push(fn); return requests.length; };
  t.after(() => { globalThis.requestAnimationFrame = realRaf; resetDocument(); });

  const host = document.createElement('div');
  document.body.appendChild(host);
  const app = blit(host);
  const card = app.blit({ x: 100, y: 100, w: 200, h: 100 });
  const root = stateOf(host).root;
  root.camera.panTo(5, 5);

  const camera = motion(card);
  assert.equal(root.camera, camera);
  assert.deepEqual([camera.x, camera.y, camera.scale], [5, 5, 1], 'the view carried over');
  assert.equal(motion(app), camera, 'a root keeps the camera it has');
  assert.throws(() => motion(blit(document.createElement('div'))), /potential blit has no root/);

  const target = app.view(card, { duration: 100, easing: 'linear' });
  assert.equal(camera.isAnimating, true);
  assert.equal(camera.x, 5);

  let frames = 0;
  while (requests.length > 0 && frames < 100) {
    frames += 1;
    requests.shift()(frames * 16);
  }
  assert.ok(frames > 3 && frames < 100, `the flight took ${frames} frames`);
  assert.deepEqual({ x: camera.x, y: camera.y, scale: camera.scale }, target);
  assert.equal(root.plane.style.transform, formatTransform3D(target.x, target.y, 0, target.scale));
  assert.equal(root.rafId, null, 'a landed camera asks for no frame');
});

/* ------------------ THE CAMERA MATHS ------------------ */

/**
 * happy-dom has no media engine, so reduced motion is driven by swapping
 * `globalThis.matchMedia` and clearing the module's cache. Every stub restores.
 */
function stubMatchMedia(t, matches) {
  const original = globalThis.matchMedia;
  const listeners = [];
  const query = {
    media: '(prefers-reduced-motion: reduce)',
    matches,
    addEventListener: (type, fn) => { if (type === 'change') listeners.push(fn); },
    removeEventListener: (type, fn) => {
      const index = listeners.indexOf(fn);
      if (type === 'change' && index !== -1) listeners.splice(index, 1);
    }
  };
  globalThis.matchMedia = () => query;
  _resetReducedMotionForTests();
  const restore = () => { globalThis.matchMedia = original; _resetReducedMotionForTests(); };
  t.after(restore);
  return {
    emit(next) {
      query.matches = next;
      for (const fn of listeners.slice()) fn({ matches: next });
    },
    get listenerCount() { return listeners.length; },
    restore
  };
}

/** Step `update()` until the move lands, guarding against a runaway. */
function land(camera, dtMs = 16, maxFrames = 1000) {
  let frames = 0;
  for (; camera.isAnimating && frames < maxFrames; frames += 1) camera.update(dtMs);
  assert.ok(frames < maxFrames, 'the move never landed');
  return frames;
}

const at = (camera) => ({ x: camera.x, y: camera.y, scale: camera.scale });

test('motion - a camera starts where it is told and pans by and to', () => {
  const camera = new MotionCamera({ x: 10, y: 20, scale: 1 });
  assert.deepEqual(at(camera), { x: 10, y: 20, scale: 1 });
  assert.ok(camera instanceof Camera);
  camera.panBy(50, -30);
  assert.deepEqual([camera.x, camera.y], [60, -10]);
  camera.panTo(0, 0);
  assert.deepEqual([camera.x, camera.y], [0, 0]);
});

test('motion - setZoom clamps to the camera\'s limits; zoomAt keeps its focal point', () => {
  const camera = new MotionCamera({ minScale: 0.5, maxScale: 3 });
  camera.setZoom(10);
  assert.equal(camera.scale, 3);
  camera.setZoom(0.1);
  assert.equal(camera.scale, 0.5);

  const focal = new MotionCamera();
  focal.zoomAt(2, 100, 100);
  assert.deepEqual(at(focal), { x: -100, y: -100, scale: 2 });

  // Tilted, the host box reaches the core's zoom: the canvas point under the focal point stays under it.
  const host = { width: 1000, height: 700 };
  const tilted = new MotionCamera({ perspective: 900, rotateX: 40 });
  const grabbed = tilted.unproject(700, 200, host);
  tilted.zoomAt(2, 700, 200, host);
  const under = tilted.project(grabbed.x, grabbed.y, host);
  assert.ok(Math.abs(under.x - 700) < 1e-6 && Math.abs(under.y - 200) < 1e-6, `drifted to (${under.x}, ${under.y})`);
});

test('motion - screenToCanvas and canvasToScreen honour the host offset', () => {
  const camera = new MotionCamera({ x: 50, y: 100, scale: 2 });
  const hostRect = { left: 10, top: 20 };
  // (110 - 10 - 50) / 2 = 25; (180 - 20 - 100) / 2 = 30.
  assert.deepEqual(camera.screenToCanvas(110, 180, hostRect), { x: 25, y: 30 });
  assert.deepEqual(camera.canvasToScreen(25, 30, hostRect), { x: 110, y: 180 });
});

test('motion - zoom interpolates in log space both ways, panning stays linear', () => {
  const camera = new MotionCamera();
  camera.animateTo(100, 200, 4, { duration: 400, easing: 'linear' });
  camera.update(200);
  assert.deepEqual(at(camera), { x: 50, y: 100, scale: 2 }, 'the midpoint of 1 -> 4 is 2, not the linear 2.5');
  camera.update(100);
  assert.ok(Math.abs(camera.scale - Math.pow(4, 0.75)) < 1e-12);

  const out = new MotionCamera({ scale: 4 });
  out.animateTo(0, 0, 1, { duration: 400, easing: 'linear' });
  out.update(200);
  assert.equal(out.scale, 2);
});

test('motion - an equal start and target scale, or a non-positive one, stays finite and stable', () => {
  const camera = new MotionCamera({ scale: 1.5 });
  camera.animateTo(80, 0, 1.5, { duration: 400, easing: 'linear' });
  camera.update(200);
  assert.equal(camera.scale, 1.5, 'a no-op zoom drifted');
  assert.equal(camera.x, 40);

  // The clamps never produce a negative scale, but the constructor accepts one: no NaN from the logarithm.
  const degenerate = new MotionCamera({ scale: -2 });
  degenerate.animateTo(0, 0, 2, { duration: 400, easing: 'linear' });
  degenerate.update(200);
  assert.equal(degenerate.scale, 0, 'a non-positive scale falls back to linear');
});

test('motion - the last frame lands exactly on the target and completes once', () => {
  const camera = new MotionCamera({ x: 0.1, scale: 0.7 });
  let completed = 0;
  camera.animateTo(0.3, 12.34, 2.3, { duration: 100, onComplete: () => { completed += 1; } });
  camera.update(100);
  assert.deepEqual(at(camera), { x: 0.3, y: 12.34, scale: 2.3 });
  assert.equal(completed, 1);
  assert.equal(camera.isAnimating, false);
  camera.update(100);
  assert.equal(completed, 1, 'a frame after landing completed again');
});

test('motion - the default easing is ease-out-cubic, by name or by omission', () => {
  assert.equal(DEFAULT_EASING, 'ease-out-cubic');
  const camera = new MotionCamera();
  camera.animateTo(100, 200, 1, { duration: 400 });
  camera.update(100); // t = 0.25: 1 - 0.75^3 = 0.578125
  assert.deepEqual([camera.x, camera.y, camera.isAnimating], [57.8125, 115.625, true]);

  const named = new MotionCamera();
  named.animateTo(100, 200, 1, { duration: 400, easing: DEFAULT_EASING });
  named.update(100);
  assert.deepEqual([named.x, named.y], [camera.x, camera.y]);
});

test('motion - named easings resolve; an unknown name or a non-function falls back to the default', () => {
  assert.deepEqual(Object.keys(EASINGS).sort(), ['ease-in-out', 'ease-out-cubic', 'linear']);
  assert.equal(EASINGS.linear(0.4), 0.4);
  assert.equal(EASINGS['ease-out-cubic'](1), 1);
  assert.equal(EASINGS['ease-in-out'](0.25), 0.0625);
  assert.equal(EASINGS['ease-in-out'](0.75), 0.9375);

  const travelled = (easing) => {
    const camera = new MotionCamera();
    assert.doesNotThrow(() => camera.animateTo(100, 0, 1, { duration: 400, easing }));
    camera.update(100);
    return camera.x;
  };
  assert.equal(travelled('ease-in-out'), 6.25);
  assert.equal(travelled('wobble'), 57.8125);
  assert.equal(travelled(42), 57.8125);
});

test('motion - a custom easing function is honoured, and the clock still runs out', () => {
  const seen = [];
  const camera = new MotionCamera();
  camera.animateTo(100, 200, 4, { duration: 400, easing: (t) => { seen.push(t); return 1; } });
  camera.update(16);
  assert.deepEqual(seen, [0.04]);
  assert.deepEqual(at(camera), { x: 100, y: 200, scale: 4 }, 'ease 1 is the target on the first frame');
  assert.equal(camera.isAnimating, true);
  land(camera);
  assert.equal(camera.scale, 4);
});

test('motion - fit forwards its easing end to end', () => {
  const camera = new MotionCamera();
  // 800x600, padding 60 -> 680x480; a 400x300 box -> min(1.7, 1.6) = 1.6.
  camera.fit({ minX: 0, minY: 0, width: 400, height: 300 }, HOST, { duration: 400, easing: 'linear' });
  assert.equal(camera.isAnimating, true);
  camera.update(200);
  assert.equal(camera.x, 40, 'the linear midpoint of 0 -> 80 (a cubic would be 70)');
  assert.ok(Math.abs(camera.scale - Math.pow(1.6, 0.5)) < 1e-12);
  land(camera);
  assert.deepEqual([camera.scale, camera.x], [1.6, 80]);
});

test('motion - an immediate fit lands on the camera that centres the box', () => {
  const camera = new MotionCamera();
  const target = camera.fit({ minX: 0, minY: 0, maxX: 400, maxY: 300 }, HOST, { immediate: true });
  assert.deepEqual(target, { x: 400 - 200 * 1.6, y: 300 - 150 * 1.6, scale: 1.6 });
  assert.deepEqual(at(camera), target, 'the camera did not land on its own answer');
  assert.equal(camera.isAnimating, false);
  const centre = camera.canvasToScreen(200, 150, { left: 0, top: 0 });
  assert.ok(Math.abs(centre.x - 400) < 1e-9 && Math.abs(centre.y - 300) < 1e-9);
});

test('motion - fit reads all three ways a box is written, and a box at the origin', () => {
  const camera = new MotionCamera();
  const fit = (bounds) => camera.fit(bounds, HOST, { immediate: true });
  const expected = fit({ minX: 100, minY: 50, maxX: 500, maxY: 350 });
  assert.deepEqual(fit({ x: 100, y: 50, width: 400, height: 300 }), expected);
  assert.deepEqual(fit({ left: 100, top: 50, right: 500, bottom: 350 }), expected);
  assert.deepEqual(fit({ minX: 100, minY: 50, maxX: 500, maxY: 350, width: 400, height: 300 }), expected, 'every key at once disagreed');
  assert.deepEqual(fit({ x: 0, y: 0, width: 400, height: 300 }), { x: 400 - 200 * 1.6, y: 300 - 150 * 1.6, scale: 1.6 });
});

test('motion - fit refuses a box that describes nothing, and moves no camera', () => {
  const camera = new MotionCamera({ x: 7, y: 9, scale: 1.5 });
  for (const bounds of [null, undefined, 'everything', {}, { width: 400, height: 300 }, { x: 0, y: 0 }]) {
    assert.throws(() => camera.fit(bounds, HOST), TypeError);
  }
  assert.deepEqual(at(camera), { x: 7, y: 9, scale: 1.5 });
});

test('motion - fit clamps to the camera\'s own scale limits', () => {
  const camera = new MotionCamera({ minScale: 0.5, maxScale: 1.1 });
  assert.equal(camera.fit({ x: 0, y: 0, width: 10, height: 10 }, HOST, { immediate: true }).scale, 1.1);
  assert.equal(camera.fit({ x: 0, y: 0, width: 100000, height: 100000 }, HOST, { immediate: true }).scale, 0.5);
});

test('prefersReducedMotion - caches the query, tracks its changes, and the reset detaches', (t) => {
  const stub = stubMatchMedia(t, false);
  assert.equal(prefersReducedMotion(), false);
  assert.equal(stub.listenerCount, 1, 'a change listener is attached once');
  prefersReducedMotion();
  assert.equal(stub.listenerCount, 1, 'the query was re-subscribed');
  stub.emit(true);
  assert.equal(prefersReducedMotion(), true, 'the listener did not keep the cache live');
  stub.restore();
  assert.equal(stub.listenerCount, 0, 'the reset left the listener');

  const second = stubMatchMedia(t, true);
  assert.equal(prefersReducedMotion(), true, 'the reset did not clear the cache');
  assert.equal(second.listenerCount, 1);
});

test('prefersReducedMotion - false without matchMedia, and when the query throws', (t) => {
  const original = globalThis.matchMedia;
  t.after(() => { globalThis.matchMedia = original; _resetReducedMotionForTests(); });
  globalThis.matchMedia = undefined;
  _resetReducedMotionForTests();
  assert.equal(prefersReducedMotion(), false);

  globalThis.matchMedia = () => { throw new Error('unsupported media feature'); };
  _resetReducedMotionForTests();
  assert.equal(prefersReducedMotion(), false);
});

test('motion - reduced motion collapses every eased path at once, onComplete included', (t) => {
  stubMatchMedia(t, true);
  const camera = new MotionCamera();
  const order = [];
  camera.animateTo(100, 200, 4, { duration: 400, onComplete: () => order.push('complete') });
  assert.deepEqual(order, ['complete'], 'onComplete did not fire synchronously');
  assert.deepEqual(at(camera), { x: 100, y: 200, scale: 4 });
  assert.equal(camera.animation, null);
  camera.update(16);
  assert.deepEqual(order, ['complete']);

  camera.fit({ minX: 0, minY: 0, width: 400, height: 300 }, HOST);
  assert.equal(camera.isAnimating, false);
  assert.deepEqual([camera.scale, camera.x], [1.6, 80]);
});

test('motion - eased moves return once reduced motion is switched off', (t) => {
  const stub = stubMatchMedia(t, true);
  const collapsed = new MotionCamera();
  collapsed.animateTo(100, 0, 2, { duration: 400 });
  assert.equal(collapsed.isAnimating, false);

  stub.emit(false);
  const animated = new MotionCamera();
  animated.animateTo(100, 0, 2, { duration: 400, easing: 'linear' });
  assert.equal(animated.isAnimating, true);
  animated.update(200);
  assert.deepEqual([animated.x, animated.scale], [50, Math.pow(2, 0.5)]);
});
