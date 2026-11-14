/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Nav bar: a labelled landmark of destinations, the current one marked, a
 * badge on the ones with something waiting, and a placement the sheet can lay
 * out without the host rebuilding anything.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createNavBar } from '../../ui/index.js';
import { assertSame, mount } from '../helpers/ui.js';

const ITEMS = Object.freeze([
  { id: 'today', label: 'Today' },
  { id: 'plan', label: 'Plan' },
  { id: 'people', label: 'People', badge: { count: 120, label: '{count} unread' } }
]);

const link = (host, id) => host.querySelector(`[data-ui-id="${id}"]`);
const badge = (host, id) => link(host, id).querySelector('.cloudcanvas-ui-badge');

test('navbar: a labelled <nav> of buttons, the active one marked as the current page', (t) => {
  const host = mount(t);
  const nav = createNavBar(host);
  nav.update({ label: 'Workspace views', items: ITEMS, activeId: 'plan' });
  const root = host.querySelector('nav');
  assert.equal(root.getAttribute('aria-label'), 'Workspace views');
  assert.deepEqual([...root.querySelectorAll('button')].map((node) => node.type), ['button', 'button', 'button']);
  assert.deepEqual(ITEMS.map((item) => link(host, item.id).getAttribute('aria-current')), [null, 'page', null]);
  assert.equal(link(host, 'today').querySelector('.cloudcanvas-ui-navbar-label').textContent, 'Today');
  nav.update({ items: ITEMS, activeId: 'today' });
  assert.deepEqual(ITEMS.map((item) => link(host, item.id).getAttribute('aria-current')), ['page', null, null]);
  assert.equal(root.getAttribute('aria-label'), 'Navigation', 'the default name');
  nav.update({ items: ITEMS });
  assertSame(host.querySelector('[aria-current]'), null, 'no active id, no current page');
  nav.destroy();
});

test('navbar: placement is top unless the model says bottom, written where the sheet reads it', (t) => {
  const host = mount(t);
  const nav = createNavBar(host);
  const root = host.querySelector('nav');
  nav.update({ items: ITEMS });
  assert.equal(root.getAttribute('data-placement'), 'top');
  nav.update({ items: ITEMS, placement: 'bottom' });
  assert.equal(root.getAttribute('data-placement'), 'bottom');
  nav.update({ items: ITEMS, placement: 'sideways' });
  assert.equal(root.getAttribute('data-placement'), 'top', 'a placement the sheet has no layout for is the default');
  nav.destroy();
});

test('navbar: a badge is the kit badge inside its button - a capped figure, the whole count spoken, gone at zero', (t) => {
  const host = mount(t);
  const nav = createNavBar(host);
  nav.update({ items: ITEMS, activeId: 'today' });
  assert.equal(badge(host, 'people').hidden, false);
  assert.equal(badge(host, 'people').querySelector('.cloudcanvas-ui-badge-figure').textContent, '99+');
  assert.equal(badge(host, 'people').querySelector('.cloudcanvas-ui-sr-only').textContent, '120 unread');
  assert.equal(badge(host, 'today').hidden, true, 'an item with no badge shows none');
  nav.update({ items: [ITEMS[0], { id: 'plan', label: 'Plan', badge: 3 }, { id: 'people', label: 'People', badge: { count: 0 } }] });
  assert.equal(badge(host, 'plan').querySelector('.cloudcanvas-ui-badge-figure').textContent, '3', 'a bare number is the count');
  assert.equal(badge(host, 'plan').hidden, false);
  assert.equal(badge(host, 'people').hidden, true);
  assert.equal(link(host, 'plan').querySelectorAll('.cloudcanvas-ui-badge').length, 1, 'one badge per item, however often it is redrawn');
  nav.destroy();
});

test('navbar: a press reports the destination, the current one included; items come, go and reorder in place', (t) => {
  const host = mount(t);
  const selected = [];
  const nav = createNavBar(host, { onSelect: (id) => selected.push(id) });
  nav.update({ items: ITEMS, activeId: 'today' });
  link(host, 'plan').click();
  link(host, 'today').click();
  link(host, 'people').querySelector('.cloudcanvas-ui-badge').click();
  assert.deepEqual(selected, ['plan', 'today', 'people'], 'a press on the badge is a press on its item');
  assert.equal(link(host, 'today').getAttribute('aria-current'), 'page', 'the bar shows what the next model says, not what was pressed');
  const plan = link(host, 'plan');
  const today = link(host, 'today');
  plan.focus();
  nav.update({ items: [ITEMS[2], ITEMS[1], { id: 'notes', label: 'Notes' }], activeId: 'plan' });
  assert.deepEqual([...host.querySelectorAll('button')].map((node) => node.getAttribute('data-ui-id')), ['people', 'plan', 'notes']);
  assertSame(link(host, 'plan'), plan, 'the same element, not a rebuilt one');
  assertSame(document.activeElement, plan);
  assertSame(link(host, 'today'), null, 'an item the model dropped is gone');
  assertSame(today.querySelector('.cloudcanvas-ui-badge'), null, 'and its badge was destroyed with it');
  assert.throws(() => nav.update({ items: [{ id: 'a', label: 'A' }, { id: 'a', label: 'B' }] }), /duplicate navbar id/);
  nav.destroy();
});

test('navbar: destroy removes the landmark and its badges, ends its listeners, and is safe to repeat', (t) => {
  const host = mount(t);
  const selected = [];
  const nav = createNavBar(host, { onSelect: (id) => selected.push(id) });
  nav.update({ items: ITEMS, activeId: 'today' });
  const first = link(host, 'today');
  nav.destroy();
  nav.destroy();
  first.click();
  assert.deepEqual(selected, []);
  assert.equal(host.children.length, 0);
  assertSame(first.querySelector('.cloudcanvas-ui-badge'), null, 'each badge was destroyed with its item');
  assert.doesNotThrow(() => nav.update({ items: ITEMS }));
  assert.equal(host.children.length, 0);
});
