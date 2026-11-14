/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The panel's window place on the repository's DOM, against a fake window (a second document behind
 * `window.open`): the frame moves there with the stylesheets and the title, its blit staying in the tree; only
 * `place` and `close` show; `panel:change` carries the window; tabs share one; leaving, closing the window, the
 * close control, the opener going and `off()` all bring frames back; a window that cannot open is refused.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { runFrame } from 'cloudcanvas/testing';
import { stateOf } from 'cloudcanvas/kernel';
import { bodyOf, panelOf, panels, setPanel } from '../../plugins/panel.js';
import { resetDocument, setElementSize } from '../helpers/dom.js';

// Loaded up front, so the add-on's own `import()` of it resolves within a task.
await import('../../plugins/panel-window.js');

/** A second document behind an EventTarget: what the add-on uses of a window. */
function fakeWindow() {
  const win = new EventTarget();
  win.document = document.implementation.createHTMLDocument('');
  win.closed = false;
  win.close = () => {
    if (win.closed) return;
    win.closed = true;
    win.dispatchEvent(new Event('pagehide'));
  };
  return win;
}

/** A layer whose `window.open` hands out fake windows (or what `opener` returns), frames run by hand. */
function scene(t, opener) {
  const realRaf = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = () => 1;
  const view = document.defaultView;
  const opened = [];
  const realOpen = view.open;
  view.open = (...args) => {
    const win = opener ? opener(...args) : fakeWindow();
    if (win) opened.push({ args, win });
    return win;
  };
  t.after(() => { view.open = realOpen; globalThis.requestAnimationFrame = realRaf; resetDocument(); });
  const host = document.createElement('div');
  host.style.position = 'relative';
  document.body.appendChild(host);
  const layer = panels(host);
  setElementSize(layer.el, 1000, 800);
  const root = stateOf(layer.el).root;
  return { host, layer, opened, settle: () => { runFrame(root); runFrame(root); } };
}

const loaded = () => new Promise((resolve) => setTimeout(resolve, 0));
const shownControls = (b) => Array.from(b.el.querySelectorAll('.cloudcanvas-panel-control'))
  .filter((button) => !button.hidden).map((button) => button.getAttribute('data-cc-key'));
const heard = (b, type) => {
  const seen = [];
  b.on(type, (event) => seen.push(event.detail.payload));
  return seen;
};

test('window - the frame, bar included, moves to its own window with the stylesheets; the blit stays in the tree', async (t) => {
  const { layer, opened, settle } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'right', title: 'Sheet', box: { w: 420, h: 300 } });
  settle();
  setPanel(sheet, { at: 'window' });
  assert.equal(opened.length, 1, 'the window was not opened at once, inside the gesture');
  const [url, name, features] = opened[0].args;
  assert.equal(url, '');
  assert.match(name, /window:sheet/);
  assert.equal(features, 'popup,width=420,height=300');
  await loaded();
  const doc = opened[0].win.document;
  assert.equal(sheet.el.ownerDocument, doc);
  assert.equal(sheet.el.parentElement, doc.body);
  assert.ok(doc.body.hasAttribute('data-cc-panels'));
  assert.equal(doc.title, 'Sheet');
  assert.ok(doc.getElementById('blit-css-panel'), 'the panel chunk was not copied');
  assert.equal(doc.querySelectorAll('script').length, 0);
  assert.equal(sheet.el.style.transform, '', 'the layer placement came along');
  assert.equal(sheet.el.hidden, false);
  assert.deepEqual(layer.list(), [sheet], 'the blit left the tree');
  assert.equal(layer.root.find('sheet'), sheet);
  assert.equal(panelOf(sheet).at, 'window');
  assert.deepEqual(shownControls(sheet), ['place', 'close']);
  assert.equal(stateOf(sheet.el).cleanups.has('panel'), true, 'the trait stopped while away');
});

test('window - panel:change carries the window while the panel is there, and null once it is back', async (t) => {
  const { layer, opened } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'right' });
  const changes = heard(sheet, 'panel:change');
  setPanel(sheet, { at: 'window' });
  await loaded();
  assert.equal(changes.at(-1).at, 'window');
  assert.equal(changes.at(-1).from, 'right');
  assert.equal(changes.at(-1).window, opened[0].win);
  setPanel(sheet, { at: 'left' });
  await loaded();
  assert.equal(changes.at(-1).window, null);
});

test('window - a tab leaving its edge for a window keeps the window: the slot it left settles first', async (t) => {
  const { layer, opened } = scene(t);
  layer.add(null, { id: 'notes', at: 'left' });
  const tools = layer.add(null, { id: 'tools', at: 'left' });
  // A first round trip, so the window module is loaded and every later sync is immediate.
  setPanel(tools, { at: 'window' });
  await loaded();
  setPanel(tools, { at: 'left' });
  setPanel(tools, { at: 'window' });
  assert.equal(opened[1].win.closed, false, 'the slot it left closed the window it was opening');
  await loaded();
  assert.equal(tools.el.ownerDocument, opened[1].win.document);
});

