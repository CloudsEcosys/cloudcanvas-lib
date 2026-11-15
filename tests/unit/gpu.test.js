/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The GPU add-on without a GPU: the scene packs records in draw order with the smallest dirty range and counted
 * textures; `clipMatrix` lands a canvas point on the pixel `camera.project` names; and a `gpu(app)` root over a
 * recording backend draws only when something drawn changed or the camera moved, keeps each element as a
 * transparent hit proxy, and lets a blit go (visible again) when it leaves the port, the root or the view.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { Camera } from 'cloudcanvas/kernel';
import { runFrame } from 'cloudcanvas/testing';
import { GPU_ATTR, gpu, gpuContent, meshTransform, paintedProxy, parseTint, punch } from '../../plugins/gpu.js';
import { geometryOf, mesh } from '../../plugins/mesh.js';
import { SVG_PATH_ATTR, svgPath } from '../../plugins/svg-path.js';
import { layout } from '../../plugins/layout.js';
import { blit } from 'cloudcanvas';
import { FIELD, STRIDE, Scene, clipMatrix, normalMatrix } from '../../plugins/gpu-scene.js';
import { coreScene } from '../helpers/core-scene.js';

const close = (a, b, eps = 1e-4) => Math.abs(a - b) < eps;

test('scene - draw order is z then first seen; batches split on texture; the upload is queued once', () => {
  const texture = { width: 2, height: 2 };
  const scene = new Scene();
  scene.set('a', { x: 0, y: 0, w: 10, h: 10, z: 2 });
  scene.set('b', { x: 5, y: 5, w: 10, h: 10, color: [1, 0, 0, 0.5] });
  scene.set('c', { x: 9, y: 9, w: 1, h: 1, texture, uv: [0, 0, 0.5, 0.5] });
  const packed = scene.pack();

  assert.equal(packed.count, 3);
  assert.deepEqual(packed.dirty, [0, 3]);
  assert.deepEqual([0, 1, 2].map((slot) => packed.instances[slot * STRIDE + FIELD.x]), [5, 9, 0]);
  assert.deepEqual(Array.from(packed.instances.slice(FIELD.r, FIELD.a + 1)), [1, 0, 0, 0.5]);
  assert.deepEqual(Array.from(packed.instances.slice(STRIDE + FIELD.u0, STRIDE + FIELD.v1 + 1)), [0, 0, 0.5, 0.5]);
  assert.deepEqual(packed.batches, [
    { texture: null, first: 0, count: 1 }, { texture: 1, first: 1, count: 1 }, { texture: null, first: 2, count: 1 }
  ]);
  assert.deepEqual(packed.uploads, [[1, texture]]);
  assert.equal(scene.dirty, false);
  assert.equal(scene.pack().dirty, null, 'nothing new, nothing dirty');
});

test('scene - a move rewrites its slot alone; a new version re-uploads; a shared texture drops with its last user', () => {
  const texture = { width: 2, height: 2 };
  const scene = new Scene();
  scene.set('a', { x: 0, y: 0, w: 10, h: 10 });
  scene.set('b', { x: 0, y: 0, w: 10, h: 10, texture, version: 1 });
  scene.pack();

  scene.set('b', { x: 3, y: 0, w: 10, h: 10, texture, version: 1 });
  let packed = scene.pack();
  assert.deepEqual(packed.dirty, [1, 2]);
  assert.deepEqual(packed.uploads, []);
  assert.equal(packed.instances[STRIDE + FIELD.x], 3);

  scene.set('b', { x: 3, y: 0, w: 10, h: 10, texture, version: 2 });
  assert.deepEqual(scene.pack().uploads, [[1, texture]], 'a new version re-uploads in place');

  scene.set('c', { x: 0, y: 0, w: 1, h: 1, texture });
  packed = scene.pack();
  assert.deepEqual([packed.uploads, packed.batches.length], [[], 2], 'one texture, one batch');
  scene.delete('b');
  assert.deepEqual(scene.pack().drops, []);
  scene.delete('c');
  assert.deepEqual(scene.pack().drops, [1]);

  for (let i = 0; i < 200; i += 1) scene.set(i, { x: i, y: 0, w: 1, h: 1 });
  packed = scene.pack();
  assert.equal(packed.count, 201);
  assert.ok(packed.instances.length >= 201 * STRIDE, 'the array grows to fit');
});

