/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Resizing an event from its bottom edge in the week and day grids: by
 * pointer, snapped to the quarter hour, and by Alt+Shift+Down and Up. A resize
 * is a move whose end changed, so it is reported through the same
 * `onMove(id, {start, end, allDay})`; the month moves an event and never
 * resizes it, and neither does an event that is held, all-day, or spans days.
 *
 * Every case was written before the code and run on the calendar as it stood
 * at `a304bfb`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { key, pointer } from '../helpers/ui.js';
import { calendarOf, calls, movedAs } from './ui-calendar-fixture.js';

const EDGE = '.cloudcanvas-ui-calendar-event-handle';

/*
 * Seen to fail on the calendar of `a304bfb`, which drew no handle:
 *
 *   ✖ handle: a timed event that can be moved has a handle on its bottom edge in the week and the day; the month, a held event, an all-day one and one spanning days have none
 *     AssertionError [ERR_ASSERTION]: the call has a handle
 *       actual: null,
 *       expected: true,
 */
test('handle: a timed event that can be moved has a handle on its bottom edge in the week and the day; the month, a held event, an all-day one and one spanning days have none', (t) => {
  const { chip, draw } = calendarOf(t);
  assert.ok(chip('call').querySelector(EDGE), 'the call has a handle');
  assert.equal(chip('call').querySelector(EDGE).getAttribute('aria-hidden'), 'true', 'for the pointer: the keys say the same');
  assert.ok(chip('open').querySelector(EDGE), 'an event with no end has one too: its hour is drawn');
  assert.equal(chip('fixed').querySelector(EDGE), null, 'a held event has none');
  assert.equal(chip('trip').querySelector(EDGE), null, 'an all-day event has none');
  draw({ view: 'day', date: '2026-09-29' });
  assert.ok(chip('call').querySelector(EDGE), 'the day has them');
  draw({ view: 'month' });
  assert.equal(chip('call').querySelector(EDGE), null, 'the month moves an event and never resizes it');
  draw({ view: 'week', events: [{ id: 'span', title: 'Span', start: '2026-09-29T20:00', end: '2026-09-30T02:00' }] });
  assert.equal(chip('span').querySelector(EDGE), null, 'an event over midnight is in the all-day strip: no edge to drag');
});

/*
 * Seen to fail on the calendar of `a304bfb`:
 *
 *   ✖ resize: a drag of the bottom edge moves the end to the quarter hour under the pointer and reports it through onMove, the start and allDay as they were
 *     TypeError [Error]: Cannot read properties of null (reading 'dispatchEvent')
 */
test('resize: a drag of the bottom edge moves the end to the quarter hour under the pointer and reports it through onMove, the start and allDay as they were', (t) => {
  const { chip, log, body, box, host } = calendarOf(t);
  box();
  pointer(chip('call').querySelector(EDGE), 'pointerdown', { clientX: 330, clientY: 1000 });
  pointer(body, 'pointermove', { clientX: 330, clientY: 1052 });
  assert.equal(chip('call').style.getPropertyValue('--calendar-length'), '90', 'the chip is drawn as long as the end would make it: 9:00 to 10:30');
  assert.deepEqual(calls(log, 'onMove'), [], 'nothing is reported while it is in hand');
  pointer(body, 'pointerup', { clientX: 330, clientY: 1052 });
  assert.deepEqual(calls(log, 'onMove').map(movedAs), [['call', '29@09:00', '29@10:30', false]], 'a resize is a move whose end changed');
  box();
  pointer(chip('call').querySelector(EDGE), 'pointerdown', { clientX: 330, clientY: 1000 });
  pointer(body, 'pointermove', { clientX: 330, clientY: 800 });
  pointer(body, 'pointerup', { clientX: 330, clientY: 800 });
  assert.deepEqual(calls(log, 'onMove').map(movedAs).at(-1), ['call', '29@09:00', '29@09:15', false], 'an end dragged above the start stops a quarter hour after it: an event has a length');
  box();
  pointer(chip('open').querySelector(EDGE), 'pointerdown', { clientX: 330, clientY: 1600 });
  pointer(body, 'pointermove', { clientX: 330, clientY: 1650 });
  pointer(body, 'pointerup', { clientX: 330, clientY: 1650 });
  assert.deepEqual(calls(log, 'onMove').map(movedAs).at(-1), ['open', '29@15:00', '29@16:30', false], 'an event with no end gets one: the hour it was drawn with, and the half hour more');
  assert.deepEqual(calls(log, 'onActivate'), [], 'a drag of an edge opens nothing');
  assert.equal(host.querySelector('.is-grabbed'), null);
});

