/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * A toast says when it has gone and why. A host that keeps a line of text for "the toast I showed" used to
 * look for the toast's node to know whether it was still there; `onClose(toastId, reason)` tells it.
 *
 * Red by construction before the option existed: the toaster ignored `onClose`, so every case below saw
 * an empty list of closes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createToaster } from '../../ui/index.js';
import { key, mount } from '../helpers/ui.js';

test('toast onClose: hears each toast that leaves once, with why: the cross, Escape, an action, the timer, the limit, dismiss and clear', async (t) => {
  const host = mount(t), closes = [];
  const toaster = createToaster(host, { max: 2, timeout: 0, onClose: (id, reason) => closes.push([id, reason]) });
  const region = () => host.querySelector('.cloudcanvas-ui-toasts');
  const cross = toaster.show({ message: 'cross' });
  region().querySelector(`[data-ui-id="${cross}"] .cloudcanvas-ui-toast-dismiss`).click();
  const esc = toaster.show({ message: 'esc' });
  key(region().querySelector(`[data-ui-id="${esc}"]`), 'Escape');
  const act = toaster.show({ message: 'act', action: { label: 'Undo', run() {} } });
  region().querySelector(`[data-ui-id="${act}"] .cloudcanvas-ui-toast-action`).click();
  const [a, b] = [toaster.show({ message: 'a' }), toaster.show({ message: 'b' })], over = toaster.show({ message: 'c' });
  const api = toaster.dismiss(b), cleared = [over];
  toaster.clear();
  assert.deepEqual(closes, [[cross, 'dismiss'], [esc, 'escape'], [act, 'action'], [a, 'max'], [b, 'api'], [over, 'clear']]);
  assert.equal(api, true);
  assert.deepEqual(cleared, [over]);
  assert.equal(toaster.dismiss(b), false);
  assert.equal(closes.length, 6, 'a toast that has gone is reported no more');
});

test('toast onClose: the timer closes with the reason timeout, and a destroyed toaster reports nothing', async (t) => {
  const host = mount(t), closes = [];
  const toaster = createToaster(host, { timeout: 5, onClose: (id, reason) => closes.push([id, reason]) });
  const id = toaster.show({ message: 'soon' });
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.deepEqual(closes, [[id, 'timeout']]);
  const kept = createToaster(host, { timeout: 0, onClose: (...args) => closes.push(args) });
  kept.show({ message: 'x' });
  kept.destroy();
  assert.equal(closes.length, 1);
});
