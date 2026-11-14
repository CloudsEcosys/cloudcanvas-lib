/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The UI kit's shared foundation: the List widget's use of the reconciler, and
 * the token stylesheet's own invariants.
 *
 * Two claims are under test, and both are regressions that have actually landed
 * in this codebase before.
 *
 *   1. A list that re-renders must *reuse* its rows. Node identity across two
 *      renders of an equal array is the whole reason `reconcileKeyedList`
 *      exists; a widget that rebuilds its `<ul>` loses focus, scroll position
 *      and the row a screen reader is on, and no amount of correct markup makes
 *      that acceptable. Asserted on element identity, not on markup.
 *   2. Every token a theme overrides must be a token the stylesheet reads.
 *      A theme key nothing reads is a value a consumer sets and watches do
 *      nothing, which is worse than a missing knob because it looks like a
 *      working one. Asserted automatically, by sweeping the sheet.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { KEY_ATTR } from '../../plugins/keyed-list.js';
import { contentOf, isWidget, setContent, setContents } from '../../plugins/widget.js';
import { checkStyleDiscipline } from 'cloudcanvas/style-gates';
import { coreScene, signals } from '../helpers/core-scene.js';
import {
  LIST_CLS,
  LIST_TYPE,
  SELECT_EVENT,
  createList,
  registerList
} from '../../display/list.js';
import {
  LIB_DEFAULT_CSS,
  LIB_LIGHT_THEME,
  LIB_STYLE_ID,
  injectLibStyles
} from '../../styles.js';

/** A list blit in a fresh root. */
function listBlit(t, items, id = 'list_blit') {
  const { app } = coreScene(t);
  return { app, list: createList(app, { id, items }) };
}

/** The reconciled rows of a list blit, in document order. */
function rowsOf(list) {
  return Array.from(list.el.querySelectorAll(`.${LIST_CLS.ITEM}`));
}

/** The payloads of every `type` event the blit hears. */
function heardOn(list, type) {
  const seen = signals(list, type);
  return { get values() { return seen.map((each) => each.payload); } };
}

const ITEMS = Object.freeze([
  Object.freeze({ id: 'a', label: 'Alpha' }),
  Object.freeze({ id: 'b', label: 'Bravo', selected: true }),
  Object.freeze({ id: 'c', label: 'Charlie' })
]);

/* ------------------ LIST ------------------ */

test('createList - the factory defines the widget and places a chromeless list blit', (t) => {
  const { app } = coreScene(t);
  const list = createList(app, { id: 'factory_list', x: 40, y: 12, items: ITEMS });

  assert.equal(isWidget(LIST_TYPE), true, 'the factory did not define the widget');
  assert.equal(list.el.id, 'factory_list');
  assert.equal(list.x, 40);
  assert.equal(list.y, 12);
  assert.equal(list.el.getAttribute('data-type'), LIST_TYPE);
  assert.equal(list.el.getAttribute('data-chrome'), 'false');
  assert.deepEqual(contentOf(list), { items: ITEMS }, 'the contents are not the items alone');
  assert.equal(rowsOf(list).length, ITEMS.length);

  // The kit's sheet arrives with the first widget, exactly once.
  createList(app, { items: [] });
  assert.equal(document.querySelectorAll(`#${LIB_STYLE_ID}`).length, 1);
});

test('list - renders one <li> per item inside a <ul>, with plain list semantics', (t) => {
  const { list } = listBlit(t, ITEMS);
  const ul = list.el.firstElementChild;

  assert.equal(ul.tagName, 'UL');
  assert.equal(ul.className, LIST_CLS.ROOT);

  const rows = rowsOf(list);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map((row) => row.tagName), ['LI', 'LI', 'LI']);
  assert.deepEqual(rows.map((row) => row.textContent), ['Alpha', 'Bravo', 'Charlie']);
  assert.deepEqual(rows.map((row) => row.getAttribute(KEY_ATTR)), ['a', 'b', 'c']);

  // Operable by keyboard, and exempt from the drag machinery.
  for (const row of rows) {
    assert.equal(row.getAttribute('tabindex'), '0');
    assert.equal(row.hasAttribute('data-cc-control'), true);
  }

  // Selection is painted from the item, not from an internal flag.
  assert.deepEqual(rows.map((row) => row.classList.contains(LIST_CLS.ITEM_SELECTED)), [false, true, false]);
  assert.equal(rows[1].getAttribute('aria-current'), 'true');
  assert.equal(rows[0].hasAttribute('aria-current'), false);
});

