/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The UI kit's foundations: DOM helpers, the control lifetime, roving
 * arithmetic, and the stylesheet - injected once, held to the style gates,
 * every token catalogued.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUTTON_CLASS, FIELD_CLASS, UI_CSS, UI_STYLE_ID, button, clamp, createLife, documentOf, el, focusablesIn,
  injectUiStyles, input, nextIndex, setTabStop, uniqueItems, writeText, textNode
} from '../../ui/index.js';
import { checkStyleDiscipline } from 'cloudcanvas/style-gates';
import { TOKENS, TOKEN_CATEGORY } from 'cloudcanvas/tokens';
import { UI_TOKENS } from '../../ui/tokens.js';
import { assertSame, mount } from '../helpers/ui.js';

test('documentOf needs a connected host; el and textNode build without positional ambiguity', (t) => {
  assert.throws(() => documentOf(null), TypeError);
  assert.throws(() => documentOf({}), TypeError);
  const host = mount(t);
  const doc = documentOf(host);
  const node = el(doc, 'p', { className: 'a b', text: 'Hi', attrs: { role: 'note', hidden: true, 'data-x': 0, skip: null, off: false } });
  assert.equal(node.className, 'a b');
  assert.equal(node.textContent, 'Hi');
  assert.equal(node.getAttribute('role'), 'note');
  assert.equal(node.getAttribute('hidden'), '');
  assert.equal(node.getAttribute('data-x'), '0');
  assert.equal(node.hasAttribute('skip'), false);
  assert.equal(node.hasAttribute('off'), false);
  const text = textNode(doc, node, 'x');
  writeText(text, 'y');
  assert.equal(text.data, 'y');
});

test('button and input carry the kit class, a type, an accessible name, and a removable listener', (t) => {
  const doc = documentOf(mount(t));
  const life = createLife();
  let clicks = 0;
  const save = button(doc, { label: 'Save', className: 'extra', ariaLabel: 'Save note', onClick: () => { clicks += 1; }, signal: life.signal });
  assert.equal(save.type, 'button');
  assert.ok(save.classList.contains(BUTTON_CLASS) && save.classList.contains('extra'));
  assert.equal(save.getAttribute('aria-label'), 'Save note');
  save.click();
  life.destroy();
  save.click();
  assert.equal(clicks, 1, 'the life removed the click listener');
  const values = [];
  const field = input(doc, { label: 'Title', value: 'a', placeholder: 'Name it', onInput: (value) => values.push(value) });
  assert.ok(field.classList.contains(FIELD_CLASS));
  assert.equal(field.getAttribute('aria-label'), 'Title');
  field.value = 'ab';
  field.dispatchEvent(new Event('input'));
  assert.deepEqual(values, ['ab']);
  assert.equal(input(doc, { type: 'textarea', label: 'Body' }).localName, 'textarea');
});

test('createLife ends listeners, timers and disposers exactly once', async () => {
  const life = createLife();
  const target = new EventTarget();
  const calls = [];
  life.on(target, 'ping', () => calls.push('listener'));
  life.later(() => calls.push('timer'), 5);
  life.add(() => calls.push('dispose'));
  target.dispatchEvent(new Event('ping'));
  assert.equal(life.destroy(), true);
  assert.equal(life.destroy(), false);
  assert.equal(life.dead, true);
  target.dispatchEvent(new Event('ping'));
  life.on(target, 'ping', () => calls.push('late'));
  target.dispatchEvent(new Event('ping'));
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.deepEqual(calls, ['listener', 'dispose']);
});

test('uniqueItems refuses missing, blank and duplicate ids; clamp holds a range', () => {
  assert.deepEqual(uniqueItems([{ id: 'a' }, { id: 'b' }], 'x').length, 2);
  assert.throws(() => uniqueItems([{ id: 'a' }, { id: 'a' }], 'tab'), /duplicate tab id/);
  assert.throws(() => uniqueItems([{ id: ' ' }], 'tab'), TypeError);
  assert.throws(() => uniqueItems('no', 'tab'), TypeError);
  assert.equal(clamp(5, 0, 3), 3);
  assert.equal(clamp(-1, 0, 3), 0);
});

test('nextIndex steps, clamps or wraps, and ignores keys of the other axis', () => {
  assert.equal(nextIndex('ArrowDown', 0, 3), 1);
  assert.equal(nextIndex('ArrowDown', 2, 3), 2);
  assert.equal(nextIndex('ArrowDown', 2, 3, { wrap: true }), 0);
  assert.equal(nextIndex('ArrowLeft', 0, 3, { orientation: 'horizontal', wrap: true }), 2);
  assert.equal(nextIndex('ArrowLeft', 0, 3), null);
  assert.equal(nextIndex('Home', 2, 3), 0);
  assert.equal(nextIndex('End', 0, 3), 2);
  assert.equal(nextIndex('ArrowDown', -1, 3), 0);
  assert.equal(nextIndex('ArrowDown', 0, 0), null);
});

test('setTabStop leaves exactly one tab stop; focusablesIn skips hidden and disabled', (t) => {
  const host = mount(t);
  host.innerHTML = '<button id="a"></button><button id="b" disabled></button><div hidden><button id="c"></button></div><input id="d"><span tabindex="-1"></span>';
  assert.deepEqual(focusablesIn(host).map((node) => node.id), ['a', 'd']);
  const nodes = [...host.querySelectorAll('button')];
  setTabStop(nodes, nodes[1]);
  assert.deepEqual(nodes.map((node) => node.getAttribute('tabindex')), ['-1', '0', '-1']);
});

test('injectUiStyles writes one sheet per document, with the nonce of the first call', () => {
  document.getElementById(UI_STYLE_ID)?.remove();
  const first = injectUiStyles(document, { nonce: 'abc' });
  assertSame(injectUiStyles(document), first);
  assert.equal(document.querySelectorAll(`#${UI_STYLE_ID}`).length, 1);
  assert.equal(first.getAttribute('nonce'), 'abc');
  assert.equal(first.textContent, UI_CSS);
  assert.equal(injectUiStyles(null), null);
});

test('the kit sheet passes the style gates: token reads, prefixed classes, no !important', () => {
  const { violations, stats } = checkStyleDiscipline(UI_CSS);
  assert.ok(stats.rules > 100 && stats.themable > 100, `the gate looked at too little: ${JSON.stringify(stats)}`);
  assert.deepEqual(violations.map((violation) => violation.message), []);
});

test('every --cc-* token the kit reads is catalogued, and every --cc-ui-* token is read', () => {
  const reads = new Set([...UI_CSS.matchAll(/var\((--cc-[a-z0-9-]+)/g)].map((match) => match[1]));
  const lib = ['--cc-tone-info', '--cc-tone-success', '--cc-tone-warning', '--cc-tone-danger', '--cc-input-bg', '--cc-input-border'];
  const unknown = [...reads].filter((name) => !Object.hasOwn(TOKENS, name) && !Object.hasOwn(UI_TOKENS, name) && !lib.includes(name));
  assert.deepEqual(unknown, []);
  const unread = Object.keys(UI_TOKENS).filter((name) => !reads.has(name));
  assert.deepEqual(unread, []);
  assert.deepEqual(Object.keys(TOKENS).filter((name) => /^--cc-(ui|z-ui)-/.test(name)), [], 'kit tokens stay out of the core catalogue');
  for (const entry of Object.values(UI_TOKENS)) assert.ok(Object.values(TOKEN_CATEGORY).includes(entry.category) && entry.purpose);
});
