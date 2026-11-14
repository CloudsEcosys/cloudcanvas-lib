/*!
 * CloudCanvas lib v0.7.0 - CloudCanvas plugins: every add-on, the UI kit and the widgets, one entry each
 * Written by Richard Christopher, Copyright 2026 NeoTec, LLC
 * MIT License. https://github.com/CloudsEcosys/cloudcanvas-lib#readme
 */
import{injectStyle as S}from"cloudcanvas/kernel";var t=`/* ------------------ BOARD ------------------ */

[data-blit-root] {
  background-color: var(--cc-bg, #0f1117);
  background-image: radial-gradient(
    circle at var(--cc-grid-dot-size, 1px) var(--cc-grid-dot-size, 1px),
    var(--cc-grid-dot, rgba(255, 255, 255, 0.12)) var(--cc-grid-dot-size, 1px),
    transparent 0
  );
  background-size: var(--cc-grid-size, 24px) var(--cc-grid-size, 24px);
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: var(--cc-type-md, 13px);
  user-select: none;
  -webkit-user-select: none;
}

[data-blit-root] [data-blit] {
  transition: box-shadow 0.15s ease, border-color 0.15s ease, opacity 0.2s ease;
}

/* The root is one tab stop and its blits are roving targets (the keyboard
   add-on); both show the same ring, and only for keyboard focus. */
[data-blit-root]:focus-visible,
[data-blit-root] [data-blit]:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: var(--cc-focus-ring-offset, 2px);
}

/* A compositor hint is a promise to keep a layer alive: made only while a blit
   actually moves, so a board of still blits costs no layers. */
[data-blit].cc-moving {
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  [data-blit-root] [data-blit] {
    transition: none;
  }
}

`;var o=`/* ------------------ UTILITY ------------------ */

/* Announcement target for assistive technology: in the accessibility tree,
   out of the visual one. */
.cloudcanvas-live-region {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

`;var x=`/* ------------------ DISPLAY WIDGETS ------------------ */

:is([data-type="card"], [data-type="media"], [data-type="vector-pointer"])[data-blit]:not([data-chrome="false"]),
[data-blit][data-chrome="true"] {
  box-sizing: border-box;
  padding: var(--cc-space-3, 12px) var(--cc-space-4, 16px);
  background: var(--cc-card-bg, rgba(30, 41, 59, 0.85));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
  -webkit-backdrop-filter: blur(var(--cc-card-blur, 12px));
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.1));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-1, 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06));
  max-width: var(--cc-card-max-width, 340px);
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
}

[data-blit][style*="width"]:not([data-chrome="false"]) {
  max-width: none;
}

:is([data-type="card"], [data-type="media"], [data-type="vector-pointer"])[data-blit]:not([data-chrome="false"]):hover,
[data-blit][data-chrome="true"]:hover {
  border-color: var(--cc-card-border-hover, rgba(255, 255, 255, 0.18));
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
}

/* After the hover lift, each at its specificity, so the toggle outranks it under the pointer too.
   Transparent rather than removed: the box keeps its border width and moves by nothing. */
:is([data-type="card"], [data-type="media"], [data-type="vector-pointer"])[data-blit][data-bordered="false"],
:is([data-type="card"], [data-type="media"], [data-type="vector-pointer"])[data-blit][data-bordered="false"]:hover,
[data-blit][data-bordered="false"],
[data-blit][data-bordered="false"]:hover {
  border-color: transparent;
}

/* A widget toggles its empty sections with the hidden attribute; a host rule giving one a display must not show it. */
[data-type] [hidden] {
  display: none;
}

/* Selectable text takes the caret; the header stays the drag handle. */
[data-blit][data-selectable-text="true"] {
  user-select: text;
  -webkit-user-select: text;
  cursor: auto;
}

[data-blit][data-selectable-text="true"] [data-drag-handle] {
  user-select: none;
  -webkit-user-select: none;
  cursor: grab;
}

`,m=`.cloudcanvas-primitive-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--cc-space-1, 4px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  border-radius: var(--cc-radius-pill, 9999px);
  background: var(--cc-badge-bg, rgba(56, 189, 248, 0.15));
  color: var(--cc-badge-text, #38bdf8);
  border: 1px solid var(--cc-badge-border, rgba(56, 189, 248, 0.3));
  font-size: var(--cc-type-sm, 12px);
  font-weight: var(--cc-weight-semibold, 600);
  line-height: 1;
  white-space: nowrap;
}

`,f=`.cloudcanvas-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-3, 12px);
  margin-bottom: var(--cc-space-2, 8px);
}

.cloudcanvas-card-title {
  font-size: var(--cc-type-lg, 15px);
  font-weight: var(--cc-weight-semibold, 600);
  color: var(--cc-text, #e2e8f0);
  line-height: 1.25;
}

.cloudcanvas-card-badge-slot {
  display: inline-flex;
  align-items: center;
  flex: none;
}

.cloudcanvas-card-body {
  font-size: var(--cc-type-md, 13px);
  color: var(--cc-text-muted, #94a3b8);
  line-height: 1.45;
}

.cloudcanvas-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--cc-space-2, 8px);
  margin-top: var(--cc-space-3, 12px);
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-text-muted, #94a3b8);
}

/* A single-line ellipsised run states its line-height, or the footer's height moves with the host page's. */
.cloudcanvas-card-author {
  font-size: var(--cc-type-xs, 11px);
  line-height: 1.45;
  color: var(--cc-text-muted, #94a3b8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cloudcanvas-card-action-btn {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-2, 8px);
  background: var(--cc-btn-bg, rgba(56, 189, 248, 0.12));
  border: 1px solid var(--cc-btn-border, rgba(56, 189, 248, 0.35));
  border-radius: var(--cc-radius-sm, 6px);
  color: var(--cc-btn-text, #7dd3fc);
  font-family: inherit;
  font-size: var(--cc-type-xs, 11px);
  font-weight: var(--cc-weight-medium, 500);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.cloudcanvas-card-action-btn:hover {
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  border-color: var(--cc-accent, #38bdf8);
}

/* A coarse pointer gets the full 44px target without changing the desktop look. */
@media (pointer: coarse) {
  .cloudcanvas-card-action-btn {
    min-height: var(--cc-control-min-coarse, 44px);
  }
}

.cloudcanvas-card-html {
  min-width: 0;
}

`,w=`.cloudcanvas-card-media {
  display: block;
  width: 100%;
  max-height: var(--cc-media-max-height, 120px);
  object-fit: cover;
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
}

.cloudcanvas-card-caption {
  margin: var(--cc-space-2, 8px) 0 0;
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-text-muted, #94a3b8);
  line-height: 1.35;
}

.cloudcanvas-card-gauge-row {
  display: flex;
  align-items: center;
  gap: var(--cc-space-3, 12px);
  padding: var(--cc-space-1, 4px) 0;
}

.cloudcanvas-card-needle-slot {
  display: flex;
  align-items: center;
  flex: none;
}

.cloudcanvas-card-gauge {
  flex: 1;
  min-width: 0;
}

.cloudcanvas-card-label {
  margin-bottom: var(--cc-space-1, 4px);
  font-size: var(--cc-type-xs, 11px);
  color: var(--cc-text-muted, #94a3b8);
}

.cloudcanvas-card-meter-slot {
  display: block;
}

`,y=`.cloudcanvas-card-scope {
  width: 100%;
  min-height: 0;
  margin: 0;
}

[data-scope].cloudcanvas-card-scope:empty {
  display: none;
}

.cloudcanvas-card-scope.cc-populated {
  box-sizing: border-box;
  margin-top: var(--cc-space-2, 8px);
  min-height: var(--cc-scope-min-height, 40px);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-scope-bg, rgba(0, 0, 0, 0.2));
  outline: 1px dashed var(--cc-scope-border, rgba(255, 255, 255, 0.15));
  outline-offset: -1px;
  overflow: var(--cc-scope-overflow, hidden);
}

@media (prefers-reduced-motion: reduce) {
  .cloudcanvas-card-action-btn {
    transition: none;
  }

  /* The SVG generators write their own inline transitions. */
  .cloudcanvas-card-needle-slot svg,
  .cloudcanvas-card-meter-slot * {
    transition: none !important;
  }
}

`,n=[x,m,f,w,y].join("");var s=`/* ------------------ DRAG ------------------ */

:where([data-blit][data-drag]) {
  cursor: grab;
}

:where([data-blit][data-drag]:active, [data-blit].is-dragging) {
  cursor: grabbing;
}

/* A dragged blit clears its neighbours; a scope's children stay inside its well. */
[data-blit].is-dragging {
  z-index: var(--cc-z-drag, 1100);
}

.cloudcanvas-grab-handle {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  width: var(--cc-grab-handle-size, 12px);
  height: var(--cc-grab-handle-size, 12px);
  transform: translate(-50%, -50%);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-grab-handle-bg, radial-gradient(var(--cc-grab-handle-dot, rgba(255, 255, 255, 0.7)) 0.75px, transparent 1px) 0 0 / 4px 4px, var(--cc-grab-handle-fill, rgba(30, 41, 59, 0.92)));
  box-shadow: var(--cc-grab-handle-ring, 0 0 0 1px rgba(8, 10, 16, 0.65));
  cursor: grab;
  z-index: var(--cc-z-grab, 1101);
  touch-action: none;
}

:where([data-blit][data-chrome="false"].is-selected) > .cloudcanvas-grab-handle,
:where([data-blit].is-selected) > .cloudcanvas-grab-handle:where([data-cc-grab="always"]) {
  display: block;
}

.cloudcanvas-grab-handle:active {
  cursor: grabbing;
}

/* A coarse pointer gets a target it can actually hit. */
@media (pointer: coarse) {
  .cloudcanvas-grab-handle {
    width: var(--cc-grab-handle-size-coarse, 20px);
    height: var(--cc-grab-handle-size-coarse, 20px);
  }
}

`;var i=`/* ------------------ FOCUS ------------------ */

[data-blit].is-focused {
  box-shadow: var(
    --cc-shadow-focus,
    0 0 0 2px var(--cc-focus, #833446),
    0 10px 30px var(--cc-focus-glow, rgba(131, 52, 70, 0.35))
  ) !important;
}

`;var d=`
[data-blit].is-layout-row, [data-scope].is-layout-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: var(--cc-layout-gap, var(--cc-space-2, 8px));
}
[data-blit].is-layout-column, [data-scope].is-layout-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--cc-layout-gap, var(--cc-space-2, 8px));
}
[data-blit].is-layout-grid, [data-scope].is-layout-grid {
  display: grid;
  grid-auto-flow: row;
  align-items: start;
  justify-items: start;
  grid-template-columns: var(--cc-grid-columns, repeat(auto-fill, minmax(120px, 1fr)));
  gap: var(--cc-layout-gap, var(--cc-space-2, 8px));
}
[data-blit-root] [data-blit].is-flow-child {
  position: relative;
  top: auto;
  left: auto;
}
`;var l=`/* ------------------ CONTEXT MENU ------------------ */

/* The root's own right-click menu (the menu add-on). It lives in the root's
   overlay - the one layer that draws in screen space - which is why it is
   positioned from the click's host-relative coordinates and needs its pointer
   events back: the overlay itself is inert.
   Every value chains through a part token to a foundation one, so a theme that
   restyles cards restyles the menu with them and nothing new has to be named. */
.cloudcanvas-context-menu {
  position: absolute;
  min-width: var(--cc-menu-min-width, 168px);
  padding: var(--cc-space-1, 4px);
  background: var(--cc-menu-bg, var(--cc-card-bg, rgba(30, 41, 59, 0.85)));
  border: 1px solid var(--cc-menu-border, var(--cc-card-border, rgba(255, 255, 255, 0.1)));
  border-radius: var(--cc-radius-md, 10px);
  box-shadow: var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.09));
  backdrop-filter: blur(var(--cc-card-blur, 12px));
  -webkit-backdrop-filter: blur(var(--cc-card-blur, 12px));
  font-size: var(--cc-type-md, 13px);
  color: var(--cc-text, #e2e8f0);
  pointer-events: auto;
  user-select: none;
  z-index: var(--cc-z-menu, 1200);
}

/* Closed is the resting state, and the attribute has to outrank the display
   above - which it does on specificity alone, so no \`!important\` is needed. */
.cloudcanvas-context-menu[hidden] {
  display: none;
}

/* Groups are the only structure: consecutive ones are told apart by a rule
   rather than a separator element nobody can label. */
.cloudcanvas-context-menu-group + .cloudcanvas-context-menu-group {
  margin-top: var(--cc-space-1, 4px);
  padding-top: var(--cc-space-1, 4px);
  border-top: 1px solid var(--cc-menu-border, var(--cc-card-border, rgba(255, 255, 255, 0.1)));
}

.cloudcanvas-context-menu-item {
  display: block;
  width: 100%;
  min-height: var(--cc-control-min, 28px);
  padding: var(--cc-space-1, 4px) var(--cc-space-3, 12px);
  background: var(--cc-menu-item-bg, transparent);
  border: 0;
  border-radius: var(--cc-radius-sm, 6px);
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
}

.cloudcanvas-context-menu-item:hover,
.cloudcanvas-context-menu-item:focus-visible {
  background: var(--cc-menu-item-bg-hover, var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22)));
}

@media (pointer: coarse) {
  .cloudcanvas-context-menu-item {
    min-height: var(--cc-control-min-coarse, 44px);
  }
}

`;var p=`/* ------------------ PAN ------------------ */

[data-blit-root][data-pan] {
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

`;var b=`/* ------------------ PANEL ------------------ */

[data-blit-root][data-cc-panels] {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  background: none;
  z-index: var(--cc-panel-z, 10);
}

[data-cc-panels] [data-blit].cloudcanvas-panel {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  pointer-events: auto;
  color: var(--cc-text, #e2e8f0);
  background: var(--cc-panel-bg, #151a24);
  border: 1px solid var(--cc-panel-border, var(--cc-card-border, rgba(255, 255, 255, 0.1)));
  border-radius: var(--cc-panel-radius, var(--cc-radius-md, 10px));
  box-shadow: var(--cc-panel-shadow, var(--cc-shadow-2, 0 12px 32px rgba(0, 0, 0, 0.55)));
  transition: transform var(--cc-panel-motion, 180ms) ease, width var(--cc-panel-motion, 180ms) ease, height var(--cc-panel-motion, 180ms) ease;
}

/* While a modal is shown the layer takes every press outside it; the other panels take none. */
[data-blit-root][data-cc-panels].cc-modal {
  pointer-events: auto;
}

[data-cc-panels].cc-modal [data-blit].cloudcanvas-panel:not(.cc-at-modal) {
  pointer-events: none;
}

/* Hidden outranks the frame's display: an inactive tab, a closed or a new panel. */
[data-cc-panels] [data-blit].cloudcanvas-panel[hidden] {
  display: none;
}

[data-cc-panels] .cloudcanvas-panel:is(.cc-at-left, .cc-at-right, .cc-at-top, .cc-at-bottom, .cc-at-full) {
  border-radius: 0;
}

[data-cc-panels] .cloudcanvas-panel:is(.cc-at-left, .cc-at-right, .cc-at-top, .cc-at-bottom):not(.cc-drawer) {
  box-shadow: none;
}

[data-cc-panels] .cloudcanvas-panel:is(.cc-at-float, .cc-drawer) {
  z-index: var(--cc-panel-z-over, 1);
}

[data-cc-panels] .cloudcanvas-panel.cc-at-full {
  border-width: 0;
  box-shadow: none;
  z-index: var(--cc-panel-z-full, 2);
}

[data-cc-panels] .cloudcanvas-panel.cc-at-modal {
  box-shadow: var(--cc-panel-modal-shadow, 0 0 0 100vmax rgba(0, 0, 0, 0.45), 0 24px 64px rgba(0, 0, 0, 0.6));
  z-index: var(--cc-panel-z-modal, 3);
}

[data-cc-panels] [data-blit].cloudcanvas-panel:is(.is-dragging, .is-resizing) {
  transition: none;
  z-index: var(--cc-panel-z-moving, 4);
}

@media (prefers-reduced-motion: reduce) {
  [data-cc-panels] [data-blit].cloudcanvas-panel {
    transition: none;
  }
}

.cloudcanvas-panel-bar {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--cc-space-1, 4px);
  box-sizing: border-box;
  height: var(--cc-panel-bar-size, 28px);
  padding: 0 var(--cc-space-1, 4px) 0 var(--cc-space-2, 8px);
  background: var(--cc-panel-bar-bg, rgba(255, 255, 255, 0.04));
  border-bottom: 1px solid var(--cc-panel-border, var(--cc-card-border, rgba(255, 255, 255, 0.1)));
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
  font-size: var(--cc-type-sm, 12px);
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-user-drag: none;
}

.cloudcanvas-panel-bar:focus-visible {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-focus-ring, var(--cc-accent, #38bdf8));
  outline-offset: calc(-1 * var(--cc-focus-ring-width, 2px));
}

.cloudcanvas-panel.is-dragging > .cloudcanvas-panel-bar {
  cursor: grabbing;
}

.cloudcanvas-panel-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: var(--cc-weight-semibold, 600);
}

/* More tabs than fit scroll sideways (the add-on keeps the selected one in view); none shrinks below its text. */
.cloudcanvas-panel-tabs {
  display: flex;
  flex: 1;
  align-self: stretch;
  min-width: 0;
  gap: var(--cc-space-1, 4px);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}

.cloudcanvas-panel-controls {
  display: flex;
  flex: none;
  gap: var(--cc-space-1, 4px);
}

.cloudcanvas-panel-title[hidden],
.cloudcanvas-panel-tabs[hidden],
.cloudcanvas-panel-control[hidden] {
  display: none;
}

.cloudcanvas-panel-tab,
.cloudcanvas-panel-control {
  margin: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.cloudcanvas-panel-tab {
  flex: none;
  box-sizing: border-box;
  max-width: var(--cc-panel-tab-max, 16ch);
  line-height: calc(var(--cc-panel-bar-size, 28px) - 2px);
  padding: 0 var(--cc-space-2, 8px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--cc-text-muted, #94a3b8);
  border-bottom: 2px solid transparent;
}

.cloudcanvas-panel-tab[aria-selected="true"] {
  color: var(--cc-text, #e2e8f0);
  border-bottom-color: var(--cc-accent, #38bdf8);
}

.cloudcanvas-panel-control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(var(--cc-panel-bar-size, 28px) - 6px);
  height: calc(var(--cc-panel-bar-size, 28px) - 6px);
  padding: 0;
  border-radius: var(--cc-radius-sm, 6px);
}

.cloudcanvas-panel-control:hover,
.cloudcanvas-panel-control:focus-visible,
.cloudcanvas-panel-tab:hover,
.cloudcanvas-panel-tab:focus-visible {
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
}

/* Pressed is a ring and a fill as well as a colour. */
.cloudcanvas-panel-control[aria-pressed="true"] {
  color: var(--cc-accent, #38bdf8);
  background: var(--cc-btn-bg-hover, rgba(56, 189, 248, 0.22));
  box-shadow: var(--cc-panel-pressed, inset 0 0 0 1px currentColor);
}

/* The place menu wears the menu add-on's look, hung under the bar's right end. */
.cloudcanvas-panel-bar > .cloudcanvas-context-menu[role="menu"] {
  top: 100%;
  right: 0;
  cursor: default;
}

.cloudcanvas-panel-bar .cloudcanvas-context-menu-item[aria-checked="true"] {
  color: var(--cc-accent, #38bdf8);
}

.cloudcanvas-panel-body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
  border-bottom-left-radius: inherit;
  border-bottom-right-radius: inherit;
  user-select: text;
  -webkit-user-select: text;
}

.cloudcanvas-panel.is-collapsed > .cloudcanvas-panel-body {
  display: none;
}

/* A collapsed edge is its tab: the bar alone, its title turned along a side edge. */
.cloudcanvas-panel.is-collapsed:is(.cc-at-left, .cc-at-right, .cc-at-top, .cc-at-bottom) > .cloudcanvas-panel-bar {
  height: 100%;
  border-bottom: 0;
  cursor: pointer;
}

.cloudcanvas-panel.is-collapsed:is(.cc-at-left, .cc-at-right) > .cloudcanvas-panel-bar {
  padding: var(--cc-space-2, 8px) 0;
  writing-mode: vertical-rl;
}

.cloudcanvas-panel.is-collapsed:is(.cc-at-left, .cc-at-right, .cc-at-top, .cc-at-bottom) .cloudcanvas-panel-controls {
  display: none;
}

/* In a window of its own, the frame is the whole window. */
body[data-cc-panels] {
  margin: 0;
  background: var(--cc-panel-bg, #151a24);
  color: var(--cc-text, #e2e8f0);
  font-family: var(--cc-font, system-ui, sans-serif);
  font-size: var(--cc-type-md, 13px);
}

body[data-cc-panels] > [data-blit].cloudcanvas-panel {
  position: fixed;
  inset: 0;
  border-width: 0;
  border-radius: 0;
  box-shadow: none;
}

/* The resize add-on's handles as grips along the frame's sides. */
[data-cc-panels] .cloudcanvas-panel > .cloudcanvas-resize-handle[data-cc-resize-handle] {
  width: var(--cc-panel-grip, 6px);
  height: var(--cc-panel-grip, 6px);
  background: transparent;
  box-shadow: none;
  border-radius: 0;
  transform: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-user-drag: none;
}

[data-cc-panels] .cloudcanvas-panel > .cloudcanvas-resize-handle:is([data-cc-resize-handle="n"], [data-cc-resize-handle="s"]) {
  right: 0;
  left: 0;
  width: auto;
}

[data-cc-panels] .cloudcanvas-panel > .cloudcanvas-resize-handle:is([data-cc-resize-handle="e"], [data-cc-resize-handle="w"]) {
  top: 0;
  bottom: 0;
  height: auto;
}

[data-cc-panels] .cloudcanvas-panel > .cloudcanvas-resize-handle:is([data-cc-resize-handle="ne"], [data-cc-resize-handle="nw"], [data-cc-resize-handle="se"], [data-cc-resize-handle="sw"]) {
  width: calc(var(--cc-panel-grip, 6px) * 2);
  height: calc(var(--cc-panel-grip, 6px) * 2);
}

.cloudcanvas-panel-preview {
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
  background: var(--cc-panel-preview, rgba(56, 189, 248, 0.16));
  border: 2px solid var(--cc-accent, #38bdf8);
  pointer-events: none;
}

.cloudcanvas-panel-preview[hidden] {
  display: none;
}

`;var v=`/*
 * Resize handles, appended by the resize trait: direct children of the blit, so
 * a content render never takes them away. Each carries \`data-cc-control\`, which
 * is what makes the pan add-on decline the deferred capture and the drag add-on
 * stand down on it (\`CONTROL_SELECTOR\`, \`../trait.js\`).
 *
 * Visibility is the \`hidden\` property, written by the trait - so no \`display\` is
 * declared here, and the user-agent \`[hidden]\` rule keeps working on a page that
 * never loaded this stylesheet. The reset below only defends it from a host
 * sheet that gives every div a display value.
 */
.cloudcanvas-resize-handle {
  position: absolute;
  box-sizing: border-box;
  width: var(--cc-resize-handle-size, 10px);
  height: var(--cc-resize-handle-size, 10px);
  border-radius: var(--cc-radius-sm, 6px);
  background: var(--cc-resize-handle-bg, var(--cc-accent, #38bdf8));
  box-shadow: var(--cc-resize-handle-ring, 0 0 0 1px rgba(8, 10, 16, 0.65));
  z-index: var(--cc-z-drag, 1100);
  touch-action: none;
}

.cloudcanvas-resize-handle[hidden] {
  display: none !important;
}

/* A coarse pointer gets a target it can actually hit. */
@media (pointer: coarse) {
  .cloudcanvas-resize-handle {
    width: var(--cc-resize-handle-size-coarse, 20px);
    height: var(--cc-resize-handle-size-coarse, 20px);
  }
}

/*
 * One rule per direction: where the handle sits on the box, and what the pointer
 * says it will do. The \`translate\` is what centres it *on* the edge rather than
 * inside it, so the affordance straddles the boundary it moves.
 */
.cloudcanvas-resize-handle[data-cc-resize-handle="nw"] {
  top: 0;
  left: 0;
  transform: translate(-50%, -50%);
  cursor: nwse-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="n"] {
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  cursor: ns-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="ne"] {
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  cursor: nesw-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="w"] {
  top: 50%;
  left: 0;
  transform: translate(-50%, -50%);
  cursor: ew-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="e"] {
  top: 50%;
  right: 0;
  transform: translate(50%, -50%);
  cursor: ew-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="sw"] {
  bottom: 0;
  left: 0;
  transform: translate(-50%, 50%);
  cursor: nesw-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="s"] {
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 50%);
  cursor: ns-resize;
}

.cloudcanvas-resize-handle[data-cc-resize-handle="se"] {
  bottom: 0;
  right: 0;
  transform: translate(50%, 50%);
  cursor: nwse-resize;
}

/* A resize is a drag of the box: it clears its neighbours the same way, and the
   grab cursor must not fight the direction cursor under the pointer. */
[data-blit].is-resizing {
  z-index: var(--cc-z-drag, 1100);
  cursor: default;
}

`;var u=`/* ------------------ SELECTION ------------------ */

[data-blit].is-selected {
  outline: var(--cc-focus-ring-width, 2px) solid var(--cc-accent, #38bdf8);
  outline-offset: var(--cc-focus-ring-offset, 2px);
}

`;var h=`/* ------------------ SVG STATE & 3D INTERPOLATION ------------------ */

.cloudcanvas-svg-state-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  pointer-events: none;
  transform-style: preserve-3d;
}

.cloudcanvas-svg-state-host {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
  pointer-events: none;
  transform-style: preserve-3d;
  transform-origin: center center;
}

.cloudcanvas-svg-state-path {
  vector-effect: non-scaling-stroke;
  transform-box: fill-box;
  transform-origin: center center;
}

/* The interpolation writes its own inline transitions. */
@media (prefers-reduced-motion: reduce) {
  .cloudcanvas-svg-state-path,
  .cloudcanvas-svg-state-host {
    transition: none !important;
  }
}

`;var g=`/* ------------------ TOASTS ------------------ */

.cloudcanvas-toasts {
  position: absolute;
  right: 24px;
  bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 360px;
  z-index: var(--cc-z-overlay, 60);
  pointer-events: none;
}

.cloudcanvas-toast {
  padding: var(--cc-space-3, 12px) var(--cc-space-4, 16px);
  border: 1px solid var(--cc-card-border, rgba(255, 255, 255, 0.12));
  border-left: 4px solid var(--cc-accent, #3b82f6);
  border-radius: var(--cc-radius-md, 8px);
  background: var(--cc-menu-bg, rgba(15, 23, 42, 0.92));
  color: var(--cc-text, #f8fafc);
  font-family: var(--cc-font, system-ui, sans-serif);
  font-size: var(--cc-type-sm, 13px);
  line-height: 1.4;
  box-shadow: var(--cc-shadow-2, 0 10px 25px -5px rgba(0, 0, 0, 0.5));
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: auto;
}

.cloudcanvas-toast.is-shown { opacity: 1; transform: translateY(0); }
.cloudcanvas-toast-success { border-left-color: #22c55e; }
.cloudcanvas-toast-warning { border-left-color: #eab308; }

`;var z=Object.freeze([t,p,n,d,u,i,s,v,h,l,b,g,o]),r=z.join("");import{LIGHT_THEME as ia,TOKEN_PREFIX as da,applyTheme as la}from"cloudcanvas/theme";import{formatTransform3D as ba}from"cloudcanvas/kernel";var c="cloudcanvas-styles",k="data-cc-session";function ra(e=""){if(typeof document>"u")return null;let a=document.getElementById(c);return a||(a=document.createElement("style"),a.id=c,a.textContent=r,document.head.appendChild(a)),e&&A(e),a}function C(e,a){return typeof document>"u"?null:document.getElementById(c)??S(`blit-css-${e}`,a)}function ca(){return C("board",t)}function A(e){if(typeof document>"u"||typeof e!="string"||e.trim()==="")return null;let a=document.createElement("style");return a.setAttribute(k,""),a.textContent=e,document.head.appendChild(a),a}export{o as a,n as b,s as c,i as d,d as e,l as f,p as g,b as h,v as i,u as j,h as k,g as l,r as m,c as n,k as o,ra as p,C as q,ca as r,A as s,ia as t,da as u,la as v,ba as w};
