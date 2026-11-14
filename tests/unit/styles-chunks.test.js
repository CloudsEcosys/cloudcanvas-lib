/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The stylesheet as per-owner chunks (`.plugin/graphics/css/`).
 *
 * Each add-on that needs CSS owns one chunk and injects it once, when it first
 * runs (the display types when they are registered, the board chunk through
 * `injectBoardStyles`), and adds nothing where the whole sheet is already in
 * the document. `CANVAS_DEFAULT_CSS` is every chunk at once, each exactly once,
 * and none of the retired shell's selectors survives in it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { blit } from 'cloudcanvas';
import { toast } from '../../plugins/actions.js';
import { announce } from '../../plugins/announce.js';
import { drag } from '../../plugins/drag.js';
import { focusBlit } from '../../plugins/focus.js';
import { layout } from '../../plugins/layout.js';
import { menu } from '../../plugins/menu.js';
import { pan } from '../../plugins/pan.js';
import { panels } from '../../plugins/panel.js';
import { resize } from '../../plugins/resize.js';
import { select } from '../../plugins/select.js';
import { svgState } from '../../plugins/svg-state.js';
import { registerDisplayTypes } from '../../plugins/types.js';
import { LIVE_REGION_CSS } from '../../plugins/css/announce.js';
import { BOARD_CSS } from '../../plugins/css/board.js';
import { CARD_CSS } from '../../plugins/css/card.js';
import { DRAG_CSS } from '../../plugins/css/drag.js';
import { FOCUS_CSS } from '../../plugins/css/focus.js';
import { LAYOUT_CSS } from '../../plugins/css/layout.js';
import { MENU_CSS } from '../../plugins/css/menu.js';
import { PAN_CSS } from '../../plugins/css/pan.js';
import { PANEL_CSS } from '../../plugins/css/panel.js';
import { RESIZE_CSS } from '../../plugins/css/resize.js';
import { SELECT_CSS } from '../../plugins/css/select.js';
import { SVG_STATE_CSS } from '../../plugins/css/svg-state.js';
import { TOAST_CSS } from '../../plugins/css/toast.js';
import { CANVAS_DEFAULT_CSS, CSS_CHUNKS } from '../../plugins/styles-css.js';
import { BASE_STYLE_ID, injectBoardStyles, injectCanvasStyles } from '../../plugins/styles.js';
import { coreScene } from '../helpers/core-scene.js';

/** Each chunk under the id suffix its owner injects it with. */
const CHUNKS = Object.freeze({
  board: BOARD_CSS, pan: PAN_CSS, card: CARD_CSS, layout: LAYOUT_CSS, select: SELECT_CSS, focus: FOCUS_CSS,
  drag: DRAG_CSS, resize: RESIZE_CSS, 'svg-state': SVG_STATE_CSS, menu: MENU_CSS, panel: PANEL_CSS, toast: TOAST_CSS,
  announce: LIVE_REGION_CSS
});

/** A selector each chunk owns: it opens a rule in that chunk and in no other. */
const OWNED = Object.freeze({
  board: '[data-blit-root] {',
  pan: '[data-blit-root][data-pan] {',
  card: '.cloudcanvas-card-title {',
  layout: '[data-blit].is-layout-row, [data-scope].is-layout-row {',
  select: '[data-blit].is-selected {',
  focus: '[data-blit].is-focused {',
  drag: '.cloudcanvas-grab-handle {',
  resize: '.cloudcanvas-resize-handle {',
  'svg-state': '.cloudcanvas-svg-state-wrapper {',
  menu: '.cloudcanvas-context-menu {',
  panel: '.cloudcanvas-panel-bar {',
  toast: '.cloudcanvas-toast {',
  announce: '.cloudcanvas-live-region {'
});

/** The retired shell's selectors: nothing carries them any more. */
const RETIRED = Object.freeze([
  '.cloudcanvas-host', '.cloudcanvas-plane', '.cloudcanvas-svg-layer', '.cloudcanvas-overlay-layer',
  '.cloudcanvas-focus-veil', '.cloudcanvas-primitive-card', '.is-dormant', '.cc-elevated', '.cc-dragging'
]);

const chunkElements = () => Array.from(document.head.querySelectorAll('style[id^="blit-css-"]'));

/** Take every stylesheet this file adds back out of the head. */
function cleanHead() {
  for (const element of chunkElements()) element.remove();
  document.getElementById(BASE_STYLE_ID)?.remove();
}

