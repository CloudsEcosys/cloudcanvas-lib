/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Calendar arithmetic (local, DST-safe) and the calendar control: month,
 * week and day grids, navigation, picking, and rescheduling by keyboard and
 * by pointer.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays, createCalendar, dayKey, daysBetween, fromDayKey, monthGrid, shiftAnchor, startOfWeek, toDate, viewDays
} from '../../ui/index.js';
import { layoutLanes, normalizeEvents } from '../../ui/calendar/model.js';
import { assertSame, focusCalls, key, mount, pointer, stubBox, stubHitTest } from '../helpers/ui.js';

test('dates: keys round-trip, invalid keys are refused, day steps keep the wall clock', () => {
  assert.equal(dayKey(new Date(2026, 8, 29, 23, 59)), '2026-09-29');
  assert.equal(fromDayKey('2026-02-30'), null);
  assert.equal(fromDayKey('nope'), null);
  assert.equal(dayKey(fromDayKey('2026-03-08')), '2026-03-08');
  const nine = new Date(2026, 2, 7, 9, 0);
  const next = addDays(nine, 1);
  assert.equal(next.getHours(), 9, 'a day later is 09:00 even across a DST change');
  assert.equal(daysBetween(nine, addDays(nine, 40)), 40);
  assert.equal(toDate('2026-09-29').getHours(), 0, 'a bare date is local midnight');
  assert.equal(toDate('garbage'), null);
  assert.equal(toDate(new Date(NaN)), null);
});

test('dates: grids start on the week start; views shift by their period', () => {
  const grid = monthGrid(new Date(2026, 8, 15), 1);
  assert.equal(grid.length, 42);
  assert.equal(grid[0].getDay(), 1);
  assert.equal(dayKey(grid[0]), '2026-08-31');
  assert.equal(startOfWeek(new Date(2026, 8, 29), 0).getDay(), 0);
  assert.equal(viewDays('week', new Date(2026, 8, 29)).length, 7);
  assert.equal(viewDays('day', new Date(2026, 8, 29, 15)).length, 1);
  assert.equal(dayKey(shiftAnchor('month', new Date(2026, 0, 31), 1)), '2026-02-01');
  assert.equal(dayKey(shiftAnchor('week', new Date(2026, 8, 29), -1)), '2026-09-22');
});

test('model: bad events are caller errors; overlapping events take side-by-side lanes', () => {
  assert.throws(() => normalizeEvents([{ id: 'a' }]), /no valid start/);
  assert.throws(() => normalizeEvents([{ id: 'a', start: '2026-09-29' }, { id: 'a', start: '2026-09-29' }]), /Duplicate/);
  assert.throws(() => normalizeEvents([{ id: 'a', start: '2026-09-29', end: 'soon' }]), /invalid end/);
  const events = normalizeEvents([
    { id: 'a', start: '2026-09-29T09:00', end: '2026-09-29T10:30' },
    { id: 'b', start: '2026-09-29T10:00' },
    { id: 'c', start: '2026-09-29T11:00' }
  ]);
  const { placed, lanes } = layoutLanes(events);
  assert.equal(lanes, 2);
  assert.deepEqual(placed.map((slot) => slot.lane), [0, 1, 0]);
});

const EVENTS = [
  { id: 'call', title: 'Call', start: '2026-09-29T09:00', end: '2026-09-29T10:00' },
  { id: 'trip', title: 'Trip', start: '2026-09-30', allDay: true },
  { id: 'fixed', title: 'Fixed', start: '2026-09-29T13:00', movable: false },
  ...['4', '5', '6'].map((n) => ({ id: `x${n}`, title: `Extra ${n}`, start: `2026-09-29T1${n}:30` }))
];

function calendar(t, callbacks = {}) {
  const host = mount(t);
  const log = { navigate: [], pick: [], activate: [], move: [] };
  const control = createCalendar(host, {
    onNavigate: (value) => log.navigate.push(value), onPick: (value) => log.pick.push(value),
    onActivate: (id) => log.activate.push(id), onMove: (id, times) => log.move.push([id, times]), ...callbacks
  });
  control.update({ view: 'month', date: '2026-09-29', now: '2026-09-29T08:00', events: EVENTS, locale: 'en-US' });
  const q = (selector) => host.querySelector(selector);
  return { host, control, log, q };
}

