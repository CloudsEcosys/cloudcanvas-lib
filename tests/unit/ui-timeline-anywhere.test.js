/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A span can be drawn ANYWHERE the timeline shows a row: across the empty part
 * of a bar's row wherever the bar is, across a group's heading - folded or not -
 * and as far along the date axis as the sheet is wide or has been scrolled.
 * The axis used to end a week past the last item, and a heading drew no track,
 * so a drag had to start near an existing bar.
 *
 * Every case was written before the code and run on the timeline as it stood at
 * `ba0f72d`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { dayKey } from '../../ui/index.js';
import { pointer, stubBox } from '../helpers/ui.js';
import { ITEMS, timelineOf } from './ui-timeline-fixture.js';

/** A bar's left edge (px) on the axis. */
const xOf = (bar) => Number.parseFloat(bar.style.getPropertyValue('--timeline-x'));

const CALLBACKS = ['onActivate', 'onChange', 'onCreate', 'onToggleGroup'];
const FOLDED = { id: 'folded', title: 'Folded child', start: '2026-10-03', end: '2026-10-05', group: { id: 'parent', label: 'Folded parent', collapsed: true } };
const created = (log) => log.filter(([name]) => name === 'onCreate').map(([, span]) => [span.groupId, dayKey(span.start), dayKey(span.end)]);

/** The sheet as a browser would lay it out: `clientWidth` px wide (the test DOM has no layout). */
function widen(host, width) {
  const sheet = host.querySelector('.cloudcanvas-ui-timeline-sheet');
  Object.defineProperty(sheet, 'clientWidth', { configurable: true, value: width });
  return sheet;
}

const trackWidth = (host) => Number.parseFloat(host.querySelector('.cloudcanvas-ui-timeline-grid').style.getPropertyValue('--timeline-width'));
const box = (track) => stubBox(track, { left: 0, top: 0, width: 4000, height: 36 });

function sweep(host, track, from, to, { release = true } = {}) {
  const sheet = host.querySelector('.cloudcanvas-ui-timeline-sheet');
  pointer(track, 'pointerdown', { clientX: from, clientY: 10 });
  pointer(sheet, 'pointermove', { clientX: to, clientY: 12 });
  if (release) pointer(sheet, 'pointerup', { clientX: to, clientY: 12 });
}

/*
 * Seen to fail on the timeline of `ba0f72d`, which drew a heading with no track:
 *
 *   ✖ anywhere: a drag across a group heading draws a band and reports the span for that group, folded or not
 *     TypeError [Error]: Cannot set properties of null (setting 'getBoundingClientRect')
 *       (the heading has no `.cloudcanvas-ui-timeline-track` to press on)
 *
 * And in Chromium (1440px, week scale, kit page with four bars): a drag across the heading "Writing" and across a
 * folded heading made no band and no onCreate; the same drag on a row's track made one.
 */
test('anywhere: a drag across a group heading draws a band and reports the span for that group, folded or not', (t) => {
  const { host, log } = timelineOf(t, [...ITEMS, FOLDED], ['onActivate', 'onChange', 'onCreate', 'onToggleGroup']);
  const heading = (name) => Array.from(host.querySelectorAll('.cloudcanvas-ui-timeline-group')).find((node) => node.textContent.includes(name));
  const track = (name) => box(heading(name).querySelector('.cloudcanvas-ui-timeline-track'));
  sweep(host, track('The book'), 150, 215, { release: false });
  const band = heading('The book').querySelector('.cloudcanvas-ui-timeline-draft');
  assert.ok(band, 'a band follows the pointer across a heading');
  assert.equal(band.textContent, 'Sep 28 – Oct 1');
  pointer(host.querySelector('.cloudcanvas-ui-timeline-sheet'), 'pointerup', { clientX: 215, clientY: 12 });
  assert.deepEqual(created(log), [['book', '2026-09-28', '2026-10-02']], 'the heading of a group that stands for an item says which');
  sweep(host, track('Release'), 300, 330);
  assert.deepEqual(created(log).at(-1), [null, '2026-10-06', '2026-10-08'], 'a heading with a bare name says no group');
  assert.equal(host.querySelector('[data-row-id="folded"]'), null, 'the folded group draws no row');
  sweep(host, track('Folded parent'), 200, 260);
  assert.deepEqual(created(log).at(-1), ['parent', '2026-10-01', '2026-10-05'], 'a folded group, a heading with nothing under it, takes a span too');
  sweep(host, track('The book'), 150, 215, { release: false });
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(host.querySelector('.cloudcanvas-ui-timeline-draft'), null, 'Escape drops the band');
  assert.equal(created(log).length, 3, 'and reports nothing');
});

/*
 * Seen to fail on the timeline of `ba0f72d`, whose axis ended a week past the last item:
 *
 *   ✖ anywhere: the axis reaches a sheet's width beyond the items on each side, and the sheet starts where the items do
 *     AssertionError [ERR_ASSERTION]: the track is 480px wide
 *       actual: false,
 *       expected: true,
 *
 * And in Chromium (1440px sheet, 1422px wide): the tracks were 460px wide from x=185; a drag from x=800 to 900 on a
 * row, to the right of the track, made no band and no onCreate.
 */
