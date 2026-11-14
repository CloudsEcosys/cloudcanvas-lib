/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A bar shorter than it takes to see or to grab - a timed item of half an
 * hour, a day on the month scale - is drawn at a minimum width (1.25rem) while
 * the dates it reports stay its own, says in its name that it is drawn wider
 * than it lasts, and under a finger has a 44px grab area made of padding round
 * the drawn bar: the handles at its ends give way to its body.
 *
 * Every case was written before the code and run on the timeline as it stood at
 * `30033e5`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { COARSE, declared } from './ui-sheet.js';
import { barOf, domainFor, normalizeItems } from '../../ui/timeline/model.js';
import { ITEMS, NOW, timelineOf } from './ui-timeline-fixture.js';

const width = (bar) => bar.style.getPropertyValue('--timeline-w');
const BAR = '.cloudcanvas-ui-timeline-bar';
const ENDS = ':is(.cloudcanvas-ui-timeline-handle, .cloudcanvas-ui-timeline-handle-start)';
const FINGER = 'var(--cc-control-min-coarse, 44px)';

/*
 * Seen to fail on the timeline of `30033e5`, which drew a half hour 4px wide:
 *
 *   ✖ short: a bar shorter than 1.25rem is drawn that wide at every scale, says so in its name, and a bar that is long enough does not
 *     AssertionError [ERR_ASSERTION]: half an hour at the day scale is drawn 20px wide
 *       actual: '4px',
 *       expected: '20px',
 *
 * And in Chromium (kit page, week scale): the half-hour bar's box was 5px wide, 24px tall; under a coarse pointer a press
 * on its centre landed on its end handle (the two 44px zones of its handles covered all of it), and 12px either side
 * landed on a handle too, so the bar could not be moved by its body at all.
 */
test('short: a bar shorter than 1.25rem is drawn that wide at every scale, says so in its name, and a bar that is long enough does not', (t) => {
  const { bar, draw } = timelineOf(t);
  for (const scale of ['day', 'week', 'month']) {
    draw(ITEMS, { scale });
    assert.equal(width(bar('quick')), '20px', `half an hour at the ${scale} scale is drawn 20px wide`);
    assert.match(bar('quick').getAttribute('aria-label'), /wider than it lasts/, `and says so: ${bar('quick').getAttribute('aria-label')}`);
  }
  draw(ITEMS, { scale: 'week' });
  assert.equal(width(bar('draft')), '80px', 'four days at 20px a day are drawn as they are');
  assert.doesNotMatch(bar('draft').getAttribute('aria-label'), /wider than it lasts/);
  assert.match(bar('quick').getAttribute('title'), /wider than it lasts/, 'the tooltip is the name');
});

/*
 * Seen to fail on the timeline of `30033e5`:
 *
 *   ✖ short: a one-day bar is its own length at the week scale and clamped at the month scale; a milestone is never clamped
 *     AssertionError [ERR_ASSERTION]: a day at 5px is drawn at the minimum, and the bar says it is clamped
 *       actual: { left: 35, width: 5, point: false },
 *       expected: { left: 35, width: 20, point: false, clamped: true },
 */
test('short: a one-day bar is its own length at the week scale and clamped at the month scale; a milestone is never clamped', () => {
  const items = normalizeItems([{ id: 'a', start: '2026-09-28', end: '2026-09-29' }, { id: 'm', start: '2026-09-30', milestone: true }]);
  const domain = domainFor(items, 'week', new Date(NOW));
  assert.deepEqual(barOf(items[0], domain, 'week'), { left: 140, width: 20, point: false }, 'a day at the week scale is 20px: not clamped, so nothing says so');
  assert.deepEqual(barOf(items[0], domain, 'month'), { left: 35, width: 20, point: false, clamped: true }, 'a day at 5px is drawn at the minimum, and the bar says it is clamped');
  assert.equal(barOf(items[1], domain, 'month').clamped, undefined, 'a milestone has no length to clamp');
});

/*
 * Seen to fail on the timeline of `30033e5`, whose sheet gave a bar 4px:
 *
 *   ✖ short: the sheet draws a bar at least 1.25rem wide, and under a finger pads the hit zone round it, not the bar
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *       actual: '4px',
 *       expected: '1.25rem'
 */
test('short: the sheet draws a bar at least 1.25rem wide, and under a finger pads the hit zone round it, not the bar', () => {
  assert.equal(declared(BAR, 'min-width'), '1.25rem');
  const body = `${BAR}:not(.is-point)::after`;
  assert.deepEqual(['content', 'position', 'top', 'left', 'translate'].map((property) => declared(body, property, COARSE)), ['""', 'absolute', '50%', '50%', '-50% -50%'],
    'a pseudo-element centred on the bar');
  assert.deepEqual(['width', 'height'].map((property) => declared(body, property, COARSE)), Array(2).fill('max(100%, var(--target))'), 'as large as the bar and never less than a target each way');
  assert.equal(declared(body, 'z-index', COARSE), 'var(--target-under)', 'under what is drawn: the bar keeps its own look');
  assert.equal(declared(BAR, 'overflow', COARSE), 'visible', 'a bar that clipped itself would clip its own target');
  assert.equal(declared(`${ENDS}::after`, 'width', COARSE), `min(${FINGER}, calc(var(--timeline-w) / 3))`, 'a bar\'s ends reach out a third of the bar at most, so its body keeps a third');
  assert.equal(declared(`${BAR}.is-short ${ENDS}`, 'pointer-events', COARSE), 'none', 'a bar too short for three targets is one: the ends give way to the body');
});