test('month: six weeks of cells, today marked, three chips then "+N", one tab stop on the focused day', (t) => {
  const { host, q } = calendar(t);
  assert.equal(q('.cloudcanvas-ui-calendar-title').textContent, 'September 2026');
  assert.equal(host.querySelectorAll('[role="gridcell"]').length, 42);
  const today = q('[role="gridcell"][data-date="2026-09-29"]');
  assert.ok(today.classList.contains('is-today'));
  assert.equal(today.querySelector('.cloudcanvas-ui-calendar-day').getAttribute('aria-current'), 'date');
  assert.equal(today.querySelectorAll('.cloudcanvas-ui-calendar-event').length, 3);
  assert.equal(today.querySelector('.cloudcanvas-ui-calendar-more').textContent, '+2');
  assert.deepEqual([...host.querySelectorAll('.cloudcanvas-ui-calendar-day[tabindex="0"]')].map((node) => node.getAttribute('data-date')), ['2026-09-29']);
  assert.equal(today.querySelector('.cloudcanvas-ui-calendar-event').getAttribute('tabindex'), '0', 'the focused day\'s events are reachable by Tab');
  assert.match(today.querySelector('[data-ui-id="call"]').getAttribute('aria-label'), /Call, Tuesday, September 29, 2026, 9:00 AM to 10:00 AM/);
  assert.equal(q('[data-ui-id="fixed"]').hasAttribute('data-movable'), false);
});

test('toolbar and keys navigate; the day and "+N" pick or open; chips activate', (t) => {
  const { q, log } = calendar(t);
  q('.cloudcanvas-ui-calendar-next').click();
  assert.equal(q('.cloudcanvas-ui-calendar-title').textContent, 'October 2026');
  assert.equal(log.navigate.at(-1).date, '2026-10-01');
  q('.cloudcanvas-ui-calendar-prev').click();
  const day = q('.cloudcanvas-ui-calendar-day[data-date="2026-09-29"]');
  day.focus();
  key(day, 'ArrowDown');
  assert.equal(document.activeElement.getAttribute('data-date'), '2026-10-06');
  key(document.activeElement, 'PageDown');
  assert.equal(document.activeElement.getAttribute('data-date'), '2026-11-06', 'a page keeps the day of the month');
  assert.equal(q('.cloudcanvas-ui-calendar-title').textContent, 'November 2026');
  document.activeElement.click();
  assert.deepEqual(log.pick.at(-1), { date: '2026-11-06' });
  q('.cloudcanvas-ui-calendar-view[data-view="month"]').click();
  q('.cloudcanvas-ui-calendar-prev').click();
  q('.cloudcanvas-ui-calendar-prev').click();
  q('.cloudcanvas-ui-calendar-more').click();
  assert.equal(log.navigate.at(-1).view, 'day');
  q('[data-ui-id="call"]').click();
  assert.deepEqual(log.activate, ['call']);
});

test('keyboard reschedule: Space picks an event up, arrows move it by day or week, Space drops it', (t) => {
  const { q, log, host } = calendar(t);
  const chip = () => q('[data-ui-id="call"]');
  chip().focus();
  key(chip(), ' ');
  assert.ok(chip().classList.contains('is-grabbed'));
  key(document.activeElement, 'ArrowRight');
  key(document.activeElement, 'ArrowDown');
  assert.equal(chip().closest('[data-date]').getAttribute('data-date'), '2026-10-07', 'previewed where it will land');
  assertSame(document.activeElement, chip());
  key(document.activeElement, ' ');
  assert.equal(log.move.length, 1);
  const [id, times] = log.move[0];
  assert.equal(id, 'call');
  assert.equal(dayKey(times.start), '2026-10-07');
  assert.equal(times.start.getHours(), 9);
  assert.equal(times.end.getHours(), 10);
  assert.match(host.querySelector('.cloudcanvas-live-region').textContent, /Moved to Call/);
  q('[data-ui-id="fixed"]').focus();
  key(q('[data-ui-id="fixed"]'), ' ');
  assert.match(host.querySelector('.cloudcanvas-live-region').textContent, /cannot be moved/);
});

