/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The layout add-on on core blits: the mode class on the scope container, the
 * `gap` trait, flow children on the `flow` port (no transform) and their flow
 * origin in `bounds`, the scope well's
 * extent and `cc-populated`, and in-place reorder. Ported from
 * `layout-mode.test.js`; what a real
 * flex/grid does with them is `tests/browser/core-addons.test.js`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit, type } from 'cloudcanvas';
import { runFrame } from 'cloudcanvas/testing';
import { stateOf } from 'cloudcanvas/kernel';
import {
  FLOW_CHILD_CLASS, LAYOUT_CLASS, LAYOUT_GAP_PROPERTY, SCOPE_POPULATED_CLASS, flow, gap, insertionBefore, layout, refresh, reorder
} from '../../plugins/layout.js';
import { move } from '../../plugins/place.js';
import { coreScene } from '../helpers/core-scene.js';
import { setElementOffset, setElementSize } from '../helpers/dom.js';

blit.use({ layout, gap });

/** A container type: a title slot, then the scope its children go into. */
function box() {
  type('layout-box', { html: '<p data-slot="title"></p><div data-scope></div>' });
}

const scopeOf = (b) => b.el.querySelector('[data-scope]');
const layoutClasses = (b) => Array.from(scopeOf(b).classList).filter((name) => name.startsWith('is-layout-'));

/** A scene, a container of `mode` and a frame run. */
function scene(t, mode = 'free', spec = {}) {
  box();
  const { app, root } = coreScene(t);
  const container = app.blit({ type: 'layout-box', layout: mode, ...spec });
  runFrame(root);
  return { app, root, container };
}

/* ------------------ THE MODE ------------------ */

test('layout - free carries no layout class', (t) => {
  const { container } = scene(t, true);
  assert.deepEqual(layoutClasses(container), []);
  assert.deepEqual(Object.keys(LAYOUT_CLASS), ['row', 'column', 'grid']);
});

test('layout - the mode writes the matching class on the scope container', (t) => {
  const { container } = scene(t, 'row');
  assert.ok(scopeOf(container).classList.contains(LAYOUT_CLASS.row));
  assert.equal(container.spec.layout, 'row', 'the mode is not in the spec');
});

test('layout - a live set flips the class across all four modes', (t) => {
  const { container } = scene(t);
  for (const mode of ['row', 'column', 'grid']) {
    container.set({ layout: mode });
    assert.deepEqual(layoutClasses(container), [LAYOUT_CLASS[mode]], `${mode} did not stand alone`);
  }
  container.set({ layout: 'free' });
  assert.deepEqual(layoutClasses(container), [], 'free left a layout class behind');
});

test('layout - an unknown mode throws and leaves no layout behind', (t) => {
  const { container } = scene(t);
  assert.throws(() => container.set({ layout: 'diagonal' }), /unknown mode "diagonal"/);
  assert.deepEqual(layoutClasses(container), []);
  assert.equal(container.el.hasAttribute('data-layout'), false, 'the refused mode stayed in the spec');
});

test('layout - gap writes --cc-layout-gap, live-settable and clearable', (t) => {
  const { container } = scene(t, 'row', { gap: 24 });
  assert.equal(scopeOf(container).style.getPropertyValue(LAYOUT_GAP_PROPERTY), '24px');
  container.set({ gap: 8 });
  assert.equal(scopeOf(container).style.getPropertyValue(LAYOUT_GAP_PROPERTY), '8px');
  container.set({ gap: null });
  assert.equal(scopeOf(container).style.getPropertyValue(LAYOUT_GAP_PROPERTY), '');
});

/* ------------------ FLOW CHILDREN ------------------ */

test('flow child - tracks its container switching mode, both directions', (t) => {
  const { root, container } = scene(t);
  const child = container.blit({ w: 40, h: 20 });
  runFrame(root);
  assert.equal(child.el.classList.contains(FLOW_CHILD_CLASS), false);

  container.set({ layout: 'column' });
  assert.ok(child.el.classList.contains(FLOW_CHILD_CLASS), 'the existing child was not re-flagged');
  assert.equal(stateOf(child.el).port, flow, 'the flow child kept its placement port');

  container.set({ layout: 'free' });
  assert.equal(child.el.classList.contains(FLOW_CHILD_CLASS), false, 'the flag survived the return to free');
  assert.equal(stateOf(child.el).port, null, 'the child did not get its own port back');
});

