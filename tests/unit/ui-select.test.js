/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Select: a labelled native `<select>` as a settings row - the label, the control, and a hint or an error wired to
 * the control by `aria-describedby`. Controlled, like the switch: a press reports the value it asks for and the
 * control shows the model's value again until the host answers with an `update`.
 *
 * Red by construction before the control existed, seen on both suites that name it (this one and
 * `ui-testing-mounts.test.js`):
 *
 *   SyntaxError: The requested module '../../.plugin/ui/index.js' does not provide an export named 'createSelect'
 *
 * The select had no status slot, so Momentum's Data settings picker drew its own "Saved" note beside it. The cases that
 * give it the switch's `status: {text, tone}` were written first and failed on that confirmation:
 *
 *   ✖ select: the status slot is a polite live region that exists before it has any text, after the hint
 *     TypeError: Cannot read properties of null (reading 'getAttribute')
 *   ✖ select: a danger status is assertive, the other tones polite, and a tone the kit does not know is muted
 *     TypeError: Cannot read properties of null (reading 'getAttribute')
 *   ✖ select: the status does not change what a choice does: it is reported, the model answers, and an invalid hint is still the error
 *     TypeError: Cannot read properties of null (reading 'textContent')
 *   ✖ select: the status is drawn through tokens in both themes, its words clear 4.5:1, its tone is a marker, and it takes no room until it has words
 *     AssertionError [ERR_ASSERTION]: the check looked at too little: 0
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { FIELD_CLASS, createSelect } from '../../ui/index.js';
import { assertSame, mount } from '../helpers/ui.js';
import { COARSE, RULES, THEMES, assertTokensOnly, colour, contrast, declared, over, pageOf, resolve } from './ui-sheet.js';

const ROW = '.cloudcanvas-ui-select';
const OPTIONS = Object.freeze([{ value: 'daily', label: 'Every day' }, { value: 'weekly', label: 'Every week' }, { value: 'never', label: 'Never', disabled: true }]);
const MODEL = Object.freeze({ label: 'Digest', value: 'weekly', options: OPTIONS });
const choose = (control, to) => { control.value = to; control.dispatchEvent(new Event('change', { bubbles: true })); };

test('select: a label for a native select, whose options are the model\'s and whose value is shown', (t) => {
  const host = mount(t), picker = createSelect(host);
  picker.update(MODEL);
  const label = host.querySelector(`${ROW}-label`), control = host.querySelector('select');
  assert.equal(label.localName, 'label');
  assert.equal(label.getAttribute('for'), control.id, 'a press on the words reaches the control, and a reader names it');
  assert.equal(label.textContent, 'Digest');
  assert.ok(control.classList.contains(FIELD_CLASS), 'it is a kit field: the same look, ring and finger-sized height as the others');
  assert.deepEqual([...control.options].map((option) => [option.value, option.textContent, option.disabled]), [['daily', 'Every day', false], ['weekly', 'Every week', false], ['never', 'Never', true]]);
  assert.equal(control.value, 'weekly');
  assert.equal(host.querySelector(`${ROW}-hint`).hidden, true, 'a row with no hint has none to read');
  assert.equal(control.hasAttribute('aria-describedby'), false);
  picker.destroy();
});

test('select: a choice reports the value asked for, then the control shows the model\'s value until the host answers', (t) => {
  const host = mount(t), asked = [], picker = createSelect(host, { onChange: (value) => asked.push(value) });
  picker.update(MODEL);
  const control = host.querySelector('select');
  choose(control, 'daily');
  assert.deepEqual([asked, control.value], [['daily'], 'weekly'], 'a refused change puts itself back');
  picker.update({ ...MODEL, value: 'daily' });
  assert.equal(control.value, 'daily');
  picker.destroy();
});

test('select: a value that is not text is reported as the host gave it', (t) => {
  const host = mount(t), asked = [], picker = createSelect(host, { onChange: (value) => asked.push(value) });
  picker.update({ label: 'Size', value: 10, options: [{ value: 10, label: 'Ten' }, { value: 25, label: 'Twenty-five' }] });
  const control = host.querySelector('select');
  assert.equal(control.value, '10');
  choose(control, '25');
  assert.deepEqual(asked, [25]);
  picker.destroy();
});

