/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The video and own-canvas add-ons: each fills its blit with an element (what shows without a GPU) and makes it
 * the blit's texture on a gpu root - a video re-sent per frame only while it plays and has data, a canvas after
 * each draw, again when its box changes size and on `redraw`; cleanup takes back what it made.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { needsFrame, runFrame } from 'cloudcanvas/testing';
import { gpu } from '../../plugins/gpu.js';
import { VIDEO_ATTR, video } from '../../plugins/video.js';
import { OWN_CANVAS_ATTR, ownCanvas, redraw } from '../../plugins/own-canvas.js';
import { coreScene } from '../helpers/core-scene.js';

blit.use({ video });

async function uploadsOn(t) {
  const scene = coreScene(t);
  const uploads = [];
  await gpu(scene.app, {
    backend: async () => ({
      kind: 'recorder', depthRange: 'minus-one-to-one', texture: (id, source) => uploads.push(source),
      dropTexture() {}, mesh() {}, dropMesh() {}, draw() {}, read: async () => ({}), destroy() {}
    })
  }).ready;
  return { ...scene, uploads };
}

test('own-canvas - draws scaled to its box, re-sent after each draw, again on a resize and on redraw; off removes it', async (t) => {
  const { app, root, uploads } = await uploadsOn(t);
  // happy-dom has no 2D context; a browser's is a real one.
  t.mock.method(HTMLCanvasElement.prototype, 'getContext', () => ({ setTransform() {} }));
  const chart = app.blit({ x: 0, y: 0, w: 120, h: 60, port: 'gpu' });
  const sizes = [];
  const off = ownCanvas(chart, (ctx, size) => sizes.push(size));
  runFrame(root, 1);
  const canvas = chart.el.querySelector(`[${OWN_CANVAS_ATTR}]`);
  assert.deepEqual(sizes, [{ w: 120, h: 60, ratio: 1 }]);
  assert.deepEqual([canvas.width, canvas.height], [120, 60]);
  assert.deepEqual(uploads, [canvas]);

  runFrame(root, 1);
  assert.equal(sizes.length, 1, 'a still box does not draw again');
  chart.set({ w: 200 });
  runFrame(root, 1);
  runFrame(root, 1);
  assert.deepEqual(sizes.at(-1), { w: 200, h: 60, ratio: 1 });
  assert.equal(redraw(chart), true);
  runFrame(root, 1);
  assert.equal(sizes.length, 3);
  assert.equal(uploads.length, 3, 'one upload per draw');

  ownCanvas(chart, () => {});
  assert.equal(chart.el.querySelectorAll(`[${OWN_CANVAS_ATTR}]`).length, 1, 'a second call replaces the first');
  off();
  assert.throws(() => ownCanvas(chart, 'draw'), /draw must be a function/);
  assert.equal(redraw(app.blit({})), false);
});

test('video - a muted video fills the blit; re-sent per frame only while it plays with data; cleanup removes it', async (t) => {
  const { app, root, uploads } = await uploadsOn(t);
  const clip = app.blit({ x: 0, y: 0, w: 160, h: 90, port: 'gpu', video: { src: 'https://cdn.example/clip.mp4', loop: true, autoplay: false } });
  const el = clip.el.querySelector(`[${VIDEO_ATTR}]`);
  assert.equal(el.getAttribute('src'), 'https://cdn.example/clip.mp4');
  assert.deepEqual([el.muted, el.loop, el.crossOrigin], [true, true, 'anonymous']);

  runFrame(root, 1);
  assert.equal(uploads.length, 0, 'no data yet, nothing sent');
  Object.defineProperties(el, { readyState: { value: 4, configurable: true }, paused: { value: false, configurable: true } });
  runFrame(root, 1);
  runFrame(root, 1);
  assert.deepEqual(uploads, [el, el], 'once per frame while playing');
  assert.equal(needsFrame(root), true, 'playing keeps the loop awake');
  Object.defineProperty(el, 'paused', { value: true, configurable: true });
  root.dirty.clear();
  assert.equal(needsFrame(root), false, 'paused, the loop may sleep');

  clip.set({ video: false });
  assert.equal(clip.el.querySelector('video'), null);
  const unsafe = app.blit({ video: { src: 'javascript:alert(1)', autoplay: false } });
  assert.equal(unsafe.el.querySelector('video').hasAttribute('src'), false);
});

test('own-canvas - a removed blit lets go of its drawing, off() called or not', async (t) => {
  const { app, root } = await uploadsOn(t);
  t.mock.method(HTMLCanvasElement.prototype, 'getContext', () => ({ setTransform() {} }));
  const chart = app.blit({ x: 0, y: 0, w: 40, h: 40, port: 'gpu' });
  let draws = 0;
  ownCanvas(chart, () => { draws += 1; });
  chart.remove();
  assert.equal(redraw(chart), false, 'nothing left to redraw');
  runFrame(root, 1);
  assert.equal(draws, 1);
});

test('own-canvas - removed with an ancestor, the drawing is let go too', async (t) => {
  const { app, root } = await uploadsOn(t);
  t.mock.method(HTMLCanvasElement.prototype, 'getContext', () => ({ setTransform() {} }));
  const panel = app.blit({ x: 0, y: 0, w: 100, h: 100 });
  const chart = panel.blit({ x: 0, y: 0, w: 40, h: 40, port: 'gpu' });
  let draws = 0;
  ownCanvas(chart, () => { draws += 1; });
  panel.remove();
  assert.equal(redraw(chart), false);
  runFrame(root, 1);
  assert.equal(draws, 1, 'never drawn again');
});
