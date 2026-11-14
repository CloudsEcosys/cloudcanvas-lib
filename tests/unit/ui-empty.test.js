/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Empty state: what a region says when it has nothing to show - a title, a
 * sentence, and an action only when there is one to take.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyState } from '../../ui/index.js';
import { assertSame, mount } from '../helpers/ui.js';

const part = (host, name) => host.querySelector(`.cloudcanvas-ui-empty-${name}`);

test('empty state: a title, a body and one action that reports; every word is the host\'s and is text, never markup', (t) => {
  const host = mount(t);
  let acted = 0;
  const empty = createEmptyState(host, { onAction: () => { acted += 1; } });
  empty.update({ title: 'No notes yet', body: 'Notes you write <b>appear</b> here.', actionLabel: 'New note' });
  assert.equal(part(host, 'title').textContent, 'No notes yet');
  assert.equal(part(host, 'body').textContent, 'Notes you write <b>appear</b> here.');
  assertSame(part(host, 'body').querySelector('b'), null, 'the words are text, never markup');
  const action = part(host, 'action');
  assert.equal(action.localName, 'button');
  assert.equal(action.type, 'button');
  assert.equal(action.textContent, 'New note');
  assert.equal(action.hidden, false);
  action.click();
  assert.equal(acted, 1);
  empty.update({ title: 'Nothing planned', body: 'Add an action to start.', actionLabel: 'Add action' });
  assertSame(part(host, 'action'), action, 'an update writes into the parts it has');
  assert.equal(part(host, 'title').textContent, 'Nothing planned');
  assert.equal(action.textContent, 'Add action');
  empty.destroy();
});

test('empty state: no action label, or nothing to call, draws no button; a part with no words is hidden', (t) => {
  const host = mount(t);
  const empty = createEmptyState(host, { onAction() {} });
  empty.update({ title: 'People needs a hosted account', body: 'Sign in to see conversations.' });
  assert.equal(part(host, 'action').hidden, true, 'no label, no button');
  empty.update({ title: 'Only a title' });
  assert.equal(part(host, 'body').hidden, true);
  assert.equal(part(host, 'title').hidden, false);
  empty.update({});
  assert.equal(part(host, 'title').hidden, true);
  empty.destroy();
  const mute = createEmptyState(host);
  mute.update({ title: 'Nothing here', body: 'Yet.', actionLabel: 'Do it' });
  assert.equal(part(host, 'action').hidden, true, 'an action nobody answers is not offered');
  mute.destroy();
});

test('empty state: destroy removes it, ends its listener, and is safe to repeat', (t) => {
  const host = mount(t);
  let acted = 0;
  const empty = createEmptyState(host, { onAction: () => { acted += 1; } });
  empty.update({ title: 'None', body: 'Yet.', actionLabel: 'Add' });
  const action = part(host, 'action');
  empty.destroy();
  empty.destroy();
  action.click();
  assert.equal(acted, 0);
  assert.equal(host.children.length, 0);
  assert.doesNotThrow(() => empty.update({ title: 'Again' }));
  assert.equal(host.children.length, 0);
});
