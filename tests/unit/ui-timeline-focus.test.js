/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * `focusId`, as the graph's: when the model's `focusId` changes to an item,
 * its bar is brought into view ONCE - scrolled to the middle of the sheet on
 * an axis it is off, left alone on one it is on - and it takes the tab stop;
 * the same `focusId` again scrolls nothing, so the reader's own scrolling is
 * never fought. An item in a folded group brings its heading's row; a
 * `focusId` given while a drag is in hand is taken when the drag ends.
 *
 * Every case was written before the code and run on the timeline as it stood
 * at `f28f269` (its timeline and calendar as at `d68b5b5`); each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { pointer, stubBox } from '../helpers/ui.js';
import { ITEMS, timelineOf } from './ui-timeline-fixture.js';

const FAR = { id: 'far', title: 'Far', start: '2026-11-20', end: '2026-11-23' };
const WIDTH = 700;
const GUTTER = 160;

/** A timeline whose sheet is 700px wide and 120px tall, drawn over `items`; the track's days on screen, in px of the axis. */
function sheetOf(t, items = [...ITEMS, FAR], names = ['onActivate', 'onCreate', 'onToggleGroup']) {
  const fixture = timelineOf(t, [], names);
  const sheet = fixture.host.querySelector('.cloudcanvas-ui-timeline-sheet');
  Object.defineProperty(sheet, 'clientWidth', { configurable: true, value: WIDTH });
  Object.defineProperty(sheet, 'clientHeight', { configurable: true, value: 120 });
  stubBox(sheet, { left: 0, top: 0, width: WIDTH, height: 120 });
  fixture.draw(items);
  const shown = () => [sheet.scrollLeft, sheet.scrollLeft + WIDTH - GUTTER];
  const x = (id) => Number.parseFloat(fixture.bar(id).style.getPropertyValue('--timeline-x'));
  return { ...fixture, sheet, shown, x, items };
}

/*
 * Seen to fail on the timeline of `f28f269`, which had no focusId:
 *
 *   ✖ focus: a focusId that changes brings its bar into view once, and gives it the tab stop
 *     AssertionError [ERR_ASSERTION]: the far bar is on screen: 660 to 1200 shows 1840.8333333333335
 *       actual: false,
 *       expected: true,
 */
test('focus: a focusId that changes brings its bar into view once, and gives it the tab stop', (t) => {
  const { draw, sheet, shown, x, bar, items } = sheetOf(t);
  const home = sheet.scrollLeft;
  draw(items, { focusId: 'far' });
  const [from, to] = shown();
  assert.ok(x('far') >= from && x('far') + 60 <= to, `the far bar is on screen: ${from} to ${to} shows ${x('far')}`);
  assert.ok(Math.abs((from + to) / 2 - (x('far') + 30)) <= 1, 'in the middle of the sheet: it was off that axis');
  assert.equal(bar('far').getAttribute('tabindex'), '0', 'and it takes the tab stop');
  sheet.scrollLeft = home;
  draw(items, { focusId: 'far' });
  assert.equal(sheet.scrollLeft, home, 'the same focusId again leaves the reader\'s scroll alone');
  draw(items, { focusId: 'draft' });
  assert.equal(sheet.scrollLeft, home, 'a bar on screen is not scrolled to');
  draw(items, { focusId: null });
  draw(items, { focusId: 'far' });
  assert.notEqual(sheet.scrollLeft, home, 'given again after another, it is brought again');
});

/*
 * Seen to fail on the timeline of `f28f269`:
 *
 *   ✖ focus: a row below the sheet's height is scrolled to; an item in a folded group brings its heading
 *     AssertionError [ERR_ASSERTION]: the row is brought up
 *       actual: 0,
 *       expected: 260,
 */
/** Give the rows `pick(node)` names a box for the rest of the test, whichever redraw made them: the test DOM lays out nothing. */
function rowBoxes(t, pick) {
  const original = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function box() {
    const top = pick(this);
    return top === null ? original.call(this) : { left: 0, top, width: WIDTH, height: 40, right: WIDTH, bottom: top + 40, x: 0, y: top };
  };
  t.after(() => { HTMLElement.prototype.getBoundingClientRect = original; });
}

test('focus: a row below the sheet\'s height is scrolled to; an item in a folded group brings its heading', (t) => {
  const { draw, sheet, items } = sheetOf(t);
  rowBoxes(t, (node) => (node.getAttribute('data-row-id') === 'loose' ? 300 : node.classList.contains('cloudcanvas-ui-timeline-group') ? 200 : null));
  draw(items, { focusId: 'loose' });
  // The sheet is 120px tall; the row's middle, 320px down, is put at its middle, 60px.
  assert.equal(sheet.scrollTop, 260, 'the row is brought up');
  const book = items.map((item) => (item.group?.id === 'book' ? { ...item, group: { ...item.group, collapsed: true } } : item));
  sheet.scrollTop = 0;
  draw(book, { focusId: 'quick' });
  assert.equal(sheet.scrollTop, 160, 'its heading\'s row, which stands for it while it is folded');
});

