/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The graph under a pointer. Nothing is applied by the kit: a node dropped on
 * another is a reparent request (`onDropOn`), a drag from a node's link handle
 * to another is a link request (`onConnect`), and a node let go anywhere else
 * springs back to where the layout puts it. The view pans by drag and by two
 * fingers, zooms around the pointer, is shown whole in a minimap when it does
 * not fit, and is reported, debounced, as `onViewport({x, y, scale})`.
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
import { mount, pointer, stubBox, stubHitTest } from '../helpers/ui.js';
import { MAP, graphOf } from './ui-graph-fixture.js';
import { createGraph } from '../../ui/index.js';

const viewportOf = (host) => host.querySelector('.cloudcanvas-ui-graph-viewport');
const reports = (log, name) => log.filter(([called]) => called === name);

/** The view as the world's transform says it: `{x, y, k}`. */
function viewOf(host) {
  const transform = host.querySelector('.cloudcanvas-ui-graph-world').style.getPropertyValue('transform');
  const [, x, y, k] = /translate\(([-\d.e]+)px, ([-\d.e]+)px\) scale\(([-\d.e]+)\)/.exec(transform).map(Number);
  return { x, y, k };
}

/*
 * Seen to fail on the stub, which moved a node to wherever it was let go and reported the place:
 *
 *   ✖ graph drag: a node dropped on another reports onDropOn and the target lights while over it; let go elsewhere it springs back and nothing is reported
 *     AssertionError [ERR_ASSERTION]: the node is in hand
 *       actual: false,
 */
test('graph drag: a node dropped on another reports onDropOn and the target lights while over it; let go elsewhere it springs back and nothing is reported', (t) => {
  const { host, log, node, ids } = graphOf(t);
  const viewport = viewportOf(host);
  let under = viewport;
  stubHitTest(t, () => under);
  const place = () => ['--graph-x', '--graph-y'].map((name) => node('side').style.getPropertyValue(name));
  const laidOut = place();
  pointer(node('side'), 'pointerdown', { clientX: 10, clientY: 10 });
  under = node('copy').querySelector('.cloudcanvas-ui-graph-node-label');
  pointer(viewport, 'pointermove', { clientX: 60, clientY: 40 });
  assert.ok(node('side').classList.contains('is-dragging'), 'the node is in hand');
  assert.deepEqual(place(), ['50px', `${parseFloat(laidOut[1]) + 30}px`], 'and follows the pointer');
  assert.deepEqual(ids('.is-drop-target'), ['copy']);
  pointer(viewport, 'pointerup', { clientX: 60, clientY: 40 });
  assert.deepEqual(reports(log, 'onDropOn'), [['onDropOn', 'side', 'copy']]);
  assert.deepEqual([ids('.is-drop-target'), ids('.is-dragging'), place()], [[], [], laidOut], 'the layout is the host\'s: the node is drawn where it was until the host says otherwise');
  pointer(node('side'), 'pointerdown', { clientX: 10, clientY: 10 });
  under = node('side');
  pointer(viewport, 'pointermove', { clientX: 90, clientY: 90 });
  assert.deepEqual(ids('.is-drop-target'), [], 'a node is not its own target');
  under = viewport;
  pointer(viewport, 'pointermove', { clientX: 95, clientY: 95 });
  pointer(viewport, 'pointerup', { clientX: 95, clientY: 95 });
  assert.deepEqual([reports(log, 'onDropOn').length, place()], [1, laidOut], 'let go on nothing, it springs back');
  assert.deepEqual(reports(log, 'onActivate'), [], 'a drag is not a press');
});

/*
 * Seen to fail on the stub, whose nodes had no handle:
 *
 *   ✖ graph link: a drag from a node's handle draws a line to the pointer and reports onConnect on another node; the node itself stays put
 *     AssertionError [ERR_ASSERTION]: the sheet shows handles because the host can link
 *       actual: false,
 */
