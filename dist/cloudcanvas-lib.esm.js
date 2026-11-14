/*!
 * CloudCanvas lib v0.7.1 - CloudCanvas plugins: every add-on, the UI kit and the widgets, one entry each
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * MIT License. https://github.com/CloudsEcosys/cloudcanvas-lib#readme
 */

// plugins/widget.js
import { blit, type } from "cloudcanvas/kernel";
import { camelCase } from "cloudcanvas/kernel";
import { findType } from "cloudcanvas/kernel";
import { createLogger } from "cloudcanvas/log";

// plugins/edit.js
var EDIT_EVENT = "edit";
var EDITING_ATTR = "data-editing";
var EDITS = /* @__PURE__ */ new WeakMap();
function begin(b, node = null) {
  if (EDITS.has(b.el)) return false;
  EDITS.set(b.el, { node: node || null, replay: null });
  b.el.setAttribute(EDITING_ATTR, "");
  b.emit(EDIT_EVENT, true);
  return true;
}
function end(b) {
  const open = EDITS.get(b.el);
  if (!open) return false;
  EDITS.delete(b.el);
  b.el.removeAttribute(EDITING_ATTR);
  open.replay?.();
  b.emit(EDIT_EVENT, false);
  return true;
}
function deferRender(b, replay) {
  const open = EDITS.get(b.el);
  if (!open) return false;
  if (typeof replay === "function") open.replay = replay;
  return true;
}

// plugins/widget.js
var logger = /* @__PURE__ */ createLogger("widget");
var PROTOTYPE_KEYS = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
var DEFINED = /* @__PURE__ */ new Map();
var CACHES = /* @__PURE__ */ new WeakMap();
function setText(node, value) {
  const text = value === void 0 || value === null ? "" : String(value);
  if (node.data !== text) node.data = text;
}
function setVisible(element, visible) {
  if (element.hidden !== !visible) element.hidden = !visible;
}
function setAttr(element, name, value, cache, key) {
  if (cache[key] === value) return;
  cache[key] = value;
  element.setAttribute(name, value);
}
function leadingText(element) {
  const first = element.firstChild;
  if (first && first.nodeType === 3) return first;
  return element.insertBefore(document.createTextNode(""), first);
}
function permits(keys, key) {
  return keys ? keys.has(key) : !PROTOTYPE_KEYS.has(key);
}
function contentsOf(name, keys, options) {
  if (options === true || options === void 0 || options === null || options === "") return /* @__PURE__ */ new Map();
  if (typeof options !== "object" || Array.isArray(options)) {
    logger.warn(`${name}: expected {key: value} contents; rendering none`);
    return /* @__PURE__ */ new Map();
  }
  const contents = /* @__PURE__ */ new Map();
  for (const [key, value] of Object.entries(options)) {
    if (permits(keys, key)) contents.set(key, value);
    else logger.warn(`${name}: key "${key}" not permitted`);
  }
  return contents;
}
function dismiss(b) {
  if (b.emit("dismiss").defaultPrevented) return false;
  b.remove();
  return true;
}
function structureSelector(template) {
  const first = template?.content.firstElementChild;
  if (!first) return null;
  const classes = Array.from(first.classList, (name) => `.${CSS.escape(name)}`).join("");
  return classes || first.localName;
}
function ensureStructure(element, name) {
  const template = findType(name);
  const selector = structureSelector(template);
  if (selector && !element.querySelector(`:scope > ${selector}`)) element.prepend(template.content.cloneNode(true));
}
function traitOf({ name, bind: bind16, render: render16 }, keys) {
  return (b, options) => {
    const contents = contentsOf(name, keys, options);
    ensureStructure(b.el, name);
    const offs = [];
    const on = (target, eventType, listener) => {
      target.addEventListener(eventType, listener);
      offs.push(() => target.removeEventListener(eventType, listener));
    };
    const bindings = bind16(b.el, on, () => dismiss(b));
    if (!CACHES.has(b.el)) CACHES.set(b.el, {});
    const paint = () => render16(bindings, contents, CACHES.get(b.el));
    if (!deferRender(b, paint)) paint();
    return () => {
      for (const off of offs) off();
    };
  };
}
function widget(spec) {
  const { name, html, keys } = spec;
  const known = DEFINED.get(name);
  if (known && known !== spec) throw new TypeError(`widget: "${name}" is already defined`);
  if (!known) {
    const key = camelCase(name);
    blit.use({ [key]: traitOf(spec, keys ? new Set(keys) : null) });
    type(name, { html, defaults: { ...spec.defaults, [key]: true } });
    DEFINED.set(name, spec);
  }
  return type(name);
}
function contentKeyOf(b) {
  const name = b.el.getAttribute("data-type");
  return name && DEFINED.has(name) ? camelCase(name) : null;
}
function contentOf(b) {
  const key = contentKeyOf(b);
  const options = key ? b.spec[key] : null;
  return options && typeof options === "object" ? { ...options } : {};
}
function setContents(b, patch) {
  const key = contentKeyOf(b);
  const name = b.el.getAttribute("data-type");
  if (!key) throw new TypeError(`setContents: "${name}" is not a widget`);
  const { keys } = DEFINED.get(name);
  const declared = keys ? new Set(keys) : null;
  for (const each of Object.keys(patch)) {
    if (!permits(declared, each)) throw new TypeError(`${name}: key "${each}" not permitted`);
  }
  const next = { ...contentOf(b), ...patch };
  for (const each of Object.keys(next)) if (next[each] === void 0) delete next[each];
  return b.set({ [key]: Object.keys(next).length > 0 ? next : true });
}
function setContent(b, key, value) {
  return setContents(b, { [key]: value });
}
function widgetSpec(name, options = {}) {
  const defined = DEFINED.get(name);
  if (!defined) throw new TypeError(`widgetSpec: "${name}" is not a widget`);
  const keys = new Set(defined.keys ?? []);
  const contents = { ...options.contents ?? {} };
  const spec = {};
  for (const [key, value] of Object.entries(options)) {
    if (key === "contents" || value === void 0) continue;
    if (keys.has(key)) contents[key] = value;
    else spec[key] = value;
  }
  spec.type = name;
  if (Object.keys(contents).length > 0) spec[camelCase(name)] = contents;
  return spec;
}

