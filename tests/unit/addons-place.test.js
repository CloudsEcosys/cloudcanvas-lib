/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The place add-on on core blits: the deterministic free-spot spiral, on the
 * canvas and inside a scope; `move`, which nests or un-nests a blit without a
 * visible jump; and `hit`, the deepest blit under a point. Ported from
 * `placement.test.js` and the reparent / hit-test half of `reparent.test.js`
 * (ledger: tests/fixtures/test-ledger.json). Every assertion is an exact point.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit, type } from 'cloudcanvas';
import { boxOf, hit, move, scopeOriginOf, spiral, spot } from '../../plugins/place.js';
import { stateOf } from 'cloudcanvas/kernel';
import { coreScene } from '../helpers/core-scene.js';
import { setElementOffset } from '../helpers/dom.js';

/** Canvas-space centre of the default 800x600 host box (happy-dom lays nothing out). */
const CENTRE = { x: 400, y: 300 };

/** Ring spacing for a 200x120 box at the default margin: 200 * 0.75 + 24. */
const STEP = 174;

/** The candidate for one ring sample of a box, so a test names which one was chosen. */
function ringCandidate(centre, ring, index, samples, width, height, step = STEP) {
  const angle = (index / samples) * Math.PI * 2;
  return {
    x: centre.x + Math.cos(angle) * ring * step - width / 2,
    y: centre.y + Math.sin(angle) * ring * step - height / 2
  };
}

/** Whether two boxes, the first grown by `margin`, share any area. */
function overlaps(a, b, margin) {
  return a.x - margin < b.x + b.width && a.x + a.width + margin > b.x
    && a.y - margin < b.y + b.height && a.y + a.height + margin > b.y;
}

/** A container type with a scope below a title. */
function box() {
  type('place-box', { html: '<p data-slot="title"></p><div data-scope></div>' });
}

/* ------------------ CANVAS SPACE ------------------ */

test('spot - an empty canvas centres the box on the view centre, and follows the camera', (t) => {
  const { app, root } = coreScene(t);
  assert.deepEqual(spot(app, { width: 200, height: 120 }), { x: CENTRE.x - 100, y: CENTRE.y - 60 });
  root.camera.panBy(-100, -50);
  assert.deepEqual(spot(app, { width: 200, height: 120 }), { x: CENTRE.x, y: CENTRE.y - 10 });
});

test('spot - the same scene always answers the same way', (t) => {
  const { app } = coreScene(t);
  app.blit({ x: CENTRE.x - 100, y: CENTRE.y - 60, w: 200, h: 120 });
  const first = spot(app, { width: 200, height: 120 });
  assert.deepEqual(spot(app, { width: 200, height: 120 }), first);
  assert.deepEqual(first, ringCandidate(CENTRE, 1, 2, 12, 200, 120));
});

test('spot - an occupied anchor is stepped over, margin included', (t) => {
  const { app } = coreScene(t);
  const blocker = { x: CENTRE.x - 100, y: CENTRE.y - 60, width: 200, height: 120 };
  app.blit({ x: blocker.x, y: blocker.y, w: 200, h: 120 });
  const found = spot(app, { width: 200, height: 120, margin: 24 });
  assert.equal(overlaps({ ...found, width: 200, height: 120 }, blocker, 24), false);
  assert.deepEqual(found, ringCandidate(CENTRE, 1, 2, 12, 200, 120));
});

test('spot - anchor beats near, and near beats the view centre', (t) => {
  const { app } = coreScene(t);
  const near = app.blit({ x: 2000, y: 1200, w: 100, h: 80 });
  near.el.id = 'near_me';
  const beside = spot(app, { width: 200, height: 120, near });
  assert.deepEqual(beside, ringCandidate({ x: 2050, y: 1240 }, 1, 2, 12, 200, 120));
  assert.deepEqual(spot(app, { width: 200, height: 120, near: 'near_me' }), beside, 'an id did not resolve');
  assert.deepEqual(spot(app, { width: 200, height: 120, near, anchor: { x: -500, y: -250 } }), { x: -600, y: -310 });
});

