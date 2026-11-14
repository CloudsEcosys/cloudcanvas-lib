/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The graph's geometry, pure: a left-to-right tree computed from `parent`
 * edges (a node with no parent in the model is a root, several roots stack,
 * siblings keep the model's order), edge kinds checked and kept, edges whose
 * end is not in the model dropped, and the curve each kind is drawn with.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutGraph } from '../../ui/index.js';
import { LAYER_GAP, NODE_HEIGHT, NODE_WIDTH, ROOT_GAP, ROW_GAP, edgePath, forestOf, normalizeGraph, treeRows } from '../../ui/graph/layout.js';

const NODES = [{ id: 'goal' }, { id: 'copy' }, { id: 'draft' }, { id: 'art' }, { id: 'side' }, { id: 'lone' }];
const EDGES = [
  { from: 'goal', to: 'copy', kind: 'parent' }, { from: 'copy', to: 'draft', kind: 'parent' }, { from: 'goal', to: 'art', kind: 'parent' },
  { from: 'copy', to: 'art', kind: 'depends-on', label: 'needs' }, { from: 'side', to: 'copy', label: 'see also' }
];

/*
 * Written first and seen to fail. As written the whole file failed at its import, every case with it:
 *
 *   SyntaxError: The requested module '../../.plugin/ui/graph/layout.js' does not provide an export named 'ROOT_GAP'
 *
 * and, run against the layered stub with the new names given locally, each case on its own:
 *
 *   ✖ graph layout: a left-to-right tree from parent edges; roots stack; siblings keep the model's order
 *     AssertionError [ERR_ASSERTION]: a grandchild two columns right
 *     +   x: 440,
 *     -   x: 576,
 */
test('graph layout: a left-to-right tree from parent edges; roots stack; siblings keep the model\'s order', () => {
  const { nodes, edges } = normalizeGraph(NODES, EDGES);
  const at = layoutGraph(nodes, edges);
  assert.deepEqual(at.get('draft'), { x: 2 * LAYER_GAP, y: 0 }, 'a grandchild two columns right');
  assert.deepEqual(at.get('copy'), { x: LAYER_GAP, y: 0 }, 'a parent centred on its one child');
  assert.deepEqual(at.get('art'), { x: LAYER_GAP, y: ROW_GAP }, 'the next sibling one row down');
  assert.deepEqual(at.get('goal'), { x: 0, y: ROW_GAP / 2 }, 'a root centred on its children');
  assert.deepEqual(at.get('side'), { x: 0, y: 2 * ROW_GAP + ROOT_GAP }, 'a second root stacks below the first tree');
  assert.deepEqual(at.get('lone'), { x: 0, y: 3 * ROW_GAP + 2 * ROOT_GAP });
  const swapped = normalizeGraph([NODES[0], NODES[3], NODES[1], NODES[2]], EDGES.slice(0, 3));
  const order = layoutGraph(swapped.nodes, swapped.edges);
  assert.ok(order.get('art').y < order.get('copy').y, 'siblings are ordered as the model gives them');
  assert.ok(LAYER_GAP > NODE_WIDTH && ROW_GAP > NODE_HEIGHT, 'nodes never touch');
});

/*
 * Seen to fail on the stub, which knew no kind and refused a missing end:
 *
 *   ✖ graph model: an edge without a kind is related, an unknown end is dropped, and a model with no parent edges stacks its roots
 *     TypeError [Error]: Graph edge 2 names an unknown node
 */
