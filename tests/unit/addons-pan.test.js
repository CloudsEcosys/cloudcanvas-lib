/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The pan add-on on a core root, no bridge: a drag on bare canvas pans the
 * camera and a press on a blit does not; the wheel pans, zooms at the pointer
 * with normalised deltas, and leaves an opted-in scroll region alone; two
 * pointers pinch; under a tilted camera a drag, a wheel and a pinch keep the
 * grabbed canvas point under the pointer; a right-click mid-gesture cancels
 * it; `off` unbinds. The wheel maths, pointer hygiene, pinch and capture
 * cases ported from `pointer-wheel.test.js`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { runFrame } from 'cloudcanvas/testing';
import {
  DISCRETE_WHEEL_MIN_PX, LINE_HEIGHT_PX, MAX_WHEEL_DELTA_PX, PAGE_HEIGHT_FALLBACK_PX, PINCH_ZOOM_K, SCROLL_REGION_SELECTOR,
  WHEEL_ZOOM_K, initPanState, installPan, isDiscreteWheel, normalizeWheelDeltas, pan, panEnv, panWheel, pinchStateFrom,
  wheelZoomFactor
} from '../../plugins/pan.js';
import { coreScene, move, press, release } from '../helpers/core-scene.js';
import { setElementSize } from '../helpers/dom.js';

blit.use({ pan });

const EXACT = 1e-12;

/** A root with the pan add-on attached by name, its host 1000x800 at (100, 50). */
function panScene(t, html = '') {
  const scene = coreScene(t, html);
  setElementSize(scene.host, 1000, 800, { x: 100, y: 50 });
  scene.app.set({ pan: true });
  t.after(() => scene.app.set({ pan: false }));
  return scene;
}

/** A wheel event with its deltas and pointer (happy-dom's `WheelEvent` carries no client point). */
function wheel(target, init) {
  const event = new Event('wheel', { bubbles: true, cancelable: true });
  Object.assign(event, { deltaMode: 0, deltaX: 0, deltaY: 0, clientX: 600, clientY: 450, ctrlKey: false, metaKey: false, ...init });
  target.dispatchEvent(event);
  return event;
}

function camera(root) {
  return [root.camera.x, root.camera.y, root.camera.scale];
}

