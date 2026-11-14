/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The events the calendar's resize, range and verb suites draw, and a
 * calendar mounted on them with every callback logged. Not a suite: the
 * runner's `*.test.js` glob does not pick it up, so importing it runs no case
 * twice.
 *
 * Tue 29 Sep: call 9:00-10:00 (movable) · fixed 13:00-14:00 (held) · open 15:00 (no end)
 * Wed 30 Sep: trip, all day · Thu 1 Oct: late 22:00-23:30
 */
import { createCalendar } from '../../ui/index.js';
import { mount, stubBox } from '../helpers/ui.js';

export const EVENTS = [
  { id: 'call', title: 'Call the printer', start: '2026-09-29T09:00', end: '2026-09-29T10:00' },
  { id: 'fixed', title: 'Fixed', start: '2026-09-29T13:00', end: '2026-09-29T14:00', movable: false },
  { id: 'open', title: 'Open ended', start: '2026-09-29T15:00' },
  { id: 'trip', title: 'Trip', start: '2026-09-30', allDay: true },
  { id: 'late', title: 'Late', start: '2026-10-01T22:00', end: '2026-10-01T23:30' }
];

/** A calendar on the week of 29 September (or `view`), every callback in `names` logged as `[name, ...args]`. */
export function calendarOf(t, { view = 'week', names = ['onMove', 'onPick', 'onActivate'], events = EVENTS, snapMinutes } = {}) {
  const host = mount(t);
  const log = [];
  const control = createCalendar(host, Object.fromEntries(names.map((name) => [name, (...args) => log.push([name, ...args])])));
  const draw = (more = {}) => control.update({ view, date: '2026-09-29', now: '2026-09-29T08:00', locale: 'en-US', events, ...(snapMinutes ? { snapMinutes } : {}), ...more });
  draw();
  t.after(() => control.destroy());
  const q = (selector) => host.querySelector(selector);
  const chip = (id) => q(`.cloudcanvas-ui-calendar-event[data-ui-id="${id}"]`);
  const column = (day) => q(`.cloudcanvas-ui-calendar-column[data-date="${day}"]`);
  /** Give every column of the hour grid the box of a 24-hour day 2400px tall, a column 100px wide: 100px an hour, 25px a quarter. */
  const box = () => [...host.querySelectorAll('.cloudcanvas-ui-calendar-column')].forEach((node, at) => stubBox(node, { left: at * 100, top: 0, width: 100, height: 2400 }));
  return { host, control, log, q, chip, column, box, draw, body: q('.cloudcanvas-ui-calendar-body') };
}

/** The `[name, ...args]` entries of `log` called `name`, without the name. */
export const calls = (log, name) => log.filter(([called]) => called === name).map(([, ...args]) => args);

/** `[id, start 'HH:mm', end 'HH:mm'|null, allDay]` of a reported move. */
export function movedAs([id, { start, end, allDay }]) {
  const clock = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return [id, `${start.getDate()}@${clock(start)}`, end ? `${end.getDate()}@${clock(end)}` : null, allDay];
}
