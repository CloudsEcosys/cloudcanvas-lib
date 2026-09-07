/**
 * CloudCanvas - NeoTec, LLC, Richard Christopher
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 *
 * The component stylesheet, first of three: the shared foundation (the card
 * surface, the button, the chip, the meter, the inline editor) and the two
 * widgets that lean on it hardest, the sticky note and the task card.
 * `./styles-board-css.js` carries the other four board widgets,
 * `./styles-comms-css.js` the three communication widgets and the closing
 * environment queries; `./styles.js` joins the three.
 *
 * Held to the same discipline as the base kit's sheet (`lib/styles-*.css.js`)
 * and gated by `checkStyleDiscipline` in `tests/unit/style-gates.test.js`:
 *
 *   - every themable value is a `var(--cc-*, <dark default>)` read, no `:root`;
 *   - every class is `cloudcanvas-*`; variant state rides `data-*` attributes
 *     (`data-theme`, `data-priority`, `data-status`, `data-severity`) or an
 *     `is-*` state class, never a bare modifier;
 *   - no `!important`.
 *
 * Tokens read here that the core sheet does not define fall into two groups.
 * Theme-dependent ones (`--cc-priority-*`, `--cc-status-*`, `--cc-severity-*`)
 * have light-mode values in `COMPONENTS_LIGHT_THEME`. Theme-independent ones -
 * sticky paper and its ink, the pinhead, the readout type size - are stated
 * once as fallbacks: a yellow note is yellow on either board.
 *
 * Filled chips (priority, status, event badge) print their label in
 * `--cc-bg`, the base kit's own trick for a foreground that flips with the
 * surface: dark ink on the bright dark-theme fills, light ink on the deeper
 * light-theme fills. Both sides of every pair clear 4.5:1, measured in
 * `tests/unit/lib-components-styles.test.js`.
 */

