/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Nonmodal context presentation, controlled dismissal, content preservation,
 * focus ownership, viewport geometry and complete lifecycle cleanup.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createContextWindow, UI_CSS } from '../../ui/index.js';
import { assertSame, key, mount } from '../helpers/ui.js';

function content() {
  const root = document.createElement('div');
  const input = document.createElement('textarea');
  input.setAttribute('aria-label', 'Draft');
  root.append(input);
  return root;
}

test('context window: named nonmodal dialog focuses content and never traps Tab', (t) => {
  const host = mount(t);
  const panel = createContextWindow(host);
  const root = host.querySelector('[role="dialog"]');
  assert.equal(root.hidden, true);
  const body = content();
  panel.update({ open: true, title: '<Draft>', description: 'Not submitted', content: body });
  assert.equal(root.hidden, false);
  assert.equal(root.getAttribute('aria-modal'), 'false');
  assert.equal(document.getElementById(root.getAttribute('aria-labelledby')).textContent, '<Draft>');
  assert.equal(document.getElementById(root.getAttribute('aria-describedby')).textContent, 'Not submitted');
  assertSame(panel.body.firstChild, body);
  assertSame(document.activeElement, body.firstChild);
  assert.equal(key(body.firstChild, 'Tab').defaultPrevented, false);
  assert.equal(key(body.firstChild, 'Tab', { shiftKey: true }).defaultPrevented, false);
  assert.equal(host.inert, false);
  panel.update({ open: true, title: 'Draft', content: body });
  assert.equal(root.hasAttribute('aria-describedby'), false);
  panel.destroy();
});

test('context window: close and Escape request closure; no backdrop dismissal or internal pin change', (t) => {
  const host = mount(t);
  const calls = [];
  const panel = createContextWindow(host, { onClose: (reason) => calls.push(reason),
    onPin: () => calls.push('pin'), onExpand: () => calls.push('expand') });
  panel.update({ open: true, title: 'Draft', content: content(), pinned: false });
  const root = host.querySelector('[role="dialog"]');
  const pin = root.querySelector('.cloudcanvas-ui-context-actions-pin');
  key(document.activeElement, 'Escape');
  root.querySelector('.cloudcanvas-ui-context-window-close').click();
  pin.click();
  root.querySelector('.cloudcanvas-ui-context-actions-expand').click();
  root.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  assert.deepEqual(calls, ['escape', 'button', 'pin', 'expand']);
  assert.equal(root.hidden, false);
  assert.equal(pin.getAttribute('aria-pressed'), 'false');
  panel.update({ open: true, title: 'Draft', dismissible: false, busy: true, closeLabel: 'Discard' });
  key(document.activeElement, 'Escape');
  pin.dispatchEvent(new MouseEvent('click'));
  const close = root.querySelector('.cloudcanvas-ui-context-window-close');
  assert.equal(close.getAttribute('aria-label'), 'Discard');
  close.click();
  assert.deepEqual(calls, ['escape', 'button', 'pin', 'expand', 'button']);
  panel.destroy();
});

test('context window: repeated updates preserve unsaved DOM and restore opener on controlled close', (t) => {
  const host = mount(t);
  const opener = document.createElement('button');
  host.append(opener);
  opener.focus();
  const panel = createContextWindow(host);
  const body = content();
  panel.update({ open: true, title: 'Draft', content: body });
  body.firstChild.value = 'Unsaved text';
  panel.update({ open: true, title: 'Updated', content: body, pinned: true });
  assertSame(document.activeElement, body.firstChild);
  assert.equal(body.firstChild.value, 'Unsaved text');
  panel.update({ open: false });
  assertSame(document.activeElement, opener);
  assertSame(panel.body.firstChild, body);
  panel.update({ open: true, title: 'Draft' });
  assert.equal(body.firstChild.value, 'Unsaved text');
  panel.destroy();
  assertSame(document.activeElement, opener);
});

