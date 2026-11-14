/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A drag held near an edge of the sheet scrolls it: a span being made, a bar
 * being moved and an end being resized carry on past what the sheet shows.
 * The nearer the pointer to the edge, the faster it goes, a little each frame;
 * for a reader who asked for less motion it jumps by whole days, at a steady
 * pace, the same however near. What is in hand follows the days that scroll
 * under the still pointer, and it all stops when the drag ends - let go,
 * Escape or a cancelled pointer - or the pointer leaves the edge.
 *
 * Every case was written before the code and run on the timeline as it stood
 * at `f28f269` (its timeline and calendar as at `d68b5b5`); each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { _resetReducedMotionForTests } from '../../plugins/motion.js';
import { dayKey } from '../../ui/index.js';
import { pointer, stubBox } from '../helpers/ui.js';
import { timelineOf } from './ui-timeline-fixture.js';

const WIDTH = 700;
const GUTTER = 160;

/**
 * A timeline 700px wide whose tracks stand where a browser would put them: past the 160px gutter, moved left by the
 * sheet's scroll. Frames are timers the test ticks.
 */
function edgeOf(t, { reduced = false } = {}) {
  const original = globalThis.matchMedia;
  globalThis.matchMedia = (query) => ({ matches: reduced && query.includes('reduce') });
  _resetReducedMotionForTests();
  t.after(() => { globalThis.matchMedia = original; _resetReducedMotionForTests(); });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const fixture = timelineOf(t, undefined, ['onActivate', 'onChange', 'onCreate']);
  const sheet = fixture.host.querySelector('.cloudcanvas-ui-timeline-sheet');
  Object.defineProperty(sheet, 'clientWidth', { configurable: true, value: WIDTH });
  stubBox(sheet, { left: 0, top: 0, width: WIDTH, height: 200 });
  fixture.draw();
  const place = () => {
    for (const track of fixture.host.querySelectorAll('.cloudcanvas-ui-timeline-track')) {
      track.getBoundingClientRect = () => ({ left: GUTTER - sheet.scrollLeft, top: 0, width: 4000, height: 36, right: 4000, bottom: 36, x: 0, y: 0 });
    }
  };
  place();
  return { ...fixture, sheet, place, frames: (ms) => { t.mock.timers.tick(ms); place(); } };
}

const created = (log) => log.filter(([name]) => name === 'onCreate').map(([, span]) => [dayKey(span.start), dayKey(span.end)]);
const changed = (log) => log.filter(([name]) => name === 'onChange').map(([, id, times]) => [id, dayKey(times.start), times.end ? dayKey(times.end) : null]);

/*
 * Seen to fail on the timeline of `f28f269`, which never scrolled a drag:
 *
 *   ✖ edge: a span dragged to the right edge and held there scrolls the sheet, faster nearer the edge, and the span follows
 *     AssertionError [ERR_ASSERTION]: held 10px from the right edge, the sheet scrolls on
 *       actual: false,
 *       expected: true,
 */
test('edge: a span dragged to the right edge and held there scrolls the sheet, faster nearer the edge, and the span follows', (t) => {
  const { host, sheet, frames, log } = edgeOf(t);
  const home = sheet.scrollLeft;
  const track = host.querySelector('[data-row-id="draft"] .cloudcanvas-ui-timeline-track');
  pointer(track, 'pointerdown', { clientX: 300, clientY: 10 });
  pointer(sheet, 'pointermove', { clientX: 660, clientY: 12 });
  frames(160);
  const slow = sheet.scrollLeft - home;
  pointer(sheet, 'pointermove', { clientX: 690, clientY: 12 });
  frames(160);
  const fast = sheet.scrollLeft - home - slow;
  assert.ok(slow > 0, 'held 10px from the right edge, the sheet scrolls on');
  assert.ok(fast > slow, `nearer the edge it goes faster: ${slow}px, then ${fast}px in the same time`);
  const band = host.querySelector('.cloudcanvas-ui-timeline-draft');
  pointer(sheet, 'pointermove', { clientX: 690, clientY: 12 });
  assert.ok(Number.parseFloat(band.style.getPropertyValue('--timeline-w')) > (690 - 300) + slow, 'the band reaches the day now under the pointer');
  pointer(sheet, 'pointerup', { clientX: 690, clientY: 12 });
  const stopped = sheet.scrollLeft;
  frames(500);
  assert.equal(sheet.scrollLeft, stopped, 'let go, it stops');
  const [[start, end]] = created(log);
  assert.equal(start, '2026-09-28', 'from the day pressed');
  assert.ok(end > '2026-10-17', `to a day the sheet did not show when the drag began: ${end}`);
});

