/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Every UI kit control, mounted, exercised and destroyed: nothing is left in
 * the host, and every listener it put on the document or the window is gone
 * (its signal aborted, or removed), so a control that comes and goes a
 * thousand times leaves nothing behind.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as ui from '../../ui/index.js';
import { mount } from '../helpers/ui.js';

/** Record every listener added to `document` or `window` until `stop()`, by shadowing their own methods. */
function spyGlobalListeners() {
  const live = [];
  const saved = [];
  for (const target of [document, window]) {
    for (const name of ['addEventListener', 'removeEventListener']) saved.push([target, name, Object.getOwnPropertyDescriptor(target, name)]);
    const add = target.addEventListener;
    const remove = target.removeEventListener;
    target.addEventListener = function spyAdd(type, listener, options) {
      live.push({ target, type, listener, signal: options?.signal ?? null, removed: false });
      return add.call(target, type, listener, options);
    };
    target.removeEventListener = function spyRemove(type, listener, options) {
      for (const entry of live) if (entry.target === target && entry.type === type && entry.listener === listener) entry.removed = true;
      return remove.call(target, type, listener, options);
    };
  }
  return {
    live,
    stop() {
      for (const [target, name, descriptor] of saved) {
        if (descriptor) Object.defineProperty(target, name, descriptor);
        else delete target[name];
      }
    }
  };
}

const MOUNTS = [
  ['dialog', (host) => { const c = ui.createDialog(host); c.update({ open: true, title: 'x', content: document.createElement('input') }); return c; }],
  ['tabs', (host) => { const c = ui.createTabs(host); c.update({ items: [{ id: 'a', label: 'A' }], activeId: 'a' }); return c; }],
  ['tabs with badges', (host) => { const c = ui.createTabs(host); c.update({ items: [{ id: 'a', label: 'A', badge: { count: 3, shape: 'flag' } }], activeId: null }); return c; }],
  ['tabs with layers', (host) => {
    const c = ui.createTabs(host, { onLayer() {} });
    const layers = ['home', 'work', 'plan', 'launch'].map((id) => ({ id, label: id }));
    c.update({ activeId: 'b', items: [{ id: 'a', label: 'A', pinned: true }, { id: 'b', label: 'B', closable: true, layers }] });
    host.querySelector('[data-ui-fold]').click();
    return c;
  }],
  ['tabs whose fold a press outside has just shut', (host) => {
    const c = ui.createTabs(host);
    c.update({ activeId: 'a', items: [{ id: 'a', label: 'A', layers: ['home', 'work', 'plan', 'launch'].map((id) => ({ id, label: id })) }] });
    host.querySelector('[data-ui-fold]').click();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    return c;
  }],
  ['tabs that can be moved, one of them in hand', (host) => {
    const c = ui.createTabs(host, { onReorder() {} });
    c.update({ activeId: 'a', items: [{ id: 'a', label: 'A', pinned: true }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }] });
    host.querySelector('[data-ui-id="c"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, button: 0, clientX: 0, clientY: 0 }));
    host.querySelector('.cloudcanvas-ui-tabs').dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: 40, clientY: 0 }));
    return c;
  }],
  ['menu', (host) => {
    const c = ui.createMenu(host, { onSelect() {}, onClose() {} });
    c.update({ open: true, label: 'Actions', items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B', items: [{ id: 'c', label: 'C' }] }] });
    host.querySelector('[data-ui-id="b"]').click();
    return c;
  }],
  ['drawer', (host) => {
    const c = ui.createDrawer(host, { onToggle() {} });
    c.update({ open: true, label: 'Menu', collapseTo: host });
    c.update({ open: false, label: 'Menu', collapseTo: host });
    return c;
  }],
  ['splitter', (host) => { const c = ui.createSplitter(host); c.update({ value: 50 }); return c; }],
  ['results', (host) => { const c = ui.createResults(host); c.update({ items: [{ id: 'a', label: 'A' }] }); return c; }],
  ['status', (host) => { const c = ui.createStatus(host); c.update({ status: 'loading' }); return c; }],
  ['badge', (host) => { const c = ui.createBadge(host); c.update({ count: 3, live: true }); return c; }],
  ['flag badge', (host) => { const c = ui.createBadge(host); c.update({ count: 3, shape: 'flag' }); return c; }],
  ['breadcrumbs', (host) => { const c = ui.createBreadcrumbs(host, { onOpen() {} }); c.update({ items: [{ id: 'a', label: 'A' }], current: 'B' }); return c; }],
  ['tree with badges', (host) => { const c = ui.createTree(host); c.update({ items: [{ id: 'a', label: 'A', badge: { count: 3, shape: 'flag' } }, { id: 'b', label: 'B', badge: 2 }] }); return c; }],
  ['toaster', (host) => { const c = ui.createToaster(host); c.show({ message: 'hi' }); return c; }],
  ['toaster with two actions', (host) => { const c = ui.createToaster(host, { onAction() {} }); c.show({ message: 'hi', actions: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] }); return c; }],
  ['composer', (host) => { const c = ui.createComposer(host, { voice: { createRecognition: () => ({ start() {}, stop() {}, abort() {} }) } }); c.update({}); return c; }],
  ['voice', (host) => { const c = ui.createVoiceInput(host, { createRecognition: () => ({ start() {}, stop() {}, abort() {} }) }); c.update({}); return c; }],
  ['markdown', (host) => { const c = ui.createMarkdownView(host, { onTaskToggle() {} }); c.update({ source: '- [ ] a' }); return c; }],
  ['kanban', (host) => { const c = ui.createKanban(host); c.update({ columns: [{ id: 'a', cards: [{ id: '1', title: 'One' }] }] }); return c; }],
  ['calendar', (host) => { const c = ui.createCalendar(host); c.update({ view: 'week', events: [{ id: 'e', start: new Date() }] }); return c; }],
  ['timeline', (host) => { const c = ui.createTimeline(host); c.update({ items: [{ id: 'x', start: new Date() }] }); return c; }],
  ['graph', (host) => { const c = ui.createGraph(host); c.update({ nodes: [{ id: 'a' }] }); return c; }],
  ['switch with a status', (host) => { const c = ui.createSwitch(host); c.update({ label: 'Alerts', status: { text: 'Saved', tone: 'success' } }); return c; }],
  ['chips that choose one', (host) => { const c = ui.createChips(host, { single: true, onChange() {} }); c.update({ label: 'View', value: 'a', items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] }); return c; }],
  ['popover, open', (host) => {
    const anchor = document.createElement('button');
    host.append(anchor);
    const c = ui.createPopover(anchor, { onClose() {} });
    c.update({ open: true, label: 'Details', content: document.createElement('div') });
    return { update: (model) => c.update(model), destroy() { c.destroy(); anchor.remove(); } };
  }],
  ['menu with icons and titles', (host) => {
    const c = ui.createMenu(host, { onSelect() {}, onClose() {} });
    c.update({ open: true, label: 'Actions', items: [{ id: 'a', label: 'A', icon: 'plus', title: 'Add' }, { id: 'b', label: 'B', icon: document.createElementNS('http://www.w3.org/2000/svg', 'svg') }] });
    return c;
  }],
  ['navbar with icons and titles', (host) => { const c = ui.createNavBar(host); c.update({ items: [{ id: 'a', label: 'A', icon: 'info', title: 'About' }], activeId: 'a' }); return c; }],
  ['empty state of a kind', (host) => { const c = ui.createEmptyState(host, { onAction() {} }); c.update({ kind: 'error', title: 'Could not load', actionLabel: 'Try again' }); return c; }],
  ['select', (host) => { const c = ui.createSelect(host); c.update({ label: 'Digest', value: 'a', hint: 'Sent daily', options: [{ value: 'a', label: 'A' }] }); return c; }]
];

