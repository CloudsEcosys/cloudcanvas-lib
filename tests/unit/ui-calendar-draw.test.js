/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Drawing a range by keyboard, as a drag draws one. N on a day's heading in
 * the week or the day puts a cursor of one slot in that day's column, at the
 * first slot the hour grid shows (8:00 when it shows none); Up and Down move
 * it a slot, Left and Right to the day before or after. Enter or Space anchors
 * the range; Up and Down then move its other end, either way, the band saying
 * its times; Enter or Space reports `onPick({date, start, end})`. In the month
 * N on a day lights it; the arrows move the day as they do, Enter or Space
 * anchors, the arrows light the days between, and Enter or Space reports them
 * as a drag across days does - `allDay: true`, the end the day after the last.
 * Escape, Tab or a press on the grid cancel. Each step is said, and the line
 * under the toolbar says the keys of the step.
 *
 * Every case was written before the code and run on the calendar as it stood
 * at `f28f269` (its timeline and calendar as at `d68b5b5`); each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { dayKey } from '../../ui/index.js';
import { assertSame, key, pointer } from '../helpers/ui.js';
import { calendarOf, calls } from './ui-calendar-fixture.js';

const clock = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const picked = (log) => calls(log, 'onPick').map(([range]) => [range.date, `${dayKey(range.start)}@${clock(range.start)}`,
  range.end ? `${dayKey(range.end)}@${clock(range.end)}` : null, range.allDay ?? null]);
const said = (host) => host.querySelector('[role="status"]').textContent.trim();
const hintOf = (host) => host.querySelector('.cloudcanvas-ui-calendar-hint').textContent;
const draft = (host) => host.querySelector('.cloudcanvas-ui-calendar-draft');
const band = (node) => [node.closest('[data-date]').getAttribute('data-date'), node.style.getPropertyValue('--calendar-top'), node.style.getPropertyValue('--calendar-length'), node.textContent];
const lit = (host) => [...host.querySelectorAll('.cloudcanvas-ui-calendar-cell.is-range')].map((cell) => cell.getAttribute('data-date'));
const keys = (target, ...names) => names.forEach((name) => key(target, name));
const head = (q, day) => q(`.cloudcanvas-ui-calendar-day-head[data-date="${day}"]`);
const dayButton = (q, day) => q(`.cloudcanvas-ui-calendar-day[data-date="${day}"]`);

/*
 * Seen to fail on the calendar of `f28f269`, where N did nothing:
 *
 *   ✖ draw: N on a day's heading puts a one-slot cursor in its column; Up and Down move it a slot, Left and Right a day
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *     + 'Select an event to see what it can do · drag across empty slots to add one'
 *     - 'Select an event to see what it can do · drag across empty slots to add one · N on a day draws one'
 */
test('draw: N on a day\'s heading puts a one-slot cursor in its column; Up and Down move it a slot, Left and Right a day', (t) => {
  const { host, q, log } = calendarOf(t);
  assert.equal(hintOf(host), 'Select an event to see what it can do · drag across empty slots to add one · N on a day draws one');
  head(q, '2026-09-29').focus();
  assert.equal(key(head(q, '2026-09-29'), 'n').defaultPrevented, true, 'N is the calendar\'s');
  assert.deepEqual(band(draft(host)), ['2026-09-29', '480', '15', '8:00 AM – 8:15 AM'], 'a slot at 8:00: the grid shows no hours here');
  assert.equal(said(host), 'Drawing a range: Tuesday, September 29, 2026, 8:00 AM. Up and Down move the time, Left and Right the day, Enter or Space starts the range, Escape cancels.');
  assert.equal(hintOf(host), 'Up and Down move the time · Left and Right the day · Enter or Space starts the range · Escape cancels');
  keys(head(q, '2026-09-29'), 'ArrowDown', 'ArrowDown', 'ArrowUp');
  assert.deepEqual(band(draft(host)), ['2026-09-29', '495', '15', '8:15 AM – 8:30 AM']);
  assert.equal(said(host), '8:15 AM');
  key(head(q, '2026-09-29'), 'ArrowRight');
  assert.deepEqual(band(draft(host)), ['2026-09-30', '495', '15', '8:15 AM – 8:30 AM'], 'the next day, at the same time');
  assertSame(document.activeElement, head(q, '2026-09-30'), 'its heading has the focus');
  assert.deepEqual(calls(log, 'onPick'), [], 'nothing is picked while it is drawn');
});

/*
 * Seen to fail on the calendar of `f28f269`:
 *
 *   ✖ draw: Enter or Space anchors the range; Up and Down move its other end either way; Enter reports it as a drag would
 *     AssertionError [ERR_ASSERTION]: the Space that anchored is no press of the day
 *       actual: false,
 *       expected: true,
 */
