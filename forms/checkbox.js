/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Checkbox: a real `<input type="checkbox">` and its `<label for>`.
 *
 * No edit lock here, unlike `./input.js`: a tick is instantaneous and has no
 * caret to lose, so the native `change` commits straight into `pin.contents`
 * and the next render simply agrees with the DOM.
 *
 * No `aria-checked` either. A native checkbox already publishes its state, and
 * an ARIA attribute would *override* what the element itself reports - including
 * for the frame in which it is still stale. The one widget in this kit that has
 * to write it is `./toggle.js`, and only because it overrides the role.
 */

import {
  defineComponent,
  makeElement,
  makeTextNode,
  setText,
  setVisible,
  PinEvent
} from '../../.plugin/index.js';

/** Registry name, and the `type` a caller creates a Pin by. */
const NAME = 'checkbox';

const ROOT_CLASS = 'cloudcanvas-lib-checkbox';
const CONTROL_CLASS = 'cloudcanvas-lib-checkbox-control';
const LABEL_CLASS = 'cloudcanvas-lib-checkbox-label';

/** The content keys a Checkbox accepts; anything else is refused by `setContents`. */
const ALLOWED_KEYS = ['label', 'checked', 'disabled'];

/**
 * Build once: the control, its label, and the change listener.
 *
 * The control's native `input` / `change` stop at the control and are re-issued
 * as the Pin's own event, the way a custom element encapsulates its inner events.
 */
function build(pin, contentEl) {
  const root = makeElement('div', ROOT_CLASS);

  const control = makeElement('input', CONTROL_CLASS);
  control.setAttribute('type', 'checkbox');
  control.id = `${pin.id}-control`;

  const label = makeElement('label', LABEL_CLASS);
  // The id is stable for the life of the Pin, so the association is build-time.
  label.setAttribute('for', control.id);
  const labelText = makeTextNode(label);

  control.addEventListener('change', (event) => {
    // The control's native event is re-issued as the Pin's own below; it stops
    // here so a Pin listener hears one `change`, with the payload.
    event.stopPropagation();
    pin.setContent('checked', control.checked);
    pin.transmit(new PinEvent('change', { payload: control.checked, bubbles: true, source: pin }));
  });

  root.appendChild(control);
  root.appendChild(label);
  contentEl.replaceChildren(root);

  return { root, control, label, labelText };
}

/** Mutate after: the label text, the checked state, and the disabled flag. */
function update(pin, contents, bindings) {
  const label = contents.get('label');
  setText(bindings.labelText, label);
  setVisible(bindings.label, Boolean(label));

  const checked = contents.get('checked') === true;
  if (bindings.control.checked !== checked) bindings.control.checked = checked;

  const disabled = contents.get('disabled') === true;
  if (bindings.control.disabled !== disabled) bindings.control.disabled = disabled;
}

/** Lazy, memoised registration; see `./button.js` on why it is never at import time. */
let handle = null;

/** @returns {{name: string, createTrait: Function}} the component handle */
export function registerCheckbox() {
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

/** Create a Checkbox Pin on `session`; see `./text.js` on the option order. */
export function createCheckboxPin(session, options = {}) {
  registerCheckbox();
  return session.createPin({ chrome: false, ...options, type: NAME });
}
