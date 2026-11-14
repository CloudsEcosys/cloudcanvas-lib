/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Moving and resizing a bar by pointer. A drag moves it, a drag of either end
 * resizes it, a milestone is moved and never resized; all of it snaps to whole
 * days, keeps the time of day, and is reported through `onChange(id, {start,
 * end})` - end exclusive - never applied. Escape puts the bar back.
 *
 * Every case was written before the code and run on the timeline as it stood
 * at `a304bfb`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { dayKey } from '../../ui/index.js';
import { pointer } from '../helpers/ui.js';
import { timelineOf } from './ui-timeline-fixture.js';

const PART = (bar, name) => bar.querySelector(`.cloudcanvas-ui-timeline-${name}`);
const times = (log, at = -1) => { const [, id, { start, end }] = log.filter(([name]) => name === 'onChange').at(at); return [id, dayKey(start), end ? dayKey(end) : null]; };

/** Press `target`, drag the pointer to `x`, and let go (or not). */
function drag(host, target, from, to, { release = true } = {}) {
  const sheet = host.querySelector('.cloudcanvas-ui-timeline-sheet');
  pointer(target, 'pointerdown', { clientX: from, clientY: 10 });
  pointer(sheet, 'pointermove', { clientX: to, clientY: 10 });
  if (release) pointer(sheet, 'pointerup', { clientX: to, clientY: 10 });
}

/*
 * Seen to fail on the timeline of `a304bfb`, which drew a handle at a bar's end only:
 *
 *   ✖ handles: a bar that can be moved has a handle at each end; a milestone, and a bar held in place, have none
 *     AssertionError [ERR_ASSERTION]: the start handle
 *       actual: null,
 *       expected: true,
 */
test('handles: a bar that can be moved has a handle at each end; a milestone, and a bar held in place, have none', (t) => {
  const { bar, draw } = timelineOf(t);
  assert.ok(PART(bar('draft'), 'handle-start'), 'the start handle');
  assert.ok(PART(bar('draft'), 'handle'), 'the end handle');
  assert.deepEqual([PART(bar('ship'), 'handle-start'), PART(bar('ship'), 'handle')], [null, null], 'a milestone is moved, not resized');
  draw([{ id: 'held', title: 'Held', start: '2026-09-28', end: '2026-10-02', movable: false }]);
  assert.deepEqual([PART(bar('held'), 'handle-start'), PART(bar('held'), 'handle')], [null, null]);
  for (const name of ['handle-start', 'handle']) assert.equal(PART(timelineOf(t).bar('draft'), name).getAttribute('aria-hidden'), 'true', 'a handle is for the pointer: the keys say the same');
});

/*
 * Seen to fail on the timeline of `a304bfb`, whose only handle was the bar's end:
 *
 *   ✖ resize: the start handle moves the start by whole days and leaves the end; a start dragged to the end changes nothing
 *     TypeError [Error]: Cannot read properties of null (reading 'dispatchEvent')
 */
test('resize: the start handle moves the start by whole days and leaves the end; a start dragged to the end changes nothing', (t) => {
  const { host, bar, log } = timelineOf(t);
  drag(host, PART(bar('draft'), 'handle-start'), 150, 191);
  assert.deepEqual(times(log), ['draft', '2026-09-30', '2026-10-02'], '41px at 20px a day is two days; the end is where it was');
  drag(host, PART(bar('draft'), 'handle-start'), 150, 190, { release: false });
  assert.match(bar('draft').style.getPropertyValue('--timeline-w'), /^40px$/, 'the bar shows what the drop would make while the pointer is down');
  pointer(host.querySelector('.cloudcanvas-ui-timeline-sheet'), 'pointermove', { clientX: 400, clientY: 10 });
  pointer(host.querySelector('.cloudcanvas-ui-timeline-sheet'), 'pointerup', { clientX: 400, clientY: 10 });
  assert.equal(log.filter(([name]) => name === 'onChange').length, 1, 'a start dragged past the end is not a change: a bar has a length');
});

/*
 * Held on the timeline of `a304bfb` already - the end handle and the body moved then - and written to keep it so while
 * the bar's parts move into files of their own. Run on `a304bfb`: 3 cases of this file fail (the two above and the
 * next), these two pass.
 */
test('resize: the end handle moves the end; the body moves both, keeping the time of day; a milestone is dragged whole', (t) => {
  const { host, bar, log } = timelineOf(t);
  drag(host, PART(bar('draft'), 'handle'), 220, 280);
  assert.deepEqual(times(log), ['draft', '2026-09-28', '2026-10-05'], 'the end goes three days on, the start stays');
  drag(host, bar('quick'), 250, 290);
  const [, , { start, end }] = log.filter(([name]) => name === 'onChange').at(-1);
  assert.deepEqual([start.getDate(), start.getHours(), start.getMinutes(), end.getDate(), end.getHours(), end.getMinutes()], [4, 9, 0, 4, 9, 30], 'two days on, at nine, for half an hour');
  drag(host, bar('ship'), 340, 380);
  assert.deepEqual(times(log), ['ship', '2026-10-08', null], 'a milestone is dragged whole, and reports no end');
});

/* Held on `a304bfb` as well: Escape and a short drag changed nothing there either. */
test('cancel: Escape puts a bar in hand back and reports nothing; a drag with no day in it reports nothing', (t) => {
  const { host, bar, log } = timelineOf(t);
  drag(host, bar('draft'), 200, 240, { release: false });
  assert.equal(bar('draft').style.getPropertyValue('--timeline-x'), '180px', 'the bar followed the pointer');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(bar('draft').style.getPropertyValue('--timeline-x'), '140px', 'and Escape put it back');
  drag(host, bar('draft'), 200, 207);
  assert.deepEqual(log.filter(([name]) => name === 'onChange'), [], 'seven pixels are less than half a day');
});
