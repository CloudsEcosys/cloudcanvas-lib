/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The controls phase 28 added mount, update and destroy on the kit's own test document
 * (`cloudcanvas/ui/testing`), the minimal DOM an app's `node` tests run on. Each case says what it asked of
 * that document. The browser-grade cases are in each control's own suite; these are the ones an app meets.
 *
 * The switch's case was written after its control and passed the first time it ran: the status slot asks the
 * test document for nothing it had not already been asked for. The select's case was written first, and the whole
 * suite failed to load, as the select's own did:
 *
 *   SyntaxError: The requested module '../../.plugin/ui/index.js' does not provide an export named 'createSelect'
 *
 * The confirmation's case failed to load the suite the same way, for `confirmDialog`. The single chips' case was
 * written first and read `TypeError [Error]: Cannot read properties of undefined (reading 'getAttribute')`: with no
 * `single` the group drew no tab stop. The popover's case failed to load the suite the same way, for `createPopover`. The off
 * button's case was written first and failed to load it the same way, for `isOff`. The icon case was
 * written first and read `TypeError [Error]: Cannot read properties of null (reading 'getAttribute')`: no icon was drawn.
 * The tab icon's case was written first and read `TypeError [Error]: view.tab.prepend is not a function`: a node of the
 * test document had no `prepend`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { installDocument, makeNode } from '../../ui/testing/index.js';
import { button, confirmDialog, createChips, createEmptyState, createMenu, createNavBar, createPopover, createSelect, createSwitch, createTabs, isOff, setOff } from '../../ui/index.js';

const doc = installDocument();
const mountOn = () => { const host = makeNode('div'); doc.body.appendChild(host); return host; };

test('test document: a switch mounts with its status slot, reports a press and shows the model again', () => {
  const host = mountOn(), asked = [];
  const toggle = createSwitch(host, { onChange: (checked) => asked.push(checked) });
  toggle.update({ label: 'Reminders', checked: false, status: { text: 'Saved', tone: 'success' } });
  const box = host.querySelector('input'), slot = host.querySelector('.cloudcanvas-ui-switch-status');
  assert.deepEqual([slot.textContent, slot.getAttribute('role'), slot.getAttribute('aria-live')], ['Saved', 'status', 'polite']);
  box.checked = true;
  box.fire('change');
  assert.deepEqual([asked, box.checked], [[true], false]);
  toggle.destroy();
  assert.equal(host.childNodes.length, 0);
});

test('test document: a select mounts, draws its options, reports a choice and shows the model\'s value again', () => {
  const host = mountOn(), asked = [];
  const picker = createSelect(host, { onChange: (value) => asked.push(value) });
  picker.update({ label: 'Digest', value: 'weekly', hint: 'Sent at 8am', options: [{ value: 'daily', label: 'Every day' }, { value: 'weekly', label: 'Every week', disabled: true }] });
  const control = host.querySelector('select');
  assert.deepEqual(host.querySelectorAll('option').map((option) => [option.value, option.textContent, option.disabled]), [['daily', 'Every day', false], ['weekly', 'Every week', true]]);
  assert.equal(control.value, 'weekly');
  assert.equal(host.querySelector('label').getAttribute('for'), control.id);
  control.value = 'daily';
  control.fire('change');
  assert.deepEqual([asked, control.value], [['daily'], 'weekly']);
  picker.destroy();
  assert.equal(host.childNodes.length, 0);
});

test('test document: a confirmation is drawn in the body, answers a press, and leaves nothing behind', async () => {
  const answer = confirmDialog({ title: 'Delete note?', body: 'This cannot be undone.', danger: true });
  const dialog = doc.body.querySelector('dialog'), confirm = doc.body.querySelector('.cloudcanvas-ui-confirm-confirm');
  assert.equal(dialog.getAttribute('open'), '', 'the test document has no showModal: the dialog opens by its attribute');
  assert.equal(confirm.classList.contains('is-danger'), true);
  confirm.click();
  assert.equal(await answer, true);
  assert.equal(doc.body.querySelector('dialog'), null);
  const no = confirmDialog({ title: 'Again?' });
  doc.body.querySelector('.cloudcanvas-ui-confirm-cancel').click();
  assert.equal(await no, false);
});

test('test document: single chips mount with one tab stop, move it with the arrows and report a press', () => {
  const host = mountOn(), asked = [];
  const chips = createChips(host, { single: true, onChange: (value) => asked.push(value) });
  chips.update({ label: 'View', value: 'week', items: [{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }] });
  const [day, week] = host.querySelectorAll('button');
  assert.deepEqual([day.getAttribute('tabindex'), week.getAttribute('tabindex'), week.getAttribute('aria-pressed')], ['-1', '0', 'true']);
  week.focus();
  week.fire('keydown', { key: 'ArrowRight' });
  assert.equal(doc.activeElement, day, 'past the last, the first');
  day.click();
  assert.deepEqual(asked, ['day']);
  chips.destroy();
  assert.equal(host.childNodes.length, 0);
});

