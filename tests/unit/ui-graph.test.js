/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The graph as a mind map, drawn from plain data: a tree of wide nodes with
 * their status, time and child count, the three kinds of edge, the selected
 * node's path and neighbours emphasised and the rest dimmed, a search that
 * dims what does not match, the hint line, and the aria tree a screen reader
 * walks.
 *
 * RED FIRST, on the layered stub. As written, every drawing case failed at
 * the fixture's edge to a node outside the model, which the stub refused:
 *
 *   TypeError [Error]: Graph edge 5 names an unknown node
 *
 * so each was run again with that edge taken out, and what it read then is
 * in its own comment.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { UI_CSS } from '../../ui/index.js';
import { COARSE, declared } from './ui-sheet.js';
import { stubBox } from '../helpers/ui.js';
import { MAP, graphOf } from './ui-graph-fixture.js';

/*
 * Seen to fail on the stub, whose nodes were buttons in no tree:
 *
 *   ✖ graph: an aria tree in tree order; each node a treeitem with its level, place and whether it is open
 *     AssertionError [ERR_ASSERTION]: the nodes are a tree
 *       actual: null,
 */
test('graph: an aria tree in tree order; each node a treeitem with its level, place and whether it is open', (t) => {
  const { host, node, ids } = graphOf(t);
  const tree = host.querySelector('[role="tree"]');
  assert.ok(tree, 'the nodes are a tree');
  assert.equal(tree.getAttribute('aria-label'), 'Campaign');
  assert.deepEqual(ids('[role="treeitem"]'), ['goal', 'copy', 'draft', 'art', 'side', 'lone'], 'depth first, so reading order is the tree');
  const aria = (id) => ['level', 'posinset', 'setsize', 'expanded'].map((name) => node(id).getAttribute(`aria-${name}`));
  assert.deepEqual(aria('goal'), ['1', '1', '3', 'true']);
  assert.deepEqual(aria('copy'), ['2', '1', '2', 'true'], 'a child in the model makes a node open');
  assert.deepEqual(aria('art'), ['2', '2', '2', 'false'], 'collapsed: its children are not in the model');
  assert.deepEqual(aria('draft'), ['3', '1', '1', null], 'a leaf neither opens nor closes');
  assert.equal(node('goal').getAttribute('tabindex'), '0');
  assert.deepEqual([...host.querySelectorAll('[role="treeitem"]')].filter((item) => item.getAttribute('tabindex') === '0').length, 1, 'one tab stop');
});

/*
 * Seen to fail on the stub, whose node held one cut label:
 *
 *   ✖ graph: a node shows its whole title in two lines, its status, its time and its child count, and is named in full
 *     AssertionError [ERR_ASSERTION]: the full title is the tooltip
 *     + null
 *     - 'Launch the spring campaign with every channel ready on day one'
 */
test('graph: a node shows its whole title in two lines, its status, its time and its child count, and is named in full', (t) => {
  const { node } = graphOf(t);
  const goal = node('goal');
  const title = MAP.nodes[0].label;
  assert.equal(goal.getAttribute('title'), title, 'the full title is the tooltip');
  assert.equal(goal.querySelector('.cloudcanvas-ui-graph-node-label').textContent, title);
  assert.equal(goal.querySelector('.cloudcanvas-ui-graph-status').textContent, 'Doing');
  const time = goal.querySelector('time');
  assert.deepEqual([time.getAttribute('datetime'), time.getAttribute('title'), time.textContent], ['2026-10-12T09:00', 'Monday 12 October, 9:00', 'Mon 9:00']);
  assert.equal(goal.querySelector('.cloudcanvas-ui-graph-toggle').textContent, '2', 'two children in the model');
  assert.equal(node('art').querySelector('.cloudcanvas-ui-graph-toggle').textContent, '3', 'the count the model gives for a collapsed node');
  assert.equal(node('draft').querySelector('.cloudcanvas-ui-graph-toggle').hidden, true, 'a leaf has no count and no toggle');
  assert.equal(node('draft').querySelector('.cloudcanvas-ui-graph-status').hidden, true, 'and no status it was not given');
  assert.equal(goal.getAttribute('aria-label'), `${title}; Doing; Mon 9:00; 2 children`);
  assert.equal(node('copy').getAttribute('aria-label'), 'Write copy; To do; 1 child; depends on Art; related to Side quest');
  assert.equal(node('art').getAttribute('aria-label'), 'Art; 3 children; needed by Write copy');
  assert.match(UI_CSS, /\.cloudcanvas-ui-graph-node-label \{[^}]*-webkit-line-clamp: 2/, 'two lines, then an ellipsis');
});

/*
 * Seen to fail on the stub, which drew every edge as one arrowed straight line (and, with the edge to `gone`
 * in, refused the model - the TypeError above):
 *
 *   ✖ graph: parent edges are solid curves, related ones dashed with their label, depends-on an arrowed accent line; a missing end draws nothing
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
 *     +   null, (five times)
 *     -   'parent', 'parent', 'parent', 'depends-on', 'related'
 */
