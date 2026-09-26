/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Toggle: a switch that is a real `<input type="checkbox">` underneath.
 *
 * `role="switch"` is the only thing that separates it from `./checkbox.js`, and
 * it is worth exactly one extra obligation: an explicit `aria-checked`. Some
 * assistive-technology and browser pairs stop deriving the checked state from
 * the native element once the role has been overridden, so the state has to be
 * said twice - the property for the platform, the attribute for the role.
 *
 * Two writers keep it in step, and both are needed: `update` writes it from the
 * model, and the change handler writes it inline, because the commit is only an
 * invalidation and an attached renderer serves that on the *next* frame - a
 * switch that announces last frame's state at the moment it is pressed is
 * exactly the bug the explicit attribute exists to prevent.
 *
 * Both go through `setAttr` against one shared diff record (`bindings`, keyed
 * `aria`) rather than the per-render `cache`. Two writers and one cache the
 * handler cannot reach is how a diff-first write silently stops writing: the
 * cache would still hold what the last render wrote, and the next genuine
 * change would be skipped as a no-op.
 *
 * The track and thumb are the stylesheet's (`appearance: none` plus an
 * `::after`), not a div sandwich: keeping the native checkbox keeps its keyboard
 * operation, its focus behaviour and its label association whole.
 */

import {
  defineComponent,
  makeElement,
  makeTextNode,
  setAttr,
  setText,
  setVisible,
  PinEvent
} from '../.plugin/index.js';

/** Registry name, and the `type` a caller creates a Pin by. */
const NAME = 'toggle';

const ROOT_CLASS = 'cloudcanvas-lib-toggle';
const CONTROL_CLASS = 'cloudcanvas-lib-toggle-control';
const LABEL_CLASS = 'cloudcanvas-lib-toggle-label';

/** The content keys a Toggle accepts; anything else is refused by `setContents`. */
const ALLOWED_KEYS = ['label', 'checked', 'disabled'];

/**
 * Write the ARIA mirror through the one diff record both writers share.
 * @param {object} bindings doubles as that record, under the key `aria`
 */
function writeAriaChecked(control, checked, bindings) {
  setAttr(control, 'aria-checked', String(checked), bindings, 'aria');
}

/** Build once: the switch, its label, and the change listener. */
function build(pin, contentEl) {
  const root = makeElement('div', ROOT_CLASS);

  const control = makeElement('input', CONTROL_CLASS);
  control.setAttribute('type', 'checkbox');
  control.setAttribute('role', 'switch');
  control.id = `${pin.id}-control`;

  const label = makeElement('label', LABEL_CLASS);
  label.setAttribute('for', control.id);
  const labelText = makeTextNode(label);

  const bindings = { root, control, label, labelText };

  control.addEventListener('change', () => {
    // Ahead of the render the commit below asks for, so the state the switch
    // announces is never a frame behind the state it paints.
    writeAriaChecked(control, control.checked, bindings);
    pin.setContent('checked', control.checked);
    pin.transmit(new PinEvent('change', { payload: control.checked, bubbles: true, source: pin }));
  });

  root.appendChild(control);
  root.appendChild(label);
  contentEl.replaceChildren(root);

  return bindings;
}

/** Mutate after: the label, the native checked property, and its ARIA mirror. */
function update(pin, contents, bindings) {
  const label = contents.get('label');
  setText(bindings.labelText, label);
  setVisible(bindings.label, Boolean(label));

  const checked = contents.get('checked') === true;
  if (bindings.control.checked !== checked) bindings.control.checked = checked;
  writeAriaChecked(bindings.control, checked, bindings);

  const disabled = contents.get('disabled') === true;
  if (bindings.control.disabled !== disabled) bindings.control.disabled = disabled;
}

/** Lazy, memoised registration; see `./button.js` on why it is never at import time. */
let handle = null;

/** @returns {import('../.plugin/pins/traits/define-component.js').ComponentHandle} */
export function registerToggle() {
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

/** Create a Toggle Pin on `session`; see `./text.js` on the option order. */
export function createTogglePin(session, options = {}) {
  registerToggle();
  return session.createPin({ chrome: false, ...options, type: NAME });
}
