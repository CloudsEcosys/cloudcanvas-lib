/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Combobox: a listbox attached to a field the host owns. Focus never leaves the
 * field; Up and Down move `aria-activedescendant`, Enter picks, Escape lets go,
 * and the list is open only while the model says so and has something to offer.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCombobox } from '../../ui/index.js';
import { assertSame, key, mount } from '../helpers/ui.js';
import { declared } from './ui-sheet.js';

const OPTIONS = Object.freeze([{ id: 'ana', label: 'Ana' }, { id: 'ben', label: 'Ben <b>' }, { id: 'cy', label: 'Cy' }]);

/** A field in a mounted host, and the popup the combobox puts after it. */
function field(t, tag = 'input') {
  const host = mount(t);
  const input = document.createElement(tag);
  host.append(input, document.createElement('p'));
  return { host, input, popup: () => host.querySelector('.cloudcanvas-ui-combobox') };
}

const optionsOf = (popup) => [...popup.querySelectorAll('[role="option"]')];
const active = (input) => input.getAttribute('aria-activedescendant');

test('combobox: the field becomes a combobox that controls a listbox placed right after it, open only with options', (t) => {
  const { input, popup } = field(t);
  const box = createCombobox(input);
  assertSame(input.nextElementSibling, popup(), 'the list sits beside its field, not at the end of the page');
  const list = popup().querySelector('[role="listbox"]');
  assert.equal(input.getAttribute('role'), 'combobox');
  assert.equal(input.getAttribute('aria-controls'), list.id);
  assert.equal(input.getAttribute('aria-autocomplete'), 'list');
  assert.equal(input.getAttribute('aria-expanded'), 'false');
  assert.equal(popup().hidden, true, 'closed until a model opens it');
  box.update({ options: OPTIONS, open: true, label: 'People' });
  assert.equal(popup().hidden, false);
  assert.equal(input.getAttribute('aria-expanded'), 'true');
  assert.equal(list.getAttribute('aria-label'), 'People');
  assert.deepEqual(optionsOf(popup()).map((node) => node.textContent), ['Ana', 'Ben <b>', 'Cy'], 'labels are text, never markup');
  assert.equal(active(input), null, 'nothing is chosen for the user');
  box.update({ options: OPTIONS, open: false });
  assert.equal(popup().hidden, true);
  assert.equal(input.getAttribute('aria-expanded'), 'false');
  assert.equal(optionsOf(popup()).length, 0, 'a closed list offers nothing to a screen reader either');
  box.update({ options: [], open: true });
  assert.equal(popup().hidden, true, 'open with nothing to offer is not open');
  assert.equal(input.getAttribute('aria-expanded'), 'false');
  box.update({ options: OPTIONS, open: true });
  assert.equal(list.getAttribute('aria-label'), 'Suggestions', 'the default name');
  box.destroy();
});

test('combobox: Up and Down move the active option, Enter picks it, Escape lets go; focus stays in the field', (t) => {
  const { input, popup } = field(t, 'textarea');
  const picked = [];
  const box = createCombobox(input, { onPick: (id, option) => picked.push([id, option]) });
  box.update({ options: OPTIONS, open: true });
  input.focus();
  const [ana, ben, cy] = optionsOf(popup());
  assert.equal(key(input, 'Enter').defaultPrevented, false, 'with nothing active, Enter is the field\'s own');
  assert.equal(key(input, 'ArrowDown').defaultPrevented, true);
  assert.equal(active(input), ana.id);
  assert.equal(ana.getAttribute('aria-selected'), 'true');
  key(input, 'ArrowDown');
  assert.equal(active(input), ben.id);
  key(input, 'ArrowUp');
  key(input, 'ArrowUp');
  assert.equal(active(input), ana.id, 'the first option is the top, not a wrap');
  key(input, 'ArrowDown');
  key(input, 'ArrowDown');
  key(input, 'ArrowDown');
  assert.equal(active(input), cy.id);
  assert.equal(key(input, 'Enter').defaultPrevented, true);
  assert.equal(picked.length, 1);
  assert.equal(picked[0][0], 'cy');
  assert.equal(picked[0][1], OPTIONS[2], 'the option the model gave, not a copy');
  assert.equal(key(input, 'Escape').defaultPrevented, true);
  assert.equal(active(input), null);
  assert.equal(key(input, 'Enter').defaultPrevented, false, 'after Escape, Enter is the field\'s again');
  assert.equal(picked.length, 1);
  assertSame(document.activeElement, input);
  box.update({ options: OPTIONS, open: false });
  assert.equal(key(input, 'ArrowDown').defaultPrevented, false, 'a closed list leaves the arrows to the field');
  box.destroy();
});

