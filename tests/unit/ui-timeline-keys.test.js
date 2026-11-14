/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The timeline by keyboard, and the verbs every item has wherever it is
 * pressed: the arrows walk the rows (Up and Down) and the bars through time
 * (Left and Right), Alt and the arrows move a bar by a day and Alt+Shift
 * resizes its end, Enter opens, `+` or Insert adds to the group, Delete
 * removes, and the menu key, Shift+F10 and a right-click ask for the item's
 * menu. A verb the host gave no callback for leaves its key alone.
 *
 * Every case was written before the code and run on the timeline as it stood
 * at `a304bfb`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { dayKey } from '../../ui/index.js';
import { assertSame, key, stubBox } from '../helpers/ui.js';
import { timelineOf } from './ui-timeline-fixture.js';

const ALL = ['onActivate', 'onChange', 'onAdd', 'onDelete', 'onMenu', 'onToggleGroup'];
const calls = (log, name) => log.filter(([called]) => called === name).map(([, ...args]) => args);
const changes = (log) => calls(log, 'onChange').map(([id, { start, end }]) => [id, dayKey(start), end ? dayKey(end) : null]);

/*
 * Seen to fail on the timeline of `a304bfb`, whose arrows walked the bars and whose Left and Right did nothing:
 *
 *   ✖ walk: Up and Down walk the rows, headings among them; Left and Right the bars through time
 *     AssertionError [ERR_ASSERTION]: Up from the first bar is its group's heading: expected <button[data-ui-id=book].cloudcanvas-ui-timeline-group-label>, got <button[data-ui-id=draft].cloudcanvas-ui-timeline-bar>
 */
test('walk: Up and Down walk the rows, headings among them; Left and Right the bars through time', (t) => {
  const { host, bar } = timelineOf(t, undefined, ALL);
  const heading = host.querySelector('.cloudcanvas-ui-timeline-group-label');
  bar('draft').focus();
  key(bar('draft'), 'ArrowUp');
  assertSame(document.activeElement, heading, 'Up from the first bar is its group\'s heading');
  key(heading, 'ArrowDown');
  assertSame(document.activeElement, bar('draft'), 'Down from the heading is its first bar');
  key(bar('draft'), 'ArrowDown');
  key(document.activeElement, 'ArrowDown');
  assertSame(document.activeElement, bar('ship'), 'the rows in order: a name alone is no stop');
  key(bar('ship'), 'End');
  assertSame(document.activeElement, bar('loose'));
  key(bar('loose'), 'Home');
  assertSame(document.activeElement, heading, 'Home is the first stop and End the last');
  bar('draft').focus();
  key(bar('draft'), 'ArrowRight');
  assertSame(document.activeElement, bar('quick'), 'Right is the next bar in time');
  key(bar('quick'), 'ArrowRight');
  key(document.activeElement, 'ArrowRight');
  assertSame(document.activeElement, bar('loose'), 'by start, to the last');
  key(bar('loose'), 'ArrowRight');
  assertSame(document.activeElement, bar('loose'), 'and no further');
  key(bar('loose'), 'ArrowLeft');
  assertSame(document.activeElement, bar('ship'), 'Left is the one before');
});

/*
 * Seen to fail on the timeline of `a304bfb`, which moved a bar only once it was picked up:
 *
 *   ✖ days: Alt and the arrows move a bar by a day, Alt+Shift resizes its end; a milestone is moved, a held bar and a host with no onChange are left alone
 *     AssertionError [ERR_ASSERTION]: Alt+Left is the browser's Back: the timeline keeps it
 *       actual: false,
 *       expected: true,
 */
test('days: Alt and the arrows move a bar by a day, Alt+Shift resizes its end; a milestone is moved, a held bar and a host with no onChange are left alone', (t) => {
  const { bar, log, draw } = timelineOf(t, undefined, ALL);
  const press = (id, name, options) => key(bar(id), name, { altKey: true, ...options });
  assert.equal(press('draft', 'ArrowRight').defaultPrevented, true, 'Alt+Left is the browser\'s Back: the timeline keeps it');
  assert.deepEqual(changes(log), [['draft', '2026-09-29', '2026-10-03']], 'Alt+Right moves it a day on');
  press('draft', 'ArrowLeft');
  assert.deepEqual(changes(log).at(-1), ['draft', '2026-09-27', '2026-10-01'], 'Alt+Left a day back');
  press('draft', 'ArrowRight', { shiftKey: true });
  assert.deepEqual(changes(log).at(-1), ['draft', '2026-09-28', '2026-10-03'], 'Alt+Shift+Right lengthens it by a day: the start stays');
  press('draft', 'ArrowLeft', { shiftKey: true });
  assert.deepEqual(changes(log).at(-1), ['draft', '2026-09-28', '2026-10-01'], 'and Alt+Shift+Left shortens it');
  press('ship', 'ArrowRight');
  assert.deepEqual(changes(log).at(-1), ['ship', '2026-10-07', null], 'a milestone is moved');
  const before = changes(log).length;
  press('ship', 'ArrowRight', { shiftKey: true });
  assert.equal(changes(log).length, before, 'and not resized');
  draw(ITEMS_HELD);
  assert.equal(press('draft', 'ArrowRight').defaultPrevented, true);
  assert.equal(changes(log).length, before, 'a bar held in place is not moved');
  const bare = timelineOf(t, undefined, ['onActivate']);
  assert.equal(key(bare.bar('draft'), 'ArrowRight', { altKey: true }).defaultPrevented, false, 'a host that takes no moves keeps the browser\'s keys');
});