test('flow child - tracks its own parent changing (moved in and out)', (t) => {
  const { app, root, container: row } = scene(t, 'row');
  const free = app.blit({ type: 'layout-box', layout: 'free', x: 600 });
  const child = app.blit({ x: 700, y: 200, w: 120, h: 80 });
  runFrame(root);

  move(child, row);
  runFrame(root);
  assert.ok(child.el.classList.contains(FLOW_CHILD_CLASS), 'nesting into a row did not flag it');
  move(child, free);
  runFrame(root);
  assert.equal(child.el.classList.contains(FLOW_CHILD_CLASS), false, 'nesting into a free parent kept the flag');
  move(child, row);
  runFrame(root);
  move(child, null);
  runFrame(root);
  assert.equal(child.el.classList.contains(FLOW_CHILD_CLASS), false, 'a top-level blit stayed a flow child');
  assert.equal(child.el.style.transform, 'translate3d(700.00px, 200.00px, 0.00px)', 'it came back to its own place');
});

test('flow child - entering flow clears the transform left from its free days', (t) => {
  const { root, container } = scene(t);
  const child = container.blit({ x: 40, y: 60, w: 120, h: 80 });
  runFrame(root);
  assert.notEqual(child.el.style.transform, '', 'a free child should carry a transform');
  container.set({ layout: 'row' });
  assert.equal(child.el.style.transform, '', 'the stale transform lingered on the flow child');
});

test('flow child - no transform is written for it, even when its x/y move; its size still is', (t) => {
  const { root, container } = scene(t, 'row');
  const child = container.blit({ w: 120, h: 80 });
  runFrame(root);
  assert.equal(child.el.style.transform, '', 'a flow child was placed by a transform');
  assert.equal(child.el.style.width, '120px');
  child.set({ x: 999, y: 888 });
  runFrame(root);
  assert.equal(child.el.style.transform, '', 'the port wrote a transform onto a flow child');
});

test('flow child - a free child still gets its transform when it moves (control)', (t) => {
  const { root, container } = scene(t);
  const child = container.blit({ w: 120, h: 80 });
  runFrame(root);
  child.set({ x: 50, y: 70 });
  runFrame(root);
  assert.equal(child.el.style.transform, 'translate3d(50.00px, 70.00px, 0.00px)');
});

/* ------------------ THE SCOPE WELL ------------------ */

test('scope well - a flow container is not sized from its children\'s stale extent', (t) => {
  const { root, container } = scene(t, 'row');
  container.blit({ y: 196, w: 120, h: 48 });
  runFrame(root);
  assert.equal(scopeOf(container).style.minHeight, '', 'a flow well was sized from a position nothing renders at');
  assert.ok(scopeOf(container).classList.contains(SCOPE_POPULATED_CLASS), 'a flow well with a live child is not populated');
});

test('scope well - a free container is sized from its children\'s extent (control)', (t) => {
  const { root, container } = scene(t);
  container.blit({ y: 196, w: 120, h: 48 });
  runFrame(root);
  assert.equal(scopeOf(container).style.minHeight, '244px');
  assert.ok(scopeOf(container).classList.contains(SCOPE_POPULATED_CLASS));
  assert.ok(root.measure.has(stateOf(container.el)), 'the written well was not re-measured');
});

test('scope well - switching layout re-sizes the well in both directions', (t) => {
  const { root, container } = scene(t);
  container.blit({ y: 196, w: 120, h: 48 });
  runFrame(root);
  container.set({ layout: 'row' });
  runFrame(root);
  assert.equal(scopeOf(container).style.minHeight, '', 'the free extent survived the switch to row');
  container.set({ layout: 'free' });
  runFrame(root);
  assert.equal(scopeOf(container).style.minHeight, '244px', 'the extent did not come back under free');
});

