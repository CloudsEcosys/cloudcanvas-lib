/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Drawer: a named side region that stays part of the page. It folds toward the
 * control that brings it back - transform and opacity only, for a moment, and
 * not at all under reduced motion - and only then is hidden and inert. It
 * traps nothing, ignores Escape, and keeps that control's ARIA state - which,
 * when several drawers name one control, is the state of the last to take it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { UI_CSS, createDrawer } from '../../ui/index.js';
import { _resetReducedMotionForTests } from '../../plugins/motion.js';
import { assertSame, key, mount, stubBox } from '../helpers/ui.js';

/** A button outside the drawer, removed with its host: the control a drawer folds into. */
function anchorIn(host, box) {
  const anchor = document.createElement('button');
  anchor.type = 'button';
  host.append(anchor);
  return box ? stubBox(anchor, box) : anchor;
}

/** Every travel `panel` starts from here on: its keyframes, its timing, and the animation, to end by hand. */
function watchTravels(panel) {
  const travels = [];
  const animate = panel.animate;
  panel.animate = function spy(keyframes, timing) {
    const motion = animate.call(this, keyframes, timing);
    travels.push({ keyframes, timing, motion });
    return motion;
  };
  return travels;
}

/** Answer the reduced-motion query with "reduce" for the rest of the test. */
function reduceMotion(t) {
  const original = globalThis.matchMedia;
  globalThis.matchMedia = () => ({ matches: true });
  _resetReducedMotionForTests();
  t.after(() => { globalThis.matchMedia = original; _resetReducedMotionForTests(); });
}

const gone = (panel) => panel.hidden === true && panel.hasAttribute('inert');
const here = (panel) => panel.hidden === false && !panel.hasAttribute('inert');

test('drawer: a named region the host fills, closed until a model opens it, and the first model is a state, not a move', (t) => {
  const host = mount(t);
  const drawer = createDrawer(host);
  const panel = drawer.panel;
  assertSame(host.querySelector('.cloudcanvas-ui-drawer'), panel, 'the panel is the region itself');
  assert.equal(panel.getAttribute('role'), 'region');
  assert.ok(panel.id, 'it has an id for the control that owns it');
  assert.equal(gone(panel), true, 'no model yet: nothing to show, nothing to reach');
  const travels = watchTravels(panel);
  panel.append(document.createElement('p'));
  drawer.update({ open: true, label: 'Feed menu' });
  assert.equal(here(panel), true);
  assert.equal(panel.getAttribute('aria-label'), 'Feed menu');
  assert.equal(travels.length, 0, 'it was not open before, so there is nothing to travel from');
  assert.equal(panel.children.length, 1, 'the content is the host\'s and is left alone');
  drawer.update({ open: true });
  assert.equal(panel.getAttribute('aria-label'), 'Side panel', 'the default name');
  drawer.destroy();
  const closed = createDrawer(host);
  const closedTravels = watchTravels(closed.panel);
  closed.update({ open: false, label: 'Menu' });
  assert.equal(gone(closed.panel), true);
  assert.equal(closedTravels.length, 0);
  assert.ok(UI_CSS.includes('.cloudcanvas-ui-drawer'), 'the kit sheet lays the region out');
  closed.destroy();
});

test('drawer: collapseTo carries aria-expanded and aria-controls, and its press reports the state asked for', (t) => {
  const host = mount(t);
  const asked = [];
  const drawer = createDrawer(host, { onToggle: (open) => asked.push(open) });
  const anchor = anchorIn(host);
  drawer.update({ open: true, label: 'Menu', collapseTo: anchor });
  assert.equal(anchor.getAttribute('aria-controls'), drawer.panel.id);
  assert.equal(anchor.getAttribute('aria-expanded'), 'true');
  anchor.click();
  assert.deepEqual(asked, [false], 'a press on an open drawer asks for it closed');
  assert.equal(here(drawer.panel), true, 'controlled: it shows what the next model says, not what was pressed');
  assert.equal(anchor.getAttribute('aria-expanded'), 'true');
  drawer.update({ open: false, label: 'Menu', collapseTo: anchor });
  assert.equal(anchor.getAttribute('aria-expanded'), 'false', 'the state is the model\'s from the moment it changes, not from the end of the move');
  anchor.click();
  assert.deepEqual(asked, [false, true]);
  const other = anchorIn(host);
  drawer.update({ open: false, label: 'Menu', collapseTo: other });
  assert.equal(anchor.hasAttribute('aria-expanded') || anchor.hasAttribute('aria-controls'), false, 'the control it left is released');
  assert.equal(other.getAttribute('aria-controls'), drawer.panel.id);
  assert.equal(other.getAttribute('aria-expanded'), 'false');
  anchor.click();
  other.click();
  assert.deepEqual(asked, [false, true, true], 'only the control it holds is heard');
  drawer.update({ open: false, label: 'Menu' });
  assert.equal(other.hasAttribute('aria-expanded') || other.hasAttribute('aria-controls'), false, 'no collapseTo, no control');
  other.click();
  assert.deepEqual(asked, [false, true, true]);
  drawer.destroy();
});

