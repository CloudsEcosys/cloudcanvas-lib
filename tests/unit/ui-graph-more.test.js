/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * What a reader who was never told finds on the graph: the item menu (Link to,
 * Move to, Unlink, Set status, Remind me, View in, Collapse) was reached only
 * by a right-click, Shift+F10 or a long press, and nothing said so. Now the
 * selected node wears a "more" button that asks for the very menu a right-click
 * does, and the hint under the toolbar says the keys.
 *
 * Every case was written before the code and run on the graph as it stood at
 * `d242ea4`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSame, key, pointer, stubBox } from '../helpers/ui.js';
import { MAP, graphOf } from './ui-graph-fixture.js';

const MORE = '.cloudcanvas-ui-item-more';
const moreIn = (host) => [...host.querySelectorAll(MORE)];
const hintOf = (host) => host.querySelector('.cloudcanvas-ui-graph-hint').textContent;
const calls = (log, name) => log.filter(([called]) => called === name);

/*
 * Seen to fail on the graph of `d242ea4`, which drew no such button:
 *
 *   ✖ graph more: the selected node wears a "more" button named for it, on that node alone, which asks for the menu a right-click asks for
 *     TypeError [Error]: Cannot read properties of undefined (reading 'parentElement')
 */
test('graph more: the selected node wears a "more" button named for it, on that node alone, which asks for the menu a right-click asks for', (t) => {
  const { host, control, node, log } = graphOf(t);
  assert.deepEqual(moreIn(host), [], 'nothing selected, nothing to ask about');
  control.update({ ...MAP, selectedId: 'copy' });
  const [more, ...others] = moreIn(host);
  assert.equal(others.length, 0, 'one button, whatever the map holds');
  assertSame(more.parentElement, node('copy'), 'on the selected node');
  assert.deepEqual([more.localName, more.type], ['button', 'button']);
  assert.equal(more.getAttribute('aria-label'), 'More actions for Write copy');
  assert.ok(more.querySelector('svg[data-icon="more"]'), 'the kit\'s own ellipsis');
  stubBox(more, { left: 300, top: 40, width: 24, height: 24 });
  more.click();
  assert.deepEqual(calls(log, 'onMenu'), [['onMenu', 'copy', { x: 300, y: 64 }]], 'the menu opens under the button, as a menu key\'s opens under its item');
  assert.deepEqual([calls(log, 'onActivate'), node('copy').classList.contains('is-selected')], [[], true], 'and nothing is opened');
  control.update({ ...MAP, selectedId: 'draft' });
  assert.deepEqual(moreIn(host).map((one) => one.parentElement.getAttribute('data-ui-id')), ['draft'], 'it goes with the selection');
  control.update({ ...MAP, selectedId: null });
  assert.equal(moreIn(host).length, 0);
});

/*
 * Seen to fail on the graph of `d242ea4` (the case holds the one with a menu to the one without, so it cannot pass on a graph that draws nothing):
 *
 *   ✖ graph more: a host that takes no menu gets no button, and its hint does not promise one
 *     AssertionError [ERR_ASSERTION]: a host with a menu gets the button
 *     0 !== 1
 */
test('graph more: a host that takes no menu gets no button, and its hint does not promise one', (t) => {
  const withMenu = graphOf(t, { ...MAP, selectedId: 'copy' });
  assert.equal(moreIn(withMenu.host).length, 1, 'a host with a menu gets the button');
  const { host, control } = graphOf(t, { ...MAP, selectedId: 'copy' }, { onMenu: undefined });
  assert.equal(moreIn(host).length, 0);
  assert.doesNotMatch(hintOf(host), /right-click/, 'and the hint does not promise one');
  control.update({ ...MAP, selectedId: 'goal' });
  assert.equal(moreIn(host).length, 0);
});

/*
 * Seen to fail on the graph of `d242ea4`:
 *
 *   ✖ graph more: the button is reached by Tab from its node, works from the keyboard once, and is no gesture of the node
 *     TypeError [Error]: Cannot read properties of undefined (reading 'getAttribute')
 */
