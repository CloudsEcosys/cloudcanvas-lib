/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A view that handles pointer drags marks ITSELF as a control (`data-cc-control`),
 * so the canvas under a page - which captures the pointer for a drag that starts
 * on anything that is not one, to pan or to move a blit - leaves the view's drags
 * (a span drawn on a row, a link pulled from a handle, a card carried) to the
 * view. A host used to have to put the marker on the element it gave the view.
 *
 * Every case was written before the code and run on the kit as it stood at
 * `949804c`; each case's comment holds what it read there.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { isControlTarget } from '../../plugins/trait.js';
import { createCalendar, createGraph, createKanban, createTimeline, createTree } from '../../ui/index.js';
import { mount } from '../helpers/ui.js';

const NOW = '2026-09-29T08:00';

/** Each view, how to draw something in it, its root's class, and a part a drag starts on that is no control of its own. */
const VIEWS = [
  ['kanban', createKanban, { columns: [{ id: 'todo', label: 'To do', cards: [{ id: 'a', title: 'A' }] }] }, '.cloudcanvas-ui-kanban', '.cloudcanvas-ui-kanban-lane'],
  ['calendar', createCalendar, { view: 'week', date: '2026-09-29', now: NOW, events: [{ id: 'e', title: 'E', start: '2026-09-29T09:00', end: '2026-09-29T10:00' }] }, '.cloudcanvas-ui-calendar', '.cloudcanvas-ui-calendar-body'],
  ['timeline', createTimeline, { now: NOW, items: [{ id: 'i', title: 'I', start: '2026-09-28', end: '2026-10-02' }] }, '.cloudcanvas-ui-timeline', '.cloudcanvas-ui-timeline-track'],
  ['graph', createGraph, { nodes: [{ id: 'n', label: 'N' }], edges: [] }, '.cloudcanvas-ui-graph', '.cloudcanvas-ui-graph-world'],
  ['tree', createTree, { items: [{ id: 't', label: 'T' }] }, '.cloudcanvas-ui-tree', '.cloudcanvas-ui-tree']
];

/*
 * Seen to fail on the kit of `949804c`, whose view roots carried no marker (the graph's viewport did):
 *
 *   ✖ kanban: the view's root marks itself as a control, with or without a callback, so no host has to
 *     AssertionError [ERR_ASSERTION]: kanban: the root carries data-cc-control
 *       actual: false,
 *       expected: true,
 *   (the same, one case each, for calendar, timeline, graph and tree)
 *
 * The tab strip needs no marker: what it drags are its tabs, buttons, which the canvas already stands down on. The
 * splitter, the menu and the context window carried theirs already.
 */
for (const [name, create, model, rootSelector, partSelector] of VIEWS) {
  test(`${name}: the view's root marks itself as a control, with or without a callback, so no host has to`, (t) => {
    for (const callbacks of [{}, { onActivate: () => {}, onMove: () => {}, onCreate: () => {}, onChange: () => {}, onLink: () => {}, onConnect: () => {} }]) {
      const host = mount(t);
      const view = create(host, callbacks);
      view.update(model);
      t.after(() => view.destroy());
      const root = host.querySelector(rootSelector);
      assert.ok(root, `${name} draws ${rootSelector}`);
      assert.equal(root.hasAttribute('data-cc-control'), true, `${name}: the root carries data-cc-control`);
      const part = host.querySelector(partSelector);
      assert.ok(part, `${name} draws ${partSelector}`);
      assert.equal(isControlTarget(part), true, `${name}: a press on ${partSelector} is on a control: the canvas stands down`);
    }
  });
}