test('scope well - stopping the layout takes the well and the class off', (t) => {
  const { root, container } = scene(t);
  container.blit({ y: 10, w: 10, h: 10 });
  runFrame(root);
  container.set({ layout: false });
  assert.equal(scopeOf(container).style.minHeight, '');
  assert.equal(scopeOf(container).classList.contains(SCOPE_POPULATED_CLASS), false);
});

test('scope well - an empty well is not granted; granted with a child, and taken back by refresh once the last one goes', (t) => {
  const { root, container } = scene(t);
  runFrame(root);
  assert.equal(scopeOf(container).classList.contains(SCOPE_POPULATED_CLASS), false, 'an empty well was granted');
  const child = container.blit({ y: 10, w: 10, h: 10 });
  runFrame(root);
  assert.equal(scopeOf(container).classList.contains(SCOPE_POPULATED_CLASS), true);
  child.remove();
  assert.equal(refresh(container), true);
  runFrame(root);
  assert.equal(scopeOf(container).classList.contains(SCOPE_POPULATED_CLASS), false, 'the well outlived its last child');
  assert.equal(scopeOf(container).style.minHeight, '');
});

/* ------------------ REORDER ------------------ */

function threeChildren(root, container) {
  const children = ['a', 'b', 'c'].map((id) => container.blit({ w: 80, h: 40 }));
  children.forEach((child, index) => { child.el.id = `ord_${'abc'[index]}`; });
  runFrame(root);
  return children;
}

const domOrder = (container) => container.blits.map((child) => child.el.id);

test('reorder - moving a child before a later sibling reorders the DOM', (t) => {
  const { root, container } = scene(t, 'row');
  const [, b, c] = threeChildren(root, container);
  assert.equal(reorder(c, b), c, 'reorder returns the moved blit');
  assert.deepEqual(domOrder(container), ['ord_a', 'ord_c', 'ord_b']);
});

test('reorder - a null sibling moves the child to the end', (t) => {
  const { root, container } = scene(t, 'column');
  const [a] = threeChildren(root, container);
  reorder(a, null);
  assert.deepEqual(domOrder(container), ['ord_b', 'ord_c', 'ord_a']);
});

test('reorder - rejects a foreign sibling and itself', (t) => {
  const { app, root, container } = scene(t, 'row');
  const [a] = threeChildren(root, container);
  const outsider = app.blit({ w: 80, h: 40 });
  assert.equal(reorder(a, outsider), null, 'a foreign sibling was accepted as a reference');
  assert.equal(reorder(a, a), null, 'a blit was reordered before itself');
  assert.deepEqual(domOrder(container), ['ord_a', 'ord_b', 'ord_c']);
});

test('insertionBefore - the first sibling whose midpoint the drop has not passed', (t) => {
  const { root, container } = scene(t, 'row');
  const [a, b, c] = threeChildren(root, container);
  setElementSize(a.el, 80, 40, { x: 0, y: 0 });
  setElementSize(b.el, 80, 40, { x: 100, y: 0 });
  setElementSize(c.el, 80, 40, { x: 200, y: 0 });
  assert.equal(insertionBefore(a, { clientX: 130, clientY: 0 }), b);
  assert.equal(insertionBefore(a, { clientX: 300, clientY: 0 }), null);
});

/* ------------------ FLOW CHILD BOUNDS ------------------ */

/*
 * happy-dom lays nothing out, so the offsets flex would give are declared with
 * `setElementOffset`, as the browser would report them; the browser suite checks
 * the same against a real flex.
 */

test('flow child bounds - bounds read the live flow origin, not the author\'s x/y', (t) => {
  const { root, container } = scene(t, 'row', { x: 100, y: 50 });
  // A deliberately misleading placement: nothing like where flex puts it.
  const child = container.blit({ x: 999, y: 888, w: 120, h: 60 });
  runFrame(root);
  setElementSize(container.el, 400, 300);
  setElementOffset(scopeOf(container), 0, 40);
  setElementSize(child.el, 120, 60);
  setElementOffset(child.el, 12, 8);
  runFrame(root);
  runFrame(root);

  const state = stateOf(child.el);
  assert.deepEqual([state.fx, state.fy], [12, 8], 'the live flex origin was not captured');
  // container (100, 50) + scope offset (0, 40) + flow origin (12, 8)
  assert.deepEqual(child.bounds, { x: 112, y: 98, w: 120, h: 60 }, 'the flow child did not use its flow origin');
  assert.deepEqual([child.spec.x, child.spec.y], [999, 888], 'the author\'s x/y were overwritten');
});