test('context window: inactive window closure does not steal focus and null content clears body', (t) => {
  const host = mount(t);
  const outside = document.createElement('button');
  host.append(outside);
  const lower = createContextWindow(host);
  lower.update({ open: true, title: 'Lower', content: content() });
  const upper = createContextWindow(host);
  upper.update({ open: true, title: 'Upper', content: content() });
  const active = document.activeElement;
  lower.update({ open: false, content: null });
  assertSame(document.activeElement, active);
  assert.equal(lower.body.childNodes.length, 0);
  outside.focus();
  upper.destroy();
  assertSame(document.activeElement, outside);
  lower.destroy();
});

test('context window: only the focused window handles Escape; destroyed windows are inert', (t) => {
  const host = mount(t);
  const calls = [];
  const lower = createContextWindow(host, { onClose: () => calls.push('lower') });
  const upper = createContextWindow(host, { onClose: () => calls.push('upper'), onPin: () => calls.push('pin') });
  lower.update({ open: true, title: 'Lower', content: content() });
  upper.update({ open: true, title: 'Upper', content: content() });
  key(document.activeElement, 'Escape');
  assert.deepEqual(calls, ['upper']);
  const root = upper.body.parentElement;
  const pin = root.querySelector('.cloudcanvas-ui-context-actions-pin');
  upper.destroy();
  upper.destroy();
  upper.update({ open: true });
  key(root, 'Escape');
  pin.dispatchEvent(new MouseEvent('click'));
  assert.deepEqual(calls, ['upper']);
  assert.equal(root.isConnected, false);
  lower.destroy();
});

test('context window: prevented child Escape is respected and empty content focuses the window', (t) => {
  const host = mount(t);
  let closes = 0;
  const panel = createContextWindow(host, { onClose: () => { closes += 1; } });
  panel.update({ open: true, title: 'Empty' });
  const root = host.querySelector('[role="dialog"]');
  assertSame(document.activeElement, root);
  const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true, bubbles: true });
  event.preventDefault();
  root.dispatchEvent(event);
  assert.equal(closes, 0);
  panel.destroy();
});

test('context window: teardown restores focus even when its reusable actions hold focus', (t) => {
  const host = mount(t);
  const opener = document.createElement('button');
  host.append(opener);
  opener.focus();
  const panel = createContextWindow(host);
  panel.update({ open: true, title: 'Draft' });
  host.querySelector('.cloudcanvas-ui-context-actions-pin').focus();
  panel.destroy();
  assertSame(document.activeElement, opener);
});

test('context window: visual viewport changes update bounded keyboard geometry without polling', (t) => {
  const host = mount(t);
  const descriptor = Object.getOwnPropertyDescriptor(window, 'visualViewport');
  const viewport = new EventTarget();
  Object.assign(viewport, { width: 320, height: 220, offsetTop: 40, offsetLeft: 10 });
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
  t.after(() => {
    if (descriptor) Object.defineProperty(window, 'visualViewport', descriptor);
    else delete window.visualViewport;
  });
  const panel = createContextWindow(host);
  panel.update({ open: true, title: 'Draft' });
  const root = host.querySelector('[role="dialog"]');
  assert.equal(root.style.getPropertyValue('--context-viewport-width'), '320px');
  assert.equal(root.style.getPropertyValue('--context-viewport-height'), '220px');
  assert.equal(root.style.getPropertyValue('--context-viewport-top'), '40px');
  assert.equal(root.style.getPropertyValue('--context-viewport-right'), `${window.innerWidth - 330}px`);
  viewport.height = 180;
  viewport.dispatchEvent(new Event('resize'));
  assert.equal(root.style.getPropertyValue('--context-viewport-height'), '180px');
  viewport.offsetTop = 60;
  viewport.dispatchEvent(new Event('scroll'));
  assert.equal(root.style.getPropertyValue('--context-viewport-top'), '60px');
  panel.destroy();
  viewport.height = 100;
  viewport.dispatchEvent(new Event('resize'));
  window.dispatchEvent(new Event('resize'));
  assert.equal(root.style.getPropertyValue('--context-viewport-height'), '180px');
  assert.match(UI_CSS, /env\(safe-area-inset-bottom, 0px\)/);
  assert.match(UI_CSS, /max-height: calc\(var\(--context-viewport-height, 100dvh\)/);
  assert.match(UI_CSS, /width: min\(28rem, calc\(var\(--context-viewport-width, 100vw\)/);
});
