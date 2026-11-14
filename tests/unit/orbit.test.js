/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The orbit add-on: Alt + drag (or a middle drag) turns the camera within its limit and gives a flat one a
 * perspective, pan never sees the press, Alt + wheel moves the viewer inside its range, and `level` lays the
 * board flat.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { runFrame } from 'cloudcanvas/testing';
import { pan } from '../../plugins/pan.js';
import { MENU_CLASS, menu } from '../../plugins/menu.js';
import {
  ORBIT_LIMIT, ORBIT_PERSPECTIVE, PERSPECTIVE_RANGE, dollyBy, isOrbitPress, level, orbit, orbitBy
} from '../../plugins/orbit.js';
import { Camera } from 'cloudcanvas/kernel';
import { coreScene, move, press, release } from '../helpers/core-scene.js';

blit.use({ pan, orbit });

test('orbit maths - a drag turns within the limit; a flat camera gains a perspective; the wheel stays in range', () => {
  const camera = new Camera();
  orbitBy(camera, 40, -20);
  assert.equal(camera.perspective, ORBIT_PERSPECTIVE);
  assert.deepEqual([camera.rotateY, camera.rotateX], [10, 5]);
  orbitBy(camera, 10000, 10000);
  assert.deepEqual([camera.rotateY, camera.rotateX], [ORBIT_LIMIT, -ORBIT_LIMIT]);

  dollyBy(camera, 1e6);
  assert.equal(camera.perspective, PERSPECTIVE_RANGE[1]);
  dollyBy(camera, -1e6);
  assert.equal(camera.perspective, PERSPECTIVE_RANGE[0]);

  assert.equal(isOrbitPress({ button: 0, altKey: true }), true);
  assert.equal(isOrbitPress({ button: 1 }), true);
  assert.equal(isOrbitPress({ button: 0, altKey: false }), false);
});

test('orbit - Alt + drag on the host turns the camera and pan never moves; a plain drag still pans', (t) => {
  const { app, host, root } = coreScene(t);
  app.set({ pan: true, orbit: { speed: 0.5 } });

  press(host, 100, 100, { altKey: true });
  move(140, 80);
  release(140, 80);
  assert.deepEqual([root.camera.rotateY, root.camera.rotateX], [20, 10]);
  assert.deepEqual([root.camera.x, root.camera.y], [0, 0], 'pan did not see the orbit press');

  runFrame(root, 1);
  assert.match(root.plane.style.transform, /^matrix3d\(/);

  // A plain drag still pans, and on the tilted board it keeps the grabbed point under the pointer.
  const rect = host.getBoundingClientRect();
  const grabbed = root.camera.unproject(100, 100, rect);
  press(host, 100, 100);
  move(130, 100);
  release(130, 100);
  const at = root.camera.project(grabbed.x, grabbed.y, rect);
  assert.ok(root.camera.x > 0, 'a plain drag is still a pan');
  assert.ok(Math.abs(at.x - 130) < 1e-6 && Math.abs(at.y - 100) < 1e-6, `the grabbed point is at (${at.x}, ${at.y})`);
});

test('orbit - Alt + wheel moves the viewer; level lays the board flat; off stops listening', (t) => {
  const { app, host, root } = coreScene(t);
  app.set({ orbit: true });
  // happy-dom's WheelEvent drops `altKey` from its init; a browser's carries it.
  const wheel = new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true });
  Object.defineProperty(wheel, 'altKey', { value: true });
  host.dispatchEvent(wheel);
  assert.equal(wheel.defaultPrevented, true);
  assert.ok(root.camera.perspective > ORBIT_PERSPECTIVE);

  level(app);
  assert.deepEqual([root.camera.perspective, root.camera.rotateX, root.camera.rotateY], [null, 0, 0]);
  runFrame(root, 1);
  assert.match(root.plane.style.transform, /^translate3d\(/);

  app.set({ orbit: false });
  press(host, 100, 100, { altKey: true });
  move(200, 200);
  release(200, 200);
  assert.equal(root.camera.rotateY, 0);
  assert.throws(() => level(app.blit({})), /expected a root/);
});

test('orbit - an orbit press still closes an open menu: the menu hears presses in the capture phase', (t) => {
  const { app, host, root } = coreScene(t);
  app.set({ orbit: true });
  menu(app, { items: [{ id: 'home', label: 'Home', action() {} }] });
  host.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: 30, clientY: 40 }));
  const panel = root.overlay.querySelector(`.${MENU_CLASS}`);
  assert.equal(panel.hidden, false);
  press(host, 100, 100, { altKey: true });
  assert.equal(panel.hidden, true, 'the orbit press left the menu up');
  release(100, 100);
});
