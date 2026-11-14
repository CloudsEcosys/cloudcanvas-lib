/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The root collection: the settable `root` (promotion, demotion, `view()`
 * relative to it), the id index with `find` (parked blits included, nothing
 * left behind on removal), a host resize re-centring a tilted plane, and the
 * host's perspective left to its author while the camera is flat.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { stateOf } from 'cloudcanvas/kernel';
import { runFrame } from 'cloudcanvas/testing';
import { park, unpark } from '../../plugins/park.js';
import { coreScene } from '../helpers/core-scene.js';
import { resetDocument, setElementSize } from '../helpers/dom.js';

const TREE = `
  <div data-blit id="left" data-w="400" data-h="300">
    <div data-blit id="target" data-x="20" data-y="30" data-w="200" data-h="100"><div data-blit id="leaf"></div></div>
    <div data-blit id="cousin" data-x="250"></div>
  </div>
  <div data-blit id="right" data-x="500" data-w="100" data-h="100"></div>`;

/** app > {left > {target > leaf, cousin}, right}, declared in markup and scanned. */
function tree(t) {
  const scene = coreScene(t, TREE);
  const named = Object.fromEntries(['left', 'right', 'target', 'leaf', 'cousin']
    .map((id) => [id, blit(document.getElementById(id))]));
  return { ...scene, ...named };
}

test('root - a root collection answers itself until a blit is promoted', (t) => {
  const { app, target, leaf } = tree(t);
  assert.equal(app.root, app);
  assert.equal(leaf.root, null, 'only a root collection has a root');

  app.root = target;
  assert.equal(app.root, target);
  app.root = null;
  assert.equal(app.root, app);
  assert.throws(() => { leaf.root = target; }, /only a root collection/);
});

test('root - promotion hides every branch off it, and restores exactly what it hid', (t) => {
  const { app, left, right, target, leaf, cousin } = tree(t);
  right.el.hidden = false;
  const authorHidden = left.blit({});
  authorHidden.el.hidden = true;

  app.root = target;
  assert.deepEqual([left, target, leaf].map((b) => b.el.hidden), [false, false, false], 'the branch stays');
  assert.deepEqual([right, cousin].map((b) => b.el.hidden), [true, true], 'the siblings along it hide');

  // A blit made off the branch while promoted is hidden too; one made inside it is not.
  const late = app.blit({});
  const inside = target.blit({});
  assert.equal(late.el.hidden, true);
  assert.equal(inside.el.hidden, false);

  app.root = app;
  assert.deepEqual([right, cousin, late].map((b) => b.el.hidden), [false, false, false]);
  assert.equal(authorHidden.el.hidden, true, "the author's own hidden blit stays hidden");
});

test('root - re-promoting moves the demotion; a blit of another root is refused', (t) => {
  const { app, right, target, cousin } = tree(t);
  app.root = target;
  app.root = cousin;
  assert.equal(cousin.el.hidden, false);
  assert.equal(target.el.hidden, true);
  assert.equal(right.el.hidden, true);

  const stranger = document.createElement('div');
  document.body.appendChild(stranger);
  assert.throws(() => { app.root = stranger; }, /not a blit of this root/);
  assert.equal(app.root, cousin);
});

test('view - frames the current root by default; the host is the identity camera', (t) => {
  const { app, root, right, target, leaf } = tree(t);
  app.root = target;

  const framed = app.view(undefined, { padding: 0, maxZoom: 1 });
  // target is at (20, 30) 200x100 globally; the default host box is 800x600.
  assert.deepEqual(framed, { x: 800 / 2 - 120, y: 600 / 2 - 80, scale: 1 });
  assert.deepEqual(app.view(leaf, { padding: 0, maxZoom: 1 }).scale, 1, 'inside the root frames');
  assert.throws(() => app.view(right), /hidden by the current root/);

  app.root = null;
  assert.deepEqual(app.view(), { x: 0, y: 0, scale: 1 });
  assert.deepEqual({ x: root.camera.x, y: root.camera.y, scale: root.camera.scale }, { x: 0, y: 0, scale: 1 });
});

test('index - find answers by id, a parked blit included, and the element after an id change', (t) => {
  const { app, root, target, leaf } = tree(t);
  assert.equal(app.find('target'), target);
  assert.equal(target.find('leaf'), leaf, 'any blit of the root finds through it');
  assert.equal(app.find('nobody'), null);

  park(stateOf(target.el));
  assert.equal(target.el.isConnected, false);
  assert.equal(app.find('target'), target, 'parked, still found');
  assert.equal(app.find('leaf'), leaf, 'inside a parked blit, still found');
  unpark(stateOf(target.el));

  // An id given after attach is found in the tree, and parking indexes it and what is inside it.
  const late = app.blit({});
  const within = late.blit({});
  late.el.id = 'late';
  within.el.id = 'within';
  assert.equal(root.ids.has('late'), false);
  assert.equal(app.find('late'), late);
  park(stateOf(late.el));
  assert.equal(root.ids.get('late'), late.el);
  assert.equal(app.find('within'), within);
});