/** What the tabs and the views gained from use, mounted the same way: a face, a heading that stands for an item, a selection, a finger at rest. */
const LATER_MOUNTS = [
  ['tabs in the folder face, one that closes holding a flag', (host) => {
    const c = ui.createTabs(host, { face: 'folder', onClose() {} });
    c.update({ items: [{ id: 'a', label: 'A', closable: true, badge: { count: 3, shape: 'flag' } }, { id: 'b', label: 'B', pinned: true }], activeId: 'a' });
    return c;
  }],
  ['kanban with a column that stands for an item, its heading focused, and a selection', (host) => {
    const c = ui.createKanban(host, { onActivate() {} });
    c.update({ selectedId: '1', columns: [{ id: 'a', itemId: 'goal', label: 'Goal', cards: [{ id: '1', title: 'One' }] }] });
    host.querySelector('h3 button').focus();
    return c;
  }],
  ['kanban with a finger resting on a card', (host) => {
    const c = ui.createKanban(host);
    c.update({ columns: [{ id: 'a', cards: [{ id: '1', title: 'One' }] }] });
    host.querySelector('.cloudcanvas-ui-kanban-card').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, button: 0, pointerType: 'touch' }));
    return c;
  }],
  ['calendar with a selection', (host) => { const c = ui.createCalendar(host); c.update({ view: 'month', selectedId: 'e', events: [{ id: 'e', start: new Date() }] }); return c; }],
  ['timeline with a group that is an item, and a selection', (host) => {
    const c = ui.createTimeline(host, { onActivate() {} });
    c.update({ selectedId: 'x', items: [{ id: 'x', start: new Date(), group: { id: 'g', label: 'Group' } }] });
    host.querySelector('.cloudcanvas-ui-timeline-group button').focus();
    return c;
  }]
];

/** Controls that listen on the document or window while mounted - a menu, while it is open: the spy must have seen them. */
const GLOBAL_LISTENERS = new Set(['tabs with layers', 'tabs whose fold a press outside has just shut', 'tabs that can be moved, one of them in hand', 'menu', 'composer', 'voice', 'kanban',
  'kanban with a column that stands for an item, its heading focused, and a selection', 'kanban with a finger resting on a card', 'calendar', 'calendar with a selection', 'timeline',
  'timeline with a group that is an item, and a selection', 'graph', 'popover, open', 'menu with icons and titles']);

for (const [name, create] of [...MOUNTS, ...LATER_MOUNTS]) {
  test(`${name}: destroy empties the host and ends every document and window listener; it is idempotent`, (t) => {
    const host = mount(t);
    const spy = spyGlobalListeners();
    let control;
    try {
      control = create(host);
      assert.ok(host.children.length > 0, 'it mounted something');
      control.destroy();
      control.destroy();
    } finally {
      spy.stop();
    }
    assert.equal(host.children.length, 0);
    if (GLOBAL_LISTENERS.has(name)) assert.ok(spy.live.length > 0, 'the spy saw the global listeners');
    const leaked = spy.live.filter((entry) => !entry.removed && !(entry.signal?.aborted)).map((entry) => entry.type);
    assert.deepEqual(leaked, []);
    assert.doesNotThrow(() => control.update?.({}));
  });
}

test('the entry is side-effect free: importing it injected no stylesheet and registered nothing', async () => {
  const before = document.querySelectorAll('style').length;
  await import(`../../ui/index.js?fresh=${Date.now()}`);
  assert.equal(document.querySelectorAll('style').length, before);
});
