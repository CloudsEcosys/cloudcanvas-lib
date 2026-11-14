/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The cursors add-on on a core root, no bridge: a layer on the overlay, the
 * selection ring and focus reticle following the bubbling signals, drawn in
 * screen space through the camera, an idle frame writing nothing, and no
 * residue when the trait stops. The three-target, release, hide, frustum and
 * caption cases ported from `cursor.test.js`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { runFrame } from 'cloudcanvas/testing';
import {
  CURSOR_ACTIVATED, CURSOR_FOCUS, CURSOR_FOCUS_COLOR, CURSOR_LABEL_COLOR, CURSOR_LAYER_CLASS, CURSOR_SELECTED, cursors,
  screenBoundsOf
} from '../../plugins/cursors.js';
import { Camera } from 'cloudcanvas/kernel';
import { park, unpark } from '../../plugins/park.js';
import { stateOf } from 'cloudcanvas/kernel';
import { focus } from '../../plugins/focus.js';
import { select, setSelected } from '../../plugins/select.js';
import { coreScene, press, release } from '../helpers/core-scene.js';

blit.use({ cursors, focus, select });

function cursorScene(t) {
  const scene = coreScene(t);
  scene.app.set({ cursors: true });
  scene.layer = scene.host.querySelector(`[data-blit-overlay] > svg.${CURSOR_LAYER_CLASS}`);
  scene.ring = () => scene.layer.querySelector(`g[data-cursor="${CURSOR_SELECTED}"] rect`);
  return scene;
}

test('cursors - the selection ring follows select, in screen space', (t) => {
  const { app, root, layer, ring } = cursorScene(t);
  assert.ok(layer, 'no cursor layer on the overlay');
  const card = app.blit({ x: 100, y: 50, w: 40, h: 20, select: true });

  setSelected(card, true);
  runFrame(root, 1);
  assert.deepEqual(['x', 'y', 'width', 'height'].map((key) => ring().getAttribute(key)), ['94.0', '44.0', '52.0', '32.0']);

  root.camera.scale = 2;
  runFrame(root, 1);
  assert.equal(ring().getAttribute('x'), '194.0', 'the ring ignored the camera');

  setSelected(card, false);
  runFrame(root, 1);
  assert.equal(ring().parentNode.getAttribute('display'), 'none');
});

test('cursors - an idle frame writes nothing; a moved target redraws', (t) => {
  const { app, root, ring } = cursorScene(t);
  const card = app.blit({ x: 0, y: 0, w: 40, h: 20, select: true });
  setSelected(card, true);
  runFrame(root, 1);
  const writes = [];
  const node = ring();
  const setAttribute = node.setAttribute.bind(node);
  node.setAttribute = (...args) => { writes.push(args[0]); setAttribute(...args); };

  runFrame(root, 1);
  assert.deepEqual(writes, []);
  card.set({ x: 10 });
  runFrame(root, 1);
  assert.ok(writes.includes('x'));
});

test('cursors - the focus reticle follows focus:change', (t) => {
  const { app, root, layer } = cursorScene(t);
  const card = app.blit({ x: 20, y: 20, w: 40, h: 20, focus: { focusOnClick: true } });
  const group = () => layer.querySelector('g[data-cursor="cursor-focus"]');

  press(card.el, 0, 0);
  release(0, 0);
  runFrame(root, 1);
  assert.match(group().innerHTML, /cloudcanvas-focus-cursor/);
});

test('cursors - stopping the trait takes its groups away and stops following', (t) => {
  const { app, root, layer } = cursorScene(t);
  const card = app.blit({ w: 10, h: 10, select: true });
  setSelected(card, true);
  runFrame(root, 1);

  app.set({ cursors: false });
  assert.equal(layer.querySelectorAll('g[data-cursor]').length, 0);
  setSelected(card, false);
  setSelected(card, true);
  runFrame(root, 1);
  assert.equal(layer.querySelectorAll('g[data-cursor]').length, 0);
});

/** A cursor's group, and whether it is drawn. */
const groupOf = (layer, name) => layer.querySelector(`g[data-cursor="${name}"]`);
const shown = (layer, name) => groupOf(layer, name)?.getAttribute('display') === 'inline';

/** A cursor root with the given per-cursor options. */
function optionScene(t, options) {
  const scene = coreScene(t);
  scene.app.set({ cursors: options });
  scene.layer = scene.host.querySelector(`svg.${CURSOR_LAYER_CLASS}`);
  return scene;
}

