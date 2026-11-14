/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * `itemIdOf(element)`: the published way to ask which item an element belongs
 * to - the nearest one, from the item's own face, from anything inside it, or
 * from a part that stands for it (a timeline row's label, a tab's close
 * control) - so a host never reads the attribute the kit keeps its ids in.
 *
 * Written first and seen to fail on a kit that published no such thing:
 *
 *   SyntaxError: The requested module '../../.plugin/ui/index.js' does not provide an export named 'itemIdOf'
 *
 * and then, with `itemIdOf` published and the views as they were, on what did not yet say which item it belongs to:
 *
 *   ✖ itemIdOf: a kanban card and what is inside it; a column heading only when it stands for an item
 *     AssertionError [ERR_ASSERTION]: the heading of a column that stands for an item carries that item's id, not the column's
 *   ✖ itemIdOf: a timeline bar and the label beside it; a group heading that stands for an item
 *     AssertionError [ERR_ASSERTION]: the label beside a bar belongs to that bar's item
 *   ✖ itemIdOf: a tab, what is inside it and its close control
 *     AssertionError [ERR_ASSERTION]: the close control inside a tab's face belongs to that tab
 *
 * (The calendar, the graph and the tree passed as soon as it was published: their items already carried their ids.)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCalendar, createGraph, createKanban, createTabs, createTimeline, createTree, itemIdOf } from '../../ui/index.js';
import { mount } from '../helpers/ui.js';

const NOW = '2026-09-29T08:00';

test('itemIdOf: nothing, a detached node and an element outside every item belong to none; a text node belongs where its element does', (t) => {
  const host = mount(t);
  host.innerHTML = '<p>Plain</p>';
  for (const none of [null, undefined, {}, document, host, host.firstChild, document.createElement('div')]) assert.equal(itemIdOf(none), null);
  createKanban(host).update({ columns: [{ id: 'todo', label: 'To do', cards: [{ id: 'a', title: 'Call' }] }] });
  const title = host.querySelector('.cloudcanvas-ui-kanban-title');
  assert.equal(title.firstChild.nodeType, 3);
  assert.equal(itemIdOf(title.firstChild), 'a', 'some browsers aim an event at the text itself');
});

test('itemIdOf: a kanban card and what is inside it; a column heading only when it stands for an item', (t) => {
  const host = mount(t);
  createKanban(host).update({ columns: [{ id: 'todo', label: 'To do', cards: [{ id: 'a', title: 'Call', detail: 'Dentist' }] },
    { id: 'col-plan', itemId: 'plan', label: 'Plan', cards: [{ id: 'b', title: 'Buy' }] }] });
  const [plain, item] = host.querySelectorAll('.cloudcanvas-ui-kanban-heading');
  assert.deepEqual(['.cloudcanvas-ui-kanban-card', '.cloudcanvas-ui-kanban-title', '.cloudcanvas-ui-kanban-detail'].map((part) => itemIdOf(host.querySelector(part))), ['a', 'a', 'a']);
  assert.equal(itemIdOf(item.querySelector('button')), 'plan', 'the heading of a column that stands for an item carries that item\'s id, not the column\'s');
  assert.deepEqual([plain, plain.firstChild, host.querySelector('.cloudcanvas-ui-kanban-column'), host.querySelector('.cloudcanvas-ui-kanban-lane')].map(itemIdOf), [null, null, null, null],
    'a plain heading, a column and the lane are no item');
});

test('itemIdOf: a calendar chip and its words, in the month and in the hour grid; a day is no item', (t) => {
  const host = mount(t);
  const calendar = createCalendar(host);
  const model = { view: 'month', date: '2026-09-29', now: NOW, locale: 'en-US', events: [{ id: 'call', title: 'Call', start: '2026-09-29T09:00', end: '2026-09-29T10:00' }] };
  calendar.update(model);
  assert.deepEqual(['.cloudcanvas-ui-calendar-event', '.cloudcanvas-ui-calendar-event-title', '.cloudcanvas-ui-calendar-event-time'].map((part) => itemIdOf(host.querySelector(part))), ['call', 'call', 'call']);
  assert.deepEqual(['.cloudcanvas-ui-calendar-day', '.cloudcanvas-ui-calendar-cell'].map((part) => itemIdOf(host.querySelector(part))), [null, null]);
  calendar.update({ ...model, view: 'week' });
  assert.equal(itemIdOf(host.querySelector('.cloudcanvas-ui-calendar-timed .cloudcanvas-ui-calendar-event-title')), 'call');
  assert.equal(itemIdOf(host.querySelector('.cloudcanvas-ui-calendar-column')), null);
});