test('week: hour grid places events by minutes in lanes, all-day in the strip, Up/Down move by the snap', (t) => {
  const { q, control, log, host } = calendar(t);
  control.update({ view: 'week', date: '2026-09-29', now: '2026-09-29T08:00', events: EVENTS, snapMinutes: 30, locale: 'en-US' });
  assert.equal(host.querySelectorAll('.cloudcanvas-ui-calendar-day-head').length, 7);
  const call = q('[data-ui-id="call"]');
  assert.equal(call.style.getPropertyValue('--calendar-top'), '540');
  assert.equal(call.style.getPropertyValue('--calendar-length'), '60');
  assert.ok(q('.cloudcanvas-ui-calendar-allday-cell[data-date="2026-09-30"] [data-ui-id="trip"]'));
  call.focus();
  key(call, ' ');
  key(document.activeElement, 'ArrowDown');
  key(document.activeElement, 'Enter');
  assert.equal(log.move[0][1].start.getHours(), 9);
  assert.equal(log.move[0][1].start.getMinutes(), 30);
  const column = q('.cloudcanvas-ui-calendar-column[data-date="2026-10-01"]');
  stubBox(column, { top: 100, height: 2400 });
  column.dispatchEvent(new MouseEvent('click', { bubbles: true, clientY: 100 + 14 * 100 }));
  assert.equal(log.pick.at(-1).date, '2026-10-01');
  assert.equal(log.pick.at(-1).start.getHours(), 14);
});

test('week: a pointer drag moves an event to the day and snapped time under the pointer', (t) => {
  const { q, control, log, host } = calendar(t);
  control.update({ view: 'week', date: '2026-09-29', now: '2026-09-29T08:00', events: EVENTS, locale: 'en-US' });
  const body = host.querySelector('.cloudcanvas-ui-calendar-body');
  const columnFor = (date) => q(`.cloudcanvas-ui-calendar-column[data-date="${date}"]`);
  for (const node of host.querySelectorAll('.cloudcanvas-ui-calendar-column')) stubBox(node, { top: 0, height: 2400 });
  stubHitTest(t, (x) => columnFor(x > 500 ? '2026-10-01' : '2026-09-29'));
  pointer(q('[data-ui-id="call"]'), 'pointerdown', { clientX: 300, clientY: 900 });
  pointer(body, 'pointermove', { clientX: 600, clientY: 1000 });
  for (const node of host.querySelectorAll('.cloudcanvas-ui-calendar-column')) stubBox(node, { top: 0, height: 2400 });
  pointer(body, 'pointermove', { clientX: 600, clientY: 1100 });
  pointer(body, 'pointerup', { clientX: 600, clientY: 1100 });
  assert.equal(log.move.length, 1);
  const { start, end } = log.move[0][1];
  assert.equal(dayKey(start), '2026-10-01');
  assert.equal(start.getHours() * 60 + start.getMinutes(), 11 * 60, 'grabbed at 09:00, dropped 200px (2h) lower');
  assert.equal(end - start, 3600000, 'the length is kept');
  control.destroy();
  assertSame(host.querySelector('.cloudcanvas-ui-calendar'), null);
});

const SCROLLER = '.cloudcanvas-ui-calendar-scroller';
const DAY_29 = '.cloudcanvas-ui-calendar-day[data-date="2026-09-29"]';
const at = (view, events = EVENTS) => ({ view, date: '2026-09-29', now: '2026-09-29T08:00', events, locale: 'en-US' });

test('week and day: the hour grid\'s scroller is a named tab stop of its own; the month has none', (t) => {
  const { q, control } = calendar(t);
  assertSame(q(SCROLLER), null, 'the month has no hour grid');
  for (const view of ['week', 'day']) {
    control.update(at(view));
    assert.equal(q(SCROLLER).getAttribute('tabindex'), '0', view);
    assert.equal(q(SCROLLER).getAttribute('role'), 'group', view);
    assert.equal(q(SCROLLER).getAttribute('aria-label'), 'Hours', view);
  }
  const named = calendar(t, { labels: { hours: 'Times' } });
  named.control.update(at('week'));
  assert.equal(named.q(SCROLLER).getAttribute('aria-label'), 'Times');
});