test('graph link: a drag from a node\'s handle draws a line to the pointer and reports onConnect on another node; the node itself stays put', (t) => {
  const { host, log, node, ids } = graphOf(t);
  const viewport = viewportOf(host);
  let under = viewport;
  stubHitTest(t, () => under);
  assert.ok(host.querySelector('.cloudcanvas-ui-graph').hasAttribute('data-can-link'), 'the sheet shows handles because the host can link');
  pointer(node('side').querySelector('.cloudcanvas-ui-graph-handle'), 'pointerdown', { clientX: 208, clientY: 200 });
  under = node('art');
  pointer(viewport, 'pointermove', { clientX: 300, clientY: 100 });
  const draft = host.querySelector('.cloudcanvas-ui-graph-draft');
  assert.ok(draft, 'a line follows the pointer');
  assert.match(draft.getAttribute('d'), /^M208 230 .* 300 100$/, 'from the handle on the right edge to the pointer');
  assert.deepEqual([ids('.is-drop-target'), ids('.is-dragging'), node('side').style.getPropertyValue('--graph-x')], [['art'], [], '0px']);
  pointer(viewport, 'pointerup', { clientX: 300, clientY: 100 });
  assert.deepEqual(reports(log, 'onConnect'), [['onConnect', 'side', 'art']]);
  assert.deepEqual([host.querySelector('.cloudcanvas-ui-graph-draft'), ids('.is-drop-target')], [null, []]);
  const bare = graphOf(t, MAP, { onConnect: undefined });
  assert.equal(bare.host.querySelector('.cloudcanvas-ui-graph').hasAttribute('data-can-link'), false, 'no host to tell, no handle shown');
});

/*
 * Seen to fail on the stub, which had no toggle and no menu:
 *
 *   ✖ graph press: a node opens and becomes the selection; its toggle folds or opens it instead; a right-click asks for its menu
 *     TypeError [Error]: Cannot read properties of null (reading 'click')
 */
test('graph press: a node opens and becomes the selection; its toggle folds or opens it instead; a right-click asks for its menu', (t) => {
  const { log, node, host } = graphOf(t);
  node('art').querySelector('.cloudcanvas-ui-graph-toggle').click();
  node('goal').querySelector('.cloudcanvas-ui-graph-toggle').click();
  assert.deepEqual(log, [['onToggle', 'art', false], ['onToggle', 'goal', true]], 'a toggle opens nothing');
  node('copy').click();
  assert.deepEqual(log.at(-1), ['onActivate', 'copy']);
  assert.equal(node('copy').getAttribute('aria-selected'), 'true', 'what was pressed is the selection until the model says otherwise');
  const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 33, clientY: 44 });
  node('draft').querySelector('.cloudcanvas-ui-graph-node-label').dispatchEvent(menu);
  assert.deepEqual([log.at(-1), menu.defaultPrevented], [['onMenu', 'draft', { x: 33, y: 44 }], true]);
  const bare = graphOf(t, MAP, { onMenu: undefined });
  const left = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
  bare.node('draft').dispatchEvent(left);
  assert.equal(left.defaultPrevented, false, 'a host that has no menu keeps the one it has');
  assert.ok(host);
});

/*
 * Seen to fail on the stub, which reported no view:
 *
 *   ✖ graph view: a drag on the ground pans and is reported once it rests; Ctrl+wheel zooms around the pointer; two fingers pinch
 *     AssertionError [ERR_ASSERTION]: once, where it came to rest
 *     + []
 *     - [ [ 'onViewport', { scale: 1, x: 20, y: 10 } ] ]
 */
test('graph view: a drag on the ground pans and is reported once it rests; Ctrl+wheel zooms around the pointer; two fingers pinch', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { host, log } = graphOf(t);
  const viewport = viewportOf(host);
  pointer(viewport, 'pointerdown', { clientX: 5, clientY: 5 });
  pointer(viewport, 'pointermove', { clientX: 15, clientY: 8 });
  pointer(viewport, 'pointermove', { clientX: 25, clientY: 15 });
  pointer(viewport, 'pointerup', { clientX: 25, clientY: 15 });
  assert.deepEqual(viewOf(host), { x: 20, y: 10, k: 1 });
  assert.deepEqual(reports(log, 'onViewport'), [], 'not while it moves');
  t.mock.timers.tick(400);
  assert.deepEqual(reports(log, 'onViewport'), [['onViewport', { x: 20, y: 10, scale: 1 }]], 'once, where it came to rest');
  stubBox(viewport, { width: 400, height: 300 });
  const world = (view, at) => ({ x: (at.x - view.x) / view.k, y: (at.y - view.y) / view.k });
  const before = world(viewOf(host), { x: 100, y: 50 });
  // The test DOM's WheelEvent takes no modifier or point from its init, so they are given as a browser gives them.
  const wheel = Object.defineProperties(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -20 }),
    { ctrlKey: { value: true }, clientX: { value: 100 }, clientY: { value: 50 } });
  viewport.dispatchEvent(wheel);
  const after = world(viewOf(host), { x: 100, y: 50 });
  assert.ok(viewOf(host).k > 1, 'zoomed in');
  assert.ok(Math.abs(after.x - before.x) < 1e-6 && Math.abs(after.y - before.y) < 1e-6, 'what was under the pointer still is');
  const k = viewOf(host).k;
  const touch = (type, id, x) => pointer(viewport, type, { pointerId: id, pointerType: 'touch', clientX: x, clientY: 100 });
  touch('pointerdown', 7, 100);
  touch('pointerdown', 8, 200);
  touch('pointermove', 8, 300);
  assert.ok(Math.abs(viewOf(host).k - 2 * k) < 1e-6, `twice as far apart, twice as near: ${viewOf(host).k} against ${k}`);
  touch('pointerup', 8, 300);
  touch('pointerup', 7, 100);
});

