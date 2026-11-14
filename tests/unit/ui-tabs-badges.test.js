/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Tabs with badges and with nothing selected: a tab's badge is the kit badge
 * through the nav bar's own model, it leaves the tablist's ARIA structure as
 * it was, and a tablist with no selection still has exactly one tab stop.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createNavBar, createTabs } from '../../ui/index.js';
import { badgeModel } from '../../ui/badge.js';
import { assertSame, key, mount } from '../helpers/ui.js';

const BADGE = '.cloudcanvas-ui-badge';
const tabOf = (host, id) => host.querySelector(`[role="tab"][data-ui-id="${id}"]`);
const stops = (host) => [...host.querySelectorAll('[role="tab"]')].map((node) => node.getAttribute('tabindex'));
const selected = (host) => [...host.querySelectorAll('[role="tab"]')].map((node) => node.getAttribute('aria-selected'));

/** A badge's markup with the one thing that is its own taken out: the id of a flag's gradient. */
const drawn = (badge) => badge.outerHTML.replace(/cloudcanvas-ui-badge-flag-\d+/g, 'cloudcanvas-ui-badge-flag-n');

test('badgeModel: an item\'s own model, a bare number as its count, or nothing at all', () => {
  const own = { count: 4, label: '{count} unread', shape: 'flag' };
  assertSame(badgeModel(own), own);
  assert.deepEqual(badgeModel(3), { count: 3 });
  assert.deepEqual(badgeModel(0), { count: 0 });
  for (const none of [undefined, null, '3', true]) assert.deepEqual(badgeModel(none), {}, `${String(none)} is no badge`);
});

test('tabs: a badge is the kit badge inside its tab, drawn from the model the nav bar takes', (t) => {
  const host = mount(t);
  const navHost = mount(t);
  const badges = { alerts: { count: 120, label: '{count} unread', tone: 'danger', shape: 'flag' }, notes: 3 };
  const items = [{ id: 'alerts', label: 'Alerts', badge: badges.alerts }, { id: 'notes', label: 'Notes', badge: badges.notes },
    { id: 'plain', label: 'Plain' }];
  const tabs = createTabs(host);
  const nav = createNavBar(navHost);
  tabs.update({ label: 'Feed', activeId: 'alerts', items });
  nav.update({ items });
  for (const id of ['alerts', 'notes']) {
    const badge = tabOf(host, id).querySelector(BADGE);
    assert.ok(badge, `${id} carries its badge inside the tab`);
    assert.equal(drawn(badge), drawn(navHost.querySelector(`[data-ui-id="${id}"] ${BADGE}`)), `${id}: one model, one badge, in a tab or a nav bar`);
  }
  const alerts = tabOf(host, 'alerts').querySelector(BADGE);
  assert.equal(alerts.getAttribute('data-shape'), 'flag');
  assert.equal(alerts.getAttribute('data-tone'), 'danger');
  assert.equal(alerts.querySelector('.cloudcanvas-ui-badge-figure').textContent, '99+');
  assert.equal(alerts.querySelector('.cloudcanvas-ui-sr-only').textContent, '120 unread');
  assert.equal(tabOf(host, 'notes').querySelector('.cloudcanvas-ui-badge-figure').textContent, '3', 'a bare number is the count');
  assertSame(tabOf(host, 'plain').querySelector(BADGE), null, 'a tab with no badge is the tab it always was');
  assert.equal(tabOf(host, 'plain').textContent, 'Plain');
  assert.equal(tabOf(host, 'plain').classList.contains('is-badged'), false);
  assert.equal(tabOf(host, 'alerts').classList.contains('is-badged'), true, 'where the sheet lays a label and its badge side by side');
  assert.deepEqual([tabOf(host, 'alerts').firstChild.className, tabOf(host, 'alerts').firstChild.textContent], ['cloudcanvas-ui-tabs-label', 'Alerts'],
    'the label comes first, in an element of its own: the sheet cuts a long one there and keeps the badge beside it');
  tabs.destroy();
  nav.destroy();
});

test('tabs: a badge leaves the ARIA structure alone - owned tabs, close buttons beside them, keys and presses', (t) => {
  const host = mount(t);
  const chosen = [];
  const closed = [];
  const tabs = createTabs(host, { onSelect: (id) => chosen.push(id), onClose: (id) => closed.push(id) });
  const items = [{ id: 'a', label: 'Alerts', badge: { count: 2, shape: 'flag' }, closable: true, panelId: 'p-a' },
    { id: 'b', label: 'Notes', badge: 7, closable: true }];
  tabs.update({ label: 'Feed', activeId: 'a', items });
  const list = host.querySelector('[role="tablist"]');
  const nodes = [...host.querySelectorAll('[role="tab"]')];
  assert.equal(nodes.length, 2, 'a badge is not a tab');
  assert.equal(list.getAttribute('aria-owns'), nodes.map((node) => node.id).join(' '));
  assert.equal(list.contains(nodes[0].querySelector(BADGE)), false);
  assert.equal(nodes[0].getAttribute('aria-controls'), 'p-a');
  for (const node of nodes) {
    assert.equal(node.parentElement.getAttribute('role'), 'presentation');
    assert.equal(node.querySelectorAll('button, [role]').length, 0, 'nothing interactive and no role inside a tab');
    const close = node.nextElementSibling;
    assert.equal(close.getAttribute('data-ui-close'), node.getAttribute('data-ui-id'), 'the close button still follows its tab');
    assert.equal(close.getAttribute('aria-label'), `Close ${node.firstChild.textContent}`, 'and is named for the label, not the count');
  }
  nodes[1].querySelector('.cloudcanvas-ui-badge-figure').click();
  nodes[0].querySelector('.cloudcanvas-ui-badge-flag-figure').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  assert.deepEqual(chosen, ['b'], 'a press on a badge is a press on its tab, and the active tab reports nothing');
  key(nodes[0], 'ArrowRight');
  key(nodes[1], 'Delete');
  assert.deepEqual(chosen, ['b', 'b']);
  assert.deepEqual(closed, ['b']);
  tabs.destroy();
});

