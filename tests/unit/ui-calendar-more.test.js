/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The calendar's item menu was reached only by a right-click, Shift+F10 or a
 * long press, and nothing said so. The selected event now has a "more" button
 * at its end that asks for that same menu - in the month, in the all-day strip
 * and in the hour grid - and every hint line under the toolbar says where the
 * rest is.
 *
 * Every case was written before the code and run on the calendar as it stood at
 * `d242ea4`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSame, key, pointer, stubBox } from '../helpers/ui.js';
import { calendarOf, calls } from './ui-calendar-fixture.js';

const MORE = '.cloudcanvas-ui-item-more';
const NAMES = ['onMove', 'onPick', 'onActivate', 'onMenu'];
const moreIn = (host) => [...host.querySelectorAll(MORE)];
const hintOf = (host) => host.querySelector('.cloudcanvas-ui-calendar-hint').textContent;
const SELECTED = (id) => ({ selectedId: id });

/*
 * Seen to fail on the calendar of `d242ea4`, which drew no such button:
 *
 *   ✖ calendar more: in the hour grid the selected event has a "more" button at its end, placed as it is, which asks for the menu a right-click asks for
 *     TypeError [Error]: Cannot read properties of undefined (reading 'parentElement')
 */
test('calendar more: in the hour grid the selected event has a "more" button at its end, placed as it is, which asks for the menu a right-click asks for', (t) => {
  const { host, draw, chip, column, log } = calendarOf(t, { names: NAMES });
  assert.deepEqual(moreIn(host), [], 'nothing selected, nothing to ask about');
  draw(SELECTED('call'));
  const [more, ...others] = moreIn(host);
  assert.equal(others.length, 0);
  assertSame(more.parentElement, column('2026-09-29'), 'in the day\'s column, a button a button cannot hold');
  assert.ok(chip('call').compareDocumentPosition(more) & Node.DOCUMENT_POSITION_FOLLOWING, 'straight after its event: the next stop for Tab');
  assert.ok(chip('call').classList.contains('is-holding-more'), 'the event gives it room at its end');
  for (const name of ['--calendar-top', '--calendar-lane', '--calendar-lanes']) {
    assert.equal(more.style.getPropertyValue(name), chip('call').style.getPropertyValue(name), `${name}: it stands where the event does`);
  }
  assert.equal(more.getAttribute('aria-label'), 'More actions for Call the printer');
  assert.ok(more.querySelector('svg[data-icon="more"]'));
  stubBox(more, { left: 140, top: 60, width: 24, height: 24 });
  more.click();
  assert.deepEqual(calls(log, 'onMenu'), [['call', { x: 140, y: 84 }]], 'under the button');
  assert.deepEqual(calls(log, 'onActivate'), [], 'it opens nothing');
  assert.deepEqual([key(more, 'Enter').defaultPrevented, key(more, ' ').defaultPrevented], [false, false], 'Enter and Space are the button\'s own');
  draw(SELECTED('fixed'));
  assert.deepEqual(moreIn(host).map((one) => one.previousElementSibling), [chip('fixed')], 'it goes with the selection');
  assert.equal(chip('call').classList.contains('is-holding-more'), false);
});

/*
 * Seen to fail on the calendar of `d242ea4`:
 *
 *   ✖ calendar more: in the month and the all-day strip the button stands in the row of its event
 *     TypeError [Error]: Cannot read properties of undefined (reading 'previousElementSibling')
 */
test('calendar more: in the month and the all-day strip the button stands in the row of its event', (t) => {
  const month = calendarOf(t, { view: 'month', names: NAMES });
  month.draw(SELECTED('fixed'));
  const [one] = moreIn(month.host);
  assertSame(one.previousElementSibling, month.chip('fixed'), 'after its event, in the same list');
  assert.equal(one.style.getPropertyValue('grid-row'), '2 / 3', 'on its row of the day\'s list: the second');
  const week = calendarOf(t, { view: 'week', names: NAMES });
  week.draw(SELECTED('trip'));
  const [strip] = moreIn(week.host);
  assertSame(strip.previousElementSibling, week.chip('trip'));
  assert.equal(strip.parentElement.className, 'cloudcanvas-ui-calendar-allday-cell');
  assert.equal(strip.style.getPropertyValue('grid-row'), '1 / 2');
});

