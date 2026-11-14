/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A bar's name tells a reader the last day it covers. Its end is exclusive (the
 * midnight after the last day, as the kit reports it), and the name used to
 * read it as it is: "Oct 1 to Oct 4" for a bar that covers the 1st to the 3rd.
 * What is reported stays exclusive.
 *
 * Every case was written before the code and run on the timeline as it stood at
 * `5cd653a`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { dayKey } from '../../ui/index.js';
import { key } from '../helpers/ui.js';
import { timelineOf } from './ui-timeline-fixture.js';

const nameOf = (bar) => bar.getAttribute('aria-label');

const DAYS = [
  { id: 'many', title: 'Many', start: '2026-09-28', end: '2026-10-02' },
  { id: 'one', title: 'One', start: '2026-10-02', end: '2026-10-03' },
  { id: 'timed', title: 'Timed', start: '2026-10-02T09:00', end: '2026-10-02T09:30' },
  { id: 'across', title: 'Across', start: '2026-09-30T10:00', end: '2026-10-02T15:00' },
  { id: 'late', title: 'Late', start: '2026-10-01', end: '2026-10-04T00:00' },
  { id: 'night', title: 'Night', start: '2026-10-02T22:00', end: '2026-10-03T00:00' },
  { id: 'point', title: 'Point', start: '2026-10-06', milestone: true }
];

/*
 * Seen to fail on the timeline of `5cd653a`:
 *
 *   ✖ days: a bar's name says the last day it covers, not the midnight its end falls on
 *     AssertionError [ERR_ASSERTION]: four days: the 28th to the 1st
 *       actual: 'Many, Sep 28 to Oct 2',
 *       expected: 'Many, Sep 28 to Oct 1',
 */
test('days: a bar\'s name says the last day it covers, not the midnight its end falls on', (t) => {
  const { bar } = timelineOf(t, DAYS);
  assert.equal(nameOf(bar('many')), 'Many, Sep 28 to Oct 1', 'four days: the 28th to the 1st');
  assert.equal(nameOf(bar('one')), 'One, Oct 2', 'one whole day is that day, not "Oct 2 to Oct 3"');
  assert.equal(nameOf(bar('timed')), 'Timed, Oct 2, shown wider than it lasts', 'half an hour is within its day');
  assert.equal(nameOf(bar('across')), 'Across, Sep 30 to Oct 2', 'an end during a day covers that day');
  assert.equal(nameOf(bar('late')), 'Late, Oct 1 to Oct 3', 'an end at midnight does not');
  assert.equal(nameOf(bar('night')), 'Night, Oct 2, shown wider than it lasts', 'a span that ends at midnight stays on the day it began (two hours: drawn wider)');
  assert.equal(nameOf(bar('point')), 'Point, Oct 6, milestone', 'a milestone has the one day');
  assert.equal(bar('many').getAttribute('title'), nameOf(bar('many')), 'and so does the tooltip');
});

/*
 * Seen to fail on the timeline of `5cd653a`:
 *
 *   ✖ days: what a move reports stays exclusive, and what it announces is the days it covers
 *     AssertionError [ERR_ASSERTION]: announced: the days it now covers
 *       actual: 'Moved: Many, Sep 29 to Oct 3.',
 *       expected: /Moved: Many, Sep 29 to Oct 2\./,
 *       (the reported end - Oct 3, the midnight after the last day - was already right and is held by the case)
 */
test('days: what a move reports stays exclusive, and what it announces is the days it covers', (t) => {
  const { host, bar, log } = timelineOf(t, DAYS, ['onChange']);
  bar('many').focus();
  key(bar('many'), 'ArrowRight', { altKey: true });
  const [, id, { start, end }] = log.findLast(([name]) => name === 'onChange');
  assert.deepEqual([id, dayKey(start), dayKey(end)], ['many', '2026-09-29', '2026-10-03'], 'reported: the end is the midnight after the last day');
  assert.match(host.querySelector('[role="status"]').textContent, /Moved: Many, Sep 29 to Oct 2\./, 'announced: the days it now covers');
});
