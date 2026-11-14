/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * What three controls are to the page around them, for assistive technology:
 * the roles a timeline's rows own, the section an open menu is, and the one
 * region a document's toasts share. Each case is a finding of an axe run on a
 * host's pages (axe-core 4.13.0), written here as the structure that rule
 * reads, since the test DOM has no accessibility tree to ask.
 *
 * Written first, and each seen to fail on the kit as it was (kit `11cf55c`):
 *
 *   ✖ timeline: a list owns list items and nothing else; a group's heading stands before the list it names
 *     AssertionError [ERR_ASSERTION]: aria-required-children: a list owns list items only
 *     actual: [ [ 'heading', 'listitem', 'listitem', 'heading', 'listitem', 'listitem' ] ]
 *     expected: [ [ 'listitem', 'listitem' ], [ 'listitem' ], [ 'listitem' ] ]
 *
 *   ✖ timeline: its bars and headings are reached and named as they were
 *     AssertionError [ERR_ASSERTION]: a list is a run of rows under one heading, in the order given: a group met again is headed again, as it was
 *     actual: [ [ null, 7 ] ]   expected: [ [ null, 1 ], [ 'The book', 1 ], [ 'Release', 1 ], [ 'The book', 1 ] ]
 *     (the names before that line passed on the old kit, and are there so they stay as they were)
 *
 *   ✖ menu: an open menu is a section of its own, named as its menu is, wherever a host mounts it
 *     AssertionError [ERR_ASSERTION]: region: the box is a landmark, named by the menu it holds
 *     actual: [ null, null ]   expected: [ 'region', 'cloudcanvas-ui-menu-1' ]
 *
 *   ✖ toast: one region of a name in a document, however many toasters name it
 *     AssertionError [ERR_ASSERTION]: landmark-unique: two toasters of one name, one region
 *     2 !== 1
 *
 *   ✖ toast: another name is another region; a region whose host has left the page comes to the toaster that shows next
 *     AssertionError [ERR_ASSERTION]: each name once
 *     actual: [ 'Notifications', 'Notifications', 'Reminders' ]   expected: [ 'Notifications', 'Reminders' ]
 *
 * And in a browser, on a page of a grouped timeline, a menu open from the body
 * and three toasters, two of one name: axe reported aria-required-children
 * (critical), region and landmark-unique on the old bundle, and nothing on
 * this one, light and dark, at 1440 and 390.
 *
 * Phase 28 (K2): the timeline's rows are a treegrid now - a group folds, so its
 * heading is a row of level 1 and its bars rows of level 2 - and the two
 * timeline cases below read that structure; they were seen to fail on the
 * lists they replace (`a304bfb`):
 *
 *   ✖ timeline: a treegrid owns rows and nothing else; a group's heading is a row of level 1 with a cell, an item's row level 2 under it
 *     TypeError [Error]: Cannot read properties of null (reading 'children')
 *
 *   ✖ timeline: its bars and headings are reached and named as they were
 *     AssertionError [ERR_ASSERTION]: a group that stands for an item is still a button in its heading
 *     actual: [ [ 'The book', '3', 'book' ], [ 'Release', '3', null ] ]   expected: [ [ 'The book', '1', 'book' ], [ 'Release', '1', null ] ]
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMenu, createTimeline, createToaster } from '../../ui/index.js';
import { assertSame, mount } from '../helpers/ui.js';

const NOW = '2026-09-29T12:00';
const ITEMS = [
  { id: 'draft', title: 'Draft', start: '2026-09-28', end: '2026-10-02', group: { id: 'book', label: 'The book' } },
  { id: 'edit', title: 'Edit', start: '2026-10-02', end: '2026-10-05', group: { id: 'book', label: 'The book' } },
  { id: 'ship', title: 'Ship', start: '2026-10-06', group: 'Release' },
  { id: 'loose', title: 'Loose end', start: '2026-10-07' }
];

const rolesOf = (nodes) => [...nodes].map((node) => node.getAttribute('role'));

function timelineIn(t, items = ITEMS) {
  const host = mount(t);
  const control = createTimeline(host);
  const draw = (next = items) => control.update({ label: 'Plan', scale: 'week', now: NOW, locale: 'en-US', items: next });
  draw();
  t.after(() => control.destroy());
  return { host, draw };
}

test('timeline: a treegrid owns rows and nothing else; a group\'s heading is a row of level 1 with a cell, an item\'s row level 2 under it', (t) => {
  const { host, draw } = timelineIn(t);
  const grid = host.querySelector('[role="treegrid"]');
  assert.deepEqual(rolesOf(grid.children), Array(6).fill('row'), 'aria-required-children: a treegrid owns rows only, headings among them');
  for (const row of host.querySelectorAll('[role="row"]')) assert.equal(row.parentElement, grid, 'aria-required-parent: every row is in the treegrid');
  assert.deepEqual([...grid.children].map((row) => [row.getAttribute('aria-level'), rolesOf(row.querySelectorAll(':scope > [role]'))]),
    [['1', ['gridcell']], ['2', ['gridcell']], ['2', ['gridcell']], ['1', ['gridcell']], ['2', ['gridcell']], ['1', ['gridcell']]],
    'a row owns cells only: the label in the gutter is for the eye and has no role, the track is the cell');
  const ids = () => [...host.querySelectorAll('.cloudcanvas-ui-timeline-row')].map((row) => row.getAttribute('data-row-id'));
  const before = ids();
  draw(ITEMS.map((item) => (item.id === 'draft' ? { ...item, title: 'First draft' } : item)));
  assert.deepEqual(ids(), before, 'a redraw keeps the rows, so a name is not rewritten under a reader');
  assert.equal(host.querySelectorAll('[role="list"], [role="heading"]').length, 0, 'the lists and headings the rows were are rows now');
});

