/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Checkbox: a real `<input type="checkbox">` and its `<label for>`, as a widget.
 *
 *   registerCheckbox();
 *   const agree = createCheckbox(app, { x: 40, y: 40, label: 'Agree' });
 *   agree.on('change', (event) => console.log(event.detail.payload));
 *
 * No edit lock here, unlike `./input.js`: a tick is instantaneous and has no
 * caret to lose, so the native `change` commits straight into the contents and
 * the render it causes simply agrees with the DOM.
 *
 * No `aria-checked` either. A native checkbox already publishes its state, and
 * an ARIA attribute would *override* what the element itself reports. The one
 * widget in this kit that has to write it is `./toggle.js`, and only because it
 * overrides the role.
 */
import { blit } from '../../.plugin/core/index.js';
import { leadingText, widget, widgetSpec } from '../../.plugin/addons/widget.js';
import { injectLibStyles } from '../styles.js';
import { commitOn, linkLabel, renderLabel, setFlag } from './control.js';

/** The type name. */
const NAME = 'checkbox';

const ROOT_CLASS = 'cloudcanvas-lib-checkbox';
const CONTROL_CLASS = 'cloudcanvas-lib-checkbox-control';
const LABEL_CLASS = 'cloudcanvas-lib-checkbox-label';

/** The control and its label, named from the blit's element id; the change commits and is re-issued. */
function bind(host, on) {
  const root = host.querySelector(`.${ROOT_CLASS}`);
  const control = root.querySelector(`.${CONTROL_CLASS}`);
  const label = root.querySelector(`.${LABEL_CLASS}`);
  linkLabel(host, control, label);
  commitOn(on, blit(host), control, 'change', 'checked', (element) => element.checked);
  return { root, control, label, labelText: leadingText(label) };
}

/** The label text, the checked state, and the disabled flag. */
function render(bindings, contents) {
  renderLabel(bindings.label, bindings.labelText, contents.get('label'));
  setFlag(bindings.control, 'checked', contents.get('checked'));
  setFlag(bindings.control, 'disabled', contents.get('disabled'));
}

const SPEC = Object.freeze({
  name: NAME,
  html: `<div class="${ROOT_CLASS}"><input class="${CONTROL_CLASS}" type="checkbox">`
    + `<label class="${LABEL_CLASS}"></label></div>`,
  keys: ['label', 'checked', 'disabled'],
  bind,
  render
});

/** Define the Checkbox widget, once. @returns {object} its type */
export function registerCheckbox() {
  injectLibStyles();
  return widget(SPEC);
}

/** A chromeless Checkbox blit in `parent`; its contents may come flat or as `contents`. */
export function createCheckbox(parent, options = {}) {
  registerCheckbox();
  return parent.blit(widgetSpec(NAME, { chrome: false, ...options }));
}