test('combobox: a click picks, and a press on the list does not take focus from the field', (t) => {
  const { input, popup } = field(t);
  const picked = [];
  const box = createCombobox(input, { onPick: (id) => picked.push(id) });
  box.update({ options: OPTIONS, open: true });
  input.focus();
  const option = optionsOf(popup())[1];
  const press = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
  option.dispatchEvent(press);
  assert.equal(press.defaultPrevented, true, 'the press is swallowed so the field keeps focus and its caret');
  option.click();
  assert.deepEqual(picked, ['ben']);
  assert.throws(() => box.update({ options: [{ id: 'a', label: 'A' }, { id: 'a', label: 'B' }], open: true }), /duplicate/);
  box.destroy();
});

test('combobox: destroy gives the field back as it was, removes the list, and is safe to repeat', (t) => {
  const { host, input, popup } = field(t);
  const picked = [];
  const box = createCombobox(input, { onPick: (id) => picked.push(id) });
  box.update({ options: OPTIONS, open: true });
  key(input, 'ArrowDown');
  box.destroy();
  box.destroy();
  for (const name of ['role', 'aria-controls', 'aria-autocomplete', 'aria-expanded', 'aria-activedescendant']) {
    assert.equal(input.hasAttribute(name), false, name);
  }
  assertSame(popup(), null);
  assert.equal(host.children.length, 2, 'only the field and its neighbour are left');
  assert.equal(key(input, 'Enter').defaultPrevented, false);
  assert.deepEqual(picked, []);
  assert.doesNotThrow(() => box.update({ options: OPTIONS, open: true }));
  assertSame(popup(), null);
});

/*
 * Seen to fail on the sheet of `bdc16db`, where the popup (a `<div>` with no role) scrolled and the listbox inside it did not:
 *
 *   ✖ combobox: the popup around the list clips and scrolls nothing; the listbox the field controls is what scrolls
 *     AssertionError [ERR_ASSERTION]: the popup is not a scroller: it holds the listbox, which is
 *       actual: 'auto', expected: 'hidden'
 *
 * axe's `scrollable-region-focusable` (serious) asks a scroller to be reachable by keyboard, and exempts exactly one: the popup of a combobox,
 * which it knows as the element the field's `aria-controls` names - the listbox. The field is operated through `aria-activedescendant`, so the
 * list is never a tab stop; the one scroller there is has to be the one the field controls. Held in a browser, by axe itself, in
 * `tests/browser/ui-combobox.test.js`; this reads the sheet.
 */
test('combobox: the popup around the list clips and scrolls nothing; the listbox the field controls is what scrolls', () => {
  assert.equal(declared('.cloudcanvas-ui-combobox', 'overflow'), 'hidden', 'the popup is not a scroller: it holds the listbox, which is');
  assert.equal(declared('.cloudcanvas-ui-combobox .cloudcanvas-ui-results-list', 'overflow'), 'auto');
  assert.equal(declared('.cloudcanvas-ui-combobox .cloudcanvas-ui-results-list', 'min-height'), '0', 'it shrinks to what the popup\'s height leaves');
  assert.equal(declared('.cloudcanvas-ui-combobox', 'display'), 'flex', 'the popup\'s max-height (the kit\'s, or a host\'s) is what the list gives way to');
});
