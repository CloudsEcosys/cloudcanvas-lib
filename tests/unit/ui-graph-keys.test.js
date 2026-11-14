/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The graph from the keyboard, as an aria tree: one tab stop that roves along
 * the tree and carries the selection, and every verb a pointer has - open,
 * add a child, remove, fold, the menu, search, fit - on a key. A verb the
 * host gave no callback for leaves its key alone.
 *
 * RED FIRST, on the layered stub. Every case mounts the shared map, whose edge
 * to a node outside the model the stub refused, so as written each read
 *
 *   TypeError [Error]: Graph edge 5 names an unknown node
 *
 * and each case's own comment holds what it read with that edge taken out.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSame, key, stubBox } from '../helpers/ui.js';
import { MAP, graphOf } from './ui-graph-fixture.js';

const focused = () => document.activeElement?.getAttribute?.('data-ui-id') ?? null;
const press = (name, options) => key(document.activeElement, name, options);

/*
 * Seen to fail on the stub, whose arrows went to the nearest node on the screen:
 *
 *   ✖ graph keys: arrows walk the tree - Up and Down among siblings, Left to the parent or folding an open node, Right to the first child or opening a folded one
 *     AssertionError [ERR_ASSERTION]: the selection follows
 *     null !== 'true'
 */
test('graph keys: arrows walk the tree - Up and Down among siblings, Left to the parent or folding an open node, Right to the first child or opening a folded one', (t) => {
  const { node, log, host } = graphOf(t);
  node('goal').focus();
  press('ArrowRight');
  assert.equal(focused(), 'copy', 'an open node: into its first child');
  assert.equal(node('copy').getAttribute('aria-selected'), 'true', 'the selection follows');
  assert.match(host.querySelector('.cloudcanvas-ui-graph-hint').textContent, /Space collapses/, 'and so does the hint');
  press('ArrowDown');
  assert.equal(focused(), 'art');
  assert.equal(press('ArrowDown').defaultPrevented, true, 'the last sibling is the end, not a wrap');
  assert.equal(focused(), 'art');
  press('ArrowRight');
  assert.deepEqual(log.at(-1), ['onToggle', 'art', false], 'a folded node is opened, not entered');
  press('ArrowUp');
  press('ArrowRight');
  assert.equal(focused(), 'draft');
  press('ArrowLeft');
  assert.equal(focused(), 'copy', 'a leaf goes up to its parent');
  press('ArrowLeft');
  assert.deepEqual([log.at(-1), focused()], [['onToggle', 'copy', true], 'copy'], 'an open node is folded first');
  node('goal').focus();
  press('ArrowDown');
  assert.equal(focused(), 'side', 'roots are siblings');
  press('End');
  assert.equal(focused(), 'lone');
  press('Home');
  assert.equal(focused(), 'goal');
  assert.deepEqual([...host.querySelectorAll('[role="treeitem"]')].filter((item) => item.getAttribute('tabindex') === '0').map((item) => item.getAttribute('data-ui-id')), ['goal']);
  assert.deepEqual(log.filter(([name]) => name === 'onActivate'), [], 'moving opens nothing');
});

/*
 * Seen to fail on the stub, where Enter was the only verb:
 *
 *   ✖ graph keys: Enter opens, + or Insert adds a child, Delete or Backspace removes, Space folds, the menu key or Shift+F10 asks for the menu
 *     AssertionError [ERR_ASSERTION]: Enter is the graph's
 *     false !== true
 */
