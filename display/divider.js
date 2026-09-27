/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Divider: a rule between things.
 *
 * A horizontal divider is an `<hr>`, which already *is* a separator to every
 * assistive technology - no role, no label, nothing to keep in sync. A vertical
 * one cannot be: `<hr>` has no vertical meaning, so that case is a plain `<div>`
 * declaring `role="separator"` itself. The element is chosen at build time
 * because the element is what it means, but `aria-orientation` and the modifier
 * class are written on every pass so a Pin whose orientation is flipped after
 * the fact still reports the truth (an `<hr>` may carry `aria-orientation`; a
 * `<div>` without the role may not, which is why the role is the build-time half).
 *
 * Nothing else is written: a divider has no text, no controls and no state.
 */

import { defineComponent, makeElement, setAttr } from '../../.plugin/index.js';

const NAME = 'divider';
const ROOT_CLASS = 'cloudcanvas-lib-divider';

const VERTICAL = 'vertical';
const HORIZONTAL = 'horizontal';

const ALLOWED_KEYS = ['orientation'];

/** The declared orientation, or the default. */
function orientationOf(contents) {
  return contents.get('orientation') === VERTICAL ? VERTICAL : HORIZONTAL;
}

function build(pin, contentEl) {
  const vertical = orientationOf(pin.contents) === VERTICAL;
  const root = makeElement(vertical ? 'div' : 'hr', ROOT_CLASS);
  if (vertical) root.setAttribute('role', 'separator');

  contentEl.replaceChildren(root);
  return { root };
}

function update(pin, contents, bindings, cache) {
  const orientation = orientationOf(contents);
  bindings.root.classList.toggle(`${ROOT_CLASS}-${VERTICAL}`, orientation === VERTICAL);
  setAttr(bindings.root, 'aria-orientation', orientation, cache, 'ariaOrientation');
}

let handle = null;

/** Register the Divider display type once; a second call returns the same handle. */
export function registerDivider() {
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

/** Create a Divider Pin on `session`; see `./text.js` on the option order. */
export function createDividerPin(session, options = {}) {
  registerDivider();
  return session.createPin({ chrome: false, ...options, type: NAME });
}