test('graph: parent edges are solid curves, related ones dashed with their label, depends-on an arrowed accent line; a missing end draws nothing', (t) => {
  const { host } = graphOf(t);
  const edges = [...host.querySelectorAll('.cloudcanvas-ui-graph-edge')];
  assert.deepEqual(edges.map((edge) => edge.getAttribute('data-kind')), ['parent', 'parent', 'parent', 'depends-on', 'related']);
  assert.ok(edges.every((edge) => edge.localName === 'path' && /^M[\d.-]+ [\d.-]+ C/.test(edge.getAttribute('d'))), 'every edge is a curve');
  const marker = host.querySelector('marker');
  assert.deepEqual(edges.map((edge) => edge.getAttribute('marker-end')), [null, null, null, `url(#${marker.id})`, null], 'only depends-on is arrowed');
  assert.deepEqual([...host.querySelectorAll('.cloudcanvas-ui-graph-edge-label')].map((label) => label.textContent), ['needs', 'see also']);
  assert.match(UI_CSS, /\.cloudcanvas-ui-graph-edge\.is-related \{[^}]*stroke-dasharray/);
  assert.equal(declared('.cloudcanvas-ui-graph-edge.is-depends-on', 'stroke'), 'var(--cc-accent, #38bdf8)');
});

/*
 * Seen to fail on the stub, which marked the selected node and nothing else:
 *
 *   ✖ graph: the selected node, its path to the root and its neighbours are emphasised; the rest dim
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
 *     + []
 *     - [ 'art', 'side', 'lone' ]
 *
 * and the `aria-current` mark, added when Momentum's map suite showed the first version had dropped it, failed
 * on that version as
 *     AssertionError [ERR_ASSERTION]: marked as every kit view marks its selected item
 *     + []
 *     - [ 'draft' ]
 */
test('graph: the selected node, its path to the root and its neighbours are emphasised; the rest dim', (t) => {
  const { host, control, ids, node } = graphOf(t);
  assert.deepEqual(ids('.is-dim'), [], 'nothing is dimmed with nothing selected');
  control.update({ ...MAP, selectedId: 'draft' });
  assert.deepEqual(ids('.cloudcanvas-ui-graph-node.is-dim'), ['art', 'side', 'lone']);
  assert.deepEqual(ids('.cloudcanvas-ui-graph-node.is-path'), ['goal', 'copy'], 'the way up to the root');
  assert.equal(node('draft').getAttribute('aria-selected'), 'true');
  assert.equal(node('goal').getAttribute('aria-selected'), 'false');
  assert.deepEqual(ids('[aria-current="true"]'), ['draft'], 'marked as every kit view marks its selected item');
  const lit = [...host.querySelectorAll('.cloudcanvas-ui-graph-edge')].map((edge) => edge.classList.contains('is-dim'));
  assert.deepEqual(lit, [false, false, true, true, true], 'the edges on the path stay; the others dim');
  control.update({ ...MAP, selectedId: 'copy' });
  assert.deepEqual(ids('.cloudcanvas-ui-graph-node.is-dim'), ['lone'], 'its parent, its child, what it depends on and what it is related to are its neighbours');
});

/*
 * Seen to fail on the stub, which had no search:
 *
 *   ✖ graph: a query dims what does not match its label, case aside; the toolbar's search does the same and reports it
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
 *     + []
 *     - [ 'goal', 'copy', 'draft', 'side', 'lone' ]
 */
test('graph: a query dims what does not match its label, case aside; the toolbar\'s search does the same and reports it', (t) => {
  const { host, control, log, ids } = graphOf(t);
  control.update({ ...MAP, query: 'ART' });
  assert.deepEqual(ids('.cloudcanvas-ui-graph-node.is-unmatched'), ['goal', 'copy', 'draft', 'side', 'lone']);
  const search = host.querySelector('.cloudcanvas-ui-graph-search');
  assert.equal(search.value, 'ART', 'the box shows the model\'s query');
  search.value = 'quest';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  assert.deepEqual(ids('.cloudcanvas-ui-graph-node.is-unmatched'), ['goal', 'copy', 'draft', 'art', 'lone']);
  assert.deepEqual(log.filter(([name]) => name === 'onQuery'), [['onQuery', 'quest']]);
  control.update({ ...MAP, query: 'ART' });
  assert.equal(search.value, 'quest', 'an unchanged model query does not undo what was typed');
  search.value = '';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  assert.deepEqual(ids('.is-unmatched'), []);
});

/*
 * Seen to fail on the stub, which had no hint:
 *
 *   ✖ graph: the hint under the toolbar says what the selection can do, changing with it
 *     TypeError [Error]: Cannot read properties of null (reading 'textContent')
 */
