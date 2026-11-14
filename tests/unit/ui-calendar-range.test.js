/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Making a range by dragging across empty slots - in the week and day, down a
 * column; in the month and the all-day strip, across days. A band follows the
 * pointer and the release reports `onPick({date, start, end})`: the slots
 * from the one pressed to the one let go, a snap each; across days, the days
 * as an all-day range (`allDay: true`, the end the day after the last). A
 * click is still `onPick` with a start alone. Escape drops the band.
 *
 * Every case was written before the code and run on the calendar as it stood
 * at `a304bfb`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { dayKey } from '../../ui/index.js';
import { pointer, stubHitTest } from '../helpers/ui.js';
import { calendarOf, calls } from './ui-calendar-fixture.js';

const clock = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const picked = ([range]) => [range.date, `${dayKey(range.start)}@${clock(range.start)}`, range.end ? `${dayKey(range.end)}@${clock(range.end)}` : null, range.allDay ?? null];

/*
 * Seen to fail on the calendar of `a304bfb`, where a drag across empty slots was nothing:
 *
 *   ✖ range: a drag down a column draws a band of the slots between the press and the pointer and reports them on release
 *     AssertionError [ERR_ASSERTION]: a band follows the pointer
 *       actual: null,
 *       expected: true,
 */
test('range: a drag down a column draws a band of the slots between the press and the pointer and reports them on release', (t) => {
  const { column, box, body, log } = calendarOf(t);
  box();
  const day = column('2026-09-29');
  pointer(day, 'pointerdown', { clientX: 330, clientY: 910 });
  pointer(body, 'pointermove', { clientX: 330, clientY: 1040 });
  const band = day.querySelector('.cloudcanvas-ui-calendar-draft');
  assert.ok(band, 'a band follows the pointer');
  assert.deepEqual([band.style.getPropertyValue('--calendar-top'), band.style.getPropertyValue('--calendar-length')], ['540', '90'], 'from the slot pressed, 9:00, to the end of the one under the pointer, 10:30');
  assert.equal(band.textContent, '9:00 AM – 10:30 AM', 'and says the times it covers');
  assert.deepEqual(calls(log, 'onPick'), [], 'nothing is made while it is drawn');
  pointer(body, 'pointerup', { clientX: 330, clientY: 1040 });
  assert.deepEqual(calls(log, 'onPick').map(picked), [['2026-09-29', '2026-09-29@09:00', '2026-09-29@10:30', null]], 'the slots between, both ends in');
  assert.equal(day.querySelector('.cloudcanvas-ui-calendar-draft'), null, 'the band goes with the drag');
  assert.equal(calls(log, 'onPick').length, 1, 'and the click that ends a drag is no pick of its own');
});

/*
 * Seen to fail on the calendar of `a304bfb`:
 *
 *   ✖ range: it runs either way from the press and is a slot at least; the snap is the calendar's
 *     AssertionError [ERR_ASSERTION]: upwards from the press
 *       actual: [],
 *       expected: [ [ '2026-09-29', '2026-09-29@09:00', '2026-09-29@10:30', null ] ],
 */
test('range: it runs either way from the press and is a slot at least; the snap is the calendar\'s', (t) => {
  const { column, box, body, log, draw } = calendarOf(t);
  const sweep = (from, to) => {
    box();
    pointer(column('2026-09-29'), 'pointerdown', { clientX: 330, clientY: from });
    pointer(body, 'pointermove', { clientX: 330, clientY: to });
    pointer(body, 'pointerup', { clientX: 330, clientY: to });
  };
  sweep(1040, 910);
  assert.deepEqual(calls(log, 'onPick').map(picked), [['2026-09-29', '2026-09-29@09:00', '2026-09-29@10:30', null]], 'upwards from the press');
  sweep(910, 915);
  assert.deepEqual(calls(log, 'onPick').map(picked).at(-1), ['2026-09-29', '2026-09-29@09:00', '2026-09-29@09:15', null], 'a few pixels are one slot');
  draw({ snapMinutes: 30 });
  sweep(910, 930);
  assert.deepEqual(calls(log, 'onPick').map(picked).at(-1), ['2026-09-29', '2026-09-29@09:00', '2026-09-29@09:30', null], 'a slot is the snap');
  sweep(2390, 2600);
  assert.deepEqual(calls(log, 'onPick').map(picked).at(-1), ['2026-09-29', '2026-09-29@23:30', '2026-09-30@00:00', null], 'the last slot ends at midnight');
});

/*
 * Seen to fail on the calendar of `a304bfb`:
 *
 *   ✖ range: Escape drops the band; a press on an event moves it, not a range; a host with no onPick gets no band
 *     AssertionError [ERR_ASSERTION]: a band is in hand
 *       actual: null,
 *       expected: true,
 */
