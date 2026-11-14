/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * What an event offers wherever it is met: the one line under the toolbar says
 * what the selection can do, from the callbacks the host took; the arrows and
 * a press move the selection; the menu key, Shift+F10 and a right-click ask
 * for the event's menu (`onMenu(id, {x, y})`); and a title cut in a chip is
 * whole in its tooltip and its name, with the times.
 *
 * Every case was written before the code and run on the calendar as it stood
 * at `a304bfb`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { key, stubBox } from '../helpers/ui.js';
import { calendarOf, calls } from './ui-calendar-fixture.js';

const ALL = ['onMove', 'onPick', 'onActivate', 'onMenu'];
const hintOf = (host) => host.querySelector('.cloudcanvas-ui-calendar-hint').textContent;

/*
 * Seen to fail on the calendar of `a304bfb`, which had no hint line:
 *
 *   ✖ hint: one line under the toolbar says what the selection can do, from the callbacks the host took, and follows the focus
 *     AssertionError [ERR_ASSERTION]: under the toolbar
 *       actual: 'cloudcanvas-ui-calendar-body',
 *       expected: 'cloudcanvas-ui-calendar-hint',
 */
test('hint: one line under the toolbar says what the selection can do, from the callbacks the host took, and follows the focus', (t) => {
  const { host, chip, draw } = calendarOf(t, { names: ALL });
  assert.equal(host.querySelector('.cloudcanvas-ui-calendar-toolbar').nextElementSibling.className, 'cloudcanvas-ui-calendar-hint', 'under the toolbar');
  // K7a added the keyboard's way to make a range to the line (`ui-calendar-draw.test.js`); the pointer's words stand as they were.
  // K11: ALL holds a menu, so every line also says where it is.
  const MORE = ' · Shift+F10 or right-click for more';
  assert.equal(hintOf(host), `Select an event to see what it can do · drag across empty slots to add one${MORE} · N on a day draws one`);
  chip('call').focus();
  assert.equal(hintOf(host), `Enter opens · drag to move · drag the bottom edge to resize · Alt+Shift+Up or Down resizes${MORE}`);
  chip('fixed').focus();
  assert.equal(hintOf(host), `Enter opens${MORE}`, 'a held event says only what remains');
  chip('trip').focus();
  assert.equal(hintOf(host), `Enter opens · drag to move${MORE}`, 'an all-day event is moved, not resized');
  draw({ view: 'month' });
  assert.equal(hintOf(host), `Enter opens · drag to move${MORE}`, 'and the month has no edge to drag');
  host.querySelector('.cloudcanvas-ui-calendar-cell').focus();
  const bare = calendarOf(t, { names: ['onActivate'] });
  assert.equal(hintOf(bare.host), 'Select an event to see what it can do', 'a host that took no pick is not told of one');
  bare.chip('call').focus();
  assert.equal(hintOf(bare.host), 'Enter opens');
});

/*
 * Seen to fail on the calendar of `a304bfb`, where an event was selected by the model alone:
 *
 *   ✖ selection: focus and a press select an event; the model's selection replaces it only when the model changes it
 *     AssertionError [ERR_ASSERTION]: focus on an event selects it
 *       actual: [],
 *       expected: [ 'call' ],
 */
test('selection: focus and a press select an event; the model\'s selection replaces it only when the model changes it', (t) => {
  const { host, chip, draw } = calendarOf(t, { names: ALL });
  const selected = () => [...new Set([...host.querySelectorAll('.cloudcanvas-ui-calendar-event.is-selected')].map((node) => node.getAttribute('data-ui-id')))];
  chip('call').focus();
  assert.deepEqual(selected(), ['call'], 'focus on an event selects it');
  chip('open').click();
  assert.deepEqual(selected(), ['open'], 'and a press');
  draw({ selectedId: 'trip' });
  assert.deepEqual(selected(), ['trip'], 'a selection the model changes is the model\'s');
  chip('open').focus();
  assert.deepEqual(selected(), ['open']);
  draw({ selectedId: 'trip' });
  assert.deepEqual(selected(), ['open'], 'the same one again is not news: it does not undo the reader\'s');
  assert.equal(chip('open').getAttribute('aria-current'), 'true');
});

/*
 * Seen to fail on the calendar of `a304bfb`:
 *
 *   ✖ menu: the menu key, Shift+F10 and a right-click ask for the event's menu; the keys put it under the chip, the pointer at the pointer; the empty grid keeps the browser's
 *     AssertionError [ERR_ASSERTION]: the menu key
 *       actual: false,
 *       expected: true,
 */
test('menu: the menu key, Shift+F10 and a right-click ask for the event\'s menu; the keys put it under the chip, the pointer at the pointer; the empty grid keeps the browser\'s', (t) => {
  const { host, chip, log, column } = calendarOf(t, { names: ALL });
  stubBox(chip('call'), { left: 140, top: 10, width: 80, height: 24 });
  assert.equal(key(chip('call'), 'ContextMenu').defaultPrevented, true, 'the menu key');
  assert.deepEqual(calls(log, 'onMenu'), [['call', { x: 140, y: 34 }]], 'under the chip');
  key(chip('call'), 'F10', { shiftKey: true });
  assert.equal(calls(log, 'onMenu').length, 2, 'Shift+F10 too');
  const click = (target) => target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 300, clientY: 50 }));
  assert.equal(click(chip('call')), false, 'a right-click is the event\'s, not the browser\'s');
  assert.deepEqual(calls(log, 'onMenu').at(-1), ['call', { x: 300, y: 50 }], 'at the pointer');
  click(chip('trip').querySelector('.cloudcanvas-ui-calendar-event-title'));
  assert.equal(calls(log, 'onMenu').at(-1)[0], 'trip', 'on its title');
  assert.equal(click(column('2026-09-29')), true, 'the empty grid keeps the browser\'s menu');
  const bare = calendarOf(t, { names: ['onActivate'] });
  assert.equal(click(bare.chip('call')), true, 'a host that took no menu keeps it');
  assert.equal(host.querySelectorAll('.cloudcanvas-ui-calendar-event').length > 0, true);
});

/*
 * Seen to fail on the calendar of `a304bfb`, whose chips had a name and no tooltip:
 *
 *   ✖ names: an event's name and tooltip are its whole title and its times, so a title cut in a chip is whole to the eye and the ear
 *     AssertionError [ERR_ASSERTION]: the tooltip is the name
 *       actual: null,
 *       expected: 'Call the printer, Tuesday, September 29, 2026, 9:00 AM to 10:00 AM',
 */
test('names: an event\'s name and tooltip are its whole title and its times, so a title cut in a chip is whole to the eye and the ear', (t) => {
  const { chip } = calendarOf(t);
  const name = 'Call the printer, Tuesday, September 29, 2026, 9:00 AM to 10:00 AM';
  assert.equal(chip('call').getAttribute('aria-label'), name);
  assert.equal(chip('call').getAttribute('title'), name, 'the tooltip is the name');
  assert.equal(chip('trip').getAttribute('title'), 'Trip, Wednesday, September 30, 2026, all day');
});
