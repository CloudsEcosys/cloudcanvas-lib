/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The display widgets as core types (`.addons/display/widget.js`): one template
 * and one render. A widget is `app.blit({type: name, [name]: contents})` or its
 * factory; a write re-renders it, the spec carries its contents, and both paths
 * build the very same subtree.
 */
import test from 'node:test';
import { setContent } from '../../plugins/widget.js';
import assert from 'node:assert/strict';
import { type } from 'cloudcanvas';
import { createBadge, createProgress, registerDisplay } from '../../display/index.js';
import { defineWidget } from '../../display/widget.js';
import { LIB_STYLE_ID } from '../../styles.js';
import { coreScene, signals } from '../helpers/core-scene.js';

const XSS = '<img src=x onerror="alert(1)">';

const DISPLAY_TYPES = ['text', 'badge', 'avatar', 'divider', 'progress', 'spinner', 'alert', 'lib-list'];

function click(element) {
  element.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
}

test('display types - defined by a call, idempotently, as core types', () => {
  assert.deepEqual(registerDisplay(), DISPLAY_TYPES);
  assert.deepEqual(registerDisplay(), DISPLAY_TYPES, 'a second call defined something new');
  for (const name of DISPLAY_TYPES) assert.equal(type(name).el.tagName, 'TEMPLATE');
});

test('display types - defineWidget answers its name, a type and a chromeless factory', (t) => {
  const { app } = coreScene(t);
  const tally = defineWidget({
    name: 'tally',
    html: '<output class="tally"></output>',
    allowedKeys: ['count'],
    bind: (host) => ({ output: host.querySelector('.tally') }),
    render: ({ output }, contents) => { output.textContent = String(contents.get('count') ?? 0); }
  });

  assert.equal(tally.name, 'tally');
  assert.equal(tally.define(), tally.define());
  const b = tally.create(app, { x: 10, count: 3 });
  assert.equal(b.el.getAttribute('data-type'), 'tally');
  assert.equal(b.el.getAttribute('data-chrome'), 'false');
  assert.equal(b.x, 10);
  assert.equal(b.el.querySelector('.tally').textContent, '3');
});

test('display types - a progress renders its options, re-renders on a write, and round-trips', (t) => {
  registerDisplay();
  const { app } = coreScene(t);
  const bar = app.blit({ type: 'progress', progress: { value: 30, max: 60, label: 'Uploading' } });
  const native = bar.el.querySelector('progress');

  assert.equal(native.getAttribute('value'), '30');
  assert.equal(native.getAttribute('max'), '60');
  assert.equal(bar.el.querySelector('.cloudcanvas-lib-progress-label').textContent, 'Uploading');
  assert.ok(document.getElementById(LIB_STYLE_ID), 'the kit sheet was not injected');

  bar.set({ progress: { value: 999, max: 60, label: 'Done', tone: 'success' } });
  assert.equal(native.getAttribute('value'), '60', 'an out-of-range value was not clamped');
  assert.equal(native.classList.contains('cloudcanvas-lib-progress-success'), true);
  assert.equal(bar.el.querySelector('.cloudcanvas-lib-progress-label').childNodes.length, 1, 'a rebind added a text node');

  const copy = app.blit(bar.spec);
  assert.deepEqual(copy.spec.progress, { value: 999, max: 60, label: 'Done', tone: 'success' });
  assert.equal(copy.el.querySelector('progress').getAttribute('value'), '60');
});

test('display types - contents are text, a URL is vetted, and an unknown key is refused', (t) => {
  registerDisplay();
  const { app } = coreScene(t);
  const badge = app.blit({ type: 'badge', badge: { text: XSS } });
  assert.equal(badge.el.querySelector('.cloudcanvas-lib-badge').firstChild.data, XSS);
  assert.equal(badge.el.querySelector('img'), null, 'badge text was parsed as markup');

  const avatar = app.blit({ type: 'avatar', avatar: { name: 'Ada Lovelace', src: 'javascript:alert(1)' } });
  assert.equal(avatar.el.querySelector('img[src]'), null, 'a rejected URL reached the src');
  assert.equal(avatar.el.querySelector('.cloudcanvas-lib-avatar-initials').textContent, 'AL');

  const spinner = app.blit({ type: 'spinner', spinner: { nonsense: true } });
  assert.equal('nonsense' in (spinner.spec.spinner ?? {}) && spinner.el.textContent.includes('true'), false, 'an undeclared key rendered');
  assert.throws(() => setContent(spinner, 'nonsense', true), /key "nonsense" not permitted/);
});

test('display types - dismiss is one cancelable event; its default removes the blit', (t) => {
  registerDisplay();
  const { app } = coreScene(t);
  const kept = app.blit({ type: 'alert', alert: { message: 'careful' } });
  const heard = signals(kept, 'dismiss');
  kept.on('dismiss', (event) => event.preventDefault());

  // Two writes restart the trait twice; its listener must not multiply.
  kept.set({ alert: { message: 'still careful' } });
  kept.set({ alert: { message: 'careful again', tone: 'danger' } });
  click(kept.el.querySelector('button'));
  assert.equal(heard.length, 1, 'a restarted trait left a stale listener');
  assert.equal(kept.el.isConnected, true, 'preventDefault() did not keep the alert');
  assert.equal(kept.el.querySelector('.cloudcanvas-lib-alert').getAttribute('role'), 'alert');

  const gone = app.blit({ type: 'badge', badge: { text: 'beta', dismissible: true } });
  click(gone.el.querySelector('button'));
  assert.equal(gone.el.isConnected, false, 'the badge survived its own dismissal');
});

test('display types - the factory and a raw spec build the same widget subtree', (t) => {
  const { app } = coreScene(t);
  const pairs = [
    [createBadge(app, { text: 'new', tone: 'success', dismissible: true }),
      app.blit({ type: 'badge', badge: { text: 'new', tone: 'success', dismissible: true } })],
    [createProgress(app, { contents: { value: 40, label: 'Up' } }),
      app.blit({ type: 'progress', progress: { value: 40, label: 'Up' } })]
  ];
  for (const [made, raw] of pairs) {
    assert.equal(made.el.innerHTML, raw.el.innerHTML);
    assert.deepEqual(made.spec[made.el.getAttribute('data-type')], raw.spec[raw.el.getAttribute('data-type')]);
  }
});
