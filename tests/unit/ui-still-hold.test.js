/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A still finger belongs to the host. In each view that moves its items by a
 * drag - the board, the calendar, the timeline, the graph, and a strip of tabs
 * that can be reordered - a touch that rests and does not move starts no move
 * and draws nothing, however long it is held: a host's long-press menu opens
 * over the item as it was. The move begins when the rested finger travels.
 *
 * Written first, and seen to fail in every one of them on a drag that began the
 * moment the touch had rested (`./ui-drag.test.js` holds the shared drag to the
 * same):
 *
 *   ✖ kanban: a touch held still picks nothing up and holds nothing back; the move begins when the rested finger travels
 *     AssertionError [ERR_ASSERTION]: kanban: nothing is drawn as picked up
 *     actual: [ 'is-drag-active', 'is-dragging' ]   expected: []
 *   ✖ calendar: ...   actual: [ 'is-drag-active', 'is-grabbed' ]   expected: []
 *   ✖ timeline: ...   actual: [ 'is-drag-active' ]   expected: []
 *   ✖ graph: ...      actual: [ 'is-drag-active' ]   expected: []
 *   ✖ tabs: ...       actual: [ 'is-drag-active', 'is-dragging' ]   expected: []
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { TOUCH_DRAG_DELAY_MS, TOUCH_DRAG_START_PX, createCalendar, createGraph, createKanban, createTabs, createTimeline } from '../../ui/index.js';
import { mount, pointer } from '../helpers/ui.js';

const NOW = '2026-09-29T08:00';

/** The marks a view draws on a move in progress, wherever they are in `host`. */
const MARKS = ['is-drag-active', 'is-dragging', 'is-grabbed'];
const marksIn = (host) => MARKS.filter((mark) => host.querySelector(`.${mark}`) !== null);

/**
 * Each view, mounted with one item named `title`: `draw(title)` redraws it under a new name, `item` is the selector of
 * what a finger picks up, `surface` of what hears the drag, and `reports` is every move the view has reported.
 */
const VIEWS = {
  kanban(host, reports) {
    const board = createKanban(host, { onMove: (...move) => reports.push(move) });
    return { item: '.cloudcanvas-ui-kanban-card', surface: '.cloudcanvas-ui-kanban-lane',
      draw: (title) => board.update({ columns: [{ id: 'todo', label: 'To do', cards: [{ id: 'a', title }] }, { id: 'done', label: 'Done', cards: [] }] }) };
  },
  calendar(host, reports) {
    const calendar = createCalendar(host, { onMove: (...move) => reports.push(move) });
    return { item: '.cloudcanvas-ui-calendar-event', surface: '.cloudcanvas-ui-calendar-body',
      draw: (title) => calendar.update({ view: 'month', date: '2026-09-29', now: NOW, locale: 'en-US', events: [{ id: 'a', title, start: '2026-09-29T09:00' }] }) };
  },
  timeline(host, reports) {
    const timeline = createTimeline(host, { onChange: (...move) => reports.push(move) });
    return { item: '.cloudcanvas-ui-timeline-bar', surface: '.cloudcanvas-ui-timeline-sheet',
      draw: (title) => timeline.update({ scale: 'week', now: NOW, locale: 'en-US', items: [{ id: 'a', title, start: '2026-09-28', end: '2026-10-02' }] }) };
  },
  graph(host, reports) {
    const graph = createGraph(host, { onDropOn: (...move) => reports.push(move) });
    return { item: '.cloudcanvas-ui-graph-node', surface: '.cloudcanvas-ui-graph-viewport',
      draw: (title) => graph.update({ nodes: [{ id: 'a', label: title }, { id: 'b', label: 'Other' }], edges: [] }) };
  },
  tabs(host, reports) {
    const tabs = createTabs(host, { onReorder: (...move) => reports.push(move) });
    return { item: '[role="tab"][data-ui-id="a"]', surface: '.cloudcanvas-ui-tabs',
      draw: (title) => tabs.update({ activeId: 'b', items: [{ id: 'a', label: title }, { id: 'b', label: 'Other' }] }) };
  }
};

for (const [name, create] of Object.entries(VIEWS)) {
  test(`${name}: a touch held still picks nothing up and holds nothing back; the move begins when the rested finger travels`, (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const host = mount(t);
    const reports = [];
    const view = create(host, reports);
    const touch = (target, type, x) => pointer(target, type, { clientX: x, clientY: 10, pointerType: 'touch' });
    view.draw('First');
    const surface = host.querySelector(view.surface);
    touch(host.querySelector(view.item), 'pointerdown', 10);
    t.mock.timers.tick(TOUCH_DRAG_DELAY_MS * 3);
    assert.deepEqual(marksIn(host), [], `${name}: nothing is drawn as picked up`);
    view.draw('Renamed');
    assert.match(host.querySelector(view.item).textContent, /Renamed/, `${name}: no move is in hand, so the view still draws what its host says`);
    touch(surface, 'pointerup', 10);
    assert.deepEqual([marksIn(host), reports], [[], []], `${name}: let go, nothing was moved and nothing is reported`);
    touch(host.querySelector(view.item), 'pointerdown', 10);
    t.mock.timers.tick(TOUCH_DRAG_DELAY_MS);
    touch(surface, 'pointermove', 10 + TOUCH_DRAG_START_PX);
    assert.deepEqual(marksIn(host), [], `${name}: a finger that only trembles has not moved`);
    touch(surface, 'pointermove', 40 + TOUCH_DRAG_START_PX);
    assert.ok(marksIn(host).includes('is-drag-active'), `${name}: travel after the rest is the move: ${marksIn(host)}`);
    pointer(surface, 'pointercancel', { pointerType: 'touch' });
    assert.deepEqual([marksIn(host), reports], [[], []], `${name}: called off, it leaves no mark and reports nothing`);
  });
}
