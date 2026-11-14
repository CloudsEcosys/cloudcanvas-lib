/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The range in the toolbar says the days the sheet SHOWS - the first and the
 * last day right of the gutter, after the reader's scroll and zoom - not how
 * far the axis reaches, and it says them as soon as they move: a scroll, a
 * change of scale, Ctrl and the wheel, a resize. They are the days `onWindow`
 * reports. A sheet with no width shows no day, and the range says none.
 *
 * Every case was written before the code and run on the timeline as it stood
 * at `f28f269` (its timeline and calendar as at `d68b5b5`); each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimeline } from '../../ui/index.js';
import { mount, stubBox } from '../helpers/ui.js';
import { ITEMS, NOW } from './ui-timeline-fixture.js';

const MODEL = { label: 'Plan', scale: 'week', now: NOW, locale: 'en-US', items: ITEMS };
const SHORT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
/** A day key as the toolbar writes it: "Oct 1". */
const words = (key) => SHORT.format(new Date(`${key}T00:00`));

/** A timeline whose sheet is `width` px wide before it is first drawn; the range it writes, and the window it reports. */
function sized(t, width = 700) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const host = mount(t);
  const windows = [];
  const control = createTimeline(host, { onWindow: ({ from, to }) => windows.push([from, to]) });
  const sheet = host.querySelector('.cloudcanvas-ui-timeline-sheet');
  Object.defineProperty(sheet, 'clientWidth', { configurable: true, value: width });
  stubBox(sheet, { left: 0, top: 0, width, height: 300 });
  control.update(MODEL);
  t.after(() => control.destroy());
  const range = () => host.querySelector('.cloudcanvas-ui-timeline-range').textContent;
  /** The range the last report names, as the toolbar would write it. */
  const reported = () => { t.mock.timers.tick(1000); const [from, to] = windows.at(-1); return `${words(from)} – ${words(to)}`; };
  return { host, control, sheet, range, reported };
}

/*
 * Seen to fail on the timeline of `f28f269`, whose range was the axis' reach, a sheet's width of days beyond the items each side:
 *
 *   ✖ range: the toolbar says the first and the last day the sheet shows, not how far the axis reaches
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *     + actual - expected
 *     + 'Aug 20 – Nov 16'
 *     - 'Sep 21 – Oct 17'
 */
test('range: the toolbar says the first and the last day the sheet shows, not how far the axis reaches', (t) => {
  const { range, reported } = sized(t);
  // 700px, 160px of gutter: 540px of track, 27 days of 20px, from where the items begin.
  assert.equal(range(), 'Sep 21 – Oct 17');
  assert.equal(range(), reported(), 'the days onWindow reports');
});

/*
 * Seen to fail on the timeline of `f28f269`:
 *
 *   ✖ range: it follows a scroll at once, a change of scale, Ctrl and the wheel, and a resize
 *     AssertionError [ERR_ASSERTION]: a scroll ten days on: at once, not when it settles
 *     + 'Aug 20 – Nov 16'
 *     - 'Oct 1 – Oct 27'
 */
test('range: it follows a scroll at once, a change of scale, Ctrl and the wheel, and a resize', (t) => {
  const { host, sheet, range, reported } = sized(t);
  sheet.scrollLeft += 200;
  sheet.dispatchEvent(new Event('scroll'));
  assert.equal(range(), 'Oct 1 – Oct 27', 'a scroll ten days on: at once, not when it settles');
  host.querySelector('[data-scale="day"]').click();
  assert.equal(range(), reported(), 'a change of scale: the days the sheet shows at 64px a day');
  const days = (text) => text.split(' – ');
  assert.notDeepEqual(days(range()), ['Oct 1', 'Oct 27']);
  // A wheel as a browser gives it: the test DOM's carries no modifier or point from its init.
  sheet.dispatchEvent(Object.defineProperties(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true }),
    { ctrlKey: { value: true }, clientX: { value: 400 }, clientY: { value: 50 } }));
  assert.equal(host.querySelector('[data-scale="week"]').getAttribute('aria-pressed'), 'true', 'Ctrl and the wheel zoomed out');
  assert.equal(range(), reported(), 'and the range is the days on screen after it');
  Object.defineProperty(sheet, 'clientWidth', { configurable: true, value: 300 });
  sheet.dispatchEvent(new Event('scroll'));
  const [from, to] = days(range());
  assert.equal(`${from} – ${to}`, reported(), 'a narrower sheet shows fewer days');
});

/*
 * Seen to fail on the timeline of `f28f269`:
 *
 *   ✖ range: a sheet with no width shows no day and says none
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *     + 'Sep 21 – Oct 15'
 *     - ''
 */
test('range: a sheet with no width shows no day and says none', (t) => {
  const { range } = sized(t, 0);
  assert.equal(range(), '');
});
