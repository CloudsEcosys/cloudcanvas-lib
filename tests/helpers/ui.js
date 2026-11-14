/**
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Helpers for the UI kit suites: a host that is removed after the test,
 * keyboard and pointer events with the fields the controls read, and a stub
 * box for an element (happy-dom has no layout, so a test that measures says
 * what it measures).
 */
import assert from 'node:assert/strict';

/** A connected host element, removed when the test ends. */
export function mount(t) {
  const host = document.createElement('div');
  document.body.append(host);
  t.after(() => host.remove());
  return host;
}

/** Dispatch a cancelable, bubbling key event on `target`; returns it. */
export function key(target, value, options = {}) {
  const type = options.type ?? 'keydown';
  const event = new KeyboardEvent(type, { key: value, bubbles: true, cancelable: true, ...options });
  target.dispatchEvent(event);
  return event;
}

/** Keydown then keyup of `value` on `target`. */
export function press(target, value, options = {}) {
  const down = key(target, value, options);
  const up = key(target, value, { ...options, type: 'keyup' });
  return { down, up };
}

/** Dispatch a pointer event; `pointerId` 1, primary mouse button, unless overridden. */
export function pointer(target, type, options = {}) {
  const event = new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, button: 0, isPrimary: true,
    pointerType: 'mouse', ...options });
  target.dispatchEvent(event);
  return event;
}

/** Give `element` a fixed bounding box. */
export function stubBox(element, { left = 0, top = 0, width = 0, height = 0 }) {
  element.getBoundingClientRect = () => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top });
  return element;
}

/** Route `document.elementFromPoint` to `pick(x, y)` for the rest of the test. */
export function stubHitTest(t, pick) {
  const original = document.elementFromPoint;
  document.elementFromPoint = pick;
  t.after(() => { document.elementFromPoint = original; });
}

/** The options of every `focus()` call for the rest of the test: the test DOM keeps none. */
export function focusCalls(t) {
  const calls = [];
  const focus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function spy(options) { calls.push(options); return focus.call(this, options); };
  t.after(() => { HTMLElement.prototype.focus = focus; });
  return calls;
}

/** A short, cheap description of a node for a failure message. */
function describe(node) {
  if (!node || typeof node !== 'object') return String(node);
  const id = node.id ? `#${node.id}` : '';
  const key = node.getAttribute?.('data-ui-id') ? `[data-ui-id=${node.getAttribute('data-ui-id')}]` : '';
  const cls = typeof node.className === 'string' && node.className ? `.${node.className.trim().split(/\s+/).join('.')}` : '';
  return `<${node.localName ?? node.nodeName}${id}${key}${cls}>`;
}

/**
 * Identity check for DOM nodes that fails fast: `assert.equal(a, b)` on two
 * happy-dom elements makes node:test render a deep diff of both trees, which
 * takes minutes and ends as a cancelled file. This names the nodes instead.
 */
export function assertSame(actual, expected, message = '') {
  if (actual === expected) return;
  throw new assert.AssertionError({ message: `${message ? `${message}: ` : ''}expected ${describe(expected)}, got ${describe(actual)}`,
    actual: describe(actual), expected: describe(expected), operator: 'strictEqual' });
}
