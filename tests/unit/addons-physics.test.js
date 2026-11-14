/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The physics add-on: the drift field steps the blit in its root's read phase,
 * through `set()`, with the add-on's pure integration; `floatDrift: false`
 * holds it; stopping the trait leaves the frame.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { runFrame } from 'cloudcanvas/testing';
import { applyForce, driftForce, integrate, physics } from '../../plugins/physics.js';
import { coreScene } from '../helpers/core-scene.js';

blit.use({ physics });

test('physics - the drift field and the integration are pure functions of the body', () => {
  const s = { driftIntensity: 0.4 };
  const { fx, fy } = driftForce(s, 10, 20, 0, 1000);
  assert.equal(fx, Math.sin(2 + 0.1) * 0.4);
  assert.equal(fy, Math.cos(2 + 0.2) * 0.4);

  const body = { x: 0, y: 0, vx: 0, vy: 0, mass: 2, friction: 0.5, pinned: false };
  applyForce(body, 4, 2);
  integrate(body, 1);
  assert.deepEqual(body, { x: 2, y: 1, vx: 1, vy: 0.5, mass: 2, friction: 0.5, pinned: false });

  body.pinned = true;
  integrate(body, 1);
  assert.deepEqual([body.x, body.vx], [2, 0]);
});

test('physics - a blit drifts frame by frame in the read phase', (t) => {
  const { app, root } = coreScene(t);
  const card = app.blit({ x: 100, y: 100, physics: { driftIntensity: 5 } });
  assert.equal(root.hooks.read.size, 2, 'no read tick was registered');

  runFrame(root, 1);
  runFrame(root, 1);
  assert.notDeepEqual([card.x, card.y], [100, 100]);
  runFrame(root, 1);
  assert.match(card.el.style.transform, /translate3d/);
});

test('physics - floatDrift false holds the blit; stopping the trait leaves the read phase', (t) => {
  const { app, root } = coreScene(t);
  const card = app.blit({ x: 5, y: 5, physics: { floatDrift: false } });

  runFrame(root, 1);
  assert.deepEqual([card.x, card.y], [5, 5]);
  card.set({ physics: false });
  assert.equal(root.hooks.read.size, 1);
});
