/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Switch: a labelled on/off setting. Controlled: a press reports the state it asks for and the switch shows
 * the model's state until the host updates. The words stand first and the box last, as a settings row reads,
 * and `status: {text, tone}` is a live region beside the name that is already there when it gets its words.
 *
 * Red by construction before the control existed: `createSwitch` was not exported.
 *
 * The end box and the status slot were written first and seen to fail on the switch that drew its box before its
 * words and had a detail line that is no live region (5 failed, the four above them passing):
 *
 *   ✖ switch: the words come first and the box last, the way a settings row reads, in the markup and in the sheet
 *     AssertionError [ERR_ASSERTION]: the box ends the row: expected <input.cloudcanvas-ui-switch-box>, got <span#cloudcanvas-ui-switch-detail-6.cloudcanvas-ui-switch-detail>
 *   ✖ switch: the status slot is a polite live region that exists before it has any text
 *     TypeError [Error]: Cannot read properties of null (reading 'getAttribute')
 *   ✖ switch: a danger status is assertive, the other tones polite, and a tone the kit does not know is muted
 *     TypeError [Error]: Cannot read properties of null (reading 'getAttribute')
 *   ✖ switch: the status does not change what a press does: it is reported, and the model answers
 *     TypeError [Error]: Cannot read properties of null (reading 'textContent')
 *   ✖ switch: the status is drawn through tokens in both themes, its words clear 4.5:1 on the page, its tone is a marker, and nothing moves
 *     AssertionError [ERR_ASSERTION]: the check looked at too little: 0
 *
 * The markers of the tones lost to the marker every status shares when that was first written as one `:is(...)`
 * with the select's error marker, whose most specific part outranked them: in a browser every dot was the muted one
 * (`rgb(148, 163, 184)` for Saved). The case at the end of this file was written first and seen to fail on that:
 *
 *   ✖ switch: the marker every status shares has no specificity of its own, so the rule for its tone, which follows it, wins
 *     AssertionError [ERR_ASSERTION]: the shared marker is :is(.cloudcanvas-ui-switch-status:not(:empty), .cloudcanvas-ui-select[data-invalid] .cloudcanvas-ui-select-hint)::before
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { UI_CSS, createSwitch } from '../../ui/index.js';
import { assertSame, mount } from '../helpers/ui.js';
import { RULES, THEMES, assertTokensOnly, colour, contrast, declared, over, pageOf, resolve } from './ui-sheet.js';

const press = (box, to) => { box.checked = to; box.dispatchEvent(new Event('change', { bubbles: true })); };

test('switch: a switch role named by its words, with the model’s state and detail', (t) => {
  const host = mount(t), toggle = createSwitch(host);
  toggle.update({ label: 'Reminders', detail: 'Due and upcoming', checked: true });
  const box = host.querySelector('.cloudcanvas-ui-switch-box');
  assert.equal(box.getAttribute('role'), 'switch');
  assert.equal(box.checked, true);
  assert.equal(host.querySelector(`#${box.getAttribute('aria-labelledby')}`).textContent, 'Reminders');
  assert.equal(host.querySelector(`#${box.getAttribute('aria-describedby')}`).textContent, 'Due and upcoming');
  toggle.update({ label: 'Reminders', checked: false });
  assert.deepEqual([box.checked, box.hasAttribute('aria-describedby'), host.querySelector('.cloudcanvas-ui-switch-detail').hidden], [false, false, true]);
});

test('switch: a press reports the state asked for, then shows the model’s state again until updated', (t) => {
  const host = mount(t), asked = [], toggle = createSwitch(host, { onChange: (value) => asked.push(value) });
  toggle.update({ label: 'Alerts', checked: false });
  const box = host.querySelector('.cloudcanvas-ui-switch-box');
  press(box, true);
  assert.deepEqual([asked, box.checked], [[true], false]);
  toggle.update({ label: 'Alerts', checked: true });
  assert.equal(box.checked, true);
});

test('switch: disabled reports nothing; a switch needs a label; destroy is idempotent and update after it is a no-op', (t) => {
  const host = mount(t), asked = [], toggle = createSwitch(host, { onChange: (value) => asked.push(value) });
  assert.throws(() => toggle.update({ checked: true }), /label/);
  toggle.update({ label: 'Locked', checked: false, disabled: true });
  press(host.querySelector('.cloudcanvas-ui-switch-box'), true);
  assert.deepEqual(asked, []);
  toggle.destroy(); toggle.destroy();
  assert.equal(host.querySelector('.cloudcanvas-ui-switch'), null);
  assert.doesNotThrow(() => toggle.update({ label: 'x' }));
});

test('switch: the row is a 44px target and the box keeps a focus ring', () => {
  assert.match(UI_CSS, /\.cloudcanvas-ui-switch \{[^}]*min-height: 2\.75rem/);
  assert.match(UI_CSS, /\.cloudcanvas-ui-switch-box:focus-visible/);
});

const ROW = '.cloudcanvas-ui-switch';
const STATUS = `${ROW}-status`;