test('pan - a drag on bare canvas pans the camera, and the plane follows on the next frame', (t) => {
  const { host, root } = panScene(t);

  press(host, 200, 200);
  move(230, 190);
  move(260, 220);
  release(260, 220);
  assert.deepEqual(camera(root), [60, 20, 1]);

  move(400, 400);
  assert.deepEqual(camera(root), [60, 20, 1], 'a hover after release still panned');
  runFrame(root, 1);
  assert.match(root.plane.style.transform, /translate3d\(60\.00px, 20\.00px/);
});

test('pan - a press on a blit is the blit\'s, never a pan', (t) => {
  const { app, root } = panScene(t);
  const card = app.blit({ x: 10, y: 10, w: 50, h: 50 });

  press(card.el, 20, 20);
  move(120, 120);
  release(120, 120);
  assert.deepEqual(camera(root), [0, 0, 1]);
});

test('pan - a wheel notch zooms about the pointer; a trackpad stream pans against it', (t) => {
  const { host, root } = panScene(t);

  const notch = wheel(host, { deltaY: -120 });
  assert.equal(notch.defaultPrevented, true);
  const factor = wheelZoomFactor(-120, WHEEL_ZOOM_K);
  assert.ok(Math.abs(root.camera.scale - factor) < EXACT);
  // The focal point - the pointer, in host space (500, 400) - stays put.
  assert.ok(Math.abs(root.camera.x - (500 - 500 * factor)) < EXACT);

  root.camera.scale = 1;
  root.camera.panTo(0, 0);
  wheel(host, { deltaX: 12.5, deltaY: 7.5 });
  assert.deepEqual(camera(root), [-12.5, -7.5, 1]);
});

test('pan - line deltas are normalised and ctrl-wheel is a pinch with its own gain', (t) => {
  const { host, root } = panScene(t);

  wheel(host, { deltaMode: 1, deltaX: 2, deltaY: 0 });
  assert.deepEqual(camera(root), [-2 * LINE_HEIGHT_PX, 0, 1]);

  root.camera.panTo(0, 0);
  wheel(host, { deltaY: 10, ctrlKey: true });
  assert.ok(Math.abs(root.camera.scale - wheelZoomFactor(10, PINCH_ZOOM_K)) < EXACT);
});

test('pan - an opted-in scroll region keeps its unmodified wheel', (t) => {
  const { host, root } = panScene(t, '<div data-cc-scroll><p id="inside">list</p></div>');

  const scrolled = wheel(host.querySelector('#inside'), { deltaY: 120 });
  assert.equal(scrolled.defaultPrevented, false);
  assert.deepEqual(camera(root), [0, 0, 1]);
});

test('pan - opts.wheel false leaves every wheel to the page', (t) => {
  const { app, host, root } = coreScene(t);
  t.after(pan(app, { wheel: false }));

  const free = wheel(host, { deltaY: 120 });
  assert.equal(free.defaultPrevented, false);
  assert.deepEqual(camera(root), [0, 0, 1]);
});

test('pan - two pointers pinch: the separation zooms, the midpoint pans', (t) => {
  const { host, root } = panScene(t);

  press(host, 200, 200, { pointerId: 1 });
  press(host, 300, 200, { pointerId: 2, isPrimary: false });
  window.dispatchEvent(new PointerEvent('pointermove', { clientX: 350, clientY: 200, pointerId: 2 }));
  // Separation 100 -> 150 about the midpoint (250, 200), host origin (100, 50).
  assert.ok(Math.abs(root.camera.scale - 1.5) < EXACT);
  assert.ok(Math.abs(root.camera.x - (150 - 150 * 1.5 + 25)) < EXACT);
  release(350, 200);
});

/** A tilted pan scene, and the maps between client points and the canvas through its camera. */
function tiltedScene(t, tilt) {
  const scene = panScene(t);
  Object.assign(scene.root.camera, tilt);
  const rect = scene.host.getBoundingClientRect();
  const canvasAt = (x, y) => scene.root.camera.unproject(x - rect.left, y - rect.top, rect);
  const clientOf = (point) => {
    const at = scene.root.camera.project(point.x, point.y, rect);
    return [at.x + rect.left, at.y + rect.top];
  };
  return { ...scene, canvasAt, clientOf };
}

/** Whether a client point sits within a millionth of a pixel of `[x, y]`. */
function under([ax, ay], [x, y]) {
  return Math.abs(ax - x) < 1e-6 && Math.abs(ay - y) < 1e-6;
}

test('pan - a tilted drag keeps the grabbed canvas point under the pointer; above the horizon it waits', (t) => {
  // Horizon at host y = 400 - 900 / tan 70° ≈ 72: client y 122.
  const { host, root, canvasAt, clientOf } = tiltedScene(t, { perspective: 900, rotateX: 70 });
  const grabbed = canvasAt(600, 500);
  press(host, 600, 500);
  move(650, 560);
  move(700, 620);
  assert.ok(under(clientOf(grabbed), [700, 620]), `the grabbed point is at ${clientOf(grabbed)}`);

  const held = camera(root);
  move(720, 60);
  assert.deepEqual(camera(root), held, 'a move above the horizon panned');
  move(740, 640);
  release(740, 640);
  assert.ok(under(clientOf(grabbed), [740, 640]), 'back on the plane, the grab resumes');
});

test('pan - a tilted wheel notch and a tilted pinch zoom about the canvas point under the pointer', (t) => {
  const { host, root, canvasAt, clientOf } = tiltedScene(t, { perspective: 900, rotateX: 40, rotateY: -20 });
  const cursor = canvasAt(800, 300);
  wheel(host, { deltaY: -120, clientX: 800, clientY: 300 });
  assert.ok(root.camera.scale > 1.1, 'the notch did not zoom');
  assert.ok(under(clientOf(cursor), [800, 300]), `the point under the cursor drifted to ${clientOf(cursor)}`);

  const middle = canvasAt(550, 500);
  press(host, 500, 500, { pointerId: 1 });
  press(host, 600, 500, { pointerId: 2, isPrimary: false });
  window.dispatchEvent(new PointerEvent('pointermove', { clientX: 650, clientY: 500, pointerId: 2 }));
  assert.ok(under(clientOf(middle), [575, 500]), `the pinched point is at ${clientOf(middle)}, not the midpoint`);
  window.dispatchEvent(new PointerEvent('pointerup', { clientX: 650, clientY: 500, pointerId: 2 }));
  release(500, 500);
});

test('pan - a right-click mid-pan cancels it and is swallowed; idle, it is the page\'s', (t) => {
  const { host, root } = panScene(t);
  const rightClick = () => {
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });
    host.dispatchEvent(event);
    return event.defaultPrevented;
  };

  assert.equal(rightClick(), false);
  press(host, 100, 100);
  move(120, 100);
  assert.equal(rightClick(), true);
  move(200, 100);
  assert.deepEqual(camera(root), [20, 0, 1], 'the cancelled pan resumed');
});

