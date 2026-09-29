/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The kit's stylesheet, first half: the foundation rules and the form controls
 * (button, input, checkbox, radio, toggle, slider, select).
 *
 * Data, not code - the same reason `.plugin/graphics/styles-css.js` is its own file.
 * The sheet is split in two along the line the kit itself is drawn on, controls
 * against display widgets, because one file of six hundred CSS lines is a file
 * nobody reads. `../styles.js` is the door: it concatenates both halves into
 * `LIB_DEFAULT_CSS` and nothing else imports either half.
 *
 * THE CLASS CONTRACT, stated once for the whole kit. Every widget names its root
 * `cloudcanvas-lib-<widget>` and every child `cloudcanvas-lib-<widget>-<part>`.
 * Variants are flat modifier classes in the same shape
 * (`cloudcanvas-lib-button-primary`, `cloudcanvas-lib-badge-danger`) carried
 * *alongside* the root class; every modifier rule is stated after its base rule,
 * so equal specificity resolves in the modifier's favour. This mirrors the core's
 * `cloudcanvas-card-*` convention (`CLS` in
 * `.plugin/addons/types.js`) at one more level of namespacing,
 * because this layer is separate and optional: a page that never imports it must
 * be unable to collide with it.
 *
 * THE TOKEN CONTRACT. Every themable value is a `var()` read whose fallback is
 * the dark default, exactly as the core sheet does it - there is no `:root`
 * block, the dark theme *is* the fallback chain. Ten tokens are new to this kit
 * (`--cc-tone-*`, `--cc-input-*`, `--cc-track-bg`, `--cc-thumb-bg`, `--cc-border`),
 * catalogued with those defaults in `LIB_TOKENS`; every other token read here is
 * a core one, reused and never redefined. `LIB_LIGHT_THEME`
 * (`../styles.js`) is the reference override set, and
 * `tests/unit/lib-list-and-styles.test.js` asserts that each of its keys is
 * actually read by the sheet.
 *
 * NATIVE CONTROLS FIRST. These are real `<button>`, `<input>`, `<select>` and
 * `<progress>` elements, so keyboard operation, form semantics and the
 * accessibility tree come from the platform. What the sheet must not lose in
 * exchange is the focus ring - which is why the one `:focus-visible` rule below
 * matches on the class *attribute* rather than on a list of class names: a
 * widget cannot be added to this kit without inheriting it.
 */

/** Foundation and form-control rules. Concatenated by `../styles.js`. */
export const LIB_CONTROLS_CSS = `
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