test('window - setting at elsewhere brings the frame back to the layer, placed again, and closes the window', async (t) => {
  const { layer, opened, settle } = scene(t);
  const content = document.createElement('p');
  const sheet = layer.add(content, { id: 'sheet', at: 'right', size: 300 });
  settle();
  setPanel(sheet, { at: 'window' });
  await loaded();
  setPanel(sheet, { at: 'right' });
  assert.equal(opened[0].win.closed, true);
  assert.equal(sheet.el.parentElement, layer.el.querySelector('[data-blit-plane]'));
  assert.equal(bodyOf(sheet).firstChild, content);
  settle();
  assert.match(sheet.el.style.transform, /translate3d\(700\.00px/);
  assert.equal(sheet.el.style.width, '300px');
});

test('window - closing it by any means brings every frame back to the place it came from, with its settings', async (t) => {
  const { layer, opened, settle } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'left', size: 280, pinned: false });
  const tools = layer.add(null, { id: 'tools' });
  settle();
  setPanel(sheet, { at: 'window' });
  await loaded();
  opened[0].win.close();
  assert.deepEqual([panelOf(sheet).at, panelOf(sheet).size.x, panelOf(sheet).pinned], ['left', 280, false]);
  assert.equal(sheet.el.ownerDocument, document);
  setPanel(tools, { at: 'window' });
  await loaded();
  document.defaultView.dispatchEvent(new Event('pagehide'));
  assert.equal(opened[1].win.closed, true, 'the opener going left the window open');
  assert.equal(panelOf(tools).at, 'float');
  assert.equal(tools.el.ownerDocument, document);
});

test('window - its close control closes the panel and brings the frame back; the window shows place and close only', async (t) => {
  const { layer, opened } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'top', title: 'Sheet' });
  setPanel(sheet, { at: 'window' });
  await loaded();
  let dismissed = 0;
  sheet.on('dismiss', () => { dismissed += 1; });
  sheet.el.querySelector('[aria-label="Close Sheet"]').click();
  assert.equal(dismissed, 1);
  assert.deepEqual([panelOf(sheet).open, panelOf(sheet).at], [false, 'top']);
  assert.equal(opened[0].win.closed, true);
  assert.equal(sheet.el.ownerDocument, document);
});

test('window - its place menu works from the other window and brings the panel back', async (t) => {
  const { layer, opened } = scene(t);
  const sheet = layer.add(null, { id: 'sheet', at: 'right' });
  setPanel(sheet, { at: 'window' });
  await loaded();
  sheet.el.querySelector('[data-cc-key="place"]').click();
  const item = sheet.el.querySelector('[data-cc-panel-place="float"]');
  assert.equal(item.ownerDocument, opened[0].win.document);
  item.click();
  assert.equal(panelOf(sheet).at, 'float');
  assert.equal(opened[0].win.closed, true);
});

test('window - panels sharing window:<group> share one window as tabs; the window closes with its last member', async (t) => {
  const { layer, opened } = scene(t);
  const a = layer.add(null, { id: 'a', group: 'tools', title: 'A' });
  const b = layer.add(null, { id: 'b', group: 'tools', title: 'B', at: 'right' });
  setPanel(a, { at: 'window' });
  setPanel(b, { at: 'window' });
  await loaded();
  assert.equal(opened.length, 1, 'a second window opened for one slot');
  const doc = opened[0].win.document;
  assert.deepEqual([a.el.ownerDocument, b.el.ownerDocument], [doc, doc]);
  assert.deepEqual([a.el.hidden, b.el.hidden], [true, false]);
  assert.equal(doc.title, 'B');
  assert.deepEqual(Array.from(b.el.querySelectorAll('[role="tab"]'), (tab) => tab.textContent), ['A', 'B']);
  b.el.querySelector('[role="tab"]').click();
  assert.deepEqual([a.el.hidden, b.el.hidden], [false, true]);
  assert.equal(doc.title, 'A');
  setPanel(a, { at: 'float' });
  assert.equal(opened[0].win.closed, false);
  setPanel(b, { at: 'right' });
  assert.equal(opened[0].win.closed, true);
});

test('window - a panel opened at window when no window can be had goes back to the place it came from', async (t) => {
  let refuse = false;
  const { layer, settle } = scene(t, () => (refuse ? null : fakeWindow()));
  const sheet = layer.add(null, { id: 'sheet', at: 'right' });
  const refused = heard(sheet, 'panel:refused');
  setPanel(sheet, { at: 'window' });
  await loaded();
  setPanel(sheet, { open: false });
  assert.equal(panelOf(sheet).at, 'window');
  refuse = true;
  setPanel(sheet, { open: true });
  assert.deepEqual([panelOf(sheet).at, panelOf(sheet).open], ['right', true], 'an open panel was left unseen');
  settle();
  assert.equal(sheet.el.hidden, false);
  await loaded();
  assert.equal(refused.length, 1);
});

test('window - when it cannot be opened the place does not change and panel:refused says why', async (t) => {
  let refuse = () => null;
  const { layer } = scene(t, (...args) => refuse(...args));
  const sheet = layer.add(null, { id: 'sheet', at: 'right' });
  const refused = heard(sheet, 'panel:refused');
  setPanel(sheet, { at: 'window', title: 'Kept' });
  assert.deepEqual([panelOf(sheet).at, panelOf(sheet).title, sheet.spec.panel.at], ['right', 'Kept', 'right']);
  refuse = () => { throw new Error('denied'); };
  sheet.set({ panel: { at: 'window' } });
  assert.equal(panelOf(sheet).at, 'right', 'a direct write moved it');
  await loaded();
  assert.equal(refused.length, 2);
  assert.deepEqual(Object.keys(refused[0]), ['at', 'reason']);
  assert.equal(refused[0].at, 'window');
  assert.match(refused[1].reason, /denied/);
});

test('window - off() closes the windows and every content element goes back where it came from', async (t) => {
  const { host, layer, opened } = scene(t);
  const content = document.createElement('div');
  content.id = 'content';
  host.prepend(content);
  layer.add(content, { id: 'sheet', at: 'window' });
  await loaded();
  assert.equal(content.ownerDocument, opened[0].win.document);
  layer.off();
  assert.equal(opened[0].win.closed, true);
  assert.equal(host.firstElementChild, content);
});