test('graph keys: Enter opens, + or Insert adds a child, Delete or Backspace removes, Space folds, the menu key or Shift+F10 asks for the menu', (t) => {
  const { node, log } = graphOf(t);
  node('copy').focus();
  for (const name of ['Enter', '+', 'Insert', 'Delete', 'Backspace', ' ']) assert.equal(press(name).defaultPrevented, true, `${name} is the graph's`);
  assert.deepEqual(log, [['onActivate', 'copy'], ['onAdd', 'copy'], ['onAdd', 'copy'], ['onDelete', 'copy'], ['onDelete', 'copy'], ['onToggle', 'copy', true]]);
  node('draft').focus();
  press(' ');
  assert.equal(log.length, 6, 'a leaf has nothing to fold');
  stubBox(node('draft'), { left: 40, top: 60, width: 208, height: 68 });
  press('ContextMenu');
  press('F10', { shiftKey: true });
  assert.deepEqual(log.slice(6), [['onMenu', 'draft', { x: 40, y: 128 }], ['onMenu', 'draft', { x: 40, y: 128 }]], 'under the node, as a menu opened by a key is');
  const bare = graphOf(t, MAP, { onAdd: undefined, onDelete: undefined, onMenu: undefined, onToggle: undefined });
  bare.node('goal').focus();
  for (const name of ['+', 'Delete', ' ', 'ContextMenu']) assert.equal(press(name).defaultPrevented, false, `${name} is left to the host when it has no ${name} verb`);
  assert.deepEqual(bare.log, []);
});

/*
 * Seen to fail on the stub, which had no search box:
 *
 *   ✖ graph keys: / goes to the search box; Enter there goes to the first match, Escape clears it and comes back; 0 fits
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *     false !== true
 *   (the `/` was not the graph's: nothing took it)
 */
test('graph keys: / goes to the search box; Enter there goes to the first match, Escape clears it and comes back; 0 fits', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { host, node, log } = graphOf(t);
  const search = host.querySelector('.cloudcanvas-ui-graph-search');
  node('copy').focus();
  assert.equal(press('/').defaultPrevented, true);
  assertSame(document.activeElement, search);
  search.value = 'raf';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  press('Enter');
  assert.equal(focused(), 'draft', 'the first node that matches, in tree order');
  press('/');
  press('Escape');
  assert.deepEqual([search.value, focused(), log.filter(([name]) => name === 'onQuery').at(-1)], ['', 'draft', ['onQuery', '']], 'cleared, reported, and back where it was');
  stubBox(host.querySelector('.cloudcanvas-ui-graph-viewport'), { width: 1000, height: 500 });
  const world = host.querySelector('.cloudcanvas-ui-graph-world');
  const before = world.style.getPropertyValue('transform');
  assert.equal(press('0').defaultPrevented, true);
  assert.notEqual(world.style.getPropertyValue('transform'), before, 'fitted');
  t.mock.timers.tick(400);
  assert.equal(log.filter(([name]) => name === 'onViewport').length, 1, 'and the fitted view is reported');
});

/*
 * Seen to fail on the stub, which refused a model whose nodes had gone while edges to them stayed - what a
 * host that removes a node sends next:
 *
 *   ✖ graph keys: an update keeps focus on the node that had it and takes none from outside; a node removed hands focus to the selection
 *     TypeError [Error]: Graph edge 0 names an unknown node
 */
test('graph keys: an update keeps focus on the node that had it and takes none from outside; a node removed hands focus to the selection', (t) => {
  const { host, control, node } = graphOf(t);
  node('copy').focus();
  const held = node('copy');
  control.update({ ...MAP, nodes: MAP.nodes.map((entry) => (entry.id === 'copy' ? { ...entry, label: 'Write the copy' } : entry)) });
  assertSame(node('copy'), held, 'the same element, redrawn');
  assertSame(document.activeElement, held);
  control.update({ ...MAP, selectedId: 'goal', nodes: MAP.nodes.filter((entry) => entry.id !== 'copy' && entry.id !== 'draft') });
  assertSame(document.activeElement, node('goal'), 'its node gone, focus goes to the selection');
  const outside = document.createElement('button');
  host.append(outside);
  outside.focus();
  control.update(MAP);
  assertSame(document.activeElement, outside, 'a redraw never takes focus from elsewhere');
});
