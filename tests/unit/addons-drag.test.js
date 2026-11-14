/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The drag add-on on core blits, no bridge: native pointer events move the
 * blit past the threshold, announce `drag:start`/`drag:end`, stand down on
 * controls and on nested blits, and stop cleanly. The threshold, control,
 * selectable-text and grip cases ported from `drag.test.js`,
 * `pointer-wheel.test.js` and `chrome-toggle.test.js`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { runFrame } from 'cloudcanvas/testing';
import { GRAB_HANDLE_CLASS, GRAB_HANDLE_MODE_ATTR, drag } from '../../plugins/drag.js';
import { CLICK_TRAVEL_PX, DRAG_THRESHOLD_PX, isControlTarget } from '../../plugins/trait.js';
import { select, setSelected } from '../../plugins/select.js';
import { coreScene, move, press, release, signals } from '../helpers/core-scene.js';

blit.use({ drag, select });

/** A blit's grip, or null; and whether the drag chunk paints it. */
const gripOf = (b) => b.el.querySelector(`:scope > .${GRAB_HANDLE_CLASS}`);
const shown = (grip) => getComputedStyle(grip).display !== 'none';

test('drag - a press past the threshold moves the blit and announces start and end', (t) => {
  const { app, root } = coreScene(t);
  const card = app.blit({ x: 100, y: 100, w: 50, h: 50, drag: true });
  const starts = signals(card, 'drag:start');
  const ends = signals(card, 'drag:end');

  press(card.el, 110, 110);
  assert.ok(card.el.classList.contains('is-dragging'));
  move(112, 111);
  assert.equal(card.x, 100, 'moved inside the click band');
  assert.deepEqual(starts, []);

  move(150, 130);
  assert.deepEqual([card.x, card.y], [140, 120]);
  assert.deepEqual(starts, [{ type: 'drag:start', payload: { x: 100, y: 100 } }]);

  release(150, 130);
  assert.equal(card.el.classList.contains('is-dragging'), false);
  assert.deepEqual(ends, [{ type: 'drag:end', payload: { x: 140, y: 120, cancelled: false } }]);

  runFrame(root, 1);
  assert.match(card.el.style.transform, /translate3d\(140\.00px, 120\.00px/);
});

test('drag - a click is silent and moves nothing; a later move is not a drag', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ x: 10, y: 10, drag: true });
  const seen = [...signals(card, 'drag:start'), ...signals(card, 'drag:end')];

  press(card.el, 20, 20);
  release(21, 21);
  move(200, 200);
  assert.deepEqual([card.x, card.y], [10, 10]);
  assert.deepEqual(seen, []);
});

test('drag - the camera scales the pointer travel into canvas units', (t) => {
  const { app, root } = coreScene(t);
  const card = app.blit({ x: 0, y: 0, drag: true });
  root.camera.scale = 2;

  press(card.el, 10, 10);
  move(110, 50);
  release(110, 50);
  assert.deepEqual([card.x, card.y], [50, 20]);
});

test('drag - a press on a control, or on a nested blit, is not this blit\'s drag', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ x: 0, y: 0, drag: true });
  const button = document.createElement('button');
  card.el.appendChild(button);
  const kid = card.blit({ x: 5, y: 5 });

  press(button, 10, 10);
  move(60, 60);
  release(60, 60);
  press(kid.el, 10, 10);
  move(60, 60);
  release(60, 60);
  assert.deepEqual([card.x, card.y], [0, 0]);
  assert.equal(card.el.classList.contains('is-dragging'), false);
});

test('drag - removing the trait mid-drag cancels it and stops listening', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ x: 0, y: 0, drag: true });
  const ends = signals(card, 'drag:end');

  press(card.el, 0, 0);
  move(20, 0);
  card.set({ drag: false });
  assert.deepEqual(ends, [{ type: 'drag:end', payload: { x: 20, y: 0, cancelled: true } }]);

  move(80, 0);
  press(card.el, 0, 0);
  move(90, 0);
  assert.equal(card.x, 20, 'a stopped trait still dragged');
});

test('drag - a press in its own selectable text keeps the caret; its drag handle still drags', (t) => {
  const { app, root } = coreScene(t);
  const card = app.blit({ x: 0, y: 0, w: 200, h: 100, drag: true, selectableText: true });
  card.el.innerHTML = '<div data-drag-handle class="head">h</div><p class="text">words</p>';
  runFrame(root, 1);
  press(card.el.querySelector('.text'), 10, 10);
  move(60, 10);
  release(60, 10);
  assert.equal(card.x, 0, 'a press in selectable text dragged');
  press(card.el.querySelector('.head'), 10, 10);
  move(60, 10);
  release(60, 10);
  assert.equal(card.x, 50);
});

test('drag - {handle: true} adds a grip shown while selected, chromed or not, gone with the trait', (t) => {
  const { app } = coreScene(t);
  const control = app.blit({ drag: { handle: true }, select: true });
  const grip = gripOf(control);
  assert.ok(grip);
  assert.equal(grip.getAttribute(GRAB_HANDLE_MODE_ATTR), 'always');
  assert.equal(shown(grip), false);
  setSelected(control, true);
  assert.equal(shown(grip), true);
  control.set({ drag: false });
  assert.equal(gripOf(control) === null, true);
});

