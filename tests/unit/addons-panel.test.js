/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The panel add-on's layer and state on the repository's DOM: one layer per host, refused hosts, adopted markup,
 * the frame, options round-tripping through `b.spec`, placement, insets written once per change, tabs joining,
 * switching and handing on, `panel:change`, a restart that keeps the bar and the focus,
 * `off()` returning content, and an idle layer that writes nothing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { loopStep, runFrame } from 'cloudcanvas/testing';
import { stateOf } from 'cloudcanvas/kernel';
import { bodyOf, panelOf, panels, setPanel } from '../../plugins/panel.js';
import { h } from 'cloudcanvas/element';
import { installDomSpy } from '../helpers/dom-spy.js';
import { resetDocument, setElementSize } from '../helpers/dom.js';

/** A positioned `#shell` holding `children`, with a layer 1000 by 800; frames run by hand. */
function scene(t, ...children) {
  const requests = [];
  const realRaf = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = (fn) => { requests.push(fn); return requests.length; };
  t.after(() => { globalThis.requestAnimationFrame = realRaf; resetDocument(); });
  const host = document.createElement('div');
  host.id = 'shell';
  host.style.position = 'relative';
  host.append(...children);
  document.body.appendChild(host);
  const layer = panels(host);
  setElementSize(layer.el, 1000, 800);
  const root = stateOf(layer.el).root;
  const settle = () => { runFrame(root); runFrame(root); };
  return { host, layer, root, requests, settle };
}

const microtask = () => new Promise((resolve) => queueMicrotask(resolve));
const bar = (b) => b.el.querySelector(':scope > .cloudcanvas-panel-bar');
const box = (b) => ({ x: b.x, y: b.y, w: b.spec.w, h: b.spec.h });
const heard = (target, type) => {
  const seen = [];
  target.addEventListener(type, (event) => seen.push(event.detail.payload));
  return seen;
};

test('panels - a positioned host gets one layer: a [data-cc-panels] child mounted as a root, the same layer again', (t) => {
  const { host, layer } = scene(t);
  assert.equal(layer.el.parentElement, host);
  assert.ok(layer.el.hasAttribute('data-cc-panels'));
  assert.ok(layer.el.hasAttribute('data-blit-root'), 'the layer is a root of its own');
  assert.equal(layer.root, blit(layer.el));
  assert.equal(panels(host), layer);
  assert.deepEqual(Object.keys(layer).sort(), ['add', 'apply', 'el', 'insets', 'list', 'off', 'root', 'snapshot']);
  assert.equal(host.querySelectorAll('[data-cc-panels]').length, 1);
  assert.equal(host.hasAttribute('data-blit-root'), false, 'the host itself is no root');
});

