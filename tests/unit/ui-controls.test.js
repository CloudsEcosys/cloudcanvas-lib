/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Dialog, tabs, splitter, results and status: roles and names, keyboard
 * paths, controlled updates, and a `destroy()` that leaves nothing wired.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDialog, createGraph, createResults, createSplitter, createStatus, createTabs, splitterKeyValue } from '../../ui/index.js';
import { isControlTarget } from '../../plugins/trait.js';
import { assertSame, key, mount, pointer, stubBox } from '../helpers/ui.js';

function form() {
  const node = document.createElement('div');
  node.innerHTML = '<input id="first" aria-label="Name"><button id="last" type="button">Save</button>';
  return node;
}

test('dialog: labelled, focuses its content, reports Escape, backdrop and Close, restores focus', (t) => {
  const host = mount(t);
  const opener = document.createElement('button');
  host.append(opener);
  opener.focus();
  const reasons = [];
  const dialog = createDialog(host, { onClose: (reason) => reasons.push(reason) });
  const content = form();
  dialog.update({ open: true, title: 'Rename', description: 'Pick a name', content });
  const root = host.querySelector('dialog');
  assert.equal(root.open, true);
  assert.equal(document.getElementById(root.getAttribute('aria-labelledby')).textContent, 'Rename');
  assert.equal(document.getElementById(root.getAttribute('aria-describedby')).textContent, 'Pick a name');
  assert.equal(document.activeElement.id, 'first');
  assert.equal(key(root, 'Escape').defaultPrevented, true);
  root.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  root.querySelector('.cloudcanvas-ui-dialog-close').click();
  content.querySelector('#last').click();
  assert.deepEqual(reasons, ['escape', 'backdrop', 'button'], 'a click inside the content is not a backdrop click');
  dialog.update({ open: false, title: 'Rename' });
  assert.equal(root.open, false);
  assertSame(document.activeElement, opener);
});

test('dialog: Tab wraps inside a modal; dismissible false keeps Escape and backdrop quiet', (t) => {
  const host = mount(t);
  const reasons = [];
  const dialog = createDialog(host, { onClose: (reason) => reasons.push(reason) });
  const content = form();
  dialog.update({ open: true, title: 'Busy', content, dismissible: false });
  const root = host.querySelector('dialog');
  const close = root.querySelector('.cloudcanvas-ui-dialog-close');
  content.querySelector('#first').focus();
  assert.equal(key(root, 'Tab').defaultPrevented, false, 'inside the order, Tab is the platform\'s');
  content.querySelector('#last').focus();
  assert.equal(key(root, 'Tab').defaultPrevented, true);
  assertSame(document.activeElement, close, 'past the last control, focus wraps to the header Close');
  key(root, 'Tab', { shiftKey: true });
  assertSame(document.activeElement, content.querySelector('#last'));
  key(root, 'Escape');
  root.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  assert.deepEqual(reasons, []);
});

test('dialog: stacked dialogs answer Escape one at a time; destroy removes it', (t) => {
  const host = mount(t);
  const closed = [];
  const lower = createDialog(host, { onClose: () => closed.push('lower') });
  const upper = createDialog(host, { onClose: () => closed.push('upper') });
  lower.update({ open: true, title: 'Lower', content: form() });
  upper.update({ open: true, title: 'Upper', content: form() });
  key(document.activeElement, 'Escape');
  assert.deepEqual(closed, ['upper']);
  upper.destroy();
  lower.destroy();
  lower.update({ open: true, title: 'Again' });
  assertSame(host.querySelector('dialog'), null);
});

