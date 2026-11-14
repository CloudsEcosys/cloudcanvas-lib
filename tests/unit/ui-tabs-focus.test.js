/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Tabs keep focus across a redraw: a tab that is still there is never taken
 * out of the page, a reorder hands focus back, and focus on a tab that goes
 * moves to the tab stop - with a plain model, with badges, with nothing
 * selected, and with layers and a pinned tab. A layer keeps focus the same
 * way; when it goes, its focus goes to the tab it stood behind. Focus outside
 * the tabs is never theirs to move.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTabs } from '../../ui/index.js';
import { assertSame, mount } from '../helpers/ui.js';

const tabOf = (host, id) => host.querySelector(`[role="tab"][data-ui-id="${id}"]`);
const stopOf = (host) => host.querySelector('[role="tab"][tabindex="0"]');
const layersOf = (host, id) => [...tabOf(host, id).parentElement.querySelectorAll('[role="group"] button')];

/** Parent scopes, outermost first: two fit behind a tab, five fold. */
const TRAIL = [{ id: 'home', label: 'Home' }, { id: 'work', label: 'Work' }, { id: 'q4', label: 'Q4' }, { id: 'launch', label: 'Launch' }, { id: 'copy', label: 'Copy' }];

/** The four shapes of model a redraw is checked with; each has tabs `a`, `b` and `c`. */
const MODELS = Object.freeze({
  plain: { label: 'Views', activeId: 'a', activation: 'manual',
    items: [{ id: 'a', label: 'A', panelId: 'p' }, { id: 'b', label: 'B', panelId: 'p' }, { id: 'c', label: 'C' }] },
  badged: { label: 'Feed', activeId: 'a',
    items: [{ id: 'a', label: 'A', badge: 2 }, { id: 'b', label: 'B', badge: { count: 120, label: '{count} unread', shape: 'flag' } }, { id: 'c', label: 'C' }] },
  'nothing selected': { label: 'Feed', activeId: null,
    items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B', badge: { count: 1, shape: 'flag' } }, { id: 'c', label: 'C', closable: true }] },
  layered: { label: 'Scopes', activeId: 'a',
    items: [{ id: 'a', label: 'A', layers: TRAIL.slice(0, 2) }, { id: 'b', label: 'B', pinned: true, layers: TRAIL }, { id: 'c', label: 'C', closable: true }] }
});

/** A copy of `model` that shares nothing with it: what a host that rebuilds its model on every render hands over. */
const rebuilt = (model) => ({ ...model, items: model.items.map((item) => ({ ...item, badge: typeof item.badge === 'object' ? { ...item.badge } : item.badge,
  layers: item.layers?.map((layer) => ({ ...layer })) })) });

/*
 * Written first and seen to fail on the tabs as they were, where every redraw
 * appended each tab's row again and so took the focused tab out of the page:
 *
 *   ✖ tabs: a redraw that changes nothing about the focused tab leaves focus on it
 *     AssertionError [ERR_ASSERTION]: plain, the same model again: expected <button#ui-tab-2[data-ui-id=b].cloudcanvas-ui-tabs-tab>, got <body>
 */
test('tabs: a redraw that changes nothing about the focused tab leaves focus on it', (t) => {
  for (const [name, model] of Object.entries(MODELS)) {
    const host = mount(t);
    const tabs = createTabs(host);
    tabs.update(model);
    const tab = tabOf(host, 'b');
    const moved = [];
    const watch = new MutationObserver((records) => moved.push(...records));
    watch.observe(host, { childList: true });
    watch.observe(host.querySelector('.cloudcanvas-ui-tabs'), { childList: true });
    tab.focus();
    tabs.update(model);
    assertSame(document.activeElement, tab, `${name}, the same model again`);
    tabs.update(rebuilt(model));
    assertSame(document.activeElement, tab, `${name}, an equal model built afresh`);
    assertSame(tabOf(host, 'b'), tab, `${name}: the same tab, not a rebuilt one`);
    moved.push(...watch.takeRecords());
    watch.disconnect();
    assert.equal(moved.length, 0, `${name}: a tab that stays is not taken out of the page and put back`);
    tabs.destroy();
  }
});

test('tabs: a redraw that changes other things - a label, a badge, the selection - leaves focus where it was', (t) => {
  const host = mount(t);
  const tabs = createTabs(host);
  const model = MODELS.badged;
  tabs.update(model);
  const tab = tabOf(host, 'b');
  tab.focus();
  const changes = {
    'another tab\'s label': { ...model, items: [{ ...model.items[0], label: 'Alerts' }, model.items[1], model.items[2]] },
    'its own badge': { ...model, items: [model.items[0], { ...model.items[1], badge: { count: 3, shape: 'flag', tone: 'danger' } }, model.items[2]] },
    'its badge gone': { ...model, items: [model.items[0], { id: 'b', label: 'B' }, model.items[2]] },
    'a badge it never had': { ...model, items: [model.items[0], { id: 'b', label: 'B', badge: 9 }, model.items[2]] },
    'the selection on it': { ...model, activeId: 'b' },
    'the selection gone': { ...model, activeId: null },
    'a tab added': { ...model, items: [...model.items, { id: 'd', label: 'D' }] },
    'another tab dropped': { ...model, items: [model.items[1], model.items[2]] }
  };
  for (const [name, next] of Object.entries(changes)) {
    tabs.update(next);
    assertSame(document.activeElement, tab, name);
  }
  tabs.destroy();
});

test('tabs: a redraw that reorders the tabs hands focus back to the tab that had it', (t) => {
  for (const [name, model] of Object.entries(MODELS)) {
    const host = mount(t);
    const tabs = createTabs(host);
    tabs.update(model);
    const tab = tabOf(host, 'a');
    tab.focus();
    tabs.update({ ...model, items: [model.items[2], model.items[1], model.items[0]] });
    assert.deepEqual([...host.querySelectorAll('[role="tab"]')].map((node) => node.getAttribute('data-ui-id')), ['c', 'b', 'a'], name);
    assertSame(tabOf(host, 'a'), tab, `${name}: the same tab, moved`);
    assertSame(document.activeElement, tab, `${name}: moving a tab takes its focus, so the redraw gives it back`);
    tabs.destroy();
  }
});

/*
 * Written first and seen to fail: a tab that went took focus with it, and the
 * keys had nowhere to go on from.
 *
 *   ✖ tabs: a redraw that removes the focused tab moves focus to the tab stop
 *     AssertionError [ERR_ASSERTION]: plain: expected <button#ui-tab-11[data-ui-id=a].cloudcanvas-ui-tabs-tab>, got <body>
 */
test('tabs: a redraw that removes the focused tab moves focus to the tab stop', (t) => {
  for (const [name, model] of Object.entries(MODELS)) {
    const host = mount(t);
    const tabs = createTabs(host);
    tabs.update(model);
    tabOf(host, 'b').focus();
    tabs.update({ ...model, items: [model.items[0], model.items[2]] });
    assertSame(tabOf(host, 'b'), null);
    assert.ok(stopOf(host), `${name}: there is a tab stop`);
    assertSame(document.activeElement, stopOf(host), name);
    assertSame(document.activeElement, tabOf(host, 'a'), `${name}: the selected tab, or with none selected the first`);
    tabs.destroy();
  }
});

test('tabs: focus on the close button of a tab that goes moves to the tab stop too; with no tab left, or focus elsewhere, nothing is moved', (t) => {
  const host = mount(t);
  const outside = document.createElement('button');
  host.append(outside);
  const tabs = createTabs(host);
  const model = MODELS['nothing selected'];
  tabs.update(model);
  host.querySelector('[data-ui-close="c"]').focus();
  tabs.update({ ...model, items: [model.items[0], model.items[1]] });
  assertSame(document.activeElement, tabOf(host, 'a'), 'the × went with its tab');
  outside.focus();
  tabs.update({ ...model, items: [model.items[1]] });
  assertSame(document.activeElement, outside, 'focus outside the tabs is not theirs to move');
  tabOf(host, 'b').focus();
  assert.doesNotThrow(() => tabs.update({ ...model, items: [] }));
  assertSame(host.querySelector('[role="tab"]'), null);
  assert.notEqual(document.activeElement?.getAttribute?.('role'), 'tab', 'with no tab left there is no stop to move to');
  tabs.destroy();
});

/*
 * Written first and seen to fail on tabs that drew no layer:
 *
 *   ✖ tabs: a redraw leaves focus on a layer that stays, and hands it back when the tabs or the layers reorder
 *     TypeError: Cannot read properties of undefined (reading 'parentElement')
 */
test('tabs: a redraw leaves focus on a layer that stays, and hands it back when the tabs or the layers reorder', (t) => {
  const host = mount(t);
  const tabs = createTabs(host);
  const model = MODELS.layered;
  tabs.update(model);
  for (const [name, layer] of [['a layer', layersOf(host, 'a')[1]], ['the fold', layersOf(host, 'b')[0]]]) {
    const moved = [];
    const watch = new MutationObserver((records) => moved.push(...records));
    watch.observe(layer.parentElement, { childList: true });
    watch.observe(layer.parentElement.parentElement, { childList: true });
    layer.focus();
    tabs.update(model);
    assertSame(document.activeElement, layer, `${name}, the same model again`);
    tabs.update(rebuilt(model));
    assertSame(document.activeElement, layer, `${name}, an equal model built afresh`);
    moved.push(...watch.takeRecords());
    watch.disconnect();
    assert.equal(moved.length, 0, `${name} that stays is not taken out of its group, nor its group out of its row`);
  }
  const layer = layersOf(host, 'a')[1];
  layer.focus();
  const [a, b, c] = model.items;
  const changes = {
    'its own label': { ...model, items: [{ ...a, layers: [TRAIL[0], { id: 'work', label: 'Work, renamed' }] }, b, c] },
    'its tab\'s label': { ...model, items: [{ ...a, label: 'Alerts' }, b, c] },
    'the selection moving away': { ...model, activeId: 'c' },
    'a layer added behind it': { ...model, items: [{ ...a, layers: [{ id: 'root', label: 'Root' }, ...a.layers] }, b, c] },
    'its tab pinned': { ...model, items: [{ ...a, pinned: true }, b, c] },
    'the tabs reordered': { ...model, items: [c, b, a] },
    'its layers reordered': { ...model, items: [{ ...a, layers: [TRAIL[1], TRAIL[0]] }, b, c] }
  };
  for (const [name, next] of Object.entries(changes)) {
    tabs.update(next);
    assertSame(layersOf(host, 'a').find((node) => node.getAttribute('data-ui-layer') === 'work'), layer, `${name}: the same button`);
    assertSame(document.activeElement, layer, name);
  }
  tabs.destroy();
});

test('tabs: focus on a layer that goes moves to its tab, which takes the tab stop; with its tab gone too, to the tab stop', (t) => {
  const host = mount(t);
  const outside = document.createElement('button');
  host.append(outside);
  const tabs = createTabs(host);
  const model = MODELS.layered;
  const [a, b, c] = model.items;
  tabs.update(model);
  layersOf(host, 'a')[1].focus();
  tabs.update({ ...model, items: [{ ...a, layers: TRAIL.slice(0, 1) }, b, c] });
  assertSame(document.activeElement, tabOf(host, 'a'), 'the scope that layer led to is the tab now');
  layersOf(host, 'b')[0].focus();
  tabs.update({ ...model, items: [a, { ...b, layers: TRAIL.slice(0, 3) }, c] });
  assert.equal(layersOf(host, 'b').length, 3, 'three fit, so the fold went');
  assertSame(document.activeElement, tabOf(host, 'b'), 'the fold\'s focus goes to its tab, not to the selected one');
  assertSame(stopOf(host), tabOf(host, 'b'), 'and the tab stop goes with it: focus and the stop stay together');
  assert.equal(host.querySelectorAll('[role="tab"][tabindex="0"]').length, 1);
  host.querySelector('[data-ui-close="c"]').focus();
  tabs.update({ ...model, items: [a, b, { ...c, pinned: true }] });
  assertSame(document.activeElement, tabOf(host, 'c'), 'a close control that goes because its tab was pinned leaves focus on that tab');
  layersOf(host, 'b')[0].focus();
  tabs.update({ ...model, items: [a, c] });
  assertSame(document.activeElement, stopOf(host), 'its tab went with it: the tab stop takes focus');
  assertSame(document.activeElement, tabOf(host, 'c'), 'wherever that stop was last put');
  outside.focus();
  tabs.update(model);
  tabs.update({ ...model, items: [c] });
  assertSame(document.activeElement, outside, 'focus outside the tabs is not theirs to move');
  tabs.destroy();
});
