/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * What the labelled form controls share: a control id derived from the blit's
 * element id, the `<label for>` that names it, the caption, and the one way a
 * control's native event becomes the blit's own.
 *
 * A control's native `input` / `change` stops at the control and is re-issued
 * with `b.emit(type, payload)`, the way a custom element encapsulates its inner
 * events: a listener on the blit hears one event, and it carries the payload.
 */
import { setContent, setText, setVisible } from '../../.plugin/addons/widget.js';

/** @type {WeakMap<Element, string>} a blit element with no id -> the id its controls are named from */
const FALLBACK_IDS = /* @__PURE__ */ new WeakMap();
let fallbackCount = 0;

/** The id a blit element is named by: its own, else one fixed for the element's life. */
export function hostId(host) {
  if (host.id) return host.id;
  if (!FALLBACK_IDS.has(host)) {
    fallbackCount += 1;
    FALLBACK_IDS.set(host, `cc-control-${fallbackCount}`);
  }
  return FALLBACK_IDS.get(host);
}

/** Give `control` its id under `host`; idempotent, it writes only when the id moved. @returns {string} the id */
export function nameControl(host, control, suffix = 'control') {
  const id = `${hostId(host)}-${suffix}`;
  if (control.id !== id) control.id = id;
  return id;
}

/** Name `control` and point `label` at it: the native accessible name, so no `aria-label` is needed. */
export function linkLabel(host, control, label, suffix = 'control') {
  const id = nameControl(host, control, suffix);
  if (label.getAttribute('for') !== id) label.setAttribute('for', id);
}

/** The caption: its text, and hidden rather than blank when there is none. */
export function renderLabel(label, text, value) {
  setText(text, value);
  setVisible(label, Boolean(value));
}

/** A boolean property (`checked`, `disabled`, `required`) as the content says, written only when it moved. */
export function setFlag(control, name, value) {
  const flag = value === true;
  if (control[name] !== flag) control[name] = flag;
}

/** Stop a control's native event at the control; the blit issues its own. */
export function stopAtControl(event) {
  event.stopPropagation();
}

/**
 * On the control's native `type`: commit `read(control)` into content `key`, then emit it as the blit's `type`.
 * @param {Function} on the widget's listener registrar
 */
export function commitOn(on, b, control, type, key, read) {
  on(control, type, (event) => {
    stopAtControl(event);
    const value = read(control);
    setContent(b, key, value);
    b.emit(type, value);
  });
}