test('spot - a blit with no size, or one off the plane, occupies no space', (t) => {
  const { app, root } = coreScene(t);
  app.blit({ x: CENTRE.x, y: CENTRE.y });
  const overlayBlit = document.createElement('div');
  root.overlay.appendChild(overlayBlit);
  assert.deepEqual(spot(app, { width: 200, height: 120 }), { x: CENTRE.x - 100, y: CENTRE.y - 60 });
});

test('spot - a full scene still answers the last candidate', () => {
  const found = spiral(() => [{}], CENTRE, boxOf({ width: 200, height: 120 }));
  const angle = (55 / 56) * Math.PI * 2;
  assert.deepEqual(found, { x: CENTRE.x + Math.cos(angle) * 2088 - 100, y: CENTRE.y + Math.sin(angle) * 2088 - 60 });
});

test('spot - degenerate sizes fall back to the card defaults', (t) => {
  const { app } = coreScene(t);
  const defaults = spot(app);
  assert.deepEqual(spot(app, { width: 0, height: -5 }), defaults);
  assert.deepEqual(spot(app, { width: 'wide' }), defaults);
  assert.deepEqual(defaults, { x: CENTRE.x - 100, y: CENTRE.y - 60 });
});

/* ------------------ SCOPE SPACE ------------------ */

const CHILD = { width: 100, height: 60, margin: 24 };
const CHILD_STEP = 99;

function scoped(t) {
  box();
  const { app, root } = coreScene(t);
  const parent = app.blit({ type: 'place-box', x: 1000, y: 700, w: 400, h: 300 });
  const child = (x, y) => parent.blit({ x, y, w: CHILD.width, h: CHILD.height });
  return { app, root, parent, child };
}

test('spot - an empty scope starts one margin in from its own top-left', (t) => {
  const { parent } = scoped(t);
  assert.deepEqual(spot(parent, CHILD), { x: 24, y: 24 });
  assert.deepEqual(spot(parent, CHILD), { x: 24, y: 24 }, 'the answer drifted');
});

test('spot - the answer is scope-local, and the canvas is not consulted', (t) => {
  const { app, parent, child } = scoped(t);
  app.blit({ x: 24, y: 24, w: 400, h: 400 });
  const found = spot(parent, CHILD);
  assert.deepEqual(found, { x: 24, y: 24 });
  const placed = child(found.x, found.y);
  assert.deepEqual({ x: placed.x, y: placed.y }, found);
  assert.equal(placed.parent, parent);
});

test('spot - a scoped search steps over its siblings, margin included', (t) => {
  const { parent, child } = scoped(t);
  child(24, 24);
  const found = spot(parent, CHILD);
  assert.deepEqual(found, ringCandidate({ x: 74, y: 54 }, 1, 2, 12, 100, 60, CHILD_STEP));
  assert.equal(overlaps({ ...found, width: 100, height: 60 }, { x: 24, y: 24, width: 100, height: 60 }, 24), false);
});

test('spot - scoped anchor beats near, near beats the centroid', (t) => {
  const { parent, child } = scoped(t);
  const first = child(0, 0);
  child(200, 200);
  assert.deepEqual(spot(parent, CHILD), { x: 100, y: 100 });
  const beside = spot(parent, { ...CHILD, near: first });
  assert.deepEqual(beside, ringCandidate({ x: 50, y: 30 }, 1, 2, 12, 100, 60, CHILD_STEP));
  assert.deepEqual(spot(parent, { ...CHILD, near: first, anchor: { x: 300, y: 60 } }), { x: 250, y: 30 });
});

test('spot - a child with no size occupies no scope space either', (t) => {
  const { parent } = scoped(t);
  parent.blit({ x: 0, y: 0 });
  assert.deepEqual(spot(parent, CHILD), { x: 24, y: 24 });
});

test('spot - a potential blit has no space to search', () => {
  assert.throws(() => spot(blit(document.createElement('div'))), /potential blit has no root/);
});

