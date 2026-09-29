/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The kit's stylesheet, second half: the display widgets (text, badge, avatar,
 * divider, progress, spinner, alert, list) and the two environment queries that
 * close the sheet.
 *
 * Data, not code; the class and token contracts governing what may appear below
 * are stated in `../forms/styles-css.js`, which is the half that opens the
 * sheet. `../styles.js` concatenates the two and nothing else imports either.
 *
 * The environment queries live here rather than beside the rules they modify
 * because a media block has to come last to win: `@media (pointer: coarse)`
 * raises control targets to 44px and `@media (prefers-reduced-motion: reduce)`
 * stands the transitions down, both across widgets from both halves.
 */

/** Display-widget rules, plus the closing environment queries. */
export const LIB_DISPLAY_CSS = `

/* ------------------ SLOTTED CUSTOM TYPES ------------------ */

/*
 * A slotted custom type (\`.site/slotted-type.js\`) stacks its named regions -
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
