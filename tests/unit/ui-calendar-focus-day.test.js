/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * `focusDay(date)`: a host gives the focus to a day - the day a keyboard range
 * began on, after Escape dropped it - and the calendar takes that day as its
 * own: the one tab stop, and the day a redraw gives the focus back to. A day
 * not on show is navigated to first, and reported as any navigation is. No
 * key is pressed for it: the calendar is told, not tricked.
 *
 * Every case was written before the code and run on the calendar as it stood
 * at `b954700`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { press } from '../helpers/ui.js';
import { calendarOf, calls } from './ui-calendar-fixture.js';

const DAY = '.cloudcanvas-ui-calendar-day';
const dayOf = (node) => node?.getAttribute?.('data-date') ?? null;
const stops = (host) => [...host.querySelectorAll(DAY)].filter((node) => node.getAttribute('tabindex') === '0').map(dayOf);

/*
 * Seen to fail on the calendar of `b954700`, which had no way to be told a day:
 *
 *   ✖ calendar focusDay: the day is focused, is the one tab stop, and keeps the focus when the host draws again
 *     TypeError [Error]: control.focusDay is not a function
 */
test('calendar focusDay: the day is focused, is the one tab stop, and keeps the focus when the host draws again', (t) => {
  const { host, control, draw } = calendarOf(t, { view: 'month' });
  const start = host.querySelector(`${DAY}[data-date="2026-09-29"]`);
  start.focus();
  press(start, 'ArrowRight');
  press(document.activeElement, 'ArrowRight');
  assert.equal(dayOf(document.activeElement), '2026-10-01', 'the arrows took the focus two days on');
  assert.equal(control.focusDay('2026-09-29'), true);
  assert.deepEqual([dayOf(document.activeElement), stops(host)], ['2026-09-29', ['2026-09-29']]);
  draw();
  assert.equal(dayOf(document.activeElement), '2026-09-29', 'a redraw gives the focus back to the day the host gave it to');
});

/*
 * Seen to fail on the calendar of `b954700`:
 *
 *   ✖ calendar focusDay: a day not on show is navigated to first and reported; nothing for what is not a date
 *     TypeError [Error]: control.focusDay is not a function
 */
test('calendar focusDay: a day not on show is navigated to first and reported; nothing for what is not a date', (t) => {
  const { host, control, log } = calendarOf(t, { view: 'month', names: ['onNavigate'] });
  assert.equal(control.focusDay('2026-11-16'), true);
  assert.equal(host.querySelector('.cloudcanvas-ui-calendar-title').textContent, 'November 2026');
  assert.equal(dayOf(document.activeElement), '2026-11-16');
  assert.deepEqual(calls(log, 'onNavigate').map(([place]) => [place.view, place.date]), [['month', '2026-11-16']]);
  assert.equal(control.focusDay('not a day'), false);
  assert.equal(dayOf(document.activeElement), '2026-11-16', 'and the focus stays where it was');
});
