/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * THE "MORE" BUTTON NEVER TAKES MORE THAN A THIRD OF ITS ITEM. At 390px a selected all-day chip of the
 * week view is about 57px wide, and the 44px button a finger needs took its end: what was left held none
 * of the title. A button that would take more than a third of the item it stands by is not drawn, and
 * the item does not hold room for it. The menu is still there for a pointer that right-clicks, for the
 * menu key, Shift+F10, and a touch that is held, and the hint line says so in the words of the one that
 * has no keyboard. Selecting by a touch tap is the item's own and does not change.
 *
 * A box with no layout measures 0 and is given the button, so a host that is not laid out yet
 * (or a document with no layout at all) draws it as it always did. A milestone is no bar: the button
 * stands beside its diamond, where its title would, and takes nothing of it.
 *
 * Every case was written before the code and run on the kit as it stood at `64a2e1b`; each case's comment
 * holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { key, pointer } from '../helpers/ui.js';
import { calendarOf, calls } from './ui-calendar-fixture.js';
import { ITEMS, timelineOf } from './ui-timeline-fixture.js';

const MORE = '.cloudcanvas-ui-item-more';
const moreIn = (host) => [...host.querySelectorAll(MORE)];
const CALENDAR_NAMES = ['onMove', 'onPick', 'onActivate', 'onMenu'];
const TIMELINE_NAMES = ['onActivate', 'onChange', 'onMenu'];
const HELD = 'Touch and hold, Shift+F10 or right-click for more';
const USUAL = 'Shift+F10 or right-click for more';
const calendarHint = (host) => host.querySelector('.cloudcanvas-ui-calendar-hint').textContent;
/** The last words of a hint line, which is where the menu is said: the usual ones while the button is there, the held ones when it is not. */
const tail = (line) => (line.endsWith(` · ${HELD}`) ? HELD : line.endsWith(` · ${USUAL}`) ? USUAL : line);

/**
 * The layout the test document has none of: the box of a "more" button (`button` wide) and of an item whose class is in
 * `items` (`width` wide), for the rest of the test. `set` changes both, as a resize does.
 */
function widths(t, { items, width, button }) {
  const original = Element.prototype.getBoundingClientRect;
  const now = { width, button };
  Element.prototype.getBoundingClientRect = function box() {
    const wide = this.classList.contains('cloudcanvas-ui-item-more') ? now.button : items.some((name) => this.classList.contains(name)) ? now.width : 0;
    return { left: 0, top: 0, width: wide, height: 24, right: wide, bottom: 24, x: 0, y: 0 };
  };
  t.after(() => { Element.prototype.getBoundingClientRect = original; });
  return { set: (next) => Object.assign(now, next) };
}

/** A ResizeObserver the test fires by hand: every one made is kept. */
function observers(t) {
  const view = document.defaultView, original = view.ResizeObserver, made = [];
  view.ResizeObserver = class { constructor(callback) { this.callback = callback; made.push(this); } observe() {} unobserve() {} disconnect() {} };
  t.after(() => { view.ResizeObserver = original; });
  return { fire: () => made.forEach((one) => one.callback([], one)) };
}

/*
 * Seen to fail on the calendar of `64a2e1b`, which drew the button whatever the chip's width:
 *
 *   ✖ calendar room: a chip too narrow for a third-sized button gets none, keeps no room for it, and says how the menu is reached
 *     AssertionError [ERR_ASSERTION]: a 57px chip cannot spare 44px: no button
 *     1 !== 0
 */
test('calendar room: a chip too narrow for a third-sized button gets none, keeps no room for it, and says how the menu is reached', (t) => {
  widths(t, { items: ['cloudcanvas-ui-calendar-event'], width: 57, button: 44 });
  const { host, draw, chip, log } = calendarOf(t, { names: CALENDAR_NAMES });
  draw({ selectedId: 'trip' });
  assert.equal(moreIn(host).length, 0, 'a 57px chip cannot spare 44px: no button');
  assert.equal(chip('trip').classList.contains('is-holding-more'), false, 'and its title keeps the whole chip');
  assert.equal(tail(calendarHint(host)), HELD, 'the hint says how to reach the menu without the button');
  // The menu is still reached: the menu key, Shift+F10 and a right-click all ask for it.
  key(chip('trip'), 'F10', { shiftKey: true });
  assert.deepEqual(calls(log, 'onMenu').map(([id]) => id), ['trip'], 'Shift+F10 on the chip');
  // A touch tap still selects the chip.
  draw({ selectedId: null });
  assert.equal(chip('trip').getAttribute('aria-current'), null);
  pointer(chip('trip'), 'pointerdown', { pointerType: 'touch' });
  pointer(chip('trip'), 'pointerup', { pointerType: 'touch' });
  chip('trip').click();
  assert.equal(chip('trip').getAttribute('aria-current'), 'true', 'a tap on the chip selects it');
  assert.equal(moreIn(host).length, 0, 'and still draws no button');
});

/*
 * Seen to fail on the calendar of `64a2e1b` (the 72px half passed there; the other did not):
 *
 *   ✖ calendar room: a third is the line: the button stands on a chip three times its width and not on one a pixel narrower
 *     AssertionError [ERR_ASSERTION]: 71px does not
 *     1 !== 0
 */
test('calendar room: a third is the line: the button stands on a chip three times its width and not on one a pixel narrower', (t) => {
  const box = widths(t, { items: ['cloudcanvas-ui-calendar-event'], width: 72, button: 24 });
  const { host, draw, chip } = calendarOf(t, { names: CALENDAR_NAMES });
  draw({ selectedId: 'trip' });
  assert.equal(moreIn(host).length, 1, '72px holds a 24px button');
  assert.equal(chip('trip').classList.contains('is-holding-more'), true);
  assert.equal(tail(calendarHint(host)), USUAL, 'the button is there, and the hint is the usual');
  box.set({ width: 71 });
  draw({ selectedId: 'trip' });
  assert.equal(moreIn(host).length, 0, '71px does not');
  assert.equal(chip('trip').classList.contains('is-holding-more'), false);
});