test('test document: a popover opens in the body, takes focus, closes on Escape and on a press outside, and leaves nothing', () => {
  const host = mountOn(), anchor = makeNode('button'), content = makeNode('div'), inner = makeNode('button'), closes = [];
  host.append(anchor);
  content.append(inner);
  const pop = createPopover(anchor, { onClose: (reason) => closes.push(reason) });
  pop.update({ open: true, label: 'Details', content });
  const root = doc.body.querySelector('[role="dialog"]');
  assert.deepEqual([root.getAttribute('aria-label'), doc.activeElement === inner], ['Details', true]);
  inner.fire('keydown', { key: 'Escape' });
  assert.deepEqual([closes, doc.activeElement === anchor, doc.body.querySelector('[role="dialog"]')], [['escape'], true, null]);
  pop.update({ open: true, label: 'Details', content });
  doc.fire('pointerdown', { target: host });
  assert.deepEqual(closes, ['escape', 'outside']);
  pop.update({ open: true, label: 'Details', content });
  pop.destroy();
  assert.equal(doc.body.querySelector('[role="dialog"]'), null);
});

test('test document: a button that is off keeps its place, says so, reports no press, and answers setOff', () => {
  const presses = [], node = button(doc, { label: 'Send', off: true, onClick: () => presses.push('press') });
  doc.body.appendChild(node);
  node.focus();
  node.click();
  assert.deepEqual([node.getAttribute('aria-disabled'), node.disabled, presses, doc.activeElement === node, isOff(node)], ['true', false, [], true, true]);
  setOff(node, false);
  node.click();
  assert.deepEqual([presses, isOff(node), node.hasAttribute('aria-disabled')], [['press'], false, false]);
});

test('test document: a menu item and a nav item take an icon and a title, and a kit icon is drawn in the test document\'s own SVG', () => {
  const host = mountOn(), menu = createMenu(host), nav = createNavBar(host);
  menu.update({ open: true, label: 'Actions', at: { x: 1, y: 1 }, items: [{ id: 'add', label: 'Add', icon: 'plus', title: 'Add a note' }] });
  nav.update({ label: 'Views', items: [{ id: 'today', label: 'Today', icon: 'info', title: 'Due today' }] });
  const item = doc.body.querySelector('[role="menuitem"]'), link = host.querySelector('.cloudcanvas-ui-navbar-link');
  assert.deepEqual([item.getAttribute('title'), item.querySelector('svg').getAttribute('data-icon'), link.getAttribute('title'), link.querySelector('svg').getAttribute('data-icon')],
    ['Add a note', 'plus', 'Due today', 'info']);
  menu.destroy(); nav.destroy();
});

test('test document: an empty state of a kind draws its icon first, says its kind and, loading, that it is busy', () => {
  const host = mountOn(), empty = createEmptyState(host);
  empty.update({ kind: 'loading', title: 'Loading notes' });
  const root = host.querySelector('.cloudcanvas-ui-empty');
  assert.deepEqual([root.getAttribute('data-kind'), root.getAttribute('aria-busy'), root.firstElementChild.querySelector('svg').getAttribute('data-icon')], ['loading', 'true', 'loading']);
  empty.update({ title: 'Loading notes' });
  assert.deepEqual([root.hasAttribute('data-kind'), root.hasAttribute('aria-busy'), root.firstElementChild.hidden], [false, false, true]);
  empty.destroy();
});

test('test document: a tab with an icon draws it before its label, and keeps that one icon across a redraw', () => {
  const host = mountOn(), tabs = createTabs(host);
  const items = [{ id: 'one', label: 'One', icon: 'info' }, { id: 'two', label: 'Two' }];
  tabs.update({ label: 'Views', activeId: 'one', items });
  const tab = host.querySelector('[role="tab"]'), slot = tab.querySelector('.cloudcanvas-ui-tabs-icon');
  assert.deepEqual([tab.firstChild === slot, slot.getAttribute('aria-hidden'), slot.querySelector('svg').getAttribute('data-icon')], [true, 'true', 'info']);
  tabs.update({ label: 'Views', activeId: 'two', items });
  assert.deepEqual([tab.querySelectorAll('.cloudcanvas-ui-tabs-icon').length, tab.firstChild === slot], [1, true]);
  tabs.destroy();
});
