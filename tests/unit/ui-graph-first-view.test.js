/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The graph's first view must be READABLE. A map too big for its window used to
 * open scaled down to 0.5 (a node's 13px title drawn at 6px, its fold pill 12px
 * wide) with the nodes that did not fit left outside the box; now it opens at
 * 0.8 or more (10px titles), anchored on the first root with its first levels
 * beside it, and the rest is a pan, a zoom or Fit away - Fit still shows all.
 * A map that fits whole at 0.8 or more is still drawn whole, the view is taken
 * once, and a view the model gives is never replaced.
 *
 * Every case was written before the code and run on the graph as it stood at
 * `bdc16db`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGraph } from '../../ui/index.js';
import { mount, stubBox } from '../helpers/ui.js';
import { MAP } from './ui-graph-fixture.js';

const NODE = { width: 208, height: 68 };
/** The title's size in CSS px (the sheet's `--cc-type-md`), and the least a title may be drawn at. */
const TITLE_PX = 13;
const READABLE_PX = 10;
/** The hosts: a desktop window's map pane (1440 wide) and a phone's (390 wide). */
const WIDE = { width: 1000, height: 600 };
const NARROW = { width: 358, height: 500 };

/** Twenty-seven nodes, four levels: a root, five projects of three actions, and a sub-action under each of the first six actions. */
function bigMap() {
  const nodes = [{ id: 'root', label: 'Delivery', childCount: 5 }];
  const edges = [];
  const link = (from, to) => edges.push({ from, to, kind: 'parent' });
  for (let project = 1; project <= 5; project += 1) {
    nodes.push({ id: `p${project}`, label: `Project ${project}`, childCount: 3 });
    link('root', `p${project}`);
    for (let action = 1; action <= 3; action += 1) {
      const id = `p${project}a${action}`;
      nodes.push({ id, label: `Action ${project}.${action}` });
      link(`p${project}`, id);
    }
  }
  for (const parent of ['p1a1', 'p1a2', 'p1a3', 'p2a1', 'p2a2', 'p2a3']) { nodes.push({ id: `${parent}s`, label: `Sub ${parent}` }); link(parent, `${parent}s`); }
  return { label: 'Delivery', nodes, edges };
}

/** A graph drawn once in a window of `size`, with the readings the cases make. */
function graphIn(t, size, model = bigMap(), extra = {}) {
  const host = mount(t);
  const graph = createGraph(host, extra);
  const viewport = host.querySelector('.cloudcanvas-ui-graph-viewport');
  stubBox(viewport, size);
  graph.update(model);
  const world = host.querySelector('.cloudcanvas-ui-graph-world');
  const view = () => {
    const [, x, y, k] = /translate\(([-\d.e]+)px, ([-\d.e]+)px\) scale\(([-\d.e]+)\)/.exec(world.style.getPropertyValue('transform')).map(Number);
    return { x, y, k };
  };
  /** A node's box in the window, `[left, top, right, bottom]`, as the world's transform puts it. */
  const boxOf = (id) => {
    const node = host.querySelector(`.cloudcanvas-ui-graph-node[data-ui-id="${id}"]`);
    const { x, y, k } = view();
    const [left, top] = [parseFloat(node.style.getPropertyValue('--graph-x')) * k + x, parseFloat(node.style.getPropertyValue('--graph-y')) * k + y];
    return [left, top, left + NODE.width * k, top + NODE.height * k];
  };
  const inside = (id) => { const [left, top, right, bottom] = boxOf(id); return left >= 0 && top >= 0 && right <= size.width && bottom <= size.height; };
  const ids = [...host.querySelectorAll('.cloudcanvas-ui-graph-node')].map((node) => node.getAttribute('data-ui-id'));
  return { host, graph, viewport, view, boxOf, inside, ids };
}