test('tabs: a badge comes, changes and goes with its item, one per tab', (t) => {
  const host = mount(t);
  const tabs = createTabs(host);
  tabs.update({ activeId: 'a', items: [{ id: 'a', label: 'Alerts' }, { id: 'b', label: 'Notes', badge: 1 }] });
  const a = tabOf(host, 'a');
  const b = tabOf(host, 'b');
  assertSame(a.querySelector(BADGE), null);
  tabs.update({ activeId: 'a', items: [{ id: 'a', label: 'Alerts', badge: { count: 5 } }, { id: 'b', label: 'Notes', badge: 2 }] });
  assertSame(tabOf(host, 'a'), a, 'the same tab, not a rebuilt one');
  assert.equal(a.querySelector('.cloudcanvas-ui-badge-figure').textContent, '5');
  assert.equal(b.querySelectorAll(BADGE).length, 1, 'one badge per tab, however often it is redrawn');
  assert.equal(b.querySelector('.cloudcanvas-ui-badge-figure').textContent, '2');
  tabs.update({ activeId: 'a', items: [{ id: 'a', label: 'Alerts', badge: { count: 0 } }, { id: 'b', label: 'Notes' }] });
  assert.equal(a.querySelector(BADGE).hidden, true, 'a count of zero hides the badge and keeps it');
  assertSame(b.querySelector(BADGE), null, 'an item that names no badge has none');
  assert.equal(b.classList.contains('is-badged'), false);
  assert.equal(b.textContent, 'Notes');
  tabs.update({ activeId: 'b', items: [{ id: 'b', label: 'Notes', badge: 9 }] });
  assertSame(a.querySelector(BADGE), null, 'a dropped tab takes its badge with it');
  tabs.destroy();
  assertSame(b.querySelector(BADGE), null, 'destroy ends every badge');
  assert.equal(host.children.length, 0);
  assert.doesNotThrow(() => tabs.update({ items: [{ id: 'b', label: 'Notes', badge: 9 }] }));
  assert.equal(host.children.length, 0);
});

test('tabs: activeId null selects nothing, and the first tab that can be reached is the tab stop', (t) => {
  const host = mount(t);
  const chosen = [];
  const tabs = createTabs(host, { onSelect: (id) => chosen.push(id) });
  const items = [{ id: 'a', label: 'Alerts' }, { id: 'b', label: 'Notes' }, { id: 'c', label: 'Plan' }];
  tabs.update({ label: 'Feed', activeId: null, items });
  assert.deepEqual(selected(host), ['false', 'false', 'false']);
  assert.deepEqual(stops(host), ['0', '-1', '-1']);
  tabs.update({ label: 'Feed', activeId: 'c', items });
  assert.deepEqual(selected(host), ['false', 'false', 'true']);
  assert.deepEqual(stops(host), ['-1', '-1', '0']);
  tabs.update({ label: 'Feed', activeId: null, items });
  assert.deepEqual(selected(host), ['false', 'false', 'false'], 'the selection is the model\'s to take away');
  assert.deepEqual(stops(host), ['0', '-1', '-1'], 'and the stop goes back to the first tab');
  key(tabOf(host, 'a'), 'Enter');
  assert.deepEqual(chosen, ['a'], 'with nothing selected, any tab can be chosen');
  tabs.update({ label: 'Feed', activeId: null, items, activation: 'manual' });
  key(tabOf(host, 'a'), 'ArrowRight');
  assert.deepEqual(stops(host), ['-1', '0', '-1']);
  tabs.update({ label: 'Feed', activeId: null, items, activation: 'manual' });
  assert.deepEqual(stops(host), ['-1', '0', '-1'], 'a redraw that selects nothing leaves the stop where the keys put it');
  assert.deepEqual(chosen, ['a']);
  const guarded = [{ ...items[0], disabled: true }, items[1], items[2]];
  tabs.update({ activeId: 'c', items: guarded });
  tabs.update({ activeId: null, items: guarded });
  assert.deepEqual(stops(host), ['-1', '0', '-1'], 'a disabled tab cannot hold focus, so it cannot be the only way in');
  tabs.update({ activeId: 'gone', items });
  assert.deepEqual(selected(host), ['false', 'false', 'false']);
  assert.equal(stops(host).filter((stop) => stop === '0').length, 1, 'a selection that names no tab is no selection: there is still one way in');
  tabs.destroy();
});
