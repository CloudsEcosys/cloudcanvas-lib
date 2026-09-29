/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Select: a real `<select>` whose `<option>` list is reconciled, not rebuilt, as a widget.
 *
 *   registerSelect();
 *   const fruit = createSelect(app, { label: 'Fruit', options: [{ value: 'a', label: 'Apple' }] });
 *
 * The options are the one list-shaped thing in the forms, so they go through
 * `reconcileKeyedList` (`cloudcanvas/keyed-list`) keyed on `option.value`: the
 * element already holding a key is reused, a new key gets one element, and what
 * is left over is removed. Rewriting the list wholesale would drop the element
 * the user has open and reset the selection on every unrelated write.
 *
 * Keying on the value has a second consequence: an option's value *is* its
 * identity, so it is written at creation and never again. Only the label moves,
 * through `setText`.
 *
 * The selected value is written after the reconcile, never before: a `<select>`
 * silently refuses a value none of its options carry.
 */
import { blit } from '../../.plugin/core/index.js';
import { reconcileKeyedList } from '../../.plugin/addons/keyed-list.js';
import { leadingText, setText, widget, widgetSpec } from '../../.plugin/addons/widget.js';
import { asText } from '../coerce.js';
import { injectLibStyles } from '../styles.js';
import { commitOn, linkLabel, renderLabel, setFlag } from './control.js';

/**
 * The type name: `dropdown`, since `select` names the selection trait a widget's
 * own trait key would collide with. A save that says `select` loads as this.
 */
const NAME = 'dropdown';

const ROOT_CLASS = 'cloudcanvas-lib-select';
const LABEL_CLASS = 'cloudcanvas-lib-select-label';
const CONTROL_CLASS = 'cloudcanvas-lib-select-control';

/** An option's key, which is also the value the element carries for good. */
function optionKey(option) {
  return asText(option && option.value);
}

/** One `<option>`, its value fixed at creation, with a Text node for its label. */
function createOption(option) {
  const element = document.createElement('option');
  element.value = optionKey(option);
  leadingText(element);
  return element;
}

/** The label and the control, named from the blit's element id; the change commits and is re-issued. */
function bind(host, on) {
  const root = host.querySelector(`.${ROOT_CLASS}`);
  const label = root.querySelector(`.${LABEL_CLASS}`);
  const control = root.querySelector(`.${CONTROL_CLASS}`);
  linkLabel(host, control, label);
  commitOn(on, blit(host), control, 'change', 'value', (element) => element.value);
  return { root, label, labelText: leadingText(label), control };
}

/** The label, the option list, then the selection it must hold. */
function render(bindings, contents) {
  const { control } = bindings;
  renderLabel(bindings.label, bindings.labelText, contents.get('label'));

  const options = contents.get('options');
  reconcileKeyedList(control, Array.isArray(options) ? options : [], {
    key: optionKey,
    create: createOption,
    update: (element, option) => setText(leadingText(element), option && option.label)
  });

  // After the reconcile, and only when stated: writing an absent value as the
  // empty string would deselect the option the platform selects by default.
  if (contents.has('value')) {
    const value = asText(contents.get('value'));
    if (control.value !== value) control.value = value;
  }
  setFlag(control, 'disabled', contents.get('disabled'));
}

const SPEC = Object.freeze({
  name: NAME,
  html: `<div class="${ROOT_CLASS}"><label class="${LABEL_CLASS}"></label>`
    + `<select class="${CONTROL_CLASS}"></select></div>`,
  keys: ['label', 'value', 'options', 'disabled'],
  bind,
  render
});

/** Define the Select widget, once. @returns {object} its type */
export function registerSelect() {
  injectLibStyles();
  return widget(SPEC);
}

/** A chromeless Select blit in `parent`; its contents may come flat or as `contents`. */
export function createSelect(parent, options = {}) {
  registerSelect();
  return parent.blit(widgetSpec(NAME, { chrome: false, ...options }));
}
