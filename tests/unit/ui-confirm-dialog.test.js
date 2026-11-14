/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * `confirmDialog`: one question, answered true or false. It is the kit's dialog with two buttons in it - focus held
 * inside, Escape and the backdrop and Close all a "no", focus handed back to whatever opened it - so a host never
 * builds a confirmation by hand, and a destructive one says so in its confirm button. Its Cancel is the way out
 * beside Escape and the backdrop: the dialog's own Close is not drawn, since two of them would say the same thing.
 *
 * Red by construction before the function existed, seen on both suites that name it (this one and
 * `ui-testing-mounts.test.js`):
 *
 *   SyntaxError: The requested module '../../.plugin/ui/index.js' does not provide an export named 'confirmDialog'
 *
 * The dialog's own Close was drawn beside Cancel at first (seen in a browser at 320 wide: two "Cancel"s, one over the
 * other). The case that says it is not was written first and failed on that confirmation:
 *
 *   ✖ confirmDialog: its Cancel is the way out, so the dialog's own Close is not drawn twice, and Tab does not stop on it
 *     AssertionError [ERR_ASSERTION]: one way out beside Confirm, named as the host named it
 *
 * The host had no way to close the question it asked, so Momentum's two confirmations stayed hand-built. The two cases
 * that give the promise a `close(result)` were written first and failed on that confirmation:
 *
 *   ✖ confirmDialog: the host closes the question it asked: the promise carries `close(result)`, a no by default, ...
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:  actual: 'undefined'  expected: 'function'
 *   ✖ confirmDialog: closing it again, or after it was answered, does nothing; it closes its own question and no other
 *     TypeError [Error]: first.close is not a function
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmDialog } from '../../ui/index.js';
import { assertSame, key, mount } from '../helpers/ui.js';
import { RULES, THEMES, assertTokensOnly, colour, contrast, declared, over, pageOf, resolve } from './ui-sheet.js';

const ROOT = 'dialog.cloudcanvas-ui-dialog';
const CLASS = 'cloudcanvas-ui-confirm';
const buttons = () => ({ cancel: document.querySelector(`.${CLASS}-cancel`), confirm: document.querySelector(`.${CLASS}-confirm`) });
const opener = (t) => {
  const node = document.createElement('button');
  mount(t).append(node);
  node.focus();
  t.after(() => document.querySelectorAll(ROOT).forEach((dialog) => dialog.remove()));
  return node;
};

test('confirmDialog: asks in a labelled dialog in the document body, with the words the host gave, and a Cancel and a Confirm of its own by default', async (t) => {
  opener(t);
  const answer = confirmDialog({ title: 'Delete note?', body: 'This cannot be undone.' });
  assert.ok(answer instanceof Promise, 'a promise, so a host awaits the answer');
  const dialog = document.querySelector(ROOT);
  assertSame(dialog.parentElement, document.body, 'in the body unless a host is given');
  assert.equal(dialog.open, true);
  assert.equal(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent, 'Delete note?');
  assert.equal(document.getElementById(dialog.getAttribute('aria-describedby')).textContent, 'This cannot be undone.');
  const { cancel, confirm } = buttons();
  assert.deepEqual([cancel.textContent, confirm.textContent, cancel.type, confirm.type], ['Cancel', 'Confirm', 'button', 'button']);
  assert.ok(cancel.compareDocumentPosition(confirm) & 4, 'Cancel before Confirm: the safe choice is reached first');
  cancel.click();
  assert.equal(await answer, false);
});

test('confirmDialog: Confirm answers true, Cancel false; the dialog is gone and focus is back on what opened it', async (t) => {
  const from = opener(t);
  const yes = confirmDialog({ title: 'Archive?', confirmLabel: 'Archive', cancelLabel: 'Keep' });
  assert.deepEqual([buttons().confirm.textContent, buttons().cancel.textContent], ['Archive', 'Keep']);
  buttons().confirm.click();
  assert.equal(await yes, true);
  assert.equal(document.querySelector(ROOT), null, 'taken off the page');
  assertSame(document.activeElement, from, 'focus goes back to the opener');
  const no = confirmDialog({ title: 'Archive?' });
  buttons().cancel.click();
  assert.equal(await no, false);
  assertSame(document.activeElement, from);
});

test('confirmDialog: Escape and the backdrop are each a no, and the question is answered once', async (t) => {
  const from = opener(t);
  for (const dismiss of [(dialog) => key(dialog, 'Escape'), (dialog) => dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }))]) {
    const answer = confirmDialog({ title: 'Sure?' });
    dismiss(document.querySelector(ROOT));
    assert.equal(await answer, false);
    assert.equal(document.querySelector(ROOT), null);
    assertSame(document.activeElement, from);
  }
  const once = confirmDialog({ title: 'Sure?' });
  const { confirm, cancel } = buttons();
  confirm.click(); cancel.click(); confirm.click();
  assert.equal(await once, true, 'the first answer stands');
});

test('confirmDialog: its Cancel is the way out, so the dialog\'s own Close is not drawn twice, and Tab does not stop on it', async (t) => {
  opener(t);
  const answer = confirmDialog({ title: 'Send?' });
  const close = document.querySelector('.cloudcanvas-ui-dialog-close');
  assert.equal(close.hidden, true, 'one way out beside Confirm, named as the host named it');
  const { cancel, confirm } = buttons();
  cancel.focus();
  key(cancel, 'Tab', { shiftKey: true });
  assertSame(document.activeElement, confirm, 'Shift+Tab from the first control wraps to the last, not to a Close nobody sees');
  confirm.click();
  await answer;
});