test('graph model: an edge without a kind is related, an unknown end is dropped, and a model with no parent edges stacks its roots', () => {
  const { nodes, edges } = normalizeGraph([{ id: 'a', label: 'A' }, { id: 'b' }, { id: 'c' }],
    [{ from: 'a', to: 'b' }, { from: 'b', to: 'c', kind: 'depends-on' }, { from: 'a', to: 'gone', kind: 'parent' }, { from: 'c', to: 'c', kind: 'related' }]);
  assert.deepEqual(edges.map((edge) => [edge.from, edge.to, edge.kind]), [['a', 'b', 'related'], ['b', 'c', 'depends-on']], 'an end outside the model, or a loop on one node, is not drawn');
  const at = layoutGraph(nodes, edges);
  assert.deepEqual([...at.values()].map((point) => point.x), [0, 0, 0], 'related and depends-on edges never move a node');
  assert.deepEqual([...at.values()].map((point) => point.y), [0, ROW_GAP + ROOT_GAP, 2 * (ROW_GAP + ROOT_GAP)], 'all roots, stacked');
  assert.throws(() => normalizeGraph([{ id: 'a' }, { id: 'a' }], []), /duplicate graph node id/);
});

/*
 * Seen to fail before the forest existed:
 *
 *   ✖ graph forest: one parent each (the first edge that names one); a loop of parents is cut at its first node; rows in tree order
 *     TypeError [Error]: forestOf is not a function
 */
test('graph forest: one parent each (the first edge that names one); a loop of parents is cut at its first node; rows in tree order', () => {
  const { nodes, edges } = normalizeGraph([{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
    [{ from: 'b', to: 'a', kind: 'parent' }, { from: 'a', to: 'b', kind: 'parent' }, { from: 'c', to: 'b', kind: 'parent' }, { from: 'a', to: 'd', kind: 'parent' }]);
  const forest = forestOf(nodes, edges);
  assert.deepEqual(forest.roots, ['a', 'c'], 'a is first of the loop, so it is the root; c names no parent');
  assert.deepEqual(forest.children.get('a'), ['b', 'd']);
  assert.equal(forest.parent.get('b'), 'a', 'the first edge naming b\'s parent wins');
  assert.deepEqual(treeRows(forest).map((row) => [row.id, row.level, row.position, row.size]),
    [['a', 1, 1, 2], ['b', 2, 1, 2], ['d', 2, 2, 2], ['c', 1, 2, 2]], 'depth first, each with its level and place among its siblings');
});

/*
 * Seen to fail before the kinds had their own lines:
 *
 *   ✖ graph edges: a parent curve leaves the parent's right edge for the child's left; others pick the facing sides and bow out within a column
 *     TypeError [Error]: edgePath is not a function
 */
test('graph edges: a parent curve leaves the parent\'s right edge for the child\'s left; others pick the facing sides and bow out within a column', () => {
  const mid = NODE_HEIGHT / 2;
  const parent = edgePath({ x: 0, y: 0 }, { x: LAYER_GAP, y: ROW_GAP });
  const bend = (LAYER_GAP - NODE_WIDTH) / 2;
  assert.equal(parent.d, `M${NODE_WIDTH} ${mid} C${NODE_WIDTH + bend} ${mid} ${LAYER_GAP - bend} ${ROW_GAP + mid} ${LAYER_GAP} ${ROW_GAP + mid}`);
  assert.deepEqual(parent.mid, { x: (NODE_WIDTH + LAYER_GAP) / 2, y: (ROW_GAP + 2 * mid) / 2 }, 'the label sits at the middle of the curve');
  const back = edgePath({ x: LAYER_GAP, y: 0 }, { x: 0, y: 0 });
  assert.match(back.d, new RegExp(`^M${LAYER_GAP} ${mid} .* ${NODE_WIDTH} ${mid}$`), 'leftwards: from the left edge to the right edge');
  const column = edgePath({ x: 0, y: 0 }, { x: 0, y: 2 * ROW_GAP });
  assert.match(column.d, new RegExp(`^M${NODE_WIDTH} ${mid} C(\\d+) .* ${NODE_WIDTH} ${2 * ROW_GAP + mid}$`), 'within a column: right edge to right edge');
  assert.ok(Number(/C(\d+)/.exec(column.d)[1]) > NODE_WIDTH, 'bowing out to the right, clear of both nodes');
});
