/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The timeline (Gantt): its pure geometry, its rendering from plain data, and
 * moving an item by keyboard and by pointer. The graph that shared this file
 * is a mind map now, with suites of its own (`ui-graph*.test.js`); its
 * layered-layout and free-placement cases went with the stub they described.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimeline, dayKey } from '../../ui/index.js';
import { barOf, domainFor, normalizeItems, shiftItem, tickDates } from '../../ui/timeline/model.js';
import { assertSame, focusCalls, key, mount, pointer } from '../helpers/ui.js';

const NOW = '2026-09-29T12:00';
const ITEMS = [
  { id: 'draft', title: 'Draft', start: '2026-09-28', end: '2026-10-02', group: 'Writing', progress: 0.4 },
  { id: 'edit', title: 'Edit', start: '2026-10-02', end: '2026-10-05', group: 'Writing' },
  { id: 'ship', title: 'Ship', start: '2026-10-06', group: 'Release' },
  { id: 'lock', title: 'Locked', start: '2026-10-01', end: '2026-10-03', movable: false }
];

test('timeline model: checked items, a padded domain, bars, ticks and day shifts', () => {
  assert.throws(() => normalizeItems([{ id: 'a', start: 'x' }]), /no valid start/);
  assert.throws(() => normalizeItems([{ id: 'a', start: '2026-01-01' }, { id: 'a', start: '2026-01-01' }]), /duplicate/);
  const items = normalizeItems(ITEMS);
  const domain = domainFor(items, 'week', new Date(NOW));
  assert.equal(dayKey(domain.start), '2026-09-21');
  assert.equal(dayKey(domain.end), '2026-10-14');
  assert.deepEqual(barOf(items[0], domain, 'week'), { left: 140, width: 80, point: false });
  assert.equal(barOf(items[2], domain, 'week').point, true);
  assert.equal(tickDates(domain, 'week').every((date) => date.getDay() === 1), true);
  const moved = shiftItem({ start: items[0].start, end: items[0].end }, 2, false);
  assert.equal(dayKey(moved.start), '2026-09-30');
  const longer = shiftItem({ start: items[0].start, end: items[0].end }, -10, true);
  assert.equal(dayKey(longer.end), '2026-10-02', 'an end never moves before its start');
});

function timeline(t) {
  const host = mount(t);
  const log = { activate: [], change: [], scale: [] };
  const control = createTimeline(host, {
    onActivate: (id) => log.activate.push(id), onChange: (id, times) => log.change.push([id, times]),
    onScale: (scale) => log.scale.push(scale)
  });
  control.update({ label: 'Plan', scale: 'week', now: NOW, items: ITEMS, locale: 'en-US' });
  const bar = (id) => host.querySelector(`.cloudcanvas-ui-timeline-bar[data-ui-id="${id}"]`);
  return { host, control, log, bar };
}

test('timeline: grouped rows, bars placed by custom property, milestones, progress, names that read', (t) => {
  const { host, bar } = timeline(t);
  assert.deepEqual([...host.querySelectorAll('.cloudcanvas-ui-timeline-group')].map((node) => node.textContent), ['Writing', 'Release']);
  assert.equal(bar('draft').style.getPropertyValue('--timeline-x'), '140px');
  assert.equal(bar('draft').style.getPropertyValue('--timeline-progress'), '0.4');
  assert.ok(bar('ship').classList.contains('is-point'));
  assert.match(bar('draft').getAttribute('aria-label'), /^Draft, Sep 28 to Oct 1, 40% done$/);
  assert.match(bar('ship').getAttribute('aria-label'), /milestone/);
  assert.equal(bar('lock').hasAttribute('data-movable'), false);
  assert.deepEqual([...host.querySelectorAll('.cloudcanvas-ui-timeline-bar')].map((node) => node.getAttribute('tabindex')), ['0', '-1', '-1', '-1']);
});