// forms/styles-css.js
var LIB_CONTROLS_CSS = `
/* ------------------ FOUNDATION ------------------ */

/* Matched on the attribute, not on a class list: the kit's own geometry must
   hold for every widget in it, including the ones added after this line. */
[class*="cloudcanvas-lib-"] {
  box-sizing: border-box;
}

/*
 * The whole accessibility argument for using native controls, in one rule. It
 * matches any focused element that is - or sits inside - a kit widget, so a new
 * widget inherits the ring instead of having to remember it, and it fires only
 * for keyboard focus, which is what \`:focus-visible\` is for.
 */
[class*="cloudcanvas-lib-"]:focus-visible,
[class*="cloudcanvas-lib-"] button:focus-visible,
[class*="cloudcanvas-lib-"] input:focus-visible,
[class*="cloudcanvas-lib-"] select:focus-visible,
[class*="cloudcanvas-lib-"] textarea:focus-visible,
[class*="cloudcanvas-lib-"] [role="switch"]:focus-visible,
[class*="cloudcanvas-lib-"] [tabindex]:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: var(--cc-focus-ring-offset, 2px);
}

/* ------------------ BUTTON ------------------ */

.cloudcanvas-lib-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cc-space-1, 4px);
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  border: 1px solid var(--cc-btn-border, rgba(56, 189, 248, 0.35));
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-btn-bg, rgba(56, 189, 248, 0.12));
  color: var(--cc-btn-text, #7dd3fc);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-medium, 500);
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.cloudcanvas-lib-button:hover:not(:disabled) {
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  border-color: var(--cc-accent, #38bdf8);
}

.cloudcanvas-lib-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/*
 * A filled variant needs a foreground that clears its own fill in both themes,
 * and the token that already flips with the surface is the canvas background:
 * dark ink on the light-blue dark-theme accent, light ink on the deeper light-
 * theme accent. That is why no new "on-accent" token is invented here.
 */
.cloudcanvas-lib-button-primary {
  background: var(--cc-accent, #38bdf8);
  border-color: var(--cc-accent, #38bdf8);
  color: var(--cc-bg, #0f1117);
}

.cloudcanvas-lib-button-primary:hover:not(:disabled) {
  background: var(--cc-accent, #38bdf8);
  border-color: var(--cc-accent, #38bdf8);
  opacity: 0.88;
}

.cloudcanvas-lib-button-secondary {
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  border-color: var(--cc-card-border, rgba(255, 255, 255, 0.1));
  color: var(--cc-text, #e2e8f0);
}

.cloudcanvas-lib-button-secondary:hover:not(:disabled) {
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  border-color: var(--cc-scope-border, rgba(255, 255, 255, 0.15));
}

.cloudcanvas-lib-button-ghost {
  background: transparent;
  border-color: transparent;
  color: var(--cc-text-muted, #94a3b8);
}

.cloudcanvas-lib-button-ghost:hover:not(:disabled) {
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  border-color: transparent;
  color: var(--cc-text, #e2e8f0);
}

.cloudcanvas-lib-button-danger {
  background: var(--cc-tone-danger, #f87171);
  border-color: var(--cc-tone-danger, #f87171);
  color: var(--cc-bg, #0f1117);
}

.cloudcanvas-lib-button-danger:hover:not(:disabled) {
  background: var(--cc-tone-danger, #f87171);
  border-color: var(--cc-tone-danger, #f87171);
  opacity: 0.88;
}

/* ------------------ FIELD SHELLS ------------------ */

.cloudcanvas-lib-input,
.cloudcanvas-lib-select,
.cloudcanvas-lib-slider {
  display: flex;
  flex-direction: column;
  gap: var(--cc-space-1, 4px);
  width: 100%;
}

.cloudcanvas-lib-input-label,
.cloudcanvas-lib-select-label,
.cloudcanvas-lib-slider-label,
.cloudcanvas-lib-progress-label {
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-text-muted, #94a3b8);
  line-height: 1.35;
}

.cloudcanvas-lib-input-control,
.cloudcanvas-lib-select-control {
  width: 100%;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  border: 1px solid var(--cc-input-border, rgba(255, 255, 255, 0.16));
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-input-bg, rgba(255, 255, 255, 0.06));
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-md, 13px);
  line-height: 1.35;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.cloudcanvas-lib-input-control::placeholder {
  color: var(--cc-text-muted, #94a3b8);
  opacity: 1;
}

/* Stated for the pointer path too: \`:focus-visible\` carries the ring, this
   carries the field's own border, and a mouse user gets the second. */
.cloudcanvas-lib-input-control:focus,
.cloudcanvas-lib-select-control:focus {
  border-color: var(--cc-input-border-focus, var(--cc-accent, #38bdf8));
}

.cloudcanvas-lib-input-control:disabled,
.cloudcanvas-lib-select-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cloudcanvas-lib-select-control {
  cursor: pointer;
}

/* ------------------ CHECKBOX / RADIO ------------------ */

.cloudcanvas-lib-checkbox,
.cloudcanvas-lib-radio,
.cloudcanvas-lib-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  min-height: var(--cc-control-min, 28px);
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-md, 13px);
  line-height: 1.35;
  cursor: pointer;
}

.cloudcanvas-lib-checkbox-control,
.cloudcanvas-lib-radio-control {
  flex: none;
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--cc-accent, #38bdf8);
  cursor: pointer;
}

.cloudcanvas-lib-checkbox-label,
.cloudcanvas-lib-radio-label,
.cloudcanvas-lib-toggle-label {
  min-width: 0;
}

.cloudcanvas-lib-radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--cc-space-1, 4px);
}

.cloudcanvas-lib-radio-group-label {
  color: var(--cc-text-muted, #94a3b8);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-medium, 500);
  line-height: 1.35;
}

/* ------------------ TOGGLE ------------------ */

/*
 * One element, no JavaScript: \`appearance: none\` turns the checkbox itself into
 * the track and its \`::after\` into the thumb, so the switch keeps the native
 * checkbox's keyboard operation, focus behaviour and checked state entirely.
 * The alternative - a visually hidden input beside two spans - needs the same
 * CSS plus a label association to stay operable, and buys nothing.
 */
.cloudcanvas-lib-toggle-control {
  appearance: none;
  -webkit-appearance: none;
  position: relative;
  flex: none;
  width: 34px;
  height: 18px;
  margin: 0;
  padding: 0;
  border: 1px solid var(--cc-input-border, rgba(255, 255, 255, 0.16));
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-track-bg, rgba(255, 255, 255, 0.16));
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.cloudcanvas-lib-toggle-control::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-thumb-bg, #e2e8f0);
  transition: transform 0.15s ease;
}

.cloudcanvas-lib-toggle-control:checked {
  background: var(--cc-accent, #38bdf8);
  border-color: var(--cc-accent, #38bdf8);
}

.cloudcanvas-lib-toggle-control:checked::after {
  transform: translateX(16px);
}

.cloudcanvas-lib-toggle-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ------------------ SLIDER ------------------ */

/*
 * \`accent-color\` rather than a rebuilt track: styling a range input from
 * scratch means \`appearance: none\` plus a per-engine thumb rule, and every one
 * of those rules is a place the keyboard affordance can be lost. The native
 * control tinted to the theme is the better trade.
 */
.cloudcanvas-lib-slider-control {
  width: 100%;
  margin: 0;
  accent-color: var(--cc-accent, #38bdf8);
  cursor: pointer;
}

.cloudcanvas-lib-slider-row {
  display: flex;
  align-items: center;
  gap: var(--cc-space-2, 8px);
}

.cloudcanvas-lib-slider-value,
.cloudcanvas-lib-progress-value {
  flex: none;
  color: var(--cc-text, #e2e8f0);
  font-size: var(--cc-type-xs, 11px);
  font-variant-numeric: tabular-nums;
  line-height: 1.35;
}
`;