/*
 * Seen to fail on the graph of `bdc16db`, whose first view of a map too big for its window was scaled down to 0.5 at the least (a window 1000x600 and
 * one 358x500, the twenty-seven nodes above, no `viewport` in the model):
 *
 *   ✖ first view: a map too big for its window opens at 0.8 or more, so a title is drawn at 10px or more - on a wide window and a narrow one
 *     AssertionError [ERR_ASSERTION]: wide window: the title is 10px or more on the screen (scale 0.5, 6.5px)
 *       actual: false, expected: true
 *
 * (1000x600 fits the map whole at 0.44, below the floor of 0.5, so the first root stood at the left at 0.5; 358x500, the same.)
 */
test('first view: a map too big for its window opens at 0.8 or more, so a title is drawn at 10px or more - on a wide window and a narrow one', (t) => {
  for (const [name, size] of [['wide window', WIDE], ['narrow window', NARROW]]) {
    const { view } = graphIn(t, size);
    const { k } = view();
    assert.ok(k >= 0.8 && TITLE_PX * k >= READABLE_PX, `${name}: the title is 10px or more on the screen (scale ${k}, ${TITLE_PX * k}px)`);
  }
});

/*
 * A guard (it held on `bdc16db`, at 0.5): what the first view stands on when it cannot show the whole - the first root, at the left, with the
 * window's middle on its first level - is the same at the readable scale.
 */
test('first view: anchored on the first root, at the left and level with its first level, whatever the window', (t) => {
  for (const [name, size] of [['wide window', WIDE], ['narrow window', NARROW]]) {
    const { boxOf, inside, view } = graphIn(t, size);
    const [left, top, right, bottom] = boxOf('root');
    assert.ok(left >= 0 && left <= 40 && inside('root'), `${name}: the root stands at the left of the window, whole (box ${[left, top, right, bottom].map(Math.round)})`);
    assert.ok(Math.abs((top + bottom) / 2 - size.height / 2) <= 1, `${name}: level with the middle of its first level, so its children stand above and below it`);
    assert.ok(boxOf('p3')[0] < size.width && boxOf('p3')[2] > 0, `${name}: the first level begins in the window (scale ${view().k})`);
  }
  const wide = graphIn(t, WIDE);
  assert.deepEqual(['p2', 'p3', 'p4'].filter((id) => !wide.inside(id)), [], 'on a wide window the middle projects are whole');
  assert.deepEqual(['p1a2', 'p3a2', 'p5a2', 'p1a1s'].filter((id) => wide.boxOf(id)[2] <= WIDE.width), ['p1a2', 'p3a2', 'p5a2', 'p1a1s'], 'and the levels under them are beside, as far as the window is wide');
});

/*
 * A guard (it held on `bdc16db`): the rest stays one press away - Fit shows every node, at a scale below the first view's - and the minimap, which
 * is drawn while the map is larger than its window, frames the part in view: the first root, where the first view is.
 */
test('first view: the rest is a Fit away - it shows every node, below the first view\'s scale - and the minimap says where the first view is', (t) => {
  const { host, view, inside, ids, boxOf } = graphIn(t, WIDE);
  const first = view();
  const minimap = host.querySelector('.cloudcanvas-ui-graph-minimap');
  assert.equal(minimap.hidden, false, 'the map is larger than its window: the minimap is drawn');
  const frame = minimap.querySelector('.cloudcanvas-ui-graph-minimap-view');
  const [fx, fy, fw, fh] = ['x', 'y', 'width', 'height'].map((name) => Number(frame.getAttribute(name)));
  const root = host.querySelector('.cloudcanvas-ui-graph-node[data-ui-id="root"]');
  const [rx, ry] = [parseFloat(root.style.getPropertyValue('--graph-x')), parseFloat(root.style.getPropertyValue('--graph-y'))];
  assert.ok(fx <= rx && fx + fw >= rx + NODE.width && fy <= ry && fy + fh >= ry + NODE.height, `the frame (${[fx, fy, fw, fh]}) holds the root, where the first view is`);
  assert.ok(boxOf('root')[0] >= 0, 'and the root is where the frame says');
  host.querySelector('.cloudcanvas-ui-graph-fit').click();
  assert.ok(view().k < first.k, 'Fit scales down to the whole map');
  assert.deepEqual(ids.filter((id) => !inside(id)), [], 'every node is inside the window');
  assert.equal(minimap.hidden, true, 'and the minimap goes: everything is in view');
});

