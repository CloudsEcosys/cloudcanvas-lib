/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Making a span by dragging across the empty part of a row: a band follows the
 * pointer, snapped to whole days, and the release reports
 * `onCreate({groupId, start, end})` - end exclusive, the span a day at least -
 * for the group whose row it was. Nothing is made by the kit; Escape drops the
 * band and reports nothing.
 *
 * Every case was written before the code and run on the timeline as it stood
 * at `a304bfb`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { dayKey } from '../../ui/index.js';
import { pointer, stubBox } from '../helpers/ui.js';
import { timelineOf } from './ui-timeline-fixture.js';

const CALLBACKS = ['onActivate', 'onChange', 'onCreate'];
const created = (log) => log.filter(([name]) => name === 'onCreate').map(([, span]) => [span.groupId, dayKey(span.start), dayKey(span.end)]);

/** The track of an item's row, 4000px wide from the page's left edge, so a pointer's x is its offset. */
function trackOf(host, id) {
  return stubBox(host.querySelector(`[data-row-id="${id}"] .cloudcanvas-ui-timeline-track`), { left: 0, top: 0, width: 4000, height: 36 });
}

function sweep(host, track, from, to, { release = true } = {}) {
  const sheet = host.querySelector('.cloudcanvas-ui-timeline-sheet');
  pointer(track, 'pointerdown', { clientX: from, clientY: 10 });
  pointer(sheet, 'pointermove', { clientX: to, clientY: 12 });
  if (release) pointer(sheet, 'pointerup', { clientX: to, clientY: 12 });
}

/*
 * Seen to fail on the timeline of `a304bfb`, which made nothing of a drag on a row:
 *
 *   ✖ create: a drag across the empty part of a row draws a band of whole days and reports the span and the row's group on release
 *     AssertionError [ERR_ASSERTION]: a band follows the pointer
 *       actual: null,
 *       expected: true,
 */
test('create: a drag across the empty part of a row draws a band of whole days and reports the span and the row\'s group on release', (t) => {
  const { host, log } = timelineOf(t, undefined, CALLBACKS);
  const track = trackOf(host, 'draft');
  sweep(host, track, 150, 215, { release: false });
  const band = track.querySelector('.cloudcanvas-ui-timeline-draft');
  assert.ok(band, 'a band follows the pointer');
  assert.deepEqual([band.style.getPropertyValue('--timeline-x'), band.style.getPropertyValue('--timeline-w')], ['140px', '80px'], 'from the day the press was on to the day the pointer is on, both whole');
  assert.equal(band.textContent, 'Sep 28 – Oct 1', 'and says the days it covers');
  assert.deepEqual(created(log), [], 'nothing is made while it is drawn');
  pointer(host.querySelector('.cloudcanvas-ui-timeline-sheet'), 'pointerup', { clientX: 215, clientY: 12 });
  assert.deepEqual(created(log), [['book', '2026-09-28', '2026-10-02']], 'the end is the day after the last: exclusive, as a move reports it');
  assert.equal(track.querySelector('.cloudcanvas-ui-timeline-draft'), null, 'the band goes with the drag');
  assert.deepEqual(log.filter(([name]) => name === 'onActivate' || name === 'onChange'), [], 'a drag on a row opens and moves nothing');
});

/*
 * Seen to fail on the timeline of `a304bfb`:
 *
 *   ✖ create: a span runs either way from the press, is a day at least, and an ungrouped row says no group
 *     AssertionError [ERR_ASSERTION]: dragged to the left of the press: the days of 145 to 195, three
 *       actual: [],
 *       expected: [ [ 'book', '2026-09-28', '2026-10-01' ] ],
 */
test('create: a span runs either way from the press, is a day at least, and an ungrouped row says no group', (t) => {
  const { host, log } = timelineOf(t, undefined, CALLBACKS);
  sweep(host, trackOf(host, 'draft'), 195, 145);
  assert.deepEqual(created(log), [['book', '2026-09-28', '2026-10-01']], 'dragged to the left of the press: the days of 145 to 195, three');
  sweep(host, trackOf(host, 'draft'), 150, 155);
  assert.deepEqual(created(log).at(-1), ['book', '2026-09-28', '2026-09-29'], 'a few pixels are one day, the day they are on');
  sweep(host, trackOf(host, 'loose'), 300, 330);
  assert.deepEqual(created(log).at(-1), [null, '2026-10-06', '2026-10-08'], 'a row with no group says so');
});