test('an update keeps focus where it was: on the event wherever it moved, on the day, on the hour scroller', (t) => {
  const { q, control } = calendar(t);
  const chip = q('[data-ui-id="call"]');
  chip.focus();
  control.update(at('month', EVENTS.map((event) => (event.id === 'call' ? { ...event, start: '2026-10-01T09:00', end: '2026-10-01T10:00' } : event))));
  assert.ok(q('[data-ui-id="call"]') !== chip, 'the chip was redrawn');
  assert.equal(q('[data-ui-id="call"]').closest('[data-date]').getAttribute('data-date'), '2026-10-01');
  assertSame(document.activeElement, q('[data-ui-id="call"]'));
  const day = q(DAY_29);
  day.focus();
  control.update(at('month'));
  assert.ok(q(DAY_29) !== day, 'the day was redrawn');
  assertSame(document.activeElement, q(DAY_29));
  control.update(at('week'));
  const head = q('.cloudcanvas-ui-calendar-day-head[data-date="2026-09-29"]');
  assertSame(document.activeElement, head, 'the same day, in the view the host switched to');
  const scroller = q(SCROLLER);
  scroller.focus();
  control.update(at('week'));
  assert.ok(q(SCROLLER) !== scroller, 'the scroller was redrawn');
  assertSame(document.activeElement, q(SCROLLER));
});

test('an update takes no focus: not from outside the calendar, and not when nothing held it', (t) => {
  const { host, control } = calendar(t);
  const outside = document.createElement('button');
  host.append(outside);
  outside.focus();
  control.update(at('week'));
  assertSame(document.activeElement, outside);
  outside.blur();
  control.update(at('month'));
  assertSame(document.activeElement, document.body);
});

test('a focus the calendar keeps returns without scrolling: on an update, through a pointer drag, on the scroller', (t) => {
  const { host, q, control, log } = calendar(t);
  control.update(at('week'));
  q('[data-ui-id="call"]').focus();
  const calls = focusCalls(t);
  control.update(at('week'));
  assert.deepEqual(calls, [{ preventScroll: true }], 'a host update returns it and scrolls nothing');
  for (const node of host.querySelectorAll('.cloudcanvas-ui-calendar-column')) stubBox(node, { top: 0, height: 2400 });
  stubHitTest(t, () => q('.cloudcanvas-ui-calendar-column[data-date="2026-09-29"]'));
  pointer(q('[data-ui-id="call"]'), 'pointerdown', { clientX: 300, clientY: 900 });
  pointer(host.querySelector('.cloudcanvas-ui-calendar-body'), 'pointermove', { clientX: 300, clientY: 1000 });
  pointer(host.querySelector('.cloudcanvas-ui-calendar-body'), 'pointerup', { clientX: 300, clientY: 1000 });
  assert.equal(log.move[0][1].start.getHours(), 10, 'the drag moved the event an hour');
  assert.deepEqual(calls, Array(3).fill({ preventScroll: true }), 'the drag\'s redraw and its drop return it the same way');
  q(SCROLLER).focus();
  calls.length = 0;
  control.update(at('week'));
  assert.deepEqual(calls, [{ preventScroll: true }], 'the scroller too');
});

test('the calendar\'s own keyboard moves focus plainly, so the view follows them', (t) => {
  const { q, control } = calendar(t);
  control.update(at('week'));
  q('[data-ui-id="call"]').focus();
  const calls = focusCalls(t);
  for (const name of [' ', 'ArrowDown', 'Enter']) key(document.activeElement, name);
  assert.deepEqual(calls, [undefined, undefined, undefined], 'the pick-up, the move and the drop');
  key(q('.cloudcanvas-ui-calendar-day-head[data-date="2026-09-29"]'), 'ArrowRight');
  assert.equal(document.activeElement.getAttribute('data-date'), '2026-09-30');
  assert.deepEqual(calls.slice(3), [undefined], 'and a day reached by arrow');
});

test('toolbar: a view button keeps focus when it is activated; a new set of views is drawn, focus on the same view', (t) => {
  const { host, q, control } = calendar(t);
  const views = () => [...host.querySelectorAll('.cloudcanvas-ui-calendar-view')];
  const week = q('.cloudcanvas-ui-calendar-view[data-view="week"]');
  week.focus();
  week.click();
  assertSame(document.activeElement, week);
  assert.deepEqual(views().map((node) => node.getAttribute('aria-pressed')), ['false', 'true', 'false'], 'and it is the pressed one');
  const calls = focusCalls(t);
  control.update({ ...at('week'), views: ['week', 'day'] });
  assert.deepEqual(views().map((node) => `${node.textContent}:${node.getAttribute('aria-pressed')}`), ['Week:true', 'Day:false']);
  assert.ok(views()[0] !== week, 'a new set is drawn afresh');
  assertSame(document.activeElement, views()[0], 'the new Week button has the focus the old one held');
  assert.deepEqual(calls, [{ preventScroll: true }], 'given back without scrolling');
});