test('remove - the core announces removal, bubbling to the host, before the element goes', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ id: 'gone' });
  const seen = [];
  app.on('remove', (event) => seen.push([event.detail.source.el.id, event.target.isConnected]));
  card.remove();
  assert.deepEqual(seen, [['gone', true]]);
});

test('drag - the threshold is 3px, inside the click-travel band it has to agree with', () => {
  assert.equal(DRAG_THRESHOLD_PX, 3);
  assert.ok(DRAG_THRESHOLD_PX < CLICK_TRAVEL_PX);
});

test('drag - past the threshold the blit follows the pointer exactly, and one start covers every move', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ x: 300, y: 150, drag: true });
  const starts = signals(card, 'drag:start');
  press(card.el, 100, 100);
  move(102, 100);
  assert.equal(card.x, 300);
  move(170, 140);
  assert.deepEqual([card.x, card.y], [370, 190], 'the threshold ate part of the drag');
  move(171, 140);
  assert.equal(card.x, 371, 'a slow drag stuttered back through the threshold');
  release(171, 140);
  assert.equal(starts.length, 1);
});

test('drag - [data-cc-control] declares a widget the blit must not drag; the rest of it still drags', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ x: 300, y: 150, drag: true });
  card.el.innerHTML = '<div data-cc-control="volume"><span class="knob"></span></div><p class="body">b</p>';
  press(card.el.querySelector('.knob'), 100, 100);
  move(200, 180);
  release(200, 180);
  assert.deepEqual([card.x, card.y], [300, 150], 'the blit moved under its own control');
  press(card.el.querySelector('.body'), 100, 100);
  move(160, 140);
  release(160, 140);
  assert.deepEqual([card.x, card.y], [360, 190]);
});

test('drag - a press on a button never arms a drag, and its click survives undefaulted', (t) => {
  const { app } = coreScene(t);
  const card = app.blit({ x: 300, y: 150, drag: true });
  const button = document.createElement('button');
  card.el.appendChild(button);
  press(button, 100, 100);
  assert.equal(card.el.classList.contains('is-dragging'), false, 'a button press armed a drag');
  move(160, 140);
  release(160, 140);
  assert.equal(card.x, 300);

  let clicks = 0;
  button.addEventListener('click', () => { clicks += 1; });
  const click = new Event('click', { bubbles: true, cancelable: true });
  button.dispatchEvent(click);
  assert.deepEqual([clicks, click.defaultPrevented], [1, false]);
});

test('drag - a blit nested in a selectable-text blit is still its own drag', (t) => {
  const { app } = coreScene(t);
  const parent = app.blit({ x: 0, y: 0, w: 200, h: 200, drag: true, selectableText: true });
  const child = parent.blit({ x: 10, y: 10, w: 20, h: 20, drag: true });
  press(child.el, 20, 20);
  assert.ok(child.el.classList.contains('is-dragging'), 'the parent text read the press as its caret');
  move(60, 20);
  release(60, 20);
  assert.deepEqual([child.x, parent.x], [50, 0]);
});

test('drag - every drag blit carries a grip unless {handle: false}: a direct child, no control, shown selected and chromeless', (t) => {
  const { app } = coreScene(t);
  const chromed = app.blit({ drag: true, select: true });
  setSelected(chromed, true);
  assert.equal(shown(gripOf(chromed)), false, 'a chromed blit shows a grip');
  assert.equal(gripOf(app.blit({ chrome: false, drag: { handle: false } })) === null, true, 'handle: false still grew one');

  const bare = app.blit({ chrome: false, drag: true, select: true });
  const handle = gripOf(bare);
  assert.equal(handle.parentElement === bare.el, true);
  assert.equal(handle.hasAttribute(GRAB_HANDLE_MODE_ATTR), false);
  assert.equal(isControlTarget(handle), false, 'the grip reads as a control, so it would not drag');
  assert.equal(shown(handle), false);
  setSelected(bare, true);
  assert.equal(shown(handle), true);
  setSelected(bare, false);
  assert.equal(shown(handle), false);

  bare.set({ drag: false });
  setSelected(bare, true);
  assert.equal(gripOf(bare) === null, true, 'a stopped trait left or rebuilt its grip');
});

test('drag - a chrome write shows or hides the grip with no restart of the trait', (t) => {
  const { app } = coreScene(t);
  const b = app.blit({ drag: true, select: { selected: true } });
  const grip = gripOf(b);
  assert.equal(shown(grip), false);
  b.set({ chrome: false });
  assert.equal(gripOf(b) === grip, true, 'the chrome write rebuilt the grip');
  assert.equal(shown(grip), true, 'going chromeless did not show the grip');
  b.set({ chrome: null });
  assert.equal(shown(grip), false, 'the grip outlived the chrome coming back');
});

test('drag - a blit born chromeless and selected shows its grip at once', (t) => {
  const { app } = coreScene(t);
  const bare = app.blit({ chrome: false, select: true });
  setSelected(bare, true);
  bare.set({ drag: true });
  assert.equal(shown(gripOf(bare)), true);
});
