/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The sprites add-on: a frame is the sheet's texture and its uv rect on the GPU, and the same frame as the
 * element's CSS background; an animation steps at its own fps on the root's one ticker, keeps the loop awake only
 * while it plays, and a one-shot emits `sprite:end`; a sheet's URL is guarded and escaped.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { needsFrame, runFrame } from 'cloudcanvas/testing';
import { gpu } from '../../plugins/gpu.js';
import { STRIDE, FIELD } from '../../plugins/gpu-scene.js';
import { MAX_SPRITE_FRAMES, sheet, sprite } from '../../plugins/sprites.js';
import { coreScene } from '../helpers/core-scene.js';

blit.use({ sprite });

/** A backend that keeps the last frame. */
function lastFrame() {
  const seen = { frame: null, textures: [] };
  const create = async () => ({
    kind: 'recorder', depthRange: 'minus-one-to-one',
    texture: (id, source) => seen.textures.push([id, source]), dropTexture() {}, mesh() {}, dropMesh() {},
    draw: (frame) => { seen.frame = { ...frame, instances: Array.from(frame.instances.slice(0, frame.count * STRIDE)) }; },
    read: async () => ({ width: 0, height: 0, data: new Uint8Array() }), destroy() {}
  });
  return { seen, create };
}

const uvOf = (frame, slot = 0) => frame.instances.slice(slot * STRIDE + FIELD.u0, slot * STRIDE + FIELD.v1 + 1);
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('sheet - a grid cuts frames row by row; a bad URL is refused; lookup by name', async () => {
  const record = sheet('grid-sheet', { image: { width: 96, height: 64 }, grid: { w: 32 } });
  await record.ready;
  assert.equal(sheet('grid-sheet'), record);
  assert.equal(sheet('nothing-here'), null);
  assert.deepEqual([record.width, record.height, record.frames.size], [96, 64, 6]);
  assert.deepEqual(record.frames.get('4'), [32, 32, 32, 32]);
  assert.throws(() => sheet('bad', { src: 'javascript:alert(1)' }), /not a safe image URL/);
  assert.throws(() => sheet('none', {}), /needs a src or an image/);
});

test('sprite - a frame is the sheet texture and its uv rect on the GPU, and the same frame as a CSS background', async (t) => {
  const image = { width: 64, height: 32 };
  sheet('icons', { src: 'https://cdn.example/icons".png', image, frames: { a: [0, 0, 32, 32], b: [32, 0, 32, 32] } });
  const { app, root } = coreScene(t);
  const { seen, create } = lastFrame();
  await gpu(app, { backend: create }).ready;
  const icon = app.blit({ x: 0, y: 0, w: 64, h: 64, port: 'gpu', sprite: { sheet: 'icons', frame: 'b' } });
  await settle();
  runFrame(root, 1);

  assert.deepEqual(uvOf(seen.frame), [0.5, 0, 1, 1]);
  assert.deepEqual(seen.textures, [[1, image]]);
  assert.equal(icon.el.style.backgroundImage, 'url("https://cdn.example/icons\\".png")', 'the quote is escaped');
  assert.equal(icon.el.style.backgroundPosition, '-64px 0px');
  assert.equal(icon.el.style.backgroundSize, '128px 64px');

  icon.set({ sprite: { sheet: 'icons', frame: 'a' } });
  await settle();
  runFrame(root, 1);
  assert.deepEqual(uvOf(seen.frame), [0, 0, 0.5, 1]);
  assert.deepEqual(seen.textures, [[1, image]], 'a new frame is a new uv, never a new upload');

  icon.set({ sprite: false });
  assert.equal(icon.el.style.backgroundImage, '');
});