test('pan - off unbinds everything; a blit that is not a root is refused', (t) => {
  const { app, host, root } = coreScene(t);
  const off = pan(app);
  off();

  press(host, 0, 0);
  move(50, 50);
  wheel(host, { deltaY: 120 });
  assert.deepEqual(camera(root), [0, 0, 1]);

  const card = app.blit({ x: 0, y: 0 });
  assert.throws(() => pan(card), /pan: expected a root collection/);
});

/* ------------------ WHEEL MATHS ------------------ */

test('pan - wheel deltas normalise pixels, lines and pages; a page is the host height, else the fallback', () => {
  assert.deepEqual(normalizeWheelDeltas({ deltaMode: 0, deltaX: 7, deltaY: -9 }, 600), { dx: 7, dy: -9 });
  assert.deepEqual(normalizeWheelDeltas({ deltaMode: 1, deltaX: 0, deltaY: 3 }, 600), { dx: 0, dy: 3 * LINE_HEIGHT_PX });
  assert.deepEqual(normalizeWheelDeltas({ deltaMode: 2, deltaX: 0, deltaY: 0.25 }, 400), { dx: 0, dy: 100 });
  assert.deepEqual(normalizeWheelDeltas({ deltaMode: 2, deltaX: 0, deltaY: 0.1 }, 0), { dx: 0, dy: PAGE_HEIGHT_FALLBACK_PX * 0.1 });
});

test('pan - every wheel axis is clamped to MAX_WHEEL_DELTA_PX per event', () => {
  assert.deepEqual(normalizeWheelDeltas({ deltaMode: 0, deltaX: 9999, deltaY: -9999 }, 800), { dx: MAX_WHEEL_DELTA_PX, dy: -MAX_WHEEL_DELTA_PX });
  assert.equal(normalizeWheelDeltas({ deltaMode: 2, deltaX: 0, deltaY: 1 }, 800).dy, MAX_WHEEL_DELTA_PX);
});

test('pan - the discrete heuristic separates a notch from a trackpad stream', () => {
  const notch = { deltaMode: 0, deltaX: 0, deltaY: 120 };
  assert.equal(isDiscreteWheel(notch), true);
  assert.equal(isDiscreteWheel({ ...notch, deltaY: -DISCRETE_WHEEL_MIN_PX }), true);
  assert.equal(isDiscreteWheel({ ...notch, deltaY: DISCRETE_WHEEL_MIN_PX - 1 }), false);
  assert.equal(isDiscreteWheel({ ...notch, deltaY: 120.5 }), false);
  assert.equal(isDiscreteWheel({ ...notch, deltaX: 3 }), false);
  assert.equal(isDiscreteWheel({ deltaMode: 1, deltaX: 0, deltaY: 1 }), true, 'a line is a notch whatever its size');
  assert.equal(isDiscreteWheel({ deltaMode: 2, deltaX: 4, deltaY: 0.1 }), true);
});

test('pan - pinchStateFrom reduces two pointers to separation and midpoint', () => {
  assert.deepEqual(pinchStateFrom([{ x: 0, y: 0 }, { x: 30, y: 40 }]), { dist: 50, midX: 15, midY: 20 });
  assert.deepEqual(pinchStateFrom([{ x: -10, y: 0 }, { x: 10, y: 0 }, { x: 500, y: 500 }]), { dist: 20, midX: 0, midY: 0 });
  assert.equal(pinchStateFrom([{ x: 0, y: 0 }]), null);
  assert.equal(pinchStateFrom(null), null);
});

/* ------------------ WHEEL ROUTING ------------------ */

test('pan - a pixel trackpad burst pans and never zooms; a horizontal wheel never zooms, modified or not', (t) => {
  const { host, root } = panScene(t);
  for (let i = 0; i < 4; i += 1) wheel(host, { deltaY: 4 });
  assert.deepEqual(camera(root), [0, -16, 1]);

  root.camera.panTo(0, 0);
  wheel(host, { deltaX: 50 });
  wheel(host, { deltaX: 50, ctrlKey: true });
  assert.deepEqual(camera(root), [-100, 0, 1]);
});