test('scene - a texture let go and taken again before pack is kept; one never sent is never dropped', () => {
  const texture = { width: 2, height: 2 };
  const scene = new Scene();
  scene.set('a', { x: 0, y: 0, w: 1, h: 1, texture });
  scene.pack();
  scene.delete('a');
  scene.set('a', { x: 0, y: 0, w: 1, h: 1, texture });
  const packed = scene.pack();
  assert.deepEqual([packed.uploads, packed.drops, packed.batches[0].texture], [[], [], 1], 'a restart re-sends nothing');

  const fresh = { width: 1, height: 1 };
  scene.set('b', { x: 0, y: 0, w: 1, h: 1, texture: fresh });
  scene.delete('b');
  assert.deepEqual([scene.pack().uploads, scene.pack().drops], [[], []], 'never uploaded, nothing to drop');
});

test('scene - meshes: their own batches in z order between quad runs, geometry counted, a move updated in place', () => {
  const geometry = { vertices: new Float32Array(18), indices: Uint16Array.of(0, 1, 2) };
  const scene = new Scene();
  scene.set('under', { x: 0, y: 0, w: 1, h: 1 });
  scene.set('solid', { mesh: geometry, transform: [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 5, 6, 7, 1], z: 1, color: [1, 0, 0, 1] });
  scene.set('twin', { mesh: geometry, z: 1, lit: false });
  scene.set('over', { x: 0, y: 0, w: 1, h: 1, z: 2 });
  let packed = scene.pack();
  assert.equal(packed.count, 2, 'meshes take no instance slots');
  assert.deepEqual(packed.meshUploads, [[1, geometry]], 'one geometry, uploaded once');
  assert.deepEqual(packed.batches.map((batch) => ('mesh' in batch ? `mesh${batch.mesh}` : `quads@${batch.first}`)),
    ['quads@0', 'mesh1', 'mesh1', 'quads@1']);
  const solid = packed.batches[1];
  assert.deepEqual(Array.from(solid.normal, (v) => v + 0), [0.5, 0, 0, 0, 0.5, 0, 0, 0, 0.5]);
  assert.deepEqual([solid.lit, packed.batches[2].lit], [true, false]);

  scene.set('solid', { mesh: geometry, transform: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 9, 9, 9, 1], z: 1 });
  packed = scene.pack();
  assert.equal(packed.dirty, null, 'no quad moved');
  assert.equal(packed.batches[1], solid, 'the same batch, updated in place');
  assert.deepEqual(Array.from(solid.transform.slice(12)), [9, 9, 9, 1]);

  scene.delete('solid');
  scene.delete('twin');
  assert.deepEqual(scene.pack().meshDrops, [1]);
});

test('scene - erasing quads run apart from painting ones, flagged; turning erase on re-cuts the runs', () => {
  const scene = new Scene();
  scene.set('a', { x: 0, y: 0, w: 1, h: 1 });
  scene.set('b', { x: 0, y: 0, w: 1, h: 1, erase: true });
  scene.set('c', { x: 0, y: 0, w: 1, h: 1, erase: true });
  assert.deepEqual(scene.pack().batches, [{ texture: null, first: 0, count: 1 }, { texture: null, first: 1, count: 2, erase: true }]);
  scene.set('a', { x: 0, y: 0, w: 1, h: 1, erase: true });
  assert.deepEqual(scene.pack().batches, [{ texture: null, first: 0, count: 3, erase: true }]);
});

test('normalMatrix - the inverse transpose of the upper 3x3: a rotation keeps its own, a scale inverts', () => {
  const turn = [0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 3, 4, 5, 1];
  assert.deepEqual(Array.from(normalMatrix(turn)).map((v) => +v.toFixed(6) || 0), [0, 1, 0, -1, 0, 0, 0, 0, 1]);
  assert.deepEqual(Array.from(normalMatrix([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])), new Array(9).fill(0));
});

