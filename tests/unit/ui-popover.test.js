/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Popover: a small non-modal dialog placed by an anchor - under it, or over it when there is no room, shifted back
 * inside the screen, kept off what the host says not to cover. It opens by the model and closes itself on Escape
 * or a press outside, reports why, and gives focus back to its anchor. Where it goes, as arithmetic, is
 * `ui-popover-place.test.js`; this file is what it does to the page.
 *
 * Red by construction before the control existed, seen on this suite, on the placement suite and on
 * `ui-testing-mounts.test.js`:
 *
 *   SyntaxError: The requested module '../../.plugin/ui/index.js' does not provide an export named 'createPopover'
 *   Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../.plugin/ui/popover/place.js' imported from .../tests/unit/ui-popover-place.test.js
 *
 * Red by construction before it stood past what it avoids (a button at the top of a 320-wide screen, the strip under it,
 * the popover opened from the button itself; it covered the strip from where it was):
 *
 *   ✖ popover: the (i) of a top bar opens it past the tab strip under the bar, from the button itself, ...
 *     AssertionError: a gap below the strip, kept inside the screen: not over the tabs, and no anchor of the host's made for it
 *     actual:   [ 'bottom', '72px', '40px' ]     expected: [ 'bottom', '72px', '84px' ]
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { UI_TOKENS, createPopover } from '../../ui/index.js';
import { assertSame, key, mount, pointer, stubBox } from '../helpers/ui.js';
import { RULES, assertTokensOnly, coloursOf, declared } from './ui-sheet.js';

const ROOT = '.cloudcanvas-ui-popover';
const popover = () => document.querySelector(ROOT);

/** An anchor in a host, and a body of content with one control, the way a popover is opened. */
function setup(t, options = {}) {
  const host = mount(t), anchor = document.createElement('button');
  anchor.textContent = 'Saved';
  host.append(anchor);
  const closes = [], pop = createPopover(anchor, { onClose: (reason) => closes.push(reason), ...options });
  const content = document.createElement('div');
  content.innerHTML = '<p>Saved 2 minutes ago</p><button type="button" id="again">Save again</button>';
  t.after(() => pop.destroy());
  return { host, anchor, pop, closes, content, open: (extra = {}) => pop.update({ open: true, label: 'Save status', content, ...extra }) };
}

/** Make the popover (not yet laid out in the test document) as large as `box` says, then place it again. */
function sized({ open }, box, extra = {}) {
  open(extra);
  stubBox(popover(), { width: box.width, height: box.height });
  open(extra);
  return popover();
}

test('popover: a non-modal dialog with the label it was given, holding the content, on the page only while it is open', (t) => {
  const { open, pop, content } = setup(t);
  assert.equal(popover(), null, 'nothing is drawn until it opens');
  open();
  const root = popover();
  assert.deepEqual([root.getAttribute('role'), root.getAttribute('aria-label'), root.hasAttribute('aria-modal'), root.getAttribute('tabindex')], ['dialog', 'Save status', false, '-1']);
  assertSame(root.firstChild, content);
  assertSame(root.parentElement, document.body, 'in the body, where nothing clips it');
  pop.update({ open: false });
  assert.equal(popover(), null);
  open();
  assertSame(popover().firstChild, content, 'the same content, back');
});

test('popover: opening takes focus into it, Escape closes it and gives focus back to the anchor, and says why', (t) => {
  const { anchor, open, closes } = setup(t);
  anchor.focus();
  open();
  assertSame(document.activeElement, document.getElementById('again'), 'the first control of its content');
  assert.equal(key(document.activeElement, 'Escape').defaultPrevented, true);
  assert.deepEqual(closes, ['escape']);
  assert.equal(popover(), null);
  assertSame(document.activeElement, anchor);
  open();
  anchor.focus();
  key(anchor, 'Escape');
  assert.deepEqual(closes, ['escape', 'escape'], 'heard from the anchor too, for focus that went back to it');
  assert.equal(popover(), null);
});

test('popover: with no control in it, focus goes to the popover itself so the keys are heard', (t) => {
  const { pop } = setup(t);
  const text = document.createElement('p');
  text.textContent = 'Nothing to press';
  pop.update({ open: true, label: 'Note', content: text });
  assertSame(document.activeElement, popover());
});

test('popover: a press outside closes it and gives focus back; a press inside it, or on its anchor, does not', (t) => {
  const { anchor, open, closes, host } = setup(t);
  const elsewhere = document.createElement('div');
  host.append(elsewhere);
  open();
  pointer(document.getElementById('again'), 'pointerdown');
  pointer(anchor, 'pointerdown');
  assert.deepEqual(closes, [], 'its own, and the anchor\'s, which the host answers');
  assert.notEqual(popover(), null);
  pointer(elsewhere, 'pointerdown');
  assert.deepEqual(closes, ['outside']);
  assert.equal(popover(), null);
  assertSame(document.activeElement, anchor);
});

test('popover: the host closing it by the model is reported as update; destroy reports nothing and leaves nothing', (t) => {
  const { open, pop, closes } = setup(t);
  open();
  pop.update({ open: false });
  pop.update({ open: false });
  assert.deepEqual(closes, ['update'], 'once, and not for a popover that was already shut');
  open();
  pop.destroy(); pop.destroy();
  assert.deepEqual(closes, ['update']);
  assert.equal(popover(), null);
  assert.doesNotThrow(() => pop.update({ open: true, label: 'x', content: document.createElement('div') }));
  assert.equal(popover(), null);
});