test('itemIdOf: a timeline bar and the label beside it; a group heading that stands for an item', (t) => {
  const host = mount(t);
  createTimeline(host).update({ scale: 'week', now: NOW, locale: 'en-US', items: [
    { id: 'draft', title: 'Draft', start: '2026-09-28', end: '2026-10-02', group: { id: 'book', label: 'Book' } },
    { id: 'ship', title: 'Ship', start: '2026-10-06', group: 'Release' }] });
  const row = host.querySelector('.cloudcanvas-ui-timeline-row');
  assert.deepEqual(['.cloudcanvas-ui-timeline-bar', '.cloudcanvas-ui-timeline-bar-title'].map((part) => itemIdOf(row.querySelector(part))), ['draft', 'draft']);
  assert.equal(itemIdOf(row.querySelector('.cloudcanvas-ui-timeline-label')), 'draft', 'the label beside a bar belongs to that bar\'s item');
  assert.equal(itemIdOf(host.querySelector('.cloudcanvas-ui-timeline-bar.is-point')), 'ship', 'a milestone is an item as a bar is');
  const [book, release] = host.querySelectorAll('.cloudcanvas-ui-timeline-group');
  assert.equal(itemIdOf(book.querySelector('button')), 'book', 'a group that carries an id is that item');
  assert.deepEqual([release, release.firstChild, row, row.querySelector('.cloudcanvas-ui-timeline-track')].map(itemIdOf), [null, null, null, null],
    'a group that is only a name, a row and the empty track are no item');
});

test('itemIdOf: a graph node and its label; the surface it lies on is no item', (t) => {
  const host = mount(t);
  createGraph(host).update({ nodes: [{ id: 'plan', label: 'Plan', x: 0, y: 0 }, { id: 'build', label: 'Build', x: 200, y: 0 }], edges: [{ from: 'plan', to: 'build' }] });
  const node = host.querySelector('.cloudcanvas-ui-graph-node[data-ui-id="build"]');
  assert.deepEqual([itemIdOf(node), itemIdOf(node.firstChild)], ['build', 'build']);
  assert.deepEqual(['.cloudcanvas-ui-graph-viewport', '.cloudcanvas-ui-graph-edge', '.cloudcanvas-ui-graph-fit'].map((part) => itemIdOf(host.querySelector(part))), [null, null, null]);
});

test('itemIdOf: a tab, what is inside it and its close control', (t) => {
  const host = mount(t);
  createTabs(host).update({ activeId: 'notes', items: [{ id: 'home', label: 'Home', pinned: true },
    { id: 'notes', label: 'Notes', closable: true, badge: { count: 3, label: '{count} unread' }, layers: [{ id: 'work', label: 'Work' }] }] });
  const tab = host.querySelector('[role="tab"][data-ui-id="notes"]');
  assert.deepEqual([tab, tab.firstElementChild, tab.querySelector('.cloudcanvas-ui-badge-figure')].map(itemIdOf), ['notes', 'notes', 'notes'], 'the tab, its label and its badge');
  assert.equal(itemIdOf(host.querySelector('[data-ui-close="notes"]')), 'notes', 'the close control inside a tab\'s face belongs to that tab');
  assert.deepEqual([host.querySelector('[data-ui-layer="work"]'), host.querySelector('.cloudcanvas-ui-tabs'), host.querySelector('.cloudcanvas-ui-tabs-item')].map(itemIdOf), [null, null, null],
    'a layer is a parent scope, reported by onLayer, and no item of the strip; nor is the strip, or a row');
});

test('itemIdOf: a tree row and everything in it', (t) => {
  const host = mount(t);
  createTree(host).update({ expanded: ['w'], items: [{ id: 'w', label: 'Work', count: 2, badge: 4 }, { id: 'p', parentId: 'w', label: 'Plan' }] });
  const row = host.querySelector('[role="treeitem"][data-ui-id="w"]');
  assert.deepEqual([row, ...row.querySelectorAll('.cloudcanvas-ui-tree-label, .cloudcanvas-ui-tree-count, .cloudcanvas-ui-tree-twisty, .cloudcanvas-ui-badge-figure')].map(itemIdOf),
    Array(5).fill('w'));
  assert.equal(itemIdOf(host.querySelector('[data-ui-id="p"] .cloudcanvas-ui-tree-label')), 'p');
  assert.equal(itemIdOf(host.querySelector('[role="tree"]')), null);
});