test('anywhere: the axis reaches a sheet\'s width beyond the items on each side, and the sheet starts where the items do', (t) => {
  const { host, draw, bar } = timelineOf(t, undefined, CALLBACKS);
  const sheet = widen(host, 1400);
  draw();
  // 24 days of items and padding are 480px; a 1400px sheet past its narrowest (64px) gutter holds 1336px, 67 days, on each side.
  assert.ok(trackWidth(host) >= 480 + 2 * 1336, `the track is ${trackWidth(host)}px wide`);
  assert.equal(sheet.scrollLeft + 7 * 20, xOf(bar('draft')), 'the sheet is scrolled to where the items begin, a week of padding in');
  const ticks = Array.from(sheet.querySelectorAll('.cloudcanvas-ui-timeline-tick')).map((tick) => Number.parseFloat(tick.style.getPropertyValue('--timeline-x')));
  assert.ok(Math.min(...ticks) < 67 * 20 && Math.max(...ticks) > trackWidth(host) - 2 * 7 * 20 - 100, 'and the axis has its dates before and after');
});

/*
 * Seen to fail on the timeline of `ba0f72d`:
 *
 *   ✖ anywhere: scrolling near an edge of the axis extends it, and the reader keeps the dates in view
 *     AssertionError [ERR_ASSERTION]: near the end the axis grows there, by a sheet's width: 480px then 480px
 *       actual: false,
 *       expected: true,
 */
test('anywhere: scrolling near an edge of the axis extends it, and the reader keeps the dates in view', (t) => {
  const { host, draw, bar } = timelineOf(t, undefined, CALLBACKS);
  const sheet = widen(host, 1400);
  draw();
  const scrolled = (left) => { sheet.scrollLeft = left; sheet.dispatchEvent(new Event('scroll')); };
  const width = trackWidth(host);
  scrolled(width - 1240 - 100);
  assert.ok(trackWidth(host) > width + 1300, `near the end the axis grows there, by a sheet's width: ${width}px then ${trackWidth(host)}px`);
  const [grown, at] = [trackWidth(host), xOf(bar('draft'))];
  scrolled(100);
  assert.ok(Math.abs(trackWidth(host) - (grown + 1340)) < 1, 'near the start it grows before the first day');
  assert.equal(xOf(bar('draft')), at + 1340, 'so the bars are 67 days further right');
  assert.equal(sheet.scrollLeft, 100 + 1340, 'and the sheet is scrolled by as much: the same dates stay under the reader');
  const middle = trackWidth(host);
  scrolled(2000);
  assert.equal(trackWidth(host), middle, 'away from both ends nothing is added');
});

/*
 * Seen to fail on the timeline of `ba0f72d`, which let a band run past the track's end:
 *
 *   ✖ anywhere: the axis stays as it is while a band is drawn, and the band stops at the last day the track draws
 *     AssertionError [ERR_ASSERTION]: the span ends on the last day the track draws
 *       actual: [ [ 'book', '2026-11-09', '2026-11-15' ] ],
 *       expected: [ [ 'book', '2026-09-28', '2026-12-01' ] ],
 *       (the press at 1090px was on a day past the end of a 480px axis, and the band ran on past it)
 */
test('anywhere: the axis stays as it is while a band is drawn, and the band stops at the last day the track draws', (t) => {
  const { host, draw, log } = timelineOf(t, undefined, CALLBACKS);
  const sheet = widen(host, 1000);
  draw();
  const track = box(host.querySelector('[data-row-id="draft"] .cloudcanvas-ui-timeline-track'));
  const width = trackWidth(host);
  // 47 days of margin each side: the axis runs Aug 5 to Dec 1, and Sep 28 is the 54th day, from 1080px.
  sweep(host, track, 1090, 1400, { release: false });
  sheet.scrollLeft = width;
  sheet.dispatchEvent(new Event('scroll'));
  assert.equal(trackWidth(host), width, 'nothing is redrawn under the pointer');
  pointer(sheet, 'pointermove', { clientX: width + 500, clientY: 12 });
  pointer(sheet, 'pointerup', { clientX: width + 500, clientY: 12 });
  assert.deepEqual(created(log), [['book', '2026-09-28', '2026-12-01']], 'the span ends on the last day the track draws');
});

/*
 * Found in a browser, in Momentum: a bar pressed opens the item pane beside the sheet, which narrows to a third of its width, and the
 * window it showed (Oct 4 to Nov 22) became another (Nov 8 to Nov 21). The axis' margin is a sheet's width of days, so it shrank with
 * the sheet and the axis' start moved 36 days on; the kit kept the date at the left edge, as it should, and the host's own put-back of
 * the pixel offset it had read before the layout changed (the shell's) undid that. The margin keeps the widest the sheet has been, so
 * a sheet that narrows moves nothing and a pixel offset read before is still right. Seen to fail on the timeline of `98d52d1`:
 *
 *   ✖ anywhere: a sheet that narrows keeps its axis, so the dates under the reader and the pixel offset that shows them stay as they were
 *     AssertionError [ERR_ASSERTION]: the axis starts where it did
 *       actual: 680,
 *       expected: 1480,
 */
test('anywhere: a sheet that narrows keeps its axis, so the dates under the reader and the pixel offset that shows them stay as they were', (t) => {
  const { host, draw, bar } = timelineOf(t, undefined, CALLBACKS);
  const sheet = widen(host, 1400);
  draw();
  sheet.scrollLeft = 900;
  const [width, at] = [trackWidth(host), xOf(bar('draft'))];
  widen(host, 600);
  draw();
  assert.equal(xOf(bar('draft')), at, 'the axis starts where it did');
  assert.equal(sheet.scrollLeft, 900, 'so the sheet is where it was');
  assert.equal(trackWidth(host), width, 'and no room is given back');
  widen(host, 1800);
  draw();
  assert.ok(trackWidth(host) > width, 'a sheet wider than any before adds room, as it did');
});