test('graph more: the button is reached by Tab from its node, works from the keyboard once, and is no gesture of the node', (t) => {
  const { host, control, node, log } = graphOf(t);
  control.update({ ...MAP, selectedId: 'copy' });
  const [more] = moreIn(host);
  assert.notEqual(more.getAttribute('tabindex'), '-1', 'in the tab order');
  assert.ok(node('copy').compareDocumentPosition(more) & Node.DOCUMENT_POSITION_CONTAINED_BY, 'straight after its node: the next stop for Tab');
  const enter = key(more, 'Enter');
  const space = key(more, ' ');
  assert.deepEqual([enter.defaultPrevented, space.defaultPrevented], [false, false], 'Enter and Space are the button\'s own: the browser clicks it');
  assert.deepEqual(calls(log, 'onActivate'), [], 'the node\'s Enter did not open it as well');
  assert.equal(key(more, 'Delete').defaultPrevented, false, 'nor does Delete reach the node\'s verb from the button');
  assert.deepEqual(calls(log, 'onDelete'), []);
  assert.equal(key(node('copy'), 'Tab').defaultPrevented, false, 'Tab is never taken to add a child: a focus-roving widget must not trap it');
  assert.deepEqual(calls(log, 'onAdd'), []);
  const viewport = host.querySelector('.cloudcanvas-ui-graph-viewport');
  pointer(more, 'pointerdown', { clientX: 10, clientY: 10 });
  pointer(viewport, 'pointermove', { clientX: 90, clientY: 70 });
  assert.deepEqual([host.querySelectorAll('.is-dragging').length, viewport.classList.contains('is-panning')], [0, false], 'a press on it drags neither the node nor the map');
  pointer(viewport, 'pointerup', { clientX: 90, clientY: 70 });
});

/*
 * Seen to fail on the graph of `d242ea4`:
 *
 *   ✖ graph more: not drawn while a node is dragged, and back when it is let go
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *     0 !== 1
 *
 * (the first assertion: with nothing drawn, there is no button to hide.)
 */
test('graph more: not drawn while a node is dragged, and back when it is let go', (t) => {
  const { host, control, node } = graphOf(t);
  control.update({ ...MAP, selectedId: 'side' });
  const viewport = host.querySelector('.cloudcanvas-ui-graph-viewport');
  const shown = () => moreIn(host).filter((one) => !one.hidden).length;
  assert.equal(shown(), 1);
  pointer(node('side'), 'pointerdown', { clientX: 10, clientY: 10 });
  pointer(viewport, 'pointermove', { clientX: 60, clientY: 40 });
  assert.ok(node('side').classList.contains('is-dragging'), 'in hand');
  assert.equal(shown(), 0, 'the button is out of the way of the drag');
  pointer(viewport, 'pointerup', { clientX: 60, clientY: 40 });
  assert.equal(shown(), 1);
});

/*
 * Seen to fail on the graph of `d242ea4`, whose hint said nothing of the menu:
 *
 *   ✖ graph more: the hint says + or Insert adds a child and where the rest is, only for what the host can do
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *     + actual - expected
 *     + 'Select a node to see what it can do · drag the background to pan · / searches'
 *     - 'Select a node to see what it can do · drag the background to pan · Shift+F10 or right-click for more · / searches'
 */
test('graph more: the hint says + or Insert adds a child and where the rest is, only for what the host can do', (t) => {
  const { host, control } = graphOf(t);
  assert.equal(hintOf(host), 'Select a node to see what it can do · drag the background to pan · Shift+F10 or right-click for more · / searches');
  control.update({ ...MAP, selectedId: 'goal' });
  assert.equal(hintOf(host), 'Enter opens · + or Insert to add a child · Space collapses · drag onto a node to move it · drag the dot to link · Delete removes · Shift+F10 or right-click for more');
  const bare = graphOf(t, { ...MAP, selectedId: 'goal' }, { onAdd: undefined, onDropOn: undefined, onConnect: undefined, onDelete: undefined, onToggle: undefined });
  assert.equal(hintOf(bare.host), 'Enter opens · Shift+F10 or right-click for more', 'a verb the host did not take is not offered');
});

/*
 * Seen to fail on the graph of `d242ea4`, whose search dimmed every node and said nothing in the hint line:
 *
 *   ✖ graph more: a search nothing matches says so in the hint line and the live region, and dims nothing
 *     AssertionError [ERR_ASSERTION]: in words, where the reader is looking
 *     + actual - expected
 *     + 'Select a node to see what it can do · drag the background to pan · / searches'
 *     - 'Nothing matches “zzz”'
 */
test('graph more: a search nothing matches says so in the hint line and the live region, and dims nothing', (t) => {
  const { host, control, ids } = graphOf(t);
  const search = host.querySelector('.cloudcanvas-ui-graph-search');
  const region = host.querySelector('.cloudcanvas-live-region');
  search.value = 'zzz';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  assert.equal(hintOf(host), 'Nothing matches “zzz”', 'in words, where the reader is looking');
  assert.match(region.textContent, /^Nothing matches “zzz”/, 'and to a screen reader');
  assert.deepEqual(ids('.is-unmatched'), [], 'no node is faded for a search that found nothing');
  search.value = 'quest';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  assert.deepEqual(ids('.is-unmatched'), ['goal', 'copy', 'draft', 'art', 'lone'], 'a search that found something fades the rest');
  assert.match(hintOf(host), /^Select a node/, 'and the hint is the hint again');
  control.update({ ...MAP, selectedId: 'goal', query: 'qqq' });
  assert.equal(hintOf(host), 'Nothing matches “qqq”', 'a query from the model is said the same way, over the selection\'s verbs');
  assert.deepEqual(ids('.is-unmatched'), []);
});
