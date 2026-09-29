/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * Button: a real `<button type="button">` as a widget.
 *
 *   registerButton();
 *   const ok = createButton(app, { x: 40, y: 40, label: 'Save', variant: 'primary' });
 *   setContent(ok, 'disabled', true);
 *
 * Three decisions carry this file, and the other controls in the kit make the
 * same three:
 *
 *   - **Native element.** A `<button>` is focusable, keyboard-activatable and
 *     correctly announced for free, and `CONTROL_SELECTOR` already exempts it
 *     from drag and pointer capture - so there is no key handling to re-implement.
 *     Its press is the native `click`, which bubbles like any blit event (and is
 *     the reactions add-on's `press`).
 *   - **Registration is a call.** `registerButton()` defines the widget once;
 *     importing the module registers nothing.
 *   - **Contents, not DOM.** `label`, `variant` and `disabled` are the widget's
 *     contents; the render diffs them onto the one element.
 *
 * No colour, metric or class is decided here beyond *which* variant this is:
 * `../styles.js` states what a variant looks like, in tokens.
 */
import { leadingText, setText, widget, widgetSpec } from '../../.plugin/addons/widget.js';
import { injectLibStyles } from '../styles.js';

/** The type name. */
const NAME = 'button';

/** Class the shared stylesheet hangs every Button rule off. */
const ROOT_CLASS = 'cloudcanvas-lib-button';

/** Tone variants, and the one given for none or an unknown one: a closed set, since it reaches a class name. */
const VARIANTS = new Set(['primary', 'secondary', 'ghost', 'danger']);
const DEFAULT_VARIANT = 'secondary';

/** The control and its one text node. */
function bind(host) {
  const root = host.querySelector(`.${ROOT_CLASS}`);
  return { root, label: leadingText(root) };
}

/** The label through `Text.data`, the variant through `classList`, `disabled` onto the control. */
function render(bindings, contents, cache) {
  setText(bindings.label, contents.get('label'));
  applyVariant(bindings.root, contents.get('variant'), cache);
  const disabled = contents.get('disabled') === true;
  if (bindings.root.disabled !== disabled) bindings.root.disabled = disabled;
}

/**
 * Swap the modifier class, diff-first: an unchanged variant writes nothing.
 * `classList` only: assigning `className` would take the root class with it.
 */
function applyVariant(root, requested, cache) {
  const variant = VARIANTS.has(requested) ? requested : DEFAULT_VARIANT;
  if (cache.variant === variant) return;
  if (cache.variant) root.classList.remove(`${ROOT_CLASS}-${cache.variant}`);
  cache.variant = variant;
  root.classList.add(`${ROOT_CLASS}-${variant}`);
}

const SPEC = Object.freeze({
  name: NAME,
  html: `<button class="${ROOT_CLASS}" type="button"></button>`,
  keys: ['label', 'variant', 'disabled'],
  bind,
  render
});

/** Define the Button widget, once. @returns {object} its type */
export function registerButton() {
  injectLibStyles();
  return widget(SPEC);
}

/** A chromeless Button blit in `parent`; its contents may come flat or as `contents`. */
export function createButton(parent, options = {}) {
  registerButton();
  return parent.blit(widgetSpec(NAME, { chrome: false, ...options }));
}