test('pan - a line notch, a page and a spike each zoom by the exact exponential of their clamped pixels', (t) => {
  const { host, root } = panScene(t);
  const zoomed = (init) => {
    root.camera.setZoom(1);
    wheel(host, init);
    return root.camera.scale;
  };
  assert.equal(zoomed({ deltaMode: 1, deltaY: 3 }), wheelZoomFactor(3 * LINE_HEIGHT_PX, WHEEL_ZOOM_K));
  assert.equal(zoomed({ deltaY: 10000 }), wheelZoomFactor(MAX_WHEEL_DELTA_PX, WHEEL_ZOOM_K));
  assert.equal(zoomed({ deltaY: -10000 }), wheelZoomFactor(-MAX_WHEEL_DELTA_PX, WHEEL_ZOOM_K));
  setElementSize(host, 1000, 100);
  assert.equal(zoomed({ deltaMode: 2, deltaY: 1 }), wheelZoomFactor(100, WHEEL_ZOOM_K), 'a page is not the host height');
});

test('pan - an unmeasured host reads a page as the fallback, clamped', (t) => {
  const { app, host, root } = coreScene(t);
  app.set({ pan: true });
  t.after(() => app.set({ pan: false }));
  wheel(host, { deltaMode: 2, deltaY: 1 });
  assert.equal(root.camera.scale, wheelZoomFactor(MAX_WHEEL_DELTA_PX, WHEEL_ZOOM_K));
});

test('pan - ctrl and meta are both a pinch, zooming at the pointer with the pinch gain', (t) => {
  const { host, root } = panScene(t);
  const expected = wheelZoomFactor(10, PINCH_ZOOM_K);
  assert.notEqual(expected, wheelZoomFactor(10, WHEEL_ZOOM_K));
  wheel(host, { deltaY: 10, ctrlKey: true, clientX: 300, clientY: 150 });
  assert.equal(root.camera.scale, expected);
  // The pointer, (200, 100) in host space, stayed put.
  assert.ok(Math.abs(root.camera.x - (200 - 200 * expected)) < 1e-9);
  assert.ok(Math.abs(root.camera.y - (100 - 100 * expected)) < 1e-9);

  root.camera.setZoom(1);
  wheel(host, { deltaY: 10, metaKey: true });
  assert.equal(root.camera.scale, expected);
});

test('pan - a notch in and a notch out return exactly to the starting camera', (t) => {
  const { host, root } = panScene(t);
  wheel(host, { deltaY: -120, clientX: 420, clientY: 290 });
  assert.ok(root.camera.scale > 1.19, `one notch gave ${root.camera.scale}x`);
  wheel(host, { deltaY: 120, clientX: 420, clientY: 290 });
  assert.ok(Math.abs(root.camera.scale - 1) <= EXACT);
  assert.ok(Math.abs(root.camera.x) < 1e-9 && Math.abs(root.camera.y) < 1e-9);
});

test('pan - the camera scale limits hold under a sustained burst', (t) => {
  const { host, root } = panScene(t);
  for (let i = 0; i < 80; i += 1) wheel(host, { deltaY: -120 });
  assert.equal(root.camera.scale, root.camera.maxScale);
  for (let i = 0; i < 200; i += 1) wheel(host, { deltaY: 120 });
  assert.equal(root.camera.scale, root.camera.minScale);
});

test('pan - outside a scroll region the wheel is always defaulted away, even with nothing to do', (t) => {
  const { host, root } = panScene(t);
  assert.equal(wheel(host, { deltaX: 0, deltaY: 0 }).defaultPrevented, true);
  const hostless = new Event('wheel', { cancelable: true });
  Object.assign(hostless, { deltaMode: 0, deltaX: 0, deltaY: 120 });
  assert.equal(panWheel(hostless, panEnv(null, root)), false);
  assert.equal(hostless.defaultPrevented, true);
});

test('pan - ctrl or meta inside a scroll region is still the camera; a region never opted in pans it', (t) => {
  const { app, root } = panScene(t);
  const well = app.blit({ w: 100, h: 100 });
  well.el.innerHTML = '<div class="scroll"><p class="inside">list</p></div><div class="plain"></div>';
  well.el.querySelector('.scroll').setAttribute(SCROLL_REGION_SELECTOR.slice(1, -1), '');
  assert.ok(well.el.querySelector('.scroll').matches(SCROLL_REGION_SELECTOR), 'the exported selector missed the opt-in');

  const zoom = wheel(well.el.querySelector('.inside'), { deltaY: 10, ctrlKey: true });
  assert.equal(zoom.defaultPrevented, true, 'the page zoomed as well as the canvas');
  assert.equal(root.camera.scale, wheelZoomFactor(10, PINCH_ZOOM_K));

  root.camera.setZoom(1);
  root.camera.panTo(0, 0);
  const plain = wheel(well.el.querySelector('.plain'), { deltaY: 8 });
  assert.equal(plain.defaultPrevented, true);
  assert.equal(root.camera.y, -8);
});