test('clipMatrix - a canvas point lands on the pixel camera.project names, depth inside either range', () => {
  const host = { width: 800, height: 600 };
  const camera = new Camera({ x: 10, y: 20, scale: 0.8, perspective: 1200, rotateX: -15, rotateY: 30 });
  for (const depthRange of ['minus-one-to-one', 'zero-to-one']) {
    const m = clipMatrix(camera, host, depthRange);
    for (const [px, py] of [[0, 0], [200, 150], [-50, 400]]) {
      const w = m[3] * px + m[7] * py + m[15];
      const ndc = [0, 1, 2].map((row) => (m[row] * px + m[4 + row] * py + m[12 + row]) / w);
      const at = camera.project(px, py, host);
      assert.ok(close(ndc[0], at.x / 400 - 1) && close(ndc[1], 1 - at.y / 300), `${depthRange}: (${px}, ${py}) disagrees`);
      assert.ok(depthRange === 'zero-to-one' ? ndc[2] >= 0 && ndc[2] <= 1 : ndc[2] >= -1 && ndc[2] <= 1);
    }
  }
  assert.deepEqual(Array.from(clipMatrix(new Camera(), { width: 200, height: 100 })), [
    0.01, 0, 0, 0, 0, -0.02, 0, 0, 0, 0, -1 / 8000, 0, -1, 1, 0, 1
  ].map(Math.fround));
});

test('parseTint - short, long and alpha hex; anything else is white', () => {
  assert.deepEqual(parseTint('#f00'), [1, 0, 0, 1]);
  assert.deepEqual(parseTint('00ff00'), [0, 1, 0, 1]);
  assert.deepEqual(parseTint('#0000ff80'), [0, 0, 1, 128 / 255]);
  assert.deepEqual(parseTint('red'), [1, 1, 1, 1]);
  assert.deepEqual(parseTint(null), [1, 1, 1, 1]);
});

/** A backend that records every call. */
function recorder() {
  const calls = [];
  const backend = {
    kind: 'recorder', depthRange: 'minus-one-to-one',
    texture: (id, source) => calls.push(['texture', id, source]),
    dropTexture: (id) => calls.push(['drop', id]),
    mesh: (id, geometry) => calls.push(['mesh', id, geometry]),
    dropMesh: (id) => calls.push(['dropMesh', id]),
    draw: (frame) => calls.push(['draw', {
      count: frame.count, dirty: frame.dirty,
      batches: frame.batches.map((batch) => ('mesh' in batch ? { ...batch, transform: Array.from(batch.transform) } : { ...batch })),
      boxes: Array.from({ length: frame.count }, (_, slot) => Array.from(frame.instances.slice(slot * STRIDE, slot * STRIDE + 4))),
      tints: Array.from({ length: frame.count }, (_, slot) => Array.from(frame.instances.slice(slot * STRIDE + FIELD.r, slot * STRIDE + FIELD.a + 1)))
    }]),
    read: async () => ({ width: 1, height: 1, data: new Uint8Array(4) }),
    destroy: () => calls.push(['destroy'])
  };
  const draws = () => calls.filter(([kind]) => kind === 'draw').map(([, frame]) => frame);
  return { calls, draws, create: async () => backend };
}

async function gpuScene(t) {
  const scene = coreScene(t);
  const rec = recorder();
  const controller = gpu(scene.app, { backend: rec.create });
  assert.equal(await controller.ready, 'recorder');
  runFrame(scene.root, 1);
  return { ...scene, rec, controller };
}