/** What a control says about the region it controls: `[aria-controls, aria-expanded]`. */
const says = (anchor) => [anchor.getAttribute('aria-controls'), anchor.getAttribute('aria-expanded')];

/*
 * Written first and seen to fail on the drawer as it was, where letting go of
 * a control removed both attributes whoever had written them:
 *
 *   ✖ drawer: a control several drawers name has one owner, the last to take it; letting go never strips what another drawer wrote
 *     AssertionError [ERR_ASSERTION]: the first lets go: the control is still the second's
 *     + actual - expected
 *       [
 *     +   null,
 *     +   null
 *     -   'cloudcanvas-ui-drawer-5',
 *     -   'true'
 *       ]
 */
test('drawer: a control several drawers name has one owner, the last to take it; letting go never strips what another drawer wrote', (t) => {
  const host = mount(t);
  const anchor = anchorIn(host);
  const first = createDrawer(host);
  const second = createDrawer(host);
  first.update({ open: true, label: 'One', collapseTo: anchor });
  assert.deepEqual(says(anchor), [first.panel.id, 'true']);
  second.update({ open: true, label: 'Two', collapseTo: anchor });
  assert.deepEqual(says(anchor), [second.panel.id, 'true'], 'the last to take the control owns it');
  first.update({ open: true, label: 'One', collapseTo: null });
  assert.deepEqual(says(anchor), [second.panel.id, 'true'], 'the first lets go: the control is still the second\'s');
  second.update({ open: false, label: 'Two', collapseTo: anchor });
  assert.deepEqual(says(anchor), [second.panel.id, 'false'], 'and still follows it');
  const third = createDrawer(host);
  third.update({ open: true, label: 'Three', collapseTo: anchor });
  third.destroy();
  assert.deepEqual(says(anchor), [second.panel.id, 'false'], 'a destroyed owner hands the control back to the one before it');
  second.destroy();
  assert.deepEqual(says(anchor), [null, null], 'no drawer names it any more: it is bare');
  first.destroy();
});

test('drawer: a drawer that is not the owner keeps its place in line - unseen on the control, and its owner again with the state it has by then', (t) => {
  const host = mount(t);
  const anchor = anchorIn(host);
  const other = anchorIn(host);
  const first = createDrawer(host);
  const second = createDrawer(host);
  first.update({ open: true, collapseTo: anchor });
  second.update({ open: true, collapseTo: anchor });
  first.update({ open: false, collapseTo: anchor });
  assert.deepEqual(says(anchor), [second.panel.id, 'true'], 'a redraw of the one behind does not take the control back, nor write its state');
  second.update({ open: true, collapseTo: other });
  assert.deepEqual(says(anchor), [first.panel.id, 'false'], 'the owner moved to another control: the one before owns this one, as it is now');
  assert.deepEqual(says(other), [second.panel.id, 'true']);
  second.update({ open: true, collapseTo: anchor });
  assert.deepEqual(says(anchor), [second.panel.id, 'true'], 'taking the control again is taking it last');
  assert.deepEqual(says(other), [null, null]);
  first.destroy();
  assert.deepEqual(says(anchor), [second.panel.id, 'true'], 'the one behind leaving changes nothing on the control');
  second.destroy();
  assert.deepEqual(says(anchor), [null, null]);
});

test('drawer: only the owner hears a shared control\'s press, and every drawer that names it still hands it focus', (t) => {
  const host = mount(t);
  const anchor = anchorIn(host);
  const asked = [];
  const first = createDrawer(host, { onToggle: (open) => asked.push(['first', open]) });
  const second = createDrawer(host, { onToggle: (open) => asked.push(['second', open]) });
  const field = document.createElement('input');
  first.panel.append(field);
  first.update({ open: true, collapseTo: anchor });
  second.update({ open: false, collapseTo: anchor });
  anchor.click();
  assert.deepEqual(asked, [['second', true]], 'one press, one question: the owner\'s, with the state asked of it');
  second.destroy();
  anchor.click();
  assert.deepEqual(asked, [['second', true], ['first', false]], 'the one before it is heard again');
  const travels = watchTravels(first.panel);
  const third = createDrawer(host);
  third.update({ open: true, collapseTo: anchor });
  field.focus();
  first.update({ open: false, collapseTo: anchor });
  travels[0].motion.finish();
  assertSame(document.activeElement, anchor, 'it folds into the control it names, owner or not');
  first.destroy();
  third.destroy();
});