/* ------------------ POINTERS ------------------ */

/** The gesture over a core root with its state record exposed; the host 1000x800 at the origin. */
function gesture(t) {
  const scene = coreScene(t);
  setElementSize(scene.host, 1000, 800);
  const g = initPanState();
  t.after(installPan(scene.host, scene.root, { state: g }));
  return { ...scene, g };
}

function pointer(target, type, init) {
  const event = new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true, button: 0, ...init });
  target.dispatchEvent(event);
  return event;
}

const down = (target, init) => pointer(target, 'pointerdown', init);
const drift = (init) => pointer(window, 'pointermove', init);
const up = (init) => pointer(window, 'pointerup', init);

test('pan - a secondary button or a lone non-primary pointer starts nothing', (t) => {
  const { host, root, g } = gesture(t);
  down(host, { button: 2 });
  down(host, { isPrimary: false, pointerId: 7 });
  assert.deepEqual([g.isPanning, g.activePointers.size, g.pinch], [false, 0, null]);
  drift({ clientX: 90, clientY: 90 });
  assert.deepEqual(camera(root), [0, 0, 1]);
});

test('pan - a second finger ends the pan and opens a pinch', (t) => {
  const { host, g } = gesture(t);
  down(host, { pointerId: 1, clientX: 0, clientY: 0 });
  assert.equal(g.isPanning, true);
  down(host, { pointerId: 2, isPrimary: false, clientX: 100, clientY: 0 });
  assert.equal(g.isPanning, false, 'the pan survived the second finger');
  assert.equal(g.activePointers.size, 2);
  assert.deepEqual(g.pinch, pinchStateFrom([{ x: 0, y: 0 }, { x: 100, y: 0 }]));
});

test('pan - a pinch that only translates pans without scaling; a zero separation never divides by zero', (t) => {
  const { host, root, g } = gesture(t);
  down(host, { pointerId: 1, clientX: 0, clientY: 0 });
  down(host, { pointerId: 2, isPrimary: false, clientX: 100, clientY: 0 });
  drift({ pointerId: 1, clientX: 40, clientY: 30 });
  drift({ pointerId: 2, clientX: 140, clientY: 30 });
  assert.deepEqual(camera(root), [40, 30, 1]);
  up({ pointerId: 1 });
  up({ pointerId: 2 });

  root.camera.panTo(0, 0);
  down(host, { pointerId: 3, clientX: 50, clientY: 50 });
  down(host, { pointerId: 4, isPrimary: false, clientX: 50, clientY: 50 });
  assert.equal(g.pinch.dist, 0);
  drift({ pointerId: 4, clientX: 150, clientY: 50 });
  assert.equal(root.camera.scale, 1, 'a zero baseline changed the scale');
  assert.equal(g.pinch.dist, 100);
});

test('pan - lifting one finger resumes the pan from the survivor, with no jump', (t) => {
  const { host, root, g } = gesture(t);
  down(host, { pointerId: 1, clientX: 0, clientY: 0 });
  down(host, { pointerId: 2, isPrimary: false, clientX: 100, clientY: 0 });
  drift({ pointerId: 2, clientX: 200, clientY: 0 });
  assert.equal(root.camera.scale, 2);
  const before = { x: root.camera.x, y: root.camera.y };

  up({ pointerId: 1, clientX: 0, clientY: 0 });
  assert.deepEqual([g.pinch, g.isPanning], [null, true]);
  assert.deepEqual(g.lastPointer, { x: 200, y: 0 }, 'not re-seeded from the finger that stayed');
  drift({ pointerId: 2, clientX: 210, clientY: 5 });
  assert.deepEqual([root.camera.x - before.x, root.camera.y - before.y], [10, 5]);
  up({ pointerId: 2 });
  assert.deepEqual([g.isPanning, g.activePointers.size], [false, 0]);
});

