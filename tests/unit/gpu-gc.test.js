/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Garbage: a thousand gpu blits with content, removed, leave nothing behind once a frame has swept - no member,
 * record, part key, content or texture holds their element - and a destroyed gpu root is collectable too.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import v8 from 'node:v8';
import vm from 'node:vm';
import { runFrame } from 'cloudcanvas/testing';
import { gpu, gpuContent } from '../../plugins/gpu.js';
import { coreScene } from '../helpers/core-scene.js';

v8.setFlagsFromString('--expose-gc');
const collect = vm.runInNewContext('gc');

/** Collect until the weak references settle (finalisation is not immediate). */
async function settle() {
  for (let i = 0; i < 6; i += 1) {
    collect();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

const backend = async () => ({
  kind: 'recorder', depthRange: 'minus-one-to-one', texture() {}, dropTexture() {}, mesh() {}, dropMesh() {},
  draw() {}, read: async () => ({}), destroy() {}
});

test('gc - removed gpu blits, their content and their textures are collectable after one sweeping frame', async (t) => {
  const { app, root } = coreScene(t);
  await gpu(app, { backend }).ready;
  const refs = [];
  (() => {
    for (let i = 0; i < 1000; i += 1) {
      const b = app.blit({ x: i, y: 0, w: 4, h: 4, port: 'gpu' });
      const texture = { width: 1, height: 1 };
      gpuContent(b, [{ texture }, { color: [1, 0, 0, 1] }]);
      refs.push(new WeakRef(b.el), new WeakRef(texture));
    }
  })();
  runFrame(root, 1);
  // In a function of its own: a suspended async frame can keep its loop's last value alive.
  (() => { for (const b of app.blits) b.remove(); })();
  runFrame(root, 1);
  await settle();
  const alive = refs.filter((ref) => ref.deref() !== undefined).length;
  assert.equal(alive, 0, `${alive} of ${refs.length} elements and textures still held`);
});

test('gc - a destroyed gpu root lets go of its canvas and scene', async (t) => {
  const { app, root } = coreScene(t);
  let canvasRef;
  (() => {
    const controller = gpu(app, { backend });
    canvasRef = new WeakRef(controller.canvas);
    for (let i = 0; i < 100; i += 1) app.blit({ x: i, y: 0, w: 4, h: 4, port: 'gpu' });
    runFrame(root, 1);
    controller.destroy();
  })();
  await settle();
  assert.equal(canvasRef.deref(), undefined, 'the canvas is collectable');
});