// display/styles-css.js
var LIB_DISPLAY_CSS = `

/* ------------------ SLOTTED CUSTOM TYPES ------------------ */

/*
 * A slotted custom type (cloudcanvas-site \`slotted-type.js\`) stacks its named regions -
 * a header over a body - and the separation is the whole point of the shape, so
 * it is drawn here rather than left to the content flow: a border between
 * adjacent regions, and the first (header) region carried in the body text
 * colour and a heavier weight so it reads as the title of the ones below it.
 */
.cloudcanvas-card-slots {
  display: flex;
  flex-direction: column;
}

.cloudcanvas-card-slot {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--cc-space-2, 8px) 0;
}

.cloudcanvas-card-slot + .cloudcanvas-card-slot {
  border-top: 1px solid var(--cc-border, #334155);
}

.cloudcanvas-card-slot-field {
  color: var(--cc-text-muted, #94a3b8);
  font-size: var(--cc-type-sm, 12px);
  line-height: 1.4;
}

.cloudcanvas-card-slot:first-child .cloudcanvas-card-slot-field {
  color: var(--cc-text, #e2e8f0);
  font-weight: var(--cc-weight-semibold, 600);
}

/* ------------------ TEXT ------------------ */

.cloudcanvas-lib-text {
  margin: 0;
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-md, 13px);
  line-height: 1.45;
}

.cloudcanvas-lib-text-xs {
  font-size: var(--cc-type-xs, 11px);
}

.cloudcanvas-lib-text-sm {
  font-size: var(--cc-type-sm, 12px);
}

.cloudcanvas-lib-text-md {
  font-size: var(--cc-type-md, 13px);
}

.cloudcanvas-lib-text-lg {
  font-size: var(--cc-type-lg, 15px);
}

.cloudcanvas-lib-text-medium {
  font-weight: var(--cc-weight-medium, 500);
}

.cloudcanvas-lib-text-semibold {
  font-weight: var(--cc-weight-semibold, 600);
}

.cloudcanvas-lib-text-muted {
  color: var(--cc-text-muted, #94a3b8);
}

/* ------------------ BADGE ------------------ */

.cloudcanvas-lib-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--cc-space-1, 4px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  border: 1px solid var(--cc-badge-border, rgba(56, 189, 248, 0.3));
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-badge-bg, rgba(56, 189, 248, 0.15));
  color: var(--cc-badge-text, #38bdf8);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  white-space: nowrap;
}

/*
 * No per-tone badge modifier class: a tone's contrast depends on what it sits
 * on, so badge.js computes --cc-badge-bg/-border/-text per instance (see
 * toneSurface(), composited over the assumed card surface) and writes them as
 * inline custom properties instead. A class here would print the raw tone hue
 * as text - unreadable at low alpha - which is the exact defect an earlier
 * pass shipped and a ship-readiness review caught.
 */

.cloudcanvas-lib-badge-dismiss,
.cloudcanvas-lib-alert-dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 0;
  border-radius: var(--cc-radius-pill, 9999px);
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: var(--cc-type-xs, 11px);
  line-height: 1;
  cursor: pointer;
}

.cloudcanvas-lib-badge-dismiss:hover,
.cloudcanvas-lib-alert-dismiss:hover {
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
}

/* ------------------ AVATAR ------------------ */

.cloudcanvas-lib-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  overflow: hidden;
  width: 32px;
  height: 32px;
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  text-transform: uppercase;
  user-select: none;
}

.cloudcanvas-lib-avatar-sm {
  width: 24px;
  height: 24px;
  font-size: var(--cc-type-xs, 11px);
}

.cloudcanvas-lib-avatar-lg {
  width: 48px;
  height: 48px;
  font-size: var(--cc-type-lg, 15px);
}

.cloudcanvas-lib-avatar-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cloudcanvas-lib-avatar-initials {
  letter-spacing: 0.02em;
}

/* ------------------ DIVIDER ------------------ */

.cloudcanvas-lib-divider {
  width: 100%;
  height: 0;
  margin: var(--cc-space-2, 8px) 0;
  border: 0;
  border-top: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
}

.cloudcanvas-lib-divider-vertical {
  align-self: stretch;
  width: 0;
  height: auto;
  margin: 0 var(--cc-space-2, 8px);
  border-top: 0;
  border-left: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
}

/* ------------------ PROGRESS ------------------ */

/*
 * A native \`<progress>\` paints through engine pseudo-elements, so the same two
 * colours have to be stated three times: the WebKit bar and value, and Gecko's
 * single value element. \`background\` on the element itself is the Gecko track.
 */
.cloudcanvas-lib-progress {
  appearance: none;
  -webkit-appearance: none;
  display: block;
  overflow: hidden;
  width: 100%;
  height: 6px;
  border: 0;
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-track-bg, rgba(255, 255, 255, 0.16));
  color: var(--cc-accent, #38bdf8);
}

.cloudcanvas-lib-progress::-webkit-progress-bar {
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-track-bg, rgba(255, 255, 255, 0.16));
}

.cloudcanvas-lib-progress::-webkit-progress-value {
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-accent, #38bdf8);
  transition: width 0.2s ease;
}

.cloudcanvas-lib-progress::-moz-progress-bar {
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-accent, #38bdf8);
}

.cloudcanvas-lib-progress-success::-webkit-progress-value {
  background: var(--cc-tone-success, #22c55e);
}
.cloudcanvas-lib-progress-success::-moz-progress-bar {
  background: var(--cc-tone-success, #22c55e);
}

.cloudcanvas-lib-progress-warning::-webkit-progress-value {
  background: var(--cc-tone-warning, #eab308);
}
.cloudcanvas-lib-progress-warning::-moz-progress-bar {
  background: var(--cc-tone-warning, #eab308);
}

.cloudcanvas-lib-progress-danger::-webkit-progress-value {
  background: var(--cc-tone-danger, #f87171);
}
.cloudcanvas-lib-progress-danger::-moz-progress-bar {
  background: var(--cc-tone-danger, #f87171);
}

/* Column, not row: the caption sits above the bar, full width, per contract. */
.cloudcanvas-lib-progress-row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--cc-space-1, 4px);
}

.cloudcanvas-lib-progress-label {
  color: var(--cc-text-muted, #94a3b8);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-sm, 12px);
  line-height: 1.35;
}

/* ------------------ SPINNER ------------------ */

.cloudcanvas-lib-spinner {
  display: inline-block;
  flex: none;
  width: 16px;
  height: 16px;
  border: 2px solid var(--cc-track-bg, rgba(255, 255, 255, 0.16));
  border-top-color: var(--cc-accent, #38bdf8);
  border-radius: var(--cc-radius-pill, 9999px);
  animation: cloudcanvas-lib-spin 0.8s linear infinite;
}

.cloudcanvas-lib-spinner-sm {
  width: 12px;
  height: 12px;
}

.cloudcanvas-lib-spinner-lg {
  width: 24px;
  height: 24px;
  border-width: 3px;
}

@keyframes cloudcanvas-lib-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ------------------ ALERT ------------------ */

.cloudcanvas-lib-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--cc-space-2, 8px);
  width: 100%;
  padding: var(--cc-space-2, 8px) var(--cc-space-3, 12px);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-left: 3px solid var(--cc-tone-info, #38bdf8);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-md, 13px);
  line-height: 1.45;
}

.cloudcanvas-lib-alert-info {
  border-left-color: var(--cc-tone-info, #38bdf8);
}

.cloudcanvas-lib-alert-success {
  border-left-color: var(--cc-tone-success, #22c55e);
}

.cloudcanvas-lib-alert-warning {
  border-left-color: var(--cc-tone-warning, #eab308);
}

.cloudcanvas-lib-alert-danger {
  border-left-color: var(--cc-tone-danger, #f87171);
}

.cloudcanvas-lib-alert-content {
  flex: 1;
  min-width: 0;
}

.cloudcanvas-lib-alert-title {
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1.35;
}

.cloudcanvas-lib-alert-body {
  color: var(--cc-text-muted, #94a3b8);
}

/* ------------------ LIST ------------------ */

.cloudcanvas-lib-list {
  display: flex;
  flex-direction: column;
  gap: var(--cc-space-1, 4px);
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cloudcanvas-lib-list-item {
  display: flex;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  border: 1px solid transparent;
  border-radius: var(--cc-radius-sm, 6px);
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-md, 13px);
  line-height: 1.35;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.cloudcanvas-lib-list-item:hover {
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
}

.cloudcanvas-lib-list-item-selected {
  border-color: var(--cc-accent, #38bdf8);
  background: var(--cc-badge-bg, rgba(56, 189, 248, 0.15));
}

.cloudcanvas-lib-list-item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ------------------ ENVIRONMENT ------------------ */

/* A coarse pointer gets the full 44px target without moving the desktop look,
   which is the rule the core sheet already states for its own action button. */
@media (pointer: coarse) {
  .cloudcanvas-lib-button,
  .cloudcanvas-lib-input-control,
  .cloudcanvas-lib-select-control,
  .cloudcanvas-lib-checkbox,
  .cloudcanvas-lib-radio,
  .cloudcanvas-lib-toggle,
  .cloudcanvas-lib-list-item {
    min-height: var(--cc-control-min-coarse, 44px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cloudcanvas-lib-button,
  .cloudcanvas-lib-input-control,
  .cloudcanvas-lib-select-control,
  .cloudcanvas-lib-toggle-control,
  .cloudcanvas-lib-toggle-control::after,
  .cloudcanvas-lib-list-item {
    transition: none;
  }

  .cloudcanvas-lib-progress::-webkit-progress-value {
    transition: none !important;
  }

  /* Slowed rather than stopped: the spinner's whole job is to say "still
     working", and a frozen ring says the opposite. One turn every six seconds
     carries no motion signal worth triggering on. */
  .cloudcanvas-lib-spinner {
    animation-duration: 6s;
  }
}
`;

