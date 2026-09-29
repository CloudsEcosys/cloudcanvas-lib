/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Spinner: an indeterminate busy indicator.
 *
 *   const busy = createSpinner(app, { x: 40, y: 40, label: 'Fetching results' });
 *
 * One element and no animation code. `cloudcanvas-lib-spinner` is the contract
 * with `../styles.js`: the border ring, the `@keyframes` rotation, and the
 * `@media (prefers-reduced-motion: reduce)` override that slows the turn to six
 * seconds all live in the shared sheet, so one global rule covers every animated
 * widget in the kit instead of N inline `<style>` tags each having to remember
 * the same media query. The codebase already answers reduced motion this way
 * (`.plugin/graphics/styles-css.js`).
 *
 * The ring is not a separate decorative child, because there is nothing to hide
 * from it: the element has no text content, its shape is painted entirely by
 * `border-*`, and its accessible name is the `label` on the `role="status"` root.
 * A spinner with no name is a screen reader saying nothing while the page waits,
 * which is the only failure mode this widget really has.
 */

import { setAttr } from '../../.plugin/addons/widget.js';
import { defineWidget } from './widget.js';

const NAME = 'spinner';

/** The animated element. `../styles.js` owns the keyframes and the reduced-motion stop. */
const ROOT_CLASS = 'cloudcanvas-lib-spinner';

/** Named rather than anonymous: a busy indicator with no name announces nothing. */
const DEFAULT_LABEL = 'Loading';

function bind(host) {
  return { root: host.querySelector(`.${ROOT_CLASS}`) };
}

function render(bindings, contents, cache) {
  const label = contents.get('label');
  const text = label === undefined || label === null || String(label) === ''
    ? DEFAULT_LABEL
    : String(label);

  setAttr(bindings.root, 'aria-label', text, cache, 'label');
}

const widget = /* @__PURE__ */ defineWidget({
  name: NAME,
  html: `<div class="${ROOT_CLASS}" role="status"></div>`,
  allowedKeys: ['label'],
  bind,
  render
});

/** Define the Spinner widget, once. @returns {object} its type */
export const registerSpinner = widget.define;

/** A chromeless Spinner blit in `parent`: `createSpinner(app, { x, y, label })`. */
export const createSpinner = widget.create;
