/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Toggle: a switch that is a real `<input type="checkbox">` underneath, as a widget.
 *
 *   registerToggle();
 *   const live = createToggle(app, { x: 40, y: 40, label: 'Live', checked: true });
 *
 * `role="switch"` is the only thing that separates it from `./checkbox.js`, and
 * it is worth exactly one extra obligation: an explicit `aria-checked`. Some
 * assistive-technology and browser pairs stop deriving the checked state from
 * the native element once the role has been overridden, so the state has to be
 * said twice - the property for the platform, the attribute for the role.
 *
 * One writer keeps them in step: the render, which a commit runs at once (a
 * widget write renders synchronously), so the switch never announces a state a
 * frame behind the one it paints. The attribute is diffed against the DOM
 * itself, not a cache, so no second writer can leave a stale record behind.
 *
 * The track and thumb are the stylesheet's (`appearance: none` plus an
 * `::after`), not a div sandwich: keeping the native checkbox keeps its keyboard
 * operation, its focus behaviour and its label association whole.
 */
import { blit } from '../../.plugin/core/index.js';
import { leadingText, widget, widgetSpec } from '../../.plugin/addons/widget.js';
import { injectLibStyles } from '../styles.js';
import { commitOn, linkLabel, renderLabel, setFlag } from './control.js';

/** The type name. */
const NAME = 'toggle';

const ROOT_CLASS = 'cloudcanvas-lib-toggle';
const CONTROL_CLASS = 'cloudcanvas-lib-toggle-control';
const LABEL_CLASS = 'cloudcanvas-lib-toggle-label';

/** The switch and its label, named from the blit's element id; the change commits and is re-issued. */
function bind(host, on) {
  const root = host.querySelector(`.${ROOT_CLASS}`);
  const control = root.querySelector(`.${CONTROL_CLASS}`);
  const label = root.querySelector(`.${LABEL_CLASS}`);
  linkLabel(host, control, label);
  commitOn(on, blit(host), control, 'change', 'checked', (element) => element.checked);
  return { root, control, label, labelText: leadingText(label) };
}

/** The label, the native checked property, and its ARIA mirror. */
function render(bindings, contents) {
  const { control } = bindings;
  renderLabel(bindings.label, bindings.labelText, contents.get('label'));

  const checked = contents.get('checked') === true;
  setFlag(control, 'checked', checked);
  if (control.getAttribute('aria-checked') !== String(checked)) control.setAttribute('aria-checked', String(checked));

  setFlag(control, 'disabled', contents.get('disabled'));
}

const SPEC = Object.freeze({
  name: NAME,
  html: `<div class="${ROOT_CLASS}"><input class="${CONTROL_CLASS}" type="checkbox" role="switch">`
    + `<label class="${LABEL_CLASS}"></label></div>`,
  keys: ['label', 'checked', 'disabled'],
  bind,
  render
});

/** Define the Toggle widget, once. @returns {object} its type */
export function registerToggle() {
  injectLibStyles();
  return widget(SPEC);
}

/** A chromeless Toggle blit in `parent`; its contents may come flat or as `contents`. */
export function createToggle(parent, options = {}) {
  registerToggle();
  return parent.blit(widgetSpec(NAME, { chrome: false, ...options }));
}