test('panels - refuses a host that is not positioned, a root, or inside one, and names the repair', (t) => {
  const { host } = scene(t);
  const plain = document.createElement('div');
  document.body.appendChild(plain);
  assert.throws(() => panels(plain), (error) => error instanceof TypeError && /positioned/.test(error.message));
  const board = document.createElement('div');
  board.style.position = 'relative';
  const inner = document.createElement('div');
  inner.style.position = 'relative';
  board.appendChild(inner);
  document.body.appendChild(board);
  blit(board);
  for (const bad of [board, inner, host.querySelector('[data-cc-panels]')]) {
    assert.throws(() => panels(bad), (error) => error instanceof TypeError && /wrap the board's host/.test(error.message));
  }
  assert.throws(() => panels(null), TypeError);
});

test('panels - an existing [data-cc-panels] child is adopted with the panels already in it; their children become the body', (t) => {
  const { layer } = scene(t, h('div', { 'data-cc-panels': '' },
    h('section', { 'data-blit': '', id: 'notes', 'data-panel': '{"at":"left","title":"Notes"}' }, h('p', { id: 'note-text' }, 'Hi')),
    h('section', { 'data-blit': '', id: 'more', 'data-panel': '{"at":"left"}' })));
  const notes = layer.root.find('notes');
  assert.ok(notes, 'the markup panel was not adopted');
  assert.deepEqual(layer.list(), [notes, layer.root.find('more')]);
  assert.deepEqual([panelOf(notes).active, panelOf(layer.root.find('more')).active], [true, false], 'no member said active: the first is');
  assert.equal(panelOf(notes).at, 'left');
  assert.equal(bodyOf(notes).firstElementChild.id, 'note-text');
  assert.equal(notes.el.firstElementChild, bar(notes), 'the bar comes first');
  assert.equal(bar(notes).nextElementSibling, bodyOf(notes), 'then the body');
});

test('add - the content moves into a new frame\'s body; the title reaches the DOM as text', (t) => {
  const { host, layer } = scene(t, h('div', { id: 'sheet' }, 'Rows'));
  const content = host.querySelector('#sheet');
  const sheet = layer.add(content, { id: 'sheet-panel', at: 'right', title: '<b>Sheet</b>' });
  assert.equal(bodyOf(sheet).firstElementChild, content);
  assert.equal(sheet.el.parentElement, layer.root.el.querySelector('[data-blit-plane]'));
  assert.equal(sheet.el.querySelector('.cloudcanvas-panel-title').textContent, '<b>Sheet</b>');
  assert.equal(sheet.el.querySelector('b'), null, 'a title became markup');
  const empty = layer.add(null, { id: 'empty' });
  assert.equal(bodyOf(empty).childNodes.length, 0);
});

test('add - bad options are refused before anything moves', (t) => {
  const { host, layer } = scene(t, h('div', { id: 'sheet' }, 'Rows'));
  const content = host.querySelector('#sheet');
  assert.throws(() => layer.add(content, { at: 'side' }), TypeError);
  assert.throws(() => layer.add('#sheet', {}), TypeError);
  assert.equal(content.parentElement, host);
  assert.deepEqual(layer.list(), []);
});

test('options - round-trip through b.spec: what was written reads back, and a copy made from it matches', (t) => {
  const { layer } = scene(t);
  const given = { at: 'right', size: 420, title: 'Sheet', controls: ['collapse', 'close'], note: 'kept' };
  const sheet = layer.add(null, { id: 'sheet', ...given });
  assert.deepEqual(sheet.spec.panel, given);
  setPanel(sheet, { pinned: false, box: { w: 520 } });
  assert.deepEqual(sheet.spec.panel, { ...given, pinned: false, box: { w: 520 } });
  const copy = layer.add(null, { id: 'copy', ...sheet.spec.panel, at: 'left' });
  const { at, active, ...rest } = panelOf(copy);
  const { at: atSheet, active: activeSheet, ...restSheet } = panelOf(sheet);
  assert.deepEqual(rest, restSheet);
  assert.deepEqual([at, atSheet, active, activeSheet], ['left', 'right', true, true]);
});

test('setPanel, panelOf, bodyOf - merge and write, the options whole, the body; a non-panel is refused', (t) => {
  const { layer, root } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'right' });
  const after = setPanel(sheet, { title: 'Sheet' });
  assert.equal(after.at, 'right');
  assert.equal(after.title, 'Sheet');
  assert.deepEqual(panelOf(sheet), after);
  assert.deepEqual(panelOf(sheet).size, { x: 360, y: 360 });
  panelOf(sheet).box.w = 1;
  assert.equal(panelOf(sheet).box.w, 480, 'panelOf handed out its own state');
  assert.throws(() => setPanel(sheet, { at: 'nowhere' }), TypeError);
  assert.equal(panelOf(sheet).at, 'right', 'a refused patch wrote something');
  const plain = blit(root.host).blit({ x: 1 });
  for (const fn of [panelOf, bodyOf, (b) => setPanel(b, {})]) assert.throws(() => fn(plain), /not a panel/);
});

