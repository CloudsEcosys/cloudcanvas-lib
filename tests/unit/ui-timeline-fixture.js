/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The items the timeline suites draw, and a timeline mounted on them with every
 * callback logged. Not a suite: the runner's `*.test.js` glob does not pick it
 * up, so importing it runs no case twice.
 *
 * book ─┬─ draft (4 days, Doing, 40%)   Release ── ship (milestone)
 *       └─ quick (half an hour, Next)   loose (no group, no end)
 */
import { createTimeline } from '../../ui/index.js';
import { mount } from '../helpers/ui.js';

export const NOW = '2026-09-29T12:00';
export const ITEMS = [
  { id: 'draft', title: 'Draft the whole spring campaign brief and circulate it', start: '2026-09-28', end: '2026-10-02', group: { id: 'book', label: 'The book' },
    status: { label: 'Doing', tone: 'warning' }, progress: 0.4 },
  { id: 'quick', title: 'Call the printer', start: '2026-10-02T09:00', end: '2026-10-02T09:30', group: { id: 'book', label: 'The book' }, status: 'Next' },
  { id: 'ship', title: 'Ship it', start: '2026-10-06', milestone: true, group: 'Release' },
  { id: 'loose', title: 'Loose end', start: '2026-10-07' }
];

/** A timeline over `items` with every callback it can be given logged as `[name, ...args]`. */
export function timelineOf(t, items = ITEMS, names = ['onActivate', 'onChange', 'onGutter', 'onScale'], model = {}) {
  const host = mount(t);
  const log = [];
  const control = createTimeline(host, Object.fromEntries(names.map((name) => [name, (...args) => log.push([name, ...args])])));
  const draw = (next = items, more = {}) => control.update({ label: 'Plan', scale: 'week', now: NOW, locale: 'en-US', items: next, ...model, ...more });
  draw();
  t.after(() => control.destroy());
  const bar = (id) => host.querySelector(`.cloudcanvas-ui-timeline-bar[data-ui-id="${id}"]`);
  const root = host.querySelector('.cloudcanvas-ui-timeline');
  return { host, root, control, draw, log, bar, hint: () => host.querySelector('.cloudcanvas-ui-timeline-hint').textContent };
}

