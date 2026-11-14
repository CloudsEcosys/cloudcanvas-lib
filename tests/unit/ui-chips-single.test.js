/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Chips that choose one: `createChips(host, { single: true, onChange })`. The group is the multi chips' own - a
 * `group` of buttons with `aria-pressed` - holding exactly one pressed chip, named by the model's `value`. One
 * chip is the tab stop and the arrow keys move among the rest, as in a toolbar; Enter or Space presses. A press
 * reports `onChange(id)` and the group shows what the next model says. The multi mode (`onToggle`, `onRemove`)
 * is untouched: its suite is `ui-chips.test.js`.
 *
 * Written first and seen to fail on chips that knew no `single` (7 of the 9 here failed, the multi-mode and the
 * sheet cases passing; the test-document case in `ui-testing-mounts.test.js` failed too):
 *
 *   ✖ single chips: one pressed chip, the model's value, in a labelled group of buttons
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
 *   ✖ single chips: the pressed chip is the one tab stop, the first when none is pressed, and a pressed flag on an item says nothing
 *     AssertionError [ERR_ASSERTION]: one stop, and it is the chosen one: `value` decides, not `pressed`
 *   ✖ single chips: a press on another chip reports its id; the group changes only when the model does; the chosen chip reports nothing
 *     TypeError [Error]: Cannot read properties of null (reading 'click')
 *   ✖ single chips: the arrows move focus and the tab stop with it, wrapping, Home and End jump; none of them presses
 *     TypeError [Error]: Cannot read properties of null (reading 'focus')
 *   ✖ single chips: a choice is not a list of tags: nothing is removable, and without onChange a chip is text
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *   ✖ test document: single chips mount with one tab stop, move it with the arrows and report a press
 *     TypeError [Error]: Cannot read properties of undefined (reading 'getAttribute')
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createChips } from '../../ui/index.js';
import { assertSame, key, mount } from '../helpers/ui.js';
import { COARSE, RULES } from './ui-sheet.js';

const ITEMS = Object.freeze([{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }, { id: 'month', label: 'Month', tone: '2' }]);
const MODEL = Object.freeze({ label: 'View', value: 'week', items: ITEMS });
const face = (host, id) => host.querySelector(`[data-ui-id="${id}"]`);
const faces = (host) => [...host.querySelectorAll('.cloudcanvas-ui-chips-toggle')];

test('single chips: one pressed chip, the model\'s value, in a labelled group of buttons', (t) => {
  const host = mount(t), chips = createChips(host, { single: true, onChange() {} });
  chips.update(MODEL);
  assert.equal(host.querySelector('[role="group"]').getAttribute('aria-label'), 'View');
  assert.deepEqual(faces(host).map((node) => node.getAttribute('aria-pressed')), ['false', 'true', 'false']);
  assert.ok(faces(host).every((node) => node.localName === 'button' && node.type === 'button'));
  chips.update({ ...MODEL, value: 'month' });
  assert.deepEqual(faces(host).map((node) => node.getAttribute('aria-pressed')), ['false', 'false', 'true']);
  chips.update({ ...MODEL, value: 'nowhere' });
  assert.deepEqual(faces(host).map((node) => node.getAttribute('aria-pressed')), ['false', 'false', 'false'], 'a value no chip has presses none');
  chips.destroy();
});

test('single chips: the pressed chip is the one tab stop, the first when none is pressed, and a pressed flag on an item says nothing', (t) => {
  const host = mount(t), chips = createChips(host, { single: true, onChange() {} });
  chips.update({ ...MODEL, items: ITEMS.map((item) => ({ ...item, pressed: item.id === 'day' })) });
  assert.deepEqual(faces(host).map((node) => node.getAttribute('tabindex')), ['-1', '0', '-1'], 'one stop, and it is the chosen one: `value` decides, not `pressed`');
  chips.update({ ...MODEL, value: null });
  assert.deepEqual(faces(host).map((node) => node.getAttribute('tabindex')), ['0', '-1', '-1']);
  chips.destroy();
});

test('single chips: a press on another chip reports its id; the group changes only when the model does; the chosen chip reports nothing', (t) => {
  const host = mount(t), asked = [], chips = createChips(host, { single: true, onChange: (value) => asked.push(value) });
  chips.update(MODEL);
  face(host, 'month').click();
  face(host, 'week').click();
  assert.deepEqual(asked, ['month'], 'choosing what is already chosen is nothing to report');
  assert.deepEqual(faces(host).map((node) => node.getAttribute('aria-pressed')), ['false', 'true', 'false']);
  chips.update({ ...MODEL, value: 'month' });
  assert.equal(face(host, 'month').getAttribute('aria-pressed'), 'true');
  chips.destroy();
});