test('list - an equal write reuses every row instead of rebuilding it', (t) => {
  const { list } = listBlit(t, ITEMS);
  const before = rowsOf(list);
  const ul = list.el.firstElementChild;

  setContent(list, 'items', ITEMS);
  const after = rowsOf(list);
  assert.equal(list.el.firstElementChild, ul, 'the container was rebuilt');
  assert.equal(after.length, before.length);
  for (let index = 0; index < before.length; index += 1) {
    assert.equal(after[index], before[index], `row ${index} was recreated`);
  }

  // A changed label mutates the row that already exists; a new key gets a row.
  setContent(list, 'items', [
    { id: 'a', label: 'Alpha renamed' },
    { id: 'b', label: 'Bravo' },
    { id: 'c', label: 'Charlie' },
    { id: 'd', label: 'Delta' }
  ]);
  const grown = rowsOf(list);
  assert.equal(grown.length, 4);
  assert.equal(grown[0], before[0], 'a relabelled row was recreated');
  assert.equal(grown[0].textContent, 'Alpha renamed');
  assert.equal(grown[2], before[2], 'an untouched row was recreated');
  assert.equal(grown[1].classList.contains(LIST_CLS.ITEM_SELECTED), false, 'a dropped flag stayed painted');

  // ...and a removal takes only what it removes.
  setContent(list, 'items', [{ id: 'c', label: 'Charlie' }]);
  assert.deepEqual(rowsOf(list), [before[2]]);
});

test('list - its event is namespaced away from the select add-on\'s `select`', (t) => {
  // A bare `select` is what the select add-on emits for "this blit is now
  // selected"; an ancestor listening for it would read every row click as one.
  assert.equal(SELECT_EVENT, 'list:select');

  const { list } = listBlit(t, ITEMS);
  const bare = heardOn(list, 'select');
  rowsOf(list)[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(bare.values, [], 'a row click was announced as a blit selection');
});

test('list - a click emits the item id, bubbling, and mutates nothing', (t) => {
  const { app, list } = listBlit(t, ITEMS);
  const heard = heardOn(list, SELECT_EVENT);
  const above = heardOn(app, SELECT_EVENT);

  rowsOf(list)[2].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(heard.values, [{ id: 'c' }]);
  assert.deepEqual(above.values, [{ id: 'c' }], 'the event did not bubble past the list');

  // Enter and Space activate a focused row, and nothing above sees the key.
  const row = rowsOf(list)[0];
  for (const key of ['Enter', ' ']) {
    const event = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    row.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true, `${key} was not claimed by the row`);
  }
  assert.deepEqual(heard.values, [{ id: 'c' }, { id: 'a' }, { id: 'a' }]);

  // An unhandled key is left alone.
  const ignored = new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
  row.dispatchEvent(ignored);
  assert.equal(ignored.defaultPrevented, false);
  assert.equal(heard.values.length, 3);

  // The widget owns no selection state: the items it was handed are untouched.
  assert.deepEqual(contentOf(list).items, ITEMS);
  assert.equal(rowsOf(list)[2].classList.contains(LIST_CLS.ITEM_SELECTED), false, 'the widget selected a row on its own behalf');
});

test('list - a frozen array of frozen items reconciles without a write', (t) => {
  const frozen = Object.freeze([
    Object.freeze({ id: 1, label: 'One' }),
    Object.freeze({ id: 2, label: 'Two' })
  ]);

  // Strict mode: a write to a frozen object throws rather than failing silently,
  // so surviving three renders is proof the widget only ever read the array.
  const { list } = listBlit(t, frozen, 'frozen_list');
  setContent(list, 'items', frozen);
  setContents(list, {});

  assert.equal(rowsOf(list).length, 2);
  assert.deepEqual(frozen.map((item) => Object.keys(item)), [['id', 'label'], ['id', 'label']]);
  assert.deepEqual(rowsOf(list).map((row) => row.getAttribute(KEY_ATTR)), ['1', '2']);

  // A numeric id is emitted as a number, not as its stringified key.
  const heard = heardOn(list, SELECT_EVENT);
  rowsOf(list)[1].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(heard.values, [{ id: 2 }]);
});