test('timeline: keys rove and move (Shift resizes); the scale switches and is reported', (t) => {
  const { host, bar, log, control } = timeline(t);
  bar('draft').click();
  assert.deepEqual(log.activate, ['draft']);
  bar('draft').focus();
  key(bar('draft'), 'ArrowDown');
  assertSame(document.activeElement, bar('edit'));
  key(bar('edit'), ' ');
  key(document.activeElement, 'ArrowRight');
  key(document.activeElement, 'ArrowRight', { shiftKey: true });
  key(document.activeElement, 'Enter');
  const [id, times] = log.change[0];
  assert.equal(id, 'edit');
  assert.equal(dayKey(times.start), '2026-10-03');
  assert.equal(dayKey(times.end), '2026-10-07');
  assertSame(document.activeElement, bar('edit'));
  key(bar('lock'), ' ');
  key(document.activeElement, 'ArrowRight');
  assert.equal(log.change.length, 1, 'an unmovable bar is not picked up');
  host.querySelector('.cloudcanvas-ui-timeline-scale[data-scale="day"]').click();
  assert.deepEqual(log.scale, ['day']);
  assert.equal(host.querySelector('.cloudcanvas-ui-timeline-scale[aria-pressed="true"]').getAttribute('data-scale'), 'day');
  control.update({ scale: 'week', now: NOW, items: ITEMS });
  assert.equal(host.querySelector('.cloudcanvas-ui-timeline-scale[aria-pressed="true"]').getAttribute('data-scale'), 'day', 'an unchanged model scale does not undo the choice');
});

test('timeline: dragging a bar moves it by whole days; dragging its handle resizes', (t) => {
  const { host, bar, log } = timeline(t);
  const sheet = host.querySelector('.cloudcanvas-ui-timeline-sheet');
  pointer(bar('draft'), 'pointerdown', { clientX: 200, clientY: 10 });
  pointer(sheet, 'pointermove', { clientX: 241, clientY: 10 });
  pointer(sheet, 'pointerup', { clientX: 241, clientY: 10 });
  assert.equal(dayKey(log.change[0][1].start), '2026-09-30', '41px at 20px a day is two days');
  pointer(bar('draft').querySelector('.cloudcanvas-ui-timeline-handle'), 'pointerdown', { clientX: 220, clientY: 10 });
  pointer(sheet, 'pointermove', { clientX: 280, clientY: 10 });
  pointer(sheet, 'pointerup', { clientX: 280, clientY: 10 });
  const resized = log.change[1][1];
  assert.equal(dayKey(resized.start), '2026-09-28');
  assert.equal(dayKey(resized.end), '2026-10-05');
});

test('timeline: an update keeps focus on the bar that had it, and takes none from outside', (t) => {
  const { host, bar, control } = timeline(t);
  const model = (items) => ({ label: 'Plan', scale: 'week', now: NOW, items, locale: 'en-US' });
  const before = bar('edit');
  before.focus();
  control.update(model(ITEMS.map((item) => (item.id === 'edit' ? { ...item, start: '2026-10-03', end: '2026-10-07' } : item))));
  assert.ok(bar('edit') !== before, 'the bar was redrawn');
  assert.match(bar('edit').getAttribute('aria-label'), /Oct 3 to Oct 6/, 'at its new dates (the last day it covers, not the midnight its end is)');
  assertSame(document.activeElement, bar('edit'));
  const outside = document.createElement('button');
  host.append(outside);
  outside.focus();
  control.update(model(ITEMS));
  assertSame(document.activeElement, outside);
});

test('timeline: a kept focus returns without scrolling; the timeline\'s own keyboard moves focus plainly', (t) => {
  const { host, bar, control, log } = timeline(t);
  const sheet = host.querySelector('.cloudcanvas-ui-timeline-sheet');
  bar('edit').focus();
  const calls = focusCalls(t);
  control.update({ label: 'Plan', scale: 'week', now: NOW, items: ITEMS, locale: 'en-US' });
  pointer(bar('draft'), 'pointerdown', { clientX: 200, clientY: 10 });
  pointer(sheet, 'pointermove', { clientX: 241, clientY: 10 });
  pointer(sheet, 'pointerup', { clientX: 241, clientY: 10 });
  assert.equal(log.change.length, 1, 'the drag moved a bar');
  assert.deepEqual(calls, Array(3).fill({ preventScroll: true }), 'a host update, a pointer drag\'s redraw and its drop scroll nothing');
  assertSame(document.activeElement, bar('edit'));
  for (const name of [' ', 'ArrowRight', 'Enter']) key(document.activeElement, name);
  assert.deepEqual(calls.slice(3), [undefined, undefined, undefined], 'the pick-up, the step and the drop: the view follows');
});

test('timeline: a scale button keeps focus when it is activated', (t) => {
  const { host, log } = timeline(t);
  const day = host.querySelector('.cloudcanvas-ui-timeline-scale[data-scale="day"]');
  day.focus();
  day.click();
  assertSame(document.activeElement, day);
  assert.deepEqual([...host.querySelectorAll('.cloudcanvas-ui-timeline-scale')].map((node) => `${node.textContent}:${node.getAttribute('aria-pressed')}`),
    ['Days:true', 'Weeks:false', 'Months:false'], 'and it is the pressed one');
  assert.deepEqual(log.scale, ['day']);
});