test('gpu - a canvas under the plane; a gpu blit draws its tint at its box and stays a transparent proxy', async (t) => {
  const { app, root, host, rec, controller } = await gpuScene(t);
  const canvas = host.querySelector(`[${GPU_ATTR}]`);
  assert.equal(controller.canvas, canvas);
  assert.equal(canvas.nextElementSibling, root.plane, 'under the plane');
  assert.equal(canvas.getAttribute('aria-hidden'), 'true');
  assert.equal(canvas.style.pointerEvents, 'none');
  assert.equal(gpu(app), controller, 'one controller per root');

  const card = app.blit({ x: 40, y: 30, w: 100, h: 50, port: 'gpu', tint: '#ff000080' });
  runFrame(root, 1);
  const frame = rec.draws().at(-1);
  assert.equal(frame.count, 1);
  assert.deepEqual(frame.boxes[0], [40, 30, 100, 50]);
  assert.deepEqual(frame.tints[0].map((v) => +v.toFixed(3)), [1, 0, 0, +(128 / 255).toFixed(3)]);
  assert.equal(card.el.style.opacity, '0');
  assert.equal(card.el.style.transform, 'translate3d(40.00px, 30.00px, 0.00px)', 'the proxy is placed like any blit');
});

test('gpu - idle when nothing drawn changed; a move draws one dirty slot; a camera move redraws', async (t) => {
  const { app, root, rec } = await gpuScene(t);
  app.blit({ x: 0, y: 0, w: 10, h: 10, port: 'gpu' });
  const moving = app.blit({ x: 20, y: 0, w: 10, h: 10, port: 'gpu' });
  runFrame(root, 1);
  const before = rec.draws().length;

  runFrame(root, 1);
  assert.equal(rec.draws().length, before, 'a still frame draws nothing');

  moving.set({ x: 25 });
  runFrame(root, 1);
  assert.deepEqual(rec.draws().at(-1).dirty, [1, 2]);
  assert.deepEqual(rec.draws().at(-1).boxes[1], [25, 0, 10, 10]);

  root.camera.panBy(5, 0);
  runFrame(root, 1);
  assert.equal(rec.draws().length, before + 2);
  assert.equal(rec.draws().at(-1).dirty, null, 'the camera moved, no instance did');
});

test('gpu - leaving the port, the root or the view lets a blit go; returning brings it back', async (t) => {
  const { app, root, rec } = await gpuScene(t);
  const branch = app.blit({ x: 0, y: 0, w: 200, h: 200 });
  const inside = branch.blit({ x: 10, y: 10, w: 20, h: 20, port: 'gpu' });
  const other = app.blit({ x: 300, y: 0, w: 50, h: 50 });
  const outside = other.blit({ x: 5, y: 5, w: 20, h: 20, port: 'gpu' });
  runFrame(root, 1);
  assert.equal(rec.draws().at(-1).count, 2);

  // A nested blit is re-read when its parent moves.
  branch.set({ x: 100 });
  runFrame(root, 1);
  assert.deepEqual(rec.draws().at(-1).boxes.find((box) => box[1] === 10), [110, 10, 20, 20]);

  app.root = branch;
  runFrame(root, 1);
  assert.equal(rec.draws().at(-1).count, 1, 'a demoted branch is not drawn');
  assert.equal(outside.el.style.opacity, '0', 'but it is still a member');
  app.root = null;
  runFrame(root, 1);
  assert.equal(rec.draws().at(-1).count, 2, 'back in view, drawn again');

  outside.set({ port: null });
  runFrame(root, 1);
  assert.equal(rec.draws().at(-1).count, 1);
  assert.equal(outside.el.style.opacity, '', 'off the port, visible again');

  inside.remove();
  runFrame(root, 1);
  assert.equal(rec.draws().at(-1).count, 0);
});

