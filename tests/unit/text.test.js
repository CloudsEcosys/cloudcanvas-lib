/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The text add-on: word wrap keeps hard breaks and never splits a word; the zoom rounds up to a power of two; the
 * trait rasters at the device ratio times that bucket, re-rasters (a new texture version) only when the size or
 * the bucket changes, and leaves the text in the element.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { runFrame } from 'cloudcanvas/testing';
import { gpu } from '../../plugins/gpu.js';
import { MAX_RASTER, text, wrapLines, zoomBucket } from '../../plugins/text.js';
import { coreScene } from '../helpers/core-scene.js';

blit.use({ text });

test('text maths - wrap by width, hard breaks kept; the zoom bucket is the next power of two, held to 1/4..8', () => {
  const measure = (line) => line.length * 10;
  assert.deepEqual(wrapLines('one two three four', 90, measure), ['one two', 'three', 'four']);
  assert.deepEqual(wrapLines('a\nb c', 1000, measure), ['a', 'b c']);
  assert.deepEqual(wrapLines('unbreakable', 20, measure), ['unbreakable'], 'a long word overflows, never splits');
  assert.deepEqual([0.3, 1, 1.01, 1.9, 2, 3, 100].map(zoomBucket), [0.5, 1, 2, 2, 2, 4, 8]);
  assert.equal(zoomBucket(0.01), 0.25);
});

test('text - rasters at ratio x bucket; re-rasters on a new bucket or size only; the element keeps the text', async (t) => {
  const { app, root } = coreScene(t);
  const uploads = [];
  await gpu(app, {
    backend: async () => ({
      kind: 'recorder', depthRange: 'minus-one-to-one', texture: (id, source) => uploads.push([source.width, source.height]),
      dropTexture() {}, mesh() {}, dropMesh() {}, draw() {}, read: async () => ({}), destroy() {}
    })
  }).ready;
  const label = app.blit({ x: 0, y: 0, w: 100, h: 20, port: 'gpu', text: { value: 'Hello', color: '#123456' } });
  runFrame(root, 1);
  assert.equal(label.el.textContent, 'Hello');
  assert.equal(label.el.querySelector('[data-blit-text]').style.whiteSpace, 'pre-wrap', 'styled on its own span');
  assert.deepEqual(uploads, [[100, 20]]);

  root.camera.setZoom(1.5);
  runFrame(root, 1);
  root.camera.setZoom(1.8);
  runFrame(root, 1);
  assert.deepEqual(uploads, [[100, 20], [200, 40]], 'one re-raster for the bucket 1 -> 2, none within it');

  label.set({ w: 50 });
  runFrame(root, 1);
  runFrame(root, 1);
  assert.deepEqual(uploads.at(-1), [100, 40], 'a new size re-rasters');

  root.camera.setZoom(8);
  label.set({ w: 1000, h: 1000 });
  runFrame(root, 1);
  runFrame(root, 1);
  assert.ok(uploads.at(-1)[0] <= MAX_RASTER, 'the raster is held to the texture limit');

  label.set({ text: false });
  assert.equal(label.el.querySelector('[data-blit-text]'), null, 'the trait takes back what it wrote');
});

test('text - writes into its own span: another trait\'s DOM in the element survives, before and after', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ w: 100, h: 20 });
  const grip = document.createElement('i');
  grip.className = 'handle';
  card.el.append(grip);
  card.set({ text: { value: 'One' } });
  card.set({ text: { value: 'Two' } });
  assert.equal(card.el.querySelector('.handle'), grip, 'a handle added before stays');
  assert.equal(card.el.querySelectorAll('[data-blit-text]').length, 1, 'a restart replaces its span');
  assert.equal(card.el.querySelector('[data-blit-text]').textContent, 'Two');
});