const ITEMS_HELD = [{ id: 'draft', title: 'Draft', start: '2026-09-28', end: '2026-10-02', movable: false }];

/*
 * Seen to fail on the timeline of `a304bfb`, where Enter on a bar was a button's click and nothing else was a verb:
 *
 *   ✖ verbs: Enter opens, + and Insert add to the group, Delete and Backspace remove; each only where the host took it, and from a heading as well where it applies
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *       actual: false,
 *       expected: true,    (Enter on a bar: the key was left to the button's own click)
 */
test('verbs: Enter opens, + and Insert add to the group, Delete and Backspace remove; each only where the host took it, and from a heading as well where it applies', (t) => {
  const { host, bar, log } = timelineOf(t, undefined, ALL);
  const heading = host.querySelector('.cloudcanvas-ui-timeline-group-label');
  assert.equal(key(bar('draft'), 'Enter').defaultPrevented, true);
  assert.deepEqual(calls(log, 'onActivate'), [['draft']], 'Enter opens, once');
  key(bar('draft'), '+');
  key(bar('quick'), 'Insert');
  assert.deepEqual(calls(log, 'onAdd'), [['book'], ['book']], '+ and Insert add to the bar\'s group');
  key(bar('loose'), '+');
  key(bar('ship'), '+');
  assert.equal(calls(log, 'onAdd').length, 2, 'a bar with no group item has nothing to add to');
  key(heading, '+');
  assert.deepEqual(calls(log, 'onAdd').at(-1), ['book'], 'on a heading: add to the group');
  key(bar('draft'), 'Delete');
  key(bar('quick'), 'Backspace');
  assert.deepEqual(calls(log, 'onDelete'), [['draft'], ['quick']]);
  key(heading, 'Delete');
  assert.equal(calls(log, 'onDelete').length, 2, 'a heading is not removed by a key: it may be a whole group');
  const bare = timelineOf(t, undefined, ['onActivate']);
  assert.deepEqual(['Delete', '+', 'Insert'].map((name) => key(bare.bar('draft'), name).defaultPrevented), [false, false, false], 'a verb the host did not take leaves its key');
});

/*
 * Seen to fail on the timeline of `a304bfb`:
 *
 *   ✖ menu: the menu key, Shift+F10 and a right-click ask for the item's menu, on its bar, its title, its heading; the keys put it under the item
 *     AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
 *       actual: false,
 *       expected: true,    (the menu key on a bar: nobody took it)
 */
test('menu: the menu key, Shift+F10 and a right-click ask for the item\'s menu, on its bar, its title, its heading; the keys put it under the item', (t) => {
  const { host, bar, log } = timelineOf(t, undefined, ALL);
  stubBox(bar('draft'), { left: 140, top: 10, width: 80, height: 24 });
  assert.equal(key(bar('draft'), 'ContextMenu').defaultPrevented, true);
  assert.deepEqual(calls(log, 'onMenu'), [['draft', { x: 140, y: 34 }]], 'the menu key asks for the bar\'s menu, under the bar');
  key(bar('draft'), 'F10', { shiftKey: true });
  assert.equal(calls(log, 'onMenu').length, 2, 'and so does Shift+F10');
  const click = (target) => target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 300, clientY: 50 }));
  assert.equal(click(bar('draft')), false, 'a right-click is the item\'s, not the browser\'s');
  assert.deepEqual(calls(log, 'onMenu').at(-1), ['draft', { x: 300, y: 50 }], 'at the pointer');
  click(host.querySelector('[data-row-id="quick"] .cloudcanvas-ui-timeline-label'));
  click(host.querySelector('[data-row-id="ship"] .cloudcanvas-ui-timeline-outside'));
  click(host.querySelector('.cloudcanvas-ui-timeline-group-label'));
  assert.deepEqual(calls(log, 'onMenu').slice(-3).map(([id]) => id), ['quick', 'ship', 'book'], 'on a title, on the one beside a bar, on a heading that is an item');
  const track = host.querySelector('[data-row-id="draft"] .cloudcanvas-ui-timeline-track');
  assert.equal(click(track), true, 'the empty track is no item: the browser\'s menu');
  const bare = timelineOf(t, undefined, ['onActivate']);
  assert.equal(click(bare.bar('draft')), true, 'a host that took no menu keeps the browser\'s');
});

/*
 * Seen to fail on the timeline of `a304bfb`, which had no hint line:
 *
 *   ✖ hint: a heading says what it can do from the callbacks the host took
 *     TypeError [Error]: Cannot read properties of null (reading 'textContent')
 */
test('hint: a heading says what it can do from the callbacks the host took', (t) => {
  const { host, hint } = timelineOf(t, undefined, ALL);
  host.querySelector('.cloudcanvas-ui-timeline-group-label').focus();
  // K11: + or Insert says both, and a host that took a menu is told where it is.
  assert.equal(hint(), 'Enter opens · + or Insert to add one here · Space folds · Shift+F10 or right-click for more');
  const bare = timelineOf(t, undefined, ['onActivate']);
  bare.host.querySelector('.cloudcanvas-ui-timeline-group-label').focus();
  assert.equal(bare.hint(), 'Enter opens', 'a host that took no add and no fold is told neither');
});
