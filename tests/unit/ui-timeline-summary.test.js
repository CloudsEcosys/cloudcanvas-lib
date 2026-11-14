/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A folded group draws a summary bar on its heading's row: from the earliest
 * start of its items to the latest end (a milestone's end is its start),
 * within the axis, titled with the group's name and how many items it holds.
 * It is a part of the group's item - a press opens it, a right-click is its
 * menu - for the eye alone (the heading says the same), and no row to drag a
 * span across: a press on it makes nothing. An open group draws none.
 *
 * Every case was written before the code and run on the timeline as it stood
 * at `f28f269` (its timeline and calendar as at `d68b5b5`); each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { pointer, stubBox } from '../helpers/ui.js';
import { ITEMS, timelineOf } from './ui-timeline-fixture.js';

const CALLBACKS = ['onActivate', 'onCreate', 'onToggleGroup', 'onMenu'];
const folded = (items, collapsed = true) => items.map((item) => (item.group?.id === 'book' ? { ...item, group: { ...item.group, collapsed } } : item));
const summary = (host) => host.querySelector('.cloudcanvas-ui-timeline-summary');
const px = (node, name) => Number.parseFloat(node.style.getPropertyValue(name));

/*
 * Seen to fail on the timeline of `f28f269`, whose folded heading drew nothing on its row:
 *
 *   ✖ summary: a folded group's row draws a bar from its items' earliest start to their latest end, titled with its name and count
 *     AssertionError [ERR_ASSERTION]: a summary bar on the folded heading's row
 *       actual: null,
 *       expected: true,
 */
test('summary: a folded group\'s row draws a bar from its items\' earliest start to their latest end, titled with its name and count', (t) => {
  const { host } = timelineOf(t, folded(ITEMS), CALLBACKS);
  const bar = summary(host);
  assert.ok(bar, 'a summary bar on the folded heading\'s row');
  assert.ok(bar.closest('.cloudcanvas-ui-timeline-group'), 'on the heading\'s row');
  // Sep 28 (day 7 of the axis, 20px a day) to Oct 2 09:30, the printer's call: 4 days and 9.5 hours.
  assert.equal(px(bar, '--timeline-x'), 140);
  assert.ok(Math.abs(px(bar, '--timeline-w') - (4 + 9.5 / 24) * 20) < 0.01, `to the latest end: ${px(bar, '--timeline-w')}`);
  assert.equal(bar.textContent, 'The book, 2 items');
  assert.deepEqual([bar.getAttribute('title'), bar.getAttribute('aria-hidden'), bar.getAttribute('data-ui-for')], ['The book, 2 items', 'true', 'book'],
    'its full title is its tooltip; the heading says it to assistive technology; it stands for the group\'s item');
});

/*
 * Seen to fail on the timeline of `f28f269`:
 *
 *   ✖ summary: a press on it opens the group's item and makes no span; a right-click is the item's menu; an open group draws none
 *     TypeError [Error]: Cannot set properties of null (setting 'getBoundingClientRect')
 */
test('summary: a press on it opens the group\'s item and makes no span; a right-click is the item\'s menu; an open group draws none', (t) => {
  const { host, draw, log } = timelineOf(t, folded(ITEMS), CALLBACKS);
  const sheet = host.querySelector('.cloudcanvas-ui-timeline-sheet');
  stubBox(summary(host), { left: 140, top: 0, width: 88, height: 24 });
  pointer(summary(host), 'pointerdown', { clientX: 150, clientY: 10 });
  pointer(sheet, 'pointermove', { clientX: 230, clientY: 12 });
  assert.equal(host.querySelector('.cloudcanvas-ui-timeline-draft'), null, 'no band: the summary is no empty row');
  pointer(sheet, 'pointerup', { clientX: 230, clientY: 12 });
  assert.deepEqual(log.filter(([name]) => name === 'onCreate'), [], 'and nothing is made');
  summary(host).click();
  assert.deepEqual(log.filter(([name]) => name === 'onActivate').map(([, id]) => id), ['book'], 'a press opens the group\'s item');
  summary(host).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 160, clientY: 20 }));
  assert.deepEqual(log.filter(([name]) => name === 'onMenu').map(([, id]) => id), ['book'], 'a right-click is its menu');
  draw(folded(ITEMS, false));
  assert.equal(summary(host), null, 'an open group draws none');
});