/*
 * Seen to fail on the graph of `bdc16db`: the maps that fit whole at 0.5 to 0.8 were fitted, 0.54 here (a root with eight children in a window 1000x400):
 *
 *   ✖ first view: a map that fits whole at 0.8 or more is drawn whole, and one that needs less opens readable, its last nodes a pan away
 *     AssertionError [ERR_ASSERTION]: a root with eight children does not fit at 0.8, so it opens at 0.8
 *       actual: 0.5365853658536586, expected: 0.8
 */
test('first view: a map that fits whole at 0.8 or more is drawn whole, and one that needs less opens readable, its last nodes a pan away', (t) => {
  const small = graphIn(t, WIDE, MAP);
  assert.ok(small.view().k >= 0.8 && small.view().k <= 1, 'a map that fits at 0.8 or more is fitted, as it was');
  assert.deepEqual(small.ids.filter((id) => !small.inside(id)), [], 'whole');
  const children = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const tree = { label: 'Eight', nodes: [{ id: 'top', label: 'Top', childCount: 8 }, ...children.map((id) => ({ id, label: id }))], edges: children.map((id) => ({ from: 'top', to: id, kind: 'parent' })) };
  const between = graphIn(t, { width: 1000, height: 400 }, tree);
  assert.equal(between.view().k, 0.8, 'a root with eight children does not fit at 0.8, so it opens at 0.8');
  assert.ok(between.inside('top'), 'the root whole');
  assert.ok(between.ids.some((id) => !between.inside(id)), 'and its last children are a pan away');
});

/*
 * The first view is taken once: a guard (it held on `bdc16db`, and holds): the same nodes drawn again, a pan and a Fit are the reader's, and a
 * `viewport` the model gives is never replaced.
 */
test('first view: taken once - not again for the same nodes - and never over a viewport the model gives', (t) => {
  const { graph, view, host } = graphIn(t, WIDE);
  const first = view();
  const wheel = Object.defineProperties(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: 60, deltaY: 30 }), { deltaMode: { value: 0 } });
  host.querySelector('.cloudcanvas-ui-graph-viewport').dispatchEvent(wheel);
  const panned = view();
  assert.notDeepEqual(panned, first, 'the reader panned');
  graph.update(bigMap());
  assert.deepEqual(view(), panned, 'the same nodes drawn again: the view is the reader\'s');
  const given = graphIn(t, WIDE, { ...bigMap(), viewport: { x: 7, y: 9, scale: 0.5 } });
  assert.deepEqual(given.view(), { x: 7, y: 9, k: 0.5 }, 'a viewport the model gives wins over the first view');
});

/*
 * Seen to fail on the graph of `bdc16db`, with the selection a node on the third level (`p5a3`, the last action) of the same map: the first view
 * took the root at the left and brought the selection into view by the least pan, at 0.5:
 *
 *   ✖ first view: a selection made before the first view is in it, by the least pan, readable
 *     AssertionError [ERR_ASSERTION]: readable
 *       actual: false, expected: true
 *
 * At 0.8 it must still bring the selection in.
 */
test('first view: a selection made before the first view is in it, by the least pan, readable', (t) => {
  const { view, inside, boxOf } = graphIn(t, WIDE, { ...bigMap(), selectedId: 'p5a3' });
  assert.ok(view().k >= 0.8, 'readable');
  assert.ok(inside('p5a3'), `the selection is inside the window: box ${boxOf('p5a3').map(Math.round)}`);
});