/*
 * Seen to fail on the calendar of `a304bfb`:
 *
 *   ✖ resize: Escape puts the edge back, a drag that lands where the end was reports nothing, and the end stops at the end of the day
 *     TypeError [Error]: Cannot read properties of null (reading 'dispatchEvent')
 */
test('resize: Escape puts the edge back, a drag that lands where the end was reports nothing, and the end stops at the end of the day', (t) => {
  const { chip, log, body, box } = calendarOf(t);
  box();
  pointer(chip('call').querySelector(EDGE), 'pointerdown', { clientX: 330, clientY: 1000 });
  pointer(body, 'pointermove', { clientX: 330, clientY: 1200 });
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(chip('call').style.getPropertyValue('--calendar-length'), '60', 'Escape put it back');
  box();
  pointer(chip('call').querySelector(EDGE), 'pointerdown', { clientX: 330, clientY: 1000 });
  pointer(body, 'pointermove', { clientX: 330, clientY: 1010 });
  pointer(body, 'pointerup', { clientX: 330, clientY: 1010 });
  assert.deepEqual(calls(log, 'onMove'), [], 'ten pixels land on the same quarter hour');
  box();
  pointer(chip('late').querySelector(EDGE), 'pointerdown', { clientX: 830, clientY: 2350 });
  pointer(body, 'pointermove', { clientX: 830, clientY: 2900 });
  pointer(body, 'pointerup', { clientX: 830, clientY: 2900 });
  assert.deepEqual(calls(log, 'onMove').map(movedAs), [['late', '1@22:00', '2@00:00', false]], 'the end stops at midnight, the grid\'s last line');
});

/*
 * Seen to fail on the calendar of `a304bfb`:
 *
 *   ✖ keys: Alt+Shift+Down and Up lengthen and shorten an event by the snap; held, all-day, month and a host with no onMove are left alone
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *       actual: false,
 *       expected: true,    (Alt+Shift+Down on a chip: nobody took it)
 */
test('keys: Alt+Shift+Down and Up lengthen and shorten an event by the snap; held, all-day, month and a host with no onMove are left alone', (t) => {
  const { chip, log, draw } = calendarOf(t);
  const press = (id, name) => key(chip(id), name, { altKey: true, shiftKey: true });
  assert.equal(press('call', 'ArrowDown').defaultPrevented, true);
  assert.deepEqual(calls(log, 'onMove').map(movedAs), [['call', '29@09:00', '29@10:15', false]], 'Alt+Shift+Down lengthens it by a quarter hour');
  press('call', 'ArrowUp');
  assert.deepEqual(calls(log, 'onMove').map(movedAs).at(-1), ['call', '29@09:00', '29@09:45', false], 'Alt+Shift+Up shortens it');
  draw({ events: [{ id: 'tiny', title: 'Tiny', start: '2026-09-29T09:00', end: '2026-09-29T09:15' }] });
  press('tiny', 'ArrowUp');
  assert.equal(calls(log, 'onMove').length, 2, 'a quarter hour is the least');
  draw({ snapMinutes: 30 });
  press('call', 'ArrowDown');
  assert.deepEqual(calls(log, 'onMove').map(movedAs).at(-1), ['call', '29@09:00', '29@10:30', false], 'by the calendar\'s own snap');
  const before = calls(log, 'onMove').length;
  press('fixed', 'ArrowDown');
  press('trip', 'ArrowDown');
  draw({ view: 'month' });
  press('call', 'ArrowDown');
  assert.equal(calls(log, 'onMove').length, before, 'held, all-day and the month: nothing');
  const bare = calendarOf(t, { names: ['onActivate'] });
  assert.equal(key(bare.chip('call'), 'ArrowDown', { altKey: true, shiftKey: true }).defaultPrevented, false, 'a host that takes no moves keeps its keys');
});