test('cursors - focus, selection and activation track three blits at once, each at its own box', (t) => {
  const { app, root, layer } = cursorScene(t);
  const focused = app.blit({ x: 100, y: 100, w: 120, h: 60 });
  const selected = app.blit({ x: 400, y: 200, w: 80, h: 40, select: true });
  const activated = app.blit({ x: 700, y: 50, w: 60, h: 30 });
  focused.emit('focus:change', true);
  setSelected(selected, true);
  activated.emit('activate');
  runFrame(root, 1);

  for (const name of [CURSOR_FOCUS, CURSOR_SELECTED, CURSOR_ACTIVATED]) assert.ok(shown(layer, name), `${name} is not drawn`);
  assert.ok(groupOf(layer, CURSOR_FOCUS).innerHTML.includes(`M ${100 - 8} ${100 - 8 + 16}`), 'the reticle is not on its blit');
  assert.equal(groupOf(layer, CURSOR_SELECTED).querySelector('rect').getAttribute('x'), (400 - 6).toFixed(1));
  assert.ok(groupOf(layer, CURSOR_ACTIVATED).querySelector('path').getAttribute('d').startsWith(`M ${700 - 4} ${50 - 4 + 12}`));
});

test('cursors - a newer selection wins; deselecting another leaves it; a dropped focus hides the reticle', (t) => {
  const { app, root, layer, ring } = cursorScene(t);
  const first = app.blit({ x: 40, y: 40, w: 20, h: 20, select: true });
  const second = app.blit({ x: 300, y: 40, w: 20, h: 20, select: true });
  setSelected(first, true);
  setSelected(second, true);
  runFrame(root, 1);
  assert.equal(ring().getAttribute('x'), (300 - 6).toFixed(1), 'the newest selection did not win');
  setSelected(first, false);
  runFrame(root, 1);
  assert.equal(ring().getAttribute('x'), (300 - 6).toFixed(1), 'deselecting another blit moved the ring');

  second.emit('focus:change', true);
  runFrame(root, 1);
  assert.ok(shown(layer, CURSOR_FOCUS));
  second.emit('focus:change', false);
  runFrame(root, 1);
  assert.equal(shown(layer, CURSOR_FOCUS), false, 'a dropped focus left the reticle up');
});

test('cursors - deactivate lets the brackets go, and a released cursor stops following the camera', (t) => {
  const { app, root, layer } = cursorScene(t);
  const lazy = app.blit({ x: 220, y: 140, w: 100, h: 50 });
  lazy.emit('activate');
  runFrame(root, 1);
  const brackets = groupOf(layer, CURSOR_ACTIVATED).querySelector('path');
  const drawn = brackets.getAttribute('d');
  lazy.emit('deactivate');
  runFrame(root, 1);
  assert.equal(shown(layer, CURSOR_ACTIVATED), false, 'the brackets stayed up');
  root.camera.panBy(160, 120);
  runFrame(root, 1);
  assert.equal(brackets.getAttribute('d'), drawn, 'a released cursor kept re-projecting');
});

test('cursors - a removed or parked target hides its cursors; unparked, they come back', (t) => {
  const { app, root, layer } = cursorScene(t);
  const sleeper = app.blit({ x: 300, y: 180, w: 40, h: 20, select: true });
  const doomed = app.blit({ x: 20, y: 20, w: 40, h: 20 });
  setSelected(sleeper, true);
  doomed.emit('focus:change', true);
  runFrame(root, 1);
  assert.ok(shown(layer, CURSOR_SELECTED) && shown(layer, CURSOR_FOCUS));

  doomed.remove();
  park(stateOf(sleeper.el), true);
  runFrame(root, 1);
  assert.equal(shown(layer, CURSOR_FOCUS), false, 'the reticle outlived a removed blit');
  assert.equal(shown(layer, CURSOR_SELECTED), false, 'the ring outlived a parked blit');

  unpark(stateOf(sleeper.el));
  sleeper.set({ x: 301 });
  runFrame(root, 1);
  assert.ok(shown(layer, CURSOR_SELECTED), 'the ring never came back with its blit');
});

test('cursors - options keyed by cursor name reskin one cursor: its colour, and no frustum', (t) => {
  const { app, root, layer } = optionScene(t, { [CURSOR_FOCUS]: { color: '#f59e0b', showFrustum: false } });
  const scope = app.blit({ x: 300, y: 200, w: 400, h: 300 });
  const child = scope.blit({ x: 40, y: 60, w: 120, h: 80 });
  child.emit('focus:change', true);
  runFrame(root, 1);
  assert.equal(groupOf(layer, CURSOR_FOCUS).querySelector('path').getAttribute('stroke'), '#f59e0b');
  assert.equal(groupOf(layer, CURSOR_FOCUS).innerHTML.includes('frustum'), false);
});