test('switch: the words come first and the box last, the way a settings row reads, in the markup and in the sheet', (t) => {
  const host = mount(t), toggle = createSwitch(host);
  toggle.update({ label: 'Reminders', detail: 'Due and upcoming', checked: true });
  const root = host.querySelector(ROW), box = host.querySelector(`${ROW}-box`);
  assertSame(root.lastElementChild, box, 'the box ends the row');
  assert.ok(root.firstElementChild.contains(host.querySelector(`${ROW}-label`)), 'the words open it');
  assert.equal(declared(ROW, 'grid-template-columns'), 'minmax(0, 1fr) auto', 'the words take the row and the box keeps its own column, at the end');
  assert.equal(declared(ROW, 'min-height'), '2.75rem', 'and the row is still a 44px target');
  toggle.destroy();
});

test('switch: the status slot is a polite live region that exists before it has any text', (t) => {
  const host = mount(t), toggle = createSwitch(host);
  toggle.update({ label: 'Reminders', checked: false });
  const slot = host.querySelector(STATUS);
  assert.deepEqual([slot.getAttribute('role'), slot.getAttribute('aria-live'), slot.textContent], ['status', 'polite', ''], 'there from the first draw, empty');
  assert.equal(slot.hidden, false, 'a region that is hidden when it gets its words is not reliably read');
  toggle.update({ label: 'Reminders', checked: true, status: { text: 'Saved', tone: 'success' } });
  assertSame(host.querySelector(STATUS), slot, 'the same node: the text is written into it');
  assert.deepEqual([slot.textContent, slot.getAttribute('data-tone'), slot.getAttribute('aria-live')], ['Saved', 'success', 'polite']);
  const box = host.querySelector(`${ROW}-box`);
  assert.ok(box.getAttribute('aria-describedby').split(' ').includes(slot.id), 'a reader who comes to the switch later hears the note too');
  toggle.update({ label: 'Reminders', checked: true });
  assert.deepEqual([slot.textContent, slot.hasAttribute('data-tone'), box.hasAttribute('aria-describedby')], ['', false, false], 'no status clears the note and its tone');
  toggle.destroy();
});

test('switch: a danger status is assertive, the other tones polite, and a tone the kit does not know is muted', (t) => {
  const host = mount(t), toggle = createSwitch(host);
  const lives = ['success', 'warning', 'danger', 'muted', 'odd'].map((tone) => {
    toggle.update({ label: 'Alerts', status: { text: 'x', tone } });
    const slot = host.querySelector(STATUS);
    return [tone, slot.getAttribute('data-tone'), slot.getAttribute('aria-live')];
  });
  assert.deepEqual(lives, [['success', 'success', 'polite'], ['warning', 'warning', 'polite'], ['danger', 'danger', 'assertive'], ['muted', 'muted', 'polite'], ['odd', 'muted', 'polite']]);
  toggle.update({ label: 'Alerts', status: { text: 'y' } });
  assert.equal(host.querySelector(STATUS).getAttribute('data-tone'), 'muted', 'a note with no tone is a quiet one');
  toggle.destroy();
});

test('switch: the status does not change what a press does: it is reported, and the model answers', (t) => {
  const host = mount(t), asked = [], toggle = createSwitch(host, { onChange: (value) => asked.push(value) });
  toggle.update({ label: 'Alerts', checked: false, status: { text: 'Saving', tone: 'muted' } });
  const box = host.querySelector(`${ROW}-box`);
  press(box, true);
  assert.deepEqual([asked, box.checked], [[true], false]);
  toggle.update({ label: 'Alerts', checked: true, status: { text: 'Saved', tone: 'success' } });
  assert.deepEqual([box.checked, host.querySelector(STATUS).textContent], [true, 'Saved']);
  toggle.destroy();
});

test('switch: the status is drawn through tokens in both themes, its words clear 4.5:1 on the page, its tone is a marker, and nothing moves', () => {
  const colours = RULES.filter((rule) => rule.selector.includes(STATUS)).flatMap((rule) => Object.entries(rule.declarations).filter(([name]) => /^(color|background|border|outline)/.test(name)));
  assert.ok(colours.length >= 5, `the check looked at too little: ${colours.length}`);
  assertTokensOnly(colours);
  for (const [name, theme] of Object.entries(THEMES)) {
    const ink = colour(resolve(declared(STATUS, 'color'), theme)), page = pageOf(theme);
    assert.ok(contrast(over(ink, page), page) >= 4.5, `${name}: the words are ${contrast(over(ink, page), page).toFixed(2)}:1`);
  }
  const markers = ['success', 'warning', 'danger', 'muted'].map((tone) => declared(`${STATUS}[data-tone="${tone}"]::before`, 'background'));
  assert.equal(new Set(markers).size, 4, 'each tone has a marker of its own, so the words never carry the tone alone');
  assert.deepEqual(RULES.filter((rule) => rule.selector.includes(ROW) && Object.keys(rule.declarations).some((property) => /^(transition|animation)/.test(property))), [], 'so there is no motion to turn off');
});

test('switch: the marker every status shares has no specificity of its own, so the rule for its tone, which follows it, wins', () => {
  const shared = RULES.find((rule) => rule.media === null && rule.selector.endsWith('::before') && rule.selector.includes(STATUS) && 'content' in rule.declarations);
  assert.ok(shared.selector.startsWith(':where('), `the shared marker is ${shared.selector}`);
  const tones = RULES.filter((rule) => rule.selector.startsWith(`${STATUS}[data-tone=`) && rule.selector.endsWith('::before'));
  assert.equal(tones.length, 4);
  assert.ok(RULES.indexOf(shared) < RULES.indexOf(tones[0]), 'and it comes first');
});