test('placement - each panel is placed in layer px by the port; a new one shows once placed; a host resize re-places', (t) => {
  const { layer, root, settle } = scene(t);
  const right = layer.add(null, { id: 'right', at: 'right', size: 300 });
  const float = layer.add(null, { id: 'float', box: { x: 40, y: 50, w: 300, h: 200 } });
  assert.equal(right.el.hidden, true, 'a new panel shows before it is placed');
  settle();
  assert.equal(right.el.hidden, false);
  assert.deepEqual(box(right), { x: 700, y: 0, w: 300, h: 800 });
  assert.deepEqual(box(float), { x: 40, y: 50, w: 300, h: 200 });
  assert.match(right.el.style.transform, /translate3d\(700\.00px, 0\.00px/);
  setElementSize(layer.el, 600, 500);
  root.applied = null;
  settle();
  assert.deepEqual(box(right), { x: 300, y: 0, w: 300, h: 500 });
});

test('placement - a drawer never covers another panel\'s bar: it runs between the pinned strips it meets', (t) => {
  const { layer, settle } = scene(t);
  const bottom = layer.add(null, { id: 'bottom', at: 'bottom', size: 200 });
  const drawer = layer.add(null, { id: 'drawer', at: 'right', size: 300, pinned: false });
  const top = layer.add(null, { id: 'top', at: 'top', collapsed: true });
  settle();
  assert.deepEqual(box(drawer), { x: 700, y: 28, w: 300, h: 800 - 28 - 200 });
  assert.deepEqual(box(bottom), { x: 0, y: 600, w: 1000, h: 200 }, 'a drawer took room from the bottom strip');
  setPanel(drawer, { pinned: true });
  settle();
  assert.deepEqual(box(drawer), { x: 700, y: 0, w: 300, h: 800 }, 'pinned, it runs the full height');
  assert.deepEqual(box(bottom), { x: 0, y: 600, w: 700, h: 200 });
  assert.deepEqual(box(top), { x: 0, y: 0, w: 700, h: 28 });
});

test('insets - written on the host once per change, only the values that moved, each change announced', (t) => {
  const { host, layer, settle } = scene(t);
  const insets = heard(host, 'panels:inset');
  const right = layer.add(null, { id: 'right', at: 'right', size: 300 });
  layer.add(null, { id: 'float' });
  settle();
  assert.equal(host.style.getPropertyValue('--cc-panels-right'), '300px');
  assert.equal(host.style.getPropertyValue('--cc-panels-left'), '0px');
  assert.deepEqual(insets, [{ top: 0, right: 300, bottom: 0, left: 0 }]);
  assert.deepEqual(layer.insets, { top: 0, right: 300, bottom: 0, left: 0 });

  const spy = installDomSpy();
  t.after(spy.restore);
  setPanel(right, { size: 340 });
  settle();
  const writes = spy.writes().filter((entry) => entry.name === 'style.setProperty');
  assert.deepEqual(writes.map((entry) => entry.detail), ['--cc-panels-right,340px'], 'not one write for one change');
  assert.equal(insets.length, 2);

  spy.clear();
  setPanel(right, { title: 'Sheet' });
  setPanel(right, { pinned: false });
  setPanel(right, { pinned: true });
  settle();
  assert.deepEqual(spy.writes().filter((entry) => entry.name === 'style.setProperty'), [], 'a change that moved no inset wrote one');
  assert.equal(insets.length, 2);
});

test('tabs - a panel put into an occupied slot becomes active and takes its size, pinned and collapsed', async (t) => {
  const { layer, settle } = scene(t);
  const first = layer.add(null, { id: 'first', at: 'right', size: 300, pinned: false, title: 'First' });
  settle();
  const second = layer.add(null, { id: 'second', at: 'left', size: 500, title: 'Second' });
  settle();
  setPanel(second, { at: 'right' });
  settle();
  assert.deepEqual([panelOf(second).active, panelOf(first).active], [true, false]);
  assert.deepEqual([panelOf(second).size, panelOf(second).pinned], [{ x: 300, y: 500 }, false], 'the slot\'s size on its axis only');
  assert.equal(first.el.hidden, true, 'the other member is displayed');
  assert.equal(second.el.hidden, false);
  const tabs = Array.from(second.el.querySelectorAll('[role="tab"]'), (tab) => [tab.textContent, tab.getAttribute('aria-selected')]);
  assert.deepEqual(tabs, [['First', 'false'], ['Second', 'true']]);
  assert.equal(second.el.querySelector('[role="tablist"]').hidden, false);
  assert.equal(second.el.querySelector('.cloudcanvas-panel-title').hidden, true);
  assert.deepEqual(box(first), box(second), 'tabs of one frame stand in one place');
  await microtask();
});

test('tabs - a write that sets the slot setting itself keeps it; a new panel takes what it was not given', (t) => {
  const { layer, settle } = scene(t);
  const first = layer.add(null, { id: 'first', at: 'right', size: 300 });
  const second = layer.add(null, { id: 'second', at: 'right', collapsed: true });
  settle();
  assert.deepEqual([panelOf(second).size.x, panelOf(second).collapsed, panelOf(second).active], [300, true, true]);
  const third = layer.add(null, { id: 'third', at: 'left' });
  setPanel(third, { at: 'right', size: 450 });
  assert.deepEqual(panelOf(third).size, { x: 450, y: 450 }, 'a number written is both axes');
  assert.equal(panelOf(first).active, false);
});

test('tabs - floating panels of one group share a frame; switching carries the box; the active one leaving hands it on', (t) => {
  const { layer, settle } = scene(t);
  const a = layer.add(null, { id: 'a', group: 'tools', box: { x: 40, y: 40, w: 300, h: 200 }, title: 'A' });
  const b = layer.add(null, { id: 'b', group: 'tools', title: 'B' });
  const c = layer.add(null, { id: 'c', title: 'C' });
  settle();
  assert.deepEqual([panelOf(a).active, panelOf(b).active, panelOf(c).active], [false, true, true]);
  assert.deepEqual(panelOf(b).box, { x: 40, y: 40, w: 300, h: 200 });
  setPanel(b, { box: { x: 100, y: 120 } });
  b.el.querySelector('[role="tab"]').click();
  assert.deepEqual([panelOf(a).active, panelOf(b).active], [true, false]);
  assert.deepEqual(panelOf(a).box, { x: 100, y: 120, w: 300, h: 200 });
  setPanel(a, { open: false });
  assert.equal(panelOf(b).active, true);
  settle();
  assert.equal(b.el.hidden, false);
  assert.deepEqual(box(b), { x: 100, y: 120, w: 300, h: 200 });
  assert.equal(b.el.querySelector('[role="tablist"]').hidden, true, 'one open member shows its title');
});

test('panel:change - once a task settles, with the place it came from; dismiss and refused on the panel', async (t) => {
  const { layer } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'right' });
  const changes = heard(sheet.el, 'panel:change');
  setPanel(sheet, { at: 'left' });
  setPanel(sheet, { collapsed: true });
  assert.deepEqual(changes, [], 'announced before the task settled');
  await microtask();
  assert.deepEqual(changes, [{ at: 'left', pinned: true, collapsed: true, open: true, active: true, from: 'right', window: null }]);
  setPanel(sheet, { title: 'only the title' });
  await microtask();
  assert.equal(changes.length, 1, 'a title is not a change of place');
  setPanel(sheet, { at: 'right' });
  setPanel(sheet, { at: 'left' });
  await microtask();
  assert.equal(changes.length, 1, 'a round trip within a task is no change');
});