test('select: a hint is read with the control; an invalid one says so, and its words are the error', (t) => {
  const host = mount(t), picker = createSelect(host);
  picker.update({ ...MODEL, hint: 'Sent at 8am' });
  const control = host.querySelector('select'), hint = host.querySelector(`${ROW}-hint`);
  assert.deepEqual([hint.hidden, hint.textContent, control.getAttribute('aria-describedby'), hint.id], [false, 'Sent at 8am', hint.id, hint.id]);
  assert.equal(control.hasAttribute('aria-invalid'), false);
  picker.update({ ...MODEL, hint: 'Pick a digest', invalid: true });
  assert.deepEqual([control.getAttribute('aria-invalid'), host.querySelector(ROW).getAttribute('data-invalid'), hint.textContent], ['true', 'true', 'Pick a digest']);
  picker.update(MODEL);
  assert.deepEqual([control.hasAttribute('aria-invalid'), control.hasAttribute('aria-describedby'), hint.hidden, host.querySelector(ROW).hasAttribute('data-invalid')], [false, false, true, false]);
  picker.destroy();
});

test('select: disabled keeps the row readable and reports nothing', (t) => {
  const host = mount(t), asked = [], picker = createSelect(host, { onChange: (value) => asked.push(value) });
  picker.update({ ...MODEL, disabled: true });
  const control = host.querySelector('select');
  assert.equal(control.disabled, true);
  choose(control, 'daily');
  assert.deepEqual([asked, control.value], [[], 'weekly']);
  picker.update(MODEL);
  assert.equal(control.disabled, false);
  picker.destroy();
});

test('select: options are redrawn only when they changed, so an open list and the focus are left alone', (t) => {
  const host = mount(t), picker = createSelect(host);
  picker.update(MODEL);
  const control = host.querySelector('select'), first = control.options[0];
  control.focus();
  picker.update({ ...MODEL, value: 'daily' });
  assertSame(control.options[0], first, 'the same option nodes');
  assertSame(document.activeElement, control);
  picker.update({ ...MODEL, options: [...OPTIONS, { value: 'monthly', label: 'Every month' }] });
  assert.equal(control.options.length, 4);
  assert.equal(control.value, 'weekly', 'and the value is still the model\'s');
  picker.destroy();
});

test('select: a select needs a label and options with values of their own; destroy is idempotent and update after it is a no-op', (t) => {
  const host = mount(t), picker = createSelect(host);
  assert.throws(() => picker.update({ value: 'a', options: OPTIONS }), /label/);
  assert.throws(() => picker.update({ label: 'X', options: 'no' }), /options/);
  assert.throws(() => picker.update({ label: 'X', options: [{ value: 'a', label: 'A' }, { value: 'a', label: 'B' }] }), /duplicate select value/);
  picker.update(MODEL);
  picker.destroy(); picker.destroy();
  assert.equal(host.children.length, 0);
  assert.doesNotThrow(() => picker.update(MODEL));
});

test('select: the row wraps at the width of a phone, its control is a finger-sized field, and the hint is told from an error', () => {
  assert.equal(declared(ROW, 'flex-wrap'), 'wrap', 'words and control share a line when there is room, and stand one over the other when there is not');
  assert.equal(declared(`${ROW}-control`, 'max-width'), '100%', 'the control never reaches past the row');
  assert.ok(RULES.some((rule) => rule.media === COARSE && rule.selector.includes('.cloudcanvas-ui-field') && rule.declarations['min-height'] === 'var(--cc-control-min-coarse, 44px)'), 'a field is 44px tall under a finger, and the select is a field');
  assert.equal(declared(ROW, 'min-height'), '2.75rem');
});