// styles.js
var LIB_DEFAULT_CSS = `${LIB_CONTROLS_CSS}${LIB_DISPLAY_CSS}`;
var LIB_STYLE_ID = "cloudcanvas-lib-styles";
var LIB_TOKENS = /* @__PURE__ */ Object.freeze({
  "--cc-tone-info": "#38bdf8",
  "--cc-tone-success": "#22c55e",
  "--cc-tone-warning": "#eab308",
  "--cc-tone-danger": "#f87171",
  "--cc-input-bg": "rgba(255, 255, 255, 0.06)",
  "--cc-input-border": "rgba(255, 255, 255, 0.16)",
  "--cc-input-border-focus": "var(--cc-accent, #38bdf8)",
  "--cc-track-bg": "rgba(255, 255, 255, 0.16)",
  "--cc-thumb-bg": "#e2e8f0",
  "--cc-border": "#334155"
});
var LIB_LIGHT_THEME = /* @__PURE__ */ Object.freeze({
  "--cc-tone-info": "#0284c7",
  "--cc-tone-success": "#16a34a",
  "--cc-tone-warning": "#ca8a04",
  "--cc-tone-danger": "#dc2626",
  "--cc-input-bg": "rgba(15, 23, 42, 0.04)",
  "--cc-input-border": "rgba(15, 23, 42, 0.16)",
  "--cc-input-border-focus": "var(--cc-accent)",
  "--cc-track-bg": "rgba(15, 23, 42, 0.16)",
  "--cc-thumb-bg": "#ffffff"
});
function injectLibStyles(customCSS = "") {
  if (typeof document === "undefined") return null;
  let styleEl = document.getElementById(LIB_STYLE_ID);
  if (styleEl) return styleEl;
  styleEl = document.createElement("style");
  styleEl.id = LIB_STYLE_ID;
  styleEl.textContent = typeof customCSS === "string" && customCSS.trim() !== "" ? `${LIB_DEFAULT_CSS}
${customCSS}` : LIB_DEFAULT_CSS;
  document.head.appendChild(styleEl);
  return styleEl;
}

// forms/button.js
var NAME = "button";
var ROOT_CLASS = "cloudcanvas-lib-button";
var VARIANTS = /* @__PURE__ */ new Set(["primary", "secondary", "ghost", "danger"]);
var DEFAULT_VARIANT = "secondary";
function bind(host) {
  const root = host.querySelector(`.${ROOT_CLASS}`);
  return { root, label: leadingText(root) };
}
function render(bindings, contents, cache) {
  setText(bindings.label, contents.get("label"));
  applyVariant(bindings.root, contents.get("variant"), cache);
  const disabled = contents.get("disabled") === true;
  if (bindings.root.disabled !== disabled) bindings.root.disabled = disabled;
}
function applyVariant(root, requested, cache) {
  const variant = VARIANTS.has(requested) ? requested : DEFAULT_VARIANT;
  if (cache.variant === variant) return;
  if (cache.variant) root.classList.remove(`${ROOT_CLASS}-${cache.variant}`);
  cache.variant = variant;
  root.classList.add(`${ROOT_CLASS}-${variant}`);
}
var SPEC = Object.freeze({
  name: NAME,
  html: `<button class="${ROOT_CLASS}" type="button"></button>`,
  keys: ["label", "variant", "disabled"],
  bind,
  render
});
function registerButton() {
  injectLibStyles();
  return widget(SPEC);
}
function createButton(parent, options = {}) {
  registerButton();
  return parent.blit(widgetSpec(NAME, { chrome: false, ...options }));
}

// forms/input.js
import { blit as blit2 } from "cloudcanvas";

// coerce.js
function asText(value) {
  return value === void 0 || value === null ? "" : String(value);
}
function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// forms/control.js
var FALLBACK_IDS = /* @__PURE__ */ new WeakMap();
var fallbackCount = 0;
function hostId(host) {
  if (host.id) return host.id;
  if (!FALLBACK_IDS.has(host)) {
    fallbackCount += 1;
    FALLBACK_IDS.set(host, `cc-control-${fallbackCount}`);
  }
  return FALLBACK_IDS.get(host);
}
function nameControl(host, control, suffix = "control") {
  const id = `${hostId(host)}-${suffix}`;
  if (control.id !== id) control.id = id;
  return id;
}
function linkLabel(host, control, label, suffix = "control") {
  const id = nameControl(host, control, suffix);
  if (label.getAttribute("for") !== id) label.setAttribute("for", id);
}
function renderLabel(label, text, value) {
  setText(text, value);
  setVisible(label, Boolean(value));
}
function setFlag(control, name, value) {
  const flag = value === true;
  if (control[name] !== flag) control[name] = flag;
}
function stopAtControl(event) {
  event.stopPropagation();
}
function commitOn(on, b, control, type2, key, read) {
  on(control, type2, (event) => {
    stopAtControl(event);
    const value = read(control);
    setContent(b, key, value);
    b.emit(type2, value);
  });
}

// forms/input.js
var NAME2 = "input";
var ROOT_CLASS2 = "cloudcanvas-lib-input";
var LABEL_CLASS = "cloudcanvas-lib-input-label";
var CONTROL_CLASS = "cloudcanvas-lib-input-control";
var TYPES = /* @__PURE__ */ new Set(["text", "email", "password", "number"]);
var DEFAULT_TYPE = "text";
function commit(b, control) {
  setContent(b, "value", control.value);
  end(b);
  b.emit("change", control.value);
}
function wire(b, on, control) {
  on(control, "focus", () => begin(b, control));
  on(control, "input", (event) => {
    stopAtControl(event);
    b.emit("input", control.value);
  });
  on(control, "change", stopAtControl);
  on(control, "blur", () => commit(b, control));
}
function bind2(host, on) {
  const b = blit2(host);
  const root = host.querySelector(`.${ROOT_CLASS2}`);
  const label = root.querySelector(`.${LABEL_CLASS}`);
  const single = root.querySelector("input");
  const multi = root.querySelector("textarea");
  nameControl(host, single, "control");
  nameControl(host, multi, "control-multiline");
  wire(b, on, single);
  wire(b, on, multi);
  return { root, label, labelText: leadingText(label), single, multi };
}
function applyState(control, contents, cache, key) {
  setAttr(control, "placeholder", asText(contents.get("placeholder")), cache, `${key}:placeholder`);
  setFlag(control, "disabled", contents.get("disabled"));
  setFlag(control, "required", contents.get("required"));
}
function render2(bindings, contents, cache) {
  const multiline = contents.get("multiline") === true;
  const control = multiline ? bindings.multi : bindings.single;
  setVisible(bindings.single, !multiline);
  setVisible(bindings.multi, multiline);
  setAttr(bindings.label, "for", control.id, cache, "for");
  renderLabel(bindings.label, bindings.labelText, contents.get("label"));
  const type2 = contents.get("type");
  setAttr(bindings.single, "type", TYPES.has(type2) ? type2 : DEFAULT_TYPE, cache, "type");
  applyState(bindings.single, contents, cache, "single");
  applyState(bindings.multi, contents, cache, "multi");
  const value = asText(contents.get("value"));
  if (control.value !== value) control.value = value;
}
var SPEC2 = Object.freeze({
  name: NAME2,
  html: `<div class="${ROOT_CLASS2}"><label class="${LABEL_CLASS}"></label><input class="${CONTROL_CLASS}"><textarea class="${CONTROL_CLASS}" hidden></textarea></div>`,
  keys: ["label", "value", "placeholder", "type", "multiline", "disabled", "required"],
  bind: bind2,
  render: render2
});
function registerInput() {
  injectLibStyles();
  return widget(SPEC2);
}
function createInput(parent, options = {}) {
  registerInput();
  return parent.blit(widgetSpec(NAME2, { chrome: false, ...options }));
}