test('draw: Enter or Space anchors the range; Up and Down move its other end either way; Enter reports it as a drag would', (t) => {
  const { host, q, log } = calendarOf(t);
  const day = head(q, '2026-09-29');
  day.focus();
  keys(day, 'n', 'ArrowDown', ' ');
  assert.equal(key(day, ' ', { type: 'keyup' }).defaultPrevented, true, 'the Space that anchored is no press of the day');
  assert.equal(said(host), 'Starts 8:15 AM. Up and Down set the end, Enter or Space adds the range, Escape cancels.');
  assert.equal(hintOf(host), 'Up and Down set the end · Enter or Space adds the range · Escape cancels');
  keys(day, 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowRight');
  assert.deepEqual(band(draft(host)), ['2026-09-29', '495', '60', '8:15 AM – 9:15 AM'], 'the end moves; once anchored the day stays');
  assert.equal(said(host), '8:15 AM to 9:15 AM');
  keys(day, 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowUp');
  assert.deepEqual(band(draft(host)), ['2026-09-29', '465', '45', '7:45 AM – 8:30 AM'], 'past the anchor it runs the other way, the anchor\'s slot in');
  assert.equal(key(day, 'Enter').defaultPrevented, true, 'Enter is the drawing\'s, not the day\'s');
  assert.deepEqual(picked(log), [['2026-09-29', '2026-09-29@07:45', '2026-09-29@08:30', null]]);
  assert.equal(draft(host), null);
  assert.equal(said(host), 'Range drawn: Tuesday, September 29, 2026, 7:45 AM to 8:30 AM.');
});

/*
 * Seen to fail on the calendar of `f28f269`:
 *
 *   ✖ draw: in the month N lights the day; the arrows move it; anchored, they light the days between; Enter reports them all day
 *     AssertionError [ERR_ASSERTION]: the day is lit
 *     + []
 *     - [
 *     -   '2026-09-29'
 *     - ]
 */
test('draw: in the month N lights the day; the arrows move it; anchored, they light the days between; Enter reports them all day', (t) => {
  const { host, q, log } = calendarOf(t, { view: 'month' });
  dayButton(q, '2026-09-29').focus();
  key(dayButton(q, '2026-09-29'), 'n');
  assert.deepEqual(lit(host), ['2026-09-29'], 'the day is lit');
  assert.equal(hintOf(host), 'The arrows move the day · Enter or Space starts the range · Escape cancels');
  key(document.activeElement, 'ArrowRight');
  assert.deepEqual(lit(host), ['2026-09-30'], 'the cursor is the day the arrows move to');
  key(document.activeElement, ' ');
  assert.equal(key(document.activeElement, ' ', { type: 'keyup' }).defaultPrevented, true);
  key(document.activeElement, 'ArrowDown');
  assert.deepEqual(lit(host), ['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'], 'a week on: the days between');
  assert.equal(said(host), 'Wednesday, September 30, 2026 to Wednesday, October 7, 2026');
  key(document.activeElement, 'Enter');
  assert.deepEqual(picked(log), [['2026-09-30', '2026-09-30@00:00', '2026-10-08@00:00', true]], 'as a drag across days reports it');
  assert.deepEqual(lit(host), [], 'and nothing stays lit');
});

/*
 * Seen to fail on the calendar of `f28f269`:
 *
 *   ✖ draw: Escape, Tab and a press on the grid cancel; an update keeps the cursor; a host with no onPick keeps N
 *     TypeError [Error]: Cannot read properties of null (reading 'closest')
 *       (no band after N and Down: `band(draft(host))`)
 */
test('draw: Escape, Tab and a press on the grid cancel; an update keeps the cursor; a host with no onPick keeps N', (t) => {
  const { host, q, log, draw, body } = calendarOf(t);
  head(q, '2026-09-29').focus();
  keys(head(q, '2026-09-29'), 'n', 'ArrowDown');
  draw();
  assert.deepEqual(band(draft(host)).slice(0, 2), ['2026-09-29', '495'], 'a host\'s update keeps the cursor where it was');
  assert.equal(key(document.activeElement, 'Escape').defaultPrevented, true, 'Escape cancels');
  assert.equal(draft(host), null);
  assert.equal(said(host), 'No range drawn.');
  key(head(q, '2026-09-29'), 'n');
  assert.equal(key(head(q, '2026-09-29'), 'Tab').defaultPrevented, false, 'Tab leaves');
  assert.equal(draft(host), null, 'and cancels');
  key(head(q, '2026-09-29'), 'n');
  pointer(body, 'pointerdown', { clientX: 5, clientY: 5 });
  assert.equal(draft(host), null, 'a press on the grid cancels');
  assert.deepEqual(calls(log, 'onPick'), [], 'none of them picked anything');
  const bare = calendarOf(t, { names: ['onMove'] });
  assert.equal(key(head(bare.q, '2026-09-29'), 'n').defaultPrevented, false, 'a host that takes no onPick keeps the key');
});