test('cursors - the frustum projects from the parent blit\'s box; a top-level blit has none', (t) => {
  const { app, root, layer } = cursorScene(t);
  const scope = app.blit({ x: 300, y: 200, w: 400, h: 300 });
  const child = scope.blit({ x: 40, y: 60, w: 120, h: 80 });
  const origin = () => {
    const path = groupOf(layer, CURSOR_FOCUS).querySelector('.cloudcanvas-frustum-projection path');
    const match = path ? /M\s+(-?[\d.]+)\s+(-?[\d.]+)/.exec(path.getAttribute('d') || '') : null;
    return match ? { x: Number(match[1]), y: Number(match[2]) } : null;
  };
  child.emit('focus:change', true);
  runFrame(root, 1);
  const at = origin();
  assert.ok(at && Math.hypot(at.x - 300, at.y - 200) <= 2, `the frustum starts at ${JSON.stringify(at)}, not the parent corner`);
  assert.equal(groupOf(layer, CURSOR_FOCUS).querySelector('.cloudcanvas-frustum-projection rect'), null);

  child.emit('focus:change', false);
  scope.emit('focus:change', true);
  runFrame(root, 1);
  assert.equal(origin(), null, 'a top-level blit was given a frustum');
});

test('cursors - a caption label is drawn verbatim in its own colour, apart from the reticle stroke', (t) => {
  const { app, root, layer } = optionScene(t, { [CURSOR_FOCUS]: { label: 'held' } });
  const card = app.blit({ x: 120, y: 90, w: 140, h: 70 });
  card.emit('focus:change', true);
  runFrame(root, 1);
  const group = groupOf(layer, CURSOR_FOCUS);
  assert.equal(group.querySelector('text').textContent.trim(), 'held');
  assert.equal(group.querySelector('path').getAttribute('stroke'), CURSOR_FOCUS_COLOR);
  assert.equal(group.querySelector('text').getAttribute('fill'), CURSOR_LABEL_COLOR);
  assert.match(CURSOR_LABEL_COLOR, /^var\(--cc-cursor-label, var\(--cc-text, #[0-9a-f]{6}\)\)$/);

  app.set({ cursors: { [CURSOR_FOCUS]: { label: null, labelColor: '#00ff00' } } });
  card.emit('focus:change', true);
  runFrame(root, 1);
  assert.equal(groupOf(layer, CURSOR_FOCUS).querySelector('text'), null, 'null did not suppress the caption');
});

test('cursors - a caption colour of its own is honoured', (t) => {
  const { app, root, layer } = optionScene(t, { [CURSOR_FOCUS]: { label: 'x', labelColor: '#00ff00' } });
  const card = app.blit({ x: 120, y: 90, w: 140, h: 70 });
  card.emit('focus:change', true);
  runFrame(root, 1);
  assert.equal(groupOf(layer, CURSOR_FOCUS).querySelector('text').getAttribute('fill'), '#00ff00');
});

test('cursors - a restart with new options keeps drawing what is selected now; the layer is hidden from assistive tech', (t) => {
  const { app, root, host } = cursorScene(t);
  const card = app.blit({ x: 10, y: 10, w: 40, h: 20, select: true });
  card.el.setAttribute('aria-label', 'Revenue');
  setSelected(card, true);
  runFrame(root, 1);
  app.set({ cursors: { [CURSOR_SELECTED]: { padding: 2 } } });
  runFrame(root, 1);
  const layer = host.querySelector(`svg.${CURSOR_LAYER_CLASS}`);
  assert.equal(shown(layer, CURSOR_SELECTED), true, 'the restart dropped the selection target');
  assert.equal(layer.getAttribute('aria-hidden'), 'true');
});

test('cursors - under a tilted camera the drawn box encloses all four projected corners; none in front, none drawn', () => {
  const hostRect = { width: 800, height: 600, left: 10, top: 20 };
  const camera = new Camera({ perspective: 900, rotateX: 30, rotateY: 20 });
  const viewport = { canvasToScreen: (x, y, rect) => {
    const at = camera.project(x, y, rect);
    return at && { x: at.x + rect.left, y: at.y + rect.top };
  } };
  const target = { bounds: { x: 100, y: 80, w: 200, h: 120 } };
  const box = screenBoundsOf(target, { hostRect, viewport });
  for (const [x, y] of [[100, 80], [300, 80], [100, 200], [300, 200]]) {
    const at = camera.project(x, y, hostRect);
    assert.ok(at.x >= box.minX - 1e-9 && at.x <= box.maxX + 1e-9 && at.y >= box.minY - 1e-9 && at.y <= box.maxY + 1e-9);
  }
  assert.equal(screenBoundsOf(target, { hostRect, viewport: { canvasToScreen: () => null } }), null);
});