// forms/checkbox.js
import { blit as blit3 } from "cloudcanvas";
var NAME3 = "checkbox";
var ROOT_CLASS3 = "cloudcanvas-lib-checkbox";
var CONTROL_CLASS2 = "cloudcanvas-lib-checkbox-control";
var LABEL_CLASS2 = "cloudcanvas-lib-checkbox-label";
function bind3(host, on) {
  const root = host.querySelector(`.${ROOT_CLASS3}`);
  const control = root.querySelector(`.${CONTROL_CLASS2}`);
  const label = root.querySelector(`.${LABEL_CLASS2}`);
  linkLabel(host, control, label);
  commitOn(on, blit3(host), control, "change", "checked", (element) => element.checked);
  return { root, control, label, labelText: leadingText(label) };
}
function render3(bindings, contents) {
  renderLabel(bindings.label, bindings.labelText, contents.get("label"));
  setFlag(bindings.control, "checked", contents.get("checked"));
  setFlag(bindings.control, "disabled", contents.get("disabled"));
}
var SPEC3 = Object.freeze({
  name: NAME3,
  html: `<div class="${ROOT_CLASS3}"><input class="${CONTROL_CLASS2}" type="checkbox"><label class="${LABEL_CLASS2}"></label></div>`,
  keys: ["label", "checked", "disabled"],
  bind: bind3,
  render: render3
});
function registerCheckbox() {
  injectLibStyles();
  return widget(SPEC3);
}
function createCheckbox(parent, options = {}) {
  registerCheckbox();
  return parent.blit(widgetSpec(NAME3, { chrome: false, ...options }));
}

// forms/radio.js
import { blit as blit4 } from "cloudcanvas";
var NAME4 = "radio";
var GROUP_NAME = "radio-group";
var ROOT_CLASS4 = "cloudcanvas-lib-radio";
var CONTROL_CLASS3 = "cloudcanvas-lib-radio-control";
var LABEL_CLASS3 = "cloudcanvas-lib-radio-label";
var GROUP_CLASS = "cloudcanvas-lib-radio-group";
var GROUP_LABEL_CLASS = "cloudcanvas-lib-radio-group-label";
function deselectSiblings(b, group) {
  if (!b.parent || !group) return;
  for (const sibling of b.parent.blits) {
    if (sibling === b) continue;
    const contents = contentOf(sibling);
    if (contents.group === group && contents.checked === true) setContent(sibling, "checked", false);
  }
}
function onChange(b, control, event) {
  stopAtControl(event);
  if (!control.checked) return;
  setContent(b, "checked", true);
  const { group, value } = contentOf(b);
  deselectSiblings(b, group);
  b.emit("change", { value });
}
function bind4(host, on) {
  const b = blit4(host);
  const root = host.querySelector(`.${ROOT_CLASS4}`);
  const control = root.querySelector(`.${CONTROL_CLASS3}`);
  const label = root.querySelector(`.${LABEL_CLASS3}`);
  linkLabel(host, control, label);
  on(control, "change", (event) => onChange(b, control, event));
  return { root, control, label, labelText: leadingText(label) };
}
function render4(bindings, contents, cache) {
  const { control } = bindings;
  renderLabel(bindings.label, bindings.labelText, contents.get("label"));
  setAttr(control, "name", asText(contents.get("group")), cache, "name");
  setAttr(control, "value", asText(contents.get("value")), cache, "value");
  const checked = contents.get("checked") === true;
  if (cache.checked !== checked) {
    cache.checked = checked;
    control.checked = checked;
  }
  setFlag(control, "disabled", contents.get("disabled"));
}
function bindGroup(host) {
  const label = host.querySelector(`.${GROUP_LABEL_CLASS}`);
  return { label, labelText: leadingText(label) };
}
function renderGroup(bindings, contents) {
  renderLabel(bindings.label, bindings.labelText, contents.get("label"));
}
var SPEC4 = Object.freeze({
  name: NAME4,
  html: `<div class="${ROOT_CLASS4}"><input class="${CONTROL_CLASS3}" type="radio"><label class="${LABEL_CLASS3}"></label></div>`,
  keys: ["label", "group", "value", "checked", "disabled"],
  bind: bind4,
  render: render4
});
var GROUP_SPEC = Object.freeze({
  name: GROUP_NAME,
  html: `<div class="${GROUP_CLASS}" data-scope><span class="${GROUP_LABEL_CLASS}"></span></div>`,
  keys: ["label"],
  bind: bindGroup,
  render: renderGroup
});
function registerRadio() {
  injectLibStyles();
  return widget(SPEC4);
}
function registerRadioGroup() {
  injectLibStyles();
  return widget(GROUP_SPEC);
}
function createRadio(parent, options = {}) {
  registerRadio();
  return parent.blit(widgetSpec(NAME4, { chrome: false, ...options }));
}
function createRadioGroup(parent, config = {}) {
  const { group, options: choices = [], value, ...spec } = config;
  registerRadioGroup();
  const groupBlit = parent.blit(widgetSpec(GROUP_NAME, { chrome: false, ...spec }));
  const name = group || `${hostId(groupBlit.el)}-group`;
  for (const choice of choices) {
    createRadio(groupBlit, { label: choice.label, group: name, value: choice.value, checked: choice.value === value });
  }
  return groupBlit;
}

// forms/toggle.js
import { blit as blit5 } from "cloudcanvas";
var NAME5 = "toggle";
var ROOT_CLASS5 = "cloudcanvas-lib-toggle";
var CONTROL_CLASS4 = "cloudcanvas-lib-toggle-control";
var LABEL_CLASS4 = "cloudcanvas-lib-toggle-label";
function bind5(host, on) {
  const root = host.querySelector(`.${ROOT_CLASS5}`);
  const control = root.querySelector(`.${CONTROL_CLASS4}`);
  const label = root.querySelector(`.${LABEL_CLASS4}`);
  linkLabel(host, control, label);
  commitOn(on, blit5(host), control, "change", "checked", (element) => element.checked);
  return { root, control, label, labelText: leadingText(label) };
}
function render5(bindings, contents) {
  const { control } = bindings;
  renderLabel(bindings.label, bindings.labelText, contents.get("label"));
  const checked = contents.get("checked") === true;
  setFlag(control, "checked", checked);
  if (control.getAttribute("aria-checked") !== String(checked)) control.setAttribute("aria-checked", String(checked));
  setFlag(control, "disabled", contents.get("disabled"));
}
var SPEC5 = Object.freeze({
  name: NAME5,
  html: `<div class="${ROOT_CLASS5}"><input class="${CONTROL_CLASS4}" type="checkbox" role="switch"><label class="${LABEL_CLASS4}"></label></div>`,
  keys: ["label", "checked", "disabled"],
  bind: bind5,
  render: render5
});
function registerToggle() {
  injectLibStyles();
  return widget(SPEC5);
}
function createToggle(parent, options = {}) {
  registerToggle();
  return parent.blit(widgetSpec(NAME5, { chrome: false, ...options }));
}

// forms/slider.js
import { blit as blit6 } from "cloudcanvas";
var NAME6 = "slider";
var ROOT_CLASS6 = "cloudcanvas-lib-slider";
var LABEL_CLASS5 = "cloudcanvas-lib-slider-label";
var ROW_CLASS = "cloudcanvas-lib-slider-row";
var CONTROL_CLASS5 = "cloudcanvas-lib-slider-control";
var VALUE_CLASS = "cloudcanvas-lib-slider-value";
var DEFAULT_MIN = 0;
var DEFAULT_MAX = 100;
var DEFAULT_STEP = 1;
function bind6(host, on) {
  const b = blit6(host);
  const root = host.querySelector(`.${ROOT_CLASS6}`);
  const label = root.querySelector(`.${LABEL_CLASS5}`);
  const control = root.querySelector(`.${CONTROL_CLASS5}`);
  const readout = root.querySelector(`.${VALUE_CLASS}`);
  const readoutText = leadingText(readout);
  linkLabel(host, control, label);
  on(control, "input", (event) => {
    stopAtControl(event);
    setText(readoutText, control.value);
    b.emit("input", Number(control.value));
  });
  commitOn(on, b, control, "change", "value", (element) => Number(element.value));
  return { root, label, labelText: leadingText(label), control, readout, readoutText };
}
function render6(bindings, contents, cache) {
  const { control } = bindings;
  renderLabel(bindings.label, bindings.labelText, contents.get("label"));
  const min = toNumber(contents.get("min"), DEFAULT_MIN);
  const declaredMax = toNumber(contents.get("max"), DEFAULT_MAX);
  const max = declaredMax > min ? declaredMax : DEFAULT_MAX;
  const step = toNumber(contents.get("step"), DEFAULT_STEP);
  setAttr(control, "min", String(min), cache, "min");
  setAttr(control, "max", String(max), cache, "max");
  setAttr(control, "step", String(step > 0 ? step : DEFAULT_STEP), cache, "step");
  const text = String(Math.min(Math.max(toNumber(contents.get("value"), min), min), max));
  if (control.value !== text) control.value = text;
  setText(bindings.readoutText, text);
  setFlag(control, "disabled", contents.get("disabled"));
}
var SPEC6 = Object.freeze({
  name: NAME6,
  html: `<div class="${ROOT_CLASS6}"><label class="${LABEL_CLASS5}"></label><div class="${ROW_CLASS}"><input class="${CONTROL_CLASS5}" type="range"><span class="${VALUE_CLASS}"></span></div></div>`,
  keys: ["label", "value", "min", "max", "step", "disabled"],
  bind: bind6,
  render: render6
});
function registerSlider() {
  injectLibStyles();
  return widget(SPEC6);
}
function createSlider(parent, options = {}) {
  registerSlider();
  return parent.blit(widgetSpec(NAME6, { chrome: false, ...options }));
}