/** Foundation, sticky-note and task-card rules. Concatenated by `./styles.js`. */
export const COMPONENTS_CARDS_CSS = `
/* ------------------ FOUNDATION ------------------ */

.cloudcanvas-component {
  box-sizing: border-box;
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
}

.cloudcanvas-component *,
.cloudcanvas-component *::before,
.cloudcanvas-component *::after {
  box-sizing: inherit;
}

/* A chromeless widget owns the whole Pin: the content node it is built into
   is stretched to the box the Pin was given, so the widget fills it. */
.cloudcanvas-component-host {
  height: 100%;
}

.cloudcanvas-component button:focus-visible,
.cloudcanvas-component input:focus-visible,
.cloudcanvas-component textarea:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: var(--cc-focus-ring-offset, 2px);
}

/* The one card surface every boxed widget shares; a widget adds its own class
   beside it for layout, never a second background. */
.cloudcanvas-component-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--cc-space-3, 12px);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4));
  color: var(--cc-text, #e2e8f0);
}

/* A real <button>, on the core action button's tokens - the pair the framework
   already keeps readable in both themes. */
.cloudcanvas-component-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--cc-space-1, 4px);
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  border: 1px solid var(--cc-btn-border, rgba(56, 189, 248, 0.35));
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-btn-bg, rgba(56, 189, 248, 0.12));
  color: var(--cc-btn-text, #7dd3fc);
  font-family: inherit;
  font-size: var(--cc-type-xs, 11px);
  font-weight: var(--cc-weight-medium, 500);
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.cloudcanvas-component-btn:hover {
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  border-color: var(--cc-accent, #38bdf8);
}

/* A filled chip: priority, telemetry status, event status. The fill is set by
   the widget's data attribute; the ink is the canvas background. The resting
   fill is the text colour - inverted, and readable by construction. */
.cloudcanvas-component-chip {
  display: inline-flex;
  align-items: center;
  flex: none;
  min-height: 18px;
  padding: 0 var(--cc-space-2, 8px);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-text, #e2e8f0);
  color: var(--cc-bg, #0f1117);
  font-size: var(--cc-type-xs, 11px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

/* A native <progress>: the engine pseudo-elements paint it, so the two colours
   are stated for WebKit's bar and value and for Gecko's single value element. */
.cloudcanvas-component-meter {
  appearance: none;
  -webkit-appearance: none;
  display: block;
  flex: none;
  overflow: hidden;
  width: 100%;
  height: 6px;
  margin: 0;
  border: 0;
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-meter-track, rgba(255, 255, 255, 0.12));
  color: var(--cc-accent, #38bdf8);
}

.cloudcanvas-component-meter::-webkit-progress-bar {
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-meter-track, rgba(255, 255, 255, 0.12));
}

.cloudcanvas-component-meter::-webkit-progress-value {
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-accent, #38bdf8);
  transition: width 0.25s ease;
}

.cloudcanvas-component-meter::-moz-progress-bar {
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-accent, #38bdf8);
}

/* The inline editor \`EditableTrait\` drops into a title. */
.cloudcanvas-editable-input {
  width: 100%;
  padding: 0 var(--cc-space-1, 4px);
  border: 1px solid var(--cc-accent, #38bdf8);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  color: inherit;
  font: inherit;
  line-height: inherit;
}

/* ------------------ STICKY NOTE ------------------ */

.cloudcanvas-sticky-note {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--cc-space-3, 12px);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-sticky-yellow, #fef08a);
  color: var(--cc-sticky-yellow-ink, #713f12);
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4));
  transform: rotate(var(--cc-sticky-tilt, 0deg));
  transition: box-shadow 0.2s ease;
  user-select: none;
}

.cloudcanvas-sticky-note:hover {
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55));
}

.cloudcanvas-sticky-note[data-theme="pink"] {
  background: var(--cc-sticky-pink, #fbcfe8);
  color: var(--cc-sticky-pink-ink, #831843);
}

.cloudcanvas-sticky-note[data-theme="cyan"] {
  background: var(--cc-sticky-cyan, #bae6fd);
  color: var(--cc-sticky-cyan-ink, #0c4a6e);
}

.cloudcanvas-sticky-note[data-theme="lime"] {
  background: var(--cc-sticky-lime, #d9f99d);
  color: var(--cc-sticky-lime-ink, #365314);
}

.cloudcanvas-sticky-note[data-theme="orange"] {
  background: var(--cc-sticky-orange, #fed7aa);
  color: var(--cc-sticky-orange-ink, #7c2d12);
}

.cloudcanvas-sticky-pinhead {
  position: absolute;
  top: -8px;
  left: 50%;
  width: 14px;
  height: 14px;
  transform: translateX(-50%);
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-sticky-pin, #e11d48);
  box-shadow: var(--cc-sticky-pin-shadow, 0 2px 4px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.5));
  pointer-events: none;
}

.cloudcanvas-sticky-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-2, 8px);
  margin-bottom: var(--cc-space-2, 8px);
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-semibold, 600);
  letter-spacing: 0.02em;
}

.cloudcanvas-sticky-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloudcanvas-sticky-tag {
  flex: none;
  font-size: var(--cc-type-xs, 11px);
}

.cloudcanvas-sticky-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  font-size: var(--cc-type-md, 13px);
  line-height: 1.45;
  word-break: break-word;
  white-space: pre-wrap;
}

.cloudcanvas-sticky-editor {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: var(--cc-space-1, 4px);
  border: 1px solid var(--cc-sticky-rule, rgba(0, 0, 0, 0.2));
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-sticky-editor-bg, rgba(255, 255, 255, 0.7));
  color: inherit;
  font: inherit;
  line-height: 1.45;
  resize: none;
}

.cloudcanvas-sticky-footer {
  display: flex;
  align-items: center;
  margin-top: var(--cc-space-2, 8px);
  padding-top: var(--cc-space-1, 4px);
  border-top: 1px dashed var(--cc-sticky-rule, rgba(0, 0, 0, 0.2));
}

.cloudcanvas-sticky-swatches {
  display: flex;
}

/* A swatch is a full-size hit target drawing a small dot: the control keeps
   its minimum, the note keeps its look. */
.cloudcanvas-sticky-swatch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--cc-control-min, 28px);
  height: var(--cc-control-min, 28px);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.cloudcanvas-sticky-swatch::before {
  content: "";
  width: 14px;
  height: 14px;
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-sticky-yellow, #fef08a);
  box-shadow: var(--cc-sticky-swatch-ring, 0 0 0 1px rgba(0, 0, 0, 0.2));
  transition: transform 0.1s ease;
}

.cloudcanvas-sticky-swatch[data-theme="pink"]::before {
  background: var(--cc-sticky-pink, #fbcfe8);
}

.cloudcanvas-sticky-swatch[data-theme="cyan"]::before {
  background: var(--cc-sticky-cyan, #bae6fd);
}

.cloudcanvas-sticky-swatch[data-theme="lime"]::before {
  background: var(--cc-sticky-lime, #d9f99d);
}

.cloudcanvas-sticky-swatch[data-theme="orange"]::before {
  background: var(--cc-sticky-orange, #fed7aa);
}

.cloudcanvas-sticky-swatch:hover::before {
  transform: scale(1.25);
}

.cloudcanvas-sticky-swatch[aria-pressed="true"]::before {
  box-shadow: var(--cc-sticky-swatch-ring-active, 0 0 0 2px currentColor);
}

/* ------------------ TASK / KANBAN CARD ------------------ */

/* A checklist longer than the card scrolls inside it rather than spilling
   past the rounded corners. */
.cloudcanvas-task-card {
  overflow: hidden;
}

.cloudcanvas-task-header,
.cloudcanvas-telemetry-header,
.cloudcanvas-flow-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-2, 8px);
  margin-bottom: var(--cc-space-2, 8px);
}

.cloudcanvas-task-title,
.cloudcanvas-telemetry-title,
.cloudcanvas-flow-title,
.cloudcanvas-media-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: var(--cc-type-md, 13px);
  font-weight: var(--cc-weight-semibold, 600);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloudcanvas-task-priority[data-priority="urgent"] {
  background: var(--cc-priority-urgent, #fb7185);
}

.cloudcanvas-task-priority[data-priority="high"] {
  background: var(--cc-priority-high, #fb923c);
}

.cloudcanvas-task-priority[data-priority="normal"] {
  background: var(--cc-priority-normal, #38bdf8);
}

.cloudcanvas-task-priority[data-priority="low"] {
  background: var(--cc-priority-low, #94a3b8);
}

.cloudcanvas-task-checklist {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--cc-space-1, 4px);
  min-height: 0;
  overflow-y: auto;
  margin: var(--cc-space-1, 4px) 0;
  padding: 0;
  list-style: none;
}

.cloudcanvas-check-item {
  display: flex;
  align-items: center;
  gap: var(--cc-space-2, 8px);
  min-height: var(--cc-control-min, 28px);
  padding: 0 var(--cc-space-1, 4px);
  border-radius: var(--cc-radius-sm, 6px);
  font-size: var(--cc-type-sm, 12px);
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.cloudcanvas-check-item:hover {
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
}

.cloudcanvas-check-box {
  flex: none;
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--cc-accent, #38bdf8);
  cursor: pointer;
}

.cloudcanvas-check-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

/* Done is the strike alone: muted ink over a hovered row measured 4.25:1 on
   the light card, and a finished item is still an item someone has to read. */
.cloudcanvas-check-item.is-done .cloudcanvas-check-label {
  text-decoration: line-through;
}

.cloudcanvas-task-progress,
.cloudcanvas-telemetry-bar {
  margin-top: var(--cc-space-2, 8px);
}
`;