/* ------------------ MOVE ------------------ */

function moveScene(t) {
  box();
  const { app, root } = coreScene(t);
  const container = app.blit({ type: 'place-box', x: 100, y: 100, w: 400, h: 300 });
  const card = app.blit({ x: 300, y: 200, w: 200, h: 120 });
  return { app, root, container, card, scope: container.el.querySelector('[data-scope]') };
}

test('move - a scope origin is the parent\'s global corner plus its scope offset', (t) => {
  const { container, scope } = moveScene(t);
  assert.deepEqual(scopeOriginOf(stateOf(container.el)), { x: 100, y: 100 });
  setElementOffset(scope, 12, 40);
  assert.deepEqual(scopeOriginOf(stateOf(container.el)), { x: 112, y: 140 });
});

test('move - nesting converts the global point into the parent\'s local space', (t) => {
  const { container, card } = moveScene(t);
  assert.equal(move(card, container), card);
  assert.equal(card.parent, container);
  assert.deepEqual([card.x, card.y], [200, 100]);
  assert.deepEqual([card.bounds.x, card.bounds.y], [300, 200], 'the blit jumped');
});

test('move - a scope offset is honoured, read after the scope fills', (t) => {
  const { container, card, scope } = moveScene(t);
  Object.defineProperty(scope, 'offsetTop', { configurable: true, get: () => (scope.children.length ? 66 : 0) });
  Object.defineProperty(scope, 'offsetLeft', { configurable: true, get: () => (scope.children.length ? 16 : 0) });
  move(card, container, { x: 300, y: 200 });
  assert.deepEqual([card.x, card.y], [184, 34], 'the conversion used the empty scope\'s offset');
  assert.deepEqual([card.bounds.x, card.bounds.y], [300, 200]);
});

test('move - un-nesting is the inverse: back on the plane at the same global point', (t) => {
  const { root, container, card } = moveScene(t);
  move(card, container);
  assert.equal(move(card, null), card);
  assert.equal(card.el.parentNode, root.plane);
  assert.deepEqual([card.x, card.y], [300, 200]);
});

test('move - the element, its traits and its listeners survive by identity', (t) => {
  const { container, card } = moveScene(t);
  const element = card.el;
  const cleanups = stateOf(element).cleanups;
  let pings = 0;
  card.on('ping', () => { pings += 1; });
  move(card, container);
  assert.equal(card.el, element);
  assert.equal(blit(element), card);
  assert.equal(stateOf(element).cleanups, cleanups);
  card.emit('ping');
  assert.equal(pings, 1, 'a listener did not survive the move');
});

test('move - the element lands in the new scope, then back on the plane', (t) => {
  const { root, container, card, scope } = moveScene(t);
  assert.equal(card.el.parentNode, root.plane);
  move(card, container);
  assert.equal(card.el.parentNode, scope);
  move(card, null);
  assert.equal(card.el.parentNode, root.plane);
});

test('move - a blit cannot be nested into itself or its own descendant', (t) => {
  const { container, card } = moveScene(t);
  move(card, container);
  assert.equal(move(container, card), null, 'a cycle was allowed');
  assert.equal(move(container, container), null);
  assert.equal(card.parent, container, 'the descendant lost its parent');
});

/* ------------------ HIT ------------------ */

test('hit - resolves the blit under a point\'s target, skipping the ignored one', (t) => {
  const { app, host, container, card, scope } = { ...moveScene(t), host: document.getElementById('app') };
  assert.equal(hit(app, { target: scope }, { ignore: card }), container);
  assert.equal(hit(app, { target: card.el }, { ignore: card }), null);
  assert.equal(hit(app, { target: host }), null, 'the host resolved as a blit');
});

test('hit - a blit never resolves inside its own subtree', (t) => {
  const { app, container, card } = moveScene(t);
  move(card, container);
  assert.equal(hit(app, { target: card.el }, { ignore: container }), null);
  assert.equal(hit(app, { target: card.el }), card, 'the deepest blit was not the answer');
});