test('single chips: the arrows move focus and the tab stop with it, wrapping, Home and End jump; none of them presses', (t) => {
  const host = mount(t), asked = [], chips = createChips(host, { single: true, onChange: (value) => asked.push(value) });
  chips.update(MODEL);
  face(host, 'week').focus();
  assert.equal(key(face(host, 'week'), 'ArrowRight').defaultPrevented, true, 'the page does not scroll under the arrow');
  assertSame(document.activeElement, face(host, 'month'));
  assert.deepEqual(faces(host).map((node) => node.getAttribute('tabindex')), ['-1', '-1', '0']);
  key(face(host, 'month'), 'ArrowDown');
  assertSame(document.activeElement, face(host, 'day'), 'past the last, the first');
  key(face(host, 'day'), 'ArrowLeft');
  assertSame(document.activeElement, face(host, 'month'));
  key(face(host, 'month'), 'ArrowUp');
  assertSame(document.activeElement, face(host, 'week'));
  key(face(host, 'week'), 'End');
  assertSame(document.activeElement, face(host, 'month'));
  key(face(host, 'month'), 'Home');
  assertSame(document.activeElement, face(host, 'day'));
  assert.equal(key(face(host, 'day'), 'a').defaultPrevented, false, 'another key is not the group\'s');
  assert.deepEqual(asked, [], 'moving is not choosing');
  chips.destroy();
});

test('single chips: a redraw leaves the tab stop where the user moved it, and focus on the chip they are on', (t) => {
  const host = mount(t), chips = createChips(host, { single: true, onChange() {} });
  chips.update(MODEL);
  face(host, 'week').focus();
  key(face(host, 'week'), 'ArrowLeft');
  chips.update({ ...MODEL, items: ITEMS.map((item) => ({ ...item, label: `${item.label}!` })) });
  assertSame(document.activeElement, face(host, 'day'));
  assert.deepEqual(faces(host).map((node) => node.getAttribute('tabindex')), ['0', '-1', '-1']);
  document.activeElement.blur();
  chips.update(MODEL);
  assert.deepEqual(faces(host).map((node) => node.getAttribute('tabindex')), ['-1', '0', '-1'], 'with focus elsewhere the stop returns to the chosen chip');
  chips.destroy();
});

test('single chips: a choice is not a list of tags: nothing is removable, and without onChange a chip is text', (t) => {
  const host = mount(t), chips = createChips(host, { single: true, onChange() {}, onRemove() { throw new Error('never'); } });
  chips.update({ ...MODEL, items: ITEMS.map((item) => ({ ...item, removable: true })) });
  assert.equal(host.querySelectorAll('.cloudcanvas-ui-chips-remove').length, 0);
  chips.destroy();
  const text = createChips(host, { single: true });
  text.update(MODEL);
  assert.equal(host.querySelectorAll('button').length, 0);
  text.destroy();
});

test('single chips: the multi mode is as it was: its chips toggle by id and are all tab stops', (t) => {
  const host = mount(t), toggled = [], chips = createChips(host, { onToggle: (id, pressed) => toggled.push([id, pressed]) });
  chips.update({ items: ITEMS });
  face(host, 'week').click();
  assert.deepEqual(toggled, [['week', true]]);
  assert.deepEqual(faces(host).map((node) => node.hasAttribute('tabindex')), [false, false, false]);
  chips.destroy();
});

test('single chips: destroy removes the group, ends its listeners, and is safe to repeat', (t) => {
  const host = mount(t), asked = [], chips = createChips(host, { single: true, onChange: (value) => asked.push(value) });
  chips.update(MODEL);
  const press = face(host, 'day');
  chips.destroy(); chips.destroy();
  press.click();
  assert.deepEqual(asked, []);
  assert.equal(host.children.length, 0);
});

test('single chips: the pressed chip is told by more than colour, and every chip is a 44px target under a finger', () => {
  const pressed = RULES.find((rule) => rule.media === null && rule.selector === '.cloudcanvas-ui-chips-toggle[aria-pressed="true"]');
  assert.equal(pressed.declarations['font-weight'], 'var(--cc-weight-semibold, 600)', 'weight as well as fill');
  assert.ok(RULES.some((rule) => rule.media === COARSE && rule.selector.includes('.cloudcanvas-ui-chips-toggle') && rule.declarations['min-height'] === 'var(--cc-control-min-coarse, 44px)'));
});
