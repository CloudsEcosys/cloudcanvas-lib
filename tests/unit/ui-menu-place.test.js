/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Where a menu opens: at the point it is given, or below its anchor, and
 * always inside the visual viewport - the part of the page that can be seen,
 * which a pinch or an on-screen keyboard makes smaller than the window. A
 * submenu opens beside its item. The test DOM has no layout, so each test says
 * what it measures: the panel's box, the anchor's, the viewport's.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMenu } from '../../ui/index.js';
import { key, mount, stubBox } from '../helpers/ui.js';

const ITEMS = [{ id: 'open', label: 'Open' }, { id: 'move', label: 'Move to', items: [{ id: 'left', label: 'Left' }, { id: 'right', label: 'Right' }] }];
const MODEL = Object.freeze({ open: true, label: 'Tab actions', items: ITEMS });

/** The least room the menu keeps between itself and the edge of what can be seen. */
const EDGE = 8;

const panels = (host) => [...host.querySelectorAll('[role="menu"]')];
const cornerOf = (panel) => [panel.style.left, panel.style.top];

/** Give the window a visual viewport for the rest of the test. */
function stubViewport(t, viewport) {
  const descriptor = Object.getOwnPropertyDescriptor(window, 'visualViewport');
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
  t.after(() => {
    if (descriptor) Object.defineProperty(window, 'visualViewport', descriptor);
    else delete window.visualViewport;
  });
}

/** A button with a box, in a host that is removed after the test. */
function anchorIn(t, box) {
  const node = document.createElement('button');
  mount(t).append(node);
  return stubBox(node, box);
}

test('menu: opens at the point it is given, pulled back inside the window with a margin', (t) => {
  const host = mount(t);
  const menu = createMenu(host);
  const [panel] = panels(host);
  stubBox(panel, { width: 200, height: 120 });
  const at = (x, y) => { menu.update({ ...MODEL, at: { x, y } }); return cornerOf(panel); };
  assert.deepEqual(at(50, 60), ['50px', '60px'], 'where it was asked for');
  assert.deepEqual(at(5000, 5000), [`${window.innerWidth - 200 - EDGE}px`, `${window.innerHeight - 120 - EDGE}px`], 'in from the far edges');
  assert.deepEqual(at(-40, 2), [`${EDGE}px`, `${EDGE}px`], 'and from the near ones');
  assert.deepEqual([panel.style.maxWidth, panel.style.maxHeight], [`${window.innerWidth - 2 * EDGE}px`, `${window.innerHeight - 2 * EDGE}px`],
    'never larger than the room there is: a long menu scrolls inside itself');
  menu.update({ ...MODEL, open: false });
  assert.deepEqual(at(70, 80), ['70px', '80px'], 'each opening is placed afresh');
  menu.destroy();
});

test('menu: with no point it opens below its anchor, at the anchor\'s near edge; a point wins over the anchor', (t) => {
  const host = mount(t);
  const menu = createMenu(host);
  const [panel] = panels(host);
  stubBox(panel, { width: 200, height: 120 });
  const anchor = anchorIn(t, { left: 30, top: 40, width: 80, height: 20 });
  menu.update({ ...MODEL, anchor });
  assert.deepEqual(cornerOf(panel), ['30px', '60px']);
  menu.update({ ...MODEL, anchor, at: { x: 300, y: 200 } });
  assert.deepEqual(cornerOf(panel), ['300px', '200px'], 'the anchor is then only where focus goes back to');
  menu.update({ ...MODEL, anchor: anchorIn(t, { left: 990, top: 760, width: 30, height: 20 }) });
  assert.deepEqual(cornerOf(panel), [`${window.innerWidth - 200 - EDGE}px`, `${window.innerHeight - 120 - EDGE}px`], 'an anchor in the corner: still inside');
  menu.update({ ...MODEL, open: false });
  const before = anchorIn(t, { left: 400, top: 300, width: 60, height: 24 });
  before.focus();
  menu.update(MODEL);
  assert.deepEqual(cornerOf(panel), ['400px', '324px'], 'neither given: below what had focus, which is where focus goes back to');
  menu.update({ ...MODEL, at: { x: Number.NaN, y: 10 } });
  assert.deepEqual(cornerOf(panel), ['400px', '324px'], 'a point that is no point is no point');
  menu.destroy();
});

test('menu: the box it is held in is the visual viewport, not the window - a pinched page, a page behind a keyboard', (t) => {
  const host = mount(t);
  const menu = createMenu(host);
  const [panel] = panels(host);
  stubBox(panel, { width: 200, height: 120 });
  stubViewport(t, { offsetLeft: 100, offsetTop: 50, width: 400, height: 300 });
  const at = (x, y) => { menu.update({ ...MODEL, at: { x, y } }); return cornerOf(panel); };
  assert.deepEqual(at(0, 0), ['108px', '58px'], 'what is left and above the viewport cannot be seen');
  assert.deepEqual(at(900, 900), ['292px', '222px'], 'nor what is right of it and below');
  assert.deepEqual(at(150, 100), ['150px', '100px'], 'a point inside it is kept');
  assert.deepEqual([panel.style.maxWidth, panel.style.maxHeight], ['384px', '284px']);
  stubBox(panel, { width: 600, height: 500 });
  assert.deepEqual(at(200, 200), ['108px', '58px'], 'too big to fit: its near corner stays in view, where its first item is');
  menu.destroy();
});

test('menu: where an ancestor moves fixed boxes, the menu still lands on the point', (t) => {
  const host = mount(t);
  const menu = createMenu(host);
  const [panel] = panels(host);
  // What a transformed ancestor does: the panel's own origin is 40, 30 into the viewport.
  stubBox(panel, { left: 40, top: 30, width: 200, height: 120 });
  menu.update({ ...MODEL, at: { x: 300, y: 200 } });
  assert.deepEqual(cornerOf(panel), ['260px', '170px'], 'measured from where its own origin falls');
  menu.destroy();
});

test('menu: a submenu opens beside its item, level with it - on the other side where there is no room - and inside the viewport', (t) => {
  const host = mount(t);
  const menu = createMenu(host);
  menu.update(MODEL);
  const flyout = panels(host)[1];
  const parent = host.querySelector('[data-ui-id="move"]');
  stubBox(flyout, { width: 150, height: 90 });
  const beside = (box) => {
    stubBox(parent, box);
    parent.focus();
    key(parent, 'ArrowRight');
    const corner = cornerOf(flyout);
    key(document.activeElement, 'ArrowLeft');
    return corner;
  };
  assert.deepEqual(beside({ left: 100, top: 200, width: 180, height: 28 }), ['280px', '200px'], 'at its item\'s far edge');
  assert.deepEqual(beside({ left: 800, top: 300, width: 180, height: 28 }), ['650px', '300px'], 'no room there: before its near edge');
  assert.deepEqual(beside({ left: 800, top: 740, width: 180, height: 28 }), ['650px', `${window.innerHeight - 90 - EDGE}px`], 'and never past the bottom');
  assert.deepEqual(beside({ left: 100, top: 200, width: 900, height: 28 }), [`${window.innerWidth - 150 - EDGE}px`, '200px'],
    'room on neither side: over its item, inside the viewport');
  parent.focus();
  key(parent, 'ArrowRight');
  stubBox(parent, { left: 40, top: 60, width: 180, height: 28 });
  menu.update(MODEL);
  assert.deepEqual(cornerOf(flyout), ['220px', '60px'], 'a redraw places an open submenu again, beside where its item now is');
  menu.destroy();
});
