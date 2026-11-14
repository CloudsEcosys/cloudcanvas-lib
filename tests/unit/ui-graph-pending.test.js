/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A selection or a focus the model names before it draws the node waits for
 * it: the host is still reading its tree, or the node is inside a folded
 * parent. It is taken ONCE, by the first model that draws the node - and so
 * again when the model's own selection is folded out of the model and back -
 * and the reader's own selection or view change meanwhile wins: the wait is
 * dropped, and nothing later moves under the reader.
 *
 * Every case was written before the code and run on the graph as it stood at
 * `b954700`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { stubBox } from '../helpers/ui.js';
import { MAP, graphOf } from './ui-graph-fixture.js';

/** The fixture's map without the nodes named: what a host draws while it is still reading them, or with their parent folded. */
const without = (...ids) => ({ ...MAP, nodes: MAP.nodes.filter((node) => !ids.includes(node.id)) });
const VIEW = Object.freeze({ x: 10, y: 20, scale: 1 });

/** A graph whose viewport is 400 by 200, at `VIEW`; the world's transform, and node `id`'s place on the screen. */
function viewed(t, model) {
  const fixture = graphOf(t, model);
  stubBox(fixture.host.querySelector('.cloudcanvas-ui-graph-viewport'), { width: 400, height: 200 });
  const world = fixture.host.querySelector('.cloudcanvas-ui-graph-world');
  const transform = () => world.style.getPropertyValue('transform');
  const at = (id) => {
    const [, x, y] = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(transform()).map(Number);
    const node = fixture.node(id);
    return { x: parseFloat(node.style.getPropertyValue('--graph-x')) + x, y: parseFloat(node.style.getPropertyValue('--graph-y')) + y };
  };
  const inView = (id) => { const { x, y } = at(id); return x >= 0 && x <= 400 - 208 && y >= 0 && y <= 200 - 68; };
  return { ...fixture, transform, inView };
}

/*
 * Seen to fail on the graph of `b954700`, which cleared a selection it could not draw and, told it again, took it for nothing new:
 *
 *   ✖ graph pending: a selectedId whose node is not drawn yet is selected when a model draws it, with the tab stop
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *     null !== 'true'
 */
test('graph pending: a selectedId whose node is not drawn yet is selected when a model draws it, with the tab stop', (t) => {
  const { control, node, ids } = graphOf(t, { ...without('draft'), selectedId: 'draft' });
  assert.deepEqual(ids('[aria-selected="true"]'), [], 'nothing is selected while its node is not drawn');
  control.update({ ...MAP, selectedId: 'draft' });
  assert.equal(node('draft').getAttribute('aria-selected'), 'true');
  assert.deepEqual(ids('.cloudcanvas-ui-graph-node.is-dim'), ['art', 'side', 'lone'], 'the rest dim, as for any selection');
  assert.equal(node('draft').getAttribute('tabindex'), '0', 'and it holds the tab stop');
});

/*
 * Seen to fail on the graph of `b954700`:
 *
 *   ✖ graph pending: the model's selection folded out of the model and back is selected again
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *     null !== 'true'
 */
test('graph pending: the model\'s selection folded out of the model and back is selected again', (t) => {
  const { control, node } = graphOf(t, { ...MAP, selectedId: 'draft' });
  control.update({ ...without('draft'), selectedId: 'draft' });
  control.update({ ...MAP, selectedId: 'draft' });
  assert.equal(node('draft').getAttribute('aria-selected'), 'true');
});

/*
 * Held GREEN on the graph of `b954700` (it kept no wait to drop); MUTATION-PROVED on the new graph, with a press not
 * dropping the waiting selection (`select` in graph.js), observed:
 *
 *   ✖ graph pending: the reader's own selection meanwhile wins, and a selection the reader made is not waited for
 *     AssertionError [ERR_ASSERTION]: the press stands
 *     'false' !== 'true'
 */
test('graph pending: the reader\'s own selection meanwhile wins, and a selection the reader made is not waited for', (t) => {
  const { control, node, ids } = graphOf(t, { ...without('draft'), selectedId: 'draft' });
  node('lone').click();
  control.update({ ...MAP, selectedId: 'draft' });
  assert.equal(node('lone').getAttribute('aria-selected'), 'true', 'the press stands');
  assert.equal(node('draft').getAttribute('aria-selected'), 'false');
  node('copy').click();
  control.update({ ...without('copy', 'draft'), selectedId: 'draft' });
  control.update({ ...MAP, selectedId: 'draft' });
  assert.deepEqual(ids('[aria-selected="true"]'), [], 'a node the reader selected and the model folded away is not brought back');
});

/*
 * Seen to fail on the graph of `b954700`, which forgot a focusId it could not pan to and, told it again, took it for nothing new:
 *
 *   ✖ graph pending: a focusId whose node is not drawn yet pans to it when a model draws it, once
 *     AssertionError [ERR_ASSERTION]: lone is panned into view when it is drawn
 */
test('graph pending: a focusId whose node is not drawn yet pans to it when a model draws it, once', (t) => {
  const { control, node, inView, transform } = viewed(t, without('lone'));
  control.update({ ...without('lone'), viewport: VIEW, focusId: 'lone' });
  control.update({ ...MAP, viewport: VIEW, focusId: 'lone' });
  assert.ok(inView('lone'), 'lone is panned into view when it is drawn');
  assert.equal(node('lone').getAttribute('tabindex'), '0', 'and holds the tab stop');
  control.update({ ...MAP, viewport: { ...VIEW, x: 11 }, focusId: 'lone' });
  assert.equal(transform(), 'translate(11px, 20px) scale(1)', 'once: the same focusId again moves nothing the model said');
});

/*
 * Held GREEN on the graph of `b954700` (it kept no wait to drop); MUTATION-PROVED on the new graph, with a reader's view
 * change not dropping the waiting focus (`applyView` in view.js), observed:
 *
 *   ✖ graph pending: the reader's own pan or zoom meanwhile wins: a node that arrives later moves nothing
 *     AssertionError [ERR_ASSERTION]: the reader's zoom stands
 *     + 'translate(70px, -327.5px) scale(1.25)'
 *     - 'translate(-37.5px, 0px) scale(1.25)'
 */
test('graph pending: the reader\'s own pan or zoom meanwhile wins: a node that arrives later moves nothing', (t) => {
  const { control, host, transform } = viewed(t, without('lone'));
  control.update({ ...without('lone'), viewport: VIEW, focusId: 'lone' });
  host.querySelector('.cloudcanvas-ui-graph-zoom-in').click();
  const theirs = transform();
  control.update({ ...MAP, viewport: VIEW, focusId: 'lone' });
  assert.equal(transform(), theirs, 'the reader\'s zoom stands');
});