/*
 * Seen to fail on the timeline of `a304bfb`:
 *
 *   ✖ create: Escape drops the band and reports nothing; a press on a bar moves it and one on its title opens it, neither draws a band; a host that took no onCreate draws none
 *     TypeError [Error]: Cannot read properties of null (reading 'dispatchEvent')
 *       (the title beside a bar was not drawn then either: the case reaches it only on the new timeline)
 */
test('create: Escape drops the band and reports nothing; a press on a bar moves it and one on its title opens it, neither draws a band; a host that took no onCreate draws none', (t) => {
  const { host, log, bar } = timelineOf(t, undefined, CALLBACKS);
  const track = trackOf(host, 'draft');
  sweep(host, track, 150, 215, { release: false });
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(track.querySelector('.cloudcanvas-ui-timeline-draft'), null, 'Escape drops the band');
  assert.deepEqual(created(log), []);
  sweep(host, bar('draft'), 200, 260, { release: false });
  assert.equal(track.querySelector('.cloudcanvas-ui-timeline-draft'), null, 'a press on a bar moves the bar');
  pointer(host.querySelector('.cloudcanvas-ui-timeline-sheet'), 'pointerup', { clientX: 260, clientY: 12 });
  const outside = host.querySelector('[data-row-id="ship"] .cloudcanvas-ui-timeline-outside');
  sweep(host, outside, 340, 400, { release: false });
  assert.equal(host.querySelector('.cloudcanvas-ui-timeline-draft'), null, 'a press on a title is no empty row');
  const bare = timelineOf(t, undefined, ['onChange']);
  sweep(bare.host, trackOf(bare.host, 'draft'), 150, 215, { release: false });
  assert.equal(bare.host.querySelector('.cloudcanvas-ui-timeline-draft'), null, 'a host that took no onCreate draws none');
  assert.equal(bare.root.hasAttribute('data-can-create'), false);
});

/*
 * Seen to fail on the timeline of `a304bfb`:
 *
 *   ✖ create: an update while the band is drawn leaves it, and the sheet is redrawn when the drag ends
 *     AssertionError [ERR_ASSERTION]: a host's update does not take the band from under the pointer
 *       actual: null,
 *       expected: true,
 */
test('create: an update while the band is drawn leaves it, and the sheet is redrawn when the drag ends', (t) => {
  const { host, draw } = timelineOf(t, undefined, CALLBACKS);
  const track = trackOf(host, 'draft');
  sweep(host, track, 150, 215, { release: false });
  draw([...[{ id: 'late', title: 'Late', start: '2026-10-09' }]]);
  assert.ok(track.querySelector('.cloudcanvas-ui-timeline-draft'), 'a host\'s update does not take the band from under the pointer');
  pointer(host.querySelector('.cloudcanvas-ui-timeline-sheet'), 'pointerup', { clientX: 215, clientY: 12 });
  assert.ok(host.querySelector('[data-row-id="late"]'), 'and what it said is drawn when the drag ends');
});

/*
 * K8, written before the code and run on the timeline of `8f8720e`: a dragged band wrote its dates as its own text, as the keyboard's did.
 *
 *   ✖ create: the dragged band's words are the tag the keyboard's band has, one that is written again as the pointer moves
 *     AssertionError [ERR_ASSERTION]: the band's dates are in a tag of their own
 *       actual: null,
 *       expected: true,
 */
test('create: the dragged band\'s words are the tag the keyboard\'s band has, one that is written again as the pointer moves', (t) => {
  const { host } = timelineOf(t, undefined, CALLBACKS);
  const track = trackOf(host, 'draft');
  sweep(host, track, 150, 215, { release: false });
  const tag = track.querySelector('.cloudcanvas-ui-timeline-draft > .cloudcanvas-ui-timeline-draft-words');
  assert.ok(tag, 'the band\'s dates are in a tag of their own');
  assert.equal(tag.textContent, 'Sep 28 – Oct 1');
  pointer(host.querySelector('.cloudcanvas-ui-timeline-sheet'), 'pointermove', { clientX: 260, clientY: 12 });
  assert.equal(track.querySelector('.cloudcanvas-ui-timeline-draft-words'), tag, 'the same tag');
  assert.equal(tag.textContent, 'Sep 28 – Oct 4', 'the days from the press to the pointer, at 260px');
});