test('timeline: its bars and headings are reached and named as they were', (t) => {
  const { host, draw } = timelineIn(t);
  assert.deepEqual([...host.querySelectorAll('.cloudcanvas-ui-timeline-bar')].map((bar) => [bar.localName, bar.getAttribute('aria-label'), bar.getAttribute('tabindex')]), [
    ['button', 'Draft, Sep 28 to Oct 1', '0'], ['button', 'Edit, Oct 2 to Oct 4', '-1'], ['button', 'Ship, Oct 6, milestone', '-1'], ['button', 'Loose end, Oct 7, milestone', '-1']]);
  const headings = [...host.querySelectorAll('.cloudcanvas-ui-timeline-group')];
  assert.deepEqual(headings.map((heading) => [heading.textContent, heading.getAttribute('aria-level'), heading.querySelector('button')?.getAttribute('data-ui-id') ?? null]),
    [['The book', '1', 'book'], ['Release', '1', null]], 'a group that stands for an item is still a button in its heading');
  assert.deepEqual([host.querySelector('.cloudcanvas-ui-timeline').getAttribute('role'), host.querySelector('.cloudcanvas-ui-timeline').getAttribute('aria-label')], ['region', 'Plan']);
  draw([ITEMS[3], ITEMS[0], ITEMS[2], ITEMS[1]]);
  assert.deepEqual([...host.querySelectorAll('[role="treegrid"] > [role="row"]')].map((row) => row.firstElementChild.textContent),
    ['Loose end', 'The book', 'Draft', 'Release', 'Ship', 'The book', 'Edit'],
    'a heading heads the run of rows under it, in the order given: a group met again is headed again, as it was');
});

test('menu: an open menu is a section of its own, named as its menu is, wherever a host mounts it', (t) => {
  const host = mount(t);
  const menu = createMenu(host);
  t.after(() => menu.destroy());
  const box = host.querySelector('.cloudcanvas-ui-menu');
  const [panel, flyout] = host.querySelectorAll('[role="menu"]');
  menu.update({ open: true, label: 'Item actions', items: [{ id: 'open', label: 'Open' }, { id: 'view', label: 'View in', items: [{ id: 'board', label: 'Board' }] }] });
  assert.deepEqual([box.getAttribute('role'), box.getAttribute('aria-labelledby')], ['region', panel.id], 'region: the box is a landmark, named by the menu it holds');
  assert.deepEqual([panel.getAttribute('role'), panel.getAttribute('aria-label')], ['menu', 'Item actions'], 'and the menu is the menu it was');
  assert.deepEqual([box.contains(panel), box.contains(flyout)], [true, true], 'the submenu is in the same section');
  menu.update({ open: true, items: [{ id: 'only', label: 'Only' }] });
  assert.equal(document.getElementById(box.getAttribute('aria-labelledby')).getAttribute('aria-label'), 'Menu', 'a menu given no name has the default one, and so has its section');
  menu.update({ open: false });
  assert.equal(box.hidden, true, 'shut, it is no part of the page at all');
});

test('toast: one region of a name in a document, however many toasters name it', (t) => {
  const first = mount(t);
  const second = mount(t);
  const a = createToaster(first, { timeout: 0 });
  const b = createToaster(second, { timeout: 0 });
  const regions = () => [...document.querySelectorAll('.cloudcanvas-ui-toasts')];
  assert.equal(regions().length, 1, 'landmark-unique: two toasters of one name, one region');
  const [region] = regions();
  assert.deepEqual([region.localName, region.getAttribute('aria-label'), first.contains(region)], ['section', 'Notifications', true], 'where the first to name it was mounted');
  const one = a.show({ message: 'Saved' });
  const two = b.show({ message: 'Added', tone: 'danger' });
  assert.deepEqual([...region.children].map((node) => [node.getAttribute('data-ui-id'), node.getAttribute('role'), node.firstChild.textContent]),
    [[one, 'status', 'Saved'], [two, 'alert', 'Added']], 'each toaster\'s toasts, in the order shown, each with an id no other has');
  assert.notEqual(one, two);
  assert.equal(b.dismiss(one), false, 'a toast is its own toaster\'s to dismiss');
  a.destroy();
  assert.deepEqual([regions().length, [...region.children].map((node) => node.getAttribute('data-ui-id'))], [1, [two]], 'a toaster that goes takes its toasts, and leaves the region to the one still there');
  b.destroy();
  assert.equal(regions().length, 0, 'the last to go takes the region');
});

test('toast: another name is another region; a region whose host has left the page comes to the toaster that shows next', (t) => {
  const first = mount(t);
  const second = mount(t);
  const notices = createToaster(first, { timeout: 0 });
  const reminders = createToaster(second, { timeout: 0, labels: { region: 'Reminders' } });
  const later = createToaster(second, { timeout: 0 });
  t.after(() => { notices.destroy(); reminders.destroy(); later.destroy(); });
  const names = () => [...document.querySelectorAll('.cloudcanvas-ui-toasts')].map((region) => region.getAttribute('aria-label'));
  assert.deepEqual(names().sort(), ['Notifications', 'Reminders'], 'each name once');
  assert.equal(second.querySelector('.cloudcanvas-ui-toasts').getAttribute('aria-label'), 'Reminders');
  first.remove();
  assert.deepEqual(names(), ['Reminders'], 'the first host took its region off the page with it');
  const id = later.show({ message: 'Still here' });
  assert.deepEqual(names().sort(), ['Notifications', 'Reminders']);
  assert.ok(second.querySelector(`.cloudcanvas-ui-toasts[aria-label="Notifications"] [data-ui-id="${id}"]`), 'shown where the toaster that showed it is mounted');
});