test('gpu - content: a texture uploads once and drops with its last blit; destroy restores every proxy', async (t) => {
  const { app, root, host, rec, controller } = await gpuScene(t);
  const image = { width: 4, height: 4 };
  const sprite = app.blit({ x: 0, y: 0, w: 32, h: 32, port: 'gpu' });
  gpuContent(sprite, { texture: image, uv: [0, 0, 0.5, 1] });
  runFrame(root, 1);
  assert.deepEqual(rec.calls.filter(([kind]) => kind === 'texture'), [['texture', 1, image]]);
  assert.deepEqual(rec.draws().at(-1).batches, [{ texture: 1, first: 0, count: 1 }]);

  gpuContent(sprite, null);
  runFrame(root, 1);
  assert.deepEqual(rec.calls.filter(([kind]) => kind === 'drop'), [['drop', 1]]);

  controller.destroy();
  assert.equal(sprite.el.style.opacity, '');
  assert.equal(host.querySelector(`[${GPU_ATTR}]`), null);
  assert.deepEqual(rec.calls.at(-1), ['destroy']);
  assert.notEqual(gpu(app), controller, 'a destroyed root can draw again');
});

test('gpu - with no backend the promise rejects, the canvas goes, and gpu blits stay proxies', async (t) => {
  const { app } = coreScene(t);
  const controller = gpu(app, { backend: async () => { throw new Error('no device'); } });
  await assert.rejects(controller.ready, /no backend available/);
  assert.equal(controller.canvas, null);
  assert.equal(controller.kind, null);
  assert.throws(() => gpu(app.blit({})), /expected a root/);
});

test('gpu - a backend that throws costs that frame, never the root\'s loop', async (t) => {
  const { app, root } = coreScene(t);
  const rec = recorder();
  let failing = true;
  const controller = gpu(app, {
    backend: async (canvas) => {
      const backend = await rec.create(canvas);
      return { ...backend, texture: (id, source) => { if (failing) throw new Error('tainted'); backend.texture(id, source); } };
    }
  });
  await controller.ready;
  const sprite = app.blit({ x: 0, y: 0, w: 8, h: 8, port: 'gpu' });
  gpuContent(sprite, { texture: { width: 1, height: 1 } });
  assert.doesNotThrow(() => runFrame(root, 1));
  failing = false;
  sprite.set({ x: 4 });
  runFrame(root, 1);
  assert.deepEqual(rec.draws().at(-1).boxes[0], [4, 0, 8, 8], 'the next frame draws');
});

/** A backend factory whose backends can be told their GPU is gone: each has a recorder of its own. */
function losable() {
  const made = [];
  const create = async (canvas) => {
    const rec = recorder();
    let gone;
    const lost = new Promise((resolve) => { gone = resolve; });
    made.push({ rec, canvas, gone });
    return { ...(await rec.create(canvas)), lost };
  };
  return { made, create };
}

