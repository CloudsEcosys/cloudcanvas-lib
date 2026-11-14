/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The focus add-on on core blits, no bridge: with `focusOnClick` a click (not
 * a drag) frames the blit with its padding and zoom ceiling, moves
 * `is-focused` onto it and announces `focus:change` on both ends.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { Camera } from 'cloudcanvas/kernel';
import { FOCUSED_CLASS, focus, unfocus } from '../../plugins/focus.js';
import { coreScene, move, press, release, signals } from '../helpers/core-scene.js';

blit.use({ focus });

/** Click a blit: a press and a release a pixel away. */
function click(b) {
  press(b.el, 10, 10);
  release(11, 10);
}

test('focus - a click frames the blit with its own padding and zoom ceiling', (t) => {
  const { app, root } = coreScene(t);
  const card = app.blit({ x: 400, y: 300, w: 100, h: 50, focus: { focusOnClick: true, padding: 20, maxZoom: 2 } });
  const expected = new Camera().fitTarget({ x: 400, y: 300, width: 100, height: 50 }, root.hostRect, { padding: 20, maxZoom: 2 });
  const seen = signals(card, 'focus:change');

  click(card);
  assert.deepEqual({ x: root.camera.x, y: root.camera.y, scale: root.camera.scale }, expected);
  assert.ok(card.el.classList.contains(FOCUSED_CLASS));
  assert.deepEqual(seen, [{ type: 'focus:change', payload: true }]);
});

test('focus - the focus moves between blits; each end hears its change', (t) => {
  const { app } = coreScene(t);
  const a = app.blit({ w: 10, h: 10, focus: { focusOnClick: true } });
  const b = app.blit({ x: 50, w: 10, h: 10, focus: { focusOnClick: true } });
  const seenA = signals(a, 'focus:change');

  click(a);
  click(b);
  assert.equal(a.el.classList.contains(FOCUSED_CLASS), false);
  assert.ok(b.el.classList.contains(FOCUSED_CLASS));
  assert.deepEqual(seenA.map((each) => each.payload), [true, false]);
});

test('focus - a drag, or a blit without focusOnClick, frames nothing', (t) => {
  const { app, root } = coreScene(t);
  const card = app.blit({ x: 400, y: 300, w: 100, h: 50, focus: { focusOnClick: true } });
  const plain = app.blit({ x: 400, y: 300, w: 100, h: 50, focus: true });

  press(card.el, 10, 10);
  move(40, 10);
  release(40, 10);
  click(plain);
  assert.deepEqual([root.camera.x, root.camera.y, root.camera.scale], [0, 0, 1]);
  assert.equal(card.el.classList.contains(FOCUSED_CLASS), false);
});

test('focus - stopping the trait on the focused blit gives the focus up', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ w: 10, h: 10, focus: { focusOnClick: true } });
  const seen = signals(card, 'focus:change');

  click(card);
  card.set({ focus: false });
  assert.equal(card.el.classList.contains(FOCUSED_CLASS), false);
  assert.deepEqual(seen.map((each) => each.payload), [true, false]);
});

test('focus - unfocus takes the focus off and says so; nothing focused is a null no-op', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ x: 0, y: 0, w: 10, h: 10, focus: { focusOnClick: true } });
  const heard = signals(card, 'focus:change');
  click(card);
  assert.ok(card.el.classList.contains(FOCUSED_CLASS));
  assert.equal(unfocus(app), card);
  assert.equal(card.el.classList.contains(FOCUSED_CLASS), false);
  assert.deepEqual(heard.map((each) => each.payload), [true, false]);
  assert.equal(unfocus(app), null);
});