/*
 * Written first and seen to fail on a dialog the kit never centred: the browser's own `dialog { margin: auto }` did,
 * and a host that resets every margin (`* { margin: 0 }`) took that away, so the dialog opened in a corner.
 * That it is centred on screen is `tests/browser/ui-kit.test.js`; that the kit's rule is the one that holds is here.
 *
 *   ✖ dialog: centred by the kit's own rule, which a host that resets every margin does not take away
 *     AssertionError [ERR_ASSERTION]: the host's reset moved the dialog
 *     actual: [ '0px', '0px', '0px', '0px' ]   expected: [ 'auto', 'auto', 'auto', 'auto' ]
 */
test('dialog: centred by the kit\'s own rule, which a host that resets every margin does not take away', (t) => {
  const reset = document.createElement('style');
  reset.textContent = '* { box-sizing: border-box; margin: 0; padding: 0; }';
  document.head.append(reset);
  t.after(() => reset.remove());
  const host = mount(t);
  const dialog = createDialog(host);
  dialog.update({ open: true, title: 'Rename', content: form() });
  const margins = (node) => ['Top', 'Right', 'Bottom', 'Left'].map((side) => getComputedStyle(node)[`margin${side}`]);
  assert.deepEqual(margins(host.querySelector('dialog')), ['auto', 'auto', 'auto', 'auto'], 'the host\'s reset moved the dialog');
  assert.deepEqual(margins(host.querySelector('.cloudcanvas-ui-dialog-title')), ['0px', '0px', '0px', '0px'], 'and its title keeps the margin the kit gave it');
  dialog.destroy();
});

test('tabs: a labelled tablist, roving arrows select, Delete and × close, manual activation waits', (t) => {
  const host = mount(t);
  const selected = [];
  const closed = [];
  const tabs = createTabs(host, { onSelect: (id) => selected.push(id), onClose: (id) => closed.push(id) });
  const items = [{ id: 'a', label: 'Today', panelId: 'p-a' }, { id: 'b', label: 'Notes', closable: true }, { id: 'c', label: 'Off', disabled: true }];
  tabs.update({ label: 'Views', activeId: 'a', items });
  const list = host.querySelector('[role="tablist"]');
  const nodes = [...host.querySelectorAll('[role="tab"]')];
  assert.equal(list.getAttribute('aria-label'), 'Views');
  assert.equal(nodes[0].parentElement.getAttribute('role'), 'presentation');
  assert.equal(nodes[0].getAttribute('aria-controls'), 'p-a');
  assert.deepEqual(nodes.map((node) => node.getAttribute('tabindex')), ['0', '-1', '-1']);
  key(nodes[0], 'ArrowRight');
  assert.deepEqual(selected, ['b']);
  assertSame(document.activeElement, nodes[1]);
  tabs.update({ label: 'Views', activeId: 'b', items });
  key(nodes[1], 'ArrowRight');
  assert.deepEqual(selected, ['b', 'a'], 'the disabled tab is skipped and the list wraps');
  key(nodes[1], 'Delete');
  host.querySelector('[data-ui-close="b"]').click();
  assert.deepEqual(closed, ['b', 'b']);
  assert.equal(host.querySelector('[data-ui-close="a"]').hidden, true);
  tabs.update({ label: 'Views', activeId: 'a', items, activation: 'manual' });
  key(nodes[0], 'ArrowRight');
  assert.equal(selected.length, 2, 'manual: moving focus selects nothing');
  key(document.activeElement, 'Enter');
  assert.deepEqual(selected, ['b', 'a', 'b']);
  tabs.update({ activeId: 'a', items: items.slice(0, 1) });
  assert.equal(host.querySelectorAll('[role="tab"]').length, 1);
  tabs.destroy();
  assertSame(host.querySelector('[role="tablist"]'), null);
});