test('list - the content keys are closed, and definition is idempotent', (t) => {
  const { list } = listBlit(t, ITEMS, 'schema_list');
  assert.throws(() => setContents(list, { title: 'nope' }), /not permitted/);
  assert.equal(registerList(), registerList());
  assert.equal(registerList().el.getAttribute('data-type'), LIST_TYPE);
});

/* ------------------ STYLESHEET ------------------ */

/** Every class name the kit's fifteen widgets emit, by contract. */
const LIB_CLASSES = [
  'cloudcanvas-lib-button',
  'cloudcanvas-lib-button-primary',
  'cloudcanvas-lib-button-secondary',
  'cloudcanvas-lib-button-ghost',
  'cloudcanvas-lib-button-danger',
  'cloudcanvas-lib-input',
  'cloudcanvas-lib-input-control',
  'cloudcanvas-lib-input-label',
  'cloudcanvas-lib-checkbox',
  'cloudcanvas-lib-checkbox-control',
  'cloudcanvas-lib-radio',
  'cloudcanvas-lib-radio-control',
  'cloudcanvas-lib-radio-group',
  'cloudcanvas-lib-radio-group-label',
  'cloudcanvas-lib-toggle',
  'cloudcanvas-lib-toggle-control',
  'cloudcanvas-lib-slider',
  'cloudcanvas-lib-slider-control',
  'cloudcanvas-lib-select',
  'cloudcanvas-lib-select-control',
  'cloudcanvas-lib-text',
  'cloudcanvas-lib-text-sm',
  'cloudcanvas-lib-text-semibold',
  'cloudcanvas-lib-text-muted',
  'cloudcanvas-lib-badge',
  'cloudcanvas-lib-badge-dismiss',
  'cloudcanvas-lib-avatar',
  'cloudcanvas-lib-avatar-sm',
  'cloudcanvas-lib-avatar-lg',
  'cloudcanvas-lib-divider',
  'cloudcanvas-lib-progress',
  'cloudcanvas-lib-progress-label',
  'cloudcanvas-lib-progress-success',
  'cloudcanvas-lib-progress-warning',
  'cloudcanvas-lib-progress-danger',
  'cloudcanvas-lib-spinner',
  'cloudcanvas-lib-alert',
  'cloudcanvas-lib-alert-danger',
  'cloudcanvas-lib-list',
  'cloudcanvas-lib-list-item',
  'cloudcanvas-lib-list-item-selected'
];

test('LIB_DEFAULT_CSS - styles every class the kit contract names', () => {
  assert.equal(typeof LIB_DEFAULT_CSS, 'string');
  assert.ok(LIB_DEFAULT_CSS.length > 2000, 'the sheet is suspiciously short');

  for (const className of LIB_CLASSES) {
    assert.ok(LIB_DEFAULT_CSS.includes(`.${className}`), `${className} has no rule`);
  }

  // The widget's own table is the same contract, read from the other side.
  for (const className of Object.values(LIST_CLS)) {
    assert.ok(LIB_DEFAULT_CSS.includes(`.${className}`), `${className} is emitted but unstyled`);
  }
});

