/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Where the reader is on the sheet, for a host that keeps it across mounts:
 * `visibleStart()` says the moment at the left edge of the track and how far
 * the rows are scrolled down; `scrollToDate(date, { top })` puts the sheet
 * there - by date, so it is the same place on an axis that starts elsewhere -
 * once: an ask made before the sheet is drawn waits for its first draw, and
 * the reader's scrolling after it is never fought. The axis reaches the date.
 *
 * A sheet with no box (its host hidden) is not drawn: an update waits, and is
 * drawn when the width returns, with the date and the rows that were at its
 * left edge and top before it went - a browser gives a hidden sheet back at
 * its start, and the axis may start elsewhere by then.
 *
 * Every case was written before the code and run on the timeline as it stood
 * at `b954700`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimeline } from '../../ui/index.js';
import { mount } from '../helpers/ui.js';
import { ITEMS, NOW } from './ui-timeline-fixture.js';

const MODEL = { label: 'Plan', scale: 'week', now: NOW, locale: 'en-US', items: ITEMS };
const EARLY = { id: 'early', title: 'Early', start: '2026-06-01', end: '2026-06-03' };
const MINUTE_MS = 60000;

/** A timeline 700px wide whose resize observer the case fires, its sheet's box the case's to give or take. */
function placed(t) {
  const original = window.ResizeObserver;
  const watching = [];
  window.ResizeObserver = class { constructor(callback) { this.callback = callback; watching.push(this); } observe() {} disconnect() { watching.splice(watching.indexOf(this), 1); } };
  t.after(() => { window.ResizeObserver = original; });
  const host = mount(t);
  const control = createTimeline(host, {});
  t.after(() => control.destroy());
  const sheet = host.querySelector('.cloudcanvas-ui-timeline-sheet');
  Object.defineProperty(sheet, 'clientWidth', { configurable: true, value: 700 });
  const boxed = (has) => { sheet.getClientRects = () => (has ? [{ width: 700 }] : []); };
  const scrolled = (left, top = sheet.scrollTop) => { Object.assign(sheet, { scrollLeft: left, scrollTop: top }); sheet.dispatchEvent(new Event('scroll')); };
  const bar = (id) => host.querySelector(`.cloudcanvas-ui-timeline-bar[data-ui-id="${id}"]`);
  return { control, sheet, boxed, scrolled, bar, fire: () => watching.forEach((one) => one.callback([])) };
}

const same = (date, expected, message) => assert.ok(Math.abs(date.getTime() - new Date(expected).getTime()) < MINUTE_MS,
  `${message}: ${date.toISOString()} for ${new Date(expected).toISOString()}`);

/*
 * Seen to fail on the timeline of `b954700`, which had neither:
 *
 *   ✖ place: visibleStart says the moment at the track's left edge and the rows' offset; scrollToDate puts the sheet there
 *     TypeError [Error]: control.scrollToDate is not a function
 */
test('place: visibleStart says the moment at the track\'s left edge and the rows\' offset; scrollToDate puts the sheet there', (t) => {
  const { control, sheet } = placed(t);
  control.update(MODEL);
  control.scrollToDate('2026-10-05', { top: 30 });
  const place = control.visibleStart();
  same(place.date, '2026-10-05T00:00', 'the day asked for is at the left edge');
  assert.deepEqual([place.top, sheet.scrollTop], [30, 30], 'and the rows are where they were asked to be');
  control.scrollToDate(new Date('2025-12-01T00:00'));
  same(control.visibleStart().date, '2025-12-01T00:00', 'the axis reaches a day far before the items');
});

/*
 * Seen to fail on the timeline of `b954700`:
 *
 *   ✖ place: an ask made before the first draw is done at it, once; the reader's scroll after it stands
 *     TypeError [Error]: control.visibleStart is not a function
 */
test('place: an ask made before the first draw is done at it, once; the reader\'s scroll after it stands', (t) => {
  const { control, sheet, scrolled } = placed(t);
  assert.equal(control.visibleStart(), null, 'nothing is drawn: no place yet');
  control.scrollToDate('2026-11-02');
  same(control.visibleStart().date, '2026-11-02T00:00', 'what it will show is what was asked');
  control.update(MODEL);
  same(control.visibleStart().date, '2026-11-02T00:00', 'not where the items begin');
  scrolled(sheet.scrollLeft - 200);
  const theirs = sheet.scrollLeft;
  control.update(MODEL);
  assert.equal(sheet.scrollLeft, theirs, 'the ask is spent: the next update leaves the reader\'s scroll');
});

/*
 * Seen to fail on the timeline of `b954700`, which drew every update, hidden or not, at a scroll a hidden sheet reads as 0:
 *
 *   ✖ place: a sheet with no box is not drawn; when its width returns it is drawn, at the date and rows it showed before it went
 *     TypeError [Error]: control.visibleStart is not a function
 *
 * so the rest was MUTATION-PROVED on the new timeline. With a sheet with no box drawn all the same (`render`, timeline.js):
 *     AssertionError [ERR_ASSERTION]: nothing is drawn while the sheet has no box
 *       actual: false,
 *       expected: true,
 * and with the place it showed before not put back (`placeToKeep`, place.js):
 *     AssertionError [ERR_ASSERTION]: at the date that was at the left edge, on an axis that now starts in June: 2026-08-20T05:00:00.000Z for 2026-10-06T05:00:00.000Z
 */
test('place: a sheet with no box is not drawn; when its width returns it is drawn, at the date and rows it showed before it went', (t) => {
  const { control, sheet, boxed, scrolled, bar, fire } = placed(t);
  boxed(true);
  control.update(MODEL);
  scrolled(sheet.scrollLeft + 300, 24);
  const before = control.visibleStart();
  boxed(false);
  Object.assign(sheet, { scrollLeft: 0, scrollTop: 0 });
  control.update({ ...MODEL, items: [...ITEMS, EARLY] });
  assert.equal(bar('early') === null, true, 'nothing is drawn while the sheet has no box');
  same(control.visibleStart().date, before.date, 'it still says the place it will show again');
  boxed(true);
  fire();
  assert.equal(bar('early') !== null, true, 'the width is back: the update is drawn');
  same(control.visibleStart().date, before.date, 'at the date that was at the left edge, on an axis that now starts in June');
  assert.equal(sheet.scrollTop, 24, 'and the rows where they were');
});