// forms/select.js
import { blit as blit7 } from "cloudcanvas";

// plugins/keyed-list.js
var KEY_ATTR = "data-cc-key";
function defaultKey(item, index) {
  if (item && typeof item === "object") {
    if (item.id !== void 0 && item.id !== null) return item.id;
    if (item.key !== void 0 && item.key !== null) return item.key;
  }
  return index;
}
function firstKeyed(container) {
  let node = container.firstElementChild;
  while (node && !node.hasAttribute(KEY_ATTR)) node = node.nextElementSibling;
  return node;
}
function nextKeyed(node) {
  let next = node ? node.nextElementSibling : null;
  while (next && !next.hasAttribute(KEY_ATTR)) next = next.nextElementSibling;
  return next;
}
function indexByKey(container) {
  const existing = /* @__PURE__ */ new Map();
  for (let node = firstKeyed(container); node; node = nextKeyed(node)) {
    const key = node.getAttribute(KEY_ATTR);
    if (!existing.has(key)) existing.set(key, node);
  }
  return existing;
}
function reconcileKeyedList(container, items, options = {}) {
  if (!container || typeof container.insertBefore !== "function") return [];
  if (typeof options.create !== "function") {
    throw new TypeError("reconcileKeyedList: options.create must be a function");
  }
  const keyOf = typeof options.key === "function" ? options.key : defaultKey;
  const update = typeof options.update === "function" ? options.update : null;
  const existing = indexByKey(container);
  const nodes = [];
  let cursor = firstKeyed(container);
  let index = 0;
  for (const item of items || []) {
    const key = String(keyOf(item, index));
    const node = existing.get(key) || createKeyed(options.create, item, index, key);
    existing.delete(key);
    if (update) update(node, item, index);
    if (node === cursor) cursor = nextKeyed(cursor);
    else container.insertBefore(node, cursor);
    nodes.push(node);
    index += 1;
  }
  for (const leftover of existing.values()) leftover.remove();
  return nodes;
}
function createKeyed(create, item, index, key) {
  const node = create(item, index);
  if (!node || typeof node.setAttribute !== "function") {
    throw new TypeError(`reconcileKeyedList: create() returned no element for key "${key}"`);
  }
  node.setAttribute(KEY_ATTR, key);
  return node;
}

// forms/select.js
var NAME7 = "dropdown";
var ROOT_CLASS7 = "cloudcanvas-lib-select";
var LABEL_CLASS6 = "cloudcanvas-lib-select-label";
var CONTROL_CLASS6 = "cloudcanvas-lib-select-control";
function optionKey(option) {
  return asText(option && option.value);
}
function createOption(option) {
  const element = document.createElement("option");
  element.value = optionKey(option);
  leadingText(element);
  return element;
}
function bind7(host, on) {
  const root = host.querySelector(`.${ROOT_CLASS7}`);
  const label = root.querySelector(`.${LABEL_CLASS6}`);
  const control = root.querySelector(`.${CONTROL_CLASS6}`);
  linkLabel(host, control, label);
  commitOn(on, blit7(host), control, "change", "value", (element) => element.value);
  return { root, label, labelText: leadingText(label), control };
}
function render7(bindings, contents) {
  const { control } = bindings;
  renderLabel(bindings.label, bindings.labelText, contents.get("label"));
  const options = contents.get("options");
  reconcileKeyedList(control, Array.isArray(options) ? options : [], {
    key: optionKey,
    create: createOption,
    update: (element, option) => setText(leadingText(element), option && option.label)
  });
  if (contents.has("value")) {
    const value = asText(contents.get("value"));
    if (control.value !== value) control.value = value;
  }
  setFlag(control, "disabled", contents.get("disabled"));
}
var SPEC7 = Object.freeze({
  name: NAME7,
  html: `<div class="${ROOT_CLASS7}"><label class="${LABEL_CLASS6}"></label><select class="${CONTROL_CLASS6}"></select></div>`,
  keys: ["label", "value", "options", "disabled"],
  bind: bind7,
  render: render7
});
function registerSelect() {
  injectLibStyles();
  return widget(SPEC7);
}
function createSelect(parent, options = {}) {
  registerSelect();
  return parent.blit(widgetSpec(NAME7, { chrome: false, ...options }));
}

// forms/index.js
function registerForms() {
  return [
    registerButton(),
    registerInput(),
    registerCheckbox(),
    registerRadio(),
    registerRadioGroup(),
    registerToggle(),
    registerSlider(),
    registerSelect()
  ].map((defined) => defined.el.getAttribute("data-type"));
}

// display/alert.js
import { BADGE_TEXT_OVERRIDE_TOKEN as BADGE_TEXT_OVERRIDE_TOKEN2 } from "cloudcanvas/primitives";

// display/badge.js
import {
  BADGE_SURFACE,
  BADGE_TEXT_OVERRIDE_TOKEN,
  compositeOver,
  contrastTextFor
} from "cloudcanvas/primitives";

// display/widget.js
function defineWidget(spec) {
  const { name, html, allowedKeys, bind: bind16, render: render16 } = spec;
  const definition = Object.freeze({ name, html, keys: allowedKeys, bind: bind16, render: render16 });
  function define() {
    injectLibStyles();
    return widget(definition);
  }
  function create(parent, options = {}) {
    define();
    return parent.blit(widgetSpec(name, { chrome: false, ...options }));
  }
  return Object.freeze({ name, define, create });
}
function elementAs(current, tag) {
  if (current.localName === tag) return current;
  const next = document.createElement(tag);
  next.className = current.className;
  current.replaceWith(next);
  return next;
}

