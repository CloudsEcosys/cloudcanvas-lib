/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The panel's gestures on the repository's DOM: the bar drags (the drag add-on's gesture and signals), the body
 * and the bar's buttons never do; a drag lifts a panel off an edge to float under the pointer; snapping shows one
 * preview and attaches on release; the resize add-on's handles per place and `resize:end` stored; and a write of
 * the options in mid-gesture interrupting nothing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { runFrame } from 'cloudcanvas/testing';
import { stateOf } from 'cloudcanvas/kernel';
import { RESIZE_HANDLE_ATTR } from '../../plugins/resize.js';
import { bodyOf, panelOf, panels, setPanel } from '../../plugins/panel.js';
import { resetDocument, setElementSize } from '../helpers/dom.js';
import { move, press, release, signals } from '../helpers/core-scene.js';

function scene(t) {
  const realRaf = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = () => 1;
  t.after(() => { globalThis.requestAnimationFrame = realRaf; resetDocument(); });
  const host = document.createElement('div');
  host.style.position = 'relative';
  document.body.appendChild(host);
  const layer = panels(host);
  setElementSize(layer.el, 1000, 800);
  const root = stateOf(layer.el).root;
  const settle = () => { runFrame(root); runFrame(root); };
  return { host, layer, root, settle };
}

const barOf = (b) => b.el.querySelector('.cloudcanvas-panel-bar');
const titleOf = (b) => b.el.querySelector('.cloudcanvas-panel-title');
const handles = (b) => Array.from(b.el.querySelectorAll(`:scope > [${RESIZE_HANDLE_ATTR}]`), (handle) => handle.getAttribute(RESIZE_HANDLE_ATTR));
const preview = (layer) => layer.el.querySelector('.cloudcanvas-panel-preview');
const microtask = () => new Promise((resolve) => queueMicrotask(resolve));

test('drag - the bar moves a floating panel, announced as drag announces it, and the box is stored', (t) => {
  const { layer, settle } = scene(t);
  const tool = layer.add(null, { id: 'tool', box: { x: 100, y: 100, w: 300, h: 200 } });
  settle();
  const starts = signals(tool, 'drag:start');
  const ends = signals(tool, 'drag:end');
  press(titleOf(tool), 150, 110);
  move(151, 110);
  assert.deepEqual(starts, [], 'a move inside the threshold started a drag');
  move(250, 210);
  assert.deepEqual(starts.map((each) => each.payload), [{ x: 100, y: 100 }]);
  assert.deepEqual([tool.x, tool.y], [200, 200]);
  assert.ok(tool.el.classList.contains('is-dragging'));
  release(250, 210);
  assert.deepEqual(ends.map((each) => each.payload), [{ x: 200, y: 200, cancelled: false }]);
  assert.deepEqual(panelOf(tool).box, { x: 200, y: 200, w: 300, h: 200 });
  assert.equal(tool.el.classList.contains('is-dragging'), false);
});

test('drag - a press in the body belongs to the content, and a press on a bar button stands down', (t) => {
  const { layer, settle } = scene(t);
  const field = document.createElement('div');
  field.textContent = 'content';
  const tool = layer.add(field, { id: 'tool', box: { x: 100, y: 100, w: 300, h: 200 } });
  settle();
  const starts = signals(tool, 'drag:start');
  press(field, 150, 200);
  move(300, 350);
  release(300, 350);
  press(bodyOf(tool), 150, 200);
  move(300, 350);
  release(300, 350);
  press(tool.el.querySelector('.cloudcanvas-panel-control'), 380, 110);
  move(500, 400);
  release(500, 400);
  assert.deepEqual(starts, []);
  assert.deepEqual([tool.x, tool.y], [100, 100]);
});

test('drag - off an edge, past the threshold, the panel floats under the pointer at its floating size', (t) => {
  const { layer, settle } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'right', size: 400, box: { w: 300, h: 200 } });
  settle();
  const starts = signals(sheet, 'drag:start');
  press(titleOf(sheet), 800, 10);
  move(801, 10);
  assert.equal(panelOf(sheet).at, 'right', 'a move inside the threshold lifted it');
  move(500, 300);
  assert.equal(panelOf(sheet).at, 'float');
  assert.deepEqual(starts.map((each) => each.payload), [{ x: 600, y: 0 }], 'drag:start is the place it left');
  // 200 of the 400 across the strip: half way, so the pointer sits half way across the 300 box.
  assert.deepEqual([sheet.x, sheet.y], [350, 290]);
  assert.deepEqual([sheet.spec.w, sheet.spec.h], [300, 200]);
  release(500, 300);
  assert.deepEqual(panelOf(sheet).box, { x: 350, y: 290, w: 300, h: 200 });
});

