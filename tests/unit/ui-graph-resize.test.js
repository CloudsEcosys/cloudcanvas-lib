/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The graph follows its host's width while the view is still the one it drew by
 * itself: a host that opens a pane beside it halves the width, and a map fitted
 * for the whole width must be fitted again, or its root is left under the edge.
 * A view the reader has made theirs (a pan, a zoom, a view the model restored)
 * stays as they left it, and a drag in hand is never interrupted.
 *
 * Every case was written before the code and run on the graph as it stood at
 * `d242ea4`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGraph } from '../../ui/index.js';
import { mount, pointer, stubBox } from '../helpers/ui.js';
import { MAP } from './ui-graph-fixture.js';

const NODE = { width: 208, height: 68 };

/** A ResizeObserver the test fires by hand: every one made is kept. */
function observers(t) {
  const view = document.defaultView;
  const original = view.ResizeObserver;
  const made = [];
  view.ResizeObserver = class { constructor(callback) { this.callback = callback; made.push(this); } observe() {} unobserve() {} disconnect() {} };
  t.after(() => { view.ResizeObserver = original; });
  return { fire: () => made.forEach((one) => one.callback([], one)) };
}

/** A graph drawn in a viewport `width` wide, 600 tall; `resize(width)` is what a host does when its pane opens. */
function graphIn(t, width, extra = {}) {
  const { fire } = observers(t);
  const host = mount(t);
  const graph = createGraph(host, extra);
  const viewport = host.querySelector('.cloudcanvas-ui-graph-viewport');
  stubBox(viewport, { width, height: 600 });
  graph.update(MAP);
  const world = host.querySelector('.cloudcanvas-ui-graph-world');
  const view = () => {
    const [, x, y, k] = /translate\(([-\d.e]+)px, ([-\d.e]+)px\) scale\(([-\d.e]+)\)/.exec(world.style.getPropertyValue('transform')).map(Number);
    return { x, y, k };
  };
  const resize = (next) => { stubBox(viewport, { width: next, height: 600 }); fire(); };
  /** Whether the root node is wholly inside the viewport, as the world's transform puts it. */
  const rootInView = (within) => {
    const { x, k } = view();
    const root = host.querySelector('.cloudcanvas-ui-graph-node[data-ui-id="goal"]');
    const left = parseFloat(root.style.getPropertyValue('--graph-x')) * k + x;
    return left >= 0 && left + NODE.width * k <= within;
  };
  return { host, graph, viewport, view, resize, rootInView };
}

/*
 * Seen to fail on the graph of `d242ea4`, which fitted once and kept that view when its width changed:
 *
 *   ✖ graph resize: a map still in the view it drew itself is fitted again when the width falls, and again when it grows
 *     AssertionError [ERR_ASSERTION]: the root stays in view when the width falls to 300
 *     actual: false, expected: true
 */
test('graph resize: a map still in the view it drew itself is fitted again when the width falls, and again when it grows', (t) => {
  const { view, resize, rootInView } = graphIn(t, 1000);
  const wide = view();
  assert.ok(rootInView(1000));
  resize(300);
  assert.ok(rootInView(300), 'the root stays in view when the width falls to 300');
  assert.ok(view().k < wide.k, 'the map is drawn smaller to fit');
  const fresh = graphIn(t, 300);
  assert.deepEqual(view(), fresh.view(), 'exactly where a graph first drawn at that width puts it');
  resize(1000);
  assert.deepEqual(view(), wide, 'and back where it was, when the width comes back');
});

/*
 * Seen to fail on the graph of `d242ea4`: a pan, a zoom and a restored view held there (it never refitted); what failed was the one thing that
 * gives the graph its view back, Fit:
 *
 *   ✖ graph resize: a view the reader made - a pan, a zoom, a view restored - is left as it is when the width changes
 *     AssertionError [ERR_ASSERTION]: Fit gives the view back to the graph: it follows the width again
 *     actual: { x: 23.999999999999986, y: 239.57142857142856, k: 0.32142857142857145 },
 *     expected: { x: 23.999999999999986, y: 239.57142857142856, k: 0.32142857142857145 }
 */