test('drawer: closing travels toward collapseTo by transform and opacity alone, then is hidden and inert; opening runs it backwards', (t) => {
  const host = mount(t);
  const drawer = createDrawer(host);
  const panel = stubBox(drawer.panel, { left: 700, top: 60, width: 300, height: 600 });
  const anchor = anchorIn(host, { left: 640, top: 10, width: 40, height: 20 });
  const travels = watchTravels(panel);
  drawer.update({ open: true, collapseTo: anchor });
  drawer.update({ open: false, collapseTo: anchor });
  assert.equal(travels.length, 1, 'open became closed: one travel');
  const closing = travels[0];
  assert.deepEqual([...new Set(closing.keyframes.flatMap((frame) => Object.keys(frame)))].sort(), ['opacity', 'transform'], 'nothing that is laid out again');
  assert.equal(closing.keyframes.at(-1).opacity, 0, 'it ends unseen');
  assert.match(closing.keyframes.at(-1).transform, /^scale\(0(?:\.\d+)?\)$/, 'and small, at the point it folds into');
  assert.ok(closing.timing.duration >= 120 && closing.timing.duration <= 180, `one brief move: ${closing.timing.duration} ms`);
  assert.notEqual(closing.timing.direction, 'reverse');
  assert.equal(panel.style.getPropertyValue('--drawer-origin-x'), '-40px', 'the centre of collapseTo, 660, from the panel\'s left edge, 700');
  assert.equal(panel.style.getPropertyValue('--drawer-origin-y'), '-40px', 'the centre of collapseTo, 20, from the panel\'s top edge, 60');
  assert.equal(here(panel), true, 'still on the page while it travels');
  closing.motion.finish();
  assert.equal(gone(panel), true, 'then it is hidden and inert');
  assert.equal(panel.getAnimations().length, 0, 'and the travel holds no style over it');
  stubBox(anchor, { left: 100, top: 10, width: 40, height: 20 });
  drawer.update({ open: true, collapseTo: anchor });
  assert.equal(here(panel), true, 'opening shows it first: it travels in view and in reach');
  assert.equal(travels.length, 2);
  assert.deepEqual(travels[1].keyframes, closing.keyframes, 'the same move');
  assert.equal(travels[1].timing.direction, 'reverse', 'run backwards');
  assert.equal(travels[1].timing.duration, closing.timing.duration);
  assert.equal(panel.style.getPropertyValue('--drawer-origin-x'), '-580px', 'aimed afresh: the control moved');
  travels[1].motion.finish();
  assert.equal(here(panel), true);
  assert.equal(panel.getAnimations().length, 0);
  drawer.destroy();
});

test('drawer: a control with no box is no direction, and none at all leaves the sheet\'s own', (t) => {
  const host = mount(t);
  const drawer = createDrawer(host);
  const panel = stubBox(drawer.panel, { left: 700, top: 60, width: 300, height: 600 });
  const travels = watchTravels(panel);
  const anchor = anchorIn(host, { left: 640, top: 10, width: 40, height: 20 });
  drawer.update({ open: true, collapseTo: anchor });
  drawer.update({ open: false, collapseTo: anchor });
  travels[0].motion.finish();
  assert.equal(panel.style.getPropertyValue('--drawer-origin-x'), '-40px');
  stubBox(anchor, { left: 0, top: 0, width: 0, height: 0 });
  drawer.update({ open: true, collapseTo: anchor });
  assert.equal(panel.style.getPropertyValue('--drawer-origin-x'), '', 'a control that is not drawn has no place to fold into');
  assert.equal(panel.style.getPropertyValue('--drawer-origin-y'), '');
  travels[1].motion.finish();
  drawer.update({ open: false });
  assert.equal(travels.length, 3, 'it still travels, toward the origin the sheet gives it');
  assert.equal(panel.style.getPropertyValue('--drawer-origin-x'), '');
  assert.match(UI_CSS, /\.cloudcanvas-ui-drawer \{[^}]*transform-origin: var\(--drawer-origin-x, [^)]+\) var\(--drawer-origin-y, [^)]+\)/, 'the sheet reads the aim and has a default');
  drawer.destroy();
});

test('drawer: a change of mind in mid-travel turns the same travel round where it stands', (t) => {
  const host = mount(t);
  const drawer = createDrawer(host);
  const panel = drawer.panel;
  const travels = watchTravels(panel);
  drawer.update({ open: true });
  drawer.update({ open: false });
  drawer.update({ open: true });
  assert.equal(travels.length, 1, 'no second travel is stacked on the first');
  assert.ok(travels[0].motion.playbackRate < 0, 'the closing travel now runs backwards');
  travels[0].motion.finish();
  assert.equal(here(panel), true, 'and ends open');
  assert.equal(panel.getAnimations().length, 0);
  drawer.update({ open: false });
  drawer.update({ open: true });
  drawer.update({ open: false });
  assert.equal(travels.length, 2);
  travels[1].motion.finish();
  assert.equal(gone(panel), true, 'turned round twice, it ends where the last model says');
  drawer.destroy();
});