test('confirmDialog: focus starts on Confirm, and on Cancel when the question is dangerous; Tab stays inside', async (t) => {
  opener(t);
  const plain = confirmDialog({ title: 'Send?' });
  assertSame(document.activeElement, buttons().confirm);
  buttons().cancel.click();
  await plain;
  const risky = confirmDialog({ title: 'Delete?', danger: true });
  const { cancel, confirm } = buttons();
  assertSame(document.activeElement, cancel, 'a keystroke too many never deletes anything');
  confirm.focus();
  const tab = key(confirm, 'Tab');
  assert.equal(tab.defaultPrevented, true, 'Tab past the last control is held in the dialog');
  assert.ok(document.querySelector(ROOT).contains(document.activeElement));
  cancel.click();
  await risky;
});

test('confirmDialog: danger gives the confirm button the danger tone, and a plain question does not', async (t) => {
  opener(t);
  const risky = confirmDialog({ title: 'Delete?', danger: true });
  assert.deepEqual([buttons().confirm.classList.contains('is-danger'), buttons().cancel.classList.contains('is-danger')], [true, false]);
  buttons().cancel.click();
  await risky;
  const plain = confirmDialog({ title: 'Send?' });
  assert.equal(buttons().confirm.classList.contains('is-danger'), false);
  assert.equal(buttons().confirm.classList.contains('is-primary'), true);
  buttons().cancel.click();
  await plain;
});

test('confirmDialog: a host element holds the dialog when one is given; a question with no title is refused', async (t) => {
  opener(t);
  const host = mount(t);
  const answer = confirmDialog({ title: 'Here?', host });
  assertSame(host.querySelector(ROOT).parentElement, host);
  buttons().confirm.click();
  assert.equal(await answer, true);
  assert.equal(host.children.length, 0, 'it leaves nothing behind in the host');
  await assert.rejects(confirmDialog({ title: '  ' }), /title/);
  await assert.rejects(confirmDialog(), /title/);
  assert.equal(document.querySelector(ROOT), null, 'a refused question is never drawn');
});

test('confirmDialog: the host closes the question it asked: the promise carries `close(result)`, a no by default, and the dialog is gone before the answer', async (t) => {
  const from = opener(t);
  const asking = confirmDialog({ title: 'Decline this invitation?', confirmLabel: 'Decline' });
  assert.ok(asking instanceof Promise, 'still the promise a host awaits');
  assert.equal(typeof asking.close, 'function');
  let seen = null;
  asking.then(() => { seen = document.querySelector(ROOT); });
  assert.equal(asking.close(), undefined);
  assert.equal(await asking, false, 'closed by the host is a no: nothing is confirmed');
  assert.equal(seen, null, 'taken off the page before the answer arrives');
  assertSame(document.activeElement, from, 'focus is back on what opened it');
  const yes = confirmDialog({ title: 'Keep?' });
  yes.close(true);
  assert.equal(await yes, true, 'a host that closes it with a result says which answer it is');
  const falsy = confirmDialog({ title: 'Keep?' });
  falsy.close(0);
  assert.equal(await falsy, false, 'the result is read as a yes or a no');
});

test('confirmDialog: closing it again, or after it was answered, does nothing; it closes its own question and no other', async (t) => {
  opener(t);
  const first = confirmDialog({ title: 'First?' });
  const second = confirmDialog({ title: 'Second?' });
  first.close();
  assert.equal(await first, false);
  assert.equal(document.querySelectorAll(ROOT).length, 1, 'the second question is still asked');
  assert.equal(document.getElementById(document.querySelector(ROOT).getAttribute('aria-labelledby')).textContent, 'Second?');
  buttons().confirm.click();
  assert.equal(await second, true);
  second.close(false);
  first.close(true);
  assert.equal(await second, true, 'the answer that was given stands');
  assert.equal(document.querySelector(ROOT), null);
  const refused = confirmDialog({ title: ' ' });
  assert.doesNotThrow(() => refused.close());
  await assert.rejects(refused, /title/);
});

test('confirmDialog: the danger button is drawn through tokens, told from a plain one by its border, and its words clear 4.5:1 in both themes', () => {
  const colours = RULES.filter((rule) => rule.selector.includes(`.${CLASS}`) || rule.selector.includes('.is-danger'))
    .flatMap((rule) => Object.entries(rule.declarations).filter(([name]) => /^(color|background|border|outline|box-shadow)/.test(name)));
  assert.ok(colours.length >= 3, `the check looked at too little: ${colours.length}`);
  assertTokensOnly(colours);
  const danger = '.cloudcanvas-ui-button.is-danger';
  assert.match(declared(danger, 'border-color'), /^var\(--cc-tone-danger, /);
  for (const [name, theme] of Object.entries(THEMES)) {
    const page = pageOf(theme);
    const ink = colour(resolve(declared(danger, 'color'), theme));
    const surface = over(colour(resolve(declared('.cloudcanvas-ui-dialog-panel', 'background'), theme)), page);
    assert.ok(contrast(ink, surface) >= 4.5, `${name}: the words are ${contrast(ink, surface).toFixed(2)}:1`);
    const edge = colour(resolve(declared(danger, 'border-color'), theme));
    assert.ok(contrast(edge, surface) >= 3, `${name}: the border is ${contrast(edge, surface).toFixed(2)}:1, a graphic at 3:1`);
  }
  assert.equal(declared(`.${CLASS}-actions`, 'justify-content'), 'flex-end');
  assert.deepEqual(RULES.filter((rule) => rule.selector.includes(`.${CLASS}`) && Object.keys(rule.declarations).some((property) => /^(transition|animation)/.test(property))), []);
});
