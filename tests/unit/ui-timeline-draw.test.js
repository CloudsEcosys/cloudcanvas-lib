/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Drawing a span by keyboard. N on a bar or on a heading that stands for an
 * item puts a date cursor on its row - a one-day band that says its day - on
 * the first day after the bar (a heading's: today). Left and Right move it a day, Up
 * and Down to the row above or below, the headings' empty rows among them.
 * Enter or Space anchors the span there; the arrows then move its other end,
 * either way, the band saying its days; Enter or Space reports
 * `onCreate({groupId, start, end})` - end exclusive, the row's group, as a drag
 * reports it - and Escape, Tab or a press on the sheet cancel. Each step is
 * said, and the line under the toolbar says the keys of the step.
 *
 * Every case was written before the code and run on the timeline as it stood
 * at `f28f269` (its timeline as at `d68b5b5`); each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { dayKey } from '../../ui/index.js';
import { assertSame, key, pointer } from '../helpers/ui.js';
import { ITEMS, timelineOf } from './ui-timeline-fixture.js';

const CALLBACKS = ['onActivate', 'onChange', 'onCreate', 'onDelete'];
const created = (log) => log.filter(([name]) => name === 'onCreate').map(([, span]) => [span.groupId, dayKey(span.start), dayKey(span.end)]);
const others = (log) => log.filter(([name]) => name !== 'onCreate');
const said = (host) => host.querySelector('[role="status"]').textContent.trim();
const band = (host) => host.querySelector('.cloudcanvas-ui-timeline-draft');
const where = (node) => [node.style.getPropertyValue('--timeline-x'), node.style.getPropertyValue('--timeline-w'), node.textContent];
/** The row a band is on: an item's row by its id, a heading's by the group it heads. */
const rowOf = (node) => node.closest('[data-row-id]')?.getAttribute('data-row-id') ?? `heading ${node.parentElement.getAttribute('data-group-id')}`;
const keys = (target, ...names) => names.forEach((name) => key(target, name));

/*
 * Seen to fail on the timeline of `f28f269`, where N did nothing:
 *
 *   ✖ draw: N on a bar puts a one-day cursor on its row on the day after the bar; Left and Right move it a day, saying the day
 *     AssertionError [ERR_ASSERTION]: the bar's line says the key, where the host takes onCreate
 *       actual: 'Enter opens · drag to move · drag an edge to resize · Alt+arrows move a day, Alt+Shift+arrows resize · Delete removes',
 *       expected: / · N draws a span$/,
 */
test('draw: N on a bar puts a one-day cursor on its row on the day after the bar; Left and Right move it a day, saying the day', (t) => {
  const { host, bar, log, hint } = timelineOf(t, undefined, CALLBACKS);
  bar('draft').focus();
  assert.match(hint(), / · N draws a span$/, 'the bar\'s line says the key, where the host takes onCreate');
  assert.equal(key(bar('draft'), 'n').defaultPrevented, true, 'N is the timeline\'s');
  assert.ok(band(host), 'a band on the row');
  assert.equal(band(host).closest('[data-row-id]').getAttribute('data-row-id'), 'draft', 'on the bar\'s own row');
  assert.deepEqual(where(band(host)), ['220px', '20px', 'Oct 2'], 'a day wide, on the first day after the bar (Sep 28 to Oct 1), saying it');
  assert.equal(said(host), 'Drawing a span in The book: Oct 2. Left and Right move the day, Up and Down the row, Enter or Space starts the span, Escape cancels.');
  assert.equal(hint(), 'Left and Right move the day · Up and Down the row · Enter or Space starts the span · Escape cancels');
  keys(bar('draft'), 'ArrowRight', 'ArrowRight');
  assert.deepEqual(where(band(host)), ['260px', '20px', 'Oct 4'], 'two days on');
  assert.equal(said(host), 'Oct 4');
  key(bar('draft'), 'ArrowLeft');
  assert.deepEqual(where(band(host)), ['240px', '20px', 'Oct 3']);
  assertSame(document.activeElement, bar('draft'), 'the focus stays where it was');
  assert.deepEqual([created(log), others(log)], [[], []], 'nothing is made, moved or opened while it is drawn');
});

/*
 * Seen to fail on the timeline of `f28f269`:
 *
 *   ✖ draw: Enter or Space anchors the span; the arrows move its other end either way; Enter reports it for the row's group
 *     TypeError [Error]: Cannot read properties of null (reading 'style')
 *       (no band was drawn: `where(band(host))` after N, Right and Space)
 */
test('draw: Enter or Space anchors the span; the arrows move its other end either way; Enter reports it for the row\'s group', (t) => {
  const { host, bar, log, hint } = timelineOf(t, undefined, CALLBACKS);
  bar('draft').focus();
  keys(bar('draft'), 'n', 'ArrowRight', ' ');
  assert.deepEqual(where(band(host)), ['240px', '20px', 'Oct 3'], 'anchored on the cursor\'s day');
  assert.equal(said(host), 'Starts Oct 3. Left and Right set the end, Enter or Space adds the span, Escape cancels.');
  assert.equal(hint(), 'Left and Right set the end · Enter or Space adds the span · Escape cancels');
  keys(bar('draft'), 'ArrowRight', 'ArrowRight', 'ArrowRight');
  assert.deepEqual(where(band(host)), ['240px', '80px', 'Oct 3 – Oct 6'], 'the other end moves, the band saying its days');
  assert.equal(said(host), 'Oct 3 to Oct 6, 4 days');
  keys(bar('draft'), 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft');
  assert.deepEqual(where(band(host)), ['200px', '60px', 'Oct 1 – Oct 3'], 'past the anchor it runs the other way');
  assert.equal(key(bar('draft'), 'Enter').defaultPrevented, true, 'Enter is the drawing\'s, not the bar\'s');
  assert.deepEqual(created(log), [['book', '2026-10-01', '2026-10-04']], 'reported as a drag reports it: the end is the day after the last');
  assert.equal(band(host), null, 'the band goes with it');
  assert.equal(said(host), 'Span drawn: Oct 1 to Oct 3, The book.');
  assertSame(document.activeElement, bar('draft'), 'and the focus is where it was');
  assert.deepEqual(others(log), [], 'Enter opened nothing');
  keys(bar('draft'), 'n', ' ', ' ');
  assert.deepEqual(created(log).at(-1), ['book', '2026-10-02', '2026-10-03'], 'Space adds it too: a day at least');
});

/*
 * Seen to fail on the timeline of `f28f269`:
 *
 *   ✖ draw: Up and Down move the cursor between the rows, the headings' empty rows among them; a row with no group says none
 *     TypeError [Error]: Cannot read properties of null (reading 'closest')
 *       (no band after N and Up)
 */
test('draw: Up and Down move the cursor between the rows, the headings\' empty rows among them; a row with no group says none', (t) => {
  const { host, bar, log } = timelineOf(t, undefined, CALLBACKS);
  bar('draft').focus();
  keys(bar('draft'), 'n', 'ArrowUp');
  assert.equal(rowOf(band(host)), 'heading book', 'Up is the heading\'s empty row');
  assert.equal(said(host), 'The book: Oct 2', 'the row and the day');
  key(bar('draft'), 'ArrowUp');
  assert.equal(rowOf(band(host)), 'heading book', 'and no further');
  keys(bar('draft'), 'ArrowDown', 'ArrowDown', 'ArrowDown');
  assert.equal(band(host).closest('.cloudcanvas-ui-timeline-group').querySelector('.cloudcanvas-ui-timeline-group-cell').textContent, 'Release',
    'Down past the book\'s rows is the next heading\'s row: a name alone has one too');
  assert.equal(said(host), 'Release: Oct 2');
  keys(bar('draft'), 'Enter', 'Enter');
  assert.deepEqual(created(log), [[null, '2026-10-02', '2026-10-03']], 'a heading that is a name alone stands for no item');
  bar('loose').focus();
  keys(bar('loose'), 'n', 'ArrowDown');
  assert.equal(rowOf(band(host)), 'loose', 'Down from the last row stays on it');
  keys(bar('loose'), ' ', 'ArrowRight', 'Enter');
  assert.deepEqual(created(log).at(-1), [null, '2026-10-08', '2026-10-10'], 'a row with no group says none: after a milestone, the day after it');
  assert.equal(said(host), 'Span drawn: Oct 8 to Oct 9, no group.');
});

/*
 * Seen to fail on the timeline of `f28f269`:
 *
 *   ✖ draw: Escape, Tab and a press on the sheet cancel; while drawing a bar's own keys do nothing; a host with no onCreate keeps N
 *     AssertionError [ERR_ASSERTION]: Delete removes nothing while a span is drawn
 *       actual: [ [ 'onDelete', 'draft' ] ],
 *       expected: [],
 */
test('draw: Escape, Tab and a press on the sheet cancel; while drawing a bar\'s own keys do nothing; a host with no onCreate keeps N', (t) => {
  const { host, bar, log, hint } = timelineOf(t, undefined, CALLBACKS);
  bar('draft').focus();
  keys(bar('draft'), 'n', 'Delete', 'ArrowRight');
  assert.deepEqual(others(log), [], 'Delete removes nothing while a span is drawn');
  assert.deepEqual(where(band(host)).slice(0, 1), ['240px'], 'and the cursor is still in hand');
  assert.equal(key(bar('draft'), 'Escape').defaultPrevented, true, 'Escape cancels');
  assert.equal(band(host), null);
  assert.equal(said(host), 'No span drawn.');
  assert.match(hint(), /^Enter opens/, 'the line says what the bar can do again');
  key(bar('draft'), 'n');
  assert.equal(key(bar('draft'), 'Tab').defaultPrevented, false, 'Tab leaves, as it would');
  assert.equal(band(host), null, 'and cancels');
  key(bar('draft'), 'n');
  pointer(host.querySelector('.cloudcanvas-ui-timeline-sheet'), 'pointerdown', { clientX: 10, clientY: 10 });
  assert.equal(band(host), null, 'a press on the sheet cancels');
  assert.deepEqual(created(log), [], 'none of them made anything');
  const bare = timelineOf(t, undefined, ['onActivate']);
  assert.equal(key(bare.bar('draft'), 'n').defaultPrevented, false, 'a host that takes no onCreate keeps the key');
  assert.equal(band(bare.host), null);
});

/*
 * Seen to fail on the timeline of `f28f269`:
 *
 *   ✖ draw: from a heading the cursor starts on today, and Space on it starts the span without opening the item
 *     AssertionError [ERR_ASSERTION]: Enter opens · N draws a span
 *       actual: 'Enter opens',
 *       expected: 'Enter opens · N draws a span',
 */
test('draw: from a heading the cursor starts on today, and Space on it starts the span without opening the item', (t) => {
  const { host, log, hint } = timelineOf(t, undefined, CALLBACKS);
  const heading = host.querySelector('.cloudcanvas-ui-timeline-group-label');
  heading.focus();
  assert.equal(hint(), 'Enter opens · N draws a span', 'Enter opens · N draws a span');
  key(heading, 'n');
  assert.equal(rowOf(band(host)), 'heading book', 'on the heading\'s own row');
  assert.deepEqual(where(band(host)), ['160px', '20px', 'Sep 29'], 'today');
  assert.equal(key(heading, ' ').defaultPrevented, true);
  assert.equal(key(heading, ' ', { type: 'keyup' }).defaultPrevented, true, 'the Space that anchored is no press of the heading');
  key(heading, 'Enter');
  assert.deepEqual(created(log), [['book', '2026-09-29', '2026-09-30']]);
  assert.deepEqual(others(log), [], 'nothing was opened');
});

/*
 * Seen to fail on the timeline of `f28f269`:
 *
 *   ✖ draw: a host's update while drawing keeps the cursor on its row and its day; a row that goes ends the drawing
 *     TypeError [Error]: Cannot read properties of null (reading 'style')
 */
test('draw: a host\'s update while drawing keeps the cursor on its row and its day; a row that goes ends the drawing', (t) => {
  const { host, bar, draw } = timelineOf(t, undefined, CALLBACKS);
  bar('draft').focus();
  keys(bar('draft'), 'n', 'ArrowRight');
  draw([{ id: 'early', title: 'Early', start: '2026-09-14' }, ...ITEMS]);
  assert.deepEqual(where(band(host)), ['520px', '20px', 'Oct 3'], 'the axis begins two weeks sooner: the cursor stays on its day');
  assert.equal(band(host).closest('[data-row-id]').getAttribute('data-row-id'), 'draft');
  keys(document.activeElement, ' ', 'ArrowRight');
  assert.equal(where(band(host))[2], 'Oct 3 – Oct 4', 'and the keys still draw');
  draw(ITEMS.filter((item) => item.id !== 'draft'));
  assert.equal(band(host), null, 'its row has gone: no band');
  assert.equal(said(host), 'No span drawn.');
});

/*
 * K8, written before the code and run on the timeline of `8f8720e` (the kit as the keyboard span left it): the line with nothing selected
 * said how to drag a span and never the key, where the calendar's says both.
 *
 *   ✖ draw: with nothing selected the line says N too, where the host takes onCreate, as the calendar's does; a host that takes none is not told
 *     AssertionError [ERR_ASSERTION]: the line with nothing selected says the key as well as the drag
 *       actual: 'Select a bar to see what it can do · drag on a row to add one',
 *       expected: 'Select a bar to see what it can do · drag on a row to add one · N draws a span',
 */
test('draw: with nothing selected the line says N too, where the host takes onCreate, as the calendar\'s does; a host that takes none is not told', (t) => {
  const { hint } = timelineOf(t, undefined, CALLBACKS);
  assert.equal(hint(), 'Select a bar to see what it can do · drag on a row to add one · N draws a span', 'the line with nothing selected says the key as well as the drag');
  const bare = timelineOf(t, undefined, ['onActivate']);
  assert.equal(bare.hint(), 'Select a bar to see what it can do', 'a host that takes no onCreate is offered neither');
});

/*
 * K8, written before the code and run on the timeline of `8f8720e`, whose band wrote its dates as its own text, running on past its
 * end over the title a short bar or a milestone draws beside itself:
 *
 *   ✖ draw: the band's words are a tag of their own that the sheet hangs below the band, so a title drawn beside a bar is not written over
 *     AssertionError [ERR_ASSERTION]: the dates are in a tag of their own
 *       actual: null,
 *       expected: true,
 */
test('draw: the band\'s words are a tag of their own that the sheet hangs below the band, so a title drawn beside a bar is not written over', (t) => {
  const { host, bar } = timelineOf(t, undefined, CALLBACKS);
  bar('quick').focus();
  keys(bar('quick'), 'n', 'ArrowRight');
  const tag = band(host).querySelector('.cloudcanvas-ui-timeline-draft-words');
  assert.ok(tag, 'the dates are in a tag of their own');
  assert.deepEqual([tag.textContent, band(host).textContent, band(host).children.length], ['Oct 4', 'Oct 4', 1], 'the band says what it said, in its one tag');
  keys(bar('quick'), ' ', 'ArrowRight');
  assert.equal(band(host).querySelector('.cloudcanvas-ui-timeline-draft-words'), tag, 'the same tag is written again as the span grows');
  assert.equal(tag.textContent, 'Oct 4 – Oct 5');
});