// display/badge.js
var NAME8 = "badge";
var ROOT_CLASS8 = "cloudcanvas-lib-badge";
var DISMISS_CLASS = "cloudcanvas-lib-badge-dismiss";
var TONE_HUES = /* @__PURE__ */ Object.freeze({
  info: "#38bdf8",
  success: "#4ade80",
  warning: "#fbbf24",
  danger: "#f87171"
});
var TONE_BG_ALPHA = 64;
var TONE_BORDER_ALPHA = 115;
function alphaSuffix(byte) {
  return byte.toString(16).padStart(2, "0");
}
var NEUTRAL = "neutral";
function toneSurface(tone) {
  const hue = TONE_HUES[tone];
  if (!hue) return null;
  const darkFill = compositeOver(hue, TONE_BG_ALPHA / 255, BADGE_SURFACE);
  return {
    background: `${hue}${alphaSuffix(TONE_BG_ALPHA)}`,
    border: `${hue}${alphaSuffix(TONE_BORDER_ALPHA)}`,
    text: contrastTextFor(darkFill)
  };
}
function toneStyle(tone) {
  const surface = toneSurface(tone);
  if (!surface) return "";
  return `--cc-badge-bg:${surface.background};--cc-badge-border:${surface.border};--cc-badge-text:var(${BADGE_TEXT_OVERRIDE_TOKEN}, ${surface.text});`;
}
function bind8(host, on, dismiss2) {
  const root = host.querySelector(`.${ROOT_CLASS8}`);
  const button = root.querySelector(`.${DISMISS_CLASS}`);
  on(button, "click", dismiss2);
  return { root, label: leadingText(root), dismiss: button };
}
function render8(bindings, contents, cache) {
  const tone = TONE_HUES[contents.get("tone")] ? contents.get("tone") : NEUTRAL;
  setText(bindings.label, contents.get("text"));
  setAttr(bindings.root, "data-tone", tone, cache, "tone");
  setAttr(bindings.root, "style", toneStyle(tone), cache, "toneStyle");
  setVisible(bindings.dismiss, contents.get("dismissible") === true);
}
var widget2 = /* @__PURE__ */ defineWidget({
  name: NAME8,
  // A real `<button>`: `CONTROL_SELECTOR` already exempts it from the drag gesture.
  html: `<span class="${ROOT_CLASS8}"><button class="${DISMISS_CLASS}" type="button" aria-label="Dismiss">×</button></span>`,
  allowedKeys: ["text", "tone", "dismissible"],
  bind: bind8,
  render: render8
});
var registerBadge = widget2.define;
var createBadge = widget2.create;

// display/alert.js
var NAME9 = "alert";
var ROOT_CLASS9 = "cloudcanvas-lib-alert";
var CONTENT_CLASS = "cloudcanvas-lib-alert-content";
var TITLE_CLASS = "cloudcanvas-lib-alert-title";
var BODY_CLASS = "cloudcanvas-lib-alert-body";
var DISMISS_CLASS2 = "cloudcanvas-lib-alert-dismiss";
var TONES = ["info", "success", "warning", "danger"];
var ASSERTIVE_TONES = /* @__PURE__ */ new Set(["warning", "danger"]);
function toneOf(contents) {
  const tone = contents.get("tone");
  return TONES.includes(tone) ? tone : "info";
}
function toneStyle2(tone) {
  const surface = toneSurface(tone);
  if (!surface) return "";
  const text = `var(${BADGE_TEXT_OVERRIDE_TOKEN2}, ${surface.text})`;
  return `--cc-scope-bg:${surface.background};--cc-card-border:${surface.border};--cc-text:${text};--cc-text-muted:${text};`;
}
function bind9(host, on, dismiss2) {
  const root = host.querySelector(`.${ROOT_CLASS9}`);
  const title = root.querySelector(`.${TITLE_CLASS}`);
  const body = root.querySelector(`.${BODY_CLASS}`);
  const button = root.querySelector(`.${DISMISS_CLASS2}`);
  on(button, "click", dismiss2);
  return { root, title, titleText: leadingText(title), body, bodyText: leadingText(body), dismiss: button };
}
function render9(bindings, contents, cache) {
  const tone = toneOf(contents);
  const title = contents.get("title");
  const heading = title === void 0 || title === null ? "" : String(title);
  setAttr(bindings.root, "role", ASSERTIVE_TONES.has(tone) ? "alert" : "status", cache, "role");
  setAttr(bindings.root, "data-tone", tone, cache, "tone");
  setAttr(bindings.root, "style", toneStyle2(tone), cache, "toneStyle");
  for (const variant of TONES) {
    bindings.root.classList.toggle(`${ROOT_CLASS9}-${variant}`, variant === tone);
  }
  setText(bindings.titleText, heading);
  setVisible(bindings.title, heading !== "");
  setText(bindings.bodyText, contents.get("message"));
  setVisible(bindings.dismiss, contents.get("dismissible") !== false);
}
var widget3 = /* @__PURE__ */ defineWidget({
  name: NAME9,
  html: `<div class="${ROOT_CLASS9}"><div class="${CONTENT_CLASS}"><strong class="${TITLE_CLASS}"></strong><p class="${BODY_CLASS}"></p></div><button class="${DISMISS_CLASS2}" type="button" aria-label="Dismiss">×</button></div>`,
  allowedKeys: ["title", "message", "tone", "dismissible"],
  bind: bind9,
  render: render9
});
var registerAlert = widget3.define;
var createAlert = widget3.create;

// display/avatar.js
import { safeUrl } from "cloudcanvas/primitives";
var NAME10 = "avatar";
var ROOT_CLASS10 = "cloudcanvas-lib-avatar";
var IMAGE_CLASS = "cloudcanvas-lib-avatar-image";
var INITIALS_CLASS = "cloudcanvas-lib-avatar-initials";
var SIZES = ["sm", "lg"];
function initialsOf(name) {
  return name.trim().split(/\s+/).filter((word) => word.length > 0).slice(0, 2).map((word) => word[0].toUpperCase()).join("");
}
function bind10(host) {
  const root = host.querySelector(`.${ROOT_CLASS10}`);
  const initials = root.querySelector(`.${INITIALS_CLASS}`);
  return { root, image: root.querySelector(`.${IMAGE_CLASS}`), initials, initialsText: leadingText(initials) };
}
function render10(bindings, contents, cache) {
  const name = contents.get("name");
  const label = name === void 0 || name === null ? "" : String(name);
  const url = safeUrl(contents.get("src"), "");
  const showImage = url !== "";
  const size = contents.get("size");
  for (const variant of SIZES) {
    bindings.root.classList.toggle(`${ROOT_CLASS10}-${variant}`, variant === size);
  }
  if (showImage) {
    setAttr(bindings.image, "src", url, cache, "src");
    setAttr(bindings.image, "alt", label, cache, "alt");
  }
  setVisible(bindings.image, showImage);
  setText(bindings.initialsText, initialsOf(label));
  setAttr(bindings.initials, "aria-label", label, cache, "initialsLabel");
  setVisible(bindings.initials, !showImage);
}
var widget4 = /* @__PURE__ */ defineWidget({
  name: NAME10,
  html: `<div class="${ROOT_CLASS10}"><img class="${IMAGE_CLASS}"><span class="${INITIALS_CLASS}" role="img"></span></div>`,
  allowedKeys: ["name", "src", "size"],
  bind: bind10,
  render: render10
});
var registerAvatar = widget4.define;
var createAvatar = widget4.create;

// display/divider.js
var ROOT_CLASS11 = "cloudcanvas-lib-divider";
var VERTICAL = "vertical";
var HORIZONTAL = "horizontal";
function bind11(host) {
  return { root: host.querySelector(`.${ROOT_CLASS11}`) };
}
function render11(bindings, contents) {
  const vertical = contents.get("orientation") === VERTICAL;
  const root = elementAs(bindings.root, vertical ? "div" : "hr");
  if (vertical && root.getAttribute("role") !== "separator") root.setAttribute("role", "separator");
  root.classList.toggle(`${ROOT_CLASS11}-${VERTICAL}`, vertical);
  const orientation = vertical ? VERTICAL : HORIZONTAL;
  if (root.getAttribute("aria-orientation") !== orientation) root.setAttribute("aria-orientation", orientation);
}
var widget5 = /* @__PURE__ */ defineWidget({
  name: "divider",
  html: `<hr class="${ROOT_CLASS11}">`,
  allowedKeys: ["orientation"],
  bind: bind11,
  render: render11
});
var registerDivider = widget5.define;
var createDivider = widget5.create;