test('sprite - an animation steps at its fps on one ticker, keeps the loop awake while it plays, and a one-shot ends', async (t) => {
  sheet('runner', {
    image: { width: 128, height: 32 }, grid: { w: 32 },
    animations: { run: { frames: [0, 1, 2, 3], fps: 30 }, once: { frames: [0, 1], fps: 30, loop: false } }
  });
  const { app, root } = coreScene(t);
  const { seen, create } = lastFrame();
  await gpu(app, { backend: create }).ready;
  const hero = app.blit({ x: 0, y: 0, w: 32, h: 32, port: 'gpu', sprite: { sheet: 'runner', play: 'run' } });
  await settle();
  runFrame(root, 1);
  assert.deepEqual(uvOf(seen.frame), [0, 0, 0.25, 1]);
  assert.equal(needsFrame(root), true, 'playing keeps the loop awake');

  runFrame(root, 1);
  runFrame(root, 1);
  assert.deepEqual(uvOf(seen.frame), [0.25, 0, 0.5, 1], 'two 60Hz frames are one 30fps step');

  const ended = [];
  hero.on('sprite:end', (event) => ended.push(event.detail.payload.animation));
  hero.set({ sprite: { sheet: 'runner', play: 'once' } });
  await settle();
  for (let i = 0; i < 6; i += 1) runFrame(root, 1);
  assert.deepEqual(ended, ['once']);
  root.dirty.clear();
  assert.equal(needsFrame(root), false, 'nothing plays: the loop may sleep');
});

test('sprite - a sheet carried inline is registered once per definition; a bad URL is refused', (t) => {
  const { app } = coreScene(t);
  const inline = { src: 'data:image/png;base64,AAAA', grid: { w: 16 } };
  const key = `inline:${JSON.stringify({ src: inline.src, grid: inline.grid })}`;
  app.blit({ x: 0, y: 0, w: 16, h: 16, sprite: { ...inline, frame: 1 } });
  const first = sheet(key);
  assert.ok(first, 'registered under its definition');
  app.blit({ x: 20, y: 0, w: 16, h: 16, sprite: { ...inline, frame: 0 } });
  assert.equal(sheet(key), first, 'the same definition, the same sheet');
  const bad = app.blit({ sprite: { src: 'javascript:alert(1)', grid: { w: 16 } } });
  assert.equal(sheet(`inline:${JSON.stringify({ src: 'javascript:alert(1)', grid: { w: 16 } })}`), null);
  assert.equal(bad.el.style.backgroundImage, '');
});

test('sprite - an inline sheet goes with the last sprite using it', (t) => {
  const { app } = coreScene(t);
  const inline = { src: 'data:image/png;base64,BBBB', grid: { w: 8 } };
  const key = `inline:${JSON.stringify({ src: inline.src, grid: inline.grid })}`;
  const a = app.blit({ sprite: { ...inline, frame: 0 } });
  const b = app.blit({ sprite: { ...inline, frame: 1 } });
  a.remove();
  assert.ok(sheet(key), 'one sprite still uses it');
  b.set({ sprite: false });
  assert.equal(sheet(key), null, 'the last one let it go');
});

test('sheet - a grid is cut to at most MAX_SPRITE_FRAMES frames; an animation name is looked up as its own', async (t) => {
  const huge = sheet('huge-grid', { image: { width: 100000, height: 1000 }, grid: { w: 1 } });
  await huge.ready;
  assert.equal(huge.frames.size, MAX_SPRITE_FRAMES);
  const { app } = coreScene(t);
  sheet('named-anims', { image: { width: 32, height: 16 }, grid: { w: 16 }, animations: { walk: { frames: [0, 1] } } });
  const odd = app.blit({ sprite: { sheet: 'named-anims', play: 'constructor' } });
  await settle();
  assert.equal(odd.el.style.backgroundImage, '', 'no such animation: nothing plays, nothing throws');
});

test('sprite - a player on a hidden blit neither steps nor keeps the loop awake', async (t) => {
  sheet('hidden-runner', { image: { width: 64, height: 16 }, grid: { w: 16 }, animations: { run: { frames: [0, 1, 2, 3], fps: 60 } } });
  const { app, root } = coreScene(t);
  const { seen, create } = lastFrame();
  await gpu(app, { backend: create }).ready;
  const runner = app.blit({ w: 16, h: 16, port: 'gpu', sprite: { sheet: 'hidden-runner', play: 'run' } });
  await settle();
  runFrame(root, 1);
  assert.equal(needsFrame(root), true);
  runner.el.hidden = true;
  await Promise.resolve();
  runFrame(root, 1);
  root.dirty.clear();
  assert.equal(needsFrame(root), false, 'hidden, the loop may sleep');
  assert.ok(seen);
});
