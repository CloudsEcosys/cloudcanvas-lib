/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The timeline says which days are on screen: `onWindow({from, to})`, the first
 * and the last day (day keys, both on screen) that the sheet shows, reported
 * once the sheet has been drawn and again - after it settles, about 150ms -
 * when a scroll, a zoom, a change of scale or a resize moves them, so a host
 * can fetch the range being looked at. A host that took no `onWindow` is told
 * nothing and has nothing running for it.
 *
 * Every case was written before the code and run on the timeline as it stood at
 * `df07671`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimeline } from '../../ui/index.js';
import { mount } from '../helpers/ui.js';
import { ITEMS, NOW } from './ui-timeline-fixture.js';

const MODEL = { label: 'Plan', scale: 'week', now: NOW, locale: 'en-US', items: ITEMS };
const SETTLE_MS = 150;

/** A sheet `width` px wide, as a browser would lay it out: the test DOM has none. */
function sized(sheet, width) {
  Object.defineProperty(sheet, 'clientWidth', { configurable: true, value: width });
}

/** A resize observer the test fires by hand, and put back after the test. */
function fakeObserver(t) {
  const original = window.ResizeObserver;
  const watching = [];
  window.ResizeObserver = class { constructor(callback) { this.callback = callback; watching.push(this); } observe() {} disconnect() { watching.splice(watching.indexOf(this), 1); } };
  t.after(() => { window.ResizeObserver = original; });
  return { fire: () => watching.forEach((observer) => observer.callback([])), watching };
}

/** A timeline whose sheet is `width` wide before it is first drawn, reporting each window as `[from, to]`. */
function windowed(t, width = 700, callbacks = {}) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const host = mount(t);
  const windows = [];
  const control = createTimeline(host, { onWindow: ({ from, to }) => windows.push([from, to]), ...callbacks });
  const sheet = host.querySelector('.cloudcanvas-ui-timeline-sheet');
  sized(sheet, width);
  control.update(MODEL);
  t.after(() => control.destroy());
  return { host, control, sheet, windows, settle: (ms = SETTLE_MS) => t.mock.timers.tick(ms) };
}

/*
 * Seen to fail on the timeline of `df07671`, which took no onWindow:
 *
 *   ✖ window: the days on screen are reported once the sheet is drawn, both ends on screen
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
 *       actual: [],
 *       expected: [ [ '2026-09-21', '2026-10-17' ] ],
 */
test('window: the days on screen are reported once the sheet is drawn, both ends on screen', (t) => {
  const { windows, settle } = windowed(t);
  assert.deepEqual(windows, [], 'not while the sheet is being drawn: the host may be in the middle of its own update');
  settle(0);
  // 700px sheet, 160px gutter (the test DOM measures none): 540px, 27 days of 20px, from the day the items begin on.
  assert.deepEqual(windows, [['2026-09-21', '2026-10-17']]);
  settle(1000);
  assert.equal(windows.length, 1, 'once');
});

/*
 * Seen to fail on the timeline of `df07671`:
 *
 *   ✖ window: a scroll, a zoom and a resize report after they settle, once, and only if the days changed
 *     AssertionError [ERR_ASSERTION]: not before the scroll has settled
 *       actual: 0,
 *       expected: 1,
 *       (nothing was reported on the first draw either, so there was no first report to be one of)
 */
test('window: a scroll, a zoom and a resize report after they settle, once, and only if the days changed', (t) => {
  const observer = fakeObserver(t);
  const { sheet, windows, host, settle } = windowed(t);
  settle(0);
  sheet.scrollLeft = 640 + 100;
  sheet.dispatchEvent(new Event('scroll'));
  settle(SETTLE_MS - 1);
  assert.equal(windows.length, 1, 'not before the scroll has settled');
  sheet.scrollLeft = 640 + 200; // ten days from where the items begin
  sheet.dispatchEvent(new Event('scroll'));
  settle(SETTLE_MS - 1);
  assert.equal(windows.length, 1, 'a scroll still going on pushes the report back');
  settle(1);
  assert.deepEqual(windows.slice(1), [['2026-10-01', '2026-10-27']], 'one report for the whole scroll: ten days later, both ends');
  sheet.dispatchEvent(new Event('scroll'));
  settle(SETTLE_MS);
  assert.equal(windows.length, 2, 'a scroll that moved nothing reports nothing');
  host.querySelector('[data-scale="day"]').click();
  settle(SETTLE_MS);
  assert.equal(windows.length, 3, 'a change of scale moves the window');
  assert.ok(windows[2][1] < windows[1][1], `at 64px a day fewer days fit: ${windows[2]}`);
  assert.equal(observer.watching.length, 1, 'the sheet is watched for its size');
  sized(sheet, 900);
  observer.fire();
  settle(SETTLE_MS);
  assert.equal(windows.length, 4, 'a resize moves it');
  assert.ok(windows[3][1] > windows[2][1]);
});

/*
 * Seen to fail on the timeline of `df07671`:
 *
 *   ✖ window: nothing is reported while the sheet has no width, and the first width reports; a host that asked nothing is not watched
 *     AssertionError [ERR_ASSERTION]: drawn at a width, the margins are there and the sheet starts where the items do
 *       actual: [],
 *       expected: [ [ '2026-09-21', '2026-10-17' ] ],
 */
test('window: nothing is reported while the sheet has no width, and the first width reports; a host that asked nothing is not watched', (t) => {
  const observer = fakeObserver(t);
  const { sheet, windows, settle } = windowed(t, 0);
  settle(1000);
  assert.deepEqual(windows, [], 'a hidden sheet shows no day');
  sized(sheet, 700);
  observer.fire();
  settle(SETTLE_MS);
  assert.deepEqual(windows, [['2026-09-21', '2026-10-17']], 'drawn at a width, the margins are there and the sheet starts where the items do');
  const quiet = mount(t);
  const control = createTimeline(quiet, {});
  control.update(MODEL);
  t.after(() => control.destroy());
  assert.equal(observer.watching.length, 2, 'each sheet is watched once, as the axis must be kept wide enough: onWindow adds no second watcher');
  settle(1000);
  assert.equal(windows.length, 1, 'and the one that asked is told nothing of the other');
});