test('splitter: keys step within limits; a drag reports percentages; a sizeless host reports nothing', (t) => {
  const host = mount(t);
  const values = [];
  const split = createSplitter(host, { onChange: (value) => values.push(value) });
  split.update({ value: 50, min: 20, max: 80, label: 'Panes' });
  const bar = host.querySelector('[role="separator"]');
  assert.equal(bar.getAttribute('aria-valuenow'), '50');
  assert.equal(bar.getAttribute('aria-label'), 'Panes');
  for (const name of ['ArrowRight', 'ArrowLeft', 'Home', 'End', 'PageDown', 'x']) key(bar, name);
  assert.deepEqual(values, [51, 49, 20, 80, 60]);
  assert.equal(splitterKeyValue('ArrowDown', { value: 10, orientation: 'horizontal', step: 5 }), 15);
  values.length = 0;
  pointer(bar, 'pointerdown', { clientX: 100 });
  pointer(bar, 'pointermove', { clientX: 200 });
  assert.deepEqual(values, [], 'no size, no guess');
  stubBox(host, { width: 400, height: 100 });
  pointer(bar, 'pointerdown', { clientX: 100 });
  pointer(bar, 'pointermove', { clientX: 140 });
  pointer(bar, 'pointerup', {});
  pointer(bar, 'pointermove', { clientX: 400 });
  assert.deepEqual(values, [60]);
  split.destroy();
  key(bar, 'ArrowRight');
  assert.deepEqual(values, [60]);
});

test('splitter: inside a canvas a press on the bar is a control\'s, never the start of a canvas gesture', (t) => {
  const host = mount(t);
  const split = createSplitter(host);
  split.update({ value: 50 });
  const bar = host.querySelector('[role="separator"]');
  assert.equal(isControlTarget(host), false, 'the host alone is not a control, so the answer below is the bar\'s own');
  assert.equal(isControlTarget(bar), true);
  split.destroy();
});

test('results and graph: inside a canvas a press on an option, or on the graph viewport, is a control\'s', (t) => {
  const host = mount(t);
  const results = createResults(host);
  results.update({ items: [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }] });
  assert.equal(isControlTarget(host.querySelector('[role="listbox"]')), false, 'the list alone is not a control, so the answer below is the option\'s own');
  for (const option of host.querySelectorAll('[role="option"]')) assert.equal(isControlTarget(option), true);
  results.destroy();
  const graph = createGraph(host);
  graph.update({ nodes: [{ id: 'a', label: 'Plan' }] });
  const viewport = host.querySelector('.cloudcanvas-ui-graph-viewport');
  // K4: the root is the control now (it was the viewport alone), so a host marks nothing: see ui-control-root.test.js.
  assert.equal(isControlTarget(host.querySelector('.cloudcanvas-ui-graph')), true, 'the graph handles its pointer drags itself');
  assert.equal(isControlTarget(viewport), true, 'the viewport pans and zooms by itself');
  assert.equal(isControlTarget(viewport.firstElementChild), true, 'so does everything drawn inside it');
  graph.destroy();
});

test('results: a listbox that roves and activates; attached to a field it drives aria-activedescendant', (t) => {
  const host = mount(t);
  const activated = [];
  const highlighted = [];
  const results = createResults(host, { onActivate: (id) => activated.push(id), onHighlight: (id) => highlighted.push(id) });
  results.update({ label: 'Matches', items: [{ id: 'a', label: 'Alpha', detail: 'note' }, { id: 'b', label: 'Beta' }], emptyText: 'None' });
  const list = host.querySelector('[role="listbox"]');
  const options = [...list.querySelectorAll('[role="option"]')];
  assert.equal(options[1].querySelector('.cloudcanvas-ui-results-detail').hidden, true);
  assert.equal(host.querySelector('.cloudcanvas-ui-results-empty').hidden, true);
  options[1].click();
  key(options[0], 'ArrowDown');
  assertSame(document.activeElement, options[1]);
  key(options[1], 'Enter');
  assert.deepEqual(activated, ['b', 'b']);
  const field = document.createElement('input');
  host.append(field);
  const detach = results.attachInput(field);
  results.update({ label: 'Matches', items: [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }] });
  assert.equal(field.getAttribute('role'), 'combobox');
  assert.equal(field.getAttribute('aria-controls'), list.id);
  key(field, 'ArrowDown');
  assert.equal(field.getAttribute('aria-activedescendant'), options[1].id);
  key(field, 'Enter');
  assert.deepEqual(activated, ['b', 'b', 'b']);
  key(field, 'Escape');
  assert.equal(field.hasAttribute('aria-activedescendant'), false);
  results.update({ items: [], emptyText: 'Nothing found' });
  assert.equal(host.querySelector('.cloudcanvas-ui-results-empty').textContent, 'Nothing found');
  assert.equal(field.getAttribute('aria-expanded'), 'false');
  detach();
  assert.equal(field.hasAttribute('role'), false);
  assert.ok(highlighted.includes('b'));
  results.destroy();
});