/** Let the loss be heard and the next backend load: both are a few promise turns. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('gpu - a backend that loses its GPU is replaced on a fresh canvas, and the scene is sent again', async (t) => {
  const { app, root } = coreScene(t);
  const { made, create } = losable();
  const controller = gpu(app, { backend: create });
  await controller.ready;
  const texture = { width: 1, height: 1 };
  const sprite = app.blit({ x: 2, y: 3, w: 8, h: 8, port: 'gpu' });
  gpuContent(sprite, { texture });
  const plain = app.blit({ x: 20, y: 0, w: 4, h: 4, port: 'gpu' });
  runFrame(root, 1);
  assert.equal(made[0].rec.draws().at(-1).count, 2);

  made[0].gone('context lost');
  await settle();
  assert.equal(made.length, 2, 'another backend was made');
  assert.ok(made[0].rec.calls.some(([kind]) => kind === 'destroy'), 'the lost one was destroyed');
  assert.equal(made[0].canvas.isConnected, false, 'its canvas is gone');
  assert.equal(controller.canvas, made[1].canvas);
  assert.equal(controller.kind, 'recorder');

  runFrame(root, 1);
  const frame = made[1].rec.draws().at(-1);
  assert.equal(frame.count, 2, 'every member is drawn by the new backend');
  assert.deepEqual(frame.boxes.find((box) => box[0] === 2), [2, 3, 8, 8]);
  assert.ok(made[1].rec.calls.some(([kind, , source]) => kind === 'texture' && source === texture), 'its texture is uploaded again');
  assert.equal(sprite.el.style.opacity, '0', 'the element is still the proxy');
  plain.set({ x: 30 });
  runFrame(root, 1);
  assert.ok(made[1].rec.draws().at(-1).boxes.some((box) => box[0] === 30), 'and it goes on drawing changes');
});

test('gpu - a GPU that keeps going is left alone after three restarts in a row', async (t) => {
  const { app, root } = coreScene(t);
  const { made, create } = losable();
  const controller = gpu(app, { backend: create });
  await controller.ready;
  app.blit({ x: 0, y: 0, w: 8, h: 8, port: 'gpu' });
  for (let k = 0; k < 6 && made[k]; k += 1) {
    made[k].gone('context lost');
    await settle();
  }
  assert.equal(made.length, 4, 'the first and three more');
  assert.equal(controller.kind, null);
  assert.doesNotThrow(() => runFrame(root, 1));
});

test('gpu - a backend lost after the root is destroyed starts nothing', async (t) => {
  const { app } = coreScene(t);
  const { made, create } = losable();
  const controller = gpu(app, { backend: create });
  await controller.ready;
  controller.destroy();
  made[0].gone('context lost');
  await settle();
  assert.equal(made.length, 1);
});

test('gpu - destroyed while the backend loads: no canvas left, and the late backend is released', async (t) => {
  const { app, host } = coreScene(t);
  const rec = recorder();
  const controller = gpu(app, { backend: rec.create });
  controller.destroy();
  assert.equal(controller.canvas, null);
  assert.equal(host.querySelector(`[${GPU_ATTR}]`), null);
  await controller.ready;
  assert.deepEqual(rec.calls, [['destroy']]);
});

/** A mat4 (column-major) applied to a point. */
const apply = (m, [x, y, z]) => [0, 1, 2].map((row) => m[row] * x + m[4 + row] * y + m[8 + row] * z + m[12 + row]);
const near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9);

test('meshTransform - a unit shape fills the box and its depth; a turn is about the centre; a viewBox maps onto the box', () => {
  const box = { x: 10, y: 20, w: 40, h: 20 };
  const fitted = meshTransform(box, 5, {});
  assert.ok(near(apply(fitted, [0.5, 0.5, 0.5]), [50, 40, 15]), 'the depth defaults to the smaller side');
  assert.ok(near(apply(fitted, [-0.5, -0.5, 0]), [10, 20, 5]));
  const turned = meshTransform(box, 0, { rotate: [0, 0, 90], depth: 8 });
  assert.ok(near(apply(turned, [0.5, 0, 0]), [30, 50, 0]), 'x turns onto y, about the centre (30, 30)');
  const mapped = meshTransform({ x: 100, y: 0, w: 48, h: 48 }, 2, { viewBox: [0, 0, 24, 24] });
  assert.ok(near(apply(mapped, [12, 12, 0]), [124, 24, 2]));
});

test('gpu - parts: a mesh and a quad from one blit, in order, the mesh fitted and uploaded once', async (t) => {
  const { app, root, rec } = await gpuScene(t);
  const geometry = geometryOf('box');
  const a = app.blit({ x: 0, y: 0, w: 10, h: 10, port: 'gpu', tint: '#00ff00' });
  gpuContent(a, [{ mesh: geometry }, { color: [1, 0, 0, 1] }]);
  const b = app.blit({ x: 50, y: 0, w: 10, h: 10, port: 'gpu' });
  gpuContent(b, { mesh: geometry, lit: false });
  runFrame(root, 1);
  const frame = rec.draws().at(-1);
  assert.deepEqual(frame.batches.map((batch) => ('mesh' in batch ? 'mesh' : 'quads')), ['mesh', 'quads', 'mesh']);
  assert.deepEqual(frame.batches[0].color.map((v) => +v.toFixed(3)), [0, 1, 0, 1], 'a mesh without colour takes the tint');
  assert.ok(near(apply(frame.batches[2].transform, [0, 0, 0]), [55, 5, 0]));
  assert.equal(frame.batches[2].lit, false);
  assert.equal(rec.calls.filter(([kind]) => kind === 'mesh').length, 1, 'one geometry, one upload');

  gpuContent(a, null);
  runFrame(root, 1);
  assert.deepEqual(rec.draws().at(-1).batches.map((batch) => ('mesh' in batch ? 'mesh' : 'quads')), ['quads', 'mesh']);
});

