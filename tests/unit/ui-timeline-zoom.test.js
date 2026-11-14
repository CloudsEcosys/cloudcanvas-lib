/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Zooming the timeline between its three scales - days, weeks, months - with
 * Ctrl and the wheel, a trackpad's pinch (the same wheel with Ctrl) or two
 * fingers. The date under the pointer stays under it, and each change of scale
 * is reported (`onScale`) so a host may keep it; the scale buttons stay.
 *
 * Every case was written before the code and run on the timeline as it stood
 * at `a304bfb`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { pointer, stubBox } from '../helpers/ui.js';
import { timelineOf } from './ui-timeline-fixture.js';

/** A wheel as a browser gives it: the test DOM's carries no modifier or point from its init. */
function wheel(target, { deltaY, ctrlKey = true, clientX = 360 }) {
  const event = Object.defineProperties(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY }),
    { ctrlKey: { value: ctrlKey }, clientX: { value: clientX }, clientY: { value: 40 } });
  target.dispatchEvent(event);
  return event;
}

const scales = (log) => log.filter(([name]) => name === 'onScale').map(([, scale]) => scale);
const pressed = (host) => host.querySelector('.cloudcanvas-ui-timeline-scale[aria-pressed="true"]').getAttribute('data-scale');

/** A timeline whose sheet is 600px wide and whose gutter is 160px, measured as a browser would. */
function measured(t) {
  const made = timelineOf(t);
  const sheet = stubBox(made.host.querySelector('.cloudcanvas-ui-timeline-sheet'), { left: 0, top: 0, width: 600, height: 300 });
  stubBox(made.host.querySelector('.cloudcanvas-ui-timeline-corner'), { left: 0, top: 0, width: 160, height: 28 });
  return { ...made, sheet };
}

/*
 * Seen to fail on the timeline of `a304bfb`, which zoomed by its buttons alone:
 *
 *   ✖ zoom: Ctrl and the wheel step between the scales and report each; the wheel alone scrolls; the ends stay put
 *     AssertionError [ERR_ASSERTION]: with Ctrl it is the zoom's: the page does not zoom too
 *       actual: false,
 *       expected: true,
 */
test('zoom: Ctrl and the wheel step between the scales and report each; the wheel alone scrolls; the ends stay put', (t) => {
  const { host, sheet, log } = measured(t);
  assert.equal(wheel(sheet, { deltaY: -100, ctrlKey: false }).defaultPrevented, false, 'the wheel alone is the sheet\'s to scroll');
  assert.deepEqual(scales(log), []);
  assert.equal(wheel(sheet, { deltaY: -100 }).defaultPrevented, true, 'with Ctrl it is the zoom\'s: the page does not zoom too');
  assert.deepEqual([scales(log), pressed(host)], [['day'], 'day'], 'Ctrl and a wheel up zoom in');
  wheel(sheet, { deltaY: -100 });
  assert.deepEqual(scales(log), ['day'], 'days are the finest: nothing is reported for staying there');
  wheel(sheet, { deltaY: 100 });
  wheel(sheet, { deltaY: 100 });
  assert.deepEqual([scales(log), pressed(host)], [['day', 'week', 'month'], 'month'], 'down zooms out, a step each');
  wheel(sheet, { deltaY: 100 });
  assert.deepEqual(scales(log), ['day', 'week', 'month'], 'months are the coarsest');
});

/*
 * Seen to fail on the timeline of `a304bfb`:
 *
 *   ✖ zoom: a trackpad's pinch is many small wheels: they add up to a step, and a pause forgets the rest
 *     AssertionError [ERR_ASSERTION]: sixty are
 *       actual: [],
 *       expected: [ 'day' ],
 */
test('zoom: a trackpad\'s pinch is many small wheels: they add up to a step, and a pause forgets the rest', (t) => {
  const { sheet, log } = measured(t);
  for (let at = 0; at < 4; at += 1) wheel(sheet, { deltaY: -10 });
  assert.deepEqual(scales(log), [], 'forty pixels are not yet a step');
  wheel(sheet, { deltaY: -10 });
  wheel(sheet, { deltaY: -10 });
  assert.deepEqual(scales(log), ['day'], 'sixty are');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  wheel(sheet, { deltaY: 40 });
  t.mock.timers.tick(500);
  wheel(sheet, { deltaY: 40 });
  assert.deepEqual(scales(log), ['day'], 'a pause forgets what came before it: forty, a rest, forty');
});