/*
 * Seen to fail with the click that ends a pan let through (`holdClick` taken out):
 *
 *   ✖ graph view: a node that cannot be moved pans when dragged, and the click that ends the pan opens nothing
 *     AssertionError [ERR_ASSERTION]: the click that ends a pan is the pan's
 *     + [ [ 'onActivate', 'copy' ] ]
 *     - []
 */
test('graph view: a node that cannot be moved pans when dragged, and the click that ends the pan opens nothing', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { host, log, node } = graphOf(t, MAP, { onDropOn: undefined });
  const viewport = viewportOf(host);
  pointer(node('copy'), 'pointerdown', { clientX: 10, clientY: 10 });
  pointer(viewport, 'pointermove', { clientX: 40, clientY: 30 });
  pointer(viewport, 'pointerup', { clientX: 40, clientY: 30 });
  node('copy').click();
  assert.deepEqual(viewOf(host), { x: 30, y: 20, k: 1 }, 'the press on the node panned');
  assert.deepEqual(reports(log, 'onActivate'), [], 'the click that ends a pan is the pan\'s');
  t.mock.timers.tick(1);
  node('copy').click();
  assert.deepEqual(reports(log, 'onActivate'), [['onActivate', 'copy']], 'a press that does not travel opens it');
});

/*
 * Seen to fail on the stub, which had no minimap:
 *
 *   ✖ graph minimap: hidden while everything fits; shown when it does not; a press on it centres the view there; Fit reports the view
 *     TypeError [Error]: Cannot read properties of null (reading 'hidden')
 */
test('graph minimap: hidden while everything fits; shown when it does not; a press on it centres the view there; Fit reports the view', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const host = mount(t);
  const log = [];
  const graph = createGraph(host, { onViewport: (view) => log.push(view) });
  const viewport = host.querySelector('.cloudcanvas-ui-graph-viewport');
  stubBox(viewport, { width: 1000, height: 500 });
  graph.update(MAP);
  const minimap = host.querySelector('.cloudcanvas-ui-graph-minimap');
  assert.equal(minimap.hidden, true, 'the first view fits it all');
  host.querySelector('.cloudcanvas-ui-graph-zoom-in').click();
  host.querySelector('.cloudcanvas-ui-graph-zoom-in').click();
  assert.equal(minimap.hidden, false, 'zoomed in, the map is larger than its window');
  assert.equal(minimap.getAttribute('aria-hidden'), 'true', 'a picture for the pointer: the keys and Fit do what it does');
  stubBox(minimap, { left: 100, top: 100, width: 160, height: 100 });
  pointer(minimap, 'pointerdown', { clientX: 180, clientY: 150 });
  pointer(minimap, 'pointerup', { clientX: 180, clientY: 150 });
  const view = viewOf(host);
  const centre = { x: (500 - view.x) / view.k, y: (250 - view.y) / view.k };
  const [left, top, width, height] = minimap.querySelector('svg').getAttribute('viewBox').split(' ').map(Number);
  assert.ok(Math.abs(centre.x - (left + width / 2)) < 0.5 && Math.abs(centre.y - (top + height / 2)) < 0.5,
    `the middle of the minimap is the middle of the view: ${centre.x},${centre.y}`);
  host.querySelector('.cloudcanvas-ui-graph-fit').click();
  assert.equal(minimap.hidden, true);
  t.mock.timers.tick(400);
  const { x, y, k } = viewOf(host);
  assert.deepEqual(log, [{ x: Math.round(x), y: Math.round(y), scale: Math.round(k * 1000) / 1000 }], 'one report, of the view that stayed');
});