/*
 * Seen to fail on the calendar of `64a2e1b`, which drew the button whatever the chip's width (so the first assertion, a button on a 57px chip, was the failure):
 *
 *   ✖ calendar room: the chip's width changing, with nothing redrawn, gives the button or takes it back
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *     1 !== 0
 */
test('calendar room: the chip\'s width changing, with nothing redrawn, gives the button or takes it back', (t) => {
  const { fire } = observers(t);
  const box = widths(t, { items: ['cloudcanvas-ui-calendar-event'], width: 57, button: 24 });
  const { host, draw } = calendarOf(t, { names: CALENDAR_NAMES });
  draw({ selectedId: 'trip' });
  assert.equal(moreIn(host).length, 0);
  box.set({ width: 200 });
  fire();
  assert.equal(moreIn(host).length, 1, 'widened, the button comes');
  assert.equal(tail(calendarHint(host)), USUAL);
  box.set({ width: 40 });
  fire();
  assert.equal(moreIn(host).length, 0, 'narrowed, it goes');
  assert.equal(tail(calendarHint(host)), HELD);
});

/*
 * Seen to fail on the timeline of `64a2e1b`, which drew the button beyond any bar:
 *
 *   ✖ timeline room: a bar too narrow for a third-sized button gets none, its title does not make room for it, and the hint says how the menu is reached
 *     AssertionError [ERR_ASSERTION]: a 30px bar cannot spare 44px: no button
 *     1 !== 0
 */
test('timeline room: a bar too narrow for a third-sized button gets none, its title does not make room for it, and the hint says how the menu is reached', (t) => {
  widths(t, { items: ['cloudcanvas-ui-timeline-bar'], width: 30, button: 44 });
  const { host, draw, bar, hint, log } = timelineOf(t, ITEMS, TIMELINE_NAMES);
  draw(ITEMS, { selectedId: 'quick' });
  assert.equal(moreIn(host).length, 0, 'a 30px bar cannot spare 44px: no button');
  assert.equal(bar('quick').closest('.cloudcanvas-ui-timeline-row').classList.contains('is-crowded'), true, 'the row says so, so its title does not step aside for nothing');
  assert.equal(tail(hint()), HELD);
  key(bar('quick'), 'F10', { shiftKey: true });
  assert.deepEqual(calls(log, 'onMenu').map(([id]) => id), ['quick'], 'Shift+F10 on the bar still asks for the menu');
  draw(ITEMS, { selectedId: 'draft' });
  assert.equal(moreIn(host).length, 0, 'every bar is the same width here');
});

/*
 * Seen to fail on the timeline of `64a2e1b` (the 132px half passed there; the other did not):
 *
 *   ✖ timeline room: a bar three times the button's width has it, and a bar a pixel narrower has none
 *     AssertionError [ERR_ASSERTION]: 131px does not
 *     1 !== 0
 */
test('timeline room: a bar three times the button\'s width has it, and a bar a pixel narrower has none', (t) => {
  const box = widths(t, { items: ['cloudcanvas-ui-timeline-bar'], width: 132, button: 44 });
  const { host, draw, bar, hint } = timelineOf(t, ITEMS, TIMELINE_NAMES);
  draw(ITEMS, { selectedId: 'draft' });
  assert.equal(moreIn(host).length, 1, '132px holds a 44px button');
  assert.equal(bar('draft').closest('.cloudcanvas-ui-timeline-row').classList.contains('is-crowded'), false);
  assert.equal(tail(hint()), USUAL);
  box.set({ width: 131 });
  draw(ITEMS, { selectedId: 'draft' });
  assert.equal(moreIn(host).length, 0, '131px does not');
  assert.equal(tail(hint()), HELD);
});

/*
 * GREEN from the start (the kit of `64a2e1b` draws the button on everything); held so the rule, once written, is never applied to a milestone's 14px
 * diamond, which a button a third of its size could never stand on and which loses nothing to it: the button stands beside it.
 * MUTATION, with the rule applied to a milestone too (the `is-point` exemption taken out of `crowdedBy`), observed:
 *
 *   ✖ timeline room: a milestone is no bar: the button stands beside its diamond whatever the diamond's width
 *     AssertionError [ERR_ASSERTION]: the diamond is not a bar to be crowded
 *     0 !== 1
 */
test('timeline room: a milestone is no bar: the button stands beside its diamond whatever the diamond\'s width', (t) => {
  widths(t, { items: ['cloudcanvas-ui-timeline-bar'], width: 14, button: 44 });
  const { host, draw } = timelineOf(t, ITEMS, TIMELINE_NAMES);
  draw(ITEMS, { selectedId: 'ship' });
  assert.equal(moreIn(host).length, 1, 'the diamond is not a bar to be crowded');
});

/*
 * Nothing is measured where nothing is laid out: the kit's own test document, and a host not yet in the page, draw the
 * button as they always did. GREEN from the start, held so a measure of 0 is never read as "too narrow".
 */
test('room: a box with no layout is given the button', (t) => {
  const calendar = calendarOf(t, { names: CALENDAR_NAMES });
  calendar.draw({ selectedId: 'trip' });
  assert.equal(moreIn(calendar.host).length, 1);
  const timeline = timelineOf(t, ITEMS, TIMELINE_NAMES);
  timeline.draw(ITEMS, { selectedId: 'quick' });
  assert.equal(moreIn(timeline.host).length, 1);
});