test('range: Escape drops the band; a press on an event moves it, not a range; a host with no onPick gets no band', (t) => {
  const { column, chip, box, body, log, q } = calendarOf(t);
  box();
  pointer(column('2026-09-29'), 'pointerdown', { clientX: 330, clientY: 910 });
  pointer(body, 'pointermove', { clientX: 330, clientY: 1040 });
  assert.ok(q('.cloudcanvas-ui-calendar-draft'), 'a band is in hand');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(q('.cloudcanvas-ui-calendar-draft'), null, 'Escape drops the band');
  assert.deepEqual(calls(log, 'onPick'), []);
  box();
  stubHitTest(t, () => column('2026-09-29'));
  pointer(chip('call'), 'pointerdown', { clientX: 330, clientY: 930 });
  pointer(body, 'pointermove', { clientX: 330, clientY: 1000 });
  assert.equal(q('.cloudcanvas-ui-calendar-draft'), null, 'a press on an event moves it');
  pointer(body, 'pointerup', { clientX: 330, clientY: 1000 });
  const bare = calendarOf(t, { names: ['onMove'] });
  bare.box();
  pointer(bare.column('2026-09-29'), 'pointerdown', { clientX: 330, clientY: 910 });
  pointer(bare.body, 'pointermove', { clientX: 330, clientY: 1040 });
  assert.equal(bare.q('.cloudcanvas-ui-calendar-draft'), null, 'a host that took no onPick gets none');
});

/*
 * Seen to fail on the calendar of `a304bfb`:
 *
 *   ✖ range: across the days of the month, or of the all-day strip, it is an all-day range, the days lit while it is drawn
 *     AssertionError [ERR_ASSERTION]: the days between are lit
 *       actual: [],
 *       expected: [ '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02' ],
 */
test('range: across the days of the month, or of the all-day strip, it is an all-day range, the days lit while it is drawn', (t) => {
  const { host, q, body, log, draw } = calendarOf(t, { view: 'month' });
  const lit = () => [...host.querySelectorAll('.is-range')].map((node) => node.getAttribute('data-date'));
  const cell = (key) => q(`.cloudcanvas-ui-calendar-cell[data-date="${key}"]`);
  let under = null;
  stubHitTest(t, () => under);
  pointer(cell('2026-09-29'), 'pointerdown', { clientX: 100, clientY: 100 });
  under = cell('2026-10-02');
  pointer(body, 'pointermove', { clientX: 400, clientY: 100 });
  assert.deepEqual(lit(), ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'], 'the days between are lit');
  pointer(body, 'pointerup', { clientX: 400, clientY: 100 });
  assert.deepEqual(calls(log, 'onPick').map(picked), [['2026-09-29', '2026-09-29@00:00', '2026-10-03@00:00', true]], 'an all-day range: the end is the day after the last');
  assert.deepEqual(lit(), [], 'the light goes with the drag');
  under = cell('2026-09-29');
  pointer(cell('2026-10-02'), 'pointerdown', { clientX: 400, clientY: 100 });
  pointer(body, 'pointermove', { clientX: 100, clientY: 100 });
  pointer(body, 'pointerup', { clientX: 100, clientY: 100 });
  assert.equal(picked(calls(log, 'onPick').at(-1))[0], '2026-09-29', 'backwards, the range still begins on its first day');
  draw({ view: 'week' });
  const strip = (key) => q(`.cloudcanvas-ui-calendar-allday-cell[data-date="${key}"]`);
  under = strip('2026-09-30');
  pointer(strip('2026-09-29'), 'pointerdown', { clientX: 100, clientY: 20 });
  pointer(body, 'pointermove', { clientX: 200, clientY: 20 });
  pointer(body, 'pointerup', { clientX: 200, clientY: 20 });
  assert.deepEqual(calls(log, 'onPick').map(picked).at(-1), ['2026-09-29', '2026-09-29@00:00', '2026-10-01@00:00', true], 'the all-day strip is the same');
});

/*
 * Seen to fail on the calendar of `a304bfb`:
 *
 *   ✖ range: a click is still a pick with a start alone; an update while the band is drawn leaves it
 *     AssertionError [ERR_ASSERTION]: a host's update does not take the band from under the pointer
 *       actual: null,
 *       expected: true,
 */
test('range: a click is still a pick with a start alone; an update while the band is drawn leaves it', (t) => {
  const { column, box, body, draw, log } = calendarOf(t);
  box();
  const day = column('2026-09-29');
  day.dispatchEvent(new MouseEvent('click', { bubbles: true, clientY: 1400 }));
  assert.deepEqual(calls(log, 'onPick').map(([range]) => [range.date, range.start.getHours(), range.end]), [['2026-09-29', 14, undefined]], 'a click is one slot, as before');
  pointer(day, 'pointerdown', { clientX: 330, clientY: 910 });
  pointer(body, 'pointermove', { clientX: 330, clientY: 1040 });
  draw({ events: [] });
  assert.ok(day.querySelector('.cloudcanvas-ui-calendar-draft'), 'a host\'s update does not take the band from under the pointer');
  pointer(body, 'pointerup', { clientX: 330, clientY: 1040 });
  assert.equal(calls(log, 'onPick').length, 2);
});