test('mesh - the trait draws a shared shape, turned; removing it draws the tint again', async (t) => {
  blit.use({ mesh });
  const { app, root, rec } = await gpuScene(t);
  const cube = app.blit({ x: 0, y: 0, w: 20, h: 20, port: 'gpu', mesh: { shape: 'box', rotate: [0, 45, 0], depth: 10 } });
  const ball = app.blit({ x: 40, y: 0, w: 20, h: 20, port: 'gpu', mesh: { shape: 'sphere' } });
  runFrame(root, 1);
  const meshes = rec.draws().at(-1).batches.filter((batch) => 'mesh' in batch);
  assert.equal(meshes.length, 2);
  assert.notEqual(meshes[0].mesh, meshes[1].mesh, 'a box and a sphere: two geometries');
  assert.ok(near(apply(meshes[0].transform, [0, 0, 0]), [10, 10, 0]));
  cube.set({ mesh: false });
  runFrame(root, 1);
  assert.equal(rec.draws().at(-1).batches.filter((batch) => 'mesh' in batch).length, 1);
  assert.equal(rec.draws().at(-1).count, 1, 'the cube is a quad again');
  assert.ok(ball);
});

test('svg-path - fill then stroke as two unlit parts over the viewBox; the inline svg is the DOM fallback', async (t) => {
  blit.use({ svgPath });
  const { app, root, rec } = await gpuScene(t);
  const shape = app.blit({
    x: 100, y: 0, w: 48, h: 48, port: 'gpu', tint: '#00ff00',
    svgPath: { d: 'M0 0 H24 V24 H0 Z', viewBox: [0, 0, 24, 24], stroke: '#0000ff', strokeWidth: 2 }
  });
  runFrame(root, 1);
  const [fill, stroke] = rec.draws().at(-1).batches;
  assert.deepEqual([fill.lit, stroke.lit], [false, false]);
  assert.deepEqual(fill.color.map((v) => +v.toFixed(3)), [0, 1, 0, 1], 'fill: true takes the tint');
  assert.deepEqual(stroke.color, [0, 0, 1, 1]);
  assert.ok(near(apply(fill.transform, [24, 24, 0]), [148, 48, 0]), 'the viewBox maps onto the box');
  const path = shape.el.querySelector(`[${SVG_PATH_ATTR}] path`);
  assert.deepEqual([path.getAttribute('d'), path.getAttribute('stroke')], ['M0 0 H24 V24 H0 Z', '#0000ff']);

  shape.set({ svgPath: { d: 'M0 0 L', viewBox: [0, 0, 24, 24] } });
  runFrame(root, 1);
  assert.equal(shape.el.querySelector(`[${SVG_PATH_ATTR}]`), null, 'bad path data draws nothing and adds nothing');
  shape.set({ svgPath: { d: '', viewBox: [0, 0, 24, 24] } });
  runFrame(root, 1);
  assert.equal(rec.draws().at(-1).batches.length, 0, 'an empty path draws nothing, not the tint');
});

test('punch - a DOM blit becomes an erasing quad at its box and z, follows its moves, stays visible, and lets go', async (t) => {
  blit.use({ punch });
  const { app, root, rec } = await gpuScene(t);
  app.blit({ x: 0, y: 0, w: 400, h: 300, port: 'gpu', tint: '#ff0000' });
  const card = app.blit({ x: 40, y: 30, w: 100, h: 60, z: 1, punch: true });
  runFrame(root, 1);
  let frame = rec.draws().at(-1);
  assert.deepEqual(frame.batches, [{ texture: null, first: 0, count: 1 }, { texture: null, first: 1, count: 1, erase: true }]);
  assert.deepEqual(frame.boxes[1], [40, 30, 100, 60]);
  assert.equal(card.el.style.opacity, '', 'a punch is the DOM itself, never a proxy');

  card.set({ x: 50 });
  runFrame(root, 1);
  assert.deepEqual(rec.draws().at(-1).boxes[1], [50, 30, 100, 60], 'it moves without the port');

  card.set({ punch: false });
  runFrame(root, 1);
  frame = rec.draws().at(-1);
  assert.deepEqual([frame.count, frame.batches.length], [1, 1]);
});

