/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Divider: a rule between things, as a widget.
 *
 *   const rule = createDivider(app, { x: 0, y: 120, orientation: 'vertical' });
 *
 * A horizontal divider is an `<hr>`, which already *is* a separator to every
 * assistive technology - no role, no label, nothing to keep in sync. A vertical
 * one cannot be: `<hr>` has no vertical meaning, so that case is a plain `<div>`
 * declaring `role="separator"` itself. The element is what it means, so the
 * render swaps it only when the orientation moves (`elementAs`); the modifier
 * class and `aria-orientation` are written on every render so the element
 * always reports the truth.
 *
 * Nothing else is written: a divider has no text, no controls and no state.
 */
import { defineWidget, elementAs } from './widget.js';

const ROOT_CLASS = 'cloudcanvas-lib-divider';

const VERTICAL = 'vertical';
const HORIZONTAL = 'horizontal';

function bind(host) {
  return { root: host.querySelector(`.${ROOT_CLASS}`) };
}

/** The element the orientation names, then its role, class and `aria-orientation`. */
function render(bindings, contents) {
  const vertical = contents.get('orientation') === VERTICAL;
  const root = elementAs(bindings.root, vertical ? 'div' : 'hr');
  if (vertical && root.getAttribute('role') !== 'separator') root.setAttribute('role', 'separator');
  root.classList.toggle(`${ROOT_CLASS}-${VERTICAL}`, vertical);

  const orientation = vertical ? VERTICAL : HORIZONTAL;
  if (root.getAttribute('aria-orientation') !== orientation) root.setAttribute('aria-orientation', orientation);
}

const widget = /* @__PURE__ */ defineWidget({
  name: 'divider',
  html: `<hr class="${ROOT_CLASS}">`,
  allowedKeys: ['orientation'],
  bind,
  render
});

/** Define the Divider widget, once. @returns {object} its type */
export const registerDivider = widget.define;

/** A chromeless Divider blit in `parent`: `createDivider(app, { x, y, orientation })`. */
export const createDivider = widget.create;
