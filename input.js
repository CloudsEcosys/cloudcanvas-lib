/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Input: a real `<input>` - or `<textarea>` - and its `<label for>`.
 *
 * Two things separate this from every other control in the kit.
 *
 *   - **The edit lock is the design.** A display trait rewrites the content node
 *     from `pin.contents`, and an editor lives inside that node: a render during
 *     a keystroke takes the caret, the selection and the half-typed word with
 *     it. So `focus` takes the lock (`pin.beginEdit`) and `blur` commits the
 *     typed value and then releases it - in that order, because `endEdit`
 *     replays exactly one deferred render and it must find the committed value
 *     already in place. Nothing touches `pin.contents` in between: keystrokes go
 *     out as a live `input` PinEvent, so a consumer can follow them, while the
 *     model a render reads stays where the user left it.
 *   - **Both controls are built once.** `multiline` chooses between them, and a
 *     custom template's subtree is built once for the life of the Pin, so both
 *     elements exist from the first frame and visibility picks one. That is the
 *     same "hide it, do not rebuild it" rule the core's card template follows.
 *
 * The accessible name is the native one: a `<label for>` pointing at a stable
 * per-Pin id. No `aria-label` is written, because the correct pattern needs none.
 */

import {
  defineComponent,
  makeElement,
  makeTextNode,
  setAttr,
  setText,
  setVisible,
  PinEvent
} from '../src/index.js';
import { asText } from './coerce.js';

/** Registry name, and the `type` a caller creates a Pin by. */
const NAME = 'input';

const ROOT_CLASS = 'cloudcanvas-lib-input';
const LABEL_CLASS = 'cloudcanvas-lib-input-label';
const CONTROL_CLASS = 'cloudcanvas-lib-input-control';

/**
 * The `type` attributes a single-line Input accepts, and its default.
 * A closed set: the value is written straight onto a live form control.
 */
const TYPES = new Set(['text', 'email', 'password', 'number']);
const DEFAULT_TYPE = 'text';

/** The content keys an Input accepts; anything else is refused by `setContents`. */
const ALLOWED_KEYS = ['label', 'value', 'placeholder', 'type', 'multiline', 'disabled', 'required'];

/** Wire one control into the edit-lock contract. Both controls get all three. */
function wire(pin, control) {
  control.addEventListener('focus', () => pin.beginEdit(control));

  control.addEventListener('input', () => {
    // Live, and deliberately model-free: `pin.contents` stays untouched until
    // the edit is committed, so nothing can be rendered over mid-word.
    pin.transmit(new PinEvent('input', { payload: control.value, bubbles: true, source: pin }));
  });

  control.addEventListener('blur', () => {
    pin.setContent('value', control.value);
    pin.endEdit();
    pin.transmit(new PinEvent('change', { payload: control.value, bubbles: true, source: pin }));
  });
}

/** Build once: the label and both controls, with their ids and listeners. */
function build(pin, contentEl) {
  const root = makeElement('div', ROOT_CLASS);
  const label = makeElement('label', LABEL_CLASS);
  const labelText = makeTextNode(label);

  const single = makeElement('input', CONTROL_CLASS);
  single.id = `${pin.id}-control`;
  const multi = makeElement('textarea', CONTROL_CLASS);
  multi.id = `${pin.id}-control-multiline`;

  wire(pin, single);
  wire(pin, multi);

  root.appendChild(label);
  root.appendChild(single);
  root.appendChild(multi);
  contentEl.replaceChildren(root);

  return { root, label, labelText, single, multi };
}

/** Mutate after: which control is live, what it says, and what it holds. */
function update(pin, contents, bindings, cache) {
  const multiline = contents.get('multiline') === true;
  const control = multiline ? bindings.multi : bindings.single;

  setVisible(bindings.single, !multiline);
  setVisible(bindings.multi, multiline);
  // The label names whichever control is showing.
  setAttr(bindings.label, 'for', control.id, cache, 'for');

  const label = contents.get('label');
  setText(bindings.labelText, label);
  setVisible(bindings.label, Boolean(label));

  setAttr(bindings.single, 'type', TYPES.has(contents.get('type')) ? contents.get('type') : DEFAULT_TYPE, cache, 'type');
  applyState(bindings.single, contents, cache, 'single');
  applyState(bindings.multi, contents, cache, 'multi');

  // Only the live control carries the value; the other is written by the very
  // render that reveals it.
  const value = asText(contents.get('value'));
  if (control.value !== value) control.value = value;
}

/** `placeholder`, `disabled` and `required` for one control. */
function applyState(control, contents, cache, key) {
  setAttr(control, 'placeholder', asText(contents.get('placeholder')), cache, `${key}:placeholder`);

  const disabled = contents.get('disabled') === true;
  if (control.disabled !== disabled) control.disabled = disabled;

  const required = contents.get('required') === true;
  if (control.required !== required) control.required = required;
}

/** Lazy, memoised registration; see `./button.js` on why it is never at import time. */
let handle = null;

/** @returns {import('../src/pins/traits/define-component.js').ComponentHandle} */
export function registerInput() {
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

/** Create an Input Pin on `session`; see `./text.js` on the option order. */
export function createInputPin(session, options = {}) {
  registerInput();
  return session.createPin({ chrome: false, ...options, type: NAME });
}