test('select: drawn through tokens in both themes, its hint clears 4.5:1 on the page, an invalid control has a border of its own, and nothing moves', () => {
  const colours = RULES.filter((rule) => rule.selector.includes(ROW)).flatMap((rule) => Object.entries(rule.declarations).filter(([name]) => /^(color|background|border|outline)/.test(name)));
  assert.ok(colours.length >= 4, `the check looked at too little: ${colours.length}`);
  assertTokensOnly(colours);
  for (const [name, theme] of Object.entries(THEMES)) {
    const ink = colour(resolve(declared(`${ROW}-hint`, 'color'), theme)), page = pageOf(theme);
    assert.ok(contrast(over(ink, page), page) >= 4.5, `${name}: the hint is ${contrast(over(ink, page), page).toFixed(2)}:1`);
  }
  assert.match(declared(`${ROW}[data-invalid] ${ROW}-control`, 'border-color'), /^var\(--cc-tone-danger, /);
  assert.deepEqual(RULES.filter((rule) => rule.selector.includes(ROW) && Object.keys(rule.declarations).some((property) => /^(transition|animation)/.test(property))), []);
});

const STATUS = `${ROW}-status`;

test('select: the status slot is a polite live region that exists before it has any text, after the hint', (t) => {
  const host = mount(t), picker = createSelect(host);
  picker.update(MODEL);
  const slot = host.querySelector(STATUS), control = host.querySelector('select');
  assert.deepEqual([slot.getAttribute('role'), slot.getAttribute('aria-live'), slot.textContent], ['status', 'polite', ''], 'there from the first draw, empty');
  assert.equal(slot.hidden, false, 'a region that is hidden when it gets its words is not reliably read');
  assert.equal(control.hasAttribute('aria-describedby'), false, 'an empty note is not read with the control');
  assertSame(host.querySelector(ROW).lastElementChild, slot, 'the last line of the row: under the control and under its hint');
  picker.update({ ...MODEL, status: { text: 'Saved', tone: 'success' } });
  assertSame(host.querySelector(STATUS), slot, 'the same node: the text is written into it');
  assert.deepEqual([slot.textContent, slot.getAttribute('data-tone'), slot.getAttribute('aria-live'), control.getAttribute('aria-describedby')], ['Saved', 'success', 'polite', slot.id], 'a reader who comes to the control later hears the note too');
  picker.update({ ...MODEL, hint: 'Sent at 8am', status: { text: 'Saved', tone: 'success' } });
  assert.equal(control.getAttribute('aria-describedby'), `${host.querySelector(`${ROW}-hint`).id} ${slot.id}`, 'the hint, then the note');
  picker.update({ ...MODEL, hint: 'Sent at 8am' });
  assert.deepEqual([slot.textContent, slot.hasAttribute('data-tone'), control.getAttribute('aria-describedby')], ['', false, host.querySelector(`${ROW}-hint`).id], 'no status clears the note and its tone and leaves the hint');
  picker.destroy();
});

test('select: a danger status is assertive, the other tones polite, and a tone the kit does not know is muted', (t) => {
  const host = mount(t), picker = createSelect(host);
  const lives = ['success', 'warning', 'danger', 'muted', 'odd'].map((tone) => {
    picker.update({ ...MODEL, status: { text: 'x', tone } });
    const slot = host.querySelector(STATUS);
    return [tone, slot.getAttribute('data-tone'), slot.getAttribute('aria-live')];
  });
  assert.deepEqual(lives, [['success', 'success', 'polite'], ['warning', 'warning', 'polite'], ['danger', 'danger', 'assertive'], ['muted', 'muted', 'polite'], ['odd', 'muted', 'polite']]);
  picker.update({ ...MODEL, status: { text: 'y' } });
  assert.equal(host.querySelector(STATUS).getAttribute('data-tone'), 'muted', 'a note with no tone is a quiet one');
  picker.destroy();
});

test('select: the status does not change what a choice does: it is reported, the model answers, and an invalid hint is still the error', (t) => {
  const host = mount(t), asked = [], picker = createSelect(host, { onChange: (value) => asked.push(value) });
  picker.update({ ...MODEL, status: { text: 'Saving', tone: 'muted' } });
  const control = host.querySelector('select');
  choose(control, 'daily');
  assert.deepEqual([asked, control.value], [['daily'], 'weekly']);
  picker.update({ ...MODEL, value: 'daily', hint: 'Pick a digest', invalid: true, status: { text: 'Not saved', tone: 'danger' } });
  assert.deepEqual([control.value, host.querySelector(ROW).getAttribute('data-invalid'), host.querySelector(STATUS).textContent, host.querySelector(`${ROW}-hint`).textContent], ['daily', 'true', 'Not saved', 'Pick a digest']);
  picker.destroy();
});

test('select: the status is drawn through tokens in both themes, its words clear 4.5:1, its tone is a marker, and it takes no room until it has words', () => {
  const colours = RULES.filter((rule) => rule.selector.includes(STATUS)).flatMap((rule) => Object.entries(rule.declarations).filter(([name]) => /^(color|background|border|outline)/.test(name)));
  assert.ok(colours.length >= 5, `the check looked at too little: ${colours.length}`);
  assertTokensOnly(colours);
  for (const [name, theme] of Object.entries(THEMES)) {
    const ink = colour(resolve(declared(STATUS, 'color'), theme)), page = pageOf(theme);
    assert.ok(contrast(over(ink, page), page) >= 4.5, `${name}: the words are ${contrast(over(ink, page), page).toFixed(2)}:1`);
  }
  const markers = ['success', 'warning', 'danger', 'muted'].map((tone) => declared(`${STATUS}[data-tone="${tone}"]::before`, 'background'));
  assert.equal(new Set(markers).size, 4, 'each tone has a marker of its own, so the words never carry the tone alone');
  assert.equal(declared(STATUS, 'flex-basis'), '100%', 'a line of its own, as the hint is');
  assert.equal(declared(`${STATUS}:empty`, 'position'), 'absolute', 'out of the row, but not hidden, until it has words: a region that comes with its words is not reliably read');
  assert.equal(RULES.some((rule) => rule.selector.includes(STATUS) && 'display' in rule.declarations && rule.declarations.display === 'none'), false);
  assert.deepEqual(RULES.filter((rule) => rule.selector.includes(STATUS) && Object.keys(rule.declarations).some((property) => /^(transition|animation)/.test(property))), []);
});
