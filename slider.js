/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Slider: a real `<input type="range">` with a live readout.
 *
 * A drag is a stream, and the model is not: committing every intermediate value
 * into `pin.contents` would invalidate the Pin on every pointer move and fight
 * the very control the user is holding. So the two halves are split exactly
 * where the interaction is.
 *
 *   - `input` (every tick) writes the readout directly and transmits the raw
 *     number. `pin.contents` is not touched, so nothing re-renders and nothing
 *     is written back over the thumb.
 *   - `change` (the release) commits once, through `pin.setContent`, and
 *     transmits again. From there the render pass is the source of truth.
 *
 * The readout is a plain `<span>` written through `setText`, so the value the
 * user is dragging past is real text a screen reader can be pointed at - and
 * the native range already publishes `aria-valuenow` for itself.
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
import { toNumber } from './coerce.js';

/** Registry name, and the `type` a caller creates a Pin by. */
const NAME = 'slider';

const ROOT_CLASS = 'cloudcanvas-lib-slider';
const LABEL_CLASS = 'cloudcanvas-lib-slider-label';
const ROW_CLASS = 'cloudcanvas-lib-slider-row';
const CONTROL_CLASS = 'cloudcanvas-lib-slider-control';
const VALUE_CLASS = 'cloudcanvas-lib-slider-value';

/** The range a Slider spans when the caller states none. */
const DEFAULT_MIN = 0;
const DEFAULT_MAX = 100;
const DEFAULT_STEP = 1;

/** The content keys a Slider accepts; anything else is refused by `setContents`. */
const ALLOWED_KEYS = ['label', 'value', 'min', 'max', 'step', 'disabled'];

/** Build once: the label, the range, the readout, and both listeners. */
function build(pin, contentEl) {
  const root = makeElement('div', ROOT_CLASS);
  const label = makeElement('label', LABEL_CLASS);
  const labelText = makeTextNode(label);

  const row = makeElement('div', ROW_CLASS);
  const control = makeElement('input', CONTROL_CLASS);
  control.setAttribute('type', 'range');
  control.id = `${pin.id}-control`;

  const readout = makeElement('span', VALUE_CLASS);
  const readoutText = makeTextNode(readout);

  control.addEventListener('input', () => {
    // Readout only: the model stays where it is until the drag is released.
    setText(readoutText, control.value);
    pin.transmit(new PinEvent('input', {
      payload: Number(control.value),
      bubbles: true,
      source: pin
    }));
  });

  control.addEventListener('change', () => {
    pin.setContent('value', Number(control.value));
    pin.transmit(new PinEvent('change', {
      payload: Number(control.value),
      bubbles: true,
      source: pin
    }));
  });

  row.appendChild(control);
  row.appendChild(readout);
  root.appendChild(label);
  root.appendChild(row);
  contentEl.replaceChildren(root);

  return { root, label, labelText, row, control, readout, readoutText };
}

/** Mutate after: the bounds first, then the value they clamp. */
function update(pin, contents, bindings, cache) {
  const { control } = bindings;

  const label = contents.get('label');
  setText(bindings.labelText, label);
  setVisible(bindings.label, Boolean(label));
  setAttr(bindings.label, 'for', control.id, cache, 'for');

  const min = toNumber(contents.get('min'), DEFAULT_MIN);
  const declaredMax = toNumber(contents.get('max'), DEFAULT_MAX);
  // A max at or below the min is not a range; the default is the honest answer.
  const max = declaredMax > min ? declaredMax : DEFAULT_MAX;
  const step = toNumber(contents.get('step'), DEFAULT_STEP);

  // Bounds before value: a range input clamps to whatever `max` says at the
  // moment the value is assigned, so writing them the other way round loses it.
  setAttr(control, 'min', String(min), cache, 'min');
  setAttr(control, 'max', String(max), cache, 'max');
  setAttr(control, 'step', String(step > 0 ? step : DEFAULT_STEP), cache, 'step');

  const value = Math.min(Math.max(toNumber(contents.get('value'), min), min), max);
  const text = String(value);
  if (control.value !== text) control.value = text;
  setText(bindings.readoutText, text);

  const disabled = contents.get('disabled') === true;
  if (control.disabled !== disabled) control.disabled = disabled;
}

/** Lazy, memoised registration; see `./button.js` on why it is never at import time. */
let handle = null;

/** @returns {import('../src/pins/traits/define-component.js').ComponentHandle} */
export function registerSlider() {
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

/** Create a Slider Pin on `session`; see `./text.js` on the option order. */
export function createSliderPin(session, options = {}) {
  registerSlider();
  return session.createPin({ chrome: false, ...options, type: NAME });
}
