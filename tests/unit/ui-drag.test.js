/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The shared pointer drag: the mouse threshold, the touch rest that leaves a
 * swipe to the page and a still hold to the host, the swallowed click after a
 * drag, and cancel.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife, trackDrag, DRAG_START_PX, TOUCH_DRAG_DELAY_MS, TOUCH_DRAG_START_PX } from '../../ui/index.js';
import { key, mount, pointer } from '../helpers/ui.js';

function setup(t) {
  const host = mount(t);
  host.innerHTML = '<button class="item" type="button">Item</button>';
  const item = host.querySelector('.item');
  const calls = [];
  const life = createLife();
  t.after(() => life.destroy());
  const drag = trackDrag(life, host, {
    selector: '.item',
    onStart: (node, point) => calls.push(['start', point.x, point.y]),
    onMove: (point) => calls.push(['move', point.x]),
    onEnd: (point) => calls.push(['end', point ? point.x : null])
  });
  return { host, item, calls, drag, life };
}

test('mouse: a press under the threshold stays a click; past it, a drag that swallows the click after', (t) => {
  const { host, item, calls } = setup(t);
  let clicks = 0;
  item.addEventListener('click', () => { clicks += 1; });
  pointer(item, 'pointerdown', { clientX: 10, clientY: 10 });
  pointer(host, 'pointermove', { clientX: 12, clientY: 10 });
  pointer(host, 'pointerup', { clientX: 12, clientY: 10 });
  item.click();
  assert.deepEqual(calls, []);
  assert.equal(clicks, 1);
  pointer(item, 'pointerdown', { clientX: 10, clientY: 10 });
  pointer(host, 'pointermove', { clientX: 30, clientY: 10 });
  assert.ok(host.classList.contains('is-drag-active'));
  pointer(host, 'pointerup', { clientX: 40, clientY: 10 });
  item.click();
  assert.deepEqual(calls, [['start', 10, 10], ['move', 30], ['end', 40]], 'onStart gets the press point');
  assert.equal(clicks, 1, 'the click after a drag is swallowed');
  assert.equal(host.classList.contains('is-drag-active'), false);
});

/*
 * Written first and seen to fail on a touch that became a drag the moment it had rested, moved or not - so a host's
 * 500 ms long-press menu opened over an item already drawn as picked up:
 *
 *   ✖ touch: moving before the rest is a scroll; a still hold starts nothing and draws nothing; travel after the rest is the drag
 *     AssertionError [ERR_ASSERTION]: a still finger starts nothing, however long it rests
 *     actual: [ [ 'start', 10, 10 ] ]   expected: []
 */
test('touch: moving before the rest is a scroll; a still hold starts nothing and draws nothing; travel after the rest is the drag', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { host, item, calls } = setup(t);
  const touch = (target, type, x, y) => pointer(target, type, { clientX: x, clientY: y, pointerType: 'touch' });
  const held = () => { const move = new Event('touchmove', { bubbles: true, cancelable: true }); host.dispatchEvent(move); return move.defaultPrevented; };
  let clicks = 0;
  item.addEventListener('click', () => { clicks += 1; });
  touch(item, 'pointerdown', 10, 10);
  touch(host, 'pointermove', 10, 40);
  t.mock.timers.tick(TOUCH_DRAG_DELAY_MS);
  assert.deepEqual(calls, [], 'a swipe never becomes a drag');
  touch(item, 'pointerdown', 10, 10);
  assert.equal(held(), false, 'before the rest the page is free to scroll');
  t.mock.timers.tick(TOUCH_DRAG_DELAY_MS * 4);
  assert.deepEqual(calls, [], 'a still finger starts nothing, however long it rests');
  assert.equal(host.classList.contains('is-drag-active'), false, 'and draws nothing');
  touch(host, 'pointermove', 10 + TOUCH_DRAG_START_PX, 10);
  assert.deepEqual(calls, [], 'nor does a finger that only trembles: up to the threshold it has not moved');
  assert.equal(held(), true, 'once rested the page is held still, so the travel to come is the drag\'s and not a scroll');
  touch(host, 'pointerup', 10 + TOUCH_DRAG_START_PX, 10);
  item.click();
  assert.deepEqual([calls, clicks], [[], 1], 'let go, the hold was a press: its click is the item\'s, or the host\'s to take');
  touch(item, 'pointerdown', 10, 10);
  t.mock.timers.tick(TOUCH_DRAG_DELAY_MS);
  touch(host, 'pointermove', 11 + TOUCH_DRAG_START_PX, 10);
  assert.deepEqual(calls, [['start', 10, 10], ['move', 11 + TOUCH_DRAG_START_PX]], 'past the threshold the drag begins, from where the finger went down');
  assert.ok(host.classList.contains('is-drag-active'));
  assert.equal(held(), true);
  touch(host, 'pointermove', 60, 10);
  pointer(host, 'pointercancel', { pointerType: 'touch' });
  assert.deepEqual(calls.at(-1), ['end', null], 'a cancelled pointer cancels the drag');
  assert.ok(TOUCH_DRAG_START_PX > DRAG_START_PX, 'a finger is given more room than a mouse before it has moved');
});

test('Escape, cancel() and the owner\'s destroy each end a drag in flight', (t) => {
  const { host, item, calls, drag, life } = setup(t);
  pointer(item, 'pointerdown', { clientX: 0, clientY: 0 });
  pointer(host, 'pointermove', { clientX: 20, clientY: 0 });
  key(document, 'Escape');
  assert.deepEqual(calls.at(-1), ['end', null]);
  pointer(item, 'pointerdown', { clientX: 0, clientY: 0 });
  pointer(host, 'pointermove', { clientX: 20, clientY: 0 });
  assert.equal(drag.dragging, true);
  drag.cancel();
  assert.equal(drag.dragging, false);
  life.destroy();
  pointer(item, 'pointerdown', { clientX: 0, clientY: 0 });
  pointer(host, 'pointermove', { clientX: 50, clientY: 0 });
  assert.equal(calls.filter((call) => call[0] === 'start').length, 2);
});
