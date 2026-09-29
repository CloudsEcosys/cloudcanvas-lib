/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Slider: a real `<input type="range">` with a live readout, as a widget.
 *
 *   registerSlider();
 *   const volume = createSlider(app, { x: 40, y: 40, label: 'Volume', value: 5, max: 10 });
 *
 * A drag is a stream, and the contents are not: committing every intermediate
 * value would re-render on every pointer move and fight the very control the
 * user is holding. So the two halves are split exactly where the interaction is.
 *
 *   - `input` (every tick) writes the readout directly and emits the raw
 *     number. The contents are not touched, so nothing re-renders and nothing
 *     is written back over the thumb.
 *   - `change` (the release) commits once, through `setContent`, and emits
 *     again. From there the render is the source of truth.
 *
 * The readout is a plain `<span>` written through `setText`, so the value the
 * user is dragging past is real text a screen reader can be pointed at - and
 * the native range already publishes `aria-valuenow` for itself.
 */
import { blit } from '../../.plugin/core/index.js';
import { leadingText, setAttr, setText, widget, widgetSpec } from '../../.plugin/addons/widget.js';
import { toNumber } from '../coerce.js';
import { injectLibStyles } from '../styles.js';
import { commitOn, linkLabel, renderLabel, setFlag, stopAtControl } from './control.js';

/** The type name. */
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

/** The label, the range and the readout; a tick moves the readout only, the release commits. */
function bind(host, on) {
  const b = blit(host);
  const root = host.querySelector(`.${ROOT_CLASS}`);
  const label = root.querySelector(`.${LABEL_CLASS}`);
  const control = root.querySelector(`.${CONTROL_CLASS}`);
  const readout = root.querySelector(`.${VALUE_CLASS}`);
  const readoutText = leadingText(readout);
  linkLabel(host, control, label);

  on(control, 'input', (event) => {
    stopAtControl(event);
    setText(readoutText, control.value);
    b.emit('input', Number(control.value));
  });
  commitOn(on, b, control, 'change', 'value', (element) => Number(element.value));
  return { root, label, labelText: leadingText(label), control, readout, readoutText };
}

/** The bounds first, then the value they clamp. */
function render(bindings, contents, cache) {
  const { control } = bindings;
  renderLabel(bindings.label, bindings.labelText, contents.get('label'));

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

  const text = String(Math.min(Math.max(toNumber(contents.get('value'), min), min), max));
  if (control.value !== text) control.value = text;
  setText(bindings.readoutText, text);
  setFlag(control, 'disabled', contents.get('disabled'));
}

const SPEC = Object.freeze({
  name: NAME,
  html: `<div class="${ROOT_CLASS}"><label class="${LABEL_CLASS}"></label><div class="${ROW_CLASS}">`
    + `<input class="${CONTROL_CLASS}" type="range"><span class="${VALUE_CLASS}"></span></div></div>`,
  keys: ['label', 'value', 'min', 'max', 'step', 'disabled'],
  bind,
  render
});

/** Define the Slider widget, once. @returns {object} its type */
export function registerSlider() {
  injectLibStyles();
  return widget(SPEC);
}

/** A chromeless Slider blit in `parent`; its contents may come flat or as `contents`. */
export function createSlider(parent, options = {}) {
  registerSlider();
  return parent.blit(widgetSpec(NAME, { chrome: false, ...options }));
}