test('LIB_DEFAULT_CSS - carries the rules that native controls depend on', () => {
  const required = [
    // Accessibility is the entire argument for native controls; the ring is the
    // one thing the sheet can take away from them, so it is asserted here.
    ':focus-visible',
    'outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8))',
    // A native <progress> paints through engine pseudo-elements or not at all.
    '.cloudcanvas-lib-progress::-webkit-progress-bar',
    '.cloudcanvas-lib-progress::-webkit-progress-value',
    '.cloudcanvas-lib-progress::-moz-progress-bar',
    // The switch is CSS-only: no script turns a checkbox into a track and thumb.
    '.cloudcanvas-lib-toggle-control:checked',
    'appearance: none',
    '@keyframes cloudcanvas-lib-spin',
    '@media (pointer: coarse)',
    '@media (prefers-reduced-motion: reduce)'
  ];

  for (const fragment of required) {
    assert.ok(LIB_DEFAULT_CSS.includes(fragment), `missing rule: ${fragment}`);
  }

  // Reduced motion has to reach the one thing in the kit that animates forever.
  const reduced = LIB_DEFAULT_CSS.slice(LIB_DEFAULT_CSS.indexOf('@media (prefers-reduced-motion'));
  assert.match(reduced, /\.cloudcanvas-lib-spinner\s*\{[^}]*animation-duration/);
});

test('LIB_DEFAULT_CSS - keeps the discipline the framework ships as a gate', () => {
  const { violations, stats } = checkStyleDiscipline(LIB_DEFAULT_CSS);

  assert.deepEqual(violations.map((violation) => violation.message), []);
  assert.ok(stats.declarations > 150, `only ${stats.declarations} declarations were parsed`);
  assert.ok(stats.themable > 60, `only ${stats.themable} themable declarations were checked`);
});

test('LIB_LIGHT_THEME - is frozen, additive, and read in full by the sheet', () => {
  assert.equal(Object.isFrozen(LIB_LIGHT_THEME), true);

  const referenced = new Set();
  for (const match of LIB_DEFAULT_CSS.matchAll(/--cc-[a-z0-9-]+/g)) referenced.add(match[0]);

  for (const [name, value] of Object.entries(LIB_LIGHT_THEME)) {
    assert.ok(name.startsWith('--cc-'), `${name} is outside the framework's prefix`);
    assert.ok(referenced.has(name), `${name} is themed but nothing in the sheet reads it`);
    assert.notEqual(String(value).trim(), '', `${name} has an empty value`);
  }

  // The nine tokens this kit introduces, stated so a silent removal fails here.
  assert.deepEqual(Object.keys(LIB_LIGHT_THEME), [
    '--cc-tone-info',
    '--cc-tone-success',
    '--cc-tone-warning',
    '--cc-tone-danger',
    '--cc-input-bg',
    '--cc-input-border',
    '--cc-input-border-focus',
    '--cc-track-bg',
    '--cc-thumb-bg'
  ]);

  // Every one of them is read with its dark default baked in as the fallback,
  // so a page that applies no theme at all still looks designed.
  for (const name of Object.keys(LIB_LIGHT_THEME)) {
    assert.match(
      LIB_DEFAULT_CSS,
      new RegExp(`var\\(${name},\\s*[^)]`),
      `${name} is read without a dark fallback`
    );
  }
});

test('injectLibStyles - writes the kit sheet exactly once per document', (t) => {
  const clean = () => document.getElementById(LIB_STYLE_ID)?.remove();
  t.after(clean);
  clean();

  const first = injectLibStyles();
  assert.equal(first.id, LIB_STYLE_ID);
  assert.equal(first.textContent, LIB_DEFAULT_CSS);
  assert.equal(first.parentNode, document.head);

  first.textContent = '/* a live sheet the browser has already matched */';
  const second = injectLibStyles();

  assert.equal(second, first, 'a second call replaced the kit element');
  assert.equal(second.textContent, '/* a live sheet the browser has already matched */');
  assert.equal(document.querySelectorAll(`#${LIB_STYLE_ID}`).length, 1);

  // Extra rules ride along on the call that creates the sheet, and are ignored
  // afterwards for the same reason the base sheet is never rewritten.
  clean();
  const custom = injectLibStyles('.cloudcanvas-lib-button { letter-spacing: 0.02em; }');
  assert.ok(custom.textContent.startsWith(LIB_DEFAULT_CSS));
  assert.ok(custom.textContent.includes('letter-spacing: 0.02em'));
  assert.equal(injectLibStyles('.cloudcanvas-lib-badge { display: none; }'), custom);
  assert.equal(custom.textContent.includes('display: none'), false);
});