/*
 * Seen to fail on the timeline of `a304bfb`:
 *
 *   ✖ zoom: the date under the pointer stays under it
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
 *       actual: [],
 *       expected: [ 'day' ],
 */
test('zoom: the date under the pointer stays under it', (t) => {
  const { sheet, log } = measured(t);
  // The pointer is at 360, the gutter 160 wide: 200px along the track, ten days from its start (20px a day) - 1 October.
  // At 64px a day, with the axis starting on the 26th, 1 October is 320px along: the sheet scrolls to put it back at 360.
  wheel(sheet, { deltaY: -100, clientX: 360 });
  assert.deepEqual(scales(log), ['day']);
  assert.equal(sheet.scrollLeft, 120, 'the sheet is scrolled so the day under the pointer is where it was');
  wheel(sheet, { deltaY: 100, clientX: 200 });
  // The pointer is at 200 over a sheet scrolled to 120: 160px along the track, 2.5 days past the 26th - noon on the 28th.
  // At 20px a day, with the axis starting on the 21st, that is 150px along: the sheet scrolls to put it back at 200.
  assert.equal(sheet.scrollLeft, 160 + 150 - 200, 'and back out again');
});

/*
 * Seen to fail on the timeline of `a304bfb`:
 *
 *   ✖ zoom: two fingers moving apart zoom in, moving together zoom out, a step at a time
 *     AssertionError [ERR_ASSERTION]: apart zooms in
 *       actual: [],
 *       expected: [ 'day' ],
 */
test('zoom: two fingers moving apart zoom in, moving together zoom out, a step at a time', (t) => {
  const { sheet, log } = measured(t);
  const touch = (type, id, x) => pointer(sheet, type, { pointerId: id, pointerType: 'touch', clientX: x, clientY: 100 });
  touch('pointerdown', 7, 300);
  touch('pointerdown', 8, 400);
  touch('pointermove', 8, 440);
  assert.deepEqual(scales(log), [], 'a little more apart is not yet a step');
  touch('pointermove', 8, 520);
  assert.deepEqual(scales(log), ['day'], 'apart zooms in');
  touch('pointermove', 8, 340);
  assert.deepEqual(scales(log), ['day', 'week'], 'together zooms out');
  touch('pointerup', 8, 340);
  touch('pointermove', 7, 100);
  assert.deepEqual(scales(log), ['day', 'week'], 'one finger is no pinch');
  touch('pointerup', 7, 100);
});

/**
 * The day, fractions included, at the middle of the track a sheet shows: from the one bar's place on the axis, whatever the axis'
 * start is at the scale drawn. The sheet is 600px wide and the gutter 160px, so the middle is 220px along what is shown.
 */
function middleDay(host, sheet, scale) {
  const perDay = { day: 64, week: 20, month: 5 }[scale];
  const draft = host.querySelector('.cloudcanvas-ui-timeline-bar[data-ui-id="draft"]');
  const along = sheet.scrollLeft + 220 - Number.parseFloat(draft.style.getPropertyValue('--timeline-x'));
  return new Date('2026-09-28').getTime() / 86400000 + along / perDay;
}

/*
 * Found in a browser: Weeks scrolled to Oct 25 - Dec 13, then Months showed Dec 1 - Jun 15, because the sheet kept its pixel offset
 * across a change of scale. Seen to fail on the timeline of `98d52d1`:
 *
 *   ✖ zoom: the scale buttons keep the day at the middle of the window where it was, at every scale
 *     AssertionError [ERR_ASSERTION]: week to day: the middle of the window is the same day, to within half of one: was 2026-10-10T00:00:00.000Z, is 2026-09-26T09:00:00.000Z
 */
test('zoom: the scale buttons keep the day at the middle of the window where it was, at every scale', (t) => {
  const { host, sheet } = measured(t);
  Object.defineProperty(sheet, 'clientWidth', { configurable: true, value: 600 });
  host.querySelector('[data-scale="week"]').click();
  sheet.scrollLeft = 700;
  let scale = 'week';
  let was = middleDay(host, sheet, scale);
  for (const next of ['day', 'week', 'month', 'week', 'day', 'month']) {
    host.querySelector(`[data-scale="${next}"]`).click();
    const now = middleDay(host, sheet, next);
    assert.ok(Math.abs(now - was) < 0.51, `${scale} to ${next}: the middle of the window is the same day, to within half of one: was ${new Date(was * 86400000).toISOString()}, is ${new Date(now * 86400000).toISOString()}`);
    scale = next;
    was = now;
  }
});