// display/list.js
import { blit as blit8 } from "cloudcanvas";
var LIST_TYPE = "lib-list";
var LIST_CLS = /* @__PURE__ */ Object.freeze({
  ROOT: "cloudcanvas-lib-list",
  ITEM: "cloudcanvas-lib-list-item",
  ITEM_LABEL: "cloudcanvas-lib-list-item-label",
  ITEM_SELECTED: "cloudcanvas-lib-list-item-selected"
});
var SELECT_EVENT = "list:select";
var ACTIVATION_KEYS = /* @__PURE__ */ new Set(["Enter", " ", "Spacebar"]);
function itemKey(item, index) {
  if (item && item.id !== void 0 && item.id !== null) return item.id;
  return index;
}
function createRow() {
  const li = document.createElement("li");
  li.className = LIST_CLS.ITEM;
  li.setAttribute("tabindex", "0");
  li.setAttribute("data-cc-control", "");
  const label = document.createElement("span");
  label.className = LIST_CLS.ITEM_LABEL;
  leadingText(label);
  li.appendChild(label);
  return li;
}
function updateRow(li, item) {
  const label = li.querySelector(`.${LIST_CLS.ITEM_LABEL}`);
  if (label) setText(leadingText(label), item && item.label);
  const selected = Boolean(item && item.selected);
  if (li.classList.contains(LIST_CLS.ITEM_SELECTED) === selected) return;
  li.classList.toggle(LIST_CLS.ITEM_SELECTED, selected);
  if (selected) li.setAttribute("aria-current", "true");
  else li.removeAttribute("aria-current");
}
function activateFrom(b, root, event, fromKeyboard) {
  const row = typeof event.target?.closest === "function" ? event.target.closest(`.${LIST_CLS.ITEM}`) : null;
  if (!row || !root.contains(row)) return;
  const items = contentOf(b).items;
  const key = row.getAttribute(KEY_ATTR);
  const index = Array.isArray(items) ? items.findIndex((entry, position) => String(itemKey(entry, position)) === key) : -1;
  if (index === -1) return;
  if (fromKeyboard) {
    event.preventDefault();
    event.stopPropagation();
  }
  b.emit(SELECT_EVENT, { id: items[index].id });
}
function bind12(host, on) {
  const b = blit8(host);
  const root = host.querySelector(`.${LIST_CLS.ROOT}`);
  on(root, "click", (event) => activateFrom(b, root, event, false));
  on(root, "keydown", (event) => {
    if (ACTIVATION_KEYS.has(event.key)) activateFrom(b, root, event, true);
  });
  return { root };
}
function render12(bindings, contents) {
  const items = contents.get("items");
  reconcileKeyedList(bindings.root, Array.isArray(items) ? items : [], {
    key: itemKey,
    create: createRow,
    update: updateRow
  });
}
var widget6 = /* @__PURE__ */ defineWidget({
  name: LIST_TYPE,
  html: `<ul class="${LIST_CLS.ROOT}"></ul>`,
  allowedKeys: ["items"],
  bind: bind12,
  render: render12
});
var registerList = widget6.define;
var createList = widget6.create;

// display/progress.js
var NAME11 = "progress";
var ROW_CLASS2 = "cloudcanvas-lib-progress-row";
var LABEL_CLASS7 = "cloudcanvas-lib-progress-label";
var BAR_CLASS = "cloudcanvas-lib-progress";
var TONES2 = ["success", "warning", "danger"];
var DEFAULT_MAX2 = 100;
function bind13(host) {
  const root = host.querySelector(`.${ROW_CLASS2}`);
  const caption = root.querySelector(`.${LABEL_CLASS7}`);
  return { root, caption, captionText: leadingText(caption), bar: root.querySelector(`.${BAR_CLASS}`) };
}
function render13(bindings, contents, cache) {
  const rawMax = toNumber(contents.get("max"), DEFAULT_MAX2);
  const max = rawMax > 0 ? rawMax : DEFAULT_MAX2;
  const value = Math.min(Math.max(toNumber(contents.get("value"), 0), 0), max);
  const label = contents.get("label");
  const caption = label === void 0 || label === null ? "" : String(label);
  const tone = contents.get("tone");
  setText(bindings.captionText, caption);
  setVisible(bindings.caption, caption !== "");
  setAttr(bindings.bar, "value", String(value), cache, "value");
  setAttr(bindings.bar, "max", String(max), cache, "max");
  setAttr(bindings.bar, "aria-label", caption, cache, "ariaLabel");
  for (const variant of TONES2) {
    bindings.bar.classList.toggle(`${BAR_CLASS}-${variant}`, variant === tone);
  }
}
var widget7 = /* @__PURE__ */ defineWidget({
  name: NAME11,
  html: `<div class="${ROW_CLASS2}"><span class="${LABEL_CLASS7}"></span><progress class="${BAR_CLASS}"></progress></div>`,
  allowedKeys: ["value", "max", "label", "tone"],
  bind: bind13,
  render: render13
});
var registerProgress = widget7.define;
var createProgress = widget7.create;

// display/spinner.js
var NAME12 = "spinner";
var ROOT_CLASS12 = "cloudcanvas-lib-spinner";
var DEFAULT_LABEL = "Loading";
function bind14(host) {
  return { root: host.querySelector(`.${ROOT_CLASS12}`) };
}
function render14(bindings, contents, cache) {
  const label = contents.get("label");
  const text = label === void 0 || label === null || String(label) === "" ? DEFAULT_LABEL : String(label);
  setAttr(bindings.root, "aria-label", text, cache, "label");
}
var widget8 = /* @__PURE__ */ defineWidget({
  name: NAME12,
  html: `<div class="${ROOT_CLASS12}" role="status"></div>`,
  allowedKeys: ["label"],
  bind: bind14,
  render: render14
});
var registerSpinner = widget8.define;
var createSpinner = widget8.create;

// display/text.js
var ROOT_CLASS13 = "cloudcanvas-lib-text";
var TAGS = /* @__PURE__ */ new Set(["span", "p", "h1", "h2", "h3", "h4", "label"]);
var DEFAULT_TAG = "span";
var SIZES2 = ["xs", "sm", "md", "lg"];
var WEIGHTS = ["medium", "semibold"];
function oneOf(values, value, fallback) {
  return values.includes(value) ? value : fallback;
}
function bind15(host) {
  return { root: host.querySelector(`.${ROOT_CLASS13}`) };
}
function render15(bindings, contents) {
  const as = contents.get("as");
  const root = elementAs(bindings.root, TAGS.has(as) ? as : DEFAULT_TAG);
  setText(leadingText(root), contents.get("text"));
  const size = oneOf(SIZES2, contents.get("size"), "md");
  const weight = oneOf(WEIGHTS, contents.get("weight"), "regular");
  for (const name of SIZES2) root.classList.toggle(`${ROOT_CLASS13}-${name}`, name === size);
  for (const name of WEIGHTS) root.classList.toggle(`${ROOT_CLASS13}-${name}`, name === weight);
  root.classList.toggle(`${ROOT_CLASS13}-muted`, contents.get("tone") === "muted");
}
var widget9 = /* @__PURE__ */ defineWidget({
  name: "text",
  html: `<span class="${ROOT_CLASS13}"></span>`,
  allowedKeys: ["text", "as", "tone", "size", "weight"],
  bind: bind15,
  render: render15
});
var registerText = widget9.define;
var createText = widget9.create;

// display/index.js
function registerDisplay() {
  return [
    registerText(),
    registerBadge(),
    registerAvatar(),
    registerDivider(),
    registerProgress(),
    registerSpinner(),
    registerAlert(),
    registerList()
  ].map((defined) => defined.el.getAttribute("data-type"));
}

// index.js
function registerBaseTypes() {
  return [...registerForms(), ...registerDisplay()];
}
export {
  LIB_DEFAULT_CSS,
  LIB_LIGHT_THEME,
  LIB_STYLE_ID,
  LIB_TOKENS,
  createAlert,
  createAvatar,
  createBadge,
  createButton,
  createCheckbox,
  createDivider,
  createInput,
  createList,
  createProgress,
  createRadio,
  createRadioGroup,
  createSelect,
  createSlider,
  createSpinner,
  createText,
  createToggle,
  injectLibStyles,
  registerAlert,
  registerAvatar,
  registerBadge,
  registerBaseTypes,
  registerButton,
  registerCheckbox,
  registerDisplay,
  registerDivider,
  registerForms,
  registerInput,
  registerList,
  registerProgress,
  registerRadio,
  registerRadioGroup,
  registerSelect,
  registerSlider,
  registerSpinner,
  registerText,
  registerToggle
};