test('restart - a write through b.set restarts the trait, and the bar, its buttons and the focus stay put', async (t) => {
  const { layer, settle } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'right', title: 'Sheet' });
  settle();
  const theBar = bar(sheet);
  const close = sheet.el.querySelector('[aria-label="Close Sheet"]');
  close.focus();
  assert.equal(document.activeElement, close);
  sheet.set({ panel: { ...sheet.spec.panel, title: 'Renamed' } });
  await microtask();
  assert.equal(bar(sheet), theBar, 'the bar was rebuilt');
  assert.equal(sheet.el.querySelector('[aria-label="Close Renamed"]'), close, 'the button was rebuilt');
  assert.equal(document.activeElement, close, 'the focus moved');
  assert.equal(sheet.el.querySelectorAll('.cloudcanvas-panel-bar').length, 1);
  sheet.set({ panel: { ...sheet.spec.panel } });
  await microtask();
  assert.equal(bar(sheet), theBar);
});

test('content - never rewritten: the same nodes through every write, and content that replaces its children keeps working', (t) => {
  const { host, layer, settle } = scene(t, h('ul', { id: 'list' }, h('li', null, 'One')));
  const list = host.querySelector('#list');
  const item = list.firstChild;
  const sheet = layer.add(list, { id: 'sheet', at: 'right' });
  for (const patch of [{ at: 'float' }, { collapsed: true }, { at: 'modal' }, { open: false }, { open: true, at: 'left' }]) setPanel(sheet, patch);
  settle();
  assert.equal(bodyOf(sheet).firstChild, list);
  assert.equal(list.firstChild, item);
  list.replaceChildren(document.createElement('li'), document.createElement('li'));
  setPanel(sheet, { title: 'After' });
  assert.equal(list.children.length, 2);
  assert.equal(bodyOf(sheet).childNodes.length, 1);
  assert.equal(sheet.el.querySelector('.cloudcanvas-panel-title').textContent, 'After');
});