/*
 * Seen to fail on the calendar of `d242ea4`:
 *
 *   ✖ calendar more: a host that takes no menu gets no button, and one in hand has none
 *     AssertionError [ERR_ASSERTION]: a host with a menu gets the button
 *     0 !== 1
 */
test('calendar more: a host that takes no menu gets no button, and an event in hand has none', (t) => {
  const withMenu = calendarOf(t, { names: NAMES });
  withMenu.draw(SELECTED('call'));
  assert.equal(moreIn(withMenu.host).length, 1, 'a host with a menu gets the button');
  const bare = calendarOf(t, { names: ['onMove', 'onActivate'] });
  bare.draw(SELECTED('call'));
  assert.equal(moreIn(bare.host).length, 0);
  assert.doesNotMatch(hintOf(bare.host), /right-click/);
  withMenu.chip('call').focus();
  key(withMenu.chip('call'), ' ');
  assert.equal(moreIn(withMenu.host).length, 0, 'out of the way of an event picked up');
  key(document.activeElement, 'Escape');
  assert.equal(moreIn(withMenu.host).length, 1, 'and back when it is put down');
});

/*
 * Seen to fail on the calendar of `d242ea4`, whose lines said nothing of the menu:
 *
 *   ✖ calendar more: every hint line says where the menu is, for what the host can do
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *     + actual - expected
 *     + 'Select an event to see what it can do · drag across empty slots to add one · N on a day draws one'
 *     - 'Select an event to see what it can do · drag across empty slots to add one · Shift+F10 or right-click for more · N on a day draws one'
 */
test('calendar more: every hint line says where the menu is, for what the host can do', (t) => {
  const { host, draw } = calendarOf(t, { names: NAMES });
  assert.equal(hintOf(host), 'Select an event to see what it can do · drag across empty slots to add one · Shift+F10 or right-click for more · N on a day draws one');
  draw(SELECTED('call'));
  assert.equal(hintOf(host), 'Enter opens · drag to move · drag the bottom edge to resize · Alt+Shift+Up or Down resizes · Shift+F10 or right-click for more');
  draw(SELECTED('fixed'));
  assert.equal(hintOf(host), 'Enter opens · Shift+F10 or right-click for more');
});

/*
 * Found in a browser look at 390px: a finger pressed a chip, the chip took the focus, was selected, and the button and the room for it
 * came with the selection - under the finger, before the click that ends the press. A click whose press began on the chip and ended on
 * the button is the click of their common ancestor: the day's list, which opens the capture dialog. The button waits for the press to end
 * (its click, or a moment after a press that is no click: a drag), and then stands where it should.
 *
 * Seen to fail on the calendar with the button drawn at once:
 *
 *   ✖ calendar more: a press on a chip is over before the button stands under it, so the click is the chip's
 *     AssertionError [ERR_ASSERTION]: no button while the press is down
 *     1 !== 0
 */
test('calendar more: a press on a chip is over before the button stands under it, so the click is the chip\'s', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { host, chip, log } = calendarOf(t, { view: 'month', names: NAMES });
  pointer(chip('fixed'), 'pointerdown');
  chip('fixed').focus();
  assert.equal(moreIn(host).length, 0, 'no button while the press is down');
  assert.ok(chip('fixed').classList.contains('is-selected'), 'but the event is selected, and the hint says what it can do');
  pointer(chip('fixed'), 'pointerup');
  chip('fixed').click();
  assert.deepEqual(calls(log, 'onActivate'), [['fixed']], 'the click was the chip\'s');
  assert.equal(moreIn(host).length, 1, 'the click is over: the button stands by its event');
  pointer(chip('call'), 'pointerdown');
  chip('call').focus();
  pointer(chip('call'), 'pointerup');
  assert.equal(moreIn(host)[0].previousElementSibling.getAttribute('data-ui-id'), 'fixed', 'a press that ends in no click moves nothing yet');
  t.mock.timers.tick(500);
  assert.equal(moreIn(host)[0].previousElementSibling.getAttribute('data-ui-id'), 'call', 'and does when it has waited for one');
});