/*
 * Seen to fail on the timeline of `f28f269`:
 *
 *   ✖ focus: a focusId given while a span is dragged is taken when the drag ends
 *     AssertionError [ERR_ASSERTION]: taken when the drag ends
 *       actual: false,
 *       expected: true,
 */
test('focus: a focusId given while a span is dragged is taken when the drag ends', (t) => {
  const { host, draw, sheet, shown, x, items } = sheetOf(t);
  const track = stubBox(host.querySelector('[data-row-id="draft"] .cloudcanvas-ui-timeline-track'), { left: 0, top: 0, width: 4000, height: 36 });
  const home = sheet.scrollLeft;
  pointer(track, 'pointerdown', { clientX: 700, clientY: 10 });
  pointer(sheet, 'pointermove', { clientX: 760, clientY: 12 });
  draw(items, { focusId: 'far' });
  assert.equal(sheet.scrollLeft, home, 'not while the band is in hand');
  pointer(sheet, 'pointerup', { clientX: 760, clientY: 12 });
  const [from, to] = shown();
  assert.ok(x('far') >= from && x('far') <= to, 'taken when the drag ends');
});

/*
 * Found in a browser, in Momentum: a bar added from the timeline is handed as `focusId` in the update that still lacks it (the
 * save has not been read back), and again, now drawn, in the next. The first update took the ask and dropped it with no bar to
 * bring, so the second was "the same focusId again" and scrolled nothing: the browser's own focus() scrolled it in, flush against
 * the sheet's right edge. An ask for an item that is not drawn waits for it. Seen to fail on the timeline of `98d52d1`:
 *
 *   ✖ focus: a focusId whose item is not drawn yet is kept until it is, and then brought to the middle once
 *     AssertionError [ERR_ASSERTION]: drawn in a later update, the far bar is brought to the middle: 660 to 1200 shows 1840.8333333333335
 */
test('focus: a focusId whose item is not drawn yet is kept until it is, and then brought to the middle once', (t) => {
  const { draw, sheet, shown, x } = sheetOf(t);
  const home = sheet.scrollLeft;
  draw(ITEMS, { focusId: 'far' });
  assert.equal(sheet.scrollLeft, home, 'nothing to bring yet');
  draw([...ITEMS, FAR], { focusId: 'far' });
  const [from, to] = shown();
  assert.ok(Math.abs((from + to) / 2 - (x('far') + 30)) <= 1, `drawn in a later update, the far bar is brought to the middle: ${from} to ${to} shows ${x('far')}`);
  const there = sheet.scrollLeft;
  sheet.scrollLeft = home;
  draw([...ITEMS, FAR], { focusId: 'far' });
  assert.equal(sheet.scrollLeft, home, 'and once: the reader\'s scrolling after it is not fought');
  assert.notEqual(there, home);
});

/*
 * Found in a browser: a bar brought into view stood flush against the sheet's right edge, its title and link handle cut off by it. One on
 * screen but within its own width (never less than the link handle's 44px, never more than a quarter of the room) of an edge is
 * brought to the middle as one off screen is; one clear of both edges is left where it is. Seen to fail on the timeline of `98d52d1`:
 *
 *   ✖ focus: a bar flush against an edge of the sheet is brought to the middle, one clear of the edges is left
 *     AssertionError [ERR_ASSERTION]: flush right: it is brought to the middle: 1360.8333333333335 to 1900.8333333333335 shows 1840.8333333333335
 */
test('focus: a bar flush against an edge of the sheet is brought to the middle, one clear of the edges is left', (t) => {
  const { draw, sheet, shown, x, items } = sheetOf(t);
  draw(items, { focusId: 'far' });
  sheet.scrollLeft = x('far') + 60 - (WIDTH - GUTTER);
  draw(items, { focusId: null });
  const [flushFrom, flushTo] = shown();
  assert.equal(flushTo, x('far') + 60, 'the bar ends where the sheet ends');
  draw(items, { focusId: 'far' });
  const [from, to] = shown();
  assert.ok(Math.abs((from + to) / 2 - (x('far') + 30)) <= 1, `flush right: it is brought to the middle: ${flushFrom} to ${flushTo} shows ${x('far')}`);
  sheet.scrollLeft = x('far') - 100;
  draw(items, { focusId: null });
  const clear = sheet.scrollLeft;
  draw(items, { focusId: 'far' });
  assert.equal(sheet.scrollLeft, clear, 'a bar 100px from the edge is where the reader has it');
});