test('drag - out of a modal or full place too, at the floating box\'s size', (t) => {
  const { layer, settle } = scene(t);
  const dialog = layer.add(null, { id: 'dialog', at: 'modal', box: { w: 400, h: 300 } });
  settle();
  press(titleOf(dialog), 400, 260);
  move(500, 400);
  release(500, 400);
  assert.equal(panelOf(dialog).at, 'float');
  assert.deepEqual([dialog.spec.w, dialog.spec.h], [400, 300]);
  setPanel(dialog, { at: 'full' });
  settle();
  press(titleOf(dialog), 500, 10);
  move(520, 200);
  release(520, 200);
  assert.equal(panelOf(dialog).at, 'float');
});

test('drag - an edge panel that may not float stays where it is', (t) => {
  const { layer, settle } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'right', places: ['right', 'left'] });
  settle();
  press(titleOf(sheet), 800, 10);
  move(500, 300);
  release(500, 300);
  assert.equal(panelOf(sheet).at, 'right');
});

test('snap - within snap px of an allowed edge one preview shows the strip; releasing there attaches, pinned kept', (t) => {
  const { layer, settle } = scene(t);
  const tool = layer.add(null, { id: 'tool', pinned: false, size: 300, box: { x: 300, y: 300, w: 300, h: 200 } });
  settle();
  press(titleOf(tool), 350, 310);
  move(400, 400);
  settle();
  assert.equal(preview(layer)?.hidden ?? true, true, 'a preview away from every edge');
  move(990, 400);
  settle();
  const shown = preview(layer);
  assert.equal(shown.hidden, false);
  assert.equal(shown.style.width, '300px');
  assert.equal(shown.style.height, '800px');
  assert.match(shown.style.transform, /translate3d\(700\.00px, 0\.00px/);
  assert.equal(layer.el.querySelectorAll('.cloudcanvas-panel-preview').length, 1);
  move(500, 400);
  settle();
  assert.equal(shown.hidden, true, 'leaving the edge kept the preview');
  move(500, 12);
  settle();
  assert.equal(shown.style.height, '300px', 'the top strip');
  release(500, 12);
  settle();
  assert.equal(panelOf(tool).at, 'top');
  assert.equal(panelOf(tool).pinned, false);
  assert.equal(shown.hidden, true);
});

test('snap - the preview of a drawer shows the strip it would take, between the pinned strips it meets', (t) => {
  const { layer, settle } = scene(t);
  layer.add(null, { id: 'bottom', at: 'bottom', size: 200 });
  const tool = layer.add(null, { id: 'tool', pinned: false, size: 300, box: { x: 300, y: 300, w: 300, h: 200 } });
  settle();
  press(titleOf(tool), 350, 310);
  move(400, 350);
  move(990, 350);
  settle();
  const shown = preview(layer);
  assert.equal(shown.style.height, '600px');
  assert.match(shown.style.transform, /translate3d\(700\.00px, 0\.00px/);
  release(990, 350);
  settle();
  assert.deepEqual([tool.x, tool.y, tool.spec.w, tool.spec.h], [700, 0, 300, 600]);
});

test('snap - joining an edge that holds a panel, the preview shows the slot\'s own size there, and so does the result', (t) => {
  const { layer, settle } = scene(t);
  layer.add(null, { id: 'held', at: 'right', size: 500 });
  const tool = layer.add(null, { id: 'tool', size: 300, box: { x: 300, y: 300, w: 300, h: 200 } });
  settle();
  press(titleOf(tool), 350, 310);
  move(400, 350);
  move(990, 350);
  settle();
  assert.equal(preview(layer).style.width, '500px', 'the preview took the dragged panel\'s own size');
  release(990, 350);
  settle();
  assert.deepEqual([tool.x, tool.spec.w], [500, 500]);
});

test('snap - no snapping at 0, nor to an edge that is not among the places', (t) => {
  const { layer, settle } = scene(t);
  const off = layer.add(null, { id: 'off', snap: 0, box: { x: 300, y: 300, w: 300, h: 200 } });
  const fenced = layer.add(null, { id: 'fenced', places: ['float', 'left'], box: { x: 300, y: 300, w: 300, h: 200 } });
  settle();
  for (const b of [off, fenced]) {
    press(titleOf(b), 350, 310);
    move(400, 400);
    move(995, 400);
    release(995, 400);
    assert.equal(panelOf(b).at, 'float', b.el.id);
  }
});

test('resize - all eight handles floating, the inner side only on an edge, none collapsed, modal or full; always shown', (t) => {
  const { layer } = scene(t);
  const sheet = layer.add(null, { id: 'sheet' });
  assert.deepEqual(handles(sheet).sort(), ['e', 'n', 'ne', 'nw', 's', 'se', 'sw', 'w']);
  assert.ok(sheet.el.querySelectorAll(`[${RESIZE_HANDLE_ATTR}]`).length > 0);
  assert.ok(Array.from(sheet.el.querySelectorAll(`[${RESIZE_HANDLE_ATTR}]`)).every((handle) => !handle.hidden), 'handles hidden while unselected');
  for (const [at, side] of [['left', 'e'], ['right', 'w'], ['top', 's'], ['bottom', 'n']]) {
    setPanel(sheet, { at });
    assert.deepEqual(handles(sheet), [side], at);
  }
  setPanel(sheet, { collapsed: true });
  assert.deepEqual(handles(sheet), []);
  for (const at of ['modal', 'full']) {
    setPanel(sheet, { at, collapsed: false });
    assert.deepEqual(handles(sheet), [], at);
  }
});

test('resize - resize:end stores the new box floating and the new thickness on an edge', (t) => {
  const { layer, settle } = scene(t);
  const tool = layer.add(null, { id: 'tool', box: { x: 100, y: 100, w: 300, h: 200 } });
  const right = layer.add(null, { id: 'right', at: 'right', size: 300 });
  settle();
  const handle = (b, side) => b.el.querySelector(`[${RESIZE_HANDLE_ATTR}="${side}"]`);
  press(handle(tool, 'se'), 400, 300);
  move(450, 340);
  release(450, 340);
  assert.deepEqual(panelOf(tool).box, { x: 100, y: 100, w: 350, h: 240 });
  press(handle(right, 'w'), 700, 400);
  move(600, 400);
  release(600, 400);
  assert.deepEqual(panelOf(right).size, { x: 400, y: 300 }, 'sizing on an edge changed the other axis');
  settle();
  assert.deepEqual([right.x, right.spec.w], [600, 400]);
});

test('mid-gesture - a write of the options, through setPanel or b.set, does not interrupt a drag', async (t) => {
  const { layer, settle } = scene(t);
  const tool = layer.add(null, { id: 'tool', title: 'Tool', box: { x: 100, y: 100, w: 300, h: 200 } });
  settle();
  const ends = signals(tool, 'drag:end');
  const theBar = barOf(tool);
  press(titleOf(tool), 150, 110);
  move(200, 160);
  setPanel(tool, { title: 'Renamed' });
  tool.set({ panel: { ...tool.spec.panel, title: 'Again' } });
  await microtask();
  settle();
  move(260, 220);
  assert.deepEqual([tool.x, tool.y], [210, 210], 'the drag stopped following the pointer');
  assert.deepEqual(ends, [], 'the write ended the drag');
  release(260, 220);
  assert.deepEqual(ends.map((each) => each.payload.cancelled), [false]);
  assert.equal(barOf(tool), theBar);
  assert.equal(titleOf(tool).textContent, 'Again');
});

test('mid-gesture - a write that keeps the place does not cancel a resize; one that moves it waits for the end', async (t) => {
  const { layer, settle } = scene(t);
  const tool = layer.add(null, { id: 'tool', box: { x: 100, y: 100, w: 300, h: 200 } });
  settle();
  const ends = signals(tool, 'resize:end');
  const se = tool.el.querySelector(`[${RESIZE_HANDLE_ATTR}="se"]`);
  press(se, 400, 300);
  move(420, 320);
  tool.set({ panel: { ...tool.spec.panel, title: 'Renamed' } });
  setPanel(tool, { at: 'left' });
  await microtask();
  assert.deepEqual(ends, [], 'the write cancelled the resize');
  move(450, 340);
  release(450, 340);
  assert.deepEqual(ends.map((each) => each.payload.cancelled), [false]);
  assert.deepEqual(handles(tool), ['e'], 'the place\'s handles came after the gesture');
});