test('graph resize: a view the reader made - a pan, a zoom, a view restored - is left as it is when the width changes', (t) => {
  const panned = graphIn(t, 1000);
  const wheel = Object.defineProperties(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: 30, deltaY: 10 }), { deltaMode: { value: 0 } });
  panned.viewport.dispatchEvent(wheel);
  const left = panned.view();
  panned.resize(300);
  assert.deepEqual(panned.view(), left, 'a pan is the reader\'s');

  const zoomed = graphIn(t, 1000);
  zoomed.host.querySelector('.cloudcanvas-ui-graph-zoom-in').click();
  const near = zoomed.view();
  zoomed.resize(300);
  assert.deepEqual(zoomed.view(), near, 'so is a zoom');
  zoomed.host.querySelector('.cloudcanvas-ui-graph-fit').click();
  const fitted = zoomed.view();
  zoomed.resize(500);
  assert.notDeepEqual(zoomed.view(), fitted, 'Fit gives the view back to the graph: it follows the width again');

  const restored = graphIn(t, 1000);
  restored.graph.update({ ...MAP, viewport: { x: 10, y: 20, scale: 1 } });
  restored.resize(300);
  assert.deepEqual(restored.view(), { x: 10, y: 20, k: 1 }, 'a view the model restored is the reader\'s too');
});

/*
 * Seen to fail on the graph of `d242ea4` (its first half, a view untouched while a drag is in hand, held there: nothing refitted); the second did not:
 *
 *   ✖ graph resize: a node in hand is never refitted under the pointer; the width is taken at the next change once it is let go
 *     AssertionError [ERR_ASSERTION]: and fitted for the new width on the next change
 *     actual: false, expected: true
 */
test('graph resize: a node in hand is never refitted under the pointer; the width is taken at the next change once it is let go', (t) => {
  const { host, viewport, view, resize } = graphIn(t, 1000, { onDropOn: () => {} });
  const first = view();
  const node = host.querySelector('.cloudcanvas-ui-graph-node[data-ui-id="side"]');
  pointer(node, 'pointerdown', { clientX: 10, clientY: 10 });
  pointer(viewport, 'pointermove', { clientX: 60, clientY: 40 });
  assert.ok(node.classList.contains('is-dragging'));
  resize(300);
  assert.deepEqual(view(), first, 'untouched while a drag is in hand');
  pointer(viewport, 'pointerup', { clientX: 60, clientY: 40 });
  resize(300);
  assert.ok(view().k < first.k, 'and fitted for the new width on the next change');
});

/*
 * Seen to fail on the graph with the selection brought into the first view by centring it (`nearest` off), which is what the graph of `d242ea4` did,
 * on the map of 800 wide taken to 420 with `draft` - the third level - selected:
 *
 *   ✖ graph resize: a selection at the third level is brought in by the least pan, so the root keeps its place when both fit
 *     AssertionError [ERR_ASSERTION]: the root stays in view when the width falls to 420
 *     actual: false, expected: true
 *
 * The first view is readable (0.8) now, not 0.5, so the width at which both fit is the one the map needs at 0.8 - the map is 784 wide, 627px at 0.8,
 * and fits whole at 0.8 from 675px - 670 here, where the first view is the root at the left and the selection brought in. At 420 they cannot both
 * be in: the selection is, wholly, and the root has given way.
 */
test('graph resize: a selection at the third level is brought in by the least pan, so the root keeps its place when both fit', (t) => {
  const { graph, resize, rootInView, host, view } = graphIn(t, 800);
  graph.update({ ...MAP, selectedId: 'draft' });
  host.querySelector('.cloudcanvas-ui-graph-fit').click();
  const rightOfDraft = () => parseFloat(host.querySelector('.cloudcanvas-ui-graph-node[data-ui-id="draft"]').style.getPropertyValue('--graph-x')) * view().k + view().x + NODE.width * view().k;
  resize(670);
  assert.equal(view().k, 0.8, 'readable: the map is 784 wide and does not fit 670 whole at 0.8');
  assert.ok(rootInView(670), 'the root stays in view when the width falls to 670');
  assert.ok(rightOfDraft() <= 670, `and so is the selection, wholly: its right edge is at ${rightOfDraft()}`);
  resize(420);
  assert.equal(view().k, 0.8, 'at 420 the view is as readable');
  assert.ok(rightOfDraft() <= 420, `the selection is in, wholly: its right edge is at ${rightOfDraft()}`);
});