test('paintedProxy - a gpu blit whose element must stay painted keeps its opacity; turned off, it is a proxy again', async (t) => {
  const { app, root } = await gpuScene(t);
  const card = app.blit({ x: 0, y: 0, w: 10, h: 10, port: 'gpu' });
  runFrame(root, 1);
  assert.equal(card.el.style.opacity, '0');
  paintedProxy(card);
  assert.equal(card.el.style.opacity, '', 'restored at once');
  card.set({ x: 1 });
  runFrame(root, 1);
  assert.equal(card.el.style.opacity, '', 'and kept painted');
  paintedProxy(card, false);
  runFrame(root, 1);
  assert.equal(card.el.style.opacity, '0');
  assert.throws(() => paintedProxy({ el: document.createElement('div') }), /not a blit/);
});

test('gpu - a blit hidden by hand or taken out without remove() stops drawing at the next frame', async (t) => {
  const { app, root, rec } = await gpuScene(t);
  const hidden = app.blit({ x: 0, y: 0, w: 10, h: 10, port: 'gpu' });
  const taken = app.blit({ x: 20, y: 0, w: 10, h: 10, port: 'gpu' });
  app.blit({ x: 40, y: 0, w: 10, h: 10, port: 'gpu' });
  runFrame(root, 1);
  assert.equal(rec.draws().at(-1).count, 3);
  hidden.el.hidden = true;
  taken.el.remove();
  await Promise.resolve();
  runFrame(root, 1);
  assert.equal(rec.draws().at(-1).count, 1, 'the observer marked a sweep');
  hidden.el.hidden = false;
  await Promise.resolve();
  runFrame(root, 1);
  assert.equal(rec.draws().at(-1).count, 2, 'shown again, drawn again');
});

test('gpu - a gpu child of a flow container keeps drawing, stays a proxy, and saves as gpu, not flow', async (t) => {
  blit.use({ layout });
  const { app, root, rec } = await gpuScene(t);
  const row = app.blit({ x: 10, y: 10, w: 200, h: 40, layout: 'row' });
  const a = row.blit({ w: 20, h: 20, port: 'gpu', tint: '#ff0000' });
  const b = row.blit({ w: 20, h: 20, port: 'gpu', tint: '#00ff00' });
  runFrame(root, 1);
  runFrame(root, 1);
  assert.equal(rec.draws().at(-1).count, 2, 'both flow children draw');
  assert.equal(a.el.style.opacity, '0');
  assert.equal(a.el.style.transform, '', 'the layout places it: no transform');
  assert.equal(a.spec.port, 'gpu', 'saved by the port it holds');
  row.set({ layout: 'free' });
  runFrame(root, 1);
  assert.equal(b.spec.port, 'gpu');
  assert.match(b.el.style.transform, /translate3d/, 'back on its own port, placed again');
  assert.equal(rec.draws().at(-1).count, 2);
});

test('gpu - destroyed while auto is still importing backends: nothing is mounted afterwards', async (t) => {
  const { app, host } = coreScene(t);
  const controller = gpu(app, { backend: 'auto' });
  controller.destroy();
  await assert.rejects(controller.ready, /destroyed while loading/);
  assert.equal(host.querySelectorAll(`[${GPU_ATTR}]`).length, 0, 'no orphan canvas');
  const again = gpu(app, { backend: async () => ({ kind: 'x', depthRange: 'minus-one-to-one', destroy() {} }) });
  await again.ready;
  assert.equal(host.querySelectorAll(`[${GPU_ATTR}]`).length, 1, 'a new gpu root has exactly one');
});