test('index - removal leaves no entry: the blit, what is inside it, and parked ones too', (t) => {
  const { app, root, left, right, target } = tree(t);
  assert.deepEqual([...root.ids.keys()].sort(), ['cousin', 'leaf', 'left', 'right', 'target']);

  park(stateOf(target.el));
  left.remove();
  assert.deepEqual([...root.ids.keys()], ['right'], 'left, cousin, the parked target and its leaf are gone');

  park(stateOf(right.el));
  const anchors = () => Array.from(root.plane.childNodes).filter((node) => node.nodeType === 8);
  assert.equal(anchors().length, 1);
  right.remove();
  assert.equal(root.ids.size, 0, 'a parked blit removed directly leaves the index');
  assert.equal(anchors().length, 0, 'and takes its anchor with it');
  assert.equal(app.find('right'), null);
});

test('index - removing the root clears it', (t) => {
  const { app, root } = tree(t);
  app.remove();
  assert.equal(root.ids.size, 0);
});

test('find - blit() takes a handle and answers it', (t) => {
  const { app, target } = tree(t);
  assert.equal(blit(target), target);
  assert.equal(blit(app), app);
});

test('id - set({id}) is the element id and the index key; spec reads it back; null removes it', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ id: 'card', x: 10 });
  assert.equal(card.el.id, 'card');
  assert.equal(card.el.hasAttribute('data-id'), false, 'an id is the element id, never data-*');
  assert.equal(app.find('card'), card);
  assert.equal(card.spec.id, 'card');

  card.set({ id: 'renamed' });
  assert.equal(app.find('renamed'), card);
  assert.equal(app.find('card'), null);

  card.set({ id: null });
  assert.equal(card.el.hasAttribute('id'), false);
  assert.equal('id' in card.spec, false);
  assert.throws(() => blit.use({ id: () => {} }), /cannot be a name/);
});

test('root - removing the promoted view root, or a blit holding it, hands the view back to the host', (t) => {
  const { app, target, left } = tree(t);
  app.root = target;
  target.remove();
  assert.equal(app.root, app);
  assert.equal(app.find('right').el.hidden, false, 'a branch stayed hidden by a view that is gone');
  app.root = app.find('cousin');
  left.remove();
  assert.equal(app.root, app);
});

/** Stand in a `ResizeObserver` that records what it observes, so a test can report a resize by hand. */
function recordResizes(t) {
  const observed = [];
  const native = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    constructor(callback) { this.callback = callback; }
    observe(target) { observed.push({ target, resized: () => this.callback([{ target }], this) }); }
    disconnect() {}
  };
  t.after(() => { globalThis.ResizeObserver = native; });
  return observed;
}

/** The sixteen numbers of a `matrix3d(...)` transform. */
function matrixOf(transform) {
  return transform.slice(transform.indexOf('(') + 1, -1).split(',').map(Number);
}

test('root - a host resize re-reads the box and re-centres a tilted plane on the next frame', (t) => {
  const observed = recordResizes(t);
  const { host, root } = coreScene(t);
  assert.ok(observed.length === 1 && observed[0].target === host, 'the root observes its host');

  setElementSize(host, 1000, 700);
  Object.assign(root.camera, { perspective: 900, rotateX: 35, rotateY: -20 });
  runFrame(root, 1);
  assert.equal(root.hostRect.width, 1000);

  setElementSize(host, 600, 500);
  runFrame(root, 1);
  assert.equal(root.hostRect.width, 1000, 'a still camera alone does not re-read the box');
  observed[0].resized();
  runFrame(root, 1);
  assert.deepEqual([root.hostRect.width, root.hostRect.height], [600, 500]);
  const expected = Array.from(root.camera.view({ width: 600, height: 500 }));
  const written = matrixOf(root.plane.style.transform);
  assert.equal(written.length, 16);
  assert.ok(written.every((n, i) => Math.abs(n - expected[i]) < 1e-5), `the plane kept the old centre: ${written}`);
});

test('root - a flat root leaves the author\'s host perspective; a 3D camera writes it and clears only its own', (t) => {
  const { host, root } = coreScene(t);
  host.style.perspective = '800px';
  runFrame(root, 1);
  root.camera.panBy(10, 0);
  runFrame(root, 1);
  assert.equal(host.style.perspective, '800px', 'a flat root cleared the author\'s perspective');
  assert.equal(root.plane.style.transformStyle, '');

  Object.assign(root.camera, { perspective: 1000, rotateX: 20 });
  runFrame(root, 1);
  assert.deepEqual([host.style.perspective, root.plane.style.transformStyle], ['1000px', 'preserve-3d']);
  Object.assign(root.camera, { perspective: null, rotateX: 0 });
  runFrame(root, 1);
  assert.deepEqual([host.style.perspective, root.plane.style.transformStyle], ['', '']);

  host.style.perspective = '600px';
  root.camera.panBy(5, 0);
  runFrame(root, 1);
  assert.equal(host.style.perspective, '600px', 'flat again, the host is the author\'s again');
});
