/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Controlled native actions: model-owned pin state, busy/disabled guards,
 * safe labels, stylesheet injection and complete teardown.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createContextActions, UI_STYLE_ID } from '../../ui/index.js';
import { mount } from '../helpers/ui.js';

test('context actions: native, named buttons request actions without changing pin state', (t) => {
  const host = mount(t);
  const calls = [];
  const actions = createContextActions(host, { onPin: () => calls.push('pin'), onExpand: () => calls.push('expand') });
  const [pin, expand] = host.querySelectorAll('button');
  actions.update({ pinned: false });
  assert.equal(pin.type, 'button');
  assert.equal(expand.type, 'button');
  assert.equal(pin.tabIndex, 0);
  assert.equal(expand.tabIndex, 0);
  assert.equal(pin.getAttribute('aria-label'), 'Pin');
  assert.equal(expand.getAttribute('aria-label'), 'Expand');
  pin.click();
  expand.click();
  assert.deepEqual(calls, ['pin', 'expand']);
  assert.equal(pin.getAttribute('aria-pressed'), 'false');
  actions.update({ pinned: true });
  pin.click();
  assert.equal(pin.getAttribute('aria-pressed'), 'true', 'unpin is a request, not a state change');
  assert.ok(document.getElementById(UI_STYLE_ID));
  actions.destroy();
});

test('context actions: busy and per-action disabled models block even synthetic clicks', (t) => {
  const host = mount(t);
  const calls = [];
  const actions = createContextActions(host, { onPin: () => calls.push('pin'), onExpand: () => calls.push('expand') });
  const root = host.firstElementChild;
  const [pin, expand] = root.querySelectorAll('button');
  actions.update({ busy: true });
  assert.equal(root.getAttribute('aria-busy'), 'true');
  assert.equal(pin.disabled, true);
  assert.equal(expand.disabled, true);
  pin.dispatchEvent(new MouseEvent('click'));
  expand.dispatchEvent(new MouseEvent('click'));
  assert.deepEqual(calls, []);
  actions.update({ pinDisabled: true });
  pin.click();
  expand.click();
  actions.update({ expandDisabled: true });
  pin.click();
  expand.click();
  assert.deepEqual(calls, ['expand', 'pin']);
  assert.equal(root.getAttribute('aria-busy'), 'false');
  actions.destroy();
});

test('context actions: safe custom labels reset and destroyed controls never reactivate', (t) => {
  const host = mount(t);
  let calls = 0;
  const actions = createContextActions(host, { onPin: () => { calls += 1; } });
  const [pin, expand] = host.querySelectorAll('button');
  actions.update({ pinLabel: '<img src=x>', expandLabel: 'Open full view', pinned: true });
  assert.equal(pin.textContent, '<img src=x>');
  assert.equal(pin.querySelector('img'), null);
  assert.equal(expand.getAttribute('aria-label'), 'Open full view');
  actions.update();
  assert.equal(pin.textContent, 'Pin');
  assert.equal(expand.textContent, 'Expand');
  assert.equal(pin.getAttribute('aria-pressed'), 'false');
  actions.destroy();
  actions.destroy();
  actions.update({ pinned: true });
  pin.dispatchEvent(new MouseEvent('click'));
  assert.equal(calls, 0);
  assert.equal(host.children.length, 0);
});
