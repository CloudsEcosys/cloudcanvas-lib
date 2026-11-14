/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * What kind of nothing an empty state is: `kind` is 'empty' (nothing here yet), 'error' (it could not be loaded),
 * 'locked' (it needs something first) or 'loading' (it is on its way), and chooses the icon above the words and its
 * tone. With no kind the empty state is as it always was: words, and an action when there is one.
 *
 * Written first and seen to fail on an empty state that took no kind (5 of the 6 here failed, the action's case
 * passing; the test document's case in `ui-testing-mounts.test.js` failed too):
 *
 *   ✖ empty state kind: each kind draws its own icon above the words and says its kind on the root
 *     TypeError [Error]: Cannot read properties of null (reading 'hidden')
 *   ✖ empty state kind: loading says it is busy, the others do not, and none is a live region: for that the host uses createStatus
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *   ✖ empty state kind: a kind the kit does not know is refused before anything is drawn
 *     AssertionError [ERR_ASSERTION]: Missing expected exception.
 *   ✖ empty state kind: the icon is drawn in the tone of its kind, from tokens, as a graphic at 3:1 on the page in both themes, and nothing moves
 *     AssertionError [ERR_ASSERTION]: the check looked at too little: 0
 *   ✖ test document: an empty state of a kind draws its icon first, says its kind and, loading, that it is busy
 *     TypeError [Error]: Cannot read properties of null (reading 'getAttribute')
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyState } from '../../ui/index.js';
import { mount } from '../helpers/ui.js';
import { RULES, THEMES, assertTokensOnly, colour, contrast, coloursOf, declared, over, pageOf, resolve } from './ui-sheet.js';

const ROOT = '.cloudcanvas-ui-empty';
const slotOf = (host) => host.querySelector(`${ROOT}-icon`);
const KINDS = ['empty', 'error', 'locked', 'loading'];

test('empty state kind: each kind draws its own icon above the words and says its kind on the root', (t) => {
  const host = mount(t), empty = createEmptyState(host);
  for (const kind of KINDS) {
    empty.update({ kind, title: 'Nothing', body: 'Yet.' });
    const slot = slotOf(host);
    assert.deepEqual([slot.hidden, slot.getAttribute('aria-hidden'), slot.querySelector('svg').getAttribute('data-icon'), host.querySelector(ROOT).getAttribute('data-kind')], [false, 'true', kind, kind]);
    assert.equal(host.querySelector(ROOT).firstElementChild, slot, 'the icon stands first');
  }
  empty.destroy();
});

test('empty state kind: no kind is no icon and no kind on the root, and a kind that goes takes its icon with it', (t) => {
  const host = mount(t), empty = createEmptyState(host);
  empty.update({ title: 'Nothing', body: 'Yet.' });
  assert.deepEqual([slotOf(host).hidden, host.querySelector(ROOT).hasAttribute('data-kind')], [true, false]);
  empty.update({ kind: 'error', title: 'Could not load' });
  empty.update({ title: 'Nothing' });
  assert.deepEqual([slotOf(host).hidden, slotOf(host).childNodes.length, host.querySelector(ROOT).hasAttribute('data-kind')], [true, 0, false]);
  empty.destroy();
});

test('empty state kind: loading says it is busy, the others do not, and none is a live region: for that the host uses createStatus', (t) => {
  const host = mount(t), empty = createEmptyState(host);
  const root = () => host.querySelector(ROOT);
  empty.update({ kind: 'loading', title: 'Loading notes' });
  assert.equal(root().getAttribute('aria-busy'), 'true');
  empty.update({ kind: 'error', title: 'Could not load' });
  assert.equal(root().hasAttribute('aria-busy'), false);
  assert.deepEqual(['role', 'aria-live'].map((name) => root().hasAttribute(name)), [false, false]);
  empty.destroy();
});

test('empty state kind: a kind the kit does not know is refused before anything is drawn', (t) => {
  const host = mount(t), empty = createEmptyState(host);
  empty.update({ kind: 'locked', title: 'Sign in' });
  assert.throws(() => empty.update({ kind: 'sleepy', title: 'Zzz' }), /sleepy/);
  assert.equal(host.querySelector(`${ROOT}-title`).textContent, 'Sign in', 'what was drawn is as it was');
  empty.destroy();
});

test('empty state kind: an action beside the icon still reports, and the icon is not in its way', (t) => {
  const host = mount(t), taken = [], empty = createEmptyState(host, { onAction: () => taken.push('act') });
  empty.update({ kind: 'error', title: 'Could not load', actionLabel: 'Try again' });
  host.querySelector(`${ROOT}-action`).click();
  assert.deepEqual(taken, ['act']);
  empty.destroy();
});

test('empty state kind: the icon is drawn in the tone of its kind, from tokens, as a graphic at 3:1 on the page in both themes, and nothing moves', () => {
  const colours = coloursOf([`${ROOT}-icon`]);
  assert.ok(colours.length >= 3, `the check looked at too little: ${colours.length}`);
  assertTokensOnly(colours);
  const toneOf = (kind) => declared(kind === 'empty' || kind === 'loading' ? `${ROOT}-icon` : `${ROOT}[data-kind="${kind}"] ${ROOT}-icon`, 'color');
  assert.match(toneOf('error'), /^var\(--cc-tone-danger, /);
  assert.notEqual(toneOf('locked'), toneOf('error'));
  for (const [name, theme] of Object.entries(THEMES)) {
    const page = pageOf(theme);
    for (const kind of KINDS) {
      const ink = over(colour(resolve(toneOf(kind), theme)), page);
      assert.ok(contrast(ink, page) >= 3, `${name}, ${kind}: ${contrast(ink, page).toFixed(2)}:1`);
    }
  }
  assert.deepEqual(RULES.filter((rule) => rule.selector.includes(`${ROOT}-icon`) && Object.keys(rule.declarations).some((property) => /^(transition|animation)/.test(property))), []);
});
