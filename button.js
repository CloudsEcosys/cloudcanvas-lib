/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Button: a real `<button type="button">` as a Pin.
 *
 * Three decisions carry this file, and the other six controls in the kit make
 * the same three:
 *
 *   - **Native element.** A `<button>` is focusable, keyboard-activatable and
 *     correctly announced for free, and the framework's `CONTROL_SELECTOR`
 *     already exempts it from drag capture and pointer capture - so there is no
 *     `data-cc-control` to add and no key handling to re-implement.
 *   - **Registration is lazy.** `defineComponent` mutates the shared trait
 *     registry and throws on a repeat, so calling it at module scope would make
 *     `import` a side effect and a second import a crash.
 *   - **The press is a `PinEvent`, not a DOM click.** `pin.transmit` walks the
 *     scope chain, so an enclosing Pin hears the press without the button
 *     knowing anything about who is listening.
 *
 * No colour, metric or class is decided here beyond *which* variant this is:
 * `lib/styles.js` states what a variant looks like, in tokens.
 */

import {
  defineComponent,
  makeElement,
  makeTextNode,
  setText,
  PinEvent
} from '../.plugin/index.js';

/** Registry name, and the `type` a caller creates a Pin by. */
const NAME = 'button';

/** Class the shared stylesheet hangs every Button rule off. */
const ROOT_CLASS = 'cloudcanvas-lib-button';

/**
 * Tone variants, and the one a Pin gets when it asks for nothing - or for
 * something that is not a variant. A closed set: the value reaches a class name.
 */
const VARIANTS = new Set(['primary', 'secondary', 'ghost', 'danger']);
const DEFAULT_VARIANT = 'secondary';

/** The content keys a Button accepts; anything else is refused by `setContents`. */
const ALLOWED_KEYS = ['label', 'variant', 'disabled'];

/** Build once: the control, its one text node, and the press listener. */
function build(pin, contentEl) {
  const root = makeElement('button', ROOT_CLASS);
  // A Pin can be mounted inside a form; the default submit type would navigate.
  root.setAttribute('type', 'button');
  const label = makeTextNode(root);

  root.addEventListener('click', () => {
    // A real click never reaches a disabled control, but a synthetic one does.
    // The guard makes both agree rather than leaving the difference observable.
    if (root.disabled) return;
    pin.transmit(new PinEvent('press', { bubbles: true, source: pin }));
  });

  contentEl.replaceChildren(root);
  return { root, label };
}

/** Mutate after: the label through `Text.data`, the variant through `classList`. */
function update(pin, contents, bindings, cache) {
  setText(bindings.label, contents.get('label'));
  applyVariant(bindings.root, contents.get('variant'), cache);

  const disabled = contents.get('disabled') === true;
  if (bindings.root.disabled !== disabled) bindings.root.disabled = disabled;
}

/**
 * Swap the modifier class, diff-first: an unchanged variant writes nothing.
 *
 * `classList` only. Assigning `className` would take the root class - and with
 * it every rule the stylesheet matches on - down with the old modifier.
 */
function applyVariant(root, requested, cache) {
  const variant = VARIANTS.has(requested) ? requested : DEFAULT_VARIANT;
  if (cache.variant === variant) return;

  if (cache.variant) root.classList.remove(`${ROOT_CLASS}-${cache.variant}`);
  cache.variant = variant;
  root.classList.add(`${ROOT_CLASS}-${variant}`);
}

/**
 * Registration is lazy and memoised, never an import-time side effect: importing
 * a widget must not mutate the shared trait registry, and `defineComponent`
 * throws on a duplicate name, so a second call returns the first handle rather
 * than registering again.
 */
let handle = null;

/** @returns {import('../.plugin/pins/traits/define-component.js').ComponentHandle} */
export function registerButton() {
  if (!handle) {
    handle = defineComponent({
      name: NAME,
      build,
      update,
      chrome: false,
      allowedKeys: ALLOWED_KEYS
    });
  }
  return handle;
}

/** Create a Button Pin on `session`; see `./text.js` on the option order. */
export function createButtonPin(session, options = {}) {
  registerButton();
  return session.createPin({ chrome: false, ...options, type: NAME });
}