test('popover: open it with a label and content, or it is refused before anything is drawn', (t) => {
  const { pop, content } = setup(t);
  assert.throws(() => pop.update({ open: true, content }), /label/);
  assert.throws(() => pop.update({ open: true, label: 'Save status' }), /content/);
  assert.equal(popover(), null);
  assert.throws(() => createPopover(null), TypeError);
});

test('popover: an anchor inside a dialog keeps it inside that dialog, and a host can be named', (t) => {
  const host = mount(t), dialog = document.createElement('dialog'), anchor = document.createElement('button');
  dialog.append(anchor);
  host.append(dialog);
  const inside = createPopover(anchor);
  inside.update({ open: true, label: 'Details', content: document.createElement('div') });
  assertSame(popover().parentElement, dialog, 'above the dialog\'s own layer, not behind it');
  inside.destroy();
  const named = mount(t), other = createPopover(anchor, { host: named });
  other.update({ open: true, label: 'Details', content: document.createElement('div') });
  assertSame(popover().parentElement, named);
  other.destroy();
});

test('popover: at 320 wide it is held to the screen: its width, its shift and its flip', (t) => {
  const was = [window.innerWidth, window.innerHeight];
  window.innerWidth = 320; window.innerHeight = 568;
  t.after(() => { [window.innerWidth, window.innerHeight] = was; });
  const s = setup(t);
  stubBox(s.anchor, { left: 250, top: 520, width: 60, height: 30 });
  const root = sized(s, { width: 400, height: 100 });
  assert.deepEqual([root.style.left, root.style.maxWidth, root.getAttribute('data-side')], ['8px', '304px', 'top'], 'as wide as the screen leaves it, at its margin, over the anchor that stands low');
  assert.equal(root.style.top, '416px');
});

test('popover: it keeps off what it is told to avoid, whether the host names it with the popover or in the model, and a resize places it again', (t) => {
  const was = [window.innerWidth, window.innerHeight];
  window.innerWidth = 320; window.innerHeight = 568;
  t.after(() => { [window.innerWidth, window.innerHeight] = was; });
  const strip = stubBox(document.createElement('nav'), { left: 0, top: 330, width: 320, height: 50 });
  const s = setup(t, { avoid: strip });
  stubBox(s.anchor, { left: 20, top: 300, width: 60, height: 30 });
  const root = sized(s, { width: 200, height: 100 });
  assert.equal(root.getAttribute('data-side'), 'top', 'the strip is under the anchor, so it goes over it');
  s.open({ avoid: { left: 0, top: 0, right: 320, bottom: 40 } });
  assert.equal(root.getAttribute('data-side'), 'bottom', 'the model\'s own wins');
  window.innerWidth = 200;
  window.dispatchEvent(new Event('resize'));
  assert.equal(root.style.maxWidth, '184px', 'a resize places it again');
});

test('popover: the (i) of a top bar opens it past the tab strip under the bar, from the button itself, and the button takes focus back whichever way it closes', (t) => {
  const was = [window.innerWidth, window.innerHeight];
  window.innerWidth = 320; window.innerHeight = 568;
  t.after(() => { [window.innerWidth, window.innerHeight] = was; });
  const strip = stubBox(document.createElement('nav'), { left: 0, top: 36, width: 320, height: 44 });
  const s = setup(t, { avoid: strip });
  stubBox(s.anchor, { left: 276, top: 4, width: 32, height: 32 });
  const root = sized(s, { width: 240, height: 120 });
  assert.deepEqual([root.getAttribute('data-side'), root.style.left, root.style.top], ['bottom', '72px', '84px'], 'a gap below the strip, kept inside the screen: not over the tabs, and no anchor of the host\'s made for it');
  s.pop.update({ open: false });
  assertSame(document.activeElement, s.anchor, 'closed by the model, and the button has the focus it held in the popover');
  s.open();
  s.anchor.focus();
  s.open({ avoid: undefined });
  s.pop.update({ open: false });
  assert.deepEqual(s.closes, ['update', 'update']);
});

test('popover: drawn through tokens, stacked between a dialog and a menu, and nothing in it moves', () => {
  assert.equal(UI_TOKENS['--cc-z-ui-popover']?.category, 'z-index');
  const level = (name) => Number(new RegExp(`var\\(${name}, (\\d+)\\)`).exec(RULES.map((rule) => rule.declarations['z-index'] ?? '').join(' '))?.[1]);
  assert.equal(declared(ROOT, 'z-index'), `var(--cc-z-ui-popover, ${level('--cc-z-ui-popover')})`);
  assert.ok(level('--cc-z-ui-dialog') < level('--cc-z-ui-popover') && level('--cc-z-ui-popover') < level('--cc-z-ui-menu'), 'over a dialog that is not modal, under a menu opened from it');
  assert.deepEqual([declared(ROOT, 'position'), declared(ROOT, 'overflow'), declared(ROOT, 'width')], ['fixed', 'auto', 'max-content']);
  const colours = coloursOf([ROOT]);
  assert.ok(colours.length >= 4, `the check looked at too little: ${colours.length}`);
  assertTokensOnly(colours);
  assert.deepEqual(RULES.filter((rule) => rule.selector.includes(ROOT) && Object.keys(rule.declarations).some((property) => /^(transition|animation)/.test(property))), []);
  assert.match(declared(`${ROOT}:focus-visible`, 'outline'), /^var\(--cc-focus-ring-width, 2px\) solid var\(--cc-focus-ring, /);
});
