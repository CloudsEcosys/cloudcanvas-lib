/*!
 * CloudCanvas lib v0.7.1 - CloudCanvas plugins: every add-on, the UI kit and the widgets, one entry each
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * MIT License. https://github.com/CloudsEcosys/cloudcanvas-lib#readme
 */
var a=`
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
`;var o=`

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
`;var r=`${a}${o}`,t="cloudcanvas-lib-styles",d=Object.freeze({"--cc-tone-info":"#38bdf8","--cc-tone-success":"#22c55e","--cc-tone-warning":"#eab308","--cc-tone-danger":"#f87171","--cc-input-bg":"rgba(255, 255, 255, 0.06)","--cc-input-border":"rgba(255, 255, 255, 0.16)","--cc-input-border-focus":"var(--cc-accent, #38bdf8)","--cc-track-bg":"rgba(255, 255, 255, 0.16)","--cc-thumb-bg":"#e2e8f0","--cc-border":"#334155"}),b=Object.freeze({"--cc-tone-info":"#0284c7","--cc-tone-success":"#16a34a","--cc-tone-warning":"#ca8a04","--cc-tone-danger":"#dc2626","--cc-input-bg":"rgba(15, 23, 42, 0.04)","--cc-input-border":"rgba(15, 23, 42, 0.16)","--cc-input-border-focus":"var(--cc-accent)","--cc-track-bg":"rgba(15, 23, 42, 0.16)","--cc-thumb-bg":"#ffffff"});function p(c=""){if(typeof document>"u")return null;let e=document.getElementById(t);return e||(e=document.createElement("style"),e.id=t,e.textContent=typeof c=="string"&&c.trim()!==""?`${r}
${c}`:r,document.head.appendChild(e),e)}export{r as a,t as b,d as c,b as d,p as e};
