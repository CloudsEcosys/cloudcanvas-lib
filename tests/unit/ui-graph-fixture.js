/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The map the graph suites draw, and a graph mounted on it with every
 * callback logged. Not a suite: the runner's `*.test.js` glob does not pick
 * it up, so importing it runs no case twice.
 *
 * goal ─┬─ copy ── draft        copy ⇢ art (depends-on, "needs")
 *       └─ art (3, collapsed)    side ┄ copy (no kind: related, "see also")
 * side                           copy ┄ gone (an end outside the model)
 * lone
 */
import { createGraph } from '../../ui/index.js';
import { mount } from '../helpers/ui.js';

export const MAP = Object.freeze({
  label: 'Campaign',
  nodes: [
    { id: 'goal', label: 'Launch the spring campaign with every channel ready on day one', status: 'Doing',
      time: { iso: '2026-10-12T09:00', text: 'Mon 9:00', title: 'Monday 12 October, 9:00' } },
    { id: 'copy', label: 'Write copy', status: 'To do' },
    { id: 'draft', label: 'Draft' },
    { id: 'art', label: 'Art', childCount: 3, collapsed: true },
    { id: 'side', label: 'Side quest' },
    { id: 'lone', label: 'Lone' }
  ],
  edges: [
    { from: 'goal', to: 'copy', kind: 'parent' }, { from: 'copy', to: 'draft', kind: 'parent' }, { from: 'goal', to: 'art', kind: 'parent' },
    { from: 'copy', to: 'art', kind: 'depends-on', label: 'needs' }, { from: 'side', to: 'copy', label: 'see also' },
    { from: 'copy', to: 'gone', kind: 'related' }
  ]
});

/** A mounted graph with every callback logged as `[name, ...args]`. */
export function graphOf(t, model = MAP, extra = {}) {
  const host = mount(t);
  const log = [];
  const names = ['onActivate', 'onToggle', 'onDropOn', 'onConnect', 'onViewport', 'onAdd', 'onDelete', 'onMenu', 'onQuery'];
  const callbacks = Object.fromEntries(names.map((name) => [name, (...args) => log.push([name, ...args])]));
  const control = createGraph(host, { ...callbacks, ...extra });
  control.update(model);
  const node = (id) => host.querySelector(`.cloudcanvas-ui-graph-node[data-ui-id="${id}"]`);
  const ids = (selector) => [...host.querySelectorAll(selector)].map((element) => element.getAttribute('data-ui-id'));
  return { host, control, log, node, ids };
}
