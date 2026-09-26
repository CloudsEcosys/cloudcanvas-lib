/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Spinner: an indeterminate busy indicator.
 *
 * One element and no animation code. `cloudcanvas-lib-spinner` is the contract
 * with `lib/styles.js`: the border ring, the `@keyframes` rotation, and the
 * `@media (prefers-reduced-motion: reduce)` override that slows the turn to six
 * seconds all live in the shared sheet, so one global rule covers every animated
 * widget in the kit instead of N inline `<style>` tags each having to remember
 * the same media query. The codebase already answers reduced motion this way
 * (`src/graphics/styles-css.js`).
 *
 * The ring is not a separate decorative child, because there is nothing to hide
 * from it: the element has no text content, its shape is painted entirely by
 * `border-*`, and its accessible name is the `label` on the `role="status"` root.
 * A spinner with no name is a screen reader saying nothing while the page waits,
 * which is the only failure mode this widget really has.
 */

import { defineComponent, makeElement, setAttr } from '../.plugin/index.js';

const NAME = 'spinner';

/** The animated element. `lib/styles.js` owns the keyframes and the reduced-motion stop. */
const ROOT_CLASS = 'cloudcanvas-lib-spinner';

/** Named rather than anonymous: a busy indicator with no name announces nothing. */
const DEFAULT_LABEL = 'Loading';

const ALLOWED_KEYS = ['label'];

function build(pin, contentEl) {
  const root = makeElement('div', ROOT_CLASS);
  root.setAttribute('role', 'status');
  contentEl.replaceChildren(root);
  return { root };
}

function update(pin, contents, bindings, cache) {
  const label = contents.get('label');
  const text = label === undefined || label === null || String(label) === ''
    ? DEFAULT_LABEL
    : String(label);

  setAttr(bindings.root, 'aria-label', text, cache, 'label');
}

let handle = null;

/** Register the Spinner display type once; a second call returns the same handle. */
export function registerSpinner() {
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

/** Create a Spinner Pin on `session`; see `./text.js` on the option order. */
export function createSpinnerPin(session, options = {}) {
  registerSpinner();
  return session.createPin({ chrome: false, ...options, type: NAME });
}