test('status: one live line; Retry only for error or unavailable with a function; words overridable', (t) => {
  const host = mount(t);
  const status = createStatus(host);
  let retried = 0;
  status.update({ status: 'idle' });
  const root = host.querySelector('[role="status"]');
  assert.equal(root.querySelector('.cloudcanvas-ui-status-retry').hidden, true);
  status.update({ status: 'ready', message: 'Saved', retry: () => { retried += 1; } });
  assert.equal(root.querySelector('.cloudcanvas-ui-status-retry').hidden, true, 'no retry when ready');
  status.update({ status: 'error', message: 'Could not load', retry: () => { retried += 1; }, retryLabel: 'Try again' });
  assert.equal(root.getAttribute('aria-live'), 'assertive');
  const retry = root.querySelector('.cloudcanvas-ui-status-retry');
  assert.equal(retry.textContent, 'Try again');
  retry.click();
  assert.equal(retried, 1);
  status.update({ status: 'empty', labels: { empty: 'Nothing planned today' } });
  assert.equal(root.querySelector('.cloudcanvas-ui-status-label').textContent, 'Nothing planned today');
  assert.throws(() => status.update({ status: 'weird' }), /Unknown status/);
  status.destroy();
  assertSame(host.querySelector('[role="status"]'), null);
});

test('status: the host gives its words once at creation; every update uses them, and a per-update word still wins', (t) => {
  const host = mount(t);
  const status = createStatus(host, { labels: { loading: 'Fetching', ready: 'Up to date' }, retryLabel: 'Again' });
  const label = host.querySelector('.cloudcanvas-ui-status-label');
  const retry = host.querySelector('.cloudcanvas-ui-status-retry');
  status.update({ status: 'loading' });
  assert.equal(label.textContent, 'Fetching');
  status.update({ status: 'ready' });
  assert.equal(label.textContent, 'Up to date');
  assert.equal(label.hidden, false, 'a word the host supplied is shown, though the kit\'s own word for ready is silent');
  status.update({ status: 'empty' });
  assert.equal(label.textContent, 'Nothing here yet', 'a status the host did not name keeps the kit\'s word');
  status.update({ status: 'error', retry() {} });
  assert.equal(retry.textContent, 'Again');
  status.update({ status: 'error', retry() {}, labels: { error: 'Failed' }, retryLabel: 'Retry now' });
  assert.equal(label.textContent, 'Failed');
  assert.equal(retry.textContent, 'Retry now');
  status.update({ status: 'error', retry() {} });
  assert.equal(retry.textContent, 'Again', 'the next update is back to the host\'s word');
  status.destroy();
});

test('status: idle from creation, so a host that has reported nothing yet shows no Retry', (t) => {
  const host = mount(t);
  const status = createStatus(host);
  const root = host.querySelector('[role="status"]');
  assert.equal(root.getAttribute('data-status'), 'idle');
  assert.ok(root.classList.contains('is-quiet'));
  for (const part of ['retry', 'label', 'message']) {
    assert.equal(root.querySelector(`.cloudcanvas-ui-status-${part}`).hidden, true, `${part} is hidden before the first update`);
  }
  status.destroy();
});
