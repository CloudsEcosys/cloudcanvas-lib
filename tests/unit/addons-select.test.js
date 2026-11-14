/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The select add-on on core blits, no bridge: the class and the bubbling
 * `select` signal, press-to-select exclusive within the root, shift to toggle,
 * `setSelected`, and no residue when the trait stops.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { SELECTED_CLASS, select, setSelected } from '../../plugins/select.js';
import { coreScene, press, release, signals } from '../helpers/core-scene.js';

blit.use({ select });

test('select - an initial selection shows at once and announces nothing', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ select: { selected: true } });
  assert.ok(card.el.classList.contains(SELECTED_CLASS));
});

test('select - a press selects the blit and deselects the root\'s other selection', (t) => {
  const { app } = coreScene(t);
  const a = app.blit({ select: true });
  const b = app.blit({ select: true });
  const seen = signals(app, 'select');

  press(a.el, 0, 0);
  release(0, 0);
  assert.ok(a.el.classList.contains(SELECTED_CLASS));
  press(b.el, 0, 0);
  assert.equal(a.el.classList.contains(SELECTED_CLASS), false);
  assert.ok(b.el.classList.contains(SELECTED_CLASS));
  assert.deepEqual(seen.map((each) => each.payload), [true, false, true], 'the signal bubbles to the root');

  press(b.el, 0, 0);
  assert.equal(seen.length, 3, 'an unchanged selection announced');
});

test('select - a shift-press toggles one blit and leaves the others', (t) => {
  const { app } = coreScene(t);
  const a = app.blit({ select: { selected: true } });
  const b = app.blit({ select: true });

  press(b.el, 0, 0, { shiftKey: true });
  assert.ok(a.el.classList.contains(SELECTED_CLASS));
  assert.ok(b.el.classList.contains(SELECTED_CLASS));
  press(b.el, 0, 0, { shiftKey: true });
  assert.equal(b.el.classList.contains(SELECTED_CLASS), false);
});

test('select - setSelected is the call form; stopping the trait deselects', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ select: true });
  const seen = signals(card, 'select');

  assert.equal(setSelected(card, true), true);
  assert.equal(setSelected(card, true), false);
  card.set({ select: false });
  assert.equal(card.el.classList.contains(SELECTED_CLASS), false);
  assert.deepEqual(seen.map((each) => each.payload), [true, false]);
  assert.equal(setSelected(card, true), false, 'a stopped trait still answered');
});

test('select - a press on a nested blit selects only that blit', (t) => {
  const { app } = coreScene(t);
  const outer = app.blit({ select: true });
  const inner = outer.blit({ select: true });

  press(inner.el, 0, 0);
  assert.ok(inner.el.classList.contains(SELECTED_CLASS));
  assert.equal(outer.el.classList.contains(SELECTED_CLASS), false);
});

test('select - a blit born selected announces it once, so what shows on selection catches up', (t) => {
  const { app } = coreScene(t);
  const heard = [];
  app.on('select', (event) => heard.push(event.detail.payload));
  const card = app.blit({ select: { selected: true } });
  assert.ok(card.el.classList.contains(SELECTED_CLASS));
  assert.deepEqual(heard, [true]);
});
