/** Written by Richard Christopher, Copyright 2026 NeoTec, LLC */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createTabs } from '../../ui/tabs.js';
import { key, mount } from '../helpers/ui.js';

const items = [{ id: 'a', label: 'Resources', closable: true }, { id: 'b', label: 'Resources paired', closable: true }];

test('closable tabs expose their own ordered ARIA-owned tabs and visible close controls outside the tablist', (t) => {
  const host = mount(t), selected = [], closed = [];
  const tabs = createTabs(host, { onSelect: (id) => selected.push(id), onClose: (id) => closed.push(id) });
  tabs.update({ label: 'Workspace contexts', activeId: 'a', items });
  const list = host.querySelector('[role="tablist"]'), root = host.querySelector('.cloudcanvas-ui-tabs');
  const nodes = [...root.querySelectorAll('[role="tab"]')];
  assert.equal(list.getAttribute('aria-label'), 'Workspace contexts'); assert.equal(list.getAttribute('aria-orientation'), 'horizontal');
  assert.equal(root.hasAttribute('role'), false); assert.equal(root.hasAttribute('aria-label'), false);
  assert.equal(list.getAttribute('aria-owns'), nodes.map((node) => node.id).join(' '));
  assert.deepEqual(list.getAttribute('aria-owns').split(' ').map((id) => document.getElementById(id)), nodes);
  const buttons = [...host.querySelectorAll('[data-ui-close]')];
  assert.equal(buttons.length, 2);
  for (const node of buttons) {
    assert.equal(node.hidden, false); assert.equal(node.hasAttribute('aria-hidden'), false);
    assert.equal(list.contains(node), false);
    assert.equal(node.tabIndex, -1); assert.match(node.getAttribute('aria-label'), /^Close Resources/);
    assert.equal(node.previousElementSibling.getAttribute('role'), 'tab');
  }
  const first = nodes[0]; key(first, 'ArrowRight');
  assert.deepEqual(selected, ['b']); key(document.activeElement, 'Delete'); buttons[0].click();
  assert.deepEqual(closed, ['b', 'a']);
  tabs.update({ label: 'Workspace contexts', activeId: 'b', items: [items[1]] });
  assert.equal(list.getAttribute('aria-owns'), nodes[1].id); assert.equal(document.getElementById(nodes[0].id), null);
  tabs.update({ label: 'Workspace contexts', activeId: 'b', items: [{ ...items[1], closable: false }] });
  assert.equal(buttons[1].hidden, true); assert.equal(list.getAttribute('aria-owns'), nodes[1].id);
  tabs.update({ items: [] }); assert.equal(list.hidden, true); assert.equal(list.hasAttribute('aria-owns'), false);
  tabs.destroy(); buttons[1].click(); key(first, 'Delete');
  assert.deepEqual(closed, ['b', 'a']); assert.equal(host.children.length, 0);
});

test('owned IDs stay component-local and follow reorder while manual Home/End/Space preserve controlled selection', (t) => {
  const host = mount(t), otherHost = mount(t), selected = [];
  const tabs = createTabs(host, { onSelect: (id) => selected.push(id) }), other = createTabs(otherHost);
  tabs.update({ activeId: 'a', items }); other.update({ activeId: 'a', items });
  const list = host.querySelector('[role="tablist"]'), otherList = otherHost.querySelector('[role="tablist"]');
  assert.notEqual(list.getAttribute('aria-owns'), otherList.getAttribute('aria-owns'));
  tabs.update({ activeId: 'a', items: [...items].reverse(), activation: 'manual' });
  const nodes = [...host.querySelectorAll('[role="tab"]')];
  assert.equal(list.getAttribute('aria-owns'), nodes.map((node) => node.id).join(' '));
  assert.deepEqual(nodes.map((node) => node.getAttribute('data-ui-id')), ['b', 'a']);
  key(nodes[1], 'Home'); assert.equal(document.activeElement, nodes[0]);
  key(nodes[0], 'End'); assert.equal(document.activeElement, nodes[1]); assert.deepEqual(selected, []);
  key(nodes[1], 'ArrowLeft'); key(nodes[0], ' '); assert.deepEqual(selected, ['b']);
  assert.equal(nodes[0].getAttribute('aria-selected'), 'false');
  assert.deepEqual(nodes.map((node) => node.tabIndex), [0, -1]);
  tabs.destroy(); other.destroy();
});