test('pan - pointer capture waits for the threshold, and a refusal or a missing API never breaks the pan', (t) => {
  const { host, root, g } = gesture(t);
  const captured = [];
  host.setPointerCapture = (id) => { captured.push(id); throw new Error('InvalidPointerId'); };
  host.releasePointerCapture = () => { throw new Error('InvalidPointerId'); };
  down(host, { clientX: 10, clientY: 10 });
  assert.deepEqual(captured, [], 'the press itself took the stream');
  assert.doesNotThrow(() => drift({ clientX: 60, clientY: 10 }));
  assert.deepEqual(captured, [1]);
  assert.deepEqual([g.isPanning, root.camera.x], [true, 50], 'a refused capture swallowed the pan');

  host.setPointerCapture = undefined;
  host.releasePointerCapture = undefined;
  assert.doesNotThrow(() => { up({}); down(host, { clientX: 10, clientY: 10 }); drift({ clientX: 60, clientY: 10 }); });
  assert.equal(g.isPanning, true);
});

test('pan - a press that starts on a control is never captured, however far it travels', (t) => {
  const { host, g } = gesture(t);
  const captured = [];
  host.setPointerCapture = (id) => { captured.push(id); };
  host.hasPointerCapture = () => false;
  const button = document.createElement('button');
  host.appendChild(button);

  down(button, { pointerId: 3, clientX: 5, clientY: 5 });
  drift({ pointerId: 3, clientX: 205, clientY: 205 });
  assert.deepEqual(captured, [], 'the stream was captured away from a control');
  assert.equal(g._pendingCapture.declined, true);
  up({ pointerId: 3 });
});

test('pan - a right-click mid-pinch cancels it and forgets every pointer', (t) => {
  const { host, g } = gesture(t);
  down(host, { pointerId: 1, clientX: 0, clientY: 0 });
  down(host, { pointerId: 2, isPrimary: false, clientX: 80, clientY: 0 });
  const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });
  host.dispatchEvent(menu);
  assert.equal(menu.defaultPrevented, true);
  assert.deepEqual([g.pinch, g.activePointers.size], [null, 0]);
});

/** The capture calls the host receives, recorded; none refused. */
function recordCapture(host) {
  const captured = [];
  host.setPointerCapture = (id) => { captured.push(id); };
  host.releasePointerCapture = () => {};
  host.hasPointerCapture = () => false;
  return captured;
}

test('pan - a sub-threshold press, a bare hover, or a foreign pointer never takes the stream', (t) => {
  const { host, g } = gesture(t);
  const captured = recordCapture(host);

  down(host, { pointerId: 6, clientX: 10, clientY: 10 });
  drift({ pointerId: 6, clientX: 12, clientY: 10 });
  up({ pointerId: 6, clientX: 12, clientY: 10 });
  assert.deepEqual(captured, [], 'a click took the stream its click is computed from');
  assert.equal(g._pendingCapture, null);

  drift({ pointerId: 3, clientX: 300, clientY: 300 });
  assert.deepEqual(captured, [], 'a hover with no press captured');

  down(host, { pointerId: 41, clientX: 10, clientY: 10 });
  drift({ pointerId: 42, clientX: 300, clientY: 300 });
  assert.deepEqual(captured, [], 'a foreign pointer took the armed stream');
  assert.equal(g._pendingCapture.pointerId, 41);
  drift({ pointerId: 41, clientX: 90, clientY: 10 });
  assert.deepEqual(captured, [41]);
  up({ pointerId: 41 });
});

test('pan - a pinch takes both contacts at once; a release or a cancel disarms the capture', (t) => {
  const { host, g } = gesture(t);
  const captured = recordCapture(host);

  down(host, { pointerId: 21, clientX: 400, clientY: 400 });
  assert.deepEqual(captured, [], 'the first contact captured before it was a pinch');
  down(host, { pointerId: 22, isPrimary: false, clientX: 500, clientY: 400 });
  assert.deepEqual(captured, [21, 22]);
  assert.equal(g._pendingCapture, null, 'the pinch left the capture armed');
  up({ pointerId: 22 });
  up({ pointerId: 21 });

  down(host, { pointerId: 31, clientX: 10, clientY: 10 });
  pointer(window, 'pointercancel', { pointerId: 31 });
  assert.equal(g._pendingCapture, null, 'a cancel left the capture armed');
  drift({ pointerId: 31, clientX: 300, clientY: 300 });
  assert.deepEqual(captured, [21, 22], 'a cancelled gesture captured on a stray move');
});