/*
 * Seen to fail on the timeline of `f28f269`:
 *
 *   ✖ edge: a bar moved to the left edge scrolls back and is moved by the days scrolled; Escape stops it and moves nothing
 *     AssertionError [ERR_ASSERTION]: held at the left edge, past the gutter, the sheet scrolls back
 *       actual: false,
 *       expected: true,
 */
test('edge: a bar moved to the left edge scrolls back and is moved by the days scrolled; Escape stops it and moves nothing', (t) => {
  const { sheet, frames, log, bar } = edgeOf(t);
  const home = sheet.scrollLeft;
  pointer(bar('draft'), 'pointerdown', { clientX: 330, clientY: 10 });
  pointer(sheet, 'pointermove', { clientX: GUTTER + 4, clientY: 12 });
  frames(160);
  const back = home - sheet.scrollLeft;
  assert.ok(back > 0, 'held at the left edge, past the gutter, the sheet scrolls back');
  pointer(sheet, 'pointerup', { clientX: GUTTER + 4, clientY: 12 });
  const [[id, start]] = changed(log);
  const days = Math.round((GUTTER + 4 - 330 - back) / 20);
  assert.deepEqual([id, start], ['draft', dayKey(new Date(2026, 8, 28 + days))], `moved by the pointer's travel and the ${back}px scrolled`);
  pointer(bar('quick'), 'pointerdown', { clientX: 400, clientY: 10 });
  pointer(sheet, 'pointermove', { clientX: WIDTH - 2, clientY: 12 });
  frames(64);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  const stopped = sheet.scrollLeft;
  frames(500);
  assert.equal(sheet.scrollLeft, stopped, 'Escape stops it');
  assert.equal(changed(log).length, 1, 'and moves nothing');
});

/*
 * Seen to fail on the timeline of `f28f269`:
 *
 *   ✖ edge: a reader who asked for less motion gets whole days at a steady pace, however near the edge; away from it, nothing
 *     AssertionError [ERR_ASSERTION]: a step of whole days: 0px
 *       actual: false,
 *       expected: true,
 */
test('edge: a reader who asked for less motion gets whole days at a steady pace, however near the edge; away from it, nothing', (t) => {
  const { host, sheet, frames } = edgeOf(t, { reduced: true });
  const home = sheet.scrollLeft;
  const track = host.querySelector('[data-row-id="draft"] .cloudcanvas-ui-timeline-track');
  pointer(track, 'pointerdown', { clientX: 300, clientY: 10 });
  pointer(sheet, 'pointermove', { clientX: 690, clientY: 12 });
  frames(100);
  assert.equal(sheet.scrollLeft, home, 'no motion between the steps');
  frames(150);
  const step = sheet.scrollLeft - home;
  assert.ok(step > 0 && step % 20 === 0, `a step of whole days: ${step}px`);
  pointer(sheet, 'pointermove', { clientX: 660, clientY: 12 });
  frames(250);
  assert.equal(sheet.scrollLeft - home, 2 * step, 'the same step farther from the edge');
  pointer(sheet, 'pointermove', { clientX: 400, clientY: 12 });
  frames(1000);
  assert.equal(sheet.scrollLeft - home, 2 * step, 'away from the edge it stops');
  pointer(sheet, 'pointerup', { clientX: 400, clientY: 12 });
});