test('restart - {panel: false} hands the element back: the bar gone, the content unwrapped, the handles off', async (t) => {
  const { host, layer } = scene(t, h('p', { id: 'para' }, 'Text'));
  const sheet = layer.add(host.querySelector('#para'), { id: 'sheet', at: 'float' });
  assert.ok(sheet.el.querySelector('.cloudcanvas-resize-handle'));
  sheet.set({ panel: false });
  await microtask();
  assert.equal(bar(sheet), null);
  assert.equal(sheet.el.firstElementChild.id, 'para');
  assert.equal(sheet.el.querySelector('.cloudcanvas-resize-handle'), null);
  assert.equal(sheet.el.classList.contains('cloudcanvas-panel'), false);
  assert.throws(() => panelOf(sheet), /not a panel/);
  assert.deepEqual(layer.list(), []);
});

test('off - every content element goes back where it came from; the layer and its variables are removed', (t) => {
  const { host, layer, settle } = scene(t, h('div', { id: 'before' }), h('div', { id: 'sheet' }, 'Rows'), h('div', { id: 'after' }));
  const content = host.querySelector('#sheet');
  layer.add(content, { id: 'sheet-panel', at: 'right' });
  settle();
  assert.equal(host.style.getPropertyValue('--cc-panels-right'), '360px');
  layer.off();
  assert.deepEqual(Array.from(host.children, (child) => child.id), ['before', 'sheet', 'after']);
  assert.equal(content.textContent, 'Rows');
  assert.equal(host.querySelector('[data-cc-panels]'), null);
  assert.equal(host.style.getPropertyValue('--cc-panels-right'), '');
  assert.throws(() => layer.add(null, {}), /off/);
  assert.notEqual(panels(host), layer, 'a new layer can be made on the host');
});

test('snapshot, apply and list - plain data by id; unknown ids ignored; every patch checked first', (t) => {
  const { layer } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'right' });
  const tools = layer.add(null, { id: 'try', at: 'left' });
  layer.add(null, { at: 'top' });
  assert.equal(layer.list().length, 3);
  assert.deepEqual(layer.list().slice(0, 2), [sheet, tools]);
  const snap = layer.snapshot();
  assert.deepEqual(Object.keys(snap), ['sheet', 'try']);
  assert.deepEqual(JSON.parse(JSON.stringify(snap)), snap);
  layer.apply({ sheet: { at: 'full' }, nobody: { at: 'left' } });
  assert.equal(panelOf(sheet).at, 'full');
  assert.throws(() => layer.apply({ try: { at: 'top' }, sheet: { at: 'bad' } }), TypeError);
  assert.equal(panelOf(tools).at, 'left', 'one patch landed before another was refused');
});

test('idle - a settled layer writes nothing, reads nothing and asks for no frame', (t) => {
  const { layer, root, requests } = scene(t);
  layer.add(null, { id: 'right', at: 'right' });
  layer.add(null, { id: 'float', group: 'g' });
  layer.add(null, { id: 'modal', at: 'modal' });
  for (let frame = 0; frame < 4; frame += 1) loopStep(root, 16 * (frame + 1));
  const asked = requests.length;
  const spy = installDomSpy();
  t.after(spy.restore);
  for (let frame = 0; frame < 5; frame += 1) {
    loopStep(root, 200 + frame * 16);
    assert.deepEqual(spy.entries, [], `frame ${frame} touched the DOM`);
  }
  assert.equal(requests.length, asked, 'an idle layer asked for a frame');
  assert.equal(root.rafId, null);
});