test('flow child bounds - a free child still reads its own x/y (control)', (t) => {
  const { root, container } = scene(t, 'free', { x: 100, y: 50 });
  const child = container.blit({ x: 30, y: 20, w: 120, h: 60 });
  runFrame(root);
  setElementSize(container.el, 400, 300);
  setElementOffset(scopeOf(container), 0, 40);
  // A free child sits at left/top 0 plus its transform: its offset is 0.
  setElementOffset(child.el, 0, 0);
  root.measure.add(stateOf(container.el));
  runFrame(root);
  runFrame(root);

  assert.equal(stateOf(child.el).fx ?? null, null, 'a free child took a flow origin');
  assert.deepEqual([child.bounds.x, child.bounds.y], [130, 110]);
});

test('flow child bounds - the flow origin is dropped the instant a child leaves flow', (t) => {
  const { root, container } = scene(t, 'row');
  const child = container.blit({ x: 300, y: 200, w: 100, h: 50 });
  runFrame(root);
  setElementOffset(child.el, 5, 7);
  runFrame(root);
  assert.deepEqual([child.bounds.x, child.bounds.y], [5, 7], 'the flow child did not read its flex origin');

  // Back to free: the author's placement governs again with no frame in between.
  container.set({ layout: 'free' });
  assert.equal(stateOf(child.el).fx, null, 'the flow origin survived the return to free');
  assert.deepEqual([child.bounds.x, child.bounds.y], [300, 200], 'a freed child did not return to its x/y');
  assert.deepEqual(child.spec, { x: 300, y: 200, w: 100, h: 50 });
});

test('flow child bounds - a flow child resizing re-reads its siblings and re-measures the container', (t) => {
  const { root, container } = scene(t, 'column');
  const top = container.blit({ w: 120, h: 40 });
  const bottom = container.blit({ w: 120, h: 40 });
  setElementSize(top.el, 120, 40);
  setElementSize(bottom.el, 120, 40);
  setElementOffset(bottom.el, 0, 48); // 40 tall + 8 gap
  for (let frame = 0; frame < 4; frame += 1) runFrame(root);
  const bottomWas = bottom.bounds.y;
  assert.equal(root.measure.size, 0, 'the scene did not settle');

  // Grow the top child; the browser pushes the bottom one 50px lower and grows the container.
  top.set({ h: 90 });
  setElementOffset(bottom.el, 0, 98);
  setElementSize(container.el, 200, 300);
  runFrame(root); // paints the new height; the size is re-read next frame
  runFrame(root);
  assert.equal(bottom.bounds.y, bottomWas + 50, 'the pushed sibling kept its old origin');
  runFrame(root);
  assert.equal(container.bounds.h, 300, 'the container was not re-measured after its flow children moved');
  assert.equal(root.measure.size, 0, 'the flow read never settles');
});

test('flow child bounds - a blit inside a flow child sums the flow origin, not the flow child\'s x/y', (t) => {
  const { root, container } = scene(t, 'row', { x: 10, y: 20 });
  const child = container.blit({ x: 500, y: 500, w: 100, h: 100 });
  const inner = child.blit({ x: 3, y: 4, w: 10, h: 10 });
  runFrame(root);
  setElementOffset(child.el, 30, 0);
  runFrame(root);
  assert.deepEqual([inner.bounds.x, inner.bounds.y], [43, 24]);
});

test('scope well - removing the last child takes the well back by itself, no refresh call', (t) => {
  const { root, container } = scene(t);
  const child = container.blit({ y: 10, w: 10, h: 10 });
  runFrame(root);
  assert.ok(scopeOf(container).classList.contains(SCOPE_POPULATED_CLASS));
  child.remove();
  runFrame(root);
  runFrame(root);
  assert.equal(scopeOf(container).classList.contains(SCOPE_POPULATED_CLASS), false);
});
