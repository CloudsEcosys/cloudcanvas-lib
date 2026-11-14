/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A move keeps what an event is: a timed event dropped anywhere stays timed,
 * at the time of day it had unless it is dropped on a time, and keeps its
 * length; an all-day event stays all-day wherever it lands, and an event with
 * no end has none after. What `onMove` reports says so in `allDay` and `end`.
 *
 * Held on the calendar of `a304bfb` already - a move always carried the
 * event's own `allDay` - and written to keep it so beside the resize, which
 * reports through the same callback. Run on `a304bfb`, the first three pass;
 * the last, which needs the resize, reads
 *
 *   ✖ move: a resize reports the same shape as a move, and a move that follows it starts from the event as the host now holds it
 *     TypeError [Error]: calls is not iterable (cannot read property Symbol(Symbol.iterator))
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { key, pointer, stubHitTest } from '../helpers/ui.js';
import { calendarOf, calls, movedAs } from './ui-calendar-fixture.js';

test('move: in the month a timed event keeps its time and its length, and an all-day one stays all-day', (t) => {
  const { q, chip, body, log } = calendarOf(t, { view: 'month' });
  const cell = (day) => q(`.cloudcanvas-ui-calendar-cell[data-date="${day}"]`);
  stubHitTest(t, () => cell('2026-10-02'));
  pointer(chip('call'), 'pointerdown', { clientX: 100, clientY: 100 });
  pointer(body, 'pointermove', { clientX: 300, clientY: 100 });
  pointer(body, 'pointerup', { clientX: 300, clientY: 100 });
  assert.deepEqual(calls(log, 'onMove').map(movedAs), [['call', '2@09:00', '2@10:00', false]], 'two days on, at nine, for an hour, timed');
  pointer(chip('trip'), 'pointerdown', { clientX: 100, clientY: 100 });
  pointer(body, 'pointermove', { clientX: 300, clientY: 100 });
  pointer(body, 'pointerup', { clientX: 300, clientY: 100 });
  assert.deepEqual(calls(log, 'onMove').map(movedAs).at(-1), ['trip', '2@00:00', null, true], 'all-day, with no end as it had none');
});

test('move: in the week an all-day event dropped on the hour grid stays all-day, and a timed one dropped in the all-day strip stays timed', (t) => {
  const { chip, column, box, q, body, log } = calendarOf(t);
  box();
  stubHitTest(t, () => column('2026-10-01'));
  pointer(chip('trip'), 'pointerdown', { clientX: 130, clientY: 30 });
  pointer(body, 'pointermove', { clientX: 330, clientY: 1200 });
  pointer(body, 'pointerup', { clientX: 330, clientY: 1200 });
  assert.deepEqual(calls(log, 'onMove').map(movedAs), [['trip', '1@00:00', null, true]], 'a day on, not onto a time: it has none');
  stubHitTest(t, () => q('.cloudcanvas-ui-calendar-allday-cell[data-date="2026-10-02"]'));
  pointer(chip('call'), 'pointerdown', { clientX: 30, clientY: 930 });
  pointer(body, 'pointermove', { clientX: 530, clientY: 20 });
  pointer(body, 'pointerup', { clientX: 530, clientY: 20 });
  assert.deepEqual(calls(log, 'onMove').map(movedAs).at(-1), ['call', '2@09:00', '2@10:00', false], 'three days on, still at nine: dropped on a day, not on a time');
});

test('move: an event with no end has none after a move, and the keyboard moves an all-day event by days only', (t) => {
  const { chip, log } = calendarOf(t);
  key(chip('open'), ' ');
  key(document.activeElement, 'ArrowRight');
  key(document.activeElement, 'Enter');
  assert.deepEqual(calls(log, 'onMove').map(movedAs), [['open', '30@15:00', null, false]], 'a day on, no end, timed');
  key(chip('trip'), ' ');
  key(document.activeElement, 'ArrowDown');
  key(document.activeElement, 'ArrowRight');
  key(document.activeElement, 'Enter');
  assert.deepEqual(calls(log, 'onMove').map(movedAs).at(-1), ['trip', '1@00:00', null, true], 'Down moves an all-day event in the week by nothing: only Right moved it');
});

test('move: a resize reports the same shape as a move, and a move that follows it starts from the event as the host now holds it', (t) => {
  const { chip, draw, log } = calendarOf(t);
  key(chip('call'), 'ArrowDown', { altKey: true, shiftKey: true });
  const [, resized] = calls(log, 'onMove')[0];
  assert.deepEqual(Object.keys(resized).sort(), ['allDay', 'end', 'start'], 'start, end and allDay, as a move');
  draw({ events: [{ id: 'call', title: 'Call', start: resized.start, end: resized.end }] });
  key(chip('call'), ' ');
  key(document.activeElement, 'ArrowRight');
  key(document.activeElement, 'Enter');
  assert.deepEqual(calls(log, 'onMove').map(movedAs).at(-1), ['call', '30@09:00', '30@10:15', false], 'the new length is kept: a quarter hour more');
});
