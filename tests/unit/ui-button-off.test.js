/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A button that is `off`: unavailable for now, and still there. `disabled` drops a button from the tab order and,
 * when it was the one just pressed, takes focus with it to the top of the page; `off` looks unavailable, says so
 * (`aria-disabled`), keeps focus and its place in the tab order, and reports no press. `setOff` and `isOff` are
 * how a host turns one off and on again after it is made.
 *
 * Red by construction before they existed, on the suite as it loaded (`isOff` and `setOff` were not exports):
 *
 *   SyntaxError: The requested module '../../.plugin/ui/index.js' does not provide an export named 'isOff'
 *
 * and, with those two supplied by the suite itself so that the button as it was could be asked (4 of the 6 failed):
 *
 *   ✖ button off: it says it is unavailable, can still be reached, and reports no press
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *   ✖ button off: a host turns it off and on again, and focus stays where it was
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
 *   ✖ button off: the keys that press a button reach it, and press nothing while it is off
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
 *   ✖ button off: it is drawn dimmed and not clickable-looking, with no hover and the same focus ring
 *     AssertionError [ERR_ASSERTION]: the sheet declares no opacity for .cloudcanvas-ui-button[aria-disabled="true"]
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { BUTTON_CLASS, button, createLife, documentOf, isOff, setOff } from '../../ui/index.js';
import { assertSame, key, mount } from '../helpers/ui.js';
import { RULES, declared } from './ui-sheet.js';

const OFF = `.${BUTTON_CLASS}[aria-disabled="true"]`;
const made = (t, options) => { const host = mount(t), life = createLife(), node = button(documentOf(host), { label: 'Send', signal: life.signal, ...options }); host.append(node); t.after(() => life.destroy()); return node; };

test('button off: it says it is unavailable, can still be reached, and reports no press', (t) => {
  const presses = [], node = made(t, { off: true, onClick: () => presses.push('press') });
  assert.equal(node.getAttribute('aria-disabled'), 'true');
  assert.equal(node.disabled, false, 'not `disabled`: a button that is would leave the tab order');
  assert.notEqual(node.getAttribute('tabindex'), '-1');
  node.focus();
  assertSame(document.activeElement, node);
  node.click();
  assert.deepEqual(presses, []);
  assert.equal(isOff(node), true);
});

test('button off: a button that is not off reports its press with the event, as it always did', (t) => {
  const presses = [], node = made(t, { onClick: (event) => presses.push(event.type) });
  assert.equal(node.hasAttribute('aria-disabled'), false);
  node.click();
  assert.deepEqual(presses, ['click']);
  assert.equal(isOff(node), false);
});

test('button off: a host turns it off and on again, and focus stays where it was', (t) => {
  const presses = [], node = made(t, { onClick: () => presses.push('press') });
  node.focus();
  node.click();
  setOff(node, true);
  assertSame(document.activeElement, node, 'the button just pressed is off for the moment its command runs, and keeps focus');
  node.click();
  assert.deepEqual([presses, isOff(node), node.getAttribute('aria-disabled')], [['press'], true, 'true']);
  setOff(node, false);
  node.click();
  assert.deepEqual([presses, isOff(node), node.hasAttribute('aria-disabled')], [['press', 'press'], false, false]);
});

test('button off: the keys that press a button reach it, and press nothing while it is off', (t) => {
  const presses = [], node = made(t, { off: true, onClick: () => presses.push('press') });
  node.focus();
  key(node, 'Enter');
  key(node, ' ', { type: 'keyup' });
  node.click();
  assert.deepEqual(presses, []);
  setOff(node, false);
  node.click();
  assert.deepEqual(presses, ['press']);
});

test('button off: its name, its title and its class are the button\'s own; disabled still means disabled', (t) => {
  const node = made(t, { off: true, ariaLabel: 'Send note', title: 'Nothing to send yet', className: 'extra' });
  assert.deepEqual([node.getAttribute('aria-label'), node.title, node.classList.contains(BUTTON_CLASS), node.classList.contains('extra')], ['Send note', 'Nothing to send yet', true, true]);
  const both = made(t, { off: true, disabled: true });
  assert.equal(both.disabled, true);
});

test('button off: it is drawn dimmed and not clickable-looking, with no hover and the same focus ring', () => {
  assert.equal(declared(OFF, 'opacity'), '0.5');
  assert.equal(declared(OFF, 'cursor'), 'not-allowed');
  const hover = RULES.find((rule) => rule.media === null && rule.selector.startsWith(`.${BUTTON_CLASS}:hover`));
  assert.ok(hover.selector.includes(':not([aria-disabled="true"])'), 'no lift on a button that does nothing');
  const ring = RULES.find((rule) => rule.selector.includes(`.${BUTTON_CLASS}`) && rule.selector.includes(':focus-visible') && 'outline' in rule.declarations);
  assert.ok(!ring.selector.includes('aria-disabled'), 'and nothing takes its focus ring away');
  assert.deepEqual(RULES.filter((rule) => rule.selector.includes('aria-disabled') && Object.keys(rule.declarations).some((property) => /^(transition|animation)/.test(property))), []);
});