test('graph: the hint under the toolbar says what the selection can do, changing with it', (t) => {
  const { host, control } = graphOf(t);
  const hint = () => host.querySelector('.cloudcanvas-ui-graph-hint').textContent;
  assert.match(hint(), /^Select a node/);
  control.update({ ...MAP, selectedId: 'goal' });
  assert.equal(hint(), 'Enter opens · + or Insert to add a child · Space collapses · drag onto a node to move it · drag the dot to link · Delete removes · Shift+F10 or right-click for more');
  control.update({ ...MAP, selectedId: 'art' });
  assert.match(hint(), /Space expands/);
  control.update({ ...MAP, selectedId: 'draft' });
  assert.doesNotMatch(hint(), /Space/, 'a leaf has nothing to fold');
  const bare = graphOf(t, { ...MAP, selectedId: 'goal' }, { onAdd: undefined, onDropOn: undefined, onConnect: undefined, onDelete: undefined, onToggle: undefined, onMenu: undefined });
  assert.equal(bare.host.querySelector('.cloudcanvas-ui-graph-hint').textContent, 'Enter opens', 'only what the host can do');
});

/*
 * Seen to fail on the stub, which fitted itself over whatever view it was given:
 *
 *   ✖ graph: focusId pans its node into view; a model viewport is restored and is not reported back
 *     AssertionError [ERR_ASSERTION]: The input did not match the regular expression /^translate\(10px, 20px\) scale\(0\.5\)$/. Input:
 *     'translate(24px, 44.54794520547946px) scale(0.6027397260273972)'
 */
test('graph: focusId pans its node into view; a model viewport is restored and is not reported back', (t) => {
  const { host, control, log, node } = graphOf(t);
  stubBox(host.querySelector('.cloudcanvas-ui-graph-viewport'), { width: 400, height: 200 });
  const world = host.querySelector('.cloudcanvas-ui-graph-world');
  control.update({ ...MAP, viewport: { x: 10, y: 20, scale: 0.5 } });
  assert.match(world.style.getPropertyValue('transform'), /^translate\(10px, 20px\) scale\(0\.5\)$/);
  control.update({ ...MAP, viewport: { x: 10, y: 20, scale: 1 }, focusId: 'lone' });
  const [, x, y] = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(world.style.getPropertyValue('transform')).map(Number);
  const at = { x: parseFloat(node('lone').style.getPropertyValue('--graph-x')) + x, y: parseFloat(node('lone').style.getPropertyValue('--graph-y')) + y };
  assert.ok(at.x >= 0 && at.x <= 400 - 208 && at.y >= 0 && at.y <= 200 - 68, `lone is inside the viewport: ${at.x},${at.y}`);
  assert.equal(node('lone').getAttribute('tabindex'), '0', 'and holds the tab stop');
  assert.deepEqual(log.filter(([name]) => name === 'onViewport'), [], 'what the model said is not news to it');
});

/*
 * Seen to fail on the stub's sheet, which drew a node only as a target:
 *
 *   ✖ graph sheet: the toggle and the link handle are 44px targets under a finger; the handle shows on hover and focus; drop targets and dimming are drawn
 *     AssertionError [ERR_ASSERTION]: the sheet declares no width for :is(.cloudcanvas-ui-graph-toggle, .cloudcanvas-ui-graph-handle)::after under (pointer: coarse)
 */
test('graph sheet: the toggle and the link handle are 44px targets under a finger; the handle shows on hover and focus; drop targets and dimming are drawn', () => {
  const PARTS = ':is(.cloudcanvas-ui-graph-toggle, .cloudcanvas-ui-graph-handle)::after';
  const target = 'max(100%, calc(var(--cc-control-min-coarse, 44px) / var(--graph-k, 1)))';
  assert.deepEqual([declared(PARTS, 'width', COARSE), declared(PARTS, 'height', COARSE)], [target, target], '44px on the screen at any zoom');
  assert.match(UI_CSS, /\.cloudcanvas-ui-graph-node:is\(:hover, :focus-visible, \.is-selected\) \.cloudcanvas-ui-graph-handle \{[^}]*opacity: 1/);
  assert.equal(declared('.cloudcanvas-ui-graph-handle', 'cursor'), 'crosshair', 'the cursor says a drag from here links');
  assert.equal(declared('.cloudcanvas-ui-graph[data-can-move] .cloudcanvas-ui-graph-node', 'cursor'), 'grab', 'and from a node, moves it');
  assert.match(declared('.cloudcanvas-ui-graph-node.is-drop-target', 'outline'), /dashed var\(--cc-ui-drop/);
  assert.equal(declared(':is(.cloudcanvas-ui-graph-node, .cloudcanvas-ui-graph-edge, .cloudcanvas-ui-graph-edge-label).is-dim', 'opacity'), '0.4');
});
