/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Select: a real `<select>` whose `<option>` list is reconciled, not rebuilt.
 *
 * The options are the one genuinely list-shaped thing in this half of the kit,
 * so they go through `reconcileKeyedList` keyed on `option.value`: the element
 * already holding a key is reused, a new key gets one element, and what is left
 * over is removed. Rewriting the list wholesale would be worse than wasteful -
 * it would drop the element the user has open and reset the selection on every
 * unrelated content change.
 *
 * Keying on the value has a second consequence worth stating: an option's value
 * *is* its identity, so it never changes for a given element and is written at
 * creation. Only the label can move, and it moves through `setText`.
 *
 * The selected value is written after the reconcile, never before: a `<select>`
 * silently refuses a value none of its options carry.
 */

import {
  defineComponent,
  makeElement,
  makeTextNode,
  reconcileKeyedList,
  setText,
  setVisible,
  PinEvent
} from '../src/index.js';
import { asText } from './coerce.js';

/** Registry name, and the `type` a caller creates a Pin by. */
const NAME = 'select';

const ROOT_CLASS = 'cloudcanvas-lib-select';
const LABEL_CLASS = 'cloudcanvas-lib-select-label';
const CONTROL_CLASS = 'cloudcanvas-lib-select-control';

/** The content keys a Select accepts; anything else is refused by `setContents`. */
const ALLOWED_KEYS = ['label', 'value', 'options', 'disabled'];

/** An option's key, which is also the value the element will carry for good. */
function optionKey(option) {
  return asText(option && option.value);
}

/** One `<option>`, with its value fixed at creation and a text node for its label. */
function createOption(option) {
  const element = makeElement('option');
  element.value = optionKey(option);
  makeTextNode(element);
  return element;
}

/** Build once: the label, the control, and the change listener. */
function build(pin, contentEl) {
  const root = makeElement('div', ROOT_CLASS);

  const label = makeElement('label', LABEL_CLASS);
  const labelText = makeTextNode(label);

  const control = makeElement('select', CONTROL_CLASS);
  control.id = `${pin.id}-control`;
  label.setAttribute('for', control.id);

  control.addEventListener('change', () => {
    pin.setContent('value', control.value);
    pin.transmit(new PinEvent('change', { payload: control.value, bubbles: true, source: pin }));
  });

  root.appendChild(label);
  root.appendChild(control);
  contentEl.replaceChildren(root);

  return { root, label, labelText, control };
}

/** Mutate after: the label, the option list, then the selection it must hold. */
function update(pin, contents, bindings) {
  const { control } = bindings;

  const label = contents.get('label');
  setText(bindings.labelText, label);
  setVisible(bindings.label, Boolean(label));

  const options = contents.get('options');
  reconcileKeyedList(control, Array.isArray(options) ? options : [], {
    key: optionKey,
    create: createOption,
    update: (element, option) => setText(element.firstChild, option && option.label)
  });

  // After the reconcile: a `<select>` cannot hold a value no option carries.
  // Only when the caller stated one - writing an absent value as the empty
  // string would deselect the first option the platform selects by default,
  // leaving a blank field nobody asked for.
  if (contents.has('value')) {
    const value = asText(contents.get('value'));
    if (control.value !== value) control.value = value;
  }

  const disabled = contents.get('disabled') === true;
  if (control.disabled !== disabled) control.disabled = disabled;
}

/** Lazy, memoised registration; see `./button.js` on why it is never at import time. */
let handle = null;

/** @returns {import('../src/pins/traits/define-component.js').ComponentHandle} */
export function registerSelect() {
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

/** Create a Select Pin on `session`; see `./text.js` on the option order. */
export function createSelectPin(session, options = {}) {
  registerSelect();
  return session.createPin({ chrome: false, ...options, type: NAME });
}