/*
 * Seen to fail on the timeline of `f28f269`:
 *
 *   ✖ summary: drawn for a host that takes no span, never narrower than a bar is drawn, and one item says so
 *     AssertionError [ERR_ASSERTION]: a host that takes no onCreate still sees what is folded
 *       actual: null,
 *       expected: true,
 */
test('summary: drawn for a host that takes no span, never narrower than a bar is drawn, and one item says so', (t) => {
  const items = [{ id: 'gate', title: 'Gate', start: '2026-10-06', milestone: true, group: { id: 'launch', label: 'Launch', collapsed: true } }, ...ITEMS];
  const { host } = timelineOf(t, items, ['onActivate', 'onToggleGroup']);
  const bar = summary(host);
  assert.ok(bar, 'a host that takes no onCreate still sees what is folded');
  assert.equal(bar.textContent, 'Launch, 1 item');
  assert.equal(px(bar, '--timeline-w'), 20, 'a milestone alone: drawn as wide as the narrowest bar');
});

/*
 * K8, written before the code and run on the timeline of `8f8720e`, which reported a press on the summary bar as `onActivate(groupId)` and
 * its right-click as `onMenu(groupId, point)`: the id of the group is the id of the item its heading stands for, so a host could not
 * tell the summary's press from the heading's own (a host had to read where the pointer went down).
 *
 *   ✖ summary: its press and menu say they are the summary's; the same id from the heading's button, a bar or the keyboard arrives as it always did
 *     AssertionError [ERR_ASSERTION]: a press on the bar, or on the words in it, says summary; the heading's own button says nothing more than its id
 *       actual: [ [ 'onActivate', 'book' ], [ 'onActivate', 'book' ], [ 'onActivate', 'book' ] ],
 *       expected: [ [ 'onActivate', 'book', { summary: true } ], [ 'onActivate', 'book', { summary: true } ], [ 'onActivate', 'book' ] ],
 */
test('summary: its press and menu say they are the summary\'s; the same id from the heading\'s button, a bar or the keyboard arrives as it always did', (t) => {
  const { host, log } = timelineOf(t, folded(ITEMS), CALLBACKS);
  const heading = host.querySelector('.cloudcanvas-ui-timeline-group-label');
  const menuAt = (node, point) => node.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: point.x, clientY: point.y }));
  summary(host).click();
  summary(host).querySelector('.cloudcanvas-ui-timeline-summary-title').click();
  menuAt(summary(host), { x: 160, y: 20 });
  heading.click();
  menuAt(heading, { x: 30, y: 12 });
  assert.deepEqual(log.filter(([name]) => name === 'onActivate'), [['onActivate', 'book', { summary: true }], ['onActivate', 'book', { summary: true }], ['onActivate', 'book']],
    'a press on the bar, or on the words in it, says summary; the heading\'s own button says nothing more than its id');
  assert.deepEqual(log.filter(([name]) => name === 'onMenu'), [['onMenu', 'book', { x: 160, y: 20 }, { summary: true }], ['onMenu', 'book', { x: 30, y: 12 }]],
    'the summary\'s menu has the point first, as every menu has, and then what it is; an item\'s has the two it always had');
  const plain = timelineOf(t, folded(ITEMS, false), CALLBACKS);
  plain.bar('draft').click();
  assert.deepEqual(plain.log.filter(([name]) => name === 'onActivate'), [['onActivate', 'draft']], 'a bar\'s press is one argument, as before');
  plain.bar('draft').focus();
  plain.bar('draft').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  assert.deepEqual(plain.log.filter(([name]) => name === 'onActivate').at(-1), ['onActivate', 'draft'], 'and so is Enter on it');
});