blit.use({ drag, layout, resize, select, svgState });

test('CANVAS_DEFAULT_CSS - is every chunk, in order, and nothing else', () => {
  assert.equal(CSS_CHUNKS.join(''), CANVAS_DEFAULT_CSS);
  assert.deepEqual([...CSS_CHUNKS].sort(), Object.values(CHUNKS).sort(), 'a chunk is missing from the whole, or unowned');
  for (const chunk of CSS_CHUNKS) assert.ok(chunk.trim().length > 0, 'an empty chunk');
});

test('chunks - each chunk appears exactly once in the whole', () => {
  for (const [name, chunk] of Object.entries(CHUNKS)) {
    const first = CANVAS_DEFAULT_CSS.indexOf(chunk);
    assert.notEqual(first, -1, `${name} is not a slice of the sheet`);
    assert.equal(CANVAS_DEFAULT_CSS.indexOf(chunk, first + 1), -1, `${name} appears twice`);
  }
});

test('chunks - each add-on owns its selectors', () => {
  for (const [name, selector] of Object.entries(OWNED)) {
    const owners = Object.entries(CHUNKS).filter(([, chunk]) => chunk.includes(selector)).map(([owner]) => owner);
    assert.deepEqual(owners, [name], `${selector} is opened by ${owners.join(', ') || 'no chunk'}`);
  }
});

test('chunks - no retired shell selector survives anywhere in the sheet', () => {
  for (const selector of RETIRED) assert.equal(CANVAS_DEFAULT_CSS.includes(selector), false, `${selector} is still styled`);
});

/** Run every owner once, twice where a second run could double an injection. */
function runEveryOwner(t, app, root) {
  injectBoardStyles();
  injectBoardStyles();
  registerDisplayTypes();
  registerDisplayTypes();
  t.after(menu(app, { items: [{ id: 'hi', label: 'Hi', action() {} }] }));
  t.after(announce(app));
  t.after(pan(app));
  const first = app.blit({ x: 0, y: 0, resize: true, drag: true, select: true, layout: 'row' });
  app.blit({ x: 10, y: 10, resize: true, drag: true, select: true });
  app.blit({ svgState: { states: { idle: 'M0 0 L10 10' }, initialState: 'idle' } });
  focusBlit({ frame: false }, first, root);
  toast(app, 'hi');
  const shell = document.createElement('div');
  shell.style.position = 'relative';
  document.body.appendChild(shell);
  panels(shell);
  panels(shell);
}

test('install - each add-on injects its own chunk, once per document', (t) => {
  // The test setup imports the defaults, whose board and display types have already injected theirs.
  cleanHead();
  t.after(cleanHead);
  const { app, root } = coreScene(t);
  runEveryOwner(t, app, root);

  const byId = Object.fromEntries(chunkElements().map((element) => [element.id, element.textContent]));
  assert.deepEqual(Object.keys(byId).sort(), Object.keys(CHUNKS).map((name) => `blit-css-${name}`).sort());
  for (const [name, chunk] of Object.entries(CHUNKS)) assert.equal(byId[`blit-css-${name}`], chunk, name);
  assert.equal(chunkElements().length, Object.keys(CHUNKS).length, 'a chunk was injected twice');
});

test('install - a second root reuses the chunk element', (t) => {
  t.after(cleanHead);
  const { app } = coreScene(t);
  t.after(menu(app, { items: [] }));
  const first = document.getElementById('blit-css-menu');
  const other = document.createElement('div');
  other.id = 'other';
  document.body.appendChild(other);
  t.after(menu(blit('#other'), { items: [] }));
  assert.equal(document.querySelectorAll('#blit-css-menu').length, 1);
  assert.equal(document.getElementById('blit-css-menu'), first);
});

test('install - the whole sheet already carries every chunk: nothing is added', (t) => {
  cleanHead();
  t.after(cleanHead);
  injectCanvasStyles();
  const { app, root } = coreScene(t);
  runEveryOwner(t, app, root);
  assert.equal(chunkElements().length, 0);
});

test('install - the core stylesheet is not a chunk and stays its own element', (t) => {
  cleanHead();
  t.after(cleanHead);
  coreScene(t);
  assert.equal(chunkElements().length, 0, 'the core alone injected an add-on chunk');
  assert.ok(document.getElementById('blit-css'), 'the core sheet is missing');
});