test('drawer: under reduced motion nothing travels - the region is simply there, or gone', (t) => {
  reduceMotion(t);
  const host = mount(t);
  const drawer = createDrawer(host);
  const panel = stubBox(drawer.panel, { left: 700, top: 60, width: 300, height: 600 });
  const anchor = anchorIn(host, { left: 640, top: 10, width: 40, height: 20 });
  const travels = watchTravels(panel);
  drawer.update({ open: true, collapseTo: anchor });
  drawer.update({ open: false, collapseTo: anchor });
  assert.equal(gone(panel), true, 'closed at once');
  drawer.update({ open: true, collapseTo: anchor });
  assert.equal(here(panel), true, 'open at once');
  assert.equal(travels.length, 0);
  drawer.destroy();
});

test('drawer: focus inside a region that closes goes to collapseTo; focus anywhere else is left where it is', (t) => {
  const host = mount(t);
  const drawer = createDrawer(host);
  const panel = drawer.panel;
  const travels = watchTravels(panel);
  const anchor = anchorIn(host);
  const elsewhere = anchorIn(host);
  const field = document.createElement('input');
  panel.append(field);
  drawer.update({ open: true, collapseTo: anchor });
  field.focus();
  drawer.update({ open: false, collapseTo: anchor });
  assertSame(document.activeElement, field, 'focus stays put while the region is still on the page');
  travels[0].motion.finish();
  assertSame(document.activeElement, anchor, 'it would have been lost with the region, so the control takes it');
  drawer.update({ open: true, collapseTo: anchor });
  travels[1].motion.finish();
  assertSame(document.activeElement, anchor, 'opening moves no focus: the region is not a dialog');
  elsewhere.focus();
  drawer.update({ open: false, collapseTo: anchor });
  travels[2].motion.finish();
  assertSame(document.activeElement, elsewhere, 'focus that was never inside is not the drawer\'s to move');
  drawer.update({ open: true });
  travels[3].motion.finish();
  field.focus();
  drawer.update({ open: false });
  assert.doesNotThrow(() => travels[4].motion.finish(), 'with no collapseTo there is nowhere to send it');
  assert.equal(gone(panel), true);
  drawer.destroy();
});

test('drawer: not a dialog - Escape and Tab are the page\'s, nothing is trapped, nothing is asked', (t) => {
  const host = mount(t);
  const asked = [];
  const drawer = createDrawer(host, { onToggle: (open) => asked.push(open) });
  const panel = drawer.panel;
  const field = document.createElement('input');
  panel.append(field);
  const anchor = anchorIn(host);
  drawer.update({ open: true, label: 'Menu', collapseTo: anchor });
  field.focus();
  assert.equal(key(field, 'Escape').defaultPrevented, false);
  assert.equal(key(field, 'Tab').defaultPrevented, false);
  assert.equal(key(field, 'Tab', { shiftKey: true }).defaultPrevented, false);
  assert.deepEqual(asked, [], 'Escape closes nothing');
  assert.equal(here(panel), true);
  assertSame(document.activeElement, field);
  assert.equal(panel.hasAttribute('aria-modal'), false);
  assert.equal(panel.hasAttribute('tabindex'), false, 'the region is not a tab stop of its own');
  drawer.destroy();
});

test('drawer: destroy removes the region, releases collapseTo, ends a travel in flight, and is safe to repeat', (t) => {
  const host = mount(t);
  const asked = [];
  const drawer = createDrawer(host, { onToggle: (open) => asked.push(open) });
  const panel = drawer.panel;
  const travels = watchTravels(panel);
  const anchor = anchorIn(host);
  drawer.update({ open: true, collapseTo: anchor });
  drawer.update({ open: false, collapseTo: anchor });
  drawer.destroy();
  drawer.destroy();
  assertSame(host.querySelector('.cloudcanvas-ui-drawer'), null);
  assert.equal(anchor.hasAttribute('aria-expanded') || anchor.hasAttribute('aria-controls'), false);
  assert.notEqual(travels[0].motion.playState, 'running', 'no travel is left running');
  anchor.click();
  assert.deepEqual(asked, []);
  assert.doesNotThrow(() => drawer.update({ open: true, label: 'Again', collapseTo: anchor }));
  assert.equal(anchor.hasAttribute('aria-expanded'), false, 'update after destroy does nothing');
  assertSame(host.querySelector('.cloudcanvas-ui-drawer'), null);
});
